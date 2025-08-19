
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-code-improvements.ts';
import '@/ai/flows/generate-test-cases.ts';
import '@/ai/flows/evaluate-code.ts';
import '@/ai/flows/compare-code.ts';
import '@/ai/flows/detect-ai-generated-code.ts';
import '@/ai/flows/debug-code.ts';
    
