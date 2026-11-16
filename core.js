// ==========================================
// INICIO DE ARCHIVO: core.js (v4.1.0)
// EL CEREBRO: LÓGICA PURA, MATEMÁTICAS Y BASE DE DATOS
// Arquitectura Estricta: Cero interacción con el DOM (HTML).
// ==========================================

// --- 1. ESTADO GLOBAL DE LA APLICACIÓN ---
let currentDate = new Date();
let viewDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
let currentBalances = {};
let lastAccountViewOrigin = 'home';
let selectedCalendarDay = null;
let activeHistoryFilter = 'all';
let currentBudgetType = 'expense';
let currentAssetType = 'active';
let annualViewYear = currentDate.getFullYear();
let annualViewTab = 'summary';
let activeAmortizationSchedule = [];
let hasUnsavedChanges = false;
let widgetOrder = [];
let projectionMode = 'plan';

// --- 1B. CATÁLOGO DE ICONOGRAFÍA VECTORIAL PLANA (SVG) ---
const ICONS = {
    'wallet': '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    'bank': '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
    'card': '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
    'piggy': '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><circle cx="16" cy="11" r="1"/>',
    'diamond': '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
    'coins': '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
    'receipt': '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    'transfer': '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    'arrow-up-right': '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
    'arrow-down-left': '<line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/>',
    'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    'check': '<polyline points="20 6 9 17 4 12"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    'chart': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'repeat': '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    'briefcase': '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    'scale': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'heart-pulse': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
    'sliders': '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    'help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'info': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    'bug': '<rect x="8" y="6" width="8" height="14" rx="4"/><path d="m19 7-3 2"/><path d="m5 7 3 2"/><path d="m19 19-3-2"/><path d="m5 19 3-2"/><path d="M20 13h-4"/><path d="M4 13h4"/><path d="m10 4 1 2"/><path d="m14 4-1 2"/>',
    'share': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    'edit': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    'trash': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    'archive': '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
    'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
    'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'printer': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    'utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    'car': '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    'film': '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
    'stethoscope': '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
    'layers': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    'laptop': '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/>',
    'award': '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'pin': '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>',
    'bell': '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    'palette': '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    'lock': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'calculator': '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>'
};

const renderIcon = (name, size = 18, extraClass = '') => {
    const body = ICONS[name] || ICONS['layers'];
    const cls = extraClass ? `ui-icon ${extraClass}` : 'ui-icon';
    return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
};

const stripLeadingEmoji = (str) => {
    if (!str) return '';
    const cleaned = String(str).replace(/^[\s\uFE0F\u200D\p{Extended_Pictographic}]+/gu, '').trim();
    return cleaned || String(str).trim();
};

const inferCategoryIcon = (name, type = 'expense') => {
    const clean = stripLeadingEmoji(name).toLowerCase();
    if (/aliment|comida|mercado|restaurante|café/.test(clean)) return 'utensils';
    if (/vivienda|arriendo|servicio|hogar|agua|luz|internet/.test(clean)) return 'home';
    if (/transporte|gasolina|moto|carro|uber|pasaje/.test(clean)) return 'car';
    if (/compra|ropa|hogar|tienda/.test(clean)) return 'shopping-bag';
    if (/entretenimiento|cine|ocio|juego|suscrip/.test(clean)) return 'film';
    if (/salud|médic|medic|farmacia|gym/.test(clean)) return 'stethoscope';
    if (/cuota|interés|interes|tarjeta|crédito|credito|deuda/.test(clean)) return 'card';
    if (/salario|nómina|nomina|sueldo/.test(clean)) return 'briefcase';
    if (/prima|bono|regalo/.test(clean)) return 'award';
    if (/cesant|ahorro/.test(clean)) return 'piggy';
    if (/honorario|venta|freelance|tecnolog/.test(clean)) return 'laptop';
    if (/rendimiento|inversi/.test(clean)) return 'trending-up';
    return type === 'income' ? 'trending-up' : 'layers';
};

// --- 2. SISTEMA DE SEGURIDAD Y CIFRADO LOCAL ---
const hashSecret = (str) => {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
};

let authData = JSON.parse(localStorage.getItem('myFinancesAuth'));
if (authData && authData.pinEnabled === undefined) {
    authData.pinEnabled = !!authData.pinHash;
    localStorage.setItem('myFinancesAuth', JSON.stringify(authData));
}

const verifyPin = (pin) => {
    return authData && hashSecret(pin) === authData.pinHash;
};

const registerUser = (name, pin, usePin) => {
    authData = {
        name: name.trim(),
        pinHash: usePin ? hashSecret(pin) : null,
        pinEnabled: usePin
    };
    localStorage.setItem('myFinancesAuth', JSON.stringify(authData));
};

// --- 3. BASE DE DATOS LOCAL Y MIGRACIÓN DE ESTRUCTURAS ---
let financeData = JSON.parse(localStorage.getItem('myFinances')) || {
    transactions: [],
    customAccounts: [],
    monthlyBudget: 0,
    fixedAssets: [],
    pockets: [],
    subscriptions: [],
    hideZeroAccounts: false
};

if (!financeData.fixedAssets) financeData.fixedAssets = [];
if (!financeData.pockets) financeData.pockets = [];
if (!financeData.subscriptions) financeData.subscriptions = [];
if (!financeData.lastBackupDate) financeData.lastBackupDate = new Date().getTime();
if (!financeData.customAccounts || financeData.customAccounts.length === 0) {
    financeData.customAccounts = [
        { id: 'Efectivo', name: 'Efectivo', category: 'asset', isDefault: false, showWhenZero: false }
    ];
}
if (financeData.monthlyBudget === undefined) financeData.monthlyBudget = 0;
if (financeData.hideZeroAccounts === undefined) financeData.hideZeroAccounts = false;

if (
    !financeData.categories ||
    (financeData.categories.expense && financeData.categories.expense.length === 0 && financeData.categories.income && financeData.categories.income.length === 0) ||
    (financeData.categories.expense.length > 0 && typeof financeData.categories.expense[0] === 'string')
) {
    financeData.categories = {
        expense: [
            { name: 'Alimentación', icon: 'utensils', archived: false, isFixed: false, rollover: 'none', subcategories: [] },
            { name: 'Vivienda y Servicios', icon: 'home', archived: false, isFixed: true, rollover: 'none', subcategories: [] },
            { name: 'Transporte', icon: 'car', archived: false, isFixed: false, rollover: 'none', subcategories: [] },
            { name: 'Compras', icon: 'shopping-bag', archived: false, isFixed: false, rollover: 'none', subcategories: [] },
            { name: 'Entretenimiento', icon: 'film', archived: false, isFixed: false, rollover: 'none', subcategories: [] },
            { name: 'Salud', icon: 'stethoscope', archived: false, isFixed: false, rollover: 'none', subcategories: [] },
            { name: 'Cuotas / Intereses', icon: 'card', archived: false, isFixed: true, rollover: 'none', subcategories: [] },
            { name: 'Otros Gastos', icon: 'layers', archived: false, isFixed: false, rollover: 'none', subcategories: [] }
        ],
        income: [
            { name: 'Salario / Nómina', icon: 'briefcase', archived: false, isFixed: true, rollover: 'none', subcategories: [] },
            { name: 'Prima de Servicios', icon: 'award', archived: false, isFixed: false, rollover: 'none', subcategories: [] },
            { name: 'Cesantías e Intereses', icon: 'piggy', archived: false, isFixed: false, rollover: 'none', subcategories: [] },
            { name: 'Honorarios / Ventas', icon: 'laptop', archived: false, isFixed: false, rollover: 'none', subcategories: [] },
            { name: 'Rendimientos', icon: 'trending-up', archived: false, isFixed: false, rollover: 'none', subcategories: [] },
            { name: 'Otros Ingresos', icon: 'layers', archived: false, isFixed: false, rollover: 'none', subcategories: [] }
        ]
    };
} else {
    ['expense', 'income'].forEach(cType => {
        if (!Array.isArray(financeData.categories[cType])) financeData.categories[cType] = [];
        financeData.categories[cType].forEach(cat => {
            if (!cat.icon) cat.icon = inferCategoryIcon(cat.name, cType);
            if (cat.isArchived === undefined) cat.isArchived = cat.archived !== undefined ? cat.archived : false;
            delete cat.archived;
            if (cat.isFixed === undefined) cat.isFixed = false;
            if (!cat.rollover) cat.rollover = 'none';
            if (Array.isArray(cat.subcategories)) {
                cat.subcategories = cat.subcategories.map(sub => {
                    const obj = (typeof sub === 'string') ? { name: sub, limit: 0 } : sub;
                    if (!obj.icon) obj.icon = inferCategoryIcon(obj.name, cType);
                    if (obj.isArchived === undefined) obj.isArchived = obj.archived !== undefined ? obj.archived : false;
                    delete obj.archived;
                    if (obj.isFixed === undefined) obj.isFixed = false;
                    if (!obj.frequency) obj.frequency = 'monthly';
                    if (obj.startMonth === undefined) obj.startMonth = 0;
                    if (!obj.rollover) obj.rollover = 'none';
                    return obj;
                });
            } else {
                cat.subcategories = [];
            }
        });
    });
}

if (!financeData.categoryBudgets) financeData.categoryBudgets = {};
if (!financeData.plannerExtras) financeData.plannerExtras = [];
if (!financeData.healthGoals) {
    financeData.healthGoals = { margin: 15, liquidity: 3, debt: 30, networth: 10 };
}

financeData.customAccounts.forEach(acc => {
    if (!acc.category) acc.category = 'asset';
    if (acc.category === 'liability') acc.category = 'debt';
    if (acc.isDefault === undefined) acc.isDefault = false;
    if (acc.showWhenZero === undefined) acc.showWhenZero = false;
});

financeData.fixedAssets.forEach(fa => {
    if (fa.showInBalance === undefined) fa.showInBalance = true;
});

financeData.subscriptions.forEach(sub => {
    if (sub.reserveInBudget === undefined) sub.reserveInBudget = false;
});

localStorage.setItem('myFinances', JSON.stringify(financeData));

// --- 4. MOTOR MATEMÁTICO, DECIMALES COLOMBIANOS Y CALCULADORA ---
const round2 = (num) => Math.round(((num || 0) + Number.EPSILON) * 100) / 100;

const parseMoneyInput = (val) => {
    if (val === '' || val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : round2(val);

    let s = String(val).replace(/[$€\s]/g, '').trim();
    if (!s || s === '-') return 0;

    if (s.includes(',') && s.includes('.')) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else {
            s = s.replace(/,/g, '');
        }
    } else if (s.includes(',')) {
        s = s.replace(',', '.');
    } else if (s.includes('.')) {
        const dotCount = (s.match(/\./g) || []).length;
        if (dotCount > 1) {
            s = s.replace(/\./g, '');
        } else {
            const parts = s.split('.');
            if (parts[1] && parts[1].length === 3 && parts[0] && parts[0] !== '0' && parts[0] !== '-0') {
                s = s.replace(/\./g, '');
            }
        }
    }

    const parsed = parseFloat(s);
    return isNaN(parsed) ? 0 : round2(parsed);
};

