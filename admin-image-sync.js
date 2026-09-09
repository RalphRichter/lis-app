(() => {
  const config = window.LIS_APP_CONFIG || {};
  const ready = Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
  const adminHead = document.querySelector('.admin-head');
  const btn = document.getElementById('pushPicturesBtn');
  if (!adminHead || !btn) return;

  function dedupeEntries() {
    if (typeof state === 'undefined' || !Array.isArray(state.items)) return;
    const merged = new Map();
    for (const item of state.items) {
      const existing = merged.get(item.id);
      if (!existing) { merged.set(item.id,item); continue; }
      const seed = typeof seedItems !== 'undefined' ? seedItems.find(s => s.id === item.id) : null;
      merged.set(item.id,{...(seed||existing),...existing,...item,type:item.type||existing.type||seed?.type||'idea'});
    }
    state.items=[...merged.values()];
  }
  if (typeof renderAll === 'function') {
    const baseRenderAll=renderAll;
    renderAll=function(){dedupeEntries();return baseRenderAll();};
    setTimeout(()=>renderAll(),200);
  }

  let status=document.getElementById('pictureSyncStatus');
  if(!status){status=document.createElement('p');status.id='pictureSyncStatus';status.className='muted';status.style.margin='0 0 14px';adminHead.insertAdjacentElement('afterend',status);}
  status.textContent=ready?'Pictures saved on this device can be uploaded to Supabase.':'Supabase is not configured.';

  const headers=(extra={})=>({apikey:config.SUPABASE_ANON_KEY,Authorization:`Bearer ${config.SUPABASE_ANON_KEY}`,...extra});
  const localImages=()=>{try{return JSON.parse(localStorage.getItem('lis-entry-images')||'{}')}catch(_){return {}}};
  const saveLocalImages=map=>localStorage.setItem('lis-entry-images',JSON.stringify(map));

  async function upsertRecord(entryId,imageUrl){
    const res=await fetch(`${config.SUPABASE_URL}/rest/v1/entry_images?on_conflict=entry_id`,{method:'POST',headers:headers({'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({entry_id:entryId,image_url:imageUrl,updated_at:new Date().toISOString()})});
    if(!res.ok)throw new Error(`Database ${res.status}: ${await res.text()}`);
  }
  async function uploadDataUrl(entryId,dataUrl){
    const blob=await(await fetch(dataUrl)).blob();
    const objectName=`${encodeURIComponent(entryId)}.jpg`;
    const res=await fetch(`${config.SUPABASE_URL}/storage/v1/object/entry-images/${objectName}`,{method:'POST',headers:headers({'Content-Type':blob.type||'image/jpeg','x-upsert':'true'}),body:blob});
    if(!res.ok)throw new Error(`Storage ${res.status}: ${await res.text()}`);
    return `${config.SUPABASE_URL}/storage/v1/object/public/entry-images/${objectName}?v=${Date.now()}`;
  }

  async function pushPictures(){
    if(!ready)return alert('Supabase is not configured.');
    const map=localImages();
    const entries=Object.entries(map).filter(([,v])=>typeof v==='string'&&v);
    if(!entries.length){status.textContent='No locally saved pictures were found on this iPhone.';return;}
    btn.disabled=true;btn.textContent='Uploading…';status.textContent=`Checking ${entries.length} pictures…`;
    let uploaded=0,linked=0;const failed=[];
    for(const [entryId,value] of entries){
      try{
        let shared=value;
        if(value.startsWith('data:image/')){shared=await uploadDataUrl(entryId,value);map[entryId]=shared;uploaded++;}
        if(/^https?:\/\//i.test(shared)){await upsertRecord(entryId,shared);linked++;}
      }catch(err){console.error('Picture sync failed',entryId,err);failed.push(`${entryId}: ${err.message}`);}
    }
    saveLocalImages(map);btn.disabled=false;btn.textContent='Push pictures';
    if(failed.length){status.textContent=`${linked} pictures shared; ${failed.length} failed.`;alert(`Picture upload failed:\n\n${failed.join('\n')}`);}
    else status.textContent=`${linked} pictures are shared in Supabase (${uploaded} uploaded from this iPhone).`;
    if(typeof renderAll==='function')renderAll();
  }
  btn.addEventListener('click',pushPictures);
})();