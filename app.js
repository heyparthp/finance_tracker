// Fallback for window.storage if running in a standard browser
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      try {
        const val = localStorage.getItem(key);
        return { value: val };
      } catch (e) {
        return { value: null };
      }
    },
    set: async (key, val) => {
      try {
        localStorage.setItem(key, val);
        return true;
      } catch (e) {
        return false;
      }
    }
  };
}

// ═══════════════════════════════════════════════
// MCC DATA
// ═══════════════════════════════════════════════
const MCC_GROUPS = [
  { id: 'dining',     label: 'Dining & Restaurants',    ico: '🍽️', codes: [5811, 5812, 5813, 5814] },
  { id: 'grocery',    label: 'Grocery & Supermarkets',  ico: '🛒', codes: [5411, 5422, 5441, 5451, 5499] },
  { id: 'fuel',       label: 'Fuel & Petrol',           ico: '⛽', codes: [5172, 5541, 5542, 5983] },
  { id: 'ecommerce',  label: 'Online Shopping',         ico: '🛍️', codes: [5961, 5964, 5965, 5999] },
  { id: 'travel',     label: 'Travel & Transport',      ico: '✈️', codes: [4111, 4112, 4121, 4131, 4511, 4722, 7011] },
  { id: 'entertain',  label: 'Movies & Entertainment',  ico: '🎬', codes: [7832, 7922, 7991, 7999] },
  { id: 'health',     label: 'Healthcare & Pharmacy',   ico: '💊', codes: [5047, 5122, 5912, 8011, 8049, 8099] },
  { id: 'utilities',  label: 'Utilities & Telecom',     ico: '💡', codes: [4812, 4813, 4814, 4816, 4899, 4900] },
  { id: 'education',  label: 'Education',               ico: '📚', codes: [8211, 8220, 8249, 8299] },
  { id: 'insurance',  label: 'Insurance',               ico: '🔒', codes: [6300, 6311, 6321, 6399] },
  { id: 'rent',       label: 'Rent & Real Estate',      ico: '🏠', codes: [6513, 7349] },
  { id: 'wallet',     label: 'Wallet / Prepaid Load',   ico: '👛', codes: [6540, 6541] },
  { id: 'other',      label: 'All Other',               ico: '💳', codes: [] },
];
const MCC_BY_ID = Object.fromEntries(MCC_GROUPS.map(g => [g.id, g]));

// built-in merchant→MCC map (seed)
const BUILT_IN_MERCHANT_MCC = {
  swiggy: 'dining', zomato: 'dining', dominos: 'dining', "domino's": 'dining', 'pizza hut': 'dining',
  mcdonald: 'dining', kfc: 'dining', subway: 'dining', 'burger king': 'dining', starbucks: 'dining',
  ccd: 'dining', barbeque: 'dining', haldiram: 'dining', 'wow momo': 'dining', 'behrouz biryani': 'dining',
  bigbasket: 'grocery', blinkit: 'grocery', zepto: 'grocery', dunzo: 'grocery', dmart: 'grocery',
  'reliance fresh': 'grocery', jiomart: 'grocery', instamart: 'grocery',
  amazon: 'ecommerce', flipkart: 'ecommerce', myntra: 'ecommerce', ajio: 'ecommerce', meesho: 'ecommerce',
  nykaa: 'ecommerce', snapdeal: 'ecommerce', 'tata cliq': 'ecommerce', croma: 'ecommerce',
  'vijay sales': 'ecommerce', 'reliance digital': 'ecommerce',
  uber: 'travel', ola: 'travel', rapido: 'travel', 'namma yatri': 'travel', irctc: 'travel',
  makemytrip: 'travel', goibibo: 'travel', ixigo: 'travel', cleartrip: 'travel', yatra: 'travel',
  redbus: 'travel', airbnb: 'travel', oyo: 'travel', indigo: 'travel', 'air india': 'travel', spicejet: 'travel',
  petrol: 'fuel', iocl: 'fuel', bpcl: 'fuel', 'indian oil': 'fuel', 'bharat petroleum': 'fuel',
  'hindustan petroleum': 'fuel', shell: 'fuel', hp: 'fuel',
  netflix: 'entertain', hotstar: 'entertain', disney: 'entertain', spotify: 'entertain',
  'amazon prime': 'entertain', 'prime video': 'entertain', bookmyshow: 'entertain',
  pvr: 'entertain', inox: 'entertain', zee5: 'entertain', sonyliv: 'entertain',
  apollo: 'health', medplus: 'health', '1mg': 'health', pharmeasy: 'health',
  netmeds: 'health', practo: 'health', 'tata 1mg': 'health',
  airtel: 'utilities', jio: 'utilities', vodafone: 'utilities', bsnl: 'utilities',
  'dish tv': 'utilities', 'tata play': 'utilities', hathway: 'utilities',
  byju: 'education', byjus: 'education', unacademy: 'education', vedantu: 'education',
  coursera: 'education', udemy: 'education', upgrad: 'education',
  lic: 'insurance', 'hdfc life': 'insurance', 'max life': 'insurance',
  policybazaar: 'insurance', 'star health': 'insurance',
  'paytm wallet': 'wallet', mobikwik: 'wallet', freecharge: 'wallet',
};

const CARD_TEMPLATES = [
  // Nexora
  { bank: 'Nexora', name: 'FlexPay', type: 'Debit', network: 'Visa', defaultRate: 1.5, cap: null, rewardType: 'Cashback', pointValue: 1, minSpend: 0, statementDay: 15, dueDay: 5,
    mccRates: { ecommerce: 3, dining: 3 }, excluded: ['fuel'] },
  // HDFC
  { bank: 'HDFC', name: 'Millennia', type: 'Credit', network: 'Visa', defaultRate: 1, cap: 1000, rewardType: 'Cashback', pointValue: 1, minSpend: 150, statementDay: 16, dueDay: 5,
    mccRates: { ecommerce: 5, dining: 5, grocery: 5, travel: 5, entertain: 5 }, excluded: ['fuel', 'rent', 'insurance', 'wallet'] },
  { bank: 'HDFC', name: 'Regalia Gold', type: 'Credit', network: 'Mastercard', defaultRate: 1.33, cap: null, rewardType: 'Points', pointValue: 0.5, minSpend: 150, statementDay: 16, dueDay: 5,
    mccRates: { travel: 2, dining: 2 }, excluded: ['fuel', 'rent', 'wallet'] },
  { bank: 'HDFC', name: 'Infinia', type: 'Credit', network: 'Visa', defaultRate: 3.3, cap: null, rewardType: 'Points', pointValue: 1, minSpend: 150, statementDay: 16, dueDay: 5,
    mccRates: { travel: 10, dining: 10 }, excluded: ['fuel', 'wallet'] },
  { bank: 'HDFC', name: 'MoneyBack+', type: 'Credit', network: 'Visa', defaultRate: 0.5, cap: null, rewardType: 'Cashback', pointValue: 1, minSpend: 150, statementDay: 16, dueDay: 5,
    mccRates: { ecommerce: 1.5 }, excluded: ['fuel', 'wallet'] },

  // ICICI
  { bank: 'ICICI', name: 'Amazon Pay', type: 'Credit', network: 'Visa', defaultRate: 1, cap: null, rewardType: 'Cashback', pointValue: 1, minSpend: 0, statementDay: 15, dueDay: 2,
    mccRates: { ecommerce: 5 }, excluded: ['fuel'] },
  { bank: 'ICICI', name: 'Coral', type: 'Credit', network: 'Visa', defaultRate: 0.5, cap: null, rewardType: 'Cashback', pointValue: 1, minSpend: 100, statementDay: 15, dueDay: 2,
    mccRates: { dining: 2, grocery: 2 }, excluded: ['fuel'] },
  { bank: 'ICICI', name: 'Rubyx', type: 'Credit', network: 'Mastercard', defaultRate: 1, cap: null, rewardType: 'Cashback', pointValue: 1, minSpend: 100, statementDay: 15, dueDay: 2,
    mccRates: { travel: 2 }, excluded: ['fuel'] },

  // SBI
  { bank: 'SBI', name: 'Cashback', type: 'Credit', network: 'Visa', defaultRate: 1, cap: 5000, rewardType: 'Cashback', pointValue: 1, minSpend: 0, statementDay: 12, dueDay: 2,
    mccRates: { ecommerce: 5 }, excluded: ['fuel', 'rent', 'wallet'] },
  { bank: 'SBI', name: 'SimplySAVE', type: 'Credit', network: 'Visa', defaultRate: 1, cap: null, rewardType: 'Points', pointValue: 0.25, minSpend: 150, statementDay: 12, dueDay: 2,
    mccRates: { dining: 2, grocery: 2, entertain: 2, fuel: 2 }, excluded: [] },
  { bank: 'SBI', name: 'SimplyCLICK', type: 'Credit', network: 'Visa', defaultRate: 1.25, cap: null, rewardType: 'Points', pointValue: 0.25, minSpend: 100, statementDay: 12, dueDay: 2,
    mccRates: { ecommerce: 2.5 }, excluded: [] },

  // Axis
  { bank: 'Axis', name: 'Flipkart', type: 'Credit', network: 'Visa', defaultRate: 1.5, cap: null, rewardType: 'Cashback', pointValue: 1, minSpend: 100, statementDay: 18, dueDay: 8,
    mccRates: { ecommerce: 5 }, excluded: ['fuel', 'wallet'] },
  { bank: 'Axis', name: 'Ace', type: 'Credit', network: 'Visa', defaultRate: 2, cap: null, rewardType: 'Cashback', pointValue: 1, minSpend: 100, statementDay: 18, dueDay: 8,
    mccRates: { utilities: 5, dining: 4 }, excluded: ['fuel', 'wallet'] },
  { bank: 'Axis', name: 'Magnus', type: 'Credit', network: 'Visa', defaultRate: 1.2, cap: null, rewardType: 'Points', pointValue: 0.2, minSpend: 125, statementDay: 18, dueDay: 8,
    mccRates: { travel: 2.4, dining: 2.4 }, excluded: ['fuel', 'wallet'] },

  // AMEX
  { bank: 'AMEX', name: 'Membership Rewards', type: 'Credit', network: 'Amex', defaultRate: 1, cap: null, rewardType: 'Points', pointValue: 0.25, minSpend: 50, statementDay: 20, dueDay: 10,
    mccRates: { dining: 2, travel: 2 }, excluded: ['fuel'] },
  { bank: 'AMEX', name: 'Gold Card', type: 'Credit', network: 'Amex', defaultRate: 1, cap: null, rewardType: 'Points', pointValue: 0.25, minSpend: 50, statementDay: 20, dueDay: 10,
    mccRates: { ecommerce: 3, utilities: 3 }, excluded: ['fuel'] },
];

const DEFAULT_CATS = [
  { id: 'food',     name: 'Food',         color: '#B5651D', mccGroups: ['dining', 'grocery'], builtin: true,
    subcats: [{ id: 'food_restaurant', name: 'Restaurant / Dining' }, { id: 'food_grocery', name: 'Grocery' }, { id: 'food_snacks', name: 'Snacks' }, { id: 'food_delivery', name: 'Food Delivery' }, { id: 'food_beverages', name: 'Beverages' }] },
  { id: 'transport', name: 'Transport',    color: '#2E5266', mccGroups: ['travel', 'fuel'],   builtin: true,
    subcats: [{ id: 'tr_cab', name: 'Cab / Taxi' }, { id: 'tr_metro', name: 'Metro / Bus' }, { id: 'tr_fuel', name: 'Fuel / Petrol' }, { id: 'tr_flight', name: 'Flight' }, { id: 'tr_train', name: 'Train / IRCTC' }] },
  { id: 'shopping',  name: 'Shopping',     color: '#6B4E71', mccGroups: ['ecommerce'],       builtin: true,
    subcats: [{ id: 'sh_clothing', name: 'Clothing' }, { id: 'sh_electronics', name: 'Electronics' }, { id: 'sh_home', name: 'Home & Furniture' }, { id: 'sh_books', name: 'Books' }, { id: 'sh_beauty', name: 'Beauty & Personal Care' }] },
  { id: 'bills',    name: 'Bills',        color: '#3F6B4F', mccGroups: ['utilities', 'insurance', 'rent', 'wallet'], builtin: true,
    subcats: [{ id: 'bi_electricity', name: 'Electricity' }, { id: 'bi_internet', name: 'Internet / WiFi' }, { id: 'bi_mobile', name: 'Mobile Recharge' }, { id: 'bi_rent', name: 'Rent' }, { id: 'bi_ott', name: 'OTT Subscriptions' }, { id: 'bi_insurance', name: 'Insurance' }] },
  { id: 'health',   name: 'Health',       color: '#8C3B3B', mccGroups: ['health'],          builtin: true,
    subcats: [{ id: 'he_medicine', name: 'Medicine / Pharmacy' }, { id: 'he_doctor', name: 'Doctor Visit' }, { id: 'he_lab', name: 'Lab Tests' }, { id: 'he_fitness', name: 'Gym / Fitness' }] },
  { id: 'entertain', name: 'Entertainment', color: '#A6822C', mccGroups: ['entertain'],       builtin: true,
    subcats: [{ id: 'en_movies', name: 'Movies' }, { id: 'en_events', name: 'Events / Shows' }, { id: 'en_gaming', name: 'Gaming' }, { id: 'en_sports', name: 'Sports' }] },
  { id: 'edu',      name: 'Education',    color: '#4A708B', mccGroups: ['education'],       builtin: true,
    subcats: [{ id: 'ed_courses', name: 'Courses / Coaching' }, { id: 'ed_books', name: 'Books & Stationery' }, { id: 'ed_fees', name: 'School / College Fees' }] },
  { id: 'other',    name: 'Other',        color: '#5C5C52', mccGroups: ['other'],           builtin: true, subcats: [] },
];

const DEFAULT_UPI = [
  { id: 'upi_gpay',    name: 'Google Pay',  upiId: '' },
  { id: 'upi_phonepe', name: 'PhonePe',     upiId: '' },
  { id: 'upi_paytm',   name: 'Paytm',       upiId: '' },
  { id: 'upi_bhim',    name: 'BHIM UPI',    upiId: '' },
];

const STORE_KEY = 'ledger:v4';
let state = {
  entries: [],
  cards: [],
  upiAccounts: JSON.parse(JSON.stringify(DEFAULT_UPI)),
  merchantDb: {},  // { "swiggy": { mcc: "dining", custom: false } }
  categories: JSON.parse(JSON.stringify(DEFAULT_CATS)),
  settings: { currency: '₹', googleClientId: '', syncDays: 14, sharedSheetId: '1KyZfFKhQEVQwPfqZbrjPna4qupUSYaBwKP5p0flcars', telegramBotToken: '', telegramChatId: '' }
};

let googleToken = null;
let editingCardId = null;
let editingCatId = null;
let editingUpiId = null;
let cardType = 'Credit';
let currentMccGroup = null;
let currentVendorKey = '';
let importQueue = [];

const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const cur = () => state.settings.currency || '₹';
const fmt = n => cur() + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = iso => { const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };
const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => today().slice(0, 7);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = (msg, dur = 2600) => { const t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), dur); };

// ═══════════════════════════════════════════════
// THEME toggler
// ═══════════════════════════════════════════════
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeUI(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const target = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', target);
  localStorage.setItem('theme', target);
  updateThemeUI(target);
  toast(`Switched to ${target} mode`);
}

function updateThemeUI(theme) {
  const ico = $('themeToggleIco');
  const lbl = $('themeToggleLabel');
  if (ico) {
    if (theme === 'dark') {
      ico.textContent = '☀️';
      if (lbl) lbl.textContent = 'Light Mode';
    } else {
      ico.textContent = '🌙';
      if (lbl) lbl.textContent = 'Dark Mode';
    }
  }
}

// ═══════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════
async function persist() {
  try {
    await window.storage.set(STORE_KEY, JSON.stringify({
      entries: state.entries, cards: state.cards, upiAccounts: state.upiAccounts,
      merchantDb: state.merchantDb, categories: state.categories, settings: state.settings
    }));
  } catch (e) { console.error(e); }
}

async function hydrate() {
  try {
    const res = await window.storage.get(STORE_KEY);
    if (res?.value) {
      const d = JSON.parse(res.value);
      state.entries = d.entries || [];
      state.cards = d.cards || [];
      state.upiAccounts = d.upiAccounts?.length ? d.upiAccounts : JSON.parse(JSON.stringify(DEFAULT_UPI));
      state.merchantDb = d.merchantDb || {};
      state.settings = { ...state.settings, ...(d.settings || {}) };
      if (!state.settings.sharedSheetId) {
        state.settings.sharedSheetId = '1KyZfFKhQEVQwPfqZbrjPna4qupUSYaBwKP5p0flcars';
      }
      const custom = (d.categories || []).filter(c => !c.builtin);
      const saved = (d.categories || []).filter(c => c.builtin);
      state.categories = DEFAULT_CATS.map(def => {
        const s = saved.find(x => x.id === def.id);
        if (!s) return def;
        return { ...def, ...s, subcats: s.subcats?.length ? s.subcats : def.subcats || [] };
      });
      state.categories.push(...custom.map(c => ({ subcats: [], ...c })));
    }
  } catch (e) { console.error(e); }
}

// ═══════════════════════════════════════════════
// LOOKUPS
// ═══════════════════════════════════════════════
function catById(id) { return state.categories.find(c => c.id === id) || state.categories[state.categories.length - 1]; }
function cardById(id) { return state.cards.find(c => c.id === id); }
function upiById(id) { return state.upiAccounts.find(u => u.id === id); }

function lookupMerchantData(vendor) {
  if (!vendor) return null;
  const key = vendor.toLowerCase().trim();
  if (state.merchantDb[key]) return state.merchantDb[key];
  for (const k of Object.keys(state.merchantDb)) { if (key.includes(k) || k.includes(key)) return state.merchantDb[k]; }
  const builtInMcc = BUILT_IN_MERCHANT_MCC[key] || Object.entries(BUILT_IN_MERCHANT_MCC).find(([k]) => key.includes(k) || k.includes(key))?.[1];
  if (builtInMcc) return { mcc: builtInMcc, mccCode: null, custom: false };
  return null;
}
function lookupMerchantMcc(vendor) { return lookupMerchantData(vendor)?.mcc || null; }
function isKnownMerchant(vendor) { return !!lookupMerchantData(vendor); }

