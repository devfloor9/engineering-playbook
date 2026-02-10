<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# i18n/en

## Purpose
English locale translations for the Docusaurus site. Provides translation strings for UI elements, theme components, and custom content.

## Key Files
| File | Description |
|------|-------------|
| code.json | Translation strings for custom components and homepage content (425 lines) |
| docusaurus-plugin-content-docs/ | Documentation plugin translation overrides |
| docusaurus-theme-classic/ | Theme component translation overrides |

## For AI Agents

### Working In This Directory
- code.json contains key-value pairs with message, description fields
- Translation IDs follow pattern: `{section}.{component}.{field}` (e.g., homepage.features.infrastructure.title)
- All Docusaurus default theme strings are included (theme.*, navbar.*, docs.*)
- Custom homepage strings use `homepage.*` prefix
- Translations are loaded automatically by Docusaurus i18n system
- Korean is the default language, English translations override defaults

### Testing Requirements
- Validate JSON syntax with `npm run build` or JSON linter
- Test translation loading by switching to English locale
- Verify all translation IDs match usage in components
- Check for missing translations (causes fallback to message ID)
- Test pluralization forms (e.g., "One post|{count} posts")
- Validate special characters are properly escaped

### Common Patterns
- **Translation Structure**: `"translation.id": { "message": "Text", "description": "Context" }`
- **Pluralization**: Use pipe separator for plural forms: "One item|{count} items"
- **Variables**: Use {variableName} syntax for dynamic content
- **Descriptions**: Provide context for translators in description field
- **Homepage Keys**: Custom content uses homepage.* namespace

## Dependencies

### Internal
- Referenced by all React components using Translate or translate()
- Loaded by Docusaurus i18n plugin based on locale configuration
- `docusaurus.config.js` - Locale configuration
- `src/pages/index.js` - Homepage translations
- `src/components/*.js` - Component translations

### External
- Docusaurus i18n system (@docusaurus/Translate)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
