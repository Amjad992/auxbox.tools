'use client';
import {useState, useRef, useCallback} from 'react';
import QRCode from 'qrcode';

export default function QRCodeGenerator() {
  const [url, setUrl] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [encodedUrl, setEncodedUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogoUpload = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setError('');
    setLogo(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const generateQR = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a URL or link.');
      return;
    }

    const targetUrl = /^https?:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    setError('');
    setIsGenerating(true);

    try {
      const SIZE = 1000;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;

      await QRCode.toCanvas(canvas, targetUrl, {
        errorCorrectionLevel: 'H',
        width: SIZE,
        margin: 2,
        color: {dark: '#000000', light: '#ffffff'},
      });

      if (logo) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const logoDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(logo);
        });

        const logoImg = await loadImage(logoDataUrl);

        // Fit logo so its larger dimension lands between 12%–22% of canvas.
        // Never scale up beyond natural size to preserve quality.
        const MAX_LOGO = Math.round(SIZE * 0.22); // 220 px
        const MIN_LOGO = Math.round(SIZE * 0.12); // 120 px
        const largerDim = Math.max(logoImg.naturalWidth, logoImg.naturalHeight);

        let scale;
        if (largerDim > MAX_LOGO) {
          scale = MAX_LOGO / largerDim;     // scale down to fit
        } else if (largerDim < MIN_LOGO) {
          scale = MIN_LOGO / largerDim;     // scale up only when very small
        } else {
          scale = 1;                        // use natural size
        }

        const logoW = Math.round(logoImg.naturalWidth * scale);
        const logoH = Math.round(logoImg.naturalHeight * scale);

        const PADDING = 16;
        const bgW = logoW + PADDING * 2;
        const bgH = logoH + PADDING * 2;
        const bgX = Math.round((SIZE - bgW) / 2);
        const bgY = Math.round((SIZE - bgH) / 2);

        // White rounded-rect background so QR modules don't bleed through
        const R = 14;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bgX + R, bgY);
        ctx.lineTo(bgX + bgW - R, bgY);
        ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + R);
        ctx.lineTo(bgX + bgW, bgY + bgH - R);
        ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - R, bgY + bgH);
        ctx.lineTo(bgX + R, bgY + bgH);
        ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - R);
        ctx.lineTo(bgX, bgY + R);
        ctx.quadraticCurveTo(bgX, bgY, bgX + R, bgY);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Draw logo at its exact computed dimensions, centered
        const logoX = Math.round((SIZE - logoW) / 2);
        const logoY = Math.round((SIZE - logoH) / 2);
        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
        ctx.restore();
      }

      setQrDataUrl(canvas.toDataURL('image/png'));
      setEncodedUrl(targetUrl);
    } catch (err) {
      if (
        err?.message?.toLowerCase().includes('too long') ||
        err?.message?.toLowerCase().includes('data too long')
      ) {
        setError('URL is too long to encode. Please shorten it.');
      } else {
        setError('Failed to generate QR code. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <main className="qr-page">
      <div className="container">
        <section className="qr-hero">
          <h1>QR Code Generator</h1>
          <p className="qr-tagline">
            Generate offline QR codes instantly — with or without a logo
          </p>
        </section>

        <div className="qr-layout">
          {/* ── Form Panel ── */}
          <div className="qr-form-panel">
            <div className="qr-field">
              <label className="qr-label" htmlFor="qr-url-input">
                Destination URL
              </label>
              <input
                id="qr-url-input"
                type="text"
                className="qr-input"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateQR()}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="qr-field">
              <label className="qr-label">Logo / Image (optional)</label>

              {!logoPreview ? (
                <div
                  className={`qr-dropzone${isDragging ? ' qr-dropzone--active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleLogoUpload(e.dataTransfer.files[0]);
                  }}
                >
                  <span className="qr-dropzone-icon">🖼️</span>
                  <span className="qr-dropzone-title">
                    Drop an image here or click to upload
                  </span>
                  <span className="qr-dropzone-hint">
                    PNG, JPG, SVG, WebP — any image works
                  </span>
                </div>
              ) : (
                <div className="qr-logo-preview">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="qr-logo-img"
                  />
                  <span className="qr-logo-name" title={logo?.name}>
                    {logo?.name?.length > 28
                      ? `${logo.name.slice(0, 25)}…`
                      : logo?.name}
                  </span>
                  <button
                    className="qr-logo-remove"
                    onClick={removeLogo}
                    type="button"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{display: 'none'}}
                onChange={(e) => handleLogoUpload(e.target.files[0])}
              />
            </div>

            {error && <p className="qr-error">{error}</p>}

            <button
              className="qr-generate-btn"
              onClick={generateQR}
              disabled={isGenerating}
              type="button"
            >
              {isGenerating ? 'Generating…' : 'Generate QR Code'}
            </button>
          </div>

          {/* ── Preview Panel ── */}
          <div className="qr-preview-panel">
            {qrDataUrl ? (
              <>
                <img
                  src={qrDataUrl}
                  alt="Generated QR code"
                  className="qr-image"
                />
                <p className="qr-encoded-url">
                  <span>{encodedUrl}</span>
                </p>
                <button
                  className="qr-download-btn"
                  onClick={downloadQR}
                  type="button"
                >
                  ↓ Download PNG
                </button>
              </>
            ) : (
              <div className="qr-placeholder">
                <div className="qr-placeholder-grid">
                  {Array.from({length: 25}).map((_, i) => (
                    <div key={i} className="qr-placeholder-cell" />
                  ))}
                </div>
                <p>Your QR code will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
