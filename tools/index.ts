import type {
  ChatCompletionFunctionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
  FunctionParameters,
} from "openai/resources/index.mjs";

export interface ToolDefinition {
  // e.g. "summarize_text" or "execute_command"
  id: string;
  // e.g. "Summarize Text" or "Execute Command"
  name: string;
  description: string;
  parameters: FunctionParameters;
}

// Tools are executed on low level and are not supposed to have AI model usage
// It is always a trival method of making something happen or retrieving some specific data
export abstract class Tool<FuncParams> {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  protected readonly parameters: FunctionParameters;

  constructor(definition: ToolDefinition) {
    this.id = definition.id;
    this.name = definition.name;
    this.description = definition.description;
    this.parameters = definition.parameters;
  }

  public run(
    callId: string,
    params: FuncParams,
  ): Promise<ChatCompletionToolMessageParam> {
    console.log("[ACTION] Running", this.name);
    return this.execute(params)
      .then((res) => {
        //console.log(`[ACTION] From '${this.name}':\n${res}\n`);
        return res;
      })
      .then((content) => ({
        role: "tool",
        tool_call_id: callId,
        content,
      }));
  }

  public runLegacy(
    params: FuncParams,
  ): Promise<ChatCompletionFunctionMessageParam> {
    console.log("[ACTION] Running", this.name);
    return this.execute(params)
      .then((res) => {
        //console.log(`[TOOL] From '${this.name}':\n${res}\n`);
        return res;
      })
      .then((content) => ({
        name: this.id,
        role: "function",
        content,
      }));
  }

  protected abstract execute(params: FuncParams): Promise<string>;

  public toOpenSpec(): ChatCompletionTool {
    return {
      type: "function",
      function: {
        name: this.id,
        description: this.description,
        parameters: this.parameters,
      },
    };
  }
}
