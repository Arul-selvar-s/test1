/* Elysian Dental Lounge - shared site features (loaded on every public page)
   Dark mode, site search, scroll progress bar, back-to-top, privacy notice, copy buttons,
   "last updated" date, and remembering the campaign link (utm_) a visitor arrived with.
   Nothing here sends data anywhere. Choices are kept only on the visitor's own device. */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  function svg(paths, cls) {
    var s = '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + paths + '</svg>';
    return s;
  }

  /* ---------- remember the campaign link (utm_) for the appointment form ---------- */
  try {
    var qs = new URLSearchParams(location.search), found = {}, any = false;
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
      var v = qs.get(k);
      if (v) { found[k] = v.replace(/[^\w.\-+ %]/g, '').slice(0, 100); any = true; }
    });
    if (any) sessionStorage.setItem('elysian-utm', JSON.stringify(found));
  } catch (e) {}
  window.ElysianUtm = function () {
    try { return JSON.parse(sessionStorage.getItem('elysian-utm') || '{}') || {}; } catch (e) { return {}; }
  };

  /* ---------- small window helper (search + confirmation) ---------- */
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  function openDialog(opts) {
    var opener = doc.activeElement;
    var overlay = el('div', 'ed-overlay');
    var box = el('div', 'ed-dialog' + (opts.center ? ' center' : ''));
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    var titleId = 'ed-title-' + Math.floor(Math.random() * 1e6);
    box.setAttribute('aria-labelledby', titleId);
    var close = el('button', 'ed-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    var h = el('h2', '', opts.title);
    h.id = titleId;
    box.appendChild(close);
    box.appendChild(h);
    opts.build(box, function () { shut(); });
    overlay.appendChild(box);
    doc.body.appendChild(overlay);
    var prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    function shut() {
      if (!overlay.parentNode) return;
      overlay.parentNode.removeChild(overlay);
      root.style.overflow = prevOverflow;
      doc.removeEventListener('keydown', onKey, true);
      if (opener && opener.focus) opener.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); shut(); return; }
      if (e.key !== 'Tab') return;
      var items = [].slice.call(box.querySelectorAll(FOCUSABLE)).filter(function (n) { return n.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!box.contains(doc.activeElement)) { e.preventDefault(); first.focus(); }
    }
    close.addEventListener('click', shut);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) shut(); });
    doc.addEventListener('keydown', onKey, true);
    var focusTarget = box.querySelector('[data-autofocus]') || close;
    focusTarget.focus();
    return shut;
  }
  window.ElysianUI = { openDialog: openDialog };

  /* ---------- dark mode ---------- */
  function isDark() { return root.getAttribute('data-theme') === 'dark'; }
  function applyTheme(dark) {
    if (dark) root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
    var m = doc.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', dark ? '#0d1f2d' : '#183b56');
    var btns = doc.querySelectorAll('[data-theme-btn]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', String(dark));
      if (btns[i].classList.contains('nav-tool')) btns[i].setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      else btns[i].textContent = dark ? 'Light mode' : 'Dark mode';
    }
  }
  function toggleTheme() {
    var dark = !isDark();
    lsSet('elysian-theme', dark ? 'dark' : 'light');
    applyTheme(dark);
  }

  /* ---------- search ---------- */
  var searchItems = null, searchLoading = null;
  function loadSearch() {
    if (searchItems) return Promise.resolve(searchItems);
    if (!searchLoading) {
      searchLoading = fetch('search-index.json', { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw new Error('no index'); return r.json(); })
        .then(function (j) { searchItems = (j && j.items) || []; return searchItems; })
        .catch(function () { searchLoading = null; return null; });
    }
    return searchLoading;
  }
  function runSearch(items, query) {
    var tokens = query.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!tokens.length) return [];
    var out = [];
    items.forEach(function (it) {
      var t = (it.t || '').toLowerCase(), d = (it.d || '').toLowerCase(), x = (it.x || '').toLowerCase(), score = 0, ok = true;
      tokens.forEach(function (tok) {
        var s = 0;
        if (t.indexOf(tok) > -1) s += (t.indexOf(tok) === 0 || t.indexOf(' ' + tok) > -1) ? 7 : 5;
        if (d.indexOf(tok) > -1) s += 2;
        if (x.indexOf(tok) > -1) s += 1;
        if (!s) ok = false;
        score += s;
      });
      if (ok) out.push({ it: it, score: score });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 8).map(function (r) { return r.it; });
  }
  function openSearch() {
    loadSearch();
    openDialog({
      title: 'Search this website',
      build: function (box, close) {
        var input = el('input', 'ed-search-input');
        input.type = 'search';
        input.placeholder = 'Try: implants, braces, root canal, timings';
        input.setAttribute('aria-label', 'Search this website');
        input.setAttribute('data-autofocus', '');
        input.autocomplete = 'off';
        var live = el('div', 'ed-live');
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');
        var list = el('ul', 'ed-results');
        var note = el('p', 'ed-empty');
        box.appendChild(input);
        box.appendChild(live);
        box.appendChild(list);
        box.appendChild(note);
        function render() {
          var q = input.value.trim();
          list.textContent = '';
          note.textContent = '';
          live.textContent = '';
          if (q.length < 2) return;
          loadSearch().then(function (items) {
            if (input.value.trim() !== q) return;
            if (!items) { note.textContent = 'Search is not available right now. Please use the menu instead.'; return; }
            var res = runSearch(items, q);
            if (!res.length) { note.textContent = 'Nothing found for "' + q + '". Try a different word, or call us on 94980 52828.'; live.textContent = 'No results'; return; }
            live.textContent = res.length + (res.length === 1 ? ' result' : ' results');
            res.forEach(function (it) {
              var li = el('li'), a = el('a');
              a.href = it.u;
              var t = el('span', 'r-title', it.t);
              var k = el('span', 'r-kind', it.k || '');
              a.appendChild(t); a.appendChild(k);
              if (it.d) a.appendChild(el('span', 'r-desc', it.d.length > 130 ? it.d.slice(0, 127) + '...' : it.d));
              a.addEventListener('click', close);
              li.appendChild(a);
              list.appendChild(li);
            });
          });
        }
        input.addEventListener('input', render);
      }
    });
  }

  /* ---------- nav buttons ---------- */
  function addNavTools() {
    var nav = doc.querySelector('nav');
    if (!nav || nav.querySelector('.nav-tool')) return;
    var anchor = nav.querySelector('.nav-toggle');
    function tool(label, icon, onClick, extra) {
      var b = el('button', 'nav-tool');
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.innerHTML = icon;
      if (extra) b.setAttribute(extra, '');
      b.addEventListener('click', onClick);
      if (anchor) nav.insertBefore(b, anchor); else nav.appendChild(b);
      return b;
    }
    tool('Search this website', svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'), openSearch);
    var t = tool('Switch to dark mode',
      svg('<path class="ic-moon" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', 'ic-moon') +
      svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'ic-sun'),
      toggleTheme, 'data-theme-btn');
    t.setAttribute('aria-pressed', String(isDark()));
    // The same two actions inside the phone menu
    var links = nav.querySelector('.nav-links');
    if (links) {
      var s2 = el('a', 'nav-menu-extra nav-menu-tool', 'Search');
      s2.href = '#'; s2.setAttribute('role', 'button');
      s2.addEventListener('click', function (e) { e.preventDefault(); openSearch(); });
      var d2 = el('a', 'nav-menu-extra nav-menu-tool', isDark() ? 'Light mode' : 'Dark mode');
      d2.href = '#'; d2.setAttribute('role', 'button'); d2.setAttribute('data-theme-btn', '');
      d2.setAttribute('aria-pressed', String(isDark()));
      d2.addEventListener('click', function (e) { e.preventDefault(); toggleTheme(); });
      var bookItem = links.querySelector('.nav-menu-book');
      links.insertBefore(s2, bookItem); links.insertBefore(d2, bookItem);
    }
  }

  /* ---------- scroll progress bar + back to top ---------- */
  function addScrollWidgets() {
    var bar = el('div', 'scroll-progress');
    bar.setAttribute('aria-hidden', 'true');
    var top = el('button', 'to-top');
    top.type = 'button';
    top.setAttribute('aria-label', 'Back to top');
    top.innerHTML = svg('<path d="M12 19V5M5 12l7-7 7 7"/>');
    doc.body.appendChild(bar);
    doc.body.appendChild(top);
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset || root.scrollTop || 0;
      var max = Math.max(1, root.scrollHeight - window.innerHeight);
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, y / max)) + ')';
      top.classList.toggle('show', y > 700);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    top.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    update();
  }

  /* ---------- privacy notice ---------- */
  function addPrivacyNotice() {
    if (lsGet('elysian-privacy-ok') === '1') return;
    var box = el('div', 'privacy-notice');
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Privacy notice');
    var p = el('p');
    p.appendChild(doc.createTextNode('We do not use advertising or tracking cookies. We only remember your light/dark choice on your device. Fonts and the map load from Google. '));
    var a = el('a', '', 'Privacy information');
    a.href = 'privacy.html';
    p.appendChild(a);
    p.appendChild(doc.createTextNode('.'));
    var b = el('button', '', 'OK, got it');
    b.type = 'button';
    b.addEventListener('click', function () {
      lsSet('elysian-privacy-ok', '1');
      if (box.parentNode) box.parentNode.removeChild(box);
    });
    box.appendChild(p);
    box.appendChild(b);
    doc.body.appendChild(box);
  }

  /* ---------- copy buttons (address and phone numbers on the homepage) ---------- */
  var liveRegion;
  function announce(msg) {
    if (!liveRegion) {
      liveRegion = el('div', 'ed-live');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      doc.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    window.setTimeout(function () { liveRegion.textContent = msg; }, 30);
  }
  function copyText(text, done) {
    function fallback() {
      var ta = el('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      doc.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = doc.execCommand('copy'); } catch (e) {}
      doc.body.removeChild(ta);
      done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    } else fallback();
  }
  function copyButton(text, what) {
    var b = el('button', 'copy-btn', 'Copy');
    b.type = 'button';
    b.setAttribute('aria-label', 'Copy ' + what);
    b.addEventListener('click', function () {
      copyText(text, function (ok) {
        b.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        announce(ok ? what + ' copied' : 'Could not copy automatically');
        window.setTimeout(function () { b.textContent = 'Copy'; }, 2000);
      });
    });
    return b;
  }
  function addCopyButtons() {
    var c = doc.getElementById('contact');
    if (!c) return;
    var vals = c.querySelectorAll('.contact-item');
    for (var i = 0; i < vals.length; i++) {
      var label = vals[i].querySelector('.c-label'), val = vals[i].querySelector('.c-val');
      if (!label || !val) continue;
      var name = label.textContent.trim().toLowerCase();
      if (name === 'address') {
        var txt = val.innerText.replace(/\s*\n\s*/g, ', ').trim();
        var wrap = el('div');
        wrap.style.marginTop = '6px';
        wrap.appendChild(copyButton(txt, 'address'));
        wrap.firstChild.style.marginLeft = '0';
        val.parentNode.appendChild(wrap);
      } else if (name === 'phone') {
        var tels = val.querySelectorAll('a[href^="tel:"]');
        for (var j = 0; j < tels.length; j++) {
          tels[j].parentNode.insertBefore(copyButton(tels[j].textContent.trim(), 'phone number'), tels[j].nextSibling);
        }
      }
    }
  }

  /* ---------- "last updated" (the date this website was last published) ---------- */
  function addLastUpdated() {
    var host = doc.querySelector('footer .footer-bottom') || doc.querySelector('footer');
    if (!host) return;
    var d = new Date(doc.lastModified);
    if (isNaN(d.getTime()) || d.getFullYear() < 2024 || d.getTime() > Date.now() + 864e5) return;
    var s = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    var p = el('p', 'footer-copy last-updated', 'Last updated: ' + s);
    host.appendChild(p);
  }

  function init() {
    applyTheme(isDark());
    addNavTools();
    addScrollWidgets();
    addCopyButtons();
    addLastUpdated();
    addPrivacyNotice();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
