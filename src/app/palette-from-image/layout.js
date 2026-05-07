import PropTypes from 'prop-types';

export const metadata = {
  title: 'Palette from Image — Extract Dominant Colors',
  description:
    'Free color palette extractor. Upload an image and get its dominant colors as hex, RGB, or nearest Tailwind class names. Browser-only.',
  keywords: [
    'Color Palette Extractor',
    'Image Palette',
    'Dominant Colors',
    'Tailwind Color',
    'Median Cut',
    'Free Online Tool',
  ],
  openGraph: {
    type: 'website',
    title: 'Palette from Image',
    description: 'Image → dominant colors. Hex / RGB / Tailwind. Free and offline.',
    url: 'https://auxbox.tools/palette-from-image',
  },
  twitter: {
    card: 'summary',
    title: 'Palette from Image',
    description: 'Image → dominant colors. Free and offline.',
  },
  alternates: {
    canonical: 'https://auxbox.tools/palette-from-image',
  },
};

export default function PaletteFromImageLayout({children}) {
  return children;
}

PaletteFromImageLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