const formatNumberInput = (val, maxDecimals = 2) => {
    if (val === '' || val === null || val === undefined) return '';

    if (typeof val === 'number') {
        if (isNaN(val)) return '';
        const clean = round2(val);
        const isNeg = clean < 0;
        const absStr = Math.abs(clean).toString();
        const [intPart, decPart] = absStr.split('.');
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        if (decPart && Number(decPart) > 0 && maxDecimals > 0) {
            return `${isNeg ? '-' : ''}${formattedInt},${decPart.slice(0, maxDecimals)}`;
        }
        return `${isNeg ? '-' : ''}${formattedInt}`;
    }

    let raw = String(val).replace(/[$€\s]/g, '');
    if (!raw) return '';

    const isNeg = raw.startsWith('-');
    raw = raw.replace(/-/g, '');

    let hasComma = raw.includes(',');
    const dotCount = (raw.match(/\./g) || []).length;

    if (!hasComma && dotCount === 1) {
        const parts = raw.split('.');
        if (parts[1] === '' || (parts[1].length <= maxDecimals && parts[1].length !== 3)) {
            raw = `${parts[0]},${parts[1]}`;
            hasComma = true;
        }
    }

    let intRaw = '';
    let decRaw = '';

    if (hasComma) {
        const commaIdx = raw.indexOf(',');
        intRaw = raw.slice(0, commaIdx).replace(/\D/g, '');
        decRaw = raw.slice(commaIdx + 1).replace(/\D/g, '').slice(0, maxDecimals);
    } else {
        intRaw = raw.replace(/\D/g, '');
    }

    if (intRaw.length > 1) {
        intRaw = intRaw.replace(/^0+/, '') || '0';
    }
    if (!intRaw && hasComma) {
        intRaw = '0';
    }

    const formattedInt = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const prefix = isNeg ? '-' : '';

    if (hasComma && maxDecimals > 0) {
        return `${prefix}${formattedInt},${decRaw}`;
    }
    return `${prefix}${formattedInt}`;
};

const formatMoney = (amount) => {
    if (localStorage.getItem('myFinancesPrivacyMode') === 'true') return amount < 0 ? '-****' : '****';
    const clean = round2(amount);
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(clean);
};

