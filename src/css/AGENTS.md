<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# src/css

## Purpose
Custom CSS overrides and styling for the Docusaurus theme. Provides site-wide styling including color schemes, search bar customization, responsive design, and mobile optimizations.

## Key Files
| File | Description |
|------|-------------|
| custom.css | Custom CSS overrides for Docusaurus Infima theme, including search styling, mobile responsiveness, and Engineering Playbook-specific styles |

## For AI Agents

### Working In This Directory
- CSS uses CSS custom properties (variables) defined in :root and [data-theme='dark']
- Search bar is positioned absolutely at center of navbar using transform: translate(-50%, -50%)
- Mobile breakpoints: 996px (tablet), 768px (mobile), 480px (small mobile)
- Touch-friendly navigation uses media query (hover: none) and (pointer: coarse)
- DocSearch customization uses CSS variables with --docsearch-* prefix
- All colors reference Infima CSS variables (--ifm-color-*)

### Testing Requirements
- Test in light and dark modes using theme toggle
- Verify search bar positioning at desktop (>996px), tablet (768-996px), and mobile (<768px)
- Test hover effects on devices without hover capability
- Validate responsive table and code block scrolling on mobile
- Check category card hover animations and transitions
- Test navbar collapse/expand on mobile viewports

### Common Patterns
- **CSS Variables**: Use var(--ifm-color-primary) for theme-aware colors
- **Responsive Design**: Mobile-first approach with max-width media queries
- **Dark Mode**: Separate [data-theme='dark'] selectors for dark theme overrides
- **Transitions**: Smooth animations using transition: all 0.2s ease-in-out pattern
- **Touch Targets**: Minimum 44px height/width for touch-friendly buttons

## Dependencies

### Internal
- Docusaurus Infima CSS framework (bundled by default)
- Infima CSS variables (--ifm-*)

### External
- DocSearch CSS variables (--docsearch-*)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