// ═══════════════════════════════════════════════
// CASHBACK MATH
// ═══════════════════════════════════════════════
function effectiveRate(card, mccId) {
  if (!card) return 0;
  if (card.excluded?.includes(mccId)) return 0;
  return card.mccRates?.[mccId] ?? card.defaultRate ?? 0;
}
function entryRewards(entry) {
  const card = cardById(entry.cardId);
  if (!card) return { type: 'Cashback', val: 0, points: 0, cash: 0 };
  if (card.frozen) {
    return { type: card.rewardType || 'Cashback', val: 0, points: 0, cash: 0 };
  }
  if (card.minSpend && entry.amount < card.minSpend) {
    return { type: card.rewardType || 'Cashback', val: 0, points: 0, cash: 0 };
  }
  const mcc = entry.mccGroup || 'other';
  const rate = effectiveRate(card, mcc);
  if (rate === 0) return { type: card.rewardType || 'Cashback', val: 0, points: 0, cash: 0 };
  
  if (entry.cbAmt != null && entry.cbAmt !== '') {
    const cash = parseFloat(entry.cbAmt) || 0;
    if (card.rewardType === 'Points') {
      const pts = Math.round(cash / (card.pointValue || 1.0));
      return { type: 'Points', val: pts, points: pts, cash: cash };
    }
    return { type: 'Cashback', val: cash, points: 0, cash: cash };
  }
  
  const rawPointsOrCash = Math.round(entry.amount * rate / 100 * 100) / 100;
  let earnedRaw = rawPointsOrCash;
  
  if (card.cap != null) {
    const month = entry.date.slice(0, 7);
    const already = state.entries.filter(e => e.id !== entry.id && e.cardId === card.id && e.date.startsWith(month))
      .reduce((s, e) => {
        const r = entryRewards({ ...e, cbAmt: null });
        return s + r.val;
      }, 0);
    earnedRaw = Math.max(0, Math.min(rawPointsOrCash, card.cap - already));
  }
  
  if (card.rewardType === 'Points') {
    const pts = Math.round(earnedRaw);
    const cash = Math.round(pts * (card.pointValue || 1.0) * 100) / 100;
    return { type: 'Points', val: pts, points: pts, cash: cash };
  } else {
    return { type: 'Cashback', val: earnedRaw, points: 0, cash: earnedRaw };
  }
}
function entryCashback(entry) {
  return entryRewards(entry).cash;
}
function cappedCashback(entry) {
  return entryCashback(entry);
}
function monthCashback(month) {
  return state.entries.filter(e => e.date.startsWith(month)).reduce((s, e) => s + entryCashback(e), 0);
}
function monthPoints(month) {
  // Sum raw points for Points-type cards, 0 for Cashback cards
  return state.entries.filter(e => e.date.startsWith(month)).reduce((s, e) => {
    const r = entryRewards(e);
    return s + (r.type === 'Points' ? r.points : 0);
  }, 0);
}

// ═══════════════════════════════════════════════
// MONTH NAVIGATOR (Spent pill)
// ═══════════════════════════════════════════════
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let _viewYear  = new Date().getFullYear();
let _viewMonth = new Date().getMonth(); // 0-indexed
let _rewardView = 'cashback'; // 'cashback' | 'points'

function viewMonthKey() {
  return `${_viewYear}-${String(_viewMonth + 1).padStart(2, '0')}`;
}

function updateHeaderStats() {
  const m = viewMonthKey();
  const spendVal = state.entries.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0);
  $('hSpend').textContent = fmt(spendVal);
  if ($('hSpendSubVal')) $('hSpendSubVal').textContent = fmt(spendVal);
  $('hSpendLbl').textContent = 'Spent ' + MONTH_NAMES[_viewMonth];

  // Reward pill — cashback or points mode
  const cashVal  = monthCashback(m);
  const ptsVal   = monthPoints(m);

  if (_rewardView === 'points') {
    $('hCashLbl').textContent = 'Points';
    $('hCash').textContent    = ptsVal > 0 ? `${Math.round(ptsVal).toLocaleString('en-IN')} pts` : '0 pts';
    $('rewardToggleBtn').textContent      = '₹';
    $('rewardToggleBtn').style.background = 'var(--brass)';
    $('rewardToggleBtn').style.color      = '#fff';
  } else {
    $('hCashLbl').textContent = 'Cashback';
    $('hCash').textContent    = fmt(cashVal);
    $('rewardToggleBtn').textContent      = 'PTS';
    $('rewardToggleBtn').style.background = 'var(--line)';
    $('rewardToggleBtn').style.color      = 'var(--ink-soft)';
  }

  // dim next-arrow if current month
  const now = new Date();
  $('monthNextBtn').style.opacity = (_viewYear === now.getFullYear() && _viewMonth === now.getMonth()) ? '0.25' : '1';
}

function shiftViewMonth(delta) {
  _viewMonth += delta;
  if (_viewMonth > 11) { _viewMonth = 0;  _viewYear++; }
  if (_viewMonth < 0)  { _viewMonth = 11; _viewYear--; }
  // don't go past current month
  const now = new Date();
  if (_viewYear > now.getFullYear() || (_viewYear === now.getFullYear() && _viewMonth > now.getMonth())) {
    _viewYear  = now.getFullYear();
    _viewMonth = now.getMonth();
  }
  updateHeaderStats();
}

function toggleRewardView() {
  _rewardView = _rewardView === 'cashback' ? 'points' : 'cashback';
  updateHeaderStats();
}

// ═══════════════════════════════════════════════
// PAST DATA VIEWER (Settings tab)
// ═══════════════════════════════════════════════
function initHistYearSel() {
  const sel = $('histYearSel');
  if (!sel) return;
  const years = new Set(state.entries.map(e => e.date.slice(0, 4)));
  const curYear = String(new Date().getFullYear());
  years.add(curYear);
  const sorted = [...years].sort((a, b) => b - a);
  sel.innerHTML = sorted.map(y => `<option value="${y}"${y === curYear ? ' selected' : ''}>${y}</option>`).join('');
  // pre-select current month
  const curMon = String(new Date().getMonth() + 1).padStart(2, '0');
  $('histMonthSel').value = curMon;
}

