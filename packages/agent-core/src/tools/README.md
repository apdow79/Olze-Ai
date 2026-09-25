# Agent tools

Core tools (read/write/edit/delete/search/run/install/deploy) live in `../index.ts`
as `defaultTools`, each classified by action class (`read | write | execute | deploy | delete`).

Future plugins (Phase 30) register additional `ToolDefinition`s here — e.g.
`olze-plugin-stripe` could add a `create_checkout_link` tool with `execute` risk level.
All tools flow through the same confirmation gate in the agent loop.
