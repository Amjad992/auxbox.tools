import PropTypes from 'prop-types';

export const metadata = {
  title: 'Image Format Converter — PNG ↔ JPG ↔ WebP',
  description:
    'Free image format converter. Convert between PNG, JPEG, and WebP entirely in your browser. Pick quality, preview the result, and download. No upload — your image never leaves your device.',
  keywords: [
    'Image Converter',
    'PNG to JPG',
    'JPG to PNG',
    'WebP to JPG',
    'PNG to WebP',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Image Format Converter',
    description:
      'PNG / JPG / WebP conversion in your browser. Free and offline.',
    url: 'https://auxbox.tools/image-converter',
  },
  twitter: {
    card: 'summary',
    title: 'Image Format Converter',
    description: 'PNG ↔ JPG ↔ WebP — no upload.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/image-converter',
  },
};

export default function ImageConverterLayout({children}) {
  return children;
}

ImageConverterLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
