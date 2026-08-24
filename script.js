/* ═══════════════════════════════════════════════════
   EclipseArt
   ═══════════════════════════════════════════════════ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

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
const sections  = ['hero', 'gallery', 'about', 'process', 'contact'];

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

const categoryLabel = { space: 'Space Scene', cityscape: 'Cityscape', planet: 'Planet System' };

let lbIndex = 0;
let lastFocus = null;

function preload(src) { if (src) new Image().src = src; }

function renderLightbox(i) {
  const item = shown[i];
  if (!item) return;
  const d = item.dataset;

  lbImage.src = d.full;
  lbImage.alt = item.querySelector('img').alt;
  lbTitle.textContent = d.title;
  lbTag.textContent   = categoryLabel[d.category] || '';
  lbDesc.textContent  = d.caption || '';

  // Size and availability only appear once they have been filled in.
  lbMeta.textContent = [d.medium, d.size, d.status].filter(Boolean).join('\n');
  lbCount.textContent = `${i + 1} / ${shown.length}`;

  lbPrev.hidden = lbNext.hidden = shown.length < 2;

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

document.addEventListener('keydown', e => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape')     { closeLightbox(); }
  if (e.key === 'ArrowRight') { step(1); }
  if (e.key === 'ArrowLeft')  { step(-1); }
  if (e.key === 'Tab') {
    // Keep tabbing inside the dialog while it is open.
    const focusables = lightbox.querySelectorAll('button:not([hidden])');
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

/* ── ENQUIRE ABOUT THIS PIECE ────────────────────── */
lbEnquire.addEventListener('click', () => {
  const item = shown[lbIndex];
  const title = item ? item.dataset.title : '';

  const type = document.getElementById('ftype');
  const msg  = document.getElementById('fmsg');

  type.value = 'purchase';
  msg.value  = `I'd like to enquire about "${title}".\n\n`;

  closeLightbox();
  document.getElementById('contact').scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
  });
  setTimeout(() => {
    msg.focus();
    msg.setSelectionRange(msg.value.length, msg.value.length);
  }, reduceMotion ? 0 : 700);
});

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
