(function () {
  'use strict';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initGallery(card, imgSelector, autoMs) {
    var img = card.querySelector(imgSelector);
    var tags = Array.prototype.slice.call(card.querySelectorAll('.tags span[data-img]'));
    if (!img || !tags.length) return;
    var current = img.getAttribute('src');
    var timer = null;
    var paused = false;

    tags.forEach(function (t) {
      var pre = new Image();
      pre.referrerPolicy = 'no-referrer';
      pre.src = t.getAttribute('data-img');
    });

    function selectTag(tag) {
      var next = tag.getAttribute('data-img');
      tags.forEach(function (t) {
        var on = t === tag;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var rawAlt = tag.getAttribute('data-alt') || tag.textContent.trim();
      var nextAlt = window.HMG_T && rawAlt ? window.HMG_T(rawAlt) : rawAlt;
      if (!next || next === current) {
        if (nextAlt) img.alt = nextAlt;
        return;
      }
      current = next;
      clearTimeout(timer);
      img.classList.add('is-fading');
      timer = setTimeout(function () {
        img.src = next;
        img.alt = nextAlt;
        if (img.complete) {
          img.classList.remove('is-fading');
        } else {
          img.onload = function () {
            img.classList.remove('is-fading');
            img.onload = null;
          };
        }
      }, 180);
    }

    tags.forEach(function (tag) {
      tag.setAttribute('aria-pressed', tag.classList.contains('is-active') ? 'true' : 'false');
      tag.addEventListener('mouseenter', function () {
        selectTag(tag);
      });
      tag.addEventListener('click', function () {
        selectTag(tag);
      });
      tag.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectTag(tag);
        }
      });
    });

    document.addEventListener('hmg:lang', function () {
      var active = tags.find(function (t) { return t.classList.contains('is-active'); });
      if (active) {
        var rawAlt = active.getAttribute('data-alt') || active.textContent.trim();
        img.alt = window.HMG_T && rawAlt ? window.HMG_T(rawAlt) : rawAlt;
      }
    });

    if (autoMs && !reduceMotion && tags.length > 1) {
      setInterval(function () {
        if (paused || document.hidden) return;
        var idx = tags.findIndex(function (t) {
          return t.classList.contains('is-active');
        });
        selectTag(tags[(idx + 1) % tags.length]);
      }, autoMs);
      card.addEventListener('mouseenter', function () {
        paused = true;
      });
      card.addEventListener('mouseleave', function () {
        paused = false;
      });
      card.addEventListener('focusin', function () {
        paused = true;
      });
      card.addEventListener('focusout', function () {
        paused = false;
      });
    }
  }

  function initNumcardSwap(container) {
    var items = Array.prototype.slice.call(container.children).filter(function (el) {
      return el.matches('.numcard, li');
    });
    if (items.length < 2) return;

    function T(s) {
      return (window.HMG_T && window.HMG_T(s)) || s;
    }

    function readItem(item, index) {
      var numEl = item.querySelector('.n');
      var numSpan = numEl && (numEl.querySelector('.d-only') || numEl);
      var num = (numSpan ? numSpan.textContent : String(index + 1)).trim().padStart(2, '0');
      var heading = item.querySelector('h3') || item.querySelector('b');
      var title = heading ? heading.textContent.trim() : '';
      var descElSrc = item.querySelector('p');
      var more = item.querySelector('a.more');
      return { num: num, title: title, descEl: descElSrc, more: more };
    }

    var isOrderedList = container.tagName === 'OL';
    var hasAnyDesc = items.some(function (it) { return !!it.querySelector('p'); });
    var hasAnyMore = items.some(function (it) { return !!it.querySelector('a.more'); });

    var stage = document.createElement('div');
    stage.className = 'prest-stage';
    if (!hasAnyMore) stage.classList.add('prest-stage--no-cta');
    if (!hasAnyDesc) stage.classList.add('prest-stage--compact');
    stage.setAttribute('role', 'region');
    stage.setAttribute('aria-live', 'polite');

    var totalStr = String(items.length).padStart(2, '0');
    var stepsHtml = items.map(function (it, idx) {
      var info = readItem(it, idx);
      return '<button type="button" class="prest-step-btn" data-step="' + idx + '">' + info.num + '</button>';
    }).join('');

    stage.innerHTML =
      '<div class="prest-head">' +
        '<span class="prest-count"><b class="prest-idx">01</b> / ' + totalStr + '</span>' +
        '<div class="prest-controls">' +
          '<div class="prest-steps" role="tablist">' + stepsHtml + '</div>' +
          '<div class="prest-nav">' +
            '<button type="button" class="prest-prev">&larr;</button>' +
            '<button type="button" class="prest-next">&rarr;</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="prest-progress" aria-hidden="true"><span class="prest-bar"></span></div>' +
      '<div class="prest-body">' +
        '<div class="prest-text"><h3></h3><p></p></div>' +
        '<a class="prest-cta" href="#"></a>' +
      '</div>';

    container.parentNode.insertBefore(stage, container);
    container.classList.add('is-swap-source');

    var idxEl = stage.querySelector('.prest-idx');
    var barEl = stage.querySelector('.prest-bar');
    var bodyEl = stage.querySelector('.prest-body');
    var titleEl = stage.querySelector('.prest-text h3');
    var descEl = stage.querySelector('.prest-text p');
    var ctaEl = stage.querySelector('.prest-cta');
    var prevBtn = stage.querySelector('.prest-prev');
    var nextBtn = stage.querySelector('.prest-next');
    var stepBtns = Array.prototype.slice.call(stage.querySelectorAll('.prest-step-btn'));

    var current = 0;
    var swapMs = 3200;
    var swapTimer = null;
    var intervalId = null;
    var paused = false;

    function syncLabels() {
      var prevTxt = T(isOrderedList ? 'Étape précédente' : 'Prestation précédente');
      var nextTxt = T(isOrderedList ? 'Étape suivante' : 'Prestation suivante');
      prevBtn.setAttribute('aria-label', prevTxt);
      nextBtn.setAttribute('aria-label', nextTxt);
      stage.setAttribute('aria-label', T('Les prestations'));
      stepBtns.forEach(function (b, idx) {
        var info = readItem(items[idx], idx);
        var label = info.num + (info.title ? ' — ' + info.title : '');
        b.setAttribute('aria-label', label);
        b.setAttribute('title', label);
      });
    }

    function restartBar() {
      if (reduceMotion) return;
      barEl.classList.remove('is-running');
      void barEl.offsetWidth;
      barEl.classList.add('is-running');
    }

    function renderCard(nextIndex, animate) {
      current = ((nextIndex % items.length) + items.length) % items.length;
      var info = readItem(items[current], current);

      stepBtns.forEach(function (b, i) {
        var on = i === current;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      var applyContent = function () {
        idxEl.textContent = info.num;
        titleEl.textContent = info.title;
        descEl.textContent = '';
        if (info.descEl) {
          Array.prototype.slice.call(info.descEl.childNodes).forEach(function (node) {
            descEl.appendChild(node.cloneNode(true));
          });
        }
        if (info.more) {
          ctaEl.href = info.more.getAttribute('href') || '#';
          ctaEl.textContent = info.more.textContent.trim();
          ctaEl.hidden = false;
        } else {
          ctaEl.hidden = true;
        }
      };

      clearTimeout(swapTimer);
      if (animate && !reduceMotion) {
        bodyEl.classList.remove('is-entering');
        bodyEl.classList.add('is-leaving');
        swapTimer = setTimeout(function () {
          applyContent();
          bodyEl.classList.remove('is-leaving');
          bodyEl.classList.add('is-entering');
          void bodyEl.offsetWidth;
          bodyEl.classList.remove('is-entering');
        }, 190);
      } else {
        bodyEl.classList.remove('is-leaving', 'is-entering');
        applyContent();
      }
      restartBar();
    }

    function startLoop() {
      if (reduceMotion) return;
      clearInterval(intervalId);
      intervalId = setInterval(function () {
        if (paused || document.hidden) return;
        renderCard(current + 1, true);
      }, swapMs);
    }

    function setPaused(on) {
      paused = on;
      stage.classList.toggle('is-paused', on);
    }

    prevBtn.addEventListener('click', function () {
      renderCard(current - 1, true);
      startLoop();
    });
    nextBtn.addEventListener('click', function () {
      renderCard(current + 1, true);
      startLoop();
    });
    stepBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        if (i === current) return;
        renderCard(i, true);
        startLoop();
      });
    });

    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        renderCard(current - 1, true);
        startLoop();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        renderCard(current + 1, true);
        startLoop();
      }
    });

    stage.addEventListener('mouseenter', function () { setPaused(true); });
    stage.addEventListener('mouseleave', function () { setPaused(false); });
    stage.addEventListener('focusin', function () { setPaused(true); });
    stage.addEventListener('focusout', function () { setPaused(false); });

    document.addEventListener('hmg:lang', function () {
      syncLabels();
      renderCard(current, false);
    });

    syncLabels();
    renderCard(0, false);
    startLoop();
  }

  var main = document.querySelector('.prod-main');
  if (main) initGallery(main, '.pm-img img', 4200);
  document.querySelectorAll('.side-card.has-ph').forEach(function (card, i) {
    initGallery(card, '.side-ph img', 4900 + i * 900);
  });
  document.querySelectorAll('.svc.has-ph').forEach(function (card, i) {
    initGallery(card, '.ph img', 4300 + i * 800);
  });
  document.querySelectorAll('.cargo article.has-ph').forEach(function (card, i) {
    initGallery(card, '.cargo-ph img', 4500 + i * 850);
  });
  document.querySelectorAll('[data-numcards-swap]').forEach(function (container) {
    initNumcardSwap(container);
  });
})();
