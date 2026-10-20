/* Elysian Dental Lounge - "Related articles" block on each treatment page.
   Reads posts.json (made automatically from the blog editor) and shows the articles whose
   "Related treatment" includes this page, newest first. If there are none, nothing is shown. */
(function () {
  'use strict';
  var box = document.getElementById('svc-articles');
  if (!box) return;
  var key = box.getAttribute('data-service');

  var css =
    '.svc-articles{margin:2rem 0}' +
    '.svc-articles h2{font-family:"Cormorant Garamond",serif;font-size:24px;font-weight:400;color:var(--dark);margin-bottom:1.25rem}' +
    '.svc-art-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,230px),1fr));gap:1rem}' +
    '.svc-art{display:flex;flex-direction:column;background:#fff;border:1px solid var(--border);border-radius:16px;overflow:hidden;text-decoration:none;color:var(--dark);transition:all .2s}' +
    '.svc-art:hover{border-color:var(--sage-l);transform:translateY(-3px);box-shadow:0 8px 24px rgba(24,59,86,.1)}' +
    '.svc-art-img{aspect-ratio:16/9;background:var(--sage-l);display:flex;align-items:center;justify-content:center;font-size:30px}' +
    '.svc-art-img img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.svc-art-body{padding:1rem 1.1rem 1.1rem}' +
    '.svc-art-meta{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--light);margin-bottom:.4rem}' +
    '.svc-art-title{font-family:"Cormorant Garamond",serif;font-size:18px;line-height:1.3;margin-bottom:.4rem}' +
    '.svc-art-excerpt{font-size:13px;color:var(--mid);line-height:1.6}' +
    '.svc-art-more{display:inline-block;margin-top:.6rem;font-size:12px;font-weight:500;color:var(--sage-d)}' +
    '.svc-art-all{display:inline-block;margin-top:1rem;font-size:13px;font-weight:500;color:var(--sage-d);text-decoration:none}';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  fetch('posts.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
    .then(function (d) {
      var posts = (d.posts || []).filter(function (p) {
        return !p.draft && (p.services || []).indexOf(key) !== -1;
      }).sort(function (a, b) {
        return String(b.date || '').localeCompare(String(a.date || ''));   // newest first
      });
      if (!posts.length) return;
      var more = posts.length > 6;
      posts = posts.slice(0, 6);

      var style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);

      box.innerHTML = '<h2>Related articles</h2><div class="svc-art-grid">' + posts.map(function (p) {
        var img = p.image
          ? '<img src="' + esc(p.image) + '" alt="" loading="lazy" width="400" height="225"/>'
          : '🦷';
        return '<a class="svc-art" href="' + esc(p.filename) + '"><div class="svc-art-img">' + img + '</div>' +
          '<div class="svc-art-body"><div class="svc-art-meta">' + esc(p.dateDisplay || p.date) + ' · ' + esc(p.category) + '</div>' +
          '<div class="svc-art-title">' + esc(p.title) + '</div><div class="svc-art-excerpt">' + esc(p.excerpt) + '</div>' +
          '<span class="svc-art-more">Read article →</span></div></a>';
      }).join('') + '</div>' + (more ? '<a class="svc-art-all" href="blog.html">See all articles →</a>' : '');
      box.hidden = false;
    })
    .catch(function (e) { console.warn('Related articles not shown:', e); });
})();
