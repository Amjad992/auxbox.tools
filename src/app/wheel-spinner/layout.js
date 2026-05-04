import PropTypes from 'prop-types';

export const metadata = {
  title: 'Wheel Spinner - Random Picker for Any List',
  description:
    'Free online random picker. Drop a list, choose Quick Pick or a colourful Spin Wheel, and the choice is made fairly with cryptographic randomness — entirely in your browser.',
  keywords: [
    'Wheel Spinner',
    'Random Picker',
    'Wheel of Names',
    'Random Name Picker',
    'Spin the Wheel',
    'Decision Maker',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Wheel Spinner - Random Picker for Any List',
    description:
      'Drop a list, hit pick. Quick Pick or Spin Wheel. Fair and free — runs entirely in your browser.',
    url: 'https://auxbox.tools/wheel-spinner',
  },
  twitter: {
    card: 'summary',
    title: 'Wheel Spinner',
    description:
      'Random picker for any list. Quick Pick or Spin Wheel — fair and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/wheel-spinner',
  },
};

export default function WheelSpinnerLayout({children}) {
  return children;
}

WheelSpinnerLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
