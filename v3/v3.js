(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = matchMedia('(hover: hover)').matches;

  /* header: floating state once the page moves */
  const hd = $('#hd');
  const onScroll = () => hd.classList.toggle('is-stuck', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* dropdowns: hover on desktop, click/tap everywhere, Esc closes */
  const dds = $$('.dd');
  const close = () => dds.forEach(d => { d.classList.remove('is-open'); $('.nl', d).setAttribute('aria-expanded', 'false'); });
  const open = d => { dds.forEach(x => x !== d && x.classList.remove('is-open')); d.classList.add('is-open'); $('.nl', d).setAttribute('aria-expanded', 'true'); };
  dds.forEach(d => {
    let t;
    if (hover) {
      d.addEventListener('mouseenter', () => { clearTimeout(t); open(d); });
      d.addEventListener('mouseleave', () => { t = setTimeout(close, 140); });
    }
    $('.nl', d).addEventListener('click', () => d.classList.contains('is-open') ? close() : open(d));
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  addEventListener('click', e => { if (!e.target.closest('.dd')) close(); });

  /* mobile menu */
  const burger = $('.burger'), mob = $('#mob');
  burger.addEventListener('click', () => { const o = mob.hidden; mob.hidden = !o; burger.setAttribute('aria-expanded', String(o)); });

  /* language toggle (EN is a stub) */
  $$('.lang button').forEach(b => b.addEventListener('click', () => $$('.lang button').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); })));

  /* split headings into words for the line reveal */
  $$('[data-split]').forEach(h => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--wi:${i}">${w}</span></span>`).join(' ');
  });

  /* count-up */
  const fmt = (v, d) => d ? v.toFixed(d).replace('.', ',') : Math.round(v).toLocaleString('uk-UA').replace(/\s/g, ' ');
  const count = el => {
    const end = parseFloat(el.dataset.count), d = +el.dataset.dec || 0;
    if (reduce) { el.textContent = fmt(end, d); return; }
    const t0 = performance.now(), D = 1600;
    const f = now => { const t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 4); el.textContent = fmt(end * e, d); if (t < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };

  /* reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(count);
    if (e.target.matches('[data-count]')) count(e.target);
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('[data-r],[data-split],[data-img]').forEach(el => io.observe(el));
  /* anything already on the first screen reveals at once, even if only a sliver is visible */
  requestAnimationFrame(() => $$('[data-r],[data-split],[data-img]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) { el.classList.add('in'); io.unobserve(el); }
  }));

  /* hero stage: three stories with tabs and a soft autoplay */
  const st = $('[data-stage]');
  if (st) {
    const tabs = $$('.st-tabs button', st), imgs = $$('.st-media img', st), txt = $$('.st-txt>div', st);
    let i = 0, timer; const DUR = 7000;
    st.style.setProperty('--dur', DUR + 'ms');
    const go = k => {
      i = (k + tabs.length) % tabs.length;
      tabs.forEach((t, n) => { t.classList.toggle('is-on', n === i); t.classList.remove('run'); t.setAttribute('aria-selected', String(n === i)); });
      imgs.forEach((m, n) => m.classList.toggle('is-on', n === i));
      txt.forEach((m, n) => m.classList.toggle('is-on', n === i));
      void tabs[i].offsetWidth; if (!reduce) tabs[i].classList.add('run');
      clearTimeout(timer); if (!reduce) timer = setTimeout(tick, DUR);
    };
    let paused = false, left = DUR, started = 0;
    const tick = () => { if (!paused) go(i + 1); };
    tabs.forEach((t, n) => t.addEventListener('click', () => go(n)));
    st.addEventListener('mouseenter', () => { paused = true; clearTimeout(timer); });
    st.addEventListener('mouseleave', () => { paused = false; clearTimeout(timer); if (!reduce) timer = setTimeout(tick, 2500); });
    go(0);
  }

  /* «Робота з нами» accordion: one open at a time */
  const acc = $('[data-acc]');
  if (acc) {
    const items = $$('.acc-i', acc);
    items.forEach(it => $('.acc-b', it).addEventListener('click', () => {
      items.forEach(x => { const on = x === it; x.classList.toggle('is-on', on); $('.acc-b', x).setAttribute('aria-expanded', String(on)); });
    }));
  }

  /* brands: the last hovered card stays open */
  const bxs = $$('.bx');
  const setBx = c => bxs.forEach(x => x.classList.toggle('is-on', x === c));
  bxs.forEach(c => { c.addEventListener('mouseenter', () => setBx(c)); c.addEventListener('focus', () => setBx(c)); });

  /* history: arrows + drag */
  const vp = $('.tl-vp');
  if (vp) {
    const tb = $$('[data-tl]');
    const step = () => ($('.tl li', vp)?.offsetWidth || 300) + 12;
    const upd = () => { tb[0].disabled = vp.scrollLeft < 4; tb[1].disabled = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 4; };
    tb.forEach(b => b.addEventListener('click', () => vp.scrollBy({ left: step() * +b.dataset.tl, behavior: reduce ? 'auto' : 'smooth' })));
    vp.addEventListener('scroll', upd, { passive: true }); upd();
    let down = false, sx = 0, sl = 0, moved = false;
    vp.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = vp.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; vp.classList.add('drag'); } vp.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; vp.classList.remove('drag'); if (moved) { const s = step(); vp.scrollTo({ left: Math.round(vp.scrollLeft / s) * s, behavior: 'smooth' }); } });
  }

  /* footer wordmark: full width, soft reveal, gentle parallax that settles at the page bottom */
  const fm = $('.ft-mark');
  if (fm) {
    const t = $('span', fm);
    const fit = () => { t.style.setProperty('--fs', '100px'); t.style.setProperty('--fs', (100 * fm.clientWidth / t.getBoundingClientRect().width * .99).toFixed(2) + 'px'); };
    fit(); addEventListener('resize', fit); document.fonts && document.fonts.ready.then(fit);
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { fm.classList.add('in'); o.disconnect(); } }, { threshold: .25 }).observe(fm);
    if (!reduce) {
      let raf = 0;
      const par = () => { raf = 0; const left = document.documentElement.scrollHeight - (scrollY + innerHeight); t.style.setProperty('--py', Math.min(60, Math.max(0, left * .25)).toFixed(1) + 'px'); };
      addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(par); }, { passive: true }); par();
    }
  }
})();
