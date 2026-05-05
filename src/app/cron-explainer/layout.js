import PropTypes from 'prop-types';

export const metadata = {
  title: 'Cron Expression Explainer — Free Online Cron Decoder',
  description:
    'Paste a cron expression and instantly see a plain-English description and the next 5 fire times in your local time zone. Includes one-click presets for common patterns. Runs entirely in your browser.',
  keywords: [
    'Cron Explainer',
    'Cron Expression',
    'Cron Decoder',
    'Cron Translator',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Cron Expression Explainer — Free Online Cron Decoder',
    description:
      'Decode any cron expression: plain English description plus the next 5 runs in your local time zone. Browser-only.',
    url: 'https://auxbox.tools/cron-explainer',
  },
  twitter: {
    card: 'summary',
    title: 'Cron Expression Explainer',
    description:
      'Plain-English description and next 5 runs for any cron expression. Browser-only.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/cron-explainer',
  },
};

export default function CronExplainerLayout({children}) {
  return children;
}

CronExplainerLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
