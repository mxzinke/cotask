import { join } from "node:path";
import { Tool } from ".";
import { exists, unlink } from "node:fs/promises";

interface DeleteFileParams {
  filePath: string;
}

export default class DeleteFile extends Tool<DeleteFileParams> {
  constructor(private readonly absoluteCwd: string) {
    super({
      id: "delete_file",
      name: "Deletes a File",
      description: `Deletes a file by its relative path.`,
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

  async execute(params: DeleteFileParams) {
    const filePath = join(this.absoluteCwd, params.filePath);
    if (!(await exists(filePath))) {
      return `File ${params.filePath} does not exist. Nothing to delete.`;
    }

    try {
      await unlink(filePath);
    } catch (error) {
      console.error(`[ACTION] Error deleting file: ${error}`);
      return `Error deleting file ${params.filePath}`;
    }

    console.log(`[ACTION] Delete file: '${params.filePath}'`);

    return `Deleted file ${params.filePath}`;
  }
}
