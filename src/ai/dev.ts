
'use server';
import { config } from 'dotenv';
config();
    
// This file is used for development purposes to register flows.
// It is not intended for production use.
import './flows/compare-code-flow';
import './flows/debug-code-flow';
import './flows/evaluate-code-flow';
import './flows/generate-test-cases-flow';
import './flows/suggest-code-improvements-flow';
import './flows/run-code-flow';

