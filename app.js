const cfg = window.LIS_APP_CONFIG || {};
const HAS_SUPABASE = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
const TZ = 'Europe/Lisbon';

const TRIP_DAYS = [
  { date:'2026-09-08', label:'Tuesday', title:'Arrival in Lisbon' },
  { date:'2026-09-09', label:'Wednesday', title:'Apple Event & Dinner' },
  { date:'2026-09-10', label:'Thursday', title:'Belém & an easy evening' },
  { date:'2026-09-11', label:'Friday', title:'Choose your Friday night' },
  { date:'2026-09-12', label:'Saturday', title:'Full day together' },
  { date:'2026-09-13', label:'Sunday', title:'Departure' },
];

const seedItems = [
  { id:'fixed-arrival-ralph', date:'2026-09-08', type:'fixed', title:'Ralph · STR → ZRH → LIS', category:'Travel', time:'18:21 → 22:34', description:'Lisbon local time · SWISS via Zurich. Late arrival in Lisbon.', location:'Lisbon Airport' },
  { id:'fixed-arrival-stani', date:'2026-09-08', type:'fixed', title:'Stani · ZRH → GVA → LIS', category:'Travel', time:'08:18 → 13:15', description:'Lisbon local time · SWISS via Geneva. Meet in Lisbon.', location:'Lisbon' },
  { id:'fixed-hotel', date:'2026-09-08', type:'fixed', title:'Hyatt Regency Lisbon', category:'Hotel', time:'Check-in from 15:00', description:'Home base for the trip in Belém.', location:'R. da Junqueira 65, Lisboa' },

  { id:'fixed-work-wed', date:'2026-09-09', type:'fixed', title:'Ralph · HotelOffice', category:'Work', time:'08:00–17:00', description:'Lisbon local time.', location:'Hyatt Regency Lisbon' },
  { id:'fixed-esra-wed', date:'2026-09-09', type:'fixed', title:'Stani · ESRA Congress', category:'Congress', time:'Daytime', description:'ESRA congress programme.', location:'Lisbon' },
  { id:'apple-event', date:'2026-09-09', type:'fixed', title:'Watch the Apple Event', category:'Tech', time:'Evening', description:'Ralph plans to watch the Apple Event.', location:'Hyatt Regency Lisbon' },
  { id:'oficio', date:'2026-09-09', type:'idea', title:'Dinner at Ofício', category:'Food & Drink', time:'Evening', description:'Michelin-listed, contemporary Portuguese cuisine. Dinner for four.', location:'Rua Nova da Trindade 11K, Lisboa', price:'€€' },
  { id:'suba', date:'2026-09-09', type:'idea', title:'Dinner at SUBA', category:'Food & Drink', time:'Evening', description:'Elegant dinner with panoramic views over Lisbon and the Tagus.', location:'Travessa da Portuguesa 53, Lisboa', price:'€€€' },

  { id:'fixed-work-thu', date:'2026-09-10', type:'fixed', title:'Ralph · HotelOffice', category:'Work', time:'08:00–17:00', description:'Lisbon local time.', location:'Hyatt Regency Lisbon' },
  { id:'fixed-esra-thu', date:'2026-09-10', type:'fixed', title:'Stani · ESRA Congress', category:'Congress', time:'Daytime', description:'ESRA congress programme.', location:'Lisbon' },
  { id:'belem-vasco', date:'2026-09-10', type:'idea', title:'Belém · Vasco da Gama evening', category:'Culture', time:'After 17:00', description:'Jerónimos area, Padrão dos Descobrimentos and a walk along the Tagus.', location:'Belém, Lisboa' },
  { id:'picadeiro', date:'2026-09-10', type:'idea', title:'Picadeiro Fest', category:'Music', time:'Late afternoon / evening', description:'Free live music in Chiado.', location:'Largo do Picadeiro, Lisboa', price:'Free' },

  { id:'fixed-work-fri', date:'2026-09-11', type:'fixed', title:'Ralph · HotelOffice', category:'Work', time:'08:00–17:00', description:'Lisbon local time.', location:'Hyatt Regency Lisbon' },
  { id:'fixed-esra-fri', date:'2026-09-11', type:'fixed', title:'Stani · ESRA Congress', category:'Congress', time:'Daytime', description:'ESRA congress programme.', location:'Lisbon' },
  { id:'sailing', date:'2026-09-11', type:'idea', title:'Sunset sailing on the Tagus', category:'Outdoors', time:'~18:30–20:30', description:'Small sailing boat or catamaran, drinks & snacks, then dinner on land.', location:'Belém, Lisboa', price:'Max €150 pp' },
  { id:'tram-graça', date:'2026-09-11', type:'idea', title:'Tram 28 + Graça / Alfama', category:'Food & Drink', time:'Evening', description:'Historic tram, viewpoints over the Tagus and dinner with a view.', location:'Graça, Lisboa' },
  { id:'caixa-alfama', date:'2026-09-11', type:'idea', title:'Caixa Alfama', category:'Music', time:'Evening', description:'Fado festival across several venues in Alfama.', location:'Alfama, Lisboa' },

  { id:'cascais', date:'2026-09-12', type:'idea', title:'Cascais day trip', category:'Day Trip', time:'Daytime', description:'Old town, waterfront, Boca do Inferno and optionally Guincho.', location:'Cascais, Portugal' },
  { id:'fonseca', date:'2026-09-12', type:'idea', title:'José Maria da Fonseca · Azeitão', category:'Food & Drink', time:'Daytime', description:'Casa-Museu, wine tasting and possibly Wine Corner.', location:'Rua José Augusto Coelho 11-13, Azeitão, Portugal' },
  { id:'mariza', date:'2026-09-12', type:'idea', title:'Mariza · Festa na Praça', category:'Music', time:'20:00', description:'Free open-air concert at Praça do Comércio.', location:'Praça do Comércio, Lisboa', price:'Free' },

  { id:'checkout', date:'2026-09-13', type:'fixed', title:'Hyatt checkout', category:'Hotel', time:'11:00', description:'Check out of Hyatt Regency Lisbon.', location:'Hyatt Regency Lisbon' },
  { id:'return', date:'2026-09-13', type:'fixed', title:'Return flights', category:'Travel', time:'From early morning', description:'Ralph and Stani return on different routings.', location:'Lisbon Airport' },
];

