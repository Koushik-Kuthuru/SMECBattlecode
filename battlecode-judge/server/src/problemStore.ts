import fs from "fs";
import path from "path";
import { Problem } from "./types.js";

const PROBLEM_DIR = process.env.PROBLEM_DIR || path.join(process.cwd(), "problems");

export function loadProblem(id: string): Problem {
  const p = path.join(PROBLEM_DIR, `${id}.json`);
  if (!fs.existsSync(p)) throw new Error("Problem not found");
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function saveProblem(problem: Problem) {
  const p = path.join(PROBLEM_DIR, `${problem.id}.json`);
  fs.writeFileSync(p, JSON.stringify(problem, null, 2), "utf-8");
}

export function listProblems(): Problem[] {
  if (!fs.existsSync(PROBLEM_DIR)) return [];
  return fs.readdirSync(PROBLEM_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(PROBLEM_DIR, f), 'utf-8')));
}
