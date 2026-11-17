/* 全站通用：主题、阅读进度、回到顶部 */
(function () {
  'use strict';
  var KEY = 'yandu-theme';
  var root = document.documentElement;

  function apply(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch (e) { /* ignore */ }
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  apply(saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#theme-btn');
    if (btn) apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  var fill = document.getElementById('progress-fill');
  var toTop = document.getElementById('to-top');
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0;
    if (fill) fill.style.width = p + '%';
    if (toTop) toTop.classList.toggle('show', window.scrollY > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  if (toTop) toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
