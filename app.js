/* Fiesta — application UI */
(function () {
  'use strict';
  const F = window.F, db = F.db, uid = F.uid, iso = F.iso, addDays = F.addDays;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const h = s => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; };
  const UI = {};
  let current = null, lastRoute = null;

  /* ---------- Icons ---------- */
  const IC = {
    home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    funnel: '<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11l2-8H6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 21c0-3-1.5-5-4-5.8"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    truck: '<path d="M1 6h13v10H1zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    kanban: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>',
    wallet: '<path d="M3 7h17a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 7l14-4v4M16 14h3"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
    id: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5 17c.5-2 2-3 4-3s3.5 1 4 3M15 9h4M15 13h4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
    bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
    moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>'
  };
  const ic = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;

  /* ---------- Helpers ---------- */
  const money = (n, d = 2) => { n = Number(n) || 0; return (n < 0 ? '-' : '') + db.settings.currency + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }); };
  const money0 = n => money(n, 0);
  const fdate = s => s ? new Date(s + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const byId = (coll, id) => db[coll].find(r => r.id === id);
  const nm = (coll, id, key = 'name') => { const x = byId(coll, id); return x ? x[key] : '—'; };
  const initials = n => String(n || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const today = () => iso(new Date());
  const BADGE = { Draft: 'gray', Confirmed: 'blue', Invoiced: 'purple', Paid: 'green', Cancelled: 'red', Ordered: 'blue', Received: 'green', Active: 'green', Inactive: 'gray', 'On Leave': 'amber', Pending: 'amber', Approved: 'green', Rejected: 'red', High: 'red', Medium: 'amber', Low: 'gray', Customer: 'blue', Vendor: 'purple', Income: 'green', Expense: 'red', 'In Stock': 'green', 'Low Stock': 'amber', 'Out of Stock': 'red' };
  const badge = t => `<span class="badge ${BADGE[t] || 'gray'}">${esc(t)}</span>`;
  const stockStatus = p => p.stock <= 0 ? 'Out of Stock' : p.stock <= p.reorder ? 'Low Stock' : 'In Stock';
  const timeAgo = t => { const m = Math.round((Date.now() - t) / 6e4); if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; const hr = Math.round(m / 60); if (hr < 24) return hr + ' h ago'; return Math.round(hr / 24) + ' d ago'; };
  const leaveDays = l => Math.round((new Date(l.to) - new Date(l.from)) / 864e5) + 1;
  const PALETTE = ['#6c4cf1', '#ff6b6b', '#12b886', '#f59f00', '#228be6', '#9c36b5', '#868e96'];

  function toast(msg, type = 'ok') {
    const t = h(`<div class="toast ${type}">${esc(msg)}</div>`);
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2800);
  }

  let openModals = 0;
  function modal({ title, body, footer = [], size = '' }) {
    const ov = h(`<div class="overlay"><div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" type="button" data-close aria-label="Close">${ic('x')}</button></div><div class="modal-body"></div><div class="modal-foot"></div></div></div>`);
    const bodyEl = $('.modal-body', ov);
    if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.appendChild(body);
    const onKey = e => { if (e.key === 'Escape' && ov === $$('.overlay').pop()) close(); };
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); openModals--; document.body.classList.toggle('modal-open', openModals > 0); };
    footer.forEach(b => {
      const btn = h(`<button type="${b.submit ? 'submit' : 'button'}" class="btn ${b.cls || 'ghost'}">${esc(b.label)}</button>`);
      if (b.submit) btn.setAttribute('form', b.submit);
      else btn.addEventListener('click', () => { if (b.fn && b.fn() === false) return; close(); });
      $('.modal-foot', ov).appendChild(btn);
    });
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    $('[data-close]', ov).addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    $('#modal-root').appendChild(ov);
    openModals++; document.body.classList.add('modal-open');
    const first = $('input:not([readonly]),select,textarea', bodyEl); if (first) first.focus();
    return { close, el: ov };
  }
  const confirmDlg = (msg, okLabel = 'Delete') => new Promise(res => {
    modal({ title: 'Please confirm', body: `<p>${esc(msg)}</p>`, size: 'sm', footer: [{ label: 'Cancel', fn: () => res(false) }, { label: okLabel, cls: 'danger', fn: () => res(true) }] });
  });

  function downloadFile(name, text, type = 'text/csv') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const toCSV = rows => rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

  /* ---------- Data operations ---------- */
  const nextNumber = (coll, prefix) => prefix + String(db[coll].reduce((a, r) => Math.max(a, parseInt(String(r.number || '').replace(/\D/g, '')) || 0), 0) + 1).padStart(4, '0');
  const appliesStatus = (coll, s) => coll === 'orders' ? F.SALE.includes(s) : s === 'Received';
  function stockEffect(coll, o, dir) {
    const p = byId('products', o.productId); if (!p) return;
    if (coll === 'orders') p.stock -= dir * o.qty; else p.stock += dir * o.qty;
  }
  function commit(coll, item, old) {
    if (coll === 'orders' || coll === 'purchases') {
      if (old && old.applied) stockEffect(coll, old, -1);
      item.applied = false;
      if (appliesStatus(coll, item.status)) { stockEffect(coll, item, 1); item.applied = true; }
    }
    const i = db[coll].findIndex(r => r.id === item.id);
    if (i < 0) db[coll].unshift(item); else db[coll][i] = item;
    F.persist();
  }
  function removeItem(coll, item) {
    if (item.applied) stockEffect(coll, item, -1);
    db[coll] = db[coll].filter(r => r.id !== item.id);
    F.persist();
  }
  function setStatus(key, r, status) {
    const m = M[key]; const d = { ...r, status };
    const err = m.validate && m.validate(d, r); if (err) return toast(err, 'error');
    commit(m.coll, d, r);
    F.log(`${m.noun} ${d.number || ''} marked ${status}`.replace('  ', ' '));
    toast(`Marked ${status}`); route();
  }

  /* ---------- Form builder ---------- */
  function fieldHTML(f, val) {
    const id = 'f_' + f.k, req = f.req ? 'required' : '';
    let inp;
    if (f.type === 'select' || f.type === 'ref') {
      const opts = f.type === 'ref' ? db[f.coll].filter(f.filter || (() => true)).map(x => [x.id, x.name]) : f.options.map(o => Array.isArray(o) ? o : [o, o]);
      inp = `<select class="input" id="${id}" name="${f.k}" ${req}>${f.opt ? '<option value="">— None —</option>' : ''}${opts.map(([v, l]) => `<option value="${esc(v)}" ${v == val ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    } else if (f.type === 'textarea') {
      inp = `<textarea class="input" id="${id}" name="${f.k}" rows="3">${esc(val)}</textarea>`;
    } else {
      inp = `<input class="input" id="${id}" name="${f.k}" type="${f.type || 'text'}" value="${esc(val)}" ${req} ${f.type === 'number' ? `step="${f.step || 'any'}" min="${f.min ?? 0}"` : ''}>`;
    }
    return `<label class="field ${f.full ? 'full' : ''}"><span>${esc(f.label)}${f.req ? ' *' : ''}</span>${inp}</label>`;
  }
  function openForm(m, item, preset = {}) {
    const isNew = !item;
    const base = item ? { ...item } : { id: uid(), ...preset };
    const fid = 'form_' + uid();
    const form = document.createElement('form');
    form.id = fid; form.className = 'form-grid';
    form.innerHTML = m.fields.map(f => fieldHTML(f, base[f.k] !== undefined ? base[f.k] : (typeof f.def === 'function' ? f.def() : (f.def ?? '')))).join('');
    if (m.bind) m.bind(form, base);
    const footer = [];
    if (!isNew) footer.push({ label: 'Delete', cls: 'danger left', fn: () => { confirmDlg(`Delete this ${m.noun}? This cannot be undone.`).then(ok => { if (ok) { removeItem(m.coll, item); F.log(`Deleted ${m.noun}`); md.close(); toast('Deleted'); route(); } }); return false; } });
    footer.push({ label: 'Cancel' }, { label: isNew ? 'Create' : 'Save changes', cls: 'primary', submit: fid });
    const md = modal({ title: (isNew ? 'New ' : 'Edit ') + m.noun, body: form, footer });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = { ...base };
      m.fields.forEach(f => { let v = form.elements[f.k].value; if (f.type === 'number') v = v === '' ? 0 : Number(v); data[f.k] = v; });
      if (isNew && m.prefix) data.number = nextNumber(m.coll, m.prefix);
      const err = m.validate && m.validate(data, item);
      if (err) return toast(err, 'error');
      commit(m.coll, data, item);
      F.log(`${isNew ? 'Created' : 'Updated'} ${m.noun}${data.number ? ' ' + data.number : data.name ? ' “' + data.name + '”' : data.title ? ' “' + data.title + '”' : ''}`);
      md.close(); toast(isNew ? 'Created' : 'Saved'); route();
    });
  }

  /* ---------- Module definitions ---------- */
  const col = (k, label, o = {}) => ({ k, label, v: o.v || (r => r[k]), html: o.html, num: o.num });
  const lineBind = priceKey => (form, base) => {
    const f = form.elements, calc = h('<div class="calc full"></div>'); form.appendChild(calc);
    const upd = () => {
      const q = +f.qty.value || 0, p = +f[priceKey].value || 0, d = f.discount ? (+f.discount.value || 0) : 0;
      const sub = q * p * (1 - d / 100), tax = priceKey === 'price' ? sub * (db.settings.tax / 100) : 0;
      calc.innerHTML = `Subtotal <b>${money(sub)}</b>` + (priceKey === 'price' ? ` · Tax (${db.settings.tax}%) <b>${money(tax)}</b> · Total <b>${money(sub + tax)}</b>` : '');
    };
    f.productId.addEventListener('change', () => { const p = byId('products', f.productId.value); if (p) { f[priceKey].value = priceKey === 'price' ? p.price : p.cost; upd(); } });
    ['qty', priceKey, 'discount'].forEach(n => f[n] && f[n].addEventListener('input', upd));
    upd();
  };
  const EXP_CATS = ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Software', 'Travel', 'Supplies', 'Tax', 'Consulting', 'Sales', 'Other'];

  const M = {
    contacts: {
      title: 'Contacts', sub: 'Customers and vendors in one place', coll: 'contacts', noun: 'contact',
      filter: { label: 'All types', get: r => r.type, options: () => ['Customer', 'Vendor'] },
      summary: rows => [['Total contacts', rows.length], ['Customers', rows.filter(r => r.type === 'Customer').length], ['Vendors', rows.filter(r => r.type === 'Vendor').length]],
      cols: [col('name', 'Name', { html: r => `<strong>${esc(r.name)}</strong>` }), col('type', 'Type', { html: r => badge(r.type) }), col('company', 'Company'), col('email', 'Email'), col('phone', 'Phone'), col('city', 'City')],
      fields: [
        { k: 'name', label: 'Name', req: 1 }, { k: 'type', label: 'Type', type: 'select', options: ['Customer', 'Vendor'], def: 'Customer' },
        { k: 'company', label: 'Company' }, { k: 'email', label: 'Email', type: 'email' }, { k: 'phone', label: 'Phone' }, { k: 'city', label: 'City' },
        { k: 'notes', label: 'Notes', type: 'textarea', full: 1 }]
    },
    products: {
      title: 'Inventory', sub: 'Products, stock levels and reorder alerts', coll: 'products', noun: 'product',
      filter: { label: 'All categories', get: r => r.category, options: () => [...new Set(db.products.map(p => p.category))].sort() },
      summary: rows => [['Products', rows.length], ['Stock value (cost)', money0(sum(rows, p => p.stock * p.cost))], ['Low / out of stock', rows.filter(p => stockStatus(p) !== 'In Stock').length]],
      cols: [col('name', 'Product', { html: r => `<strong>${esc(r.name)}</strong>` }), col('sku', 'SKU'), col('category', 'Category'),
        col('cost', 'Cost', { num: 1, html: r => money(r.cost) }), col('price', 'Price', { num: 1, html: r => money(r.price) }),
        col('stock', 'On hand', { num: 1 }), col('reorder', 'Reorder at', { num: 1 }), col('status', 'Status', { v: stockStatus, html: r => badge(stockStatus(r)) })],
      fields: [
        { k: 'name', label: 'Product name', req: 1 }, { k: 'sku', label: 'SKU', req: 1 }, { k: 'category', label: 'Category', def: 'General' }, { k: 'reorder', label: 'Reorder level', type: 'number', def: 10, step: 1 },
        { k: 'cost', label: 'Cost price', type: 'number', req: 1, step: 0.01 }, { k: 'price', label: 'Sale price', type: 'number', req: 1, step: 0.01 },
        { k: 'stock', label: 'Stock on hand', type: 'number', def: 0, step: 1 }]
    },
    orders: {
      title: 'Sales Orders', sub: 'Quotes, orders and invoices', coll: 'orders', noun: 'order', prefix: 'SO-',
      filter: { label: 'All statuses', get: r => r.status, options: () => ['Draft', 'Confirmed', 'Invoiced', 'Paid', 'Cancelled'] },
      summary: rows => [['Orders', rows.length], ['Net sales', money0(sum(rows.filter(F.isSale), F.orderSub))], ['Awaiting payment', money0(sum(rows.filter(r => r.status === 'Invoiced'), F.orderTotal))]],
      cols: [col('number', 'Order', { html: r => `<strong>${esc(r.number)}</strong>` }), col('date', 'Date', { html: r => fdate(r.date) }),
        col('customer', 'Customer', { v: r => nm('contacts', r.customerId) }), col('product', 'Product', { v: r => nm('products', r.productId) }),
        col('qty', 'Qty', { num: 1 }), col('total', 'Total', { num: 1, v: r => Math.round(F.orderTotal(r) * 100) / 100, html: r => money(F.orderTotal(r)) }),
        col('status', 'Status', { html: r => badge(r.status) })],
      actions: [
        { label: 'Confirm', show: r => r.status === 'Draft', fn: r => setStatus('orders', r, 'Confirmed') },
        { label: 'Invoice', show: r => r.status === 'Confirmed', fn: r => { setStatus('orders', r, 'Invoiced'); } },
        { label: 'View invoice', show: r => ['Invoiced', 'Paid'].includes(r.status), fn: r => showInvoice(r) },
        { label: 'Mark paid', show: r => r.status === 'Invoiced', fn: r => setStatus('orders', r, 'Paid') }],
      fields: [
        { k: 'date', label: 'Date', type: 'date', req: 1, def: today }, { k: 'status', label: 'Status', type: 'select', options: ['Draft', 'Confirmed', 'Invoiced', 'Paid', 'Cancelled'], def: 'Draft' },
        { k: 'customerId', label: 'Customer', type: 'ref', coll: 'contacts', filter: c => c.type === 'Customer', req: 1 }, { k: 'productId', label: 'Product', type: 'ref', coll: 'products', req: 1 },
        { k: 'qty', label: 'Quantity', type: 'number', req: 1, def: 1, min: 1, step: 1 }, { k: 'price', label: 'Unit price', type: 'number', req: 1, step: 0.01, def: () => db.products[0]?.price ?? 0 },
        { k: 'discount', label: 'Discount %', type: 'number', def: 0, step: 0.1 }],
      bind: lineBind('price'),
      validate(d, old) {
        if (!(d.qty > 0)) return 'Quantity must be at least 1.';
        const p = byId('products', d.productId);
        if (p && F.SALE.includes(d.status)) { const avail = p.stock + (old && old.applied && old.productId === d.productId ? old.qty : 0); if (d.qty > avail) return `Only ${avail} in stock for ${p.name}.`; }
      }
    },
    purchases: {
      title: 'Purchases', sub: 'Order from vendors and receive stock', coll: 'purchases', noun: 'purchase order', prefix: 'PO-',
      filter: { label: 'All statuses', get: r => r.status, options: () => ['Draft', 'Ordered', 'Received'] },
      summary: rows => [['Purchase orders', rows.length], ['Open (not received)', rows.filter(r => r.status !== 'Received').length], ['Received value', money0(sum(rows.filter(r => r.status === 'Received'), r => r.qty * r.cost))]],
      cols: [col('number', 'PO', { html: r => `<strong>${esc(r.number)}</strong>` }), col('date', 'Date', { html: r => fdate(r.date) }), col('vendor', 'Vendor', { v: r => nm('contacts', r.vendorId) }),
        col('product', 'Product', { v: r => nm('products', r.productId) }), col('qty', 'Qty', { num: 1 }), col('total', 'Total', { num: 1, v: r => r.qty * r.cost, html: r => money(r.qty * r.cost) }), col('status', 'Status', { html: r => badge(r.status) })],
      actions: [{ label: 'Place order', show: r => r.status === 'Draft', fn: r => setStatus('purchases', r, 'Ordered') }, { label: 'Receive', show: r => r.status === 'Ordered', fn: r => setStatus('purchases', r, 'Received') }],
      fields: [
        { k: 'date', label: 'Date', type: 'date', req: 1, def: today }, { k: 'status', label: 'Status', type: 'select', options: ['Draft', 'Ordered', 'Received'], def: 'Draft' },
        { k: 'vendorId', label: 'Vendor', type: 'ref', coll: 'contacts', filter: c => c.type === 'Vendor', req: 1 }, { k: 'productId', label: 'Product', type: 'ref', coll: 'products', req: 1 },
        { k: 'qty', label: 'Quantity', type: 'number', req: 1, def: 10, min: 1, step: 1 }, { k: 'cost', label: 'Unit cost', type: 'number', req: 1, step: 0.01, def: () => db.products[0]?.cost ?? 0 }],
      bind: lineBind('cost'),
      validate: d => d.qty > 0 ? '' : 'Quantity must be at least 1.'
    },
    accounting: {
      title: 'Accounting', sub: 'Track income and expenses', coll: 'expenses', noun: 'entry',
      filter: { label: 'Income & expenses', get: r => r.type, options: () => ['Income', 'Expense'] },
      summary: rows => { const i = sum(rows.filter(r => r.type === 'Income'), r => r.amount), e = sum(rows.filter(r => r.type === 'Expense'), r => r.amount); return [['Income', money0(i)], ['Expenses', money0(e)], ['Net', money0(i - e)]]; },
      cols: [col('date', 'Date', { html: r => fdate(r.date) }), col('type', 'Type', { html: r => badge(r.type) }), col('category', 'Category'), col('description', 'Description'),
        col('amount', 'Amount', { num: 1, html: r => `<span class="${r.type === 'Income' ? 'pos' : 'neg'}">${r.type === 'Income' ? '+' : '-'}${money(r.amount)}</span>` })],
      fields: [
        { k: 'date', label: 'Date', type: 'date', req: 1, def: today }, { k: 'type', label: 'Type', type: 'select', options: ['Expense', 'Income'], def: 'Expense' },
        { k: 'category', label: 'Category', type: 'select', options: EXP_CATS, def: 'Other' }, { k: 'amount', label: 'Amount', type: 'number', req: 1, step: 0.01 },
        { k: 'description', label: 'Description', full: 1 }],
      validate: d => d.amount > 0 ? '' : 'Amount must be greater than zero.'
    },
    employees: {
      title: 'Employees', sub: 'Your team directory and payroll overview', coll: 'employees', noun: 'employee',
      filter: { label: 'All departments', get: r => r.dept, options: () => [...new Set(db.employees.map(e => e.dept))].sort() },
      summary: rows => [['Headcount', rows.length], ['Active', rows.filter(r => r.status === 'Active').length], ['Monthly payroll', money0(sum(rows.filter(r => r.status !== 'Inactive'), r => r.salary))]],
      cols: [col('name', 'Name', { html: r => `<div style="display:flex;align-items:center;gap:10px"><span class="avatar sm">${initials(r.name)}</span><strong>${esc(r.name)}</strong></div>` }), col('dept', 'Department'), col('role', 'Role'), col('email', 'Email'), col('phone', 'Phone'),
        col('salary', 'Salary / mo', { num: 1, html: r => money0(r.salary) }), col('status', 'Status', { html: r => badge(r.status) }), col('joined', 'Joined', { html: r => fdate(r.joined) })],
      fields: [
        { k: 'name', label: 'Full name', req: 1 }, { k: 'dept', label: 'Department', req: 1, def: 'Operations' }, { k: 'role', label: 'Job title' }, { k: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'], def: 'Active' },
        { k: 'email', label: 'Email', type: 'email' }, { k: 'phone', label: 'Phone' }, { k: 'salary', label: 'Monthly salary', type: 'number', def: 0, step: 1 }, { k: 'joined', label: 'Joined', type: 'date', def: today }]
    },
    leaves: {
      title: 'Time Off', sub: 'Leave requests and approvals', coll: 'leaves', noun: 'leave request',
      filter: { label: 'All statuses', get: r => r.status, options: () => ['Pending', 'Approved', 'Rejected'] },
      summary: rows => [['Requests', rows.length], ['Pending', rows.filter(r => r.status === 'Pending').length], ['Approved days', sum(rows.filter(r => r.status === 'Approved'), leaveDays)]],
      cols: [col('employee', 'Employee', { v: r => nm('employees', r.empId), html: r => `<strong>${esc(nm('employees', r.empId))}</strong>` }), col('type', 'Type'), col('from', 'From', { html: r => fdate(r.from) }), col('to', 'To', { html: r => fdate(r.to) }),
        col('days', 'Days', { num: 1, v: leaveDays }), col('reason', 'Reason'), col('status', 'Status', { html: r => badge(r.status) })],
      actions: [{ label: 'Approve', show: r => r.status === 'Pending', fn: r => setStatus('leaves', r, 'Approved') }, { label: 'Reject', show: r => r.status === 'Pending', fn: r => setStatus('leaves', r, 'Rejected') }],
      fields: [
        { k: 'empId', label: 'Employee', type: 'ref', coll: 'employees', req: 1 }, { k: 'type', label: 'Leave type', type: 'select', options: ['Annual', 'Sick', 'Casual', 'Unpaid', 'Parental'], def: 'Annual' },
        { k: 'from', label: 'From', type: 'date', req: 1, def: today }, { k: 'to', label: 'To', type: 'date', req: 1, def: today }, { k: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'Rejected'], def: 'Pending' },
        { k: 'reason', label: 'Reason', full: 1 }],
      validate: d => d.to >= d.from ? '' : 'The end date must be on or after the start date.'
    },
    crm: {
      kanban: true, title: 'CRM Pipeline', sub: 'Drag deals between stages to track progress', coll: 'leads', noun: 'lead', stageKey: 'stage',
      stages: ['New', 'Qualified', 'Proposal', 'Won', 'Lost'], colors: ['#868e96', '#228be6', '#f59f00', '#12b886', '#f03e3e'],
      sum: items => money0(sum(items, r => r.value)),
      summary: items => [['Open pipeline', money0(sum(items.filter(r => !['Won', 'Lost'].includes(r.stage)), r => r.value))], ['Won', money0(sum(items.filter(r => r.stage === 'Won'), r => r.value))], ['Win rate', (() => { const w = items.filter(r => r.stage === 'Won').length, l = items.filter(r => r.stage === 'Lost').length; return w + l ? Math.round(w / (w + l) * 100) + '%' : '—'; })()]],
      card: r => `<div class="kc-title">${esc(r.title)}</div><div class="kc-sub">${esc(r.company || '')}</div><div class="kc-meta"><span class="kc-val">${money0(r.value)}</span><span class="${r.due && r.due < today() && !['Won', 'Lost'].includes(r.stage) ? 'overdue' : ''}">${r.due ? fdate(r.due) : ''}</span>${r.owner ? `<span class="avatar sm" title="${esc(nm('employees', r.owner))}">${initials(nm('employees', r.owner))}</span>` : ''}</div>`,
      text: r => r.title + ' ' + (r.company || ''),
      fields: [
        { k: 'title', label: 'Opportunity', req: 1, full: 1 }, { k: 'company', label: 'Company' }, { k: 'value', label: 'Expected value', type: 'number', def: 0, step: 1 },
        { k: 'stage', label: 'Stage', type: 'select', options: ['New', 'Qualified', 'Proposal', 'Won', 'Lost'], def: 'New' }, { k: 'owner', label: 'Owner', type: 'ref', coll: 'employees', opt: 1 },
        { k: 'due', label: 'Expected close', type: 'date' }]
    },
    tasks: {
      kanban: true, title: 'Projects', sub: 'Plan work and keep the team in sync', coll: 'tasks', noun: 'task', stageKey: 'stage',
      stages: ['To Do', 'In Progress', 'Review', 'Done'], colors: ['#868e96', '#228be6', '#f59f00', '#12b886'],
      summary: items => [['Open tasks', items.filter(r => r.stage !== 'Done').length], ['Overdue', items.filter(r => r.stage !== 'Done' && r.due && r.due < today()).length], ['Completed', items.filter(r => r.stage === 'Done').length]],
      card: r => `<div class="kc-title">${esc(r.title)}</div><div class="kc-meta">${badge(r.priority)}<span class="${r.due && r.due < today() && r.stage !== 'Done' ? 'overdue' : ''}">${r.due ? fdate(r.due) : ''}</span>${r.assignee ? `<span class="avatar sm" title="${esc(nm('employees', r.assignee))}">${initials(nm('employees', r.assignee))}</span>` : ''}</div>`,
      text: r => r.title + ' ' + (r.description || ''),
      fields: [
        { k: 'title', label: 'Task', req: 1, full: 1 }, { k: 'assignee', label: 'Assignee', type: 'ref', coll: 'employees', opt: 1 }, { k: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'], def: 'Medium' },
        { k: 'stage', label: 'Stage', type: 'select', options: ['To Do', 'In Progress', 'Review', 'Done'], def: 'To Do' }, { k: 'due', label: 'Due date', type: 'date' },
        { k: 'description', label: 'Details', type: 'textarea', full: 1 }]
    }
  };

  /* ---------- Generic list (CRUD) view ---------- */
  const kpiHTML = items => items.map(([l, v]) => `<div class="kpi"><div><small>${esc(l)}</small><b>${esc(v)}</b></div></div>`).join('');

  function crudView(key) {
    const m = M[key], st = (UI[key] ??= { q: '', sort: -1, dir: 1, page: 1, f: '' }), PAGE = 10;
    const root = h(`<section>
      <div class="page-head"><div><h1>${esc(m.title)}</h1><p class="muted">${esc(m.sub)}</p></div>
        <div class="head-actions"><button class="btn ghost" data-exp>${ic('download', 16)} Export CSV</button><button class="btn primary" data-add>${ic('plus', 16)} New ${esc(m.noun)}</button></div></div>
      <div class="kpis small" data-sum></div>
      <div class="card flush"><div class="toolbar"><div class="input-icon">${ic('search', 16)}<input class="input" type="search" placeholder="Search ${esc(m.title.toLowerCase())}…" value="${esc(st.q)}" data-q></div>
        ${m.filter ? `<select class="input" data-f style="max-width:210px"><option value="">${esc(m.filter.label)}</option>${m.filter.options().map(o => `<option ${o === st.f ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : ''}
        <span class="muted count" data-count></span></div>
        <div class="table-wrap" data-tbl></div><div class="pager" data-pager></div></div></section>`);
    let rows = [];
    const draw = () => {
      rows = db[m.coll].slice();
      if (m.filter && st.f) rows = rows.filter(r => m.filter.get(r) === st.f);
      if (st.q) { const q = st.q.toLowerCase(); rows = rows.filter(r => m.cols.some(c => String(c.v(r) ?? '').toLowerCase().includes(q))); }
      if (st.sort >= 0) { const c = m.cols[st.sort]; rows.sort((a, b) => { const x = c.v(a), y = c.v(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * st.dir; }); }
      $('[data-sum]', root).innerHTML = m.summary ? kpiHTML(m.summary(rows)) : '';
      const pages = Math.max(1, Math.ceil(rows.length / PAGE)); st.page = Math.min(st.page, pages);
      const view = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
      $('[data-count]', root).textContent = `${rows.length} record${rows.length === 1 ? '' : 's'}`;
      $('[data-tbl]', root).innerHTML = view.length ? `<table class="table"><thead><tr>${m.cols.map((c, i) => `<th data-sort="${i}" class="${c.num ? 'num' : ''}">${esc(c.label)}${st.sort === i ? (st.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}<th></th></tr></thead>
        <tbody>${view.map(r => `<tr data-id="${r.id}">${m.cols.map(c => `<td class="${c.num ? 'num' : ''}">${c.html ? c.html(r) : esc(c.v(r))}</td>`).join('')}<td><div class="row-actions">${(m.actions || []).map((a, i) => a.show(r) ? `<button class="btn ghost sm" data-act="${i}">${esc(a.label)}</button>` : '').join('')}<button class="icon-btn" data-edit aria-label="Edit">${ic('edit', 15)}</button><button class="icon-btn" data-del aria-label="Delete">${ic('trash', 15)}</button></div></td></tr>`).join('')}</tbody></table>`
        : `<div class="empty">No ${esc(m.title.toLowerCase())} found. Try a different search, or create a new ${esc(m.noun)}.</div>`;
      $('[data-pager]', root).innerHTML = rows.length > PAGE ? `<span class="muted">Page ${st.page} of ${pages}</span><div><button class="btn ghost sm" data-pg="-1" ${st.page === 1 ? 'disabled' : ''}>Previous</button><button class="btn ghost sm" data-pg="1" ${st.page === pages ? 'disabled' : ''}>Next</button></div>` : '';
    };
    root.addEventListener('input', e => { if (e.target.matches('[data-q]')) { st.q = e.target.value; st.page = 1; draw(); } });
    root.addEventListener('change', e => { if (e.target.matches('[data-f]')) { st.f = e.target.value; st.page = 1; draw(); } });
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-sort],[data-act],[data-edit],[data-del],[data-pg],[data-add],[data-exp]'); if (!t) return;
      const tr = t.closest('tr'), row = tr ? byId(m.coll, tr.dataset.id) : null;
      if (t.dataset.sort !== undefined) { const i = +t.dataset.sort; st.dir = st.sort === i ? -st.dir : 1; st.sort = i; draw(); }
      else if (t.dataset.pg) { st.page += +t.dataset.pg; draw(); }
      else if (t.hasAttribute('data-add')) openForm(m);
      else if (t.hasAttribute('data-exp')) { downloadFile(`fiesta-${key}.csv`, toCSV([m.cols.map(c => c.label), ...rows.map(r => m.cols.map(c => c.v(r)))])); toast('CSV exported'); }
      else if (row && t.dataset.act !== undefined) m.actions[+t.dataset.act].fn(row);
      else if (row && t.hasAttribute('data-edit')) openForm(m, row);
      else if (row && t.hasAttribute('data-del')) confirmDlg(`Delete this ${m.noun}? This cannot be undone.`).then(ok => { if (ok) { removeItem(m.coll, row); F.log(`Deleted ${m.noun}`); toast('Deleted'); route(); } });
    });
    draw();
    return root;
  }

  /* ---------- Kanban view ---------- */
  function kanbanView(key) {
    const m = M[key], st = (UI[key] ??= { q: '' });
    const root = h(`<section><div class="page-head"><div><h1>${esc(m.title)}</h1><p class="muted">${esc(m.sub)}</p></div>
      <div class="head-actions"><div class="input-icon" style="min-width:220px">${ic('search', 16)}<input class="input" type="search" placeholder="Filter cards…" value="${esc(st.q)}" data-q></div><button class="btn primary" data-add>${ic('plus', 16)} New ${esc(m.noun)}</button></div></div>
      <div class="kpis small" data-sum></div><div class="board" data-board></div></section>`);
    const draw = () => {
      const all = db[m.coll], q = st.q.toLowerCase();
      $('[data-sum]', root).innerHTML = kpiHTML(m.summary(all));
      $('[data-board]', root).innerHTML = m.stages.map((s, si) => {
        const items = all.filter(r => r[m.stageKey] === s && (!q || m.text(r).toLowerCase().includes(q)));
        return `<div class="kcol"><div class="kcol-head"><i style="background:${m.colors[si]}"></i>${esc(s)} <span class="muted">${items.length}</span>${m.sum ? `<span class="sum">${m.sum(items)}</span>` : ''}</div>
          <div class="kcol-body" data-stage="${esc(s)}">${items.map(r => `<div class="kcard" draggable="true" data-id="${r.id}">${m.card(r)}<div class="kc-meta" style="margin-top:8px"><span class="kc-move">${si > 0 ? `<button data-move="-1" aria-label="Move left">${ic('left', 12)}</button>` : ''}${si < m.stages.length - 1 ? `<button data-move="1" aria-label="Move right">${ic('right', 12)}</button>` : ''}</span></div></div>`).join('')}</div>
          <button class="kadd" data-add-stage="${esc(s)}">+ Add</button></div>`;
      }).join('');
    };
    const move = (id, stage) => { const r = byId(m.coll, id); if (!r || r[m.stageKey] === stage) return; r[m.stageKey] = stage; F.persist(); F.log(`Moved “${r.title}” to ${stage}`); draw(); };
    root.addEventListener('input', e => { if (e.target.matches('[data-q]')) { st.q = e.target.value; draw(); } });
    root.addEventListener('click', e => {
      const mv = e.target.closest('[data-move]');
      if (mv) { const r = byId(m.coll, mv.closest('.kcard').dataset.id); move(r.id, m.stages[m.stages.indexOf(r[m.stageKey]) + +mv.dataset.move]); return; }
      const ad = e.target.closest('[data-add-stage]'); if (ad) return openForm(m, null, { [m.stageKey]: ad.dataset.addStage });
      if (e.target.closest('[data-add]')) return openForm(m);
      const card = e.target.closest('.kcard'); if (card) openForm(m, byId(m.coll, card.dataset.id));
    });
    root.addEventListener('dragstart', e => { const c = e.target.closest('.kcard'); if (!c) return; e.dataTransfer.setData('text/plain', c.dataset.id); e.dataTransfer.effectAllowed = 'move'; c.classList.add('dragging'); });
    root.addEventListener('dragend', () => { $$('.dragging,.over', root).forEach(x => x.classList.remove('dragging', 'over')); });
    root.addEventListener('dragover', e => { const b = e.target.closest('.kcol-body'); if (b) { e.preventDefault(); $$('.over', root).forEach(x => x !== b && x.classList.remove('over')); b.classList.add('over'); } });
    root.addEventListener('drop', e => { const b = e.target.closest('.kcol-body'); if (!b) return; e.preventDefault(); move(e.dataTransfer.getData('text/plain'), b.dataset.stage); });
    draw();
    return root;
  }

  /* ---------- Charts (canvas, no libraries) ---------- */
  function themeColors() { const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim(); return { text: g('--muted'), grid: g('--border'), card: g('--surface'), main: g('--text') }; }
  function prep(c) { const r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1; c.width = Math.max(1, r.width * d); c.height = Math.max(1, r.height * d); const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [x, r.width, r.height]; }
  const short = v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(v % 1e3 ? 1 : 0) + 'k' : String(Math.round(v));
  function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function barChart(c, labels, sets) {
    const [x, w, hh] = prep(c), t = themeColors(), pad = { l: 46, r: 8, t: 10, b: 26 };
    const max = Math.max(1, ...sets.flatMap(s => s.data)), step = niceStep(max / 4), top = step * Math.ceil(max / step);
    x.font = '11px system-ui,sans-serif'; x.strokeStyle = t.grid; x.fillStyle = t.text; x.textAlign = 'right'; x.textBaseline = 'middle';
    for (let v = 0; v <= top + 1e-9; v += step) { const y = pad.t + (hh - pad.t - pad.b) * (1 - v / top); x.beginPath(); x.moveTo(pad.l, y); x.lineTo(w - pad.r, y); x.stroke(); x.fillText(short(v), pad.l - 6, y); }
    const gw = (w - pad.l - pad.r) / labels.length, bw = Math.min(28, gw / (sets.length + 1));
    labels.forEach((l, i) => {
      const cx = pad.l + gw * i + gw / 2; x.textAlign = 'center'; x.fillStyle = t.text; x.fillText(l, cx, hh - pad.b + 14);
      sets.forEach((s, j) => { const bh = (hh - pad.t - pad.b) * (s.data[i] / top), bx = cx - (sets.length * bw) / 2 + j * bw + 1; x.fillStyle = s.color; x.beginPath(); if (x.roundRect) x.roundRect(bx, hh - pad.b - bh, bw - 2, bh, [5, 5, 0, 0]); else x.rect(bx, hh - pad.b - bh, bw - 2, bh); x.fill(); });
    });
  }
  function donut(c, items, centerLabel) {
    const [x, w, hh] = prep(c), t = themeColors(), total = sum(items, i => i.value) || 1, cx = w / 2, cy = hh / 2, R = Math.min(w, hh) / 2 - 6;
    let a = -Math.PI / 2;
    items.forEach(it => { const ang = it.value / total * Math.PI * 2; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R, a, a + ang); x.closePath(); x.fillStyle = it.color; x.fill(); a += ang; });
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(cx, cy, R * 0.62, 0, Math.PI * 2); x.fill(); x.globalCompositeOperation = 'source-over';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = t.main; x.font = '700 16px system-ui,sans-serif'; x.fillText(money0(total), cx, cy - 6); x.fillStyle = t.text; x.font = '11px system-ui,sans-serif'; x.fillText(centerLabel, cx, cy + 12);
  }

  /* ---------- Dashboard ---------- */
  function kpi(label, value, sub, icon, tint) { return `<div class="kpi"><div class="ico tint-${tint}">${ic(icon, 22)}</div><div><small>${esc(label)}</small><b>${value}</b>${sub || ''}</div></div>`; }
  const delta = (cur, prev) => { if (!prev) return '<span class="muted delta">—</span>'; const p = (cur - prev) / Math.abs(prev) * 100; return `<span class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(0)}% vs last month</span>`; };

  function dashboardView() {
    const keys = F.monthKeys(6), S = F.series(keys), n = keys.length - 1;
    const profit = S.rev.map((r, i) => r - S.exp[i]);
    const openLeads = db.leads.filter(l => !['Won', 'Lost'].includes(l.stage));
    const low = db.products.filter(p => stockStatus(p) !== 'In Stock');
    const unpaid = sum(db.orders.filter(o => o.status === 'Invoiced'), F.orderTotal);
    const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    const pend = db.leaves.filter(l => l.status === 'Pending');
    const stages = M.crm.stages, maxC = Math.max(1, ...stages.map(s => db.leads.filter(l => l.stage === s).length));
    const bd = F.expenseBreakdown(keys), bdItems = Object.entries(bd).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }));
    const root = h(`<section>
      <div class="page-head"><div><h1>${greet}, ${esc(db.settings.user.name)} 👋</h1><p class="muted">${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Here is how ${esc(db.settings.company)} is doing</p></div></div>
      <div class="quick">
        <button class="btn primary" data-q="orders">${ic('plus', 16)} New order</button><button class="btn ghost" data-q="crm">${ic('plus', 16)} New lead</button>
        <button class="btn ghost" data-q="contacts">${ic('plus', 16)} New contact</button><button class="btn ghost" data-q="accounting">${ic('plus', 16)} New expense</button><button class="btn ghost" data-q="tasks">${ic('plus', 16)} New task</button></div>
      <div class="kpis">
        ${kpi('Revenue (this month)', money0(S.rev[n]), delta(S.rev[n], S.rev[n - 1]), 'trend', 'violet')}
        ${kpi('Expenses (this month)', money0(S.exp[n]), delta(S.exp[n], S.exp[n - 1]), 'wallet', 'red')}
        ${kpi('Net profit (this month)', money0(profit[n]), delta(profit[n], profit[n - 1]), 'chart', profit[n] >= 0 ? 'green' : 'red')}
        ${kpi('Open pipeline', money0(sum(openLeads, l => l.value)), `<span class="muted delta">${openLeads.length} open deals</span>`, 'funnel', 'blue')}
        ${kpi('Awaiting payment', money0(unpaid), `<span class="muted delta">${db.orders.filter(o => o.status === 'Invoiced').length} invoices</span>`, 'cart', 'amber')}
        ${kpi('Stock alerts', low.length, `<span class="muted delta">items low or out</span>`, 'alert', low.length ? 'amber' : 'green')}
      </div>
      <div class="grid g-3-1">
        <div class="card"><div class="card-head"><h2>Revenue vs expenses</h2><span class="muted">Last 6 months</span></div>
          <div class="legend"><span><i style="background:#6c4cf1"></i>Revenue</span><span><i style="background:#ff6b6b"></i>Expenses</span></div><canvas class="chart" id="ch1" role="img" aria-label="Revenue versus expenses bar chart"></canvas></div>
        <div class="card"><div class="card-head"><h2>Where the money goes</h2></div><canvas class="donut" id="ch2" role="img" aria-label="Expense breakdown"></canvas>
          <div class="legend col">${bdItems.map(i => `<span><span><i style="background:${i.color}"></i>${esc(i.label)}</span><b>${money0(i.value)}</b></span>`).join('') || '<span>No expenses yet</span>'}</div></div>
      </div>
      <div class="grid g-3-1">
        <div class="card flush"><div class="card-head" style="padding:16px 18px 0"><h2>Recent orders</h2><a class="btn ghost sm" href="#/orders">View all</a></div>
          <div class="table-wrap"><table class="table mini"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th class="num">Total</th><th>Status</th></tr></thead><tbody>
          ${db.orders.slice(0, 6).map(o => `<tr><td><strong>${esc(o.number)}</strong></td><td>${esc(nm('contacts', o.customerId))}</td><td>${fdate(o.date)}</td><td class="num">${money(F.orderTotal(o))}</td><td>${badge(o.status)}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="card"><div class="card-head"><h2>Low stock</h2><a class="btn ghost sm" href="#/products">Inventory</a></div><div class="list">
          ${low.slice(0, 6).map(p => `<div class="list-row"><div class="grow"><strong>${esc(p.name)}</strong><small>${p.stock} left · reorder at ${p.reorder}</small></div>${badge(stockStatus(p))}</div>`).join('') || '<div class="muted">All products are well stocked 🎉</div>'}</div></div>
      </div>
      <div class="grid g-3">
        <div class="card"><div class="card-head"><h2>Sales pipeline</h2><a class="btn ghost sm" href="#/crm">Open</a></div>
          ${stages.map((s, i) => { const items = db.leads.filter(l => l.stage === s); return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><span>${esc(s)} <span class="muted">(${items.length})</span></span><b>${money0(sum(items, l => l.value))}</b></div><div class="bar"><span style="width:${items.length / maxC * 100}%;background:${M.crm.colors[i]}"></span></div></div>`; }).join('')}</div>
        <div class="card"><div class="card-head"><h2>Pending time off</h2><a class="btn ghost sm" href="#/leaves">All</a></div><div class="list">
          ${pend.map(l => `<div class="list-row"><div class="grow"><strong>${esc(nm('employees', l.empId))}</strong><small>${esc(l.type)} · ${fdate(l.from)} · ${leaveDays(l)} day(s)</small></div><button class="btn ghost sm" data-lv="${l.id}:Approved">Approve</button><button class="btn ghost sm" data-lv="${l.id}:Rejected">Reject</button></div>`).join('') || '<div class="muted">No requests waiting.</div>'}</div></div>
        <div class="card"><div class="card-head"><h2>Recent activity</h2></div><div class="list">
          ${db.activity.slice(0, 7).map(a => `<div class="list-row"><div class="grow tl">${esc(a.msg)}<small>${timeAgo(a.t)}</small></div></div>`).join('')}</div></div>
      </div></section>`);
    root.addEventListener('click', e => {
      const q = e.target.closest('[data-q]'); if (q) return openForm(M[q.dataset.q]);
      const lv = e.target.closest('[data-lv]'); if (lv) { const [id, s] = lv.dataset.lv.split(':'); setStatus('leaves', byId('leaves', id), s); }
    });
    root._after = () => {
      barChart($('#ch1', root), keys.map(F.monthLabel), [{ data: S.rev, color: '#6c4cf1' }, { data: S.exp, color: '#ff6b6b' }]);
      if (bdItems.length) donut($('#ch2', root), bdItems, 'last 6 months');
    };
    return root;
  }

  /* ---------- Invoice ---------- */
  function showInvoice(o) {
    const c = byId('contacts', o.customerId) || {}, p = byId('products', o.productId) || {}, sub = F.orderSub(o), tax = sub * db.settings.tax / 100;
    const color = o.status === 'Paid' ? '#12b886' : '#f59f00';
    const body = h(`<div class="invoice" id="printable">
      <div class="inv-top"><div><h2>Invoice</h2><div>INV-${esc(o.number.replace('SO-', ''))}</div><div style="color:#6b7090">Issued ${fdate(o.date)}</div></div>
        <div style="text-align:right"><strong style="font-size:18px">${esc(db.settings.company)}</strong><div><span class="stamp" style="color:${color}">${esc(o.status)}</span></div></div></div>
      <div><small style="color:#6b7090">BILL TO</small><div><strong>${esc(c.name)}</strong></div><div>${esc(c.company || '')}</div><div>${esc(c.email || '')}</div><div>${esc(c.city || '')}</div></div>
      <table><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Discount</th><th class="num">Amount</th></tr></thead>
        <tbody><tr><td>${esc(p.name)} <small style="color:#6b7090">${esc(p.sku || '')}</small></td><td class="num">${o.qty}</td><td class="num">${money(o.price)}</td><td class="num">${o.discount || 0}%</td><td class="num">${money(sub)}</td></tr></tbody></table>
      <div class="tot"><div><span>Subtotal</span><span>${money(sub)}</span></div><div><span>Tax (${db.settings.tax}%)</span><span>${money(tax)}</span></div><div class="grand"><span>Total</span><span>${money(sub + tax)}</span></div></div>
      <p style="margin-top:28px;color:#6b7090">Thank you for your business.</p></div>`);
    modal({ title: 'Invoice ' + o.number, body, size: 'lg', footer: [{ label: 'Close' }, { label: 'Print', cls: 'primary', fn: () => { window.print(); return false; } }] });
  }

  /* ---------- Reports ---------- */
  const monthsBetween = (a, b) => { const out = []; let y = +a.slice(0, 4), m = +a.slice(5, 7); const ey = +b.slice(0, 4), em = +b.slice(5, 7); while ((y < ey || (y === ey && m <= em)) && out.length < 36) { out.push(y + '-' + String(m).padStart(2, '0')); if (++m > 12) { m = 1; y++; } } return out; };
  const REPORTS = {
    sales_customer: { label: 'Sales by customer', run: (a, b) => { const mp = {}; db.orders.filter(o => F.isSale(o) && o.date >= a && o.date <= b).forEach(o => { const k = nm('contacts', o.customerId); (mp[k] ??= { n: 0, s: 0, t: 0 }); mp[k].n++; mp[k].s += F.orderSub(o); mp[k].t += F.orderTotal(o); }); const rows = Object.entries(mp).sort((x, y) => y[1].t - x[1].t).map(([k, v]) => [k, v.n, v.s, v.t]); return { head: [{ l: 'Customer' }, { l: 'Orders', n: 1 }, { l: 'Net sales', m: 1 }, { l: 'Total incl. tax', m: 1 }], rows, foot: ['Total', sum(rows, r => r[1]), sum(rows, r => r[2]), sum(rows, r => r[3])] }; } },
    sales_product: { label: 'Sales by product', run: (a, b) => { const mp = {}; db.orders.filter(o => F.isSale(o) && o.date >= a && o.date <= b).forEach(o => { const k = nm('products', o.productId); (mp[k] ??= { q: 0, s: 0 }); mp[k].q += o.qty; mp[k].s += F.orderSub(o); }); const rows = Object.entries(mp).sort((x, y) => y[1].s - x[1].s).map(([k, v]) => [k, v.q, v.s]); return { head: [{ l: 'Product' }, { l: 'Units sold', n: 1 }, { l: 'Net sales', m: 1 }], rows, foot: ['Total', sum(rows, r => r[1]), sum(rows, r => r[2])] }; } },
    pnl: { label: 'Profit & loss by month', run: (a, b) => { const keys = monthsBetween(a.slice(0, 7), b.slice(0, 7)), S = F.series(keys), rows = keys.map((k, i) => [F.monthLabel(k) + ' ' + k.slice(0, 4), S.rev[i], S.exp[i], S.rev[i] - S.exp[i]]); return { head: [{ l: 'Month' }, { l: 'Income', m: 1 }, { l: 'Expenses', m: 1 }, { l: 'Net profit', m: 1 }], rows, foot: ['Total', sum(rows, r => r[1]), sum(rows, r => r[2]), sum(rows, r => r[3])] }; } },
    expenses: { label: 'Expenses by category', run: (a, b) => { const mp = {}; db.expenses.filter(e => e.type === 'Expense' && e.date >= a && e.date <= b).forEach(e => { mp[e.category] = (mp[e.category] || 0) + e.amount; }); db.purchases.filter(p => p.status === 'Received' && p.date >= a && p.date <= b).forEach(p => { mp.Purchases = (mp.Purchases || 0) + p.qty * p.cost; }); const rows = Object.entries(mp).sort((x, y) => y[1] - x[1]); const t = sum(rows, r => r[1]); return { head: [{ l: 'Category' }, { l: 'Amount', m: 1 }, { l: 'Share', p: 1 }], rows: rows.map(r => [r[0], r[1], t ? r[1] / t * 100 : 0]), foot: ['Total', t, 100] }; } },
    inventory: { label: 'Inventory valuation', run: () => { const rows = db.products.map(p => [p.name, p.stock, p.cost, p.stock * p.cost, p.stock * p.price]); return { head: [{ l: 'Product' }, { l: 'On hand', n: 1 }, { l: 'Unit cost', m: 1 }, { l: 'Value at cost', m: 1 }, { l: 'Value at retail', m: 1 }], rows, foot: ['Total', sum(rows, r => r[1]), '', sum(rows, r => r[3]), sum(rows, r => r[4])] }; } }
  };
  function reportsView() {
    const st = (UI.reports ??= { type: 'sales_customer', from: addDays(-180), to: today() });
    const root = h(`<section><div class="page-head no-print"><div><h1>Reports</h1><p class="muted">Insights you can export or print</p></div>
      <div class="head-actions"><button class="btn ghost" data-exp>${ic('download', 16)} Export CSV</button><button class="btn primary" data-print>${ic('print', 16)} Print</button></div></div>
      <div class="card no-print filters"><label class="field"><span>Report</span><select class="input" data-t>${Object.entries(REPORTS).map(([k, r]) => `<option value="${k}" ${k === st.type ? 'selected' : ''}>${r.label}</option>`).join('')}</select></label>
        <label class="field"><span>From</span><input class="input" type="date" data-from value="${st.from}"></label><label class="field"><span>To</span><input class="input" type="date" data-to value="${st.to}"></label></div>
      <div class="card flush" id="printable"><div style="padding:16px 18px"><h2 data-title></h2><p class="muted" data-sub></p></div><div class="table-wrap" data-out></div></div></section>`);
    let cur;
    const fmt = (c, v) => c.m ? money(v) : c.p ? v.toFixed(1) + '%' : c.n ? Number(v).toLocaleString() : esc(v);
    const draw = () => {
      const R = REPORTS[st.type]; cur = R.run(st.from, st.to);
      $('[data-title]', root).textContent = R.label;
      $('[data-sub]', root).textContent = `${db.settings.company} · ${st.type === 'inventory' ? 'As of ' + fdate(today()) : fdate(st.from) + ' – ' + fdate(st.to)}`;
      $('[data-out]', root).innerHTML = cur.rows.length ? `<table class="table"><thead><tr>${cur.head.map(c => `<th class="${c.m || c.n || c.p ? 'num' : ''}">${c.l}</th>`).join('')}</tr></thead><tbody>${cur.rows.map(r => `<tr>${r.map((v, i) => `<td class="${cur.head[i].m || cur.head[i].n || cur.head[i].p ? 'num' : ''}">${fmt(cur.head[i], v)}</td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr>${cur.foot.map((v, i) => `<td class="${cur.head[i].m || cur.head[i].n || cur.head[i].p ? 'num' : ''}">${v === '' ? '' : fmt(cur.head[i], v)}</td>`).join('')}</tr></tfoot></table>` : '<div class="empty">No data for this period.</div>';
    };
    root.addEventListener('change', e => { if (e.target.matches('[data-t]')) st.type = e.target.value; else if (e.target.matches('[data-from]')) st.from = e.target.value; else if (e.target.matches('[data-to]')) st.to = e.target.value; else return; draw(); });
    root.addEventListener('click', e => {
      if (e.target.closest('[data-print]')) window.print();
      if (e.target.closest('[data-exp]')) { downloadFile(`fiesta-report-${st.type}.csv`, toCSV([cur.head.map(c => c.l), ...cur.rows.map(r => r.map((v, i) => typeof v === 'number' ? Math.round(v * 100) / 100 : v))])); toast('CSV exported'); }
    });
    draw();
    return root;
  }

  /* ---------- Settings ---------- */
  function settingsView() {
    const s = db.settings;
    const root = h(`<section><div class="page-head"><div><h1>Settings</h1><p class="muted">Company profile, appearance and your data</p></div></div>
      <div class="set-grid">
        <div class="card"><div class="card-head"><h2>Company & account</h2></div><form class="form-grid" data-profile>
          <label class="field full"><span>Company name</span><input class="input" name="company" value="${esc(s.company)}" required></label>
          <label class="field"><span>Currency</span><select class="input" name="currency">${[['$', '$ — Dollar'], ['€', '€ — Euro'], ['£', '£ — Pound'], ['৳', '৳ — Taka'], ['₹', '₹ — Rupee'], ['¥', '¥ — Yen'], ['AED ', 'AED — Dirham'], ['Rs ', 'Rs — Rupee']].map(([v, l]) => `<option value="${esc(v)}" ${v === s.currency ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="field"><span>Default tax rate %</span><input class="input" type="number" name="tax" min="0" max="100" step="0.1" value="${s.tax}"></label>
          <label class="field"><span>Your name</span><input class="input" name="uname" value="${esc(s.user.name)}" required></label>
          <label class="field"><span>Your email</span><input class="input" type="email" name="uemail" value="${esc(s.user.email)}" required></label>
          <div class="full"><button class="btn primary" type="submit">Save settings</button></div></form></div>
        <div class="card"><div class="card-head"><h2>Appearance</h2></div><div class="seg" data-theme-seg><button type="button" data-th="light" class="${s.theme !== 'dark' ? 'on' : ''}">Light</button><button type="button" data-th="dark" class="${s.theme === 'dark' ? 'on' : ''}">Dark</button></div>
          <p class="hint" style="margin-top:10px">You can also use the sun/moon button in the top bar.</p></div>
        <div class="card"><div class="card-head"><h2>Your data</h2></div><p class="muted" style="margin-bottom:12px">Everything is stored in this browser. Export a backup regularly, or move your workspace to another device by importing it.</p>
          <div class="stack"><button class="btn ghost" data-backup>${ic('download', 16)} Export backup</button><label class="btn ghost" style="cursor:pointer">Import backup<input type="file" accept="application/json" data-import hidden></label>
          <button class="btn ghost" data-demo>Reset to demo data</button><button class="btn danger" data-clear>Delete all data</button></div></div>
      </div></section>`);
    $('[data-profile]', root).addEventListener('submit', e => {
      e.preventDefault(); const f = e.target.elements;
      s.company = f.company.value.trim(); s.currency = f.currency.value; s.tax = Number(f.tax.value) || 0; s.user.name = f.uname.value.trim(); s.user.email = f.uemail.value.trim();
      F.persist(); chrome(); toast('Settings saved'); route();
    });
    root.addEventListener('click', e => {
      const th = e.target.closest('[data-th]'); if (th) { setTheme(th.dataset.th); $$('[data-th]', root).forEach(b => b.classList.toggle('on', b === th)); }
      if (e.target.closest('[data-backup]')) { downloadFile('fiesta-backup-' + today() + '.json', JSON.stringify(db, null, 2), 'application/json'); toast('Backup downloaded'); }
      if (e.target.closest('[data-demo]')) confirmDlg('Replace everything with the demo data?', 'Reset').then(ok => { if (ok) { F.reset(); applyTheme(); chrome(); toast('Demo data restored'); route(); } });
      if (e.target.closest('[data-clear]')) confirmDlg('Delete ALL records? This cannot be undone.', 'Delete everything').then(ok => { if (ok) { const keep = { settings: db.settings, activity: [] }; ['contacts', 'products', 'orders', 'purchases', 'expenses', 'employees', 'leaves', 'leads', 'tasks'].forEach(k => keep[k] = []); F.replace(keep); toast('All records deleted'); route(); } });
    });
    $('[data-import]', root).addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = () => { try { const d = JSON.parse(rd.result); if (!d.settings || !Array.isArray(d.orders) || !Array.isArray(d.contacts)) throw new Error('bad'); F.replace(d); applyTheme(); chrome(); toast('Backup imported'); route(); } catch (err) { toast('That file is not a valid Fiesta backup.', 'error'); } };
      rd.readAsText(file);
    });
    return root;
  }

  /* ---------- Shell: nav, theme, search, notifications ---------- */
  const NAV = [
    ['Overview', [['dashboard', 'Dashboard', 'home']]],
    ['Sales', [['crm', 'CRM Pipeline', 'funnel'], ['orders', 'Sales Orders', 'cart'], ['contacts', 'Contacts', 'users']]],
    ['Operations', [['products', 'Inventory', 'box'], ['purchases', 'Purchases', 'truck'], ['tasks', 'Projects', 'kanban']]],
    ['Finance', [['accounting', 'Accounting', 'wallet'], ['reports', 'Reports', 'chart']]],
    ['People', [['employees', 'Employees', 'id'], ['leaves', 'Time Off', 'calendar']]],
    ['System', [['settings', 'Settings', 'cog']]]
  ];
  const ROUTES = {
    dashboard: dashboardView, crm: () => kanbanView('crm'), tasks: () => kanbanView('tasks'), orders: () => crudView('orders'), contacts: () => crudView('contacts'),
    products: () => crudView('products'), purchases: () => crudView('purchases'), accounting: () => crudView('accounting'), employees: () => crudView('employees'), leaves: () => crudView('leaves'),
    reports: reportsView, settings: settingsView
  };
  const TITLES = Object.fromEntries(NAV.flatMap(g => g[1]).map(i => [i[0], i[1]]));

  function buildNav() {
    $('#nav').innerHTML = NAV.map(([g, items]) => `<div class="nav-group">${g}</div>${items.map(([k, l, i]) => `<a class="nav-link" href="#/${k}" data-nav="${k}">${ic(i, 19)}<span>${l}</span></a>`).join('')}`).join('');
  }
  function chrome() {
    $('#companyName').textContent = db.settings.company;
    $('#userBtn').textContent = initials(db.settings.user.name);
    $('#umName').textContent = db.settings.user.name; $('#umMail').textContent = db.settings.user.email;
  }
  function applyTheme() {
    document.documentElement.dataset.theme = db.settings.theme === 'dark' ? 'dark' : 'light';
    $('#themeBtn').innerHTML = ic(db.settings.theme === 'dark' ? 'sun' : 'moon');
  }
  function setTheme(t) { db.settings.theme = t; F.persist(); applyTheme(); if (current) requestAnimationFrame(current); }

  function notifications() {
    const n = [];
    db.products.filter(p => stockStatus(p) !== 'In Stock').forEach(p => n.push({ r: 'products', t: `${p.name}: ${stockStatus(p).toLowerCase()}`, s: `${p.stock} left, reorder at ${p.reorder}` }));
    db.leaves.filter(l => l.status === 'Pending').forEach(l => n.push({ r: 'leaves', t: `${nm('employees', l.empId)} requested time off`, s: `${l.type} · ${fdate(l.from)}` }));
    db.tasks.filter(t => t.stage !== 'Done' && t.due && t.due < today()).forEach(t => n.push({ r: 'tasks', t: `Overdue: ${t.title}`, s: `Due ${fdate(t.due)}` }));
    const dr = db.orders.filter(o => o.status === 'Draft').length; if (dr) n.push({ r: 'orders', t: `${dr} draft order${dr > 1 ? 's' : ''} to confirm`, s: 'Sales Orders' });
    return n;
  }
  function refreshBell() {
    const n = notifications(), dot = $('#bellDot'); dot.hidden = !n.length; dot.textContent = n.length > 9 ? '9+' : n.length;
    $('#notes').innerHTML = n.length ? n.slice(0, 12).map(x => `<a href="#/${x.r}"><span class="grow"><strong>${esc(x.t)}</strong><small>${esc(x.s)}</small></span></a>`).join('') : '<div class="note-empty">You are all caught up ✨</div>';
  }
  function globalSearch(q) {
    q = q.trim().toLowerCase(); if (q.length < 2) return [];
    const defs = [['contacts', 'Contact', 'contacts', r => r.name, r => r.company], ['products', 'Product', 'products', r => r.name, r => r.sku], ['orders', 'Order', 'orders', r => r.number, r => nm('contacts', r.customerId)],
      ['employees', 'Employee', 'employees', r => r.name, r => r.role], ['leads', 'Lead', 'crm', r => r.title, r => r.company], ['tasks', 'Task', 'tasks', r => r.title, r => r.description]];
    return defs.flatMap(([coll, type, route, t, s]) => db[coll].filter(r => (t(r) + ' ' + (s(r) || '')).toLowerCase().includes(q)).slice(0, 3).map(r => ({ type, route, title: t(r), sub: s(r) || '' })));
  }

  function route() {
    let name = location.hash.replace('#/', '') || 'dashboard'; if (!ROUTES[name]) name = 'dashboard';
    const main = $('#view'), y = window.scrollY;
    const el = ROUTES[name](); main.replaceChildren(el);
    current = el._after || null; if (current) requestAnimationFrame(current);
    $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
    document.title = `${TITLES[name]} · Fiesta`;
    document.body.classList.remove('sidebar-open');
    window.scrollTo(0, lastRoute === name ? y : 0); lastRoute = name;
    refreshBell();
  }

  /* ---------- Boot ---------- */
  function showApp() { $('#login').hidden = true; $('#app').hidden = false; route(); }
  function init() {
    buildNav(); chrome(); applyTheme();
    $('#menuBtn').innerHTML = ic('menu'); $('#bellBtn').insertAdjacentHTML('afterbegin', ic('bell')); $('#searchIcon').insertAdjacentHTML('afterbegin', ic('search', 16));
    window.addEventListener('hashchange', route);
    window.addEventListener('resize', () => { clearTimeout(init.t); init.t = setTimeout(() => current && current(), 120); });
    $('#themeBtn').addEventListener('click', () => setTheme(db.settings.theme === 'dark' ? 'light' : 'dark'));
    $('#menuBtn').addEventListener('click', () => document.body.classList.add('sidebar-open'));
    $('#scrim').addEventListener('click', () => document.body.classList.remove('sidebar-open'));

    const menus = { bellBtn: '#notes', userBtn: '#userMenu' };
    Object.entries(menus).forEach(([b, m]) => $('#' + b).addEventListener('click', e => { e.stopPropagation(); const el = $(m), open = !el.hidden; Object.values(menus).forEach(x => $(x).hidden = true); el.hidden = open; }));
    document.addEventListener('click', e => { if (!e.target.closest('.menu-wrap')) Object.values(menus).forEach(x => $(x).hidden = true); if (!e.target.closest('.gsearch')) $('#gres').hidden = true; if (e.target.closest('.dropdown a')) Object.values(menus).forEach(x => $(x).hidden = true); });

    const gq = $('#gq'), gres = $('#gres');
    gq.addEventListener('input', () => {
      const r = globalSearch(gq.value); gres.hidden = gq.value.trim().length < 2;
      gres.innerHTML = r.length ? r.map((x, i) => `<button type="button" data-i="${i}"><span class="res-type">${x.type}</span><span><strong>${esc(x.title)}</strong><small>${esc(x.sub)}</small></span></button>`).join('') : '<div class="note-empty">No matches</div>';
      gres._r = r;
    });
    gres.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; const x = gres._r[+b.dataset.i]; (UI[x.route] ??= {}).q = x.title; if (x.route === 'orders' || x.route === 'contacts') { UI[x.route].page = 1; UI[x.route].f = ''; } gres.hidden = true; gq.value = ''; location.hash = '#/' + x.route; route(); });
    document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); gq.focus(); } });

    const login = $('#login');
    const enter = () => { localStorage.setItem('fiesta_session', '1'); showApp(); };
    $('#loginForm').addEventListener('submit', e => { e.preventDefault(); const f = e.target.elements; if (f.email.value.trim().toLowerCase() === 'admin@fiesta.app' && f.password.value === 'admin123') enter(); else $('#loginMsg').textContent = 'Those details do not match. Use the demo login shown here, or click “Explore the demo”.'; });
    $('#demoBtn').addEventListener('click', enter);
    $('#logoutBtn').addEventListener('click', () => { localStorage.removeItem('fiesta_session'); $('#app').hidden = true; login.hidden = false; $('#userMenu').hidden = true; });
    if (localStorage.getItem('fiesta_session')) showApp(); else login.hidden = false;
  }
  init();
})();
