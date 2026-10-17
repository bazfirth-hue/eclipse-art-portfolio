/* ═══════════════════════════════════════════════════
   EclipseArt
   ═══════════════════════════════════════════════════ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

/* ── SHOP ────────────────────────────────────────────
   James's Stripe Payment Links go here. Keys are the artwork image
   names. Until a link is filled in, that Buy button falls back to the
   contact form with the piece and price prefilled, so nothing breaks.

   Mark an original sold with  sold: true  and it shows as sold, while
   the print of it stays on sale.

   printLink is ONE Stripe link for every print. The artwork is passed
   to Stripe as client_reference_id, so James can see which one was
   bought on the payment in his Stripe dashboard. */
const SITE_URL = 'https://eclipseart.co.uk/';

const SHOP = {
  originalPrice: 200,
  printPrice:    25,
  printLink:     '',
  originals: {
    'the-eclipse':       { link: '', sold: false },
    'violet-metropolis': { link: '', sold: false },
    'blood-moon-rising': { link: '', sold: false },
    'jade-city':         { link: '', sold: false },
    'cloud-city':        { link: '', sold: false },
    'neon-skyline':      { link: '', sold: false },
    'frozen-capital':    { link: '', sold: false },
    'neon-world':        { link: '', sold: false },
    'ocean-worlds':      { link: '', sold: false },
    'stellar-drift':     { link: '', sold: false },
    'silver-planet':     { link: '', sold: false },
    'emberfall':         { link: '', sold: false },
    'comet-run':         { link: '', sold: false },
    'verdant-giant':     { link: '', sold: false },
    'sister-worlds':     { link: '', sold: false },
    'gold-and-violet':   { link: '', sold: false },
    'magenta-veil':      { link: '', sold: false },
    'starburst':         { link: '', sold: false },
  },
};

const slugOf   = item => item.dataset.full.replace(/^.*\//, '').replace(/\.\w+$/, '');
const shopFor  = item => SHOP.originals[slugOf(item)] || { link: '', sold: false };

/* ── STARFIELD ───────────────────────────────────── */
const canvas = document.getElementById('starfield');
const ctx    = canvas.getContext('2d');
let stars = [], W, H, starFrame = null;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initStars() {
  stars = [];
  // Fewer stars on phones, where the fill rate costs battery for little gain.
  const density = coarsePointer ? 7000 : 3800;
  const count   = Math.min(Math.floor((W * H) / density), 420);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.15,
      a: Math.random(),
      speed: Math.random() * 0.9 + 0.2,
      dir: Math.random() > 0.5 ? 1 : -1,
      max: Math.random() * 0.55 + 0.45,
      min: Math.random() * 0.06 + 0.02,
    });
  }
}

