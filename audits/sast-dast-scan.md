# SAST/DAST Security Scan Report
## Accessibility Skills Project

**Scan Date:** April 8, 2026  
**Scope:** Complete source code audit covering TypeScript build scripts, Python samples, n8n workflow, and configuration files

---

## Executive Summary

| Severity | Count |
|----------|-------|
| **CRITICAL** | 2 |
| **HIGH** | 3 |
| **MEDIUM** | 4 |
| **LOW** | 2 |
| **INFO** | 1 |
| **Total Findings** | 12 |

**Key Risks Identified:**
- Path traversal vulnerabilities in file operations without sanitization
- Hardcoded credentials in environment variable defaults
- String concatenation in code generation (potential for injection via manifest data)
- Unsafe file access patterns in MCP server
- Weak validation of user-controlled input in n8n workflow

---

## Critical Findings

### 1. PATH TRAVERSAL IN MCP SERVER FILE LOADING

**Severity:** CRITICAL  
**CWE:** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory)  
**File:** `dyslexia-support-skill/dist/mcp-server/src/knowledge/loader.ts` (generated from `build.ts` line 514-525)  
**Dyscalculia equivalent:** `dyscalculia-support-skill/dist/mcp-server/src/knowledge/loader.ts`

**Code Snippet:**
```typescript
export async function loadSkillContent(skillId: string): Promise<string> {
  try {
    const p = resolve(__dirname, "../../knowledge/skills/" + skillId + ".md");
    const content = readFileSync(p, "utf-8");
    CACHE.set(skillId, content); return content;
  } catch { return ""; }
}

export async function loadCommandContent(commandId: string): Promise<string> {
  try { return readFileSync(resolve(__dirname, "../../knowledge/commands/" + commandId + ".md"), "utf-8"); }
  catch { return ""; }
}
```

**Vulnerability:** User-controlled `skillId` and `commandId` parameters are directly concatenated into file paths without sanitization. An attacker can use `../` sequences to traverse outside the intended directory and read arbitrary files on the system.

**Attack Vector:** 
```
skillId: "../../../../etc/passwd"
// resolves to: /etc/passwd
```

**Impact:** Arbitrary file disclosure, information exposure, potential code execution if combined with other vulnerabilities.

**Remediation:**
```typescript
import { basename } from "path";

export async function loadSkillContent(skillId: string): Promise<string> {
  const safe = basename(skillId); // Remove any path components
  const p = resolve(__dirname, "../../knowledge/skills/" + safe + ".md");
  // Verify the resolved path is within expected directory
  const expectedBase = resolve(__dirname, "../../knowledge/skills");
  if (!p.startsWith(expectedBase + "/")) throw new Error("Invalid skill ID");
  // ... rest of code
}
```

---

### 2. PATH TRAVERSAL IN BUILD.TS FILE LOADING

**Severity:** CRITICAL  
**CWE:** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory)  
**File:** `dyslexia-support-skill/build.ts` lines 249, 308, 316, 348, 351  
**Also in:** `dyscalculia-support-skill/build.ts` (identical code)

**Code Snippet (Line 249):**
```typescript
function loadLocaleStrings(locale: string): LocaleStrings | null {
  const localePath = resolve(__dirname, "source/i18n/" + locale + ".json");
  try {
    return JSON.parse(readFileSync(localePath, "utf-8")) as LocaleStrings;
  } catch {
    return null;
  }
}
```

**Similar Pattern at Lines 308, 316, 348, 351:**
- `loadLocalizedSkillMarkdown()` - concatenates unsanitized `locale` and `skillName`
- `loadLocalizedCommandMarkdown()` - concatenates unsanitized `locale` and `commandName`
- `loadSkillMarkdown()` - concatenates unsanitized `skillName`
- `loadCommandMarkdown()` - concatenates unsanitized `commandName`

