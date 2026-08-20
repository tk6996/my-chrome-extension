(function () {
  'use strict';

  const input = document.getElementById('input');
  const output = document.getElementById('output');
  const copyBtn = document.getElementById('copyBtn');
  const errorBox = document.getElementById('errorBox');
  const formatBadge = document.getElementById('formatBadge');

  let debounceTimer = null;

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }

  function clearError() {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }

  function updateBadge(format) {
    if (!format) {
      formatBadge.classList.add('hidden');
      return;
    }
    formatBadge.textContent = format.toUpperCase();
    formatBadge.classList.remove('hidden');
  }

  function doMask() {
    clearError();
    if (input.value.trim() === '') {
      output.value = '';
      updateBadge(null);
      return;
    }
    try {
      const { format, result } = SecretMasker.mask(input.value);
      output.value = result;
      updateBadge(format);
    } catch (err) {
      output.value = '';
      updateBadge(null);
      showError(err.message);
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doMask, 300);
  });

  copyBtn.addEventListener('click', async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = original;
      }, 1000);
    } catch (err) {
      showError('Copy failed: ' + err.message);
    }
  });
})();