function paintStars(animate) {
  ctx.clearRect(0, 0, W, H);
  for (const s of stars) {
    if (animate) {
      s.a += s.speed * 0.014 * s.dir;
      if (s.a > s.max || s.a < s.min) s.dir *= -1;
    }
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.a.toFixed(3)})`;
    ctx.fill();
  }
}

function loopStars() {
  paintStars(true);
  starFrame = requestAnimationFrame(loopStars);
}

function startStars() {
  if (starFrame !== null) return;
  starFrame = requestAnimationFrame(loopStars);
}

function stopStars() {
  if (starFrame === null) return;
  cancelAnimationFrame(starFrame);
  starFrame = null;
}

resizeCanvas();
initStars();
if (reduceMotion) paintStars(false); else startStars();

// A background tab should not burn CPU on a starfield nobody can see.
document.addEventListener('visibilitychange', () => {
  if (reduceMotion) return;
  document.hidden ? stopStars() : startStars();
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeCanvas();
    initStars();
    if (reduceMotion) paintStars(false);
  }, 150);
}, { passive: true });

/* ── HERO GALAXY ─────────────────────────────────── */
// A faint spiral galaxy turning slowly behind the featured work. The stars are
// drawn once to an offscreen sprite and only rotated each frame, so it is cheap.
// It fades as the hero scrolls away and stops entirely when it cannot be seen.
(function heroGalaxy() {
  const g = document.getElementById('galaxy');
  if (!g) return;
  const gctx  = g.getContext('2d');
  const hero  = document.getElementById('hero');
  const art   = document.querySelector('.hero-art');
  const SPIN  = (Math.PI * 2) / 120;   // one full turn every two minutes
  const PEAK  = 0.95;                  // brightest it ever gets
  const born  = performance.now();
  let gw, gh, cx, cy, radius, sprite;
  let angle = 0, last = null, frame = null, onScreen = true;

  function buildSprite() {
    const size = Math.round(radius * 2);
    const c = size / 2;
    const stars = document.createElement('canvas');
    stars.width = stars.height = size;
    const s = stars.getContext('2d');

    const count = coarsePointer ? 2200 : 4200;
    for (let i = 0; i < count; i++) {
      const t      = Math.pow(Math.random(), 0.65);          // crowd stars toward the core
      const r      = t * c * 0.95;
      const twist  = t * 2.6 * Math.PI;                       // how tightly the arms wind
      const spread = (Math.random() - 0.5) * (0.45 + t * 0.8); // arms fan out toward the rim
      const disc   = Math.random() < 0.15;                     // some stars sit between the arms
      const a      = disc ? Math.random() * Math.PI * 2 : (i % 2) * Math.PI + twist + spread;
      const jx     = (Math.random() - 0.5) * c * 0.07;
      const jy     = (Math.random() - 0.5) * c * 0.07;
      const pick   = Math.random();
      const col    = pick < 0.14 ? '255,244,230' : pick < 0.55 ? '77,255,252' : '150,110,255';
      const alpha  = Math.min(1, (1 - t * 0.55) * (0.45 + Math.random() * 0.6));
      const dot    = Math.random() < 0.06 ? 2 : 0.6 + Math.random() * 1.1;
      s.fillStyle = `rgba(${col},${alpha.toFixed(3)})`;
      s.beginPath();
      s.arc(c + Math.cos(a) * r + jx, c + Math.sin(a) * r + jy, dot, 0, Math.PI * 2);
      s.fill();
    }

    sprite = document.createElement('canvas');
    sprite.width = sprite.height = size;
    const p = sprite.getContext('2d');

    // A soft glowing core, then a blurred copy of the arms for haze, then the sharp stars.
    const core = p.createRadialGradient(c, c, 0, c, c, c * 0.5);
    core.addColorStop(0,    'rgba(255,238,215,0.7)');
    core.addColorStop(0.18, 'rgba(200,165,255,0.3)');
    core.addColorStop(1,    'rgba(139,92,246,0)');
    p.fillStyle = core;
    p.fillRect(0, 0, size, size);

    p.globalAlpha = 1;
    p.filter = 'blur(9px)';
    p.drawImage(stars, 0, 0);
    p.drawImage(stars, 0, 0);
    p.filter = 'none';
    p.globalAlpha = 1;
    p.drawImage(stars, 0, 0);
  }

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    gw = hero.offsetWidth;
    gh = hero.offsetHeight;
    g.width  = gw * dpr;
    g.height = gh * dpr;
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // The bright core sits just above the featured work's top edge, so it peeks out
    // from behind the painting rather than being hidden by it.
    const hr = hero.getBoundingClientRect();
    const ar = art.getBoundingClientRect();
    cx = ar.left - hr.left + ar.width * 0.62;
    cy = ar.top  - hr.top  - ar.height * 0.02;
    radius = Math.min(Math.max(gw * 0.5, 360), 900);
    buildSprite();
  }

  function draw() {
    gctx.clearRect(0, 0, gw, gh);
    gctx.save();
    gctx.translate(cx, cy);
    gctx.rotate(-0.42);        // tilt the plane of the disc
    gctx.scale(1, 0.46);       // seen at an angle, so the disc reads as an ellipse
    gctx.rotate(angle);
    gctx.drawImage(sprite, -radius, -radius, radius * 2, radius * 2);
    gctx.restore();
  }

  function fade(now) {
    const fadeIn   = reduceMotion ? 1 : Math.min(1, (now - born) / 2500);
    const scrolled = Math.max(0, 1 - window.scrollY / (gh * 0.75));
    const o = PEAK * fadeIn * scrolled;
    g.style.opacity = o.toFixed(3);
    return o;
  }

  function tick(now) {
    if (last !== null) angle += SPIN * (now - last) / 1000;
    last = now;
    draw();
    fade(now);
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (reduceMotion || frame !== null || !onScreen || document.hidden) return;
    last = null;
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    if (frame === null) return;
    cancelAnimationFrame(frame);
    frame = null;
  }

  layout();
  draw();
  fade(performance.now());
  start();

  // Still holds its place for reduced motion, it just never turns.
  window.addEventListener('scroll', () => { if (frame === null) fade(performance.now()); }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      onScreen ? start() : stop();
    }).observe(hero);
  }

  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

  let galaxyTimer;
  window.addEventListener('resize', () => {
    clearTimeout(galaxyTimer);
    galaxyTimer = setTimeout(() => { layout(); draw(); fade(performance.now()); }, 200);
  }, { passive: true });
})();

/* ── GLOW CURSOR ─────────────────────────────────── */
const cursor = document.getElementById('glow-cursor');

if (coarsePointer || reduceMotion) {
  cursor.remove();
} else {
  let cx = -300, cy = -300, tx = -300, ty = -300;

  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });

  (function animateCursor() {
    cx += (tx - cx) * 0.1;
    cy += (ty - cy) * 0.1;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  })();
}

/* ── NAVIGATION ──────────────────────────────────── */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
const sections  = ['hero', 'gallery', 'wall', 'buying', 'about', 'process', 'faq', 'contact'];

function updateNav() {
  navbar.classList.toggle('scrolled', window.scrollY > 40);

  const scrollY = window.scrollY + 140;
  let current = sections[0];
  for (const id of sections) {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= scrollY) current = id;
  }
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

function closeMenu() {
  hamburger.classList.remove('open');
  navLinks.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
}

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  navLinks.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
});

navLinks.addEventListener('click', e => {
  if (e.target.closest('.nav-link')) closeMenu();
});

/* ── SCROLL REVEAL ───────────────────────────────── */
const revealEls = Array.from(document.querySelectorAll('.reveal'));

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach(el => el.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const index = revealEls.indexOf(el);
      setTimeout(() => el.classList.add('visible'), (index % 3) * 80);
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));
}

/* ── GALLERY FILTER ──────────────────────────────── */
const filterBtns   = document.querySelectorAll('.filter-btn');
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const visibleCount = document.getElementById('visibleCount');

// The lightbox walks whatever is on screen, so filtering narrows it too.
let shown = galleryItems.slice();

// Price tags on every card, built from SHOP so they can never disagree with it.
galleryItems.forEach(item => {
  const sold = shopFor(item).sold;
  const tags = document.createElement('span');
  tags.className = 'card-prices';
  tags.innerHTML = sold
    ? `<span class="price-pill sold">Original sold</span><span class="price-pill">Print £${SHOP.printPrice}</span>`
    : `<span class="price-pill hot">Original £${SHOP.originalPrice}</span><span class="price-pill">Print £${SHOP.printPrice}</span>`;
  item.appendChild(tags);
  item.setAttribute('aria-label',
    `${item.dataset.title}, ${sold ? 'original sold' : `original £${SHOP.originalPrice}`}, print £${SHOP.printPrice}`);
});

// Product data for search engines, one entry per artwork, from the same source.
(function addProductData() {
  const ship = {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'GBP' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'GB' },
  };
  const returns = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'GB',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnMethod: 'https://schema.org/ReturnByMail',
  };
  const offer = (name, price, inStock, slug) => ({
    '@type': 'Offer', name, price: price.toFixed(2), priceCurrency: 'GBP',
    availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    url: `${SITE_URL}#art/${slug}`, itemCondition: 'https://schema.org/NewCondition',
    shippingDetails: ship, hasMerchantReturnPolicy: returns,
  });
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'EclipseArt collection',
    itemListElement: galleryItems.map((item, i) => {
      const slug = slugOf(item);
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': ['Product', 'VisualArtwork'],
          name: item.dataset.title,
          description: item.dataset.caption,
          image: SITE_URL + item.dataset.full,
          artMedium: item.dataset.medium,
          artform: 'Painting',
          creator: { '@id': `${SITE_URL}#artist` },
          brand: { '@id': `${SITE_URL}#brand` },
          offers: [
            offer('Original', SHOP.originalPrice, !shopFor(item).sold, slug),
            offer('Art print', SHOP.printPrice, true, slug),
          ],
        },
      };
    }),
  };
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
})();

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');

    const filter = btn.dataset.filter;
    shown = [];

    galleryItems.forEach(item => {
      const match = filter === 'all' || item.dataset.category === filter;
      item.classList.toggle('hidden', !match);
      if (match) shown.push(item);
    });

    visibleCount.textContent = shown.length;
  });
});

