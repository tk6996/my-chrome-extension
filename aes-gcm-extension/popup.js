"use strict";

// ─── Encoding Helpers ───────────────────────────────────────────────────────

function hexToBytes(hex) {
  hex = hex.replace(/\s+/g, "");
  if (hex.length % 2 !== 0) throw new Error("Hex string must have even length.");
  if (!/^[0-9a-fA-F]*$/.test(hex)) throw new Error("Invalid hex characters.");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64ToBytes(b64) {
  b64 = b64.trim().replace(/\s+/g, "");
  // Support both standard and URL-safe base64
  const standard = b64.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const binary = atob(standard);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    throw new Error("Invalid Base64 string.");
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function utf8ToBytes(str) {
  return new TextEncoder().encode(str);
}

function bytesToUtf8(bytes) {
  return new TextDecoder().decode(bytes);
}

function decodeInput(value, format, fieldName = "Input") {
  value = value.trim();
  if (!value) throw new Error(`${fieldName} is empty.`);
  switch (format) {
    case "hex":     return hexToBytes(value);
    case "base64":  return base64ToBytes(value);
    case "utf8":    return utf8ToBytes(value);
    case "hex_b64": return base64ToBytes(bytesToUtf8(hexToBytes(value)));
    default:        throw new Error(`Unknown format: ${format}`);
  }
}

function encodeOutput(bytes, format) {
  switch (format) {
    case "hex":    return bytesToHex(bytes);
    case "base64": return bytesToBase64(bytes);
    case "utf8":   return bytesToUtf8(bytes);
    default:       throw new Error(`Unknown format: ${format}`);
  }
}

// ─── Web Crypto AES-GCM ─────────────────────────────────────────────────────

async function importKey(keyBytes) {
  const validLengths = [16, 24, 32];
  if (!validLengths.includes(keyBytes.length)) {
    throw new Error(
      `Key must be 16, 24, or 32 bytes (128/192/256-bit). Got ${keyBytes.length} bytes.`
    );
  }
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

async function aesGcmEncrypt(keyBytes, iv, plaintext, aad) {
  const cryptoKey = await importKey(keyBytes);
  const params = { name: "AES-GCM", iv, tagLength: 128 };
  if (aad && aad.length > 0) params.additionalData = aad;
  const cipherBuf = await crypto.subtle.encrypt(params, cryptoKey, plaintext);
  return new Uint8Array(cipherBuf);
}

async function aesGcmDecrypt(keyBytes, iv, ciphertext, aad) {
  const cryptoKey = await importKey(keyBytes);
  const params = { name: "AES-GCM", iv, tagLength: 128 };
  if (aad && aad.length > 0) params.additionalData = aad;
  try {
    const plainBuf = await crypto.subtle.decrypt(params, cryptoKey, ciphertext);
    return new Uint8Array(plainBuf);
  } catch {
    throw new Error("Decryption failed. Wrong key, IV, AAD, or corrupted ciphertext.");
  }
}

// ─── UI Helpers ─────────────────────────────────────────────────────────────

function showError(msg) {
  const box = document.getElementById("error-box");
  box.textContent = `Error: ${msg}`;
  box.style.display = "block";
  document.getElementById("output-section").style.display = "none";
}

function hideError() {
  document.getElementById("error-box").style.display = "none";
}

function showOutput(value, label, formatLabel) {
  hideError();
  document.getElementById("output").value = value;
  document.getElementById("output-label").textContent = label;
  document.getElementById("output-format-label").textContent = formatLabel;
  document.getElementById("output-section").style.display = "block";
}

function generateRandom(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return buf;
}

function getSelectedKeySize() {
  const radios = document.querySelectorAll('input[name="key-size"]');
  for (const r of radios) if (r.checked) return parseInt(r.value) / 8;
  return 32;
}

// ─── Event Wiring ───────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Tab switching
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
      hideError();
      document.getElementById("output-section").style.display = "none";
      updateNonceMode();
    });
  });

  // Generate Key — random bytes can't be UTF-8, auto-switch to hex
  document.getElementById("gen-key").addEventListener("click", () => {
    const size = getSelectedKeySize();
    const bytes = generateRandom(size);
    const fmtSel = document.getElementById("key-format");
    if (fmtSel.value === "utf8") {
      fmtSel._prev = "utf8";
      fmtSel.value = "hex";
    }
    document.getElementById("key-input").value = encodeOutput(bytes, fmtSel.value);
    updateKeyByteHint();
  });

  // Generate IV — same logic
  document.getElementById("gen-iv").addEventListener("click", () => {
    const bytes = generateRandom(12);
    const fmtSel = document.getElementById("iv-format");
    if (fmtSel.value === "utf8") {
      fmtSel._prev = "utf8";
      fmtSel.value = "hex";
    }
    document.getElementById("iv-input").value = encodeOutput(bytes, fmtSel.value);
  });

  // Re-encode key when format changes
  document.getElementById("key-format").addEventListener("change", (e) => {
    recode("key-input", e);
    updateKeySizeRowVisibility();
    updateKeyByteHint();
  });

  document.getElementById("iv-format").addEventListener("change", (e) => {
    recode("iv-input", e);
  });

  // Live byte-count hint for UTF-8 key
  document.getElementById("key-input").addEventListener("input", updateKeyByteHint);

  // Encrypt
  document.getElementById("encrypt-btn").addEventListener("click", async () => {
    hideError();
    try {
      const keyBytes = decodeInput(
        document.getElementById("key-input").value,
        document.getElementById("key-format").value,
        "Key"
      );
      const iv = decodeInput(
        document.getElementById("iv-input").value,
        document.getElementById("iv-format").value,
        "IV"
      );
      const plaintext = decodeInput(
        document.getElementById("plaintext-input").value,
        document.getElementById("plaintext-format").value,
        "Plaintext"
      );
      const aadRaw = document.getElementById("aad-input").value.trim();
      const aad = aadRaw
        ? decodeInput(aadRaw, document.getElementById("aad-format").value, "AAD")
        : null;

      const ciphertext = await aesGcmEncrypt(keyBytes, iv, plaintext, aad);

      // Offer both formats
      const hex = bytesToHex(ciphertext);
      const b64 = bytesToBase64(ciphertext);
      const formatted = `Hex:\n${hex}\n\nBase64:\n${b64}`;
      showOutput(
        formatted,
        "Ciphertext (with GCM tag)",
        `${ciphertext.length} bytes total (${ciphertext.length - 16} payload + 16 tag)`
      );
    } catch (err) {
      showError(err.message);
    }
  });

  // Toggle IV section visibility based on nonce-prepended checkbox
  document.getElementById("nonce-prepended").addEventListener("change", updateNonceMode);

  // Decrypt
  document.getElementById("decrypt-btn").addEventListener("click", async () => {
    hideError();
    try {
      const keyBytes = decodeInput(
        document.getElementById("key-input").value,
        document.getElementById("key-format").value,
        "Key"
      );

      const rawData = decodeInput(
        document.getElementById("ciphertext-input").value,
        document.getElementById("ciphertext-format").value,
        "Ciphertext"
      );

      const aadRaw = document.getElementById("aad-input").value.trim();
      const aad = aadRaw
        ? decodeInput(aadRaw, document.getElementById("aad-format").value, "AAD")
        : null;

      let iv, ciphertext;
      const noncePrepended = document.getElementById("nonce-prepended").checked;

      if (noncePrepended) {
        // Go pattern: Base64(nonce[12] + ciphertext + tag[16])
        const NONCE_SIZE = 12;
        if (rawData.length < NONCE_SIZE + 16) {
          throw new Error(`Data too short. Need at least ${NONCE_SIZE + 16} bytes (12 nonce + 16 tag).`);
        }
        iv = rawData.slice(0, NONCE_SIZE);
        ciphertext = rawData.slice(NONCE_SIZE);
      } else {
        iv = decodeInput(
          document.getElementById("iv-input").value,
          document.getElementById("iv-format").value,
          "IV"
        );
        ciphertext = rawData;
        if (ciphertext.length < 16) throw new Error("Ciphertext too short (minimum 16 bytes for GCM tag).");
      }

      const plaintext = await aesGcmDecrypt(keyBytes, iv, ciphertext, aad);
      const outFmt = document.getElementById("plaintext-out-format").value;
      let result;
      try {
        result = encodeOutput(plaintext, outFmt);
      } catch {
        result = encodeOutput(plaintext, "hex");
      }

      showOutput(
        result,
        "Plaintext",
        `Output format: ${outFmt.toUpperCase()} — ${plaintext.length} bytes`
      );
    } catch (err) {
      showError(err.message);
    }
  });

  // Copy button
  document.getElementById("copy-btn").addEventListener("click", () => {
    const val = document.getElementById("output").value;
    navigator.clipboard.writeText(val).then(() => {
      const btn = document.getElementById("copy-btn");
      btn.textContent = "✓";
      setTimeout(() => (btn.textContent = "⎘"), 1500);
    });
  });

  // Init nonce mode on load
  updateNonceMode();
});

