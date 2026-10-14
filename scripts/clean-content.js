import { db } from '../lib/database.js';

const removeIds = {
  tours: ['tour-mmut3xfh', 'tour-mmrxnev7'],
  gallery: ['gallery-mmuulpip', 'gallery-mmuuatz7', 'gallery-mmuu0xdy', 'gallery-mmuswbdl'],
  blog: ['blog-mmuusv1k', 'blog-mmutqcmn', 'blog-mmut4ntf', 'blog-mmuswp5b', 'b-mmrxp0fm'],
};

const posts = [
  ['b1', '10 things to taste in Colombo', 'Food & culture', '10-things-to-taste-in-colombo.html', 'images/10.jpeg', '6 min read', 'A compact street-food guide to begin your Sri Lanka journey.'],
  ['b2', 'A slow 12-day Sri Lanka loop', 'Itinerary', 'a-slow-12-day-sri-lanka-loop.html', 'images/11.jpeg', '7 min read', 'A balanced first-time route with room to pause between highlights.'],
  ['b3', 'How to do Yala responsibly', 'Wildlife', 'how-to-do-yala-responsibly.html', 'images/31.jpeg', '5 min read', 'What to ask your safari operator before entering leopard country.'],
  ['b4', 'Booking the Kandy-Ella train', 'Travel tips', 'booking-the-kandy-ella-train.html', 'images/2.jpeg', '5 min read', 'Reserved and unreserved seats, timing, views, and practical planning.'],
  ['b5', '24 hours in Galle Fort', 'Places', '24-hours-in-galle-fort.html', 'images/8.jpeg', '4 min read', 'Coffee, ramparts, and a thoughtful day inside the historic fort.'],
  ['b6', 'Being a respectful guest in tea country', 'Responsible travel', 'being-a-respectful-guest-in-tea-country.html', 'images/37.jpeg', '5 min read', 'How to choose experiences that respect communities and working estates.'],
];

db.transaction(() => {
  const deleteTour = db.prepare('DELETE FROM tours WHERE id = ?');
  const deleteGallery = db.prepare('DELETE FROM gallery_images WHERE id = ?');
  const deleteBlog = db.prepare('DELETE FROM blog_posts WHERE id = ?');
  removeIds.tours.forEach((id) => deleteTour.run(id));
  removeIds.gallery.forEach((id) => deleteGallery.run(id));
  removeIds.blog.forEach((id) => deleteBlog.run(id));

  const upsert = db.prepare(`
    INSERT INTO blog_posts
      (id,title,category,url,image,read_time,excerpt,content_html,published,featured,sort_order)
    VALUES (?,?,?,?,?,?,?,'',1,?,?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, category=excluded.category, url=excluded.url, image=excluded.image,
      read_time=excluded.read_time, excerpt=excluded.excerpt, published=1,
      featured=excluded.featured, sort_order=excluded.sort_order
  `);
  posts.forEach((post, index) => upsert.run(...post, index < 3 ? 1 : 0, index + 1));
})();

db.close();
console.log('Removed synthetic records and restored six journal posts.');
