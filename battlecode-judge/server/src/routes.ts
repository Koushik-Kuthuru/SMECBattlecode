import { Router } from "express";
import { Queue } from "bullmq";
import { validationResult } from "express-validator";
import { submitValidator } from "./validators.js";
import { listProblems, loadProblem, saveProblem } from "./problemStore.js";
import { Problem } from "./types.js";

const connection = { connection: { url: process.env.REDIS_URL! } } as const;
export const judgeQueue = new Queue("judge", connection);

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

// List problems (for admin or public)
router.get("/problems", (_req, res) => {
  res.json(listProblems());
});

// Get single problem
router.get("/problems/:id", (req, res) => {
  try { res.json(loadProblem(req.params.id)); }
  catch { res.status(404).json({ error: "Problem not found" }); }
});

// Create/Update problem (admin)
router.post("/problems", (req, res) => {
  const problem = req.body as Problem;
  try { saveProblem(problem); res.json({ ok: true }); }
  catch (e:any) { res.status(400).json({ error: e.message }); }
});

// Submit solution → enqueue job
router.post("/submit", submitValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { problemId, language, code } = req.body;
  // basic existence check
  try { loadProblem(problemId); } catch { return res.status(400).json({ error: "Invalid problemId" }); }

  const job = await judgeQueue.add("run", { problemId, language, code }, { removeOnComplete: true, removeOnFail: true });
  res.json({ jobId: job.id });
});

// Poll for result (the worker will store result on the job return value)
router.get("/result/:id", async (req, res) => {
  const job = await judgeQueue.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });
  const state = await job.getState();
  const returnvalue = job.returnvalue ?? null;
  res.json({ state, result: returnvalue });
});

export default router;