/* ── LIGHTBOX ────────────────────────────────────── */
const lightbox = document.getElementById('lightbox');
const lbImage  = document.getElementById('lbImage');
const lbTitle  = document.getElementById('lbTitle');
const lbTag    = document.getElementById('lbTag');
const lbDesc   = document.getElementById('lbDesc');
const lbMeta   = document.getElementById('lbMeta');
const lbCount  = document.getElementById('lbCount');
const lbClose  = document.getElementById('lbClose');
const lbPrev   = document.getElementById('lbPrev');
const lbNext   = document.getElementById('lbNext');
const lbEnquire = document.getElementById('lbEnquire');
const lbShare  = document.getElementById('lbShare');
const lbToast  = document.getElementById('lbToast');
const lbBuy    = document.getElementById('lbBuy');
const optOriginal      = document.getElementById('optOriginal');
const optOriginalNote  = document.getElementById('optOriginalNote');
const optOriginalPrice = document.getElementById('optOriginalPrice');
const buyRadios = Array.from(lightbox.querySelectorAll('input[name="buyKind"]'));

const categoryLabel = { space: 'Space Scene', cityscape: 'Cityscape', planet: 'Planet System' };

let lbIndex = 0;
let lastFocus = null;
let buyKind = 'original';

function preload(src) { if (src) new Image().src = src; }

