(() => {
  const cfg = window.LIS_APP_CONFIG || {};
  const ready = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && cfg.VAPID_PUBLIC_KEY);
  const btn = document.getElementById('notifyBtn');
  let swReg = null;

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }
  function isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  function currentName() {
    return (localStorage.getItem('lis-name') || '').trim();
  }
  function currentUserId() {
    return (localStorage.getItem('lis-user-id') || '').trim() || null;
  }
  function headers(extra = {}) {
    return {
      apikey: cfg.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...extra
    };
  }
  async function rest(path, options = {}) {
    const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: headers(options.headers || {}),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(await res.text());
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  function urlBase64ToUint8Array(value) {
    const padding = '='.repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(ch => ch.charCodeAt(0)));
  }
  async function registerWorker() {
    if (!('serviceWorker' in navigator)) return null;
    swReg = await navigator.serviceWorker.register('./sw.js?v=3', { scope: './' });
    await navigator.serviceWorker.ready;
    return swReg;
  }
  async function currentSubscription() {
    const reg = swReg || await registerWorker();
    return reg?.pushManager?.getSubscription() || null;
  }
  async function saveSubscription(subscription) {
    const json = subscription.toJSON();
    await rest('rpc/register_push_subscription', {
      method: 'POST',
      body: JSON.stringify({
        p_endpoint: subscription.endpoint,
        p_p256dh: json.keys?.p256dh || '',
        p_auth: json.keys?.auth || '',
        p_user_id: currentUserId(),
        p_user_name: currentName() || null,
        p_user_agent: navigator.userAgent
      })
    });
  }
  async function removeSubscription(subscription) {
    if (!subscription) return;
    try {
      await rest('rpc/unregister_push_subscription', {
        method: 'POST',
        body: JSON.stringify({ p_endpoint: subscription.endpoint })
      });
    } catch (err) {
      console.warn('Could not remove push subscription from Supabase.', err);
    }
    try { await subscription.unsubscribe(); } catch (_) {}
  }
  async function updateButton() {
    if (!btn) return;
    if (isIOS() && !isStandalone()) {
      btn.textContent = '📲 Add to Home Screen';
      btn.disabled = false;
      return;
    }
    if (!('Notification' in window) || !('PushManager' in window) || !('serviceWorker' in navigator)) {
      btn.textContent = '🔕 Not supported';
      btn.disabled = true;
      return;
    }
    if (Notification.permission === 'denied') {
      btn.textContent = '🔕 Notifications blocked';
      btn.disabled = false;
      return;
    }
    try {
      const sub = await currentSubscription();
      btn.textContent = sub && Notification.permission === 'granted' ? '🔔 Notifications on' : '🔔 Notifications';
    } catch (_) {
      btn.textContent = '🔔 Notifications';
    }
  }
  async function enableNotifications() {
    if (isIOS() && !isStandalone()) {
      alert('On iPhone, open this page in Safari, tap Share, choose “Add to Home Screen”, then launch Lisbon with Friends from the Home Screen and enable notifications there.');
      return;
    }
    if (!ready) {
      alert('Web Push is not fully configured yet.');
      return;
    }
    if (!('Notification' in window) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') {
      alert('Notifications are blocked. Please enable them for Lisbon with Friends in iPhone Settings.');
      return;
    }
    const existing = await currentSubscription();
    if (existing && Notification.permission === 'granted') {
      if (confirm('Notifications are enabled. Turn them off on this device?')) {
        await removeSubscription(existing);
        localStorage.removeItem('lis-notifications-enabled');
      }
      await updateButton();
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      await updateButton();
      return;
    }
    try {
      const reg = swReg || await registerWorker();
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cfg.VAPID_PUBLIC_KEY)
      });
      await saveSubscription(subscription);
      localStorage.setItem('lis-notifications-enabled', '1');
      await reg.showNotification('Lisbon with Friends', {
        body: 'Push notifications are enabled on this device.',
        tag: 'lis-push-enabled',
        data: { url: './#overview' }
      });
    } catch (err) {
      console.error('Push setup failed', err);
      alert('Could not enable push notifications. ' + err.message);
    }
    await updateButton();
  }

  btn?.addEventListener('click', enableNotifications);

  if (location.hash === '#suggestions') {
    setTimeout(() => document.querySelector('[data-tab="suggestions"]')?.click(), 0);
  } else if (location.hash === '#overview') {
    setTimeout(() => document.querySelector('[data-tab="overview"]')?.click(), 0);
  }

  registerWorker().then(async () => {
    const sub = await currentSubscription();
    if (sub && Notification.permission === 'granted') {
      try { await saveSubscription(sub); } catch (err) { console.warn('Could not refresh push subscription.', err); }
    }
    updateButton();
  }).catch(err => {
    console.warn('Service worker registration failed', err);
    updateButton();
  });
})();
