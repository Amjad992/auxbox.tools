import PropTypes from 'prop-types';

export const metadata = {
  title: 'Unix Timestamp Converter — Epoch ↔ ISO ↔ Human Time',
  description:
    'Free Unix timestamp converter. ISO 8601, Unix seconds, Unix milliseconds, and human-readable local time — edit any field, the others update live. Time-zone selector, Now button. Browser-only.',
  keywords: [
    'Unix Timestamp',
    'Epoch Converter',
    'ISO 8601',
    'Time Converter',
    'Date to Unix',
    'Unix to Date',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Unix Timestamp Converter',
    description:
      'ISO ↔ Unix epoch ↔ human time. Free and offline.',
    url: 'https://auxbox.tools/timestamp-converter',
  },
  twitter: {
    card: 'summary',
    title: 'Unix Timestamp Converter',
    description: 'ISO ↔ epoch ↔ human time. Browser-only.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/timestamp-converter',
  },
};

export default function TimestampConverterLayout({children}) {
  return children;
}

TimestampConverterLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