function loadHistData() {
  const year  = $('histYearSel').value;
  const month = $('histMonthSel').value;
  const key   = `${year}-${month}`;
  const monthEntries = state.entries.filter(e => e.date.startsWith(key)).sort((a, b) => b.date.localeCompare(a.date));
  const totalSpend = monthEntries.reduce((s, e) => s + e.amount, 0);
  const totalCash  = monthEntries.reduce((s, e) => s + entryCashback(e), 0);
  const monthName  = MONTH_NAMES[parseInt(month, 10) - 1];

  $('histSpendVal').textContent = fmt(totalSpend);
  $('histCashVal').textContent  = fmt(totalCash);
  $('histPeriodLbl').textContent = `${monthEntries.length} transaction${monthEntries.length !== 1 ? 's' : ''} — ${monthName} ${year}`;
  $('histSummary').style.display = 'block';

  const list  = $('histEntryList');
  const empty = $('histEmpty');
  if (monthEntries.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = monthEntries.map(e => {
    const cb = entryCashback(e);
    return `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-size:13px">
      <div>
        <div style="font-weight:700;color:var(--ink)">${esc(e.vendor || '—')}</div>
        <div style="font-size:10px;color:var(--ink-soft);margin-top:2px">${e.date} · ${esc(e.category || '—')}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:800;color:var(--red)">${fmt(e.amount)}</div>
        ${cb ? `<div style="font-size:10px;color:var(--brass);margin-top:2px">+${fmt(cb)}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}


// ═══════════════════════════════════════════════
// INSTRUMENT FIELD (mode-aware)
// ═══════════════════════════════════════════════
function buildInstrumentField(keepId) {
  const mode = $('fMode').value;
  const wrap = $('instrWrap');

  if (mode === 'cash' || mode === 'other') {
    wrap.innerHTML = '';
    updateCashbackPreview();
    return;
  }

  if (mode === 'upi') {
    const opts = state.upiAccounts.map(u =>
      `<option value="${u.id}">${esc(u.name)}${u.upiId ? ' (' + esc(u.upiId) + ')' : ''}</option>`
    ).join('');
    wrap.innerHTML = `
      <div class="g2" style="gap:12px; grid-column: span 2">
        <div class="field">
          <label for="fInstr">UPI app used</label>
          <select id="fInstr">
            <option value="">— select UPI app —</option>
            ${opts}
          </select>
          <div style="margin-top:6px"><button type="button" class="link-btn" id="inlineAddUpiBtn">+ add UPI app</button></div>
        </div>
        <div class="field">
          <label for="fUpiBank">Bank account used</label>
          <select id="fUpiBank">
            <option value="">— select bank —</option>
            <option value="HDFC">HDFC</option>
            <option value="ICICI">ICICI</option>
            <option value="SBI">SBI</option>
            <option value="Axis">Axis</option>
            <option value="AMEX">AMEX</option>
            <option value="RuPay">RuPay</option>
            <option value="Other">Other...</option>
          </select>
          <input id="fUpiBankCustom" type="text" placeholder="e.g. Kotak" style="display:none;margin-top:6px"/>
        </div>
      </div>`;
      
      $('inlineAddUpiBtn').onclick = () => switchTab('cards');
      
      $('fUpiBank').addEventListener('change', () => {
        const isOther = $('fUpiBank').value === 'Other';
        $('fUpiBankCustom').style.display = isOther ? 'block' : 'none';
        if (isOther) $('fUpiBankCustom').focus();
      });
  } else if (mode === 'netbanking') {
    wrap.innerHTML = `
      <div class="field">
        <label for="fInstr">Bank</label>
        <input id="fInstr" type="text" placeholder="e.g. SBI, HDFC, ICICI"/>
      </div>`;
  } else {
    // credit or debit
    const cardType2 = mode === 'credit' ? 'Credit' : 'Debit';
    const matching = state.cards.filter(c => c.type === cardType2);
    const others = state.cards.filter(c => c.type !== cardType2);
    let opts = `<option value="">— select ${cardType2.toLowerCase()} card —</option>`;
    if (matching.length) {
      matching.forEach(c => { opts += `<option value="${c.id}">${esc(c.name)}${c.last4 ? ' ••' + c.last4 : ''}</option>`; });
    }
    if (others.length) {
      opts += `<optgroup label="Other cards">`;
      others.forEach(c => { opts += `<option value="${c.id}">${esc(c.name)}${c.last4 ? ' ••' + c.last4 : ''} (${c.type})</option>`; });
      opts += `</optgroup>`;
    }
    wrap.innerHTML = `
      <div class="field">
        <label for="fInstr">${cardType2} card used</label>
        <select id="fInstr">
          ${matching.length || others.length ? opts : '<option value="">No cards saved yet</option>'}
        </select>
        ${!matching.length ? `<div style="margin-top:6px"><button type="button" class="link-btn" id="inlineAddCardBtn">+ add a ${cardType2.toLowerCase()} card</button></div>` : ''}
      </div>`;
      if (!matching.length) {
        $('inlineAddCardBtn').onclick = () => switchTab('cards');
      }
  }

  // restore previous selection
  const fi = document.getElementById('fInstr');
  if (fi && keepId && [...fi.options].some(o => o.value === keepId)) fi.value = keepId;
  if (fi) fi.addEventListener('change', updateCashbackPreview);
  updateCashbackPreview();
}

function getInstrumentValue() {
  const fi = document.getElementById('fInstr');
  return fi ? fi.value : '';
}

// ═══════════════════════════════════════════════
// CASHBACK PREVIEW
// ═══════════════════════════════════════════════
function updateCashbackPreview() {
  const el = $('cbPre');
  const mode = $('fMode').value;
  if (mode === 'upi' || mode === 'cash' || mode === 'netbanking' || mode === 'other') {
    el.style.display = 'none'; return;
  }
  const cardId = getInstrumentValue();
  const card = cardById(cardId);
  if (!card) { el.style.display = 'none'; return; }
  const mcc = currentMccGroup || 'other';
  const rate = effectiveRate(card, mcc);
  const g = MCC_BY_ID[mcc];
  const amount = parseFloat($('fAmt').value) || 0;
  el.className = 'cb-pre'; el.style.display = 'block';
  if (rate === 0) {
    el.textContent = `⚠ ${card.name} — ${g?.label || mcc} is excluded (0% cashback)`;
    el.classList.add('warn'); return;
  }
  if (!amount) { el.textContent = `${card.name} earns ${rate}% on ${g?.label || mcc}`; return; }
  const raw = Math.round(amount * rate / 100 * 100) / 100;
  if (card.cap != null) {
    const month = ($('fDate').value || today()).slice(0, 7);
    const already = state.entries.filter(e => e.cardId === card.id && e.date.startsWith(month))
      .reduce((s, e) => s + rawCashback(e.amount, card, e.mccGroup || 'other'), 0);
    const room = Math.max(0, card.cap - already);
    const earned = Math.min(raw, room);
    if (earned < raw) {
      el.textContent = `Cashback: ${fmt(earned)} (cap hit — ${fmt(already)} of ${fmt(card.cap)} used this month)`;
      el.classList.add('warn');
    } else {
      el.textContent = `Estimated cashback: ${fmt(raw)} @ ${rate}% with ${card.name}`;
    }
  } else {
    el.textContent = `Estimated cashback: ${fmt(raw)} @ ${rate}% with ${card.name}`;
  }
}

// ═══════════════════════════════════════════════
// VENDOR / MCC INPUT
// ═══════════════════════════════════════════════
function onVendorInput() {
  const vendor = $('fVendor').value.trim();
  const mcc = lookupMerchantMcc(vendor);
  const known = isKnownMerchant(vendor);
  currentVendorKey = vendor.toLowerCase().trim();
  if (mcc) {
    setMccGroup(mcc);
    const cat = state.categories.find(c => c.mccGroups?.includes(mcc));
    if (cat) {
      $('fCat').value = cat.id;
      populateFSubcat(cat.id);
    }
  } else {
    setMccGroup(null);
  }
  const assignBox = $('merchantAssign');
  if (vendor.length > 2 && !known) {
    assignBox.style.display = 'block';
  } else {
    assignBox.style.display = 'none';
  }
  updateCashbackPreview();
}

function setMccGroup(grpId) {
  currentMccGroup = grpId;
  const chip = $('mccChipWrap');
  if (grpId) {
    const g = MCC_BY_ID[grpId];
    $('mccChipIco').textContent = g?.ico || '💳';
    $('mccChipLbl').textContent = ' ' + (g?.label || grpId);
    chip.style.display = 'block';
    $('mccOverride').style.display = 'none';
    $('mccSelect').value = grpId;
  } else {
    chip.style.display = 'none';
    $('mccOverride').style.display = 'none';
  }
  updateCashbackPreview();
}

function overrideMcc() {
  $('mccChipWrap').style.display = 'none';
  $('mccOverride').style.display = 'block';
  $('mccSelect').onchange = () => {
    currentMccGroup = $('mccSelect').value || null;
    if (currentMccGroup) setMccGroup(currentMccGroup);
    else { $('mccOverride').style.display = 'none'; $('mccChipWrap').style.display = 'none'; }
    updateCashbackPreview();
  };
}

// ═══════════════════════════════════════════════
// SELECTS POPULATION
// ═══════════════════════════════════════════════
function populateStaticSelects() {
  [$('fCat'), $('catFilter')].forEach((el, i) => {
    el.innerHTML = i ? '<option value="All">All categories</option>' : '';
    state.categories.forEach(c => el.innerHTML += `<option value="${c.id}">${esc(c.name)}</option>`);
  });
  [$('mccSelect'), $('maMccSelect'), $('meMcc')].forEach(el => {
    if (!el) return;
    el.innerHTML = '<option value="">— select MCC —</option>';
    MCC_GROUPS.forEach(g => el.innerHTML += `<option value="${g.id}">${g.ico} ${g.label}</option>`);
  });
}

function populateFSubcat(catId, keepVal = '') {
  const cat = state.categories.find(c => c.id === catId);
  const wrap = $('fSubcatWrap');
  const sel = $('fSubcat');
  const subcats = cat?.subcats || [];
  wrap.style.display = 'block';
  sel.innerHTML = '<option value="">— general / none —</option>';
  subcats.forEach(s => sel.innerHTML += `<option value="${s.id}">${esc(s.name)}</option>`);
  sel.innerHTML += `<option value="__add__" style="color:var(--brass);font-style:italic">+ Add new subcategory…</option>`;
  if (keepVal && [...sel.options].some(o => o.value === keepVal)) sel.value = keepVal;
  $('fSubcatAddWrap').style.display = 'none';
  $('fSubcatNewName').value = '';
}

async function addSubcatFromEntry() {
  const name = $('fSubcatNewName').value.trim();
  if (!name) { $('fSubcatNewName').focus(); return; }
  const catId = $('fCat').value;
  const cat = state.categories.find(c => c.id === catId);
  if (!cat) return;
  if (!cat.subcats) cat.subcats = [];
  const newId = catId + '_' + uid();
  cat.subcats.push({ id: newId, name });
  await persist();
  populateFSubcat(catId, newId);
  renderCatTab();
  toast(`"${name}" added to ${cat.name}`);
}

function cancelSubcatAdd() {
  $('fSubcatAddWrap').style.display = 'none';
  $('fSubcatNewName').value = '';
}

// ═══════════════════════════════════════════════
// TEXT PARSER
// ═══════════════════════════════════════════════
function parseExpenseText(text) {
  const r = { amount: null, vendor: null, date: null, mode: null, last4: null, bank: null };
  const ap = [
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /\$\s*([\d,]+(?:\.\d{1,2})?)/,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i
  ];
  for (const p of ap) { const m = text.match(p); if (m) { r.amount = parseFloat(m[1].replace(/,/g, '')); break; } }
  const vp = [
    /at\s+([A-Z][A-Za-z0-9&._\- ]{2,30}?)(?:\s+on|\s+via|\.|,|$)/,
    /to\s+([A-Z][A-Za-z0-9&._\- ]{2,30}?)(?:\s+on|\s+via|\.|,|$)/,
    /;\s*([A-Za-z0-9&._\- ]{2,30}?)\s+credited\b/i
  ];
  for (const p of vp) { const m = text.match(p); if (m) { r.vendor = m[1].trim(); break; } }
  const dm = text.match(/\b(\d{1,2}[-\/][A-Za-z]{3,9}[-\/]\d{2,4})\b/) || text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (dm) { const g = new Date(dm[1].replace(/-/g, ' ')); if (!isNaN(g)) r.date = g.toISOString().slice(0, 10); }
  if (!r.date) r.date = today();
  const lo = text.toLowerCase();
  if (/\bupi\b/.test(lo)) r.mode = 'upi';
  else if (/credit card/.test(lo)) r.mode = 'credit card';
  else if (/debit card/.test(lo)) r.mode = 'debit card';
  else if (/net\s*banking/.test(lo)) r.mode = 'net banking';
  const l4 = text.match(/(?:ending|xx+|\*{2,}|x|card|a\/c\s*\*?)\s*:?\s*(\d{4})\b/i);
  if (l4) r.last4 = l4[1];
  
  const bankMatch = text.match(/\b(hdfc|icici|sbi|axis|amex|rupay|paytm|airtel|kotak|idfc|yesbank|rbl|pnb|bob|cbi|canara|unity|slice)\b/i);
  if (bankMatch) {
    r.bank = bankMatch[1].toUpperCase();
  }
  
  const timePats = [
    /\bat\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:AM|PM|hrs|IST|HRS)?\b/i,
    /\b(\d{1,2}:\d{2})\s*(?:AM|PM)\b/i,
    /\b(\d{2}:\d{2}:\d{2})\b/,
  ];
  for (const p of timePats) {
    const m = text.match(p);
    if (m) {
      const parts = m[1].split(':');
      r.time = parts[0].padStart(2, '0') + ':' + parts[1];
      break;
    }
  }
  return r;
}

const MODE_LABEL = { upi: 'UPI', credit: 'Credit Card', debit: 'Debit Card', cash: 'Cash', netbanking: 'Net Banking', other: 'Other' };
const nowTime = () => new Date().toTimeString().slice(0, 5);
let pendingSource = 'manual';
let pendingTime = null;

// ═══════════════════════════════════════════════
// LEDGER RENDERERS
// ═══════════════════════════════════════════════
function getFiltered() {
  const q = ($('searchQ').value || '').trim().toLowerCase();
  const cat = $('catFilter').value;
  const month = $('monthFilter').value;
  return state.entries.filter(e => {
    if (month && !e.date.startsWith(month)) return false;
    if (cat !== 'All' && e.category !== cat) return false;
    if (q && !e.vendor.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderPieChart(filtered) {
  const totals = {};
  let grandTotal = 0;
  filtered.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
    grandTotal += e.amount;
  });

  const container = $('pieChartContainer');
  if (!container) return;

  if (grandTotal === 0) {
    container.innerHTML = '<div style="text-align:center; padding:24px 0; color:var(--ink-soft); font-style:italic">No category spends this period.</div>';
    return;
  }

  const slices = [];
  state.categories.forEach(c => {
    if (!totals[c.id]) return;
    const value = totals[c.id];
    const percent = value / grandTotal;
    slices.push({
      color: c.color,
      name: c.name,
      value: value,
      percent: percent
    });
  });

  slices.sort((a, b) => b.value - a.value);

  let svgContent = '';
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  let cumulativePercent = 0;
  slices.forEach(slice => {
    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
    cumulativePercent += slice.percent;
    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
    
    let pathData;
    if (slice.percent >= 0.999) {
      pathData = 'M 0 -1 A 1 1 0 1 1 -0.0001 -1 Z';
    } else {
      const largeArcFlag = slice.percent > 0.5 ? 1 : 0;
      pathData = [
        `M ${startX} ${startY}`,
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `L 0 0`,
        `Z`
      ].join(' ');
    }
    
    svgContent += `<path d="${pathData}" fill="${slice.color}" style="transition: transform 0.2s; cursor: pointer" />`;
  });

  container.innerHTML = `
    <div style="display:flex; flex-direction:row; align-items:center; gap:24px; flex-wrap:wrap; justify-content:center; margin-top:8px">
      <div style="position:relative; width:110px; height:110px">
        <svg viewBox="-1.1 -1.1 2.2 2.2" style="transform: rotate(-90deg); width:100%; height:100%">
          ${svgContent}
        </svg>
      </div>
      <div style="flex:1; min-width:180px; display:flex; flex-direction:column; gap:6px">
        ${slices.map(s => `
          <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px; font-weight:700">
            <span style="display:flex; align-items:center; gap:6px; color:var(--ink-soft)">
              <span style="width:8px; height:8px; border-radius:50%; background:${s.color}; display:inline-block"></span>
              ${esc(s.name)}
            </span>
            <span style="color:var(--ink)">
              ${fmt(s.value)} <span style="color:var(--ink-soft); font-size:10px; font-weight:600">(${Math.round(s.percent * 100)}%)</span>
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderBreakdown(filtered) {
  const totals = {};
  filtered.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
  const maxV = Math.max(1, ...Object.values(totals));
  const el = $('breakdown');
  if (!Object.keys(totals).length) { el.innerHTML = '<div class="empty" style="padding:10px 0;border:none;background:none">No data for this filter.</div>'; return; }
  el.innerHTML = '';
  state.categories.forEach(c => {
    if (!totals[c.id]) return;
    el.innerHTML += `<div class="bar-row">
      <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c.color};margin-right:5px"></span>${esc(c.name)}</span>
      <span class="bar-track"><span class="bar-fill2" style="width:${totals[c.id] / maxV * 100}%;background:${c.color}"></span></span>
      <span class="bar-amt">${fmt(totals[c.id])}</span></div>`;
  });
}

function renderCbSummary() {
  const month = $('monthFilter').value || thisMonth();
  const el = $('cbSummary');
  const hasData = state.entries.some(e => e.date.startsWith(month) && entryCashback(e) > 0);
  if (!hasData) { el.innerHTML = '<div class="empty" style="padding:8px 0">No cashback yet — set CB% on a row or add card rates.</div>'; return; }
  const perCard = {}; const manual = { spend: 0, earned: 0 };
  state.entries.filter(e => e.date.startsWith(month)).forEach(e => {
    const cb = entryCashback(e); if (!cb) return;
    if (e.cardId) {
      if (!perCard[e.cardId]) perCard[e.cardId] = { card: cardById(e.cardId), spend: 0, earned: 0 };
      perCard[e.cardId].spend += e.amount; perCard[e.cardId].earned += cb;
    } else { manual.spend += e.amount; manual.earned += cb; }
  });
  el.innerHTML = '';
  Object.values(perCard).forEach(({ card, spend, earned }) => {
    if (!earned) return;
    const cap = card?.cap != null ? card.cap : null;
    const pct = cap && cap > 0 ? Math.min(100, earned / cap * 100) : 0;
    el.innerHTML += `<div class="cb-card"><div class="cb-top"><span class="cb-name">${card ? esc(card.name + (card.last4 ? ' ••' + card.last4 : '')) : 'Removed card'}</span><span class="cb-earned">${fmt(earned)}</span></div>
      ${cap != null ? `<div class="cb-bar"><div class="cb-fill${pct >= 100 ? ' maxed' : ''}" style="width:${pct}%"></div></div><div class="cb-sub">on ${fmt(spend)} · cap ${fmt(cap)}/mo${pct >= 100 ? ' · cap reached' : ''}</div>` : `<div class="cb-sub">on ${fmt(spend)} spent</div>`}</div>`;
  });
  if (manual.earned > 0) el.innerHTML += `<div class="cb-card"><div class="cb-top"><span class="cb-name">Manual / no card</span><span class="cb-earned">${fmt(manual.earned)}</span></div><div class="cb-sub">on ${fmt(manual.spend)} spent</div></div>`;
}

function instrLabel(entry) {
  if (entry.cardId) { const c = cardById(entry.cardId); return c ? { name: c.name, sub: c.last4 ? '•••• ' + c.last4 : c.type } : { name: 'Removed card', sub: '' }; }
  if (entry.upiAccountId) {
    const u = upiById(entry.upiAccountId);
    return u ? { name: u.name, sub: (entry.upiBank ? entry.upiBank + ' · ' : '') + (u.upiId || '') } : { name: 'UPI', sub: entry.upiBank || '' };
  }
  if (entry.instrLabel) return { name: entry.instrLabel, sub: '' };
  return null;
}

function renderLedgerTable(filtered) {
  const asc = [...filtered].sort((a, b) => {
    const dtA = a.date + 'T' + (a.time || '00:00');
    const dtB = b.date + 'T' + (b.time || '00:00');
    return dtA.localeCompare(dtB) || a.id.localeCompare(b.id);
  });
  let run = 0;
  const rows = asc.map(e => { run += e.amount; return { ...e, run }; }).reverse();
  const body = $('ledgerBody');
  body.innerHTML = '';
  $('ledgerEmpty').style.display = rows.length ? 'none' : 'block';
  rows.forEach(e => {
    const cat = catById(e.category);
    const g = MCC_BY_ID[e.mccGroup || 'other'];
    const merchantData = lookupMerchantData(e.vendor);
    const mccCode = merchantData?.mccCode || e.mccCode || null;
    const instr = instrLabel(e);
    const card = cardById(e.cardId);
    const autoPct = card ? effectiveRate(card, e.mccGroup || 'other') : 0;
    const autoAmt = card ? cappedCashback(e) : 0;
    const dPct = e.cbPct != null ? e.cbPct : (autoPct || '');
    const dAmt = e.cbAmt != null ? e.cbAmt : (autoAmt || '');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-l="Date" class="mono editable-cell" data-field="date" data-id="${e.id}">${fmtDate(e.date)}</td>
      <td data-l="Vendor" class="editable-cell" data-field="vendor" data-id="${e.id}">${esc(e.vendor)}</td>
      <td data-l="Cat" class="editable-cell" data-field="category" data-id="${e.id}">
        <span class="cat-tag"><span class="cat-dot" style="background:${cat?.color || '#999'}"></span>${esc(cat?.name || e.category)}</span>
        ${(() => { const sc = (cat?.subcats || []).find(s => s.id === e.subCatId); return sc ? `<div style="font-size:11px;color:var(--ink-soft);margin-top:2px;padding-left:14px">${esc(sc.name)}</div>` : ''; })()}
      </td>
      <td data-l="MCC">${mccCode ? `<span style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--brass);background:var(--brass-bg);padding:1px 6px;border-radius:4px">${mccCode}</span>` : ''}</td>
      <td data-l="Mode" class="editable-cell" data-field="paymentMode" data-id="${e.id}" style="font-size:12.5px">${MODE_LABEL[e.paymentMode] || e.paymentMode || '—'}</td>
      <td data-l="Instrument" class="editable-cell" data-field="instrument" data-id="${e.id}">
        ${instr ? `<div class="instr-cell-name">${esc(instr.name)}</div>${instr.sub ? `<div class="instr-cell-sub">${esc(instr.sub)}</div>` : ''}`
          : `<span style="color:var(--ink-faint);font-size:12px">—</span>`}
      </td>
      <td data-l="Amount" class="red editable-cell" data-field="amount" data-id="${e.id}">-${fmt(e.amount)}</td>
      <td data-l="CB %" class="cb-cell">
        <input type="number" class="cb-pct" data-id="${e.id}" value="${dPct}" step="0.1" min="0" max="100" placeholder="0"/>
        <span class="u">${card && card.rewardType === 'Points' ? 'pts' : '%'}</span>
      </td>
      <td data-l="Cashback" class="cb-cell" style="color:var(--brass)">
        <span class="u">${cur()}</span>
        <input type="number" class="cb-amt" data-id="${e.id}" value="${dAmt}" step="0.01" min="0" placeholder="0"
          style="${e.cbAmt != null ? 'border-color:var(--brass)' : ''}"/>
        ${(() => {
          const rew = entryRewards(e);
          return rew.type === 'Points' ? `<div style="font-size:10.5px;color:var(--ink-soft);margin-top:2px;font-weight:700">${rew.points} pts</div>` : '';
        })()}
      </td>
      <td style="position:relative">
        <button class="row-menu-btn" data-id="${e.id}" style="background:none; border:none; color:var(--ink-soft); cursor:pointer; font-size:16px; padding:4px 8px; outline:none">⋮</button>
        <div class="row-menu-dropdown" id="dropdown-${e.id}" style="display:none; position:absolute; right:10px; top:35px; background:var(--card); border:1px solid var(--line); border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:10; min-width:120px; overflow:hidden">
          <button class="dropdown-item split-btn" data-id="${e.id}" style="display:block; width:100%; text-align:left; background:none; border:none; padding:8px 12px; font-size:12.5px; color:var(--ink); cursor:pointer; font-family:var(--sans)">✂️ Split</button>
          <button class="dropdown-item del-btn" data-id="${e.id}" style="display:block; width:100%; text-align:left; background:none; border:none; padding:8px 12px; font-size:12.5px; color:var(--red); cursor:pointer; border-top:1px solid var(--line); font-family:var(--sans)">✕ Delete</button>
        </div>
      </td>`;
    body.appendChild(tr);
  });

  body.querySelectorAll('.cb-pct').forEach(inp => {
    inp.addEventListener('change', async () => {
      const entry = state.entries.find(e => e.id === inp.dataset.id); if (!entry) return;
      const pct = parseFloat(inp.value);
      if (isNaN(pct) || pct < 0) { inp.value = ''; return; }
      const amt = Math.round(entry.amount * pct / 100 * 100) / 100;
      entry.cbPct = pct; entry.cbAmt = amt;
      const ai = inp.closest('tr').querySelector('.cb-amt');
      if (ai) { ai.value = amt || ''; ai.style.borderColor = 'var(--brass)'; }
      await persist(); updateHeaderStats(); renderCbSummary();
    });
  });
  body.querySelectorAll('.cb-amt').forEach(inp => {
    inp.addEventListener('change', async () => {
      const entry = state.entries.find(e => e.id === inp.dataset.id); if (!entry) return;
      const amt = parseFloat(inp.value);
      if (isNaN(amt) || amt < 0) { inp.value = ''; entry.cbAmt = null; entry.cbPct = null; inp.style.borderColor = ''; await persist(); updateHeaderStats(); renderCbSummary(); return; }
      const pct = entry.amount > 0 ? Math.round(amt / entry.amount * 10000) / 100 : 0;
      entry.cbAmt = amt; entry.cbPct = pct;
      inp.style.borderColor = 'var(--brass)';
      const pi = inp.closest('tr').querySelector('.cb-pct');
      if (pi) pi.value = pct || '';
      await persist(); updateHeaderStats(); renderCbSummary();
    });
  });
  body.querySelectorAll('.del-btn').forEach(b => b.onclick = async (e) => {
    e.stopPropagation();
    const dropdown = b.closest('.row-menu-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    if (!confirm('Delete this entry?')) return;
    state.entries = state.entries.filter(e => e.id !== b.dataset.id);
    await persist(); renderAll();
  });

  body.querySelectorAll('.editable-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      if (cell.querySelector('input') || cell.querySelector('select')) return;
      e.stopPropagation();
      const field = cell.dataset.field;
      const entryId = cell.dataset.id;
      const entry = state.entries.find(x => x.id === entryId);
      if (!entry) return;

      let input;
      if (field === 'date') {
        input = document.createElement('input');
        input.type = 'date';
        input.value = entry.date;
        input.style.width = '120px';
      } else if (field === 'vendor') {
        input = document.createElement('input');
        input.type = 'text';
        input.value = entry.vendor;
        input.style.width = '140px';
      } else if (field === 'amount') {
        input = document.createElement('input');
        input.type = 'number';
        input.step = '0.01';
        input.value = entry.amount;
        input.style.width = '70px';
      } else if (field === 'category') {
        input = document.createElement('select');
        state.categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          if (c.id === entry.category) opt.selected = true;
          input.appendChild(opt);
        });
      } else if (field === 'paymentMode') {
        input = document.createElement('select');
        Object.entries(MODE_LABEL).forEach(([k, v]) => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = v;
          if (k === entry.paymentMode) opt.selected = true;
          input.appendChild(opt);
        });
      } else if (field === 'instrument') {
        input = document.createElement('select');
        const noneOpt = document.createElement('option');
        noneOpt.value = '';
        noneOpt.textContent = 'None / Manual';
        if (!entry.cardId && !entry.upiAccountId) noneOpt.selected = true;
        input.appendChild(noneOpt);
        
        state.cards.forEach(c => {
          const opt = document.createElement('option');
          opt.value = 'card:' + c.id;
          opt.textContent = `${c.bank ? c.bank + ' · ' : ''}${c.name} (${c.type})`;
          if (entry.cardId === c.id) opt.selected = true;
          input.appendChild(opt);
        });

        state.upiAccounts.forEach(u => {
          const opt = document.createElement('option');
          opt.value = 'upi:' + u.id;
          opt.textContent = `${u.name} (UPI)`;
          if (entry.upiAccountId === u.id) opt.selected = true;
          input.appendChild(opt);
        });
      }

      if (!input) return;
      input.className = 'table-cell-input';

      const saveChange = async () => {
        const val = input.value;
        let changed = false;

        if (field === 'date') {
          if (val && val !== entry.date) { entry.date = val; changed = true; }
        } else if (field === 'vendor') {
          if (val.trim() && val.trim() !== entry.vendor) { entry.vendor = val.trim(); changed = true; }
        } else if (field === 'amount') {
          const num = parseFloat(val);
          if (!isNaN(num) && num > 0 && num !== entry.amount) { entry.amount = num; changed = true; }
        } else if (field === 'category') {
          if (val && val !== entry.category) { entry.category = val; changed = true; }
        } else if (field === 'paymentMode') {
          if (val && val !== entry.paymentMode) { entry.paymentMode = val; changed = true; }
        } else if (field === 'instrument') {
          if (val.startsWith('card:')) {
            entry.cardId = val.substring(5);
            entry.upiAccountId = null;
            const card = cardById(entry.cardId);
            if (card) entry.paymentMode = card.type === 'Credit' ? 'credit' : 'debit';
            changed = true;
          } else if (val.startsWith('upi:')) {
            entry.upiAccountId = val.substring(4);
            entry.cardId = null;
            entry.paymentMode = 'upi';
            changed = true;
          } else {
            entry.cardId = null;
            entry.upiAccountId = null;
            changed = true;
          }
        }

        if (changed) {
          await persist();
          renderAll();
          toast('Cell updated');
        } else {
          renderAll();
        }
      };

      input.addEventListener('blur', saveChange);
      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
          input.blur();
        } else if (evt.key === 'Escape') {
          renderAll();
        }
      });

      cell.innerHTML = '';
      cell.appendChild(input);
      input.focus();
    });
  });

  body.querySelectorAll('.split-btn').forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    const dropdown = b.closest('.row-menu-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    openSplitModal(b.dataset.id);
  });

  body.querySelectorAll('.row-menu-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const dropId = 'dropdown-' + btn.dataset.id;
      document.querySelectorAll('.row-menu-dropdown').forEach(d => {
        if (d.id !== dropId) d.style.display = 'none';
      });
      const dropdown = document.getElementById(dropId);
      if (dropdown) {
        const isHidden = dropdown.style.display === 'none';
        dropdown.style.display = isHidden ? 'block' : 'none';
      }
    };
  });

  // Global click to close menu dropdowns
  document.addEventListener('click', () => {
    document.querySelectorAll('.row-menu-dropdown').forEach(d => d.style.display = 'none');
  });
}

let activeSplitEntryId = null;

function openSplitModal(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;
  
  activeSplitEntryId = id;
  $('splitInfo').innerHTML = `Splitting transaction: <strong>${esc(entry.vendor)}</strong> on <strong>${fmtDate(entry.date)}</strong>.<br/>Current Amount: <strong>${fmt(entry.amount)}</strong>`;
  $('splitAmountInput').value = '';
  
  // Populate category select
  const catSel = $('splitCategorySelect');
  catSel.innerHTML = '';
  state.categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    if (c.id === entry.category) opt.selected = true;
    catSel.appendChild(opt);
  });
  
  $('splitModal').classList.add('open');
}

function closeSplitModal() {
  $('splitModal').classList.remove('open');
  activeSplitEntryId = null;
}

async function confirmSplit() {
  if (!activeSplitEntryId) return;
  const original = state.entries.find(e => e.id === activeSplitEntryId);
  if (!original) return;

  const splitAmt = parseFloat($('splitAmountInput').value);
  const splitCat = $('splitCategorySelect').value;

  if (isNaN(splitAmt) || splitAmt <= 0) {
    alert('Please enter a valid positive amount.');
    return;
  }

  if (splitAmt >= original.amount) {
    alert('Split amount must be less than the original transaction amount.');
    return;
  }

  // Adjust original transaction
  const prevAmount = original.amount;
  original.amount = Math.round((original.amount - splitAmt) * 100) / 100;
  
  // Adjust original cashback if custom
  if (original.cbPct != null) {
    original.cbAmt = Math.round(original.amount * original.cbPct / 100 * 100) / 100;
  } else if (original.cbAmt != null) {
    original.cbAmt = Math.round(original.cbAmt * (original.amount / prevAmount) * 100) / 100;
  }

  // Create new split transaction
  const splitEntry = {
    id: uid(),
    date: original.date,
    time: original.time || '00:00',
    source: original.source || 'split',
    vendor: original.vendor,
    amount: splitAmt,
    category: splitCat,
    subCatId: null,
    mccGroup: original.mccGroup || 'other',
    mccCode: original.mccCode || null,
    paymentMode: original.paymentMode,
    cardId: original.cardId,
    upiAccountId: original.upiAccountId,
    upiBank: original.upiBank || null,
    instrLabel: original.instrLabel || null
  };

  state.entries.push(splitEntry);
  await persist();
  closeSplitModal();
  renderAll();
  toast(`Transaction split successfully!`);
}

function renderAll() {
  updateHeaderStats();
  const f = getFiltered();
  renderBreakdown(f);
  renderPieChart(f);
  renderCbSummary();
  renderLedgerTable(f);
}

// ═══════════════════════════════════════════════
// UPI ACCOUNTS
// ═══════════════════════════════════════════════
function renderUpiList() {
  const track = $('upiTrack');
  const empty = $('upiTrackEmpty');
  const count = $('upiCount');
  const n = state.upiAccounts.length;
  count.textContent = n ? `${n} account${n !== 1 ? 's' : ''}` : 'None added';

  // Remove existing tiles (keep empty placeholder)
  track.querySelectorAll('.upi-tile').forEach(t => t.remove());

  if (!n) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  state.upiAccounts.forEach(u => {
    const tile = document.createElement('div');
    tile.className = 'upi-tile';
    tile.innerHTML = `
      <div>
        <div class="upi-tile-name">📲 ${esc(u.name)}</div>
        <div class="upi-tile-id">${u.upiId ? esc(u.upiId) : 'No UPI ID'}</div>
      </div>
      <div class="upi-tile-actions">
        <button title="Edit" data-edit="${u.id}">✎</button>
        <button title="Delete" data-del="${u.id}">✕</button>
      </div>`;
    tile.querySelector('[data-edit]').onclick = () => openUpiEditor(u.id);
    tile.querySelector('[data-del]').onclick = async () => {
      if (!confirm('Remove this UPI account?')) return;
      state.upiAccounts = state.upiAccounts.filter(x => x.id !== u.id);
      await persist(); renderUpiList(); buildInstrumentField();
    };
    track.appendChild(tile);
  });
}

// ═══════════════════════════════════════════════
// CARDS & TEMPLATES
// ═══════════════════════════════════════════════
function renderCardsTab() {
  renderUpiList();

  const creditCards = state.cards.filter(c => c.type === 'Credit');
  const debitCards  = state.cards.filter(c => c.type === 'Debit');

  $('creditCardCount').textContent = creditCards.length ? `${creditCards.length} card${creditCards.length !== 1 ? 's' : ''}` : 'None added';
  $('debitCardCount').textContent  = debitCards.length  ? `${debitCards.length} card${debitCards.length !== 1 ? 's' : ''}`   : 'None added';

  renderCardTiles('creditCardTrack', 'creditCardEmpty', creditCards);
  renderCardTiles('debitCardTrack',  'debitCardEmpty',  debitCards);

  initTrackScrolling('creditCardTrack');
  initTrackScrolling('debitCardTrack');
}

function initTrackScrolling(trackId) {
  const track = $(trackId);
  if (!track) return;

  const updateCardScale = () => {
    const trackCenter = track.scrollLeft + track.offsetWidth / 2;
    const wrappers = track.querySelectorAll('.card-tile-wrapper');
    wrappers.forEach(w => {
      const cardCenter = w.offsetLeft + w.offsetWidth / 2;
      const dist = Math.abs(trackCenter - cardCenter);
      if (dist < w.offsetWidth * 0.6) {
        w.classList.add('center-card');
        w.classList.remove('side-card');
      } else {
        w.classList.add('side-card');
        w.classList.remove('center-card');
      }
    });
  };

  track.addEventListener('scroll', updateCardScale);
  setTimeout(updateCardScale, 80);
}

function renderCardTiles(trackId, emptyId, cards) {
  const track = $(trackId);
  const empty = $(emptyId);

  // Remove existing tiles/wrappers
  track.querySelectorAll('.card-tile-wrapper').forEach(w => w.remove());
  track.querySelectorAll('.card-tile').forEach(t => t.remove());

  if (!cards.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  cards.forEach(c => {
    const bankKey = c.bank || 'Other';
    const rewardStr = c.rewardType === 'Points'
      ? `${c.defaultRate} pts/₹100`
      : `${c.defaultRate}% cashback`;

    const wrapper = document.createElement('div');
    wrapper.className = 'card-tile-wrapper';
    wrapper.style.cssText = 'display:flex; flex-direction:column; gap:10px; align-items:center; flex:0 0 260px';

    const tile = document.createElement('div');
    tile.className = 'card-tile';
    tile.style.width = '100%';
    tile.style.margin = '0';
    tile.dataset.bank    = bankKey;
    tile.dataset.network = c.network || '';
    
    if (c.frozen) {
      tile.style.opacity = '0.5';
      tile.style.filter = 'grayscale(60%) contrast(90%)';
    }

    tile.innerHTML = `
      <div class="card-tile-actions">
        <button title="Edit" data-edit="${c.id}">✎</button>
        <button title="Delete" data-del="${c.id}">✕</button>
      </div>
      <div>
        <div class="card-tile-bank" style="display:flex; justify-content:space-between; align-items:center; width:100%">
          <span>${esc(bankKey)}</span>
          ${c.frozen ? '<span style="font-size:12px; filter:none" title="Frozen">❄️</span>' : ''}
        </div>
        <div class="card-tile-name">${esc(c.name)}</div>
      </div>
      <div>
        <div class="card-tile-number">•••• •••• •••• ${c.last4 || '····'}</div>
        <div class="card-tile-rate">${rewardStr}${c.cap != null ? ` · cap ${fmt(c.cap)}/mo` : ''}</div>
      </div>`;

    tile.querySelector('[data-edit]').onclick = (e) => { e.stopPropagation(); openCardEditor(c.id); };
    tile.querySelector('[data-del]').onclick  = async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this card?')) return;
      state.cards = state.cards.filter(x => x.id !== c.id);
      await persist(); renderCardsTab(); buildInstrumentField(); renderAll();
    };
    tile.onclick = () => openCardDetails(c.id);

    // Circular quick actions under the card
    const actionRow = document.createElement('div');
    actionRow.className = 'card-tile-quick-actions';
    actionRow.style.cssText = 'display:flex; gap:16px; justify-content:center; width:100%';
    actionRow.innerHTML = `
      <button type="button" class="cd-circle-btn add-btn" title="Add transaction with this card" style="width:34px; height:34px; border-radius:50%; border:none; background:var(--lime); color:#0B0E11; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px; transition:transform 0.15s; outline:none">+</button>
      <button type="button" class="cd-circle-btn freeze-btn" title="${c.frozen ? 'Unfreeze card' : 'Freeze card'}" style="width:34px; height:34px; border-radius:50%; border:none; background:${c.frozen ? 'rgba(79, 31, 242, 0.15)' : 'var(--line)'}; color:${c.frozen ? 'var(--brass)' : 'var(--ink-mid)'}; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; transition:transform 0.15s; outline:none">${c.frozen ? '🔥' : '❄️'}</button>
      <button type="button" class="cd-circle-btn details-btn" title="View statements &amp; details" style="width:34px; height:34px; border-radius:50%; border:none; background:var(--line); color:var(--ink-mid); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; transition:transform 0.15s; outline:none">ℹ️</button>
      <button type="button" class="cd-circle-btn edit-btn" title="Edit card parameters" style="width:34px; height:34px; border-radius:50%; border:none; background:var(--line); color:var(--ink-mid); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; transition:transform 0.15s; outline:none">⚙️</button>
    `;

    actionRow.querySelector('.add-btn').onclick = (e) => {
      e.stopPropagation();
      selectCardForTransaction(c.id);
    };
    actionRow.querySelector('.freeze-btn').onclick = async (e) => {
      e.stopPropagation();
      c.frozen = !c.frozen;
      await persist();
      renderCardsTab();
      buildInstrumentField();
      renderAll();
      toast(c.frozen ? `"${c.name}" frozen` : `"${c.name}" active`);
    };
    actionRow.querySelector('.details-btn').onclick = (e) => {
      e.stopPropagation();
      openCardDetails(c.id);
    };
    actionRow.querySelector('.edit-btn').onclick = (e) => {
      e.stopPropagation();
      openCardEditor(c.id);
    };

    wrapper.appendChild(tile);
    wrapper.appendChild(actionRow);
    track.appendChild(wrapper);
  });
}

function openUpiEditor(id) {
  editingUpiId = id;
  const u = id ? upiById(id) : null;
  $('uName').value = u?.name || '';
  $('uId').value   = u?.upiId || '';
  $('saveUpiBtn').textContent = id ? 'Update account' : 'Save UPI account';
  $('upiEditor').style.display = 'block';
  $('uName').focus();
}
function closeUpiEditor() {
  $('upiEditor').style.display = 'none';
  editingUpiId = null;
  $('uName').value = '';
  $('uId').value   = '';
}
function setCardType(type) {
  document.querySelectorAll('#cTypeSeg button').forEach(b => b.classList.toggle('on', b.dataset.type === type));
}

function buildMccRateTable(mccRates, excluded) {
  const body = $('mccRateBody'); body.innerHTML = '';
  MCC_GROUPS.forEach(g => {
    const rate = mccRates?.[g.id]; const isExcl = (excluded || []).includes(g.id);
    const st = isExcl ? 'excl' : (rate != null ? 'boost' : 'default');
    const tr = document.createElement('tr'); tr.dataset.mcc = g.id;
    tr.innerHTML = `<td style="font-size:12.5px"><span class="mcc-ico">${g.ico}</span>${g.label}<br><span style="font-size:10px;color:var(--ink-faint);font-family:var(--mono)">${g.codes.slice(0, 4).join(', ') || 'various'}</span></td>
      <td><input type="number" class="mcc-ri" data-mcc="${g.id}" step="0.1" min="0" max="100" value="${rate != null ? rate : ''}" placeholder="default" ${st !== 'boost' ? 'disabled' : ''}/><span style="font-size:11px;color:var(--ink-soft)"> %</span></td>
      <td style="text-align:center"><div class="mcc-st-seg" data-mcc="${g.id}">
        <button data-s="default" class="${st === 'default' ? 'on' : ''}">Default</button>
        <button data-s="boost" class="${st === 'boost' ? 'on' : ''}">Boost</button>
        <button data-s="excl" class="${st === 'excl' ? 'on' : ''}">Excluded</button>
      </div></td>`;
    body.appendChild(tr);
    tr.querySelectorAll('.mcc-st-seg button').forEach(b => b.onclick = () => {
      tr.querySelectorAll('.mcc-st-seg button').forEach(x => x.classList.toggle('on', x === b));
      const inp = tr.querySelector('.mcc-ri');
      inp.disabled = b.dataset.s !== 'boost';
      if (b.dataset.s === 'boost') { inp.removeAttribute('disabled'); inp.focus(); }
    });
  });
}

function collectMccRates() {
  const mccRates = {}, excluded = [];
  document.querySelectorAll('#mccRateBody tr').forEach(tr => {
    const mcc = tr.dataset.mcc; if (!mcc) return;
    const s = tr.querySelector('.mcc-st-seg button.on')?.dataset.s || 'default';
    if (s === 'excl') excluded.push(mcc);
    else if (s === 'boost') { const v = parseFloat(tr.querySelector('.mcc-ri')?.value); if (!isNaN(v) && v >= 0) mccRates[mcc] = v; }
  });
  return { mccRates, excluded };
}

const STANDARD_BANKS = ['HDFC', 'ICICI', 'SBI', 'Axis', 'AMEX', 'RuPay', 'Nexora'];

function openCardEditor(cardId) {
  editingCardId = cardId;
  const c = cardId ? cardById(cardId) : null;
  $('cardEditorTitle').textContent = c ? 'Edit card' : 'New card';

  // Reset terms parsing fields
  $('cTermsFile').value = '';
  $('cTermsText').value = '';
  $('cTermsTextBox').style.display = 'none';
  $('toggleTermsTextBtn').textContent = 'Paste Text Instead';
  
  const bankName = c?.bank || 'HDFC';
  if (STANDARD_BANKS.includes(bankName)) {
    $('cBank').value = bankName;
    $('cBankCustom').style.display = 'none';
    $('cBankCustom').value = '';
  } else {
    $('cBank').value = 'Other';
    $('cBankCustom').value = bankName;
    $('cBankCustom').style.display = 'block';
  }
  
  $('cName').value = c?.name || ''; $('cLast4').value = c?.last4 || '';
  $('cNetwork').value = c?.network || 'Visa'; $('cDefRate').value = c?.defaultRate ?? 1;
  $('cCap').value = c?.cap != null ? c.cap : '';
  $('cMinSpend').value = c?.minSpend ?? 0;
  $('cStatementDay').value = c?.statementDay ?? 15;
  $('cDueDay').value = c?.dueDay ?? 5;
  
  const rType = c?.rewardType || 'Cashback';
  $('cRewardType').value = rType;
  $('cPointVal').value = c?.pointValue ?? 1.00;
  $('cPointValField').style.display = rType === 'Points' ? 'block' : 'none';
  $('cDefRateLabel').textContent = rType === 'Points' ? 'Default points per ₹100' : 'Default cashback %';
  
  cardType = c?.type || 'Credit';
  document.querySelectorAll('#cTypeSeg button').forEach(b => b.classList.toggle('on', b.dataset.type === cardType));
  buildMccRateTable(c?.mccRates, c?.excluded);
  
  renderTemplatesForBank($('cBank').value);
  
  $('cardEditorCard').style.display = 'block';
  $('cardEditorCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  $('cardErr').textContent = '';
}

function renderTemplatesForBank(bank) {
  const tplRow = $('tplRow'); tplRow.innerHTML = '';
  const filtered = CARD_TEMPLATES.filter(t => t.bank === bank);
  if (filtered.length === 0) {
    tplRow.innerHTML = '<span class="small-hint" style="font-style:italic">No preset templates for this bank. Fill in details manually below.</span>';
    return;
  }
  filtered.forEach(t => {
    const btn = document.createElement('button'); btn.className = 'tpl-btn'; btn.textContent = t.name;
    btn.onclick = () => applyTemplate(t); tplRow.appendChild(btn);
  });
}

function applyTemplate(t) {
  $('cBank').value = t.bank;
  $('cBankCustom').style.display = 'none';
  $('cBankCustom').value = '';
  $('cName').value = t.name; $('cNetwork').value = t.network || 'Visa';
  $('cDefRate').value = t.defaultRate; $('cCap').value = t.cap != null ? t.cap : '';
  $('cMinSpend').value = t.minSpend ?? 0;
  $('cStatementDay').value = t.statementDay ?? 15;
  $('cDueDay').value = t.dueDay ?? 5;
  
  const rType = t.rewardType || 'Cashback';
  $('cRewardType').value = rType;
  $('cPointVal').value = t.pointValue ?? 1.00;
  $('cPointValField').style.display = rType === 'Points' ? 'block' : 'none';
  $('cDefRateLabel').textContent = rType === 'Points' ? 'Default points per ₹100' : 'Default cashback %';
  
  cardType = t.type;
  document.querySelectorAll('#cTypeSeg button').forEach(b => b.classList.toggle('on', b.dataset.type === cardType));
  buildMccRateTable(t.mccRates, t.excluded); toast('Template loaded — review rates and save');
}
function closeCardEditor() { $('cardEditorCard').style.display = 'none'; editingCardId = null; }

// ═══════════════════════════════════════════════
// MERCHANTS DATABASE
// ═══════════════════════════════════════════════
let editingMeKey = null;

function renderMerchantDb() {
  const el = $('merchantDbList');
  const q = ($('merchantSearch')?.value || '').trim().toLowerCase();
  const allKeys = Object.keys(state.merchantDb).sort();
  const keys = allKeys.filter(k => !q || k.includes(q) || (state.merchantDb[k].mccCode || '').includes(q));
  const countEl = $('merchantCount');
  if (countEl) countEl.textContent = `${allKeys.length} merchant${allKeys.length !== 1 ? 's' : ''}`;
  if (!keys.length) {
    el.innerHTML = `<div class="empty">${q ? 'No merchants match your search.' : 'No merchants yet — add one below.'}</div>`;
    return;
  }
  el.innerHTML = '';
  keys.forEach(k => {
    const { mcc, mccCode } = state.merchantDb[k];
    const g = MCC_BY_ID[mcc];
    const row = document.createElement('div'); row.className = 'mrch-row';
    row.innerHTML = `
      <div style="flex:1;min-width:0">
        <div class="mrch-name">${esc(k)}</div>
        <div style="font-size:11px;color:var(--ink-soft);margin-top:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap">
          ${mccCode ? `<span style="font-family:var(--mono);font-weight:700;font-size:12px;background:var(--brass-bg);color:var(--brass);padding:1px 6px;border-radius:4px">${mccCode}</span>` : ''}
          <span>${g?.ico || ''} ${g?.label || mcc}</span>
        </div>
      </div>
      <button class="ico-btn" data-edit="${esc(k)}" title="Edit">✎</button>
      <button class="ico-btn" data-del="${esc(k)}" title="Delete">✕</button>`;
    el.appendChild(row);
  });
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openMeEdit(b.dataset.edit));
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    if (!confirm(`Remove "${b.dataset.del}" from your list?`)) return;
    delete state.merchantDb[b.dataset.del]; await persist(); renderMerchantDb();
    toast('Merchant removed');
  });
}

function openMeEdit(key) {
  const data = state.merchantDb[key]; if (!data) return;
  editingMeKey = key;
  $('meName').value = key;
  $('meMcc').value = data.mcc || '';
  $('meMccCode').value = data.mccCode || '';
  $('meFormTitle').textContent = 'Edit merchant';
  $('saveMeBtn').textContent = 'Update merchant';
  $('cancelMeBtn').style.display = 'inline-flex';
  $('merchantFormCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  $('meName').focus();
}

function cancelMeEdit() {
  editingMeKey = null;
  $('meName').value = ''; $('meMcc').value = ''; $('meMccCode').value = '';
  $('meFormTitle').textContent = 'Add merchant';
  $('saveMeBtn').textContent = 'Save merchant';
  $('cancelMeBtn').style.display = 'none';
  $('meErr').textContent = '';
}

function detectMerchantFromPaste() {
  const txt = $('mePasteInput').value.trim(); if (!txt) return;
  const p = parseExpenseText(txt);
  if (p.vendor) {
    $('meName').value = p.vendor;
    const mcc = lookupMerchantMcc(p.vendor);
    if (mcc) $('meMcc').value = mcc;
    $('meName').focus();
    toast('Merchant name detected — add MCC and save');
  } else {
    toast('No merchant name found in that text');
  }
}

// ═══════════════════════════════════════════════
// CATEGORIES & SUBCATEGORIES MANAGEMENT
// ═══════════════════════════════════════════════
function renderCatTab() {
  const list = $('catList'); list.innerHTML = '';
  state.categories.forEach(c => {
    const tags = (c.mccGroups || []).map(g => `<span class="mcc-mini">${MCC_BY_ID[g]?.ico || ''} ${MCC_BY_ID[g]?.label || g}</span>`).join('');
    const subcats = c.subcats || [];
    const row = document.createElement('div');
    row.className = 'cat-item'; row.style.display = 'block'; row.style.padding = '10px 2px';

    const mainRow = document.createElement('div');
    mainRow.style.cssText = 'display:flex;align-items:center;gap:8px';
    mainRow.innerHTML = `
      <div class="cat-swatch" style="background:${c.color}"><input type="color" value="${c.color}" onchange="onSwatchChange('${c.id}',this.value)"/></div>
      <div style="font-weight:600;font-size:13.5px;white-space:nowrap;flex-shrink:0">${esc(c.name)}${c.builtin ? '' : ' <span style="font-size:10px;color:var(--ink-faint)">(custom)</span>'}</div>
      <div class="cat-mcc-tags" style="flex:1">${tags}</div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="ico-btn" onclick="editCat('${c.id}')">✎</button>
        ${!c.builtin ? `<button class="ico-btn" onclick="deleteCat('${c.id}')">✕</button>` : ''}
      </div>`;
    row.appendChild(mainRow);

    const scArea = document.createElement('div'); scArea.className = 'subcat-area';
    const chips = subcats.map(s => `
      <span class="sc-chip" data-sid="${s.id}">
        <span class="sc-name">${esc(s.name)}</span>
        <button onclick="editSubcat('${c.id}','${s.id}')" title="Rename">✎</button>
        <button onclick="deleteSubcat('${c.id}','${s.id}')" title="Delete">✕</button>
      </span>`).join('');
    scArea.innerHTML = `
      <div class="subcat-chips" id="sc-chips-${c.id}">${chips || '<span style="font-size:11.5px;color:var(--ink-faint);font-style:italic">No subcategories yet</span>'}</div>
      <div class="sc-add-row" id="sc-add-${c.id}">
        <input type="text" placeholder="New subcategory name…" id="sc-input-${c.id}" style="font-size:12px;padding:5px 7px;border:1px solid var(--line);border-radius:3px;background:var(--paper);width:170px"/>
        <button class="btn sm" onclick="addSubcat('${c.id}')">Add</button>
      </div>`;
    row.appendChild(scArea);
    list.appendChild(row);
  });
  buildCfMccCboxes([]);
}

async function onSwatchChange(id, color) { const c = state.categories.find(x => x.id === id); if (c) c.color = color; await persist(); renderAll(); }

async function addSubcat(catId) {
  const inp = document.getElementById(`sc-input-${catId}`);
  const name = inp?.value.trim();
  if (!name) return;
  const cat = state.categories.find(c => c.id === catId); if (!cat) return;
  if (!cat.subcats) cat.subcats = [];
  cat.subcats.push({ id: catId + '_' + uid(), name });
  await persist(); inp.value = ''; renderCatTab(); populateFSubcat($('fCat').value);
  toast('Subcategory added');
}

async function deleteSubcat(catId, subcatId) {
  if (!confirm('Delete this subcategory?')) return;
  const cat = state.categories.find(c => c.id === catId); if (!cat) return;
  cat.subcats = (cat.subcats || []).filter(s => s.id !== subcatId);
  state.entries.forEach(e => { if (e.subCatId === subcatId) e.subCatId = null; });
  await persist(); renderCatTab(); populateFSubcat($('fCat').value); renderAll();
  toast('Subcategory deleted');
}

function editSubcat(catId, subcatId) {
  const cat = state.categories.find(c => c.id === catId); if (!cat) return;
  const sc = cat.subcats?.find(s => s.id === subcatId); if (!sc) return;
  const chip = document.querySelector(`.sc-chip[data-sid="${subcatId}"]`); if (!chip) return;
  chip.classList.add('editing');
  chip.innerHTML = `<input type="text" value="${esc(sc.name)}" style="font-size:11.5px;width:130px;padding:1px 4px;border:none;background:transparent;font-family:var(--sans)" id="sc-edit-inp-${subcatId}"/>
    <button onclick="saveSubcatEdit('${catId}','${subcatId}')" style="color:var(--green)">✓</button>
    <button onclick="renderCatTab()" style="color:var(--ink-soft)">✕</button>`;
  const inp = document.getElementById(`sc-edit-inp-${subcatId}`);
  if (inp) { inp.focus(); inp.select(); }
}

async function saveSubcatEdit(catId, subcatId) {
  const inp = document.getElementById(`sc-edit-inp-${subcatId}`);
  const name = inp?.value.trim(); if (!name) return;
  const cat = state.categories.find(c => c.id === catId); if (!cat) return;
  const sc = cat.subcats?.find(s => s.id === subcatId); if (!sc) return;
  sc.name = name;
  await persist(); renderCatTab(); populateFSubcat($('fCat').value);
  toast('Subcategory renamed');
}

function buildCfMccCboxes(selected) {
  const w = $('cfMccCboxes'); w.innerHTML = '';
  MCC_GROUPS.forEach(g => {
    w.innerHTML += `<label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:3px 8px;border:1px solid var(--line);border-radius:10px;cursor:pointer;background:var(--paper)">
      <input type="checkbox" value="${g.id}" ${selected.includes(g.id) ? 'checked' : ''} style="accent-color:var(--ink);width:13px;height:13px"/>
      ${g.ico} ${g.label}</label>`;
  });
}

function editCat(id) {
  const c = state.categories.find(x => x.id === id); if (!c) return;
  editingCatId = id; $('cfName').value = c.name; $('cfColor').value = c.color;
  buildCfMccCboxes(c.mccGroups || []);
  $('catFormTitle').textContent = 'Edit category'; $('saveCatBtn').textContent = 'Update';
  $('cancelCatBtn').style.display = 'inline-flex';
}
async function deleteCat(id) {
  if (!confirm('Delete?')) return;
  state.categories = state.categories.filter(c => c.id !== id);
  await persist(); renderCatTab(); populateStaticSelects(); renderAll();
}
function closeCatForm() {
  editingCatId = null; $('cfName').value = ''; $('cfColor').value = '#4A708B';
  buildCfMccCboxes([]); $('catFormTitle').textContent = 'Add category';
  $('saveCatBtn').textContent = 'Add category'; $('cancelCatBtn').style.display = 'none'; $('catErr').textContent = '';
}

// Attach categories functions globally since they are called in dynamic HTML strings
window.editCat = editCat;
window.deleteCat = deleteCat;
window.editSubcat = editSubcat;
window.deleteSubcat = deleteSubcat;
window.addSubcat = addSubcat;
window.onSwatchChange = onSwatchChange;
window.saveSubcatEdit = saveSubcatEdit;

// ═══════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════
const TAB_IDS = ['ledger', 'cards', 'merchants', 'categories', 'settings'];
function switchTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + id));
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', TAB_IDS[i] === id));
  if (id === 'cards') renderCardsTab();
  if (id === 'categories') renderCatTab();
  if (id === 'merchants') {
    renderMerchantDb();
    const ms = $('merchantSearch');
    if (ms && !ms._bound) { ms.addEventListener('input', renderMerchantDb); ms._bound = true; }
  }
  if (id === 'settings') renderSettings();
}

// ═══════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════
function renderSettings() {
  $('gClientId').value = state.settings.googleClientId || '';
  $('sharedSheetId').value = state.settings.sharedSheetId || '';
  $('currencyInput').value = state.settings.currency || '₹';
  $('syncDays').value = state.settings.syncDays || 14;
  $('tgBotToken').value = state.settings.telegramBotToken || '';
  $('tgChatId').value = state.settings.telegramChatId || '';
  updateGmailUI();
}

function updateGmailUI() {
  const connected = !!googleToken;
  $('gmailStatus').innerHTML = connected ? '<div class="gmail-ok">✓ Connected to Google — ready to sync</div>' : '';
  $('connectGmailBtn').style.display = connected ? 'none' : 'inline-flex';
  $('syncGmailBtn').style.display = connected ? 'inline-flex' : 'none';
  $('disconnectBtn').style.display = connected ? 'inline-flex' : 'none';
  updateInlineGmailStatus();
}

function updateInlineGmailStatus() {
  const connected = !!googleToken;
  const statusEl = $('webGmailStatusText');
  const syncBtnInline = $('syncGmailBtnInline');
  if (statusEl) {
    statusEl.innerHTML = connected ? 
      '<span style="color:var(--green)">✓ Connected to Google — ready to sync</span>' : 
      '<span style="color:var(--red)">Disconnected — go to Settings to connect your account</span>';
  }
  if (syncBtnInline) {
    syncBtnInline.style.display = connected ? 'inline-block' : 'none';
  }
}

function connectGmail() {
  const cid = $('gClientId').value.trim();
  if (!cid) { alert('Paste your Client ID first.'); return; }
  state.settings.googleClientId = cid; persist();
  const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.file');
  const redirect = encodeURIComponent(location.href.split('#')[0].split('?')[0]);
  location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(cid)}&redirect_uri=${redirect}&response_type=token&scope=${scope}&prompt=select_account`;
}

function disconnectGoogle() { 
  googleToken = null; 
  localStorage.removeItem('googleToken');
  localStorage.removeItem('googleTokenTime');
  updateGmailUI(); 
  toast('Disconnected'); 
}

async function syncSharedMerchantDb() {
  const sheetId = state.settings.sharedSheetId;
  if (!sheetId || !googleToken) return;
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:C`, {
      headers: { Authorization: `Bearer ${googleToken}` }
    });
    if (!res.ok) {
      if (res.status === 401) { googleToken = null; updateGmailUI(); toast('Session expired — reconnect'); }
      return;
    }
    const data = await res.json();
    if (data.values && data.values.length > 0) {
      const rows = data.values.slice(1); // skip headers
      const fetchedDb = {};
      rows.forEach(r => {
        const name = r[0]?.toLowerCase().trim();
        const mcc = r[1]?.trim();
        const mccCode = r[2]?.trim() || null;
        if (name && mcc) {
          fetchedDb[name] = { mcc, mccCode, custom: true };
        }
      });
      state.merchantDb = { ...state.merchantDb, ...fetchedDb };
      await persist();
      renderMerchantDb();
      toast('Shared merchant database synced ✓');
    }
  } catch (e) {
    console.error('Shared Merchant DB Sync failed:', e);
  }
}

async function writeMerchantToSheet(name, mcc, mccCode) {
  const sheetId = state.settings.sharedSheetId;
  if (!sheetId || !googleToken) return;
  try {
    const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:C`, {
      headers: { Authorization: `Bearer ${googleToken}` }
    });
    if (!checkRes.ok) return;
    const checkData = await checkRes.json();
    let values = checkData.values || [];
    const key = name.toLowerCase().trim();
    
    if (values.length === 0) {
      const headers = ['Merchant Name', 'MCC Group', 'MCC Code'];
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:C:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [headers] })
      });
      values = [headers];
    }
    
    // Check if row already exists
    const matchedIdx = values.findIndex(r => r[0]?.toLowerCase().trim() === key);
    const row = [name, mcc, mccCode || ''];
    
    if (matchedIdx >= 0) {
      // Merchant already exists! Do NOT overwrite or edit existing rows to protect database integrity.
      return;
    } else {
      // Append only if it is a new merchant entry
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:C:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      });
    }
  } catch (e) {
    console.error('Failed writing merchant to Google Sheet:', e);
  }
}

