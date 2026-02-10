<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# static/img

## Purpose
Image assets for the Docusaurus site including favicon, logo, and illustration graphics.

## Key Files
| File | Description |
|------|-------------|
| .gitkeep | Git placeholder file to ensure directory is tracked |
| favicon.ico | Site favicon displayed in browser tabs |
| logo.svg | Custom site logo (1465 bytes) |
| undraw_docusaurus_mountain.svg | Docusaurus default illustration - mountain theme |
| undraw_docusaurus_react.svg | Docusaurus default illustration - React theme |
| undraw_docusaurus_tree.svg | Docusaurus default illustration - tree theme |

## For AI Agents

### Working In This Directory
- Images are served from /img/ URL path by Docusaurus static file handling
- SVG files are preferred for logos and illustrations (scalable, small file size)
- Favicon should be ICO format for broad browser compatibility
- Undraw illustrations are placeholder graphics from Docusaurus template
- Custom logo.svg (1465 bytes) replaces default Docusaurus logo

### Testing Requirements
- Verify favicon displays correctly in browser tabs
- Check logo.svg renders properly in navbar at different viewport sizes
- Validate SVG files are valid XML and render without errors
- Test image loading in both development and production builds
- Ensure images are optimized for web (small file sizes)

### Common Patterns
- **Logo Reference**: Reference logo as `/img/logo.svg` in docusaurus.config.js
- **Favicon**: Configured in docusaurus.config.js as `favicon: 'img/favicon.ico'`
- **SVG Format**: Preferred for vector graphics (logos, icons, illustrations)
- **Naming Convention**: Use descriptive lowercase names with underscores

## Dependencies

### Internal
- Referenced by `docusaurus.config.js` for logo and favicon configuration
- May be referenced in documentation markdown files using `/img/` paths

### External
None (static assets)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
