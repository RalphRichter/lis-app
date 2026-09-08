const cfg = window.LIS_APP_CONFIG || {};
const HAS_SUPABASE = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

const TRIP_DAYS = [
  { date: '2026-09-08', label: 'Tuesday', title: 'Arrival in Lisbon' },
  { date: '2026-09-09', label: 'Wednesday', title: 'Apple Event & Dinner' },
  { date: '2026-09-10', label: 'Thursday', title: 'Belém & an easy evening' },
  { date: '2026-09-11', label: 'Friday', title: 'Choose your Friday night' },
  { date: '2026-09-12', label: 'Saturday', title: 'Full day together' },
  { date: '2026-09-13', label: 'Sunday', title: 'Departure' },
];

const seedItems = [
  { id:'fixed-arrival-ralph', date:'2026-09-08', type:'fixed', title:'Ralph · STR → ZRH → LIS', category:'Travel', time:'18:21 → 22:34', description:'Lisbon local time · SWISS via Zurich. Late arrival in Lisbon.', location:'Lisbon Airport' },
  { id:'fixed-arrival-stani', date:'2026-09-08', type:'fixed', title:'Stani · ZRH → GVA → LIS', category:'Travel', time:'08:18 → 13:15', description:'Lisbon local time · SWISS via Geneva. Meet in Lisbon.', location:'Lisbon' },
  { id:'fixed-hotel', date:'2026-09-08', type:'fixed', title:'Hyatt Regency Lisbon', category:'Hotel', time:'Check-in from 15:00', description:'Home base for the trip in Belém.', location:'R. da Junqueira 65, Lisboa' },

  { id:'fixed-work-wed', date:'2026-09-09', type:'fixed', title:'Ralph · HotelOffice', category:'Work', time:'08:00–17:00', description:'Lisbon local time.', location:'Hyatt Regency Lisbon' },
  { id:'fixed-esra-wed', date:'2026-09-09', type:'fixed', title:'Stani · ESRA Congress', category:'Congress', time:'Daytime', description:'ESRA congress programme.', location:'Lisbon' },
  { id:'apple-event', date:'2026-09-09', type:'fixed', title:'Watch the Apple Event', category:'Tech', time:'Evening', description:'Ralph plans to watch the Apple Event.', location:'Hyatt Regency Lisbon' },
  { id:'oficio', date:'2026-09-09', type:'idea', title:'Dinner at Ofício', category:'Food & Drink', time:'Evening', description:'Michelin-listed, contemporary Portuguese cuisine. Dinner for four.', location:'Chiado', price:'€€' },
  { id:'suba', date:'2026-09-09', type:'idea', title:'Dinner at SUBA', category:'Food & Drink', time:'Evening', description:'Elegant dinner with panoramic views over Lisbon and the Tagus.', location:'Santa Catarina', price:'€€€' },

  { id:'fixed-work-thu', date:'2026-09-10', type:'fixed', title:'Ralph · HotelOffice', category:'Work', time:'08:00–17:00', description:'Lisbon local time.', location:'Hyatt Regency Lisbon' },
  { id:'fixed-esra-thu', date:'2026-09-10', type:'fixed', title:'Stani · ESRA Congress', category:'Congress', time:'Daytime', description:'ESRA congress programme.', location:'Lisbon' },
  { id:'belem-vasco', date:'2026-09-10', type:'idea', title:'Belém · Vasco da Gama evening', category:'Culture', time:'After 17:00', description:'Jerónimos area, Padrão dos Descobrimentos and a walk along the Tagus.', location:'Belém' },
  { id:'picadeiro', date:'2026-09-10', type:'idea', title:'Picadeiro Fest', category:'Music', time:'Late afternoon / evening', description:'Free live music in Chiado.', location:'Chiado', price:'Free' },

  { id:'fixed-work-fri', date:'2026-09-11', type:'fixed', title:'Ralph · HotelOffice', category:'Work', time:'08:00–17:00', description:'Lisbon local time.', location:'Hyatt Regency Lisbon' },
  { id:'fixed-esra-fri', date:'2026-09-11', type:'fixed', title:'Stani · ESRA Congress', category:'Congress', time:'Daytime', description:'ESRA congress programme.', location:'Lisbon' },
  { id:'sailing', date:'2026-09-11', type:'idea', title:'Sunset sailing on the Tagus', category:'Outdoors', time:'~18:30–20:30', description:'Small sailing boat or catamaran, drinks & snacks, then dinner on land.', location:'Tagus / Belém', price:'Max €150 pp' },
  { id:'tram-graça', date:'2026-09-11', type:'idea', title:'Tram 28 + Graça / Alfama', category:'Food & Drink', time:'Evening', description:'Historic tram, viewpoints over the Tagus and dinner with a view.', location:'Graça / Alfama' },
  { id:'caixa-alfama', date:'2026-09-11', type:'idea', title:'Caixa Alfama', category:'Music', time:'Evening', description:'Fado festival across several venues in Alfama.', location:'Alfama' },

  { id:'cascais', date:'2026-09-12', type:'idea', title:'Cascais day trip', category:'Day Trip', time:'Daytime', description:'Old town, waterfront, Boca do Inferno and optionally Guincho.', location:'Cascais' },
  { id:'fonseca', date:'2026-09-12', type:'idea', title:'José Maria da Fonseca · Azeitão', category:'Food & Drink', time:'Daytime', description:'Casa-Museu, wine tasting and possibly Wine Corner.', location:'Azeitão' },
  { id:'mariza', date:'2026-09-12', type:'idea', title:'Mariza · Festa na Praça', category:'Music', time:'20:00', description:'Free open-air concert at Praça do Comércio.', location:'Praça do Comércio', price:'Free' },

  { id:'checkout', date:'2026-09-13', type:'fixed', title:'Hyatt checkout', category:'Hotel', time:'11:00', description:'Check out of Hyatt Regency Lisbon.', location:'Belém' },
  { id:'return', date:'2026-09-13', type:'fixed', title:'Return flights', category:'Travel', time:'From early morning', description:'Ralph and Stani return on different routings.', location:'Lisbon Airport' },
];