function handleOAuthCallback() {
  const params = new URLSearchParams(location.hash.substring(1));
  const token = params.get('access_token'); if (!token) return false;
  googleToken = token;
  localStorage.setItem('googleToken', token);
  localStorage.setItem('googleTokenTime', String(Date.now()));
  history.replaceState(null, null, location.pathname + location.search);
  return true;
}

function saveCurrency() { state.settings.currency = $('currencyInput').value.trim() || '₹'; persist(); renderAll(); toast('Saved'); }

// ═══════════════════════════════════════════════
// TELEGRAM WORKAROUND INTEGRATION
// ═══════════════════════════════════════════════
let pendingTelegramTransactions = [];

async function syncTelegram(simulate = false) {
  const token = state.settings.telegramBotToken || '';
  if (!token && !simulate) {
    toast('Please configure Telegram Bot Token in Settings first!');
    switchTab('settings');
    return;
  }

  $('tgSyncingIndicator').style.display = 'flex';
  $('tgAlertsList').style.display = 'none';
  $('tgAlertsContainer').innerHTML = '';
  pendingTelegramTransactions = [];

  if (simulate) {
    setTimeout(() => {
      const mockAlerts = [
        { update_id: 10001, message: { text: "Alert: your a/c **4321 is debited by Rs.1250.00 at AMAZON on 06-Jul-26 via UPI." } },
        { update_id: 10002, message: { text: "HDFC Bank: Rs.3400.00 spent on Card ending **8899 at SWIGGY on 05-Jul-26." } }
      ];
      processTelegramUpdates(mockAlerts);
    }, 800);
    return;
  }

  try {
    let offset = localStorage.getItem('tg_offset') || '0';
    let url = `https://api.telegram.org/bot${token}/getUpdates?timeout=10`;
    if (parseInt(offset) > 0) {
      url += `&offset=${offset}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to connect to Telegram API');
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || 'Error fetching telegram messages');
    
    const updates = (data.result || []).filter(u => u.message && u.message.text);
    processTelegramUpdates(updates);
  } catch (err) {
    console.error(err);
    toast(`Telegram error: ${err.message}`);
    $('tgSyncingIndicator').style.display = 'none';
  }
}

function processTelegramUpdates(updates) {
  $('tgSyncingIndicator').style.display = 'none';
  
  if (updates.length > 0) {
    const highestId = Math.max(...updates.map(u => u.update_id));
    localStorage.setItem('tg_offset', String(highestId + 1));
  }
  
  let processedIds = JSON.parse(localStorage.getItem('processedTgUpdates') || '[]');
  
  const parsed = [];
  updates.forEach(u => {
    if (processedIds.includes(u.update_id)) return;
    
    const txt = u.message.text;
    const p = parseExpenseText(txt);
    if (p.amount) {
      parsed.push({
        update_id: u.update_id,
        body: txt,
        amount: p.amount,
        vendor: p.vendor || 'Merchant',
        date: p.date || today(),
        mode: p.mode || 'upi',
        last4: p.last4,
        raw: p
      });
    }
  });

  if (parsed.length === 0) {
    toast('No new transaction updates found in Telegram Bot!');
    return;
  }

  pendingTelegramTransactions = parsed;
  renderTelegramAlerts();
}

function renderTelegramAlerts() {
  const container = $('tgAlertsContainer');
  container.innerHTML = '';
  
  if (pendingTelegramTransactions.length === 0) {
    $('tgAlertsList').style.display = 'none';
    return;
  }

  $('tgAlertsList').style.display = 'flex';

  pendingTelegramTransactions.forEach(tx => {
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.background = 'var(--card)';
    el.style.border = '1px solid var(--line)';
    el.style.padding = '12px 14px';
    el.style.borderRadius = '14px';
    el.style.gap = '6px';
    el.style.width = '100%';
    el.style.boxSizing = 'border-box';

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';
    
    const amtWrap = document.createElement('div');
    amtWrap.style.display = 'flex';
    amtWrap.style.alignItems = 'center';
    amtWrap.style.color = 'var(--ink)';
    amtWrap.textContent = '₹';
    
    const amtInput = document.createElement('input');
    amtInput.type = 'number';
    amtInput.step = '0.01';
    amtInput.value = tx.amount;
    amtInput.style.fontSize = '14px';
    amtInput.style.fontWeight = '800';
    amtInput.style.color = 'var(--ink)';
    amtInput.style.border = 'none';
    amtInput.style.background = 'none';
    amtInput.style.width = '65px';
    amtInput.style.borderBottom = '1px dashed var(--line)';
    amtInput.style.outline = 'none';
    amtInput.onchange = (e) => { tx.amount = parseFloat(e.target.value) || tx.amount; };
    amtWrap.appendChild(amtInput);
    
    const importBtn = document.createElement('button');
    importBtn.className = 'btn sm';
    importBtn.style.padding = '4px 10px';
    importBtn.style.fontSize = '11px';
    importBtn.style.borderRadius = '50px';
    importBtn.style.background = 'var(--green)';
    importBtn.style.border = 'none';
    importBtn.style.color = '#FFF';
    importBtn.style.cursor = 'pointer';
    importBtn.textContent = 'Import';
    importBtn.onclick = () => saveTelegramTransaction(tx);

    topRow.appendChild(amtWrap);
    topRow.appendChild(importBtn);

    const midRow = document.createElement('div');
    midRow.style.display = 'flex';
    midRow.style.justifyContent = 'space-between';
    midRow.style.alignItems = 'center';

    const vendInput = document.createElement('input');
    vendInput.type = 'text';
    vendInput.value = tx.vendor;
    vendInput.style.fontSize = '12px';
    vendInput.style.fontWeight = '700';
    vendInput.style.color = 'var(--brass)';
    vendInput.style.border = 'none';
    vendInput.style.background = 'none';
    vendInput.style.padding = '0';
    vendInput.style.width = '120px';
    vendInput.style.borderBottom = '1px dashed var(--line)';
    vendInput.style.outline = 'none';
    vendInput.onchange = (e) => { tx.vendor = e.target.value; };

    const modeText = document.createElement('span');
    modeText.style.fontSize = '11px';
    modeText.style.color = 'var(--ink-soft)';
    modeText.style.fontWeight = '700';
    modeText.textContent = `${tx.mode.toUpperCase()} ${tx.last4 ? `(**${tx.last4})` : ''}`;

    midRow.appendChild(vendInput);
    midRow.appendChild(modeText);

    // Extra row for Date & Category
    const metaRow = document.createElement('div');
    metaRow.style.display = 'flex';
    metaRow.style.justifyContent = 'space-between';
    metaRow.style.alignItems = 'center';
    metaRow.style.marginTop = '4px';

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = tx.date || today();
    dateInput.style.fontSize = '11px';
    dateInput.style.color = 'var(--ink-soft)';
    dateInput.style.border = 'none';
    dateInput.style.background = 'none';
    dateInput.style.width = '110px';
    dateInput.style.borderBottom = '1px dashed var(--line)';
    dateInput.style.outline = 'none';
    dateInput.onchange = (e) => { tx.date = e.target.value || tx.date; };

    const catSelect = document.createElement('select');
    catSelect.style.fontSize = '11px';
    catSelect.style.color = 'var(--brass)';
    catSelect.style.border = 'none';
    catSelect.style.background = 'none';
    catSelect.style.outline = 'none';
    catSelect.style.borderBottom = '1px dashed var(--line)';
    catSelect.style.cursor = 'pointer';
    state.categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      if (c.id === tx.category) opt.selected = true;
      catSelect.appendChild(opt);
    });
    catSelect.onchange = (e) => { tx.category = e.target.value; };

    metaRow.appendChild(dateInput);
    metaRow.appendChild(catSelect);
    el.appendChild(metaRow);

    const bottomText = document.createElement('div');
    bottomText.style.fontSize = '10.5px';
    bottomText.style.color = 'var(--ink-soft)';
    bottomText.style.fontStyle = 'italic';
    bottomText.style.lineHeight = '1.4';
    bottomText.style.borderTop = '1px solid var(--line)';
    bottomText.style.paddingTop = '6px';
    bottomText.style.marginTop = '4px';
    bottomText.textContent = `"${tx.body}"`;

    el.appendChild(topRow);
    el.appendChild(midRow);
    el.appendChild(bottomText);

    container.appendChild(el);
  });
}

async function saveTelegramTransaction(tx) {
  let finalMode = tx.mode || 'upi';
  let finalInstr = '';
  
  if (tx.last4) {
    const matchedCard = state.cards.find(c => c.last4 === tx.last4);
    if (matchedCard) {
      finalInstr = matchedCard.id;
      finalMode = matchedCard.type === 'Credit' ? 'credit' : 'debit';
    } else {
      const matchedUpi = state.upiAccounts.find(u => u.upiId.includes(tx.last4) || u.name.includes(tx.last4));
      if (matchedUpi) { finalInstr = matchedUpi.id; finalMode = 'upi'; }
    }
  }

  let finalCategory = state.categories[0]?.id || 'food';
  const mData = lookupMerchantData(tx.vendor);
  let finalMcc = 'other';
  let finalMccCode = '';
  if (mData) {
    finalMcc = mData.mcc;
    finalMccCode = mData.mccCode || '';
    const matchedCat = state.categories.find(c => c.mccGroups?.includes(mData.mcc));
    if (matchedCat) finalCategory = matchedCat.id;
  }

  const newEntry = {
    id: uid(),
    amount: parseFloat(tx.amount),
    vendor: tx.vendor || 'Unknown Merchant',
    date: tx.date || today(),
    category: finalCategory,
    subcat: '',
    paymentMode: finalMode,
    instrumentId: finalInstr,
    upiBank: finalMode === 'upi' ? 'Other' : null,
    mccGroup: finalMcc,
    mccCode: finalMccCode,
    note: `Imported via Telegram Bot Syncer`,
    time: new Date().toTimeString().slice(0, 5),
    cbAmt: null
  };

  state.entries.unshift(newEntry);
  
  let processedIds = JSON.parse(localStorage.getItem('processedTgUpdates') || '[]');
  processedIds.push(tx.update_id);
  localStorage.setItem('processedTgUpdates', JSON.stringify(processedIds));

  pendingTelegramTransactions = pendingTelegramTransactions.filter(t => t.update_id !== tx.update_id);
  
  await persist();
  renderAll();
  renderTelegramAlerts();
  toast(`Saved ₹${tx.amount} to ledger!`);
}

function showImportModal(items) {
  importQueue = items;
  const body = $('importBody'); body.innerHTML = '';
  items.forEach((e, i) => {
    const g = MCC_BY_ID[e.mccGroup];
    body.innerHTML += `<div class="import-item" style="display:flex; align-items:center; gap:12px; border-bottom:1px solid var(--line); padding:10px 0">
      <input type="checkbox" class="import-check" data-i="${i}" ${e._dupe ? '' : 'checked'} style="margin:0"/>
      <div class="import-details" style="flex:1; display:flex; flex-direction:column; gap:4px">
        <div style="display:flex; align-items:center; gap:8px">
          <input type="text" class="import-edit-vendor" data-i="${i}" value="${esc(e.vendor)}" style="background:none; border:none; border-bottom:1px dashed var(--line); color:var(--ink); font-weight:800; font-size:13px; font-family:var(--sans); width:130px; outline:none"/>
          <span style="font-size:10px; color:var(--ink-soft)">${g?.ico || ''} ${g?.label || e.mccGroup}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px">
          <input type="date" class="import-edit-date" data-i="${i}" value="${e.date}" style="background:none; border:none; border-bottom:1px dashed var(--line); color:var(--ink-soft); font-size:11px; font-family:var(--sans); width:110px; outline:none"/>
          <select class="import-edit-cat" data-i="${i}" style="background:none; border:none; border-bottom:1px dashed var(--line); color:var(--brass); font-size:11px; font-family:var(--sans); outline:none; cursor:pointer">
            ${state.categories.map(c => `<option value="${c.id}" ${c.id === e.category ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select>
        </div>
        ${e._dupe ? '<div class="import-warn" style="font-size:10px; color:var(--red); font-weight:700">⚠ Possible duplicate</div>' : ''}
      </div>
      <div class="import-amt" style="display:flex; align-items:center; color:var(--red); font-weight:800">
        -₹<input type="number" step="0.01" class="import-edit-amount" data-i="${i}" value="${e.amount}" style="background:none; border:none; border-bottom:1px dashed var(--line); color:var(--red); font-weight:800; font-size:14px; font-family:var(--sans); width:65px; text-align:right; outline:none; margin-left:2px"/>
      </div>
    </div>`;
  });
  $('importCount').textContent = `${items.filter(e => !e._dupe).length} of ${items.length} selected`;
  $('importModal').classList.add('open');
  $('importModal').querySelectorAll('.import-check').forEach(cb => cb.onchange = () => {
    $('importCount').textContent = `${$('importModal').querySelectorAll('.import-check:checked').length} of ${items.length} selected`;
  });
}
function closeImportModal() { $('importModal').classList.remove('open'); importQueue = []; }

async function confirmImport() {
  const toImport = [];
  document.querySelectorAll('.import-check:checked').forEach(cb => {
    const idx = parseInt(cb.dataset.i);
    const item = importQueue[idx];
    if (item) {
      const row = cb.closest('.import-item');
      const editedVendor = row.querySelector('.import-edit-vendor').value.trim();
      const editedAmount = parseFloat(row.querySelector('.import-edit-amount').value);
      const editedDate = row.querySelector('.import-edit-date').value;
      const editedCat = row.querySelector('.import-edit-cat').value;

      item.vendor = editedVendor || item.vendor;
      item.amount = isNaN(editedAmount) ? item.amount : editedAmount;
      item.date = editedDate || item.date;
      item.category = editedCat || item.category;

      toImport.push(item);
    }
  });
  if (!toImport.length) { toast('Nothing selected'); return; }
  toImport.forEach(e => state.entries.push({ id: e.id, date: e.date, time: e.time || '00:00', source: e.source || 'email', vendor: e.vendor, amount: e.amount, category: e.category, mccGroup: e.mccGroup, mccCode: e.mccCode || null, paymentMode: e.paymentMode, cardId: e.cardId, upiAccountId: e.upiAccountId, upiBank: e.upiBank || null }));
  await persist(); closeImportModal(); renderAll(); switchTab('ledger');
  toast(`${toImport.length} transaction${toImport.length > 1 ? 's' : ''} imported`);
}

// ═══════════════════════════════════════════════
// GMAIL INTEGRATION
// ═══════════════════════════════════════════════
async function syncGmail() {
  if (!googleToken) { toast('Connect Gmail first in Settings'); return; }
  const btn = $('syncGmailBtn');
  const btnInline = $('syncGmailBtnInline');
  if (btn) { btn.textContent = 'Syncing…'; btn.disabled = true; }
  if (btnInline) { btnInline.textContent = 'Syncing…'; btnInline.disabled = true; }
  try {
    await syncSharedMerchantDb();
    const days = state.settings.syncDays || 14;
    const q = encodeURIComponent(`(debited OR spent OR payment OR paid OR transaction) newer_than:${days}d`);
    const res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=40`, { headers: { Authorization: `Bearer ${googleToken}` } });
    if (res.status === 401) { googleToken = null; updateGmailUI(); toast('Session expired — reconnect'); return; }
    const data = await res.json();
    if (!data.messages?.length) { toast('No transaction emails found'); return; }
    const parsed = [];
    for (const msg of data.messages.slice(0, 30)) {
      const mr = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, { headers: { Authorization: `Bearer ${googleToken}` } });
      const md = await mr.json();
      const body = extractEmailBody(md);
      const p = parseExpenseText(body); if (!p.amount) continue;
      const mcc = lookupMerchantMcc(p.vendor || '') || 'other';
      const cat = state.categories.find(c => c.mccGroups?.includes(mcc)) || state.categories[state.categories.length - 1];
      
      let matchedCardId = null;
      let matchedUpiId = null;
      let detectedMode = p.mode || 'upi';
      
      if (p.last4) {
        const matchedCard = state.cards.find(c => c.last4 === p.last4);
        if (matchedCard) {
          matchedCardId = matchedCard.id;
          detectedMode = matchedCard.type === 'Credit' ? 'credit' : 'debit';
        } else {
          const matchedUpi = state.upiAccounts.find(u => u.upiId?.includes(p.last4) || u.name?.includes(p.last4));
          if (matchedUpi) {
            matchedUpiId = matchedUpi.id;
            detectedMode = 'upi';
          }
        }
      }
      
      const dupe = state.entries.find(e => e.amount === p.amount && e.date === (p.date || today()) && (!p.vendor || e.vendor.toLowerCase() === p.vendor?.toLowerCase()));
      parsed.push({ 
        id: uid(), 
        date: p.date || today(), 
        time: p.time || '00:00', 
        source: 'email', 
        vendor: p.vendor || 'Unknown', 
        amount: p.amount, 
        category: cat.id, 
        mccGroup: mcc, 
        mccCode: null, 
        paymentMode: detectedMode, 
        cardId: matchedCardId, 
        upiAccountId: matchedUpiId, 
        upiBank: detectedMode === 'upi' ? p.bank || null : null,
        _dupe: !!dupe 
      });
    }
    if (!parsed.length) { toast('No parseable transactions found'); return; }
    showImportModal(parsed);
  } catch (e) { toast('Sync error'); console.error(e); }
  finally { 
    const btn = $('syncGmailBtn');
    const btnInline = $('syncGmailBtnInline');
    if (btn) { btn.textContent = 'Sync now'; btn.disabled = false; }
    if (btnInline) { btnInline.textContent = 'Sync Gmail now'; btnInline.disabled = false; }
  }
}

function extractEmailBody(msg) {
  function dec(s) { try { return atob(s.replace(/-/g, '+').replace(/_/g, '/')); } catch { return ''; } }
  function walk(part) { if (!part) return ''; if (part.parts) return part.parts.map(walk).join(' '); if (part.body?.data) return dec(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); return ''; }
  const subj = (msg.payload?.headers || []).find(h => h.name === 'Subject')?.value || '';
  return subj + ' ' + walk(msg.payload);
}

// ═══════════════════════════════════════════════
// IMPORT POPUP
// ═══════════════════════════════════════════════
function showImportModal(items) {
  importQueue = items;
  const body = $('importBody'); body.innerHTML = '';
  items.forEach((e, i) => {
    const g = MCC_BY_ID[e.mccGroup]; const cat = catById(e.category);
    body.innerHTML += `<div class="import-item">
      <input type="checkbox" class="import-check" data-i="${i}" ${e._dupe ? '' : 'checked'}>
      <div class="import-details">
        <div class="import-vendor">${esc(e.vendor)}</div>
        <div class="import-meta">${fmtDate(e.date)} · ${g?.ico || ''} ${g?.label || e.mccGroup} · ${esc(cat?.name || e.category)}</div>
        ${e._dupe ? '<div class="import-warn">⚠ Possible duplicate</div>' : ''}
      </div>
      <div class="import-amt">-${fmt(e.amount)}</div>
    </div>`;
  });
  $('importCount').textContent = `${items.filter(e => !e._dupe).length} of ${items.length} selected`;
  $('importModal').classList.add('open');
  $('importModal').querySelectorAll('.import-check').forEach(cb => cb.onchange = () => {
    $('importCount').textContent = `${$('importModal').querySelectorAll('.import-check:checked').length} of ${items.length} selected`;
  });
}
function closeImportModal() { $('importModal').classList.remove('open'); importQueue = []; }

async function confirmImport() {
  const toImport = [];
  document.querySelectorAll('.import-check:checked').forEach(cb => { const item = importQueue[parseInt(cb.dataset.i)]; if (item) toImport.push(item); });
  if (!toImport.length) { toast('Nothing selected'); return; }
  toImport.forEach(e => state.entries.push({ id: e.id, date: e.date, time: e.time || '00:00', source: e.source || 'email', vendor: e.vendor, amount: e.amount, category: e.category, mccGroup: e.mccGroup, mccCode: e.mccCode || null, paymentMode: e.paymentMode, cardId: e.cardId, upiAccountId: e.upiAccountId, upiBank: e.upiBank || null }));
  await persist(); closeImportModal(); renderAll(); switchTab('ledger');
  toast(`${toImport.length} transaction${toImport.length > 1 ? 's' : ''} imported`);
}

// ═══════════════════════════════════════════════
// DATA EXPORT
// ═══════════════════════════════════════════════
async function exportToSheets() {
  if (!googleToken) { toast('Connect Gmail first — same account gives Sheets access'); return; }
  const headers = ['Date', 'Vendor', 'Category', 'MCC', 'Payment Mode', 'Instrument', 'Amount', 'Cashback'];
  const rows = state.entries.map(e => {
    const instr = instrLabel(e);
    return [e.date, e.vendor, catById(e.category)?.name || e.category, MCC_BY_ID[e.mccGroup || 'other']?.label || e.mccGroup, MODE_LABEL[e.paymentMode] || e.paymentMode || '', instr ? instr.name : '', e.amount, entryCashback(e)];
  });
  try {
    const cr = await fetch('https://sheets.googleapis.com/v4/spreadsheets', { method: 'POST', headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ properties: { title: `Ledger Export ${new Date().toLocaleDateString('en-IN')}` } }) });
    if (cr.status === 401) { googleToken = null; updateGmailUI(); toast('Session expired'); return; }
    const sheet = await cr.json(); const sid = sheet.spreadsheetId;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/A1:H${rows.length + 1}?valueInputOption=RAW`, { method: 'PUT', headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [headers, ...rows] }) });
    window.open(`https://docs.google.com/spreadsheets/d/${sid}`, '_blank'); toast('Exported ✓');
  } catch (e) { toast('Export failed'); console.error(e); }
}

