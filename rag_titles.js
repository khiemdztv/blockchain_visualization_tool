'use strict';

/**
 * rag_titles.js — Document Title Mapping for RAG Citations
 * Maps raw PDF filenames → human-readable book/paper titles
 * Used during ingestion AND at runtime for citation display
 */

const DOC_TITLES = {
  'bitcoin.pdf':
    'Bitcoin: A Peer-to-Peer Electronic Cash System (Satoshi Nakamoto, 2008)',
  'bitcoin_vi.pdf':
    'Bitcoin: Hệ thống tiền mặt điện tử ngang hàng (Bản dịch tiếng Việt)',
  'sha288.pdf':
    'Secure Hash Standard (SHS) — FIPS PUB 180-4, NIST',
  'hashcash.pdf':
    'Hashcash – A Denial of Service Counter-Measure (Adam Back, 2002)',
  'rsa_variant.pdf':
    'RSA Variants and Public Key Cryptography',
  'How to time-stamp a digital document.pdf':
    'How to Time-Stamp a Digital Document (Haber & Stornetta, 1991)',
  'Improving the efficiency and reliability of digital time-stamping.pdf':
    'Improving the Efficiency and Reliability of Digital Time-Stamping (Bayer, Haber & Stornetta, 1993)',
  'secure-timestamping-service.pdf':
    'Design of a Secure Timestamping Service with Minimal Trust Requirements',
  'Secure names for bit-strings.pdf':
    'Secure Names for Bit-Strings (Clarke, Elien, Ellison et al., 2001)',
  'Protocols_for_Public_Key_Cryptosystems.pdf':
    'Protocols for Public Key Cryptosystems (Ralph C. Merkle, 1980)',
  'Introduction_to_Modern_Cryptography.pdf':
    'Introduction to Modern Cryptography (Jonathan Katz & Yehuda Lindell)',
  'Cryptography and Network Security 7th E, William Stallings- Looserof7.pdf':
    'Cryptography and Network Security: Principles and Practice, 7th Edition (William Stallings)',
  '1957-feller-anintroductiontoprobabilitytheoryanditsapplications-1.pdf':
    'An Introduction to Probability Theory and Its Applications, Vol. 1 (William Feller, 1957)',
  'Chuỗi khối trong kinh doanh.pdf':
    'Chuỗi khối trong kinh doanh — Blockchain for Business (Tiếng Việt)',
};

/**
 * Get document title by filename.
 * Falls back to: PDF metadata title → cleaned filename
 */
function getDocTitle(filename, pdfMetaTitle) {
  if (DOC_TITLES[filename]) return DOC_TITLES[filename];
  if (pdfMetaTitle && pdfMetaTitle.trim().length > 3) return pdfMetaTitle.trim();
  // Clean up filename as last resort
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = { DOC_TITLES, getDocTitle };