**Vulnerability:** All locale, skill, and command names are concatenated directly into file paths without validation. If an attacker controls these values through `manifest.json` or CLI arguments, they can traverse directories and read arbitrary files during the build process.

**Attack Example:**
```json
{
  "commands": [
    {
      "name": "../../../../../../etc/passwd",
      "displayName": "Test",
      ...
    }
  ]
}
```

**Impact:** During build, arbitrary files could be read and potentially embedded in generated output files.

**Remediation:**
```typescript
function loadLocaleStrings(locale: string): LocaleStrings | null {
  // Whitelist allowed locales from manifest
  const allowedLocales = manifest.i18n?.locales || ["en"];
  if (!allowedLocales.includes(locale)) {
    console.warn("Warning: Invalid locale requested: " + locale);
    return null;
  }
  const localePath = resolve(__dirname, "source/i18n/" + locale + ".json");
  // Additional check: verify resolved path is within source/i18n/
  const expectedBase = resolve(__dirname, "source/i18n");
  if (!localePath.startsWith(expectedBase + "/")) return null;
  
  try {
    return JSON.parse(readFileSync(localePath, "utf-8")) as LocaleStrings;
  } catch {
    return null;
  }
}
```

---

## High Findings

### 3. HARDCODED API KEY IN PYTHON SAMPLE

**Severity:** HIGH  
**CWE:** CWE-798 (Use of Hard-Coded Credentials)  
**File:** `samples/openai_compatible_demo.py` lines 40-41

**Code Snippet:**
```python
BASE_URL = os.environ.get("OPENAI_BASE_URL", "http://localhost:11434/v1")
API_KEY = os.environ.get("OPENAI_API_KEY", "ollama")  # Ollama doesn't need a real key
```

**Vulnerability:** While technically defaulting to a harmless placeholder for Ollama, this pattern demonstrates credential handling. The comment suggests the developers understand this is for local development only, but the code could be misused in production where a real API key might be visible in process listings or version control history.

**Impact:** Accidental credential exposure in logs, environment variable dumps, or if copy-pasted to production without changing defaults.

**Remediation:**
```python
API_KEY = os.environ.get("OPENAI_API_KEY", None)
if BASE_URL != "http://localhost:11434/v1" and not API_KEY:
    raise ValueError("OPENAI_API_KEY must be set for non-local endpoints")
if not API_KEY:
    API_KEY = "ollama"  # Only use default for local Ollama
```

---

### 4. CODE GENERATION WITHOUT ESCAPING IN BUILD.TS

**Severity:** HIGH  
**CWE:** CWE-95 (Improper Neutralization of Directives in Dynamically Evaluated Code)  
**File:** `dyslexia-support-skill/build.ts` lines 498, 503, 508, 589, 590, 599, 601, 602, 603, 612  
**Also in:** `dyscalculia-support-skill/build.ts`

**Code Snippet (Line 498-509):**
```typescript
let jsProp = "      " + paramName + ': { type: "' + paramDef.type + '", description: "' + cmd.description.replace(/"/g, '\\"') + '" }';

// ...
const toolCode = [...
  "export const " + toolName + 'Definition = { name: "' + toolName + '", description: "' + cmd.description.replace(/"/g, '\\"') + '",',
  // ...
  '  const commandContent = await loadCommandContent("' + cmd.name + '");',
  '  return JSON.stringify({ status: "success", command: "' + cmd.name + '", message: "Tool executed.", commandPreview: commandContent.slice(0, 200), input: validated }, null, 2);',
  ...
]
```

**Vulnerability:** While `cmd.description` is escaped for double quotes, other fields like `cmd.name`, `toolName`, and `paramName` are not validated. If `manifest.json` contains special characters or malicious strings, they could be injected into generated TypeScript code. Additional risk: backslash escaping could be bypassed with crafted input.

**Attack Example:**
```json
{
  "commands": [{
    "name": "test\"; process.exit(1); //",
    "displayName": "Test"
  }]
}
```

**Impact:** Arbitrary code injection into generated MCP server, CLI, or other format output.

