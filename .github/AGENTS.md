<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# .github

## Purpose
GitHub configuration including CI/CD workflows for automated deployment and content validation.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `workflows/` | GitHub Actions workflow definitions (see `workflows/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Workflows use GitHub Actions YAML syntax
- Deployment targets GitHub Pages (gh-pages branch)
- Link checking runs as a CI validation step

### Testing Requirements
- Workflow YAML must be valid (use yamllint or GitHub Actions validator)
- Test workflow changes in a branch before merging to main

### Common Patterns
- GitHub Pages deployment via `actions/deploy-pages`
- Node.js setup with caching for faster builds

## Dependencies

### Internal
- `package.json` — npm scripts called by workflows
- `docs/` — Content validated by link-check workflow

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
