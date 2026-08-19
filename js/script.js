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
  item.querySelector('.accordion__head').addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.accordion__item').forEach(i => i.classList.remove('active'));
    if (!isActive) item.classList.add('active');
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
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Min date = today for appointment date field
document.getElementById('date').min = new Date().toISOString().split('T')[0];
