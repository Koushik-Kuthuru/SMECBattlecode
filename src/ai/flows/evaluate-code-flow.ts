
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

// Maps our language names to the ones Piston expects
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

const TestCaseResultSchema = z.object({
  testCaseInput: z.string().describe("The input for the test case."),
  expectedOutput: z.string().describe("The expected output for the test case."),
  actualOutput: z.string().describe("The actual output from the user's code."),
  passed: z.boolean().describe("Whether the user's code passed the test case."),
  status: z.string().describe("The status description from the judge (e.g., 'Accepted', 'Wrong Answer')."),
  stdout: z.string().nullable().describe("The standard output from the user's code."),
  stderr: z.string().nullable().describe("The standard error from the user's code, if any."),
  compile_output: z.string().nullable().describe("The compilation output, if any."),
});

const EvaluateCodeInputSchema = z.object({
  problemId: z.string().describe('The ID of the problem to evaluate against.'),
  code: z.string().describe('The code submission to evaluate.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
});

const EvaluateCodeOutputSchema = z.object({
  results: z.array(TestCaseResultSchema).describe('The results for each test case.'),
  allPassed: z.boolean().describe('Whether all test cases passed.'),
  feedback: z.string().describe('Overall feedback on the submission.'),
});

async function executeWithPiston(pistonLanguage: string, code: string, stdin: string) {
    const response = await axios.post(PISTON_API_URL, {
        language: pistonLanguage,
        version: '*', // Let Piston pick the latest stable version
        files: [{ content: code }],
        stdin: stdin,
    });
    return response.data;
}

export const evaluateCodeFlow = ai.defineFlow(
  {
    name: 'evaluateCodeFlow',
    inputSchema: EvaluateCodeInputSchema,
    outputSchema: EvaluateCodeOutputSchema,
  },
  async ({ problemId, code, programmingLanguage }) => {
    const pistonLanguage = languageMap[programmingLanguage.toLowerCase()];
    if (!pistonLanguage) {
      throw new Error(`Unsupported language for Piston API: ${programmingLanguage}`);
    }

    try {
        const challengeDoc = await getDoc(doc(db, 'challenges', problemId));
        if (!challengeDoc.exists()) {
            throw new Error('Challenge not found');
        }
        const challenge = challengeDoc.data();
        const testCases = challenge.testCases;

        let allPassed = true;
        const results = [];
        let firstErrorFeedback: string | null = null;
        
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const pistonResult = await executeWithPiston(pistonLanguage, code, tc.input);

            let compileStderr = pistonResult.compile?.stderr;
            if (compileStderr) {
                // Check for the specific "undefined reference to `main`" error
                if (compileStderr.includes("undefined reference to `main'")) {
                    compileStderr = "Your code is missing a `main` function, which is required for it to run.";
                }

                // Compilation failed for the first test case, no need to run others.
                allPassed = false;
                firstErrorFeedback = `Compilation Error: ${compileStderr.substring(0, 500)}`;
                results.push({
                    testCaseInput: tc.input,
                    expectedOutput: tc.output,
                    actualOutput: compileStderr,
                    passed: false,
                    status: 'Compilation Error',
                    stdout: null,
                    stderr: null,
                    compile_output: compileStderr,
                });
                break; // Stop testing
            }
            
            const runStderr = pistonResult.run?.stderr;
            if (runStderr) {
                 allPassed = false;
                 if(!firstErrorFeedback) firstErrorFeedback = `Runtime Error: ${runStderr.substring(0, 500)}`;
                 results.push({
                    testCaseInput: tc.input,
                    expectedOutput: tc.output,
                    actualOutput: runStderr,
                    passed: false,
                    status: 'Runtime Error',
                    stdout: pistonResult.run.stdout,
                    stderr: runStderr,
                    compile_output: null,
                });
                continue; // Continue to see if other test cases pass
            }
            
            // Normalize outputs for comparison
            const actualOutput = (pistonResult.run?.stdout || "").trim();
            const expectedOutput = (tc.output || "").trim();
            
            const passed = actualOutput === expectedOutput;
            if (!passed) {
                allPassed = false;
                if(!firstErrorFeedback) firstErrorFeedback = "Wrong Answer";
            }
            
            results.push({
                testCaseInput: tc.input,
                expectedOutput: tc.output,
                actualOutput: pistonResult.run.stdout || '',
                passed: passed,
                status: passed ? 'Accepted' : 'Wrong Answer',
                stdout: pistonResult.run.stdout,
                stderr: null,
                compile_output: null,
            });
        }
        
        const feedback = allPassed ? 'All test cases passed!' : (firstErrorFeedback || `Failed ${results.filter(r => !r.passed).length} test case(s).`);

        return { results, allPassed, feedback };

    } catch (error: any) {
        console.error("Error communicating with Piston API:", error.response?.data || error.message);
        return {
            results: [],
            allPassed: false,
            feedback: `API Communication Error: ${error.response?.data?.message || error.message}`
        }
    }
  }
);
