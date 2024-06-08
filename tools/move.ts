import { join } from "node:path";
import { Tool } from ".";
import { exists } from "node:fs/promises";
import { move } from "fs-extra";

interface MoveFileParams {
  currentPath: string;
  newPath: string;
}

export default class MoveFile extends Tool<MoveFileParams> {
  constructor(private readonly absoluteCwd: string) {
    super({
      id: "move_file",
      name: "Move a File/Directory",
      description:
        "Moves a file or directory by its relative path to a new (relative) path.",
      parameters: {
        type: "object",
        properties: {
          currentPath: {
            type: "string",
            description:
              "The current relative path to the file (from the current working directory).",
            examples: ["./src/index.js", "./README.md"],
          },
          newPath: {
            type: "string",
            description:
              "The new relative path to the file (from the current working directory), where it should be moved to.",
            examples: ["./src/backend/index.js", "./docs/README.md"],
          },
        },
        required: ["currentPath", "newPath"],
      },
    });
  }

  async execute(params: MoveFileParams) {
    const filePath = join(this.absoluteCwd, params.currentPath);
    if (!(await exists(filePath))) {
      return `File ${params.currentPath} (currentPath) does not exist. Can't move.`;
    }

    const newFilePath = join(this.absoluteCwd, params.newPath);
    if (await exists(newFilePath)) {
      return `File ${params.newPath} (newPath) already exists. Can't overwrite existing file.`;
    }

    try {
      await move(filePath, newFilePath);
    } catch (error) {
      console.error(`[ACTION] Error moving file: ${error}`);
      return `Error moving file ${params.currentPath}`;
    }

    console.log(
      `[ACTION] Moved file: '${params.currentPath}' to '${params.newPath}'`,
    );

    return `Moved file from '${params.currentPath}' to '${params.newPath}'`;
  }
}
