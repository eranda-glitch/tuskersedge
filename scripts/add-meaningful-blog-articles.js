import fs from 'fs/promises';
import path from 'path';
import { db } from '../lib/database.js';

const root = path.resolve();
const siteUrl = 'https://tuskersedge.com';
const publishedDate = '2026-09-30';
const articles = [
  {
    id: 'guide-when-to-visit-sri-lanka',
    title: 'When to Visit Sri Lanka: A Region-by-Region Guide',
    slug: 'when-to-visit-sri-lanka-by-region.html',
    category: 'Planning guide',
    readTime: '8 min read',
    image: 'images/37.jpeg',
    alt: 'Green Sri Lankan hill country landscape',
    excerpt: 'Understand Sri Lanka’s overlapping weather patterns and choose a route that works with the season rather than against it.',
    featured: 1,
    content: `
      <p>Sri Lanka is often described as a year-round destination, and that is broadly true—but not because every region is dry at the same time. The island’s compact size hides several weather zones. A rainy week on one coast can coincide with bright days elsewhere, which means the best travel plan starts with your route, not a single nationwide “best month.”</p>
      <h2>Start with the two coastlines</h2>
      <p>The south and west coasts, including Galle, Mirissa, Bentota, and Colombo, usually have their calmer, drier stretch from roughly December into April. The east coast, including Trincomalee, Pasikudah, and Arugam Bay, often becomes the stronger coastal choice from around May into September. These are useful patterns, not guarantees; tropical weather can produce sunshine and showers in any month.</p>
      <p>If beach time is central to your holiday, choose the coast after choosing your dates. This simple reversal prevents a route from crossing the island purely to reach a beach that is experiencing rougher seasonal seas.</p>
      <h2>Hill country has its own rhythm</h2>
      <p>Kandy, Nuwara Eliya, Haputale, and Ella are cooler than the lowlands. Mist and short showers are part of the atmosphere, especially at elevation. Pack a light warm layer and a compact rain shell even when the coast is hot. Clear mornings are usually the best time for viewpoints and walks, while cloud may build later in the day.</p>
      <h2>Wildlife planning is more than weather</h2>
      <p>Safari quality depends on park conditions, animal movement, visitor pressure, and occasional management closures. Dry periods can draw animals toward water, but they can also make popular parks busy and dusty. A responsible operator should recommend the park that suits your route and travel month instead of promising one particular animal sighting.</p>
      <div class="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-100"><h3>Good route logic by season</h3><ul><li><strong>December–April:</strong> cultural triangle, hill country, and south or west coast.</li><li><strong>May–September:</strong> cultural triangle, selected hill-country stops, and east coast.</li><li><strong>October–November:</strong> keep the itinerary flexible, allow travel buffers, and prioritise experiences that work in mixed weather.</li></ul></div>
      <h2>How many weather apps should you trust?</h2>
      <p>Long-range tropical forecasts often show rain icons for entire weeks even when showers last only an hour. Check forecasts shortly before each travel day, ask local hosts about road and sea conditions, and avoid rebuilding a whole itinerary around a single app. For hikes, boat trips, and safaris, local same-day advice is usually more useful.</p>
      <h2>The practical answer</h2>
      <p>There is no single perfect month for every part of Sri Lanka. There is, however, usually a sensible route for your dates. Share your priorities—wildlife, surf, family beach time, walking, culture, or photography—and build the geography around the season. That creates a calmer trip with fewer unnecessary transfers and better odds of enjoying each place at its best.</p>`,
  },
  {
    id: 'guide-udawalawe-safari',
    title: 'Udawalawe Safari Guide: Planning a Respectful Wildlife Morning',
    slug: 'udawalawe-safari-responsible-travel-guide.html',
    category: 'Wildlife',
    readTime: '7 min read',
    image: 'elephant.webp',
    alt: 'Elephant in Sri Lankan wilderness',
    excerpt: 'A practical guide to safari timing, ethical vehicle behaviour, useful packing, and realistic expectations in Udawalawe.',
    featured: 1,
    content: `
      <p>Udawalawe is one of Sri Lanka’s most accessible wildlife stops, especially for travellers moving between the hill country and the south coast. Its open landscapes can offer memorable elephant encounters, but a good safari is defined by more than how close a vehicle gets. Thoughtful timing, a patient driver, and respectful behaviour make the experience safer for animals and more rewarding for visitors.</p>
      <h2>Choose the experience, not a guarantee</h2>
      <p>No responsible guide can guarantee a particular sighting. Elephants, birds, deer, buffalo, and smaller animals move on their own terms. Ask an operator how drivers respond when several vehicles gather, whether they keep a reasonable distance, and whether they are willing to leave a crowded sighting instead of joining a chase.</p>
      <h2>Morning or afternoon?</h2>
      <p>Early departures bring cooler air, soft light, and an unhurried start before the day becomes hot. Afternoon drives can also be rewarding and may fit better after a transfer. The better choice depends on your previous night’s location, your onward route, and current park conditions. Avoid planning a very late arrival followed by an exhausting pre-dawn start merely to tick a box.</p>
      <h2>What respectful vehicle behaviour looks like</h2>
      <ul><li>Keep enough distance for an animal to choose its own direction.</li><li>Never block a crossing point or surround an animal with vehicles.</li><li>Keep voices low and phones on silent.</li><li>Do not ask the driver to move closer for a photograph.</li><li>Never feed wildlife or leave food packaging behind.</li><li>Accept that moving on can be the most responsible decision.</li></ul>
      <h2>What to bring</h2>
      <p>Wear lightweight clothing in muted colours, bring water in a reusable bottle, and carry sun protection. A light scarf helps with dust, while binoculars often add more value than a long list of camera equipment. Keep loose items secured because the roads can be uneven. During wetter periods, a compact rain layer is useful.</p>
      <div class="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100"><h3>Photography without pressure</h3><p>Use a longer focal length when possible, avoid flash, and let the scene unfold. A photograph of an animal behaving naturally is more meaningful than a close image created by crowding it.</p></div>
      <h2>Build Udawalawe into the route</h2>
      <p>One well-planned night near the park is often more comfortable than a long same-day detour. Arrive with time to rest, take either an afternoon drive or a morning safari, then continue toward the south coast, Ella, or the central highlands. This keeps driving manageable and supports local accommodation and guiding teams.</p>
      <p>A respectful safari may include long quiet stretches. That is not wasted time; it is part of being present in a living landscape rather than treating wildlife as a scheduled attraction.</p>`,
  },
  {
    id: 'guide-sri-lanka-with-children',
    title: 'Sri Lanka With Children: A Calm Family Travel Guide',
    slug: 'sri-lanka-with-children-family-travel-guide.html',
    category: 'Family travel',
    readTime: '8 min read',
    image: 'images/18.jpeg',
    alt: 'Welcoming Sri Lankan accommodation surrounded by nature',
    excerpt: 'Design a family journey with shorter transfers, flexible wildlife experiences, suitable rooms, and genuine downtime.',
    featured: 0,
    content: `
      <p>Sri Lanka works especially well for families because culture, wildlife, beaches, and hill country can fit into one journey. The challenge is not finding enough to do—it is resisting the temptation to do everything. A successful family itinerary protects sleep, meal times, and unplanned hours just as carefully as it schedules highlights.</p>
      <h2>Plan fewer bases and better days</h2>
      <p>Changing hotels every night quickly becomes tiring with children. Choose a smaller number of bases and take short outings from each one. Two or three nights in a place allows time for laundry, swimming, an early bedtime, or a slow morning when energy is low.</p>
      <p>Driving times can look short on a map but feel longer on winding roads. Break transfers with a viewpoint, garden, relaxed lunch, or village stop. Avoid pairing a major transfer with a demanding hike or a late wildlife drive.</p>
      <h2>Choose accommodation by function</h2>
      <p>A beautiful hotel is not automatically family-friendly. Confirm bed arrangements, connecting-room availability, stair access, pool supervision, meal flexibility, and whether there is safe space to move around. For babies and toddlers, ask about cots and refrigeration before confirming.</p>
      <h2>Wildlife without overload</h2>
      <p>A safari can be a family highlight, but several hours on rough tracks may be too much for younger children. Consider a shorter private drive and explain beforehand that sightings cannot be guaranteed. Binoculars, a simple animal checklist, and quiet observation can keep children engaged without encouraging noisy behaviour.</p>
      <h2>Food and daily rhythm</h2>
      <p>Rice, mild curries, fruit, hoppers, roti, and simple grilled dishes provide plenty of approachable choices. Ask for less chilli rather than assuming “not spicy” means the same thing everywhere. Keep familiar snacks for travel days, encourage regular water breaks, and avoid introducing many unfamiliar foods at once.</p>
      <div class="rounded-2xl bg-sky-50 p-5 ring-1 ring-sky-100"><h3>A comfortable family pace</h3><ul><li>Schedule one main activity per half-day.</li><li>Keep at least one unscheduled afternoon every few days.</li><li>Use a private vehicle when flexibility matters.</li><li>Carry sun protection, insect repellent, basic medicines, and travel insurance details.</li></ul></div>
      <h2>Culture that feels alive</h2>
      <p>Temples and historic sites become more engaging when children receive a story rather than a lecture. A good guide can explain a carving, ritual, or legend in a few memorable details. Dress respectfully, remove footwear where required, and carry socks for hot stone surfaces.</p>
      <h2>Leave space for ordinary moments</h2>
      <p>Children often remember a train platform snack, a gecko on the wall, a conversation with a host, or an afternoon in the pool more vividly than a famous monument. Build a route that allows those moments. The goal is not to complete Sri Lanka; it is to enjoy travelling together.</p>`,
  },
  {
    id: 'guide-first-week-sri-lanka',
    title: 'Your First Week in Sri Lanka: A Route Without the Rush',
    slug: 'first-week-in-sri-lanka-route-without-the-rush.html',
    category: 'Itinerary planning',
    readTime: '9 min read',
    image: 'images/2.jpeg',
    alt: 'Scenic Sri Lankan hill country journey',
    excerpt: 'A flexible first-week framework that balances arrival recovery, heritage, hill country, and realistic travel times.',
    featured: 0,
    content: `
      <p>The first week sets the pace for an entire Sri Lanka journey. Trying to move directly from the airport through several major sights can turn an exciting arrival into a blur of roads and check-ins. A better approach is to recover first, travel in a logical direction, and let each base earn its place.</p>
      <h2>Night one: make arrival easy</h2>
      <p>After a long flight, choose accommodation that matches your arrival time rather than your wish list. A simple first night near the airport or in Colombo can be more valuable than beginning with a long drive. Eat, sleep, organise cash and connectivity, then start the route with clearer energy.</p>
      <h2>Days two and three: choose one cultural base</h2>
      <p>Instead of changing hotels between every heritage site, stay in one well-positioned base and make focused outings. Sigiriya, Dambulla, Polonnaruwa, and village landscapes offer more than can comfortably fit into two days, so select according to interest and mobility. Begin outdoor climbs early and reserve the hottest hours for lunch or rest.</p>
      <h2>Day four: travel toward Kandy with purpose</h2>
      <p>Use the transfer as part of the day. A garden, market, craft workshop, or carefully chosen food stop can break the drive. In Kandy, allow time beyond the headline temple: a lake walk, small cultural experience, or quiet evening can make the city feel less like a transit point.</p>
      <h2>Days five and six: slow down in the hills</h2>
      <p>The hill-country train is memorable, but the journey should not be treated as a race for a particular doorway photograph. Reserve seats when practical, carry water and a light layer, and keep luggage manageable. If rail plans change, a scenic road transfer can still be a rewarding part of the trip.</p>
      <p>Choose either a tea-country base or Ella depending on what you value. Tea estates and smaller hill towns suit travellers seeking quiet walks and cool evenings. Ella has more restaurants and social energy but can feel busier.</p>
      <div class="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100"><h3>Route design principle</h3><p>Do not add a destination only because it appears on a standard itinerary. Every additional stop costs packing time, check-in time, and energy. Keep it when the experience is worth that cost.</p></div>
      <h2>Day seven: pause or continue south</h2>
      <p>Use the seventh day as a buffer. Stay another night in the hills, move toward Udawalawe for wildlife, or continue to the coast if the journey is longer. A buffer absorbs weather, train changes, tiredness, and spontaneous discoveries without making the itinerary feel broken.</p>
      <h2>Adapt this framework</h2>
      <p>Families may need longer bases. Photographers may favour early starts and fewer locations. Travellers with limited mobility may exchange climbs for museums, gardens, and scenic drives. The strongest first week is not the one with the most pins on a map—it is the one that leaves you curious for week two.</p>`,
  },
  {
    id: 'guide-packing-sri-lanka',
    title: 'What to Pack for Sri Lanka: Coast, Hills, Temples, and Safari',
    slug: 'what-to-pack-for-sri-lanka.html',
    category: 'Practical advice',
    readTime: '7 min read',
    image: 'images/8.jpeg',
    alt: 'Sri Lankan coastal scenery',
    excerpt: 'A practical packing list for tropical heat, cool hill-country evenings, respectful temple visits, rain, and wildlife drives.',
    featured: 0,
    content: `
      <p>Packing for Sri Lanka is less about bringing more and more about covering several climates with a small number of useful layers. Coastal heat, air-conditioned transfers, cool hill-country evenings, sudden rain, temple etiquette, and dusty safari roads can all appear in one itinerary.</p>
      <h2>Build a lightweight clothing system</h2>
      <p>Choose breathable tops, loose trousers or skirts, and quick-drying fabrics. Add one light warm layer for higher elevations and cold air conditioning. A compact waterproof shell is more versatile than a heavy jacket. If laundry is available every few days, a modest capsule wardrobe is enough.</p>
      <h2>Pack specifically for temples</h2>
      <p>At many religious sites, shoulders and knees should be covered and footwear must be removed. Carry a lightweight scarf or overshirt and clothing that meets the dress requirement without feeling heavy. Socks can protect feet from hot stone, though local instructions should always be followed. Avoid posing with your back directly toward sacred images.</p>
      <h2>Footwear: keep it simple</h2>
      <p>One comfortable walking shoe and one easy-to-remove sandal usually cover most trips. Add dedicated hiking footwear only when the route genuinely includes demanding trails. New shoes should be broken in before travel. A small bag for dusty or wet footwear helps on transfer days.</p>
      <h2>Safari and nature essentials</h2>
      <ul><li>Binoculars, if you have them.</li><li>A brimmed hat and reliable sun protection.</li><li>A reusable water bottle.</li><li>Insect repellent suitable for you.</li><li>A light scarf for dust.</li><li>A dry bag or protective pouch for electronics.</li></ul>
      <p>Muted colours are practical for wildlife outings, but specialised safari clothing is unnecessary. Avoid flash around animals and secure loose items on uneven tracks.</p>
      <h2>Health and documents</h2>
      <p>Carry prescription medicine in original packaging, plus copies of prescriptions where appropriate. Bring travel-insurance details, passport copies, emergency contacts, and any personally required basic medicines. Health and entry requirements can change, so verify current advice with official sources before departure.</p>
      <div class="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-100"><h3>Keep in your day bag</h3><p>Water, sun protection, a modesty layer, tissues, hand sanitiser, a power bank, a small amount of cash, and a copy of your accommodation details cover most ordinary days.</p></div>
      <h2>Reduce disposable items</h2>
      <p>A refillable bottle, reusable tote, and compact toiletry containers reduce waste and are easy to carry. Decline unnecessary plastic where practical, but prioritise safe drinking water and personal health.</p>
      <h2>What not to bring</h2>
      <p>Leave excessive valuables, heavy formal clothing, and an overfilled schedule at home. Space in your bag makes transfers easier and leaves room for locally made textiles, tea, spices, or crafts purchased directly from small businesses.</p>`,
  },
];

