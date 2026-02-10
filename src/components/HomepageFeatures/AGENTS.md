<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# HomepageFeatures

## Purpose
React component for rendering the homepage feature cards that showcase the 5 core technical domains of the Engineering Playbook. Displays interactive category cards with icons, descriptions, and navigation links.

## Key Files
| File | Description |
|------|-------------|
| index.js | React component with FeatureList array containing 5 category cards (Infrastructure Optimization, Operations & Observability, Agentic AI Platform, Hybrid Infrastructure, Security & Governance) |
| styles.module.css | CSS module with `.features` container and `.featureSvg` styling (200x200px icons) |

## For AI Agents

### Working In This Directory
This is a **Docusaurus theme component** for the homepage. When modifying:

1. **Edit index.js** to add/update feature cards
2. **Update FeatureList array** with title, Svg, description, link properties
3. **Maintain Korean text** for descriptions (default locale)
4. **Use Docusaurus Link** component for internal navigation
5. **Reference SVG icons** from `@site/static/img/` directory
6. **Test layout** with `npm run start` to verify 3-2 grid layout

### Common Patterns
- **Feature card structure**: `{title, Svg, description, link}`
- **Grid layout**: First 3 cards in row 1, last 2 cards centered in row 2 with offset columns
- **Link component**: Use `@docusaurus/Link` for client-side navigation
- **CSS modules**: Import styles from `./styles.module.css` and reference via `styles.featureSvg`
- **Category links**: Point to category index pages (e.g., `/docs/performance-networking`)

## Dependencies

### Internal
- Parent component directory: `../src/components/`
- Static images: `../../static/img/undraw_docusaurus_*.svg`
- Homepage: `../../src/pages/index.js` (imports this component)

### External
- `clsx`: CSS class name utility
- `@docusaurus/Link`: Client-side navigation component
- `@theme/Heading`: Docusaurus heading component with accessibility

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
