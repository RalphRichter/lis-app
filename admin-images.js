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
  style.id = 'admin-image-layout-v4';
  style.textContent = `
    /* All Admin cards use one consistent height, independent of whether an image exists. */
    #adminList .admin-row{
      position:relative !important;
      display:block !important;
      height:140px !important;
      min-height:140px !important;
      padding:16px !important;
      overflow:hidden !important;
    }
    #adminList .admin-row>div:first-child{
      min-width:0;
      position:relative;
      z-index:1;
      padding-right:0;
    }
    #adminList .admin-row .admin-meta{
      display:-webkit-box;
      -webkit-line-clamp:2;
      -webkit-box-orient:vertical;
      overflow:hidden;
    }
    #adminList .admin-row .admin-actions{
      position:absolute;
      left:16px;
      bottom:14px;
      z-index:2;
      display:flex;
      gap:8px;
      flex-wrap:wrap;
    }

    #adminList .admin-row.has-admin-thumb{
      padding-right:142px !important;
    }
    #adminList .admin-row.has-admin-thumb .admin-thumb{
      position:absolute !important;
      top:10px !important;
      right:10px !important;
      width:120px !important;
      height:120px !important;
      aspect-ratio:1 / 1 !important;
      object-fit:cover !important;
      border-radius:16px !important;
      display:block !important;
      margin:0 !important;
    }

    @media(max-width:760px){
      #adminList .admin-row{
        height:132px !important;
        min-height:132px !important;
        padding:14px !important;
      }
      #adminList .admin-row .admin-actions{
        left:14px;
        bottom:12px;
      }
      #adminList .admin-row.has-admin-thumb{
        padding-right:132px !important;
      }
      #adminList .admin-row.has-admin-thumb .admin-thumb{
        top:10px !important;
        right:10px !important;
        width:112px !important;
        height:112px !important;
      }
    }

    @media(max-width:430px){
      #adminList .admin-row{
        height:132px !important;
        min-height:132px !important;
      }
      #adminList .admin-row.has-admin-thumb{
        padding-right:126px !important;
      }
      #adminList .admin-row.has-admin-thumb .admin-thumb{
        width:108px !important;
        height:108px !important;
        top:12px !important;
        right:10px !important;
      }
    }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(applyAdminImages);
  observer.observe(adminList, { childList:true, subtree:true });
  applyAdminImages();
})();