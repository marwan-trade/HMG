(function () {
  'use strict';

  /* ---------- Mode sombre / clair ---------- */
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');

  function getTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function syncThemeBtn() {
    if (!btn) return;
    var dark = getTheme() === 'dark';
    var T = window.HMG_T || function (s) { return s; };
    var frLabel = dark ? 'Activer le mode clair' : 'Activer le mode sombre';
    var frShort = dark ? 'Clair' : 'Sombre';
    var label = T(frLabel);
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    var lbl = btn.querySelector('.theme-lbl');
    if (lbl) lbl.textContent = T(frShort);
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('hmg-theme', theme); } catch (e) {}
    syncThemeBtn();
  }

  if (btn) {
    btn.addEventListener('click', function () {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
    document.addEventListener('hmg:lang', syncThemeBtn);
    syncThemeBtn();
  }

  /* ---------- Curseur personnalisé (cercle + point) ---------- */
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dot = document.createElement('div');
  var ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);
  document.body.appendChild(dot);

  var tx = -100, ty = -100, rx = -100, ry = -100;
  var visible = false, rafId = 0;

  var INTERACTIVE_SEL = 'a, button, summary, [role="button"], .tags span, label.choice, label.need, label.chk, label.drop, .faq-item summary, .lang a';
  var TEXT_SEL = 'input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea, select';

  function render() {
    rafId = 0;
    if (reduce) {
      rx = tx;
      ry = ty;
    } else {
      rx += (tx - rx) * 0.2;
      ry += (ty - ry) * 0.2;
    }
    ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';
    if (!reduce && (Math.abs(tx - rx) > 0.25 || Math.abs(ty - ry) > 0.25)) {
      rafId = requestAnimationFrame(render);
    }
  }

  function setVisible(on) {
    if (visible === on) return;
    visible = on;
    dot.classList.toggle('is-vis', on);
    ring.classList.toggle('is-vis', on);
  }

  document.addEventListener('mousemove', function (e) {
    if (!root.classList.contains('has-cursor')) root.classList.add('has-cursor');
    tx = e.clientX;
    ty = e.clientY;
    if (!visible) {
      rx = tx;
      ry = ty;
      setVisible(true);
    }
    dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) translate(-50%,-50%)';
    if (!rafId) rafId = requestAnimationFrame(render);

    var el = e.target;
    var isText = !!(el && el.closest && el.closest(TEXT_SEL));
    var isInteractive = !isText && !!(el && el.closest && el.closest(INTERACTIVE_SEL));
    dot.classList.toggle('is-hover', isInteractive);
    ring.classList.toggle('is-hover', isInteractive);
    dot.classList.toggle('is-text', isText);
    ring.classList.toggle('is-text', isText);
  }, { passive: true });

  document.addEventListener('mousedown', function () {
    dot.classList.add('is-down');
    ring.classList.add('is-down');
  });

  document.addEventListener('mouseup', function () {
    dot.classList.remove('is-down');
    ring.classList.remove('is-down');
  });

  document.addEventListener('mouseleave', function () {
    setVisible(false);
  });

  window.addEventListener('blur', function () {
    setVisible(false);
  });
})();
