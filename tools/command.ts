import { Tool } from ".";
import { platform, arch } from "node:os";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

interface ExecuteCommandParams {
  command: string;
  timeout?: number;
}

export default class ExecuteCommand extends Tool<ExecuteCommandParams> {
  constructor(private readonly absoluteCwd: string) {
    super({
      id: "execute_command",
      name: "Execute a Command",
      description: `Execute a command on the commandline interface (for ${platform()}, ${arch()}). E.g. for installing packages, listing files, etc. Will return stdout, stderr, and exit code.`,
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description:
              "The command to execute (e.g. bash command). Make sure to use non-interactive commands and all required parameters. Changing the current working directory is not supported.",
            examples: ["npm install", "ls -la ./docs", "rm -rf ./node_modules"],
          },
          timeout: {
            type: "number",
            description:
              "Optional: The maximum time in seconds to wait for the command to finish executing. Only use this when you think the default of 300 seconds is not enough.",
            default: 300,
          },
        },
        required: ["command"],
      },
    });
  }

  async execute(params: ExecuteCommandParams) {
    console.log(
      `[ACTION] CoTask want to execute the command: '${params.command}'`,
    );
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const userConcens = await new Promise<string>((resolve) =>
      rl.question("[ACTION] Comfirm? y / n [y]: ", resolve),
    );
    if (
      !userConcens &&
      !(userConcens.startsWith("y") || userConcens.startsWith("Y"))
    ) {
      console.log("[ACTION] The command execution is denied.");
      return "User denied this command execution.";
    }

    console.log(`[ACTION] Executing command: ${params.command}`);
    const { stdout, stderr, exitCode } = await executeCommand(params.command, {
      timeout: params.timeout ?? 300,
      currentDir: this.absoluteCwd,
    });

    return (
      !!stderr
        ? [
            "Command executed with Error:",
            `Stdout:\n${stdout}`,
            `Stderr:${stderr}`,
            `Exit code: ${exitCode}`,
          ]
        : [`Stdout:\n${stdout}`, `Stderr:${stderr}`, `Exit code: ${exitCode}`]
    ).join("\n\n");
  }
}

const executeCommand = (
  command: string,
  { timeout, currentDir }: { timeout: number; currentDir: string },
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  // Determine the shell to use based on the operating system
  const shell = platform() === "win32" ? "cmd.exe" : "bash";

  // Spawn the process with the appropriate shell and arguments
  const child = spawn(
    shell,
    platform() === "win32" ? ["/c", command] : ["-c", `${command}`],
    {
      timeout: timeout * 1000,
      windowsHide: true,
      cwd: currentDir,
      env: {
        ...process.env,
        DEBIAN_FRONTEND: "noninteractive",
      },
    },
  );

  return new Promise((resolve, reject) => {
    // Handle stdout data
    const stdout: string[] = [];
    child.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
      stdout.push(data.toString());
    });

    // Handle stderr data
    const stderr: string[] = [];
    child.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
      stderr.push(data.toString());
    });

    // Handle process exit
    child.on("close", (code) => {
      resolve({
        stdout: stdout.join("\n"),
        stderr: stderr.join("\n"),
        exitCode: code || 0,
      });
      console.log(`child process exited with code ${code}`);
    });
    child.on("disconnect", () => reject("child process disconnected"));
    child.on("error", (err) => reject(err));
  });
};
