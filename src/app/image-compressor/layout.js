import PropTypes from 'prop-types';

export const metadata = {
  title: 'Image Compressor - Shrink JPEG, PNG, WebP in Your Browser',
  description:
    'Free online image compressor. Drop JPEG, PNG, or WebP files, pick a quality, and download smaller versions. Files never leave your browser — everything happens on your device.',

  keywords: [
    'Image Compressor',
    'JPEG Compressor',
    'PNG Compressor',
    'WebP Compressor',
    'Compress Images Online',
    'Browser Image Compression',
    'Resize Images',
    'Reduce Image File Size',
    'Free Image Tool',
  ],

  openGraph: {
    type: 'website',
    title: 'Image Compressor - Shrink JPEG, PNG, WebP in Your Browser',
    description:
      'Drop JPEG, PNG, or WebP files, pick a quality, and download smaller versions. 100% browser-only — files never leave your device.',
    url: 'https://auxbox.tools/image-compressor',
  },

  twitter: {
    card: 'summary',
    title: 'Image Compressor',
    description:
      'Shrink JPEG, PNG, and WebP images entirely in your browser — no uploads, ever.',
  },

  alternates: {
    canonical: 'https://auxbox.tools/image-compressor',
  },
};

export default function ImageCompressorLayout({children}) {
  return children;
}

ImageCompressorLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
