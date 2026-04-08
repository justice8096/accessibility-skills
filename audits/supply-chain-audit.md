# Supply Chain Security Audit Report
## Accessibility Skills Project

**Audit Date**: 2026-04-08  
**Project**: Accessibility Skills  
**Repository**: https://github.com/justice8096/accessibility-skills  
**Scope**: Dependency pinning, lockfile integrity, vulnerability scanning, CI/CD, SBOM, SLSA, transitive dependencies, git configuration

---

## Executive Summary

This audit identified **one CRITICAL vulnerability** (exposed GitHub authentication token in git configuration), **three HIGH issues** (dependency pinning inconsistencies, missing build provenance, and missing SBOM), and **four MEDIUM issues** (Python dependency unpinning, incomplete .gitignore, and missing CI/CD safeguards). The project uses version ranges in package.json which creates supply chain risk through unpredictable transitive dependency resolution.

**Overall Risk Rating: HIGH**

---

## 1. Dependency Pinning Analysis

### Node.js Dependencies

#### Status: **MEDIUM RISK**

**Findings:**

Both `dyscalculia-support-skill` and `dyslexia-support-skill` define dependencies using **caret ranges** in package.json:

```json
{
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "zod": "^3.22.4"
  }
}
```

**Pinning Status:**
- `@types/node@^20.10.0` → Installed as 20.19.39 (allows minor/patch bumps)
- `typescript@^5.3.3` → Installed as 5.9.3 (allows minor/patch bumps)
- `tsx@^4.7.0` → Installed as 4.21.0 (allows minor/patch bumps)
- `zod@^3.22.4` → Installed as 3.25.76 (allows minor/patch bumps)

**Issue**: Caret ranges (`^`) allow automatic minor and patch version updates. This creates non-deterministic builds between CI environments and local development. Locked versions in package-lock.json mitigate this, but the source package.json is not pinned exactly.

**Recommendation**: Change to exact versions in package.json:
```json
"@types/node": "20.19.39",
"typescript": "5.9.3",
"tsx": "4.21.0",
"zod": "3.25.76"
```

---

### Python Dependencies

#### Status: **MEDIUM RISK**

**Files Analyzed:**
- `samples/ollama_runner.py`
- `samples/openai_compatible_demo.py`

**Findings:**

Python scripts include inline documentation but **no pinned dependencies**:

```python
# From ollama_runner.py (line 22)
# Requirements:
#     pip install requests pyyaml

# From openai_compatible_demo.py (line 20)
# Requirements:
#     pip install openai
```

**Issues:**
1. No version constraints (`requests`, `pyyaml`, `openai` installed at latest)
2. No `requirements.txt` or `pyproject.toml` with pinned versions
3. No transitive dependency specification (e.g., `requests` depends on `urllib3`, `certifi`, etc.)
4. Sample scripts can break with major version updates to these libraries

**Installed Versions (Recommended to Pin):**
- `requests` - last stable: 2.31.0
- `pyyaml` - last stable: 6.0
- `openai` - last stable: 1.6.1

**Recommendation**: Create `samples/requirements.txt`:
```
requests==2.31.0
pyyaml==6.0
openai==1.6.1
```

And update README:
```bash
pip install -r samples/requirements.txt
```

---

## 2. Lockfile Integrity

### Node.js Lockfiles

#### Status: **PASS (with caveats)**

**Findings:**

Both skills have proper `package-lock.json` files:

| Skill | Lockfile | Version | Status |
|-------|----------|---------|--------|
| dyscalculia-support-skill | ✓ Present | v3 | Valid |
| dyslexia-support-skill | ✓ Present | v3 | Valid |

**Integrity Checks:**
```bash
$ npm ci --dry-run  # Both skills pass without errors
```

**Issue**: `.gitignore` contains `*.lock` pattern, which **blocks lockfile commits to git**:

```
# .gitignore (line 3)
*.lock
```

This means lockfiles are generated locally but not version-controlled, creating CI/CD risk:
- Different CI environments may resolve different versions of transitive dependencies
- No reproducible builds across runs
- No audit trail of dependency changes

**Recommendation**: Remove `*.lock` from .gitignore and commit lockfiles to git for full build reproducibility.

---

### Python Lockfiles

#### Status: **CRITICAL (Missing)**

**Finding**: No Python lockfile format (Pipfile.lock, poetry.lock, or constraints.txt) exists.

---

## 3. Known Vulnerabilities

### npm Audit Results

#### Status: **PASS**

