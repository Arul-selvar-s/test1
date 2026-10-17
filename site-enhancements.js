/* Elysian Dental Lounge — shared site enhancements
   Adds a mobile menu (hamburger) to every public page, so the navigation
   links are reachable on phones. Loaded once per page via <script defer>. */
(function () {
  'use strict';

  var nav = document.querySelector('nav');
  var links = nav && nav.querySelector('.nav-links');
  if (!nav || !links || nav.querySelector('.nav-toggle')) return;

  var css =
    '.nav-toggle{display:none;align-items:center;justify-content:center;flex-direction:column;gap:5px;width:44px;height:44px;border:1px solid #C5DDEF;border-radius:12px;background:#fff;cursor:pointer;padding:0;margin-left:.25rem;flex-shrink:0}' +
    '.nav-toggle span{display:block;width:20px;height:2px;background:#183b56;border-radius:2px;transition:transform .2s,opacity .2s}' +
    'nav.nav-open .nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg)}' +
    'nav.nav-open .nav-toggle span:nth-child(2){opacity:0}' +
    'nav.nav-open .nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}' +
    '.nav-toggle:focus-visible{outline:2px solid #0b69ff;outline-offset:2px}' +
    '.nav-links a.nav-menu-extra{display:none}' +
    '@media(max-width:900px){' +
      'nav{gap:.75rem}' +
      '.nav-toggle{display:flex}' +
      'nav .nav-cta{margin-left:auto}' +
      'nav .nav-links{display:none!important}' +
      'nav.nav-open .nav-links{display:flex!important;flex-direction:column;gap:0;position:absolute;top:100%;left:0;right:0;background:#fff;border-bottom:1px solid #C5DDEF;box-shadow:0 14px 28px rgba(13,31,45,.1);padding:.5rem 1.25rem 1rem;max-height:calc(100vh - 68px);overflow-y:auto}' +
      'nav.nav-open .nav-links a{font-size:15px;padding:14px 4px;border-bottom:1px solid #E8F1FC;color:#2E5275}' +
      'nav.nav-open .nav-links a.nav-menu-call{display:block;color:#183b56;font-weight:500}' +
    '}' +
    '@media(max-width:560px){' +
      'nav .nav-cta{display:none}' +
      '.nav-toggle{margin-left:auto}' +
      'nav .nav-name{font-size:17px}' +
      'nav.nav-open .nav-links a.nav-menu-book{display:block;background:#183b56;color:#fff;border:none;border-radius:30px;text-align:center;margin-top:12px;font-weight:500}' +
    '}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  if (!links.id) links.id = 'primary-nav-links';

  // Extra items shown only inside the opened mobile menu
  var call = document.createElement('a');
  call.className = 'nav-menu-extra nav-menu-call';
  call.href = 'tel:+919498052828';
  call.textContent = 'Call 94980 52828';
  links.appendChild(call);

  var cta = nav.querySelector('.nav-cta');
  if (cta) {
    var book = document.createElement('a');
    book.className = 'nav-menu-extra nav-menu-book';
    book.href = cta.getAttribute('href');
    book.textContent = 'Book Appointment';
    links.appendChild(book);
  }

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-label', 'Open menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', links.id);
  btn.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(btn);

  function setOpen(open) {
    nav.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  btn.addEventListener('click', function () {
    setOpen(!nav.classList.contains('nav-open'));
  });

  links.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== links) {
      if (t.tagName === 'A') { setOpen(false); return; }
      t = t.parentNode;
    }
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
      setOpen(false);
      btn.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setOpen(false);
  });
})();
