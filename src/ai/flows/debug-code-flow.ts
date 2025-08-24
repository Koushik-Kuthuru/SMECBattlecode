
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


const DebugCodeInputSchema = z.object({
  code: z.string().describe('The code submission to debug.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
  input: z.string().describe('The standard input to provide to the code.'),
});

const DebugCodeOutputSchema = z.object({
  stdout: z.string().describe("The standard output from the user's code."),
  stderr: z.string().describe("The standard error from the user's code, if any."),
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

export const debugCodeFlow = ai.defineFlow(
  {
    name: 'debugCodeFlow',
    inputSchema: DebugCodeInputSchema,
    outputSchema: DebugCodeOutputSchema,
  },
  async ({ code, programmingLanguage, input }) => {
    const judgeLanguage = languageIdMap[programmingLanguage.toLowerCase()];
    if (!judgeLanguage) {
      throw new Error(`Unsupported language: ${programmingLanguage}`);
    }
    
     // For debugging, we don't have a real problem.
     // We will use the existing `two-sum` problem as a scaffold, but override the
     // test cases with our single custom input.
     // A more robust solution might involve a dedicated debug endpoint on the judge.
     // NOTE: This approach is a workaround. The judge expects a problem file.
     // We're just borrowing its environment to run our code with custom input.
     
     // The judge itself doesn't support passing custom STDIN, so we can't *actually*
     // use the user's input. We'll have to return a placeholder.
     // This is a limitation of the current custom judge design.
     // A future improvement would be to add a dedicated `/debug` endpoint to the judge.
     
    try {
        // Since we can't pass STDIN, we can at least try to compile the code
        // and report any compilation errors.
        const result = await runOnCustomJudge('two-sum', judgeLanguage, code);

        let stdout = '';
        let stderr = '';
        
        if (result.status === 'CE') {
            stderr = result.compileLog;
        } else if (result.status === 'RE') {
            stderr = result.runtimeLog;
        } else if (result.status === 'AC' || result.status === 'WA') {
            // We can't get the actual stdout for custom input.
            // We can inform the user about this limitation.
            stdout = "Note: Custom input execution is not fully supported by the current judge. This run just checks for compilation and basic runtime errors."
        }

        return {
            stdout,
            stderr,
        };

    } catch (error: any) {
        console.error("Error executing debug run with custom judge:", error.message);
        return {
            stdout: '',
            stderr: `Execution Error: ${error.message}`,
        };
    }
  }
);

    