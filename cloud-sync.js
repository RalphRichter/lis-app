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
  note.textContent = ready ? 'Supabase connected · use Push entries to share the current list.' : 'Supabase is not configured.';

  function row(item) {
    return {
      id:item.id,
      date:item.date,
      title:item.title || 'Untitled',
      category:item.category || null,
      time:item.time || null,
      location:item.location || null,
      description:item.description || null,
      price:item.price || null,
      url:item.url || null,
      created_by:item.created_by || null,
      created_at:item.created_at || new Date().toISOString()
    };
  }

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
  loadData = async function() {
    if (!ready) return originalLoadData();
    try {
      const [rows,votes] = await Promise.all([
        supabase('ideas?select=*&order=date.asc,created_at.asc'),
        supabase('votes?select=*')
      ]);
      const map = new Map(structuredClone(seedItems).map(x => [x.id,x]));
      for (const item of rows || []) {
        const existing = map.get(item.id);
        map.set(item.id,{...existing,...item,type:existing?.type || 'idea'});
      }
      state.items = [...map.values()];
      state.votes = votes || [];
      saveLocal();
    } catch (err) {
      console.warn('Shared entries unavailable; using local fallback.',err);
      return originalLoadData();
    }
  };

  if (ready) setTimeout(() => loadData().then(renderAll),100);
})();