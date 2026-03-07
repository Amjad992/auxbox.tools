import './globals.css';
import PropTypes from 'prop-types';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#ffffff'},
    {media: '(prefers-color-scheme: dark)', color: '#000000'},
  ],
};

export const metadata = {
  metadataBase: new URL('https://auxbox.tools'),

  title: {
    default: 'Auxbox Tools',
    template: '%s | Auxbox Tools',
  },

  description: 'Free online tools for students and professionals.',

  keywords: [
    'CGPA Calculator',
    'GPA Calculator',
    'Student Tools',
    'Online Tools',
    'Free Tools',
  ],

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: [
      {url: '/favicon.ico'},
      {url: '/icon.png', type: 'image/png', sizes: '32x32'},
    ],
    apple: [{url: '/apple-icon.png', sizes: '180x180', type: 'image/png'}],
  },
};

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
