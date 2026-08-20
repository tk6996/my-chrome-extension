(function (global) {
  'use strict';

  const MASK = '********';

  const SENSITIVE_KEYWORDS = [
    'password', 'passwd', 'pwd',
    'secret', 'token', 'apikey', 'api_key',
    'key', 'cred', 'auth', 'private',
    'access', 'session', 'cookie', 'bearer', 'jwt',
    'ssn', 'card', 'cvv', 'pin', 'salt', 'hash'
  ];

  function isSensitiveKey(key) {
    const lower = String(key).toLowerCase();
    return SENSITIVE_KEYWORDS.some((word) => lower.includes(word));
  }

  function maskValue(key, value) {
    if (Array.isArray(value)) {
      return value.map((item) => maskValue(key, item));
    }
    if (value !== null && typeof value === 'object') {
      return maskObject(value);
    }
    if (isSensitiveKey(key) && value !== null && value !== undefined) {
      return MASK;
    }
    return value;
  }

  function maskObject(obj) {
    const result = Array.isArray(obj) ? [] : {};
    for (const key of Object.keys(obj)) {
      result[key] = maskValue(key, obj[key]);
    }
    return result;
  }

  function detectFormat(text) {
    try {
      JSON.parse(text);
      return 'json';
    } catch (jsonErr) {
      try {
        global.jsyaml.load(text);
        return 'yaml';
      } catch (yamlErr) {
        throw new Error('Input is not valid JSON or YAML');
      }
    }
  }

  function mask(text) {
    const format = detectFormat(text);
    const data = format === 'json' ? JSON.parse(text) : global.jsyaml.load(text);

    if (data === null || typeof data !== 'object') {
      return { format, result: text };
    }

    const masked = Array.isArray(data)
      ? data.map((item) => (item !== null && typeof item === 'object' ? maskObject(item) : item))
      : maskObject(data);

    const result = format === 'json'
      ? JSON.stringify(masked, null, 2)
      : global.jsyaml.dump(masked);

    return { format, result };
  }

  global.SecretMasker = { mask, SENSITIVE_KEYWORDS };
})(typeof window !== 'undefined' ? window : globalThis);
