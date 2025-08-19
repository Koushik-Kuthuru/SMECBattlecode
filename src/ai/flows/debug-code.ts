
'use server';

/**
 * @fileOverview A code debugging AI agent.
 *
 * - debugCode - A function that executes code with a given input and returns the output.
 * - DebugCodeInput - The input type for the debugCode function.
 * - DebugCodeOutput - The return type for the debugCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DebugCodeInputSchema = z.object({
  code: z.string().describe('The code submission to debug.'),
  programmingLanguage: z
    .string()
    .describe('The programming language of the code submission.'),
  input: z.string().describe('The standard input to provide to the code.'),
});
export type DebugCodeInput = z.infer<typeof DebugCodeInputSchema>;

const DebugCodeOutputSchema = z.object({
  stdout: z.string().describe("The standard output from the user's code."),
  stderr: z.string().describe("The standard error from the user's code, if any."),
});
export type DebugCodeOutput = z.infer<typeof DebugCodeOutputSchema>;


export async function debugCode(input: DebugCodeInput): Promise<DebugCodeOutput> {
  return debugCodeFlow(input);
}


const prompt = ai.definePrompt({
  name: 'debugCodePrompt',
  input: {schema: DebugCodeInputSchema},
  output: {schema: DebugCodeOutputSchema},
  prompt: `You are a code execution engine. Your task is to execute a user's code submission with a given standard input and capture its output.

  **Programming Language:**
  {{{programmingLanguage}}}

  **Code Submission:**
  \`\`\`{{{programmingLanguage}}}
  {{{code}}}
  \`\`\`

  **Standard Input:**
  \`\`\`
  {{{input}}}
  \`\`\`

  **Instructions:**
  1.  Execute the user's code with the provided standard input.
  2.  Capture any output sent to standard output (stdout).
  3.  Capture any output sent to standard error (stderr).
  4.  Return the captured stdout and stderr in the specified JSON format. Do not provide any analysis or feedback, only the raw output.

  Return a JSON object matching the specified output schema.
  `,
});

const debugCodeFlow = ai.defineFlow(
  {
    name: 'debugCodeFlow',
    inputSchema: DebugCodeInputSchema,
    outputSchema: DebugCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
