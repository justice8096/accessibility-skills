import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// SECURITY: Input Sanitization
// ============================================================================

const VALID_FORMATS: ReadonlySet<string> = new Set(["claude-plugin", "openai", "n8n", "prompts", "mcp", "cli", "all"]);
const SAFE_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/** Validate a name used in file path construction (locale, skill name, command name) */
function sanitizeName(name: string, label: string): string {
  const clean = basename(name); // strip any directory traversal
  if (!SAFE_NAME_RE.test(clean)) {
    throw new Error(`Invalid ${label}: "${name}" — must be alphanumeric with hyphens/dots/underscores only`);
  }
  return clean;
}

/** Escape a string for safe insertion into generated TypeScript code */
function escapeForCodegen(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/`/g, "\\`").replace(/\$/g, "\\$").replace(/\n/g, "\\n");
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ParameterProperty {
  type: string;
  description: string;
  default?: string | boolean | number;
  items?: { type: string };
}

// ============================================================================
// I18N TYPE DEFINITIONS
// ============================================================================

interface I18nConfig {
  defaultLocale: string;
  locales: string[];
  fallbackStrategy?: "default" | "key";
  localizedMarkdown?: boolean;
}

interface LocaleParameterStrings {
  description?: string;
}

interface LocaleCommandStrings {
  displayName?: string;
  description?: string;
  parameters?: Record<string, LocaleParameterStrings>;
}

interface LocaleSkillStrings {
  displayName?: string;
  description?: string;
}

interface LocaleTemplateStrings {
  displayName?: string;
  description?: string;
}

interface LocaleStrings {
  metadata?: { name?: string; description?: string };
  skills?: Record<string, LocaleSkillStrings>;
  commands?: Record<string, LocaleCommandStrings>;
  templates?: Record<string, LocaleTemplateStrings>;
}

interface CommandParameters {
  type: string;
  properties: Record<string, ParameterProperty>;
  required: string[];
}

interface Command {
  name: string;
  displayName: string;
  description: string;
  path: string;
  parameters: CommandParameters;
  keywords: string[];
}

interface Skill {
  name: string;
  displayName: string;
  description: string;
  path: string;
  keywords: string[];
}

interface Template {
  name: string;
  displayName: string;
  description: string;
  path: string;
}

interface Metadata {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  repository?: string;
  keywords: string[];
}

interface Manifest {
  metadata: Metadata;
  skills: Skill[];
  commands: Command[];
  templates: Template[];
  i18n?: I18nConfig;
}

type FormatName = "claude-plugin" | "openai" | "n8n" | "prompts" | "mcp" | "cli";

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

interface CLIArgs {
  format: FormatName | "all";
  locale: string | "all";
  watch: boolean;
  clean: boolean;
  validateOnly: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = { format: "all", locale: "all", watch: false, clean: false, validateOnly: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--format" && args[i + 1]) { result.format = args[++i] as FormatName | "all"; }
    else if (arg.startsWith("--format=")) { result.format = arg.split("=")[1] as FormatName | "all"; }
    else if (arg === "--locale" && args[i + 1]) { result.locale = args[++i]; }
    else if (arg.startsWith("--locale=")) { result.locale = arg.split("=")[1]; }
    else if (arg === "--watch") { result.watch = true; }
    else if (arg === "--clean") { result.clean = true; }
    else if (arg === "--validate-only") { result.validateOnly = true; }
  }
  // Validate format
  if (!VALID_FORMATS.has(result.format)) {
    throw new Error(`Invalid --format "${result.format}". Valid: ${[...VALID_FORMATS].join(", ")}`);
  }
  // Validate locale (allow "all" or safe name patterns)
  if (result.locale !== "all") { sanitizeName(result.locale, "locale"); }
  return result;
}

// ============================================================================
// SIMPLE YAML STRINGIFIER (zero dependencies)
// ============================================================================

function stringifyYaml(obj: unknown, indent: number = 2): string {
  const lines: string[] = [];

  function scalar(val: unknown): string {
    if (val === null || val === undefined) return "null";
    if (typeof val === "string") {
      if (val.includes("\n") || val.includes(":") || val.includes("#") || val.includes("'")) {
        return "'" + val.replace(/'/g, "''") + "'";
      }
      return val;
    }
    return String(val);
  }

  function isScalar(val: unknown): boolean {
    return val === null || val === undefined || typeof val !== "object";
  }

  function emitValue(val: unknown, depth: number): void {
    if (isScalar(val)) { lines.push(scalar(val)); return; }
    if (Array.isArray(val)) { emitArray(val, depth); return; }
    emitObject(val as Record<string, unknown>, depth);
  }

  function emitArray(arr: unknown[], depth: number): void {
    if (arr.length === 0) { lines.push("[]"); return; }
    const pad = " ".repeat(depth * indent);
    for (const item of arr) {
      if (isScalar(item)) {
        lines.push(pad + "- " + scalar(item));
      } else if (Array.isArray(item)) {
        lines.push(pad + "-");
        emitArray(item, depth + 1);
      } else {
        const entries = Object.entries(item as Record<string, unknown>);
        if (entries.length === 0) { lines.push(pad + "- {}"); continue; }
        const [firstKey, firstVal] = entries[0];
        if (isScalar(firstVal)) {
          lines.push(pad + "- " + firstKey + ": " + scalar(firstVal));
        } else {
          lines.push(pad + "- " + firstKey + ":");
          emitValue(firstVal, depth + 2);
        }
        for (let i = 1; i < entries.length; i++) {
          emitKeyValue(entries[i][0], entries[i][1], depth + 1);
        }
      }
    }
  }

  function emitObject(obj: Record<string, unknown>, depth: number): void {
    const entries = Object.entries(obj);
    if (entries.length === 0) { lines.push("{}"); return; }
    for (const [key, value] of entries) { emitKeyValue(key, value, depth); }
  }

  function emitKeyValue(key: string, value: unknown, depth: number): void {
    const pad = " ".repeat(depth * indent);
    if (isScalar(value)) {
      lines.push(pad + key + ": " + scalar(value));
    } else {
      lines.push(pad + key + ":");
      if (Array.isArray(value)) { emitArray(value, depth + 1); }
      else { emitObject(value as Record<string, unknown>, depth + 1); }
    }
  }

  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    emitObject(obj as Record<string, unknown>, 0);
  } else { emitValue(obj, 0); }
  return lines.join("\n");
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function ensureDir(dirPath: string): void { mkdirSync(dirPath, { recursive: true }); }

function readMarkdown(filePath: string): string {
  try {
    let content = readFileSync(filePath, "utf-8");
    if (content.charCodeAt(0) === 0xfeff) { content = content.slice(1); }
    return content;
  } catch { console.warn("Warning: Could not read " + filePath); return ""; }
}

function log(message: string): void { console.log("[build] " + message); }
function logSuccess(message: string): void { console.log("\u2713 " + message); }
function logError(message: string): void { console.error("\u2717 " + message); }

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function toPascalCase(name: string): string {
  return name.split(/[-_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}
function toSnakeCase(name: string): string { return name.replace(/-/g, "_"); }

// ============================================================================
// I18N UTILITIES
// ============================================================================

const RTL_LOCALES = new Set(["ar", "he", "fa", "ur", "yi", "ps", "sd"]);

function isRtl(locale: string): boolean {
  return RTL_LOCALES.has(locale.split("-")[0].toLowerCase());
}

function loadLocaleStrings(locale: string): LocaleStrings | null {
  const safeLocale = sanitizeName(locale, "locale");
  const localePath = resolve(__dirname, "source/i18n/" + safeLocale + ".json");
  try {
    return JSON.parse(readFileSync(localePath, "utf-8")) as LocaleStrings;
  } catch {
    return null;
  }
}

function loadAllLocales(config: I18nConfig): Map<string, LocaleStrings> {
  const locales = new Map<string, LocaleStrings>();
  for (const locale of config.locales) {
    if (locale === config.defaultLocale) continue;
    const strings = loadLocaleStrings(locale);
    if (strings) { locales.set(locale, strings); }
    else { console.warn("Warning: Missing locale file for " + locale); }
  }
  return locales;
}

/** Create a localized copy of the manifest for a given locale */
function localizeManifest(manifest: Manifest, locale: string, strings: LocaleStrings): Manifest {
  const localized = JSON.parse(JSON.stringify(manifest)) as Manifest;
  if (strings.metadata) {
    if (strings.metadata.name) localized.metadata.name = strings.metadata.name;
    if (strings.metadata.description) localized.metadata.description = strings.metadata.description;
  }
  for (const skill of localized.skills) {
    const s = strings.skills?.[skill.name];
    if (s) {
      if (s.displayName) skill.displayName = s.displayName;
      if (s.description) skill.description = s.description;
    }
  }
  for (const cmd of localized.commands) {
    const c = strings.commands?.[cmd.name];
    if (c) {
      if (c.displayName) cmd.displayName = c.displayName;
      if (c.description) cmd.description = c.description;
      if (c.parameters) {
        for (const [paramName, paramStrings] of Object.entries(c.parameters)) {
          if (paramStrings.description && cmd.parameters.properties[paramName]) {
            cmd.parameters.properties[paramName].description = paramStrings.description;
          }
        }
      }
    }
  }
  for (const tmpl of localized.templates) {
    const t = strings.templates?.[tmpl.name];
    if (t) {
      if (t.displayName) tmpl.displayName = t.displayName;
      if (t.description) tmpl.description = t.description;
    }
  }
  return localized;
}

function loadLocalizedSkillMarkdown(skillName: string, locale: string, config: I18nConfig): string {
  const safeLocale = sanitizeName(locale, "locale");
  const safeName = sanitizeName(skillName, "skill name");
  if (config.localizedMarkdown && locale !== config.defaultLocale) {
    const localizedPath = resolve(__dirname, "source/i18n/" + safeLocale + "/skills/" + safeName + ".md");
    try { return readFileSync(localizedPath, "utf-8"); } catch { /* fall through to default */ }
  }
  return loadSkillMarkdown(skillName);
}

function loadLocalizedCommandMarkdown(commandName: string, locale: string, config: I18nConfig): string {
  const safeLocale = sanitizeName(locale, "locale");
  const safeName = sanitizeName(commandName, "command name");
  if (config.localizedMarkdown && locale !== config.defaultLocale) {
    const localizedPath = resolve(__dirname, "source/i18n/" + safeLocale + "/commands/" + safeName + ".md");
    try { return readFileSync(localizedPath, "utf-8"); } catch { /* fall through to default */ }
  }
  return loadCommandMarkdown(commandName);
}

// ============================================================================
// LOAD AND VALIDATE
// ============================================================================

function loadManifest(): Manifest {
  log("Loading manifest.json...");
  const manifestPath = resolve(__dirname, "source/manifest.json");
  const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
  if (!raw.metadata || !raw.metadata.name || !raw.metadata.version) {
    throw new Error("Manifest missing required metadata fields (name, version)");
  }
  if (!Array.isArray(raw.commands) || raw.commands.length === 0) {
    throw new Error("Manifest must have at least one command");
  }
  if (!Array.isArray(raw.skills)) { throw new Error("Manifest must have a skills array"); }
  if (!Array.isArray(raw.templates)) { raw.templates = []; }
  for (const cmd of raw.commands) {
    if (!cmd.parameters || !cmd.parameters.properties) {
      throw new Error(`Command "${cmd.name}" missing JSON Schema parameters`);
    }
  }
  logSuccess("Manifest loaded (" + raw.commands.length + " commands, " + raw.skills.length + " skills)");
  return raw as Manifest;
}

function loadSkillMarkdown(skillName: string): string {
  const safeName = sanitizeName(skillName, "skill name");
  return readMarkdown(resolve(__dirname, "source/skills/" + safeName + ".md"));
}
function loadCommandMarkdown(commandName: string): string {
  const safeName = sanitizeName(commandName, "command name");
  return readMarkdown(resolve(__dirname, "source/commands/" + safeName + ".md"));
}

// ============================================================================
// FORMAT 1: CLAUDE PLUGIN
// ============================================================================

function generateClaudePlugin(manifest: Manifest, locale?: string, i18nConfig?: I18nConfig): void {
  const suffix = locale && locale !== i18nConfig?.defaultLocale ? "/" + locale : "";
  log("Generating Claude Code plugin" + (suffix ? " (" + locale + ")" : "") + "...");
  const base = resolve(__dirname, "dist/claude-plugin" + suffix);
  ensureDir(base); ensureDir(resolve(base, "skills")); ensureDir(resolve(base, "commands"));
  const slug = toSlug(manifest.metadata.name);
  const plugin: Record<string, unknown> = {
    name: slug, version: manifest.metadata.version, description: manifest.metadata.description,
    author: manifest.metadata.author, license: manifest.metadata.license,
    keywords: manifest.metadata.keywords,
    skills: manifest.skills.map((s) => ({ name: s.name, description: s.description, path: "skills/" + s.name })),
    commands: manifest.commands.map((c) => ({ name: c.name, description: c.description, path: "commands/" + c.name + ".md" })),
  };
  if (locale) { plugin.locale = locale; if (isRtl(locale)) plugin.textDirection = "rtl"; }
  writeFileSync(resolve(base, "plugin.json"), JSON.stringify(plugin, null, 2));
  for (const skill of manifest.skills) {
    ensureDir(resolve(base, "skills/" + skill.name));
    const md = i18nConfig ? loadLocalizedSkillMarkdown(skill.name, locale || i18nConfig.defaultLocale, i18nConfig) : loadSkillMarkdown(skill.name);
    writeFileSync(resolve(base, "skills/" + skill.name + "/SKILL.md"), md);
  }
  for (const cmd of manifest.commands) {
    const md = i18nConfig ? loadLocalizedCommandMarkdown(cmd.name, locale || i18nConfig.defaultLocale, i18nConfig) : loadCommandMarkdown(cmd.name);
    writeFileSync(resolve(base, "commands/" + cmd.name + ".md"), md);
  }
  logSuccess("Claude plugin generated" + (suffix ? " (" + locale + ")" : ""));
}

// ============================================================================
// FORMAT 2: OPENAI FUNCTIONS
// ============================================================================

function generateOpenAIFunctions(manifest: Manifest, locale?: string, i18nConfig?: I18nConfig): void {
  const suffix = locale && locale !== i18nConfig?.defaultLocale ? "/" + locale : "";
  log("Generating OpenAI function schemas" + (suffix ? " (" + locale + ")" : "") + "...");
  ensureDir(resolve(__dirname, "dist/openai" + suffix));
  const functions = manifest.commands.map((cmd) => {
    const properties: Record<string, unknown> = {};
    const required: string[] = cmd.parameters.required || [];
    for (const [paramName, paramDef] of Object.entries(cmd.parameters.properties)) {
      const prop: Record<string, unknown> = { type: paramDef.type === "array" ? "array" : paramDef.type, description: paramDef.description };
      if (paramDef.items) prop.items = paramDef.items;
      if (paramDef.default !== undefined) prop.default = paramDef.default;
      properties[paramName] = prop;
    }
    return { type: "function", function: { name: toSnakeCase(cmd.name), description: cmd.description, parameters: { type: "object", properties, required } } };
  });
  const output: Record<string, unknown> = { functions };
  if (locale) { output.locale = locale; }
  writeFileSync(resolve(__dirname, "dist/openai" + suffix + "/functions.json"), JSON.stringify(functions, null, 2));
  logSuccess("OpenAI functions generated" + (suffix ? " (" + locale + ")" : ""));
}

// ============================================================================
// FORMAT 3: N8N NODE
// ============================================================================

function generateN8nNode(manifest: Manifest, locale?: string, i18nConfig?: I18nConfig): void {
  const suffix = locale && locale !== i18nConfig?.defaultLocale ? "/" + locale : "";
  log("Generating n8n node definition" + (suffix ? " (" + locale + ")" : "") + "...");
  ensureDir(resolve(__dirname, "dist/n8n" + suffix));
  const pascalName = toPascalCase(manifest.metadata.name);
  const slug = toSlug(manifest.metadata.name);
  const operations = manifest.commands.map((cmd) => ({ name: cmd.displayName, value: toSnakeCase(cmd.name), description: cmd.description }));
  const paramFields = manifest.commands.flatMap((cmd) =>
    Object.entries(cmd.parameters.properties).map(([paramName, paramDef]) => ({
      displayName: paramName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      name: paramName,
      type: paramDef.type === "array" ? "string" : paramDef.type === "boolean" ? "boolean" : "string",
      required: (cmd.parameters.required || []).includes(paramName),
      default: paramDef.default ?? "", description: paramDef.description,
      displayOptions: { show: { operation: [toSnakeCase(cmd.name)] } },
    }))
  );
  const node: Record<string, unknown> = {
    displayName: manifest.metadata.name, name: slug.replace(/-/g, ""), icon: "file:icon.svg",
    group: ["transform"], version: 1, description: manifest.metadata.description,
    defaults: { name: manifest.metadata.name }, inputs: ["main"], outputs: ["main"],
    properties: [{ displayName: "Operation", name: "operation", type: "options", options: operations, default: operations[0]?.value || "" }, ...paramFields],
  };
  if (locale) { node.locale = locale; }
  writeFileSync(resolve(__dirname, "dist/n8n" + suffix + "/" + pascalName + ".node.json"), JSON.stringify(node, null, 2));
  logSuccess("n8n node definition generated" + (suffix ? " (" + locale + ")" : ""));
}

// ============================================================================
// FORMAT 4: PROMPT LIBRARY
// ============================================================================

function generatePromptLibrary(manifest: Manifest, locale?: string, i18nConfig?: I18nConfig): void {
  const suffix = locale && locale !== i18nConfig?.defaultLocale ? "/" + locale : "";
  log("Generating prompt library" + (suffix ? " (" + locale + ")" : "") + "...");
  ensureDir(resolve(__dirname, "dist/prompts" + suffix));
  const promptIndex: Record<string, unknown> = {
    name: manifest.metadata.name + " Prompts", version: manifest.metadata.version,
    description: manifest.metadata.description, author: manifest.metadata.author,
    prompts: manifest.commands.map((cmd) => ({ id: cmd.name, name: cmd.displayName, description: cmd.description, file: cmd.name + ".yaml" })),
  };
  if (locale) { promptIndex.locale = locale; if (isRtl(locale)) promptIndex.direction = "rtl"; }
  writeFileSync(resolve(__dirname, "dist/prompts" + suffix + "/index.yaml"), stringifyYaml(promptIndex, 2));
  const expertise = manifest.skills.map((s) => s.description);
  for (const cmd of manifest.commands) {
    const prompt: Record<string, unknown> = {
      name: cmd.displayName, id: cmd.name, description: cmd.description,
      models: ["gpt-4", "gpt-4-turbo", "claude-3-opus", "claude-3-sonnet", "claude-3.5-sonnet"],
      context: { role: "You are an expert assistant for " + manifest.metadata.name + ". " + manifest.metadata.description, expertise },
      parameters: Object.entries(cmd.parameters.properties).map(([name, def]) => ({
        name, type: def.type, required: (cmd.parameters.required || []).includes(name), description: def.description, default: def.default,
      })),
      output: { format: "markdown", description: "Comprehensive " + cmd.displayName.toLowerCase() + " document" },
    };
    if (locale) { prompt.locale = locale; if (isRtl(locale)) prompt.direction = "rtl"; }
    writeFileSync(resolve(__dirname, "dist/prompts" + suffix + "/" + cmd.name + ".yaml"), stringifyYaml(prompt, 2));
  }
  logSuccess("Prompt library generated" + (suffix ? " (" + locale + ")" : ""));
}

// ============================================================================
// FORMAT 5: MCP SERVER
// ============================================================================

function generateMcpServer(manifest: Manifest, locale?: string, i18nConfig?: I18nConfig): void {
  const suffix = locale && locale !== i18nConfig?.defaultLocale ? "/" + locale : "";
  log("Generating MCP server" + (suffix ? " (" + locale + ")" : "") + "...");
  const base = resolve(__dirname, "dist/mcp-server" + suffix);
  ensureDir(resolve(base, "src/tools")); ensureDir(resolve(base, "src/knowledge"));
  ensureDir(resolve(base, "knowledge/skills")); ensureDir(resolve(base, "knowledge/commands"));
  const slug = toSlug(manifest.metadata.name);

  for (const cmd of manifest.commands) {
    const toolName = toSnakeCase(cmd.name);
    const requiredParams = cmd.parameters.required || [];
    const zodFields: string[] = []; const jsonSchemaProps: string[] = [];
    for (const [paramName, paramDef] of Object.entries(cmd.parameters.properties)) {
      let zField = "  " + paramName + ": z.";
      if (paramDef.type === "array") zField += "array(z.string())";
      else if (paramDef.type === "boolean") zField += "boolean()";
      else if (paramDef.type === "number") zField += "number()";
      else zField += "string()";
      if (!requiredParams.includes(paramName)) zField += ".optional()";
      zField += ","; zodFields.push(zField);
      let jsProp = "      " + sanitizeName(paramName, "param name") + ': { type: "' + escapeForCodegen(paramDef.type) + '", description: "' + escapeForCodegen(cmd.description) + '" }';
      jsonSchemaProps.push(jsProp);
    }
    const safeDesc = escapeForCodegen(cmd.description);
    const safeCmdName = escapeForCodegen(cmd.name);
    const toolCode = ['import { z } from "zod";', 'import { loadCommandContent } from "../knowledge/loader.js";', "",
      "const " + toolName + "Schema = z.object({", ...zodFields, "});", "",
      "export const " + toolName + 'Definition = { name: "' + toolName + '", description: "' + safeDesc + '",',
      "  inputSchema: { type: \"object\" as const, properties: {", ...jsonSchemaProps.map((p) => p + ","),
      "    }, required: [" + requiredParams.map((p) => '"' + escapeForCodegen(p) + '"').join(", ") + "] } };", "",
      "export async function handle(input: Record<string, unknown>): Promise<string> {",
      "  const validated = " + toolName + "Schema.parse(input);",
      '  const commandContent = await loadCommandContent("' + safeCmdName + '");',
      '  return JSON.stringify({ status: "success", command: "' + safeCmdName + '", message: "Tool executed.", commandPreview: commandContent.slice(0, 200), input: validated }, null, 2);',
      "}"].join("\n");
    writeFileSync(resolve(base, "src/tools/" + toolName + ".ts"), toolCode);
  }

  const loaderCode = ['import { readFileSync } from "fs";', 'import { resolve, dirname, basename } from "path";', 'import { fileURLToPath } from "url";', "",
    "const __filename = fileURLToPath(import.meta.url);", "const __dirname = dirname(__filename);", "",
    "const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;",
    "function safeName(id: string): string {",
    "  const clean = basename(id);",
    '  if (!SAFE_ID.test(clean)) throw new Error("Invalid identifier: " + id);',
    "  return clean;", "}", "",
    "const CACHE = new Map<string, string>();", "",
    "export async function loadSkillContent(skillId: string): Promise<string> {",
    "  const safe = safeName(skillId);",
    '  if (CACHE.has(safe)) return CACHE.get(safe)!;', "  try {",
    '    const p = resolve(__dirname, "../../knowledge/skills/" + safe + ".md");',
    '    const content = readFileSync(p, "utf-8");', "    CACHE.set(safe, content); return content;",
    '  } catch { return ""; }', "}", "",
    "export async function loadCommandContent(commandId: string): Promise<string> {",
    "  const safe = safeName(commandId);",
    '  try { return readFileSync(resolve(__dirname, "../../knowledge/commands/" + safe + ".md"), "utf-8"); }',
    '  catch { return ""; }', "}"].join("\n");
  writeFileSync(resolve(base, "src/knowledge/loader.ts"), loaderCode);

  const toolImports: string[] = []; const toolDefs: string[] = []; const toolHandlerCases: string[] = [];
  for (const cmd of manifest.commands) {
    const toolName = toSnakeCase(cmd.name);
    toolImports.push("import { " + toolName + "Definition, handle as handle_" + toolName + ' } from "./tools/' + toolName + '.js";');
    toolDefs.push("  " + toolName + "Definition,");
    toolHandlerCases.push('      case "' + toolName + '": return { content: [{ type: "text", text: await handle_' + toolName + "(args) }] };");
  }
  const indexCode = ['import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";',
    'import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";', "",
    ...toolImports, "", "const tools = [", ...toolDefs, "];", "",
    "async function main(): Promise<void> {",
    '  const server = new McpServer({ name: "' + slug + '-mcp", version: "' + manifest.metadata.version + '" });',
    "  const transport = new StdioServerTransport();",
    '  server.server.setRequestHandler("tools/list", async () => ({ tools }));',
    '  server.server.setRequestHandler("tools/call", async (request: { params: { name: string; arguments?: Record<string, unknown> } }) => {',
    "    const { name, arguments: args = {} } = request.params;", "    switch (name) {",
    ...toolHandlerCases, '      default: throw new Error("Unknown tool: " + name);', "    }", "  });",
    "  await server.connect(transport);",
    '  console.error("' + manifest.metadata.name + ' MCP Server running on stdio");', "}", "",
    'main().catch((error) => { console.error("Fatal error:", error); process.exit(1); });'].join("\n");
  writeFileSync(resolve(base, "src/index.ts"), indexCode);

  const mcpPkg = { name: "@" + slug + "/mcp-server", version: manifest.metadata.version,
    description: manifest.metadata.description, author: manifest.metadata.author,
    license: manifest.metadata.license, type: "module", main: "src/index.ts",
    scripts: { start: "tsx src/index.ts", build: "tsc", "type-check": "tsc --noEmit" },
    dependencies: { "@modelcontextprotocol/sdk": "^0.6.0", zod: "^3.22.4" },
    devDependencies: { "@types/node": "^20.10.0", typescript: "^5.3.3", tsx: "^4.7.0" } };
  writeFileSync(resolve(base, "package.json"), JSON.stringify(mcpPkg, null, 2));

  const mcpTsconfig = { compilerOptions: { target: "ES2020", module: "ESNext", lib: ["ES2020"],
    moduleResolution: "bundler", strict: true, esModuleInterop: true, skipLibCheck: true,
    forceConsistentCasingInFileNames: true, resolveJsonModule: true, declaration: true,
    outDir: "./dist", rootDir: "./src" }, include: ["src/**/*"], exclude: ["node_modules"] };
  writeFileSync(resolve(base, "tsconfig.json"), JSON.stringify(mcpTsconfig, null, 2));

  for (const skill of manifest.skills) {
    const md = i18nConfig ? loadLocalizedSkillMarkdown(skill.name, locale || i18nConfig.defaultLocale, i18nConfig) : loadSkillMarkdown(skill.name);
    writeFileSync(resolve(base, "knowledge/skills/" + skill.name + ".md"), md);
  }
  for (const cmd of manifest.commands) {
    const md = i18nConfig ? loadLocalizedCommandMarkdown(cmd.name, locale || i18nConfig.defaultLocale, i18nConfig) : loadCommandMarkdown(cmd.name);
    writeFileSync(resolve(base, "knowledge/commands/" + cmd.name + ".md"), md);
  }
  logSuccess("MCP server generated" + (suffix ? " (" + locale + ")" : ""));
}

// ============================================================================
// FORMAT 6: STANDALONE CLI
// ============================================================================

function generateCli(manifest: Manifest, locale?: string, i18nConfig?: I18nConfig): void {
  const suffix = locale && locale !== i18nConfig?.defaultLocale ? "/" + locale : "";
  log("Generating standalone CLI" + (suffix ? " (" + locale + ")" : "") + "...");
  const base = resolve(__dirname, "dist/cli" + suffix); ensureDir(base);
  const commandHelp = manifest.commands.map((cmd) => '  "  ' + cmd.name + ' -- ' + cmd.description + '\\n" +').join("\n");
  const commandCases: string[] = [];
  for (const cmd of manifest.commands) {
    const paramLines: string[] = [];
    for (const [paramName, paramDef] of Object.entries(cmd.parameters.properties)) {
      const isRequired = (cmd.parameters.required || []).includes(paramName);
      paramLines.push("        " + paramName + ': args["--' + paramName.replace(/_/g, "-") + '"] || ' +
        (paramDef.default !== undefined ? JSON.stringify(paramDef.default) :
          isRequired ? '(() => { console.error("Missing required: --' + paramName.replace(/_/g, "-") + '"); process.exit(1); })()' : "undefined") + ",");
    }
    commandCases.push(['    case "' + cmd.name + '":', "      return {", '        command: "' + cmd.name + '",',
      '        displayName: "' + cmd.displayName + '",', "        params: {", ...paramLines, "        },", "      };"].join("\n"));
  }
  const cliCode = ["#!/usr/bin/env tsx",
    "// Auto-generated CLI — project name is read from manifest at build time",
    "// Run: tsx cli.ts <command> [--param value ...]", "",
    'const VERSION = "' + manifest.metadata.version + '";',
    'const NAME = "' + manifest.metadata.name + '";', "",
    "function showHelp(): void {",
    '  console.log(NAME + " CLI v" + VERSION);', '  console.log("");',
    '  console.log("Usage: tsx cli.ts <command> [options]");', '  console.log("");',
    '  console.log("Commands:");', "  console.log(", commandHelp, '  ""', "  );",
    '  console.log("Options:");', '  console.log("  --help     Show this help message");',
    '  console.log("  --version  Show version");', "}", "",
    "function parseCliArgs(): Record<string, string> {",
    "  const args: Record<string, string> = {};", "  const raw = process.argv.slice(3);",
    "  for (let i = 0; i < raw.length; i++) {",
    '    if (raw[i].startsWith("--") && raw[i + 1] && !raw[i + 1].startsWith("--")) { args[raw[i]] = raw[++i]; }',
    '    else if (raw[i].includes("=")) { const [key, ...val] = raw[i].split("="); args[key] = val.join("="); }',
    "  }", "  return args;", "}", "",
    "function routeCommand(command: string, args: Record<string, string>): unknown {",
    "  switch (command) {", ...commandCases, "    default:",
    '      console.error("Unknown command: " + command);', "      showHelp();", "      process.exit(1);",
    "  }", "}", "", "const command = process.argv[2];", "",
    'if (!command || command === "--help") { showHelp(); process.exit(0); }',
    'if (command === "--version") { console.log(VERSION); process.exit(0); }', "",
    "const args = parseCliArgs();", "const result = routeCommand(command, args);",
    "console.log(JSON.stringify(result, null, 2));"].join("\n");
  writeFileSync(resolve(base, "cli.ts"), cliCode);
  logSuccess("Standalone CLI generated" + (suffix ? " (" + locale + ")" : ""));
}

// ============================================================================
// FORMAT REGISTRY
// ============================================================================

type FormatGenerator = (manifest: Manifest, locale?: string, i18nConfig?: I18nConfig) => void;

const FORMAT_GENERATORS: Record<FormatName, FormatGenerator> = {
  "claude-plugin": generateClaudePlugin, openai: generateOpenAIFunctions,
  n8n: generateN8nNode, prompts: generatePromptLibrary, mcp: generateMcpServer, cli: generateCli,
};

// ============================================================================
// MAIN BUILD
// ============================================================================

async function main(): Promise<void> {
  const args = parseArgs();
  try {
    if (args.clean) {
      log("Cleaning dist/...");
      if (existsSync(resolve(__dirname, "dist"))) { rmSync(resolve(__dirname, "dist"), { recursive: true }); }
      logSuccess("Cleaned");
      if (args.format === "all" && !args.validateOnly) { /* continue */ }
      else if (args.validateOnly) { /* continue */ }
      else { return; }
    }
    log("Starting build..."); log("Output directory: " + resolve(__dirname, "dist"));
    const manifest = loadManifest();
    if (args.validateOnly) { logSuccess("Manifest is valid!"); return; }

    // Determine locales to build
    const i18nConfig = manifest.i18n;
    const allLocales: string[] = i18nConfig ? i18nConfig.locales : [];
    const localesToBuild: string[] = args.locale !== "all" && i18nConfig
      ? allLocales.filter((l) => l === args.locale)
      : allLocales;
    if (args.locale !== "all" && i18nConfig && localesToBuild.length === 0) {
      throw new Error("Locale \"" + args.locale + "\" not found in manifest i18n.locales: " + allLocales.join(", "));
    }
    const localeMap = i18nConfig ? loadAllLocales(i18nConfig) : new Map<string, LocaleStrings>();

    if (i18nConfig) {
      log("i18n enabled: " + localesToBuild.length + " locale(s) — " + localesToBuild.join(", "));
      const rtlLocales = localesToBuild.filter(isRtl);
      if (rtlLocales.length > 0) log("RTL locales detected: " + rtlLocales.join(", "));
    }

    function runGenerators(generatorManifest: Manifest, locale?: string): void {
      if (args.format === "all") {
        for (const [, generator] of Object.entries(FORMAT_GENERATORS)) { generator(generatorManifest, locale, i18nConfig); }
      } else {
        const generator = FORMAT_GENERATORS[args.format];
        if (!generator) throw new Error("Unknown format: " + args.format);
        generator(generatorManifest, locale, i18nConfig);
      }
    }

    if (i18nConfig && localesToBuild.length > 0) {
      // Build default locale first (uses manifest as-is)
      log(""); log("Building default locale: " + i18nConfig.defaultLocale);
      runGenerators(manifest, i18nConfig.defaultLocale);

      // Build each additional locale with localized manifest
      for (const locale of localesToBuild) {
        if (locale === i18nConfig.defaultLocale) continue;
        const strings = localeMap.get(locale);
        if (!strings) { console.warn("Skipping locale " + locale + " — no translation file found"); continue; }
        log(""); log("Building locale: " + locale);
        const localizedManifest = localizeManifest(manifest, locale, strings);
        runGenerators(localizedManifest, locale);
      }
    } else {
      // No i18n — single build as before
      runGenerators(manifest);
    }

    log(""); logSuccess("Build completed successfully!"); log("Generated artifacts:");
    const localeLabel = i18nConfig ? " (x" + localesToBuild.length + " locales)" : "";
    if (args.format === "all" || args.format === "claude-plugin") log("  - dist/claude-plugin/" + localeLabel);
    if (args.format === "all" || args.format === "openai") log("  - dist/openai/" + localeLabel);
    if (args.format === "all" || args.format === "n8n") log("  - dist/n8n/" + localeLabel);
    if (args.format === "all" || args.format === "prompts") log("  - dist/prompts/" + localeLabel);
    if (args.format === "all" || args.format === "mcp") log("  - dist/mcp-server/" + localeLabel);
    if (args.format === "all" || args.format === "cli") log("  - dist/cli/" + localeLabel);
    if (i18nConfig) { log(""); log("Locale directories: " + localesToBuild.filter((l) => l !== i18nConfig.defaultLocale).map((l) => l + "/").join(", ")); }
  } catch (error) {
    logError("Build failed!");
    if (error instanceof Error) console.error(error.message); else console.error(error);
    process.exit(1);
  }
}

main().catch((err) => { console.error("Build failed:", err); process.exit(1); });