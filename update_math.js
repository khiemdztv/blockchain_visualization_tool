const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/views/rsa/components/MathVisualizer.jsx');
let content = fs.readFileSync(file, 'utf8');

// Inject import
if (!content.includes('import { LANG }')) {
  content = content.replace(/import React(.*?) from 'react';/, `import React$1 from 'react';\nimport { LANG } from '../../../data/lang.js';`);
}

// Inject t
content = content.replace(/export default function MathVisualizer\(\) \{/, `export default function MathVisualizer({ lang = 'vi' }) {\n  const t = LANG[lang]?.rsa || LANG.vi.rsa;`);

// Pass t down
content = content.replace(/function EuclidTable\(\{ steps, e, phi \}\)/, `function EuclidTable({ steps, e, phi, t })`);
content = content.replace(/<EuclidTable steps=\{result.euclidSteps\} e=\{result.e\} phi=\{result.phi\} \/>/, `<EuclidTable steps={result.euclidSteps} e={result.e} phi={result.phi} t={t} />`);

content = content.replace(/Tìm <code(.*?)>d<\/code> thỏa mãn/g, `{t.findD} <code$1>d</code>`);
content = content.replace(/<th>Bước<\/th>/, `<th>Step</th>`); // simple
content = content.replace(/<th>Thương q<\/th>/, `<th>q</th>`);
content = content.replace(/<th>s \(hệ số e\)<\/th>/, `<th>s</th>`);
content = content.replace(/<th>t \(hệ số φ\)<\/th>/, `<th>t</th>`);
content = content.replace(/<th>r mới<\/th>/, `<th>new_r</th>`);

// Main replacements
content = content.replace(/<div className="badge badge-amber"(.*?)>🧮 TOÁN HỌC RSA<\/div>/, `<div className="badge badge-amber"$1>🧮 {t.mathTitle.split(' ')[0]}</div>`);
content = content.replace(/<h2(.*?)>(\s*)Trực Quan Hóa RSA Step-by-Step(\s*)<\/h2>/g, `<h2$1>\n          {t.mathTitle}\n        </h2>`);
content = content.replace(/Nhập hai số nguyên tố (.*?)p(.*?) và (.*?)q(.*?), xem từng bước tính toán key RSA và mã hóa\/giải mã\./g, `{t.mathDesc}`);

content = content.replace(/<div className="label"(.*?)>Gợi ý nhanh:<\/div>/, `<div className="label"$1>{t.quickHint}</div>`);

// Step 1
content = content.replace(/Chọn hai số nguyên tố <code(.*?)>p<\/code> và <code(.*?)>q<\/code>/, `{t.step1}`);
content = content.replace(/<label className="label">Số nguyên tố p<\/label>/, `<label className="label">p</label>`);
content = content.replace(/<label className="label">Số nguyên tố q<\/label>/, `<label className="label">q</label>`);
content = content.replace(/✅ Là số nguyên tố/g, `✅ {t.isPrime}`);
content = content.replace(/❌ Không phải số nguyên tố/g, `❌ {t.notPrime}`);
content = content.replace(/Vui lòng nhập p và q/, `\${t.errorPrime}`);
content = content.replace(/⚡ Tính toán RSA/, `⚡ {t.computeRsa}`);

// Step 2
content = content.replace(/Tính <code(.*?)>n<\/code> và <code(.*?)>φ\(n\)<\/code>/, `{t.step2}`);
content = content.replace(/💡 <strong>φ\(n\)<\/strong> đếm số nguyên tố cùng nhau với n trong khoảng \[1, n\)\. Đây là "cửa sổ bí mật" của RSA\./, `💡 <strong>φ(n)</strong> {t.step2Tip}`);

// Step 3
content = content.replace(/Chọn số mũ công khai <code(.*?)>e<\/code>/, `{t.step3Cond}`);
content = content.replace(/Điều kiện:/, `{t.step3Cond}`);
content = content.replace(/✅ gcd\(\{result.e\}, \{result.phi\}\) = 1 — hợp lệ/g, `✅ gcd({result.e}, {result.phi}) = 1 — {t.validGcd}`);
content = content.replace(/>Áp dụng</, `>{t.apply}<`);

// Step 4
content = content.replace(/Tính số mũ bí mật <code(.*?)>d<\/code> — Extended Euclid/, `{t.step4}`);
content = content.replace(/Tìm d sao cho <code(.*?)>\{result.e\} × d ≡ 1 \(mod \{result.phi\}\)<\/code>/, `{t.findD} <code$1>{result.e} × d ≡ 1 (mod {result.phi})</code>`);
content = content.replace(/\{showEuclid \? '▲ Ẩn' : '▼ Xem'\} từng bước Extended Euclid/, `{showEuclid ? \`▲ \${t.hideEuclid}\` : \`▼ \${t.showEuclid}\`}`);
content = content.replace(/Kiểm tra:/, `{t.check}`);

// Step 5
content = content.replace(/📋 Tóm tắt Key RSA/g, `📋 {t.step5}`);
content = content.replace(/Chia sẻ công khai → \(e, n\)/, `{t.pubShare} → (e, n)`);
content = content.replace(/Giữ bí mật → \(d, n\)/, `{t.privKeep} → (d, n)`);

// Step 6
content = content.replace(/🔄 Mã hóa &amp; Giải mã/g, `🔄 {t.step6}`);
content = content.replace(/Nhập số nguyên <code>M<\/code> \(0 ≤ M &lt; n = \{result.n\}\)/, `{t.inputM} <code>M</code> (0 ≤ M &lt; n = {result.n})`);
content = content.replace(/⚠️ M phải trong khoảng/, `⚠️ {t.invalidM}`);
content = content.replace(/✅ Hợp lệ/, `✅ {t.validM}`);
content = content.replace(/Mã hóa bằng Public Key/, `\${t.encM}`);
content = content.replace(/Giải mã bằng Private Key/, `\${t.decM}`);
content = content.replace(/✅ M' = M = \{Mn\} — Giải mã thành công!/, `✅ M' = M = {Mn} — {t.decSuccess}`);

fs.writeFileSync(file, content, 'utf8');
console.log('MathVisualizer updated');
