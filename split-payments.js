(() => {
  const ENABLED_KEY = 'lis-split-payment-enabled';
  const DATA_KEY = 'lis-split-payment-data';
  const overview = document.getElementById('overviewDays');
  const editForm = document.getElementById('editForm');
  const ideaForm = document.getElementById('ideaForm');
  if (!overview || !editForm) return;

  function readJson(key, fallback={}) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  }
  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function isEnabled(id) { return Boolean(readJson(ENABLED_KEY, {})[id]); }
  function setEnabled(id, value) {
    const map = readJson(ENABLED_KEY, {});
    if (value) map[id] = true; else delete map[id];
    writeJson(ENABLED_KEY, map);
  }

  function ensureToggle(form, anchorId, checkboxId) {
    if (document.getElementById(checkboxId)) return;
    const anchor = document.getElementById(anchorId);
    const grid = form.querySelector('.form-grid');
    if (!grid || !anchor) return;

    const row = document.createElement('div');
    row.className = 'split-toggle-row wide';
    row.innerHTML = `
      <div>
        <strong>Split payment</strong>
        <span>Show a payment-split button on the Overview entry.</span>
      </div>
      <label class="ios-switch" aria-label="Split payment">
        <input id="${checkboxId}" type="checkbox" />
        <span class="ios-switch-track"></span>
      </label>`;
    const anchorLabel = anchor.closest('label');
    anchorLabel?.insertAdjacentElement('afterend', row);
  }

  ensureToggle(editForm, 'editPrice', 'editSplitPayment');
  if (ideaForm) ensureToggle(ideaForm, 'ideaPrice', 'ideaSplitPayment');

  const splitDialog = document.createElement('dialog');
  splitDialog.id = 'splitPaymentDialog';
  splitDialog.className = 'dialog split-payment-dialog';
  splitDialog.innerHTML = `
    <form method="dialog" id="splitPaymentForm">
      <button class="close" value="cancel" aria-label="Close">×</button>
      <p class="eyebrow">Payment</p>
      <h2>Split payment</h2>
      <p id="splitPaymentTitle" class="muted split-payment-title"></p>
      <input id="splitPaymentItemId" type="hidden" />
      <div class="split-calc-card">
        <div class="split-field-row">
          <label for="splitAmount">Amount</label>
          <div class="split-money-input">
            <input id="splitAmount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" />
            <select id="splitCurrency" aria-label="Currency">
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
        </div>
        <div class="split-field-row">
          <label for="splitPeople">People</label>
          <input id="splitPeople" class="split-people" type="number" min="1" step="1" inputmode="numeric" value="4" />
        </div>
        <div class="split-result-row">
          <span>Per person</span>
          <strong id="splitPerPerson">€0.00</strong>
        </div>
      </div>
      <button class="primary-btn full" value="default">Save</button>
    </form>`;
  document.body.appendChild(splitDialog);

  const amountEl = document.getElementById('splitAmount');
  const currencyEl = document.getElementById('splitCurrency');
  const peopleEl = document.getElementById('splitPeople');
  const resultEl = document.getElementById('splitPerPerson');
  const itemIdEl = document.getElementById('splitPaymentItemId');
  const titleEl = document.getElementById('splitPaymentTitle');

  function currencySymbol(code) {
    return ({EUR:'€',USD:'$',GBP:'£',CHF:'CHF '})[code] || `${code} `;
  }
  function calculate() {
    const amount = Number(amountEl.value || 0);
    const people = Math.max(1, Number.parseInt(peopleEl.value || '1', 10) || 1);
    const each = amount / people;
    resultEl.textContent = `${currencySymbol(currencyEl.value)}${each.toFixed(2)}`;
  }
  amountEl.addEventListener('input', calculate);
  currencyEl.addEventListener('change', calculate);
  peopleEl.addEventListener('input', calculate);

  function openSplitDialog(item) {
    const saved = readJson(DATA_KEY, {})[item.id] || {};
    itemIdEl.value = item.id;
    titleEl.textContent = item.title || '';
    amountEl.value = saved.amount ?? '';
    currencyEl.value = saved.currency || 'EUR';
    peopleEl.value = saved.people || 4;
    calculate();
    splitDialog.showModal();
    setTimeout(() => amountEl.focus(), 50);
  }

  document.getElementById('splitPaymentForm').addEventListener('submit', () => {
    const id = itemIdEl.value;
    if (!id) return;
    const data = readJson(DATA_KEY, {});
    data[id] = {
      amount: Number(amountEl.value || 0),
      currency: currencyEl.value,
      people: Math.max(1, Number.parseInt(peopleEl.value || '1', 10) || 1)
    };
    writeJson(DATA_KEY, data);
  });

  function applyOverviewButtons() {
    const cards = [...overview.querySelectorAll('.item-card.fixed')];
    cards.forEach(card => {
      const id = card.dataset.itemId;
      if (!id) return;
      const existing = card.querySelector('.split-payment-btn');
      if (!isEnabled(id)) {
        existing?.remove();
        card.classList.remove('split-payment-enabled');
        return;
      }
      card.classList.add('split-payment-enabled');
      if (existing) return;
      const item = typeof state !== 'undefined' ? state.items.find(i => i.id === id) : null;
      if (!item) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'small-btn split-payment-btn';
      btn.innerHTML = '💶 Split payment';
      btn.addEventListener('click', () => openSplitDialog(item));
      const main = card.querySelector('.item-main');
      main?.appendChild(btn);
    });
  }

  const baseOpenEdit = window.openEdit;
  if (typeof baseOpenEdit === 'function') {
    window.openEdit = function(item) {
      baseOpenEdit(item);
      const checkbox = document.getElementById('editSplitPayment');
      if (checkbox) checkbox.checked = isEnabled(item.id);
    };
  }

  editForm.addEventListener('submit', () => {
    const id = document.getElementById('editId')?.value || '';
    const checkbox = document.getElementById('editSplitPayment');
    if (id && checkbox) setEnabled(id, checkbox.checked);
    setTimeout(applyOverviewButtons, 0);
  }, true);

  if (ideaForm) {
    ideaForm.addEventListener('submit', () => {
      const checkbox = document.getElementById('ideaSplitPayment');
      if (!checkbox?.checked) return;
      const title = document.getElementById('ideaTitle')?.value.trim() || '';
      const date = document.getElementById('ideaDay')?.value || '';
      setTimeout(() => {
        if (typeof state === 'undefined') return;
        const matches = state.items.filter(i => i.title === title && i.date === date);
        const item = matches[matches.length - 1];
        if (item) setEnabled(item.id, true);
        checkbox.checked = false;
        applyOverviewButtons();
      }, 0);
    }, true);
  }

  const style = document.createElement('style');
  style.textContent = `
    .split-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 14px;border:1px solid var(--line);border-radius:14px;background:#fff;color:var(--ink)}
    .split-toggle-row>div{display:grid;gap:2px}.split-toggle-row strong{font-size:.86rem}.split-toggle-row span{font-size:.72rem;color:var(--muted);font-weight:500}
    .ios-switch{display:inline-flex !important;flex:0 0 auto}.ios-switch input{position:absolute;opacity:0;pointer-events:none}.ios-switch-track{width:48px;height:28px;border-radius:999px;background:#d4d5d3;position:relative;transition:.18s ease;box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}
    .ios-switch-track:after{content:"";position:absolute;width:24px;height:24px;left:2px;top:2px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.22);transition:.18s ease}.ios-switch input:checked+.ios-switch-track{background:var(--success)}.ios-switch input:checked+.ios-switch-track:after{transform:translateX(20px)}
    .split-payment-btn{display:block;margin:10px 0 0 auto;background:#fff7ef;border-color:#e6c8b8;color:var(--accent);white-space:nowrap}
    .split-payment-dialog{width:min(520px,calc(100vw - 28px))}.split-payment-title{margin-top:-2px}.split-calc-card{margin:18px 0;overflow:hidden;border:1px solid var(--line);border-radius:18px;background:#fff}
    .split-field-row,.split-result-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;border-bottom:1px solid var(--line)}.split-result-row{border-bottom:0;background:#f7f3eb}.split-field-row>label{display:block;color:var(--ink);font-size:.95rem}.split-money-input{display:flex;gap:7px;justify-content:flex-end}.split-money-input input{width:120px;text-align:right}.split-money-input select{width:86px}.split-people{width:90px;text-align:right}.split-result-row span{font-weight:700;color:var(--muted)}.split-result-row strong{font-size:1.35rem;color:var(--deep)}
    @media(max-width:460px){.split-payment-btn{margin-top:10px;margin-left:auto}.split-money-input input{width:105px}.split-money-input select{width:80px}}
  `;
  document.head.appendChild(style);

  new MutationObserver(applyOverviewButtons).observe(overview, {childList:true, subtree:true});
  applyOverviewButtons();
})();