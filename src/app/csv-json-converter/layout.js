import PropTypes from 'prop-types';

export const metadata = {
  title: 'CSV ↔ JSON Converter — Free, Browser-Only',
  description:
    'Convert CSV to JSON or JSON to CSV in your browser. Auto-detects delimiter, optional type inference, header row toggle, pretty/minified JSON. No upload, no tracking.',
  keywords: [
    'CSV to JSON',
    'JSON to CSV',
    'CSV converter',
    'CSV parser',
    'CSV JSON',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'CSV ↔ JSON Converter',
    description:
      'CSV ↔ JSON in the browser. Auto-detect delimiter, type inference, header row. Free and offline.',
    url: 'https://auxbox.tools/csv-json-converter',
  },
  twitter: {
    card: 'summary',
    title: 'CSV ↔ JSON Converter',
    description: 'CSV ↔ JSON in the browser. Free and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/csv-json-converter',
  },
};

export default function CsvJsonConverterLayout({children}) {
  return children;
}

CsvJsonConverterLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
