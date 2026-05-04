// Markdown Preview constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'markdown_preview_state';

export const DEFAULT_STATE = {document: ''};

// Auto-save debounce — small enough that drafts feel persistent, large
// enough to avoid hammering localStorage on every keystroke.
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// Soft cap on persisted document size. Anything beyond this is still
// rendered live, but the autosave skips the write so we don't fill up
// localStorage with a runaway paste. 200 KB ≈ a small book chapter.
export const MAX_PERSISTED_CHARS = 200_000;

export const SAMPLE_DOCUMENT = `# Markdown Preview

Type on the left, see the rendered preview on the right.

## Features

- **Bold** and *italic* and \`inline code\`
- [Links](https://auxbox.tools) and images
- Tables, fenced code, task lists

\`\`\`js
function hello(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

| Feature      | Supported |
|--------------|-----------|
| Tables       | yes       |
| Task lists   | yes       |
| Code fences  | yes       |

- [x] GFM tables
- [x] Task lists
- [ ] Syntax highlighting (later)

> Markdown is rendered safely — script tags and other dangerous HTML are stripped before display.
`;
