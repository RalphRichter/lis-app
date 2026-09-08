(() => {
  const cfg = window.LIS_APP_CONFIG || {};
  const HAS_SUPABASE = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const btn = document.getElementById('notifyBtn');
  const POLL_MS = 15000;
  let pollTimer = null;
  let initialized = false;
  let seenIdeaIds = new Set();
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
    const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`, { headers: headers() });
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
      return;
    }
    const enabled = localStorage.getItem('lis-notifications-enabled') === '1' && Notification.permission === 'granted';
    btn.textContent = enabled ? '🔔 Notifications on' : '🔔 Notifications';
  }

  async function registerWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      swReg = await navigator.serviceWorker.register('./sw.js');
      return swReg;
    } catch (err) {
      console.warn('Service worker registration failed', err);
      return null;
    }
  }

  async function showNotification(title, body) {
    if (Notification.permission !== 'granted') return;
    const options = {
      body,
      tag: `lis-${Date.now()}-${Math.random()}`,
      renotify: false,
      data: { url: './#suggestions' }
    };
    try {
      const reg = swReg || await navigator.serviceWorker?.ready;
      if (reg?.showNotification) {
        await reg.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    } catch (err) {
      console.warn('Notification failed', err);
    }
  }

  async function pollChanges() {
    if (!HAS_SUPABASE || Notification.permission !== 'granted') return;
    try {
      const [ideas, votes] = await Promise.all([
        rest('ideas?select=id,title,created_by,created_at&order=created_at.desc&limit=40'),
        rest('votes?select=id,idea_id,user_name,created_at&order=created_at.desc&limit=80')
      ]);

      if (!initialized) {
        seenIdeaIds = new Set((ideas || []).map(x => String(x.id)));
        seenVoteIds = new Set((votes || []).map(x => String(x.id)));
        initialized = true;
        return;
      }

      const me = currentName();
      for (const idea of [...(ideas || [])].reverse()) {
        const id = String(idea.id);
        if (seenIdeaIds.has(id)) continue;
        seenIdeaIds.add(id);
        if ((idea.created_by || '').trim() === me) continue;
        const who = idea.created_by ? `${idea.created_by} added a new suggestion` : 'New suggestion added';
        await showNotification('Lisbon with Friends', `${who}: ${idea.title}`);
      }

      for (const vote of [...(votes || [])].reverse()) {
        const id = String(vote.id);
        if (seenVoteIds.has(id)) continue;
        seenVoteIds.add(id);
        if ((vote.user_name || '').trim() === me) continue;
        const matchingIdea = (ideas || []).find(i => String(i.id) === String(vote.idea_id));
        const label = matchingIdea?.title || 'a suggestion';
        await showNotification('New vote', `${vote.user_name || 'Someone'} liked ${label}`);
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
      alert('Shared notifications are ready in the app, but they need the shared Supabase backend to detect votes and new entries from other people.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('lis-notifications-enabled', '1');
      await registerWorker();
      initialized = false;
      startPolling();
    }
    updateButton();
  }

  btn?.addEventListener('click', enableNotifications);

  if (location.hash === '#suggestions') {
    setTimeout(() => document.querySelector('[data-tab="suggestions"]')?.click(), 0);
  }

  updateButton();
  registerWorker().then(() => {
    if (localStorage.getItem('lis-notifications-enabled') === '1' && Notification.permission === 'granted') {
      startPolling();
    }
  });
})();