function exportCsv() {
  const headers = ['Date', 'Vendor', 'Category', 'MCC', 'Payment Mode', 'Instrument', 'Amount', 'Cashback'];
  const rows = state.entries.map(e => { const il = instrLabel(e); return [e.date, e.vendor, catById(e.category)?.name || e.category, MCC_BY_ID[e.mccGroup || 'other']?.label || e.mccGroup, MODE_LABEL[e.paymentMode] || e.paymentMode || '', il ? il.name : '', e.amount, entryCashback(e)]; });
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `ledger-${today()}.csv`; a.click(); toast('CSV downloaded');
}

function clearAllData() {
  if (!confirm('Delete all entries, cards, UPI accounts and merchant mappings?')) return;
  state = { ...state, entries: [], cards: [], upiAccounts: JSON.parse(JSON.stringify(DEFAULT_UPI)), merchantDb: {}, categories: JSON.parse(JSON.stringify(DEFAULT_CATS)) };
  persist(); populateStaticSelects(); populateFSubcat($('fCat').value); buildInstrumentField(); renderAll(); renderCardsTab(); renderMerchantDb();
  toast('All data cleared');
}

// ═══════════════════════════════════════════════
// EVENT BINDINGS
// ═══════════════════════════════════════════════
function bindEvents() {
  // Theme toggle
  $('themeToggleBtn').addEventListener('click', toggleTheme);
  $('topSettingsBtn').addEventListener('click', () => { initHistYearSel(); switchTab('settings'); });
  $('settingsBackBtn').addEventListener('click', () => switchTab('ledger'));

  // Account profile modal
  const acctModal = $('accountModal');
  if (acctModal) {
    // Load saved profile
    const saved = JSON.parse(localStorage.getItem('ledger_profile') || '{}');
    if (saved.name) $('acctName').value = saved.name;
    if (saved.email) $('acctEmail').value = saved.email;
    if (saved.phone) $('acctPhone').value = saved.phone;

    $('openAccountBtn').addEventListener('click', () => {
      acctModal.classList.add('active');
    });
    $('closeAccountModalBtn').addEventListener('click', () => {
      acctModal.classList.remove('active');
    });
    acctModal.addEventListener('click', (e) => {
      if (e.target === acctModal) acctModal.classList.remove('active');
    });
    $('saveAccountBtn').addEventListener('click', () => {
      const profile = {
        name: $('acctName').value.trim(),
        email: $('acctEmail').value.trim(),
        phone: $('acctPhone').value.trim()
      };
      localStorage.setItem('ledger_profile', JSON.stringify(profile));
      acctModal.classList.remove('active');
      toast('Profile saved');
    });
  }

  // Calendar / Past records modal
  const histBtn = $('openHistoryBtn');
  const histModal = $('historyModal');
  if (histBtn && histModal) {
    histBtn.addEventListener('click', () => {
      initHistYearSel();
      histModal.classList.add('active');
    });
    $('closeHistoryModalBtn').addEventListener('click', () => {
      histModal.classList.remove('active');
    });
    histModal.addEventListener('click', (e) => {
      if (e.target === histModal) histModal.classList.remove('active');
    });
  }

  // Sync section collapsible toggle
  const syncToggle = $('syncSectionToggle');
  if (syncToggle) {
    syncToggle.addEventListener('click', () => {
      const body = $('syncSectionBody');
      const chevron = $('syncChevron');
      if (body.style.display === 'none') {
        body.style.display = 'block';
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      } else {
        body.style.display = 'none';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      }
    });
  }

  // Telegram Setup instructions OS toggle (iOS vs Android)
  const tgSetupOsSeg = $('tgSetupOsSeg');
  if (tgSetupOsSeg) {
    const iosBtn = tgSetupOsSeg.querySelector('button[data-os="ios"]');
    const androidBtn = tgSetupOsSeg.querySelector('button[data-os="android"]');
    const iosContent = $('tgSetupIos');
    const androidContent = $('tgSetupAndroid');
    if (iosBtn && androidBtn && iosContent && androidContent) {
      iosBtn.addEventListener('click', () => {
        iosBtn.classList.add('on');
        androidBtn.classList.remove('on');
        iosContent.style.display = 'block';
        androidContent.style.display = 'none';
      });
      androidBtn.addEventListener('click', () => {
        androidBtn.classList.add('on');
        iosBtn.classList.remove('on');
        iosContent.style.display = 'none';
        androidContent.style.display = 'block';
      });
    }
  }

  // Nexora add transaction scroll
  $('nexoraAddBtn').addEventListener('click', () => {
    $('fAmt').focus();
    $('fAmt').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Quick pay contacts listeners
  document.querySelectorAll('.quick-contact-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const payee = btn.dataset.payee;
      const upi = btn.dataset.upi;
      $('fVendor').value = payee;
      $('fMode').value = 'upi';
      buildInstrumentField();
      
      $('fAmt').focus();
      $('fAmt').scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(`Selected payee: ${payee} (${upi})`);
    });
  });

  const payLink = $('quickPayManageLink');
  if (payLink) {
    payLink.addEventListener('click', () => switchTab('cards'));
  }

  // Month navigator on Spent pill
  $('monthPrevBtn').addEventListener('click', () => shiftViewMonth(-1));
  $('monthNextBtn').addEventListener('click', () => shiftViewMonth(+1));

  // Cashback ⇌ Points toggle
  $('rewardToggleBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleRewardView(); });
  $('cashbackPill').addEventListener('click', toggleRewardView);

  // Past data viewer
  $('loadHistBtn').addEventListener('click', loadHistData);

  // Manual / Paste segment control
  document.querySelectorAll('#entryModeSeg button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#entryModeSeg button').forEach(x => x.classList.toggle('on', x === b));
    const mode = b.dataset.mode;
    $('pasteBox').style.display = mode === 'paste' ? 'block' : 'none';
    $('syncBox').style.display = mode === 'sync' ? 'block' : 'none';
    $('telegramBox').style.display = mode === 'telegram' ? 'block' : 'none';
    if (mode === 'sync') {
      updateInlineGmailStatus();
    }
  }));

  // Inline Sync Gmail Button
  $('syncGmailBtnInline').addEventListener('click', syncGmail);
  
  // Telegram Syncer
  $('syncTelegramBtnInline').addEventListener('click', () => syncTelegram(false));
  $('simulateTelegramBtnInline').addEventListener('click', () => syncTelegram(true));

  // Detect expense details from pasted SMS
  $('detectBtn').addEventListener('click', () => {
    const txt = $('pasteText').value.trim(); if (!txt) return;
    const p = parseExpenseText(txt);
    if (p.amount) $('fAmt').value = p.amount;
    if (p.vendor) { $('fVendor').value = p.vendor; onVendorInput(); }
    if (p.date) $('fDate').value = p.date;
    pendingSource = 'paste';
    pendingTime = p.time || nowTime();
    const modeMap = { 'upi': 'upi', 'credit card': 'credit', 'debit card': 'debit', 'net banking': 'netbanking', 'cash': 'cash' };
    if (p.mode) $('fMode').value = modeMap[p.mode.toLowerCase()] || 'upi';
    let keepId = '';
    if (p.last4) {
      const matched = state.cards.find(c => c.last4 === p.last4);
      if (matched) { keepId = matched.id; if (matched.type === 'Credit') $('fMode').value = 'credit'; else $('fMode').value = 'debit'; }
    }
    buildInstrumentField(keepId);
    
    // Auto-select bank if mode is UPI and a bank was detected
    if ($('fMode').value === 'upi' && p.bank) {
      const bEl = $('fUpiBank');
      if (bEl) {
        const standardBanks = ['HDFC', 'ICICI', 'SBI', 'Axis', 'AMEX', 'RuPay'];
        if (standardBanks.includes(p.bank)) {
          bEl.value = p.bank;
          $('fUpiBankCustom').style.display = 'none';
          $('fUpiBankCustom').value = '';
        } else {
          bEl.value = 'Other';
          $('fUpiBankCustom').value = p.bank;
          $('fUpiBankCustom').style.display = 'block';
        }
      }
    }
    
    $('detBadge').style.display = 'inline';
    $('parseHint').textContent = p.amount ? 'Detected — review and save.' : 'No amount found — fill in manually.';
  });

  // Save new entry
  $('saveEntryBtn').addEventListener('click', async () => {
    const amount = parseFloat($('fAmt').value);
    const vendor = $('fVendor').value.trim();
    const err = $('entryErr');
    if (!amount || amount <= 0) { err.textContent = 'Enter a valid amount.'; return; }
    if (!vendor) { err.textContent = 'Add a vendor or note.'; return; }
    err.textContent = '';
    const mode = $('fMode').value;
    const instrVal = getInstrumentValue();
    const isCard = mode === 'credit' || mode === 'debit';
    const mData = lookupMerchantData(vendor);
    
    let upiBank = null;
    if (mode === 'upi') {
      const ub = $('fUpiBank')?.value;
      if (ub) {
        upiBank = ub === 'Other' ? ($('fUpiBankCustom').value.trim() || 'Other') : ub;
      }
    }
    
    const entry = {
      id: uid(), date: $('fDate').value || today(),
      time: pendingTime || nowTime(),
      source: pendingSource,
      vendor, amount, category: $('fCat').value,
      subCatId: $('fSubcat').value || null,
      mccGroup: currentMccGroup || 'other',
      mccCode: mData?.mccCode || null,
      paymentMode: mode,
      cardId: isCard ? instrVal || null : null,
      upiAccountId: mode === 'upi' ? instrVal || null : null,
      upiBank: mode === 'upi' ? upiBank || null : null,
      instrLabel: mode === 'netbanking' ? instrVal || '' : null,
    };
    state.entries.push(entry);
    await persist();
    
    // reset form
    $('fAmt').value = ''; $('fVendor').value = ''; $('fDate').value = today();
    $('fSubcat').value = ''; $('fSubcatWrap').style.display = 'none';
    $('fSubcatAddWrap').style.display = 'none'; $('fSubcatNewName').value = '';
    pendingSource = 'manual'; pendingTime = null;
    $('detBadge').style.display = 'none'; $('pasteText').value = ''; $('cbPre').style.display = 'none';
    $('merchantAssign').style.display = 'none';
    currentMccGroup = null; currentVendorKey = '';
    $('mccChipWrap').style.display = 'none'; $('mccOverride').style.display = 'none';
    document.querySelectorAll('#entryModeSeg button').forEach((b, i) => b.classList.toggle('on', i === 0));
    $('pasteBox').style.display = 'none';
    $('syncBox').style.display = 'none';
    buildInstrumentField();
    renderAll(); toast('Entry saved');
  });

  // Inline inputs listeners
  $('fAmt').addEventListener('input', updateCashbackPreview);
  $('fCat').addEventListener('change', () => { populateFSubcat($('fCat').value); updateCashbackPreview(); });
  $('fDate').addEventListener('change', updateCashbackPreview);
  $('fMode').addEventListener('change', () => buildInstrumentField());
  $('fVendor').addEventListener('input', onVendorInput);

  // Subcategory trigger
  $('fSubcat').addEventListener('change', () => {
    if ($('fSubcat').value === '__add__') {
      $('fSubcat').value = '';
      $('fSubcatAddWrap').style.display = 'block';
      $('fSubcatNewName').focus();
    }
  });
  $('saveSubcatBtn').addEventListener('click', addSubcatFromEntry);
  $('cancelSubcatBtn').addEventListener('click', cancelSubcatAdd);
  $('fSubcatNewName').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSubcatFromEntry(); } });

  // MCC Override
  $('mccChipInner').addEventListener('click', overrideMcc);

  // Merchant Assign Form
  $('maSaveBtn').addEventListener('click', async () => {
    const mcc = $('maMccSelect').value;
    const mccCode = $('maMccCode').value.trim();
    if (!mcc || !currentVendorKey) return;
    if (mccCode && !/^\d{4}$/.test(mccCode)) { toast('MCC code must be 4 digits'); return; }
    state.merchantDb[currentVendorKey] = { mcc, mccCode: mccCode || null, custom: true };
    await persist();
    await writeMerchantToSheet(currentVendorKey, mcc, mccCode);
    setMccGroup(mcc);
    const cat = state.categories.find(c => c.mccGroups?.includes(mcc));
    if (cat) { $('fCat').value = cat.id; populateFSubcat(cat.id); }
    $('merchantAssign').style.display = 'none';
    $('maMccCode').value = '';
    toast(`Saved "${$('fVendor').value.trim()}"${mccCode ? ' · MCC ' + mccCode : ''}`);
    renderMerchantDb();
  });
  $('maDismissBtn').addEventListener('click', () => { $('merchantAssign').style.display = 'none'; });

  // Filters inputs
  $('searchQ').addEventListener('input', renderAll);
  $('catFilter').addEventListener('change', renderAll);
  $('monthFilter').addEventListener('change', () => {
    $('cbEye').textContent = 'Cashback — ' + ($('monthFilter').value || 'all time');
    renderAll();
  });

  // Instruments Tab – UPI
  $('addUpiBtn').addEventListener('click', () => openUpiEditor(null));
  $('cancelUpiBtn').addEventListener('click', closeUpiEditor);
  $('saveUpiBtn').addEventListener('click', async () => {
    const name = $('uName').value.trim();
    if (!name) { $('upiErr').textContent = 'Enter a name.'; return; }
    $('upiErr').textContent = '';
    const data = { name, upiId: $('uId').value.trim() };
    if (editingUpiId) {
      const idx = state.upiAccounts.findIndex(u => u.id === editingUpiId);
      if (idx >= 0) state.upiAccounts[idx] = { ...state.upiAccounts[idx], ...data };
    } else {
      state.upiAccounts.push({ id: uid(), ...data });
    }
    await persist(); closeUpiEditor(); renderUpiList(); buildInstrumentField();
    toast(editingUpiId ? 'UPI account updated' : 'UPI account saved');
  });

  // Instruments Tab – Cards (separate Credit / Debit add buttons)
  $('addCreditCardBtn').addEventListener('click', () => { openCardEditor(null); setCardType('Credit'); });
  $('addDebitCardBtn').addEventListener('click',  () => { openCardEditor(null); setCardType('Debit');  });
  $('cancelCardEditorBtn').addEventListener('click', closeCardEditor);

  // Auto-Parse Terms Section
  $('toggleTermsTextBtn').addEventListener('click', () => {
    const box = $('cTermsTextBox');
    const isHidden = box.style.display === 'none';
    box.style.display = isHidden ? 'flex' : 'none';
    $('toggleTermsTextBtn').textContent = isHidden ? 'Hide Paste Area' : 'Paste Text Instead';
  });

  $('parseTermsTextBtn').addEventListener('click', () => {
    const text = $('cTermsText').value.trim();
    if (!text) { toast('Please paste terms and conditions text first.'); return; }
    parseTermsAndConditions(text);
  });

  $('cTermsFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast('Only PDF files are supported.'); return; }
    
    toast('Parsing PDF... please wait');
    const reader = new FileReader();
    reader.onload = async function() {
      const typedarray = new Uint8Array(this.result);
      try {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        if (!fullText.trim()) {
          toast('PDF text is empty or non-extractable. Try pasting text instead.');
          return;
        }
        
        parseTermsAndConditions(fullText);
      } catch (err) {
        console.error(err);
        toast('PDF loading error. Please try pasting text instead.');
      }
    };
    reader.readAsArrayBuffer(file);
  });

  $('cBank').addEventListener('change', () => {
    const isOther = $('cBank').value === 'Other';
    $('cBankCustom').style.display = isOther ? 'block' : 'none';
    if (isOther) $('cBankCustom').focus();
    renderTemplatesForBank($('cBank').value);
  });
  $('cRewardType').addEventListener('change', () => {
    const isPoints = $('cRewardType').value === 'Points';
    $('cPointValField').style.display = isPoints ? 'block' : 'none';
    $('cDefRateLabel').textContent = isPoints ? 'Default points per ₹100' : 'Default cashback %';
  });
  document.querySelectorAll('#cTypeSeg button').forEach(b => b.addEventListener('click', () => {
    cardType = b.dataset.type;
    document.querySelectorAll('#cTypeSeg button').forEach(x => x.classList.toggle('on', x === b));
  }));

  $('saveCardBtn').addEventListener('click', async () => {
    const name = $('cName').value.trim(); const last4 = $('cLast4').value.trim();
    const defRate = parseFloat($('cDefRate').value); const capRaw = $('cCap').value;
    const err = $('cardErr');
    if (!name) { err.textContent = 'Give the card a name.'; return; }
    if (isNaN(defRate) || defRate < 0) { err.textContent = 'Enter a valid default rate.'; return; }
    if (last4 && !/^\d{4}$/.test(last4)) { err.textContent = 'Last 4 digits must be 4 numbers.'; return; }
    
    const bankVal = $('cBank').value;
    const bank = bankVal === 'Other' ? ($('cBankCustom').value.trim() || 'Other') : bankVal;
    
    let cap = null;
    if (capRaw !== '') { cap = parseFloat(capRaw); if (isNaN(cap) || cap < 0) { err.textContent = 'Invalid cap.'; return; } }
    err.textContent = '';
    const { mccRates, excluded } = collectMccRates();
    const rewardType = $('cRewardType').value;
    const pointValue = parseFloat($('cPointVal').value) || 1.00;
    
    const minSpend = parseFloat($('cMinSpend').value) || 0;
    let statementDay = parseInt($('cStatementDay').value, 10) || 15;
    let dueDay = parseInt($('cDueDay').value, 10) || 5;
    if (statementDay < 1 || statementDay > 31) statementDay = 15;
    if (dueDay < 1 || dueDay > 31) dueDay = 5;

    const data = { bank, name, type: cardType, network: $('cNetwork').value, last4: last4 || null, defaultRate: defRate, cap, mccRates, excluded, rewardType, pointValue, minSpend, statementDay, dueDay };
    if (editingCardId) { const idx = state.cards.findIndex(c => c.id === editingCardId); if (idx >= 0) state.cards[idx] = { ...state.cards[idx], ...data }; }
    else state.cards.push({ id: uid(), ...data });
    await persist(); closeCardEditor(); renderCardsTab(); buildInstrumentField(); renderAll();
    toast(editingCardId ? 'Card updated' : 'Card saved');
  });

  // Merchants Tab
  $('detectMeBtn').addEventListener('click', detectMerchantFromPaste);
  $('cancelMeBtn').addEventListener('click', cancelMeEdit);
  $('saveMeBtn').addEventListener('click', async () => {
    const name = $('meName').value.trim().toLowerCase();
    const mcc = $('meMcc').value;
    const mccCode = $('meMccCode').value.trim();
    if (!name) { $('meErr').textContent = 'Enter a merchant name.'; return; }
    if (!mcc) { $('meErr').textContent = 'Select an MCC group.'; return; }
    if (mccCode && !/^\d{4}$/.test(mccCode)) { $('meErr').textContent = 'MCC code must be exactly 4 digits.'; return; }
    $('meErr').textContent = '';
    if (editingMeKey && editingMeKey !== name) delete state.merchantDb[editingMeKey];
    state.merchantDb[name] = { mcc, mccCode: mccCode || null, custom: true };
    await persist();
    await writeMerchantToSheet(name, mcc, mccCode);
    cancelMeEdit();
    $('mePasteInput').value = '';
    renderMerchantDb();
    toast(`"${name}" saved${mccCode ? ' · MCC ' + mccCode : ''}`);
  });

  // Categories Tab
  $('cancelCatBtn').addEventListener('click', closeCatForm);
  $('saveCatBtn').addEventListener('click', async () => {
    const name = $('cfName').value.trim();
    if (!name) { $('catErr').textContent = 'Enter a name.'; return; }
    $('catErr').textContent = '';
    const mccGroups = [...$('cfMccCboxes').querySelectorAll('input:checked')].map(i => i.value);
    if (editingCatId) { const idx = state.categories.findIndex(c => c.id === editingCatId); if (idx >= 0) state.categories[idx] = { ...state.categories[idx], name, color: $('cfColor').value, mccGroups }; }
    else state.categories.push({ id: uid(), name, color: $('cfColor').value, mccGroups, subcats: [], builtin: false });
    await persist(); closeCatForm(); renderCatTab(); populateStaticSelects(); renderAll();
    toast(editingCatId ? 'Category updated' : 'Category added');
    editingCatId = null;
  });

  // Settings Tab
  $('connectGmailBtn').addEventListener('click', connectGmail);
  $('syncGmailBtn').addEventListener('click', syncGmail);
  $('disconnectBtn').addEventListener('click', disconnectGoogle);
  $('exportSheetsBtn').addEventListener('click', exportToSheets);
  $('exportCsvBtn').addEventListener('click', exportCsv);
  $('saveCurrencyBtn').addEventListener('click', saveCurrency);
  $('syncDays').addEventListener('change', async () => { state.settings.syncDays = parseInt($('syncDays').value); await persist(); });
  
  $('sharedSheetId').addEventListener('change', async () => {
    state.settings.sharedSheetId = $('sharedSheetId').value.trim();
    await persist();
    await syncSharedMerchantDb();
  });
  
  $('tgBotToken').addEventListener('change', async () => {
    state.settings.telegramBotToken = $('tgBotToken').value.trim();
    await persist();
  });
  
  $('tgChatId').addEventListener('change', async () => {
    state.settings.telegramChatId = $('tgChatId').value.trim();
    await persist();
  });
  
  $('applyManualTokenBtn').addEventListener('click', () => {
    const token = $('manualTokenInput').value.trim();
    if (!token) { toast('Paste an Access Token first'); return; }
    googleToken = token;
    localStorage.setItem('googleToken', token);
    localStorage.setItem('googleTokenTime', String(Date.now()));
    $('manualTokenInput').value = '';
    updateGmailUI();
    toast('Access token applied ✓');
  });

  // Import Modal Dialog
  $('closeImportModalBtn').addEventListener('click', closeImportModal);
  $('cancelImportBtn').addEventListener('click', closeImportModal);
  $('confirmImportBtn').addEventListener('click', confirmImport);

  // Card Details Modal Dialog
  $('closeCardDetailsModalBtn').addEventListener('click', closeCardDetailsModal);
  $('cdCycleSelect').addEventListener('change', updateCardDetailsView);
  $('cdTogglePaidBtn').addEventListener('click', () => {
    if (!activeDetailCardId || !activeDetailCycle) return;
    const cycleKey = `${activeDetailCycle.year}-${String(activeDetailCycle.month).padStart(2, '0')}`;
    toggleStatementPaid(activeDetailCardId, cycleKey);
    updateCardDetailsView();
  });

  // Split Modal Dialog
  $('closeSplitModalBtn').addEventListener('click', closeSplitModal);
  $('confirmSplitBtn').addEventListener('click', confirmSplit);

  // Clear data
  $('clearAllDataBtn').addEventListener('click', clearAllData);
  
  // Header inline links
  $('manageInstrLink').addEventListener('click', () => switchTab('cards'));

  // Tab switching links
  const TABS = ['ledger', 'cards', 'merchants', 'categories', 'settings'];
  TABS.forEach(id => {
    const btn = $('nav-' + id);
    if (btn) {
      btn.addEventListener('click', () => switchTab(id));
    }
  });
}

