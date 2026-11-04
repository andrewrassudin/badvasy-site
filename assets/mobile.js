/* Shared mobile behaviour for v2 and v3 (phones, <=720px):
   1) card groups that don't fit one screen become swipe carousels:
      one card + a peek of the next, pagination dots underneath;
   2) footer sitemap columns become an accordion: first open, the rest closed.
   Works with static pages (v3) and with the JS-rendered router pages (v2). */
(() => {
  const mq = matchMedia('(max-width:720px)');
  const CAROUSELS = [
    '.abx-row', '.ab-grid',          // «БАДВАСИ — це»
    '.dgrid',                        // «Напрями діяльності»
    '.bxgrid', '.bx-row',            // «Власні бренди»
    '.pt-grid'                       // «Портал»
  ];
  const FOOTER = ['.f2-nav', '.ft-nav'];

  function carousel(row) {
    if (row.dataset.mc) return;
    const items = [...row.children].filter(c => c.nodeType === 1);
    if (items.length < 2) return;
    row.dataset.mc = '1';
    row.classList.add('mc');
    const dots = document.createElement('div');
    dots.className = 'mc-dots';
    dots.setAttribute('aria-hidden', 'true');
    items.forEach((_, i) => {
      const d = document.createElement('button');
      d.type = 'button'; d.tabIndex = -1;
      d.addEventListener('click', () => row.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: 'smooth' }));
      dots.append(d);
    });
    row.after(dots);
    const upd = () => {
      const x = row.scrollLeft, w = items[0].getBoundingClientRect().width || 1;
      const gap = items[1] ? items[1].offsetLeft - items[0].offsetLeft - w : 0;
      let k = Math.round(x / (w + gap));
      if (row.scrollLeft + row.clientWidth >= row.scrollWidth - 2) k = items.length - 1;
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i === k));
    };
    row.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    upd();
  }

  function footer(nav) {
    if (nav.dataset.acc) return;
    nav.dataset.acc = '1';
    const cols = [...nav.children].filter(c => c.querySelector('h4'));
    cols.forEach((c, i) => {
      const h = c.querySelector('h4');
      c.classList.add('fa-col');
      if (i === 0) c.classList.add('fa-on');
      h.setAttribute('role', 'button');
      h.tabIndex = 0;
      const toggle = () => {
        if (!mq.matches) return;
        const on = !c.classList.contains('fa-on');
        cols.forEach(x => x.classList.toggle('fa-on', x === c && on));
      };
      h.addEventListener('click', toggle);
      h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  }

  const run = () => {
    document.querySelectorAll(CAROUSELS.join(',')).forEach(carousel);
    document.querySelectorAll(FOOTER.join(',')).forEach(footer);
  };
  let t = 0;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(run, 60); })
    .observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
