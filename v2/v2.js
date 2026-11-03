(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- soft smooth scroll (wheel lerp, desktop only) ---------- */
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    const root = document.documentElement;
    root.classList.add('lenis');
    let target = scrollY, cur = scrollY, raf = 0;
    const max = () => root.scrollHeight - innerHeight;
    const step = () => {
      cur += (target - cur) * 0.11;
      if (Math.abs(target - cur) < 0.4) cur = target;
      scrollTo(0, cur);
      raf = cur !== target ? requestAnimationFrame(step) : 0;
    };
    addEventListener('wheel', e => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.target.closest('.mob .wrap, .mega-box')) return;
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaY;
      if (!raf) { target = cur = scrollY; }
      target = Math.max(0, Math.min(target + dy, max()));
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: false });
    addEventListener('scroll', () => { if (!raf) target = cur = scrollY; }, { passive: true });
    // anchor links glide too
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const el = $(id); if (!el) return;
      e.preventDefault(); target = Math.min(max(), el.getBoundingClientRect().top + scrollY - 90);
      if (!raf) { cur = scrollY; raf = requestAnimationFrame(step); }
    }));
  }

  /* ---------- header: stuck state ---------- */
  const hdr = $('#hdr'), bar = $('.bar');
  const onScroll = () => hdr.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= 12.5 && scrollY > 40);
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

  /* ---------- audience switch (changes hero copy) ---------- */
  const aud = [
    'Дистриб’ютор та виробник засобів захисту рослин і добрив для агромагазинів по всій Україні: ≈ 1000 SKU, швидка доставка та портал для замовлень.',
    'Офіційна дистрибуція, власні виробничі потужності та контрактне фасування — виводимо ваш продукт на полиці 1 200 агромагазинів.',
    'Стабільні поставки від ≈ 30 виробників, власний склад 2,3 га та прогнозована логістика для ваших партнерів.'
  ];
  const leadEl = $('.slide p');
  $$('.aud-b').forEach(b => b.addEventListener('click', () => {
    $$('.aud-b').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', String(x === b)); });
    go(0);
    leadEl.style.opacity = 0;
    setTimeout(() => { leadEl.textContent = aud[+b.dataset.aud]; leadEl.style.opacity = ''; }, 200);
  }));
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
    $$('[data-count]', e.target).forEach(count);
    io.unobserve(e.target);
  }), { threshold: .15, rootMargin: '0px 0px -30px 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- why: hover highlight + gentle auto-cycle ---------- */
  const wfs = $$('.wf');
  let wi = 3, wt = 0, hovering = false;
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
    vp.addEventListener('scroll', upd, { passive: true }); upd();
    let down = false, sx = 0, sl = 0, moved = false;
    vp.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = vp.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; vp.classList.add('drag'); } vp.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; vp.classList.remove('drag'); if (moved) { const s = step(); vp.scrollTo({ left: Math.round(vp.scrollLeft / s) * s, behavior: 'smooth' }); } });
  }
})();
