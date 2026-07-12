import crypto from "crypto";

export const AUTH_COOKIE = "archive_auth";

/**
 * sha256 hex digest of a string.
 */
export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Constant-time comparison of two hex digest strings.
 * Digests are fixed-length (sha256 -> 64 hex chars), so we compare
 * digests (not raw passphrases) to sidestep variable-length timing
 * differences from the raw secret.
 */
export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length || bufA.length === 0) {
    // Still run a timingSafeEqual against a same-length buffer to avoid
    // short-circuiting on length alone leaking information cheaply.
    crypto.timingSafeEqual(bufA.length ? bufA : Buffer.from("00", "hex"), bufA.length ? bufA : Buffer.from("00", "hex"));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * The expected cookie value: the SHA-256 hash of the archive passphrase.
 * Stored directly in env as ARCHIVE_PASSPHRASE_SHA256 (the hash, never the
 * plaintext) so the plaintext passphrase never has to live in Vercel env.
 */
export function expectedAuthCookieValue(): string | null {
  const expected = process.env.ARCHIVE_PASSPHRASE_SHA256;
  if (!expected) return null;
  return expected.trim().toLowerCase();
}

/**
 * Verify a submitted passphrase against ARCHIVE_PASSPHRASE_SHA256 using a
 * constant-time comparison of sha256 digests.
 */
export function verifyPassphrase(submitted: string): boolean {
  const expected = expectedAuthCookieValue();
  if (!expected) return false;
  return safeEqualHex(sha256Hex(submitted), expected);
}

/**
 * Verify a cookie value already on the request against the expected digest.
 */
export function verifyAuthCookie(cookieValue: string | undefined | null): boolean {
  if (!cookieValue) return false;
  const expected = expectedAuthCookieValue();
  if (!expected) return false;
  return safeEqualHex(cookieValue, expected);
}
