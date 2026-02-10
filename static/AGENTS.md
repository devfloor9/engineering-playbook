<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# static

## Purpose
Static assets served directly by Docusaurus without processing. Includes images, favicon, logo, and PWA manifest.

## Key Files
| File | Description |
|------|-------------|
| `manifest.json` | Progressive Web App manifest |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `img/` | Image assets: logo, favicon, illustrations (see `img/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Files are served as-is at `/engineering-playbook/` base URL
- Image references in docs use relative paths from `static/`
- Logo and favicon are referenced in `docusaurus.config.js`

### Testing Requirements
- Verify images render correctly with `npm start`

### Common Patterns
- SVG preferred for icons and logos
- Docusaurus illustration SVGs follow `undraw_docusaurus_*.svg` naming

## Dependencies

### Internal
- Referenced by `docusaurus.config.js` (favicon, logo, PWA icons)
- Referenced by docs via markdown image syntax

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
