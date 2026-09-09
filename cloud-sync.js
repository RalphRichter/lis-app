(() => {
  const cfg = window.LIS_APP_CONFIG || {};
  const ready = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const adminHead = document.querySelector('.admin-head');
  const addBtn = document.getElementById('adminAddBtn');
  if (!adminHead || !addBtn) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ghost-btn';
  btn.textContent = '☁️ Push entries';
  addBtn.insertAdjacentElement('beforebegin', btn);

  const note = document.createElement('p');
  note.className = 'muted';
  note.style.margin = '0 0 14px';
  note.textContent = ready ? 'Supabase connected · use Push entries once to make the current list shared.' : 'Supabase is not configured.';
  adminHead.insertAdjacentElement('afterend', note);

  function row(item) {
    return {
      id:item.id,
      date:item.date,
      type:item.type || 'idea',
      title:item.title || 'Untitled',
      category:item.category || null,
      time:item.time || null,
      start_time:item.start_time || null,
      end_time:item.end_time || null,
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

  async function pushAll() {
    if (!ready) return alert('Supabase is not configured.');
    btn.disabled = true;
    btn.textContent = '☁️ Pushing…';
    note.textContent = 'Uploading entries to Supabase…';
    try {
      await supabase('ideas?on_conflict=id', {
        method:'POST',
        headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
        body:JSON.stringify(state.items.map(row))
      });
      note.textContent = `${state.items.length} entries pushed to Supabase.`;
      btn.textContent = '✓ Pushed';
      setTimeout(() => btn.textContent = '☁️ Push entries', 1600);
    } catch (err) {
      note.textContent = 'Push failed · run the latest supabase.sql and try again.';
      alert('Could not push the entries. ' + err.message);
      btn.textContent = '☁️ Push entries';
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
      for (const item of rows || []) map.set(item.id,{...map.get(item.id),...item,type:item.type || map.get(item.id)?.type || 'idea'});
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
