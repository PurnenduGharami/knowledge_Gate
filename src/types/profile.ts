
export type Tier = "Basic" | "Medium" | "Professional" | "Premium";

export interface UserModelPreference {
  mode: "standard" | "multi" | "summary" | "conflict";
  type: "automatic" | "manual";
  modelIds: string[];
}

export interface TokenUsage {
  modelId: string;
  requests: number;
  tokensUsed: number;
  lastUsed: number;
}

export interface UserProfile {
  name: string;
  email: string;
  chaosSparks: number;
  modelPrefs: UserModelPreference[];
  theme: string;
  colorMode: 'light' | 'dark' | 'system';
  
  // For rolling spark allocation system
  firstLoginUTC?: string;
  lastRefillUTC?: string;
  refillsUsed?: number;
}

export interface SparkTransaction {
  id: string;
  timestamp: number;
  tokensUsed: number;
  modelUsed: string;
  costUSD: number;
  sparksCharged: number;
  searchType: 'standard' | 'multi' | 'summary' | 'chat' | 'conflict' | 'custom';
}
