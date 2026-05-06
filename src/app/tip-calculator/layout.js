import PropTypes from 'prop-types';

export const metadata = {
  title: 'Tip Calculator — Bill, Tip Percent, Per-Person Split',
  description:
    'Free tip calculator. Enter your bill and tip percent, see the total and per-person split instantly. Mobile-friendly, no upload, runs entirely in your browser.',
  keywords: [
    'Tip Calculator',
    'Bill Splitter',
    'Per Person Split Calculator',
    'Restaurant Tip Calculator',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Tip Calculator',
    description:
      'Bill + tip + people → total and per-person split. Free and offline.',
    url: 'https://auxbox.tools/tip-calculator',
  },
  twitter: {
    card: 'summary',
    title: 'Tip Calculator',
    description:
      'Bill + tip + people → per-person split. Free and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/tip-calculator',
  },
};

export default function TipCalculatorLayout({children}) {
  return children;
}

TipCalculatorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