// Re-encode value when switching format selectors (best-effort)
function recode(inputId, event) {
  const input = document.getElementById(inputId);
  const val = input.value.trim();
  if (!val) {
    event.target._prev = event.target.value;
    return;
  }
  const oldFmt = event.target._prev || "hex";
  const newFmt = event.target.value;
  try {
    const bytes = decodeInput(val, oldFmt);
    input.value = encodeOutput(bytes, newFmt);
  } catch {
    // leave as-is if cannot decode from old format
  }
  event.target._prev = newFmt;
}

function updateKeySizeRowVisibility() {
  const fmt = document.getElementById("key-format").value;
  const row = document.getElementById("key-size-row");
  // Hide key-size radios when UTF-8: size is determined by the text itself
  row.style.display = fmt === "utf8" ? "none" : "";
}

function updateKeyByteHint() {
  const fmt = document.getElementById("key-format").value;
  const hint = document.getElementById("key-byte-hint");
  if (fmt !== "utf8") {
    hint.style.display = "none";
    return;
  }
  const val = document.getElementById("key-input").value;
  if (!val) {
    hint.style.display = "none";
    return;
  }
  const bytes = utf8ToBytes(val);
  const len = bytes.length;
  const valid = [16, 24, 32].includes(len);
  hint.textContent = `UTF-8 length: ${len} byte${len !== 1 ? "s" : ""} — need 16, 24, or 32`;
  hint.style.display = "block";
  hint.style.color = valid ? "#4ade80" : "#f87171";
}

// The nonce-prepended toggle only applies to Decrypt: when the nonce is
// embedded in the ciphertext, the separate IV field isn't needed. Encrypt
// always needs the IV field visible since #iv-section is shared by both tabs.
function updateNonceMode() {
  const prepended = document.getElementById("nonce-prepended").checked;
  const isDecryptTab = document.getElementById("tab-decrypt").classList.contains("active");
  const ivSection = document.getElementById("iv-section");
  const cipherHint = document.getElementById("cipher-label-hint");

  ivSection.style.display = isDecryptTab && prepended ? "none" : "";
  cipherHint.textContent = prepended
    ? " — nonce[12] + data + tag[16], all in selected format"
    : " — includes 16-byte GCM tag";
}

// Track previous format on selects that support recode
["key-format", "iv-format"].forEach((id) => {
  const sel = document.getElementById(id);
  sel._prev = sel.value;
});
