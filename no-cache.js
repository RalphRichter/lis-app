(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = function(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const cfg = window.LIS_APP_CONFIG || {};
    if (cfg.SUPABASE_URL && url.startsWith(cfg.SUPABASE_URL)) {
      init = {
        ...init,
        cache:'no-store',
        headers:{
          ...(init.headers || {}),
          'Cache-Control':'no-cache',
          'Pragma':'no-cache'
        }
      };
    }
    return originalFetch(input, init);
  };
})();