function parseTermsAndConditions(text) {
  const textLower = text.toLowerCase();
  
  // 1. Detect Bank
  let bank = 'Other';
  const banks = ['HDFC', 'ICICI', 'SBI', 'Axis', 'AMEX', 'RuPay'];
  for (const b of banks) {
    if (new RegExp('\\b' + b + '\\b', 'i').test(text)) {
      bank = b;
      break;
    }
  }
  
  // 2. Detect Card Name
  let cardName = '';
  const cardNameMatch = text.match(/([A-Z][a-zA-Z0-9\s]{2,15})\s+Credit\s+Card/i) || text.match(/([A-Z][a-zA-Z0-9\s]{2,15})\s+Card/);
  if (cardNameMatch) {
    cardName = cardNameMatch[1].trim();
  }

  // 3. Detect Network
  let network = 'Visa';
  const networks = ['Visa', 'Mastercard', 'Amex', 'RuPay'];
  for (const n of networks) {
    if (new RegExp('\\b' + n + '\\b', 'i').test(text)) {
      network = n;
      break;
    }
  }

  // 4. Reward Type (Cashback vs Points)
  let rewardType = 'Cashback';
  if (/point|pts|membership reward|edge reward/i.test(textLower)) {
    rewardType = 'Points';
  }

  // 5. Default Rate
  let defaultRate = 1;
  const defRateMatch = text.match(/all\s+other\s+spends\b.*?(\d+(?:\.\d+)?)\s*%/i) || 
                       text.match(/other\s+purchases\b.*?(\d+(?:\.\d+)?)\s*%/i) ||
                       text.match(/base\s+rate\b.*?(\d+(?:\.\d+)?)\s*%/i) ||
                       text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:cashback|reward)?\s*on\s+all\s+(?:other\s+)?spends/i) ||
                       text.match(/(\d+(?:\.\d+)?)\s*(?:points?|pts)\s+per\s+(?:rs\.?|₹)?\s*100/i);
  if (defRateMatch) {
    defaultRate = parseFloat(defRateMatch[1]);
  }

  // 6. Point Value
  let pointValue = 1.00;
  if (rewardType === 'Points') {
    const ptValMatch = text.match(/(?:1|one)\s+(?:point|pt|reward)\s*=\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i) ||
                       text.match(/value\s+of\s+each\s+point\s+is\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i) ||
                       text.match(/point\s+value.*?(\d+(?:\.\d+)?)\s*(?:inr|rs)/i);
    if (ptValMatch) {
      pointValue = parseFloat(ptValMatch[1]);
    }
  }

  // 7. Monthly Cap
  let cap = null;
  const capMatch = text.match(/capped\s+at\s*(?:rs\.?|₹)?\s*(\d+)/i) || 
                   text.match(/max\s*(?:cashback|points|reward)\s*of\s*(?:rs\.?|₹)?\s*(\d+)/i) ||
                   text.match(/maximum\s*limit\s*of\s*(?:rs\.?|₹)?\s*(\d+)/i);
  if (capMatch) {
    cap = parseInt(capMatch[1], 10);
  }

  // 8. Minimum spend per transaction
  let minSpend = 0;
  const minSpendMatch = text.match(/(?:minimum|min)\s+transaction\s+(?:value|amount)\s+(?:of|is)\s*(?:rs\.?|₹)?\s*(\d+)/i) ||
                        text.match(/(?:minimum|min)\s+spend\s+of\s*(?:rs\.?|₹)?\s*(\d+)\s+to\s+earn/i) ||
                        text.match(/spends\s+above\s*(?:rs\.?|₹)?\s*(\d+)/i);
  if (minSpendMatch) {
    minSpend = parseFloat(minSpendMatch[1]);
  }

  // 9. MCC Rates and Exclusions
  const mccRates = {};
  const excluded = [];
  
  const categoryKeywords = {
    dining: ['dining', 'restaurant', 'zomato', 'swiggy', 'eats'],
    grocery: ['grocery', 'groceries', 'supermarket'],
    fuel: ['fuel', 'petrol', 'diesel', 'gasoline'],
    ecommerce: ['online shopping', 'ecommerce', 'amazon', 'flipkart', 'myntra'],
    travel: ['travel', 'flight', 'airline', 'railway', 'irctc', 'hotel', 'bus'],
    entertain: ['movie', 'entertainment', 'cinema', 'bookmyshow'],
    utilities: ['utility', 'utilities', 'telecom', 'electricity', 'water', 'gas bill'],
    education: ['education', 'school fee', 'college fee'],
    insurance: ['insurance', 'premium'],
    rent: ['rent', 'rental'],
    wallet: ['wallet load', 'wallet reload', 'prepaid load', 'wallet transaction']
  };

  Object.keys(categoryKeywords).forEach(groupId => {
    const keywords = categoryKeywords[groupId];
    let isExcluded = false;
    let rate = null;

    for (const kw of keywords) {
      const exclusionRegex = new RegExp('(?:exclude|excluding|no cashback|no reward|exempt|ineligible|nil|no points|not eligible)\\s+(?:on|for|of)?\\s+[^.\\n]*?\\b' + kw + '\\b', 'i');
      const exclusionRegexRev = new RegExp('\\b' + kw + '\\b[^.\\n]*?\\b(?:is excluded|are excluded|will not earn|do not earn|no reward)\\b', 'i');
      
      if (exclusionRegex.test(text) || exclusionRegexRev.test(text)) {
        isExcluded = true;
        break;
      }
    }

    if (isExcluded) {
      excluded.push(groupId);
    } else {
      for (const kw of keywords) {
        const rateRegex = new RegExp('(\\d+(?:\\.\\d+)?)\\s*%\\s*(?:cashback|reward)?\\s+(?:on|for|at)?\\s+[^.\\n]*?\\b' + kw + '\\b', 'i');
        const rateRegexRev = new RegExp('\\b' + kw + '\\b[^.\\n]*?(\\d+(?:\\.\\d+)?)\\s*%', 'i');
        const multRegex = new RegExp('(\\d+)\\s*[xX]\\s*(?:points|reward|accelerated)?\\s+(?:on|for|at)?\\s+[^.\\n]*?\\b' + kw + '\\b', 'i');

        const m1 = text.match(rateRegex);
        if (m1) {
          rate = parseFloat(m1[1]);
          break;
        }
        const m2 = text.match(rateRegexRev);
        if (m2) {
          rate = parseFloat(m2[1]);
          break;
        }
        const m3 = text.match(multRegex);
        if (m3) {
          const mult = parseFloat(m3[1]);
          rate = defaultRate * mult;
          break;
        }
      }

      if (rate !== null) {
        mccRates[groupId] = rate;
      }
    }
  });

  // Apply parsed results to the form
  $('cBank').value = bank === 'Other' ? 'Other' : bank;
  if (bank === 'Other') {
    $('cBankCustom').value = '';
    $('cBankCustom').style.display = 'block';
  } else {
    $('cBankCustom').value = '';
    $('cBankCustom').style.display = 'none';
  }
  
  $('cName').value = cardName || 'Auto-Parsed Card';
  $('cNetwork').value = network;
  $('cRewardType').value = rewardType;
  $('cPointValField').style.display = rewardType === 'Points' ? 'block' : 'none';
  $('cPointVal').value = pointValue;
  $('cDefRate').value = defaultRate;
  $('cDefRateLabel').textContent = rewardType === 'Points' ? 'Default points per ₹100' : 'Default cashback %';
  $('cCap').value = cap !== null ? cap : '';
  $('cMinSpend').value = minSpend;

  buildMccRateTable(mccRates, excluded);
  toast('Terms parsed successfully! Review the values below.');
}

