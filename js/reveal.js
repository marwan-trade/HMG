/* =========================================================
   Apparition douce des schémas au défilement
   Les éléments d'un même schéma apparaissent l'un après l'autre
   (léger glissement vers le haut + fondu), une seule fois.
   Rien n'est masqué si JavaScript est désactivé ou si le visiteur
   a demandé à réduire les animations.
   ========================================================= */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Schémas animés : conteneur → éléments qui apparaissent en cascade
  var GROUPS = [
    ['.flow5', 'li'], ['.goods', 'li'], ['.numcards', '.numcard'], ['.cargo', 'article'],
    ['.route3', 'li'], ['.checklist', 'li'], ['.rows5', 'li'], ['.engage', '.w'],
    ['.services', '.svc'], ['.prod-grid', '.prod-main, .side-card'], ['.needs', '.need']
  ];
  var STEP = 90;   // délai entre deux éléments (ms)

  var items = [];
  GROUPS.forEach(function (g) {
    document.querySelectorAll(g[0]).forEach(function (box) {
      box.classList.add('rv-box');
      box.querySelectorAll(g[1]).forEach(function (el, i) {
        el.classList.add('rv');
        el.style.setProperty('--rv-d', (i * STEP) + 'ms');
      });
      items.push(box);
    });
  });
  if (!items.length) return;

  document.documentElement.classList.add('rv-on');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  items.forEach(function (b) { io.observe(b); });
})();
