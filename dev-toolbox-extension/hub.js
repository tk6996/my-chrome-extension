(function () {
  'use strict';

  const STORAGE_KEY = 'devToolbox.lastTool';
  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  const frames = Array.from(document.querySelectorAll('.tool-frame'));
  const activeIcon = document.getElementById('activeIcon');
  const activeTitle = document.getElementById('activeTitle');
  const themeToggle = document.getElementById('themeToggle');

  // theme-init.js already set data-theme on <html> before this ran (avoids a
  // flash of the wrong theme); this just syncs the toggle icon to match, and
  // is the single control that drives light/dark for the hub and every tool
  // iframe together (they all share localStorage + the "storage" event since
  // they're same-origin).
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  applyTheme(document.documentElement.getAttribute('data-theme'));

  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'theme' && event.newValue) {
      applyTheme(event.newValue);
    }
  });

  function frameFor(src) {
    return frames.find((f) => f.dataset.tool === src);
  }

  function selectTool(src) {
    const frame = frameFor(src);
    const item = navItems.find((i) => i.dataset.src === src);
    if (!frame || !item) return;

    // Lazy-load on first visit, then leave the iframe mounted for good —
    // switching tools after that only toggles visibility, so each tool's
    // live state (open connections, form input, logs) survives the switch.
    if (!frame.src) frame.src = frame.dataset.tool;

    frames.forEach((f) => f.classList.toggle('active', f === frame));
    navItems.forEach((i) => i.classList.toggle('active', i === item));

    activeIcon.textContent = item.querySelector('.nav-icon').textContent;
    activeTitle.textContent = item.dataset.title;

    localStorage.setItem(STORAGE_KEY, src);
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => selectTool(item.dataset.src));
  });

  const lastTool = localStorage.getItem(STORAGE_KEY);
  const initial = navItems.some((item) => item.dataset.src === lastTool)
    ? lastTool
    : navItems[0].dataset.src;
  selectTool(initial);
})();
