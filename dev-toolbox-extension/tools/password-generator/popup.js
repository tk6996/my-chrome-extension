const LOWER   = 'abcdefghijklmnopqrstuvwxyz';
const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?/~`';

const lengthInput  = document.getElementById('lengthInput');
const chkLower     = document.getElementById('chkLower');
const chkUpper     = document.getElementById('chkUpper');
const chkNumber    = document.getElementById('chkNumber');
const chkSymbol    = document.getElementById('chkSymbol');
const outputEl     = document.getElementById('passwordOutput');
const generateBtn  = document.getElementById('generateBtn');
const copyBtn      = document.getElementById('copyBtn');
const refreshBtn   = document.getElementById('refreshBtn');
const strengthBar  = document.getElementById('strengthBar');
const warnMsg      = document.getElementById('warnMsg');
const toast        = document.getElementById('toast');

function buildCharset() {
  let charset = '';
  if (chkLower.checked)  charset += LOWER;
  if (chkUpper.checked)  charset += UPPER;
  if (chkNumber.checked) charset += NUMBERS;
  if (chkSymbol.checked) charset += SYMBOLS;
  return charset;
}

function generatePassword() {
  const charset = buildCharset();
  if (!charset) {
    warnMsg.style.display = 'block';
    outputEl.textContent = '—';
    updateStrength(0);
    return;
  }
  warnMsg.style.display = 'none';

  const length = Math.max(4, Math.min(128, parseInt(lengthInput.value) || 16));
  const array  = new Uint32Array(length);
  crypto.getRandomValues(array);

  // Guarantee at least one char from each selected type
  const guaranteed = [];
  if (chkLower.checked)  guaranteed.push(randomChar(LOWER));
  if (chkUpper.checked)  guaranteed.push(randomChar(UPPER));
  if (chkNumber.checked) guaranteed.push(randomChar(NUMBERS));
  if (chkSymbol.checked) guaranteed.push(randomChar(SYMBOLS));

  let result = Array.from(array, v => charset[v % charset.length]);

  // Replace first N positions with guaranteed chars (shuffled in)
  for (let i = 0; i < guaranteed.length; i++) {
    result[i] = guaranteed[i];
  }

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  const password = result.join('');
  outputEl.textContent = password;
  updateStrength(calcStrength(password));
}

function randomChar(set) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return set[arr[0] % set.length];
}

function calcStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score += 1;
  if (pw.length >= 12) score += 1;
  if (pw.length >= 20) score += 1;
  if (/[a-z]/.test(pw)) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 2;
  return Math.min(score, 8);
}

function updateStrength(score) {
  const pct = (score / 8) * 100;
  let color = '#ef4444'; // weak red
  if (score >= 5) color = '#f59e0b'; // medium orange
  if (score >= 7) color = '#22c55e'; // strong green
  strengthBar.style.width  = pct + '%';
  strengthBar.style.background = color;
}

async function copyToClipboard() {
  const pw = outputEl.textContent;
  if (!pw || pw === '—' || pw === 'Click Generate') return;
  try {
    await navigator.clipboard.writeText(pw);
    showToast();
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = pw;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast();
  }
}

function showToast() {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

generateBtn.addEventListener('click', generatePassword);
refreshBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyToClipboard);
lengthInput.addEventListener('change', generatePassword);

// Auto-generate on load
generatePassword();
