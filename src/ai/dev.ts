'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-code-improvements.ts';
import '@/ai/flows/generate-test-cases.ts';
import '@/ai/flows/evaluate-code.ts';
import '@/ai/flows/compare-code.ts';

    