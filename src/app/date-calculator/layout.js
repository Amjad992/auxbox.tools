import PropTypes from 'prop-types';

export const metadata = {
  title: 'Date Calculator - Difference Between Two Dates, Age From a Date',
  description:
    'Free date calculator. Find the difference between two dates, or your age from a date — in years, months, days, weeks, hours, and working days. Calculated locally in your browser, no upload.',
  keywords: [
    'Date Calculator',
    'Date Difference Calculator',
    'Days Between Dates',
    'Age Calculator',
    'Working Days Calculator',
    'How Old Am I',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Date Calculator - Difference Between Two Dates, Age From a Date',
    description:
      'Difference between two dates, or your age from a date — years, months, days, weeks, hours, and working days. Free and offline.',
    url: 'https://auxbox.tools/date-calculator',
  },
  twitter: {
    card: 'summary',
    title: 'Date Calculator',
    description:
      'Difference between two dates, or age from a date. Years, months, days, weeks, hours, working days. Free and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/date-calculator',
  },
};

export default function DateCalculatorLayout({children}) {
  return children;
}

DateCalculatorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
