# Multi-Format Build Skill

A reusable Claude skill that generates TypeScript build systems for skill/plugin projects, compiling a single `source/manifest.json` into 6 distribution formats.

## Output Formats

1. **Claude Plugin** — Ready-to-install Claude Code plugin
2. **OpenAI Functions** — Function calling schemas for GPT-4
3. **n8n Node** — Community node definition for n8n workflows
4. **Prompt Library** — Model-agnostic YAML prompt templates
5. **MCP Server** — Full TypeScript MCP server with tools
6. **Standalone CLI** — Command-line tool with subcommands

## How it works

Write your domain knowledge once as markdown files with a standardized manifest, and the generated `build.ts` compiles everything into all 6 formats automatically. Enable i18n to generate locale-specific outputs for every format.

This repo's `dyslexia-support-skill` and `dyscalculia-support-skill` are both built using this system — each has a single `source/manifest.json` that produces Claude plugins, OpenAI functions, n8n nodes, YAML prompts, MCP servers, and CLIs across 10 locales.

## Usage

When this skill is installed, ask Claude to:

- "Scaffold a new skill project for [domain]"
- "Add multi-format build output to my existing skill"
- "Generate a build system for my plugin"
- "Add internationalization to my skill"
- "Build my skill in Spanish and French"

## Internationalization (i18n)

The build system supports optional multi-locale output:

1. Add an `i18n` field to your `source/manifest.json` with `defaultLocale` and `locales`
2. Create translation files in `source/i18n/{locale}.json` for each non-default locale
3. Optionally provide localized markdown in `source/i18n/{locale}/skills/` and `source/i18n/{locale}/commands/`
4. Run `npm run build` to generate all locales, or `tsx build.ts --locale es` for a single locale

The build outputs locale subdirectories under each format (e.g., `dist/claude-plugin/es/`, `dist/openai/fr/`). RTL locales like Arabic and Hebrew automatically get direction metadata.

See `references/manifest-schema.md` for the full i18n schema reference.

## Manifest Schema

See `references/manifest-schema.md` for the full schema reference.

## Build Template

See `references/build-template.md` for the canonical domain-agnostic build script.

## License

MIT
