
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

const JUDGE_URL = 'http://localhost:8080/api';

// Maps our language names to the ones the judge expects
const languageMap: Record<string, string> = {
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
  problemId: z.string().describe('The ID of the problem to evaluate against.'),
  code: z.string().describe('The code submission to evaluate.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
});

const EvaluateCodeOutputSchema = z.object({
  results: z.array(TestCaseResultSchema).describe('The results for each test case.'),
  allPassed: z.boolean().describe('Whether all test cases passed.'),
  feedback: z.string().describe('Overall feedback on the submission.'),
});

async function submitToJudge(language: string, problemId: string, code: string) {
    const submitRes = await axios.post(`${JUDGE_URL}/submit`, {
        problemId,
        language,
        code,
    });
    const { jobId } = submitRes.data;
    if (!jobId) {
        throw new Error('Submission to judge failed, no jobId returned.');
    }
    return jobId;
}

async function pollForResult(jobId: string) {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every second
        const resultRes = await axios.get(`${JUDGE_URL}/result/${jobId}`);
        const { state, result } = resultRes.data;

        if (state === 'completed' || state === 'failed') {
            if (!result) {
                throw new Error('Job finished but no result was returned.');
            }
            return result;
        }
    }
}

export const evaluateCodeFlow = ai.defineFlow(
  {
    name: 'evaluateCodeFlow',
    inputSchema: EvaluateCodeInputSchema,
    outputSchema: EvaluateCodeOutputSchema,
  },
  async ({ problemId, code, programmingLanguage }) => {
    const judgeLanguage = languageMap[programmingLanguage.toLowerCase()];
    if (!judgeLanguage) {
      throw new Error(`Unsupported language: ${programmingLanguage}`);
    }

    try {
        const jobId = await submitToJudge(judgeLanguage, problemId, code);
        const judgeResult = await pollForResult(jobId);

        if (!judgeResult.details) {
            let feedback = 'An unknown error occurred.';
            if(judgeResult.status === 'CE') feedback = judgeResult.compileLog || 'Compilation Error';
            if(judgeResult.status === 'IE') feedback = judgeResult.runtimeLog || 'Internal Error';
             return {
                results: [],
                allPassed: false,
                feedback: `Execution failed: ${feedback}`,
            };
        }

        const results: z.infer<typeof TestCaseResultSchema>[] = judgeResult.details.map((detail: any) => ({
            testCaseInput: detail.input,
            expectedOutput: detail.expected,
            actualOutput: detail.actual || judgeResult.runtimeLog || judgeResult.compileLog || '',
            passed: detail.status === 'AC',
        }));

        const allPassed = judgeResult.status === 'AC';
        let feedback = allPassed ? 'All test cases passed!' : `Failed on test case ${results.findIndex(r => !r.passed) + 1}.`;
        if (judgeResult.status === 'TLE') feedback = 'Time Limit Exceeded.';
        if (judgeResult.status === 'MLE') feedback = 'Memory Limit Exceeded.';
        if (judgeResult.status === 'RE') feedback = `Runtime Error: ${judgeResult.runtimeLog || 'Unknown error'}`;
        if (judgeResult.status === 'CE') feedback = `Compilation Error: ${judgeResult.compileLog || 'Check syntax'}`;
        
        return { results, allPassed, feedback };

    } catch (error: any) {
        console.error("Error executing with custom judge:", error.response?.data || error.message);
        return {
            results: [],
            allPassed: false,
            feedback: `Judge Communication Error: ${error.response?.data?.error || error.message}`
        }
    }
  }
);
