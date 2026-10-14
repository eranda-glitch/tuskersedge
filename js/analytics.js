(() => {
  const staticHostSuffixes = ['gamer.free', 'infinityfreeapp.com', 'epizy.com', 'rf.gd'];
  const hostname = window.location.hostname.toLowerCase();
  const isStaticHost = staticHostSuffixes.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
  );

  // InfinityFree does not run this project's Node API. Avoid its cross-origin 404 redirect.
  if (isStaticHost) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  const path = window.location.pathname || '/';
  if (path.includes('admin')) return;

  const body = JSON.stringify({ path });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/pageview', new Blob([body], { type: 'application/json' }));
    return;
  }

  fetch('/api/analytics/pageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
})();
