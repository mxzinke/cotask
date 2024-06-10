# CoTask

CoTask is your co-worker which can help you develop features and chase bugs faster.

Your new co-worker is able to:

- **Strong Reasoning** - CoTask understands your task deeply and can solve highly complex task
- **Research on Internet** - With CoTask Cloud it searches for solutions of errors or issues online
- **Understand Codebase** - CoTask remembers your entire codebase (unlimited size, by utilizing RAG) and knows which files to edit
- **Make Changes** - Other than ChatGPT or else can CoTaks apply the right patches with high code quality
- **Suggests commands** - Missing dependencies? Running tests? CoTask has you covered and suggests you commands.

## Install

CoTask is currently only available for MacOS (both Intel and M-series) and Linux (x86 and ARM64). Install it with:

```bash
curl -o https://github.com/mxzinke/cotask ... # TODO: Set this up on first release
```

## Usage

Please signup at the [CoTask Cloud](https://cotask/signup) to get an `Access Key` for CoTask. When signing up, you get 500 credits to start trying it. If you want to use the open source version, read the section 'Open Source Version (Free)' below.

Execute the following command to login into CoTask Cloud:

```bash
cotask login --key <CoTask-Cloud-API-Key>
```

To fire CoTask up you can use the following command which includes a string of the task description

```bash
cotask run "<Here comes your task description, what CoTask should accomplish>"
```

For example you can let him setup a new project, update a specific API endpoint of your existing app or let him implement a new SQL query for the script your are currently working on. The possibilities are endless. Let CoTask try to solve it all.

> Note: CoTask will create a `.cotask` folder where it stores it states, secrets and files. Do NOT commit this folder!

CoTask will create, update and remove files of code which you can see git changes. He will also do online research on documentation, pull information from URLs you provided and more. For security reasons it is required, that you approve every command executed by CoTask. This behavior can be disabled by adding `--unsafe-command` to the command.

## Open Source Version (Free)

The application at the open source version is the same and almost all functionallity is the same. The missing piece is the ability of CoTask to search in the internet and the fine-tuned or high-quality models where made for the use cases.

For generating tasks, code and drafting a solution it uses the OpenAI API (with `gpt-3.5-turbo` for best efficency). You can get a API-Key by signing up and generating an API-Key on the [Platform Dashboard of OpenAI](https://platform.openai.com/api-keys).

Put in the API-Key by executing the following command:

```bash
cotask login --use-opensource --key <OpenAI-Key>
```

The key is than saved and can be found in `~/.cotask/key`. Please note, that by this the CoTask Cloud Key is removed.

## How it works

[Learn more about the concept in the documentation.](./docs/concept.md)

## Changelog

- **2024-06-08**: CoTask is available with it's first version on GitHub.
- **2024-03-02**: Initial research and experiements for developing a CLI-based assistent
