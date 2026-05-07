import PropTypes from 'prop-types';

export const metadata = {
  title: 'Color Contrast Checker — WCAG AA + AAA',
  description:
    'Free WCAG color contrast checker. Pick a foreground and background, see the contrast ratio and AA/AAA pass/fail for normal and large text. Browser-only.',
  keywords: [
    'WCAG Contrast Checker',
    'Color Contrast Ratio',
    'Accessibility Checker',
    'AA AAA Contrast',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Color Contrast Checker (WCAG)',
    description:
      'Foreground + background → contrast ratio + WCAG AA/AAA pass/fail. Free and offline.',
    url: 'https://auxbox.tools/contrast-checker',
  },
  twitter: {
    card: 'summary',
    title: 'Color Contrast Checker',
    description: 'WCAG contrast ratio + AA/AAA pass/fail.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/contrast-checker',
  },
};

export default function ContrastCheckerLayout({children}) {
  return children;
}

ContrastCheckerLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
