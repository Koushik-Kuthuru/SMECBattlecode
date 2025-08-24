import { Worker } from "bullmq";
import { judgeSubmission } from "./judge.js";
import fs from "fs";

const connection = { connection: { url: process.env.REDIS_URL! } } as const;

new Worker("judge", async job => {
  const { problemId, language, code } = job.data as { problemId: string; language: string; code: string };
  const problemPath = `/app/problems/${problemId}.json`;
  if (!fs.existsSync(problemPath)) return { status: "IE", runtimeLog: "Problem not found" };
  const problem = JSON.parse(fs.readFileSync(problemPath, 'utf-8'));

  const res = await judgeSubmission({
    language,
    code,
    tests: problem.tests,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
  });

  return res; // becomes job.returnvalue
}, connection);

console.log("Worker up and judging…");
