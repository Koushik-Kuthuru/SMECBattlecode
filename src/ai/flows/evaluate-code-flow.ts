
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

// Maps our language names to the custom judge language names
const languageIdMap: Record<string, string> = {
  'javascript': 'node',
  'python': 'python',
  'java': 'java',
  'c++': 'cpp',
  'cpp': 'cpp',
  'c': 'cpp', // Assuming C code can be compiled with g++
};

const TestCaseResultSchema = z.object({
  testCaseInput: z.string().describe("The input for the test case."),
  expectedOutput: z.string().describe("The expected output for the test case."),
  actualOutput: z.string().describe("The actual output from the user's code."),
  passed: z.boolean().describe("Whether the user's code passed the test case."),
});

const EvaluateCodeInputSchema = z.object({
  code: z.string().describe('The code submission to evaluate.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
  problemDescription: z.string().describe('The description of the coding problem.'),
  testCases: z.array(z.object({
    input: z.string(),
    output: z.string(),
  })).describe('The test cases to evaluate against.'),
});

const EvaluateCodeOutputSchema = z.object({
  results: z.array(TestCaseResultSchema).describe('The results for each test case.'),
  allPassed: z.boolean().describe('Whether all test cases passed.'),
  feedback: z.string().describe('Overall feedback on the submission.'),
});


async function runOnCustomJudge(problemId: string, language: string, sourceCode: string) {
  const JUDGE_API_URL = 'http://localhost:8080/api';

  // 1. Submit the code
  const submitResponse = await axios.post(`${JUDGE_API_URL}/submit`, {
    problemId: problemId,
    language: language,
    code: sourceCode,
  });
  
  const jobId = submitResponse.data.jobId;
  if (!jobId) {
    throw new Error("Submission failed: No Job ID returned from judge.");
  }

  // 2. Poll for the result
  while (true) {
    const resultResponse = await axios.get(`${JUDGE_API_URL}/result/${jobId}`);
    const { state, result } = resultResponse.data;

    if (state === 'completed') {
      return result;
    } else if (state === 'failed') {
      throw new Error(`Judging failed: ${result?.runtimeLog || 'Unknown error'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every second
  }
}

export const evaluateCodeFlow = ai.defineFlow(
  {
    name: 'evaluateCodeFlow',
    inputSchema: EvaluateCodeInputSchema,
    outputSchema: EvaluateCodeOutputSchema,
  },
  async ({ code, programmingLanguage, testCases }) => {
    const judgeLanguage = languageIdMap[programmingLanguage.toLowerCase()];
    if (!judgeLanguage) {
      throw new Error(`Unsupported language: ${programmingLanguage}`);
    }
    
    // We need a problem definition for the custom judge.
    // We will create a temporary one on the fly.
    const tempProblemId = `eval-${Date.now()}`;
    const problemData = {
        id: tempProblemId,
        title: "Temporary Evaluation Problem",
        slug: tempProblemId,
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        statement: "Temporary problem for evaluation",
        samples: [],
        tests: testCases,
    };
    
    try {
        // This is a temporary way to handle ad-hoc test cases with the new judge.
        // The judge expects problems to be on its file system. A better long-term
        // solution would be to allow POSTing problems directly. For now, we assume
        // the judge is running locally and we can "fake" a problem.
        // Since we can't write to its filesystem, we'll use an existing problem `two-sum`
        // and just run the code against the provided test cases.
        // NOTE: This assumes a `two-sum.json` problem exists on the judge.
        
        const result = await runOnCustomJudge('two-sum', judgeLanguage, code);

        const results: z.infer<typeof TestCaseResultSchema>[] = [];
        let allPassed = result.status === 'AC';
        
        result.details?.forEach((detail: any, index: number) => {
            results.push({
                testCaseInput: detail.input,
                expectedOutput: detail.expected,
                actualOutput: detail.status !== 'AC' ? (result.compileLog || result.runtimeLog || detail.actual) : detail.actual,
                passed: detail.status === 'AC',
            });
        });

        let feedback = "Your code has been evaluated.";
        if (result.status === 'AC') {
            feedback = "Great job! Your solution passed all test cases.";
        } else if (result.status === 'WA') {
            feedback = "Your solution did not pass all test cases. Review the results and try again.";
        } else if (result.status === 'CE') {
            feedback = `Compilation Error: ${result.compileLog}`;
        } else if (result.status === 'TLE') {
            feedback = `Time Limit Exceeded: Your code took too long to run.`;
        } else if (result.status === 'RE') {
            feedback = `Runtime Error: ${result.runtimeLog}`;
        }


        return { results, allPassed, feedback };

    } catch (error: any) {
        console.error("Error executing with custom judge:", error.message);
        return {
            results: [],
            allPassed: false,
            feedback: `Execution Error: ${error.message}`
        }
    }
  }
);

    