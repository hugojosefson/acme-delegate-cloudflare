export async function sha256(s: string): Promise<ArrayBuffer> {
  const inputBytes = new TextEncoder().encode(s);
  return await globalThis.crypto.subtle.digest("SHA-256", inputBytes);
}
