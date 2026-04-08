/**
 * rsaCrypto.js — RSA Cryptography using Web Crypto API
 * Handles real RSA-OAEP 2048-bit operations in the browser
 */

/**
 * Generate a 2048-bit RSA-OAEP key pair
 * Returns { publicKey, privateKey } CryptoKey objects
 */
export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: { name: 'SHA-256' },
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  return keyPair;
}

/**
 * Generate a 2048-bit RSA signing key pair (RSASSA-PKCS1-v1_5)
 */
export async function generateRSASigningKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: { name: 'SHA-256' },
    },
    true,
    ['sign', 'verify']
  );
  return keyPair;
}

/**
 * Encrypt plaintext with RSA-OAEP public key
 * Returns base64 ciphertext string
 */
export async function encryptRSA(publicKey, plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    data
  );
  return arrayBufferToBase64(encrypted);
}

/**
 * Decrypt base64 ciphertext with RSA-OAEP private key
 * Returns plaintext string
 */
export async function decryptRSA(privateKey, ciphertextBase64) {
  const data = base64ToArrayBuffer(ciphertextBase64);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    data
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Sign a message with RSASSA-PKCS1-v1_5 private key
 * Returns base64 signature string
 */
export async function signRSA(privateKey, message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const signature = await window.crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    data
  );
  return arrayBufferToBase64(signature);
}

/**
 * Verify a signature with RSASSA-PKCS1-v1_5 public key
 * Returns boolean
 */
export async function verifyRSA(publicKey, signatureBase64, message) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const signature = base64ToArrayBuffer(signatureBase64);
    const isValid = await window.crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5' },
      publicKey,
      signature,
      data
    );
    return isValid;
  } catch {
    return false;
  }
}

/**
 * Export public key to PEM (SPKI format) string
 */
export async function exportPublicKeyPEM(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  const b64 = arrayBufferToBase64(exported);
  return `-----BEGIN PUBLIC KEY-----\n${formatBase64ForPEM(b64)}\n-----END PUBLIC KEY-----`;
}

/**
 * Export private key to PEM (PKCS8 format) string
 */
export async function exportPrivateKeyPEM(privateKey) {
  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  const b64 = arrayBufferToBase64(exported);
  return `-----BEGIN PRIVATE KEY-----\n${formatBase64ForPEM(b64)}\n-----END PRIVATE KEY-----`;
}

/**
 * Get SHA-256 hash of a message as hex string
 */
export async function sha256Hex(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function formatBase64ForPEM(b64) {
  // Insert newline every 64 chars
  return b64.match(/.{1,64}/g).join('\n');
}

/**
 * Truncate a PEM string for display (first + last line + "...")
 */
export function truncatePEM(pem) {
  if (!pem) return '';
  const lines = pem.split('\n');
  if (lines.length <= 6) return pem;
  return [lines[0], lines[1], '... (đã rút gọn) ...', lines[lines.length - 2], lines[lines.length - 1]].join('\n');
}
