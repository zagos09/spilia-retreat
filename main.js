/* ─── MOBILE MENU (bottom nav burger) ─── */
const burger = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileClose = document.getElementById('mobile-close');
const mobileLinks = document.querySelectorAll('.mobile-link');

burger?.addEventListener('click', () => mobileMenu.classList.add('open'));
mobileClose?.addEventListener('click', () => mobileMenu.classList.remove('open'));
mobileLinks.forEach(link => link.addEventListener('click', () => mobileMenu.classList.remove('open')));

/* ─── ACTIVE NAV STATE (bottom nav) ─── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.bottom-nav__links a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('nav-active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => sectionObserver.observe(s));

/* ─── SCROLL REVEAL ─── */
const revealEls = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('revealed');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

/* ─── LIGHTBOX ─── */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');

// Collect both panel images and thumbnails
const galleryImgs = document.querySelectorAll('.gallery-panel__img img, .gallery__thumb img');

let currentLightboxIndex = 0;
const galleryData = [];

galleryImgs.forEach((img, i) => {
  const capEl = img.closest('.gallery-panel')?.querySelector('.gallery-panel__caption-title')
             || img.closest('.gallery__thumb')?.querySelector('.gallery__caption');
  galleryData.push({ src: img.src, alt: img.alt, caption: capEl ? capEl.textContent.trim() : '' });

  const container = img.closest('.gallery-panel__img') || img.closest('.gallery__thumb');
  if (container) {
    container.style.cursor = 'pointer';
    container.addEventListener('click', () => openLightbox(i));
    container.setAttribute('tabindex', '0');
    container.addEventListener('keydown', (e) => { if (e.key === 'Enter') openLightbox(i); });
  }
});

function openLightbox(index) {
  currentLightboxIndex = index;
  updateLightboxImage();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function updateLightboxImage() {
  const data = galleryData[currentLightboxIndex];
  lightboxImg.src = data.src;
  lightboxImg.alt = data.alt;
  lightboxCaption.textContent = data.caption;
}

function nextImage() {
  currentLightboxIndex = (currentLightboxIndex + 1) % galleryData.length;
  updateLightboxImage();
}

function prevImage() {
  currentLightboxIndex = (currentLightboxIndex - 1 + galleryData.length) % galleryData.length;
  updateLightboxImage();
}

lightboxClose?.addEventListener('click', closeLightbox);
lightboxNext?.addEventListener('click', nextImage);
lightboxPrev?.addEventListener('click', prevImage);
lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') nextImage();
  if (e.key === 'ArrowLeft') prevImage();
});

/* ─── AUTO DATE MINIMUM ─── */
const checkinInput = document.getElementById('check-in');
const checkoutInput = document.getElementById('check-out');
if (checkinInput && checkoutInput) {
  const today = new Date().toISOString().split('T')[0];
  checkinInput.min = today;
  checkoutInput.min = today;
  checkinInput.addEventListener('change', () => {
    checkoutInput.min = checkinInput.value;
    if (checkoutInput.value && checkoutInput.value <= checkinInput.value) {
      const d = new Date(checkinInput.value);
      d.setDate(d.getDate() + 1);
      checkoutInput.value = d.toISOString().split('T')[0];
    }
  });
}

/* ─── BOOK BUTTON ─── */
document.getElementById('check-availability-btn')?.addEventListener('click', () => {
  const checkin = checkinInput?.value;
  const checkout = checkoutInput?.value;
  if (!checkin || !checkout) {
    alert('Please select your check-in and check-out dates to check availability.');
    return;
  }
  window.open('https://www.booking.com/hotel/gr/spilia-retreat.en-gb.html', '_blank', 'noopener,noreferrer');
});