const escapeHtml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function renderArticle(article) {
  const canonical = `${siteUrl}/${article.slug}`;
  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article', headline: article.title,
    description: article.excerpt, image: `${siteUrl}/${article.image}`,
    datePublished: publishedDate, dateModified: publishedDate, mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'TuskersEdge' },
    publisher: { '@type': 'Organization', name: 'TuskersEdge', logo: { '@type': 'ImageObject', url: `${siteUrl}/assets/brand-mark.svg` } },
  }).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${escapeHtml(article.excerpt)}" />
  <title>${escapeHtml(article.title)} | TuskersEdge Journal</title>
  <link rel="stylesheet" href="css/site.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(article.title)}" />
  <meta property="og:description" content="${escapeHtml(article.excerpt)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${siteUrl}/assets/tuskersedge-social-card.webp" />
  <meta property="og:image:alt" content="Sri Lanka travel with TuskersEdge" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(article.title)}" />
  <meta name="twitter:description" content="${escapeHtml(article.excerpt)}" />
  <meta name="twitter:image" content="${siteUrl}/assets/tuskersedge-social-card.webp" />
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  <link rel="manifest" href="site.webmanifest" />
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png" />
  <meta name="theme-color" content="#064e3b" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="TuskersEdge" />
  <script type="application/ld+json">${schema}</script>
