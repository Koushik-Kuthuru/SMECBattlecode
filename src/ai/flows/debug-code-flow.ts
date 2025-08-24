
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

// Maps our language names to the Judge0 language IDs
const languageIdMap: Record<string, number> = {
  'javascript': 93, // Node.js
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

const DebugCodeOutputSchema = z.object({
  stdout: z.string().describe("The standard output from the user's code."),
  stderr: z.string().describe("The standard error from the user's code, if any."),
});

async function runOnJudge0(languageId: number, sourceCode: string, stdin: string) {
    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions',
        params: { base64_encoded: 'false', wait: 'true', fields: '*' },
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        data: {
            language_id: languageId,
            source_code: sourceCode,
            stdin: stdin,
        }
    };
    const response = await axios.request(options);
    return response.data;
}


export const debugCodeFlow = ai.defineFlow(
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
        throw new Error("JUDGE0_API_KEY is not set in the environment variables. Cannot execute code.");
    }
    
    try {
        const result = await runOnJudge0(languageId, code, input);
        
        let stdout = result.stdout || '';
        let stderr = result.stderr || '';

        if (result.status_id === 6) { // Compilation Error
            stderr = result.compile_output;
        } else if (result.status_id === 5) { // Time Limit Exceeded
            stderr = 'Error: Time Limit Exceeded.';
        }

        return {
            stdout: stdout || '',
            stderr: stderr || '',
        };

    } catch (error: any) {
        console.error("Error executing debug run with Judge0:", error.response?.data || error.message);
        return {
            stdout: '',
            stderr: `Execution Error: ${error.response?.data?.error || error.message}`,
        };
    }
  }
);
