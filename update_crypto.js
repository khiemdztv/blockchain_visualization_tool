const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/views/rsa/components/RSACryptoSection.jsx');
let content = fs.readFileSync(file, 'utf8');

// Inject import
if (!content.includes('import { LANG }')) {
  content = content.replace(/import React(.*?) from 'react';/, `import React$1 from 'react';\nimport { LANG } from '../../../data/lang.js';`);
}
content = content.replace(/export default function RSACryptoSection\(\) \{/, `export default function RSACryptoSection({ lang = 'vi' }) {\n  const t = LANG[lang]?.rsa || LANG.vi.rsa;`);

// Replacements
content = content.replace(/<div className="badge badge-purple"(.*?)>🔐 RSA THỰC TẾ<\/div>/, `<div className="badge badge-purple"$1>🔐 {t.cryptoTitle}</div>`);
content = content.replace(/<h2(.*?)>(\s*)Mã Hóa Đẳng Cấp Ngân Hàng: RSA-2048(\s*)<\/h2>/g, `<h2$1>\n          {t.cryptoTitle}\n        </h2>`);
content = content.replace(/Dùng Web Crypto API để tạo cặp key RSA 2048-bit thực sự, mã hóa và giải mã ngay trong trình duyệt — không gửi gì lên server\./, `{t.cryptoDesc}`);

content = content.replace(/✅ Cặp Key RSA-2048 đã tạo!/g, `✅ {t.genKeyDone}`);
content = content.replace(/Tạo Cặp Key RSA-2048/g, `{t.genKeyWait}`);

content = content.replace(/Public key và Private key đã sẵn sàng\. Bạn có thể tạo lại key mới bất cứ lúc nào\./g, `{t.genKeyP1}`);
content = content.replace(/Nhấn nút bên dưới để tạo cặp key RSA-OAEP 2048-bit ngẫu nhiên bằng Web Crypto API\./g, `{t.genKeyP2}`);

content = content.replace(/'Đang tạo\.\.\.' : 'Tạo Key Mới'/g, `t.btnGen : t.btnGenNew`);
content = content.replace(/'Đang tạo\.\.\.' : 'Tạo Cặp Key RSA-2048'/g, `t.btnGen : t.btnGenRsa`);

content = content.replace(/Tạo thành công/g, `{t.genSuccess}`);
content = content.replace(/Xem đủ/g, `{t.showFull}`);
content = content.replace(/Rút gọn/g, `{t.showShort}`);
content = content.replace(/Đã sao chép/g, `{t.copied}`);
content = content.replace(/Sao chép/g, `{t.copy}`);

content = content.replace(/Mã hóa \(Public Key\)/g, `{t.encTop}`);
content = content.replace(/Plaintext \(tối đa ~200 ký tự\)/g, `{t.encLabel}`);
content = content.replace(/Nhập văn bản cần mã hóa\.\.\./g, `{t.encPlaceholder}`);
content = content.replace(/Đang mã hóa\.\.\./g, `{t.encing}`);
content = content.replace(/>Mã hóa</g, `>{t.btnEnc}<`);
content = content.replace(/ký tự/g, `{t.chars}`);

content = content.replace(/Giải mã \(Private Key\)/g, `{t.decTop}`);
content = content.replace(/Ciphertext \(Base64\)/g, `{t.decLabel}`);
content = content.replace(/Dán ciphertext vào đây\.\.\./g, `{t.decPlaceholder}`);
content = content.replace(/Đang giải mã\.\.\./g, `{t.decing}`);
content = content.replace(/>Giải mã</g, `>{t.btnDec}<`);

content = content.replace(/Kết quả giải mã/g, `{t.decResult}`);
content = content.replace(/✅ Khớp chính xác với plaintext gốc!/g, `✅ {t.decMatch}`);

content = content.replace(/💡 <strong>Bảo mật:<\/strong> Toàn bộ quá trình mã hóa diễn ra trong trình duyệt của bạn\. Key và dữ liệu không bao giờ được gửi lên server\. Web Crypto API sử dụng hardware acceleration của CPU khi có thể\./g, `💡 <strong>{t.cryptoTip}</strong>`);

fs.writeFileSync(file, content, 'utf8');
console.log('RSACryptoSection updated');
