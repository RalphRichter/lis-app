(function(){
  const overview = document.getElementById('overviewDays');
  if (!overview) return;
  const META_KEY = 'lis-apple-event-meta';
  const getMeta = id => {
    try { return JSON.parse(localStorage.getItem(META_KEY) || '{}')[id] || {}; }
    catch (_) { return {}; }
  };

  function escIcs(value='') {
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  function nextDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0,10).replace(/-/g,'');
  }
  function compactDate(dateStr) { return dateStr.replace(/-/g,''); }

  function parseTimes(text='') {
    const matches = [...String(text).matchAll(/(\d{1,2}):(\d{2})/g)]
      .map(m => `${m[1].padStart(2,'0')}${m[2]}00`);
    if (!matches.length) return null;
    return { start: matches[0], end: matches[1] || null };
  }

  function buildIcs(item) {
    const uid = `${item.id || crypto.randomUUID()}@lisbon-with-friends`;
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const meta = getMeta(item.id);
    const allDay = Boolean(meta.all_day ?? item.all_day);
    const endDate = meta.end_date || item.end_date || item.date;
    const times = item.start_time ? {
      start:item.start_time.replace(':','')+'00',
      end:item.end_time ? item.end_time.replace(':','')+'00' : null
    } : parseTimes(item.time);
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lisbon with Friends//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
      `UID:${escIcs(uid)}`,`DTSTAMP:${stamp}`,`SUMMARY:${escIcs(item.title || 'Lisbon entry')}`,
      `LOCATION:${escIcs(item.location || '')}`,`DESCRIPTION:${escIcs(item.description || '')}`
    ];

    if (allDay || !times) {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(item.date)}`);
      lines.push(`DTEND;VALUE=DATE:${nextDate(endDate)}`);
    } else {
      lines.push(`DTSTART;TZID=Europe/Lisbon:${compactDate(item.date)}T${times.start}`);
      if (times.end) lines.push(`DTEND;TZID=Europe/Lisbon:${compactDate(endDate)}T${times.end}`);
      else {
        const h = Number(times.start.slice(0,2));
        const m = Number(times.start.slice(2,4));
        const endMinutes = h * 60 + m + 60;
        const eh = String(Math.floor(endMinutes / 60) % 24).padStart(2,'0');
        const em = String(endMinutes % 60).padStart(2,'0');
        lines.push(`DTEND;TZID=Europe/Lisbon:${compactDate(endDate)}T${eh}${em}00`);
      }
    }

    if (item.repeat === 'daily') {
      const until = item.repeat_until ? compactDate(item.repeat_until) : compactDate(TRIP_DAYS[TRIP_DAYS.length-1].date);
      lines.push(`RRULE:FREQ=DAILY;UNTIL=${until}T235959Z`);
    } else if (item.repeat === 'weekdays') {
      const until = item.repeat_until ? compactDate(item.repeat_until) : compactDate(TRIP_DAYS[TRIP_DAYS.length-1].date);
      lines.push(`RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=${until}T235959Z`);
    }

    lines.push('END:VEVENT','END:VCALENDAR');
    return lines.join('\r\n');
  }

  function addToCalendar(item) {
    const blob = new Blob([buildIcs(item)], { type:'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(item.title || 'calendar-entry').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')}.ics`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function injectButtons() {
    const cards = overview.querySelectorAll('.item-card.fixed');
    cards.forEach(card => {
      if (card.querySelector('.calendar-entry-btn')) return;
      const id = card.dataset.itemId;
      const title = card.querySelector('.item-title')?.textContent?.trim();
      if ((!id && !title) || typeof state === 'undefined') return;
      const item = id ? state.items.find(i => i.id === id) : state.items.find(i => i.type === 'fixed' && i.title === title);
      if (!item) return;
      const meta = card.querySelector('.meta-row');
      if (!meta) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'small-btn calendar-entry-btn';
      btn.innerHTML = '📅 Add to calendar';
      btn.setAttribute('aria-label', `Add ${item.title} to calendar`);
      btn.addEventListener('click', () => addToCalendar(item));
      meta.appendChild(btn);
    });
  }

  new MutationObserver(injectButtons).observe(overview, { childList:true, subtree:true });
  injectButtons();

  const editor = document.createElement('script');
  editor.src = 'apple-editor.js';
  editor.defer = true;
  document.body.appendChild(editor);
})();