const formatCompact = (amount) => {
    if (localStorage.getItem('myFinancesPrivacyMode') === 'true') return amount < 0 ? '-****' : '****';
    if (!financeData.useCompactNumbers) return formatMoney(amount);
    
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`;
    return `${sign}${abs.toFixed(2)}`;
};

// Evaluador aritmético seguro sin eval()
const evaluateCalculatorExpression = (rawExpr) => {
    if (!rawExpr) return { valid: true, value: 0 };
    let clean = String(rawExpr)
        .replace(/\s+/g, '')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/,/g, '.');

    clean = clean.replace(/[+\-*/.]+$/, '');
    if (!clean) return { valid: true, value: 0 };

    const tokens = [];
    let i = 0;
    while (i < clean.length) {
        const ch = clean[i];
        if ((ch >= '0' && ch <= '9') || ch === '.' || ((ch === '-' || ch === '+') && (i === 0 || ['+', '-', '*', '/'].includes(clean[i - 1])))) {
            let numStr = ch;
            i++;
            while (i < clean.length && ((clean[i] >= '0' && clean[i] <= '9') || clean[i] === '.')) {
                numStr += clean[i];
                i++;
            }
            let isPct = false;
            if (i < clean.length && clean[i] === '%') {
                isPct = true;
                i++;
            }
            const parsed = parseFloat(numStr);
            if (isNaN(parsed)) return { valid: false, value: 0 };
            tokens.push({ type: 'num', value: parsed, isPct });
        } else if (['+', '-', '*', '/'].includes(ch)) {
            tokens.push({ type: 'op', value: ch });
            i++;
        } else {
            return { valid: false, value: 0 };
        }
    }

    if (tokens.length === 0) return { valid: true, value: 0 };

    const resolved = [];
    for (let t = 0; t < tokens.length; t++) {
        const tok = tokens[t];
        if (tok.type === 'num' && tok.isPct) {
            if (resolved.length >= 2 && resolved[resolved.length - 1].type === 'op' && resolved[resolved.length - 2].type === 'num') {
                const op = resolved[resolved.length - 1].value;
                const base = resolved[resolved.length - 2].value;
                if (op === '+' || op === '-') {
                    resolved.push({ type: 'num', value: (base * tok.value) / 100 });
                } else {
                    resolved.push({ type: 'num', value: tok.value / 100 });
                }
            } else {
                resolved.push({ type: 'num', value: tok.value / 100 });
            }
        } else {
            resolved.push(tok);
        }
    }

    const pass1 = [resolved[0]];
    for (let t = 1; t < resolved.length; t += 2) {
        const opTok = resolved[t];
        const nextNum = resolved[t + 1];
        if (!opTok || !nextNum || nextNum.type !== 'num') break;

        if (opTok.value === '*') {
            pass1[pass1.length - 1] = { type: 'num', value: pass1[pass1.length - 1].value * nextNum.value };
        } else if (opTok.value === '/') {
            if (nextNum.value === 0) return { valid: false, value: 0 };
            pass1[pass1.length - 1] = { type: 'num', value: pass1[pass1.length - 1].value / nextNum.value };
        } else {
            pass1.push(opTok, nextNum);
        }
    }

    let acc = pass1[0].value;
    for (let t = 1; t < pass1.length; t += 2) {
        const opTok = pass1[t];
        const nextNum = pass1[t + 1];
        if (!opTok || !nextNum) break;
        if (opTok.value === '+') acc += nextNum.value;
        else if (opTok.value === '-') acc -= nextNum.value;
    }

    if (!isFinite(acc) || isNaN(acc)) return { valid: false, value: 0 };
    return { valid: true, value: round2(acc) };
};

// --- 5. LÓGICA FINANCIERA, CUENTAS, BOLSILLOS Y PRESUPUESTOS ---
const getAccountObj = (id) => {
    const acc = financeData.customAccounts.find(a => String(a.id) === String(id));
    if (acc) return acc;
    const pocket = financeData.pockets.find(p => String(p.id) === String(id));
    if (pocket) return { ...pocket, category: 'pocket' };
    return { id: id, name: id, category: 'asset' };
};

const isLiabilityCategory = (cat) => cat === 'credit_card' || cat === 'debt';
const isTxClosed = (t) => t.status !== 'pending';

const sortAlphabeticallyWithDefault = (arr) => {
    return [...arr].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
};

const setDefaultAccount = (accountId, toggleIfAlreadyDefault = false) => {
    const target = financeData.customAccounts.find(a => a.id === accountId);
    if (!target) return null;

    const willBeDefault = toggleIfAlreadyDefault ? !target.isDefault : true;
    financeData.customAccounts.forEach(a => {
        a.isDefault = (a.id === accountId) ? willBeDefault : false;
    });

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    return willBeDefault;
};

const getDefaultAccountId = (onlyAssets = false) => {
    if (onlyAssets) {
        const defAsset = financeData.customAccounts.find(a => a.category === 'asset' && a.isDefault && !a.id.startsWith('CxC_'));
        if (defAsset) return defAsset.id;
        const firstAsset = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset' && !a.id.startsWith('CxC_')))[0];
        return firstAsset ? firstAsset.id : 'Efectivo';
    }
    const defAny = financeData.customAccounts.find(a => a.isDefault);
    if (defAny) return defAny.id;
    const firstAcc = sortAlphabeticallyWithDefault(financeData.customAccounts)[0];
    return firstAcc ? firstAcc.id : 'Efectivo';
};

const isPeriodMatching = (freq, startMonth, currentMonthIndex) => {
    if (currentMonthIndex < startMonth) return false;
    if (freq === 'monthly') return true;
    if (freq === 'bimonthly') return (currentMonthIndex - startMonth) % 2 === 0;
    if (freq === 'quarterly') return (currentMonthIndex - startMonth) % 3 === 0;
    if (freq === 'semiannual') return (currentMonthIndex - startMonth) % 6 === 0;
    if (freq === 'annual') return (currentMonthIndex - startMonth) % 12 === 0;
    return false;
};

const getCategoryBudgetStatus = (catObj, subObj = null, monthIndex = null, year = null) => {
    const mIdx = monthIndex !== null ? monthIndex : currentDate.getMonth();
    const y = year !== null ? year : currentDate.getFullYear();
    
    // Sumar Suscripciones Reservadas de este mes
    let reservedSubs = 0;
    financeData.subscriptions.forEach(sub => {
        if (sub.status === 'active' && sub.reserveInBudget && sub.category === catObj.name) {
            let appliesToSub = !subObj || (subObj.name === 'General');
            if (appliesToSub && sub.nextBillingDate) {
                const sm = parseInt(sub.nextBillingDate.split('-')[1], 10);
                const cyc = String(sub.cycle || '').toLowerCase();
                if (cyc === 'monthly' || cyc === 'mensual') reservedSubs += round2(sub.amount);
                else if (cyc === 'weekly' || cyc === 'semanal') reservedSubs += round2((sub.amount * 52) / 12);
                else if ((cyc === 'bimonthly' || cyc === 'bimestral') && ((mIdx - (sm - 1)) % 2 === 0)) reservedSubs += round2(sub.amount);
                else if ((cyc === 'quarterly' || cyc === 'trimestral') && ((mIdx - (sm - 1)) % 3 === 0)) reservedSubs += round2(sub.amount);
                else if ((cyc === 'semiannual' || cyc === 'semestral') && ((mIdx - (sm - 1)) % 6 === 0)) reservedSubs += round2(sub.amount);
                else if ((cyc === 'annual' || cyc === 'anual') && (sm - 1) === mIdx) reservedSubs += round2(sub.amount);
            }
        }
    });

    // Si es categoría padre con subcategorías, consolida base y arrastre de cada subcategoría
    if (!subObj && catObj.subcategories && catObj.subcategories.length > 0) {
        let totalBase = reservedSubs;
        let totalRollover = 0;
        let totalCurrent = reservedSubs;
        catObj.subcategories.forEach(sub => {
            if (!sub.isArchived) {
                const subSt = getCategoryBudgetStatus(catObj, sub, mIdx, y);
                totalBase = round2(totalBase + subSt.baseLimit);
                totalRollover = round2(totalRollover + subSt.rolloverAmt);
                totalCurrent = round2(totalCurrent + subSt.currentLimit);
            }
        });
        return { baseLimit: totalBase, reservedSubs, rolloverAmt: totalRollover, currentLimit: Math.max(0, totalCurrent) };
    }

    // 1. Calcular Límite Base del mes actual (Categoría simple o Subcategoría individual)
    let baseLimit = 0;
    if (subObj) {
        if (subObj.isMonthly && Array.isArray(subObj.months)) {
            baseLimit = round2(subObj.months[mIdx] || 0);
        } else if (subObj.limit > 0 && isPeriodMatching(subObj.frequency || 'monthly', subObj.startMonth || 0, mIdx)) {
            baseLimit = round2(subObj.limit);
        }
    } else {
        const cfg = financeData.categoryBudgets[catObj.name];
        if (cfg) {
            if (typeof cfg === 'number') baseLimit = round2(cfg);
            else if (cfg.isMonthly && Array.isArray(cfg.months)) baseLimit = round2(cfg.months[mIdx] || 0);
            else baseLimit = round2(cfg.general || 0);
        }
    }

    baseLimit = round2(baseLimit + reservedSubs);

    // 3. Calcular Arrastre (Rollover) mes a mes dentro del año fiscal (Enero -> mIdx - 1)
    let rolloverAmt = 0;
    const rolloverMode = subObj ? (subObj.rollover || 'none') : (catObj.rollover || 'none');
    
    if (rolloverMode !== 'none' && mIdx > 0) {
        let runningRollover = 0;
        
        for (let i = 0; i < mIdx; i++) {
            const tempMonthId = `${y}-${String(i + 1).padStart(2, '0')}`;
            
            // Tope base del mes i
            let mLimit = 0;
            if (subObj) {
                if (subObj.isMonthly && Array.isArray(subObj.months)) mLimit = round2(subObj.months[i] || 0);
                else if (subObj.limit > 0 && isPeriodMatching(subObj.frequency || 'monthly', subObj.startMonth || 0, i)) mLimit = round2(subObj.limit);
            } else {
                const cfg = financeData.categoryBudgets[catObj.name];
                if (cfg) {
                    if (typeof cfg === 'number') mLimit = round2(cfg);
                    else if (cfg.isMonthly && Array.isArray(cfg.months)) mLimit = round2(cfg.months[i] || 0);
                    else mLimit = round2(cfg.general || 0);
                }
            }
            
            // Suscripciones reservadas del mes i
            let mSubs = 0;
            financeData.subscriptions.forEach(sub => {
                if (sub.status === 'active' && sub.reserveInBudget && sub.category === catObj.name) {
                    let appliesToSub = !subObj || (subObj.name === 'General');
                    if (appliesToSub && sub.nextBillingDate) {
                        const sm = parseInt(sub.nextBillingDate.split('-')[1], 10);
                        const cyc = String(sub.cycle || '').toLowerCase();
                        if (cyc === 'monthly' || cyc === 'mensual') mSubs += round2(sub.amount);
                        else if (cyc === 'weekly' || cyc === 'semanal') mSubs += round2((sub.amount * 52) / 12);
                        else if ((cyc === 'bimonthly' || cyc === 'bimestral') && ((i - (sm - 1)) % 2 === 0)) mSubs += round2(sub.amount);
                        else if ((cyc === 'quarterly' || cyc === 'trimestral') && ((i - (sm - 1)) % 3 === 0)) mSubs += round2(sub.amount);
                        else if ((cyc === 'semiannual' || cyc === 'semestral') && ((i - (sm - 1)) % 6 === 0)) mSubs += round2(sub.amount);
                        else if ((cyc === 'annual' || cyc === 'anual') && (sm - 1) === i) mSubs += round2(sub.amount);
                    }
                }
            });
            mLimit = round2(mLimit + mSubs);

            // Gasto ejecutado en el mes i
            let mSpent = 0;
            financeData.transactions.forEach(t => {
                if (t.monthId === tempMonthId && t.type === 'expense' && !t.isAdjustment && t.category === catObj.name) {
                    if (!subObj || t.subcategory === subObj.name) {
                        mSpent = round2(mSpent + round2(t.status === 'pending' ? (t.budgetedAmount || t.amount) : t.amount));
                    }
                }
            });

            const monthAvailable = Math.max(0, round2(mLimit + runningRollover));
            const monthDiff = round2(monthAvailable - mSpent);

            if (rolloverMode === 'positive') {
                runningRollover = monthDiff > 0 ? monthDiff : 0;
            } else if (rolloverMode === 'both') {
                runningRollover = monthDiff;
            }
        }
        
        rolloverAmt = runningRollover;
    }

    const currentLimit = Math.max(0, round2(baseLimit + rolloverAmt));
    return { baseLimit, reservedSubs, rolloverAmt, currentLimit };
};

const getCategoryLimitForMonth = (catObj, monthIndex, year = null) => {
    return getCategoryBudgetStatus(catObj, null, monthIndex, year).currentLimit;
};

const getBudgetedAmountForSelection = (type, categoryName, subcategoryName, monthIndex, year = null) => {
    if (!type || type === 'transfer' || !categoryName) return 0;
    const catList = financeData.categories[type] || [];
    const catObj = catList.find(c => c.name === categoryName);
    if (!catObj) return 0;

    let subObj = null;
    if (subcategoryName && subcategoryName !== 'General' && Array.isArray(catObj.subcategories)) {
        subObj = catObj.subcategories.find(s => s.name === subcategoryName);
    }
    
    return getCategoryBudgetStatus(catObj, subObj, monthIndex, year).currentLimit;
};

const getRemainingBudgetForSelection = (type, categoryName, subcategoryName, monthId, excludeTxId = null) => {
    if (!type || type === 'transfer' || !categoryName || !monthId) {
        return { hasBudget: false, totalLimit: 0, baseLimit: 0, rolloverAmt: 0, spent: 0, remaining: 0 };
    }
    const [yStr, mStr] = monthId.split('-');
    const year = parseInt(yStr, 10);
    const monthIndex = Math.max(0, Math.min(11, parseInt(mStr, 10) - 1));

    const catList = financeData.categories[type] || [];
    const catObj = catList.find(c => c.name === categoryName);
    if (!catObj) {
        return { hasBudget: false, totalLimit: 0, baseLimit: 0, rolloverAmt: 0, spent: 0, remaining: 0 };
    }

    const hasSubcats = Array.isArray(catObj.subcategories) && catObj.subcategories.length > 0;
    let subObj = null;
    if (subcategoryName && subcategoryName !== 'General' && hasSubcats) {
        subObj = catObj.subcategories.find(s => s.name === subcategoryName);
    }

    const status = getCategoryBudgetStatus(catObj, subObj, monthIndex, year);
    const totalLimit = status.currentLimit;

    let spent = 0;
    financeData.transactions.forEach(t => {
        if (t.monthId === monthId && t.type === type && !t.isAdjustment && t.category === categoryName) {
            if (excludeTxId && String(t.id) === String(excludeTxId)) return;
            let matchesSub = true;
            if (subObj) {
                matchesSub = (t.subcategory === subObj.name);
            } else if (subcategoryName === 'General' && hasSubcats) {
                matchesSub = (!t.subcategory || t.subcategory === 'General');
            }
            if (matchesSub) {
                const val = t.status === 'pending' ? round2(t.budgetedAmount || t.amount) : round2(t.amount);
                spent = round2(spent + val);
            }
        }
    });

    const remaining = Math.max(0, round2(totalLimit - spent));
    return {
        hasBudget: totalLimit > 0,
        totalLimit,
        baseLimit: status.baseLimit,
        rolloverAmt: status.rolloverAmt,
        spent,
        remaining
    };
};

const calculateBudgetVariance = (type, realAmount, budgetedAmount) => {
    const real = round2(realAmount || 0);
    const budget = round2(budgetedAmount || 0);
    if (budget <= 0 || type === 'transfer') {
        return { hasBudget: false, diff: 0, pct: 0, isFavorable: true };
    }

    const diff = type === 'income' ? round2(real - budget) : round2(budget - real);
    const pct = round2(((real - budget) / budget) * 100);
    const isFavorable = type === 'income' ? (real >= budget) : (real <= budget);

    return { hasBudget: true, diff, pct, isFavorable };
};

const adjustPocketBalance = (pocketId, delta) => {
    const pocket = financeData.pockets.find(p => String(p.id) === String(pocketId));
    if (!pocket) return;
    const cleanDelta = round2(delta);
    if (cleanDelta >= 0) {
        pocket.principal = round2((pocket.principal || 0) + cleanDelta);
    } else {
        const toDeduct = Math.abs(cleanDelta);
        if (toDeduct <= (pocket.yields || 0)) {
            pocket.yields = round2((pocket.yields || 0) - toDeduct);
        } else {
            const rem = round2(toDeduct - (pocket.yields || 0));
            pocket.yields = 0;
            pocket.principal = Math.max(0, round2((pocket.principal || 0) - rem));
        }
    }
};

const computeBalancesUpTo = (targetMonthId) => {
    const bals = {};
    financeData.customAccounts.forEach(acc => {
        bals[acc.id] = 0;
    });
    if (financeData.pockets) {
        financeData.pockets.forEach(p => {
            bals[p.id] = round2((p.principal || 0) + (p.yields || 0));
        });
    }

    financeData.transactions.forEach(t => {
        if (t.monthId <= targetMonthId && isTxClosed(t)) {
            const accObj = getAccountObj(t.account);
            const toAccObj = t.toAccount ? getAccountObj(t.toAccount) : null;
            const amt = round2(t.amount);

            if (t.type === 'income') {
                if (accObj.category !== 'pocket') {
                    if (isLiabilityCategory(accObj.category)) {
                        if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] - amt);
                    } else {
                        if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] + amt);
                    }
                }
            } else if (t.type === 'expense') {
                if (accObj.category !== 'pocket') {
                    if (isLiabilityCategory(accObj.category)) {
                        if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] + amt);
                    } else {
                        if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] - amt);
                    }
                }
            } else if (t.type === 'transfer') {
                if (accObj.category !== 'pocket') {
                    if (isLiabilityCategory(accObj.category)) {
                        if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] + amt);
                    } else {
                        if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] - amt);
                    }
                }

                if (toAccObj && toAccObj.category !== 'pocket') {
                    if (isLiabilityCategory(toAccObj.category)) {
                        if (bals[t.toAccount] !== undefined) bals[t.toAccount] = round2(bals[t.toAccount] - amt);
                    } else {
                        if (bals[t.toAccount] !== undefined) bals[t.toAccount] = round2(bals[t.toAccount] + amt);
                    }
                }
            }
        }
    });

let assetsTotal = 0, cxcTotal = 0, cardsTotal = 0, debtsTotal = 0, fixedAssetsTotal = 0, visibleFixedAssetsTotal = 0, pocketsTotal = 0;

    financeData.customAccounts.forEach(acc => {
        const b = round2(bals[acc.id] || 0);
        if (acc.category === 'credit_card') {
            cardsTotal = round2(cardsTotal + b);
        } else if (acc.category === 'debt') {
            debtsTotal = round2(debtsTotal + b);
        } else {
            if (acc.id.startsWith('CxC_')) {
                cxcTotal = round2(cxcTotal + b);
            } else {
                assetsTotal = round2(assetsTotal + b);
            }
        }
    });

    if (financeData.fixedAssets) {
        financeData.fixedAssets.forEach(fa => {
            if (fa.status === 'active') {
                fixedAssetsTotal = round2(fixedAssetsTotal + fa.currentValue);
                if (fa.showInBalance !== false) {
                    visibleFixedAssetsTotal = round2(visibleFixedAssetsTotal + fa.currentValue);
                }
            }
        });
    }

    let allPocketsTotal = 0;
    if (financeData.pockets) {
        financeData.pockets.forEach(p => {
            const pBal = round2(p.principal || 0) + round2(p.yields || 0);
            allPocketsTotal = round2(allPocketsTotal + pBal);
            if (!p.excludeFromBalance) {
                pocketsTotal = round2(pocketsTotal + pBal);
            }
        });
    }

    const liabilitiesTotal = round2(cardsTotal + debtsTotal);
    const netWorth = round2(assetsTotal + cxcTotal + fixedAssetsTotal + pocketsTotal - liabilitiesTotal);

    return {
        bals,
        assetsTotal,
        cxcTotal,
        cardsTotal,
        debtsTotal,
        liabilitiesTotal,
        fixedAssetsTotal,
        visibleFixedAssetsTotal,
        pocketsTotal,
        allPocketsTotal,
        netWorth
    };
};

const simulateFutureLiquidity = (startMonthId, targetMonthId, initialLiquidity) => {
    let projectedLiquidity = initialLiquidity;
    let [sy, sm] = startMonthId.split('-').map(Number);
    let [ty, tm] = targetMonthId.split('-').map(Number);
    
    let currentIterDate = new Date(sy, sm - 1, 1);
    const targetDate = new Date(ty, tm - 1, 1);
    
    // Avanzar un mes para empezar a proyectar
    currentIterDate.setMonth(currentIterDate.getMonth() + 1);
    
    let monthsDiff = 0;
    let totalProjectedInc = 0;
    let totalProjectedExp = 0;

    // Calcular el promedio histórico como respaldo (para categorías sin presupuesto)
    const regularTrans = financeData.transactions.filter(t => t.type === 'expense' && !t.isAdjustment && isTxClosed(t));
    const monthsCount = new Set(regularTrans.map(t => t.monthId)).size || 1;
    const avgExpense = round2(regularTrans.reduce((s, t) => s + round2(t.amount), 0) / monthsCount);

    while (currentIterDate <= targetDate) {
        monthsDiff++;
        const iterYear = currentIterDate.getFullYear();
        const iterMonthIdx = currentIterDate.getMonth();
        const iterMonthId = getMonthId(currentIterDate);
        
        // 1. Ingresos Proyectados (Presupuesto + Nómina Base)
        let monthInc = 0;
        let hasIncomeBudget = false;
        if (financeData.categories && financeData.categories.income) {
            financeData.categories.income.forEach(c => {
                const limit = getCategoryLimitForMonth(c, iterMonthIdx, iterYear);
                if (limit > 0) hasIncomeBudget = true;
                monthInc += limit;
            });
        }
        // Si no hay presupuesto de ingresos, usar el salario neto actual
        if (!hasIncomeBudget) {
            const salStr = localStorage.getItem('myFinancesSalary');
            if (salStr) {
                const metrics = calculateLaborMetrics(JSON.parse(salStr), currentIterDate);
                monthInc = metrics.net;
                // Sumar prima en Junio (5) y Diciembre (11)
                if (iterMonthIdx === 5 || iterMonthIdx === 11) monthInc += metrics.halfPrimaNeta;
            }
        }
        
        // 2. Egresos Proyectados (Presupuesto Híbrido + Deudas)
        let monthExp = 0;
        let hasExpenseBudget = false;
        if (financeData.categories && financeData.categories.expense) {
             financeData.categories.expense.forEach(c => {
                 const limit = getCategoryLimitForMonth(c, iterMonthIdx, iterYear);
                 if (limit > 0) hasExpenseBudget = true;
                 monthExp += limit;
             });
        }
        
        // Obtener deudas comprometidas proyectadas para ese mes en particular
        // Para simplificar la proyección a largo plazo, usamos la foto actual de las deudas
        const snap = computeBalancesUpTo(startMonthId); 
        const committedDebt = getCommittedMonthlyDebtQuotas(snap);
        
        let effectiveExp = monthExp;
        if (!hasExpenseBudget && avgExpense > 0) {
            effectiveExp = avgExpense;
        }
        
        // Sumar las deudas al gasto proyectado
        effectiveExp = round2(effectiveExp + committedDebt);

        projectedLiquidity = round2(projectedLiquidity + monthInc - effectiveExp);
        totalProjectedInc += monthInc;
        totalProjectedExp += effectiveExp;
        
        currentIterDate.setMonth(currentIterDate.getMonth() + 1);
    }
    
    const avgInc = monthsDiff > 0 ? round2(totalProjectedInc / monthsDiff) : 0;
    const avgExp = monthsDiff > 0 ? round2(totalProjectedExp / monthsDiff) : 0;

    return {
        projectedLiquidity,
        monthsDiff,
        avgInc,
        avgExp,
        avgNet: round2(avgInc - avgExp)
    };
};

const getMonthlyFlow = (targetMonthId, includePending = false) => {
    let inc = 0, exp = 0;

    financeData.transactions.forEach(t => {
        if (t.monthId === targetMonthId && t.type !== 'transfer' && !t.isAdjustment) {
            if (includePending || isTxClosed(t)) {
                const val = t.status === 'pending' ? round2(t.budgetedAmount || t.amount) : round2(t.amount);
                if (t.type === 'income') {
                    inc = round2(inc + val);
                } else if (t.type === 'expense') {
                    exp = round2(exp + val);
                }
            }
        }
    });

    return { inc, exp, net: round2(inc - exp) };
};

// --- 6. AMORTIZACIÓN, TARJETAS DIFERIDAS, BNPL, SALUD FINANCIERA Y ENDEUDAMIENTO ---
const calculateAmortization = (principal, periods, rate, rateType) => {
    let monthlyRate = rate / 100;
    if (rateType === 'annual') {
        monthlyRate = Math.pow(1 + monthlyRate, 1 / 12) - 1;
    }

    let payment = 0;
    if (monthlyRate > 0 && periods > 0) {
        payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, periods)) / (Math.pow(1 + monthlyRate, periods) - 1);
    } else if (periods > 0) {
        payment = principal / periods;
    }

    let schedule = [];
    let balance = principal;
    let totalInterest = 0;

    for (let i = 1; i <= periods; i++) {
        let interest = balance * monthlyRate;
        let principalPayment = payment - interest;

        if (i === periods) {
            principalPayment = balance;
            payment = principalPayment + interest;
        }

        balance = balance - principalPayment;
        if (balance < 0) balance = 0;

        totalInterest += interest;
        schedule.push({
            period: i,
            payment: round2(payment),
            principal: round2(principalPayment),
            interest: round2(interest),
            balance: round2(balance)
        });
    }

    return {
        payment: round2(payment),
        schedule,
        monthlyRate,
        totalInterest: round2(totalInterest),
        totalWithInterest: round2(principal + totalInterest)
    };
};

const getPendingCardPurchases = (cardId) => {
    return financeData.transactions
        .filter(t => t.account === cardId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t))
        .map(t => {
            const inst = Math.max(1, parseInt(t.installments, 10) || 1);
            const paid = Math.max(0, parseInt(t.paidInstallments, 10) || 0);
            const rate = inst === 1 ? 0 : (parseFloat(t.rate) || 0);
            const rateType = t.rateType || 'monthly';
            const amort = calculateAmortization(round2(t.amount), inst, rate, rateType);
            const remSchedule = amort.schedule.slice(paid);
            const rawRemCapital = round2(remSchedule.reduce((s, r) => s + r.principal, 0));
            const remCapital = Math.max(0, round2(rawRemCapital - round2(t.extraPrincipalPaid || 0)));
            const nextQuota = remSchedule.length > 0 ? Math.min(remSchedule[0].payment, round2(remCapital + remSchedule[0].interest)) : 0;

            return {
                tx: t, installments: inst, paidInstallments: paid,
                remainingInstallments: Math.max(0, inst - paid),
                rate, rateType, zeroInterest: !!t.zeroInterest || rate === 0,
                nextPeriod: paid + 1, nextQuota: round2(nextQuota), remCapital
            };
        })
        .filter(item => item.remainingInstallments > 0 && item.remCapital > 0)
        .sort((a, b) => a.tx.id - b.tx.id);
};

const getPendingRevolvingPurchases = (debtId) => {
    return financeData.transactions
        .filter(t => t.account === debtId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t) && t.installments !== undefined)
        .map(t => {
            const inst = Math.max(1, parseInt(t.installments, 10) || 1);
            const paid = Math.max(0, parseInt(t.paidInstallments, 10) || 0);
            const rate = inst === 1 ? 0 : (parseFloat(t.rate) || 0);
            const rateType = t.rateType || 'monthly';
            const amort = calculateAmortization(round2(t.amount), inst, rate, rateType);
            const remSchedule = amort.schedule.slice(paid);
            const rawRemCapital = round2(remSchedule.reduce((s, r) => s + r.principal, 0));
            const remCapital = Math.max(0, round2(rawRemCapital - round2(t.extraPrincipalPaid || 0)));
            const nextInterest = remSchedule.length > 0 ? remSchedule[0].interest : 0;
            const rawQuota = (t.monthlyQuota && t.monthlyQuota > 0) ? round2(t.monthlyQuota) : (remSchedule.length > 0 ? remSchedule[0].payment : 0);
            const nextQuota = remSchedule.length > 0 ? Math.min(rawQuota, round2(remCapital + nextInterest)) : 0;
            const nextPrincipal = Math.min(remCapital, Math.max(0, round2(nextQuota - nextInterest)));

            return {
                tx: t, installments: inst, paidInstallments: paid,
                remainingInstallments: Math.max(0, inst - paid),
                rate, rateType, nextPeriod: paid + 1,
                nextQuota: round2(nextQuota),
                nextPrincipal: round2(nextPrincipal),
                nextInterest: round2(nextInterest),
                remCapital
            };
        })
        .filter(item => item.remainingInstallments > 0 && item.remCapital > 0)
        .sort((a, b) => a.tx.id - b.tx.id);
};

const getDebtMonthlyQuotaBreakdown = (debtAcc, currentBal) => {
    const bal = Math.max(0, round2(currentBal || 0));
    const subPurchases = getPendingRevolvingPurchases(debtAcc.id);
    const subQuotas = round2(subPurchases.reduce((s, p) => s + p.nextQuota, 0));
    const subCapital = round2(subPurchases.reduce((s, p) => s + p.remCapital, 0));
    const subPrincipal = round2(subPurchases.reduce((s, p) => s + p.nextPrincipal, 0));
    const subInterest = round2(subPurchases.reduce((s, p) => s + p.nextInterest, 0));

    let baseBal = 0;
    let baseQuota = 0;
    let basePrincipal = 0;
    let baseInterest = 0;

    if (debtAcc.debtType !== 'revolving') {
        baseBal = Math.max(0, round2(bal - subCapital));
        const totalQuotes = debtAcc.debtTotalQuotes || 1;
        const paidQuotes = debtAcc.debtPaidQuotes || 0;
        if (baseBal > 0 && paidQuotes < totalQuotes) {
            const amort = calculateAmortization(
                debtAcc.debtOriginal || baseBal,
                totalQuotes,
                debtAcc.debtRate || 0,
                debtAcc.debtRateType || 'monthly'
            );
            let q = round2(debtAcc.debtMonthlyPayment || 0);
            if (q === 0) q = amort.payment;
            baseInterest = round2(baseBal * amort.monthlyRate);
            baseQuota = Math.min(q, round2(baseBal + baseInterest));
            basePrincipal = Math.min(baseBal, Math.max(0, round2(baseQuota - baseInterest)));
        }
    }

    return {
        bal,
        baseBal,
        baseQuota,
        basePrincipal,
        baseInterest,
        subPurchases,
        subQuotas,
        subCapital,
        subPrincipal,
        subInterest,
        totalQuota: round2(baseQuota + subQuotas),
        totalPrincipal: round2(basePrincipal + subPrincipal),
        totalInterest: round2(baseInterest + subInterest)
    };
};

const revertTransferAllocation = (tx) => {
    if (!tx || tx.type !== 'transfer') return;
    if (isTxClosed(tx)) {
        const fromObj = getAccountObj(tx.account);
        const toObj = getAccountObj(tx.toAccount);
        const amt = round2(tx.amount);
        if (fromObj.category === 'pocket') adjustPocketBalance(fromObj.id, amt);
        if (toObj.category === 'pocket') adjustPocketBalance(toObj.id, -amt);
    }
    
    // Limpiar intereses generados automáticamente por esta transferencia
    financeData.transactions = financeData.transactions.filter(t => t.linkedToTransfer !== tx.id);

    if (!Array.isArray(tx.allocatedItems)) return;
    tx.allocatedItems.forEach(item => {
        if (item.kind === 'cc_tx') {
            const targetTx = financeData.transactions.find(t => String(t.id) === String(item.txId));
            if (targetTx) {
                if (item.mode === 'extraordinary') {
                    targetTx.extraPrincipalPaid = Math.max(0, round2((targetTx.extraPrincipalPaid || 0) - (item.amountApplied || 0)));
                    if (targetTx.paidInstallments > 0 && targetTx.wasClosedByExtra) {
                        targetTx.paidInstallments = Math.max(0, targetTx.paidInstallments - 1);
                        delete targetTx.wasClosedByExtra;
                    }
                } else {
                    targetTx.paidInstallments = Math.max(0, (targetTx.paidInstallments || 0) - 1);
                }
            }
        } else if (item.kind === 'debt_quota') {
            const debtAcc = financeData.customAccounts.find(a => a.id === item.debtId);
            if (debtAcc) {
                if (item.mode === 'extraordinary' && item.prevDebtState) {
                    debtAcc.debtTotalQuotes = item.prevDebtState.debtTotalQuotes;
                    debtAcc.debtMonthlyPayment = item.prevDebtState.debtMonthlyPayment;
                } else {
                    debtAcc.debtPaidQuotes = Math.max(0, (debtAcc.debtPaidQuotes || 0) - 1);
                }
            }
        }
    });
};

const getCardCycleActivity = (card, refDate = currentDate) => {
    const cDay = Math.max(1, Math.min(31, parseInt(card.cutoffDay, 10) || 15));
    const y = refDate.getFullYear();
    const m = refDate.getMonth();
    const daysInCurrMonth = new Date(y, m + 1, 0).getDate();

    let cycleStart, cycleEnd;
    if (refDate.getDate() <= cDay) {
        const prevMonthDays = new Date(y, m, 0).getDate();
        const prevCutoff = new Date(y, m - 1, Math.min(cDay, prevMonthDays), 23, 59, 59);
        cycleStart = new Date(prevCutoff.getTime() + 1000);
        cycleEnd = new Date(y, m, Math.min(cDay, daysInCurrMonth), 23, 59, 59);
    } else {
        const currCutoff = new Date(y, m, Math.min(cDay, daysInCurrMonth), 23, 59, 59);
        const nextMonthDays = new Date(y, m + 2, 0).getDate();
        cycleStart = new Date(currCutoff.getTime() + 1000);
        cycleEnd = new Date(y, m + 1, Math.min(cDay, nextMonthDays), 23, 59, 59);
    }

    let cycleSpend = 0;
    let cycleTxCount = 0;
    const startMs = cycleStart.getTime();
    const endMs = cycleEnd.getTime();

    financeData.transactions.forEach(t => {
        if (t.account === card.id && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)) {
            if (t.id >= startMs && t.id <= endMs) {
                cycleSpend = round2(cycleSpend + round2(t.amount));
                cycleTxCount++;
            }
        }
    });

    return { cycleStart, cycleEnd, cycleSpend, cycleTxCount };
};

const calculateCardMinPaymentEstimate = (card, currentDebt, refDate = currentDate) => {
    const debt = Math.max(0, round2(currentDebt || 0));
    const pending = getPendingCardPurchases(card.id);
    const deferredQuota = round2(pending.reduce((s, p) => s + p.nextQuota, 0));
    const deferredCapital = round2(pending.reduce((s, p) => s + p.remCapital, 0));
    const cycleInfo = getCardCycleActivity(card, refDate);

    // Saldo de deuda inicial (no asociado a compras diferidas registradas en la app)
    const unallocatedDebt = Math.max(0, round2(debt - deferredCapital));
    let initialQuotaApplied = 0;
    let isInitialFallback12m = false;

    if (unallocatedDebt > 0) {
        const customInitQuota = round2(card.initialDebtQuota || 0);
        if (customInitQuota > 0) {
            initialQuotaApplied = Math.min(unallocatedDebt, customInitQuota);
        } else {
            initialQuotaApplied = round2(unallocatedDebt / 12);
            isInitialFallback12m = true;
        }
    }

    // Cuota de manejo genérica (saldo o uso, solo saldo, fija, o exonerada por compras)
    let mgmtFeeAmt = 0;
    let mgmtFeeStatus = 'disabled';
    const hasMgmtFee = !!card.hasMgmtFee && round2(card.mgmtFee || 0) > 0;
    const mgmtFeeRule = card.mgmtFeeRule || (card.mgmtFeeOnlyWithDebt === false ? 'always' : 'balance_or_use');
    const waiverSpend = round2(card.mgmtFeeWaiverSpend || 0);

    if (hasMgmtFee) {
        const hasBalance = debt > 0;
        const hasUsage = cycleInfo.cycleTxCount > 0;
        let appliesByRule = false;

        if (mgmtFeeRule === 'always') appliesByRule = true;
        else if (mgmtFeeRule === 'balance_only') appliesByRule = hasBalance;
        else appliesByRule = hasBalance || hasUsage;

        if (!appliesByRule) {
            mgmtFeeStatus = 'no_activity';
        } else if (waiverSpend > 0 && cycleInfo.cycleSpend >= waiverSpend) {
            mgmtFeeStatus = 'waived';
        } else {
            mgmtFeeAmt = round2(card.mgmtFee);
            mgmtFeeStatus = 'charged';
        }
    }

    // Seguro de vida deudores genérico
    let insuranceAmt = 0;
    let insuranceDetailLabel = '';
    const hasInsurance = !!card.hasInsurance && round2(card.insurancePerMillion || 0) > 0;
    const insuranceRule = card.insuranceRule || 'per_million_min1';
    const insRate = round2(card.insurancePerMillion || 0);

    if (hasInsurance && debt > 0) {
        if (insuranceRule === 'fixed_if_debt') {
            insuranceAmt = insRate;
            insuranceDetailLabel = 'tarifa fija';
        } else if (insuranceRule === 'per_million_ceil') {
            const units = Math.max(1, Math.ceil(debt / 1000000));
            insuranceAmt = round2(units * insRate);
            insuranceDetailLabel = `${units}M fracción`;
        } else if (insuranceRule === 'per_million_exact') {
            const millions = debt / 1000000;
            insuranceAmt = round2(millions * insRate);
            insuranceDetailLabel = `${millions.toFixed(2).replace('.', ',')}M prop.`;
        } else {
            // Por millón adeudado con mínimo de 1 millón cuando 0 < deuda <= 1M
            const isMin1M = debt <= 1000000;
            const millions = isMin1M ? 1 : (debt / 1000000);
            insuranceAmt = round2(millions * insRate);
            insuranceDetailLabel = isMin1M ? 'mín. 1M' : `${millions.toFixed(2).replace('.', ',')}M prop.`;
        }
    }

    const totalMinPayment = round2(deferredQuota + initialQuotaApplied + mgmtFeeAmt + insuranceAmt);

    return {
        debt,
        cycleSpend: cycleInfo.cycleSpend,
        cycleTxCount: cycleInfo.cycleTxCount,
        deferredQuota,
        deferredCount: pending.length,
        unallocatedDebt,
        initialQuotaApplied,
        isInitialFallback12m,
        hasMgmtFee,
        mgmtFeeRule,
        mgmtFeeStatus,
        mgmtFeeAmt,
        hasInsurance,
        insuranceRule,
        insuranceDetailLabel,
        insuranceAmt,
        totalMinPayment
    };
};

const getCommittedMonthlyDebtQuotas = (snap) => {
    let committedMonthly = 0;

    // Solo sumar deudas que NO sean libranzas (las libranzas ya se restan del salario neto)
    financeData.customAccounts.filter(a => a.category === 'debt' && !a.payrollDeduction).forEach(d => {
        const bal = Math.max(0, round2(snap.bals[d.id] || 0));
        if (bal > 0) {
            const qInfo = getDebtMonthlyQuotaBreakdown(d, bal);
            committedMonthly = round2(committedMonthly + qInfo.totalQuota);
        }
    });

    financeData.customAccounts.filter(a => a.category === 'credit_card').forEach(c => {
        const bal = Math.max(0, round2(snap.bals[c.id] || 0));
        const est = calculateCardMinPaymentEstimate(c, bal);
        if (est.totalMinPayment > 0) {
            committedMonthly = round2(committedMonthly + est.totalMinPayment);
        }
    });

    return committedMonthly;
};

const calculateBorrowingCapacity = (monthId, customMaxPct = null) => {
    const snap = computeBalancesUpTo(monthId);
    const maxPct = customMaxPct !== null ? customMaxPct : (financeData.healthGoals?.debt || 30);

    let baseIncome = 0;
    let incomeSource = 'Mes actual';
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (salaryStr) {
        const cfg = JSON.parse(salaryStr);
        const metrics = calculateLaborMetrics(cfg, currentDate);
        if (metrics.grossNet > 0) {
            baseIncome = metrics.grossNet;
            incomeSource = 'Nómina neta';
        }
    }
    if (baseIncome <= 0) {
        baseIncome = getMonthlyFlow(monthId, false).inc;
    }

    const committedMonthly = getCommittedMonthlyDebtQuotas(snap);
    const maxMonthlyCapacity = round2(baseIncome * (maxPct / 100));
    const availableMonthlyCapacity = round2(maxMonthlyCapacity - committedMonthly);
    const usedPct = baseIncome > 0 ? round2((committedMonthly / baseIncome) * 100) : 0;

    const refRate = 0.015;
    const calcMaxPrincipal = (months) => {
        if (availableMonthlyCapacity <= 0) return 0;
        return round2(availableMonthlyCapacity * ((1 - Math.pow(1 + refRate, -months)) / refRate));
    };

    return {
        baseIncome, incomeSource, maxPct, usedPct, maxMonthlyCapacity,
        committedMonthly, availableMonthlyCapacity,
        estLoan24m: calcMaxPrincipal(24), estLoan36m: calcMaxPrincipal(36)
    };
};

const calculateFinancialHealth = (monthId, snap) => {
    const goals = financeData.healthGoals || { margin: 15, liquidity: 3, debt: 30, networth: 10 };
    const flow = getMonthlyFlow(monthId, false);

    // Patrimonio Total: Incluye CxC_ para visión realista de riqueza a largo plazo
    const totalAssets = round2(snap.assetsTotal + snap.cxcTotal + snap.fixedAssetsTotal + snap.allPocketsTotal);
    
    if (flow.inc === 0 && flow.exp === 0 && snap.assetsTotal === 0 && snap.liabilitiesTotal === 0 && snap.pocketsTotal === 0 && snap.fixedAssetsTotal === 0) {
        return {
            isNeutral: true,
            scores: { flow: 0, liquidity: 0, debt: 0, networth: 0, global: 0 },
            metrics: { margin: 0, monthsReserve: 0, daysReserve: 0, debtBurden: 0, netWorth: 0 },
            goals
        };
    }

    let margin = 0, scoreFlow = 0;
    if (flow.inc > 0) {
        margin = round2((flow.net / flow.inc) * 100);
        if (margin >= goals.margin) scoreFlow = 100;
        else scoreFlow = Math.max(0, Math.round((margin / goals.margin) * 100));
    }

    // Liquidez Inmediata: Excluye CxC_ (solo activos líquidos reales y bolsillos)
    const liquidAssets = round2(snap.assetsTotal + snap.allPocketsTotal);
    
    const monthlyDebtPayments = getCommittedMonthlyDebtQuotas(snap);

    // Proyección inteligente de gasto (Denominador Híbrido Realista)
    let totalBudget = 0;
    const [evalYear, evalMonth] = monthId.split('-').map(Number);
    const evalMonthIdx = evalMonth - 1;
    
    if (financeData.categories && financeData.categories.expense) {
         financeData.categories.expense.forEach(c => { totalBudget += getCategoryLimitForMonth(c, evalMonthIdx, evalYear); });
    }

    const regularTrans = financeData.transactions.filter(t => t.type === 'expense' && !t.isAdjustment && isTxClosed(t));
    const monthsCount = new Set(regularTrans.map(t => t.monthId)).size || 1;
    const avgExpense = round2(regularTrans.reduce((s, t) => s + round2(t.amount), 0) / monthsCount);

    // Híbrido: el mayor entre lo comprometido (presupuesto + deudas), promedio histórico, o ejecución real del mes
    const committedOutflow = round2(totalBudget + monthlyDebtPayments);
    let effectiveExp = Math.max(committedOutflow, round2(avgExpense + monthlyDebtPayments), round2(flow.exp + monthlyDebtPayments));
    
    if (effectiveExp === 0) {
        const salStr = localStorage.getItem('myFinancesSalary');
        effectiveExp = salStr ? round2((JSON.parse(salStr).basicSalary || 1000000) * 0.5) : 1000000;
    }

    const monthsReserve = round2(liquidAssets / effectiveExp);
    const daysReserve = Math.floor(monthsReserve * 30);
    
    let scoreLiq = 0;
    if (monthsReserve >= goals.liquidity) scoreLiq = 100;
    else scoreLiq = Math.max(0, Math.round((monthsReserve / goals.liquidity) * 100));

    // Proyección inteligente de Ingresos (para evitar el falso 100% a inicio de mes)
    let effectiveInc = flow.inc;
    if (effectiveInc === 0) {
        let totalIncBudget = 0;
        if (financeData.categories && financeData.categories.income) {
            financeData.categories.income.forEach(c => { totalIncBudget += getCategoryLimitForMonth(c, evalMonthIdx, evalYear); });
        }
        const salStr = localStorage.getItem('myFinancesSalary');
        const baseSalary = salStr ? (JSON.parse(salStr).basicSalary || 0) : 0;
        effectiveInc = totalIncBudget > 0 ? totalIncBudget : baseSalary;
    }

    // Recálculo del Flujo de Caja con datos efectivos
    let realMargin = 0;
    let realScoreFlow = 0;
    if (effectiveInc > 0) {
        realMargin = round2(((effectiveInc - effectiveExp) / effectiveInc) * 100);
        if (realMargin >= goals.margin) realScoreFlow = 100;
        else if (realMargin < 0) realScoreFlow = 0;
        else realScoreFlow = Math.max(0, Math.round((realMargin / goals.margin) * 100));
    }

    let debtBurden = 0, scoreDebt = 100;

    // La deuda se mide contra tu ingreso efectivo (real o proyectado)
    if (effectiveInc > 0) {
        debtBurden = round2((monthlyDebtPayments / effectiveInc) * 100);
        if (debtBurden <= goals.debt) scoreDebt = 100;
        else if (debtBurden >= 60) scoreDebt = 0;
        else scoreDebt = Math.max(0, 100 - Math.round(((debtBurden - goals.debt) / (60 - goals.debt)) * 100));
    } else if (monthlyDebtPayments > 0) {
        scoreDebt = 0; 
    }

    let scoreNw = 0;
    if (totalAssets > 0) {
        const liabilityRatio = (snap.liabilitiesTotal / totalAssets) * 100;
        if (liabilityRatio === 0) scoreNw = 100;
        else if (liabilityRatio >= 100) scoreNw = 0;
        else scoreNw = Math.max(0, 100 - Math.round(liabilityRatio));
    } else if (snap.liabilitiesTotal > 0) {
        scoreNw = 0; 
    }

    const globalScore = Math.round((realScoreFlow + scoreLiq + scoreDebt + scoreNw) / 4);

    return {
        isNeutral: false,
        scores: { flow: realScoreFlow, liquidity: scoreLiq, debt: scoreDebt, networth: scoreNw, global: globalScore },
        metrics: { 
            margin: realMargin, 
            monthsReserve,
            daysReserve,
            debtBurden, 
            netWorth: snap.netWorth, 
            effectiveExp,
            effectiveInc,
            monthlyDebtPayments,
            totalAssets,
            totalLiabilities: snap.liabilitiesTotal
        },
        goals
    };
};

// --- 7. PARÁMETROS TRIBUTARIOS, NÓMINA COLOMBIA Y LIQUIDACIÓN ---
const DEFAULT_TAX_PARAMS_2026 = {
    year: 2026,
    uvt: 52374,
    smmlv: 1750905,
    transportAid: 249095,
    exempt25AnnualUvt: 790,
    global40AnnualUvt: 1340,
    prepaidMonthlyUvt: 16,
    dependentsMonthlyUvt: 32,
    housingMonthlyUvt: 100,
    voluntaryAnnualUvt: 3800,
    nonSalaryCapPct: 40,
    fspSmmlvThreshold: 4
};

const getTaxParams = () => {
    const stored = JSON.parse(localStorage.getItem('myFinancesTaxParams') || 'null');
    if (stored) return { ...DEFAULT_TAX_PARAMS_2026, ...stored };
    const salStr = localStorage.getItem('myFinancesSalary');
    if (salStr) {
        const sCfg = JSON.parse(salStr);
        return {
            ...DEFAULT_TAX_PARAMS_2026,
            smmlv: parseMoneyInput(sCfg.smmlv) || DEFAULT_TAX_PARAMS_2026.smmlv,
            transportAid: parseMoneyInput(sCfg.transportAid) || DEFAULT_TAX_PARAMS_2026.transportAid
        };
    }
    return { ...DEFAULT_TAX_PARAMS_2026 };
};

const saveTaxParams = (params) => {
    const merged = { ...DEFAULT_TAX_PARAMS_2026, ...params };
    localStorage.setItem('myFinancesTaxParams', JSON.stringify(merged));
    return merged;
};

const getPocketPayrollMonthlyQuota = (pocket, refDate = currentDate) => {
    if (!pocket || !pocket.payrollDeduction) return 0;
    const refMonthId = getMonthId(refDate);
    if (pocket.startDate && pocket.startDate.slice(0, 7) > refMonthId) return 0;

    const balance = round2((pocket.principal || 0) + (pocket.yields || 0));
    const goal = round2(pocket.goal || 0);
    const customQuota = round2(pocket.customQuota || 0);

    if (goal > 0) {
        const remaining = Math.max(0, round2(goal - balance));
        if (remaining <= 0) return 0;

        let activeQuota = customQuota;
        if (activeQuota <= 0 && pocket.targetDate) {
            const refStr = refDate.toLocaleDateString('en-CA');
            const effStart = (pocket.startDate && pocket.startDate > refStr) ? pocket.startDate : refStr;
            const [sy, sm, sd] = effStart.split('-').map(Number);
            const [ey, em, ed] = pocket.targetDate.split('-').map(Number);
            const monthsLeft = Math.max(1, (ey - sy) * 12 + (em - sm) + (ed > sd ? 1 : 0));
            activeQuota = round2(remaining / monthsLeft);
        }
        return activeQuota > 0 ? Math.min(remaining, activeQuota) : 0;
    }

    return customQuota > 0 ? customQuota : 0;
};

const calcArt383TableUVT = (uvtBase) => {
    if (uvtBase <= 95) return 0;
    if (uvtBase <= 150) return (uvtBase - 95) * 0.19;
    if (uvtBase <= 360) return (uvtBase - 150) * 0.28 + 10;
    if (uvtBase <= 640) return (uvtBase - 360) * 0.33 + 69;
    if (uvtBase <= 945) return (uvtBase - 640) * 0.35 + 162;
    if (uvtBase <= 2300) return (uvtBase - 945) * 0.37 + 268;
    return (uvtBase - 2300) * 0.39 + 770;
};

const calculateLaborMetrics = (config, today = new Date(), customParams = null, overrideTransport = null) => {
    const params = customParams || getTaxParams();
    const uvt = round2(params.uvt || 52374);
    const smmlv = round2(params.smmlv || 1750905);
    const rawTransport = round2(params.transportAid || 249095);

    const basic = round2(config.basicSalary || 0);
    const nonSalary = round2(config.nonSalary || 0);

    const totalRemuneration = round2(basic + nonSalary);
    const nonSalaryCapRatio = (params.nonSalaryCapPct || 40) / 100;
    const maxNonSalary = round2(totalRemuneration * nonSalaryCapRatio);
    const excessNonSalary = nonSalary > maxNonSalary ? round2(nonSalary - maxNonSalary) : 0;
    const ibc = round2(basic + excessNonSalary);

    const isEligibleTransport = (config.transportAuto !== false) ? (basic > 0 && basic <= round2(smmlv * 2)) : (basic > 0);
    const payTransportInNet = config.transportPayNet !== undefined ? !!config.transportPayNet : true;
    const includeTransportInBenefits = config.transportInBenefits !== undefined ? !!config.transportInBenefits : true;

    const effectiveTransport = overrideTransport !== null ? round2(overrideTransport) : ((isEligibleTransport && payTransportInNet) ? rawTransport : 0);
    const benefitsTransport = (isEligibleTransport && includeTransportInBenefits) ? rawTransport : 0;

    const health = round2(ibc * 0.04);
    const pension = round2(ibc * 0.04);

    let fsp = 0;
    const fspThreshold = round2(smmlv * (params.fspSmmlvThreshold || 4));
    if (ibc >= fspThreshold && smmlv > 0) {
        if (ibc < round2(smmlv * 16)) fsp = ibc * 0.01;
        else if (ibc < round2(smmlv * 17)) fsp = ibc * 0.012;
        else if (ibc < round2(smmlv * 18)) fsp = ibc * 0.014;
        else if (ibc < round2(smmlv * 19)) fsp = ibc * 0.016;
        else if (ibc < round2(smmlv * 20)) fsp = ibc * 0.018;
        else fsp = ibc * 0.02;
    }
    fsp = round2(fsp);

    const ingresosBrutos = round2(basic + nonSalary);
    const incrngo = round2(health + pension + fsp);
    const rentaLiquida = Math.max(0, round2(ingresosBrutos - incrngo));

    const dedPrepaid = Math.min(round2(config.dedPrepaid || 0), round2((params.prepaidMonthlyUvt || 16) * uvt));
    const dedHousing = Math.min(round2(config.dedHousing || 0), round2((params.housingMonthlyUvt || 100) * uvt));
    const dedDependents = config.dedDependents ? Math.min(round2(ingresosBrutos * 0.10), round2((params.dependentsMonthlyUvt || 32) * uvt)) : 0;
    const dedVoluntary = Math.min(round2(config.dedVoluntary || 0), Math.min(round2(ingresosBrutos * 0.30), round2(((params.voluntaryAnnualUvt || 3800) / 12) * uvt)));
    const totalDeduccionesArt387 = round2(dedPrepaid + dedHousing + dedDependents);
    const baseNeta25 = Math.max(0, round2(rentaLiquida - totalDeduccionesArt387 - dedVoluntary));

    const exempt25MonthlyCapCOP = round2(((params.exempt25AnnualUvt || 790) / 12) * uvt);
    const exempt25 = Math.min(round2(baseNeta25 * 0.25), exempt25MonthlyCapCOP);
    const totalBeneficiosBrutos = round2(totalDeduccionesArt387 + dedVoluntary + exempt25);
    const globalUvtMonthlyCapCOP = round2(((params.global40AnnualUvt || 1340) / 12) * uvt);
    const beneficiosLimitados = Math.min(totalBeneficiosBrutos, round2(rentaLiquida * 0.40), globalUvtMonthlyCapCOP);

    const baseGravable = Math.max(0, round2(rentaLiquida - beneficiosLimitados));
    const numeroUVT = uvt > 0 ? round2(baseGravable / uvt) : 0;
    const retProc = config.retProc !== undefined ? String(config.retProc) : '1';

    let ret = 0, effectiveRetPct = 0;
    if (retProc === '1') {
        ret = round2(calcArt383TableUVT(numeroUVT) * uvt);
        effectiveRetPct = baseGravable > 0 ? round2((ret / baseGravable) * 100) : 0;
    } else if (retProc === '2') {
        effectiveRetPct = round2(config.retPct || 0);
        ret = round2(baseGravable * (effectiveRetPct / 100));
    }

    let payrollDebtDeductions = 0;
    const targetMonthId = getMonthId(today); // Proyecta acorde al mes visualizado
    
    financeData.customAccounts.filter(a => a.category === 'debt' && a.payrollDeduction).forEach(d => {
        const bal = round2(financeData.transactions.filter(t => (t.account === d.id || t.toAccount === d.id) && t.monthId <= targetMonthId && isTxClosed(t)).reduce((s, t) => {
            if (t.account === d.id) return s + (t.type === 'income' ? -t.amount : t.amount);
            if (t.type === 'transfer' && t.toAccount === d.id) return s - t.amount;
            return s;
        }, 0));
        
        if (bal > 0) {
            const qInfo = getDebtMonthlyQuotaBreakdown(d, bal);
            payrollDebtDeductions = round2(payrollDebtDeductions + qInfo.totalQuota);
        }
    });

    let payrollSavingsDeductions = 0;
    (financeData.pockets || []).filter(p => p.payrollDeduction).forEach(p => {
        const pQuota = getPocketPayrollMonthlyQuota(p, today);
        if (pQuota > 0) {
            payrollSavingsDeductions = round2(payrollSavingsDeductions + pQuota);
        }
    });

    const totalPayrollDeductions = round2(payrollDebtDeductions + payrollSavingsDeductions);
    const grossNet = round2(basic + effectiveTransport + nonSalary - health - pension - fsp - ret);
    const net = Math.max(0, round2(grossNet - totalPayrollDeductions));

    const biweeklyRetMode = config.biweeklyRetMode || 'prorated';
    const gross1Q = round2((basic + effectiveTransport + nonSalary) / 2);
    const gross2Q = round2((basic + effectiveTransport + nonSalary) - gross1Q);

    const ssTotal = round2(health + pension + fsp);
    const ss1Q = round2(ssTotal / 2);
    const ss2Q = round2(ssTotal - ss1Q);

    const ret1Q = biweeklyRetMode === 'second_half' ? 0 : round2(ret / 2);
    const ret2Q = biweeklyRetMode === 'second_half' ? ret : round2(ret - ret1Q);

    const ded1Q = round2(totalPayrollDeductions / 2);
    const ded2Q = round2(totalPayrollDeductions - ded1Q);

    const net1Q = Math.max(0, round2(gross1Q - ss1Q - ret1Q - ded1Q));
    const net2Q = Math.max(0, round2(gross2Q - ss2Q - ret2Q - ded2Q));

    let startObj = new Date(today.getFullYear(), 0, 1);
    if (config.startDate) {
        const [sy, sm, sd] = config.startDate.split('-').map(Number);
        startObj = new Date(sy, sm - 1, sd);
    }

    const currentYear = today.getFullYear();
    const currentMonthIdx = today.getMonth();
    const startOfYear = new Date(currentYear, 0, 1);
    const daysYear = startObj > today ? 0 : calcCommercialDays(startObj > startOfYear ? startObj : startOfYear, today);
    const semStartMonth = currentMonthIdx < 6 ? 0 : 6;
    const semStart = new Date(currentYear, semStartMonth, 1);
    const daysSemester = startObj > today ? 0 : calcCommercialDays(startObj > semStart ? startObj : semStart, today);
    const daysTotalContract = startObj > today ? 0 : calcCommercialDays(startObj, today);

    // Motor de Promedios Salariales (Art. 253, 306 y 192 CST Colombia)
    const baseMensualEstandar = round2(basic + benefitsTransport);
    let variableIncomeSemester = 0;
    let variableIncomeYear = 0;
    
    financeData.transactions.forEach(t => {
        if (t.type === 'income' && t.category && stripLeadingEmoji(t.category).toLowerCase().includes('nómina') && isTxClosed(t) && t.monthId) {
            const [ty, tm] = t.monthId.split('-').map(Number);
            if (ty === currentYear) {
                const mIdx = tm - 1;
                const isBaseSalary = t.description.toLowerCase().includes('nómina') && (t.subcategory === 'General' || !t.subcategory);
                if (!isBaseSalary) {
                    variableIncomeYear += round2(t.amount);
                    if (mIdx >= semStartMonth && mIdx <= currentMonthIdx) variableIncomeSemester += round2(t.amount);
                }
            }
        }
    });

    let raiseStartObj = null;
    let oldMonthlyBase = 0;
    let isRetroApplied = false;
    if (config.lastRaise && config.lastRaise.effectiveMonth && config.lastRaise.oldBasic > 0) {
        const sched = config.raiseSchedule || {};
        const useRetroDate = !!(config.lastRaise.isRetro || sched.isRetro);
        const startMonthStr = useRetroDate
            ? (config.lastRaise.retroFromMonth || sched.retroFromMonth || config.lastRaise.effectiveMonth)
            : config.lastRaise.effectiveMonth;
        const startPeriodStr = useRetroDate
            ? (config.lastRaise.retroFromPeriod || sched.retroFromPeriod || config.lastRaise.effectivePeriod)
            : config.lastRaise.effectivePeriod;

        const [ry, rm] = startMonthStr.split('-').map(Number);
        const effDay = startPeriodStr === '2Q' ? 16 : 1;
        raiseStartObj = new Date(ry, rm - 1, effDay);
        isRetroApplied = useRetroDate && startMonthStr !== config.lastRaise.effectiveMonth;

        const oldEligibleTransp = (config.transportAuto !== false)
            ? (config.lastRaise.oldBasic > 0 && config.lastRaise.oldBasic <= round2(smmlv * 2))
            : (config.lastRaise.oldBasic > 0);
        const oldBenefitsTransp = (oldEligibleTransp && includeTransportInBenefits) ? rawTransport : 0;
        oldMonthlyBase = round2(config.lastRaise.oldBasic + oldBenefitsTransp);
    }

    const calcWeightedBaseBetween = (periodStart, periodEnd, totalDays) => {
        if (!raiseStartObj || oldMonthlyBase <= 0 || totalDays <= 0 || raiseStartObj <= periodStart) {
            return { avgBase: baseMensualEstandar, usedAverage: false, oldDays: 0, newDays: totalDays };
        }
        if (raiseStartObj > periodEnd) {
            return { avgBase: oldMonthlyBase, usedAverage: false, oldDays: totalDays, newDays: 0 };
        }
        const dayBeforeRaise = new Date(raiseStartObj.getFullYear(), raiseStartObj.getMonth(), raiseStartObj.getDate() - 1);
        const oldDays = Math.min(totalDays, calcCommercialDays(periodStart, dayBeforeRaise));
        const newDays = Math.max(0, totalDays - oldDays);
        if (oldDays <= 0) {
            return { avgBase: baseMensualEstandar, usedAverage: false, oldDays: 0, newDays: totalDays };
        }
        const avgBase = round2(((oldMonthlyBase * oldDays) + (baseMensualEstandar * newDays)) / totalDays);
        return { avgBase, usedAverage: true, oldDays, newDays };
    };

    const workedMonthsSem = Math.max(1, currentMonthIdx - semStartMonth + 1);
    const workedMonthsYear = Math.max(1, currentMonthIdx + 1);

    // 1. Base Prima Proporcional (Art. 306 CST: promedio ponderado del semestre)
    const effSemStart = startObj > semStart ? startObj : semStart;
    const semWeighted = calcWeightedBaseBetween(effSemStart, today, daysSemester);
    const primaBase = round2(semWeighted.avgBase + (variableIncomeSemester / workedMonthsSem));
    const usedPrimaAverage = semWeighted.usedAverage || variableIncomeSemester > 0;

    // 2. Base Cesantías Proporcionales (Art. 253 CST: promedio anual si varió en los últimos 3 meses)
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    const variedLast3Months = !!(raiseStartObj && raiseStartObj > threeMonthsAgo && raiseStartObj <= today);
    const effYearStart = startObj > startOfYear ? startObj : startOfYear;
    const yearWeighted = variedLast3Months
        ? calcWeightedBaseBetween(effYearStart, today, daysYear)
        : { avgBase: baseMensualEstandar, usedAverage: false, oldDays: 0, newDays: daysYear };
    const cesantiasBase = round2(yearWeighted.avgBase + (variableIncomeYear / workedMonthsYear));
    const usedCesantiasAverage = yearWeighted.usedAverage || variableIncomeYear > 0;

    // 3. Bases para Proyección Anual (Semestre 1, Semestre 2 y Año completo al 30 de dic.)
    const jun30 = new Date(currentYear, 5, 30);
    const jul1 = new Date(currentYear, 6, 1);
    const dec30 = new Date(currentYear, 11, 30);
    const calcNetHalfPrimaFromBase = (pBase) => {
        const halfBruta = round2(pBase / 2);
        const ex25 = Math.min(round2(halfBruta * 0.25), exempt25MonthlyCapCOP, globalUvtMonthlyCapCOP);
        const grav = Math.max(0, round2(halfBruta - ex25));
        const pUvt = uvt > 0 ? round2(grav / uvt) : 0;
        let rP = 0;
        if (retProc === '1') rP = round2(calcArt383TableUVT(pUvt) * uvt);
        else if (retProc === '2') rP = round2(grav * (effectiveRetPct / 100));
        return { halfBruta, retPrima: rP, halfNeta: Math.max(0, round2(halfBruta - rP)) };
    };

    const effSem1Start = startObj > startOfYear ? startObj : startOfYear;
    const sem1DaysFull = startObj > jun30 ? 0 : calcCommercialDays(effSem1Start, jun30);
    const projPrimaJunBase = round2(calcWeightedBaseBetween(effSem1Start, jun30, sem1DaysFull).avgBase);
    const primaJunCalc = calcNetHalfPrimaFromBase(projPrimaJunBase);

    const effSem2Start = startObj > jul1 ? startObj : jul1;
    const sem2DaysFull = startObj > dec30 ? 0 : calcCommercialDays(effSem2Start, dec30);
    const projPrimaDecBase = round2(calcWeightedBaseBetween(effSem2Start, dec30, sem2DaysFull).avgBase + (variableIncomeSemester / 6));
    const primaDecCalc = calcNetHalfPrimaFromBase(projPrimaDecBase);

    const fullYearDays = startObj > dec30 ? 0 : calcCommercialDays(effYearStart, dec30);
    const sep30 = new Date(currentYear, 8, 30);
    const variedBeforeYearEnd = !!(raiseStartObj && raiseStartObj > sep30 && raiseStartObj <= dec30);
    const projCesantiasBase = round2((variedBeforeYearEnd
        ? calcWeightedBaseBetween(effYearStart, dec30, fullYearDays).avgBase
        : baseMensualEstandar) + (variableIncomeYear / 12));

    const halfPrimaBruta = primaDecCalc.halfBruta;
    const retPrima = primaDecCalc.retPrima;
    const halfPrimaNeta = primaDecCalc.halfNeta;

    const liqPrima = round2((primaBase * daysSemester) / 360);
    const liqCesantias = round2((cesantiasBase * daysYear) / 360);
    const liqIntereses = round2((liqCesantias * daysYear * 0.12) / 360);

    const vacDaysEarned = round2((daysTotalContract * 15) / 360);
    const vacDaysTaken = Math.max(0, round2(config.vacDaysTaken || 0));
    const vacDaysPending = Math.max(0, round2(vacDaysEarned - vacDaysTaken));
    const liqVacaciones = round2((basic * vacDaysPending) / 30);

    let advPrima = 0, advCes = 0, advInt = 0;
    financeData.transactions.forEach(t => {
        if (t.type === 'income' && isTxClosed(t)) {
            const txDate = new Date(t.id);
            if (txDate.getFullYear() === currentYear) {
                if (t.benefitType === 'prima') { if (txDate >= semStart) advPrima = round2(advPrima + t.amount); }
                else if (t.benefitType === 'intereses_cesantias') advInt = round2(advInt + t.amount);
                else if (t.benefitType === 'cesantias') advCes = round2(advCes + t.amount);
            }
        }
    });

    return {
        params, uvt, smmlv, basic, nonSalary, excessNonSalary, ibc, effectiveTransport, benefitsTransport, health, pension, fsp,
        ingresosBrutos, incrngo, rentaLiquida, dedPrepaid, dedHousing, dedDependents, dedVoluntary, totalDeduccionesArt387,
        exempt25, totalBeneficiosBrutos, beneficiosLimitados, baseGravable, numeroUVT, retProc, effectiveRetPct, ret,
        net, grossNet, payrollDebtDeductions, payrollSavingsDeductions, biweeklyRetMode, gross1Q, gross2Q, ss1Q, ss2Q, ret1Q, ret2Q, net1Q, net2Q,
        prestacionesBase: projCesantiasBase, primaBase, cesantiasBase,
        projPrimaJunBase, projPrimaDecBase, projCesantiasBase,
        halfPrimaJunNeta: primaJunCalc.halfNeta, halfPrimaDecNeta: primaDecCalc.halfNeta,
        usedPrimaAverage, usedCesantiasAverage, semWeighted, yearWeighted, oldMonthlyBase, isRetroApplied,
        halfPrimaBruta, retPrima, halfPrimaNeta, daysYear, daysSemester, daysTotalContract, startObj, currentYear,
        vacDaysEarned, vacDaysTaken, vacDaysPending, liqVacaciones,
        liqPrima: Math.max(0, round2(liqPrima - advPrima)),
        liqCesantias: Math.max(0, round2(liqCesantias - advCes)),
        liqIntereses: Math.max(0, round2(liqIntereses - advInt))
    };
};

const simulateExtraBonus = (config, bonusAmount, bonusType = 'non_salary', customParams = null) => {
    const bonus = Math.max(0, round2(bonusAmount));
    const params = customParams || getTaxParams();
    const baseMetrics = calculateLaborMetrics(config, new Date(), params);

    if (bonus <= 0) {
        return {
            bonus: 0, bonusType, baseMetrics, simMetrics: baseMetrics,
            deltaHealth: 0, deltaPension: 0, deltaFsp: 0, deltaSS: 0, deltaRet: 0,
            totalDeductions: 0, netBonus: 0, effectiveTaxRate: 0,
            crossedFsp: false, triggeredLey1393: false, deltaExcessLey1393: 0
        };
    }

    const simConfig = bonusType === 'salary'
        ? { ...config, basicSalary: round2((config.basicSalary || 0) + bonus) }
        : { ...config, nonSalary: round2((config.nonSalary || 0) + bonus) };

    const simMetrics = calculateLaborMetrics(simConfig, new Date(), params, baseMetrics.effectiveTransport);

    const deltaHealth = round2(simMetrics.health - baseMetrics.health);
    const deltaPension = round2(simMetrics.pension - baseMetrics.pension);
    const deltaFsp = round2(simMetrics.fsp - baseMetrics.fsp);
    const deltaSS = round2(deltaHealth + deltaPension + deltaFsp);
    const deltaRet = round2(simMetrics.ret - baseMetrics.ret);

    const totalDeductions = round2(deltaSS + deltaRet);
    const netBonus = round2(bonus - totalDeductions);
    const effectiveTaxRate = round2((totalDeductions / bonus) * 100);
    const deltaExcessLey1393 = Math.max(0, round2(simMetrics.excessNonSalary - baseMetrics.excessNonSalary));

    return {
        bonus, bonusType, baseMetrics, simMetrics,
        deltaHealth, deltaPension, deltaFsp, deltaSS, deltaRet,
        totalDeductions, netBonus, effectiveTaxRate,
        crossedFsp: baseMetrics.fsp === 0 && simMetrics.fsp > 0,
        triggeredLey1393: deltaExcessLey1393 > 0,
        deltaExcessLey1393
    };
};

/// --- 8. GENERADOR DE RECORDATORIOS iOS (.ICS VCALENDAR) ---
const generateICSBlob = (title, description, dateObj) => {
    const pad = (n) => n < 10 ? '0' + n : n;
    const formatDateStr = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    const dtstart = formatDateStr(dateObj);
    const endObj = new Date(dateObj.getTime() + 30 * 60000);
    const dtend = formatDateStr(endObj);

    const icsData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Mis Finanzas//v4.1.0//ES',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@misfinanzas.local`,
        `DTSTAMP:${formatDateStr(new Date())}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:Recordatorio: ${title}`,
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    return new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
};

