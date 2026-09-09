(() => {
  const cfg = window.LIS_APP_CONFIG || {};
  const ready = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const adminHead = document.querySelector('.admin-head');
  const btn = document.getElementById('pushEntriesBtn');
  if (!adminHead || !btn) return;

  [...adminHead.querySelectorAll('button')].forEach(candidate => {
    if (candidate !== btn && /push entries/i.test(candidate.textContent || '')) candidate.remove();
  });

  document.querySelectorAll('#entrySyncStatus, .entry-sync-status').forEach((node,index) => { if(index) node.remove(); });
  let note = document.getElementById('entrySyncStatus');
  if (!note) {
    note = document.createElement('p');
    note.id = 'entrySyncStatus';
    note.className = 'muted entry-sync-status';
    note.style.margin = '0 0 14px';
    adminHead.insertAdjacentElement('afterend', note);
  }
  note.textContent = ready ? 'Supabase connected · database is the source of truth.' : 'Supabase is not configured.';

  function row(item) {
    return {
      id:item.id,
      date:item.date,
      title:item.title || 'Untitled',
      type:item.type || 'idea',
      category:item.category || null,
      time:item.time || null,
      start_time:item.start_time || null,
      end_time:item.end_time || null,
      end_date:item.end_date || null,
      all_day:Boolean(item.all_day),
      repeat:item.repeat || 'none',
      repeat_until:item.repeat_until || null,
      location:item.location || null,
      description:item.description || null,
      price:item.price || null,
      url:item.url || null,
      created_by:item.created_by || null,
      created_at:item.created_at || new Date().toISOString(),
      updated_at:new Date().toISOString()
    };
  }
  window.lisEntryRow = row;

  async function pushAll() {
    if (!ready) return alert('Supabase is not configured.');
    btn.disabled = true;
    btn.textContent = 'Pushing…';
    note.textContent = 'Uploading entries to Supabase…';
    try {
      await supabase('ideas?on_conflict=id', {
        method:'POST',
        headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
        body:JSON.stringify(state.items.map(row))
      });
      note.textContent = `${state.items.length} entries pushed to Supabase.`;
      btn.textContent = 'Pushed';
      setTimeout(() => btn.textContent = 'Push entries', 1600);
    } catch (err) {
      note.textContent = 'Push failed · check the Supabase setup.';
      alert('Could not push the entries. ' + err.message);
      btn.textContent = 'Push entries';
    } finally {
      btn.disabled = false;
    }
  }
  btn.addEventListener('click', pushAll);

  const originalLoadData = loadData;

  async function freshGet(path) {
    const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`, {
      method:'GET',
      cache:'no-store',
      headers:{
        apikey:cfg.SUPABASE_ANON_KEY,
        Authorization:`Bearer ${cfg.SUPABASE_ANON_KEY}`,
        Accept:'application/json',
        'Cache-Control':'no-cache'
      }
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  }

  async function loadFreshFromDatabase() {
    const [rows,votes] = await Promise.all([
      freshGet('ideas?select=*&order=date.asc,created_at.asc'),
      freshGet('votes?select=*')
    ]);
    state.items = (rows || []).map(item => ({...item,type:item.type || 'idea'}));
    state.votes = votes || [];
    localStorage.removeItem('lis-admin-overrides');
    localStorage.removeItem('lis-admin-hidden');
    saveLocal();
    return state.items.length;
  }

  loadData = async function() {
    if (!ready) return originalLoadData();
    try {
      await loadFreshFromDatabase();
    } catch (err) {
      console.warn('Could not load fresh entries from Supabase.', err);
      note.textContent = 'Could not refresh entries from Supabase.';
      // Keep the currently rendered data instead of blanking the app.
      if (!state.items.length) return originalLoadData();
    }
  };

  const refreshBtn = document.getElementById('refreshEntriesBtn');
  async function refreshFromDatabase() {
    if (!ready) return alert('Supabase is not configured.');
    if (!refreshBtn) return;
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing…';
    note.textContent = 'Loading entries from Supabase…';
    try {
      const count = await loadFreshFromDatabase();
      renderAll();
      note.textContent = `${count} entries loaded from Supabase.`;
      refreshBtn.textContent = 'Updated';
      setTimeout(() => refreshBtn.textContent = 'Update from database', 1600);
    } catch (err) {
      note.textContent = 'Database refresh failed.';
      alert('Could not load the entries from Supabase. ' + err.message);
      refreshBtn.textContent = 'Update from database';
    } finally {
      refreshBtn.disabled = false;
    }
  }
  refreshBtn?.addEventListener('click', refreshFromDatabase);

  async function refreshOnPageShow() {
    if (!ready) return;
    try {
      const count = await loadFreshFromDatabase();
      renderAll();
      note.textContent = `${count} entries loaded fresh from Supabase.`;
    } catch (err) {
      console.warn('Fresh page load from Supabase failed.', err);
      if (!state.items.length) {
        await originalLoadData();
        renderAll();
      }
    }
  }

  if (ready) setTimeout(refreshOnPageShow, 0);
  window.addEventListener('pageshow', refreshOnPageShow);
})();