function selectCardForTransaction(cardId) {
  const card = cardById(cardId);
  if (!card) return;
  $('fMode').value = card.type === 'Credit' ? 'credit' : 'debit';
  buildInstrumentField(card.id);
  switchTab('ledger');
  // Focus and scroll to the amount field
  $('fAmt').focus();
  $('fAmt').scrollIntoView({ behavior: 'smooth', block: 'center' });
  toast(`Selected "${card.name}" for manual entry!`);
}

let activeDetailCardId = null;
let activeDetailCycle = null;

function fmtDateCompact(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function getStatementCycleRange(card, year, month) {
  const stmtDay = card.statementDay || 15;
  const dueDay = card.dueDay || 5;

  const end = new Date(year, month - 1, stmtDay);
  const start = new Date(year, month - 2, stmtDay + 1);

  let dueYear = year;
  let dueMonth = month;
  if (dueDay <= stmtDay) {
    dueMonth = month + 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear++;
    }
  }
  const due = new Date(dueYear, dueMonth - 1, dueDay);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    due: due.toISOString().slice(0, 10)
  };
}

function getBillingCyclesForCard(card) {
  const cycles = [];
  const now = new Date();
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth() + 1;

  for (let i = 0; i < 12; i++) {
    const range = getStatementCycleRange(card, currentYear, currentMonth);
    const monthName = MONTH_NAMES[currentMonth - 1];
    cycles.push({
      year: currentYear,
      month: currentMonth,
      label: `${monthName} ${currentYear} (${fmtDateCompact(range.start)} - ${fmtDateCompact(range.end)})`,
      range: range
    });

    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
  }
  return cycles;
}

