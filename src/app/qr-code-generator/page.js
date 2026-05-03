'use client';
import ToolPage from '../../components/ToolPage';
import QRCodeGenerator from './components/QRCodeGenerator';
import './qr-generator.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'QR Code Generator',
  description:
    'Free online QR code generator. Create QR codes with or without a logo that work completely offline — no internet required to scan.',
  url: 'https://auxbox.tools/qr-code-generator',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

export default function QRCodeGeneratorPage() {
  return (
    <ToolPage
      title="QR Code Generator"
      tagline="Generate offline QR codes instantly — with or without a logo"
      schema={SCHEMA}
      schemaId="qr-schema"
      errorMessage="There was an error loading the QR generator. Please refresh the page."
    >
      <QRCodeGenerator />
    </ToolPage>
  );
}
