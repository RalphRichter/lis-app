(() => {
  const cfg = window.LIS_APP_CONFIG || {};
  const ready = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const form = document.getElementById('editForm');
  if (!ready || !form) return;

  function value(id) { return document.getElementById(id)?.value || ''; }

  function editedRow() {
    const id = value('editId');
    if (!id) return null;
    const current = typeof state !== 'undefined' ? state.items.find(i => i.id === id) : null;
    const repeat = value('editRepeat') || 'none';
    const allDay = Boolean(document.getElementById('editAllDay')?.checked);
    const endDay = document.getElementById('editEndDay')?.value || value('editDay');
    return {
      id,
      date:value('editDay'),
      title:value('editTitle').trim() || current?.title || 'Untitled',
      type:value('editType') || current?.type || 'idea',
      category:value('editCategory').trim() || null,
      time:value('editTime').trim() || null,
      start_time:allDay ? null : (value('editStartTime') || null),
      end_time:allDay ? null : (value('editEndTime') || null),
      end_date:endDay || null,
      all_day:allDay,
      repeat,
      repeat_until:repeat === 'none' ? null : (value('editRepeatUntil') || null),
      location:value('editLocation').trim() || null,
      description:value('editDescription').trim() || null,
      price:value('editPrice').trim() || null,
      url:value('editUrl').trim() || null,
      created_by:current?.created_by || null,
      created_at:current?.created_at || new Date().toISOString(),
      updated_at:new Date().toISOString()
    };
  }

  async function saveToCloud(row) {
    await supabase('ideas?on_conflict=id', {
      method:'POST',
      headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify(row)
    });
  }

  form.addEventListener('submit', () => {
    const row = editedRow();
    if (!row) return;
    setTimeout(async () => {
      try {
        await saveToCloud(row);
        const overrides = typeof getOverrides === 'function' ? getOverrides() : {};
        if (overrides[row.id]) {
          delete overrides[row.id];
          if (typeof setOverrides === 'function') setOverrides(overrides);
        }
        if (typeof loadData === 'function') await loadData();
        if (typeof renderAll === 'function') renderAll();
      } catch (err) {
        console.error('Could not sync edited entry', err);
        alert('The entry was saved on this device, but could not be synchronized to Supabase. ' + err.message);
      }
    }, 0);
  });
})();