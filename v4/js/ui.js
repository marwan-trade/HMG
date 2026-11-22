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

  /* ---------- Modale Zoom (Carte de visite) ---------- */
  var modal = null;
  var activeKind = 'card';
  var activeScale = 1;
  var lastFocused = null;

  function T(s) {
    return (window.HMG_T && window.HMG_T(s)) || s;
  }

  function currentHomeHref() {
    var p = location.pathname || '/';
    if (/^\/en(\/|$)/.test(p)) return '/en';
    if (/^\/zh(\/|$)/.test(p)) return '/zh';
    if (/^\/am(\/|$)/.test(p)) return '/am';
    return '/';
  }

  function currentContactHref() {
    var p = location.pathname || '/';
    if (/^\/en(\/|$)/.test(p)) return '/en/contact';
    if (/^\/zh(\/|$)/.test(p)) return '/zh/contact';
    if (/^\/am(\/|$)/.test(p)) return '/am/contact';
    return '/contact';
  }

  function syncZoomTexts() {
    if (!modal) return;
    var titleEl = modal.querySelector('.zoom-title');
    var closeBtn = modal.querySelector('.zoom-close');
    var actionLink = modal.querySelector('.zoom-home');
    if (titleEl) {
      titleEl.textContent = T('Carte de visite officielle');
    }
    if (closeBtn) closeBtn.setAttribute('aria-label', T('Fermer'));
    if (actionLink) {
      if (activeKind === 'card') {
        actionLink.href = currentContactHref();
        actionLink.textContent = T('Demander un devis →');
      } else {
        actionLink.href = currentHomeHref();
        actionLink.textContent = T('Voir l’accueil');
      }
    }
  }

  function applyZoomState() {
    if (!modal) return;
    var stage = modal.querySelector('.zoom-stage');
    var img = modal.querySelector('.zoom-stage img');
    stage.setAttribute('data-kind', activeKind);
    stage.classList.toggle('is-zoomed', activeScale > 1);
    img.style.transform = 'scale(' + activeScale + ')';

    modal.querySelectorAll('[data-zoom-scale]').forEach(function (b) {
      var on = parseFloat(b.getAttribute('data-zoom-scale')) === activeScale;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'zoom-modal';
    modal.id = 'hmg-zoom-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'hmg-zoom-title');
    modal.hidden = true;
    modal.innerHTML =
      '<div class="zoom-dialog">' +
        '<div class="zoom-head">' +
          '<div class="zoom-title" id="hmg-zoom-title"></div>' +
          '<div class="zoom-bar">' +
            '<div class="zoom-seg" role="group">' +
              '<button type="button" data-zoom-scale="1">100%</button>' +
              '<button type="button" data-zoom-scale="1.5">150%</button>' +
              '<button type="button" data-zoom-scale="2">200%</button>' +
            '</div>' +
            '<button type="button" class="zoom-close">&times;</button>' +
          '</div>' +
        '</div>' +
        '<div class="zoom-stage"><img src="" alt=""></div>' +
        '<div class="zoom-foot">' +
          '<span>HMG Global Business Solutions SARL — Saline Ouest, Djibouti</span>' +
          '<a class="zoom-home" href="/"></a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeZoom();
        return;
      }
      var closeTrigger = e.target.closest('.zoom-close');
      if (closeTrigger) {
        closeZoom();
        return;
      }
      var scaleBtn = e.target.closest('[data-zoom-scale]');
      if (scaleBtn) {
        activeScale = parseFloat(scaleBtn.getAttribute('data-zoom-scale')) || 1;
        applyZoomState();
        return;
      }
      if (e.target.closest('.zoom-stage img')) {
        activeScale = activeScale > 1 ? 1 : 1.5;
        applyZoomState();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) closeZoom();
    });

    document.addEventListener('hmg:lang', syncZoomTexts);
    return modal;
  }

  function openZoom(src, alt, kind) {
    ensureModal();
    lastFocused = document.activeElement;
    activeKind = kind || 'card';
    activeScale = 1;

    var img = modal.querySelector('.zoom-stage img');
    img.src = src;
    img.alt = alt || 'HMG Global Business Solutions';

    syncZoomTexts();
    applyZoomState();
    modal.hidden = false;
    requestAnimationFrame(function () {
      modal.classList.add('is-open');
    });
    document.body.style.overflow = 'hidden';
    var closeBtn = modal.querySelector('.zoom-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeZoom() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      if (modal) modal.hidden = true;
    }, 180);
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  document.addEventListener('click', function (e) {
    var zoomEl = e.target && e.target.closest && e.target.closest('[data-zoom-src]');
    if (!zoomEl) return;
    e.preventDefault();
    var img = zoomEl.querySelector('img');
    var src = zoomEl.getAttribute('data-zoom-src') || (img && img.getAttribute('src'));
    if (!src) return;
    var kind = zoomEl.getAttribute('data-zoom-kind') || 'card';
    var alt = (img && img.getAttribute('alt')) || zoomEl.getAttribute('aria-label') || 'HMG Global Business Solutions';
    openZoom(src, alt, kind);
  });

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

  var INTERACTIVE_SEL = 'a, button, summary, [role="button"], .logo, .float-card-btn, .tags span, label.choice, label.need, label.chk, label.drop, .faq-item summary, .lang a';
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
