/**
 * rsaMath.js — RSA Mathematical Utilities
 * Handles small-number RSA for educational visualization
 */

/**
 * Check if a number is prime (trial division — fine for small nums)
 */
export function isPrime(n) {
  n = Number(n);
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/**
 * Greatest Common Divisor (Euclidean algorithm)
 */
export function gcd(a, b) {
  a = BigInt(a); b = BigInt(b);
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  return Number(a);
}

/**
 * Extended Euclidean Algorithm
 * Returns { gcd, x, y, steps } where a*x + b*y = gcd
 * steps is an array for visualization
 */
export function extendedGcd(a, b) {
  const steps = [];
  let old_r = BigInt(a), r = BigInt(b);
  let old_s = 1n, s = 0n;
  let old_t = 0n, t = 1n;

  while (r !== 0n) {
    const q = old_r / r;
    steps.push({
      q: Number(q),
      r: Number(old_r),
      s: Number(old_s),
      t: Number(old_t),
      new_r: Number(old_r - q * r),
      new_s: Number(old_s - q * s),
      new_t: Number(old_t - q * t),
    });
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
    [old_t, t] = [t, old_t - q * t];
  }

  return {
    gcd: Number(old_r),
    x: Number(old_s),
    y: Number(old_t),
    steps,
  };
}

/**
 * Modular inverse of e mod phi using Extended Euclid
 * Returns d such that e*d ≡ 1 (mod phi), or null if not invertible
 */
export function modInverse(e, phi) {
  const { gcd: g, x, steps } = extendedGcd(e, phi);
  if (g !== 1) return null;
  // Ensure positive result
  const d = ((x % phi) + phi) % phi;
  return { d, steps };
}

/**
 * Fast modular exponentiation: base^exp mod mod
 * Works with standard JS numbers (safe for small educational RSA)
 */
export function modExp(base, exp, mod) {
  base = BigInt(base); exp = BigInt(exp); mod = BigInt(mod);
  if (mod === 1n) return 0;
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return Number(result);
}

/**
 * Generate all RSA steps for visualization given p, q, e
 * Returns structured data for MathVisualizer component
 */
export function generateRSASteps(p, q, eInput) {
  p = Number(p); q = Number(q);

  // Step 1: Validate primes
  if (!isPrime(p)) return { error: `p = ${p} không phải số nguyên tố` };
  if (!isPrime(q)) return { error: `q = ${q} không phải số nguyên tố` };
  if (p === q) return { error: 'p và q phải khác nhau' };

  // Step 2: Compute n and phi
  const n = p * q;
  const phi = (p - 1) * (q - 1);

  if (n < 10) return { error: 'n = p×q quá nhỏ, hãy thử số lớn hơn' };

  // Step 3: Find valid e values
  const validEs = [];
  for (let e = 2; e < phi && validEs.length < 10; e++) {
    if (gcd(e, phi) === 1) validEs.push(e);
  }

  // Step 4: Validate or pick e
  let e = eInput ? Number(eInput) : validEs[0];
  if (!e || e <= 1 || e >= phi) {
    return { n, phi, validEs, error: `e phải thỏa mãn 1 < e < φ(n) = ${phi}` };
  }
  if (gcd(e, phi) !== 1) {
    return { n, phi, validEs, error: `gcd(${e}, ${phi}) ≠ 1, hãy chọn e khác` };
  }

  // Step 5: Compute d via extended Euclid
  const invResult = modInverse(e, phi);
  if (!invResult) return { error: 'Không thể tính d — e và φ(n) không nguyên tố cùng nhau' };
  const { d, steps: euclidSteps } = invResult;

  return {
    p, q, n, phi, e, d,
    validEs,
    euclidSteps,
    publicKey: { e, n },
    privateKey: { d, n },
  };
}

/**
 * Suggest small prime pairs for demo
 */
export const PRIME_SUGGESTIONS = [
  { p: 11, q: 13, label: 'Đơn giản' },
  { p: 17, q: 11, label: 'Cổ điển' },
  { p: 23, q: 19, label: 'Trung bình' },
  { p: 61, q: 53, label: 'Lớn hơn' },
  { p: 89, q: 97, label: 'Nâng cao' },
];

/**
 * Get list of valid e values for given phi
 */
export function getValidEList(phi, limit = 15) {
  const list = [];
  for (let e = 2; e < phi && list.length < limit; e++) {
    if (gcd(e, phi) === 1) list.push(e);
  }
  return list;
}
