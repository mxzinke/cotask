import OpenAI from "openai";
import { AIModel } from "./lib/models";

export interface AIModels {
  quality: AIModel;
  fast: AIModel;
  online: AIModel;
}

export async function getModels(): Promise<AIModels> {
  // TODO: add handling for CoTask Cloud
  const provider = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  const perplexity = new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY!,
    baseURL: "https://api.perplexity.ai",
  });

  return {
    quality: new AIModel(provider, "gpt-4o", {
      maxTokensContext: 128_000,
    }),
    fast: new AIModel(provider, "gpt-3.5-turbo", {
      maxTokensContext: 16 * 1024,
    }),
    online: new AIModel(perplexity, "llama-3-sonar-large-32k-online", {
      maxTokensContext: 28 * 1024,
    }),
  };
}
