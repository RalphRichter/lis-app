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

      // Only show a real assigned image. Do not use generated fallback artwork in Admin.
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
    .admin-row.has-admin-thumb{
      grid-template-columns:minmax(0,1fr) auto 190px;
      min-height:150px;
      overflow:hidden;
    }
    .admin-thumb{
      width:190px;
      height:100%;
      min-height:122px;
      object-fit:cover;
      border-radius:15px;
      display:block;
      justify-self:end;
      align-self:stretch;
      box-shadow:inset 0 0 0 1px rgba(21,53,49,.08);
    }
    @media(max-width:760px){
      .admin-row.has-admin-thumb{
        grid-template-columns:minmax(0,1fr) minmax(180px,42%);
        grid-template-rows:auto auto;
        min-height:178px;
        align-items:stretch;
        column-gap:16px;
      }
      .admin-row.has-admin-thumb>div:first-child{
        grid-column:1;
        grid-row:1;
        align-self:start;
      }
      .admin-row.has-admin-thumb .admin-actions{
        grid-column:1;
        grid-row:2;
        align-self:end;
      }
      .admin-row.has-admin-thumb .admin-thumb{
        grid-column:2;
        grid-row:1/3;
        width:calc(100% + 10px);
        height:calc(100% + 16px);
        min-height:0;
        max-height:none;
        margin:-8px -10px -8px 0;
        border-radius:16px;
        align-self:stretch;
      }
    }
    @media(max-width:430px){
      .admin-row.has-admin-thumb{
        grid-template-columns:minmax(0,1fr) 40%;
        min-height:168px;
        column-gap:12px;
      }
      .admin-row.has-admin-thumb .admin-thumb{
        width:calc(100% + 8px);
        margin:-8px -8px -8px 0;
      }
    }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(applyAdminImages);
  observer.observe(adminList, { childList:true, subtree:true });
  applyAdminImages();
})();