let state = {
  name: localStorage.getItem('lis-name') || '',
  activeTab: 'overview',
  suggestionFilter: 'all',
  items: [],
  votes: [],
};

const overviewDays = document.getElementById('overviewDays');
const suggestionDays = document.getElementById('suggestionDays');
const adminList = document.getElementById('adminList');
const profileBtn = document.getElementById('profileBtn');
const profileName = document.getElementById('profileName');
const profileDialog = document.getElementById('profileDialog');
const nameInput = document.getElementById('nameInput');
const ideaDialog = document.getElementById('ideaDialog');
const ideaDay = document.getElementById('ideaDay');
const editDialog = document.getElementById('editDialog');
const editDay = document.getElementById('editDay');

function headers(extra={}) {
  return { apikey:cfg.SUPABASE_ANON_KEY, Authorization:`Bearer ${cfg.SUPABASE_ANON_KEY}`, 'Content-Type':'application/json', ...extra };
}
async function supabase(path, options={}) {
  const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`, { ...options, headers:headers(options.headers || {}) });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
function localData(){ return JSON.parse(localStorage.getItem('lis-data') || 'null'); }
function saveLocal(){ localStorage.setItem('lis-data', JSON.stringify({items:state.items, votes:state.votes})); }
function getOverrides(){ return JSON.parse(localStorage.getItem('lis-admin-overrides') || '{}'); }
function setOverrides(v){ localStorage.setItem('lis-admin-overrides', JSON.stringify(v)); }
function getHidden(){ return JSON.parse(localStorage.getItem('lis-admin-hidden') || '[]'); }
function setHidden(v){ localStorage.setItem('lis-admin-hidden', JSON.stringify(v)); }
function applyAdminChanges(items){
  const overrides = getOverrides();
  const hidden = new Set(getHidden());
  return items.filter(i => !hidden.has(i.id)).map(i => overrides[i.id] ? {...i, ...overrides[i.id]} : i);
}

async function loadData(){
  let items;
  if (HAS_SUPABASE) {
    try {
      const [ideas,votes] = await Promise.all([
        supabase('ideas?select=*&order=date.asc,created_at.asc'),
        supabase('votes?select=*')
      ]);
      items = [...structuredClone(seedItems), ...(ideas || []).map(i => ({...i,type:'idea'}))];
      state.votes = votes || [];
      state.items = applyAdminChanges(items);
      return;
    } catch(err) {
      console.warn('Supabase unavailable; using local fallback.', err);
    }
  }
  const data = localData();
  const custom = data ? (data.items || []).filter(x => !seedItems.some(s => s.id === x.id)) : [];
  items = [...structuredClone(seedItems), ...custom];
  state.items = applyAdminChanges(items);
  state.votes = data?.votes || [];
  saveLocal();
}

function ensureName(){ if(state.name) return true; profileDialog.showModal(); return false; }
function voteCount(id){ return state.votes.filter(v => v.idea_id === id).length; }
function voters(id){ return state.votes.filter(v => v.idea_id === id).map(v => v.user_name); }
function hasVoted(id){ return state.votes.some(v => v.idea_id === id && v.user_name === state.name); }

async function toggleVote(item){
  if(!ensureName()) return;
  const existing = state.votes.find(v => v.idea_id === item.id && v.user_name === state.name);
  if(HAS_SUPABASE){
    try {
      if(existing) await supabase(`votes?idea_id=eq.${encodeURIComponent(item.id)}&user_name=eq.${encodeURIComponent(state.name)}`, {method:'DELETE',headers:{Prefer:'return=minimal'}});
      else await supabase('votes', {method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({idea_id:item.id,user_name:state.name})});
      await loadData();
    } catch(err){ alert('Could not save the vote. '+err.message); return; }
  } else {
    if(existing) state.votes = state.votes.filter(v => !(v.idea_id===item.id && v.user_name===state.name));
    else state.votes.push({idea_id:item.id,user_name:state.name,created_at:new Date().toISOString()});
    saveLocal();
  }
  renderAll();
}

function appleMapsUrl(location){ return `https://maps.apple.com/?q=${encodeURIComponent(location)}`; }
function dayLabel(day){ return `${day.label} · ${new Date(day.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',timeZone:TZ})}`; }
function isWeekday(date){ const d=new Date(date+'T12:00:00Z').getUTCDay(); return d>=1 && d<=5; }
function occursOn(item,date){
  if(item.date===date) return true;
  if(!item.repeat || item.repeat==='none' || date<item.date) return false;
  const until=item.repeat_until || TRIP_DAYS[TRIP_DAYS.length-1].date;
  if(date>until) return false;
  if(item.repeat==='daily') return true;
  if(item.repeat==='weekdays') return isWeekday(date);
  return false;
}
function itemsForDate(date,type){
  return state.items.filter(i => i.type===type && occursOn(i,date)).map(i => i.date===date ? i : {...i,date,_recurringOccurrence:true});
}
function displayTime(item){
  if(item.start_time){ return item.end_time ? `${item.start_time}–${item.end_time}` : item.start_time; }
  return item.time || 'Flexible';
}
function repeatLabel(item){
  if(item.repeat==='daily') return '↻ Daily';
  if(item.repeat==='weekdays') return '↻ Weekdays';
  return '';
}

function renderDayCards(target, type){
  target.innerHTML = '';
  for(const day of TRIP_DAYS){
    let items = itemsForDate(day.date,type);
    if(type==='idea' && state.suggestionFilter==='liked') items.sort((a,b)=>voteCount(b.id)-voteCount(a.id));
    if(!items.length) continue;

    const node = document.getElementById('dayTemplate').content.cloneNode(true);
    node.querySelector('.day-date').textContent = dayLabel(day);
    node.querySelector('.day-title').textContent = day.title;
    node.querySelector('.count-pill').textContent = type==='idea' ? `${items.length} suggestions` : `${items.length} entries`;
    const box = node.querySelector('.items');

    for(const item of items){
      const iNode = document.getElementById('itemTemplate').content.cloneNode(true);
      const root = iNode.querySelector('.item-card');
      root.classList.add(item.type);
      root.dataset.itemId=item.id;
      root.dataset.itemDate=item.date;
      iNode.querySelector('.category-chip').textContent = item.category || (item.type==='idea'?'Suggestion':'Overview');
      iNode.querySelector('.time-chip').textContent = displayTime(item);
      iNode.querySelector('.item-title').textContent = item.title;
      iNode.querySelector('.item-description').textContent = item.description || '';

      const meta = iNode.querySelector('.meta-row');
      if(item.location) meta.insertAdjacentHTML('beforeend', `<a class="map-link" href="${escapeAttr(appleMapsUrl(item.location))}" target="_blank" rel="noopener">📍 ${escapeHtml(item.location)} ↗</a>`);
      if(item.price) meta.insertAdjacentHTML('beforeend', `<span>💶 ${escapeHtml(item.price)}</span>`);
      if(item.created_by) meta.insertAdjacentHTML('beforeend', `<span>＋ ${escapeHtml(item.created_by)}</span>`);
      if(repeatLabel(item)) meta.insertAdjacentHTML('beforeend', `<span>${escapeHtml(repeatLabel(item))}${item.repeat_until ? ` · until ${escapeHtml(item.repeat_until)}` : ''}</span>`);
      if(item.type==='idea'){
        if(item.url) meta.insertAdjacentHTML('beforeend', `<a class="url-line" href="${escapeAttr(item.url)}" target="_blank" rel="noopener">URL: ${escapeHtml(item.url)} ↗</a>`);
        else meta.insertAdjacentHTML('beforeend', `<span class="url-line">URL: —</span>`);
      } else if(item.url){
        meta.insertAdjacentHTML('beforeend', `<a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">Open link ↗</a>`);
      }

      if(item.type==='idea'){
        const btn = iNode.querySelector('.vote-btn');
        btn.querySelector('.vote-count').textContent = voteCount(item.id);
        if(hasVoted(item.id)) btn.classList.add('liked');
        btn.addEventListener('click', ()=>toggleVote(item));
        const names = voters(item.id);
        iNode.querySelector('.voters').textContent = names.length ? names.join(' · ') : 'Be first to vote';
      }
      box.appendChild(iNode);
    }
    target.appendChild(node);
  }
}

function renderAdmin(){
  adminList.innerHTML = '';
  const sorted = [...state.items].sort((a,b)=>a.date.localeCompare(b.date) || displayTime(a).localeCompare(displayTime(b)));
  for(const item of sorted){
    const row = document.createElement('div');
    row.className = 'admin-row';
    const repeat = repeatLabel(item) ? ` · ${repeatLabel(item)}${item.repeat_until ? ` until ${item.repeat_until}` : ''}` : '';
    row.innerHTML = `<div><h3>${escapeHtml(item.title)}</h3><div class="admin-meta">${escapeHtml(item.date)} · ${escapeHtml(item.type==='idea'?'Suggestion':'Overview')} · ${escapeHtml(displayTime(item))}${escapeHtml(repeat)} · ${escapeHtml(item.location||'No location')}</div></div><div class="admin-actions"><button class="small-btn edit-entry">Edit</button><button class="small-btn danger delete-entry">Delete</button></div>`;
    row.querySelector('.edit-entry').addEventListener('click', ()=>openEdit(item));
    row.querySelector('.delete-entry').addEventListener('click', ()=>deleteEntry(item));
    adminList.appendChild(row);
  }
}

function renderTabs(){
  document.querySelectorAll('.main-tab').forEach(btn=>btn.classList.toggle('active', btn.dataset.tab===state.activeTab));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById(`${state.activeTab}Panel`).classList.add('active');
}
function renderAll(){
  profileName.textContent = state.name || 'Choose name';
  renderTabs();
  renderDayCards(overviewDays,'fixed');
  renderDayCards(suggestionDays,'idea');
  renderAdmin();
}
function escapeHtml(v=''){ const d=document.createElement('div'); d.textContent=v; return d.innerHTML; }
function escapeAttr(v=''){ return String(v).replace(/"/g,'&quot;'); }

function populateDaySelect(select){
  select.innerHTML = '';
  TRIP_DAYS.forEach(d=>{ const opt=document.createElement('option'); opt.value=d.date; opt.textContent=`${d.label}, ${new Date(d.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:TZ})}`; select.appendChild(opt); });
}
populateDaySelect(ideaDay);
populateDaySelect(editDay);

document.querySelectorAll('.main-tab').forEach(btn=>btn.addEventListener('click',()=>{ state.activeTab=btn.dataset.tab; renderTabs(); }));
document.getElementById('suggestionFilterBar').addEventListener('click',(e)=>{ const btn=e.target.closest('[data-sfilter]'); if(!btn)return; state.suggestionFilter=btn.dataset.sfilter; document.querySelectorAll('[data-sfilter]').forEach(x=>x.classList.toggle('active',x===btn)); renderDayCards(suggestionDays,'idea'); });

profileBtn.addEventListener('click',()=>{ nameInput.value=state.name; profileDialog.showModal(); });
document.getElementById('profileForm').addEventListener('submit',(e)=>{ const value=nameInput.value.trim(); if(!value){e.preventDefault();return;} state.name=value; localStorage.setItem('lis-name',value); profileName.textContent=value; });
document.getElementById('addIdeaBtn').addEventListener('click',()=>{ if(!ensureName())return; ideaDialog.showModal(); });
document.getElementById('adminAddBtn').addEventListener('click',()=>{ if(!ensureName())return; ideaDialog.showModal(); });

document.getElementById('ideaForm').addEventListener('submit', async(e)=>{
  const title=document.getElementById('ideaTitle').value.trim();
  if(!title){e.preventDefault();return;}
  const item={
    id:crypto.randomUUID(), type:'idea', title, date:ideaDay.value,
    category:document.getElementById('ideaCategory').value,
    time:document.getElementById('ideaTime').value.trim(),
    location:document.getElementById('ideaLocation').value.trim(),
    description:document.getElementById('ideaDescription').value.trim(),
    price:document.getElementById('ideaPrice').value.trim(),
    url:document.getElementById('ideaUrl').value.trim(),
    created_by:state.name, created_at:new Date().toISOString(),
  };
  if(HAS_SUPABASE){
    try{ await supabase('ideas',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(item)}); await loadData(); }
    catch(err){e.preventDefault();alert('Could not save the idea. '+err.message);return;}
  } else { state.items.push(item); saveLocal(); }
  e.target.reset(); state.activeTab='suggestions'; renderAll();
});

function openEdit(item){
  document.getElementById('editId').value=item.id;
  document.getElementById('editTitle').value=item.title||'';
  editDay.value=item.date;
  document.getElementById('editType').value=item.type||'idea';
  document.getElementById('editCategory').value=item.category||'';
  document.getElementById('editTime').value=item.time||'';
  document.getElementById('editStartTime').value=item.start_time||'';
  document.getElementById('editEndTime').value=item.end_time||'';
  document.getElementById('editRepeat').value=item.repeat||'none';
  document.getElementById('editRepeatUntil').value=item.repeat_until||'';
  document.getElementById('editPrice').value=item.price||'';
  document.getElementById('editLocation').value=item.location||'';
  document.getElementById('editDescription').value=item.description||'';
  document.getElementById('editUrl').value=item.url||'';
  editDialog.showModal();
}

document.getElementById('editRepeat').addEventListener('change',e=>{
  const until=document.getElementById('editRepeatUntil');
  if(e.target.value==='none') until.value='';
  else if(!until.value) until.value=TRIP_DAYS[TRIP_DAYS.length-1].date;
});

document.getElementById('editForm').addEventListener('submit', async(e)=>{
  const id=document.getElementById('editId').value;
  const current=state.items.find(i=>i.id===id);
  if(!current) return;
  const repeat=document.getElementById('editRepeat').value;
  const startTime=document.getElementById('editStartTime').value;
  const endTime=document.getElementById('editEndTime').value;
  const updated={
    ...current,
    title:document.getElementById('editTitle').value.trim(),
    date:editDay.value,
    type:document.getElementById('editType').value,
    category:document.getElementById('editCategory').value.trim(),
    time:document.getElementById('editTime').value.trim(),
    start_time:startTime,
    end_time:endTime,
    repeat,
    repeat_until:repeat==='none' ? '' : (document.getElementById('editRepeatUntil').value || TRIP_DAYS[TRIP_DAYS.length-1].date),
    price:document.getElementById('editPrice').value.trim(),
    location:document.getElementById('editLocation').value.trim(),
    description:document.getElementById('editDescription').value.trim(),
    url:document.getElementById('editUrl').value.trim(),
  };

  const isSeed=seedItems.some(s=>s.id===id);
  if(HAS_SUPABASE && !isSeed && current.type==='idea'){
    try{
      const payload={date:updated.date,title:updated.title,category:updated.category,time:updated.time,location:updated.location,description:updated.description,price:updated.price,url:updated.url,created_by:updated.created_by};
      await supabase(`ideas?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(payload)});
      const overrides=getOverrides(); overrides[id]=updated; setOverrides(overrides);
      await loadData();
    } catch(err){e.preventDefault();alert('Could not update the entry. '+err.message);return;}
  } else {
    const overrides=getOverrides(); overrides[id]=updated; setOverrides(overrides);
    state.items=state.items.map(i=>i.id===id?updated:i); saveLocal();
  }
  renderAll();
});

async function deleteEntry(item){
  if(!confirm(`Delete “${item.title}”?`)) return;
  const isSeed=seedItems.some(s=>s.id===item.id);
  if(HAS_SUPABASE && !isSeed && item.type==='idea'){
    try{ await supabase(`ideas?id=eq.${encodeURIComponent(item.id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}}); await loadData(); }
    catch(err){alert('Could not delete the entry. '+err.message);return;}
  } else {
    const hidden=getHidden(); if(!hidden.includes(item.id)) hidden.push(item.id); setHidden(hidden);
    state.items=state.items.filter(i=>i.id!==item.id); saveLocal();
  }
  renderAll();
}

loadData().then(renderAll);
