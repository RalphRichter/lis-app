// Overview timeline: keep current/upcoming entries on top and move completed entries
// into a collapsible Past section. All comparisons use Lisbon local time.
(() => {
  const originalRenderDayCards = renderDayCards;

  function lisbonNowParts() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = type => parts.find(p => p.type === type)?.value || '';
    return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
  }

  function addMinutes(hhmm, minutes) {
    const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return '23:59';
    const total = Math.min(23 * 60 + 59, Number(m[1]) * 60 + Number(m[2]) + minutes);
    return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
  }

  function legacyTimes(item) {
    const text = item.time || '';
    const times = [...text.matchAll(/(?:^|[^\d])(\d{1,2}:\d{2})(?!\d)/g)].map(m => m[1].padStart(5,'0'));
    return { start: times[0] || '', end: times[1] || '' };
  }

  function endFor(item, occurrenceDate) {
    const legacy = legacyTimes(item);
    const endDate = item.end_date || occurrenceDate;
    if (item.all_day) return { date: endDate, time: '23:59' };
    if (item.end_time) return { date: endDate, time: item.end_time };
    if (legacy.end) return { date: endDate, time: legacy.end };
    const start = item.start_time || legacy.start;
    if (start) return { date: endDate, time: addMinutes(start, 120) };

    // Broad labels should remain visible for the useful part of that day.
    if (/daytime/i.test(item.time || '')) return { date: endDate, time: '18:00' };
    if (/evening/i.test(item.time || '')) return { date: endDate, time: '23:59' };
    if (/late/i.test(item.time || '')) return { date: endDate, time: '23:59' };
    return { date: endDate, time: '23:59' };
  }

  function isPast(item, occurrenceDate) {
    const now = lisbonNowParts();
    const end = endFor(item, occurrenceDate);
    return end.date < now.date || (end.date === now.date && end.time <= now.time);
  }

  function organiseOverview(target) {
    target.querySelectorAll('.past-overview').forEach(n => n.remove());
    const pastByDay = [];

    [...target.querySelectorAll('.day-card')].forEach(dayCard => {
      const pastCards = [];
      [...dayCard.querySelectorAll('.item-card')].forEach(card => {
        const item = state.items.find(i => i.id === card.dataset.itemId);
        if (item && isPast(item, card.dataset.itemDate || item.date)) pastCards.push(card);
      });

      if (pastCards.length) {
        const dateText = dayCard.querySelector('.day-date')?.textContent || '';
        const titleText = dayCard.querySelector('.day-title')?.textContent || '';
        pastByDay.push({ dateText, titleText, cards: pastCards });
        pastCards.forEach(card => card.remove());
      }

      const remaining = dayCard.querySelectorAll('.item-card').length;
      if (!remaining) dayCard.remove();
      else {
        const pill = dayCard.querySelector('.count-pill');
        if (pill) pill.textContent = `${remaining} ${remaining === 1 ? 'entry' : 'entries'}`;
      }
    });

    if (!pastByDay.length) return;

    const details = document.createElement('details');
    details.className = 'past-overview';
    details.innerHTML = `<summary><span>Past</span><span class="past-count"></span></summary><div class="past-days"></div>`;
    const total = pastByDay.reduce((n,d) => n + d.cards.length, 0);
    details.querySelector('.past-count').textContent = `${total} ${total === 1 ? 'entry' : 'entries'}`;
    const days = details.querySelector('.past-days');

    pastByDay.forEach(day => {
      const article = document.createElement('article');
      article.className = 'day-card past-day';
      article.innerHTML = `<div class="day-header"><div><p class="day-date"></p><h2 class="day-title"></h2></div><span class="count-pill"></span></div><div class="items"></div>`;
      article.querySelector('.day-date').textContent = day.dateText;
      article.querySelector('.day-title').textContent = day.titleText;
      article.querySelector('.count-pill').textContent = `${day.cards.length} ${day.cards.length === 1 ? 'entry' : 'entries'}`;
      day.cards.forEach(card => article.querySelector('.items').appendChild(card));
      days.appendChild(article);
    });
    target.appendChild(details);
  }

  renderDayCards = function(target, type) {
    originalRenderDayCards(target, type);
    if (type === 'fixed' && target === overviewDays) organiseOverview(target);
  };

  const style = document.createElement('style');
  style.textContent = `
    .past-overview{margin-top:18px;border-top:1px solid rgba(11,45,42,.14);padding-top:10px}
    .past-overview>summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 4px;font-weight:700;color:#0b2d2a}
    .past-overview>summary::-webkit-details-marker{display:none}
    .past-overview>summary span:first-child::before{content:'›';display:inline-block;margin-right:9px;transition:transform .18s ease;font-size:1.25em}
    .past-overview[open]>summary span:first-child::before{transform:rotate(90deg)}
    .past-count{font-size:.82rem;font-weight:600;opacity:.65}
    .past-days{display:grid;gap:16px;margin-top:4px}
    .past-day{opacity:.78}
  `;
  document.head.appendChild(style);

  // Re-evaluate around time boundaries while the app remains open.
  setInterval(() => {
    if (state.activeTab === 'overview') renderDayCards(overviewDays, 'fixed');
  }, 60000);
})();