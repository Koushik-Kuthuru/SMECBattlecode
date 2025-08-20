
'use server';

/**
 * @fileOverview A code debugging agent that uses Judge0.
 *
 * - debugCode - A function that executes code with a given input and returns the output.
 * - DebugCodeInput - The input type for the debugCode function.
 * - DebugCodeOutput - The return type for the debugCode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

// Maps our language names to Judge0 language IDs
const languageIdMap: Record<string, number> = {
  'javascript': 63,
  'python': 71,
  'java': 62,
  'c++': 54,
  'cpp': 54,
  'c': 50,
};

const DebugCodeInputSchema = z.object({
  code: z.string().describe('The code submission to debug.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
  input: z.string().describe('The standard input to provide to the code.'),
});
export type DebugCodeInput = z.infer<typeof DebugCodeInputSchema>;

const DebugCodeOutputSchema = z.object({
  stdout: z.string().describe("The standard output from the user's code."),
  stderr: z.string().describe("The standard error from the user's code, if any."),
});
export type DebugCodeOutput = z.infer<typeof DebugCodeOutputSchema>;


/**
 * Helper function to run code on Judge0
 * @param languageId Judge0 language ID
 * @param sourceCode The code to run
 * @param stdin The standard input for the code
 * @returns The Judge0 submission result
 */
async function runOnJudge0(languageId: number, sourceCode: string, stdin: string) {
  const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions',
    params: {
      base64_encoded: 'false',
      fields: '*'
    },
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    },
    data: {
      language_id: languageId,
      source_code: sourceCode,
      stdin: stdin
    }
  };

  const submissionResponse = await axios.request(options);
  const token = submissionResponse.data.token;

  // Poll for the result
  while (true) {
    const resultResponse = await axios.get(`https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false&fields=*`, {
        headers: {
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
    });
    const statusId = resultResponse.data.status.id;
    if (statusId > 2) { // Statuses: 1-In Queue, 2-Processing. Others are final.
        return resultResponse.data;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before polling again
  }
}


export async function debugCode(input: DebugCodeInput): Promise<DebugCodeOutput> {
  return debugCodeFlow(input);
}

const debugCodeFlow = ai.defineFlow(
  {
    name: 'debugCodeFlow',
    inputSchema: DebugCodeInputSchema,
    outputSchema: DebugCodeOutputSchema,
  },
  async ({ code, programmingLanguage, input }) => {
    const languageId = languageIdMap[programmingLanguage.toLowerCase()];
    if (!languageId) {
      throw new Error(`Unsupported language: ${programmingLanguage}`);
    }
    if (!process.env.JUDGE0_API_KEY) {
        throw new Error('JUDGE0_API_KEY is not set in the environment variables.');
    }

    try {
        const judgeResult = await runOnJudge0(languageId, code, input);
        
        const stdout = judgeResult.stdout || '';
        let stderr = judgeResult.stderr || '';

        // Judge0 sometimes puts compile errors in a different field
        if (judgeResult.compile_output) {
            stderr = stderr ? `${stderr}\n\n---COMPILE ERRORS---\n${judgeResult.compile_output}` : judgeResult.compile_output;
        }

        if (judgeResult.status.id !== 3) { // Not "Accepted"
             stderr = stderr ? `${stderr}\n\n---EXECUTION INFO---\n${judgeResult.status.description}` : judgeResult.status.description;
        }

        return {
            stdout,
            stderr,
        };

    } catch (error: any) {
        console.error("Error executing debug run with Judge0:", error.response?.data || error.message);
        let errorMessage = `Execution Error: ${error.message}`;
        if (error.response?.status === 429) {
            errorMessage = "Execution Error: Too many requests. You have exceeded the API rate limit for code execution. Please wait a moment and try again.";
        } else if (error.response?.status === 403) {
            errorMessage = "Execution Error: 403 Forbidden. This may be due to an invalid API key or exceeding your daily quota. Please check your Judge0 API key and plan.";
        } else if (error.response?.data?.message) {
            errorMessage = `Execution Error: ${error.response.data.message}`;
        }
        return {
            stdout: '',
            stderr: errorMessage,
        };
    }
  }
);