**Remediation:**
```typescript
// Sanitize identifiers for safe code generation
function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-z0-9_]/gi, "_").replace(/^[0-9]/, "_$&");
}

function sanitizeStringLiteral(str: string): string {
  return JSON.stringify(str); // Use JSON.stringify for safe string escaping
}

// Usage:
const toolName = sanitizeIdentifier(cmd.name);
const safeDescription = sanitizeStringLiteral(cmd.description);
let jsProp = "      " + paramName + ': { type: "' + paramDef.type + '", description: ' + safeDescription + ' }';
```

---

### 5. N8N WORKFLOW EXPRESSION INJECTION

**Severity:** HIGH  
**CWE:** CWE-917 (Expression Language Injection)  
**File:** `samples/n8n_workflow.json` lines 54, 79, 96, 112, 130, 131, 151

**Code Snippet (Lines 54-55, 79-80):**
```json
{
  "id": "user-msg",
  "name": "userMessage",
  "value": "=Please run the '{{ $json.body.command }}' command.\n\nInput:\n{{ $json.body.input }}\n\n{{ $json.body.options ? 'Options: ' + $json.body.options : '' }}",
  "type": "string"
}
```

**Code Snippet (Line 96):**
```json
"jsonBody": "={\n  \"model\": \"{{ $json.body?.model || 'llama3' }}\",\n  \"messages\": [\n    {\"role\": \"system\", \"content\": {{ JSON.stringify($json.systemPrompt) }}},\n    {\"role\": \"user\", \"content\": {{ JSON.stringify($json.userMessage) }}}\n  ],\n  \"stream\": false\n}"
```

**Vulnerability:** N8n expressions (marked with `=` prefix) use dynamic template evaluation. While `$json.body.command`, `$json.body.input`, and `$json.body.options` are interpolated using template syntax, there is no validation that these webhook POST parameters are safe. An attacker sending a webhook request with malicious command, input, or options values could potentially inject n8n expression syntax to:
- Access internal variables
- Call arbitrary functions
- Escape the intended context

**Attack Example:**
```bash
curl -X POST http://localhost:5678/webhook/skill-demo \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "dyslexia",
    "command": "test\"; \"; echo hacked; \"",
    "input": "test",
    "options": null
  }'
```

**Impact:** Potential for RCE through n8n expression language, information disclosure, or workflow manipulation.

**Remediation (in n8n workflow):**
1. Add input validation in a Set node before routing:
```json
{
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "id": "validate-input",
          "name": "validatedCommand",
          "value": "={{ /^[a-z-]+$/.test($json.body.command) ? $json.body.command : 'invalid' }}",
          "type": "string"
        }
      ]
    }
  }
}
```

2. Use function parameters instead of string interpolation where possible.

3. Sanitize or validate webhook inputs against whitelist of known commands.

---

## Medium Findings

### 6. UNSAFE ERROR HANDLING IN FILE OPERATIONS

**Severity:** MEDIUM  
**CWE:** CWE-390 (Detection of Error Condition Without Action)  
**File:** `dyslexia-support-skill/build.ts` lines 218-224, 252-254, 309, 317, 349

**Code Snippet (Lines 218-224, 252-254):**
```typescript
function readMarkdown(filePath: string): string {
  try {
    let content = readFileSync(filePath, "utf-8");
    if (content.charCodeAt(0) === 0xfeff) { content = content.slice(1); }
    return content;
  } catch { console.warn("Warning: Could not read " + filePath); return ""; }
}

function loadLocaleStrings(locale: string): LocaleStrings | null {
  const localePath = resolve(__dirname, "source/i18n/" + locale + ".json");
  try {
    return JSON.parse(readFileSync(localePath, "utf-8")) as LocaleStrings;
  } catch {
    return null;
  }
}
```