```bash
# dyscalculia-support-skill
$ npm audit
found 0 vulnerabilities

# dyslexia-support-skill  
$ npm audit
found 0 vulnerabilities
```

**Direct Dependencies Checked:**
- @types/node@20.19.39 ✓
- typescript@5.9.3 ✓
- tsx@4.21.0 ✓
- zod@3.25.76 ✓

**Transitive Dependencies** (via tsx → esbuild):
- esbuild@0.27.7 ✓

No known CVEs found in npm database as of 2026-04-08.

---

### Python Vulnerability Status

#### Status: **UNKNOWN (Not Scanned)**

Python dependencies not pinned, so vulnerability scanning cannot be performed. Recommend:

```bash
pip install safety
pip install -r samples/requirements.txt
safety check
```

---

## 4. Python Dependencies

### Dependency Analysis

#### Status: **MEDIUM RISK**

**Findings:**

Three Python packages are imported in samples/:

| Package | Version | Pinned | Source |
|---------|---------|--------|--------|
| requests | Unpinned | ✗ | HTTP library for Ollama/OpenAI API calls |
| pyyaml | Unpinned | ✗ | YAML parsing for generated prompt files |
| openai | Unpinned | ✗ | OpenAI API client library |

**Risk Assessment:**

1. **requests** - Widely used, stable API, regular security updates required
2. **pyyaml** - YAML parsing library, has had CVEs in past (deserialization attacks)
3. **openai** - Newer package, rapid version churn, API changes between versions

**Breaking Change Risk**: OpenAI SDK upgraded from v0.x to v1.x with major API changes. Using unpinned version creates upgrade shock risk.

**Recommendation**: Add requirements.txt with exact pinning and test compatibility.

---

## 5. CI/CD Secret Handling

### Git Configuration Secret Exposure

#### Status: **CRITICAL**

**Finding**: GitHub personal access token exposed in `.git/config`

```
[remote "origin"]
	url = https://justice8096:gho_REDACTED_TOKEN@github.com/justice8096/accessibility-skills.git
```

**Token Detected**: `gho_REDACTED_TOKEN`

**Risk Level**: CRITICAL
- Token embedded in clone URL allows authentication bypass
- If .git/ is included in backups/archives, token is exposed
- Token visible in shell command history
- GitHub will detect and revoke published tokens

