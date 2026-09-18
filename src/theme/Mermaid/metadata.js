// Read only author-provided accessibility directives. No description is inferred
// from graph syntax, node names, colors, or a nearby heading.
export function mermaidMetadata(value = '') {
  const source = String(value);
  return {
    title: source.match(/^\s*accTitle\s*:\s*(.+)$/mi)?.[1]?.trim(),
    description: (source.match(/^\s*accDescr\s*\{([\s\S]*?)\}/mi)?.[1] ||
      source.match(/^\s*accDescr\s*:\s*(.+)$/mi)?.[1])?.trim(),
  };
}
