
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

const JUDGE_URL = 'http://localhost:8080/api';

const languageMap: Record<string, string> = {
  'javascript': 'node',
  'python': 'python',
  'java': 'java',
  'c++': 'cpp',
  'cpp': 'cpp',
  'c': 'cpp', // Assuming C code can be compiled with g++
};


const DebugCodeInputSchema = z.object({
  problemId: z.string().describe('The ID of the problem to test against.'),
  code: z.string().describe('The code submission to debug.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
  input: z.string().describe('The standard input to provide to the code (not used by custom judge, will use first sample).'),
});

const DebugCodeOutputSchema = z.object({
  stdout: z.string().describe("The standard output from the user's code."),
  stderr: z.string().describe("The standard error from the user's code, if any."),
});

export const debugCodeFlow = ai.defineFlow(
  {
    name: 'debugCodeFlow',
    inputSchema: DebugCodeInputSchema,
    outputSchema: DebugCodeOutputSchema,
  },
  async ({ problemId, code, programmingLanguage }) => {
    const judgeLanguage = languageMap[programmingLanguage.toLowerCase()];
    if (!judgeLanguage) {
      throw new Error(`Unsupported language: ${programmingLanguage}`);
    }

    try {
      // The custom judge doesn't support custom input for debugging directly.
      // We will submit it and it will run against the problem's pre-defined test cases.
      // The 'debug' action in the UI will now function like a 'run' against all tests.
      const submitRes = await axios.post(`${JUDGE_URL}/submit`, {
        problemId,
        language: judgeLanguage,
        code,
      });

      const { jobId } = submitRes.data;
      if (!jobId) {
        throw new Error('Submission failed, no jobId returned.');
      }

      // Poll for the result
      let jobResult;
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const resultRes = await axios.get(`${JUDGE_URL}/result/${jobId}`);
        const { state, result } = resultRes.data;

        if (state === 'completed' || state === 'failed') {
          jobResult = result;
          break;
        }
      }
      
      if (!jobResult) {
         return { stdout: '', stderr: 'Could not retrieve execution result.' };
      }

      if (jobResult.status === 'CE') {
          return { stdout: '', stderr: jobResult.compileLog || 'Compilation Error' };
      }
      if (jobResult.status !== 'AC' && jobResult.status !== 'WA') {
          return { stdout: jobResult.details?.[0]?.actual || '', stderr: jobResult.runtimeLog || `Execution failed with status: ${jobResult.status}`};
      }

      const firstCase = jobResult.details?.[0];
      return {
        stdout: firstCase?.actual || '',
        stderr: '',
      };

    } catch (error: any) {
      console.error("Error executing debug run with custom judge:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred";
      return {
        stdout: '',
        stderr: `Execution Error: ${errorMessage}`,
      };
    }
  }
);
