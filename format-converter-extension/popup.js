(function () {
  'use strict';

  const fromSelect = document.getElementById('fromFormat');
  const toSelect = document.getElementById('toFormat');
  const swapBtn = document.getElementById('swapBtn');
  const convertBtn = document.getElementById('convertBtn');
  const copyBtn = document.getElementById('copyBtn');
  const prettyBtn = document.getElementById('prettyBtn');
  const minifyBtn = document.getElementById('minifyBtn');
  const prettyOutBtn = document.getElementById('prettyOutBtn');
  const minifyOutBtn = document.getElementById('minifyOutBtn');
  const input = document.getElementById('input');
  const output = document.getElementById('output');
  const errorBox = document.getElementById('errorBox');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }

  function clearError() {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }

  function doConvert() {
    clearError();
    const from = fromSelect.value;
    const to = toSelect.value;
    if (input.value.trim() === '') {
      output.value = '';
      return;
    }
    try {
      output.value = Converter.convert(input.value, from, to);
    } catch (err) {
      output.value = '';
      showError(err.message);
    }
  }

  swapBtn.addEventListener('click', () => {
    const fromVal = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = fromVal;
    const inVal = input.value;
    input.value = output.value;
    output.value = inVal;
    clearError();
  });

  function doReformat(field, formatSelect, minify) {
    clearError();
    if (field.value.trim() === '') return;
    try {
      field.value = Converter.reformat(field.value, formatSelect.value, { minify });
    } catch (err) {
      showError(err.message);
    }
  }

  convertBtn.addEventListener('click', doConvert);
  prettyBtn.addEventListener('click', () => doReformat(input, fromSelect, false));
  minifyBtn.addEventListener('click', () => doReformat(input, fromSelect, true));
  prettyOutBtn.addEventListener('click', () => doReformat(output, toSelect, false));
  minifyOutBtn.addEventListener('click', () => doReformat(output, toSelect, true));

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
