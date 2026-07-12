// Edge-safe auth verification for middleware — uses Web Crypto (globalThis.crypto)
// instead of Node's `crypto` module, which isn't supported in the Edge runtime.
export const AUTH_COOKIE = "archive_auth";

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) {
    // still touch `a` in a loop to avoid trivial short-circuit timing signal
    let dummy = 0;
    for (let i = 0; i < a.length; i++) dummy ^= a.charCodeAt(i);
    return dummy === -1; // never true
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify a cookie value against ARCHIVE_PASSPHRASE_SHA256 (the cookie IS the
 * sha256 hex digest of the passphrase — the env var stores that same hash,
 * never the plaintext).
 */
export async function verifyAuthCookieEdge(cookieValue: string | undefined | null): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = process.env.ARCHIVE_PASSPHRASE_SHA256;
  if (!expected) return false;
  return timingSafeEqualString(cookieValue.trim().toLowerCase(), expected.trim().toLowerCase());
}
