import PropTypes from 'prop-types';

export const metadata = {
  title: 'Regex Tester — Live Match Highlighting + Capture Groups',
  description:
    'Free regex tester. Type a pattern + flags, see live match highlighting and capture groups in your test text. Common-pattern presets. Browser-only.',
  keywords: [
    'Regex Tester',
    'Regular Expression',
    'Pattern Match',
    'Capture Groups',
    'JavaScript Regex',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Regex Tester',
    description:
      'Live match highlighting + capture-group display. Free and offline.',
    url: 'https://auxbox.tools/regex-tester',
  },
  twitter: {
    card: 'summary',
    title: 'Regex Tester',
    description: 'Live match highlighting + capture groups.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/regex-tester',
  },
};

export default function RegexTesterLayout({children}) {
  return children;
}

RegexTesterLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
