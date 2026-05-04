import PropTypes from 'prop-types';

export const metadata = {
  title: 'Markdown Preview - Live Markdown Editor & Renderer',
  description:
    'Free online markdown preview. Type on the left, see rendered HTML on the right. GitHub-flavored markdown with tables, task lists, and fenced code — runs entirely in your browser.',
  keywords: [
    'Markdown Preview',
    'Markdown Editor',
    'Markdown Renderer',
    'GitHub Flavored Markdown',
    'GFM',
    'Live Preview',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Markdown Preview - Live Markdown Editor & Renderer',
    description:
      'Type markdown on the left, see the rendered HTML on the right. GFM tables, task lists, fenced code — browser-only.',
    url: 'https://auxbox.tools/markdown-preview',
  },
  twitter: {
    card: 'summary',
    title: 'Markdown Preview',
    description:
      'Live markdown preview with GitHub-flavored support. Free and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/markdown-preview',
  },
};

export default function MarkdownPreviewLayout({children}) {
  return children;
}

MarkdownPreviewLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
