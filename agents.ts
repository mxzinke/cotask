import { generateResponse } from "./lib/generate";
import type { AIModel } from "./lib/models";
import type { AIModels } from "./models";
import type { Tool } from "./tools";
import ExecuteCommand from "./tools/command";
import ModifyFile from "./tools/modify";
import MoveFile from "./tools/move";
import OpenFile from "./tools/open";
import CreatePlan from "./tools/plan";
import DirectoryStructure from "./tools/structure";
import { ProcessPhase } from "./types";

interface Agent {
  prompt: string;
  tools: Tool<unknown>[];
  onResponse: (response: string) => void;
  toUserPrompt: (definition: {
    task: string;
    requiredOutput: string;
  }) => string;
  model: AIModel;
}

export async function getAgents(
  models: AIModels,
): Promise<Record<ProcessPhase, Agent>> {
  const workingDir = process.cwd();

  const projectKnowledge: string[] = [];
  const codeChanges: string[] = [];
  let forNextDeveloper: string = "";

  const agentsByPhase: Record<ProcessPhase, Agent> = {
    [ProcessPhase.Plan]: {
      prompt:
        "You are an expert project manager for software development. You are tasked with the finding the exact requirements for solving the given task. Please create a step-by-step plan for the development team.",
      tools: [
        new DirectoryStructure(workingDir),
        new CreatePlan(async (task) => {
          const agent = agentsByPhase[task.phase];
          if (!agent)
            return console.error(
              "Mistake on task scheduling:",
              `Phase ${task.phase.toUpperCase()} not found.`,
            );

          const response = await generateResponse(
            [{ role: "user", content: agent.toUserPrompt(task) }],
            {
              model: agent.model,
              systemPrompt: agent.prompt,
              tools: agent.tools,
            },
          );

          agent.onResponse(response.content ?? "");
        }),
      ], // TODO: add tool to create the plan
      model: models.fast,
      toUserPrompt: (definition: { task: string; requiredOutput: string }) =>
        `## Your Task:\n${definition.task}\n\n## Required Output: ${definition.requiredOutput}`,
      onResponse: (res: string) => console.log("[PLANER]", res),
    },
    [ProcessPhase.Design]: {
      prompt:
        "You are a highly skilled software architect. You've got information about your task and documents from the coworkers in your project (e.g. details about the project, research and more). You're goal is to designing the software architecture for a project. Please provide a detailed design document including the architecture, data flow, and description of components. The design document will be used by the development team to implement the solution. Use the tools to save the design document as Markdown. Only output the design document in the final response.",
      tools: [
        new DirectoryStructure(workingDir),
        new OpenFile(workingDir),
        new ModifyFile(workingDir),
        new MoveFile(workingDir),
      ],
      model: models.quality,
      toUserPrompt: (definition: { task: string; requiredOutput: string }) =>
        `## Your Task:\n${definition.task}\n\n## Required Output for project documentation: ${definition.requiredOutput}`,
      onResponse: (response: string) => projectKnowledge.push(response),
    },
    [ProcessPhase.Research]: {
      prompt:
        "You are a researcher specialized on software engineering. You are tasked with finding the best technology solution for a given task. Please first research for the best solution and think the pros and cons of the solution you found. And second, in your final response, please provide a summary of the solution you found including code examples and step-by-step instructions for the developers.",
      tools: [],
      model: models.online,
      toUserPrompt: (definition: { task: string; requiredOutput: string }) =>
        `## Your Task:\n${definition.task}\n\n## Required Output for developers: ${definition.requiredOutput}`,
      onResponse: (response: string) => {
        forNextDeveloper = response;
        return;
      },
    },
    [ProcessPhase.Code]: {
      prompt:
        "You are a highly experienced software developer and tasked with implementing software for a project. You've got a specific task and information about how to implement it. Please use your tools to implement the solution. Just provide a summary of what changes you made in the final response.",
      tools: [
        new ExecuteCommand(workingDir),
        new DirectoryStructure(workingDir),
        new OpenFile(workingDir),
        new ModifyFile(workingDir),
        new MoveFile(workingDir),
      ],
      model: models.fast, // Check if this is the right model
      toUserPrompt: (definition: { task: string; requiredOutput: string }) =>
        `## Your Task:\n${definition.task}\n\n## Required output (for documentation reasons): ${definition.requiredOutput}`,
      onResponse: (response: string) => codeChanges.push(response),
    },
    [ProcessPhase.Review]: {
      prompt:
        "You are a highly experienced senior software engineer and tasked with reviewing the code changes made by a junior software developer. Please first search for code which does not meet the code quality standards or could introduce potential bugs. Second, adjust the code according the issues you've found. Please provide a summary of what adjustments you made in the final response.",
      tools: [
        new ExecuteCommand(workingDir),
        new DirectoryStructure(workingDir),
        new OpenFile(workingDir),
        new ModifyFile(workingDir),
        new MoveFile(workingDir),
      ],
      model: models.fast,
      toUserPrompt: (definition: { task: string; requiredOutput: string }) =>
        `## Code Changes (made by developers):\n- ${codeChanges.join(
          "\n- ",
        )}\n\n## Your Task:\n${
          definition.task
        }\n\n## Required output (for documentation reasons): ${
          definition.requiredOutput
        }`,
      onResponse: (response: string) => codeChanges.push(response),
    },
    [ProcessPhase.Test]: {
      prompt:
        "You are a software tester and tasked with testing the software for a project. You've got information about the project and the test cases. Please use your tools to write tests and test the software. Provide a summary of the changes (to test) you've made and the final test results in the response.",
      tools: [
        new ExecuteCommand(workingDir),
        new DirectoryStructure(workingDir),
        new OpenFile(workingDir),
        new ModifyFile(workingDir),
        new MoveFile(workingDir),
      ],
      model: models.fast,
      toUserPrompt: (definition: { task: string; requiredOutput: string }) =>
        `## Code Changes (made by developers):\n- ${codeChanges.join(
          "\n- ",
        )}\n\n## Project Information:\n- ${projectKnowledge.join(
          "\n- ",
        )}\n\n## Your Task:\n${
          definition.task
        }\n\n## Required output (for documentation reasons): ${
          definition.requiredOutput
        }`,
      onResponse: (response: string) => codeChanges.push(response),
    },
    [ProcessPhase.Document]: {
      prompt:
        "You are a technical writer and tasked with writing documentation for a project. You've got information about the project, what changes has been made and the document structure. Please use your tools to write the documentation. Just provide the word 'FINSHED' (to tell your done) in the final response.",
      tools: [
        new ExecuteCommand(workingDir),
        new DirectoryStructure(workingDir),
        new OpenFile(workingDir),
        new ModifyFile(workingDir),
        new MoveFile(workingDir),
      ],
      model: models.fast,
      toUserPrompt: (definition: { task: string; requiredOutput: string }) =>
        `## Project Information:
- ${projectKnowledge.join("\n- ")}

## Code Changes (made by developers):
- ${codeChanges.join("\n- ")}

## ${new DirectoryStructure(workingDir).execute({
          path: ".",
          depth: 5,
        })}

## Your Task:
${definition.task}`,
      onResponse: (_: string) => null,
    },
  };

  return agentsByPhase;
}