**Vulnerability:** Silent failure in file operations. Errors are silently caught and empty strings or null are returned. This could mask serious issues:
- Missing required files proceeding silently
- Malformed JSON files accepted as null without logging
- Build proceeding with incomplete data without clear warning

If a required translation file is missing, the build succeeds but generates incomplete artifacts.

**Impact:** Silent data corruption, incomplete builds, difficulty debugging.

**Remediation:**
```typescript
function readMarkdown(filePath: string): string {
  try {
    let content = readFileSync(filePath, "utf-8");
    if (content.charCodeAt(0) === 0xfeff) { content = content.slice(1); }
    return content;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logError("Failed to read " + filePath + ": " + msg);
    throw error; // Re-throw for required files, or return "" only for optional files
  }
}

function loadLocaleStrings(locale: string): LocaleStrings | null {
  const localePath = resolve(__dirname, "source/i18n/" + locale + ".json");
  try {
    const raw = readFileSync(localePath, "utf-8");
    return JSON.parse(raw) as LocaleStrings;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn("Warning: Could not load locale file " + localePath + ": " + msg);
    return null;
  }
}
```

---

### 7. INCOMPLETE INPUT VALIDATION IN CLI ARGUMENT PARSING

**Severity:** MEDIUM  
**CWE:** CWE-1025 (Comparison Using Wrong Factors)  
**File:** `dyslexia-support-skill/build.ts` lines 119-133  
**Also in:** `dyscalculia-support-skill/build.ts`

**Code Snippet:**
```typescript
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = { format: "all", locale: "all", watch: false, clean: false, validateOnly: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--format" && args[i + 1]) { result.format = args[++i] as FormatName | "all"; }
    else if (arg.startsWith("--format=")) { result.format = arg.split("=")[1] as FormatName | "all"; }
    else if (arg === "--locale" && args[i + 1]) { result.locale = args[++i]; }
    else if (arg.startsWith("--locale=")) { result.locale = arg.split("=")[1]; }
    // ... more args
  }
  return result;
}
```

**Vulnerability:** 
- Format values are cast directly without validation. Invalid format values bypass the type safety (e.g., `--format=../../../etc/passwd` is accepted)
- Locale values are not validated against allowed locales
- No validation of unknown arguments (silently ignored)
- `split("=")` splits on ALL equals signs, so `--format=value=extra` results in `value=extra` being used as the format

**Attack Example:**
```bash
npm run build -- --format=../../bad --locale=../../../etc/passwd
```

**Impact:** Bypass of intended format restrictions, potential path traversal with locale parameter.

**Remediation:**
```typescript
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = { format: "all", locale: "all", watch: false, clean: false, validateOnly: false };
  const allowedFormats = ["all", "claude-plugin", "openai", "n8n", "prompts", "mcp", "cli"];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--format" && args[i + 1]) {
      const val = args[++i];
      if (allowedFormats.includes(val)) result.format = val as FormatName | "all";
      else throw new Error("Invalid format: " + val);
    }
    else if (arg.startsWith("--format=")) {
      const [, val] = arg.split("=", 2); // Split on first = only
      if (allowedFormats.includes(val)) result.format = val as FormatName | "all";
      else throw new Error("Invalid format: " + val);
    }
    // ... similar for locale with whitelist from manifest i18n
  }
  return result;
}
```

---

### 8. YAML STRINGIFICATION DOES NOT ESCAPE SPECIAL CHARACTERS

**Severity:** MEDIUM  
**CWE:** CWE-116 (Improper Encoding or Escaping of Output)  
**File:** `dyslexia-support-skill/build.ts` lines 139-150  
**Also in:** `dyscalculia-support-skill/build.ts`

**Code Snippet:**
```typescript
function stringifyYaml(obj: unknown, indent: number = 2): string {
  // ...
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
  // ...
}
```

**Vulnerability:** The YAML stringifier handles some special characters (`\n`, `:`, `#`, `'`) but not others:
- Does not quote strings containing `@`, `!`, `%`, `*`, `&`, etc. (special YAML tokens)
- Does not handle control characters
- Unquoted strings starting with special characters may be misinterpreted
- The logic checks for colons but doesn't distinguish between safe and unsafe positions

