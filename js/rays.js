/* =========================================================
   Fond animé : grille de lignes fines parcourues par des rayons lumineux.
   Version optimisée :
   - la grille est dessinée une seule fois (calque mis en cache) ;
   - pas de flou (shadowBlur) : le halo est un trait plus large et transparent ;
   - l'animation s'arrête quand le fond n'est pas visible à l'écran
     ou quand l'onglet est en arrière-plan ;
   - 30 images/seconde maximum, densité réduite sur mobile ;
   - image fixe si le visiteur a désactivé les animations.
   ========================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GAP = 64;
  var small = window.matchMedia && matchMedia('(max-width: 700px)').matches;
  var FRAME = 1000 / (small ? 24 : 30);
  var scrolling = false, scrollTimer;
  var scenes = [];

  function Scene(canvas) {
    this.c = canvas;
    this.x = canvas.getContext('2d', { alpha: true });
    this.grid = document.createElement('canvas');
    this.visible = false;
    this.last = 0;
    this.build();
  }

  Scene.prototype.build = function () {
    var c = this.c, dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5);
    var W = this.W = c.clientWidth, H = this.H = c.clientHeight;
    if (!W || !H) return;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    this.x.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Calque statique : lignes, intersections et fondu gauche, dessinés une fois.
    var g = this.grid; g.width = c.width; g.height = c.height;
    var gx = g.getContext('2d'); gx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gx.strokeStyle = 'rgba(148,175,214,0.07)'; gx.lineWidth = 1; gx.beginPath();
    this.lines = [];
    for (var y = GAP / 2; y < H; y += GAP) { gx.moveTo(0, y + .5); gx.lineTo(W, y + .5); this.lines.push({ h: 1, p: y + .5 }); }
    for (var v = GAP / 2; v < W; v += GAP) { gx.moveTo(v + .5, 0); gx.lineTo(v + .5, H); this.lines.push({ h: 0, p: v + .5 }); }
    gx.stroke();
    gx.fillStyle = 'rgba(148,175,214,0.16)';
    for (y = GAP / 2; y < H; y += GAP) for (v = GAP / 2; v < W; v += GAP) gx.fillRect(v - 1, y - 1, 2, 2);

    // Fondu vers la gauche pour garder le texte lisible
    // Voile pour garder le texte lisible : sur mobile le texte occupe toute la largeur,
    // donc voile uniforme ; sur ordinateur, voile plus fort à gauche (côté texte).
    if (small) { this.fade = 'rgba(6,14,28,.62)'; }
    else {
      var f = this.x.createLinearGradient(0, 0, W, 0);
      f.addColorStop(0, 'rgba(6,14,28,.86)'); f.addColorStop(.45, 'rgba(6,14,28,.62)'); f.addColorStop(.75, 'rgba(6,14,28,.1)'); f.addColorStop(1, 'rgba(6,14,28,0)');
      this.fade = f;
    }

    // Nombre de rayons proportionnel à la surface, plafonné (moins sur mobile).
    var n = Math.round((W * H) / (W < 700 ? 60000 : 42000));
    n = Math.max(4, Math.min(n, 26));
    this.pulses = [];
    for (var i = 0; i < n; i++) this.pulses.push(this.spawn(true));
    this.draw(0);
  };

  Scene.prototype.spawn = function (anywhere) {
    var l = this.lines[(Math.random() * this.lines.length) | 0];
    var len = l.h ? this.W : this.H, size = 90 + Math.random() * 190;
    var gold = Math.random() < .35;
    return {
      l: l, len: len, size: size,
      t: anywhere ? Math.random() * (len + size) : 0,
      v: (l.h ? 2.4 : 1.8) * (0.6 + Math.random() * 1.4),  // pixels par image à 30 i/s
      dir: Math.random() < .5 ? 1 : -1,
      rgb: gold ? '212,168,67' : '255,122,40',
      a: .55 + Math.random() * .45
    };
  };

  Scene.prototype.draw = function (step) {
    var x = this.x, W = this.W, H = this.H;
    x.clearRect(0, 0, W, H);
    x.drawImage(this.grid, 0, 0, W, H);
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round';
    for (var i = 0; i < this.pulses.length; i++) {
      var p = this.pulses[i];
      p.t += p.v * step;
      if (p.t > p.len + p.size) { this.pulses[i] = p = this.spawn(false); }
      var head = p.dir > 0 ? p.t : p.len - p.t, tail = head - p.dir * p.size;
      var x0, y0, x1, y1;
      if (p.l.h) { x0 = tail; x1 = head; y0 = y1 = p.l.p; } else { y0 = tail; y1 = head; x0 = x1 = p.l.p; }
      var g = x.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(' + p.rgb + ',0)');
      g.addColorStop(1, 'rgba(' + p.rgb + ',' + p.a + ')');
      // halo : trait large et transparent (remplace le flou, bien plus léger)
      x.strokeStyle = g; x.globalAlpha = .22; x.lineWidth = 6;
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      // cœur du rayon
      x.globalAlpha = 1; x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      // tête lumineuse
      x.fillStyle = 'rgba(255,236,210,' + p.a + ')';
      x.fillRect(x1 - 1.5, y1 - 1.5, 3, 3);
    }
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = this.fade; x.fillRect(0, 0, W, H);
  };

  function loop(now) {
    var running = false;
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      if (!s.visible) continue;
      running = true;
      var dt = now - s.last;
      if (scrolling) { s.last = now; continue; }   // pause pendant le défilement : priorité à la fluidité
      if (dt >= FRAME) {
        s.draw(Math.min(dt / FRAME, 3));   // pas d'à-coup après une pause
        s.last = now;
      }
    }
    rafId = running && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  var rafId = 0;
  function wake() {
    if (!rafId && !reduce && !document.hidden) {
      var now = performance.now();
      scenes.forEach(function (s) { s.last = now; });
      rafId = requestAnimationFrame(loop);
    }
  }

  function init() {
    var canvases = document.querySelectorAll('canvas.rays');
    if (!canvases.length) return;
    for (var i = 0; i < canvases.length; i++) scenes.push(new Scene(canvases[i]));
    if (reduce) return;   // image fixe, aucune animation

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          for (var i = 0; i < scenes.length; i++) if (scenes[i].c === e.target) scenes[i].visible = e.isIntersecting;
        });
        wake();
      }, { rootMargin: '50px' });
      scenes.forEach(function (s) { io.observe(s.c); });
    } else {
      scenes.forEach(function (s) { s.visible = true; });
      wake();
    }
    document.addEventListener('visibilitychange', wake);

    // Pendant le défilement, l'animation se fige ; elle repart 150 ms après l'arrêt.
    window.addEventListener('scroll', function () {
      scrolling = true;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () { scrolling = false; }, 150);
    }, { passive: true });

    // Redimensionnement : on attend la fin du geste avant de tout recalculer.
    var t, lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;   // ignore la barre d'adresse mobile qui apparaît/disparaît
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(function () { scenes.forEach(function (s) { s.build(); }); }, 200);
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
