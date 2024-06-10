import type OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";

export class AIModel {
  constructor(
    private openai: OpenAI,
    private readonly model: string,
    private readonly options: {
      maxTokensContext: number;
    },
  ) {}

  // Should only be used by the generateResponse function
  async _generateResponse(
    systemPrompt: string,
    thread: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[] = [],
    retryCount = 0,
  ): Promise<ChatCompletionMessageParam> {
    // We calc that each token is about 3 characters long, plus 20 extra tokens each
    // TODO: Do right calculation!
    const baseContextLength =
      Math.round(systemPrompt.length / 3) +
      Math.round(JSON.stringify(tools).length / 3) +
      40;
    const threadContextLength = thread.reduce(
      (sum, msg) => Math.round(JSON.stringify(msg.content).length / 3) + sum,
      0,
    );

    // console.log(
    //   `[DEBUG] Requesting response from model "${this.model}" with about ${
    //     baseContextLength + threadContextLength
    //   } tokens at context.`,
    // );

    // If the context is too long, we need to trim it down (this means the model does for get it!)
    if (
      baseContextLength + threadContextLength >
      this.options.maxTokensContext
    ) {
      thread = trimThreadToContextSize(
        thread,
        this.options.maxTokensContext - baseContextLength,
      );
    }

    const res = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      messages: [{ role: "system", content: systemPrompt }, ...thread],
      tools: tools.length > 0 ? tools : undefined,
    });
    if (!res) throw new Error("No response from OpenAI");

    if (res.choices.length === 0) {
      if (retryCount > 5) throw new Error("Too many retries");
      return this._generateResponse(
        systemPrompt,
        thread,
        tools,
        retryCount + 1,
      );
    }

    if (res.choices[0].finish_reason === "content_filter")
      throw new Error("Request not allowed - content filter");

    if (res.choices[0].finish_reason === "length") {
      if (retryCount > 5)
        throw new Error("Too many retries - too long content!");
      const next = await this._generateResponse(
        systemPrompt,
        [...thread, res.choices[0].message],
        tools,
        retryCount + 1,
      );
      return {
        ...next,
      };
    }

    // console.log(
    //   `[DEBUG] Recieved response from model "${this.model}". Used tokens: ${
    //     res.usage?.total_tokens ??
    //     baseContextLength +
    //       threadContextLength +
    //       JSON.stringify(res.choices[0].message).length / 3
    //   }`,
    // );

    return {
      ...res.choices[0].message,
    };
  }
}

const trimThreadToContextSize = (
  thread: ChatCompletionMessageParam[],
  maxSize: number,
) => {
  // Since last message is the most important, we reverse the thread
  const reversedThread = thread.reverse();

  let currentSize = 0;
  const allowedReverseThread = [];
  for (let i = 0; i < reversedThread.length; i++) {
    const msg = reversedThread[i];
    currentSize +=
      msg.content !== null
        ? typeof msg.content === "string"
          ? msg.content.length * 3 + 20
          : JSON.stringify(msg.content).length * 3
        : JSON.stringify(msg).length * 3;
    if (currentSize > maxSize) break; // all following messages are too long -> forget them

    allowedReverseThread.push(msg);
  }

  // Reverse them back, so that latest message is back to last!
  return [...allowedReverseThread.reverse()];
};
