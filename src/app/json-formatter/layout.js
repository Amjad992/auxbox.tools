import PropTypes from 'prop-types';

export const metadata = {
  title: 'JSON Formatter & Validator — Pretty-print, Minify, Validate',
  description:
    'Free JSON formatter and validator. Paste JSON to pretty-print, minify, or validate with line/column error reporting. Sort keys, indent options, browser-only — your data never leaves the page.',
  keywords: [
    'JSON Formatter',
    'JSON Validator',
    'JSON Pretty Print',
    'JSON Minifier',
    'JSON Beautifier',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'JSON Formatter & Validator',
    description:
      'Pretty-print, minify, validate JSON. Browser-only, no upload.',
    url: 'https://auxbox.tools/json-formatter',
  },
  twitter: {
    card: 'summary',
    title: 'JSON Formatter & Validator',
    description:
      'Pretty-print, minify, validate JSON. No upload.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/json-formatter',
  },
};

export default function JsonFormatterLayout({children}) {
  return children;
}

JsonFormatterLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
