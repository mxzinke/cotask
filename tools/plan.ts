import { Tool } from ".";
import type { ProcessPhase } from "../types";

interface CreatePlanParams {
  taskSequence: Task[];
}
interface Task {
  phase: ProcessPhase;
  task: string;
  requiredOutput: string;
}

export default class CreatePlan extends Tool<CreatePlanParams> {
  constructor(
    private readonly exectuteTaskCallback: (task: Task) => Promise<void>,
  ) {
    super({
      id: "create_task_plan",
      name: "Create Plan and executes the tasks",
      description:
        "Creates a task plan as a task sequence and executes the tasks step by step.",
      parameters: {
        type: "object",
        properties: {
          taskSequence: {
            type: "array",
            description:
              "The sequence of tasks to be executed. Only define the tasks that are required to be executed.",
            items: {
              type: "object",
              properties: {
                phase: {
                  type: "string",
                  examples: [
                    "research",
                    "design",
                    "code",
                    "review",
                    "test",
                    "document",
                  ],
                  description:
                    "The phase of software development in which the task belongs to. 'research' can find information, 'design' is for creating a software architecture, 'code' to make changes to the codebase, 'review' will review the code changes against coding standards, 'test' will check that it didn't break anything and fulfills the requirements and 'document' will document the code changes.",
                },
                task: {
                  type: "string",
                  description: "The task to be executed.",
                  examples: [
                    "Research on how to implement the next-intl package.",
                    "Design a new architecture for the user management system.",
                    "Implement the user management system.",
                    "Review the code changes made to the user management system.",
                  ],
                },
                requiredOutput: {
                  type: "string",
                  description:
                    "The output required from the executed task. The type of defined output will be passed to the next tasks.",
                  examples: [
                    "Design guidelines for the user management system: ...",
                    "Steps to implement the next-intl package: ...",
                  ],
                },
              },
              required: ["phase", "task", "requiredOutput"],
            },
          },
        },
      },
    });
  }

  protected async execute(params: CreatePlanParams): Promise<string> {
    for (const task of params.taskSequence) {
      console.log(
        `📋 [${task.phase.toUpperCase()}]: Starting for '${task.task}'`,
      );
      await this.exectuteTaskCallback(task)
        .then(() => {
          console.log(`✅ [${task.phase.toUpperCase()}]: ${task.task}`);
        })
        .catch((err) => {
          console.error(`❌ [${task.phase.toUpperCase()}]: ${task.task}`);
          console.error(err);
        });
    }

    return "All tasks completed.";
  }
}