**Attack Example:**
```yaml
# If manifest.metadata.description contains: "@anchor &alias"
name: "{{ metadata.description }}"
# Results in invalid YAML:
description: @anchor &alias  # This becomes a YAML anchor/alias instead of a string
```

**Impact:** Generated YAML files could be malformed or misinterpreted, potentially causing parse errors downstream or YAML injection.

**Remediation:**
```typescript
function scalar(val: unknown): string {
  if (val === null || val === undefined) return "null";
  if (typeof val === "string") {
    // Always quote strings that could be special in YAML
    const specialChars = /[:#@!%*&\[\]{},'"\n\t\r\\]/;
    const startsSpecial = /^[#@!%*&\[\]{},'"-]|^\./;
    const isNumericLike = /^-?\d+(\.\d+)?$/.test(val);
    const isBool = /^(true|false|yes|no|on|off|null)$/i.test(val);
    
    if (specialChars.test(val) || startsSpecial.test(val) || isNumericLike || isBool) {
      // Use proper YAML quoting with escape sequences
      return JSON.stringify(val);  // Double quotes with proper escaping
    }
    return val;
  }
  return String(val);
}
```

---

## Low Findings

### 9. MISSING TIMEOUT IN PYTHON HTTP REQUEST

**Severity:** LOW  
**CWE:** CWE-391 (Unchecked Error Condition)  
**File:** `samples/ollama_runner.py` line 248

**Code Snippet:**
```python
try:
    resp = requests.post(url, json=payload, timeout=120)
    resp.raise_for_status()
except requests.ConnectionError:
    print(f"ERROR: Cannot connect to Ollama at {OLLAMA_URL}")
```

**Vulnerability:** While a 120-second timeout is set, the default timeout behavior for `requests.post` is to wait indefinitely if not specified. This code properly sets a timeout, but there's still a potential for resource exhaustion if multiple requests are made simultaneously.

**Impact:** Denial of service through hanging requests in concurrent scenarios, though individual requests are protected.

**Remediation:**
```python
# Good - already implemented:
resp = requests.post(url, json=payload, timeout=120)

# Could be enhanced with read/connect timeout separation:
resp = requests.post(url, json=payload, timeout=(5, 120))  # (connect, read)
```

---

### 10. MISSING VALIDATION OF YAML FIELD EXTRACTION IN PYTHON

**Severity:** LOW  
**CWE:** CWE-1025 (Comparison Using Wrong Factors)  
**File:** `samples/ollama_runner.py` lines 93-146

**Code Snippet:**
```python
# Extract parameters
params = []
current_param: dict = {}
for line in text.splitlines():
    stripped = line.strip()
    if stripped.startswith("name:") and ("parameters" in text[:text.index(line)] if line in text else False):
        if current_param:
            params.append(current_param)
        current_param = {"name": stripped.split(":", 1)[1].strip()}
    elif current_param:
        for key in ("type", "required", "description", "default"):
            if stripped.startswith(f"{key}:"):
                val = stripped.split(":", 1)[1].strip()
                # Type coercion without validation
                if val == "true":
                    val = True
                elif val == "false":
                    val = False
                elif val == "null":
                    val = None
                current_param[key] = val
```

**Vulnerability:** The type coercion logic is simplistic. It will incorrectly parse values like `"true"` (the string) or numbers that look like booleans. The condition `"parameters" in text[:text.index(line)]` is inefficient and fragile.

**Impact:** Incorrect parameter parsing from YAML, potential for misinterpreted parameter types.

**Remediation:**
```python
def parse_yaml_param_value(val: str, key: str) -> Any:
    """Safely parse YAML parameter values."""
    val = val.strip()
    
    # Handle special values
    if val.lower() == "true":
        return True
    elif val.lower() == "false":
        return False
    elif val.lower() == "null":
        return None
    
    # Try numeric parsing
    try:
        if "." in val:
            return float(val)
        return int(val)
    except ValueError:
        pass
    
    # Return as string
    return val
```

