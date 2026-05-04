// Markdown to PDF constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'markdown_to_pdf_state';

export const PRESETS = {
  DEFAULT: 'default',
  ACADEMIC: 'academic',
  MINIMAL: 'minimal',
};

export const PRESET_VALUES = [PRESETS.DEFAULT, PRESETS.ACADEMIC, PRESETS.MINIMAL];

export const PRESET_OPTIONS = [
  {
    value: PRESETS.DEFAULT,
    label: 'Modern',
    description: 'Sans-serif, 11 pt, 2 cm margins. Clean, general-purpose look.',
  },
  {
    value: PRESETS.ACADEMIC,
    label: 'Academic',
    description:
      'Serif (Georgia), 12 pt, 2.5 cm margins, justified text. Research-paper style.',
  },
  {
    value: PRESETS.MINIMAL,
    label: 'Compact',
    description:
      'Sans-serif, 10 pt, 1.5 cm margins, lighter headings. Tight one-pager.',
  },
];

// Maps a preset to the CSS class applied to the print container. Pure
// function-style table so the page test can assert the wiring without
// rendering.
export function presetClass(preset) {
  switch (preset) {
    case PRESETS.ACADEMIC:
      return 'mtp-preset-academic';
    case PRESETS.MINIMAL:
      return 'mtp-preset-minimal';
    case PRESETS.DEFAULT:
    default:
      return 'mtp-preset-default';
  }
}

export const DEFAULT_STATE = {
  document: '',
  preset: PRESETS.DEFAULT,
};

// Auto-save debounce — same model as Markdown Preview.
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// Soft cap on persisted document size (200 KB). Beyond this we still
// render live but the autosave skips the write.
export const MAX_PERSISTED_CHARS = 200_000;

export const SAMPLE_DOCUMENT = `# Markdown to PDF

Type or paste markdown, pick a style preset, then click **Download as PDF**.
Your browser's print dialog opens with the document already styled — pick
"Save as PDF" from the dialog to save the file.

## Features

- **Bold** and *italic* and \`inline code\`
- Tables, fenced code, task lists
- Three presets: Default, Academic, Minimal

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

> Markdown is rendered safely — script tags and dangerous HTML are stripped.
`;
