// Applies the saved theme before first paint to avoid a flash. Only the theme name is stored.
(function () {
  try {
    var t = localStorage.getItem('ln-theme') || 'system';
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    if (dark) document.querySelector('meta[name="theme-color"]').setAttribute('content', '#131314');
  } catch (e) {}
})();
