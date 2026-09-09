(() => {
  const KEY = 'lis-entry-images';
  const adminList = document.getElementById('adminList');
  if (!adminList) return;

  function imageMap() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function sortedItems() {
    if (typeof state === 'undefined' || !Array.isArray(state.items)) return [];
    return [...state.items].sort((a,b) => {
      const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
      if (dateCompare) return dateCompare;
      const aTime = typeof displayTime === 'function' ? displayTime(a) : (a.time || '');
      const bTime = typeof displayTime === 'function' ? displayTime(b) : (b.time || '');
      return String(aTime).localeCompare(String(bTime));
    });
  }

  function applyAdminImages() {
    const rows = [...adminList.querySelectorAll('.admin-row')];
    const items = sortedItems();
    const map = imageMap();

    rows.forEach((row, index) => {
      if (row.querySelector('.admin-thumb')) return;
      const item = items[index];
      if (!item) return;

      // Only show a real assigned image. Do not use the generated fallback artwork here.
      const src = map[item.id] || item.image || '';
      if (!src) return;

      const img = document.createElement('img');
      img.className = 'admin-thumb';
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        row.classList.remove('has-admin-thumb');
        img.remove();
      }, { once:true });

      row.classList.add('has-admin-thumb');
      row.appendChild(img);
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .admin-row.has-admin-thumb{grid-template-columns:1fr auto 54px}
    .admin-thumb{width:54px;height:54px;object-fit:cover;border-radius:11px;display:block;justify-self:end;box-shadow:inset 0 0 0 1px rgba(21,53,49,.08)}
    @media(max-width:760px){
      .admin-row.has-admin-thumb{grid-template-columns:1fr 54px;align-items:center}
      .admin-row.has-admin-thumb>div:first-child{grid-column:1;grid-row:1}
      .admin-row.has-admin-thumb .admin-actions{grid-column:1;grid-row:2}
      .admin-row.has-admin-thumb .admin-thumb{grid-column:2;grid-row:1/3;align-self:center}
    }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(applyAdminImages);
  observer.observe(adminList, { childList:true, subtree:true });
  applyAdminImages();
})();