</head>
<body class="bg-slate-50 font-body text-slate-800">
  <header class="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
      <a href="index.html" class="flex items-center gap-3"><img src="assets/favicon.svg" alt="" class="h-9 w-9" /><span class="font-heading text-xl text-jungle">TuskersEdge</span></a>
      <nav class="flex items-center gap-4 text-xs font-semibold text-slate-600 sm:text-sm"><a href="blog.html" class="hover:text-jungle">Journal</a><a href="tours.html" class="hover:text-jungle">Journeys</a><a href="contact.html" class="rounded-full bg-jungle px-4 py-2 text-white">Plan a trip</a></nav>
    </div>
  </header>
  <main>
    <article class="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-16">
      <a href="blog.html" class="text-xs font-semibold uppercase tracking-[0.2em] text-jungleLight">Back to journal</a>
      <p class="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">${escapeHtml(article.category)} · ${escapeHtml(article.readTime)}</p>
      <h1 class="mt-3 max-w-3xl font-heading text-4xl leading-tight text-jungle md:text-5xl">${escapeHtml(article.title)}</h1>
      <p class="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">${escapeHtml(article.excerpt)}</p>
      <img src="${article.image}" alt="${escapeHtml(article.alt)}" class="mt-8 h-64 w-full rounded-3xl object-cover shadow-sm md:h-96" />
      <div class="article-content mt-10 space-y-5 text-[0.98rem] leading-7 text-slate-700 [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:text-jungle [&_h3]:font-semibold [&_h3]:text-jungle [&_li]:ml-5 [&_li]:list-disc [&_li]:py-1">${article.content}</div>
      <section class="mt-12 rounded-3xl bg-jungle p-6 text-white md:flex md:items-center md:justify-between md:gap-8 md:p-8"><div><h2 class="font-heading text-2xl">Build this into your Sri Lanka journey</h2><p class="mt-2 max-w-xl text-sm leading-6 text-emerald-50">Share your dates, pace, and priorities. We will shape a practical route around the experiences that matter to you.</p></div><a href="contact.html" class="mt-5 inline-flex shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-jungle md:mt-0">Start planning</a></section>
    </article>
  </main>
  <footer class="border-t border-slate-200 bg-white"><div class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-6"><span>© <span id="year-span"></span> TuskersEdge. Sri Lanka journeys designed with care.</span><span><a href="privacy.html" class="hover:text-jungle">Privacy</a> · <a href="terms.html" class="hover:text-jungle">Terms</a> · <a href="image-credits.html" class="hover:text-jungle">Image credits</a></span></div></footer>
  <script>document.getElementById('year-span').textContent = new Date().getFullYear();</script>
  <script src="js/analytics.js" defer></script>
  <script src="js/pwa.js" defer></script>
