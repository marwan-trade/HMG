(function () {
  'use strict';

  function isEditable(el) {
    if (!el || !el.closest) return false;
    return !!el.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]');
  }

  document.addEventListener('contextmenu', function (e) {
    if (isEditable(e.target)) return;
    e.preventDefault();
  });

  document.addEventListener('dragstart', function (e) {
    if (e.target && e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    var mod = e.ctrlKey || e.metaKey;
    if (k === 'f12') {
      e.preventDefault();
      return false;
    }
    if (mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c' || k === 'k')) {
      e.preventDefault();
      return false;
    }
    if (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'c' || k === 'u')) {
      e.preventDefault();
      return false;
    }
    if (mod && !e.shiftKey && (k === 'u' || k === 's')) {
      e.preventDefault();
      return false;
    }
  });
})();
