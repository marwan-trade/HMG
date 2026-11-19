/* =========================================================
   Formulaires HMG
   - Contact : affiche uniquement les champs utiles selon le besoin choisi
     (Logistique / Sourcing / Conseil), pré-remplit la demande depuis une
     prestation (?besoin=logistique&prestation=Fret%20aérien) et adapte le
     message WhatsApp.
   - Tous les formulaires : nom du fichier joint, limite de 10 Mo,
     bouton désactivé pendant l'envoi.
   ========================================================= */
(function () {
  'use strict';
  var WA = 'https://wa.me/25377576805?text=';
  var MSG = {
    logistique: 'Bonjour HMG, je souhaite un devis pour un transport.',
    sourcing: 'Bonjour HMG, je recherche un produit.',
    conseil: 'Bonjour HMG, je souhaite présenter mon projet.'
  };

  // ---------- Formulaire de contact : champs selon le besoin
  var form = document.getElementById('contact-form');
  if (form) {
    var radios = form.querySelectorAll('input[name="Besoin"]');
    var sets = form.querySelectorAll('.need-fs');
    var waBtn = document.getElementById('wa-btn');
    var waMsg = document.getElementById('wa-msg');

    function show(need) {
      sets.forEach(function (fs) {
        var on = fs.getAttribute('data-for') === need;
        fs.hidden = !on;
        fs.disabled = !on;            // les champs masqués ne sont pas envoyés
      });
      if (waBtn && MSG[need]) {
        var T = window.HMG_T || function (x) { return x; }, en = window.HMG_LANG && window.HMG_LANG() === 'en';
        var m = T(MSG[need]);
        waBtn.dataset.frHref = WA + encodeURIComponent(MSG[need]);
        waBtn.href = WA + encodeURIComponent(m);
        var fr = !window.HMG_LANG || window.HMG_LANG() === 'fr';
        if (waMsg) waMsg.textContent = fr ? '« ' + m + ' »' : '“' + m + '”';
      }
    }
    radios.forEach(function (r) {
      r.addEventListener('change', function () { show(r.getAttribute('data-need')); });
    });
    document.addEventListener('hmg:lang', function () {
      var c = form.querySelector('input[name="Besoin"]:checked'); show(c ? c.getAttribute('data-need') : 'logistique');
    });

    // Pré-remplissage depuis l'adresse de la page
    var q = new URLSearchParams(location.search);
    var need = q.get('besoin');
    if (need) {
      var r = form.querySelector('input[data-need="' + need + '"]');
      if (r) r.checked = true;
    }
    var prest = q.get('prestation');
    if (prest) {
      var sel = document.getElementById('l-prest');
      if (sel) {
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].text === prest || sel.options[i].text === (window.HMG_T ? window.HMG_T(prest) : prest)) { sel.selectedIndex = i; break; }
        }
        var box = document.getElementById('prefill'), nm = document.getElementById('prefill-name');
        if (box && nm && sel.value) { nm.textContent = sel.options[sel.selectedIndex].text; box.hidden = false; }
      }
    }
    var checked = form.querySelector('input[name="Besoin"]:checked');
    show(checked ? checked.getAttribute('data-need') : 'logistique');
  }

  // ---------- Tous les formulaires : fichier joint et envoi
  document.querySelectorAll('form').forEach(function (f) {
    var file = f.querySelector('.file-in');
    if (file) file.addEventListener('change', function () {
      var b = file.parentNode.querySelector('b'); if (!b) return;
      if (!b.dataset.label) b.dataset.label = b.textContent;
      var x = file.files[0];
      if (x && x.size > 10 * 1024 * 1024) { alert(window.HMG_T ? window.HMG_T('Le fichier dépasse 10 Mo.') : 'Le fichier dépasse 10 Mo.'); file.value = ''; b.textContent = b.dataset.label; return; }
      b.textContent = x ? '📎 ' + x.name : b.dataset.label;
    });
    f.addEventListener('submit', function () {
      var btn = f.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.style.opacity = .7; btn.textContent = window.HMG_T ? window.HMG_T('Envoi en cours…') : 'Envoi en cours…'; }
    });
  });
})();
