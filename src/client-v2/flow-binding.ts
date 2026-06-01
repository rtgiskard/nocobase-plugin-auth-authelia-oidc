import { PENDING_FLOW_STORAGE_KEY } from './storage';

function toBase64Url(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    const triplet = (a << 16) | (b << 8) | c;
    output += chars[(triplet >> 18) & 0x3f];
    output += chars[(triplet >> 12) & 0x3f];
    output += index + 1 < bytes.length ? chars[(triplet >> 6) & 0x3f] : '';
    output += index + 2 < bytes.length ? chars[triplet & 0x3f] : '';
  }
  return output;
}

export function createClientBinding(randomValues: Uint8Array): string {
  if (randomValues.byteLength !== 32) throw new Error('OIDC binding entropy must be 256 bits');
  return toBase64Url(randomValues);
}

export function createAndStorePendingOidcFlow(storage: Storage): { binding: string; createdAt: number } {
  const randomValues = new Uint8Array(32);
  globalThis.crypto.getRandomValues(randomValues);
  const pending = {
    binding: createClientBinding(randomValues),
    createdAt: Date.now(),
  };
  storage.setItem(PENDING_FLOW_STORAGE_KEY, JSON.stringify(pending));
  return pending;
}
