(() => {
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch((error) => {
        console.warn('App offline support could not start:', error);
      });
    });
  }

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isMobileOrTablet = window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
  if (isStandalone || !isMobileOrTablet || sessionStorage.getItem('pwa-install-dismissed') === '1') return;

  let installPrompt = null;
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const showBanner = () => {
    if (document.getElementById('pwa-install-banner')) return;
    const banner = document.createElement('aside');
    banner.id = 'pwa-install-banner';
    banner.setAttribute('aria-label', 'Install TuskersEdge app');
    banner.className = 'fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-md rounded-2xl border border-white/20 bg-jungle p-3 text-white shadow-2xl';
    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="assets/icon-192.png" alt="" class="h-12 w-12 rounded-xl bg-white" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold">Use TuskersEdge like an app</p>
          <p class="mt-0.5 text-[0.7rem] leading-4 text-emerald-100">${isiOS ? 'Tap Share, then Add to Home Screen.' : 'Install for quick access and basic offline support.'}</p>
        </div>
        ${isiOS ? '' : '<button type="button" id="pwa-install-action" class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-jungle">Install</button>'}
        <button type="button" id="pwa-install-close" class="rounded-full p-2 text-emerald-100 hover:bg-white/10" aria-label="Dismiss app install message">&#10005;</button>
      </div>`;
    document.body.appendChild(banner);

    document.getElementById('pwa-install-close')?.addEventListener('click', () => {
      sessionStorage.setItem('pwa-install-dismissed', '1');
      banner.remove();
    });
    document.getElementById('pwa-install-action')?.addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      banner.remove();
    });
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    showBanner();
  });

  if (isiOS) window.setTimeout(showBanner, 1800);
})();
