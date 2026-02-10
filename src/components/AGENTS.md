<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# src/components

## Purpose
React components for the Docusaurus site. Provides reusable UI components for category cards, tag lists, related document suggestions, and homepage features.

## Key Files
| File | Description |
|------|-------------|
| CategoryCard.js | React component for displaying category cards with hover animations and color coding |
| RelatedDocs.js | Component for showing related documentation based on tag matching and category similarity |
| TagList.js | Component for rendering clickable tag lists with color-coded badges |
| HomepageFeatures/ | Subdirectory containing homepage feature section components |

## For AI Agents

### Working In This Directory
- All components use Docusaurus React components (@docusaurus/Link, @docusaurus/Translate)
- Category colors are defined inline within components for consistency
- Components follow Korean/English bilingual patterns using Translate wrapper
- Hover effects are implemented inline using onMouseEnter/onMouseLeave handlers
- Category mapping defines 5 main categories: performance-networking, observability-monitoring, genai-aiml, hybrid-multicloud, security-compliance

### Testing Requirements
- Test components in Docusaurus development server: `npm start`
- Verify hover animations work in both light and dark modes
- Check that translated strings are properly defined in i18n/en/code.json
- Validate tag color mappings for all defined tags
- Ensure category links navigate correctly to /docs/{category}

### Common Patterns
- **Category Colors**: Each category has a primary color defined in hex format
- **Tag Mapping**: Tags have predefined colors in TagList.js getTagColor function
- **Related Docs**: Uses tag intersection and category matching for relevance scoring
- **Inline Styles**: Hover effects and dynamic styling use inline style objects
- **i18n Integration**: All user-facing text uses Translate component or translate function

## Dependencies

### Internal
- `@docusaurus/Link` - Navigation links
- `@docusaurus/Translate` - Internationalization
- `../css/custom.css` - Global styles and CSS variables
- `i18n/en/code.json` - English translation strings

### External
- react - React framework
- clsx - Conditional CSS class utility (used in homepage features)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
