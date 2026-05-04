import PropTypes from 'prop-types';

export const metadata = {
  title: 'Markdown to PDF - Print-Ready Markdown',
  description:
    'Free markdown to PDF tool. Type or paste markdown, pick a style preset (default, academic, minimal), and use your browser to save a clean, paginated PDF — entirely offline.',
  keywords: [
    'Markdown to PDF',
    'Markdown PDF Export',
    'Print Markdown',
    'Academic PDF',
    'GitHub Flavored Markdown',
    'GFM',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Markdown to PDF - Print-Ready Markdown',
    description:
      'Type markdown, pick a preset, save as PDF. Browser-only, no upload, no tracking.',
    url: 'https://auxbox.tools/markdown-to-pdf',
  },
  twitter: {
    card: 'summary',
    title: 'Markdown to PDF',
    description:
      'Print-ready markdown with three style presets. Free and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/markdown-to-pdf',
  },
};

export default function MarkdownToPdfLayout({children}) {
  return children;
}

MarkdownToPdfLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
