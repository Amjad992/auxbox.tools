import PropTypes from 'prop-types';
import {useRef, useState} from 'react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import {
  buildConfigPayload,
  buildIncomeCsv,
  defaultBreakdownFilename,
  defaultConfigFilename,
  parseConfigText,
  triggerDownload,
} from '../exportUtils';

export default function ExportImportCard({
  state,
  incomeResult,
  showCsvButton,
  onImport,
  onMessage,
}) {
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState(null);

  const handleExportJson = () => {
    const payload = buildConfigPayload(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    triggerDownload(blob, defaultConfigFilename());
    onMessage?.('Config exported.', 'success');
  };

  const handleExportCsv = () => {
    if (!incomeResult) return;
    const csv = buildIncomeCsv({
      result: incomeResult,
      currency: state.currency,
    });
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
    triggerDownload(blob, defaultBreakdownFilename());
    onMessage?.('Breakdown CSV exported.', 'success');
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const r = parseConfigText(text);
      if (!r.ok) {
        setImportError(r.error);
        onMessage?.(r.error, 'error');
        return;
      }
      onImport(r.state);
      onMessage?.('Config imported.', 'success');
    } catch (err) {
      const msg = `Could not read file: ${err?.message ?? err}`;
      setImportError(msg);
      onMessage?.(msg, 'error');
    }
  };

  return (
    <Card>
      <h2 className="frc-card-title">Export &amp; import</h2>
      <p className="frc-card-hint">
        Save your configuration as JSON to back it up, share with an
        accountant, or move between machines. Import a previously-saved
        JSON to rehydrate the form.
      </p>
      <div className="frc-export-row">
        <Button variant="primary" onClick={handleExportJson}>
          Download config (.json)
        </Button>
        {showCsvButton && (
          <Button variant="primary" onClick={handleExportCsv}>
            Download breakdown (.csv)
          </Button>
        )}
        <Button variant="neutral" onClick={handleImportClick}>
          Import config (.json)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          style={{display: 'none'}}
          aria-hidden="true"
          tabIndex={-1}
          data-testid="frc-import-file"
        />
      </div>
      {importError && (
        <p className="frc-card-hint" role="alert" style={{color: '#e74c3c'}}>
          {importError}
        </p>
      )}
    </Card>
  );
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () =>
      reject(reader.error || new Error('FileReader failed'));
    reader.readAsText(file);
  });
}

ExportImportCard.propTypes = {
  state: PropTypes.object.isRequired,
  incomeResult: PropTypes.object,
  showCsvButton: PropTypes.bool.isRequired,
  onImport: PropTypes.func.isRequired,
  onMessage: PropTypes.func,
};
