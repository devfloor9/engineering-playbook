<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# .github/workflows

## Purpose
GitHub Actions CI/CD workflows for automated builds, deployments, and link validation.

## Key Files
| File | Description |
|------|-------------|
| deploy.yml | Build and deploy workflow to GitHub Pages (test + deploy jobs) |
| link-check.yml | Automated link checker using lychee (runs on push, PR, schedule, manual) |

## For AI Agents

### Working In This Directory
- deploy.yml runs on push/PR to main branch with two jobs: test and deploy
- deploy.yml uses NODE_OPTIONS=--max_old_space_size=6144 for memory optimization
- deploy.yml only deploys from main branch (if: github.ref == 'refs/heads/main')
- link-check.yml runs weekly (Monday 9:00 AM UTC) plus on-demand via workflow_dispatch
- link-check.yml uses lychee-action v2 for link validation with caching
- Both workflows use Node.js 20 with npm caching for faster builds

### Testing Requirements
- Test workflows locally impossible (GitHub Actions specific), validate YAML syntax
- For deploy.yml: Verify build completes with `npm run build` locally
- For link-check.yml: Run lychee locally to test link checking configuration
- Check workflow permissions are minimal (principle of least privilege)
- Validate concurrency groups prevent duplicate deployments
- Test that link-check creates PR comments on failures

### Common Patterns
- **Job Dependencies**: deploy.yml uses `needs: test` to ensure tests pass before deployment
- **Caching**: Both use actions/cache for npm dependencies and lychee cache
- **Conditional Execution**: deploy job only runs on main branch
- **Artifact Upload**: Link check uploads report as artifact with 30-day retention
- **PR Comments**: link-check.yml posts results to PR using github-script action
- **Environment Configuration**: deploy.yml uses github-pages environment

## Dependencies

### Internal
- `package.json` - npm scripts (build, generate-tags)
- `docusaurus.config.js` - Build configuration
- `docs/**` - Documentation content for link checking
- `*.md` - Markdown files for link checking

### External
- actions/checkout@v4 - Repository checkout
- actions/setup-node@v4 - Node.js setup
- actions/configure-pages@v4 - GitHub Pages configuration
- actions/upload-pages-artifact@v3 - Pages artifact upload
- actions/deploy-pages@v4 - Pages deployment
- actions/cache@v4 - Dependency caching
- lycheeverse/lychee-action@v2 - Link checking
- actions/upload-artifact@v4 - Artifact upload
- actions/github-script@v7 - PR comment posting

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
