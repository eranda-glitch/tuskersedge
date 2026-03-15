const loginOverlay = document.getElementById('admin-login');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('admin-login-error');
const logoutBtn = document.getElementById('admin-logout');

const toursTbody = document.getElementById('tours-tbody');
const galleryTbody = document.getElementById('gallery-tbody');
const blogTbody = document.getElementById('blog-tbody');
const enquiriesTbody = document.getElementById('enquiries-tbody');

const summaryTours = document.getElementById('summary-tours');
const summaryFeatured = document.getElementById('summary-featured');
const summaryBlog = document.getElementById('summary-blog');
const summaryBlogFeatured = document.getElementById('summary-blog-featured');
const summaryGallery = document.getElementById('summary-gallery');
const summaryEnquiries = document.getElementById('summary-enquiries');

const addTourBtn = document.getElementById('add-tour-btn');
const addGalleryBtn = document.getElementById('add-gallery-btn');
const addBlogBtn = document.getElementById('add-blog-btn');
const markAllReadBtn = document.getElementById('mark-all-read');
const tourForm = document.getElementById('tour-form');

let contentState = null;
let messagesState = [];

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function showLogin(show) {
  if (!loginOverlay) return;
  loginOverlay.classList.toggle('hidden', !show);
  if (logoutBtn) logoutBtn.classList.toggle('hidden', show);
}

function renderSummary() {
  if (!contentState) return;
  const tours = contentState.tours || [];
  const blog = contentState.blog || [];
  const gallery = contentState.gallery || [];
  const featured = tours.filter((t) => t.featured).length;
  const blogFeatured = blog.filter((b) => b.featured).length;
  const newEnquiries = messagesState.filter((m) => m.status === 'new').length;

  if (summaryTours) summaryTours.textContent = tours.length;
  if (summaryFeatured) summaryFeatured.textContent = featured;
  if (summaryBlog) summaryBlog.textContent = blog.length;
  if (summaryBlogFeatured) summaryBlogFeatured.textContent = blogFeatured;
  if (summaryGallery) summaryGallery.textContent = gallery.length;
  if (summaryEnquiries) summaryEnquiries.textContent = newEnquiries;
}

function renderTours() {
  if (!toursTbody) return;
  const tours = contentState?.tours || [];
  toursTbody.innerHTML = tours
    .map(
      (t) => `
      <tr>
        <td class="px-2 py-2">${t.title}</td>
        <td class="px-2 py-2">${t.duration}</td>
        <td class="px-2 py-2">${t.type || '-'}</td>
        <td class="px-2 py-2">${t.featured ? '<span class="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] text-emerald-700">Homepage</span>' : '—'}</td>
        <td class="px-2 py-2">
          <button class="mr-2 text-emerald-700 hover:underline" data-edit-tour="${t.id}">Edit</button>
          <button class="text-rose-600 hover:underline" data-remove-tour="${t.id}">Remove</button>
        </td>
      </tr>
    `
    )
    .join('');
}

function renderGallery() {
  if (!galleryTbody) return;
  const items = contentState?.gallery || [];
  galleryTbody.innerHTML = items
    .map(
      (g) => `
      <tr>
        <td class="px-2 py-2">${g.label}</td>
        <td class="px-2 py-2">${g.category}</td>
        <td class="px-2 py-2">${g.src}</td>
        <td class="px-2 py-2">
          <button class="mr-2 text-emerald-700 hover:underline" data-edit-gallery="${g.id}">Edit</button>
          <button class="text-rose-600 hover:underline" data-remove-gallery="${g.id}">Remove</button>
        </td>
      </tr>
    `
    )
    .join('');
}

function renderBlog() {
  if (!blogTbody) return;
  const items = contentState?.blog || [];
  blogTbody.innerHTML = items
    .map(
      (b) => `
      <tr>
        <td class="px-2 py-2">${b.title}</td>
        <td class="px-2 py-2">${b.category}</td>
        <td class="px-2 py-2">${b.published ? 'Yes' : 'No'}</td>
        <td class="px-2 py-2">${b.featured ? 'Yes' : 'No'}</td>
        <td class="px-2 py-2">
          <button class="mr-2 text-emerald-700 hover:underline" data-edit-blog="${b.id}">Edit</button>
          <button class="text-rose-600 hover:underline" data-remove-blog="${b.id}">Remove</button>
        </td>
      </tr>
    `
    )
    .join('');
}

