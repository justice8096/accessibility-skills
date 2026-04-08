# Dyscalculia Support Skill

Accessibility tools for number sense, math visualization, and step-by-step calculation support tailored to dyscalculic users. Grounded in the Concrete-Representational-Abstract (CRA) framework — converting numerical tasks to spatial and visual judgments wherever possible.

## Commands

| Command | What it does |
|---------|-------------|
| `number-visualization` | Create visual representations using number lines, area models, base-ten blocks, and fraction bars |
| `step-by-step-math` | Break math problems into explicit scaffolded steps with plain-language explanations |
| `estimation-practice` | Generate estimation exercises that build number sense using everyday contexts |
| `range-comparison` | Compare datasets visually using simplified range bars with central-value markers |
| `proportion-waffle` | Visualize proportions on a 10x10 waffle grid of countable squares instead of pie charts |
| `trend-direction` | Show rise/fall/flat trends using directional indicators without requiring axis reading |
| `difference-gap` | Visualize the difference between two values as an explicit gap bar |
| `elapsed-time` | Calculate time between two points using a timeline bar, bypassing base-60 mental math |

## Design principles

Each command converts a numerical cognitive task into a spatial or visual one:

- **Subitizing support** → proportion-waffle uses countable squares instead of continuous areas
- **Magnitude comparison** → range-comparison and difference-gap make relative size physically visible
- **Temporal reasoning** → elapsed-time replaces clock arithmetic with a linear timeline
- **Pattern recognition** → trend-direction uses arrows and sparklines instead of axis coordinates
- **Scaffolded reasoning** → step-by-step-math and estimation-practice build procedural fluency

The visualization commands specifically avoid representations that require the exact numerical skills dyscalculic users struggle with. For example, waffle grids replace pie charts because estimating angles is harder than counting squares.

## Internationalization

Supports 10 locales with culturally appropriate math conventions:

| Locale | Language | Key adaptations |
|--------|----------|----------------|
| `en` | English | Default — US/UK number formatting |
| `es` | Spanish | Period for thousands, comma for decimals (1.000,50) |
| `fr` | French | Space for thousands, comma for decimals (1 000,50), vigesimal remnants |
| `de` | German | Comma for decimals, Rechengeld (play money) for estimation |
| `ja` | Japanese | 万/億 grouping (10,000-based), soroban abacus references |
| `zh` | Chinese | 万/亿 grouping, suanpan abacus, RMB currency |
| `ar` | Arabic | RTL layout, Eastern Arabic numerals option (٠١٢٣), hisab traditions |
| `pt` | Portuguese | Brazilian conventions (R$ currency, period thousands separator) |
| `ko` | Korean | 만/억 grouping, Korean won formatting |
| `hi` | Hindi | Lakh/crore grouping (1,00,000), Devanagari numeral option |

Each locale adapts number separators, currency symbols, traditional math tools, educational grade-level terminology, and example contexts to local norms.

## Project structure

```
dyscalculia-support-skill/
├── build.ts                    # Multi-format build system
├── package.json
├── tsconfig.json
└── source/
    ├── manifest.json           # Skill definition with all 8 commands
    ├── skills/
    │   └── dyscalculia-support.md  # Domain knowledge and CRA framework
    ├── commands/
    │   ├── number-visualization.md
    │   ├── step-by-step-math.md
    │   ├── estimation-practice.md
    │   ├── range-comparison.md
    │   ├── proportion-waffle.md
    │   ├── trend-direction.md
    │   ├── difference-gap.md
    │   └── elapsed-time.md
    └── i18n/
        ├── ar.json, de.json, es.json, fr.json, hi.json
        ├── ja.json, ko.json, pt.json, zh.json
        └── (en is the default — no separate file needed)
```

## Building

```bash
npm install
npm run build                     # All locales, all 6 output formats
npm run build -- --locale ja      # Japanese only
npm run build -- --validate-only  # Check manifest without building
```

Output goes to `dist/` with subdirectories for each format: `claude-plugin/`, `openai/`, `n8n/`, `prompts/`, `mcp-server/`, `cli/`.

## License

MIT