function currentItem() { return shown[lbIndex]; }

function buyDetails() {
  const item = currentItem();
  const slug = slugOf(item);
  const original = buyKind === 'original';
  const price = original ? SHOP.originalPrice : SHOP.printPrice;
  const link  = original
    ? shopFor(item).link
    : (SHOP.printLink ? `${SHOP.printLink}?client_reference_id=${slug}` : '');
  return { item, slug, original, price, link };
}

function updateBuy() {
  const { original, price, link } = buyDetails();
  lbBuy.textContent = original ? `Buy the original, £${price}` : `Buy a print, £${price}`;
  lbBuy.href = link || '#contact';
  lbBuy.dataset.live = link ? '1' : '';
  buyRadios.forEach(r => r.closest('.buy-opt').classList.toggle('selected', r.checked));
}

function renderLightbox(i) {
  const item = shown[i];
  if (!item) return;
  const d = item.dataset;
  const sold = shopFor(item).sold;

  lbImage.src = d.full;
  lbImage.alt = item.querySelector('img').alt;
  lbTitle.textContent = d.title;
  lbTag.textContent   = categoryLabel[d.category] || '';
  lbDesc.textContent  = d.caption || '';

  // Size only appears once it has been filled in.
  lbMeta.textContent = [d.medium, d.size].filter(Boolean).join('\n');
  lbCount.textContent = `${i + 1} / ${shown.length}`;

  // A sold original stays visible but cannot be picked, so the print is the offer.
  const origRadio = buyRadios.find(r => r.value === 'original');
  origRadio.disabled = sold;
  optOriginal.classList.toggle('is-sold', sold);
  optOriginalNote.textContent  = sold ? 'This original has found its home.' : 'Built up by hand. The only one in existence.';
  optOriginalPrice.textContent = sold ? 'Sold' : `£${SHOP.originalPrice}`;
  buyKind = sold ? 'print' : 'original';
  buyRadios.forEach(r => { r.checked = r.value === buyKind; });
  updateBuy();

  lbToast.textContent = '';
  lbPrev.hidden = lbNext.hidden = shown.length < 2;

  // A shareable address for every piece, without adding history entries.
  history.replaceState(null, '', `#art/${slugOf(item)}`);

  preload(shown[(i + 1) % shown.length]?.dataset.full);
  preload(shown[(i - 1 + shown.length) % shown.length]?.dataset.full);
}

