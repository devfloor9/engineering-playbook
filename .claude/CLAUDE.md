# Engineering Playbook - Claude Code Instructions

## Git Commit Rules

- NEVER add `Co-Authored-By` trailers referencing Claude, Anthropic, or any AI assistant
- NEVER add AI-related author/contributor metadata to any file frontmatter
- Use `devfloor9` as the author in all `last_update` frontmatter fields
- Commit messages should not mention AI assistance in any form

## Documentation Standards

- All docs follow Docusaurus 3.9.2 conventions
- Korean is the default locale; English translations live in `i18n/en/`
- Use `.md` extensions in relative markdown links within the same directory
- Remove `.md` extensions for cross-directory links
- `last_update` frontmatter must be an object: `{ date: YYYY-MM-DD, author: devfloor9 }`
- Use `:::info`, `:::tip`, `:::warning` admonitions for callouts
