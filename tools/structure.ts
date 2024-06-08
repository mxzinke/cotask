import { Tool } from ".";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

interface DirectoryStructureParams {
  path: string;
  depth?: number;
}

export default class DirectoryStructure extends Tool<DirectoryStructureParams> {
  constructor(private readonly absoluteCwd: string) {
    super({
      id: "directory_structure",
      name: "Get Directory Structure",
      description: "Get the complete directory structure (recursive tree).",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path to the directory to scan.",
            examples: ["./", "./src"],
          },
          depth: {
            type: "number",
            description:
              "The depth of the directory structure to scan (default is 3).",
            min: 1,
            max: 5,
            default: 3,
          },
        },
        required: ["path"],
      },
    });
  }

  async execute(params: DirectoryStructureParams) {
    const directoryStructure = await getDirectoryStructure(
      join(this.absoluteCwd, params.path),
      params.depth ?? 3,
    );
    return `Project Structure (Tree):\n${directoryStructure}`;
  }
}

const ignoreDirectories = [
  ".git",
  ".idea",
  ".m2",
  "__pycache__",
  "node_modules",
  ".venv",
  ".gitignore",
  ".gitkeep",
  ".DS_Store",
  ".vscode",
  ".next",
  "dist",
  "build",
  "out",
  "venv",
  "env",
  "logs",
  "data",
  "Thumbs.db",
  "desktop.ini",
  ".env.local",
];

const getDirectoryStructure = async (
  dir: string,
  depth: number,
  indent: string = "",
): Promise<string> => {
  if (depth === 0) return "";

  if (!existsSync(dir)) return `Directory does not exist: ${dir}`;
  const files = await readdir(dir);

  if (files.length === 0) return "This directory is empty.";

  let structure = "";
  for (const file of files) {
    if (ignoreDirectories.includes(file)) continue;

    const filePath = join(dir, file);
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      structure += `${indent}${file}/\n`;
      structure += await getDirectoryStructure(
        filePath,
        depth - 1,
        indent + "  | ",
      );
    } else {
      structure += `${indent}${file}\n`;
    }
  }
  return structure;
};
