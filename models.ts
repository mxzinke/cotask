import OpenAI from "openai";
import { AIModel } from "./lib/models";

const openaiProvider = new OpenAI({
  apiKey: process.env.COTASK_OPENAI_API_KEY!,
});

export const FastModel = new AIModel(openaiProvider, "gpt-3.5-turbo", {
  maxTokensContext: 16 * 1024,
});

export const AccurateModel = new AIModel(openaiProvider, "gpt-4o", {
  maxTokensContext: 128_000,
});
