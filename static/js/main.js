/* JURO — site interactions. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = w.matchMedia && w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return w.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { w.localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Loader ---------- */
  function ready() { root.classList.add('is-ready'); d.body.classList.add('is-ready'); try { sessionStorage.setItem('juro-visited', '1'); } catch (e) {} }
  if (d.readyState === 'complete') ready(); else { w.addEventListener('load', ready); setTimeout(ready, 1800); }

  /* ---------- Header ---------- */
  var header = $('.site-header'), toTop = $('.to-top');
  function onScroll() {
    var y = w.scrollY || 0;
    if (header) header.classList.toggle('scrolled', y > 10);
    if (toTop) toTop.classList.toggle('show', y > 700);
  }
  w.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (toTop) toTop.addEventListener('click', function () { w.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Mobile menu ---------- */
  var burger = $('.burger'), mnav = $('#mnav');
  function setMenu(open) {
    if (!burger || !mnav) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    d.body.classList.toggle('menu-open', open);
    if (open) { mnav.hidden = false; requestAnimationFrame(function () { mnav.classList.add('open'); }); }
    else { mnav.classList.remove('open'); setTimeout(function () { if (!mnav.classList.contains('open')) mnav.hidden = true; }, 500); }
  }
  if (burger) burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  w.addEventListener('resize', function () { if (w.innerWidth > 960) setMenu(false); });
  if (mnav) $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- Hero slider (random start on every fresh visit) ---------- */
  var slides = $$('.hero .slide');
  if (slides.length) {
    var dots = $$('.hero-dots button'), label = $('.hero-label'), DUR = 7000, timer = null, cur = -1;
    root.style.setProperty('--slide-ms', DUR + 'ms');
    var last = parseInt(store.get('juro-hero') || '-1', 10), start;
    do { start = Math.floor(Math.random() * slides.length); } while (slides.length > 1 && start === last);
    store.set('juro-hero', String(start));
    var show = function (i) {
      i = (i + slides.length) % slides.length;
      if (i === cur) return;
      var img = $('img', slides[i]);
      if (img && img.loading === 'lazy') img.loading = 'eager';
      slides.forEach(function (s, k) { s.classList.toggle('active', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      dots.forEach(function (b, k) { b.classList.remove('on'); b.classList.toggle('done', k < i); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      if (dots[i]) { void dots[i].offsetWidth; dots[i].classList.add('on'); }
      var cap = $('figcaption', slides[i]); if (label) label.textContent = cap ? cap.textContent : '';
      cur = i;
      var next = slides[(i + 1) % slides.length]; var ni = next && $('img', next); if (ni) ni.loading = 'eager';
    };
    var play = function () { clearInterval(timer); if (!reduce && slides.length > 1) timer = setInterval(function () { show(cur + 1); }, DUR); };
    dots.forEach(function (b, k) { b.addEventListener('click', function () { show(k); play(); }); });
    d.addEventListener('visibilitychange', function () { if (d.hidden) clearInterval(timer); else play(); });
    show(start); play();

    /* fireflies */
    var field = $('.spark-field');
    if (field && !reduce) {
      var n = w.innerWidth < 640 ? 6 : 14;
      for (var i = 0; i < n; i++) {
        var s = d.createElement('i'); s.className = 'spark';
        s.style.left = (Math.random() * 100) + '%'; s.style.top = (20 + Math.random() * 75) + '%';
        s.style.setProperty('--t', (6 + Math.random() * 8) + 's'); s.style.setProperty('--dl', (Math.random() * 6) + 's');
        s.style.setProperty('--x', (Math.random() * 80 - 40) + 'px'); s.style.setProperty('--y', (-30 - Math.random() * 70) + 'px');
        var sz = 2 + Math.random() * 3; s.style.width = s.style.height = sz + 'px';
        field.appendChild(s);
      }
    }
  }

  /* ---------- Split headings into words ---------- */
  $$('.split').forEach(function (el) {
    if (reduce) return;
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (wd, i) { return '<span class="w" aria-hidden="true" style="--wi:' + i + '"><span>' + wd.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span></span>'; }).join(' ');
  });

  /* ---------- Scroll reveal & counters ---------- */
  function countUp(el) {
    if (el.hasAttribute('data-plain')) return;
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    if (reduce) { el.textContent = target.toLocaleString('en-IN'); return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal, .reveal-img').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal, .reveal-img').forEach(function (el) { el.classList.add('in'); });
    $$('[data-count]').forEach(countUp);
  }

  /* ---------- Parallax ---------- */
  var px = $$('[data-parallax]');
  if (px.length && !reduce) {
    var ticking = false;
    var run = function () {
      var vh = w.innerHeight;
      px.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
        el.style.transform = 'translate3d(0,' + (-r.top * speed).toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* ---------- Card tilt & magnetic buttons (desktop only) ---------- */
  if (finePointer && !reduce) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 6).toFixed(2) + 'deg) translateY(-6px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .15).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .25 - 2).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Hero numbers count up on load ---------- */
  setTimeout(function () { $$('.hero-stats [data-count]').forEach(countUp); }, 1100);

  /* ---------- Product filter ---------- */
  var pfs = $$('.pf');
  if (pfs.length) {
    var cards = $$('.pcard'), empty = $('.pempty');
    pfs.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter'), shown = 0;
        pfs.forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        cards.forEach(function (c, i) {
          var show = f === 'all' || c.getAttribute('data-cat') === f;
          c.classList.toggle('hide', !show);
          c.classList.remove('pop');
          if (show) { shown++; c.classList.add('in'); if (!reduce) { c.style.animationDelay = (shown * 40) + 'ms'; void c.offsetWidth; c.classList.add('pop'); } }
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  }

  /* ---------- Services: active tab while scrolling ---------- */
  var tabs = $$('.svc-tabs a');
  if (tabs.length && 'IntersectionObserver' in w) {
    var map = {};
    tabs.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          tabs.forEach(function (a) { a.classList.remove('on'); });
          map[en.target.id].classList.add('on');
          var ul = map[en.target.id].closest('ul');
          if (ul) ul.scrollTo({ left: map[en.target.id].offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.svc-block').forEach(function (b) { tio.observe(b); });
  }

  /* ---------- Lightbox ---------- */
  var lb = $('.lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = $('img', lb), lbCap = $('figcaption', lb), group = [], gi = 0;
    var open = function (list, i) {
      group = list; gi = i;
      var it = group[gi];
      lbImg.src = it.getAttribute('data-lb'); lbImg.alt = it.getAttribute('data-cap') || '';
      lbCap.textContent = it.getAttribute('data-cap') || '';
      $('.lb-prev', lb).hidden = $('.lb-next', lb).hidden = group.length < 2;
      if (!lb.open) lb.showModal();
    };
    $$('[data-lb]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var block = btn.closest('.cat-media') || btn.closest('.pcard') || btn.parentElement;
        var list = $$('.gallery [data-lb]', block); if (!list.length) list = [btn];
        var idx = list.indexOf(btn);
        if (idx < 0) { idx = list.map(function (b) { return b.getAttribute('data-lb'); }).indexOf(btn.getAttribute('data-lb')); }
        open(list, Math.max(0, idx));
      });
    });
    $('.lb-close', lb).addEventListener('click', function () { lb.close(); });
    $('.lb-prev', lb).addEventListener('click', function () { open(group, (gi - 1 + group.length) % group.length); });
    $('.lb-next', lb).addEventListener('click', function () { open(group, (gi + 1) % group.length); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' && group.length > 1) open(group, (gi - 1 + group.length) % group.length);
      if (e.key === 'ArrowRight' && group.length > 1) open(group, (gi + 1) % group.length);
    });
  }

  /* ---------- Smooth page transitions ---------- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var url; try { url = new URL(a.href, location.href); } catch (er) { return; }
    if (url.origin !== location.origin || url.pathname.indexOf('/admin') === 0) return;
    if (url.pathname === location.pathname) return; // same-page anchors scroll normally
    e.preventDefault();
    d.body.classList.add('leaving');
    setTimeout(function () { location.href = url.href; }, 220);
  });
  w.addEventListener('pageshow', function (e) { if (e.persisted) d.body.classList.remove('leaving'); });

  /* ---------- WhatsApp tip ---------- */
  var tip = $('.fab-tip');
  if (tip && !store.get('juro-tip')) { setTimeout(function () { tip.classList.add('show'); setTimeout(function () { tip.classList.remove('show'); }, 4000); store.set('juro-tip', '1'); }, 5000); }

  /* ---------- Enquiry forms (Contact page + floating panel) ---------- */
  var cfg = w.JURO || {};
  var rules = {
    name: function (v) { return v.length < 2 ? 'Please enter your name.' : ''; },
    company: function (v) { return v.length < 2 ? 'Please enter your company name.' : ''; },
    mobile: function (v) {
      var digits = v.replace(/\D/g, '');
      if (!digits) return 'Please enter your mobile number.';
      if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
      if (digits.length === 11 && digits[0] === '0') digits = digits.slice(1);
      return /^[6-9]\d{9}$/.test(digits) ? '' : 'Please enter a valid 10-digit Indian mobile number.';
    },
    email: function (v) { return !v ? 'Please enter your email address.' : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Please enter a valid email address.'); },
    service: function (v) { return v ? '' : 'Please select a product.'; },
    message: function (v) { return v.length < 10 ? 'Please describe your requirement (at least 10 characters).' : ''; }
  };
  function selectProduct(form, name) {
    var sel = form.elements.service; if (!sel || !name) return;
    $$('option', sel).forEach(function (o) { if (o.value === name || o.textContent === name) sel.value = o.value || o.textContent; });
  }
  function setupForm(form) {
    var check = function (name) {
      var el = form.elements[name]; if (!el) return true;
      var msg = rules[name]((el.value || '').trim());
      var f = el.closest('.field'), err = $('[data-err="' + name + '"]', form);
      f.classList.toggle('invalid', !!msg); f.classList.toggle('valid', !msg);
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) { err.textContent = msg; el.setAttribute('aria-describedby', err.id); }
      return !msg;
    };
    Object.keys(rules).forEach(function (n) {
      var el = form.elements[n]; if (!el) return;
      el.addEventListener('blur', function () { if (el.value) check(n); });
      el.addEventListener('input', function () { if (el.closest('.field').classList.contains('invalid')) check(n); });
      el.addEventListener('change', function () { if (n === 'service') check(n); });
    });
    var status = $('.form-status', form), btn = $('button[type="submit"]', form);
    var say = function (cls, html) { status.hidden = false; status.className = 'form-status ' + cls; status.innerHTML = html; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = Object.keys(rules).map(check).every(Boolean);
      if (!ok) {
        say('bad', 'Please correct the highlighted fields and try again.');
        var first = $('.field.invalid input, .field.invalid select, .field.invalid textarea', form); if (first) first.focus();
        return;
      }
      if (form.elements.company_website && form.elements.company_website.value) return; // bot
      if (form.elements.page) form.elements.page.value = location.pathname;
      var v = function (n) { return (form.elements[n].value || '').trim(); };
      var msg = '*New Enquiry — Website*\n\n' +
        '*Name:* ' + v('name') + '\n*Company:* ' + v('company') + '\n*Mobile:* ' + v('mobile') + '\n*Email:* ' + v('email') +
        '\n*Requirement:* ' + v('service') + '\n\n*Message:*\n' + v('message');
      var waBox = $('.f-wa', form);
      var wantWA = waBox && waBox.checked && cfg.wa;
      var waURL = cfg.wa ? 'https://wa.me/' + cfg.wa + '?text=' + encodeURIComponent(msg) : '';
      if (wantWA) w.open(waURL, '_blank', 'noopener'); // inside the click so popup blockers allow it
      btn.classList.add('loading'); btn.disabled = true;
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          say('ok', '<strong>Thank you, ' + v('name').replace(/[<>&]/g, '') + '!</strong> Your enquiry has been recorded and our team will contact you shortly.' +
            (wantWA ? ' WhatsApp opens in a new tab with your enquiry — press <b>Send</b> there to share it instantly.' : ''));
          form.reset(); $$('.field', form).forEach(function (f) { f.classList.remove('valid', 'invalid'); });
        })
        .catch(function () {
          if (waURL) {
            say('info', 'We could not record the enquiry online right now. ' + (wantWA ? 'Your details are ready in WhatsApp — please press <b>Send</b> there.' : '') +
              ' <a class="text-link" href="' + waURL + '" target="_blank" rel="noopener">Send via WhatsApp</a>');
          } else {
            say('bad', 'Sorry, the enquiry could not be sent. Please call or email us directly.');
          }
        })
        .then(function () { btn.classList.remove('loading'); btn.disabled = false; status.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); });
    });
  }
  $$('.enq-form').forEach(setupForm);

  // Pre-select product on the Contact page from ?product=
  var pageForm = $('#enquiry .enq-form');
  if (pageForm) { var qs = new URLSearchParams(location.search); selectProduct(pageForm, qs.get('product') || qs.get('service')); }

  /* ---------- Floating "Enquire Now" panel ---------- */
  var panel = $('.enq-panel');
  function openEnquiry(product, note) {
    setMenu(false);
    var noteFor = function (f) { if (!f || !note) return; var m = f.elements.message; if (m && !m.value.trim()) m.value = 'Enquiry for: ' + note + '\n'; };
    if (pageForm) { // on the Contact page: scroll to the form instead
      selectProduct(pageForm, product); noteFor(pageForm);
      $('#enquiry').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { var f = pageForm.elements.name; if (f) f.focus({ preventScroll: true }); }, 500);
      return true;
    }
    if (!panel || typeof panel.showModal !== 'function') return false;
    var pf = $('.enq-form', panel);
    selectProduct(pf, product); noteFor(pf);
    var st = $('.form-status', pf); if (st && st.classList.contains('ok')) st.hidden = true;
    if (!panel.open) panel.showModal();
    d.body.classList.add('panel-open');
    setTimeout(function () { var f = pf.elements.name; if (f) f.focus(); }, 60);
    return true;
  }
  if (panel) {
    var closePanel = function () { panel.classList.add('closing'); setTimeout(function () { panel.classList.remove('closing'); if (panel.open) panel.close(); }, 260); };
    $('.enq-close', panel).addEventListener('click', closePanel);
    panel.addEventListener('click', function (e) { if (e.target === panel) closePanel(); });
    panel.addEventListener('close', function () { d.body.classList.remove('panel-open'); });
  }
  // Every "Enquire Now" link opens the panel (capture phase: runs before page-transition handler)
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-enquire], a[href="/contact/#enquiry"]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var product = a.getAttribute('data-enquire') || '';
    if (!product) { try { product = new URL(a.href, location.href).searchParams.get('product') || ''; } catch (er) {} }
    if (openEnquiry(product, a.getAttribute('data-note') || '')) { e.preventDefault(); e.stopPropagation(); }
  }, true);


  /* ---------- Product page gallery ---------- */
  var pdMain = $('.pd-main');
  if (pdMain) {
    var pdImg = $('img', pdMain);
    $$('.pd-thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        var src = t.getAttribute('data-src');
        $$('.pd-thumb').forEach(function (x) { x.classList.toggle('on', x === t); });
        pdImg.classList.add('swap');
        setTimeout(function () { pdImg.src = src; pdMain.setAttribute('data-lb', src); pdImg.classList.remove('swap'); }, 180);
      });
    });
  }

  /* ---------- Scroll progress bar ---------- */
  var bar = d.createElement('div'); bar.className = 'scroll-bar'; bar.setAttribute('aria-hidden', 'true'); d.body.appendChild(bar);
  var setBar = function () { var h = root.scrollHeight - w.innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, (w.scrollY || 0) / h) : 0) + ')'; };
  w.addEventListener('scroll', setBar, { passive: true }); setBar();

  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
})();
