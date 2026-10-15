(function () {
  'use strict';
  if (window.__siteInit) return;
  window.__siteInit = true;

  var doc = document;
  var root = doc.documentElement;
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return reduceQuery.matches; }

  /* ---------- header: solid state, progress line, hero veil ---------- */
  var header = doc.getElementById('header');
  var progress = header && header.querySelector('.progress');
  var veilEl = doc.querySelector('.env-veil');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || 0;
      var max = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
      if (progress) progress.style.setProperty('--p', Math.min(1, y / max).toFixed(4));
      if (veilEl) {
        var v = Math.min(1, y / (window.innerHeight * 0.9));
        root.style.setProperty('--veil', (v * 0.85).toFixed(3));
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- phone menu ---------- */
  var menuBtn = doc.querySelector('.menu-btn');
  var nav = doc.getElementById('menu');
  var inertTargets = [doc.getElementById('main'), doc.querySelector('.site-footer')];
  var wide = window.matchMedia('(min-width: 900px)');

  function setMenu(open) {
    if (!menuBtn || !nav) return;
    nav.setAttribute('data-open', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    doc.body.classList.toggle('menu-open', open);
    inertTargets.forEach(function (el) { if (el) el.inert = open; });
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus();
    }
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });
    wide.addEventListener('change', function () { if (wide.matches) setMenu(false); });
  }

  /* ---------- current section in the nav ---------- */
  var links = nav ? [].slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  if ('IntersectionObserver' in window && links.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var t = doc.querySelector(a.getAttribute('href'));
      if (t) spy.observe(t);
    });
  }

  /* ---------- word rise on headings ---------- */
  [].forEach.call(doc.querySelectorAll('[data-words]'), function (el) {
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(' ').forEach(function (word, i, all) {
      var outer = doc.createElement('span');
      outer.className = 'w';
      outer.setAttribute('aria-hidden', 'true');
      var inner = doc.createElement('span');
      inner.className = 'wi';
      inner.style.setProperty('--i', i);
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < all.length - 1) el.appendChild(doc.createTextNode(' '));
    });
  });

  /* ---------- arrival reveals ---------- */
  [].forEach.call(doc.querySelectorAll('[data-reveal-group]'), function (group) {
    [].forEach.call(group.children, function (child, i) {
      child.style.setProperty('--d', i);
    });
  });
  var revealTargets = [].slice.call(doc.querySelectorAll('[data-reveal], [data-words]'));
  function showAll() {
    revealTargets.forEach(function (el) {
      el.classList.add('in');
      el.classList.add('words-in');
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.classList.add('words-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    showAll();
  }

  /* ---------- card spotlight (fine pointer only) ---------- */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  doc.addEventListener('pointermove', function (e) {
    if (!finePointer.matches) return;
    var card = e.target.closest ? e.target.closest('[data-spot]') : null;
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  /* ---------- lightbox ---------- */
  var box = doc.getElementById('lightbox');
  if (box && typeof box.showModal === 'function') {
    var boxImg = box.querySelector('img');
    var boxCap = box.querySelector('p');
    var opener = null;
    doc.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-lightbox]') : null;
      if (!btn) return;
      opener = btn;
      var thumb = btn.querySelector('img');
      boxImg.src = btn.getAttribute('data-lightbox');
      boxImg.alt = thumb ? thumb.alt : '';
      boxCap.textContent = btn.getAttribute('data-caption') || '';
      boxCap.hidden = !boxCap.textContent;
      box.showModal();
    });
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.lb-close')) box.close();
    });
    box.addEventListener('close', function () {
      boxImg.removeAttribute('src');
      if (opener) opener.focus();
    });
  }

  /* ---------- hours and the open-now pill ---------- */
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function clock(tz) {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    var out = {};
    parts.forEach(function (p) { out[p.type] = p.value; });
    return { day: DAYS.indexOf(out.weekday), minutes: parseInt(out.hour, 10) * 60 + parseInt(out.minute, 10) };
  }
  function toMin(hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function label(min) {
    var h = Math.floor(min / 60), m = min % 60;
    var suffix = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return h + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + suffix;
  }

  function updateHours() {
    var table = doc.querySelector('[data-hours]');
    var pills = [].slice.call(doc.querySelectorAll('[data-open-pill]'));
    if (!table) return;
    var tz = table.getAttribute('data-tz') || 'America/Toronto';
    var now;
    try { now = clock(tz); } catch (err) { return; }

    var rows = {};
    [].forEach.call(table.querySelectorAll('tr[data-day]'), function (tr) {
      var d = parseInt(tr.getAttribute('data-day'), 10);
      rows[d] = tr;
      tr.classList.toggle('today', d === now.day);
      if (tr.hasAttribute('data-closed')) tr.setAttribute('data-kind', 'closed');
      else if (tr.getAttribute('data-open') && tr.getAttribute('data-close')) tr.setAttribute('data-kind', 'open');
      else tr.setAttribute('data-kind', 'unknown');
    });

    var confirmed = table.getAttribute('data-confirmed') === 'true';
    var text = '', state = '';
    if (confirmed) {
      var today = rows[now.day];
      if (today && today.getAttribute('data-kind') === 'open') {
        var o = toMin(today.getAttribute('data-open'));
        var c = toMin(today.getAttribute('data-close'));
        if (now.minutes >= o && now.minutes < c) { state = 'open'; text = 'Open now, until ' + label(c); }
        else if (now.minutes < o) { state = 'closed'; text = 'Closed, opens ' + label(o); }
      }
      if (!state) {
        state = 'closed'; text = 'Closed';
        for (var i = 1; i <= 7; i++) {
          var d = (now.day + i) % 7;
          var r = rows[d];
          if (r && r.getAttribute('data-kind') === 'open') {
            text = 'Closed, opens ' + (i === 1 ? 'tomorrow' : DAYS[d]) + ' ' + label(toMin(r.getAttribute('data-open')));
            break;
          }
        }
      }
    }
    pills.forEach(function (pill) {
      var out = pill.querySelector('[data-open-text]');
      if (!state) { pill.hidden = true; return; }
      pill.hidden = false;
      pill.setAttribute('data-state', state);
      if (out) out.textContent = text;
    });
  }
  updateHours();
  setInterval(updateHours, 60000);

  /* ---------- contact form (preview only) ---------- */
  var form = doc.getElementById('contact-form');
  if (form) {
    var status = doc.getElementById('form-status');
    var fields = [
      { id: 'f-name', err: 'e-name', msg: 'Please add your name.' },
      { id: 'f-reach', err: 'e-reach', msg: 'Please add a phone number or email.' },
      { id: 'f-need', err: 'e-need', msg: 'Please say what you need.' }
    ];
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.removeAttribute('data-state');
      var firstBad = null;
      fields.forEach(function (f) {
        var input = doc.getElementById(f.id);
        var bad = !input.value.trim();
        input.setAttribute('aria-invalid', bad ? 'true' : 'false');
        doc.getElementById(f.err).textContent = bad ? f.msg : '';
        if (bad && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }
      status.setAttribute('data-state', 'info');
      status.textContent = 'This is a preview, so nothing was sent. To reach Glamour Nails, call (905) 563-8889.';
    });
  }

  /* ---------- background video slot ---------- */
  var env = doc.querySelector('.env');
  var video = doc.querySelector('[data-video-slot]');
  var triedVideo = false;

  function wantPortrait() {
    return window.matchMedia('(orientation: portrait) and (max-width: 1024px)').matches;
  }
  function saveData() {
    var c = navigator.connection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')));
  }
  function attach(urls) {
    if (!urls.length) return;
    var url = urls[0];
    function fail() { video.removeAttribute('src'); attach(urls.slice(1)); }
    video.addEventListener('canplay', function ok() {
      video.removeEventListener('canplay', ok);
      if (reduced()) return;
      env.classList.add('has-video');
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    });
    video.addEventListener('error', fail, { once: true });
    video.preload = 'auto';
    video.src = url;
    video.load();
  }
  function startVideo() {
    if (!video || !env || triedVideo || reduced() || saveData()) return;
    triedVideo = true;
    var names = wantPortrait()
      ? ['media/hero-film-portrait.mp4', 'media/hero-film.mp4']
      : ['media/hero-film.mp4'];
    if (location.protocol === 'file:') { attach(names); return; }
    var found = [];
    var chain = Promise.resolve();
    names.forEach(function (n) {
      chain = chain.then(function () {
        return fetch(n, { method: 'HEAD', cache: 'no-store' })
          .then(function (r) { if (r.ok) found.push(n); })
          .catch(function () {});
      });
    });
    chain.then(function () { attach(found); });
  }
  function stopVideo() {
    if (!video || !env) return;
    env.classList.remove('has-video');
    video.pause();
  }
  if (video && env) {
    startVideo();
    reduceQuery.addEventListener('change', function () {
      if (reduced()) stopVideo();
      else if (video.getAttribute('src')) { env.classList.add('has-video'); var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      else { triedVideo = false; startVideo(); }
    });
  }
})();
