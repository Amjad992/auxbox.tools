'use client';
import {useEffect, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ToastContainer from '../../components/ToastContainer';
import LengthControl from './components/LengthControl';
import ClassToggles from './components/ClassToggles';
import StrengthMeter from './components/StrengthMeter';
import PasswordResult from './components/PasswordResult';
import {usePasswordGenerator} from './hooks';
import {StorageProvider, useStorageData} from './StorageContext';
import {useToast} from '../../hooks/useToast';
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard';
import './password-generator.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Password Generator',
  description:
    'Free online password generator. Build strong, cryptographically random passwords entirely in your browser — choose length and character classes, see live strength.',
  url: 'https://auxbox.tools/password-generator',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function PasswordGeneratorContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {storageErrors} = useStorageData();
  const {
    settings,
    password,
    error,
    meter,
    hasAnyClass,
    updateSetting,
    generate,
    reset,
  } = usePasswordGenerator();

  // Screen-reader announcement for the Generate action (MAJ-2).
  const [srAnnouncement, setSrAnnouncement] = useState('');

  // Copy-with-dedup-and-toast. Passing dismissToast wires the dedup so a
  // subsequent action (Generate) can clear the prior "Password copied"
  // banner — addressing MIN-8.
  const copy = useCopyToClipboard({
    showToast,
    dismissToast,
    successMessage: 'Password copied',
    errorMessage: 'Could not copy to clipboard',
  });

  useEffect(() => {
    if (storageErrors?.settings) {
      showToast(`${storageErrors.settings}. Using defaults.`, 'error');
    }
  }, [storageErrors?.settings, showToast]);

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  const handleGenerate = () => {
    generate();
    setSrAnnouncement(`New password generated, ${settings.length} characters`);
  };

  const handleCopy = async () => {
    const ok = await copy(password);
    if (ok) setSrAnnouncement('Password copied');
  };

  return (
    <ToolPage
      title="Password Generator"
      tagline="Strong, cryptographically random passwords — generated entirely in your browser."
      schema={SCHEMA}
      schemaId="password-generator-schema"
      narrow
      errorMessage="There was an error loading the password generator. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Polite live region for screen-reader announcements (MAJ-2). */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="tool-sr-only"
      >
        {srAnnouncement}
      </p>

      <div className="tool-stack">
        <Card>
          <PasswordResult
            password={password}
            onCopy={handleCopy}
            onRegenerate={handleGenerate}
            generateDisabled={!hasAnyClass}
          />
        </Card>

        <Card>
          <LengthControl
            value={settings.length}
            onChange={(v) => updateSetting('length', v)}
          />
          <ClassToggles settings={settings} onToggle={updateSetting} />
          {!hasAnyClass && (
            <p className="pw-warning" role="alert">
              Select at least one character class to generate a password.
            </p>
          )}
        </Card>

        <Card>
          <StrengthMeter
            bits={meter.bits}
            strength={meter.strength}
            poolSize={meter.poolSize}
          />
        </Card>

        <div className="pw-actions">
          <Button variant="warning" onClick={reset}>
            Reset to defaults
          </Button>
        </div>
      </div>
    </ToolPage>
  );
}

export default function PasswordGenerator() {
  return (
    <StorageProvider>
      <PasswordGeneratorContent />
    </StorageProvider>
  );
}
