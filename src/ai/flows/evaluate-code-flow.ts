
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const JUDGE0_URL = 'http://localhost:2358';

// Maps our language names to the ones Judge0 expects
const languageMap: Record<string, number> = {
  'javascript': 93, // Node.js
  'python': 71, // Python 3.8.1
  'java': 62, // Java 11
  'c++': 54, // C++ 11
  'cpp': 54,
  'c': 50, // C
};

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


async function executeOnJudge(languageId: number, code: string, testCases: { input: string, output: string}[]) {
  const submissions = testCases.map(tc => ({
      language_id: languageId,
      source_code: code,
      stdin: tc.input,
      expected_output: tc.output
  }));
  
  const response = await axios.post(`${JUDGE0_URL}/submissions/batch?base64_encoded=false&wait=true`, 
      { submissions }
  );

  return response.data;
}

export const evaluateCodeFlow = ai.defineFlow(
  {
    name: 'evaluateCodeFlow',
    inputSchema: EvaluateCodeInputSchema,
    outputSchema: EvaluateCodeOutputSchema,
  },
  async ({ problemId, code, programmingLanguage }) => {
    const languageId = languageMap[programmingLanguage.toLowerCase()];
    if (!languageId) {
      throw new Error(`Unsupported language: ${programmingLanguage}`);
    }

    try {
        const challengeDoc = await getDoc(doc(db, 'challenges', problemId));
        if (!challengeDoc.exists()) {
            throw new Error('Challenge not found');
        }
        const challenge = challengeDoc.data();
        const testCases = challenge.testCases;

        const judgeResults = await executeOnJudge(languageId, code, testCases);
        
        let allPassed = true;
        const results = judgeResults.map((res: any, index: number) => {
            const passed = res.status.id === 3; // 3 is "Accepted"
            if(!passed) allPassed = false;
            
            return {
                testCaseInput: testCases[index].input,
                expectedOutput: testCases[index].output,
                actualOutput: res.stdout || res.stderr || res.compile_output || 'No output',
                passed: passed,
                status: res.status.description,
                stdout: res.stdout,
                stderr: res.stderr,
                compile_output: res.compile_output,
            };
        });

        let feedback = allPassed 
            ? 'All test cases passed!' 
            : `Failed ${results.filter(r => !r.passed).length} test case(s).`;

        const firstError = judgeResults.find((res:any) => res.status.id > 3);
        if (firstError) {
          feedback = firstError.status.description;
        }

        return { results, allPassed, feedback };

    } catch (error: any) {
        console.error("Error communicating with Judge0:", error.response?.data || error.message);
        return {
            results: [],
            allPassed: false,
            feedback: `Judge Communication Error: ${error.message}`
        }
    }
  }
);
