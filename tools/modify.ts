import { Tool } from ".";
import { join } from "node:path";
import { readFile } from "fs/promises";
import { ensureFile, outputFile } from "fs-extra";

interface ModifyFileParams {
  filePath: string;
  content: string;
  mode: "add" | "modify" | "remove" | "overwrite";
  from_line?: number;
  to_line?: number;
}

export default class ModifyFile extends Tool<ModifyFileParams> {
  constructor(private readonly absoluteCwd: string) {
    super({
      id: "modify_file",
      name: "Modify a File",
      description:
        "Modify the file by modifying lines or overwriting everything. If the file does not exist, it will be created automatically.",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description:
              "The relative path to the file from the current working directory.",
            examples: ["./src/index.js", "./README.md"],
          },
          diffs: {
            type: "array",
            items: {
              type: "string",
              description:
                "The changes to be made in format similar to a git diff block. Start with the lines cursor (e.g. '@@ -1,4 +1,4 @@'). Prefix with '+' to add a line, '-' to remove a line, and ' ' to keep a line.",
              examples: [],
            },
          },
        },
        required: ["filePath", "diffs"],
      },
    });
  }

  async execute({
    filePath: relativePath,
    content,
    mode,
    from_line,
    to_line,
  }: ModifyFileParams) {
    const filePath = join(this.absoluteCwd, relativePath);

    if (mode === "overwrite") {
      await outputFile(filePath, content);
      return `// Overwritten ${filePath}\n\n${content
        .split("\n")
        .map((line, idx) => `${idx + 1} | ${line}`)
        .join("\n")}`;
    }

    await ensureFile(filePath);
    const originalConent = await readFile(filePath, "utf8").catch(() => "");
    const fileLines = originalConent.split("\n");

    const startLine = from_line ?? 1;
    const endLine = to_line ?? startLine;

    if (mode === "add") {
      fileLines.splice(startLine - 1, 0, content);
    } else if (mode === "modify") {
      fileLines.splice(
        startLine - 1,
        endLine - startLine + 1,
        ...content.split("\n"),
      );
    } else if (mode === "remove") {
      fileLines.splice(startLine - 1, endLine - startLine + 1);
    }

    const newContent = fileLines.join("\n");
    await outputFile(filePath, newContent);

    return `// Updated ${filePath}\n\n${newContent
      .split("\n")
      // TODO: Adjust line format
      .map((line, idx) => `${idx + startLine} | ${line}`)
      .join("\n")}`;
  }
}
