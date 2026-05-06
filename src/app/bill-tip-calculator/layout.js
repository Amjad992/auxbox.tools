import PropTypes from 'prop-types';

export const metadata = {
  title: 'Bill & Tip Calculator — Total, Tip, Per-Person Split',
  description:
    'Free bill and tip calculator. Enter your bill, pick a tip percent, choose how many people are splitting, and see the per-person total. Mobile-friendly, no upload, runs entirely in your browser.',
  keywords: [
    'Bill Calculator',
    'Tip Calculator',
    'Bill Splitter',
    'Per Person Split Calculator',
    'Restaurant Bill Calculator',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Bill & Tip Calculator',
    description:
      'Bill + tip + people → total and per-person split. Free and offline.',
    url: 'https://auxbox.tools/bill-tip-calculator',
  },
  twitter: {
    card: 'summary',
    title: 'Bill & Tip Calculator',
    description:
      'Bill + tip + people → per-person split. Free and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/bill-tip-calculator',
  },
};

export default function BillTipCalculatorLayout({children}) {
  return children;
}

BillTipCalculatorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
