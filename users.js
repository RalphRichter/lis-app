(() => {
  const cfg = window.LIS_APP_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;

  state.userId = localStorage.getItem('lis-user-id') || '';
  const nameKey = name => name.trim().toLocaleLowerCase('en-US');

  async function resolveUser(name) {
    const key = nameKey(name);
    let rows = await supabase(`users?name_key=eq.${encodeURIComponent(key)}&select=id,name&limit=1`);
    if (rows?.length) return rows[0];
    try {
      rows = await supabase('users?on_conflict=name_key', {
        method:'POST',
        headers:{Prefer:'resolution=merge-duplicates,return=representation'},
        body:JSON.stringify({name:name.trim(),name_key:key,updated_at:new Date().toISOString()})
      });
      return rows?.[0] || null;
    } catch (_) {
      rows = await supabase(`users?name_key=eq.${encodeURIComponent(key)}&select=id,name&limit=1`);
      return rows?.[0] || null;
    }
  }

  async function syncCurrentUser() {
    if (!state.name) return null;
    try {
      const user = await resolveUser(state.name);
      if (!user) return null;
      state.userId = user.id;
      state.name = user.name;
      localStorage.setItem('lis-user-id',user.id);
      localStorage.setItem('lis-name',user.name);
      profileName.textContent = user.name;
      return user;
    } catch (err) {
      console.warn('User profile could not be synchronized.',err);
      return null;
    }
  }

  document.getElementById('profileForm')?.addEventListener('submit', async () => {
    const name = nameInput.value.trim();
    if (!name) return;
    state.name = name;
    await syncCurrentUser();
    renderAll();
  });

  const originalHasVoted = hasVoted;
  hasVoted = function(id) {
    if (state.userId && state.votes.some(v => v.idea_id===id && v.user_id===state.userId)) return true;
    return originalHasVoted(id);
  };

  toggleVote = async function(item) {
    if (!ensureName()) return;
    if (!state.userId) await syncCurrentUser();
    const existing = state.votes.find(v => v.idea_id===item.id && ((state.userId && v.user_id===state.userId) || (!v.user_id && v.user_name===state.name)));
    try {
      if (existing) {
        await supabase(`votes?id=eq.${encodeURIComponent(existing.id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
      } else {
        await supabase('votes',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({idea_id:item.id,user_name:state.name,user_id:state.userId || null})});
      }
      await loadData();
      renderAll();
    } catch(err) {
      alert('Could not save the vote. '+err.message);
    }
  };

  if (state.name) syncCurrentUser().then(() => loadData().then(renderAll));
})();
