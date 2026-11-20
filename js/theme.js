(function () {
  'use strict';
  var t = 'light';
  try {
    var saved = localStorage.getItem('hmg-theme');
    if (saved === 'dark' || saved === 'light') t = saved;
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', t);
})();