function toggleStatementPaid(cardId, cycleKey) {
  const card = cardById(cardId);
  if (!card) return;
  card.paidStatements = card.paidStatements || {};
  card.paidStatements[cycleKey] = !card.paidStatements[cycleKey];
  persist();
}

function openCardDetails(cardId) {
  activeDetailCardId = cardId;
  const card = cardById(cardId);
  if (!card) return;

  const bankKey = card.bank || 'Other';
  const rewardStr = card.rewardType === 'Points'
    ? `${card.defaultRate} pts/₹100`
    : `${card.defaultRate}% cashback`;

  $('cdTitle').textContent = `${bankKey} ${card.name}`;
  $('cdPreviewBank').textContent = bankKey;
  $('cdPreviewName').textContent = card.name;
  $('cdPreviewNumber').textContent = `•••• •••• •••• ${card.last4 || '••••'}`;
  
  let rateInfo = rewardStr;
  if (card.minSpend) {
    rateInfo += ` (Min spend ₹${card.minSpend})`;
  }
  if (card.cap != null) {
    rateInfo += ` · cap ${fmt(card.cap)}/mo`;
  }
  $('cdPreviewRate').textContent = rateInfo;

  const previewEl = $('cdCardPreview');
  previewEl.dataset.bank = bankKey;
  previewEl.dataset.network = card.network || '';

  const cycles = getBillingCyclesForCard(card);
  const select = $('cdCycleSelect');
  select.innerHTML = '';
  cycles.forEach(c => {
    const opt = document.createElement('option');
    opt.value = JSON.stringify({ year: c.year, month: c.month, range: c.range });
    opt.textContent = c.label;
    select.appendChild(opt);
  });
  select.selectedIndex = 0;

  updateCardDetailsView();
  $('cardDetailsModal').classList.add('open');
}

function updateCardDetailsView() {
  const card = cardById(activeDetailCardId);
  if (!card) return;

  const select = $('cdCycleSelect');
  if (!select.value) return;
  
  const cycle = JSON.parse(select.value);
  activeDetailCycle = cycle;

  const { start, end, due } = cycle.range;

  const txs = state.entries.filter(e => e.cardId === card.id && e.date >= start && e.date <= end);
  const totalSpent = txs.reduce((s, e) => s + e.amount, 0);

  let totalReward = 0;
  let rewardUnit = 'cashback';
  if (card.rewardType === 'Points') {
    rewardUnit = 'points';
    totalReward = txs.reduce((s, e) => {
      const r = entryRewards(e);
      return s + (r.type === 'Points' ? r.points : 0);
    }, 0);
  } else {
    totalReward = txs.reduce((s, e) => s + entryCashback(e), 0);
  }

  $('cdTotalSpent').textContent = fmt(totalSpent);
  if (rewardUnit === 'points') {
    $('cdRewardTypeLbl').textContent = 'Points Earned';
    $('cdTotalReward').textContent = `${Math.round(totalReward).toLocaleString('en-IN')} pts`;
  } else {
    $('cdRewardTypeLbl').textContent = 'Cashback Earned';
    $('cdTotalReward').textContent = fmt(totalReward);
  }

  const dueD = new Date(due + 'T00:00:00');
  $('cdDueDate').textContent = dueD.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const cycleKey = `${cycle.year}-${String(cycle.month).padStart(2, '0')}`;
  card.paidStatements = card.paidStatements || {};
  const isPaid = card.paidStatements[cycleKey] || false;

  const statusTag = $('cdStatusTag');
  const toggleBtn = $('cdTogglePaidBtn');

  if (isPaid) {
    statusTag.textContent = 'Paid';
    statusTag.style.background = 'rgba(74, 112, 79, 0.2)';
    statusTag.style.color = '#7aa07a';
    toggleBtn.textContent = 'Mark as Unpaid';
    toggleBtn.style.background = 'var(--line)';
    toggleBtn.style.color = 'var(--ink-soft)';
  } else {
    const todayStr = today();
    const isOverdue = todayStr > due;
    statusTag.textContent = isOverdue ? 'Overdue' : 'Unpaid';
    statusTag.style.background = isOverdue ? 'rgba(140, 59, 59, 0.2)' : 'rgba(166, 130, 44, 0.2)';
    statusTag.style.color = isOverdue ? '#e06c75' : 'var(--brass)';
    toggleBtn.textContent = 'Mark as Paid';
    toggleBtn.style.background = 'var(--brass)';
    toggleBtn.style.color = '#fff';
  }

  const listEl = $('cdTxList');
  listEl.innerHTML = '';

  if (txs.length === 0) {
    $('cdTxEmpty').style.display = 'block';
  } else {
    $('cdTxEmpty').style.display = 'none';
    txs.forEach(e => {
      const mcc = MCC_BY_ID[e.mccGroup || 'other'] || MCC_BY_ID['other'];
      const r = entryRewards(e);
      let rwStr = '';
      if (r.val > 0) {
        rwStr = r.type === 'Points' ? `+${r.points} pts` : `+${fmt(r.cash)}`;
      }

      const row = document.createElement('div');
      row.className = 'cd-tx-row';
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--card); border:1px solid var(--line); border-radius:8px';
      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px">
          <span style="font-size:18px">${mcc.ico}</span>
          <div>
            <div style="font-size:13px; font-weight:700; color:var(--ink)">${esc(e.vendor)}</div>
            <div style="font-size:10px; color:var(--ink-soft)">${fmtDateCompact(e.date)} · ${esc(mcc.label)}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px; font-weight:700; color:var(--ink)">${fmt(e.amount)}</div>
          <div style="font-size:10px; font-weight:800; color:var(--brass)">${rwStr}</div>
        </div>
      `;
      listEl.appendChild(row);
    });
  }
}

function closeCardDetailsModal() {
  $('cardDetailsModal').classList.remove('open');
  activeDetailCardId = null;
  activeDetailCycle = null;
}

// ═══════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════
async function init() {
  try {
    initTheme();
    await hydrate();
    
    // Restore Google Token if it hasn't expired (approx 1 hour / 3600 seconds)
    const savedToken = localStorage.getItem('googleToken');
    const savedTime = localStorage.getItem('googleTokenTime');
    if (savedToken && savedTime && (Date.now() - parseInt(savedTime) < 3600 * 1000)) {
      googleToken = savedToken;
    }
    
    if (handleOAuthCallback()) { toast('Connected to Google ✓'); switchTab('settings'); }
    $('fDate').value = today(); $('monthFilter').value = thisMonth();
    $('currencyInput').value = state.settings.currency || '₹';
    if ($('syncDays')) $('syncDays').value = state.settings.syncDays || 14;
    if (state.settings.googleClientId && $('gClientId')) $('gClientId').value = state.settings.googleClientId;
    if (state.settings.sharedSheetId && $('sharedSheetId')) $('sharedSheetId').value = state.settings.sharedSheetId;
    if (state.settings.telegramBotToken && $('tgBotToken')) $('tgBotToken').value = state.settings.telegramBotToken;
    if (state.settings.telegramChatId && $('tgChatId')) $('tgChatId').value = state.settings.telegramChatId;
    
    populateStaticSelects();
    populateFSubcat($('fCat').value);
    buildInstrumentField();
    updateGmailUI();
    await syncSharedMerchantDb();
  } catch (e) {
    console.error('Init error (non-fatal):', e);
  }
  
  bindEvents();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
