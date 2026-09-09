(() => {
  const cfg = window.LIS_APP_CONFIG || {};
  const HAS_SUPABASE = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const btn = document.getElementById('notifyBtn');
  const POLL_MS = 15000;
  let pollTimer = null;
  let initialized = false;
  let seenEntryIds = new Set();
  let seenVoteIds = new Set();
  let swReg = null;

  function currentName() {
    return (localStorage.getItem('lis-name') || '').trim();
  }

  function headers() {
    return {
      apikey: cfg.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  async function rest(path) {
    const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`, {
      headers: headers(),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function updateButton() {
    if (!btn) return;
    if (!('Notification' in window)) {
      btn.textContent = '🔕 Not supported';
      btn.disabled = true;
      return;
    }
    if (Notification.permission === 'denied') {
      btn.textContent = '🔕 Notifications blocked';
      btn.disabled = false;
      return;
    }
    const enabled = localStorage.getItem('lis-notifications-enabled') === '1' && Notification.permission === 'granted';
    btn.textContent = enabled ? '🔔 Notifications on' : '🔔 Notifications';
  }

  async function registerWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      swReg = await navigator.serviceWorker.register('./sw.js?v=2');
      return swReg;
    } catch (err) {
      console.warn('Service worker registration failed', err);
      return null;
    }
  }

  async function showNotification(title, body, hash = '#overview') {
    if (Notification.permission !== 'granted') return;
    const options = {
      body,
      tag: `lis-${Date.now()}-${Math.random()}`,
      renotify: false,
      data: { url: `./${hash}` }
    };
    try {
      const reg = swReg || await navigator.serviceWorker?.ready;
      if (reg?.showNotification) await reg.showNotification(title, options);
      else new Notification(title, options);
    } catch (err) {
      console.warn('Notification failed', err);
    }
  }

  function voteEntryId(vote) {
    return vote.entry_id || vote.idea_id || '';
  }

  async function pollChanges() {
    if (!HAS_SUPABASE || Notification.permission !== 'granted') return;
    try {
      const [entries, votes] = await Promise.all([
        rest('ideas?select=id,title,type,created_by,created_at,updated_at&order=created_at.desc&limit=80'),
        rest('votes?select=*&order=created_at.desc&limit=120')
      ]);

      if (!initialized) {
        seenEntryIds = new Set((entries || []).map(x => String(x.id)));
        seenVoteIds = new Set((votes || []).map(x => String(x.id)));
        initialized = true;
        return;
      }

      const me = currentName();
      for (const entry of [...(entries || [])].reverse()) {
        const id = String(entry.id);
        if (seenEntryIds.has(id)) continue;
        seenEntryIds.add(id);
        if ((entry.created_by || '').trim() === me) continue;
        const who = entry.created_by ? `${entry.created_by} added an entry` : 'A new entry was added';
        const hash = entry.type === 'idea' ? '#suggestions' : '#overview';
        await showNotification('Lisbon with Friends', `${who}: ${entry.title}`, hash);
      }

      for (const vote of [...(votes || [])].reverse()) {
        const id = String(vote.id);
        if (seenVoteIds.has(id)) continue;
        seenVoteIds.add(id);
        if ((vote.user_name || '').trim() === me) continue;
        const entryId = String(voteEntryId(vote));
        const matchingEntry = (entries || []).find(i => String(i.id) === entryId);
        const label = matchingEntry?.title || 'an entry';
        await showNotification('New vote', `${vote.user_name || 'Someone'} liked ${label}`, '#suggestions');
      }
    } catch (err) {
      console.warn('Notification polling failed', err);
    }
  }

  function startPolling() {
    if (!HAS_SUPABASE || pollTimer) return;
    pollChanges();
    pollTimer = setInterval(pollChanges, POLL_MS);
  }

  async function enableNotifications() {
    if (!('Notification' in window)) return;
    if (!HAS_SUPABASE) {
      alert('Supabase is required for shared notifications.');
      return;
    }
    if (Notification.permission === 'denied') {
      alert('Notifications are blocked for this site. Please enable them in your browser or device settings.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('lis-notifications-enabled', '1');
      await registerWorker();
      initialized = false;
      startPolling();
      await showNotification('Lisbon with Friends', 'Notifications are enabled.');
    }
    updateButton();
  }

  btn?.addEventListener('click', enableNotifications);

  if (location.hash === '#suggestions') {
    setTimeout(() => document.querySelector('[data-tab="suggestions"]')?.click(), 0);
  } else if (location.hash === '#overview') {
    setTimeout(() => document.querySelector('[data-tab="overview"]')?.click(), 0);
  }

  updateButton();
  registerWorker().then(() => {
    if (localStorage.getItem('lis-notifications-enabled') === '1' && Notification.permission === 'granted') {
      startPolling();
    }
  });
})();