let state = { name: localStorage.getItem('lis-name') || '', filter: 'all', items: [], votes: [] };
const daysEl = document.getElementById('days');
const profileBtn = document.getElementById('profileBtn');
const profileName = document.getElementById('profileName');
const profileDialog = document.getElementById('profileDialog');
const nameInput = document.getElementById('nameInput');
const ideaDialog = document.getElementById('ideaDialog');
const ideaDay = document.getElementById('ideaDay');

function headers(extra={}) { return { apikey:cfg.SUPABASE_ANON_KEY, Authorization:`Bearer ${cfg.SUPABASE_ANON_KEY}`, 'Content-Type':'application/json', ...extra }; }
async function supabase(path, options={}) { const res=await fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`,{...options,headers:headers(options.headers||{})}); if(!res.ok) throw new Error(await res.text()); const text=await res.text(); return text?JSON.parse(text):null; }
function localData(){return JSON.parse(localStorage.getItem('lis-data')||'null');}
function saveLocal(){localStorage.setItem('lis-data',JSON.stringify({items:state.items,votes:state.votes}));}
async function loadData(){if(HAS_SUPABASE){try{const[ideas,votes]=await Promise.all([supabase('ideas?select=*&order=date.asc,created_at.asc'),supabase('votes?select=*')]);state.items=[...seedItems,...ideas.map(i=>({...i,type:'idea'}))];state.votes=votes||[];return;}catch(err){console.warn('Supabase unavailable; using local fallback.',err);}}const data=localData();if(data){const customItems=(data.items||[]).filter(x=>!seedItems.some(s=>s.id===x.id));state.items=[...structuredClone(seedItems),...customItems];state.votes=data.votes||[];saveLocal();}else{state.items=structuredClone(seedItems);state.votes=[];saveLocal();}}
function ensureName(){if(state.name)return true;profileDialog.showModal();return false;}
function voteCount(id){return state.votes.filter(v=>v.idea_id===id).length;}
function voters(id){return state.votes.filter(v=>v.idea_id===id).map(v=>v.user_name);}
function hasVoted(id){return state.votes.some(v=>v.idea_id===id&&v.user_name===state.name);}
async function toggleVote(item){if(!ensureName())return;const existing=state.votes.find(v=>v.idea_id===item.id&&v.user_name===state.name);if(HAS_SUPABASE){try{if(existing)await supabase(`votes?idea_id=eq.${encodeURIComponent(item.id)}&user_name=eq.${encodeURIComponent(state.name)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});else await supabase('votes',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({idea_id:item.id,user_name:state.name})});await loadData();}catch(err){alert('Could not save the vote. '+err.message);return;}}else{if(existing)state.votes=state.votes.filter(v=>!(v.idea_id===item.id&&v.user_name===state.name));else state.votes.push({idea_id:item.id,user_name:state.name,created_at:new Date().toISOString()});saveLocal();}render();}
function render(){profileName.textContent=state.name||'Choose name';daysEl.innerHTML='';const filter=state.filter;for(const day of TRIP_DAYS){let items=state.items.filter(i=>i.date===day.date);if(filter==='fixed')items=items.filter(i=>i.type==='fixed');if(filter==='idea'||filter==='liked')items=items.filter(i=>i.type==='idea');if(filter==='liked')items.sort((a,b)=>voteCount(b.id)-voteCount(a.id));if(!items.length)continue;const node=document.getElementById('dayTemplate').content.cloneNode(true);node.querySelector('.day-date').textContent=`${day.label} · ${new Date(day.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',timeZone:'Europe/Lisbon'})}`;node.querySelector('.day-title').textContent=day.title;node.querySelector('.count-pill').textContent=`${items.filter(i=>i.type==='idea').length} ideas`;const box=node.querySelector('.items');for(const item of items){const iNode=document.getElementById('itemTemplate').content.cloneNode(true);const root=iNode.querySelector('.item-card');root.classList.add(item.type);iNode.querySelector('.category-chip').textContent=item.category||'Idea';iNode.querySelector('.time-chip').textContent=item.time||'Flexible';iNode.querySelector('.item-title').textContent=item.title;iNode.querySelector('.item-description').textContent=item.description||'';const meta=iNode.querySelector('.meta-row');if(item.location)meta.insertAdjacentHTML('beforeend',`<span>📍 ${escapeHtml(item.location)}</span>`);if(item.price)meta.insertAdjacentHTML('beforeend',`<span>💶 ${escapeHtml(item.price)}</span>`);if(item.created_by)meta.insertAdjacentHTML('beforeend',`<span>＋ ${escapeHtml(item.created_by)}</span>`);if(item.url)meta.insertAdjacentHTML('beforeend',`<a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">Open link ↗</a>`);if(item.type==='idea'){const btn=iNode.querySelector('.vote-btn');btn.querySelector('.vote-count').textContent=voteCount(item.id);if(hasVoted(item.id))btn.classList.add('liked');btn.addEventListener('click',()=>toggleVote(item));const names=voters(item.id);iNode.querySelector('.voters').textContent=names.length?names.join(' · '):'Be first to vote';}box.appendChild(iNode);}daysEl.appendChild(node);}}
function escapeHtml(v=''){const d=document.createElement('div');d.textContent=v;return d.innerHTML;}
function escapeAttr(v=''){return String(v).replace(/"/g,'&quot;');}
profileBtn.addEventListener('click',()=>{nameInput.value=state.name;profileDialog.showModal();});
document.getElementById('profileForm').addEventListener('submit',(e)=>{const value=nameInput.value.trim();if(!value){e.preventDefault();return;}state.name=value;localStorage.setItem('lis-name',value);profileName.textContent=value;});
document.getElementById('addIdeaBtn').addEventListener('click',()=>{if(!ensureName())return;ideaDialog.showModal();});
TRIP_DAYS.forEach(d=>{const opt=document.createElement('option');opt.value=d.date;opt.textContent=`${d.label}, ${new Date(d.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'Europe/Lisbon'})}`;ideaDay.appendChild(opt);});
document.getElementById('ideaForm').addEventListener('submit',async(e)=>{const title=document.getElementById('ideaTitle').value.trim();if(!title){e.preventDefault();return;}const item={id:crypto.randomUUID(),type:'idea',title,date:ideaDay.value,category:document.getElementById('ideaCategory').value,time:document.getElementById('ideaTime').value.trim(),location:document.getElementById('ideaLocation').value.trim(),description:document.getElementById('ideaDescription').value.trim(),price:document.getElementById('ideaPrice').value.trim(),url:document.getElementById('ideaUrl').value.trim(),created_by:state.name,created_at:new Date().toISOString()};if(HAS_SUPABASE){try{await supabase('ideas',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(item)});await loadData();}catch(err){e.preventDefault();alert('Could not save the idea. '+err.message);return;}}else{state.items.push(item);saveLocal();}e.target.reset();render();});
document.getElementById('filterBar').addEventListener('click',(e)=>{const btn=e.target.closest('[data-filter]');if(!btn)return;state.filter=btn.dataset.filter;document.querySelectorAll('.segment').forEach(x=>x.classList.toggle('active',x===btn));render();});
loadData().then(render);
