import PropTypes from 'prop-types';

export const metadata = {
  title: 'Favicon Generator — One Image → 16/32/180/192/512 + ICO',
  description:
    'Free favicon generator. Upload one image → get the standard favicon set (16, 32, 180 Apple touch, 192, 512 Android) plus an ICO bundle as a zip. Browser-only.',
  keywords: [
    'Favicon Generator',
    'favicon ICO',
    'apple-touch-icon',
    'android-chrome',
    'PWA icons',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Favicon Generator',
    description:
      'One image → favicon-16, 32, 180, 192, 512 + ICO. Free and offline.',
    url: 'https://auxbox.tools/favicon-generator',
  },
  twitter: {
    card: 'summary',
    title: 'Favicon Generator',
    description: 'One image → full favicon set. Browser-only.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/favicon-generator',
  },
};

export default function FaviconGeneratorLayout({children}) {
  return children;
}

FaviconGeneratorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
