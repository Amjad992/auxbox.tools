import PropTypes from 'prop-types';

export const metadata = {
  title: 'Password Generator - Strong Random Passwords, Generated Locally',
  description:
    'Free online password generator. Build strong, cryptographically random passwords entirely in your browser. Choose length and character classes, see live entropy and strength.',

  keywords: [
    'Password Generator',
    'Random Password Generator',
    'Strong Password',
    'Secure Password',
    'Crypto Random',
    'Free Password Tool',
    'Online Password Generator',
  ],

  openGraph: {
    type: 'website',
    title: 'Password Generator - Strong Random Passwords, Generated Locally',
    description:
      'Free online password generator. Cryptographically random, browser-only. Choose length and character classes, see live strength.',
    url: 'https://auxbox.tools/password-generator',
  },

  twitter: {
    card: 'summary',
    title: 'Password Generator',
    description:
      'Strong, cryptographically random passwords — generated entirely in your browser.',
  },

  alternates: {
    canonical: 'https://auxbox.tools/password-generator',
  },
};

export default function PasswordGeneratorLayout({children}) {
  return children;
}

PasswordGeneratorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
