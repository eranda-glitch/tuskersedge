// js/main.js

// Toggle mobile navigation (shared across pages that include these IDs)
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuButton && mobileMenu) {
  mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
}

// Floating contact widget (shared across pages)
const contactWidgetButton = document.getElementById('contact-widget-button');
const contactWidgetPanel = document.getElementById('contact-widget-panel');
const contactWidgetClose = document.getElementById('contact-widget-close');

if (contactWidgetButton && contactWidgetPanel) {
  contactWidgetButton.addEventListener('click', () => {
    contactWidgetPanel.classList.toggle('hidden');
  });
}

if (contactWidgetClose && contactWidgetPanel) {
  contactWidgetClose.addEventListener('click', () => {
    contactWidgetPanel.classList.add('hidden');
  });
}

// Simple gallery filter (used on gallery page)
const filterButtons = document.querySelectorAll('[data-filter]');
const galleryItems = document.querySelectorAll('[data-category]');

if (filterButtons.length && galleryItems.length) {
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      filterButtons.forEach((b) =>
        b.classList.remove('bg-teal-700', 'text-white', 'bg-jungle')
      );
      btn.classList.add('bg-jungle', 'text-white');

      galleryItems.forEach((item) => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });
}

// Hero background rotation (index page)
const heroBg = document.getElementById('hero-bg');
if (heroBg) {
  const heroImages = [
    'Nine-Arch-Bridge-Ella-1920x800-1.webp',
    'Nine-Arch-Bridge-Ella-1920x800-2.jpg',
  ];
  let heroIndex = 0;

  setInterval(() => {
    heroIndex = (heroIndex + 1) % heroImages.length;
    heroBg.style.opacity = '0';
    setTimeout(() => {
      heroBg.style.backgroundImage = `url('${heroImages[heroIndex]}')`;
      heroBg.style.opacity = '1';
    }, 400);
  }, 6000);
}

// Gallery lightbox (gallery page)
const lightbox = document.getElementById('gallery-lightbox');
const lightboxImage = document.getElementById('gallery-lightbox-image');
const lightboxClose = document.getElementById('gallery-lightbox-close');
const lightboxPrev = document.getElementById('gallery-lightbox-prev');
const lightboxNext = document.getElementById('gallery-lightbox-next');
const galleryTiles = document.querySelectorAll('.gallery-item');

if (lightbox && lightboxImage && galleryTiles.length) {
  const imageUrls = Array.from(galleryTiles).map((tile) => {
    const bg = window.getComputedStyle(tile).backgroundImage || '';
    const match = bg.match(/url\\(['\"]?(.*?)['\"]?\\)/i);
    return match ? match[1] : '';
  });

  let currentIndex = 0;

  const openLightbox = (index) => {
    currentIndex = index;
    lightboxImage.style.backgroundImage = `url('${imageUrls[currentIndex]}')`;
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
  };

  const closeLightbox = () => {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
  };

  const showPrev = () => {
    currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
    lightboxImage.style.backgroundImage = `url('${imageUrls[currentIndex]}')`;
  };

  const showNext = () => {
    currentIndex = (currentIndex + 1) % imageUrls.length;
    lightboxImage.style.backgroundImage = `url('${imageUrls[currentIndex]}')`;
  };

  galleryTiles.forEach((tile, index) => {
    tile.addEventListener('click', () => openLightbox(index));
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', showPrev);
  if (lightboxNext) lightboxNext.addEventListener('click', showNext);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
}


// Contact form submit (all pages)
const contactForms = document.querySelectorAll('.contact-form');
if (contactForms.length) {
  contactForms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      const formData = new FormData(form);
      formData.append('source', form.getAttribute('data-source') || window.location.pathname);
      const payload = Object.fromEntries(formData.entries());
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Request failed');
        form.reset();
        alert('Thanks! Your message has been sent.');
      } catch (err) {
        alert('Sorry, something went wrong. Please try again.');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

