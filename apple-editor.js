(() => {
  const form = document.getElementById('editForm');
  if (!form || document.getElementById('appleCalendarEditor')) return;

  const day = document.getElementById('editDay');
  const startTime = document.getElementById('editStartTime');
  const endTime = document.getElementById('editEndTime');
  const repeat = document.getElementById('editRepeat');
  const repeatUntil = document.getElementById('editRepeatUntil');
  const legacyTime = document.getElementById('editTime');
  if (!day || !startTime || !endTime || !repeat || !repeatUntil) return;

  const META_KEY = 'lis-apple-event-meta';
  const metaMap = () => JSON.parse(localStorage.getItem(META_KEY) || '{}');
  const saveMeta = value => localStorage.setItem(META_KEY, JSON.stringify(value));

  function hideOriginalLabel(control) {
    const label = control.closest('label');
    if (label) label.classList.add('apple-source-field');
  }
  [day, startTime, endTime, repeat, repeatUntil, legacyTime].forEach(hideOriginalLabel);

  const endDay = document.createElement('input');
  endDay.type = 'date';
  endDay.id = 'editEndDay';
  endDay.min = '2026-09-08';
  endDay.max = '2026-09-13';
  endDay.setAttribute('aria-label', 'End date');

  const allDay = document.createElement('input');
  allDay.type = 'checkbox';
  allDay.id = 'editAllDay';
  allDay.className = 'apple-switch-input';

  const panel = document.createElement('div');
  panel.id = 'appleCalendarEditor';
  panel.className = 'apple-calendar-editor wide';
  panel.innerHTML = `
    <div class="apple-cal-row apple-date-row">
      <div class="apple-cal-label">Start</div>
      <div class="apple-cal-values" data-slot="start"></div>
    </div>
    <div class="apple-cal-row apple-date-row">
      <div class="apple-cal-label">End</div>
      <div class="apple-cal-values" data-slot="end"></div>
    </div>
    <div class="apple-cal-row">
      <div class="apple-cal-icon">▣</div>
      <div class="apple-cal-label">All-day</div>
      <label class="apple-switch" aria-label="All-day"><span class="apple-switch-track"><span class="apple-switch-knob"></span></span></label>
    </div>
    <div class="apple-cal-row apple-repeat-row">
      <div class="apple-cal-icon">↻</div>
      <div class="apple-cal-label">Repeat</div>
      <div class="apple-repeat-value" data-slot="repeat"></div>
    </div>
    <div class="apple-cal-row apple-repeat-until-row" hidden>
      <div class="apple-cal-icon"></div>
      <div class="apple-cal-label">End repeat</div>
      <div class="apple-repeat-value" data-slot="repeat-until"></div>
    </div>`;

  const grid = form.querySelector('.form-grid');
  const locationLabel = document.getElementById('editLocation')?.closest('label');
  if (grid && locationLabel) grid.insertBefore(panel, locationLabel);
  else grid?.appendChild(panel);

  panel.querySelector('[data-slot="start"]').append(day, startTime);
  panel.querySelector('[data-slot="end"]').append(endDay, endTime);
  panel.querySelector('[data-slot="repeat"]').append(repeat);
  panel.querySelector('[data-slot="repeat-until"]').append(repeatUntil);
  panel.querySelector('.apple-switch').prepend(allDay);

  const style = document.createElement('style');
  style.textContent = `
    .apple-source-field{display:none!important}
    .apple-calendar-editor{background:#f4f4f6;border:1px solid #e5e5ea;border-radius:20px;overflow:hidden;margin:2px 0 4px;color:#1c1c1e}
    .apple-cal-row{min-height:62px;display:grid;grid-template-columns:30px minmax(110px,1fr) auto;align-items:center;gap:10px;padding:0 16px;border-bottom:1px solid #d8d8dc}
    .apple-cal-row:last-child{border-bottom:0}.apple-date-row{grid-template-columns:minmax(110px,1fr) auto;padding-left:20px}
    .apple-cal-label{font-size:1rem;font-weight:500;color:#1c1c1e}.apple-cal-icon{font-size:1.35rem;color:#8e8e93;text-align:center}
    .apple-cal-values{display:flex;align-items:center;justify-content:flex-end;gap:8px}
    .apple-cal-values input[type=date],.apple-cal-values input[type=time],.apple-repeat-value select,.apple-repeat-value input[type=date]{width:auto;min-width:0;border:0;background:#e6e6eb;color:#1c1c1e;border-radius:12px;padding:8px 11px;box-shadow:none;font-size:1rem;font-weight:500}
    .apple-cal-values input[type=date]{max-width:154px}.apple-cal-values input[type=time]{max-width:104px}
    .apple-repeat-value select,.apple-repeat-value input[type=date]{background:transparent;padding-right:2px;text-align:right;color:#737378}
    .apple-repeat-value{display:flex;justify-content:flex-end}.apple-repeat-row select{appearance:auto}
    .apple-switch{display:block}.apple-switch-input{position:absolute;opacity:0;pointer-events:none}.apple-switch-track{width:51px;height:31px;border-radius:999px;background:#d1d1d6;display:block;position:relative;transition:.2s}.apple-switch-knob{width:27px;height:27px;position:absolute;top:2px;left:2px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:.2s}.apple-switch-input:checked+.apple-switch-track{background:#34c759}.apple-switch-input:checked+.apple-switch-track .apple-switch-knob{transform:translateX(20px)}
    .apple-calendar-editor.is-all-day .apple-cal-values input[type=time]{opacity:.35;pointer-events:none}
    @media(max-width:560px){.apple-calendar-editor{margin-left:0;margin-right:0}.apple-cal-row{padding:0 12px;grid-template-columns:26px minmax(82px,1fr) auto}.apple-date-row{grid-template-columns:58px 1fr;padding-left:16px}.apple-cal-values{gap:6px}.apple-cal-values input[type=date]{max-width:145px;font-size:.9rem;padding:8px}.apple-cal-values input[type=time]{max-width:92px;font-size:.9rem;padding:8px}.apple-cal-label{font-size:.95rem}}
  `;
  document.head.appendChild(style);

  function parseTimeLabel(value='') {
    const matches = [...String(value).matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)].map(m => `${m[1].padStart(2,'0')}:${m[2]}`);
    return { start: matches[0] || '', end: matches[1] || '' };
  }

  function updateRepeatUntil() {
    const row = panel.querySelector('.apple-repeat-until-row');
    const repeating = repeat.value !== 'none';
    row.hidden = !repeating;
    if (repeating && !repeatUntil.value) repeatUntil.value = TRIP_DAYS[TRIP_DAYS.length - 1].date;
    if (!repeating) repeatUntil.value = '';
  }

  function updateAllDay() {
    panel.classList.toggle('is-all-day', allDay.checked);
    startTime.disabled = allDay.checked;
    endTime.disabled = allDay.checked;
  }

  allDay.addEventListener('change', updateAllDay);
  repeat.addEventListener('change', updateRepeatUntil);
  day.addEventListener('change', () => {
    if (!endDay.value || endDay.value < day.value) endDay.value = day.value;
  });

  const originalOpenEdit = window.openEdit;
  if (typeof originalOpenEdit === 'function') {
    window.openEdit = function(item) {
      originalOpenEdit(item);
      const meta = metaMap()[item.id] || {};
      day.value = item.date || day.value;
      endDay.value = meta.end_date || item.end_date || item.date || day.value;

      // Older shared rows retained the entered clock time in the Time / label field.
      // Restore those values into the proper Start / End time controls when structured fields are absent.
      const parsed = parseTimeLabel(item.time || '');
      startTime.value = item.start_time || parsed.start || '';
      endTime.value = item.end_time || parsed.end || '';

      allDay.checked = Boolean(meta.all_day ?? item.all_day ?? (!startTime.value && /daytime|all day/i.test(item.time || '')));
      updateAllDay();
      updateRepeatUntil();
    };
  }

  form.addEventListener('submit', () => {
    const id = document.getElementById('editId')?.value;
    if (!id) return;

    if (allDay.checked) {
      startTime.disabled = false;
      endTime.disabled = false;
      startTime.value = '';
      endTime.value = '';
      if (legacyTime) legacyTime.value = 'All day';
    } else if (legacyTime) {
      legacyTime.value = startTime.value ? (endTime.value ? `${startTime.value}–${endTime.value}` : startTime.value) : legacyTime.value;
    }

    const map = metaMap();
    map[id] = { ...(map[id] || {}), end_date:endDay.value || day.value, all_day:allDay.checked };
    saveMeta(map);

    setTimeout(() => {
      const item = state?.items?.find(i => i.id === id);
      if (item) {
        item.end_date = endDay.value || day.value;
        item.all_day = allDay.checked;
        const overrides = typeof getOverrides === 'function' ? getOverrides() : {};
        overrides[id] = { ...(overrides[id] || item), end_date:item.end_date, all_day:item.all_day };
        if (typeof setOverrides === 'function') setOverrides(overrides);
        if (typeof saveLocal === 'function') saveLocal();
        if (typeof renderAll === 'function') renderAll();
      }
      updateAllDay();
    }, 0);
  }, true);

  updateRepeatUntil();
  updateAllDay();
})();