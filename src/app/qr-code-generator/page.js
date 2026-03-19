'use client';
import Script from 'next/script';
import QRCodeGenerator from './components/QRCodeGenerator';
import './qr-generator.css';

export default function QRCodeGeneratorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'QR Code Generator',
    description:
      'Free online QR code generator. Create QR codes with or without a logo that work completely offline — no internet required to scan.',
    url: 'https://auxbox.tools/qr-code-generator',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <Script
        id="qr-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}}
      />
      <QRCodeGenerator />
    </>
  );
}
