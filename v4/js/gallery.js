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
        t.classList.toggle('is-active', t === tag);
      });
      if (!next || next === current) return;
      current = next;
      clearTimeout(timer);
      var rawAlt = tag.getAttribute('data-alt') || tag.textContent.trim();
      var nextAlt = window.HMG_T && rawAlt ? window.HMG_T(rawAlt) : rawAlt;
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

  var main = document.querySelector('.prod-main');
  if (main) initGallery(main, '.pm-img img', 4200);
  document.querySelectorAll('.side-card.has-ph').forEach(function (card, i) {
    initGallery(card, '.side-ph img', 4900 + i * 900);
  });
})();
