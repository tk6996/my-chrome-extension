const outputEl     = document.getElementById('uuidOutput');
const versionSelect = document.getElementById('versionSelect');
const generateBtn  = document.getElementById('generateBtn');
const copyBtn      = document.getElementById('copyBtn');
const refreshBtn   = document.getElementById('refreshBtn');
const toast        = document.getElementById('toast');

function bytesToUuidString(bytes) {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

// 100ns intervals between the UUID epoch (1582-10-15) and the Unix epoch (1970-01-01).
const UUID_V1_EPOCH_OFFSET_100NS = 122192928000000000n;

// RFC 4122 version 1 (time-based). Browsers can't read a real MAC address, so
// the node id is random with the multicast bit set — RFC 4122 §4.5 marks this
// as the correct way to signal "not a real IEEE 802 address".
function generateUuidV1() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const ts = BigInt(Date.now()) * 10000n + UUID_V1_EPOCH_OFFSET_100NS;
  const timeLow = Number(ts & 0xffffffffn);
  const timeMid = Number((ts >> 32n) & 0xffffn);
  const timeHi = Number((ts >> 48n) & 0x0fffn);

  bytes[0] = (timeLow >>> 24) & 0xff;
  bytes[1] = (timeLow >>> 16) & 0xff;
  bytes[2] = (timeLow >>> 8) & 0xff;
  bytes[3] = timeLow & 0xff;
  bytes[4] = (timeMid >>> 8) & 0xff;
  bytes[5] = timeMid & 0xff;
  bytes[6] = ((timeHi >>> 8) & 0x0f) | 0x10; // version 1
  bytes[7] = timeHi & 0xff;
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  bytes[10] |= 0x01; // node[0]: multicast bit — random, not a real MAC

  return bytesToUuidString(bytes);
}

// RFC 9562 version 7 (time-ordered): 48-bit ms timestamp + random tail.
function generateUuidV7() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const ts = Date.now();
  bytes[0] = Math.floor(ts / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(ts / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(ts / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(ts / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(ts / 2 ** 8) & 0xff;
  bytes[5] = ts & 0xff;
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

  return bytesToUuidString(bytes);
}

function generateUuid() {
  const version = versionSelect.value;
  if (version === '1') {
    outputEl.textContent = generateUuidV1();
  } else if (version === '7') {
    outputEl.textContent = generateUuidV7();
  } else {
    outputEl.textContent = crypto.randomUUID();
  }
}

async function copyToClipboard() {
  const value = outputEl.textContent;
  if (!value || value === 'Click Generate') return;
  try {
    await navigator.clipboard.writeText(value);
    showToast();
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = value;
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

generateBtn.addEventListener('click', generateUuid);
refreshBtn.addEventListener('click', generateUuid);
copyBtn.addEventListener('click', copyToClipboard);
versionSelect.addEventListener('change', generateUuid);

// Auto-generate on load
generateUuid();
