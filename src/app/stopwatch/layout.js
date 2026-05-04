import PropTypes from 'prop-types';

export const metadata = {
  title: 'Stopwatch — Free Online Stopwatch with Laps',
  description:
    'Free online stopwatch with laps and keyboard shortcuts. Survives reload, runs entirely in your browser, and shows live elapsed time in the tab title while running.',
  keywords: [
    'Stopwatch',
    'Online Stopwatch',
    'Lap Timer',
    'Keyboard Shortcuts Stopwatch',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Stopwatch — Free Online Stopwatch with Laps',
    description:
      'Free online stopwatch with laps, keyboard shortcuts, and tab-title display. Runs entirely in your browser and survives reload.',
    url: 'https://auxbox.tools/stopwatch',
  },
  twitter: {
    card: 'summary',
    title: 'Stopwatch',
    description:
      'Free online stopwatch with laps and keyboard shortcuts. Browser-only.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/stopwatch',
  },
};

export default function StopwatchLayout({children}) {
  return children;
}

StopwatchLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
