/* Fiesta — data layer: storage, demo data, calculations */
(function () {
  'use strict';
  const KEY = 'fiesta_db_v1';
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  const uid = () => Math.random().toString(36).slice(2, 9);
  let sd = 11;
  const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const SALE = ['Confirmed', 'Invoiced', 'Paid'];

  function seed() {
    sd = 11;
    const contacts = [
      { id: 'c1', name: 'Northwind Traders', type: 'Customer', company: 'Northwind Traders', email: 'orders@northwind.example', phone: '+1 555 0101', city: 'Seattle' },
      { id: 'c2', name: 'Bluebird Cafe', type: 'Customer', company: 'Bluebird Cafe Group', email: 'hello@bluebird.example', phone: '+1 555 0102', city: 'Austin' },
      { id: 'c3', name: 'Orbit Studios', type: 'Customer', company: 'Orbit Studios GmbH', email: 'office@orbit.example', phone: '+49 30 5550103', city: 'Berlin' },
      { id: 'c4', name: 'Greenleaf Market', type: 'Customer', company: 'Greenleaf Market Inc.', email: 'buy@greenleaf.example', phone: '+1 555 0104', city: 'Toronto' },
      { id: 'c5', name: 'Sunrise Clinic', type: 'Customer', company: 'Sunrise Clinic', email: 'admin@sunrise.example', phone: '+880 1700 000105', city: 'Dhaka' },
      { id: 'c6', name: 'Atlas Logistics', type: 'Customer', company: 'Atlas Logistics LLC', email: 'procure@atlas.example', phone: '+971 4 5550106', city: 'Dubai' },
      { id: 'c7', name: 'Prime Supplies', type: 'Vendor', company: 'Prime Supplies Co.', email: 'sales@prime.example', phone: '+1 555 0107', city: 'Chicago' },
      { id: 'c8', name: 'Delta Components', type: 'Vendor', company: 'Delta Components Ltd', email: 'export@delta.example', phone: '+86 755 5550108', city: 'Shenzhen' },
      { id: 'c9', name: 'PackRight', type: 'Vendor', company: 'PackRight UK', email: 'trade@packright.example', phone: '+44 161 5550109', city: 'Manchester' }
    ];
    const products = [
      { id: 'p1', name: 'Wireless Mouse', sku: 'WM-100', category: 'Accessories', cost: 8, price: 19.9, stock: 120, reorder: 30 },
      { id: 'p2', name: 'Mechanical Keyboard', sku: 'KB-210', category: 'Accessories', cost: 28, price: 59, stock: 64, reorder: 20 },
      { id: 'p3', name: '27" Monitor', sku: 'MN-270', category: 'Displays', cost: 120, price: 229, stock: 18, reorder: 15 },
      { id: 'p4', name: 'USB-C Dock', sku: 'DK-330', category: 'Accessories', cost: 35, price: 79, stock: 9, reorder: 12 },
      { id: 'p5', name: 'Office Chair', sku: 'CH-500', category: 'Furniture', cost: 85, price: 169, stock: 26, reorder: 10 },
      { id: 'p6', name: 'Standing Desk', sku: 'DS-700', category: 'Furniture', cost: 150, price: 329, stock: 7, reorder: 8 },
      { id: 'p7', name: 'HD Webcam', sku: 'WC-120', category: 'Accessories', cost: 14, price: 39, stock: 80, reorder: 25 },
      { id: 'p8', name: 'Laptop Stand', sku: 'LS-050', category: 'Accessories', cost: 9, price: 24.5, stock: 4, reorder: 15 }
    ];
    const cust = contacts.filter(c => c.type === 'Customer');
    const vend = contacts.filter(c => c.type === 'Vendor');

    const orders = [];
    for (let i = 0; i < 110; i++) {
      const p = pick(products);
      const st = pick(['Paid', 'Paid', 'Paid', 'Invoiced', 'Confirmed', 'Draft', 'Cancelled']);
      orders.push({ id: uid(), date: addDays(-Math.floor(rnd() * 175)), customerId: pick(cust).id, productId: p.id, qty: 4 + Math.floor(rnd() * 20), price: p.price, discount: pick([0, 0, 5, 10]), status: st, applied: SALE.includes(st) });
    }
    orders.sort((a, b) => b.date.localeCompare(a.date));
    [...orders].reverse().forEach((o, i) => { o.number = 'SO-' + String(i + 1).padStart(4, '0'); });

    const purchases = [];
    for (let i = 0; i < 9; i++) {
      const p = pick(products);
      const st = pick(['Received', 'Received', 'Ordered', 'Draft']);
      purchases.push({ id: uid(), date: addDays(-Math.floor(rnd() * 170)), vendorId: pick(vend).id, productId: p.id, qty: 20 + Math.floor(rnd() * 60), cost: p.cost, status: st, applied: st === 'Received' });
    }
    purchases.sort((a, b) => b.date.localeCompare(a.date));
    [...purchases].reverse().forEach((o, i) => { o.number = 'PO-' + String(i + 1).padStart(4, '0'); });

    const expenses = [];
    const now = new Date();
    for (let m = 0; m < 6; m++) {
      const add = (day, type, category, description, amount) => {
        const dt = iso(new Date(now.getFullYear(), now.getMonth() - m, day));
        if (dt <= addDays(0)) expenses.push({ id: uid(), date: dt, type, category, description, amount: Math.round(amount) });
      };
      add(3, 'Expense', 'Rent', 'Office rent', 1800);
      add(25, 'Expense', 'Salaries', 'Monthly payroll', 11400);
      add(12, 'Expense', 'Utilities', 'Electricity & internet', 280 + rnd() * 120);
      add(15, 'Expense', 'Marketing', 'Ads & campaigns', 500 + rnd() * 700);
      if (rnd() > 0.4) add(18, 'Expense', 'Software', 'SaaS subscriptions', 150 + rnd() * 100);
      if (rnd() > 0.5) add(9, 'Expense', 'Travel', 'Client visit', 200 + rnd() * 400);
      if (rnd() > 0.5) add(20, 'Income', 'Consulting', 'Consulting retainer', 900 + rnd() * 1200);
    }
    expenses.sort((a, b) => b.date.localeCompare(a.date));

    const employees = [
      { id: 'e1', name: 'Ayesha Rahman', dept: 'Management', role: 'Chief Executive', email: 'ayesha@fiesta.demo', phone: '+880 1711 000001', salary: 2400, status: 'Active', joined: addDays(-1500) },
      { id: 'e2', name: 'Daniel Kim', dept: 'Sales', role: 'Sales Lead', email: 'daniel@fiesta.demo', phone: '+1 555 0201', salary: 1500, status: 'Active', joined: addDays(-900) },
      { id: 'e3', name: 'Sofia Alvarez', dept: 'Finance', role: 'Accountant', email: 'sofia@fiesta.demo', phone: '+34 600 000203', salary: 1400, status: 'Active', joined: addDays(-700) },
      { id: 'e4', name: 'Omar Farouk', dept: 'Operations', role: 'Warehouse Manager', email: 'omar@fiesta.demo', phone: '+20 100 000204', salary: 1100, status: 'Active', joined: addDays(-640) },
      { id: 'e5', name: 'Lina Chen', dept: 'Engineering', role: 'Developer', email: 'lina@fiesta.demo', phone: '+65 8000 0205', salary: 1600, status: 'On Leave', joined: addDays(-420) },
      { id: 'e6', name: 'Marcus Reed', dept: 'Sales', role: 'Account Executive', email: 'marcus@fiesta.demo', phone: '+1 555 0206', salary: 1200, status: 'Active', joined: addDays(-300) },
      { id: 'e7', name: 'Priya Nair', dept: 'HR', role: 'HR Manager', email: 'priya@fiesta.demo', phone: '+91 90000 00207', salary: 1300, status: 'Active', joined: addDays(-210) },
      { id: 'e8', name: 'Tom Becker', dept: 'Support', role: 'Support Agent', email: 'tom@fiesta.demo', phone: '+49 151 0000208', salary: 900, status: 'Active', joined: addDays(-90) }
    ];
    const leaves = [
      { id: uid(), empId: 'e2', type: 'Annual', from: addDays(5), to: addDays(9), reason: 'Family trip', status: 'Pending' },
      { id: uid(), empId: 'e5', type: 'Sick', from: addDays(-3), to: addDays(2), reason: 'Recovery', status: 'Approved' },
      { id: uid(), empId: 'e8', type: 'Casual', from: addDays(12), to: addDays(12), reason: 'Personal errand', status: 'Pending' },
      { id: uid(), empId: 'e3', type: 'Annual', from: addDays(-40), to: addDays(-34), reason: 'Holiday', status: 'Approved' },
      { id: uid(), empId: 'e6', type: 'Unpaid', from: addDays(-20), to: addDays(-18), reason: 'Moving house', status: 'Rejected' }
    ];
    const leads = [
      { id: uid(), title: 'Office fit-out for 40 seats', company: 'Atlas Logistics', value: 14800, stage: 'Proposal', owner: 'e2', due: addDays(7) },
      { id: uid(), title: 'Annual peripherals contract', company: 'Northwind Traders', value: 9200, stage: 'Qualified', owner: 'e6', due: addDays(14) },
      { id: uid(), title: 'Studio monitor upgrade', company: 'Orbit Studios', value: 6400, stage: 'New', owner: 'e2', due: addDays(21) },
      { id: uid(), title: 'Clinic reception setup', company: 'Sunrise Clinic', value: 3100, stage: 'Qualified', owner: 'e6', due: addDays(10) },
      { id: uid(), title: 'Cafe back-office desks', company: 'Bluebird Cafe', value: 2200, stage: 'New', owner: 'e6', due: addDays(18) },
      { id: uid(), title: 'Warehouse workstations', company: 'Greenleaf Market', value: 7800, stage: 'Proposal', owner: 'e2', due: addDays(4) },
      { id: uid(), title: 'Quarterly reorder', company: 'Northwind Traders', value: 5400, stage: 'Won', owner: 'e2', due: addDays(-6) },
      { id: uid(), title: 'Remote team kits', company: 'Orbit Studios', value: 4300, stage: 'Won', owner: 'e6', due: addDays(-12) },
      { id: uid(), title: 'Pilot order', company: 'Local startup', value: 1200, stage: 'Lost', owner: 'e6', due: addDays(-9) }
    ];
    const tasks = [
      { id: uid(), title: 'Reorder low-stock items', assignee: 'e4', priority: 'High', due: addDays(1), stage: 'To Do', description: '' },
      { id: uid(), title: 'Prepare Q4 budget', assignee: 'e3', priority: 'High', due: addDays(6), stage: 'In Progress', description: '' },
      { id: uid(), title: 'Update product catalogue', assignee: 'e5', priority: 'Medium', due: addDays(9), stage: 'In Progress', description: '' },
      { id: uid(), title: 'Interview support candidates', assignee: 'e7', priority: 'Medium', due: addDays(3), stage: 'To Do', description: '' },
      { id: uid(), title: 'Customer survey results', assignee: 'e2', priority: 'Low', due: addDays(15), stage: 'To Do', description: '' },
      { id: uid(), title: 'Fix invoice template', assignee: 'e5', priority: 'High', due: addDays(-2), stage: 'Review', description: '' },
      { id: uid(), title: 'Warehouse audit', assignee: 'e4', priority: 'Medium', due: addDays(-8), stage: 'Done', description: '' },
      { id: uid(), title: 'Launch newsletter', assignee: 'e6', priority: 'Low', due: addDays(-14), stage: 'Done', description: '' }
    ];
    return {
      contacts, products, orders, purchases, expenses, employees, leaves, leads, tasks,
      activity: [{ t: Date.now() - 36e5, msg: 'Welcome to Fiesta — demo data loaded' }],
      settings: { company: 'Fiesta Demo Co.', currency: '$', tax: 8, theme: 'light', user: { name: 'Admin', email: 'admin@fiesta.app' } }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const d = JSON.parse(raw); if (d && d.settings && d.orders) return d; }
    } catch (e) { /* ignore */ }
    return seed();
  }
  const db = load();
  db.activity = db.activity || [];
  db.settings.user = db.settings.user || { name: 'Admin', email: 'admin@fiesta.app' };

  function persist() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* storage full or blocked */ } }
  function replace(d) { Object.keys(db).forEach(k => delete db[k]); Object.assign(db, d); db.activity = db.activity || []; persist(); }
  function log(msg) { db.activity.unshift({ t: Date.now(), msg }); db.activity.length = Math.min(db.activity.length, 40); }

  const orderSub = o => o.qty * o.price * (1 - (o.discount || 0) / 100);
  const orderTotal = o => orderSub(o) * (1 + (db.settings.tax || 0) / 100);
  const isSale = o => SALE.includes(o.status);
  const monthKeys = n => {
    const now = new Date(), a = [];
    for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); a.push(d.getFullYear() + '-' + pad(d.getMonth() + 1)); }
    return a;
  };
  const monthLabel = k => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, 1).toLocaleString(undefined, { month: 'short' });

  function series(keys) {
    const rev = keys.map(() => 0), exp = keys.map(() => 0);
    const ix = d => keys.indexOf(d.slice(0, 7));
    db.orders.filter(isSale).forEach(o => { const i = ix(o.date); if (i >= 0) rev[i] += orderSub(o); });
    db.expenses.forEach(e => { const i = ix(e.date); if (i < 0) return; if (e.type === 'Income') rev[i] += e.amount; else exp[i] += e.amount; });
    db.purchases.filter(p => p.status === 'Received').forEach(p => { const i = ix(p.date); if (i >= 0) exp[i] += p.qty * p.cost; });
    return { rev, exp };
  }
  function expenseBreakdown(keys) {
    const m = {};
    db.expenses.filter(e => e.type === 'Expense' && keys.includes(e.date.slice(0, 7))).forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
    db.purchases.filter(p => p.status === 'Received' && keys.includes(p.date.slice(0, 7))).forEach(p => { m.Purchases = (m.Purchases || 0) + p.qty * p.cost; });
    return m;
  }

  window.F = { db, persist, replace, reset: () => replace(seed()), uid, iso, addDays, SALE, orderSub, orderTotal, isSale, monthKeys, monthLabel, series, expenseBreakdown, log };
})();
