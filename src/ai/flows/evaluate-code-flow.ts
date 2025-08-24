
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


async function runOnJudge0(languageId: number, sourceCode: string, testCases: { input: string, output: string }[]) {
  const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: { base64_encoded: 'false', fields: '*' },
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    },
    data: {
      submissions: testCases.map(tc => ({
        language_id: languageId,
        source_code: sourceCode,
        stdin: tc.input,
        expected_output: tc.output,
      }))
    }
  };

  const response = await axios.request(options);
  const tokens = response.data.map((s: { token: string }) => s.token);
  
  // Poll for results
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusOptions = {
        method: 'GET',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            tokens: tokens.join(','),
            base64_encoded: 'false',
            fields: 'status_id,stdout,stderr,compile_output,expected_output,stdin'
        },
        headers: {
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
    };
    const resultsResponse = await axios.request(statusOptions);
    const submissions = resultsResponse.data.submissions;
    const allDone = submissions.every((s: any) => s.status_id > 2); // Status > 2 means finished (Accepted, WA, RE, etc.)
    if (allDone) {
        return submissions;
    }
  }
}

export const evaluateCodeFlow = ai.defineFlow(
  {
    name: 'evaluateCodeFlow',
    inputSchema: EvaluateCodeInputSchema,
    outputSchema: EvaluateCodeOutputSchema,
  },
  async ({ code, programmingLanguage, testCases }) => {
    const languageId = languageIdMap[programmingLanguage.toLowerCase()];
    if (!languageId) {
      throw new Error(`Unsupported language: ${programmingLanguage}`);
    }
    if (!process.env.JUDGE0_API_KEY) {
        throw new Error("JUDGE0_API_KEY is not set in the environment variables. Cannot execute code.");
    }

    const results: z.infer<typeof TestCaseResultSchema>[] = [];
    let allPassed = true;
    let feedback = "All test cases passed!";

    try {
        const judge0Results = await runOnJudge0(languageId, code, testCases);
        
        judge0Results.forEach((result: any, index: number) => {
            const passed = result.status_id === 3; // 3 is "Accepted"
            if (!passed) {
                allPassed = false;
            }

            let actualOutput = result.stdout || '';
            if (result.status_id === 5) { // Time Limit Exceeded
                actualOutput = `Error: Time Limit Exceeded. Your code took too long to run.`;
                feedback = "Time Limit Exceeded. Please optimize your code.";
            } else if (result.status_id === 6) { // Compilation Error
                actualOutput = `Compilation Error:\n${result.compile_output}`;
                feedback = "Your code failed to compile. Please check the syntax.";
            } else if (result.status_id > 4) { // Other Runtime Errors
                actualOutput = `Runtime Error:\n${result.stderr}`;
                feedback = "A runtime error occurred. Please check your code for issues like division by zero or out-of-bounds access.";
            }

            results.push({
                testCaseInput: result.stdin,
                expectedOutput: result.expected_output,
                actualOutput: actualOutput,
                passed: passed,
            });
        });

        if (!allPassed && feedback === "All test cases passed!") {
            feedback = "Some test cases failed. Please review the results.";
        }

    } catch (error: any) {
        console.error("Error executing with Judge0:", error.response?.data || error.message);
        return {
            results: [],
            allPassed: false,
            feedback: `Execution Error: ${error.response?.data?.error || error.message}`
        }
    }
    
    return { results, allPassed, feedback };
  }
);
