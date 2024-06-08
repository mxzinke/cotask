import { Tool } from ".";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

interface OpenFileParams {
  filePath: string;
}

export default class OpenFile extends Tool<OpenFileParams> {
  constructor(private readonly absoluteCwd: string) {
    super({
      id: "open_file",
      name: "Open a File",
      description: "Get the content of a file by provided file path.",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description:
              "The relative path to the file from the current working directory.",
            examples: ["./src/index.js", "./README.md"],
          },
        },
        required: ["filePath"],
      },
    });
  }

  async execute(params: OpenFileParams) {
    const filePath = join(this.absoluteCwd, params.filePath);

    if (!existsSync(filePath)) return `File not found: ${filePath}`;

    console.log(`[ACTION] Opened file: '${params.filePath}'`);

    try {
      const content = await readFile(filePath, "utf8");
      return `// ${filePath}\n\n${content
        .split("\n")
        // TODO: Adjust line format
        .map((line, idx) => `${idx + 1} | ${line}`)
        .join("\n")}`;
    } catch (error) {
      return `Could not open file: ${error?.toString()}`;
    }
  }
}
