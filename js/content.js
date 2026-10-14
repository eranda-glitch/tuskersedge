(function () {
  const staticHostSuffixes = ['gamer.free', 'infinityfreeapp.com', 'epizy.com', 'rf.gd'];
  const hostname = window.location.hostname.toLowerCase();
  const isStaticHost = staticHostSuffixes.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
  );

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function priceText(value) {
    const raw = String(value || '').trim();
    if (!raw) return 'Price on request';
    const numeric = Number(raw.replace(/[^0-9.]/g, ''));
    return Number.isFinite(numeric)
      ? `From US$ ${numeric.toLocaleString('en-US')} per person`
      : escapeHtml(raw);
  }

  const fallbackTours = [
    {
      id: 'tour-cultural-triangle',
      title: 'Cultural Triangle Escape',
      duration: '6 days',
      type: 'Signature journey',
      description: 'Ancient capitals, cave temples, and misty Kandy - ideal for a first visit to the island.',
      price: '890',
      featured: true,
      image: 'assets/hero/sigiriya.webp',
    },
    {
      id: 'tour-hill-country',
      title: 'Hill Country Tea Trails',
      duration: '7 days',
      type: 'Nature journey',
      description: "Scenic trains, cloud forests, and tea bungalows in Sri Lanka's green heart.",
      price: '1150',
      featured: true,
      image: 'assets/hero/tea-country.webp',
    },
    {
      id: 'tour-wild-south',
      title: 'Wild South & Ocean Blues',
      duration: '8 days',
      type: 'Wildlife & sea',
      description: 'Responsible safaris in Yala and slow coastal days between Mirissa and Galle.',
      price: '1280',
      featured: true,
      image: 'assets/hero/mirissa.webp',
    },
  ];

  function compactCard(tour) {
    return `
      <article class="overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <img src="${escapeHtml(tour.image || 'images/1.jpeg')}" alt="${escapeHtml(tour.title || 'Sri Lanka journey')}" loading="lazy" class="mx-auto mb-3 h-44 w-[92%] rounded-xl object-cover" />
        <p class="text-[0.7rem] uppercase tracking-wide text-slate-500">${escapeHtml(tour.type || tour.duration || 'Custom journey')}</p>
        <h3 class="mt-1 font-heading text-lg text-jungle">${escapeHtml(tour.title || 'Untitled journey')}</h3>
        <p class="mt-2 text-sm text-slate-600">${escapeHtml(tour.description || '')}</p>
        <p class="mt-3 text-xs font-semibold text-jungleLight">${priceText(tour.price)}</p>
      </article>`;
  }

  function fullCard(tour) {
    return `
      <article class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <img src="${escapeHtml(tour.image || 'images/1.jpeg')}" alt="${escapeHtml(tour.title || 'Sri Lanka journey')}" loading="lazy" class="h-52 w-full object-cover" />
        <div class="space-y-3 p-5">
          <div class="flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>${escapeHtml(tour.type || 'Custom journey')}</span>
            <span>${escapeHtml(tour.duration || '')}</span>
          </div>
          <h2 class="font-heading text-xl text-jungle">${escapeHtml(tour.title || 'Untitled journey')}</h2>
          <p class="text-sm text-slate-600">${escapeHtml(tour.description || '')}</p>
          <div class="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span class="font-semibold text-jungleLight">${priceText(tour.price)}</span>
            <button type="button" data-request-tour="${escapeHtml(tour.title || '')}" class="rounded-full border border-jungle px-3 py-2 text-[0.7rem] font-semibold text-jungle hover:bg-jungle hover:text-white">Request this journey</button>
          </div>
        </div>
      </article>`;
  }

  async function loadTours() {
    const featuredGrid = document.getElementById('featured-tours-grid');
    const toursGrid = document.getElementById('all-tours-grid');
    if (!featuredGrid && !toursGrid) return;
    try {
      let tours = fallbackTours;
      if (!isStaticHost) {
        const response = await fetch('/api/content');
        if (!response.ok) throw new Error('Could not load managed tours');
        const payload = await response.json();
        const managedTours = Array.isArray(payload.content?.tours) ? payload.content.tours : [];
        if (managedTours.length) tours = managedTours;
      }
      if (!tours.length) {
        const emptyState = `
          <div class="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center sm:col-span-2 lg:col-span-3">
            <h3 class="font-heading text-xl text-jungle">New journeys are being prepared</h3>
            <p class="mx-auto mt-2 max-w-xl text-sm text-slate-600">Tell us your dates, interests, and preferred pace. We can still design a private Sri Lanka itinerary from scratch.</p>
            <button type="button" data-request-tour="Custom Sri Lanka journey" class="mt-4 rounded-full bg-jungle px-5 py-2 text-xs font-semibold text-white hover:bg-jungleLight">Request a custom journey</button>
          </div>`;
        if (featuredGrid) featuredGrid.innerHTML = emptyState;
        if (toursGrid) toursGrid.innerHTML = emptyState;
        return;
      }

      if (featuredGrid) {
        const featured = tours.filter((tour) => tour.featured).slice(0, 3);
        featuredGrid.innerHTML = (featured.length ? featured : tours.slice(0, 3)).map(compactCard).join('');
      }
      if (toursGrid) toursGrid.innerHTML = tours.map(fullCard).join('');
    } catch (error) {
      console.warn('Could not load managed tours:', error);
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-request-tour]');
    if (!button) return;
    const widget = document.getElementById('contact-widget-button');
    if (widget) widget.click();
    const interests = document.querySelector('#contact-widget-panel [name="interests"]');
    if (interests) interests.value = button.getAttribute('data-request-tour') || '';
  });

  loadTours();
})();
