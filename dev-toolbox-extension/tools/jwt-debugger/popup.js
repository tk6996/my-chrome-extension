(function () {
  'use strict';

  const jwtInput = document.getElementById('jwtInput');
  const headerInput = document.getElementById('headerInput');
  const payloadInput = document.getElementById('payloadInput');
  const jwtOutput = document.getElementById('jwtOutput');
  const copyBtn = document.getElementById('copyBtn');
  const errorBox = document.getElementById('errorBox');
  const claimsBar = document.getElementById('claimsBar');
  const algBadge = document.getElementById('algBadge');
  const expBadge = document.getElementById('expBadge');
  const extraClaimsBar = document.getElementById('extraClaimsBar');
  const sigStatus = document.getElementById('sigStatus');
  const hmacKeySection = document.getElementById('hmacKeySection');
  const asymKeySection = document.getElementById('asymKeySection');
  const noneKeySection = document.getElementById('noneKeySection');
  const secretInput = document.getElementById('secretInput');
  const secretIsBase64 = document.getElementById('secretIsBase64');
  const publicKeyInput = document.getElementById('publicKeyInput');
  const verifyHmacBtn = document.getElementById('verifyHmacBtn');
  const signHmacBtn = document.getElementById('signHmacBtn');
  const verifyAsymBtn = document.getElementById('verifyAsymBtn');
  const payloadTooltip = document.getElementById('payloadTooltip');
  const templateSelect = document.getElementById('templateSelect');

  const state = { signatureB64: '' };
  let jwtDebounce = null;
  let editDebounce = null;

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }

  function clearError() {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }

  function setSigStatus(text, variant) {
    sigStatus.textContent = text;
    sigStatus.className = 'badge' + (variant ? ' badge-' + variant : '');
  }

  const CLAIM_LABELS = {
    iat: 'Issued at',
    nbf: 'Not valid before',
    exp: 'Expires at',
    auth_time: 'Authenticated at'
  };
  const BADGE_CLAIMS = ['iat', 'nbf', 'auth_time'];

  function formatClaimDate(unixSeconds) {
    const d = new Date(unixSeconds * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return `${date} ${time}`;
  }

  function updateClaimsBar(header, payload) {
    algBadge.textContent = 'ALG: ' + (header && header.alg ? header.alg : '?');
    algBadge.className = 'badge';

    if (payload && typeof payload.exp === 'number') {
      const expired = payload.exp * 1000 < Date.now();
      expBadge.textContent = (expired ? 'Expired: ' : 'Valid until: ') + formatClaimDate(payload.exp);
      expBadge.title = formatClaimDate(payload.exp);
      expBadge.className = 'badge ' + (expired ? 'badge-error' : 'badge-success');
    } else {
      expBadge.textContent = 'No exp claim';
      expBadge.removeAttribute('title');
      expBadge.className = 'badge badge-muted';
    }

    extraClaimsBar.innerHTML = '';
    BADGE_CLAIMS.forEach((key) => {
      if (payload && typeof payload[key] === 'number') {
        const badge = document.createElement('span');
        badge.className = 'badge badge-muted';
        badge.textContent = key.toUpperCase();
        badge.title = `${CLAIM_LABELS[key]}: ${formatClaimDate(payload[key])}`;
        extraClaimsBar.appendChild(badge);
      }
    });

    claimsBar.classList.remove('hidden');
  }

  function updateKeySections(alg) {
    const info = JwtTool.ALG_INFO[alg];
    hmacKeySection.classList.add('hidden');
    asymKeySection.classList.add('hidden');
    noneKeySection.classList.add('hidden');
    if (!info) return;
    if (info.family === 'hmac') hmacKeySection.classList.remove('hidden');
    else if (info.family === 'none') noneKeySection.classList.remove('hidden');
    else asymKeySection.classList.remove('hidden');
  }

  function readHeaderPayload() {
    let header, payload;
    try {
      header = JSON.parse(headerInput.value);
    } catch (e) {
      throw new Error('Header is not valid JSON');
    }
    try {
      payload = JSON.parse(payloadInput.value);
    } catch (e) {
      throw new Error('Payload is not valid JSON');
    }
    return { header, payload };
  }

  function handleJwtInputChange() {
    clearError();
    const raw = jwtInput.value.trim();
    if (!raw) {
      claimsBar.classList.add('hidden');
      headerInput.value = '';
      payloadInput.value = '';
      jwtOutput.value = '';
      extraClaimsBar.innerHTML = '';
      updateKeySections(null);
      setSigStatus('', '');
      return;
    }
    try {
      const decoded = JwtTool.decodeJwt(raw);
      state.signatureB64 = decoded.signatureB64;
      headerInput.value = JSON.stringify(decoded.header, null, 2);
      payloadInput.value = JSON.stringify(decoded.payload, null, 2);
      jwtOutput.value = raw;
      updateClaimsBar(decoded.header, decoded.payload);
      updateKeySections(decoded.header.alg);
      setSigStatus('Not verified', 'muted');
    } catch (err) {
      claimsBar.classList.add('hidden');
      showError(err.message);
    }
  }

  async function handleHeaderPayloadEdit() {
    clearError();
    let header, payload;
    try {
      ({ header, payload } = readHeaderPayload());
    } catch (err) {
      showError(err.message);
      return;
    }

    updateClaimsBar(header, payload);
    updateKeySections(header.alg);

    const info = JwtTool.ALG_INFO[header.alg];
    if (info && info.family === 'hmac') {
      try {
        await signWithSecret(header, payload);
        setSigStatus('Auto re-signed', 'success');
      } catch (err) {
        showError('Sign failed: ' + err.message);
      }
    } else {
      const { token } = JwtTool.buildJwt(header, payload, state.signatureB64);
      jwtOutput.value = token;
      setSigStatus('Modified — not verified/re-signed yet', 'muted');
    }
  }

  async function signWithSecret(header, payload) {
    const { headerB64, payloadB64 } = JwtTool.buildJwt(header, payload, '');
    const signingInput = `${headerB64}.${payloadB64}`;
    const sigBytes = await JwtTool.signHmac(header.alg, secretInput.value, signingInput, secretIsBase64.checked);
    state.signatureB64 = JwtTool.bytesToBase64Url(sigBytes);
    jwtOutput.value = `${signingInput}.${state.signatureB64}`;
  }

  jwtInput.addEventListener('input', () => {
    clearTimeout(jwtDebounce);
    jwtDebounce = setTimeout(handleJwtInputChange, 300);
  });

  headerInput.addEventListener('input', () => {
    clearTimeout(editDebounce);
    editDebounce = setTimeout(handleHeaderPayloadEdit, 300);
  });

  payloadInput.addEventListener('input', () => {
    clearTimeout(editDebounce);
    editDebounce = setTimeout(handleHeaderPayloadEdit, 300);
  });

  verifyHmacBtn.addEventListener('click', async () => {
    clearError();
    try {
      const { header, payload } = readHeaderPayload();
      const { headerB64, payloadB64 } = JwtTool.buildJwt(header, payload, '');
      const signingInput = `${headerB64}.${payloadB64}`;
      const sigBytes = JwtTool.base64UrlToBytes(state.signatureB64);
      const ok = await JwtTool.verifyHmac(header.alg, secretInput.value, signingInput, sigBytes, secretIsBase64.checked);
      setSigStatus(ok ? 'Signature valid ✓' : 'Signature invalid ✗', ok ? 'success' : 'error');
    } catch (err) {
      showError('Verify failed: ' + err.message);
    }
  });

  signHmacBtn.addEventListener('click', async () => {
    clearError();
    try {
      const { header, payload } = readHeaderPayload();
      await signWithSecret(header, payload);
      setSigStatus('Signed ✓', 'success');
    } catch (err) {
      showError('Sign failed: ' + err.message);
    }
  });

  verifyAsymBtn.addEventListener('click', async () => {
    clearError();
    try {
      const { header, payload } = readHeaderPayload();
      const { headerB64, payloadB64 } = JwtTool.buildJwt(header, payload, '');
      const signingInput = `${headerB64}.${payloadB64}`;
      const sigBytes = JwtTool.base64UrlToBytes(state.signatureB64);
      const ok = await JwtTool.verifyAsymmetric(header.alg, publicKeyInput.value, signingInput, sigBytes);
      setSigStatus(ok ? 'Signature valid ✓' : 'Signature invalid ✗', ok ? 'success' : 'error');
    } catch (err) {
      showError('Verify failed: ' + err.message);
    }
  });

  const TIMESTAMP_LINE_RE = /"(iat|nbf|exp|auth_time)"\s*:\s*(\d+)/;
  let payloadCharMetrics = null;

  function measureMonoCharMetrics(el) {
    const style = getComputedStyle(el);
    const probe = document.createElement('span');
    probe.style.fontFamily = style.fontFamily;
    probe.style.fontSize = style.fontSize;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.whiteSpace = 'pre';
    probe.textContent = 'M'.repeat(20);
    document.body.appendChild(probe);
    const charWidth = probe.getBoundingClientRect().width / 20;
    document.body.removeChild(probe);
    return {
      charWidth,
      lineHeight: parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4,
      paddingLeft: parseFloat(style.paddingLeft) || 0,
      paddingTop: parseFloat(style.paddingTop) || 0
    };
  }

  function hidePayloadTooltip() {
    payloadTooltip.classList.add('hidden');
  }

  function handlePayloadMouseMove(e) {
    if (!payloadCharMetrics) payloadCharMetrics = measureMonoCharMetrics(payloadInput);
    const rect = payloadInput.getBoundingClientRect();
    const x = e.clientX - rect.left - payloadCharMetrics.paddingLeft + payloadInput.scrollLeft;
    const y = e.clientY - rect.top - payloadCharMetrics.paddingTop + payloadInput.scrollTop;
    if (x < 0 || y < 0) return hidePayloadTooltip();

    const row = Math.floor(y / payloadCharMetrics.lineHeight);
    const col = Math.round(x / payloadCharMetrics.charWidth);
    const line = payloadInput.value.split('\n')[row];
    if (line == null) return hidePayloadTooltip();

    const match = line.match(TIMESTAMP_LINE_RE);
    if (!match) return hidePayloadTooltip();

    const valueStart = line.indexOf(match[2], match.index + match[0].length - match[2].length);
    const valueEnd = valueStart + match[2].length;
    if (col < valueStart || col > valueEnd) return hidePayloadTooltip();

    const label = CLAIM_LABELS[match[1]] || match[1];
    payloadTooltip.textContent = `${label}: ${formatClaimDate(Number(match[2]))}`;
    payloadTooltip.style.left = e.clientX + 12 + 'px';
    payloadTooltip.style.top = e.clientY + 16 + 'px';
    payloadTooltip.classList.remove('hidden');
  }

  payloadInput.addEventListener('mousemove', handlePayloadMouseMove);
  payloadInput.addEventListener('mouseleave', hidePayloadTooltip);
  payloadInput.addEventListener('scroll', hidePayloadTooltip);

  copyBtn.addEventListener('click', async () => {
    if (!jwtOutput.value) return;
    try {
      await navigator.clipboard.writeText(jwtOutput.value);
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = original;
      }, 1000);
    } catch (err) {
      showError('Copy failed: ' + err.message);
    }
  });

  const TEMPLATE_PAYLOAD = { sub: '1234567890', name: 'John Doe', iat: 1516239022 };
  const TEMPLATES = {
    HS256: { alg: 'HS256', typ: 'JWT' },
    RS256: { alg: 'RS256', typ: 'JWT' },
    ES256: { alg: 'ES256', typ: 'JWT' },
    PS256: { alg: 'PS256', typ: 'JWT' },
    none: { alg: 'none', typ: 'JWT' }
  };

  function loadTemplate(name) {
    const header = TEMPLATES[name];
    if (!header) return;
    headerInput.value = JSON.stringify(header, null, 2);
    payloadInput.value = JSON.stringify(TEMPLATE_PAYLOAD, null, 2);
    handleHeaderPayloadEdit();
  }

  templateSelect.addEventListener('change', () => loadTemplate(templateSelect.value));

  updateKeySections(null);
  if (!jwtInput.value.trim()) loadTemplate(templateSelect.value);
})();
