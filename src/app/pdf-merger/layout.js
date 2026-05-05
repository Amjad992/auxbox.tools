import PropTypes from 'prop-types';

export const metadata = {
  title: 'PDF Merger - Combine PDFs in Your Browser',
  description:
    'Free online PDF merger. Drop PDFs, drag to reorder, optionally pick page ranges, and download a single combined PDF. Files never leave your browser.',

  keywords: [
    'PDF Merger',
    'Combine PDFs',
    'Merge PDF Files',
    'PDF Joiner',
    'Browser PDF Tool',
    'Free PDF Merger',
    'Privacy-first PDF Tool',
  ],

  openGraph: {
    type: 'website',
    title: 'PDF Merger - Combine PDFs in Your Browser',
    description:
      'Drop PDFs, drag to reorder, optionally pick page ranges, and download a single combined PDF. Runs 100% in your browser.',
    url: 'https://auxbox.tools/pdf-merger',
  },

  twitter: {
    card: 'summary',
    title: 'PDF Merger',
    description:
      'Combine PDFs entirely in your browser — no uploads, ever.',
  },

  alternates: {
    canonical: 'https://auxbox.tools/pdf-merger',
  },
};

export default function PdfMergerLayout({children}) {
  return children;
}

PdfMergerLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
