export type TestCase = { input: string; output: string };
export type Problem = {
  id: string;
  title: string;
  slug: string;
  timeLimitMs: number;      // per test case
  memoryLimitMb: number;    // enforced via Docker
  statement: string;        // markdown
  samples: TestCase[];      // shown to users
  tests: TestCase[];        // hidden judge tests
};

export type SubmissionRequest = {
  problemId: string;
  language: string; // "python", "cpp", "node", "java"
  code: string;
};

export type SubmissionResult = {
  status: "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE" | "IE";
  timeMs?: number;
  memoryMb?: number;
  compileLog?: string;
  runtimeLog?: string;
  details?: Array<{
    case: number;
    status: SubmissionResult["status"];
    input: string;
    expected: string;
    actual?: string;
    timeMs?: number;
  }>;
};
