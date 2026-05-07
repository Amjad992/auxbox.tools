import PropTypes from 'prop-types';

export const metadata = {
  title: 'PDF Splitter — Extract Pages or Page Ranges from a PDF',
  description:
    'Free PDF splitter. Drop a PDF, pick page ranges (e.g. 1-3,5,7-9), and download a new PDF with just those pages. Browser-only — your PDF never leaves your device.',
  keywords: [
    'PDF Splitter',
    'PDF Page Extractor',
    'Split PDF',
    'Extract PDF Pages',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'PDF Splitter',
    description:
      'Extract pages or page ranges from a PDF. Free and offline.',
    url: 'https://auxbox.tools/pdf-splitter',
  },
  twitter: {
    card: 'summary',
    title: 'PDF Splitter',
    description: 'Extract PDF pages locally — no upload.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/pdf-splitter',
  },
};

export default function PdfSplitterLayout({children}) {
  return children;
}

PdfSplitterLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
