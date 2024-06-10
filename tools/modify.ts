import { Tool } from ".";
import { join } from "node:path";
import { readFile } from "fs/promises";
import { ensureFile, outputFile } from "fs-extra";
import { applyDiff } from "../lib/git-differ";

interface ModifyFileParams {
  filePath: string;
  diffs: (string | { cursor: string; content: string })[]; // gpt-3.5 makes mistakes in json format, thats why...
}

// TODO: Implement diff format!
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
                "The changes to be made in format similar to a git diff block. Start with the lines cursor which tells where the changes spans (e.g. '@@ -1,4 +1,3 @@', means changes spanning from line 1 to 4 on before changes and 1 to 3 on revised document). Prefix with '+' to add a line, '-' to remove a line, and ' ' to keep a line.",
              examples: [
                `@@ -1,5 +1,5 @@
-This is the first sentence of the original document.
+This is the first sentence of the revised document.
This line remains unchanged.
-This line will be removed.
+This line will be added.`,
                `@@ -103,106 +103,105 @@
-This is the first sentence of the original document.
+This is the first sentence of the revised document.
This line remains unchanged.
-This line will be removed, no new file will be added.`,
                `@@ -0,0 +1,5 @@
+Line 1
+Line 2
+Line 3
+Line 4
+Line 5`,
              ],
            },
          },
        },
        required: ["filePath", "diffs"],
      },
    });
  }

  async execute({ filePath: relativePath, diffs }: ModifyFileParams) {
    console.log("⚠️ [ACTION] Modify File:", relativePath);

    const filePath = join(this.absoluteCwd, relativePath);

    await ensureFile(filePath);
    const originalContent = await readFile(filePath, "utf8").catch(() => "");

    let newContent = originalContent;
    for (const diff of diffs) {
      if (typeof diff === "string" && diff.startsWith("@@")) {
        newContent = applyDiff(originalContent, diff);
      }

      if (typeof diff === "object" && diff.cursor && diff.content) {
        newContent = applyDiff(
          originalContent,
          diff.cursor + "\n" + diff.content,
        );
      }

      console.error(
        "Invalid diff format:",
        typeof diff !== "string" ? JSON.stringify(diff) : diff,
      );
      return `// Invalid diff format: ${JSON.stringify(diff)}`;
    }

    await outputFile(filePath, newContent);

    return `// Updated ${filePath} with diffs:\n\n${diffs.join("\n\n")}`;
  }
}
