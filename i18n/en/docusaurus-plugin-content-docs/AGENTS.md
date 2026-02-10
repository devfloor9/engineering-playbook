<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# docusaurus-plugin-content-docs

## Purpose
i18n translation directory for English documentation content. Contains the docusaurus-plugin-content-docs plugin translations including the sidebar labels JSON file and the complete mirrored documentation structure.

## Key Files
| File | Description |
|------|-------------|
| current.json | Sidebar category label translations for English locale (version label, 7 category labels) |
| current/ | Complete mirror of docs/ directory with English translations of all markdown files |

## For AI Agents

### Working In This Directory
This is an **i18n plugin directory** for documentation translations. When working with translations:

1. **Mirror structure**: The `current/` subdirectory must exactly match `docs/` structure
2. **Translate content only**: Keep frontmatter structure identical, translate title, description, and body content
3. **Update current.json**: When adding new sidebar categories, add corresponding English labels
4. **Maintain technical accuracy**: Preserve code blocks, YAML, commands, and technical terms
5. **Test translations**: Run `npm run start -- --locale en` to verify English site

### Common Patterns
- **current.json format**: Keys like `sidebar.docs.category.{CategoryName}` map to English category labels
- **File path mapping**: `docs/category/doc.md` → `i18n/en/docusaurus-plugin-content-docs/current/category/doc.md`
- **Frontmatter translation**: Translate `title`, `sidebar_label`, `description`, but keep tags, category, date identical
- **Technical terms**: Keep EKS, Kubernetes, GPU, Milvus, Kagent, etc. in English
- **Code blocks**: Never translate code examples, YAML, JSON, commands

## Dependencies

### Internal
- Source documentation: `../../../docs/`
- Theme translations: `../docusaurus-theme-classic/`
- Docusaurus config: `../../../docusaurus.config.js`
- Translation subdirectory: `./current/` (Level 4)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
