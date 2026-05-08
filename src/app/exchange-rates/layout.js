import PropTypes from 'prop-types';

export const metadata = {
  title: 'Exchange Rates — Live Currency Converter',
  description:
    'Free currency exchange-rate lookup. Pick a base currency and date, add target currencies, enter an amount — see live rates. No sign-up, no API key, browser-only.',
  keywords: [
    'Exchange Rates',
    'Currency Converter',
    'Live Exchange Rate',
    'Forex',
    'Currency Calculator',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Exchange Rates',
    description:
      'Pick a base + date + targets → instant rate table. Browser-only, no API key.',
    url: 'https://auxbox.tools/exchange-rates',
  },
  twitter: {
    card: 'summary',
    title: 'Exchange Rates',
    description: 'Live currency rates, no API key needed.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/exchange-rates',
  },
};

export default function ExchangeRatesLayout({children}) {
  return children;
}

ExchangeRatesLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