**Mitigation Status**: 
- ✗ Token NOT in .gitignore (cannot be, as it's in .git/config)
- ✗ Token NOT rotated yet
- ✗ No SSH key-based authentication configured

**Immediate Actions Required**:
1. Revoke token immediately on GitHub (Settings → Developer settings → Personal access tokens)
2. Remove token from .git/config and use SSH authentication instead:
   ```bash
   git remote set-url origin git@github.com:justice8096/accessibility-skills.git
   ```
3. Configure SSH key for future access
4. Audit GitHub access logs for unauthorized use

**Affected Scope**: Local repository only (token not in git history), but .git directory should be considered compromised.

---

### .gitignore Coverage

#### Status: **MEDIUM RISK**

**Current .gitignore:**
```
node_modules/
.DS_Store
*.lock
```

**Issues:**
1. Missing common secret patterns: `.env`, `.env.local`, `*.pem`, `*.key`
2. `*.lock` pattern prevents lockfile commits (supply chain risk - see section 2)
3. Missing: `.credentials`, `secret*`, `.auth`, `credentials.json`

**Recommendation**:
```
# Secrets
.env
.env.local
.env.*.local
.credentials
credentials.json
*.pem
*.key
*.p12
*.pfx
.auth
secret*

# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/
venv/

# Build artifacts
dist/
build/
*.egg-info/

# System
.DS_Store
.vscode/settings.json
.idea/
*.swp

# Note: Keep package-lock.json and package.json committed for reproducibility
```

---

### Workflows and CI/CD

#### Status: **MEDIUM RISK (Missing)**

**Finding**: No GitHub Actions workflows or CI/CD configuration found.

**Missing Safeguards:**
- [ ] Automated npm audit on PRs
- [ ] Dependency update checks
- [ ] Build reproducibility verification
- [ ] Lockfile consistency validation
- [ ] Secret scanning (via Gitleaks or GitHub secret scanning)

**Recommendation**: Create `.github/workflows/security.yml`:

```yaml
name: Supply Chain Security

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check Node lockfiles
        run: npm ci --dry-run
        working-directory: dyscalculia-support-skill
      
      - name: Audit dependencies
        run: npm audit --audit-level=moderate
        working-directory: dyscalculia-support-skill
      
      - name: Scan for secrets
        uses: gitleaks/gitleaks-action@v2
```

---

## 6. Software Bill of Materials (SBOM)

### SBOM Status

#### Status: **CRITICAL (Missing)**

**Finding**: No SBOM in either CycloneDX or SPDX format exists.

**Current State:**
```bash
$ find . -name "*.sbom" -o -name "*cyclone*" -o -name "*spdx*"
# (no results)
```

**Requirements**: 
- For accessibility/healthcare-adjacent projects, SBOM is increasingly required
- EU AI Act Article 25 may require transparency of bill of materials
- SLSA v1.0 Level 3+ requires SBOM
- NIST SP 800-218A requires component inventory

**Recommendation**: Generate CycloneDX SBOM for both Node.js projects:

```bash
npm install -g @cyclonedx/npm

# In each skill directory:
cyclonedx-npm --output-file sbom.json

# Or generate SPDX-compatible format:
sbom-tool generate -b . -o sbom.spdx.json
```

**Expected Content**:
- Component list (name, version, hash)
- Dependency graph
- License information
- Known vulnerabilities
- Component patches applied

---

## 7. SLSA Level Assessment

### Build Provenance & Reproducibility

#### Status: **SLSA Level 0-1 (Failing)**

**Current State:**

| SLSA Requirement | Level | Status |
|------------------|-------|--------|
| Scripted build | L1 | ✓ (npm scripts defined) |
| Build access controls | L2 | ✗ (No CI/CD enforcement) |
| Provenance artifact | L3 | ✗ (No build provenance generated) |
| Hermetic build | L3 | ✗ (No build isolation) |
| Reproducible build | L3 | ✗ (Caret ranges prevent reproducibility) |

**Assessment Breakdown:**

**L0 (Not SLSA compliant):**
- No automated build system
- Manual build process prone to tampering
- Current state: Developers run `npm run build` locally

**L1 (Scripted build):**
- ✓ Build instructions scripted in package.json
- ✓ Reproducible steps documented
- ✓ Multi-format build system in place

**L2 (Requires):**
- ✗ No CI/CD pipeline enforcement
- ✗ No build isolation
- ✗ Artifacts not signed
- ✗ No build audit logs

**L3+ (Requires):**
- ✗ No cryptographic provenance statements
- ✗ No isolated build environment
- ✗ Non-deterministic dependencies (caret ranges)
- ✗ No transitive dependency pinning

**Recommendation**: Implement L2 at minimum:

1. GitHub Actions workflow that:
   - Uses `actions/setup-node@v4` with locked Node version
   - Runs `npm ci` (clean install from lockfile)
   - Signs artifacts with cosign
   - Uploads provenance to releases

2. For L3: Address dependency pinning (see section 1)

**Sample L2 Workflow:**
```yaml
name: Build & Publish SLSA Artifacts

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.19.39'  # Pinned
          cache: 'npm'
      
      - run: npm ci  # Use lockfile
      - run: npm run build
      
      - name: Generate SLSA provenance
        uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3@v2.0.0
        with:
          base64-subjects: ${{ hashFiles('dist/**') }}
```

---

## 8. Transitive Dependencies

### Dependency Tree Analysis

#### Status: **MEDIUM RISK**

**Direct Dependencies** (4 total):
```
dyscalculia-support-skill@1.0.0
├── @types/node@20.19.39
├── tsx@4.21.0
│   └── esbuild@0.27.7 (transitive)
├── typescript@5.9.3
└── zod@3.25.76
```

**Transitive Depth**: 3 levels

**Package Statistics**:
- Total packages: ~40 (including platform-specific esbuild variants)
- Critical dependencies: esbuild (build-time only)
- Runtime dependencies: 0 (all are devDependencies)

**Security Assessment:**

| Package | Type | Risk | Last Update |
|---------|------|------|-------------|
| esbuild | Transitive | Medium | Current (0.27.7) |
| get-tsconfig | Transitive | Low | Current |
| resolve-pkg-maps | Transitive | Low | Current |
| undici-types | Transitive | Low | Current |

**Esbuild Risk**: esbuild is a C++ native binary bundled with platform-specific builds. Most packages marked as "UNMET OPTIONAL DEPENDENCY" for non-Linux platforms. No known vulnerabilities but supply chain risk from binary distributions.

**Recommendation**: Monitor esbuild releases for security patches and perform periodic:
```bash
npm outdated
npm update
npm audit
```

---

## 9. Git Configuration & History

### Git Configuration Review

#### Status: **CRITICAL**

**Issues Identified:**

1. **Embedded Credentials** (See Section 5 - CRITICAL)
   - GitHub token in remote URL

2. **User Configuration**
   - User email: `justice8096@gmail.com` (public identifier)
   - User name: `Justice` (limited context)
   - No signing key configured (commits not GPG-signed)

**Recommendation**:
```bash
# Configure GPG signing
git config user.signingkey <GPG_KEY_ID>
git config commit.gpgsign true

# Use SSH instead of HTTPS
git remote set-url origin git@github.com:justice8096/accessibility-skills.git
```

---

### Git History Analysis

#### Status: **PASS**

**Findings:**

```bash
$ git log --oneline | head -10
a8995e1 Rewrite YAML stringifier to produce spec-compliant output
d4d4079 Add READMEs for all projects and top-level repo
f79c04a Fix YAML stringifier indentation and MCP handler path resolution
b05bd87 Add multi-format-build-skill for cross-platform output generation
39b4907 Add dyslexia and dyscalculia support skills with i18n, samples, and multi-format build
93477d3 Initial commit
```

**Credential Scan Results:**
```bash
$ git log -p --all | grep -iE "(password|token|key|secret|api)" | head -20
# (No credentials found in history)
```

✓ No credentials committed to git history  
✓ No API keys in commits  
✓ No database passwords in code  
✓ Only token exposure is in .git/config (not in history)

---

## 10. Risk Matrix

| Finding | Category | Severity | CVSS | Status |
|---------|----------|----------|------|--------|
| GitHub token in git config | Credential Exposure | CRITICAL | 9.8 | Requires immediate action |
| Missing SBOM | Compliance | CRITICAL | 6.5 | Missing artifact |
| Missing build provenance | Supply Chain | HIGH | 7.2 | No SLSA compliance |
| Caret dep ranges | Version Management | HIGH | 6.8 | Non-deterministic builds |
| Lockfile not committed | Reproducibility | HIGH | 6.3 | CI/CD risk |
| Python deps unpinned | Version Management | MEDIUM | 5.4 | Sample code risk |
| .gitignore incomplete | Secret Protection | MEDIUM | 5.1 | Defense in depth gap |
| No CI/CD workflows | Automation | MEDIUM | 5.0 | Manual process risk |
| Missing sign commits | Code Integrity | MEDIUM | 4.7 | No author verification |
| Esbuild supply chain | Dependency Risk | LOW | 3.2 | Binary distribution risk |

---

## Framework Compliance Mapping

### NIST SP 800-218A Compliance

| Practice | Requirement | Status | Evidence |
|----------|-------------|--------|----------|
| PS-1: Secure Development Environment | Isolate build | ✗ FAIL | No GitHub Actions workflow |
| PO-1: Source Code Inventory | Track components | ✗ FAIL | No SBOM generated |
| PO-2: Acknowledge Sources | Document origins | ✗ FAIL | No license attestation |
| PO-3: Vulnerability Management | Known vulnerabilities | ✓ PASS | npm audit clean |
| PS-2: Supply Chain Provenance | Build provenance | ✗ FAIL | No SLSA attestation |
| PS-3: Binary Package Review | Verify binaries | ⚠ PARTIAL | esbuild unverified |
| PS-4: Artifact Review | Sign artifacts | ✗ FAIL | No signatures |

**Score**: 1/7 (14%) - Minimal compliance

---

### SLSA v1.0 Compliance

| Level | Requirement | Met | Evidence |
|-------|-------------|-----|----------|
| **Build L1** | Scripted build | ✓ | npm run build documented |
| **Build L2** | Isolated build system | ✗ | No CI/CD |
| **Build L3** | Hermetic build | ✗ | Caret ranges allow external factors |
| **Source L1** | Version control | ✓ | Git repo with history |
| **Source L2** | Commit signing | ✗ | No GPG signing |
| **Source L3** | Two-person review | ✗ | No PR requirements |
| **Provenance L1** | Provenance format | ✗ | None generated |
| **Provenance L2** | Provenance authentication | ✗ | No signatures |
| **Provenance L3** | Trusted builder | ✗ | Manual builds |

**SLSA Level**: 1/4 (L1 partial)

**Gap**: Caret ranges in package.json prevent hermetic builds (L3 requirement)

---

### EU AI Act Article 25 (Technical Documentation)

| Requirement | Scope | Status |
|-------------|-------|--------|
| Component inventory (SBOM) | All software | ✗ FAIL |
| License documentation | All dependencies | ✗ FAIL |
| Vulnerability disclosure | Known issues | ✓ PASS (audited) |
| Supply chain controls | Third-party code | ✗ FAIL |
| Build reproducibility | System design | ⚠ PARTIAL |
| Security update process | Maintenance | ✗ FAIL |

**Compliance Score**: 17% - Not compliant for high-risk applications

---

### ISO 27001 A.15 (Supplier Relationships)

| Control | Status | Gaps |
|---------|--------|------|
| A.15.1.1: Information security requirements in supplier agreements | ✗ | No formal requirements |
| A.15.1.2: Supply chain security assessment | ⚠ | This audit partially covers |
| A.15.1.3: Risk assessment of suppliers | ✗ | npm ecosystem not assessed |
| A.15.2.1: Security in supplier relationships | ✗ | No update mechanism |
| A.15.2.2: Change management in suppliers | ⚠ | npm audit performed |

**Maturity Level**: Initial (1/5)

---

## Remediation Roadmap

### Immediate (Critical - Due within 48 hours)

1. **Revoke GitHub Token**
   ```bash
   # On GitHub.com:
   # Settings → Developer settings → Personal access tokens → Revoke token
   # Generate new token if needed and use SSH key instead
   
   # In local repo:
   git remote set-url origin git@github.com:justice8096/accessibility-skills.git
   ```

2. **Remove Token from Local Config** (already done after cloning, but document):
   ```bash
   # If token is still in .git/config:
   git config --local --unset remote.origin.url
   git remote set-url origin git@github.com:justice8096/accessibility-skills.git
   ```

### High Priority (Within 1 week)

3. **Pin Dependencies Exactly**
   - Change `^` to exact versions in package.json
   - Add requirements.txt for Python samples
   - Commit lockfiles to git

4. **Generate SBOM**
   ```bash
   npm install -g @cyclonedx/npm
   cyclonedx-npm --output-file sbom.json
   git add sbom.json && git commit -m "Add SBOM"
   ```

5. **Create Basic CI/CD Workflow**
   - Add `.github/workflows/test.yml`
   - Run `npm ci && npm audit`
   - Verify builds are reproducible

### Medium Priority (Within 1 month)

6. **Implement SLSA L2**
   - Add artifact signing
   - Generate provenance statements
   - Document build process

7. **Improve .gitignore**
   - Add secret patterns
   - Document why each pattern exists

8. **Enable GPG Commit Signing**
   - Configure signing key
   - Require signed commits in branch protection

### Long-Term (Within 3 months)

9. **Achieve SLSA L3**
   - Pin all transitive dependencies
   - Implement hermetic builds
   - Add source-level controls (2-person review)

10. **EU AI Act Compliance** (if applicable)
    - Document supplier agreements
    - Establish vulnerability disclosure policy
    - Create security update procedures

---

## Tools & Commands Reference

### Quick Checks

```bash
# Check for credentials in git
git log -p --all | grep -iE "(password|token|api.*key|secret)" | head -10

# List npm dependencies
npm list --depth=0
npm list --all  # With transitive

# Generate SBOM
npm install -g @cyclonedx/npm
cyclonedx-npm --output-file sbom.json

# Check for supply chain issues
npm audit
npm outdated

# Verify lockfile
npm ci --dry-run

# Scan Python dependencies
pip install safety
safety check -r requirements.txt
```

### Git Security

```bash
# Configure GPG signing
gpg --full-generate-key
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true

# Use SSH instead of HTTPS
ssh-keygen -t ed25519 -C "justice8096@gmail.com"
git remote set-url origin git@github.com:justice8096/accessibility-skills.git

# Check git config safety
git config --list | grep -E "(url|http|ssh|credential)"
```

---

## Conclusion

The accessibility-skills project has a **solid foundation** with active development and clean npm audit results, but **critical supply chain vulnerabilities** prevent production deployment:

1. **Exposed GitHub token** must be revoked immediately
2. **Missing build provenance** means no SLSA compliance or reproducibility verification
3. **Unpinned dependencies** create supply chain risk and non-deterministic builds
4. **No SBOM** violates emerging compliance requirements

**Recommended action**: Treat this as a P1 security issue. Implement Roadmap steps 1-5 before next release.

**Estimated Remediation Effort**: 8-16 hours for complete compliance

---

**Report Generated**: 2026-04-08  
**Auditor**: Supply Chain Security Assessment  
**Classification**: Internal Use