// --- 9. UTILIDADES DE FECHAS Y PALETAS DE TEMAS ---
const getMonthId = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const getShortMonthLabel = (date) => date.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
const formatMonthName = (date) => date.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }).replace('.', '');
const getAssetEmoji = (cat) => ({ 'Inmueble': '🏠', 'Vehículo': '🚗', 'Inversión': '📈', 'Tecnología': '💻', 'Coleccionable': '💎', 'Otro': '📦' }[cat] || '📦');

const calcCommercialDays = (sD, eD) => {
    if (sD > eD) return 0;
    return Math.max(0, (eD.getFullYear() - sD.getFullYear()) * 360 + (eD.getMonth() - sD.getMonth()) * 30 + (Math.min(30, eD.getDate()) - Math.min(30, sD.getDate())) + 1);
};

const advanceDateByRecurrence = (base, rec, step) => {
    const d = new Date(base.getTime());
    if (rec === 'biweekly') d.setDate(d.getDate() + 15 * step);
    else if (rec === 'monthly') d.setMonth(d.getMonth() + step);
    else if (rec === 'bimonthly') d.setMonth(d.getMonth() + 2 * step);
    else if (rec === 'quarterly') d.setMonth(d.getMonth() + 3 * step);
    else if (rec === 'annual') d.setFullYear(d.getFullYear() + step);
    return d;
};

