import {genkit} from 'genkit';
import type {Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check for the Google API key in the server environment.
const googleApiKey = process.env.GOOGLE_API_KEY;

const plugins: Plugin[] = [];
let defaultModel: string | undefined = undefined;

if (googleApiKey) {
  // If the key exists, configure the Google AI plugin.
  plugins.push(googleAI({apiKey: googleApiKey}));
  defaultModel = 'googleai/gemini-2.0-flash';
} else {
  // If the key is missing, log a clear warning to the console.
  // This allows the server to start, but Gemini-related flows will fail at runtime.
  console.warn(
    'CRITICAL: GOOGLE_API_KEY environment variable is not set. \n' +
      'Any features that rely on the Gemini model (e.g., summarization, chat compression) will fail. \n' +
      '  - For local development: Create a .env file in the root of your project and add GOOGLE_API_KEY="your-api-key".\n' +
      '  - For deployment: Ensure the GEMINI_API_KEY secret is created and configured in apphosting.yaml, then redeploy.'
  );
}

export const ai = genkit({
  plugins: plugins,
  model: defaultModel,
});
