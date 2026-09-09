(() => {
  const style = document.createElement('style');
  style.textContent = `
    #adminList { display:grid; gap:10px; }
    .admin-swipe-row { position:relative; overflow:hidden; border-radius:16px; background:#f5f5f7; touch-action:pan-y; }
    .admin-swipe-delete { position:absolute; inset:0 0 0 auto; width:92px; border:0; background:#d92d20; color:#fff; font:inherit; font-weight:700; display:flex; align-items:center; justify-content:center; cursor:pointer; }
    .admin-swipe-content { position:relative; z-index:1; background:#fff; padding:10px 12px; border:1px solid rgba(0,0,0,.08); border-radius:16px; transition:transform .2s ease; cursor:pointer; user-select:none; -webkit-user-select:none; display:flex; gap:12px; align-items:center; }
    .admin-swipe-content.open { transform:translateX(-92px); }
    .admin-swipe-image { width:82px; height:72px; object-fit:cover; border-radius:12px; background:#eef1f0; display:block; flex:0 0 82px; order:2; }
    .admin-swipe-body { min-width:0; flex:1 1 auto; order:1; }
    .admin-swipe-title { margin:0 0 5px; font-size:1rem; }
    .admin-swipe-meta { font-size:.84rem; line-height:1.35; color:#686868; overflow-wrap:anywhere; }
    .admin-swipe-hint { font-size:.75rem; color:#8a8a8a; margin-top:5px; }
    @media (hover:hover) { .admin-swipe-content:hover { background:#fafafa; } }
  `;
  document.head.appendChild(style);

  const originalRenderAdmin = renderAdmin;
  const IMAGE_KEY = 'lis-entry-images';
  function imageMap() { try { return JSON.parse(localStorage.getItem(IMAGE_KEY) || '{}'); } catch (_) { return {}; } }

  function closeOthers(except) {
    document.querySelectorAll('.admin-swipe-content.open').forEach(el => {
      if (el !== except) el.classList.remove('open');
    });
  }

  renderAdmin = function() {
    if (!adminList) return originalRenderAdmin();
    adminList.innerHTML = '';
    const images = imageMap();
    const sorted = [...state.items].sort((a,b)=>a.date.localeCompare(b.date) || displayTime(a).localeCompare(displayTime(b)));

    for (const item of sorted) {
      const wrap = document.createElement('div');
      wrap.className = 'admin-swipe-row';

      const del = document.createElement('button');
      del.className = 'admin-swipe-delete';
      del.type = 'button';
      del.textContent = 'Delete';

      const content = document.createElement('div');
      content.className = 'admin-swipe-content';
      const repeat = repeatLabel(item) ? ` · ${repeatLabel(item)}${item.repeat_until ? ` until ${item.repeat_until}` : ''}` : '';
      const src = images[item.id] || item.image || '';
      const imageHtml = src ? `<img class="admin-swipe-image" alt="" src="${escapeAttr(src)}">` : '';
      content.innerHTML = `<div class="admin-swipe-body"><h3 class="admin-swipe-title">${escapeHtml(item.title)}</h3><div class="admin-swipe-meta">${escapeHtml(item.date)} · ${escapeHtml(item.type==='idea'?'Suggestion':'Overview')} · ${escapeHtml(displayTime(item))}${escapeHtml(repeat)} · ${escapeHtml(item.location||'No location')}</div><div class="admin-swipe-hint">Tap to edit · swipe left to delete</div></div>${imageHtml}`;
      const img = content.querySelector('.admin-swipe-image');
      if (img) img.onerror = () => img.remove();

      let startX = 0;
      let startY = 0;
      let moved = false;
      content.addEventListener('pointerdown', e => { startX=e.clientX; startY=e.clientY; moved=false; });
      content.addEventListener('pointermove', e => { const dx=e.clientX-startX, dy=e.clientY-startY; if(Math.abs(dx)>8 && Math.abs(dx)>Math.abs(dy)) moved=true; });
      content.addEventListener('pointerup', e => {
        const dx=e.clientX-startX, dy=e.clientY-startY;
        if(Math.abs(dx)>35 && Math.abs(dx)>Math.abs(dy)){ closeOthers(content); content.classList.toggle('open',dx<0); return; }
        if(!moved){ if(content.classList.contains('open')) content.classList.remove('open'); else openEdit(item); }
      });
      del.addEventListener('click', async e => { e.stopPropagation(); await deleteEntry(item); });
      wrap.append(del,content);
      adminList.appendChild(wrap);
    }
  };
})();
