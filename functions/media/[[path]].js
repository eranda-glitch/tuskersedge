export async function onRequestGet({ params, env }) {
  if (!env.BUCKET) return new Response('Storage is not configured', { status: 503 });
  const key = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  const object = await env.BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
