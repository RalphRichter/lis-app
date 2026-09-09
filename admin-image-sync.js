(() => {
  const config = window.LIS_APP_CONFIG || {};
  const ready = Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
  const adminHead = document.querySelector('.admin-head');
  const addBtn = document.getElementById('adminAddBtn');
  if (!adminHead) return;

  function dedupeEntries() {
    if (typeof state === 'undefined' || !Array.isArray(state.items)) return;
    const merged = new Map();
    for (const item of state.items) {
      const existing = merged.get(item.id);
      if (!existing) {
        merged.set(item.id, item);
        continue;
      }
      const seed = typeof seedItems !== 'undefined' ? seedItems.find(s => s.id === item.id) : null;
      merged.set(item.id, {
        ...(seed || existing),
        ...existing,
        ...item,
        type: item.type || existing.type || seed?.type || 'idea'
      });
    }
    state.items = [...merged.values()];
  }

  if (typeof renderAll === 'function') {
    const baseRenderAll = renderAll;
    renderAll = function() {
      dedupeEntries();
      return baseRenderAll();
    };
    setTimeout(() => renderAll(), 200);
  }

  let btn = document.getElementById('pushPicturesBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'pushPicturesBtn';
    btn.type = 'button';
    btn.className = 'primary-btn';
    btn.textContent = 'Push pictures';
    if (addBtn) addBtn.insertAdjacentElement('beforebegin', btn);
    else adminHead.appendChild(btn);
  }

  let status = document.getElementById('pictureSyncStatus');
  if (!status) {
    status = document.createElement('p');
    status.id = 'pictureSyncStatus';
    status.className = 'muted';
    status.style.margin = '0 0 14px';
    adminHead.insertAdjacentElement('afterend', status);
  }
  status.textContent = ready ? 'Pictures saved on this device can be uploaded to Supabase.' : 'Supabase is not configured.';

  function headers(extra={}) {
    return { apikey:config.SUPABASE_ANON_KEY, Authorization:`Bearer ${config.SUPABASE_ANON_KEY}`, ...extra };
  }
  function localImages() {
    try { return JSON.parse(localStorage.getItem('lis-entry-images') || '{}'); }
    catch (_) { return {}; }
  }
  function saveLocalImages(map) { localStorage.setItem('lis-entry-images', JSON.stringify(map)); }

  async function upsertRecord(entryId, imageUrl) {
    const res = await fetch(`${config.SUPABASE_URL}/rest/v1/entry_images?on_conflict=entry_id`, {
      method:'POST',
      headers:headers({'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=minimal'}),
      body:JSON.stringify({entry_id:entryId,image_url:imageUrl,updated_at:new Date().toISOString()})
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function uploadDataUrl(entryId, dataUrl) {
    const blob = await (await fetch(dataUrl)).blob();
    const objectName = `${entryId}.jpg`;
    const res = await fetch(`${config.SUPABASE_URL}/storage/v1/object/entry-images/${encodeURIComponent(objectName)}`, {
      method:'POST',
      headers:headers({'Content-Type':blob.type || 'image/jpeg','x-upsert':'true'}),
      body:blob
    });
    if (!res.ok) throw new Error(await res.text());
    return `${config.SUPABASE_URL}/storage/v1/object/public/entry-images/${encodeURIComponent(objectName)}?v=${Date.now()}`;
  }

  async function pushPictures() {
    if (!ready) return alert('Supabase is not configured.');
    const map = localImages();
    const entries = Object.entries(map).filter(([,v]) => typeof v === 'string' && v);
    if (!entries.length) {
      status.textContent = 'No pictures are stored on this device.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Uploading…';
    let uploaded = 0, linked = 0, failed = 0;

    for (const [entryId,value] of entries) {
      try {
        let shared = value;
        if (value.startsWith('data:image/')) {
          shared = await uploadDataUrl(entryId,value);
          map[entryId] = shared;
          uploaded++;
        }
        if (/^https?:\/\//i.test(shared)) {
          await upsertRecord(entryId,shared);
          linked++;
        }
      } catch (err) {
        console.warn('Picture sync failed',entryId,err);
        failed++;
      }
    }

    saveLocalImages(map);
    status.textContent = failed
      ? `${linked} pictures linked, ${uploaded} uploaded, ${failed} failed.`
      : `${linked} pictures are now shared in Supabase (${uploaded} uploaded from this device).`;
    btn.textContent = failed ? 'Push pictures' : 'Pictures pushed';
    btn.disabled = false;
    setTimeout(() => { if (!failed) btn.textContent = 'Push pictures'; }, 1800);
    if (typeof renderAll === 'function') renderAll();
  }

  btn.addEventListener('click', pushPictures);
})();
