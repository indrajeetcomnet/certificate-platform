/**
 * Certificate Export & Print Engine
 * Provides pixel-perfect A4 printing (via isolated iframe) and High-Res PNG/SVG/JSON downloads.
 */

// 1. ISOLATED PIXEL-PERFECT A4 PRINTING
export function printCertificate(boardElement, orientation = 'landscape') {
  if (!boardElement) return false;

  // Clone the certificate board to avoid modifying the active DOM
  const clone = boardElement.cloneNode(true);

  // Remove any active selection rings, resize handles, or edit buttons in the clone
  const handles = clone.querySelectorAll('[class*="cursor-"], [class*="ring-"], button');
  handles.forEach((el) => el.remove());

  // Create isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.title = 'Certificate Print Engine';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  const isLandscape = orientation === 'landscape';
  const widthMm = isLandscape ? 297 : 210;
  const heightMm = isLandscape ? 210 : 297;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Print Certificate</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link 
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@500;600;700;800;900&family=Cinzel+Decorative:wght@700;900&family=Cormorant+Garamond:wght@600;700&family=Dancing+Script:wght@700&family=Great+Vibes&family=Inter:wght@400;600;700&family=Merriweather:wght@400;700&family=Montserrat:wght@600;700;800&family=Oswald:wght@600;700&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Space+Mono:wght@400;700&display=swap" 
          rel="stylesheet"
        >
        <style>
          @page {
            size: A4 ${isLandscape ? 'landscape' : 'portrait'};
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            overflow: hidden;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .font-cinzel { font-family: 'Cinzel', Georgia, serif; }
          .font-cinzel-decorative { font-family: 'Cinzel Decorative', Georgia, serif; }
          .font-playfair { font-family: 'Playfair Display', Georgia, serif; }
          .font-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }
          .font-merriweather { font-family: 'Merriweather', Georgia, serif; }
          .font-signature { font-family: 'Great Vibes', cursive; }
          .font-alex-brush { font-family: 'Alex Brush', cursive; }
          .font-dancing { font-family: 'Dancing Script', cursive; }
          .font-pinyon { font-family: 'Pinyon Script', cursive; }
          .font-montserrat { font-family: 'Montserrat', sans-serif; }
          .font-oswald { font-family: 'Oswald', sans-serif; }
          .font-inter { font-family: 'Inter', sans-serif; }
          .font-mono-code { font-family: 'Space Mono', monospace; }
          
          #print-stage {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          #print-stage > div {
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            box-shadow: none !important;
            border: none !important;
            position: relative !important;
          }
        </style>
      </head>
      <body>
        <div id="print-stage">
          ${clone.outerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Wait for fonts to load in the iframe, then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 2000);
    }
  }, 500);

  return true;
}

// 2. HIGH-RES PNG DOWNLOAD (Retina 2x Resolution ~ 2246 x 1588)
export async function downloadCertificatePng(boardElement, fileName = 'certificate.png', orientation = 'landscape') {
  if (!boardElement) return false;

  const isLandscape = orientation === 'landscape';
  const width = isLandscape ? 1123 : 794;
  const height = isLandscape ? 794 : 1123;

  // Clone node & strip editor controls
  const clone = boardElement.cloneNode(true);
  const handles = clone.querySelectorAll('[class*="cursor-"], [class*="ring-"], button');
  handles.forEach((el) => el.remove());

  // Wrap in SVG foreignObject
  const serialized = new XMLSerializer().serializeToString(clone);
  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&amp;family=Cinzel:wght@600;700;900&amp;family=Great+Vibes&amp;family=Inter:wght@400;600&amp;family=Playfair+Display:wght@700&amp;family=Space+Mono:wght@400;700&amp;display=swap');
        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-signature { font-family: 'Great Vibes', cursive; }
        .font-alex-brush { font-family: 'Alex Brush', cursive; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-mono-code { font-family: 'Space Mono', monospace; }
      </style>
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;position:relative;margin:0;padding:0;">
          ${serialized}
        </div>
      </foreignObject>
    </svg>
  `;

  return new Promise((resolve) => {
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 2x Retina canvas scale for ultra-sharp output
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          const downloadUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
        }
        URL.revokeObjectURL(url);
        resolve(true);
      }, 'image/png');
    };

    img.onerror = () => {
      // Fallback: direct SVG download
      downloadCertificateSvg(boardElement, fileName.replace('.png', '.svg'), orientation);
      URL.revokeObjectURL(url);
      resolve(true);
    };

    img.src = url;
  });
}

// 3. VECTOR SVG DOWNLOAD
export function downloadCertificateSvg(boardElement, fileName = 'certificate.svg', orientation = 'landscape') {
  if (!boardElement) return false;

  const isLandscape = orientation === 'landscape';
  const width = isLandscape ? 1123 : 794;
  const height = isLandscape ? 794 : 1123;

  const clone = boardElement.cloneNode(true);
  const handles = clone.querySelectorAll('[class*="cursor-"], [class*="ring-"], button');
  handles.forEach((el) => el.remove());

  const serialized = new XMLSerializer().serializeToString(clone);
  const svgData = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&amp;family=Great+Vibes&amp;family=Playfair+Display:wght@700&amp;family=Inter:wght@400;600&amp;display=swap');
    .font-cinzel { font-family: 'Cinzel', serif; }
    .font-playfair { font-family: 'Playfair Display', serif; }
    .font-signature { font-family: 'Great Vibes', cursive; }
  </style>
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;position:relative;">
      ${serialized}
    </div>
  </foreignObject>
</svg>`;

  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName.endsWith('.svg') ? fileName : `${fileName}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
  return true;
}

// 4. TEMPLATE DATA JSON EXPORT
export function downloadCertificateJson(templateData, fileName = 'certificate-template.json') {
  const jsonString = typeof templateData === 'string' ? templateData : JSON.stringify(templateData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
  return true;
}
