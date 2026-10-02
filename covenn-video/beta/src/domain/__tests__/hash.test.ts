import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalize } from '../canonicalJson';
import { sha256Hex, utf8Encode } from '../sha256';

describe('empreinte SHA-256 et JSON canonique', () => {
  it('vecteurs FIPS 180-4', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('identique à node:crypto sur 200 textes de longueurs variées (accents et symboles inclus)', () => {
    let seedValue = 42;
    const next = () => (seedValue = (seedValue * 1103515245 + 12345) % 2147483648);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789 {}":,.-éèàçœ€≤≥→ ';
    for (let i = 0; i < 200; i += 1) {
      const length = next() % 300;
      let text = '';
      for (let j = 0; j < length; j += 1) text += alphabet[next() % alphabet.length];
      expect(sha256Hex(text)).toBe(createHash('sha256').update(text, 'utf8').digest('hex'));
    }
  });
  it('encodage UTF-8 autonome identique à TextEncoder, y compris hors plan de base et surrogates isolés', () => {
    for (const text of ['', 'dette nette', 'é€≤→✓', 'coût 😀 fin', 'isolé \ud800 fin', '\udc00']) {
      expect(Array.from(utf8Encode(text))).toEqual(Array.from(new TextEncoder().encode(text)));
      expect(sha256Hex(text)).toBe(createHash('sha256').update(new TextEncoder().encode(text)).digest('hex'));
    }
  });
  it('identique à crypto.subtle', async () => {
    const text = canonicalize({ b: '9400000.00', a: ['x', 1, null, true] });
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    expect(sha256Hex(text)).toBe(hex);
  });
  it('JSON canonique : ordre des clés indifférent, nombres non entiers refusés', () => {
    expect(canonicalize({ b: 1, a: 'x' })).toBe(canonicalize({ a: 'x', b: 1 }));
    expect(canonicalize({ a: [2, 1], z: { y: null } })).toBe('{"a":[2,1],"z":{"y":null}}');
    expect(() => canonicalize({ a: 1.5 })).toThrow();
  });
});
