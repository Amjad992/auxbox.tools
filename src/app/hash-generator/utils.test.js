import {describe, it, expect} from 'vitest';
import {hashBuffer, hashBufferWith, hashText, toHex} from './utils';

// Reference test vectors from RFC 1321 (MD5), FIPS 180-4 (SHA),
// and standard test corpora.
const VECTORS = {
  '': {
    'SHA-1': 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
    'SHA-256':
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'SHA-512':
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
    MD5: 'd41d8cd98f00b204e9800998ecf8427e',
  },
  abc: {
    'SHA-1': 'a9993e364706816aba3e25717850c26c9cd0d89d',
    'SHA-256':
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    'SHA-512':
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    MD5: '900150983cd24fb0d6963f7d28e17f72',
  },
};

describe('toHex', () => {
  it('converts bytes to lowercase hex', () => {
    const buf = new Uint8Array([0, 1, 15, 16, 254, 255]).buffer;
    expect(toHex(buf)).toBe('00010f10feff');
  });

  it('returns empty string for empty buffer', () => {
    expect(toHex(new ArrayBuffer(0))).toBe('');
  });
});

describe('hashText / hashBuffer', () => {
  for (const [input, expected] of Object.entries(VECTORS)) {
    it(`hashes "${input || '<empty>'}" against canonical vectors`, async () => {
      const result = await hashText(input, Object.keys(expected));
      for (const algo of Object.keys(expected)) {
        expect(result[algo]).toBe(expected[algo]);
      }
    });
  }

  it('hashes an arbitrary ArrayBuffer', async () => {
    const buf = new TextEncoder().encode('abc').buffer;
    const result = await hashBuffer(buf, ['SHA-256', 'MD5']);
    expect(result['SHA-256']).toBe(VECTORS.abc['SHA-256']);
    expect(result.MD5).toBe(VECTORS.abc.MD5);
  });
});

describe('hashBufferWith', () => {
  it('SHA-256 of "abc"', async () => {
    const buf = new TextEncoder().encode('abc').buffer;
    expect(await hashBufferWith('SHA-256', buf)).toBe(VECTORS.abc['SHA-256']);
  });

  it('MD5 of "abc"', async () => {
    const buf = new TextEncoder().encode('abc').buffer;
    expect(await hashBufferWith('MD5', buf)).toBe(VECTORS.abc.MD5);
  });
});
