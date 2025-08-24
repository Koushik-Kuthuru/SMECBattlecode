import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";
import { LANGUAGES } from "../../shared/languages.js";

export type TestCase = { input: string; output: string };

const DOCKER = "docker";

function runCmd(cmd: string, args: string[], timeoutMs = 30000): Promise<{ code: number | null; stdout: string; stderr: string }>{
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let to: NodeJS.Timeout | undefined = setTimeout(() => {
      child.kill('SIGKILL');
    }, timeoutMs);
    let stdout = ""; let stderr = "";
    child.stdout.on("data", d => (stdout += d.toString()));
    child.stderr.on("data", d => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", code => {
      if (to) clearTimeout(to);
      resolve({ code, stdout, stderr });
    });
  });
}

export async function judgeSubmission(opts: {
  language: string;
  code: string;
  tests: TestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
}){
  const lang = LANGUAGES[opts.language];
  if (!lang) return { status: "IE", runtimeLog: "Language not supported" } as const;

  const tmpRoot = `/tmp/judge/${uuidv4()}`;
  fs.mkdirSync(tmpRoot, { recursive: true });
  const sourcePath = path.join(tmpRoot, lang.sourceName);
  fs.writeFileSync(sourcePath, opts.code, "utf-8");

  const dockerArgsBase = [
    "run", "--rm",
    "--network", "none",
    "--cpus", "1",
    "-m", `${opts.memoryLimitMb}m`,
    "--pids-limit", "128",
    "--read-only",
    "-v", `${tmpRoot}:/work",
    lang.image
  ];

  // compile if needed
  if (lang.compile){
    const { code, stderr } = await runCmd(DOCKER, [...dockerArgsBase, "sh", "-c", lang.compile], 20000);
    if (code !== 0){
      return { status: "CE", compileLog: stderr.substring(0, 8000) };
    }
  }

  const details: any[] = [];
  let maxTime = 0;

  for (let i = 0; i < opts.tests.length; i++){
    const t = opts.tests[i];
    // run container per test for isolation
    const args = [...dockerArgsBase, "sh", "-lc", lang.run];
    const child = spawn(DOCKER, args, { stdio: ["pipe", "pipe", "pipe"] });

    let stdout = ""; let stderr = "";
    const started = Date.now();

    const timer = setTimeout(() => child.kill('SIGKILL'), opts.timeLimitMs);

    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.stdin.write(t.input ?? "");
    child.stdin.end();

    const exitCode: number = await new Promise(resolve => child.on('close', resolve as any));
    clearTimeout(timer);

    const elapsed = Date.now() - started;
    maxTime = Math.max(maxTime, elapsed);

    if (exitCode !== 0){
      details.push({ case: i+1, status: elapsed >= opts.timeLimitMs ? "TLE" : "RE", input: t.input, expected: t.output, actual: stdout, timeMs: elapsed });
      return { status: elapsed >= opts.timeLimitMs ? "TLE" : "RE", details, timeMs: maxTime, runtimeLog: stderr.substring(0, 4000) };
    }

    // normalize line endings and trailing spaces
    const norm = (s:string) => s.replace(/\r/g, '').trimEnd();
    const actual = norm(stdout);
    const expected = norm(t.output);

    if (actual !== expected){
      details.push({ case: i+1, status: "WA", input: t.input, expected, actual, timeMs: elapsed });
      return { status: "WA", details, timeMs: maxTime };
    }

    details.push({ case: i+1, status: "AC", input: t.input, expected, actual, timeMs: elapsed });
  }

  return { status: "AC", timeMs: maxTime, details };
}
