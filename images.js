(() => {
  const KEY = 'lis-entry-images';
  const imageMap = () => JSON.parse(localStorage.getItem(KEY) || '{}');
  const saveMap = (m) => localStorage.setItem(KEY, JSON.stringify(m));

  function fallbackImage(item) {
    const title = escapeXml(item.title || 'Lisbon');
    const category = escapeXml(item.category || 'Lisbon with Friends');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b2d2a"/><stop offset="0.58" stop-color="#315e56"/><stop offset="1" stop-color="#c9653b"/></linearGradient></defs>
      <rect width="900" height="600" fill="url(#g)"/><circle cx="750" cy="110" r="120" fill="#d7a94a" opacity=".35"/><path d="M0 430 C170 360 300 520 470 420 C630 330 730 420 900 350 L900 600 L0 600 Z" fill="#fff" opacity=".12"/>
      <text x="64" y="380" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700" opacity=".8">${category}</text>
      <foreignObject x="60" y="405" width="760" height="145"><div xmlns="http://www.w3.org/1999/xhtml" style="font:700 48px/1.05 Arial,Helvetica,sans-serif;color:white">${title}</div></foreignObject>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  function escapeXml(v='') { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])); }

  function applyImages(target, type) {
    const cards = [...target.querySelectorAll('.item-card')];
    let index = 0;
    const map = imageMap();
    for (const day of TRIP_DAYS) {
      let items = typeof itemsForDate === 'function' ? itemsForDate(day.date, type) : state.items.filter(i => i.date === day.date && i.type === type);
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

  function getImageValue(field) { return field?.dataset.localImage || field?.value.trim() || ''; }
  function setImageValue(field, value) {
    if (!field) return;
    if (value && value.startsWith('data:image/')) { field.dataset.localImage = value; field.value = ''; }
    else { delete field.dataset.localImage; field.value = value || ''; }
    updatePickerPreview(field);
  }
  async function imageFileToDataUrl(file) {
    if (!file || !file.type.startsWith('image/')) throw new Error('Please choose an image file.');
    const raw = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
    const img = await new Promise((resolve, reject) => { const el = new Image(); el.onload = () => resolve(el); el.onerror = reject; el.src = raw; });
    const max = 1600; const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  }
  function updatePickerPreview(field) {
    const picker = field?.closest('.image-picker'); if (!picker) return;
    const preview = picker.querySelector('.image-picker-preview'); const status = picker.querySelector('.image-picker-status'); const value = getImageValue(field);
    if (!value) { preview.hidden = true; preview.removeAttribute('src'); status.textContent = 'Optional · choose a photo, paste an image, or enter a URL.'; return; }
    preview.hidden = false; preview.src = value; status.textContent = field.dataset.localImage ? 'Photo selected from this device.' : 'Image URL selected.';
  }
  async function acceptImageFile(field, file) { try { const data = await imageFileToDataUrl(file); field.dataset.localImage = data; field.value = ''; updatePickerPreview(field); } catch (err) { alert(err.message || 'Could not read the image.'); } }
  async function pasteFromClipboard(field, pasteZone) {
    if (navigator.clipboard?.read) { try { const items = await navigator.clipboard.read(); for (const item of items) { const type = item.types.find(t => t.startsWith('image/')); if (type) { const blob = await item.getType(type); await acceptImageFile(field, new File([blob], 'clipboard-image', {type})); return; } } alert('No image was found in the clipboard.'); return; } catch (_) {} }
    pasteZone.focus(); pasteZone.textContent = 'Tap and hold here, then choose Paste';
  }
  function setupImagePicker(field) {
    if (!field || field.dataset.pickerReady) return; field.dataset.pickerReady = '1'; field.type = 'text'; field.placeholder = 'https://…';
    const label = field.closest('label'); if (!label) return; const textNode = [...label.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()); if (textNode) textNode.textContent = 'Image ';
    const picker = document.createElement('div'); picker.className = 'image-picker'; const actions = document.createElement('div'); actions.className = 'image-picker-actions';
    const chooseBtn = document.createElement('button'); chooseBtn.type = 'button'; chooseBtn.className = 'small-btn'; chooseBtn.textContent = '🖼️ Photo / File';
    const pasteBtn = document.createElement('button'); pasteBtn.type = 'button'; pasteBtn.className = 'small-btn'; pasteBtn.textContent = '📋 Paste';
    const clearBtn = document.createElement('button'); clearBtn.type = 'button'; clearBtn.className = 'small-btn'; clearBtn.textContent = '✕ Clear';
    const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/*'; file.className = 'image-file-input';
    const pasteZone = document.createElement('div'); pasteZone.className = 'image-paste-zone'; pasteZone.contentEditable = 'true'; pasteZone.setAttribute('role', 'textbox'); pasteZone.setAttribute('aria-label', 'Paste image here'); pasteZone.textContent = 'Or paste an image here';
    const preview = document.createElement('img'); preview.className = 'image-picker-preview'; preview.alt = 'Selected image preview'; preview.hidden = true;
    const status = document.createElement('div'); status.className = 'image-picker-status';
    actions.append(chooseBtn, pasteBtn, clearBtn); picker.append(actions, file, pasteZone, preview, status); field.before(picker); picker.append(field);
    chooseBtn.addEventListener('click', () => file.click()); file.addEventListener('change', () => { const selected = file.files?.[0]; if (selected) acceptImageFile(field, selected); file.value = ''; });
    pasteBtn.addEventListener('click', () => pasteFromClipboard(field, pasteZone)); pasteZone.addEventListener('paste', e => { const imgItem = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/')); if (!imgItem) return; e.preventDefault(); const blob = imgItem.getAsFile(); if (blob) acceptImageFile(field, blob); });
    pasteZone.addEventListener('input', () => { if (pasteZone.textContent && !pasteZone.querySelector('img')) pasteZone.textContent = 'Or paste an image here'; }); field.addEventListener('input', () => { if (field.value.trim()) delete field.dataset.localImage; updatePickerPreview(field); });
    clearBtn.addEventListener('click', () => { field.value = ''; delete field.dataset.localImage; updatePickerPreview(field); }); updatePickerPreview(field);
  }
  const style = document.createElement('style'); style.textContent = `.image-picker{display:grid;gap:9px;margin-top:2px}.image-picker-actions{display:flex;gap:7px;flex-wrap:wrap}.image-file-input{display:none}.image-paste-zone{min-height:48px;border:1px dashed var(--line);border-radius:13px;padding:12px;background:#fff;color:var(--muted);font-weight:500;outline:none;display:flex;align-items:center}.image-paste-zone:focus{border-color:#9eb6b0;box-shadow:0 0 0 3px rgba(49,94,86,.09)}.image-picker-preview{width:100%;max-height:240px;object-fit:cover;border-radius:14px;border:1px solid var(--line)}.image-picker-status{font-size:.72rem;color:var(--muted);font-weight:500}`; document.head.appendChild(style);
  setupImagePicker(document.getElementById('ideaImage')); setupImagePicker(document.getElementById('editImage'));

  const baseRenderDayCards = renderDayCards;
  renderDayCards = function(target, type) { baseRenderDayCards(target, type); applyImages(target, type); };
  const baseOpenEdit = openEdit;
  openEdit = function(item) { baseOpenEdit(item); const map = imageMap(); setImageValue(document.getElementById('editImage'), map[item.id] || item.image || ''); };

  document.getElementById('ideaForm')?.addEventListener('submit', () => {
    const field = document.getElementById('ideaImage'); const image = getImageValue(field); const title = document.getElementById('ideaTitle')?.value.trim() || ''; const date = document.getElementById('ideaDay')?.value || ''; if (!image) return;
    setTimeout(() => { const candidates = state.items.filter(i => i.title === title && i.date === date); const item = candidates[candidates.length - 1]; if (!item) return; const map = imageMap(); map[item.id] = image; saveMap(map); if (field) { field.value = ''; delete field.dataset.localImage; updatePickerPreview(field); } renderAll(); }, 0);
  }, true);
  document.getElementById('editForm')?.addEventListener('submit', () => {
    const id = document.getElementById('editId')?.value || ''; const field = document.getElementById('editImage'); const image = getImageValue(field); if (!id) return;
    const map = imageMap(); if (image) map[id] = image; else delete map[id]; saveMap(map); setTimeout(renderAll, 0);
  }, true);
})();
