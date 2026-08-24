// Page loader
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hide'), 350);
});

// Dark / light theme toggle
const themeToggle = document.getElementById('themeToggle');
const rootEl = document.documentElement;
function setTheme(theme) {
  rootEl.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
}
themeToggle.addEventListener('click', () => {
  const next = rootEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  setTheme(next);
});

// Cursor glow (desktop only, respects reduced motion)
const cursorGlow = document.getElementById('cursorGlow');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (window.matchMedia('(hover: hover)').matches && !prefersReducedMotion) {
  window.addEventListener('mousemove', e => {
    cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    cursorGlow.classList.add('active');
  });
  document.addEventListener('mouseleave', () => cursorGlow.classList.remove('active'));
}

// Before / after smile comparison slider
const compare = document.getElementById('compare');
const compareBefore = document.getElementById('compareBefore');
const compareHandle = document.getElementById('compareHandle');
function setComparePosition(percent) {
  const clamped = Math.min(95, Math.max(5, percent));
  compareBefore.style.width = clamped + '%';
  compareHandle.style.left = clamped + '%';
  compare.setAttribute('aria-valuenow', Math.round(clamped));
}
function updateFromClientX(clientX) {
  const rect = compare.getBoundingClientRect();
  const percent = ((clientX - rect.left) / rect.width) * 100;
  setComparePosition(percent);
}
let dragging = false;
compare.addEventListener('pointerdown', e => { dragging = true; updateFromClientX(e.clientX); });
window.addEventListener('pointermove', e => { if (dragging) updateFromClientX(e.clientX); });
window.addEventListener('pointerup', () => dragging = false);
compare.addEventListener('keydown', e => {
  const current = parseFloat(compare.getAttribute('aria-valuenow'));
  if (e.key === 'ArrowLeft') setComparePosition(current - 5);
  if (e.key === 'ArrowRight') setComparePosition(current + 5);
});

// Mobile nav
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
hamburger.addEventListener('click', () => {
  nav.classList.toggle('open');
  hamburger.classList.toggle('open');
});
document.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => { nav.classList.remove('open'); hamburger.classList.remove('open'); });
});

// Active link on scroll
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav__link');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
});

// Reveal on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
}, { threshold: 0.15 });
document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

// Stats counter
const statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = +el.dataset.count;
    const numEl = el.querySelector('.stat__num');
    let count = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const timer = setInterval(() => {
      count += step;
      if (count >= target) { count = target; clearInterval(timer); }
      numEl.textContent = count.toLocaleString();
    }, 25);
    statObserver.unobserve(el);
  });
}, { threshold: 0.4 });
document.querySelectorAll('.stat').forEach(el => statObserver.observe(el));

// Testimonial slider
const track = document.getElementById('sliderTrack');
const slides = track.children;
const dotsWrap = document.getElementById('sliderDots');
let current = 0;
for (let i = 0; i < slides.length; i++) {
  const dot = document.createElement('span');
  if (i === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goToSlide(i));
  dotsWrap.appendChild(dot);
}
function goToSlide(i) {
  current = (i + slides.length) % slides.length;
  track.style.transform = `translateX(-${current * 100}%)`;
  [...dotsWrap.children].forEach((d, idx) => d.classList.toggle('active', idx === current));
}
document.getElementById('nextSlide').addEventListener('click', () => goToSlide(current + 1));
document.getElementById('prevSlide').addEventListener('click', () => goToSlide(current - 1));
setInterval(() => goToSlide(current + 1), 6000);

// FAQ accordion
document.querySelectorAll('.accordion__item').forEach(item => {
  const head = item.querySelector('.accordion__head');
  head.addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.accordion__item').forEach(i => {
      i.classList.remove('active');
      i.querySelector('.accordion__head').setAttribute('aria-expanded', 'false');
    });
    if (!isActive) {
      item.classList.add('active');
      head.setAttribute('aria-expanded', 'true');
    }
  });
});

// Appointment form validation
const form = document.getElementById('appointmentForm');
const successBox = document.getElementById('formSuccess');
form.addEventListener('submit', e => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    const group = field.closest('.form-group');
    const errorMsg = group.querySelector('.error-msg');
    let msg = '';
    if (!field.value.trim()) {
      msg = 'This field is required';
    } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
      msg = 'Enter a valid email';
    } else if (field.type === 'tel' && !/^[\d\s()+-]{7,}$/.test(field.value)) {
      msg = 'Enter a valid phone number';
    }
    group.classList.toggle('has-error', !!msg);
    errorMsg.textContent = msg;
    if (msg) valid = false;
  });
  if (!valid) return;
  successBox.classList.add('show');
  form.reset();
  setTimeout(() => successBox.classList.remove('show'), 6000);
});

// Newsletter form
document.getElementById('newsletterForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  input.value = '';
  input.placeholder = 'Thanks for subscribing!';
});

// Back to top
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => backToTop.classList.toggle('show', window.scrollY > 500));
setComparePosition(50);
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Min date = today for appointment date field
document.getElementById('date').min = new Date().toISOString().split('T')[0];

// AI Chat Widget — talks to the FastAPI + LangGraph RAG backend in /chatbot
// NOTE: replace the production URL below with your real Render URL after deploying.
const CHAT_API_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:8000/chat'
  : 'https://brightsmile-dental-clinic.onrender.com/chat';

const chatToggle = document.getElementById('chatToggle');
const chatPanel = document.getElementById('chatPanel');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

chatToggle.addEventListener('click', () => {
  const isOpen = chatPanel.classList.toggle('open');
  chatToggle.classList.toggle('open', isOpen);
  chatToggle.setAttribute('aria-expanded', isOpen);
  chatPanel.setAttribute('aria-hidden', String(!isOpen));
  if (isOpen) chatInput.focus();
});

function addChatMessage(text, className) {
  const el = document.createElement('div');
  el.className = `chat-msg ${className}`;
  el.textContent = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

chatForm.addEventListener('submit', async e => {
  e.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;

  addChatMessage(question, 'chat-msg--user');
  chatInput.value = '';
  const loadingEl = addChatMessage('Thinking…', 'chat-msg--loading');

  try {
    const res = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    const data = await res.json();
    loadingEl.remove();
    addChatMessage(data.answer, 'chat-msg--bot');
    addChatMessage(`Recommended: ${data.expert}`, 'chat-msg--expert');
  } catch (err) {
    loadingEl.remove();
    addChatMessage(
      "Sorry, I couldn't reach the assistant just now. Please try again shortly, or call us directly.",
      'chat-msg--error'
    );
  }
});
