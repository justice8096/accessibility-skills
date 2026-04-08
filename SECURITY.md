# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email **justice8096@gmail.com** with a description of the vulnerability
3. Include steps to reproduce, affected files, and severity assessment if possible
4. You will receive a response within 72 hours

## Security Measures

This project includes the following security controls:

**Input sanitization**: All file path construction in `build.ts` validates inputs against `[a-zA-Z0-9._-]` patterns and uses `path.basename()` to strip directory traversal sequences. The generated MCP server loader applies the same validation at runtime.

**Code generation safety**: Strings interpolated into generated TypeScript code are escaped for quotes, backticks, dollar signs, and newlines to prevent injection.

**Dependency management**: All npm dependencies are pinned to exact versions (no `^` or `~` ranges). Lockfiles are committed for reproducible builds.

**Secret handling**: Sample scripts read credentials from environment variables only. No default API keys or tokens are hardcoded. The `.gitignore` excludes `.env`, `.pem`, `.key`, and other secret file patterns.

## Known Limitations

- The YAML prompt files and OpenAI function schemas are generated artifacts intended for local development use. They are not designed for untrusted multi-tenant environments.
- The n8n workflow accepts webhook input — in production, add authentication to the webhook node.
- The Ollama and OpenAI sample scripts connect to `localhost` by default. When pointing at remote endpoints, ensure TLS is enabled.

## Audit History

Post-commit audit reports are maintained in `audits/`. See `audits/AUDIT_SUMMARY.txt` for the latest results.
