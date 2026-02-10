<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# scripts

## Purpose
Node.js utility scripts for content generation, validation, search indexing, and document management.

## Key Files
| File | Description |
|------|-------------|
| `generate-summary.js` | Generates SUMMARY.md from all docs |
| `validate-metadata-new.js` | Validates frontmatter metadata in all docs |
| `validate-metadata.js` | Legacy metadata validation (superseded) |
| `validate-links.js` | Checks for broken internal/external links |
| `generate-tag-pages.js` | Generates tag index pages from doc tags |
| `fix-generate-tags.js` | Fix utility for tag generation |
| `auto-categorize.js` | Auto-categorizes documents based on content |
| `new-post.js` | Scaffolds new documentation articles |
| `algolia-index.js` | Pushes content to Algolia search index |
| `generate-tag-pages.js.bak2` | Backup of tag generation script |

## For AI Agents

### Working In This Directory
- All scripts are Node.js (CommonJS or ESM)
- Scripts are invoked via npm scripts defined in root `package.json`
- `validate-metadata-new.js` is the current validator (not `validate-metadata.js`)
- Uses `gray-matter` for frontmatter parsing
- Uses `js-yaml` for YAML processing

### Testing Requirements
- Run scripts with `node scripts/<name>.js` to verify behavior
- Ensure `npm run validate-metadata` still works after changes

### Common Patterns
- File system operations with `fs` and `path`
- Frontmatter parsing with `gray-matter`
- Recursive directory traversal for doc discovery

## Dependencies

### Internal
- Reads from `docs/` directory
- Writes to various output locations (SUMMARY.md, tag pages)

### External
- gray-matter — Frontmatter parsing
- js-yaml — YAML processing

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
