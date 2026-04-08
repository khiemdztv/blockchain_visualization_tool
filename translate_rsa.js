const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'views', 'rsa', 'components');

function refactor(filename, replacements) {
  const filePath = path.join(baseDir, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Inject LANG import if not present
  if (!content.includes('import { LANG }')) {
    content = content.replace(/import React(.*?);/g, `import React$1;\nimport { LANG } from '../../../data/lang.js';`);
  }

  // Inject lang prop to the main component
  const compRegex = new RegExp(`export default function ${filename.replace('.jsx', '')}\\(.*?\\) \\{`);
  content = content.replace(compRegex, match => {
    if (match.includes('{ lang') || match.includes('lang=')) return match;
    if (match.includes('()')) {
      return match.replace('()', '({ lang = \'vi\' })') + `\n  const t = LANG[lang]?.rsa || LANG['vi'].rsa;`;
    }
    return match;
  });

  // Apply string replacements
  for (const { from, to } of replacements) {
    if (typeof from === 'string') {
      content = content.replace(from, to);
    } else {
      content = content.replace(from, to); // RegExp
    }
  }

  // Handle EncryptionFlow in TheorySection which doesn't have the context
  if (filename === 'TheorySection.jsx') {
    // Add lang to EncryptionFlow
    content = content.replace(/function EncryptionFlow\(\) \{/, 'function EncryptionFlow({ t }) {');
    content = content.replace(/<EncryptionFlow \/>/, '<EncryptionFlow t={t} />');
  }

  // EuclidTable in MathVisualizer:
  if (filename === 'MathVisualizer.jsx') {
    content = content.replace(/function EuclidTable\(\{ steps, e, phi \}\) \{/, 'function EuclidTable({ steps, e, phi, t }) {');
    content = content.replace(/<EuclidTable steps=\{result\.euclidSteps\} e=\{result\.e\} phi=\{result\.phi\} \/>/, '<EuclidTable steps={result.euclidSteps} e={result.e} phi={result.phi} t={t} />');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Refactored ${filename}`);
}

// TheorySection.jsx replacements
refactor('TheorySection.jsx', [
  { from: `aspect: 'Số lượng key', sym: '1 key (bí mật)', asym: '2 key (public + private)'`, to: `aspect: 'Số lượng key', sym: '1 key', asym: '2 keys'` },
  { from: /const COMPARISON(.|\n)*?\];/m, to: `const COMPARISON = (t) => [\n  { aspect: t.compareHeaders[0], sym: '1 key (bí mật)', asym: '2 key (public + private)' },\n  { aspect: 'Tốc độ', sym: '⚡ Nhanh', asym: '🐢 Chậm hơn' },\n  { aspect: 'Phân phối key', sym: '❌ Khó', asym: '✅ Dễ' },\n  { aspect: 'Dùng cho', sym: 'Mã hóa payload tx', asym: 'Trao đổi key, chữ ký số' },\n]; // we will just pass t directly later` },
]);

console.log('Script ran successfully');