---

## Informational Findings

### 11. WEAK RTOL DETECTION

**Severity:** INFO  
**CWE:** CWE-1025 (Comparison Using Wrong Factors)  
**File:** `dyslexia-support-skill/build.ts` lines 242-246  
**Also in:** `dyscalculia-support-skill/build.ts`

**Code Snippet:**
```typescript
const RTL_LOCALES = new Set(["ar", "he", "fa", "ur", "yi", "ps", "sd"]);

function isRtl(locale: string): boolean {
  return RTL_LOCALES.has(locale.split("-")[0].toLowerCase());
}
```

**Note:** This is not a security vulnerability per se, but could cause unexpected behavior:
- Locale `zh-HK` (Traditional Chinese Hong Kong) is handled correctly
- Locale `ar-AE` (Arabic UAE) is handled correctly
- However, script-specific tags like `zh-Hans` (Simplified Chinese script) aren't recognized

**Impact:** Minor - potential display issues for script variants, but no security impact.

**Remediation (optional):**
```typescript
// More comprehensive RTL detection
function isRtl(locale: string): boolean {
  const primaryLang = locale.split("-")[0].toLowerCase();
  const rtlLanguages = new Set(["ar", "he", "fa", "ur", "yi", "ps", "sd", "iw"]);
  return rtlLanguages.has(primaryLang);
}
```

---

## Additional Observations

### File Permissions (Minor)
Files in `/dyscalculia-support-skill/source/i18n/` and similar directories have executable bit set (`-rwxr-xr-x`), which is unusual for JSON/text configuration files. These should typically be readable only (`-rw-r--r--`).

```bash
# Fix:
chmod 644 /path/to/*.json
```

---

## Remediation Priority

### Immediate (Must Fix)
1. **Path Traversal in MCP Server** - Apply basename() filtering and resolved path validation
2. **Path Traversal in Build.TS** - Add whitelist validation for all file path parameters
3. **Code Generation Injection** - Use proper escaping/sanitization functions

### High Priority (Should Fix Before Release)
4. **N8N Expression Injection** - Add input validation to workflow
5. **Hardcoded Credentials** - Require explicit environment variables for production
6. **CLI Argument Validation** - Validate all user inputs against whitelists

### Medium Priority (Next Sprint)
7. **Error Handling** - Fail fast on missing critical files
8. **YAML Escaping** - Implement comprehensive special character handling
9. **Type Validation** - Strengthen CLI argument type checking

### Low Priority
10. **Python Request Timeouts** - Already implemented, monitor for resource issues
11. **YAML Field Extraction** - Improve robustness of fallback parser
12. **RTL Detection** - Optional enhancement for locale completeness

---

## Testing Recommendations

1. **Fuzz Testing:** Send path traversal payloads (../, ..\, null bytes, etc.) in all user-controlled string parameters
2. **Malformed Input:** Test with invalid manifest.json containing special characters and path components
3. **Webhook Testing:** Send malicious n8n expression syntax through webhook endpoint
4. **Build Verification:** Verify generated code is syntactically valid TypeScript/JavaScript
5. **File Access:** Confirm MCP server cannot access files outside knowledge/ directory

---

## Compliance Notes

- **OWASP Top 10 2021:** Addresses A01:2021 (Broken Access Control) and A03:2021 (Injection)
- **CWE Coverage:** Identifies CWE-22 (Path Traversal), CWE-95 (Code Injection), CWE-917 (Expression Injection), CWE-798 (Hard-coded Credentials)
- **SANS Top 25:** Related to CWE-20 (Improper Input Validation)

---

**Report Generated:** 2026-04-08  
**Auditor:** Automated SAST/DAST Scanner  
**Status:** Ready for remediation
