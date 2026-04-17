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

function drawCornerRibbons(doc) {
  // A4 landscape: 297 x 210
  const W = 297, H = 210;
  const ribbons = [
    // top-left
    { pts: [[0, 0], [86, 0], [0, 36]], c: [32, 118, 183] },
    { pts: [[0, 0], [62, 0], [0, 26]], c: [68, 169, 225] },
    { pts: [[0, 0], [44, 0], [0, 18]], c: [120, 206, 244] },
    // top-right
    { pts: [[W, 0], [W - 86, 0], [W, 36]], c: [32, 118, 183] },
    { pts: [[W, 0], [W - 62, 0], [W, 26]], c: [68, 169, 225] },
    { pts: [[W, 0], [W - 44, 0], [W, 18]], c: [120, 206, 244] },
    // bottom-left
    { pts: [[0, H], [86, H], [0, H - 36]], c: [32, 118, 183] },
    { pts: [[0, H], [62, H], [0, H - 26]], c: [68, 169, 225] },
    { pts: [[0, H], [44, H], [0, H - 18]], c: [120, 206, 244] },
    // bottom-right
    { pts: [[W, H], [W - 86, H], [W, H - 36]], c: [32, 118, 183] },
    { pts: [[W, H], [W - 62, H], [W, H - 26]], c: [68, 169, 225] },
    { pts: [[W, H], [W - 44, H], [W, H - 18]], c: [120, 206, 244] },
  ];

  for (const r of ribbons) {
    doc.setFillColor(r.c[0], r.c[1], r.c[2]);
    doc.triangle(
      r.pts[0][0], r.pts[0][1],
      r.pts[1][0], r.pts[1][1],
      r.pts[2][0], r.pts[2][1],
      'F'
    );
  }
}

function drawHex(doc, cx, cy, r, strokeRgb, strokeWidth = 0.25) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6; // flat-top hex
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  doc.setDrawColor(strokeRgb[0], strokeRgb[1], strokeRgb[2]);
  doc.setLineWidth(strokeWidth);
  for (let i = 0; i < 6; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % 6];
    doc.line(x1, y1, x2, y2);
  }
}

function drawHexPattern(doc) {
  const leftX = 36;
  const rightX = 297 - 36;
  const baseY = 108;
  const col = [206, 217, 236];

  const sizes = [10, 12, 14];
  const offsets = [
    [-18, -18], [0, -18], [18, -18],
    [-9, 0], [9, 0], [27, 0],
    [-18, 18], [0, 18], [18, 18],
  ];

  for (const r of sizes) {
    for (const [dx, dy] of offsets) {
      drawHex(doc, leftX + dx, baseY + dy, r, col, 0.25);
      drawHex(doc, rightX + dx, baseY + dy, r, col, 0.25);
    }
  }
}

function drawHubBlockLogo(doc, x, y) {
  doc.setDrawColor(0, 156, 205);
  doc.setLineWidth(0.6);
  drawHex(doc, x + 10, y + 8, 7, [0, 156, 205], 0.6);
  doc.line(x + 10, y + 1.5, x + 10, y + 14.5);
  doc.line(x + 4, y + 4.5, x + 16, y + 11.5);
  doc.line(x + 16, y + 4.5, x + 4, y + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 61, 120);
  doc.text('HUBBLOCK', x + 10, y + 22, { align: 'center' });
}

function drawCertifiedStamp(doc, cx, cy) {
  doc.setDrawColor(230, 79, 79);
  doc.setTextColor(230, 79, 79);
  doc.setLineWidth(0.8);
  doc.circle(cx, cy, 20);
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const stars = 10;
  for (let i = 0; i < stars; i++) {
    const a = (2 * Math.PI * i) / stars - Math.PI / 2;
    const sx = cx + 17.2 * Math.cos(a);
    const sy = cy + 17.2 * Math.sin(a) + 2.1;
    doc.text('★', sx, sy, { align: 'center' });
  }

  doc.setFillColor(255, 255, 255);
  doc.rect(cx - 26, cy - 6.5, 52, 13, 'F');
  doc.setFontSize(18);
  doc.text('CERTIFIED', cx, cy + 5.8, { align: 'center' });
}

function drawSignature(doc, x, y) {
  doc.setFont('times', 'italic');
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42);
  doc.text('Murad', x, y);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.25);
  doc.line(x - 4, y + 3.5, x + 40, y + 3.5);
}

export async function generateCertPDF(certificate) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const nameRaw = (certificate?.displayName || 'Student').trim() || 'Student';
  const safeName = removeDiacritics(nameRaw);
  const W = 297, H = 210;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  drawCornerRibbons(doc);
  drawHexPattern(doc);

  drawHubBlockLogo(doc, 64, 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 61, 120);
  doc.text('HUBBLOCK EDUCATION', 148.5, 26, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(56);
  doc.setTextColor(18, 41, 79);
  doc.text('CERTIFICATE', 148.5, 62, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 83, 104);
  doc.text('THE CERTIFICATE IS PROUDLY PRESENTED TO:', 148.5, 75, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(mmClamp(34 - Math.max(0, safeName.length - 18) * 0.6, 20, 34));
  doc.setTextColor(22, 24, 30);
  doc.text(safeName.toUpperCase(), 148.5, 94, { align: 'center' });

  doc.setDrawColor(120, 126, 140);
  doc.setLineWidth(0.4);
  doc.line(74, 100, 223, 100);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(26, 29, 35);
  doc.text('Has successfully completed the Blockchain Course', 148.5, 113, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(92, 102, 120);
  doc.text('This certificate validates the mastery of blockchain technology and its applications', 148.5, 120, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 46, 58);
  doc.text('CERTIFICATE NO:', 46, 165);

  const code = String(certificate?.certCode || '').trim() || 'HB-XXXXXX';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 46, 58);
  doc.text(code, 78, 165);

  drawCertifiedStamp(doc, 78, 170);
  drawSignature(doc, 208, 173);

  const issuedAt = certificate?.issuedAt ? new Date(certificate.issuedAt) : new Date();
  const dateStr = issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(dateStr, 228, 181, { align: 'center' });

  doc.save(`HubBlock_Certificate_${code}.pdf`);
}

