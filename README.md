# CoTask

CoTask is your co-worker which can help you develop features and chase bugs faster.

Your new co-worker is able to:

- Strong reasoning about the task you give
- Finds the right file to edit in your entire codebase (unlimited size)
- Applies the right patches with high code quality
- Suggests commands (e.g. for installing packages or running things)

CoTask is currently only available for MacOS (both Intel and M-series).

## Usage

Execute the following command to login into CoTask Cloud:

```bash
cotask login
```

> Note: CoTask will create a `.cotask` folder where it stores it states, secrets and files. Do NOT commit this folder!

Start it than up in the directory CoTask should work in, by executing the following command:

```bash
cotask start
```

Or in case you just want to run it for one task, you can use the following comand:

```bash
cotask task "<Here comes your task description, what CoTask should accomplish>"
```

CoTask will create, update and remove files of code which you can see git changes. He will also do online research on documentation, pull information from URLs you provided and more. For security reasons it is required, that you accept every command executed by CoTask. This behavior can be disabled by adding `--unsecure-command` to the command.

## Under the hood

CoTask is not creating any secure sandbox and is running where you execute him. He is build upon the OpenAIs modal.

--TODO: Write about the concept of how it works internally.

> **Running it without CoTask Cloud**
> It's possible to set your OpenAI API Key to use it without logging into it by setting the `COTASK_OPENAI_API_KEY` env-variable when running any command. In this case `cotask login` is not necessary.
> Please note, that online search functionallity is not available in this case. This impacts the quality of code output very strong.

## Changelog

- 2024-06-08: CoTask is available with it's first version on GitHub.