function openLightbox(item) {
  lbIndex = shown.indexOf(item);
  if (lbIndex < 0) return;

  lastFocus = document.activeElement;
  lightbox.hidden = false;
  document.body.classList.add('lb-open');
  renderLightbox(lbIndex);
  requestAnimationFrame(() => lightbox.classList.add('open'));
  lbClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.classList.remove('lb-open');
  history.replaceState(null, '', location.pathname + location.search);
  const done = () => { lightbox.hidden = true; };
  reduceMotion ? done() : setTimeout(done, 320);
  if (lastFocus) lastFocus.focus();
}

function step(dir) {
  lbIndex = (lbIndex + dir + shown.length) % shown.length;
  renderLightbox(lbIndex);
}

galleryItems.forEach(item => {
  item.addEventListener('click', () => openLightbox(item));
});

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => step(-1));
lbNext.addEventListener('click', () => step(1));

lightbox.addEventListener('click', e => {
  // Clicking the backdrop closes; clicking the artwork or its panel does not.
  if (e.target === lightbox) closeLightbox();
});

buyRadios.forEach(r => r.addEventListener('change', () => {
  buyKind = r.value;
  updateBuy();
}));

document.addEventListener('keydown', e => {
  if (lightbox.hidden) return;
  // Arrow keys inside the original/print choice move the choice, not the artwork.
  const inChoice = e.target.name === 'buyKind';
  if (e.key === 'Escape')                  { closeLightbox(); }
  if (e.key === 'ArrowRight' && !inChoice) { step(1); }
  if (e.key === 'ArrowLeft'  && !inChoice) { step(-1); }
  if (e.key === 'Tab') {
    // Keep tabbing inside the dialog while it is open.
    const focusables = Array.from(lightbox.querySelectorAll('button, a[href], input'))
      .filter(el => !el.hidden && !el.disabled && el.offsetParent !== null);
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

// Swipe between works on a touch screen.
let touchX = null;
lightbox.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
  touchX = null;
}, { passive: true });

/* ── DEEP LINKS ──────────────────────────────────── */
// #art/the-eclipse opens that piece, so any work can be linked from social media.
function openFromHash() {
  const m = location.hash.match(/^#art\/([\w-]+)$/);
  if (!m) return;
  const item = galleryItems.find(it => slugOf(it) === m[1]);
  if (!item) return;
  if (!shown.includes(item)) document.querySelector('.filter-btn[data-filter="all"]').click();
  if (lightbox.hidden) openLightbox(item);
  else { lbIndex = shown.indexOf(item); renderLightbox(lbIndex); }
}

window.addEventListener('hashchange', openFromHash);
openFromHash();

/* ── BUY, ENQUIRE, SHARE ─────────────────────────── */
function goToForm(message) {
  const type = document.getElementById('ftype');
  const msg  = document.getElementById('fmsg');

  type.value = 'purchase';
  msg.value  = message;

  closeLightbox();
  document.getElementById('contact').scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
  });
  setTimeout(() => {
    msg.focus();
    msg.setSelectionRange(msg.value.length, msg.value.length);
  }, reduceMotion ? 0 : 700);
}

lbBuy.addEventListener('click', e => {
  if (lbBuy.dataset.live) return; // A real Stripe link, let it go.
  e.preventDefault();
  const { item, original, price } = buyDetails();
  goToForm(`I'd like to buy ${original ? 'the original of' : 'a print of'} "${item.dataset.title}" (£${price}).\n\n`);
});

