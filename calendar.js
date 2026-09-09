(function(){
  const overview = document.getElementById('overviewDays');
  if (!overview) return;

  function escIcs(value='') {
    return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }
  function nextDate(dateStr) { const d = new Date(dateStr + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0,10).replace(/-/g,''); }
  function compactDate(dateStr) { return dateStr.replace(/-/g,''); }
  function parseTimes(text='') {
    const matches = [...String(text).matchAll(/(\d{1,2}):(\d{2})/g)].map(m => `${m[1].padStart(2,'0')}${m[2]}00`);
    if (!matches.length) return null;
    return { start: matches[0], end: matches[1] || null };
  }
  function compactTime(v='') { return v ? v.replace(':','') + '00' : ''; }
  function recurrenceLine(item) {
    if (!item.repeat || item.repeat === 'none') return null;
    const until = compactDate(item.repeat_until || '2026-09-13') + 'T235959Z';
    if (item.repeat === 'daily') return `RRULE:FREQ=DAILY;UNTIL=${until}`;
    if (item.repeat === 'weekdays') return `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=${until}`;
    return null;
  }

  function buildIcs(item) {
    const uid = `${item.id || crypto.randomUUID()}@lisbon-with-friends`;
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const explicit = item.start_time ? {start:compactTime(item.start_time), end:item.end_time ? compactTime(item.end_time) : null} : null;
    const times = explicit || parseTimes(item.time);
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lisbon with Friends//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:${escIcs(uid)}`,`DTSTAMP:${stamp}`,`SUMMARY:${escIcs(item.title || 'Lisbon entry')}`,`LOCATION:${escIcs(item.location || '')}`,`DESCRIPTION:${escIcs(item.description || '')}`];

    if (times) {
      const date = compactDate(item.date);
      lines.push(`DTSTART;TZID=Europe/Lisbon:${date}T${times.start}`);
      if (times.end) lines.push(`DTEND;TZID=Europe/Lisbon:${date}T${times.end}`);
      else {
        const h = Number(times.start.slice(0,2)); const m = Number(times.start.slice(2,4)); const endMinutes = h * 60 + m + 60;
        const eh = String(Math.floor(endMinutes / 60) % 24).padStart(2,'0'); const em = String(endMinutes % 60).padStart(2,'0');
        lines.push(`DTEND;TZID=Europe/Lisbon:${date}T${eh}${em}00`);
      }
    } else {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(item.date)}`);
      lines.push(`DTEND;VALUE=DATE:${nextDate(item.date)}`);
    }
    const rrule = recurrenceLine(item); if (rrule) lines.push(rrule);
    lines.push('END:VEVENT','END:VCALENDAR');
    return lines.join('\r\n');
  }

  function addToCalendar(item) {
    const blob = new Blob([buildIcs(item)], { type:'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `${(item.title || 'calendar-entry').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')}.ics`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function injectButtons() {
    const cards = overview.querySelectorAll('.item-card.fixed');
    cards.forEach(card => {
      if (card.querySelector('.calendar-entry-btn')) return;
      const id = card.dataset.itemId; const date = card.dataset.itemDate;
      let item = typeof state !== 'undefined' ? state.items.find(i => i.id === id) : null;
      if (!item) return;
      if (date && date !== item.date) item = {...item, date};
      const meta = card.querySelector('.meta-row'); if (!meta) return;
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'small-btn calendar-entry-btn'; btn.innerHTML = '📅 Add to calendar';
      btn.setAttribute('aria-label', `Add ${item.title} to calendar`); btn.addEventListener('click', () => addToCalendar(item)); meta.appendChild(btn);
    });
  }

  new MutationObserver(injectButtons).observe(overview, { childList:true, subtree:true });
  injectButtons();
})();
