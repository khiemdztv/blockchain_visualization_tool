const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/views/rsa/components/SignatureDemo.jsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { LANG }')) {
  content = content.replace(/import React(.*?) from 'react';/, `import React$1 from 'react';\nimport { LANG } from '../../../data/lang.js';`);
}
content = content.replace(/export default function SignatureDemo\(\) \{/, `export default function SignatureDemo({ lang = 'vi' }) {\n  const t = LANG[lang]?.rsa || LANG.vi.rsa;`);

// General
content = content.replace(/<div className="badge badge-purple"(.*?)>✍️ CHỮ KÝ SỐ<\/div>/, `<div className="badge badge-purple"$1>✍️ {t.signTitle}</div>`);
content = content.replace(/<h2(.*?)>(\s*)Digital Signature & Blockchain(\s*)<\/h2>/g, `<h2$1>\n          {t.signTitle}\n        </h2>`);
content = content.replace(/Blockchain không ký toàn bộ dữ liệu giao dịch mà chỉ ký hash của nó\. Điều này giúp việc xác minh nhanh hơn và bảo mật hơn\./g, `{t.signDesc}`);

content = content.replace(/Cách Blockchain Dùng Chữ Ký Số/g, `{t.howBlockchainUses}`);
content = content.replace(/Giao dịch/g, `{t.tx}`);
// Avoid rootHash overlaps if already exact
content = content.replace(/Tại sao chỉ ký hash\? Chữ ký RSA chỉ có thể xử lý dữ liệu nhỏ \(vài KB\)\. Bằng cách ký hash của Merkle Root \(32 bytes\), bạn vẫn xác nhận được toàn bộ block dù có hàng nghìn giao dịch\./g, `{t.whyHash}`);

content = content.replace(/1\. Tạo cặp key ký số/g, `1. {t.st1Title}`);
content = content.replace(/'Đang tạo\.\.\.' : 'Tạo Signing Key Pair'/g, `t.btnGen : t.btnSignGen`);
content = content.replace(/Đã tạo Key!/g, `{t.genKeyDone}`);

content = content.replace(/2\. Ký thông điệp/g, `2. {t.st2Title}`);
content = content.replace(/Thông điệp cần ký/g, `{t.msgToSign}`);
content = content.replace(/Nhập thông điệp\.\.\./g, `{t.msgPlaceholder}`);
content = content.replace(/'Đang ký\.\.\.' : '✍️ Ký'/g, `t.signing : \`✍️ \${t.btnSign}\``);

content = content.replace(/SHA-256 Hash của message:/g, `{t.hashOfMsg}:`);
content = content.replace(/Chữ ký số \(Base64\):/g, `{t.sigBase64}:`);

content = content.replace(/3\. Xác minh chữ ký/g, `3. {t.st3Title}`);
content = content.replace(/Thông điệp cần xác minh/g, `{t.msgToVerify}`);
content = content.replace(/Thử sửa thông điệp để kiểm tra\.\.\./g, `{t.verifyPlaceholder}`);
content = content.replace(/'Đang xác minh\.\.\.' : '✔️ Xác minh'/g, `t.verifying : \`✔️ \${t.btnVerify}\``);

content = content.replace(/>Khôi phục gốc</g, `>{t.qOriginal}<`);
content = content.replace(/>Thêm "!!!"</g, `>{t.qAdd}<`);
content = content.replace(/>Viết HOA</g, `>{t.qUpper}<`);
content = content.replace(/>Xóa hết</g, `>{t.qClear}<`);

content = content.replace(/✅ CHỮ KÝ HỢP LỆ/g, `✅ {t.valValid}`);
content = content.replace(/Thông điệp chưa bị thay đổi và ký bởi đúng private key/g, `{t.valValidDesc}`);

content = content.replace(/❌ CHỮ KÝ KHÔNG HỢP LỆ!/g, `❌ {t.valInvalid}`);
content = content.replace(/Thông điệp đã bị thay đổi — hash khác với lúc ký/g, `{t.valInvalidDesc1}`);
content = content.replace(/Key không khớp hoặc chữ ký bị giả mạo/g, `{t.valInvalidDesc2}`);

content = content.replace(/Thông điệp gốc \(đã ký\)/g, `{t.origMsg}`);
content = content.replace(/Thông điệp xác minh/g, `{t.verifyMsgBox}`);

content = content.replace(/💡 <strong>RSA trong Blockchain:<\/strong>(.*?)"trustless" trong crypto\./, `💡 <strong>{t.signTip}</strong>`);

fs.writeFileSync(file, content, 'utf8');
console.log('SignatureDemo updated');