function renderEnquiries() {
  if (!enquiriesTbody) return;
  enquiriesTbody.innerHTML = messagesState
    .map(
      (m) => `
      <tr>
        <td class="px-2 py-2">${m.name || '—'}</td>
        <td class="px-2 py-2">${m.email || m.phone || '—'}</td>
        <td class="px-2 py-2">${m.month || '—'} · ${m.nights || '—'}</td>
        <td class="px-2 py-2">${m.interests || '—'}</td>
        <td class="px-2 py-2">
          <span class="rounded-full ${m.status === 'new' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'} px-2 py-0.5 text-[0.65rem]">
            ${m.status === 'new' ? 'New' : 'Read'}
          </span>
        </td>
      </tr>
    `
    )
    .join('');
}

async function loadAdminData() {
  const contentRes = await apiFetch('/api/admin/content');
  const messagesRes = await apiFetch('/api/admin/messages');
  contentState = contentRes.content;
  messagesState = messagesRes.messages || [];
  renderSummary();
  renderTours();
  renderGallery();
  renderBlog();
  renderEnquiries();
}

async function saveContent() {
  await apiFetch('/api/admin/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contentState),
  });
  renderSummary();
}

async function init() {
  try {
    await loadAdminData();
    showLogin(false);
  } catch (err) {
    showLogin(true);
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginError) loginError.classList.add('hidden');
    const data = new FormData(loginForm);
    const payload = Object.fromEntries(data.entries());
    try {
      await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await loadAdminData();
      showLogin(false);
    } catch (err) {
      if (loginError) loginError.classList.remove('hidden');
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await apiFetch('/api/logout', { method: 'POST' });
    showLogin(true);
  });
}

if (tourForm) {
  tourForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(tourForm);
    const payload = Object.fromEntries(data.entries());
    const tour = {
      id: `tour-${Date.now().toString(36)}`,
      title: payload.title || 'Untitled tour',
      duration: payload.duration || '',
      type: payload.type || '',
      description: payload.description || '',
      price: payload.price || '',
      featured: payload.featured === 'on',
      image: payload.image || '',
    };
    contentState.tours = [tour, ...(contentState.tours || [])];
    await saveContent();
    renderTours();
    tourForm.reset();
  });
}

if (addGalleryBtn) {
  addGalleryBtn.addEventListener('click', async () => {
    const label = prompt('Image label');
    if (!label) return;
    const category = prompt('Category (beaches, culture, wildlife, hills, city)') || 'beaches';
    const src = prompt('Image URL or path', 'images/1.jpeg');
    if (!src) return;
    const item = { id: `g-${Date.now().toString(36)}`, label, category, src };
    contentState.gallery = [item, ...(contentState.gallery || [])];
    await saveContent();
    renderGallery();
  });
}

if (addBlogBtn) {
  addBlogBtn.addEventListener('click', async () => {
    const title = prompt('Post title');
    if (!title) return;
    const category = prompt('Category', 'Travel tips') || 'General';
    const published = confirm('Publish now?');
    const featured = confirm('Feature on homepage?');
    const item = { id: `b-${Date.now().toString(36)}`, title, category, published, featured };
    contentState.blog = [item, ...(contentState.blog || [])];
    await saveContent();
    renderBlog();
  });
}

if (markAllReadBtn) {
  markAllReadBtn.addEventListener('click', async () => {
    await apiFetch('/api/admin/messages/mark-read', { method: 'POST' });
    messagesState = messagesState.map((m) => ({ ...m, status: 'read' }));
    renderSummary();
    renderEnquiries();
  });
}

[toursTbody, galleryTbody, blogTbody].forEach((tbody) => {
  if (!tbody) return;
  tbody.addEventListener('click', async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const tourId = target.getAttribute('data-remove-tour');
    if (tourId) {
      contentState.tours = (contentState.tours || []).filter((t) => t.id !== tourId);
      await saveContent();
      renderTours();
      return;
    }

    const galleryId = target.getAttribute('data-remove-gallery');
    if (galleryId) {
      contentState.gallery = (contentState.gallery || []).filter((g) => g.id !== galleryId);
      await saveContent();
      renderGallery();
      return;
    }

    const blogId = target.getAttribute('data-remove-blog');
    if (blogId) {
      contentState.blog = (contentState.blog || []).filter((b) => b.id !== blogId);
      await saveContent();
      renderBlog();
    }
  });
});

init();
