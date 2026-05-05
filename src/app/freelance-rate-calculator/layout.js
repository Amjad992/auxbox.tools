import PropTypes from 'prop-types';

export const metadata = {
  title:
    'Freelance Rate Calculator — Hourly Rate, Quote, Target Income',
  description:
    'Free freelance rate calculator. Quote a job, project your income from a rate, or back-solve the rate that hits a target take-home — accounting for time, costs, fees, taxes, team and profit margin. Calculated locally in your browser, no upload.',
  keywords: [
    'Freelance Rate Calculator',
    'Hourly Rate Calculator',
    'Consulting Rate Calculator',
    'Quote Calculator',
    'Take-Home Pay Calculator',
    'Freelancer Income Calculator',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Freelance Rate Calculator',
    description:
      'Quote a job, project your income from a rate, or back-solve the rate to hit a target take-home. Free and offline.',
    url: 'https://auxbox.tools/freelance-rate-calculator',
  },
  twitter: {
    card: 'summary',
    title: 'Freelance Rate Calculator',
    description:
      'Quote a job, project your income from a rate, or back-solve the rate to hit a target. Free and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/freelance-rate-calculator',
  },
};

export default function FreelanceRateCalculatorLayout({children}) {
  return children;
}

FreelanceRateCalculatorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