</body>
</html>`;
}

const maxSort = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS value FROM blog_posts').get().value;
const upsert = db.prepare(`
  INSERT INTO blog_posts (id,title,category,url,image,read_time,excerpt,content_html,published,featured,sort_order)
  VALUES (@id,@title,@category,@slug,@image,@readTime,@excerpt,@content,1,@featured,@sortOrder)
  ON CONFLICT(id) DO UPDATE SET title=excluded.title,category=excluded.category,url=excluded.url,image=excluded.image,
    read_time=excluded.read_time,excerpt=excluded.excerpt,content_html=excluded.content_html,published=1,
    featured=excluded.featured,sort_order=excluded.sort_order
`);

for (const [index, article] of articles.entries()) {
  await fs.writeFile(path.join(root, article.slug), renderArticle(article), 'utf8');
  upsert.run({ ...article, sortOrder: maxSort + index + 1 });
}

const sitemapPath = path.join(root, 'sitemap.xml');
let sitemap = await fs.readFile(sitemapPath, 'utf8');
for (const article of articles) {
  if (!sitemap.includes(`<loc>${siteUrl}/${article.slug}</loc>`)) {
    sitemap = sitemap.replace('</urlset>', `  <url><loc>${siteUrl}/${article.slug}</loc><changefreq>monthly</changefreq><priority>${article.featured ? '0.8' : '0.6'}</priority></url>\n</urlset>`);
  }
}
await fs.writeFile(sitemapPath, sitemap, 'utf8');

const browserCheckPath = path.join(root, 'scripts', 'browser-check.js');
let browserCheck = await fs.readFile(browserCheckPath, 'utf8');
const marker = "'/tuskersedge.html'";
for (const article of articles) {
  const route = `'/` + article.slug + `'`;
  if (!browserCheck.includes(route)) browserCheck = browserCheck.replace(marker, `${route}, ${marker}`);
}
await fs.writeFile(browserCheckPath, browserCheck, 'utf8');

console.log(`Added ${articles.length} meaningful blog articles.`);
