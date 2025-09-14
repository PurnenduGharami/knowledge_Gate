
import type { UsageStats, OpenRouterModel } from '@/types/search';

export const USD_TO_SPARKS_RATE = 1000;
export const FLAT_TRANSACTION_FEE_SPARKS = 0.001;
export const STARTING_SPARKS = 100.00;


/**
 * Calculates the total cost of an API call in Chaos Sparks based on token usage and model pricing.
 * @param usage The token usage statistics from OpenRouter (prompt, completion tokens).
 * @param pricing The pricing details for the specific model used.
 * @returns An object containing the cost in USD and the total cost in Chaos Sparks.
 */
export function calculateSparksFromUsage(
  usage: UsageStats,
  pricing: OpenRouterModel['pricing']
): { costUSD: number; sparksSpent: number } {
  if (!usage || !pricing) {
    return { costUSD: 0, sparksSpent: FLAT_TRANSACTION_FEE_SPARKS };
  }

  // Defensively parse all numeric inputs to prevent type coercion errors.
  const promptTokens = Number(usage.prompt_tokens || 0);
  const completionTokens = Number(usage.completion_tokens || 0);
  
  const promptPrice = Number(pricing.prompt || 0);
  const completionPrice = Number(pricing.completion || 0);
  const requestPrice = Number(pricing.request || 0);
  
  const rate = Number(USD_TO_SPARKS_RATE);
  const flatFee = Number(FLAT_TRANSACTION_FEE_SPARKS);

  // The pricing object contains the cost per individual token.
  const promptCost = promptTokens * promptPrice;
  const completionCost = completionTokens * completionPrice;
  
  const totalCostUSD = promptCost + completionCost + requestPrice;

  // Perform the final calculation with explicitly parsed numbers to ensure correct arithmetic.
  const sparksSpent = Math.round((totalCostUSD * rate + flatFee) * 10000) / 10000;

  return { costUSD: totalCostUSD, sparksSpent: sparksSpent };
}


/**
 * Formats a spark value for primary display, rounding to 2 decimal places.
 * @param sparks The number of sparks.
 * @returns A string representation of the sparks.
 */
export function formatSparks(sparks: number): string {
    if (typeof sparks !== 'number' || isNaN(sparks)) {
        return '0.00';
    }
    return sparks.toFixed(2);
}

/**
 * Formats a spark value for detailed display in tooltips or logs.
 * @param sparks The number of sparks.
 * @returns A string representation of the sparks with higher precision.
 */
export function formatSparksDetailed(sparks: number): string {
    if (typeof sparks !== 'number' || isNaN(sparks)) {
        return '0.0000';
    }
    if (sparks === 0) return "0";
    if (sparks < 0.0001 && sparks > 0) {
        return sparks.toExponential(2);
    }
    if (sparks < 0.01) {
        return sparks.toPrecision(2);
    }
    return sparks.toFixed(4);
}
