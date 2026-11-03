(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header: compact on scroll ---------- */
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- dropdowns: click / keyboard (hover handled in CSS) ---------- */
  $$('.has-dd').forEach(item => {
    const btn = $('.nav-link', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      $$('.has-dd.is-open').forEach(i => { i.classList.remove('is-open'); $('.nav-link', i).setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    item.addEventListener('mouseleave', () => { item.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.has-dd.is-open').forEach(i => i.classList.remove('is-open'));
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.has-dd')) $$('.has-dd.is-open').forEach(i => i.classList.remove('is-open'));
  });

  /* ---------- mobile menu ---------- */
  const burger = $('.burger'), mob = $('#mob');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    mob.hidden = !open;
  });

  /* ---------- button glow follows pointer ---------- */
  $$('.btn').forEach(b => b.addEventListener('pointermove', e => {
    const r = b.getBoundingClientRect();
    b.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    b.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  }));

  /* ---------- infographic fillers ---------- */
  // years chart: 2006..2025, key years highlighted
  const yc = $('.yc-bars');
  if (yc) {
    const keys = { 2006: 1, 2008: 1, 2014: 1, 2019: 1, 2023: 1, 2025: 1 };
    for (let y = 2006, i = 0; y <= 2025; y++, i++) {
      const el = document.createElement('i');
      const h = 18 + Math.pow(i / 19, 1.35) * 82;
      el.style.setProperty('--h', h + '%');
      el.style.setProperty('--dl', (i * 0.035) + 's');
      if (keys[y]) el.className = 'k';
      el.title = y;
      yc.appendChild(el);
    }
  }
  // clients dot matrix: 60 dots, each ≈ 20 clients
  const dots = $('.dots');
  if (dots) {
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('i');
      el.style.setProperty('--dl', (i * 0.012) + 's');
      if (i % 7 === 0) el.className = 'on';
      dots.appendChild(el);
    }
  }

  /* ---------- counters ---------- */
  const fmt = (n, dec) => dec ? n.toFixed(dec).replace('.', ',') : Math.round(n).toLocaleString('uk-UA').replace(/ /g, ' ');
  const count = el => {
    const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0;
    if (reduce) { el.textContent = fmt(end, dec); return; }
    const dur = 1600, t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 4);
    const tick = now => {
      const t = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(end * ease(t), dec);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('is-in');
      $$('[data-count]', el).forEach(count);
      if (el.matches('[data-count]')) count(el);
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .h-display').forEach(el => io.observe(el));

  /* ---------- tabs (auto-advance, pause on hover) ---------- */
  $$('[data-tabs]').forEach(root => {
    const tabs = $$('.tab', root), panes = $$('.tab-pane', root);
    const DUR = 7000;
    let idx = 0, timer = null, started = false;
    root.style.setProperty('--dur', DUR / 1000 + 's');
    const show = i => {
      idx = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => { t.classList.toggle('is-on', k === idx); t.setAttribute('aria-selected', String(k === idx)); });
      panes.forEach((p, k) => p.classList.toggle('is-on', k === idx));
      // restart progress animation
      const prog = $('.tab-prog', tabs[idx]); prog.style.animation = 'none'; void prog.offsetWidth; prog.style.animation = '';
    };
    const play = () => { if (reduce) return; clearInterval(timer); timer = setInterval(() => { if (!root.classList.contains('paused')) show(idx + 1); }, DUR); };
    tabs.forEach((t, k) => t.addEventListener('click', () => { show(k); play(); }));
    root.addEventListener('mouseenter', () => root.classList.add('paused'));
    root.addEventListener('mouseleave', () => root.classList.remove('paused'));
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; show(0); play(); } }, { threshold: .3 }).observe(root);
  });

  /* ---------- hotspots: tap to toggle on touch ---------- */
  $$('.hot').forEach(h => h.addEventListener('click', e => {
    e.stopPropagation();
    const was = h.classList.contains('is-open');
    $$('.hot.is-open').forEach(x => x.classList.remove('is-open'));
    h.classList.toggle('is-open', !was);
  }));
  document.addEventListener('click', () => $$('.hot.is-open').forEach(x => x.classList.remove('is-open')));

  /* ---------- timeline: buttons + drag ---------- */
  const vp = $('.tl-viewport');
  if (vp) {
    const step = () => ($('.tl li', vp).getBoundingClientRect().width + 16);
    const btns = $$('[data-tl]');
    const upd = () => {
      btns[0].disabled = vp.scrollLeft < 4;
      btns[1].disabled = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 4;
    };
    btns.forEach(b => b.addEventListener('click', () => vp.scrollBy({ left: step() * +b.dataset.tl, behavior: reduce ? 'auto' : 'smooth' })));
    vp.addEventListener('scroll', upd, { passive: true }); upd();
    let down = false, sx = 0, sl = 0, moved = false;
    vp.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = vp.scrollLeft; });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; vp.classList.add('dragging'); }
      vp.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return; down = false;
      vp.classList.remove('dragging');
      if (moved) { // snap to nearest card
        const s = step(); vp.scrollTo({ left: Math.round(vp.scrollLeft / s) * s, behavior: 'smooth' });
      }
    });
  }

  /* ---------- language toggle (EN — placeholder) ---------- */
  $$('.lang button').forEach(b => b.addEventListener('click', () => {
    $$('.lang button').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  }));
})();
