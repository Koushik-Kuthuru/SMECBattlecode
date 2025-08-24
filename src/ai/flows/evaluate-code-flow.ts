
'use server';

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

/**
 * Helper function to run code on Judge0
 * @param languageId Judge0 language ID
 * @param sourceCode The code to run
 * @param stdin The standard input for the code
 * @returns The Judge0 submission result
 */
async function runOnJudge0(languageId: number, sourceCode: string, stdin: string) {
  const url = 'https://judge0-ce.p.rapidapi.com/submissions';

  const headers: any = {
    'content-type': 'application/json',
    'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
  };

  const options = {
    method: 'POST',
    url: url,
    params: {
      base64_encoded: 'false',
      fields: '*'
    },
    headers: headers,
    data: {
      language_id: languageId,
      source_code: sourceCode,
      stdin: stdin
    }
  };

  const submissionResponse = await axios.request(options);
  const token = submissionResponse.data.token;

  if (!token) {
    return submissionResponse.data;
  }

  // Poll for the result
  const getResultUrl = `https://judge0-ce.p.rapidapi.com/submissions/${token}`;
  
  while (true) {
    const resultResponse = await axios.get(`${getResultUrl}?base64_encoded=false&fields=*`, { headers });
    const statusId = resultResponse.data.status.id;
    if (statusId > 2) { // Statuses: 1-In Queue, 2-Processing. Others are final.
        return resultResponse.data;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before polling again
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
      const mockSuccessFeedback = `(Mock Response) JUDGE0_API_KEY not set. Returning a simulated success. To get real results, add your API key to the .env file.`;
      return {
        results: testCases.map(tc => ({
          testCaseInput: tc.input,
          expectedOutput: tc.output,
          actualOutput: tc.output, // Pretend the output was correct
          passed: true,
        })),
        allPassed: true,
        feedback: mockSuccessFeedback,
      };
    }

    const results: z.infer<typeof TestCaseResultSchema>[] = [];
    let allPassed = true;

    for (const testCase of testCases) {
        try {
            const judgeResult = await runOnJudge0(languageId, code, testCase.input);
            
            // Normalize outputs for comparison
            const actualOutput = (judgeResult.stdout || '').trim();
            const expectedOutput = testCase.output.trim();

            const passed = actualOutput === expectedOutput && judgeResult.status.id === 3; // Status 3 is "Accepted"

            if (!passed) {
                allPassed = false;
            }

            results.push({
                testCaseInput: testCase.input,
                expectedOutput: testCase.output,
                actualOutput: judgeResult.stdout || judgeResult.stderr || judgeResult.compile_output || 'No output',
                passed,
            });

        } catch (error: any) {
             console.error("Error executing test case with Judge0:", error.response?.data || error.message);
             allPassed = false;
             let errorMessage = `Execution Error: ${error.message}`;
             if (error.response?.status === 429) {
                errorMessage = "Execution Error: Too many requests. You have exceeded the API rate limit for code execution. Please wait a moment and try again.";
             } else if(error.response?.data?.message?.includes('exceeded the DAILY quota')) {
                errorMessage = "Execution Error: You have exceeded the daily quota for the public code execution API. Please try again tomorrow or upgrade your plan on RapidAPI.";
             } else if(error.response?.status === 403) {
                errorMessage = "Execution Error: 403 Forbidden. This may be due to an invalid API key or exceeding your daily quota. Please check your Judge0 API key and plan.";
             } else if (error.response?.data?.message) {
                errorMessage = `Execution Error: ${error.response.data.message}`;
             }
             results.push({
                testCaseInput: testCase.input,
                expectedOutput: testCase.output,
                actualOutput: errorMessage,
                passed: false,
             });
        }
    }
    
    let feedback = "Your code has been evaluated.";
    if(allPassed) {
        feedback = "Great job! Your solution passed all test cases.";
    } else {
        feedback = "Your solution did not pass all test cases. Review the results and try again.";
    }

    return { results, allPassed, feedback };
  }
);
