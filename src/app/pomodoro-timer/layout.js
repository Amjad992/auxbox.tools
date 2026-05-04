import PropTypes from 'prop-types';

export const metadata = {
  title: 'Pomodoro Timer — Free Online Focus Timer',
  description:
    'Free online Pomodoro Timer with configurable work and break durations, daily history, optional desktop notifications, and a sound cue. Runs entirely in your browser and survives reload.',
  keywords: [
    'Pomodoro Timer',
    'Online Pomodoro',
    'Focus Timer',
    'Work Break Timer',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Pomodoro Timer — Free Online Focus Timer',
    description:
      'Configurable Pomodoro Timer with daily history, sound cue, and optional desktop notifications. Runs entirely in your browser.',
    url: 'https://auxbox.tools/pomodoro-timer',
  },
  twitter: {
    card: 'summary',
    title: 'Pomodoro Timer',
    description:
      'Free online Pomodoro Timer with configurable durations and daily history. Browser-only.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/pomodoro-timer',
  },
};

export default function PomodoroLayout({children}) {
  return children;
}

PomodoroLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
