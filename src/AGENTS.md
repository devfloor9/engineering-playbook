<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# src

## Purpose
React source code for the Docusaurus site, including custom components, pages, and CSS styling.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `components/` | Reusable React components (see `components/AGENTS.md`) |
| `css/` | Custom CSS stylesheets (see `css/AGENTS.md`) |
| `pages/` | Custom React pages (see `pages/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Components use plain JavaScript (not TypeScript)
- CSS uses standard CSS with CSS modules (.module.css)
- Follows Docusaurus component conventions
- Import from `@docusaurus/` packages for framework features

### Testing Requirements
- `npm run build` must succeed after changes
- Test locally with `npm start`

### Common Patterns
- CSS Modules for scoped styles
- `clsx` library for conditional classNames
- Docusaurus layout components as wrappers

## Dependencies

### External
- React 18.x
- clsx — Conditional class names
- @docusaurus/core — Framework utilities

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
