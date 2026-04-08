#!/usr/bin/env python3
"""
Ollama Runner for Dyslexia & Dyscalculia Support Skills
========================================================
Loads YAML prompt files from the build output and runs them against a local
Ollama instance. Works with any model Ollama supports (llama3, mistral, etc.)

Usage:
    python ollama_runner.py --skill dyslexia --command context-enrichment \
        --param text="The catalyst accelerated the reaction." \
        --param enrichment_level=moderate

    python ollama_runner.py --skill dyscalculia --command range-comparison \
        --param datasets="Class A: 40-95, 72" "Class B: 55-88, 68" \
        --param center_type=mean

    python ollama_runner.py --list                   # list all available commands
    python ollama_runner.py --skill dyslexia --list  # list commands for one skill
    python ollama_runner.py --locale es ...           # use Spanish locale

Requirements:
    pip install requests pyyaml
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML required. Install with: pip install pyyaml")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: requests required. Install with: pip install requests")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3")

# Resolve skill directories relative to this script
SCRIPT_DIR = Path(__file__).resolve().parent
SKILLS = {
    "dyslexia": SCRIPT_DIR.parent / "dyslexia-support-skill" / "dist" / "prompts",
    "dyscalculia": SCRIPT_DIR.parent / "dyscalculia-support-skill" / "dist" / "prompts",
}


# ---------------------------------------------------------------------------
# YAML prompt loading
# ---------------------------------------------------------------------------

def load_prompt(skill: str, command: str, locale: str = "en") -> dict:
    """Load a YAML prompt file for a given skill/command/locale.

    The build-generated YAML has some indentation quirks, so we try
    yaml.safe_load first and fall back to a text-based parser that
    extracts the key fields we need.
    """
    base = SKILLS[skill]
    if locale and locale != "en":
        path = base / locale / f"{command}.yaml"
    else:
        path = base / f"{command}.yaml"

    if not path.exists():
        raise FileNotFoundError(f"Prompt not found: {path}")

    text = path.read_text(encoding="utf-8")

    # Try strict YAML first with schema validation
    try:
        data = yaml.safe_load(text)
        if isinstance(data, dict):
            # Validate expected top-level fields
            expected_keys = {"name", "id", "description", "context", "parameters", "output", "models", "locale", "direction"}
            unexpected = set(data.keys()) - expected_keys
            if unexpected:
                print(f"WARNING: Unexpected YAML fields: {', '.join(sorted(unexpected))}", file=sys.stderr)
            return data
    except yaml.YAMLError as e:
        print(f"WARNING: YAML parse error, falling back to text parser: {e}", file=sys.stderr)

    # Fallback: extract fields from text (no raw content stored to avoid data leakage)
    result: dict = {}
    for field in ("name", "id", "description"):
        for line in text.splitlines():
            if line.startswith(f"{field}:"):
                result[field] = line.split(":", 1)[1].strip()
                break

    # Extract context/role
    if "role:" in text:
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith("role:"):
                result.setdefault("context", {})["role"] = stripped.split(":", 1)[1].strip()
                break

    # Extract expertise lines
    expertise = []
    in_expertise = False
    for line in text.splitlines():
        if "expertise:" in line:
            in_expertise = True
            continue
        if in_expertise:
            stripped = line.strip()
            if stripped.startswith("- "):
                expertise.append(stripped[2:])
            elif stripped and not stripped.startswith("-"):
                in_expertise = False
    if expertise:
        result.setdefault("context", {})["expertise"] = expertise

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
                    if val == "true":
                        val = True
                    elif val == "false":
                        val = False
                    elif val == "null":
                        val = None
                    current_param[key] = val
    if current_param:
        params.append(current_param)
    if params:
        result["parameters"] = params

    # Validate required fields are present
    REQUIRED_FIELDS = {"name", "id", "description"}
    missing = REQUIRED_FIELDS - set(result.keys())
    if missing:
        print(f"WARNING: Prompt file missing fields: {', '.join(sorted(missing))}", file=sys.stderr)

    return result


def list_commands(skill: str | None = None, locale: str = "en") -> dict[str, list[str]]:
    """List available commands per skill."""
    result = {}
    skills_to_check = {skill: SKILLS[skill]} if skill else SKILLS
    for name, base in skills_to_check.items():
        prompt_dir = base / locale if locale != "en" else base
        if not prompt_dir.exists():
            prompt_dir = base  # fall back to English
        cmds = sorted(
            p.stem for p in prompt_dir.glob("*.yaml") if p.stem != "index"
        )
        result[name] = cmds
    return result


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def build_system_prompt(prompt_data: dict) -> str:
    """Convert YAML prompt data into a system message for the LLM."""
    parts = []

    # Role / context
    ctx = prompt_data.get("context", {})
    if isinstance(ctx, dict):
        role = ctx.get("role", "")
        if role:
            parts.append(role)
        expertise = ctx.get("expertise", [])
        if expertise:
            parts.append("Your areas of expertise include:")
            for e in expertise:
                parts.append(f"  - {e}")

    # Task description
    desc = prompt_data.get("description", "")
    if desc:
        parts.append(f"\nTask: {desc}")

    # Parameter documentation
    params = prompt_data.get("parameters", [])
    if params:
        parts.append("\nParameters you should expect:")
        for p in params:
            if isinstance(p, dict):
                name = p.get("name", "?")
                ptype = p.get("type", "string")
                required = p.get("required", False)
                pdesc = p.get("description", "")
                default = p.get("default")
                req_mark = " (required)" if required else f" (default: {default})"
                parts.append(f"  - {name} [{ptype}]{req_mark}: {pdesc}")

    # Output guidance
    output = prompt_data.get("output", {})
    if isinstance(output, dict):
        fmt = output.get("format", "")
        if fmt:
            parts.append(f"\nOutput format: {fmt}")

    return "\n".join(parts)


def build_user_message(command: str, params: dict[str, Any]) -> str:
    """Build the user message from command name and parameters."""
    parts = [f"Please run the '{command}' command with these inputs:\n"]
    for k, v in params.items():
        if isinstance(v, list):
            parts.append(f"  {k}:")
            for item in v:
                parts.append(f"    - {item}")
        else:
            parts.append(f"  {k}: {v}")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Ollama API
# ---------------------------------------------------------------------------

def call_ollama(system_prompt: str, user_message: str, model: str = None) -> str:
    """Send a chat completion to local Ollama and return the response."""
    model = model or OLLAMA_MODEL
    url = f"{OLLAMA_URL}/api/chat"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
    }

    print(f"\n🤖 Calling Ollama ({model})...\n", file=sys.stderr)

    try:
        resp = requests.post(url, json=payload, timeout=(10, 120))
        resp.raise_for_status()
    except requests.ConnectionError:
        print(f"ERROR: Cannot connect to Ollama at {OLLAMA_URL}")
        print("Make sure Ollama is running: ollama serve")
        sys.exit(1)
    except requests.HTTPError as e:
        print(f"ERROR: Ollama returned {e.response.status_code}: {e.response.text}")
        sys.exit(1)

    data = resp.json()
    return data.get("message", {}).get("content", "")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_param(s: str) -> tuple[str, str]:
    """Parse 'key=value' into (key, value)."""
    if "=" not in s:
        raise argparse.ArgumentTypeError(f"Parameters must be key=value, got: {s}")
    key, _, value = s.partition("=")
    # Try to parse booleans and numbers
    if value.lower() in ("true", "false"):
        return key, value.lower() == "true"
    try:
        return key, int(value)
    except ValueError:
        pass
    try:
        return key, float(value)
    except ValueError:
        pass
    return key, value


def main():
    parser = argparse.ArgumentParser(
        description="Run dyslexia/dyscalculia skill prompts via local Ollama",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Context enrichment (dyslexia)
  python ollama_runner.py --skill dyslexia --command context-enrichment \\
      --param text="The catalyst accelerated the reaction."

  # Range comparison (dyscalculia)
  python ollama_runner.py --skill dyscalculia --command range-comparison \\
      --param datasets="Class A: 40-95, 72" --param datasets="Class B: 55-88, 68"

  # Spanish locale
  python ollama_runner.py --skill dyslexia --command context-enrichment \\
      --locale es --param text="El catalizador aceleró la reacción."

  # List all commands
  python ollama_runner.py --list

Environment variables:
  OLLAMA_URL    Ollama server URL (default: http://localhost:11434)
  OLLAMA_MODEL  Model to use (default: llama3)
        """,
    )
    parser.add_argument("--skill", choices=["dyslexia", "dyscalculia"],
                        help="Which skill to use")
    parser.add_argument("--command", "-c", help="Command to run")
    parser.add_argument("--param", "-p", action="append", default=[],
                        help="Parameter as key=value (repeatable)")
    parser.add_argument("--locale", "-l", default="en",
                        help="Locale code (default: en)")
    parser.add_argument("--model", "-m", default=None,
                        help=f"Ollama model override (default: {OLLAMA_MODEL})")
    parser.add_argument("--list", action="store_true",
                        help="List available commands")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print the prompts without calling Ollama")

    args = parser.parse_args()

    # List mode
    if args.list:
        cmds = list_commands(args.skill, args.locale)
        for skill_name, command_list in cmds.items():
            print(f"\n📚 {skill_name}:")
            for cmd in command_list:
                print(f"   • {cmd}")
        return

    # Validate
    if not args.skill:
        parser.error("--skill is required (dyslexia or dyscalculia)")
    if not args.command:
        parser.error("--command is required")

    # Load prompt
    try:
        prompt_data = load_prompt(args.skill, args.command, args.locale)
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        cmds = list_commands(args.skill, args.locale)
        print(f"Available commands: {', '.join(cmds.get(args.skill, []))}")
        sys.exit(1)

    # Parse parameters
    params = {}
    for p in args.param:
        key, value = parse_param(p)
        # Support repeated keys as lists (e.g., --param datasets=... --param datasets=...)
        if key in params:
            if isinstance(params[key], list):
                params[key].append(value)
            else:
                params[key] = [params[key], value]
        else:
            params[key] = value

    # Build prompts
    system_prompt = build_system_prompt(prompt_data)
    user_message = build_user_message(args.command, params)

    if args.dry_run:
        print("=" * 60)
        print("SYSTEM PROMPT:")
        print("=" * 60)
        print(system_prompt)
        print("\n" + "=" * 60)
        print("USER MESSAGE:")
        print("=" * 60)
        print(user_message)
        return

    # Call Ollama
    response = call_ollama(system_prompt, user_message, args.model)
    print(response)


if __name__ == "__main__":
    main()
