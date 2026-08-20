(function (global) {
  'use strict';

  const ALG_INFO = {
    HS256: { family: 'hmac', hash: 'SHA-256' },
    HS384: { family: 'hmac', hash: 'SHA-384' },
    HS512: { family: 'hmac', hash: 'SHA-512' },
    RS256: { family: 'rsassa-pkcs1', hash: 'SHA-256' },
    RS384: { family: 'rsassa-pkcs1', hash: 'SHA-384' },
    RS512: { family: 'rsassa-pkcs1', hash: 'SHA-512' },
    PS256: { family: 'rsa-pss', hash: 'SHA-256', saltLength: 32 },
    PS384: { family: 'rsa-pss', hash: 'SHA-384', saltLength: 48 },
    PS512: { family: 'rsa-pss', hash: 'SHA-512', saltLength: 64 },
    ES256: { family: 'ecdsa', hash: 'SHA-256', curve: 'P-256' },
    ES384: { family: 'ecdsa', hash: 'SHA-384', curve: 'P-384' },
    ES512: { family: 'ecdsa', hash: 'SHA-512', curve: 'P-521' },
    none: { family: 'none' }
  };

  function utf8ToBytes(str) {
    return new TextEncoder().encode(str);
  }

  function bytesToUtf8(bytes) {
    return new TextDecoder().decode(bytes);
  }

  function bytesToBase64Url(bytes) {
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64UrlToBytes(b64url) {
    let b64 = String(b64url).replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function base64ToBytes(b64) {
    const bin = atob(String(b64).trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  const HMAC_BLOCK_SIZE = { 'SHA-256': 64, 'SHA-384': 128, 'SHA-512': 128 };

  function secretToKeyBytes(secret, isBase64) {
    return isBase64 ? base64ToBytes(secret) : utf8ToBytes(secret);
  }

  // WebCrypto rejects zero-length HMAC keys, but HMAC is well-defined for an
  // empty key: it's zero-padded to the hash's block size internally. Padding
  // it ourselves produces an identical signature while avoiding the DataError.
  function normalizeHmacKeyBytes(keyBytes, hash) {
    if (keyBytes.length > 0) return keyBytes;
    return new Uint8Array(HMAC_BLOCK_SIZE[hash] || 64);
  }

  function encodeSegment(obj) {
    return bytesToBase64Url(utf8ToBytes(JSON.stringify(obj)));
  }

  function splitJwt(token) {
    const parts = String(token).trim().split('.');
    if (parts.length !== 3) {
      throw new Error('JWT must have 3 parts separated by dots (header.payload.signature)');
    }
    return { headerB64: parts[0], payloadB64: parts[1], signatureB64: parts[2] };
  }

  function decodeJwt(token) {
    const { headerB64, payloadB64, signatureB64 } = splitJwt(token);
    let header, payload;
    try {
      header = JSON.parse(bytesToUtf8(base64UrlToBytes(headerB64)));
    } catch (e) {
      throw new Error('Header is not valid JSON');
    }
    try {
      payload = JSON.parse(bytesToUtf8(base64UrlToBytes(payloadB64)));
    } catch (e) {
      throw new Error('Payload is not valid JSON');
    }
    return { header, payload, headerB64, payloadB64, signatureB64 };
  }

  function buildJwt(header, payload, signatureB64) {
    const headerB64 = encodeSegment(header);
    const payloadB64 = encodeSegment(payload);
    return { token: `${headerB64}.${payloadB64}.${signatureB64 || ''}`, headerB64, payloadB64 };
  }

  function pemToArrayBuffer(pem) {
    const b64 = String(pem)
      .replace(/-----BEGIN [^-]+-----/g, '')
      .replace(/-----END [^-]+-----/g, '')
      .replace(/\s+/g, '');
    if (!b64) throw new Error('Public key is empty or not in PEM format');
    return base64UrlToBytes(b64.replace(/\+/g, '-').replace(/\//g, '_')).buffer;
  }

  async function verifyHmac(alg, secret, signingInput, signatureBytes, isBase64) {
    const info = ALG_INFO[alg];
    const keyBytes = normalizeHmacKeyBytes(secretToKeyBytes(secret, isBase64), info.hash);
    const key = await crypto.subtle.importKey(
      'raw', keyBytes, { name: 'HMAC', hash: info.hash }, false, ['verify']
    );
    return crypto.subtle.verify('HMAC', key, signatureBytes, utf8ToBytes(signingInput));
  }

  async function signHmac(alg, secret, signingInput, isBase64) {
    const info = ALG_INFO[alg];
    const keyBytes = normalizeHmacKeyBytes(secretToKeyBytes(secret, isBase64), info.hash);
    const key = await crypto.subtle.importKey(
      'raw', keyBytes, { name: 'HMAC', hash: info.hash }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, utf8ToBytes(signingInput));
    return new Uint8Array(sig);
  }

  async function verifyAsymmetric(alg, pem, signingInput, signatureBytes) {
    const info = ALG_INFO[alg];
    const keyData = pemToArrayBuffer(pem);
    let importAlgo;
    let verifyAlgo;
    if (info.family === 'ecdsa') {
      importAlgo = { name: 'ECDSA', namedCurve: info.curve };
      verifyAlgo = { name: 'ECDSA', hash: info.hash };
    } else if (info.family === 'rsa-pss') {
      importAlgo = { name: 'RSA-PSS', hash: info.hash };
      verifyAlgo = { name: 'RSA-PSS', saltLength: info.saltLength };
    } else {
      importAlgo = { name: 'RSASSA-PKCS1-v1_5', hash: info.hash };
      verifyAlgo = { name: 'RSASSA-PKCS1-v1_5' };
    }
    const key = await crypto.subtle.importKey('spki', keyData, importAlgo, false, ['verify']);
    return crypto.subtle.verify(verifyAlgo, key, signatureBytes, utf8ToBytes(signingInput));
  }

  global.JwtTool = {
    ALG_INFO,
    base64UrlToBytes,
    base64ToBytes,
    bytesToBase64Url,
    encodeSegment,
    splitJwt,
    decodeJwt,
    buildJwt,
    verifyHmac,
    signHmac,
    verifyAsymmetric
  };
})(typeof window !== 'undefined' ? window : globalThis);
