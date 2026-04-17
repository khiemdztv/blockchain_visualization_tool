import { jsPDF } from 'jspdf';

function removeDiacritics(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function mmClamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function applyCharmonmanFont(doc, basePath) {
  const fontUrl = `${basePath}fonts/Charmonman-Regular.ttf`;
  const res = await fetch(fontUrl);
  if (!res.ok) return false;

  const fontBuffer = await res.arrayBuffer();
  const fontBase64 = arrayBufferToBase64(fontBuffer);
  doc.addFileToVFS('Charmonman-Regular.ttf', fontBase64);
  doc.addFont('Charmonman-Regular.ttf', 'Charmonman', 'normal');
  doc.setFont('Charmonman', 'normal');
  return true;
}

async function fetchAsDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load certificate template: ${url}`);
  const blob = await res.blob();
  if (blob.type && !blob.type.startsWith('image/')) {
    throw new Error(`Certificate template is not an image (got ${blob.type || 'unknown'}). Check that ${url} is deployed as a static asset.`);
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read template image'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(blob);
  });
  // "data:image/png;base64,...."
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl);
  return { dataUrl, mime: match ? match[1] : 'image/png' };
}

export async function generateCertPDF(certificate) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;

  const code = String(certificate?.certCode || '').trim() || 'HB-XXXXXX';
  const nameRaw = (certificate?.displayName || 'Student').trim() || 'Student';
  const safeName = removeDiacritics(nameRaw);

  // 1) Draw template image full-page
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
  const normalizedBase = base.endsWith('/') ? base : base + '/';
  // Cache-bust to avoid stale CDN/browser caches after deploys
  const templateUrl = `${normalizedBase}images/certificate.png?v=${Date.now()}`;
  const { dataUrl, mime } = await fetchAsDataUrl(templateUrl);
  const format = mime.includes('jpeg') || mime.includes('jpg') ? 'JPEG' : 'PNG';
  doc.addImage(dataUrl, format, 0, 0, W, H);

  // 2) Overlay Name at measured anchor (A4 landscape mm)
  // Provided anchors:
  // - name (center): (151.69, 102.39)
  // - code (after "CERTIFICATE NO.:"): (56.5, 170.5)
  const hasCharmonman = await applyCharmonmanFont(doc, normalizedBase).catch(() => false);
  if (!hasCharmonman) {
    doc.setFont('times', 'italic');
  }
  doc.setFontSize(mmClamp(34 - Math.max(0, safeName.length - 18) * 0.7, 18, 34));
  doc.setTextColor(22, 24, 30);
  doc.text(safeName.toUpperCase(), 151.69, 102.39, { align: 'center' });

  // 3) Overlay Certificate Code
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(40, 46, 58);
  doc.text(code, 56.5, 170.5);

  doc.save(`HubBlock_Certificate_${code}.pdf`);
}

