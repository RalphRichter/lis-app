(() => {
  const form = document.getElementById('ideaForm');
  if (!form || document.getElementById('newEntryCalendarEditor')) return;

  const daySelect = document.getElementById('ideaDay');
  const legacyTime = document.getElementById('ideaTime');
  if (!daySelect || !legacyTime) return;

  const startDay = document.createElement('input');
  startDay.type = 'date';
  startDay.id = 'ideaStartDay';
  startDay.min = '2026-09-08';
  startDay.max = '2026-09-13';

  const endDay = document.createElement('input');
  endDay.type = 'date';
  endDay.id = 'ideaEndDay';
  endDay.min = '2026-09-08';
  endDay.max = '2026-09-13';

  const startTime = document.createElement('input');
  startTime.type = 'time';
  startTime.id = 'ideaStartTime';

  const endTime = document.createElement('input');
  endTime.type = 'time';
  endTime.id = 'ideaEndTime';

  const allDay = document.createElement('input');
  allDay.type = 'checkbox';
  allDay.id = 'ideaAllDay';
  allDay.className = 'apple-switch-input';

  const repeat = document.createElement('select');
  repeat.id = 'ideaRepeat';
  repeat.innerHTML = '<option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekdays">Weekdays</option>';

  const repeatUntil = document.createElement('input');
  repeatUntil.type = 'date';
  repeatUntil.id = 'ideaRepeatUntil';
  repeatUntil.min = '2026-09-08';
  repeatUntil.max = '2026-09-13';

  daySelect.closest('label')?.classList.add('apple-source-field');
  legacyTime.closest('label')?.classList.add('apple-source-field');

  const panel = document.createElement('div');
  panel.id = 'newEntryCalendarEditor';
  panel.className = 'apple-calendar-editor wide';
  panel.innerHTML = `
    <div class="apple-cal-row apple-date-row"><div class="apple-cal-label">Start</div><div class="apple-cal-values" data-slot="start"></div></div>
    <div class="apple-cal-row apple-date-row"><div class="apple-cal-label">End</div><div class="apple-cal-values" data-slot="end"></div></div>
    <div class="apple-cal-row"><div class="apple-cal-icon">▣</div><div class="apple-cal-label">All-day</div><label class="apple-switch" aria-label="All-day"><span class="apple-switch-track"><span class="apple-switch-knob"></span></span></label></div>
    <div class="apple-cal-row apple-repeat-row"><div class="apple-cal-icon">↻</div><div class="apple-cal-label">Repeat</div><div class="apple-repeat-value" data-slot="repeat"></div></div>
    <div class="apple-cal-row apple-repeat-until-row" hidden><div class="apple-cal-icon"></div><div class="apple-cal-label">End repeat</div><div class="apple-repeat-value" data-slot="repeat-until"></div></div>`;

  panel.querySelector('[data-slot="start"]').append(startDay, startTime);
  panel.querySelector('[data-slot="end"]').append(endDay, endTime);
  panel.querySelector('[data-slot="repeat"]').append(repeat);
  panel.querySelector('[data-slot="repeat-until"]').append(repeatUntil);
  panel.querySelector('.apple-switch').prepend(allDay);

  const grid = form.querySelector('.form-grid');
  const locationLabel = document.getElementById('ideaLocation')?.closest('label');
  if (grid && locationLabel) grid.insertBefore(panel, locationLabel);
  else grid?.appendChild(panel);

  if (!document.getElementById('calendarEditorSharedStyle')) {
    const style = document.createElement('style');
    style.id = 'calendarEditorSharedStyle';
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
      @media(max-width:560px){.apple-cal-row{padding:0 12px;grid-template-columns:26px minmax(82px,1fr) auto}.apple-date-row{grid-template-columns:58px 1fr;padding-left:16px}.apple-cal-values{gap:6px}.apple-cal-values input[type=date]{max-width:145px;font-size:.9rem;padding:8px}.apple-cal-values input[type=time]{max-width:92px;font-size:.9rem;padding:8px}.apple-cal-label{font-size:.95rem}}
    `;
    document.head.appendChild(style);
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

  function resetCalendarFields() {
    const initial = daySelect.value || TRIP_DAYS[0].date;
    startDay.value = initial;
    endDay.value = initial;
    startTime.value = '';
    endTime.value = '';
    allDay.checked = false;
    repeat.value = 'none';
    repeatUntil.value = '';
    updateAllDay();
    updateRepeatUntil();
  }

  startDay.addEventListener('change', () => {
    if (!endDay.value || endDay.value < startDay.value) endDay.value = startDay.value;
    daySelect.value = startDay.value;
  });
  allDay.addEventListener('change', updateAllDay);
  repeat.addEventListener('change', updateRepeatUntil);

  let pending = null;
  form.addEventListener('submit', () => {
    daySelect.value = startDay.value;
    if (allDay.checked) {
      legacyTime.value = 'All day';
    } else if (startTime.value) {
      legacyTime.value = endTime.value ? `${startTime.value}–${endTime.value}` : startTime.value;
    }
    pending = {
      title:document.getElementById('ideaTitle')?.value.trim() || '',
      date:startDay.value,
      start_time:allDay.checked ? null : (startTime.value || null),
      end_time:allDay.checked ? null : (endTime.value || null),
      end_date:endDay.value || startDay.value,
      all_day:allDay.checked,
      repeat:repeat.value || 'none',
      repeat_until:repeat.value === 'none' ? null : (repeatUntil.value || TRIP_DAYS[TRIP_DAYS.length - 1].date)
    };

    let tries = 0;
    const timer = setInterval(async () => {
      tries++;
      const candidates = (state?.items || []).filter(i => i.title === pending?.title && i.date === pending?.date);
      const item = candidates[candidates.length - 1];
      if (!item && tries < 30) return;
      clearInterval(timer);
      if (!item || !pending) return;

      Object.assign(item, pending);
      try {
        if (HAS_SUPABASE) {
          const full = typeof window.lisEntryRow === 'function' ? window.lisEntryRow(item) : item;
          await supabase('ideas?on_conflict=id', {
            method:'POST',
            headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
            body:JSON.stringify(full)
          });
          await loadData();
        } else {
          saveLocal();
        }
        renderAll();
      } catch (err) {
        console.warn('Could not save structured date/time settings for the new entry.', err);
      }
      pending = null;
    }, 100);
  }, true);

  form.addEventListener('reset', () => setTimeout(resetCalendarFields, 0));
  resetCalendarFields();
})();