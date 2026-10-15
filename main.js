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
  var darkSec = doc.querySelector('.dark');
  var hands = [].slice.call(doc.querySelectorAll('[data-hand]'));
  var ticking = false;

  /* dark opening: the top hand drifts slower than the page; side hands slide in from their edge */
  var darkZones = [].slice.call(doc.querySelectorAll('.dark, .section--dark'));
  function updateDark(y) {
    if (!darkSec) return;
    var vh = window.innerHeight;
    if (header) {
      var hh = header.offsetHeight;
      var onDark = darkZones.some(function (z, i) {
        var r = z.getBoundingClientRect();
        var pad = i === 0 ? 0 : Math.min(170, vh * 0.14);
        return r.top + pad <= hh && r.bottom - pad > hh;
      });
      header.classList.toggle('on-dark', onDark);
    }
    var still = reduced();
    root.style.setProperty('--hy', still ? '0px' : (Math.min(y, vh * 1.2) * 0.35).toFixed(1) + 'px');
    hands.forEach(function (fig) {
      var r = fig.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      var inn = still ? 1 : Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.65)));
      var p = still ? 0 : (r.top + r.height / 2 - vh / 2) / vh;
      fig.style.setProperty('--in', inn.toFixed(3));
      fig.style.setProperty('--p', p.toFixed(3));
    });
  }

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
      root.style.setProperty('--py', reduced() ? '0px' : (Math.min(y, window.innerHeight) * 0.3).toFixed(1) + 'px');
      updateDark(y);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  reduceQuery.addEventListener('change', onScroll);
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
  [].forEach.call(doc.querySelectorAll('.hours tr'), function (tr, i) { tr.style.setProperty('--r', i); });
  [].forEach.call(doc.querySelectorAll('.form > .field'), function (f, i) { f.style.setProperty('--f', i); });
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

  /* ---------- photo rows: show whole cards only, arrows step a screenful, loop forever ---------- */
  [].forEach.call(doc.querySelectorAll('[data-reel]'), function (reel) {
    var track = reel.querySelector('.reel-track');
    var viewport = reel.querySelector('.reel-viewport');
    var prev = reel.querySelector('[data-reel-prev]');
    var next = reel.querySelector('[data-reel-next]');
    if (!track || !viewport || !prev || !next) return;
    var originals = [].slice.call(track.children);
    var n = originals.length;
    if (n < 2) return;

    /* one copy of the set on each side, hidden from screen readers and the tab order */
    function copySet() {
      var frag = doc.createDocumentFragment();
      originals.forEach(function (li) {
        var c = li.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        [].forEach.call(c.querySelectorAll('button, a'), function (el) { el.tabIndex = -1; });
        frag.appendChild(c);
      });
      return frag;
    }
    track.insertBefore(copySet(), track.firstChild);
    track.appendChild(copySet());
    [].forEach.call(track.children, function (li, i) { li.style.setProperty('--i', Math.max(0, i - n)); });

    var index = n;
    var busy = false;
    var fallback = 0;

    function step() {
      var a = track.children[0].getBoundingClientRect();
      var b = track.children[1].getBoundingClientRect();
      return b.left - a.left;
    }
    function perView() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return Math.max(1, Math.round((viewport.clientWidth + gap) / step()));
    }
    function place(animate, offset) {
      track.classList.toggle('is-moving', !!animate && !reduced());
      track.style.setProperty('--x', (-index * step() + (offset || 0)).toFixed(2) + 'px');
    }
    function settle() {
      clearTimeout(fallback);
      track.classList.remove('is-moving');
      if (index >= 2 * n) index -= n;
      else if (index < n) index += n;
      place(false);
      busy = false;
    }
    function go(dir) {
      if (busy) return;
      busy = true;
      index += dir * perView();
      place(true);
      if (reduced()) { settle(); return; }
      fallback = setTimeout(settle, 1000);
    }
    track.addEventListener('transitionend', function (e) {
      if (e.target === track && e.propertyName === 'transform') settle();
    });
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    /* swipe on touch screens */
    var drag = null;
    var swallowClick = false;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' || busy) return;
      drag = { x: e.clientX, y: e.clientY, dx: 0, locked: false };
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!drag) return;
      drag.dx = e.clientX - drag.x;
      if (!drag.locked && Math.abs(drag.dx) > 8 && Math.abs(drag.dx) > Math.abs(e.clientY - drag.y)) drag.locked = true;
      if (drag.locked) place(false, drag.dx);
    });
    function endDrag() {
      if (!drag) return;
      var d = drag;
      drag = null;
      if (!d.locked) return;
      swallowClick = true;
      setTimeout(function () { swallowClick = false; }, 350);
      if (Math.abs(d.dx) > 40) go(d.dx < 0 ? 1 : -1);
      else place(true);
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('click', function (e) {
      if (swallowClick) { e.stopPropagation(); e.preventDefault(); swallowClick = false; }
    }, true);

    /* auto-advance: the rows move in opposite directions, and pause for hover, focus, touch or when off screen */
    var autoDir = reel.getAttribute('data-from') === 'left' ? -1 : 1;
    var AUTO_MS = 4200;
    var autoTimer = 0;
    var held = false;
    var onScreen = false;
    var holdTimer = 0;
    function schedule(first) {
      clearTimeout(autoTimer);
      if (held || !onScreen || doc.hidden || reduced()) return;
      autoTimer = setTimeout(function () { go(autoDir); schedule(); }, first && autoDir < 0 ? AUTO_MS * 1.5 : AUTO_MS);
    }
    function hold() { held = true; clearTimeout(autoTimer); }
    function release(delay) {
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { held = false; schedule(); }, delay || 0);
    }
    reel.addEventListener('mouseenter', hold);
    reel.addEventListener('mouseleave', function () { release(600); });
    reel.addEventListener('focusin', hold);
    reel.addEventListener('focusout', function () { release(1500); });
    viewport.addEventListener('touchstart', function () { hold(); release(6000); }, { passive: true });
    prev.addEventListener('click', function () { schedule(); });
    next.addEventListener('click', function () { schedule(); });
    doc.addEventListener('visibilitychange', function () { schedule(); });
    reduceQuery.addEventListener('change', function () { schedule(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        schedule(true);
      }, { threshold: 0.35 }).observe(reel);
    }

    window.addEventListener('resize', function () { if (!busy) place(false); });
    place(false);
  });

  /* ---------- reviews: pop in, float, tilt, open ---------- */
  var reviewList = doc.querySelector('[data-pop]');
  if (reviewList) {
    var cards = [].slice.call(reviewList.children);
    cards.forEach(function (li, i) {
      li.style.setProperty('--r', (((i * 37) % 9) - 4) + 'deg');
      li.style.setProperty('--bob', (5 + ((i * 7) % 4) * 0.8).toFixed(1) + 's');
      li.style.setProperty('--sway', (i % 2 ? -0.7 : 0.7) + 'deg');
      li.addEventListener('animationend', function (e) {
        if (e.animationName === 'pop') li.classList.add('landed');
      });
    });
    var popBatch = function (list) {
      list.forEach(function (li, k) {
        li.style.setProperty('--i', k);
        li.classList.add('pop');
      });
    };
    if (!('IntersectionObserver' in window) || reduced()) {
      popBatch(cards);
      cards.forEach(function (li) { li.classList.add('landed'); });
    } else if (window.matchMedia('(min-width: 640px)').matches) {
      /* several columns: the whole set pops within about two seconds */
      var groupIo = new IntersectionObserver(function (entries) {
        if (!entries.some(function (en) { return en.isIntersecting; })) return;
        groupIo.disconnect();
        popBatch(cards);
      }, { threshold: 0.12 });
      groupIo.observe(reviewList);
    } else {
      /* one column on phones: cards pop as they come into view */
      var cardIo = new IntersectionObserver(function (entries) {
        var batch = [];
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          cardIo.unobserve(en.target);
          batch.push(en.target);
        });
        popBatch(batch);
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
      cards.forEach(function (li) { cardIo.observe(li); });
    }

    /* long reviews are clamped on the card; mark them so "Read it all" shows */
    var markClamped = function () {
      [].forEach.call(reviewList.querySelectorAll('.review'), function (fig) {
        var p = fig.querySelector('blockquote p');
        fig.classList.toggle('is-clamped', !!p && p.scrollHeight > p.clientHeight + 2);
      });
    };
    markClamped();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(markClamped);
    window.addEventListener('resize', markClamped);

    /* tilt toward the pointer (fine pointer only) */
    reviewList.addEventListener('pointermove', function (e) {
      if (!finePointer.matches || reduced()) return;
      var fig = e.target.closest ? e.target.closest('[data-tilt]') : null;
      if (!fig) return;
      var r = fig.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      fig.style.setProperty('--ry', (px * 10).toFixed(2) + 'deg');
      fig.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg');
    });
    reviewList.addEventListener('pointerout', function (e) {
      var fig = e.target.closest ? e.target.closest('[data-tilt]') : null;
      if (!fig || (e.relatedTarget && fig.contains(e.relatedTarget))) return;
      fig.style.removeProperty('--rx');
      fig.style.removeProperty('--ry');
    });

    /* click a review to read it in full */
    var rbox = doc.getElementById('review-box');
    if (rbox && typeof rbox.showModal === 'function') {
      var rbText = rbox.querySelector('[data-rb-text]');
      var rbWho = rbox.querySelector('.rb-who');
      var rbOpener = null;
      reviewList.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.review-open') : null;
        if (!btn) return;
        var fig = btn.closest('.review');
        rbOpener = btn;
        rbText.textContent = fig.querySelector('blockquote p').textContent;
        rbWho.textContent = fig.querySelector('.who').textContent;
        rbox.showModal();
      });
      rbox.addEventListener('click', function (e) {
        var r = rbox.getBoundingClientRect();
        var outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        if ((e.target === rbox && outside) || e.target.closest('.rb-close')) rbox.close();
      });
      rbox.addEventListener('close', function () { if (rbOpener) rbOpener.focus(); });
    }
  }

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
      boxImg.alt = thumb ? thumb.alt : (btn.getAttribute('data-alt') || '');
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
      { id: 'f-service', err: 'e-service', msg: 'Please choose a service.' },
      { id: 'f-when', err: 'e-when', msg: 'Please add a day and time that suits you.' }
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
      status.textContent = 'This is a preview, so nothing was sent. To book now, call (905) 563-8889.';
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
