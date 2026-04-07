#!/usr/bin/env python3
"""
OpenAI-Compatible API Demo for Dyslexia & Dyscalculia Skills
=============================================================
Uses the OpenAI function-calling format from the build output.
Works with any OpenAI-compatible endpoint:
  - Ollama (http://localhost:11434/v1)
  - OpenAI API (https://api.openai.com/v1)
  - Any other compatible server

Usage:
    # With local Ollama (default)
    python openai_compatible_demo.py

    # With OpenAI API
    OPENAI_API_KEY=sk-... OPENAI_BASE_URL=https://api.openai.com/v1 \
        OPENAI_MODEL=gpt-4o python openai_compatible_demo.py

Requirements:
    pip install openai
"""

import json
import os
import sys
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("ERROR: openai package required. Install with: pip install openai")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL = os.environ.get("OPENAI_BASE_URL", "http://localhost:11434/v1")
API_KEY = os.environ.get("OPENAI_API_KEY", "ollama")  # Ollama doesn't need a real key
MODEL = os.environ.get("OPENAI_MODEL", "llama3")

SCRIPT_DIR = Path(__file__).resolve().parent
FUNCTIONS_DIR = {
    "dyslexia": SCRIPT_DIR.parent / "dyslexia-support-skill" / "dist" / "openai",
    "dyscalculia": SCRIPT_DIR.parent / "dyscalculia-support-skill" / "dist" / "openai",
}


def load_functions(skill: str, locale: str = "en") -> list[dict]:
    """Load the OpenAI function schemas from build output."""
    base = FUNCTIONS_DIR[skill]
    path = base / locale / "functions.json" if locale != "en" else base / "functions.json"
    with open(path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Demo scenarios
# ---------------------------------------------------------------------------

DEMOS = [
    {
        "title": "Context Enrichment (Dyslexia)",
        "description": "Adding contextual clues around difficult vocabulary",
        "skill": "dyslexia",
        "user_message": (
            "Please enrich this terse text so a dyslexic reader has more context "
            "clues to decode the hard words. Use moderate enrichment level.\n\n"
            "Text: \"The mitochondria synthesize ATP through oxidative phosphorylation. "
            "This process requires a proton gradient across the inner membrane.\""
        ),
    },
    {
        "title": "Syllable Highlighter (Dyslexia)",
        "description": "Breaking words into color-coded syllables",
        "skill": "dyslexia",
        "user_message": (
            "Please highlight the syllables in these words using slash-separated mode "
            "with stress markers: photosynthesis, encyclopedia, metamorphosis, "
            "onomatopoeia, hippopotamus"
        ),
    },
    {
        "title": "Range Comparison (Dyscalculia)",
        "description": "Comparing datasets visually instead of numerically",
        "skill": "dyscalculia",
        "user_message": (
            "Compare these three classes' test scores using simplified range bars. "
            "Show the median as the center marker. Don't show numbers — keep it "
            "purely visual.\n\n"
            "Class A: 45-98, median 72\n"
            "Class B: 55-88, median 68\n"
            "Class C: 30-95, median 61"
        ),
    },
    {
        "title": "Proportion Waffle (Dyscalculia)",
        "description": "Showing percentages as countable squares instead of pie charts",
        "skill": "dyscalculia",
        "user_message": (
            "Show these survey results as waffle grids side by side so they can "
            "be compared visually:\n\n"
            "Agree: 62%\n"
            "Disagree: 23%\n"
            "Unsure: 15%"
        ),
    },
    {
        "title": "Confusion Checker (Dyslexia)",
        "description": "Detecting reversed letters, homophones, and mirror words",
        "skill": "dyslexia",
        "user_message": (
            "Check this student's writing for common dyslexia-related confusions. "
            "Show mnemonics for each issue found.\n\n"
            "\"Their going too the libary too by some dooks. The techer said we "
            "should of red the hole chapter by wendsay.\""
        ),
    },
]


def run_demo(client: OpenAI, demo: dict, functions: list[dict]):
    """Run a single demo scenario."""
    print(f"\n{'='*70}")
    print(f"📌 {demo['title']}")
    print(f"   {demo['description']}")
    print(f"{'='*70}")
    print(f"\n📝 Input:\n{demo['user_message']}\n")
    print(f"🤖 Calling {MODEL}...\n")

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an accessibility support assistant specialized in "
                        f"{demo['skill']} support. Follow the function schemas provided "
                        "to understand available commands and their parameters. "
                        "Respond directly with helpful, well-formatted output."
                    ),
                },
                {"role": "user", "content": demo["user_message"]},
            ],
            tools=functions,
            temperature=0.3,
            max_tokens=2000,
        )

        # Print the response
        msg = response.choices[0].message

        # Check if the model made tool calls
        if msg.tool_calls:
            print("🔧 Tool calls made:")
            for tc in msg.tool_calls:
                print(f"   Function: {tc.function.name}")
                print(f"   Args: {tc.function.arguments}")

        if msg.content:
            print(f"📄 Response:\n{msg.content}")

    except Exception as e:
        print(f"❌ Error: {e}")
        # If function calling isn't supported, fall back to plain chat
        if "tools" in str(e).lower() or "function" in str(e).lower():
            print("\n⚠️  Function calling not supported by this model/endpoint.")
            print("   Falling back to plain chat mode...\n")
            try:
                response = client.chat.completions.create(
                    model=MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an accessibility support assistant. "
                                f"Skill: {demo['skill']} support."
                            ),
                        },
                        {"role": "user", "content": demo["user_message"]},
                    ],
                    temperature=0.3,
                    max_tokens=2000,
                )
                print(f"📄 Response:\n{response.choices[0].message.content}")
            except Exception as e2:
                print(f"❌ Fallback also failed: {e2}")


def main():
    print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║        Dyslexia & Dyscalculia Skills — OpenAI-Compatible Demo      ║
╠══════════════════════════════════════════════════════════════════════╣
║  Endpoint:  {BASE_URL:<55}║
║  Model:     {MODEL:<55}║
║  Demos:     {len(DEMOS):<55}║
╚══════════════════════════════════════════════════════════════════════╝
""")

    client = OpenAI(base_url=BASE_URL, api_key=API_KEY)

    # Pre-load function schemas
    all_functions = {}
    for skill in ["dyslexia", "dyscalculia"]:
        try:
            all_functions[skill] = load_functions(skill)
            print(f"✓ Loaded {len(all_functions[skill])} function schemas for {skill}")
        except FileNotFoundError:
            print(f"⚠ Could not load functions for {skill} — skipping those demos")
            all_functions[skill] = []

    # Run each demo
    for demo in DEMOS:
        functions = all_functions.get(demo["skill"], [])
        run_demo(client, demo, functions)

    print(f"\n{'='*70}")
    print("✅ Demo complete!")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
