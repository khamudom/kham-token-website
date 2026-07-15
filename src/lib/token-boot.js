/* Apply saved theme tokens before first paint. Keep in sync with tokens.ts. */
(function () {
  var KEY = 'kham.tokens';
  var theme = 'dark';
  var hue = 255;
  var saturation = 69;
  var radius = 4;
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var saved = JSON.parse(raw);
      if (saved.theme) theme = saved.theme;
      if (saved.hue != null) hue = saved.hue;
      if (saved.saturation != null) saturation = saved.saturation;
      if (saved.radius != null) radius = saved.radius;
    }
  } catch (_) {}
  var root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.setProperty('--accent-h', String(hue));
  root.style.setProperty('--accent-s', String(saturation));
  root.style.setProperty('--radius', radius + 'px');
})();
