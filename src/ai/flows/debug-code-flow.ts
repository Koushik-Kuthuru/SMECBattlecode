
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';

const languageMap: Record<string, number> = {
  'javascript': 93, // Node.js
  'python': 71, // Python 3.8.1
  'java': 62, // Java 11
  'c++': 54, // C++ 11
  'cpp': 54,
  'c': 50, // C
};


const DebugCodeInputSchema = z.object({
  problemId: z.string().describe('The ID of the problem to test against.'),
  code: z.string().describe('The code submission to debug.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
  input: z.string().describe('The standard input to provide to the code.'),
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
  async ({ problemId, code, programmingLanguage, input }) => {
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
              'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
              'Content-Type': 'application/json'
          }
      });
      
      const result = response.data;
      
      let stdout = result.stdout || '';
      let stderr = result.stderr || '';

      if (result.status.id === 6) { // Compilation Error
          stderr = result.compile_output || 'Compilation Error';
      } else if (result.status.id !== 3 && result.status.description) { // Not "Accepted"
          stderr = stderr ? `${result.status.description}\n${stderr}` : result.status.description;
      }
      
      return {
        stdout,
        stderr,
      };

    } catch (error: any) {
      console.error("Error executing debug run with Judge0:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred";
      return {
        stdout: '',
        stderr: `Execution Error: ${errorMessage}`,
      };
    }
  }
);
