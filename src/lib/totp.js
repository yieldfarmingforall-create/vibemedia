/**
 * Real TOTP implementation using WebCrypto (RFC 6238 / RFC 4226)
 * Works in-browser without any external libraries.
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Generate a random 20-byte Base32 secret */
export function generateTotpSecret() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let result = '';
  let buffer = 0;
  let bitsLeft = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += BASE32_CHARS[(buffer >> bitsLeft) & 31];
    }
  }
  return result;
}

/** Decode a Base32 string to Uint8Array */
function base32Decode(input) {
  const str = input.toUpperCase().replace(/=+$/, '');
  const bytes = [];
  let buffer = 0;
  let bitsLeft = 0;
  for (const char of str) {
    const val = BASE32_CHARS.indexOf(char);
    if (val < 0) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >> bitsLeft) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

/** Compute HOTP value for a given counter */
async function hotp(secretBase32, counter) {
  const key = await crypto.subtle.importKey(
    'raw',
    base32Decode(secretBase32),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  // counter as 8-byte big-endian
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  view.setUint32(4, Math.floor(counter % 0x100000000), false);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);

  const sig = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const hash = new Uint8Array(sig);
  const offset = hash[19] & 0xf;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, '0');
}

/** Compute current TOTP code (± 1 window tolerance) */
export async function getTotpCode(secretBase32) {
  const counter = Math.floor(Date.now() / 30000);
  return hotp(secretBase32, counter);
}

/** Verify a TOTP code (accepts current + previous window) */
export async function verifyTotp(secretBase32, inputCode) {
  const counter = Math.floor(Date.now() / 30000);
  const [current, prev, next] = await Promise.all([
    hotp(secretBase32, counter),
    hotp(secretBase32, counter - 1),
    hotp(secretBase32, counter + 1),
  ]);
  return inputCode === current || inputCode === prev || inputCode === next;
}

/** Build an otpauth:// URI for QR scanning */
export function buildOtpAuthUri(secret, label = 'Norbert Rzepka Admin', issuer = 'Panel Admina') {
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}