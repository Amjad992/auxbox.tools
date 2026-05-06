import PropTypes from 'prop-types';

export const metadata = {
  title: 'UUID Generator — UUID v4 + UUID v7 in Bulk',
  description:
    'Free UUID generator. Generate UUID v4 (random) or UUID v7 (timestamp-ordered) in bulk. Per-row copy, copy-all, download .txt. Browser-only, no server.',
  keywords: [
    'UUID Generator',
    'UUID v4',
    'UUID v7',
    'Random UUID',
    'Bulk UUID Generator',
    'GUID Generator',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'UUID Generator',
    description:
      'Generate UUID v4 or UUID v7 in bulk. Free and offline.',
    url: 'https://auxbox.tools/uuid-generator',
  },
  twitter: {
    card: 'summary',
    title: 'UUID Generator',
    description:
      'Bulk UUID v4 / v7 generator. Free and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/uuid-generator',
  },
};

export default function UuidGeneratorLayout({children}) {
  return children;
}

UuidGeneratorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
