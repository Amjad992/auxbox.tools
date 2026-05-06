import PropTypes from 'prop-types';

export const metadata = {
  title: 'Hash Generator — SHA-256, SHA-1, SHA-512, MD5',
  description:
    'Free hash generator. Paste text or drop a file → get SHA-256, SHA-512, SHA-1, MD5 hashes side-by-side. Browser-only — sensitive inputs never leave your device.',
  keywords: [
    'Hash Generator',
    'SHA-256',
    'SHA-512',
    'SHA-1',
    'MD5',
    'File Hash Calculator',
    'Checksum Calculator',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Hash Generator',
    description:
      'SHA-256 / SHA-1 / MD5 / SHA-512 for text or files — browser-only, no upload.',
    url: 'https://auxbox.tools/hash-generator',
  },
  twitter: {
    card: 'summary',
    title: 'Hash Generator',
    description:
      'Hash text or files — SHA-256, SHA-1, MD5, SHA-512. No upload.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/hash-generator',
  },
};

export default function HashGeneratorLayout({children}) {
  return children;
}

HashGeneratorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