lbEnquire.addEventListener('click', () => {
  const item = currentItem();
  goToForm(`I have a question about "${item ? item.dataset.title : ''}".\n\n`);
});

lbShare.addEventListener('click', async () => {
  const item = currentItem();
  const url  = `${SITE_URL}#art/${slugOf(item)}`;
  const text = `${item.dataset.title} by EclipseArt, hand-sprayed space art`;
  try {
    if (navigator.share) {
      await navigator.share({ title: item.dataset.title, text, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    lbToast.textContent = 'Link copied, paste it anywhere.';
  } catch (err) {
    if (err && err.name === 'AbortError') return; // They closed the share sheet.
    lbToast.textContent = url;
  }
});

/* ── MOBILE BUY BAR ──────────────────────────────── */
// Shows on phones once the hero is gone, but not over the shop itself or the form.
const buyBar   = document.getElementById('buyBar');
const heroEl   = document.getElementById('hero');
const galleryEl = document.getElementById('gallery');
const contactEl = document.getElementById('contact');

function updateBuyBar() {
  const y = window.scrollY, h = window.innerHeight;
  const pastHero  = y > heroEl.offsetHeight * 0.7;
  const inGallery = y + h * 0.5 > galleryEl.offsetTop && y + h * 0.5 < galleryEl.offsetTop + galleryEl.offsetHeight;
  const atForm    = y + h > contactEl.offsetTop + 160;
  buyBar.classList.toggle('show', pastHero && !inGallery && !atForm);
}

window.addEventListener('scroll', updateBuyBar, { passive: true });
updateBuyBar();

/* ── CONTACT FORM ────────────────────────────────── */
const form        = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const formNote    = document.getElementById('formNote');
const accessKey   = form.elements['access_key'].value;
const KEY_MISSING = accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY' || !accessKey;

if (KEY_MISSING) {
  console.warn('EclipseArt: no Web3Forms access key set, the contact form cannot deliver. ' +
               'Get a free key at https://web3forms.com and paste it into index.html.');
}

const validations = [
  { name: 'name',    check: v => v.trim().length > 0 },
  { name: 'email',   check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
  { name: 'type',    check: v => v !== '' },
  { name: 'message', check: v => v.trim().length > 10 },
];

function showNote(html) {
  formNote.innerHTML = html;
  formNote.classList.add('visible');
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  formNote.classList.remove('visible');

  let valid = true;
  let firstBad = null;
  validations.forEach(({ name, check }) => {
    const el    = form.elements[name];
    const field = el.closest('.form-field');
    const ok    = check(el.value);
    field.classList.toggle('error', !ok);
    if (!ok && !firstBad) firstBad = el;
    if (!ok) valid = false;
  });

  if (!valid) { firstBad.focus(); return; }

  if (KEY_MISSING) {
    showNote('This form is not connected yet. Please try again shortly.');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const label     = submitBtn.querySelector('.btn-label');

  submitBtn.disabled = true;
  label.textContent  = 'Sending…';

  try {
    const res  = await fetch('https://api.web3forms.com/submit', {
      method:  'POST',
      body:    new FormData(form),
      headers: { 'Accept': 'application/json' },
    });
    const data = await res.json();

    if (res.ok && data.success) {
      form.reset();
      label.textContent = 'Send Message';
      formSuccess.classList.add('visible');
      setTimeout(() => formSuccess.classList.remove('visible'), 9000);
    } else {
      throw new Error(data.message || 'Submission failed');
    }
  } catch (err) {
    showNote('Something went wrong sending that. Please try again in a moment.');
    label.textContent = 'Try Again';
  } finally {
    submitBtn.disabled = false;
  }
});

form.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('input', () => {
    const field = el.closest('.form-field');
    if (field) field.classList.remove('error');
  });
});

/* ── FOOTER YEAR ─────────────────────────────────── */
document.getElementById('year').textContent = new Date().getFullYear();
