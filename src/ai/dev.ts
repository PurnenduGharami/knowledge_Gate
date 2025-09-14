
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-flow.ts';
import '@/ai/flows/ask-gemini-flow.ts';
import '@/ai/flows/compress-chat-flow.ts';
import '@/ai/flows/open-router-proxy-flow.ts';
// query-provider-flow and continue-chat-flow are now standard server actions,
// not Genkit flows, so they don't need to be imported here for registration.
