
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

// Mapping our language names to Piston's language names
const languageMap: Record<string, string> = {
  'javascript': 'javascript',
  'python': 'python',
  'java': 'java',
  'c++': 'cpp',
  'cpp': 'cpp',
  'c': 'c',
};

const PistonExecutionOutputSchema = z.object({
  stdout: z.string().describe('The standard output of the code execution.'),
  stderr: z.string().describe('The standard error of the code execution, if any.'),
  output: z.string().describe('The combined output (stdout and stderr).'),
  code: z.number().optional().describe('The exit code of the execution.'),
  signal: z.string().nullable().optional().describe('The signal that terminated the execution, if any.'),
}).optional();

const DebugCodeInputSchema = z.object({
  code: z.string().describe('The code submission to debug.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
  input: z.string().describe('The standard input to provide to the code.'),
});

const DebugCodeOutputSchema = z.object({
  language: z.string().optional(),
  version: z.string().optional(),
  run: PistonExecutionOutputSchema,
  compile: PistonExecutionOutputSchema,
});


export const debugCodeFlow = ai.defineFlow(
  {
    name: 'debugCodeFlow',
    inputSchema: DebugCodeInputSchema,
    outputSchema: DebugCodeOutputSchema,
  },
  async ({ code, programmingLanguage, input }) => {
    const pistonLanguage = languageMap[programmingLanguage.toLowerCase()];
    if (!pistonLanguage) {
      throw new Error(`Unsupported language for Piston API: ${programmingLanguage}`);
    }

    try {
      const response = await axios.post(PISTON_API_URL, {
        language: pistonLanguage,
        // We'll let Piston decide the version for now.
        // For production, you might want to specify versions.
        version: '*',
        files: [{ content: code }],
        stdin: input,
      });
      
      const result = response.data;
      
      return {
        language: result.language,
        version: result.version,
        run: result.run || {},
        compile: result.compile || {},
      };

    } catch (error: any) {
      console.error("Error executing debug run with Piston API:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred";
      // Return an error structure that matches the schema
      return {
        run: {
            stdout: '',
            stderr: `Execution Error: ${errorMessage}`,
            output: `Execution Error: ${errorMessage}`,
            code: -1
        },
        compile: {}
      }
    }
  }
);
