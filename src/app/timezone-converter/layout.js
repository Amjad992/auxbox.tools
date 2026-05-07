import PropTypes from 'prop-types';

export const metadata = {
  title: 'Time Zone Converter — Multi-Zone Clock',
  description:
    'Free multi-zone time converter. Pick an anchor moment + zone, see the same instant rendered in any number of other zones. Add, remove, reorder. Browser-only.',
  keywords: [
    'Time Zone Converter',
    'Multi Zone Clock',
    'World Clock',
    'Meeting Time Converter',
    'IANA Timezone',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Time Zone Converter',
    description:
      'Anchor moment + N zones → same instant in each. Free and offline.',
    url: 'https://auxbox.tools/timezone-converter',
  },
  twitter: {
    card: 'summary',
    title: 'Time Zone Converter',
    description: 'Multi-zone clock. Browser-only.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/timezone-converter',
  },
};

export default function TimezoneConverterLayout({children}) {
  return children;
}

TimezoneConverterLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
