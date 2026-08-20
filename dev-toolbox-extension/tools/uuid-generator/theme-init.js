(function () {
  var stored = localStorage.getItem("theme");
  var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  // Every tool lives in a same-origin iframe that the hub keeps mounted in
  // the background (see hub.js), so a theme change made elsewhere — the hub
  // toggle, or another tool's own toggle — needs to apply live here too via
  // the storage event, not just on next load.
  window.addEventListener("storage", function (event) {
    if (event.key === "theme" && event.newValue) {
      document.documentElement.setAttribute("data-theme", event.newValue);
    }
  });
})();
