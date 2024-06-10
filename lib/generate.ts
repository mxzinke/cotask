import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/index.mjs";
import type { Tool } from "../tools";
import type { AIModel } from "./models";

// This prompt makes sure the each agent can think more about the task at hand.
const basePrompt =
  "Encapsulate your final response to the user with '<response>' xml tag (for example: '<response>Here comes the text</response>'), all other response will not be transmitted to the user.";

export async function generateResponse(
  thread: ChatCompletionMessageParam[],
  options: {
    systemPrompt: string;
    model: AIModel;
    tools?: Tool<unknown>[];
  },
): Promise<ChatCompletionAssistantMessageParam> {
  const toolDefs = options.tools?.map((tool) => tool.toOpenSpec()) ?? [];
  const response = await options.model._generateResponse(
    options.systemPrompt + "\n\n" + basePrompt,
    thread,
    toolDefs,
  );

  if (response.role !== "assistant")
    throw new Error(
      `[ROLE] Unexpected response role. Expected 'assistant', got '${response.role}'.`,
    );

  // This part is @deprecated !!
  if ("function_call" in response && !!response.function_call) {
    const tool = options.tools?.find(
      (t) => t.id === response.function_call!.name,
    );
    if (!tool) {
      console.log(
        `[WARN] Unexpected tool call to function '${response.function_call.name}'.`,
      );
      return await generateResponse(
        [
          ...thread,
          response,
          {
            role: "function",
            content: `Function '${response.function_call.name}' not found. Please check your configuration.`,
            name: response.function_call.name,
          },
        ],
        options,
      );
    }

    const functionCall = await tool.runLegacy(
      JSON.parse(response.function_call.arguments),
    );

    return await generateResponse([...thread, response, functionCall], options);
  }

  // Call the provided tools and add their responses to the thread.
  if ("tool_calls" in response && !!response.tool_calls) {
    const toolRuns = [];

    for (const call of response.tool_calls) {
      const tool = options.tools?.find((t) => t.id === call.function.name);

      if (!tool) {
        console.log(
          `[WARN] Unexpected tool call to function '${call.function.name}'.`,
        );
        toolRuns.push({
          role: "tool",
          content: `Tool '${call.function.name}' not found. Please check your configuration.`,
          tool_call_id: call.id,
        } satisfies ChatCompletionToolMessageParam);
        continue;
      }

      toolRuns.push(
        await tool.run(call.id, JSON.parse(call.function.arguments)),
      );
    }

    return await generateResponse([...thread, response, ...toolRuns], options);
  }

  if (!response.content) {
    return await generateResponse(
      [...thread, response, { role: "user", content: "Continue..." }],
      options,
    );
  }

  const extracted = extractResponses(response.content);
  if (!extracted) {
    return await generateResponse(
      [...thread, response, { role: "user", content: "Continue..." }],
      options,
    );
  }

  return {
    ...response,
    content: extracted,
  };
}

function extractResponses(text: string): string {
  const regex = /<response>([\s\S]*?)<\/response>/gi;
  const matches = text.match(regex) || [];
  return matches
    .map((match) => match.replace(/<\/?response>/gi, "").trim())
    .join("\n");
}
