(() => {
  const KEY = 'lis-entry-images';
  const imageMap = () => JSON.parse(localStorage.getItem(KEY) || '{}');
  const saveMap = (m) => localStorage.setItem(KEY, JSON.stringify(m));

  function fallbackImage(item) {
    const title = escapeXml(item.title || 'Lisbon');
    const category = escapeXml(item.category || 'Lisbon with Friends');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b2d2a"/>
          <stop offset="0.58" stop-color="#315e56"/>
          <stop offset="1" stop-color="#c9653b"/>
        </linearGradient>
      </defs>
      <rect width="900" height="600" fill="url(#g)"/>
      <circle cx="750" cy="110" r="120" fill="#d7a94a" opacity=".35"/>
      <path d="M0 430 C170 360 300 520 470 420 C630 330 730 420 900 350 L900 600 L0 600 Z" fill="#fff" opacity=".12"/>
      <text x="64" y="380" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700" opacity=".8">${category}</text>
      <foreignObject x="60" y="405" width="760" height="145"><div xmlns="http://www.w3.org/1999/xhtml" style="font:700 48px/1.05 Arial,Helvetica,sans-serif;color:white">${title}</div></foreignObject>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function escapeXml(v='') {
    return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  }

  function applyImages(target, type) {
    const cards = [...target.querySelectorAll('.item-card')];
    let index = 0;
    const map = imageMap();
    for (const day of TRIP_DAYS) {
      let items = state.items.filter(i => i.date === day.date && i.type === type);
      if (type === 'idea' && state.suggestionFilter === 'liked') items.sort((a,b) => voteCount(b.id) - voteCount(a.id));
      for (const item of items) {
        const card = cards[index++];
        if (!card) continue;
        const img = card.querySelector('.item-image');
        if (!img) continue;
        img.src = map[item.id] || item.image || fallbackImage(item);
        img.alt = item.title || 'Trip entry';
        img.onerror = () => { img.onerror = null; img.src = fallbackImage(item); };
      }
    }
  }

  const baseRenderDayCards = renderDayCards;
  renderDayCards = function(target, type) {
    baseRenderDayCards(target, type);
    applyImages(target, type);
  };

  const baseOpenEdit = openEdit;
  openEdit = function(item) {
    baseOpenEdit(item);
    const map = imageMap();
    const field = document.getElementById('editImage');
    if (field) field.value = map[item.id] || item.image || '';
  };

  document.getElementById('ideaForm')?.addEventListener('submit', (e) => {
    const image = document.getElementById('ideaImage')?.value.trim() || '';
    const title = document.getElementById('ideaTitle')?.value.trim() || '';
    const date = document.getElementById('ideaDay')?.value || '';
    if (!image) return;
    setTimeout(() => {
      const candidates = state.items.filter(i => i.title === title && i.date === date);
      const item = candidates[candidates.length - 1];
      if (!item) return;
      const map = imageMap(); map[item.id] = image; saveMap(map); renderAll();
    }, 0);
  }, true);

  document.getElementById('editForm')?.addEventListener('submit', () => {
    const id = document.getElementById('editId')?.value || '';
    const image = document.getElementById('editImage')?.value.trim() || '';
    if (!id) return;
    const map = imageMap();
    if (image) map[id] = image; else delete map[id];
    saveMap(map);
    setTimeout(renderAll, 0);
  }, true);
})();
