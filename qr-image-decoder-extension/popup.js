"use strict";

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

function showOutput(value) {
  hideError();
  document.getElementById("output").value = value;
  document.getElementById("output-format-label").textContent = `${value.length} characters`;
  document.getElementById("output-section").style.display = "block";
}

function showPreview(imgUrl) {
  const preview = document.getElementById("preview-img");
  preview.src = imgUrl;
  preview.style.display = "block";
  document.getElementById("paste-placeholder").style.display = "none";
}

// ─── Decoding ───────────────────────────────────────────────────────────────

function decodeImageBlob(blob) {
  const imgUrl = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    showPreview(imgUrl);

    const canvas = document.getElementById("work-canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
      showError("Could not read image data.");
      return;
    }

    const result = jsQR(imageData.data, imageData.width, imageData.height);
    if (result && result.data) {
      showOutput(result.data);
    } else {
      showError("No QR code or barcode found in this image.");
    }
  };
  img.onerror = () => showError("Could not load the pasted image.");
  img.src = imgUrl;
}

function findImageItem(items) {
  for (const item of items) {
    if (item.type && item.type.startsWith("image/")) return item;
  }
  return null;
}

// ─── Event Wiring ───────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const pasteZone = document.getElementById("paste-zone");

  pasteZone.addEventListener("paste", (event) => {
    hideError();
    const item = findImageItem(event.clipboardData.items);
    if (!item) {
      showError("Clipboard does not contain an image.");
      return;
    }
    const blob = item.getAsFile();
    decodeImageBlob(blob);
  });

  // Convenience button using the async Clipboard API (needs a user gesture)
  document.getElementById("paste-btn").addEventListener("click", async () => {
    hideError();
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageType = clipboardItem.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await clipboardItem.getType(imageType);
          decodeImageBlob(blob);
          return;
        }
      }
      showError("Clipboard does not contain an image.");
    } catch (err) {
      showError(`Could not read clipboard (${err.message}). Try clicking the box above and pressing Ctrl+V instead.`);
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

  pasteZone.focus();
});
