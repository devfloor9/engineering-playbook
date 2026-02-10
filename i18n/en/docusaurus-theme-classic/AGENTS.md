<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# docusaurus-theme-classic

## Purpose
i18n translation directory for Docusaurus Classic theme UI strings. Contains English translations for footer and navbar components including navigation labels, links, and copyright text.

## Key Files
| File | Description |
|------|-------------|
| footer.json | Footer component translations with 3 column titles (Documentation, More, Community), 6 category links, GitHub link, and copyright text |
| navbar.json | Navbar component translations including site title, logo alt text, Documentation link, and GitHub link |

## For AI Agents

### Working In This Directory
This is an **i18n theme translation directory** for UI components. When updating:

1. **Edit footer.json** to modify footer links, column titles, or copyright
2. **Edit navbar.json** to change navbar labels or logo text
3. **Maintain key structure**: Keys follow pattern `link.title.{Title}`, `link.item.label.{Label}`, etc.
4. **Keep consistent with site**: Footer links should match actual doc paths
5. **Test UI changes**: Run `npm run start -- --locale en` to preview English UI

### Common Patterns
- **footer.json keys**:
  - `link.title.{ColumnTitle}`: Footer column headers
  - `link.item.label.{LinkText}`: Individual footer links
  - `copyright`: Footer copyright message
- **navbar.json keys**:
  - `title`: Site title in navbar
  - `logo.alt`: Logo image alt text
  - `item.label.{LinkText}`: Navbar menu items
- **Message format**: Each entry has `message` (English text) and `description` (context for translators)

## Dependencies

### Internal
- Korean theme defaults: Defined in `../../../docusaurus.config.js`
- Content translations: `../docusaurus-plugin-content-docs/`
- Site structure: `../../../docs/` (determines footer link targets)

### External
- `@docusaurus/theme-classic`: Base theme providing translation structure

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
