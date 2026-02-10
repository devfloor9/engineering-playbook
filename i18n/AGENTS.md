<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# i18n

## Purpose
Internationalization files for multi-language support. The site defaults to Korean (ko) with English (en) as a secondary locale.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `en/` | English locale translations and content (see `en/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Korean content lives in `docs/` (default locale, no i18n subfolder needed)
- English translations mirror the `docs/` structure under `en/docusaurus-plugin-content-docs/current/`
- Theme translations (navbar, footer) are JSON files under `en/docusaurus-theme-classic/`
- Use `npm run write-translations` to scaffold missing translation files

### Testing Requirements
- `npm run build` tests both locales
- Preview English with `npm start -- --locale en`

### Common Patterns
- Documentation translations maintain identical file names and frontmatter structure
- UI string translations use JSON key-value format

## Dependencies

### Internal
- Mirrors `docs/` directory structure
- Referenced by `docusaurus.config.js` i18n configuration

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
