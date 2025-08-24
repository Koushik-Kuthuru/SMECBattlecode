
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

const JUDGE0_URL = 'http://localhost:2358';

const languageMap: Record<string, number> = {
  'javascript': 93, // Node.js
  'python': 71, // Python 3.8.1
  'java': 62, // Java 11
  'c++': 54, // C++ 11
  'cpp': 54,
  'c': 50, // C
};


const DebugCodeInputSchema = z.object({
  code: z.string().describe('The code submission to debug.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
  input: z.string().describe('The standard input to provide to the code.'),
});

const DebugCodeOutputSchema = z.object({
  stdout: z.string().describe("The standard output from the user's code."),
  stderr: z.string().describe("The standard error from the user's code, if any."),
  compile_output: z.string().describe("Compilation output, if any."),
  status: z.string().describe("The execution status description."),
});

export const debugCodeFlow = ai.defineFlow(
  {
    name: 'debugCodeFlow',
    inputSchema: DebugCodeInputSchema,
    outputSchema: DebugCodeOutputSchema,
  },
  async ({ code, programmingLanguage, input }) => {
    const languageId = languageMap[programmingLanguage.toLowerCase()];
    if (!languageId) {
      throw new Error(`Unsupported language: ${programmingLanguage}`);
    }

    try {
      const response = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
          language_id: languageId,
          source_code: code,
          stdin: input,
      }, {
          headers: {
              'Content-Type': 'application/json'
          }
      });
      
      const result = response.data;
      
      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        compile_output: result.compile_output || '',
        status: result.status.description || 'Unknown Status',
      };

    } catch (error: any) {
      console.error("Error executing debug run with Judge0:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred";
      return {
        stdout: '',
        stderr: `Execution Error: ${errorMessage}`,
        compile_output: '',
        status: 'Error'
      };
    }
  }
);
