(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- stx-scroll: photo zoom + cover progress ---------- */
  const stx = document.querySelector('.stx'), dirs = document.querySelector('.dirs');
  if (stx && dirs && !reduce) {
    const upd = () => {
      const r = stx.getBoundingClientRect(), vh = innerHeight;
      const sp = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      stx.style.setProperty('--sp', sp.toFixed(3));
      const d = dirs.getBoundingClientRect().top;
      const cover = Math.min(1, Math.max(0, 1 - d / vh));
      stx.style.setProperty('--cover', cover.toFixed(3));
    };
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* ---------- header: stuck state ---------- */
  const hdr = $('#hdr'), bar = $('.bar');
  const onScroll = () => hdr.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= 0.5 && scrollY > 60);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- mega menu ---------- */
  const mega = $('#mega');
  const btns = $$('.nl[data-mega]');
  let closeT = 0;
  const open = id => {
    clearTimeout(closeT);
    btns.forEach(b => b.setAttribute('aria-expanded', String(b.dataset.mega === id)));
    $$('.mega-p').forEach(p => p.classList.toggle('is-on', p.id === id));
    mega.classList.add('is-open'); mega.setAttribute('aria-hidden', 'false');
  };
  const close = () => {
    btns.forEach(b => b.setAttribute('aria-expanded', 'false'));
    mega.classList.remove('is-open'); mega.setAttribute('aria-hidden', 'true');
  };
  const later = () => { clearTimeout(closeT); closeT = setTimeout(close, 180); };
  btns.forEach(b => {
    b.addEventListener('mouseenter', () => open(b.dataset.mega));
    b.addEventListener('click', () => b.getAttribute('aria-expanded') === 'true' ? close() : open(b.dataset.mega));
    b.addEventListener('mouseleave', later);
  });
  $$('.nav .ni:not(.has-mega)').forEach(li => li.addEventListener('mouseenter', close));
  $('.mega-box').addEventListener('mouseenter', () => clearTimeout(closeT));
  $('.mega-box').addEventListener('mouseleave', later);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('click', e => { if (!e.target.closest('.nav, .mega-box')) close(); });

  /* ---------- mobile ---------- */
  const burger = $('.burger'), mob = $('#mob');
  burger.addEventListener('click', () => {
    const o = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(o)); mob.hidden = !o;
  });

  $$('.lang button').forEach(b => b.addEventListener('click', () => $$('.lang button').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); })));

  /* ---------- hero slider ---------- */
  const slider = $('[data-slider]'), slides = $$('.slide', slider), n = $('.sc-n b'), barI = $('.sc-bar i');
  const DUR = 7000; let idx = 0, timer = 0;
  slider.style.setProperty('--dur', DUR / 1000 + 's');
  function go(i) {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-on', k === idx));
    n.textContent = idx + 1;
    barI.classList.remove('run'); void barI.offsetWidth; if (!reduce) barI.classList.add('run');
  }
  barI.addEventListener('animationend', () => go(idx + 1));
  $$('.s-ctrl .sc-b').forEach(b => b.addEventListener('click', () => go(idx + +b.dataset.dir)));
  go(0);

  /* ---------- years bars ---------- */
  const yb = $('.yb');
  if (yb) for (let y = 2006, i = 0; y <= 2025; y++, i++) {
    const el = document.createElement('i');
    el.style.setProperty('--h', (16 + Math.pow(i / 19, 1.4) * 84) + '%');
    el.style.setProperty('--dl', (i * .03) + 's');
    if ([2006, 2008, 2014, 2019, 2023, 2025].includes(y)) el.className = 'k';
    el.title = y; yb.appendChild(el);
  }

  /* ---------- counters + reveal ---------- */
  const fmt = (v, d) => d ? v.toFixed(d).replace('.', ',') : Math.round(v).toLocaleString('uk-UA').replace(/ /g, ' ');
  const count = el => {
    const end = +el.dataset.count, d = +el.dataset.dec || 0;
    if (reduce) { el.textContent = fmt(end, d); return; }
    const t0 = performance.now(), D = 1500;
    const f = now => { const t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 4); el.textContent = fmt(end * e, d); if (t < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    const el = e.target;
    // after the reveal finishes, hand transitions back to the element's own 0.3s hovers
    setTimeout(() => { el.classList.remove('rv'); el.classList.add('rv-done'); }, 1300);
    $$('[data-count]', e.target).forEach(count);
    io.unobserve(e.target);
  }), { threshold: .15, rootMargin: '0px 0px -30px 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- why: hover highlight + gentle auto-cycle ---------- */
  const wfs = $$('.wf');
  let wi = 2, wt = 0, hovering = false;
  const setW = k => wfs.forEach(w => w.classList.toggle('is-on', +w.dataset.k === k));
  wfs.forEach(w => {
    w.addEventListener('mouseenter', () => { hovering = true; setW(+w.dataset.k); wi = +w.dataset.k; });
    w.addEventListener('mouseleave', () => { hovering = false; });
  });
  if (!reduce) wt = setInterval(() => { if (!hovering && matchMedia('(min-width:1101px)').matches) { wi = (wi + 1) % wfs.length; setW(wi); } }, 3200);

  /* ---------- timeline ---------- */
  const vp = $('.tl-vp');
  if (vp) {
    const step = () => $('.tl li', vp).getBoundingClientRect().width + 12;
    const tb = $$('[data-tl]');
    const upd = () => { tb[0].disabled = vp.scrollLeft < 4; tb[1].disabled = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 4; };
    tb.forEach(b => b.addEventListener('click', () => vp.scrollBy({ left: step() * +b.dataset.tl, behavior: reduce ? 'auto' : 'smooth' })));
    const tlEl = $('.tl', vp);
    const prog = () => tlEl.style.setProperty('--tp', Math.min(1, (vp.scrollLeft + vp.clientWidth) / vp.scrollWidth).toFixed(3));
    vp.addEventListener('scroll', () => { upd(); prog(); }, { passive: true }); upd(); prog();
    let down = false, sx = 0, sl = 0, moved = false;
    vp.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = vp.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; vp.classList.add('drag'); } vp.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; vp.classList.remove('drag'); if (moved) { const s = step(); vp.scrollTo({ left: Math.round(vp.scrollLeft / s) * s, behavior: 'smooth' }); } });
  }
})();

/* footer wordmark: fit to full width, soft reveal, gentle parallax */
(() => {
  const box = document.querySelector('.f2-mark'); if (!box) return;
  const t = box.querySelector('span');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fit = () => { t.style.setProperty('--fs', '100px'); t.style.setProperty('--fs', (100 * box.clientWidth / t.scrollWidth).toFixed(2) + 'px'); };
  fit(); addEventListener('resize', fit); document.fonts && document.fonts.ready.then(fit);
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { box.classList.add('in'); o.disconnect(); } }, { threshold: .25 }).observe(box);
  if (reduce) return;
  let raf = 0;
  // settles at 0 exactly when the page reaches its bottom
  const par = () => { raf = 0; const left = document.documentElement.scrollHeight - (scrollY + innerHeight);
    t.style.setProperty('--py', Math.min(60, Math.max(0, left * .25)).toFixed(1) + 'px'); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(par); }, { passive: true }); par();
})();
