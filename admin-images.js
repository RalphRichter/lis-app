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
      const item = items[index];
      if (!item) return;
      const src = map[item.id] || item.image || '';
      const existing = row.querySelector('.admin-thumb');

      if (!src) {
        if (existing) existing.remove();
        row.classList.remove('has-admin-thumb');
        return;
      }
      if (existing) return;

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
  style.id = 'admin-image-layout-v3';
  style.textContent = `
    .admin-row.has-admin-thumb{
      position:relative !important;
      display:block !important;
      min-height:190px !important;
      padding:18px 46% 18px 18px !important;
      overflow:hidden !important;
    }
    .admin-row.has-admin-thumb>div:first-child{
      min-width:0;
      position:relative;
      z-index:1;
    }
    .admin-row.has-admin-thumb .admin-actions{
      position:absolute;
      left:18px;
      bottom:18px;
      z-index:2;
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      max-width:calc(54% - 28px);
    }
    .admin-row.has-admin-thumb .admin-thumb{
      position:absolute !important;
      top:8px !important;
      right:8px !important;
      bottom:8px !important;
      width:42% !important;
      height:auto !important;
      object-fit:cover !important;
      border-radius:16px !important;
      display:block !important;
      margin:0 !important;
    }
    @media(max-width:760px){
      .admin-row.has-admin-thumb{
        min-height:210px !important;
        padding:18px 47% 18px 18px !important;
      }
      .admin-row.has-admin-thumb .admin-thumb{
        width:43% !important;
      }
      .admin-row.has-admin-thumb .admin-actions{
        max-width:calc(53% - 28px);
      }
    }
    @media(max-width:430px){
      .admin-row.has-admin-thumb{
        min-height:196px !important;
        padding-right:46% !important;
      }
      .admin-row.has-admin-thumb .admin-thumb{
        width:42% !important;
      }
    }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(applyAdminImages);
  observer.observe(adminList, { childList:true, subtree:true });
  applyAdminImages();
})();