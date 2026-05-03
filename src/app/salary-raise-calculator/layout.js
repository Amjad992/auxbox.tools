import PropTypes from 'prop-types';

export const metadata = {
  title: 'Salary Raise Calculator - See Your Raise Across Every Pay Period',
  description:
    'Free online salary raise calculator. Convert pay between hourly, weekly, monthly and annual, and see what a percentage or dollar raise looks like across every period. Saves locally — no sign-up.',

  keywords: [
    'Salary Raise Calculator',
    'Pay Raise Calculator',
    'Salary Increase Calculator',
    'Hourly to Annual Calculator',
    'Pay Period Converter',
    'Salary Calculator',
    'Free Calculator',
    'Online Calculator',
  ],

  openGraph: {
    type: 'website',
    title: 'Salary Raise Calculator - See Your Raise Across Every Pay Period',
    description:
      'Free online salary raise calculator. Convert pay between hourly, weekly, monthly and annual, and see what a raise looks like across every period.',
    url: 'https://auxbox.tools/salary-raise-calculator',
  },

  twitter: {
    card: 'summary',
    title: 'Salary Raise Calculator',
    description:
      'Free online salary raise calculator. See your raise across hourly, weekly, monthly and annual.',
  },

  alternates: {
    canonical: 'https://auxbox.tools/salary-raise-calculator',
  },
};

export default function SalaryRaiseCalculatorLayout({children}) {
  return children;
}

SalaryRaiseCalculatorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
