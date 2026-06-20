/* ── STARFIELD ───────────────────────────────────── */
const canvas = document.getElementById('starfield');
const ctx    = canvas.getContext('2d');
let stars = [], W, H;

function resizeCanvas() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function initStars() {
  stars = [];
  const count = Math.floor((W * H) / 3800);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.3 + 0.15,
      a: Math.random(),
      speed: Math.random() * 0.35 + 0.08,
      dir: Math.random() > 0.5 ? 1 : -1,
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, W, H);
  for (const s of stars) {
    s.a += s.speed * 0.005 * s.dir;
    if (s.a > 1 || s.a < 0.08) s.dir *= -1;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.a.toFixed(3)})`;
    ctx.fill();
  }
  requestAnimationFrame(drawStars);
}

resizeCanvas();
initStars();
drawStars();

window.addEventListener('resize', () => { resizeCanvas(); initStars(); }, { passive: true });

/* ── GLOW CURSOR ─────────────────────────────────── */
const cursor = document.getElementById('glow-cursor');
let cx = -200, cy = -200, tx = -200, ty = -200;

document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });

(function animateCursor() {
  cx += (tx - cx) * 0.1;
  cy += (ty - cy) * 0.1;
  cursor.style.left = cx + 'px';
  cursor.style.top  = cy + 'px';
  requestAnimationFrame(animateCursor);
})();

/* ── NAVIGATION ──────────────────────────────────── */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
const sections  = ['hero', 'gallery', 'about', 'contact'];

function updateNav() {
  navbar.classList.toggle('scrolled', window.scrollY > 40);

  const scrollY = window.scrollY + 120;
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

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  navLinks.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
});

navLinks.addEventListener('click', e => {
  if (e.target.closest('.nav-link')) {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
});

/* ── SCROLL REVEAL ───────────────────────────────── */
const revealEls = Array.from(document.querySelectorAll('.reveal'));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el    = entry.target;
    const index = revealEls.indexOf(el);
    // Stagger siblings: 0 / 80 / 160 ms
    const delay = (index % 3) * 80;
    setTimeout(() => el.classList.add('visible'), delay);
    revealObserver.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ── GALLERY FILTER ──────────────────────────────── */
const filterBtns   = document.querySelectorAll('.filter-btn');
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const visibleCount = document.getElementById('visibleCount');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    let count = 0;

    galleryItems.forEach(item => {
      const match = filter === 'all' || item.dataset.category === filter;
      item.classList.toggle('hidden', !match);
      if (match) count++;
    });

    visibleCount.textContent = count;
  });
});

/* ── CONTACT FORM ────────────────────────────────── */
const form        = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

const validations = [
  { name: 'name',    check: v => v.trim().length > 0 },
  { name: 'email',   check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
  { name: 'type',    check: v => v !== '' },
  { name: 'message', check: v => v.trim().length > 10 },
];

form.addEventListener('submit', e => {
  e.preventDefault();

  let valid = true;
  validations.forEach(({ name, check }) => {
    const el    = form.elements[name];
    const field = el.closest('.form-field');
    const ok    = check(el.value);
    field.classList.toggle('error', !ok);
    if (!ok) valid = false;
  });

  if (!valid) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const label     = submitBtn.querySelector('.btn-label');

  submitBtn.disabled = true;
  label.textContent  = 'Sending…';

  // Simulated send — replace with real endpoint if needed
  setTimeout(() => {
    form.reset();
    submitBtn.disabled = false;
    label.textContent  = 'Send Message';
    formSuccess.classList.add('visible');
    setTimeout(() => formSuccess.classList.remove('visible'), 5000);
  }, 1200);
});

// Clear error state on input
form.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('input', () => {
    el.closest('.form-field').classList.remove('error');
  });
});