const shadeColor = (color, percent) => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);
    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);
    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;
    const rHex = (R.toString(16).length == 1) ? '0' + R.toString(16) : R.toString(16);
    const gHex = (G.toString(16).length == 1) ? '0' + G.toString(16) : G.toString(16);
    const bHex = (B.toString(16).length == 1) ? '0' + B.toString(16) : B.toString(16);
    return '#' + rHex + gHex + bHex;
};

const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : null;
};

const getThemeColors = (themeValue) => {
    const themes = {
        blue: { accent: '#007aff', gradient: 'linear-gradient(135deg, #007aff, #005bb5)', shadow: 'rgba(0, 122, 255, 0.35)' },
        purple: { accent: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', shadow: 'rgba(139, 92, 246, 0.35)' },
        green: { accent: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.35)' },
        orange: { accent: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245, 158, 11, 0.35)' },
        pink: { accent: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)', shadow: 'rgba(236, 72, 153, 0.35)' },
        dark: { accent: '#475569', gradient: 'linear-gradient(135deg, #475569, #1e293b)', shadow: 'rgba(71, 85, 105, 0.35)' }
    };
    if (themes[themeValue]) return themes[themeValue];
    if (themeValue && themeValue.startsWith('#')) {
        return {
            accent: themeValue,
            gradient: `linear-gradient(135deg, ${themeValue}, ${shadeColor(themeValue, -20)})`,
            shadow: `rgba(${hexToRgb(themeValue) || '0,0,0'}, 0.35)`
        };
    }
    return themes.purple;
};

const assetColors = ['#0f4c81', '#0d9488', '#0284c7', '#059669', '#4f46e5', '#64748b', '#0891b2', '#2563eb'];
const cardColors = ['#4f46e5', '#0284c7', '#7c3aed', '#0d9488', '#db2777', '#2563eb', '#059669', '#d97706'];
const debtColors = ['#e11d48', '#d97706', '#dc2626', '#ea580c', '#be185d', '#b91c1c', '#9333ea', '#64748b'];
const categoryColors = ['#007aff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

// --- COMPRESIÓN LOCAL: CIERRE DE AÑO ---
window.archiveYearData = (targetYear) => {
    const cutoffMonthId = `${targetYear}-12`;
    const txsToDelete = [];
    const txsToKeep = [];

    financeData.transactions.forEach(t => {
        if (t.monthId <= cutoffMonthId && t.status === 'closed') {
            // Proteger compras a cuotas diferidas que aún no se pagan por completo
            const isDeferred = t.installments > 1;
            const isFullyPaid = isDeferred && ((t.paidInstallments || 0) >= t.installments);
            
            if (isDeferred && !isFullyPaid) {
                txsToKeep.push(t);
            } else {
                txsToDelete.push(t);
            }
        } else {
            txsToKeep.push(t);
        }
    });

    if (txsToDelete.length === 0) return { deleted: 0 };

    const netImpact = {};
    txsToDelete.forEach(t => {
        const amt = round2(t.amount);
        const fromCat = getAccountObj(t.account).category;
        
        if (fromCat !== 'pocket') { // Los bolsillos se auto-consolidan
            if (!netImpact[t.account]) netImpact[t.account] = 0;
            const isLiab = isLiabilityCategory(fromCat);
            if (t.type === 'income') netImpact[t.account] += isLiab ? -amt : amt;
            else if (t.type === 'expense') netImpact[t.account] += isLiab ? amt : -amt;
            else if (t.type === 'transfer') netImpact[t.account] += isLiab ? amt : -amt;
        }

        if (t.type === 'transfer' && t.toAccount) {
            const toCat = getAccountObj(t.toAccount).category;
            if (toCat !== 'pocket') {
                if (!netImpact[t.toAccount]) netImpact[t.toAccount] = 0;
                const isToLiab = isLiabilityCategory(toCat);
                netImpact[t.toAccount] += isToLiab ? -amt : amt;
            }
        }
    });

    const consolidationDate = new Date(`${targetYear}-12-31T12:00:00`);
    let addedCount = 0;

    Object.keys(netImpact).forEach((accId, i) => {
        const impact = round2(netImpact[accId]);
        if (impact !== 0) {
            const isLiab = isLiabilityCategory(getAccountObj(accId).category);
            let tType = 'income';
            if (isLiab) tType = impact > 0 ? 'expense' : 'income'; 
            else tType = impact > 0 ? 'income' : 'expense'; 

            txsToKeep.push({
                id: consolidationDate.getTime() + i,
                monthId: cutoffMonthId,
                type: tType,
                status: 'closed',
                account: accId,
                description: `📦 Saldo Consolidado Cierre ${targetYear}`,
                amount: Math.abs(impact),
                date: `31 dic, 12:00`,
                isAdjustment: true
            });
            addedCount++;
        }
    });

    financeData.transactions = txsToKeep.sort((a, b) => a.id - b.id);
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    return { deleted: txsToDelete.length, added: addedCount };
};

// ==========================================
// FIN DE ARCHIVO: core.js
// ==========================================