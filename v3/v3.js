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
  const timers = new Map();
  const shut = d => { d.classList.remove('is-open'); $('.nl', d).setAttribute('aria-expanded', 'false'); };
  dds.forEach(d => {
    if (hover) {
      // opening one menu cancels every pending close; leaving closes only its own menu, after a short grace period
      d.addEventListener('mouseenter', () => { timers.forEach(clearTimeout); timers.clear(); open(d); });
      d.addEventListener('mouseleave', () => { timers.set(d, setTimeout(() => { timers.delete(d); shut(d); }, 220)); });
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
    const br = +h.dataset.br || 0; // optional forced line break after word N
    h.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--wi:${i}">${w}</span></span>` + (br && i === br - 1 ? '<br>' : '')).join(' ');
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
    const imgs = $$('.st-media img', st), txt = $$('.st-txt>div', st);
    const num = $('.st-n b', st), bar = $('.st-bar i', st), N = imgs.length;
    let i = 0, z = 1;
    st.style.setProperty('--dur', '7000ms');
    const go = k => {
      const prev = i; i = (k + N) % N;
      if (prev !== i) {
        // the new frame wipes in from the right on top of the previous one
        imgs.forEach(m => m.classList.toggle('is-prev', m === imgs[prev]));
        imgs[i].style.zIndex = ++z;
      }
      imgs.forEach((m, n) => m.classList.toggle('is-on', n === i));
      txt.forEach((m, n) => m.classList.toggle('is-on', n === i));
      num.textContent = String(i + 1).padStart(2, '0');
      bar.classList.toggle('run', false); void bar.offsetWidth; if (!reduce) bar.classList.add('run');
    };
    bar.addEventListener('animationend', () => go(i + 1));   // the loading line drives the autoplay
    $$('.st-b', st).forEach(b => b.addEventListener('click', () => go(i + +b.dataset.dir)));
    imgs[0].style.zIndex = 1;
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
    fit(); let __w = innerWidth; addEventListener('resize', () => { if (innerWidth !== __w) { __w = innerWidth; fit(); } }); document.fonts && document.fonts.ready.then(fit);
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { fm.classList.add('in'); o.disconnect(); } }, { threshold: .25 }).observe(fm);
    if (!reduce) {
      let raf = 0;
      const par = () => { raf = 0; const left = document.documentElement.scrollHeight - (scrollY + innerHeight); t.style.setProperty('--py', Math.min(60, Math.max(0, left * .25)).toFixed(1) + 'px'); };
      addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(par); }, { passive: true }); par();
    }
  }
})();

/* arrow swap, history row height, numbers zoom */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // every «→» inside a link/button gets a clipped box with a twin arrow
  document.querySelectorAll('a svg, button svg').forEach(svg => {
    const u = svg.querySelector('use'); if (!u || u.getAttribute('href') !== '#arr' || svg.closest('.ax,.st-b,.ar')) return;
    const box = document.createElement('span'); box.className = 'ax';
    svg.replaceWith(box); box.append(svg, svg.cloneNode(true)); box.lastChild.setAttribute('aria-hidden', 'true');
  });
  // history: reserve the height of the tallest opened card
  const tl = document.querySelector('.tl');
  if (tl) {
    const fit = () => { tl.style.setProperty('--tl-h', 'auto'); tl.classList.add('tl-measure'); const h = tl.offsetHeight; tl.classList.toggle('tl-measure', false); tl.style.setProperty('--tl-h', h + 'px'); };
    fit(); let __w = innerWidth; addEventListener('resize', () => { if (innerWidth !== __w) { __w = innerWidth; fit(); } }); document.fonts && document.fonts.ready.then(fit);
  }
  // numbers photo: subtle scroll-linked zoom 1.12 → 1.0
  const box = document.querySelector('.nums-box');
  if (box && !reduce) {
    let raf = 0;
    const upd = () => { raf = 0; const r = box.getBoundingClientRect(), vh = innerHeight; const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))); box.style.setProperty('--nz', (1.12 - .12 * p).toFixed(4)); };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true }); upd();
  }
})();

/* links with href="#" never jump to the top; history cards open on tap on touch screens */
(() => {
  document.addEventListener('click', e => { const a = e.target.closest('a[href="#"]'); if (a) e.preventDefault(); });
  const items = [...document.querySelectorAll('.tl li')];
  items.forEach(li => li.addEventListener('click', () => {
    if (matchMedia('(hover: hover)').matches) return;
    const on = !li.classList.contains('is-open');
    items.forEach(x => x.classList.toggle('is-open', x === li && on));
  }));
})();
