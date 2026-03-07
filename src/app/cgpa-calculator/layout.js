import PropTypes from 'prop-types';

export const metadata = {
  title: 'CGPA Calculator - Calculate Your Grade Point Average',
  description:
    'Free online CGPA and GPA calculator. Calculate your cumulative grade point average with precision. Perfect for students tracking academic performance.',

  keywords: [
    'CGPA Calculator',
    'GPA Calculator',
    'Grade Point Average',
    'Academic Calculator',
    'Student Tools',
    'Education',
    'Free Calculator',
    'Online Calculator',
  ],

  openGraph: {
    type: 'website',
    title: 'CGPA Calculator - Calculate Your Grade Point Average',
    description:
      'Free online CGPA and GPA calculator. Calculate your cumulative grade point average with precision. Perfect for students tracking academic performance.',
    url: 'https://auxbox.tools/cgpa-calculator',
  },

  twitter: {
    card: 'summary',
    title: 'CGPA Calculator - Calculate Your Grade Point Average',
    description:
      'Free online CGPA and GPA calculator. Calculate your cumulative grade point average with precision.',
  },

  alternates: {
    canonical: 'https://auxbox.tools/cgpa-calculator',
  },
};

export default function CGPACalculatorLayout({children}) {
  return children;
}

CGPACalculatorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
