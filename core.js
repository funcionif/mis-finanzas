// ==========================================
// INICIO DE ARCHIVO: core.js (v2.2.0)
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

// Función para normalizar nombres de categorías (ignorar mayúsculas y tildes)
const normalizeCategoryName = (name) => {
    if (!name) return '';
    return name.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

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

const inferCategoryFromName = (text, type = 'expense') => {
    const clean = stripLeadingEmoji(text).toLowerCase();
    
    // Reglas Regex para Gastos
    if (type === 'expense') {
        if (/d1|ara|olimpica|jumbo|exito|carulla|makro|mercado|tienda|fruver/i.test(clean)) return 'Alimentación';
        if (/crepes|mcdonalds|burger|kfc|pizza|restaurante|cafe|starbucks|juan valdez|tostao/i.test(clean)) return 'Alimentación';
        if (/uber|didi|cabify|picap|taxi|gasolina|peaje|soat|parqueadero|metro|transmilenio/i.test(clean)) return 'Transporte';
        if (/netflix|spotify|hbo|disney|prime|amazon|cine|juego|xbox|playstation|steam/i.test(clean)) return 'Entretenimiento';
        if (/arriendo|agua|luz|gas|internet|claro|tigo|movistar|administracion/i.test(clean)) return 'Vivienda y Servicios';
        if (/farmatodo|cruz verde|drogueria|medico|eps|gym|smartfit|bodytech/i.test(clean)) return 'Salud';
        if (/zara|hm|ropa|zapatos|falabella|miniso/i.test(clean)) return 'Compras';
        if (/banco|cuota|interes|manejo|seguro vida/i.test(clean)) return 'Cuotas / Intereses';
    }
    
    // Reglas Regex para Ingresos
    if (type === 'income') {
        if (/nomina|salario|quincena|pago|sueldo/i.test(clean)) return 'Salario / Nómina';
        if (/rendimiento|interes|inversion/i.test(clean)) return 'Rendimientos';
        if (/prima/i.test(clean)) return 'Prima de Servicios';
    }
    
    return null;
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
    hideZeroAccounts: false,
    preferences: { disableAnimations: false }
};

if (!financeData.preferences) financeData.preferences = {};
if (financeData.preferences.disableAnimations === undefined) financeData.preferences.disableAnimations = false;
if (financeData.preferences.decimals === undefined) financeData.preferences.decimals = 2;
if (financeData.preferences.showCurrencySymbol === undefined) financeData.preferences.showCurrencySymbol = true;
if (financeData.preferences.negativeFormat === undefined) financeData.preferences.negativeFormat = 'minus';
if (financeData.preferences.rememberAccount === undefined) financeData.preferences.rememberAccount = true;
if (financeData.preferences.rememberCategory === undefined) financeData.preferences.rememberCategory = true;
if (financeData.preferences.showProjections === undefined) financeData.preferences.showProjections = true;
if (financeData.preferences.monthStartDay === undefined) financeData.preferences.monthStartDay = 1;
if (!financeData.tripMode) financeData.tripMode = { active: false, name: '', tag: '', budget: 0, isolateBudget: true };
if (!financeData.exchangeRates) financeData.exchangeRates = { USD: 4150, EUR: 4420 };

if (!financeData.fixedAssets) financeData.fixedAssets = [];
if (!financeData.pockets) financeData.pockets = [];
if (!financeData.subscriptions) financeData.subscriptions = [];
if (!financeData.lastBackupDate) financeData.lastBackupDate = new Date().getTime();
if (!Array.isArray(financeData.dismissedAlerts)) financeData.dismissedAlerts = [];

const dismissSmartAlert = (alertId) => {
    if (!alertId) return;
    if (!Array.isArray(financeData.dismissedAlerts)) financeData.dismissedAlerts = [];
    if (!financeData.dismissedAlerts.includes(alertId)) {
        financeData.dismissedAlerts.push(alertId);
        if (financeData.dismissedAlerts.length > 60) {
            financeData.dismissedAlerts = financeData.dismissedAlerts.slice(-60);
        }
        localStorage.setItem('myFinances', JSON.stringify(financeData));
    }
};
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
    const prefs = financeData.preferences || {};
    const decimals = prefs.decimals !== undefined ? prefs.decimals : 2;
    const showSymbol = prefs.showCurrencySymbol !== false;
    const isParentheses = prefs.negativeFormat === 'parentheses';

    let formatted = new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(Math.abs(clean));

    if (showSymbol) formatted = `$ ${formatted}`;
    
    if (clean < 0) return isParentheses ? `(${formatted})` : `-${formatted}`;
    return formatted;
};

const formatCompact = (amount) => {
    if (localStorage.getItem('myFinancesPrivacyMode') === 'true') return amount < 0 ? '-****' : '****';
    if (!financeData.useCompactNumbers) return formatMoney(amount);
    
    const prefs = financeData.preferences || {};
    const decimals = prefs.decimals !== undefined ? prefs.decimals : 2;
    const showSymbol = prefs.showCurrencySymbol !== false ? '$ ' : '';
    const isParentheses = prefs.negativeFormat === 'parentheses';
    
    const abs = Math.abs(amount);
    let valStr = '';
    
    if (abs >= 1000000) valStr = `${(abs / 1000000).toFixed(decimals).replace('.', ',')}M`;
    else if (abs >= 1000) valStr = `${(abs / 1000).toFixed(decimals > 0 ? 1 : 0).replace('.', ',')}k`;
    else valStr = abs.toFixed(decimals).replace('.', ',');
    
    const formatted = `${showSymbol}${valStr}`;
    if (amount < 0) return isParentheses ? `(${formatted})` : `-${formatted}`;
    return formatted;
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

// --- MOTOR DE ETIQUETAS (#TAGS) ---
const extractTransactionTags = (rawTagInput = '', descriptionText = '') => {
    const found = new Set();
    const sanitize = (token) => String(token || '')
        .replace(/^#+/, '')
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '')
        .toLowerCase()
        .trim();

    // 1. Procesar el campo dedicado de etiquetas (separadas por espacio o coma)
    String(rawTagInput || '').split(/[\s,]+/).forEach(part => {
        const clean = sanitize(part);
        if (clean.length >= 2) found.add(clean);
    });

    // 2. Detectar también #hashtags escritos directamente en la descripción
    const inlineMatches = String(descriptionText || '').match(/#([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]{2,})/g);
    if (inlineMatches) {
        inlineMatches.forEach(m => {
            const clean = sanitize(m);
            if (clean.length >= 2) found.add(clean);
        });
    }

    return Array.from(found);
};

const getAllUsedTags = () => {
    const counts = {};
    financeData.transactions.forEach(t => {
        if (!t.isDeleted && Array.isArray(t.tags)) {
            t.tags.forEach(tag => {
                const clean = String(tag).toLowerCase().trim();
                if (clean) counts[clean] = (counts[clean] || 0) + 1;
            });
        }
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
        .map(([tag, count]) => ({ tag, count }));
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
    if (willBeDefault) {
        const existingDefault = financeData.customAccounts.find(a => a.isDefault && a.id !== accountId);
        if (existingDefault) return false;
    }

    target.isDefault = willBeDefault;
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

const getMaxBudgetProjectionYear = () => currentDate.getFullYear() + 1;

const resolveCategoryYearBudget = (catName, year) => {
    const cfg = financeData.categoryBudgets?.[catName];
    if (!cfg) return null;
    const maxYear = getMaxBudgetProjectionYear();
    if (year > maxYear) return null;

    if (typeof cfg === 'object' && cfg.byYear && typeof cfg.byYear === 'object') {
        if (cfg.byYear[year] !== undefined) return cfg.byYear[year];
        const currYear = currentDate.getFullYear();
        if (year === maxYear && cfg.byYear[currYear] !== undefined) {
            return cfg.byYear[currYear];
        }
        return null;
    }
    return cfg;
};

const getCategoryBudgetStatus = (catObj, subObj = null, monthIndex = null, year = null) => {
    const mIdx = monthIndex !== null ? monthIndex : currentDate.getMonth();
    const y = year !== null ? year : (typeof viewDate !== 'undefined' && viewDate ? viewDate.getFullYear() : currentDate.getFullYear());
    const isBeyondHorizon = y > getMaxBudgetProjectionYear();
    
    // Sumar Suscripciones Reservadas de este mes (solo dentro del horizonte de 1 año)
    let reservedSubs = 0;
    if (!isBeyondHorizon) {
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
    }

    // 1. Calcular Límite Base propio del mes actual (Categoría padre o Subcategoría individual)
    let ownBaseLimit = 0;
    if (!isBeyondHorizon) {
        if (subObj) {
            if (subObj.isMonthly && Array.isArray(subObj.months)) {
                ownBaseLimit = round2(subObj.months[mIdx] || 0);
            } else if (subObj.limit > 0 && isPeriodMatching(subObj.frequency || 'monthly', subObj.startMonth || 0, mIdx)) {
                ownBaseLimit = round2(subObj.limit);
            }
        } else {
            const cfg = resolveCategoryYearBudget(catObj.name, y);
            if (cfg) {
                if (typeof cfg === 'number') ownBaseLimit = round2(cfg);
                else if (cfg.isMonthly && Array.isArray(cfg.months)) ownBaseLimit = round2(cfg.months[mIdx] || 0);
                else ownBaseLimit = round2(cfg.general || 0);
            }
        }
    }

    ownBaseLimit = round2(ownBaseLimit + reservedSubs);

    // 2. Calcular Arrastre (Rollover) propio mes a mes dentro del año fiscal (Enero -> mIdx - 1)
    let ownRolloverAmt = 0;
    const rolloverMode = subObj ? (subObj.rollover || 'none') : (catObj.rollover || 'none');
    const hasSubcats = !subObj && Array.isArray(catObj.subcategories) && catObj.subcategories.some(s => !s.isArchived);
    
    if (!isBeyondHorizon && rolloverMode !== 'none' && mIdx > 0) {
        let runningRollover = 0;
        
        for (let i = 0; i < mIdx; i++) {
            const tempMonthId = `${y}-${String(i + 1).padStart(2, '0')}`;
            
            // Tope base del mes i
            let mLimit = 0;
            if (subObj) {
                if (subObj.isMonthly && Array.isArray(subObj.months)) mLimit = round2(subObj.months[i] || 0);
                else if (subObj.limit > 0 && isPeriodMatching(subObj.frequency || 'monthly', subObj.startMonth || 0, i)) mLimit = round2(subObj.limit);
            } else {
                const cfg = resolveCategoryYearBudget(catObj.name, y);
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

            // Ejecución en el mes i
            let mSpent = 0;
            financeData.transactions.forEach(t => {
                if (!t.isDeleted && !t.isTripIsolated && getTxMonthId(t) === tempMonthId && t.type === 'expense' && !t.isAdjustment && t.category === catObj.name && isTxClosed(t)) {
                    const matchesScope = subObj
                        ? (t.subcategory === subObj.name)
                        : (!hasSubcats || !t.subcategory || t.subcategory === 'General');
                    if (matchesScope) {
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
        
        ownRolloverAmt = runningRollover;
    }

    const ownCurrentLimit = Math.max(0, round2(ownBaseLimit + ownRolloverAmt));

    // 3. Si es categoría padre con subcategorías, consolida su presupuesto propio + el de cada subcategoría
    if (!subObj && catObj.subcategories && catObj.subcategories.length > 0) {
        let totalBase = ownBaseLimit;
        let totalRollover = ownRolloverAmt;
        let totalCurrent = ownCurrentLimit;
        catObj.subcategories.forEach(sub => {
            if (!sub.isArchived) {
                const subSt = getCategoryBudgetStatus(catObj, sub, mIdx, y);
                totalBase = round2(totalBase + subSt.baseLimit);
                totalRollover = round2(totalRollover + subSt.rolloverAmt);
                totalCurrent = round2(totalCurrent + subSt.currentLimit);
            }
        });
        return {
            baseLimit: totalBase,
            reservedSubs,
            rolloverAmt: totalRollover,
            currentLimit: Math.max(0, totalCurrent),
            ownCurrentLimit
        };
    }

    return {
        baseLimit: ownBaseLimit,
        reservedSubs,
        rolloverAmt: ownRolloverAmt,
        currentLimit: ownCurrentLimit,
        ownCurrentLimit
    };
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
    
    // ESTA LÍNEA AÍSLA EL PRESUPUESTO EN EL MODO VIAJE:
    if (type === 'expense' && financeData.tripMode && financeData.tripMode.active && financeData.tripMode.isolateBudget !== false) {
        return { hasBudget: false, totalLimit: 0, baseLimit: 0, rolloverAmt: 0, spent: 0, remaining: 0, isTripIsolated: true };
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
    const totalLimit = (!subObj && subcategoryName === 'General' && hasSubcats && status.ownCurrentLimit > 0)
        ? status.ownCurrentLimit
        : status.currentLimit;

    let spent = 0;
    financeData.transactions.forEach(t => {
        if (!t.isDeleted && !t.isTripIsolated && getTxMonthId(t) === monthId && t.type === type && !t.isAdjustment && t.category === categoryName) {
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

    const diff = round2(real - budget);
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

// --- MOTOR DE GRAVAMEN A LOS MOVIMIENTOS FINANCIEROS (4x1000 / GMF) ---
const getGmfAccountInfo = (acc, customParams = null) => {
    const params = customParams || getTaxParams();
    const uvt = round2(params.uvt || 52374);

    if (!acc || acc.category !== 'asset' || acc.id === 'Efectivo' || String(acc.id).startsWith('CxC_') || acc.accountSubType === 'cash') {
        return { applies: false, subType: 'cash', isExempt: true, monthlyCapCop: 0, capUvt: 0, needsSetup: false, label: 'Efectivo (Sin 4x1000)' };
    }

    const subType = acc.accountSubType || 'unconfigured';
    const isMarked350 = !!acc.gmfExempt;

    if (subType === 'wallet') {
        const capUvt = isMarked350 ? 350 : 65;
        return {
            applies: true,
            subType: 'wallet',
            isExempt: true,
            capUvt,
            monthlyCapCop: round2(capUvt * uvt),
            needsSetup: false,
            label: isMarked350 ? 'Billetera / Ahorros Exenta (350 UVT)' : 'Billetera / Bajo Monto (65 UVT)'
        };
    }

    if (subType === 'checking') {
        return {
            applies: true,
            subType: 'checking',
            isExempt: false,
            capUvt: 0,
            monthlyCapCop: 0,
            needsSetup: false,
            label: 'Cuenta Corriente (Grava 4x1000)'
        };
    }

    // 'savings' o cuenta bancaria previa a la actualización ('unconfigured')
    const capUvt = isMarked350 ? 350 : 0;
    return {
        applies: true,
        subType: subType === 'unconfigured' ? 'savings' : subType,
        isExempt: isMarked350,
        capUvt,
        monthlyCapCop: round2(capUvt * uvt),
        needsSetup: !acc.accountSubType,
        label: isMarked350 ? 'Ahorros Exenta (350 UVT)' : 'Ahorros (Grava 4x1000)'
    };
};

const getMonthlyGmfUsedOutflows = (accountId, monthId, excludeTxId = null) => {
    let used = 0;
    (financeData.transactions || []).forEach(t => {
        if (t.isDeleted || t.isAdjustment || t.isGmfTax) return;
        if (t.isSharedTrip && t.paidBy === 'companion') return;
        if (excludeTxId && String(t.id) === String(excludeTxId)) return;
        if (getTxMonthId(t) !== monthId || !isTxClosed(t)) return;

        if (t.type === 'expense' && t.account === accountId) {
            used = round2(used + round2(t.amount));
        } else if (t.type === 'transfer' && t.account === accountId && !t.isSameBankTransfer) {
            used = round2(used + round2(t.amount));
        }
    });
    return used;
};

const calculateTransactionGmf = ({ accountId, amount, type, toAccountId = '', isSameBank = false, dateObj = new Date(), excludeTxId = null }) => {
    const cleanAmt = Math.max(0, round2(amount || 0));
    if (cleanAmt <= 0 || (type !== 'expense' && type !== 'transfer')) {
        return { applies: false, gmfAmount: 0, taxableAmount: 0, remainingCapAfter: 0, monthlyCapCop: 0, usedThisMonth: 0, isExempt: true, needsSetup: false };
    }

    if (type === 'transfer' && isSameBank) {
        return { applies: false, gmfAmount: 0, taxableAmount: 0, remainingCapAfter: 0, monthlyCapCop: 0, usedThisMonth: 0, isExempt: true, needsSetup: false, sameBankExempt: true };
    }

    const acc = getAccountObj(accountId);
    const info = getGmfAccountInfo(acc);
    if (!info.applies) {
        return { applies: false, gmfAmount: 0, taxableAmount: 0, remainingCapAfter: 0, monthlyCapCop: 0, usedThisMonth: 0, isExempt: true, needsSetup: false };
    }

    const mId = getMonthId(dateObj);
    const usedThisMonth = getMonthlyGmfUsedOutflows(accountId, mId, excludeTxId);
    const remainingCapBefore = Math.max(0, round2(info.monthlyCapCop - usedThisMonth));
    const taxableAmount = Math.max(0, round2(cleanAmt - remainingCapBefore));
    const gmfAmount = round2(taxableAmount * 0.004);
    const remainingCapAfter = Math.max(0, round2(remainingCapBefore - cleanAmt));

    return {
        applies: true,
        subType: info.subType,
        isExempt: info.isExempt,
        needsSetup: info.needsSetup,
        capUvt: info.capUvt,
        monthlyCapCop: info.monthlyCapCop,
        usedThisMonth,
        remainingCapBefore,
        remainingCapAfter,
        taxableAmount,
        gmfAmount
    };
};

const hasAnyGmfConfiguredAccount = () => {
    const bankAssets = (financeData.customAccounts || []).filter(
        a => a.category === 'asset' && a.id !== 'Efectivo' && !String(a.id).startsWith('CxC_') && a.accountSubType !== 'cash'
    );
    if (bankAssets.length === 0) return true;
    return bankAssets.some(a => !!a.gmfExempt || !!a.gmfReviewed);
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
        if (!t.isDeleted && getTxMonthId(t) <= targetMonthId && isTxClosed(t)) {
            // Si es un gasto compartido pagado por el acompañante, NO afecta mis saldos locales
            if (t.isSharedTrip && t.paidBy === 'companion') return;

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
    const regularTrans = financeData.transactions.filter(t => !t.isDeleted && !t.isTripIsolated && t.type === 'expense' && !t.isAdjustment && isTxClosed(t));
    const monthsCount = new Set(regularTrans.map(t => getTxMonthId(t))).size || 1;
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
        if (!t.isDeleted && !t.isTripIsolated && getTxMonthId(t) === targetMonthId && t.type !== 'transfer' && !t.isAdjustment) {
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
const calculateFianzaAmount = (baseAmount, fianzaVal, fianzaType = 'pct', includeIva = false) => {
    const base = Math.max(0, round2(baseAmount || 0));
    const val = Math.max(0, parseFloat(fianzaVal) || 0);
    if (base <= 0 || val <= 0) return 0;
    const rawFee = fianzaType === 'pct' ? round2(base * (val / 100)) : round2(val);
    return includeIva ? round2(rawFee * 1.19) : rawFee;
};
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
        .filter(t => !t.isDeleted && t.account === cardId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t))
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
        .filter(t => !t.isDeleted && t.account === debtId && t.type === 'expense' && isTxClosed(t) && t.installments !== undefined)
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
    
    // Ya no eliminamos físicamente los hijos (intereses) aquí.
    // El sistema de borrado en cascada en app.js se encarga de enviarlos a la papelera.

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
        if (!t.isDeleted && t.account === card.id && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)) {
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
    const initialTerm = Math.max(1, parseInt(card.initialDebtTerm, 10) || 12);
    let initialQuotaApplied = 0;
    let initialPrincipalApplied = 0;
    let initialInterestApplied = 0;
    let isInitialFallbackTerm = false;

    if (unallocatedDebt > 0) {
        const customInitQuota = round2(card.initialDebtQuota || 0);
        const cardRate = parseFloat(card.rate) || 0;
        const cardRateType = card.rateType || 'monthly';
        const amortInit = calculateAmortization(unallocatedDebt, initialTerm, cardRate, cardRateType);
        const firstMonthInt = round2(unallocatedDebt * amortInit.monthlyRate);

        if (customInitQuota > 0) {
            initialQuotaApplied = Math.min(round2(unallocatedDebt + firstMonthInt), customInitQuota);
            initialInterestApplied = Math.min(initialQuotaApplied, firstMonthInt);
            initialPrincipalApplied = Math.max(0, round2(initialQuotaApplied - initialInterestApplied));
        } else {
            initialQuotaApplied = amortInit.payment;
            initialInterestApplied = firstMonthInt;
            initialPrincipalApplied = Math.max(0, round2(initialQuotaApplied - initialInterestApplied));
            isInitialFallbackTerm = true;
        }
    }

    // Cuota de manejo genérica (saldo o uso, solo saldo, fija, o exonerada por compras / ingresos en cuenta)
    let mgmtFeeAmt = 0;
    let mgmtFeeStatus = 'disabled';
    let mgmtWaiverDetail = '';
    const hasMgmtFee = !!card.hasMgmtFee && round2(card.mgmtFee || 0) > 0;
    const mgmtFeeRule = card.mgmtFeeRule || (card.mgmtFeeOnlyWithDebt === false ? 'always' : 'balance_or_use');
    const waiverSpend = round2(card.mgmtFeeWaiverSpend || 0);
    const waiverIncome = round2(card.mgmtFeeWaiverIncome || 0);
    const waiverAccountId = card.mgmtFeeWaiverAccountId || '';
    const waiverType = card.mgmtFeeWaiverType || 'spend';

    if (hasMgmtFee) {
        const hasBalance = debt > 0;
        const hasUsage = cycleInfo.cycleTxCount > 0;
        let appliesByRule = false;

        if (mgmtFeeRule === 'always') appliesByRule = true;
        else if (mgmtFeeRule === 'balance_only') appliesByRule = hasBalance;
        else appliesByRule = hasBalance || hasUsage;

        const targetMonthId = getMonthId(refDate);
        const accInflow = waiverAccountId ? getAccountMonthlyInflows(waiverAccountId, targetMonthId, false) : 0;
        const accName = waiverAccountId ? stripLeadingEmoji(getAccountObj(waiverAccountId).name) : '';

        const metSpend = (waiverType === 'spend' || waiverType === 'either') && waiverSpend > 0 && cycleInfo.cycleSpend >= waiverSpend;
        const metIncome = (waiverType === 'account_income' || waiverType === 'either') && waiverIncome > 0 && waiverAccountId && accInflow >= waiverIncome;

        if (!appliesByRule) {
            mgmtFeeStatus = 'no_activity';
        } else if (metSpend || metIncome) {
            mgmtFeeStatus = 'waived';
            mgmtWaiverDetail = metIncome
                ? `Ingresos ${accName}: ${formatCompact(accInflow)}`
                : `Compras ciclo: ${formatCompact(cycleInfo.cycleSpend)}`;
        } else {
            mgmtFeeAmt = round2(card.mgmtFee);
            mgmtFeeStatus = 'charged';
            if ((waiverType === 'account_income' || waiverType === 'either') && waiverIncome > 0 && waiverAccountId) {
                const missingInc = Math.max(0, round2(waiverIncome - accInflow));
                mgmtWaiverDetail = `Faltan ${formatCompact(missingInc)} en ingresos (${accName})`;
            } else if ((waiverType === 'spend' || waiverType === 'either') && waiverSpend > 0) {
                const missingSp = Math.max(0, round2(waiverSpend - cycleInfo.cycleSpend));
                mgmtWaiverDetail = `Faltan ${formatCompact(missingSp)} en compras`;
            }
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
        initialTerm,
        initialPrincipalApplied,
        initialInterestApplied,
        isInitialFallbackTerm,
        hasMgmtFee,
        mgmtFeeRule,
        mgmtFeeStatus,
        mgmtWaiverDetail,
        mgmtFeeAmt,
        hasInsurance,
        insuranceRule,
        insuranceDetailLabel,
        insuranceAmt,
        totalMinPayment
    };
};

const getAccountMonthlyInflows = (accountId, monthId, includePending = false) => {
    if (!accountId || !monthId) return 0;
    let totalInflow = 0;
    financeData.transactions.forEach(t => {
        if (!t.isDeleted && getTxMonthId(t) === monthId && !t.isAdjustment && (includePending || isTxClosed(t))) {
            const val = t.status === 'pending' ? round2(t.budgetedAmount || t.amount) : round2(t.amount);
            if (t.type === 'income' && t.account === accountId) {
                totalInflow = round2(totalInflow + val);
            } else if (t.type === 'transfer' && t.toAccount === accountId) {
                totalInflow = round2(totalInflow + val);
            }
        }
    });
    return totalInflow;
};

const calculateCardStatementProjection = (card, currentDebt, monthOffset = 0, refDate = currentDate) => {
    const cDay = Math.max(1, Math.min(31, parseInt(card.cutoffDay, 10) || 15));
    const pDay = Math.max(1, Math.min(31, parseInt(card.paymentDay, 10) || 30));

    // Anclar cada columna al mes calendario de pago (-1 = mes anterior, 0 = mes actual, +1..+4 = próximos 4 meses)
    const payTotalMonths = monthOffset;
    const payDaysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + payTotalMonths + 1, 0).getDate();
    const payDateObj = new Date(refDate.getFullYear(), refDate.getMonth() + payTotalMonths, Math.min(pDay, payDaysInMonth));

    const cutTotalMonths = pDay <= cDay ? payTotalMonths - 1 : payTotalMonths;
    const cutDaysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + cutTotalMonths + 1, 0).getDate();
    const cutDateObj = new Date(refDate.getFullYear(), refDate.getMonth() + cutTotalMonths, Math.min(cDay, cutDaysInMonth));

    // Offset de pago que corresponde al ciclo activo actual de la tarjeta
    const baseCutMonthOffset = refDate.getDate() <= cDay ? 0 : 1;
    const activePayOffset = pDay <= cDay ? baseCutMonthOffset + 1 : baseCutMonthOffset;
    const cycleDelta = monthOffset - activePayOffset;

    const shortLabel = `${getShortMonthLabel(payDateObj).toUpperCase()} ${String(payDateObj.getFullYear()).slice(-2)}`;
    const rawFullLabel = payDateObj.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const fullMonthLabel = rawFullLabel.charAt(0).toUpperCase() + rawFullLabel.slice(1);
    const cutoffDateLabel = cutDateObj.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
    const paymentDateLabel = payDateObj.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

    const prevCutDays = new Date(cutDateObj.getFullYear(), cutDateObj.getMonth(), 0).getDate();
    const prevCutDateObj = new Date(cutDateObj.getFullYear(), cutDateObj.getMonth() - 1, Math.min(cDay, prevCutDays), 23, 59, 59);
    const cycleStartMs = prevCutDateObj.getTime() + 1000;
    const cycleEndMs = new Date(cutDateObj.getFullYear(), cutDateObj.getMonth(), cutDateObj.getDate(), 23, 59, 59).getTime();

    const cyclePayments = financeData.transactions
        .filter(t => !t.isDeleted && isTxClosed(t) && ((t.type === 'transfer' && t.toAccount === card.id) || (t.type === 'income' && t.account === card.id)))
        .filter(t => t.id >= cycleStartMs && t.id <= cycleEndMs)
        .map(t => ({
            kind: 'payment',
            txId: t.id,
            title: stripLeadingEmoji(t.description || 'Pago a tu tarjeta'),
            subtitle: t.date,
            amount: round2(t.amount)
        }));

    if (cycleDelta === 0) {
        const est = calculateCardMinPaymentEstimate(card, currentDebt, refDate);
        const pending = getPendingCardPurchases(card.id);
        const items = [];

        pending.forEach(p => {
            const amort = calculateAmortization(round2(p.tx.amount), p.installments, p.rate, p.rateType);
            const row = amort.schedule[p.paidInstallments] || { principal: p.nextQuota, interest: 0 };
            items.push({
                kind: 'deferred',
                txId: p.tx.id,
                title: stripLeadingEmoji(p.tx.description),
                subtitle: `Cuota ${p.nextPeriod} de ${p.installments}`,
                amount: p.nextQuota,
                principal: Math.min(p.remCapital, row.principal),
                interest: row.interest,
                remCapital: p.remCapital
            });
        });

        if (est.initialQuotaApplied > 0) {
            items.push({
                kind: 'initial',
                title: 'Cuota deuda inicial',
                subtitle: est.isInitialFallbackTerm ? `Proyección estándar ${est.initialTerm} cuotas` : 'Cuota fija configurada',
                amount: est.initialQuotaApplied,
                principal: est.initialPrincipalApplied,
                interest: est.initialInterestApplied,
                remCapital: est.unallocatedDebt
            });
        }
        if (est.mgmtFeeAmt > 0) {
            items.push({
                kind: 'fee',
                title: 'Cuota de manejo',
                subtitle: est.mgmtWaiverDetail || 'Cargo mensual de administración',
                amount: est.mgmtFeeAmt,
                principal: 0,
                interest: est.mgmtFeeAmt
            });
        } else if (est.hasMgmtFee && est.mgmtFeeStatus === 'waived') {
            items.push({
                kind: 'fee',
                title: 'Cuota de manejo',
                subtitle: `Exonerada • ${est.mgmtWaiverDetail}`,
                amount: 0,
                principal: 0,
                interest: 0,
                isWaived: true
            });
        }
        if (est.insuranceAmt > 0) {
            items.push({
                kind: 'fee',
                title: 'Seguro de vida deudores',
                subtitle: `Cálculo ${est.insuranceDetailLabel}`,
                amount: est.insuranceAmt,
                principal: 0,
                interest: est.insuranceAmt
            });
        }

        const diffPayDays = Math.ceil((payDateObj - refDate) / (1000 * 3600 * 24));
        const badgeText = diffPayDays === 0 ? 'Vence hoy' : (diffPayDays < 0 ? `Venció hace ${Math.abs(diffPayDays)}d` : `En ${diffPayDays}d`);

        return {
            monthOffset,
            isCurrentCycle: true,
            shortLabel,
            fullMonthLabel,
            cutoffDateLabel,
            paymentDateLabel,
            badgeText,
            minPayment: est.totalMinPayment,
            debtAtCutoff: est.debt,
            cycleSpend: est.cycleSpend,
            cycleTxCount: est.cycleTxCount,
            items,
            payments: cyclePayments,
            isHistorical: false
        };
    }

    if (cycleDelta > 0) {
        const baseEst = calculateCardMinPaymentEstimate(card, currentDebt, refDate);
        const pending = getPendingCardPurchases(card.id);
        const items = [];
        let projectedDebtAtCutoff = 0;

        pending.forEach(p => {
            const targetIdx = p.paidInstallments + cycleDelta;
            if (targetIdx < p.installments) {
                const amort = calculateAmortization(round2(p.tx.amount), p.installments, p.rate, p.rateType);
                const schedRow = amort.schedule[targetIdx];
                const prevRemCap = targetIdx > 0 ? amort.schedule[targetIdx - 1].balance : round2(p.tx.amount);
                const adjRemCap = Math.max(0, round2(prevRemCap - round2(p.tx.extraPrincipalPaid || 0)));
                if (schedRow && adjRemCap > 0) {
                    const qAmt = round2(Math.min(schedRow.payment, round2(adjRemCap + schedRow.interest)));
                    projectedDebtAtCutoff = round2(projectedDebtAtCutoff + adjRemCap);
                    items.push({
                        kind: 'deferred',
                        txId: p.tx.id,
                        title: stripLeadingEmoji(p.tx.description),
                        subtitle: `Cuota ${targetIdx + 1} de ${p.installments}`,
                        amount: qAmt,
                        principal: Math.min(adjRemCap, schedRow.principal),
                        interest: schedRow.interest,
                        remCapital: adjRemCap
                    });
                }
            }
        });

        const initTerm = Math.max(1, parseInt(card.initialDebtTerm, 10) || 12);
        const initAmortProj = baseEst.unallocatedDebt > 0
            ? calculateAmortization(baseEst.unallocatedDebt, initTerm, parseFloat(card.rate) || 0, card.rateType || 'monthly')
            : { payment: 0, monthlyRate: 0 };
        const initStepQuota = round2(card.initialDebtQuota || 0) > 0 ? round2(card.initialDebtQuota) : initAmortProj.payment;
        const initStepPrincipal = Math.max(0, round2(initStepQuota - round2(baseEst.unallocatedDebt * initAmortProj.monthlyRate)));
        const remUnallocAtCutoff = Math.max(0, round2(baseEst.unallocatedDebt - (initStepPrincipal > 0 ? initStepPrincipal : initStepQuota) * cycleDelta));
        if (remUnallocAtCutoff > 0 && initStepQuota > 0) {
            const projInt = round2(remUnallocAtCutoff * initAmortProj.monthlyRate);
            const qInit = round2(Math.min(round2(remUnallocAtCutoff + projInt), initStepQuota));
            const qInitPrin = Math.max(0, round2(qInit - projInt));
            projectedDebtAtCutoff = round2(projectedDebtAtCutoff + remUnallocAtCutoff);
            items.push({
                kind: 'initial',
                title: 'Cuota deuda inicial',
                subtitle: `Proyección +${cycleDelta} mes${cycleDelta > 1 ? 'es' : ''}`,
                amount: qInit,
                principal: qInitPrin,
                interest: projInt,
                remCapital: remUnallocAtCutoff
            });
        }

        const hasMgmtFee = !!card.hasMgmtFee && round2(card.mgmtFee || 0) > 0;
        const mgmtFeeRule = card.mgmtFeeRule || (card.mgmtFeeOnlyWithDebt === false ? 'always' : 'balance_or_use');
        if (hasMgmtFee && (mgmtFeeRule === 'always' || projectedDebtAtCutoff > 0)) {
            const waiverIncome = round2(card.mgmtFeeWaiverIncome || 0);
            const waiverAccountId = card.mgmtFeeWaiverAccountId || '';
            const waiverType = card.mgmtFeeWaiverType || 'spend';
            const projMonthId = getMonthId(cutDateObj);
            const scheduledInflow = waiverAccountId ? getAccountMonthlyInflows(waiverAccountId, projMonthId, true) : 0;

            let isFutureWaived = false;
            if ((waiverType === 'account_income' || waiverType === 'either') && waiverIncome > 0 && waiverAccountId) {
                if (scheduledInflow >= waiverIncome) {
                    isFutureWaived = true;
                } else if (waiverAccountId === getDefaultAccountId(true)) {
                    const salStr = localStorage.getItem('myFinancesSalary');
                    if (salStr) {
                        const salMetrics = calculateLaborMetrics(JSON.parse(salStr), cutDateObj);
                        if (salMetrics.net >= waiverIncome) isFutureWaived = true;
                    }
                }
            }

            if (isFutureWaived) {
                const accName = stripLeadingEmoji(getAccountObj(waiverAccountId).name);
                items.push({
                    kind: 'fee',
                    title: 'Cuota de manejo',
                    subtitle: `Exonerada por ingresos proyectados (${accName})`,
                    amount: 0,
                    principal: 0,
                    interest: 0,
                    isWaived: true
                });
            } else {
                items.push({
                    kind: 'fee',
                    title: 'Cuota de manejo',
                    subtitle: 'Cargo mensual proyectado',
                    amount: round2(card.mgmtFee),
                    principal: 0,
                    interest: round2(card.mgmtFee)
                });
            }
        }

        const hasInsurance = !!card.hasInsurance && round2(card.insurancePerMillion || 0) > 0;
        if (hasInsurance && projectedDebtAtCutoff > 0) {
            const insRate = round2(card.insurancePerMillion || 0);
            const insRule = card.insuranceRule || 'per_million_min1';
            let insAmt = 0;
            if (insRule === 'fixed_if_debt') insAmt = insRate;
            else if (insRule === 'per_million_ceil') insAmt = round2(Math.max(1, Math.ceil(projectedDebtAtCutoff / 1000000)) * insRate);
            else if (insRule === 'per_million_exact') insAmt = round2((projectedDebtAtCutoff / 1000000) * insRate);
            else insAmt = round2(Math.max(1, projectedDebtAtCutoff / 1000000) * insRate);

            items.push({
                kind: 'fee',
                title: 'Seguro de vida deudores',
                subtitle: 'Proyección sobre saldo al corte',
                amount: insAmt,
                principal: 0,
                interest: insAmt
            });
        }

        const minPayment = round2(items.reduce((s, it) => s + it.amount, 0));
        return {
            monthOffset,
            isCurrentCycle: false,
            shortLabel,
            fullMonthLabel,
            cutoffDateLabel,
            paymentDateLabel,
            badgeText: `En ${cycleDelta} mes${cycleDelta > 1 ? 'es' : ''}`,
            minPayment,
            debtAtCutoff: projectedDebtAtCutoff,
            cycleSpend: 0,
            cycleTxCount: 0,
            items,
            payments: [],
            isHistorical: false
        };
    }

    // Extracto de ciclo anterior (cycleDelta < 0)
    const cutMonthId = getMonthId(cutDateObj);
    const histSnap = computeBalancesUpTo(cutMonthId);
    const debtAtCutoff = Math.max(0, round2(histSnap.bals[card.id] || 0));
    const diffHistPayDays = Math.ceil((payDateObj - refDate) / (1000 * 3600 * 24));

    // Si el extracto ya cortó pero su fecha límite de pago aún no vence, mostrar el pago mínimo facturado
    if (diffHistPayDays >= 0) {
        const billedEst = debtAtCutoff > 0 ? calculateCardMinPaymentEstimate(card, debtAtCutoff, cutDateObj) : null;
        const billedItems = [];

        if (billedEst) {
            if (billedEst.initialQuotaApplied > 0) {
                billedItems.push({
                    kind: 'initial',
                    title: 'Cuota deuda al corte',
                    subtitle: billedEst.isInitialFallbackTerm ? `Proyección estándar ${billedEst.initialTerm} cuotas` : 'Cuota fija configurada',
                    amount: billedEst.initialQuotaApplied,
                    principal: billedEst.initialPrincipalApplied,
                    interest: billedEst.initialInterestApplied
                });
            }
            if (billedEst.mgmtFeeAmt > 0) {
                billedItems.push({
                    kind: 'fee',
                    title: 'Cuota de manejo',
                    subtitle: billedEst.mgmtWaiverDetail || 'Cargo mensual de administración',
                    amount: billedEst.mgmtFeeAmt,
                    principal: 0,
                    interest: billedEst.mgmtFeeAmt
                });
            }
            if (billedEst.insuranceAmt > 0) {
                billedItems.push({
                    kind: 'fee',
                    title: 'Seguro de vida deudores',
                    subtitle: `Cálculo ${billedEst.insuranceDetailLabel}`,
                    amount: billedEst.insuranceAmt,
                    principal: 0,
                    interest: billedEst.insuranceAmt
                });
            }
        }

        return {
            monthOffset,
            isCurrentCycle: false,
            shortLabel,
            fullMonthLabel,
            cutoffDateLabel,
            paymentDateLabel,
            badgeText: diffHistPayDays === 0 ? 'Vence hoy' : `En ${diffHistPayDays}d`,
            minPayment: billedEst ? billedEst.totalMinPayment : 0,
            debtAtCutoff,
            cycleSpend: billedEst ? billedEst.cycleSpend : 0,
            cycleTxCount: billedEst ? billedEst.cycleTxCount : 0,
            items: billedItems,
            payments: cyclePayments,
            isHistorical: false
        };
    }

    const histExpenses = financeData.transactions
        .filter(t => !t.isDeleted && t.account === card.id && t.type === 'expense' && !t.isAdjustment && isTxClosed(t))
        .filter(t => t.id >= cycleStartMs && t.id <= cycleEndMs)
        .map(t => ({
            kind: 'historical_exp',
            txId: t.id,
            title: stripLeadingEmoji(t.description),
            subtitle: t.installments > 1 ? `Compra a ${t.installments} cuotas` : t.date,
            amount: round2(t.amount),
            principal: round2(t.amount),
            interest: 0
        }));

    const histTotal = round2(histExpenses.reduce((s, it) => s + it.amount, 0));

    return {
        monthOffset,
        isCurrentCycle: false,
        shortLabel,
        fullMonthLabel,
        cutoffDateLabel,
        paymentDateLabel,
        badgeText: 'Cerrado',
        minPayment: histTotal,
        debtAtCutoff,
        cycleSpend: histTotal,
        cycleTxCount: histExpenses.length,
        items: histExpenses,
        payments: cyclePayments,
        isHistorical: true
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

    const regularTrans = financeData.transactions.filter(t => !t.isDeleted && !t.isTripIsolated && t.type === 'expense' && !t.isAdjustment && isTxClosed(t));
    const monthsCount = new Set(regularTrans.map(t => getTxMonthId(t))).size || 1;
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

const checkRentaDeclaration = (year) => {
    const params = getTaxParams();
    const uvt = params.uvt || 52374;
    // Topes DIAN en UVT (Art. 592 y 594-3 E.T.)
    const limits = {
        patrimonio: 4500 * uvt,
        ingresos: 1400 * uvt,
        tarjetas: 1400 * uvt,
        compras: 1400 * uvt,
        consignaciones: 1400 * uvt
    };

    let patrimonio = 0, ingresos = 0, tarjetas = 0, compras = 0, consignaciones = 0;
    
    // 1. Patrimonio Bruto (Activos + Bolsillos + Activos Fijos + CxC) a corte de 31 Dic
    const snap = computeBalancesUpTo(`${year}-12`);
    patrimonio = round2(snap.assetsTotal + snap.fixedAssetsTotal + snap.allPocketsTotal + snap.cxcTotal);
    
    // 2. Sumatoria de flujos durante el año
    financeData.transactions.forEach(t => {
        if (t.isDeleted || (t.isSharedTrip && t.paidBy === 'companion')) return;
        const txYear = new Date(t.id).getFullYear();
        if (txYear === year && isTxClosed(t) && !t.isAdjustment) {
            const val = round2(t.amount);
            const accObj = getAccountObj(t.account);
            
            if (t.type === 'income') {
                ingresos += val;
                consignaciones += val; // Las entradas de dinero operan como consignaciones bancarias
            } else if (t.type === 'expense') {
                compras += val;
                if (accObj.category === 'credit_card') {
                    tarjetas += val;
                }
            }
        }
    });

    const exceeds = {
        patrimonio: patrimonio >= limits.patrimonio,
        ingresos: ingresos >= limits.ingresos,
        tarjetas: tarjetas >= limits.tarjetas,
        compras: compras >= limits.compras,
        consignaciones: consignaciones >= limits.consignaciones
    };

    const mustDeclare = Object.values(exceeds).some(v => v);

    // 3. SIMULACIÓN DE IMPUESTO A CARGO (Cédula General - Art. 241 E.T.)
    let impuestoEstimado = 0, retencionesEstimadas = 0, saldoAPagar = 0;
    let baseGravableAnual = 0, baseGravableUVT = 0;
    const salaryStr = localStorage.getItem('myFinancesSalary');
    
    if (salaryStr) {
        const sCfg = JSON.parse(salaryStr);
        let ingresosBrutosAnuales = 0;
        let incrngoAnual = 0;
        let deduccionesArt387Anual = 0;
        let retMensualSumada = 0;
        let lastMetrics = null;

        for (let m = 0; m < 12; m++) {
            const mMetrics = calculateLaborMetrics(sCfg, new Date(year, m, 15), params);
            ingresosBrutosAnuales = round2(ingresosBrutosAnuales + mMetrics.ingresosBrutos);
            incrngoAnual = round2(incrngoAnual + mMetrics.incrngo);
            deduccionesArt387Anual = round2(deduccionesArt387Anual + mMetrics.totalDeduccionesArt387);
            retMensualSumada = round2(retMensualSumada + mMetrics.ret);
            lastMetrics = mMetrics;
        }

        const rentaLiquidaAnual = Math.max(0, round2(ingresosBrutosAnuales - incrngoAnual));
        const dedVoluntaryAnual = Math.min(round2((sCfg.dedVoluntary || 0) * 12), round2(ingresosBrutosAnuales * 0.30), round2((params.voluntaryAnnualUvt || 3800) * uvt));
        const baseNeta25Anual = Math.max(0, round2(rentaLiquidaAnual - deduccionesArt387Anual - dedVoluntaryAnual));
        const exempt25Anual = Math.min(round2(baseNeta25Anual * 0.25), round2((params.exempt25AnnualUvt || 790) * uvt));

        const beneficiosBrutosAnuales = round2(deduccionesArt387Anual + dedVoluntaryAnual + exempt25Anual);
        const tope40Anual = Math.min(round2(rentaLiquidaAnual * 0.40), round2((params.global40AnnualUvt || 1340) * uvt));
        const beneficiosLimitadosAnuales = Math.min(beneficiosBrutosAnuales, tope40Anual);

        baseGravableAnual = Math.max(0, round2(rentaLiquidaAnual - beneficiosLimitadosAnuales));
        baseGravableUVT = uvt > 0 ? baseGravableAnual / uvt : 0;

        let impuestoUVT = 0;
        if (baseGravableUVT > 31000) impuestoUVT = (baseGravableUVT - 31000) * 0.39 + 10352;
        else if (baseGravableUVT > 18970) impuestoUVT = (baseGravableUVT - 18970) * 0.37 + 5901;
        else if (baseGravableUVT > 8670) impuestoUVT = (baseGravableUVT - 8670) * 0.35 + 2296;
        else if (baseGravableUVT > 4100) impuestoUVT = (baseGravableUVT - 4100) * 0.33 + 788;
        else if (baseGravableUVT > 1700) impuestoUVT = (baseGravableUVT - 1700) * 0.28 + 116;
        else if (baseGravableUVT > 1090) impuestoUVT = (baseGravableUVT - 1090) * 0.19;

        impuestoEstimado = round2(impuestoUVT * uvt);
        retencionesEstimadas = round2(retMensualSumada + ((lastMetrics?.retPrima || 0) * 2));
        saldoAPagar = round2(impuestoEstimado - retencionesEstimadas);
    }

    return {
        year, limits, uvt,
        current: { patrimonio, ingresos, tarjetas, compras, consignaciones },
        exceeds, mustDeclare,
        taxSimulation: { hasSalaryConfig: !!salaryStr, baseGravableAnual, baseGravableUVT, impuestoEstimado, retencionesEstimadas, saldoAPagar }
    };
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

const calculateLaborMetrics = (config, today = new Date(), customParams = null, overrideTransport = null, capOverrides = null) => {
    const params = customParams || getTaxParams();
    const uvt = round2(params.uvt || 52374);
    const smmlv = round2(params.smmlv || 1750905);
    const rawTransport = round2(params.transportAid || 249095);

    const basic = round2(config.basicSalary || 0);

    // Cálculo dinámico de pagos no salariales para el mes evaluado (today)
    let nonSalary = 0;
    let taxableNonSalary = 0;
    const targetMonthStr = String(today.getMonth());

    if (Array.isArray(config.nonSalaryItems)) {
        if (config.hasNonSalary !== false) {
            config.nonSalaryItems.forEach(item => {
                const amt = round2(item.amount || 0);
                if (amt <= 0) return;
                if (item.month === 'all' || String(item.month) === targetMonthStr) {
                    nonSalary = round2(nonSalary + amt);
                    if (item.taxable !== false) {
                        taxableNonSalary = round2(taxableNonSalary + amt);
                    }
                }
            });
        }
    } else {
        // Compatibilidad con configuraciones anteriores de un solo valor
        nonSalary = round2(config.nonSalary || 0);
        taxableNonSalary = nonSalary;
    }

    // Validación Ley 1393 (Tope 40% del total remunerado para IBC de Seguridad Social)
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

    // Base tributaria (Art. 103 E.T.): Solo suman los conceptos no salariales marcados con "Base Retefuente"
    const ingresosBrutos = round2(basic + taxableNonSalary);
    const incrngo = round2(health + pension + fsp);
    const rentaLiquida = Math.max(0, round2(ingresosBrutos - incrngo));

    const skipDeductions = !!(capOverrides && capOverrides.skipDeductions);
    const dedPrepaid = skipDeductions ? 0 : Math.min(round2(config.dedPrepaid || 0), round2((params.prepaidMonthlyUvt || 16) * uvt));
    const dedHousing = skipDeductions ? 0 : Math.min(round2(config.dedHousing || 0), round2((params.housingMonthlyUvt || 100) * uvt));
    const dedDependents = (!skipDeductions && config.dedDependents) ? Math.min(round2(ingresosBrutos * 0.10), round2((params.dependentsMonthlyUvt || 32) * uvt)) : 0;
    const dedVoluntary = skipDeductions ? 0 : Math.min(round2(config.dedVoluntary || 0), Math.min(round2(ingresosBrutos * 0.30), round2(((params.voluntaryAnnualUvt || 3800) / 12) * uvt)));
    const totalDeduccionesArt387 = round2(dedPrepaid + dedHousing + dedDependents);
    const baseNeta25 = Math.max(0, round2(rentaLiquida - totalDeduccionesArt387 - dedVoluntary));

    const retCapEval = params.retCapEval || 'monthly';
    const retOrder = params.retOrder || 'salary_first';

    const baseExempt25MonthlyCap = round2(((params.exempt25AnnualUvt || 790) / 12) * uvt);
    const baseGlobalUvtMonthlyCap = round2(((params.global40AnnualUvt || 1340) / 12) * uvt);

    let exempt25MonthlyCapCOP = baseExempt25MonthlyCap;
    let globalUvtMonthlyCapCOP = baseGlobalUvtMonthlyCap;

    if (retCapEval === 'annual') {
        const monthsElapsedBefore = Math.max(0, today.getMonth());
        const estPriorExempt25 = Math.min(round2(baseNeta25 * 0.25), baseExempt25MonthlyCap) * monthsElapsedBefore;
        const estPriorBeneficios = Math.min(round2(totalDeduccionesArt387 + dedVoluntary + Math.min(round2(baseNeta25 * 0.25), baseExempt25MonthlyCap)), round2(rentaLiquida * 0.40), baseGlobalUvtMonthlyCap) * monthsElapsedBefore;
        exempt25MonthlyCapCOP = Math.max(0, round2(((params.exempt25AnnualUvt || 790) * uvt) - estPriorExempt25));
        globalUvtMonthlyCapCOP = Math.max(0, round2(((params.global40AnnualUvt || 1340) * uvt) - estPriorBeneficios));
    }

    if (capOverrides) {
        if (capOverrides.exempt25CapCOP !== undefined) exempt25MonthlyCapCOP = Math.max(0, round2(capOverrides.exempt25CapCOP));
        if (capOverrides.globalUvtCapCOP !== undefined) globalUvtMonthlyCapCOP = Math.max(0, round2(capOverrides.globalUvtCapCOP));
    }

    const exempt25 = Math.min(round2(baseNeta25 * 0.25), exempt25MonthlyCapCOP);
    const totalBeneficiosBrutos = round2(totalDeduccionesArt387 + dedVoluntary + exempt25);
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
    const targetMonthId = getMonthId(today);
    
    financeData.customAccounts.filter(a => a.category === 'debt' && a.payrollDeduction).forEach(d => {
        const bal = round2(financeData.transactions.filter(t => !t.isDeleted && (t.account === d.id || t.toAccount === d.id) && getTxMonthId(t) <= targetMonthId && isTxClosed(t)).reduce((s, t) => {
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
    const excludedNonVariableRegex = /anticipo|adelanto|cesant[ií]a|interes(es)?\s*(de\s*)?cesant|vacacion|disfrutad|compensad|prima\b|parcial|liquidaci[oó]n|retroactivo/i;
    
    financeData.transactions.forEach(t => {
        if (!t.isDeleted && !t.isAdjustment && t.type === 'income' && t.category && normalizeCategoryName(stripLeadingEmoji(t.category)).includes('nomina') && isTxClosed(t) && t.monthId) {
            const [ty, tm] = t.monthId.split('-').map(Number);
            if (ty === currentYear) {
                const mIdx = tm - 1;
                const descLower = String(t.description || '').toLowerCase();
                const subLower = String(t.subcategory || '').toLowerCase();
                const isBaseSalary = descLower.includes('nómina') && (t.subcategory === 'General' || !t.subcategory);
                const isExcludedConcept = !!(
                    t.isPayrollAdvance ||
                    t.benefitType ||
                    excludedNonVariableRegex.test(descLower) ||
                    excludedNonVariableRegex.test(subLower)
                );

                if (!isBaseSalary && !isExcludedConcept) {
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

    const effSemStart = startObj > semStart ? startObj : semStart;
    const semWeighted = calcWeightedBaseBetween(effSemStart, today, daysSemester);
    const primaBase = round2(semWeighted.avgBase + (variableIncomeSemester / workedMonthsSem));
    const usedPrimaAverage = semWeighted.usedAverage || variableIncomeSemester > 0;

    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    const variedLast3Months = !!(raiseStartObj && raiseStartObj > threeMonthsAgo && raiseStartObj <= today);
    const effYearStart = startObj > startOfYear ? startObj : startOfYear;
    const yearWeighted = variedLast3Months
        ? calcWeightedBaseBetween(effYearStart, today, daysYear)
        : { avgBase: baseMensualEstandar, usedAverage: false, oldDays: 0, newDays: daysYear };
    const cesantiasBase = round2(yearWeighted.avgBase + (variableIncomeYear / workedMonthsYear));
    const usedCesantiasAverage = yearWeighted.usedAverage || variableIncomeYear > 0;

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
    const vacDaysComp = Math.max(0, round2(config.vacDaysComp || 0));
    const pureTakenDays = config._combinedVacDays ? Math.max(0, round2(vacDaysTaken - vacDaysComp)) : vacDaysTaken;
    const totalConfigVacDays = config._combinedVacDays ? vacDaysTaken : round2(vacDaysTaken + vacDaysComp);
    const vacDaysPending = Math.max(0, round2(vacDaysEarned - totalConfigVacDays));
    const liqVacaciones = round2((basic * vacDaysPending) / 30);

    const SHORT_MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const benefitPayments = {
        primaJun: [],
        primaDec: [],
        cesantias: [],
        intereses: [],
        vacaciones: []
    };

    financeData.transactions.forEach(t => {
        if (t.isDeleted || t.isAdjustment || t.type !== 'income' || !isTxClosed(t)) return;

        let txYear = currentYear;
        let txMonthIdx = 0;
        if (t.monthId && /^\d{4}-\d{2}$/.test(t.monthId)) {
            const [yStr, mStr] = t.monthId.split('-');
            txYear = parseInt(yStr, 10);
            txMonthIdx = Math.max(0, Math.min(11, parseInt(mStr, 10) - 1));
        } else {
            const txDate = new Date(t.id);
            txYear = txDate.getFullYear();
            txMonthIdx = txDate.getMonth();
        }

        if (txYear !== currentYear) return;

        const amt = round2(t.amount || 0);
        if (amt <= 0) return;

        const catNorm = normalizeCategoryName(stripLeadingEmoji(t.category || ''));
        const subNorm = normalizeCategoryName(stripLeadingEmoji(t.subcategory || ''));
        const descNorm = normalizeCategoryName(t.description || '');
        let bType = t.benefitType || '';

        if (!bType) {
            if ((catNorm.includes('prima') || descNorm.includes('prima')) && !descNorm.includes('extralegal') && !catNorm.includes('nomina')) {
                bType = 'prima';
            } else if (catNorm.includes('cesant') || descNorm.includes('cesant')) {
                bType = (descNorm.includes('interes') || descNorm.includes('12%') || subNorm.includes('interes')) ? 'intereses_cesantias' : 'cesantias';
            } else if (catNorm.includes('vacacion') || descNorm.includes('vacacion')) {
                bType = 'vacaciones';
            }
        }

        const entry = { amount: amt, monthIdx: txMonthIdx, monthLabel: SHORT_MONTHS_ES[txMonthIdx] || '' };
        if (bType === 'prima') {
            if (txMonthIdx <= 5) benefitPayments.primaJun.push(entry);
            else benefitPayments.primaDec.push(entry);
        } else if (bType === 'cesantias') {
            benefitPayments.cesantias.push(entry);
        } else if (bType === 'intereses_cesantias') {
            benefitPayments.intereses.push(entry);
        } else if (bType === 'vacaciones') {
            benefitPayments.vacaciones.push(entry);
        }
    });

    const summarizeBenefitPayments = (list) => {
        const sorted = [...list].sort((a, b) => a.monthIdx - b.monthIdx);
        const total = round2(sorted.reduce((s, p) => s + p.amount, 0));
        const months = [...new Set(sorted.map(p => p.monthLabel).filter(Boolean))];
        return { total, months, count: sorted.length, label: months.join(', ') };
    };

    const paidPrimaJun = summarizeBenefitPayments(benefitPayments.primaJun);
    const paidPrimaDec = summarizeBenefitPayments(benefitPayments.primaDec);
    const paidPrimaActiveSem = semStartMonth === 0 ? paidPrimaJun : paidPrimaDec;
    const paidCesantias = summarizeBenefitPayments(benefitPayments.cesantias);
    const paidIntereses = summarizeBenefitPayments(benefitPayments.intereses);
    const paidVacaciones = summarizeBenefitPayments(benefitPayments.vacaciones);

    const advPrima = paidPrimaActiveSem.total;
    const advCes = paidCesantias.total;
    const advInt = paidIntereses.total;
    const advVac = paidVacaciones.total;

    // Equivalencia en pesos de días disfrutados y días compensados ingresados manualmente
    const vacTakenAmount = round2((basic * pureTakenDays) / 30);
    const vacCompAmount = round2((basic * vacDaysComp) / 30);
    // Para compensadas/pagadas toma el mayor entre comprobante y días compensados (sin duplicar) + días disfrutados
    const vacPaidOrCompAmount = Math.max(advVac, vacCompAmount);
    const totalVacUsedAmount = round2(vacTakenAmount + vacPaidOrCompAmount);
    // Si hay comprobante de vacaciones que excede los días compensados ingresados, descuenta solo la diferencia en liquidación
    const extraReceiptVacDeduction = Math.max(0, round2(advVac - vacCompAmount));

    return {
        params, uvt, smmlv, basic, nonSalary, taxableNonSalary, excessNonSalary, ibc, effectiveTransport, benefitsTransport, health, pension, fsp,
        ingresosBrutos, incrngo, rentaLiquida, dedPrepaid, dedHousing, dedDependents, dedVoluntary, totalDeduccionesArt387,
        exempt25, exempt25MonthlyCapCOP, globalUvtMonthlyCapCOP, retCapEval, retOrder,
        totalBeneficiosBrutos, beneficiosLimitados, baseGravable, numeroUVT, retProc, effectiveRetPct, ret,
        net, grossNet, payrollDebtDeductions, payrollSavingsDeductions, biweeklyRetMode, gross1Q, gross2Q, ss1Q, ss2Q, ret1Q, ret2Q, net1Q, net2Q,
        prestacionesBase: projCesantiasBase, primaBase, cesantiasBase,
        projPrimaJunBase, projPrimaDecBase, projCesantiasBase,
        halfPrimaJunNeta: primaJunCalc.halfNeta, halfPrimaDecNeta: primaDecCalc.halfNeta,
        usedPrimaAverage, usedCesantiasAverage, semWeighted, yearWeighted, oldMonthlyBase, isRetroApplied,
        halfPrimaBruta, retPrima, halfPrimaNeta, daysYear, daysSemester, daysTotalContract, startObj, currentYear,
        vacDaysEarned, vacDaysTaken, pureTakenDays, vacDaysComp, vacDaysPending,
        vacTakenAmount, vacCompAmount, totalVacUsedAmount,
        paidPrimaJun, paidPrimaDec, paidPrimaActiveSem, paidCesantias, paidIntereses, paidVacaciones,
        liqPrima: Math.max(0, round2(liqPrima - advPrima)),
        liqCesantias: Math.max(0, round2(liqCesantias - advCes)),
        liqIntereses: Math.max(0, round2(liqIntereses - advInt)),
        liqVacaciones: Math.max(0, round2(liqVacaciones - extraReceiptVacDeduction))
    };
};

const simulateExtraBonus = (config, bonusAmount, bonusType = 'non_salary', customParams = null) => {
    const bonus = Math.max(0, round2(bonusAmount));
    const params = customParams || getTaxParams();
    const retOrder = params.retOrder || 'salary_first';
    const retCapEval = params.retCapEval || 'monthly';
    const baseMetrics = calculateLaborMetrics(config, currentDate, params);

    if (bonus <= 0) {
        return {
            bonus: 0, bonusType, retOrder, retCapEval, baseMetrics, simMetrics: baseMetrics,
            deltaHealth: 0, deltaPension: 0, deltaFsp: 0, deltaSS: 0, deltaRet: 0, salaryRetImpact: 0,
            totalDeductions: 0, netBonus: 0, effectiveTaxRate: 0,
            crossedFsp: false, triggeredLey1393: false, deltaExcessLey1393: 0
        };
    }

    const existingItems = Array.isArray(config.nonSalaryItems) && config.hasNonSalary !== false ? config.nonSalaryItems : [];
    const simConfig = bonusType === 'salary'
        ? { ...config, basicSalary: round2((config.basicSalary || 0) + bonus) }
        : {
            ...config,
            hasNonSalary: true,
            nonSalaryItems: [...existingItems, { id: 'sim_extra_bonus', name: 'Bono Ocasional', amount: bonus, month: 'all', taxable: true }],
            nonSalary: round2((config.nonSalary || 0) + bonus)
        };

    const simMetrics = calculateLaborMetrics(simConfig, currentDate, params, baseMetrics.effectiveTransport);

    const deltaHealth = round2(simMetrics.health - baseMetrics.health);
    const deltaPension = round2(simMetrics.pension - baseMetrics.pension);
    const deltaFsp = round2(simMetrics.fsp - baseMetrics.fsp);
    const deltaSS = round2(deltaHealth + deltaPension + deltaFsp);

    let deltaRet = round2(simMetrics.ret - baseMetrics.ret);
    let salaryRetImpact = 0;

    if (retOrder === 'first_payment') {
        const bonusFirstConfig = {
            ...config,
            basicSalary: bonusType === 'salary' ? bonus : 0,
            hasNonSalary: bonusType === 'non_salary',
            nonSalaryItems: bonusType === 'non_salary'
                ? [{ id: 'sim_first_bonus', name: 'Bono Ocasional', amount: bonus, month: 'all', taxable: true }]
                : [],
            nonSalary: bonusType === 'non_salary' ? bonus : 0,
            transportAuto: false
        };
        const bonusFirstMetrics = calculateLaborMetrics(bonusFirstConfig, currentDate, params, 0);
        deltaRet = bonusFirstMetrics.ret;

        const remExempt25 = Math.max(0, round2((baseMetrics.exempt25MonthlyCapCOP || 0) - bonusFirstMetrics.exempt25));
        const remGlobalUvt = Math.max(0, round2((baseMetrics.globalUvtMonthlyCapCOP || 0) - bonusFirstMetrics.beneficiosLimitados));
        const salaryAfterMetrics = calculateLaborMetrics(config, currentDate, params, baseMetrics.effectiveTransport, {
            exempt25CapCOP: remExempt25,
            globalUvtCapCOP: remGlobalUvt,
            skipDeductions: (bonusFirstMetrics.totalDeduccionesArt387 + bonusFirstMetrics.dedVoluntary) > 0
        });
        salaryRetImpact = Math.max(0, round2(salaryAfterMetrics.ret - baseMetrics.ret));
    }

    const totalDeductions = round2(deltaSS + deltaRet);
    const netBonus = Math.max(0, round2(bonus - totalDeductions));
    const effectiveTaxRate = round2((totalDeductions / bonus) * 100);
    const deltaExcessLey1393 = Math.max(0, round2(simMetrics.excessNonSalary - baseMetrics.excessNonSalary));

    return {
        bonus, bonusType, retOrder, retCapEval, baseMetrics, simMetrics,
        deltaHealth, deltaPension, deltaFsp, deltaSS, deltaRet, salaryRetImpact,
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
        'PRODID:-//Mis Finanzas//v2.2.0//ES',
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

// --- 9. UTILIDADES DE FECHAS, CICLOS PERSONALIZADOS Y PALETAS ---
const getMonthStartDay = () => {
    const d = parseInt(financeData?.preferences?.monthStartDay, 10);
    return (d >= 1 && d <= 28) ? d : 1;
};

const getMonthId = (date) => {
    const startDay = getMonthStartDay();
    let y = date.getFullYear();
    let m = date.getMonth();
    // Si el ciclo empieza después del día 1 y la fecha es >= día de corte, pertenece al ciclo del mes siguiente
    if (startDay > 1 && date.getDate() >= startDay) {
        m += 1;
        if (m > 11) { m = 0; y += 1; }
    }
    return `${y}-${String(m + 1).padStart(2, '0')}`;
};

const getTxMonthId = (t) => {
    if (t && t.id && !isNaN(Number(t.id))) {
        return getMonthId(new Date(Number(t.id)));
    }
    return t?.monthId || getMonthId(new Date());
};

const getCycleRangeText = (monthId) => {
    const startDay = getMonthStartDay();
    if (startDay === 1) return '';
    const [y, m] = monthId.split('-').map(Number);
    const startObj = new Date(y, m - 2, startDay);
    const endObj = new Date(y, m - 1, startDay - 1);
    const fmt = (d) => `${d.getDate()} ${d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}`;
    return `${fmt(startObj)} – ${fmt(endObj)}`;
};

const getShortMonthLabel = (date) => date.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
const formatMonthName = (date) => {
    const startDay = getMonthStartDay();
    if (startDay === 1) {
        return date.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }).replace('.', '');
    }
    const [y, m] = getMonthId(date).split('-').map(Number);
    const target = new Date(y, m - 1, 1);
    return target.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }).replace('.', '');
};
const getAssetEmoji = (cat) => {
    const svg = (inner) => `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; vertical-align:-3px;">${inner}</svg>`;
    const icons = {
        'Inmueble': svg('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
        'Vehículo': svg('<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>'),
        'Inversión': svg('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'),
        'Tecnología': svg('<rect x="3" y="4" width="18" height="12" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/>'),
        'Coleccionable': svg('<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>'),
        'Otro': svg('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>')
    };
    return icons[cat] || icons['Otro'];
};

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
        dark: { accent: '#475569', gradient: 'linear-gradient(135deg, #475569, #1e293b)', shadow: 'rgba(71, 85, 105, 0.35)' },
        forest: { accent: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #14532d)', shadow: 'rgba(34, 197, 94, 0.35)' },
        rose: { accent: '#f43f5e', gradient: 'linear-gradient(135deg, #f43f5e, #9f1239)', shadow: 'rgba(244, 63, 94, 0.35)' }
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

// --- COMPRESIÓN LOCAL E INDEXEDDB: CIERRE DE AÑO ---
const DB_NAME = 'MisFinanzasDB';
const DB_VERSION = 1;
const STORE_NAME = 'archived_transactions';

const initArchiveDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const saveToArchiveDB = async (transactions) => {
    if (transactions.length === 0) return;
    const db = await initArchiveDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        transactions.forEach(t => store.put(t));
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
};

window.archiveYearData = async (targetYear) => {
    const cutoffMonthId = `${targetYear}-12`;
    const txsToDelete = [];
    const txsToKeep = [];

    financeData.transactions.forEach(t => {
        if (!t.isDeleted && getTxMonthId(t) <= cutoffMonthId && t.status === 'closed') {
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

    if (txsToDelete.length === 0) return { deleted: 0, added: 0, success: true };

    const netImpact = {};
    txsToDelete.forEach(t => {
        if (t.isDeleted || (t.isSharedTrip && t.paidBy === 'companion')) return;
        const amt = round2(t.amount);
        const fromCat = getAccountObj(t.account).category;
        
        if (fromCat !== 'pocket') { 
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
                description: `Saldo Consolidado Cierre ${targetYear}`,
                amount: Math.abs(impact),
                date: `31 dic, 12:00`,
                isAdjustment: true
            });
            addedCount++;
        }
    });

    try {
        // Magia: Guardamos en IndexedDB antes de tocar localStorage
        await saveToArchiveDB(txsToDelete);
        financeData.transactions = txsToKeep.sort((a, b) => a.id - b.id);
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        return { deleted: txsToDelete.length, added: addedCount, success: true };
    } catch (error) {
        console.error("Error archivando en IndexedDB:", error);
        return { deleted: 0, added: 0, success: false };
    }
};

// --- 10. MOTORES DE PROYECCIÓN, AHORRO, CALENDARIO Y SIMULADORES (DEPURADOS DE APP.JS) ---

// A. Libre Seguro Hoy
const computeSafeToSpendToday = (monthId, currSnap) => {
    let pendingExp = 0;
    financeData.transactions.forEach(t => {
        if (!t.isDeleted && !t.isTripIsolated && !(t.isSharedTrip && t.paidBy === 'companion') && getTxMonthId(t) === monthId && t.type === 'expense' && t.status === 'pending') {
            pendingExp = round2(pendingExp + round2(t.budgetedAmount || t.amount));
        }
    });

    const mIdx = parseInt(monthId.split('-')[1], 10) - 1;
    let totalLimit = 0, totalSpentExp = 0;
    (financeData.categories.expense || []).forEach(c => {
        totalLimit = round2(totalLimit + getCategoryLimitForMonth(c, mIdx));
    });
    financeData.transactions.forEach(t => {
        if (!t.isDeleted && !t.isTripIsolated && getTxMonthId(t) === monthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)) {
            totalSpentExp = round2(totalSpentExp + round2(t.amount));
        }
    });
    const budgetRemaining = Math.max(0, round2(totalLimit - totalSpentExp));
    const monthlyDebtPayments = getCommittedMonthlyDebtQuotas(currSnap);

    let liquidAssets = 0;
    financeData.customAccounts.forEach(a => {
        if (a.category === 'asset' && !a.id.startsWith('CxC_') && a.excludeFromLiquidity !== true) {
            liquidAssets = round2(liquidAssets + round2(currSnap.bals[a.id] || 0));
        }
    });

    const obligations = round2(pendingExp + budgetRemaining + monthlyDebtPayments);
    const safeToSpend = Math.max(0, round2(liquidAssets - obligations));
    return { liquidAssets, pendingExp, budgetRemaining, monthlyDebtPayments, obligations, safeToSpend };
};

// B. Mapa de Calor del Calendario
const isTxFixedExpense = (t) => {
    const expCats = financeData.categories?.expense || [];
    const catObj = expCats.find(c => c.name === t.category);
    if (catObj?.isFixed) return true;
    if (catObj && t.subcategory && Array.isArray(catObj.subcategories)) {
        const subObj = catObj.subcategories.find(s => s.name === t.subcategory);
        if (subObj?.isFixed) return true;
    }
    return false;
};

const computeCalendarHeatmapData = (baseDate, mode = 'variable') => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = currentDate.toLocaleDateString('en-CA');
    const viewMonthId = `${year}-${String(month + 1).padStart(2, '0')}`;
    const currMonthId = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthPrefix = `${viewMonthId}-`;

    const dayActivity = {};
    financeData.transactions.forEach(t => {
        if (t.isDeleted) return;
        const dStr = new Date(t.id).toLocaleDateString('en-CA');
        if (!dStr.startsWith(monthPrefix)) return;

        if (!dayActivity[dStr]) {
            dayActivity[dStr] = { inc: false, exp: false, trf: false, pend: false, heatSpend: 0 };
        }
        if (t.status === 'pending') {
            dayActivity[dStr].pend = true;
        } else if (t.type === 'income') {
            dayActivity[dStr].inc = true;
        } else if (t.type === 'expense') {
            dayActivity[dStr].exp = true;
            if (!t.isAdjustment) {
                const excludeFixed = mode === 'variable' && (isTxFixedExpense(t) || t.isTripIsolated);
                if (!excludeFixed) {
                    dayActivity[dStr].heatSpend = round2(dayActivity[dStr].heatSpend + round2(t.amount));
                }
            }
        } else if (t.type === 'transfer') {
            dayActivity[dStr].trf = true;
        }
    });

    const spendValues = Object.values(dayActivity).map(a => a.heatSpend).filter(v => v > 0);
    const avgDailySpend = spendValues.length > 0
        ? round2(spendValues.reduce((s, v) => s + v, 0) / spendValues.length)
        : 0;

    const maxElapsedDay = viewMonthId < currMonthId
        ? daysInMonth
        : (viewMonthId === currMonthId ? currentDate.getDate() : 0);

    let zeroSpendDays = 0;
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = new Date(year, month, day).toLocaleDateString('en-CA');
        const act = dayActivity[dStr] || null;
        const daySpend = act ? act.heatSpend : 0;

        let heatClass = '';
        if (daySpend > 0 && avgDailySpend > 0) {
            const ratio = daySpend / avgDailySpend;
            if (ratio > 1.4) heatClass = 'heat-high';
            else if (ratio >= 0.75) heatClass = 'heat-med';
            else heatClass = 'heat-low';
        } else if (day <= maxElapsedDay && daySpend === 0) {
            zeroSpendDays++;
            heatClass = 'heat-zero';
        }

        days.push({
            day,
            dStr,
            act,
            daySpend,
            heatClass,
            isToday: dStr === todayStr
        });
    }

    return { offset, days, avgDailySpend, zeroSpendDays, maxElapsedDay };
};

// C. Bolsillos de Ahorro y Metas
const calcMonthsBetweenDates = (startStr, endStr) => {
    if (!endStr) return 0;
    const todayStr = currentDate.toLocaleDateString('en-CA');
    const [sy, sm, sd] = (startStr || todayStr).split('-').map(Number);
    const [ey, em, ed] = endStr.split('-').map(Number);
    return Math.max(1, (ey - sy) * 12 + (em - sm) + (ed > sd ? 1 : 0));
};

const getEffectiveStartStr = (startDateStr) => {
    const todayStr = currentDate.toLocaleDateString('en-CA');
    return (startDateStr && startDateStr > todayStr) ? startDateStr : todayStr;
};

const computePocketMetrics = (p) => {
    const principal = round2(p.principal || 0);
    const yields = round2(p.yields || 0);
    const balance = round2(principal + yields);
    const goal = round2(p.goal || 0);
    const remaining = Math.max(0, round2(goal - balance));
    const customQuota = round2(p.customQuota || 0);

    let suggestedQuota = 0;
    let monthsLeft = 0;
    let totalMonths = 0;

    if (p.targetDate) {
        const effStart = getEffectiveStartStr(p.startDate);
        monthsLeft = calcMonthsBetweenDates(effStart, p.targetDate);
        totalMonths = calcMonthsBetweenDates(p.startDate || effStart, p.targetDate);
        if (remaining > 0) {
            suggestedQuota = round2(remaining / monthsLeft);
        }
    }

    const activeQuota = customQuota > 0 ? customQuota : suggestedQuota;

    let paceStatus = null;
    if (goal > 0 && p.startDate && p.targetDate && remaining > 0) {
        const todayStr = currentDate.toLocaleDateString('en-CA');
        if (todayStr > p.startDate && totalMonths > 1) {
            const elapsedMonths = Math.max(0, totalMonths - monthsLeft);
            const expectedBalance = round2((goal / totalMonths) * elapsedMonths);
            if (balance >= expectedBalance * 0.95) paceStatus = { label: 'Al día', cls: 'good' };
            else paceStatus = { label: 'Atrasado', cls: 'warn' };
        }
    }

    return { principal, yields, balance, goal, remaining, monthsLeft, totalMonths, suggestedQuota, customQuota, activeQuota, paceStatus };
};

const getPocketsTotalSaved = () => {
    return round2((financeData.pockets || []).reduce((sum, p) => sum + round2((p.principal || 0) + (p.yields || 0)), 0));
};

const computeAllPocketsSummary = (currSnap = null) => {
    let totalSaved = 0, totalYields = 0, totalMonthlySuggested = 0;
    let totalPocketsGoal = 0, sumGoalCappedBal = 0;

    (financeData.pockets || []).forEach(p => {
        const m = computePocketMetrics(p);
        totalSaved = round2(totalSaved + m.balance);
        totalYields = round2(totalYields + m.yields);
        if (m.remaining > 0 || m.customQuota > 0) {
            totalMonthlySuggested = round2(totalMonthlySuggested + m.activeQuota);
        }
        if (m.goal > 0) {
            totalPocketsGoal = round2(totalPocketsGoal + m.goal);
            sumGoalCappedBal = round2(sumGoalCappedBal + Math.min(m.goal, m.balance));
        }
    });

    let pocketsPct = 0;
    if (totalPocketsGoal > 0) pocketsPct = Math.min(100, Math.round((sumGoalCappedBal / totalPocketsGoal) * 100));
    else if (currSnap && currSnap.pocketsTotal > 0) pocketsPct = 100;

    return { totalSaved, totalYields, totalMonthlySuggested, totalPocketsGoal, pocketsPct };
};

// D. Modo Viaje
const getTripTagSlug = (name) => {
    const clean = String(name || 'viaje').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    return clean.length >= 2 ? clean : 'viaje';
};

const computeActiveTripStats = () => {
    const trip = financeData.tripMode || { active: false };
    if (!trip.name) return { spent: 0, count: 0, budget: 0, remaining: 0, pct: 0, slug: 'viaje', mePaid: 0, companionPaid: 0 };
    
    const slug = trip.tag || getTripTagSlug(trip.name);
    let spent = 0, count = 0, mePaid = 0, companionPaid = 0;

    financeData.transactions.forEach(t => {
        if (t.isDeleted || t.type !== 'expense' || t.isAdjustment) return;
        if ((Array.isArray(t.tags) && t.tags.includes(slug)) || t.tripName === trip.name) {
            const amt = round2(t.status === 'pending' ? (t.budgetedAmount || t.amount) : t.amount);
            spent = round2(spent + amt);
            count++;
            
            if (t.isSharedTrip) {
                if (t.paidBy === 'me') mePaid = round2(mePaid + amt);
                else if (t.paidBy === 'companion') companionPaid = round2(companionPaid + amt);
            } else {
                mePaid = round2(mePaid + amt); // Gastos no compartidos también los pagué yo
            }
        }
    });
    
    const budget = round2(trip.budget || 0);
    const remaining = budget > 0 ? round2(budget - spent) : 0;
    const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
    
    return { spent, count, budget, remaining, pct, slug, mePaid, companionPaid };
};

// E. Proyección de Efectivo Día por Día
const computeCashProjectionData = (horizon = 'eom') => {
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const todayStr = today.toLocaleDateString('en-CA');
    let endDate;

    if (horizon === '15d') endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15);
    else if (horizon === '30d') endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
    else if (horizon === '60d') endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 60);
    else endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const currMonthId = getMonthId(today);
    const currSnap = computeBalancesUpTo(currMonthId);

    let startBalance = 0;
    financeData.customAccounts.forEach(a => {
        if (a.category === 'asset' && !a.id.startsWith('CxC_') && a.excludeFromLiquidity !== true) {
            startBalance = round2(startBalance + round2(currSnap.bals[a.id] || 0));
        }
    });

    const events = [];
    const pushEvent = (dateObj, type, amount, label) => {
        if (!amount || amount <= 0) return;
        const cleanDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        if (cleanDate < today || cleanDate > endDate) return;
        events.push({
            dateStr: cleanDate.toLocaleDateString('en-CA'),
            dateObj: cleanDate,
            type,
            amount: round2(amount),
            label: stripLeadingEmoji(label)
        });
    };

    // 1. Movimientos pendientes programados
    financeData.transactions.forEach(t => {
        if (t.isDeleted || t.status !== 'pending') return;
        const txDate = new Date(t.id);
        const amt = round2(t.budgetedAmount || t.amount);
        if (t.type === 'income') {
            pushEvent(txDate, 'income', amt, t.description || 'Ingreso pendiente');
        } else if (t.type === 'expense') {
            const acc = getAccountObj(t.account);
            if (acc.category !== 'credit_card') {
                pushEvent(txDate, 'expense', amt, t.description || 'Gasto pendiente');
            }
        } else if (t.type === 'transfer') {
            const fromAcc = getAccountObj(t.account);
            const toAcc = getAccountObj(t.toAccount);
            const fromLiquid = fromAcc.category === 'asset' && !fromAcc.id.startsWith('CxC_') && fromAcc.excludeFromLiquidity !== true;
            const toLiquid = toAcc.category === 'asset' && !toAcc.id.startsWith('CxC_') && toAcc.excludeFromLiquidity !== true;
            if (fromLiquid && !toLiquid) pushEvent(txDate, 'expense', amt, t.description || 'Transferencia');
            else if (!fromLiquid && toLiquid) pushEvent(txDate, 'income', amt, t.description || 'Ingreso por transferencia');
        }
    });

    // 2. Nómina, tarjetas y préstamos mes a mes
    const salStr = localStorage.getItem('myFinancesSalary');
    const salCfg = salStr ? JSON.parse(salStr) : null;

    let iter = new Date(today.getFullYear(), today.getMonth(), 1);
    const endMonthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (iter <= endMonthStart) {
        const y = iter.getFullYear();
        const m = iter.getMonth();
        const mId = getMonthId(iter);
        const daysInM = new Date(y, m + 1, 0).getDate();

        if (salCfg && salCfg.basicSalary > 0) {
            const metrics = calculateLaborMetrics(salCfg, new Date(y, m, 15));
            const paySlots = salCfg.frequency === 'biweekly'
                ? [
                    { day: 15, amount: metrics.net1Q, label: 'Nómina (1Q)', isFirstHalf: true },
                    { day: Math.min(30, daysInM), amount: metrics.net2Q, label: 'Nómina (2Q)', isFirstHalf: false }
                ]
                : [
                    { day: Math.min(parseInt(salCfg.payDay, 10) || 30, daysInM), amount: metrics.net, label: 'Pago Nómina', isFirstHalf: null }
                ];

            paySlots.forEach(slot => {
                const alreadyRecorded = financeData.transactions.some(t => {
                    if (t.isDeleted || getTxMonthId(t) !== mId || t.type !== 'income') return false;
                    const isSal = /salario|n[oó]mina/i.test(`${t.category || ''} ${t.description || ''}`);
                    if (!isSal) return false;
                    if (slot.isFirstHalf === null) return true;
                    const txDay = new Date(t.id).getDate();
                    return slot.isFirstHalf ? txDay <= 16 : txDay > 16;
                });
                if (!alreadyRecorded) {
                    pushEvent(new Date(y, m, slot.day), 'income', slot.amount, slot.label);
                }
            });
        }

        financeData.customAccounts.filter(a => a.category === 'credit_card').forEach(c => {
            const bal = round2(currSnap.bals[c.id] || 0);
            if (bal <= 0 || !c.paymentDay) return;
            const alreadyPaid = financeData.transactions.some(t => !t.isDeleted && getTxMonthId(t) === mId && t.toAccount === c.id && t.type === 'transfer');
            if (!alreadyPaid) {
                const minPay = calculateCardMinPaymentEstimate(c, bal).totalMinPayment;
                pushEvent(new Date(y, m, Math.min(c.paymentDay, daysInM)), 'expense', minPay, `Tarjeta ${c.name}`);
            }
        });

        financeData.customAccounts.filter(a => a.category === 'debt' && !a.payrollDeduction).forEach(d => {
            const bal = round2(currSnap.bals[d.id] || 0);
            if (bal <= 0) return;
            const alreadyPaid = financeData.transactions.some(t => !t.isDeleted && getTxMonthId(t) === mId && t.toAccount === d.id && t.type === 'transfer');
            if (!alreadyPaid) {
                const qAmt = getDebtMonthlyQuotaBreakdown(d, bal).totalQuota;
                pushEvent(new Date(y, m, Math.min(d.paymentDay || 30, daysInM)), 'expense', qAmt, `Cuota ${d.name}`);
            }
        });

        iter.setMonth(iter.getMonth() + 1);
    }

    // 3. Suscripciones activas con cargo a liquidez
    (financeData.subscriptions || []).filter(s => s.status === 'active' && s.nextBillingDate).forEach(sub => {
        const acc = getAccountObj(sub.accountId);
        if (acc.category === 'credit_card') return;
        const [sy, sm, sd] = sub.nextBillingDate.split('-').map(Number);
        let nextD = new Date(sy, sm - 1, sd);
        let guard = 0;
        while (nextD <= endDate && guard < 24) {
            guard++;
            if (nextD >= today) {
                pushEvent(nextD, 'expense', sub.amount, `Suscripción: ${sub.name}`);
            }
            if (sub.cycle === 'monthly') nextD.setMonth(nextD.getMonth() + 1);
            else if (sub.cycle === 'bimonthly') nextD.setMonth(nextD.getMonth() + 2);
            else if (sub.cycle === 'quarterly') nextD.setMonth(nextD.getMonth() + 3);
            else if (sub.cycle === 'semiannual') nextD.setMonth(nextD.getMonth() + 6);
            else if (sub.cycle === 'annual') nextD.setFullYear(nextD.getFullYear() + 1);
            else if (sub.cycle === 'weekly') nextD.setDate(nextD.getDate() + 7);
            else break;
        }
    });

    const grouped = {};
    events.forEach(ev => {
        if (!grouped[ev.dateStr]) grouped[ev.dateStr] = { dateStr: ev.dateStr, dateObj: ev.dateObj, items: [] };
        grouped[ev.dateStr].items.push(ev);
    });

    const sortedDays = Object.values(grouped).sort((a, b) => a.dateObj - b.dateObj);
    let running = startBalance;
    let lowestBalance = startBalance;
    let lowestDateStr = todayStr;
    let totalIn = 0;
    let totalOut = 0;

    sortedDays.forEach(dayGroup => {
        let dayIn = 0, dayOut = 0;
        dayGroup.items.forEach(it => {
            if (it.type === 'income') dayIn = round2(dayIn + it.amount);
            else dayOut = round2(dayOut + it.amount);
        });
        totalIn = round2(totalIn + dayIn);
        totalOut = round2(totalOut + dayOut);
        running = round2(running + dayIn - dayOut);
        dayGroup.endBalance = running;

        if (running < lowestBalance) {
            lowestBalance = running;
            lowestDateStr = dayGroup.dateStr;
        }
    });

    return { today, todayStr, endDate, startBalance, endBalance: running, totalIn, totalOut, lowestBalance, lowestDateStr, sortedDays };
};

// F. Calculadora de Ahorro e Interés Compuesto
const calculateCompoundSavingsProjection = ({ currentAge, targetAge, initial, periodsPerYear, contribution, annualRate, taxRate = 0 }) => {
    const years = targetAge - currentAge;
    if (years <= 0 || years > 70) return { valid: false, years };

    const safeInitial = round2(initial || 0);
    const safeContrib = round2(contribution || 0);
    const safeRate = Math.max(0, Math.min(30, annualRate || 0));
    const periodicRate = safeRate > 0 ? Math.pow(1 + safeRate / 100, 1 / periodsPerYear) - 1 : 0;

    let balance = safeInitial;
    let totalContributed = safeInitial;
    let totalTax = 0;
    const timeline = [{ year: 0, age: currentAge, contributed: totalContributed, interest: 0, tax: 0, balance }];

    for (let y = 1; y <= years; y++) {
        let yearInterest = 0;
        let yearTax = 0;
        for (let p = 0; p < periodsPerYear; p++) {
            const grossInterest = balance * periodicRate;
            const taxWithheld = grossInterest * taxRate;
            const netInterest = grossInterest - taxWithheld;
            
            yearInterest += netInterest;
            yearTax += taxWithheld;
            
            balance = balance + netInterest + safeContrib;
            totalContributed += safeContrib;
        }
        
        totalTax += yearTax;
        const cleanBal = round2(balance);
        const cleanContrib = round2(totalContributed);
        timeline.push({
            year: y,
            age: currentAge + y,
            contributed: cleanContrib,
            interest: Math.max(0, round2(cleanBal - cleanContrib)),
            tax: round2(totalTax),
            balance: cleanBal
        });
    }

    const finalSnap = timeline[timeline.length - 1];
    const totalAdded = round2(finalSnap.contributed - safeInitial);
    const principalPct = finalSnap.balance > 0 ? Math.round((finalSnap.contributed / finalSnap.balance) * 100) : 100;
    const interestPct = Math.max(0, 100 - principalPct);

    return {
        valid: true,
        years,
        currentAge,
        targetAge,
        initial: safeInitial,
        totalAdded,
        totalTax: round2(totalTax),
        finalSnap,
        principalPct,
        interestPct,
        timeline
    };
};

// G. Simulador de Planificador de Deudas (Avalancha / Bola de Nieve)
const computeDebtPlannerSimulation = ({ monthId, strategy = 'avalanche', extraMonthly = 0, primaMode = 'both' }) => {
    const snap = computeBalancesUpTo(monthId);
    const allPositiveDebts = financeData.customAccounts
        .filter(a => (a.category === 'debt' || a.category === 'credit_card') && snap.bals[a.id] > 0)
        .map(a => {
            const bal = round2(snap.bals[a.id]);
            let rate = 0, minPay = 0;
            if (a.category === 'debt') {
                rate = a.debtRateType === 'annual' ? (Math.pow(1 + (a.debtRate || 0) / 100, 1 / 12) - 1) * 100 : (a.debtRate || 0);
                minPay = a.debtMonthlyPayment || 0;
                if (minPay === 0 && a.debtType !== 'revolving') {
                    minPay = calculateAmortization(a.debtOriginal || bal, a.debtTotalQuotes || 1, rate, 'monthly').payment;
                } else if (a.debtType === 'revolving') {
                    const revPurchases = getPendingRevolvingPurchases(a.id);
                    minPay = round2(minPay + revPurchases.reduce((s, p) => s + p.nextQuota, 0));
                    if (rate <= 0 && revPurchases.length > 0) {
                        const maxPurchRate = Math.max(...revPurchases.map(p => p.rateType === 'annual' ? (Math.pow(1 + (p.rate || 0) / 100, 1 / 12) - 1) * 100 : (p.rate || 0)));
                        if (maxPurchRate > 0) rate = maxPurchRate;
                    }
                }
            } else {
                rate = a.rateType === 'annual' ? (Math.pow(1 + (a.rate || 0) / 100, 1 / 12) - 1) * 100 : (a.rate || 0);
                const est = calculateCardMinPaymentEstimate(a, bal);
                const baseCardQuota = round2(a.initialDebtQuota || 0) > 0 ? round2(a.initialDebtQuota) : round2(bal * 0.05);
                minPay = round2(baseCardQuota + est.mgmtFeeAmt + est.insuranceAmt);
            }
            return { id: a.id, name: stripLeadingEmoji(a.name), bal, rate, minPay };
        });

    const activeDebts = allPositiveDebts.filter(d => d.rate > 0);
    const excludedZeroRateDebts = allPositiveDebts.filter(d => d.rate <= 0);

    if (activeDebts.length === 0) {
        return { activeDebts, excludedZeroRateDebts, baseRes: null, optRes: null, interestSaved: 0 };
    }

    let halfPrima = 0;
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (salaryStr) halfPrima = calculateLaborMetrics(JSON.parse(salaryStr), currentDate).halfPrimaNeta;

    const [startY, startM] = monthId.split('-').map(Number);

    const simAmort = (debts, addExtra) => {
        let simDebts = debts.map(d => ({ ...d }));
        const baseMonthlyPool = round2(simDebts.reduce((s, d) => s + d.minPay, 0));
        let monthIter = new Date(startY, startM - 1, 1);
        let totalInterest = 0, monthsCount = 0;
        const schedule = [];
        let isUnpayable = false;

        while (simDebts.length > 0 && monthsCount < 360) {
            monthsCount++;
            let currentMonthExtra = addExtra ? extraMonthly : 0;
            if (addExtra) {
                const mStr = `${monthIter.getFullYear()}-${String(monthIter.getMonth() + 1).padStart(2, '0')}`;
                const mExtraObj = financeData.plannerExtras.find(e => e.month === mStr);
                if (mExtraObj) currentMonthExtra += mExtraObj.amount;
                if (monthIter.getMonth() === 5 && (primaMode === 'both' || primaMode === 'june')) currentMonthExtra += halfPrima;
                if (monthIter.getMonth() === 11 && (primaMode === 'both' || primaMode === 'december')) currentMonthExtra += halfPrima;
            }

            let monthInterest = 0, monthTotalPay = 0;
            simDebts.forEach(d => {
                const int = round2(d.bal * (d.rate / 100));
                monthInterest = round2(monthInterest + int);
                totalInterest = round2(totalInterest + int);
                d.bal = round2(d.bal + int);
            });

            if (addExtra) simDebts.sort((a, b) => strategy === 'avalanche' ? b.rate - a.rate : a.bal - b.bal);
            const focusDebtObj = simDebts.length > 0 ? simDebts[0] : null;
            const focusDebtName = focusDebtObj ? focusDebtObj.name : 'Liberado';

            simDebts.forEach(d => {
                const pay = Math.min(d.bal, d.minPay);
                d.bal = round2(d.bal - pay);
                monthTotalPay = round2(monthTotalPay + pay);
            });

            const freedPool = addExtra ? Math.max(0, round2(baseMonthlyPool - monthTotalPay)) : 0;
            let leftover = round2(freedPool + currentMonthExtra);
            if (addExtra && leftover > 0) {
                for (const target of simDebts) {
                    if (target.bal > 0) {
                        const extraPay = Math.min(target.bal, leftover);
                        target.bal = round2(target.bal - extraPay);
                        monthTotalPay = round2(monthTotalPay + extraPay);
                        leftover = round2(leftover - extraPay);
                        if (leftover <= 0) break;
                    }
                }
            }

            const focusRemainingBalance = focusDebtObj ? round2(focusDebtObj.bal) : 0;
            simDebts = simDebts.filter(d => d.bal > 0);
            const currentTotalBalance = round2(simDebts.reduce((s, d) => s + d.bal, 0));

            if (!addExtra && monthsCount === 12 && monthTotalPay <= monthInterest) {
                isUnpayable = true;
                break;
            }

            if (addExtra && monthsCount <= 36) {
                schedule.push({
                    monthStr: `${getShortMonthLabel(monthIter)} ${String(monthIter.getFullYear()).slice(-2)}`,
                    targetName: focusDebtName,
                    pay: monthTotalPay,
                    int: monthInterest,
                    focusRem: focusRemainingBalance,
                    rem: currentTotalBalance
                });
            }
            monthIter.setMonth(monthIter.getMonth() + 1);
        }

        if (!addExtra && monthsCount >= 360) isUnpayable = true;
        return { months: monthsCount, interest: totalInterest, schedule, freedomDate: monthIter, isUnpayable };
    };

    const baseRes = simAmort(activeDebts, false);
    const optRes = simAmort(activeDebts, true);
    const interestSaved = Math.max(0, round2(baseRes.interest - optRes.interest));

    return { activeDebts, excludedZeroRateDebts, baseRes, optRes, interestSaved };
};

// H. Simulador de Aumento Salarial y Retroactivo
const getHalfMonthIndex = (monthStr, period) => {
    if (!monthStr || !monthStr.includes('-')) return 0;
    const [y, m] = monthStr.split('-').map(Number);
    return y * 24 + (m - 1) * 2 + (period === '2Q' ? 1 : 0);
};

const computeSalaryRaiseSimulation = ({
    currentBasic, newBasic, baseSalaryConfig = {},
    effMonth, effPeriod = 'M', isRetro = false,
    retroFromMonth, retroFromPeriod = 'M', retroPayMonth, retroPayPeriod = 'M'
}) => {
    const curB = round2(currentBasic || 0);
    const newB = round2(newBasic || 0);
    if (curB <= 0 || newB <= 0 || newB === curB) return null;

    const diff = round2(newB - curB);
    const pct = round2((diff / curB) * 100);

    const currentMetrics = calculateLaborMetrics({ ...baseSalaryConfig, basicSalary: curB }, currentDate);
    const newMetrics = calculateLaborMetrics({ ...baseSalaryConfig, basicSalary: newB }, currentDate);
    const netDiff = round2(newMetrics.net - currentMetrics.net);

    const activeEffMonth = effMonth || getMonthId(currentDate);
    const activeFromMonth = retroFromMonth || activeEffMonth;
    const activePayMonth = retroPayMonth || activeEffMonth;

    let retroHalfMonths = 0;
    let retroNetAmount = 0;

    if (isRetro) {
        const effIdx = getHalfMonthIndex(activeEffMonth, effPeriod);
        const fromIdx = getHalfMonthIndex(activeFromMonth, retroFromPeriod);
        if (effIdx > fromIdx) {
            retroHalfMonths = effIdx - fromIdx;
            for (let h = fromIdx; h < effIdx; h++) {
                const qDiff = (h % 2 === 0)
                    ? round2(newMetrics.net1Q - currentMetrics.net1Q)
                    : round2(newMetrics.net2Q - currentMetrics.net2Q);
                retroNetAmount = round2(retroNetAmount + qDiff);
            }
        }
    }

    return {
        currentBasic: curB, newBasic: newB, diff, pct,
        currentMetrics, newMetrics, netDiff,
        effMonth: activeEffMonth, effPeriod,
        isRetro, retroFromMonth: activeFromMonth, retroFromPeriod,
        retroPayMonth: activePayMonth, retroPayPeriod,
        retroHalfMonths, retroNetAmount
    };
};

// I. Capacidad de Endeudamiento Detallada con Gastos Fijos y Flujo Libre
const computeDetailedBorrowingCapacity = (monthId) => {
    const cap = calculateBorrowingCapacity(monthId);
    const mIdx = parseInt(monthId.split('-')[1], 10) - 1;

    let totalFixedExpenses = 0;
    (financeData.categories.expense || []).forEach(c => {
        if (c.isFixed) {
            totalFixedExpenses = round2(totalFixedExpenses + (getCategoryLimitForMonth(c, mIdx) || 0));
        } else if (c.subcategories) {
            c.subcategories.forEach(sub => {
                if (sub.isFixed) totalFixedExpenses = round2(totalFixedExpenses + (sub.limit || 0));
            });
        }
    });

    const healthyDebtLimit = round2((cap.baseIncome * cap.maxPct) / 100);
    const freeCashFlow = round2(cap.baseIncome - totalFixedExpenses - cap.committedMonthly);
    const mathAvailableDebt = round2(healthyDebtLimit - cap.committedMonthly);
    const realSafeQuota = Math.max(0, Math.min(mathAvailableDebt, freeCashFlow));
    const isDeficit = freeCashFlow < 0 || mathAvailableDebt < 0;
    const visualQuota = isDeficit ? Math.min(mathAvailableDebt, freeCashFlow) : realSafeQuota;

    return {
        ...cap,
        totalFixedExpenses,
        healthyDebtLimit,
        freeCashFlow,
        mathAvailableDebt,
        realSafeQuota,
        isDeficit,
        visualQuota,
        loan24: round2(visualQuota * 24 * 0.75),
        loan36: round2(visualQuota * 36 * 0.70)
    };
};

// J. Matriz Consolidada de Control Anual
const computeAnnualControlMatrix = (year) => {
    const incPtto = Array(12).fill(0), incReal = Array(12).fill(0);
    const expPtto = Array(12).fill(0), expReal = Array(12).fill(0);

    const buildRows = (type) => {
        const sortedCats = [...(financeData.categories[type] || [])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        return sortedCats.map(catObj => {
            const pttoArr = Array(12).fill(0), realArr = Array(12).fill(0);
            for (let m = 0; m < 12; m++) {
                const mId = `${year}-${String(m + 1).padStart(2, '0')}`;
                const lim = getCategoryLimitForMonth(catObj, m, year);
                pttoArr[m] = lim;

                realArr[m] = round2(financeData.transactions
                    .filter(t => !t.isDeleted && getTxMonthId(t) === mId && t.type === type && t.category === catObj.name && !t.isAdjustment && isTxClosed(t))
                    .reduce((s, t) => s + round2(t.amount), 0));

                if (type === 'income') {
                    incPtto[m] = round2(incPtto[m] + lim);
                    incReal[m] = round2(incReal[m] + realArr[m]);
                } else {
                    expPtto[m] = round2(expPtto[m] + lim);
                    expReal[m] = round2(expReal[m] + realArr[m]);
                }
            }
            return { name: catObj.name, pttoArr, realArr };
        });
    };

    const incRows = buildRows('income');
    const expRows = buildRows('expense');

    let totIncP = 0, totIncR = 0, totExpP = 0, totExpR = 0;
    for (let i = 0; i < 12; i++) {
        totIncP = round2(totIncP + incPtto[i]);
        totIncR = round2(totIncR + incReal[i]);
        totExpP = round2(totExpP + expPtto[i]);
        totExpR = round2(totExpR + expReal[i]);
    }

    return {
        incPtto, incReal, expPtto, expReal,
        incRows, expRows,
        totIncP, totIncR, totExpP, totExpR,
        totNetP: round2(totIncP - totExpP),
        totNetR: round2(totIncR - totExpR)
    };
};

// --- 11. ASESORES INTELIGENTES, COMPRA CONSCIENTE, CIERRE DE MES Y GASTOS HORMIGA ---

// K. Asesor: ¿Con qué tarjeta pago hoy?
const evaluateBestCreditCardForPurchase = (purchaseAmount = 0, installments = 1, refDate = currentDate) => {
    const amt = Math.max(0, round2(purchaseAmount));
    const inst = Math.max(1, parseInt(installments, 10) || 1);
    const cards = financeData.customAccounts.filter(a => a.category === 'credit_card');
    if (cards.length === 0) return { cards: [], bestCard: null };

    const currSnap = computeBalancesUpTo(getMonthId(refDate));
    const cleanRef = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const y = cleanRef.getFullYear();
    const m = cleanRef.getMonth();

    const evaluated = cards.map(card => {
        const debt = Math.max(0, round2(currSnap.bals[card.id] || 0));
        const limit = round2(card.creditLimit || 0);
        const available = round2(limit - debt);
        const hasEnoughCredit = limit <= 0 || amt <= 0 || available >= amt;

        const cDay = Math.max(1, Math.min(31, parseInt(card.cutoffDay, 10) || 15));
        const pDay = Math.max(1, Math.min(31, parseInt(card.paymentDay, 10) || 30));

        const daysInCurr = new Date(y, m + 1, 0).getDate();
        let nextCut;
        if (cleanRef.getDate() <= cDay) {
            nextCut = new Date(y, m, Math.min(cDay, daysInCurr));
        } else {
            const daysInNext = new Date(y, m + 2, 0).getDate();
            nextCut = new Date(y, m + 1, Math.min(cDay, daysInNext));
        }

        const cutY = nextCut.getFullYear();
        const cutM = nextCut.getMonth();
        const payMonthOffset = pDay > cDay ? 0 : 1;
        const daysInPayM = new Date(cutY, cutM + payMonthOffset + 1, 0).getDate();
        const payDate = new Date(cutY, cutM + payMonthOffset, Math.min(pDay, daysInPayM));

        const daysToCutoff = Math.max(0, Math.round((nextCut - cleanRef) / 86400000));
        const daysToPayment = Math.max(1, Math.round((payDate - cleanRef) / 86400000));

        const est = calculateCardMinPaymentEstimate(card, debt, refDate);
        const waiverType = card.mgmtFeeWaiverType || 'spend';
        const waiverSpend = round2(card.mgmtFeeWaiverSpend || 0);

        let missingForWaiver = 0;
        let wouldUnlockWaiver = false;
        let waiverSavedAmt = 0;

        if (est.hasMgmtFee && est.mgmtFeeStatus === 'charged' && (waiverType === 'spend' || waiverType === 'either') && waiverSpend > 0) {
            missingForWaiver = Math.max(0, round2(waiverSpend - est.cycleSpend));
            if (amt > 0 && amt >= missingForWaiver) {
                wouldUnlockWaiver = true;
                waiverSavedAmt = round2(card.mgmtFee || 0);
            }
        }

        const zeroIntMax = parseInt(card.zeroInterestMax, 10) || 0;
        const isZeroInterest = inst <= 1 || (zeroIntMax > 0 && inst <= zeroIntMax) || (card.rate || 0) <= 0;
        let interestCost = 0;
        let monthlyQuota = amt > 0 ? round2(amt / inst) : 0;

        if (!isZeroInterest && amt > 0) {
            const amort = calculateAmortization(amt, inst, card.rate || 0, card.rateType || 'monthly');
            interestCost = amort.totalInterest;
            monthlyQuota = amort.payment;
        }

        const newUtilPct = limit > 0 ? round2(((debt + amt) / limit) * 100) : 0;

        let score = daysToPayment;
        if (!hasEnoughCredit) score -= 1000;
        if (wouldUnlockWaiver) score += 45;
        if (!est.hasMgmtFee || est.mgmtFeeStatus === 'waived') score += 12;
        if (inst > 1 && isZeroInterest) score += 25;
        if (interestCost > 0) score -= Math.min(35, interestCost / 2000);
        if (newUtilPct > 75) score -= 12;

        const reasons = [];
        reasons.push(`${daysToPayment} días hasta el pago (corte en ${daysToCutoff}d)`);
        if (wouldUnlockWaiver) reasons.push(`Ahorras ${formatMoney(waiverSavedAmt)} de cuota de manejo`);
        else if (missingForWaiver > 0) reasons.push(`Faltan ${formatMoney(missingForWaiver)} en compras para exonerar manejo`);
        else if (est.mgmtFeeStatus === 'waived') reasons.push('Cuota de manejo ya exonerada');
        if (inst > 1) {
            reasons.push(isZeroInterest ? `0% interés hasta ${zeroIntMax || inst} cuotas` : `Interés estimado: ${formatMoney(interestCost)}`);
        }

        return {
            id: card.id,
            name: stripLeadingEmoji(card.name),
            isDefault: !!card.isDefault,
            debt,
            limit,
            available,
            hasEnoughCredit,
            newUtilPct,
            daysToCutoff,
            daysToPayment,
            payDateStr: `${payDate.getDate()} ${getShortMonthLabel(payDate).toLowerCase()}.`,
            wouldUnlockWaiver,
            waiverSavedAmt,
            missingForWaiver,
            mgmtFeeStatus: est.mgmtFeeStatus,
            isZeroInterest,
            interestCost,
            monthlyQuota,
            score: round2(score),
            reasons
        };
    });

    evaluated.sort((a, b) => b.score - a.score);
    return { cards: evaluated, bestCard: evaluated[0] || null };
};

// L. Simulador de Compra Inteligente (Horas de vida + Impacto en caja)
const simulateSmartPurchase = ({ amount = 0, installments = 1, paymentMethod = 'cash', cardId = '' }) => {
    const amt = Math.max(0, round2(amount));
    const inst = Math.max(1, parseInt(installments, 10) || 1);

    // 1. Equivalencia en horas de trabajo neto
    const salStr = localStorage.getItem('myFinancesSalary');
    const salCfg = salStr ? JSON.parse(salStr) : null;
    let hasSalary = false;
    let hourlyNetRate = 0;
    let workHoursCost = 0;
    let workDaysCost = 0;

    if (salCfg && salCfg.basicSalary > 0) {
        const labor = calculateLaborMetrics(salCfg, currentDate);
        const weeklyHours = parseFloat(salCfg.weeklyHours) || 42;
        const dailyHours = weeklyHours / 6;
        const monthlyHours = round2(dailyHours * 30);
        if (labor.net > 0 && monthlyHours > 0) {
            hasSalary = true;
            hourlyNetRate = round2(labor.net / monthlyHours);
            workHoursCost = round2(amt / hourlyNetRate);
            workDaysCost = dailyHours > 0 ? round2(workHoursCost / dailyHours) : 0;
        }
    }

    // 2. Costo financiero y cuota
    let totalCost = amt;
    let totalInterest = 0;
    let monthlyQuota = amt;
    let isZeroInterest = true;
    let methodLabel = 'Efectivo / Débito';

    if (paymentMethod === 'credit_card' && cardId) {
        const card = getAccountObj(cardId);
        methodLabel = stripLeadingEmoji(card.name || 'Tarjeta');
        const zeroIntMax = parseInt(card.zeroInterestMax, 10) || 0;
        const effRate = (inst === 1 || (zeroIntMax > 0 && inst <= zeroIntMax)) ? 0 : (card.rate || 0);
        const amort = calculateAmortization(amt, inst, effRate, card.rateType || 'monthly');
        totalCost = amort.totalWithInterest;
        totalInterest = amort.totalInterest;
        monthlyQuota = amort.payment;
        isZeroInterest = totalInterest <= 0;
    }

    // 3. Impacto real en liquidez y proyección a 30 días
    const currMonthId = getMonthId(currentDate);
    const currSnap = computeBalancesUpTo(currMonthId);
    const safeData = computeSafeToSpendToday(currMonthId, currSnap);
    const proj30 = computeCashProjectionData('30d');

    const immediateCashOut = paymentMethod === 'cash' ? amt : 0;
    const budgetImpactToday = paymentMethod === 'cash' ? amt : monthlyQuota;
    const safeAfter = round2(safeData.safeToSpend - budgetImpactToday);
    const lowestAfter = round2(proj30.lowestBalance - immediateCashOut);

    const causesDeficit = amt > 0 && lowestAfter < 0;
    const exceedsSafe = amt > 0 && safeAfter < 0;

    let verdict = 'good';
    let verdictTitle = 'Compra viable sin comprometer tu caja';
    if (amt <= 0) {
        verdict = 'neutral';
        verdictTitle = 'Ingresa el valor de la compra para evaluarla';
    } else if (causesDeficit) {
        verdict = 'danger';
        verdictTitle = 'Alerta: esta compra te deja en déficit de caja en los próximos 30 días';
    } else if (exceedsSafe) {
        verdict = 'warn';
        verdictTitle = 'Cuidado: supera tu Libre Seguro Hoy y apretará tu presupuesto';
    } else if (totalInterest > amt * 0.15) {
        verdict = 'warn';
        verdictTitle = 'Viable en caja, pero pagarás bastante en intereses';
    }

    return {
        amount: amt,
        installments: inst,
        paymentMethod,
        cardId,
        methodLabel,
        hasSalary,
        hourlyNetRate,
        workHoursCost,
        workDaysCost,
        totalCost,
        totalInterest,
        monthlyQuota,
        isZeroInterest,
        safeBefore: safeData.safeToSpend,
        safeAfter,
        lowestBefore: proj30.lowestBalance,
        lowestAfter,
        causesDeficit,
        exceedsSafe,
        verdict,
        verdictTitle
    };
};

// M. Resumen / Cierre de Mes en Tarjetas Bento
const computeMonthlyRecapData = (targetMonthId = getMonthId(viewDate)) => {
    const flow = getMonthlyFlow(targetMonthId, false);
    const surplus = round2(flow.inc - flow.exp);
    const savingsRate = flow.inc > 0 ? round2((surplus / flow.inc) * 100) : 0;

    const [yStr, mStr] = targetMonthId.split('-');
    const year = parseInt(yStr, 10);
    const mIdx = parseInt(mStr, 10) - 1;

    const prevDate = new Date(year, mIdx - 1, 1);
    const prevFlow = getMonthlyFlow(getMonthId(prevDate), false);
    const expChangePct = prevFlow.exp > 0 ? round2(((flow.exp - prevFlow.exp) / prevFlow.exp) * 100) : 0;

    const catStats = (financeData.categories.expense || []).map(catObj => {
        const limit = getCategoryLimitForMonth(catObj, mIdx, year);
        const spent = round2(
            financeData.transactions
                .filter(t => !t.isDeleted && !t.isTripIsolated && getTxMonthId(t) === targetMonthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t) && t.category === catObj.name)
                .reduce((s, t) => s + round2(t.amount), 0)
        );
        const diff = limit > 0 ? round2(spent - limit) : 0;
        const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        return { name: stripLeadingEmoji(catObj.name), rawName: catObj.name, limit, spent, diff, pct };
    }).filter(c => c.spent > 0 || c.limit > 0);

    const bySpent = [...catStats].sort((a, b) => b.spent - a.spent);
    const byOver = [...catStats].filter(c => c.diff > 0).sort((a, b) => b.diff - a.diff);

    const topCategory = bySpent[0] || null;
    const mostOverBudget = byOver[0] || null;

    const pocketsList = (financeData.pockets || []).map(p => {
        const m = computePocketMetrics(p);
        return { id: p.id, name: stripLeadingEmoji(p.name), balance: m.balance, goal: m.goal, remaining: m.remaining };
    });

    return {
        monthId: targetMonthId,
        inc: flow.inc,
        exp: flow.exp,
        surplus,
        savingsRate,
        prevFlow,
        expChangePct,
        topCategory,
        mostOverBudget,
        pockets: pocketsList
    };
};

// N. Detector de Gastos Hormiga y Alzas Silenciosas en Suscripciones
const computeAntExpensesAndSubHikes = (targetMonthId = getMonthId(viewDate), smallTxThreshold = 35000) => {
    const threshold = Math.max(1000, round2(smallTxThreshold));
    const antTxs = financeData.transactions.filter(t =>
        !t.isDeleted &&
        !t.isTripIsolated &&
        getTxMonthId(t) === targetMonthId &&
        t.type === 'expense' &&
        !t.isAdjustment &&
        isTxClosed(t) &&
        !isTxFixedExpense(t) &&
        round2(t.amount) > 0 &&
        round2(t.amount) <= threshold
    );

    const totalAntSpend = round2(antTxs.reduce((s, t) => s + round2(t.amount), 0));
    const antCount = antTxs.length;
    const annualizedAntSpend = round2(totalAntSpend * 12);

    const grouped = {};
    antTxs.forEach(t => {
        const cleanDesc = stripLeadingEmoji(t.description || t.category || 'Gasto menor').trim();
        const key = cleanDesc.toLowerCase();
        if (!grouped[key]) {
            grouped[key] = { label: cleanDesc, category: stripLeadingEmoji(t.category || ''), count: 0, total: 0 };
        }
        grouped[key].count++;
        grouped[key].total = round2(grouped[key].total + round2(t.amount));
    });

    const topAntItems = Object.values(grouped)
        .sort((a, b) => b.total - a.total || b.count - a.count)
        .slice(0, 4);

    // Detectar suscripciones cuyo último cobro real superó el valor configurado o el cobro anterior
    const subHikes = [];
    (financeData.subscriptions || []).filter(s => s.status === 'active').forEach(sub => {
        const cleanSub = stripLeadingEmoji(sub.name).toLowerCase().trim();
        if (!cleanSub) return;
        const matchingTxs = financeData.transactions
            .filter(t => !t.isDeleted && t.type === 'expense' && !t.isAdjustment && isTxClosed(t) && stripLeadingEmoji(t.description || '').toLowerCase().includes(cleanSub))
            .sort((a, b) => b.id - a.id);

        if (matchingTxs.length > 0) {
            const latestAmt = round2(matchingTxs[0].amount);
            const refAmt = round2(sub.amount);
            const prevAmt = matchingTxs.length > 1 ? round2(matchingTxs[1].amount) : refAmt;
            const baseline = Math.min(refAmt, prevAmt);

            if (latestAmt > baseline + 100 && baseline > 0) {
                const delta = round2(latestAmt - baseline);
                const pctIncrease = round2((delta / baseline) * 100);
                subHikes.push({
                    id: sub.id,
                    name: stripLeadingEmoji(sub.name),
                    expectedAmt: baseline,
                    chargedAmt: latestAmt,
                    delta,
                    pctIncrease
                });
            }
        }
    });

    return {
        threshold,
        totalAntSpend,
        antCount,
        annualizedAntSpend,
        topAntItems,
        subHikes
    };
};

// O. Simulador de Crédito y Evaluación de Capacidad Real
const simulateCreditLoan = ({
    principal = 0,
    periods = 12,
    rate = 0,
    rateType = 'annual',
    monthlyInsurance = 0,
    extraMonthly = 0
}) => {
    const amt = Math.max(0, round2(principal));
    const months = Math.max(1, Math.min(360, parseInt(periods, 10) || 12));
    const safeRate = Math.max(0, Math.min(100, parseFloat(rate) || 0));
    const safeIns = Math.max(0, round2(monthlyInsurance));
    const safeExtra = Math.max(0, round2(extraMonthly));

    const baseAmort = calculateAmortization(amt, months, safeRate, rateType);
    const baseMonthlyQuota = baseAmort.payment;
    const totalMonthlyQuota = amt > 0 ? round2(baseMonthlyQuota + safeIns) : 0;
    const totalInterest = baseAmort.totalInterest;
    const totalInsurance = amt > 0 ? round2(safeIns * months) : 0;
    const totalCost = round2(amt + totalInterest + totalInsurance);

    const monthlyRateDecimal = baseAmort.monthlyRate;
    const effectiveMonthlyRatePct = Math.round(monthlyRateDecimal * 1000000) / 10000;
    const effectiveAnnualRatePct = rateType === 'annual'
        ? safeRate
        : round2((Math.pow(1 + monthlyRateDecimal, 12) - 1) * 100);

    // Simulación con abono extra mensual (reducción de plazo)
    let accelMonths = months;
    let accelInterest = totalInterest;
    let savedInterest = 0;
    let savedMonths = 0;

    if (amt > 0 && safeExtra > 0) {
        let simBal = amt;
        let simInt = 0;
        let mCount = 0;
        const targetCapPay = round2(baseMonthlyQuota + safeExtra);

        while (simBal > 0 && mCount < 360) {
            mCount++;
            const intAmt = round2(simBal * monthlyRateDecimal);
            simInt = round2(simInt + intAmt);
            const capPay = Math.min(simBal, Math.max(0, round2(targetCapPay - intAmt)));
            if (capPay <= 0) break;
            simBal = round2(simBal - capPay);
        }

        if (simBal <= 0 && mCount < months) {
            accelMonths = mCount;
            accelInterest = round2(simInt);
            savedInterest = Math.max(0, round2(totalInterest - accelInterest));
            savedMonths = Math.max(0, months - accelMonths);
        }
    }

    // Cruce con capacidad de endeudamiento y flujo libre real del usuario
    const currMonthId = getMonthId(currentDate);
    const cap = computeDetailedBorrowingCapacity(currMonthId);
    const newCommittedDebt = round2(cap.committedMonthly + totalMonthlyQuota);
    const newDebtBurdenPct = cap.baseIncome > 0 ? round2((newCommittedDebt / cap.baseIncome) * 100) : 0;
    const remainingSafeQuota = round2(cap.realSafeQuota - totalMonthlyQuota);
    const remainingFreeCashFlow = round2(cap.freeCashFlow - totalMonthlyQuota);

    // Monto máximo recomendado según cupo seguro disponible
    const availableForDebtService = Math.max(0, round2(cap.realSafeQuota - safeIns));
    let maxAffordablePrincipal = 0;
    if (availableForDebtService > 0) {
        if (monthlyRateDecimal > 0) {
            maxAffordablePrincipal = round2(availableForDebtService * ((1 - Math.pow(1 + monthlyRateDecimal, -months)) / monthlyRateDecimal));
        } else {
            maxAffordablePrincipal = round2(availableForDebtService * months);
        }
    }

    let viability = 'neutral';
    let viabilityTitle = 'Ingresa el monto y plazo para simular tu crédito';
    if (amt > 0) {
        if (cap.baseIncome <= 0) {
            viability = 'warn';
            viabilityTitle = 'Configura tu nómina o ingresos para validar tu capacidad de pago';
        } else if (remainingFreeCashFlow < 0) {
            viability = 'danger';
            viabilityTitle = 'Riesgo alto: esta cuota supera tu flujo libre mensual tras gastos fijos';
        } else if (remainingSafeQuota < 0) {
            viability = 'warn';
            viabilityTitle = `Precaución: supera tu tope saludable del ${cap.maxPct}%, aunque tu flujo libre alcanza`;
        } else {
            viability = 'good';
            viabilityTitle = 'Crédito viable: cabe dentro de tu capacidad saludable y flujo libre';
        }
    }

    const principalPct = totalCost > 0 ? Math.round((amt / totalCost) * 100) : 100;
    const extraCostPct = Math.max(0, 100 - principalPct);

    return {
        principal: amt,
        periods: months,
        rate: safeRate,
        rateType,
        monthlyInsurance: safeIns,
        extraMonthly: safeExtra,
        baseMonthlyQuota,
        totalMonthlyQuota,
        totalInterest,
        totalInsurance,
        totalCost,
        effectiveMonthlyRatePct,
        effectiveAnnualRatePct,
        schedule: baseAmort.schedule,
        accelMonths,
        accelInterest,
        savedInterest,
        savedMonths,
        principalPct,
        extraCostPct,
        cap,
        newCommittedDebt,
        newDebtBurdenPct,
        remainingSafeQuota,
        remainingFreeCashFlow,
        maxAffordablePrincipal,
        viability,
        viabilityTitle
    };
};

// P. Comparador de Ofertas de Crédito (Banco A vs. Banco B)
const compareCreditOffers = ({ principal = 0, offerA = {}, offerB = {} }) => {
    const amt = Math.max(0, round2(principal));

    const evaluateOffer = (rawOffer, fallbackName) => {
        const name = String(rawOffer.name || '').trim() || fallbackName;
        const periods = Math.max(1, Math.min(360, parseInt(rawOffer.periods, 10) || 12));
        const rate = Math.max(0, Math.min(100, parseFloat(rawOffer.rate) || 0));
        const rateType = rawOffer.rateType === 'monthly' ? 'monthly' : 'annual';
        const monthlyInsurance = Math.max(0, round2(rawOffer.monthlyInsurance));
        const upfrontFee = Math.max(0, round2(rawOffer.upfrontFee));

        const amort = calculateAmortization(amt, periods, rate, rateType);
        const baseQuota = amort.payment;
        const monthlyQuota = amt > 0 ? round2(baseQuota + monthlyInsurance) : 0;
        const totalInterest = amort.totalInterest;
        const totalInsurance = amt > 0 ? round2(monthlyInsurance * periods) : 0;
        const totalExtraCost = amt > 0 ? round2(totalInterest + totalInsurance + upfrontFee) : 0;
        const totalCost = amt > 0 ? round2(amt + totalExtraCost) : 0;

        const monthlyRateDecimal = amort.monthlyRate;
        const effectiveAnnualRatePct = rateType === 'annual'
            ? rate
            : round2((Math.pow(1 + monthlyRateDecimal, 12) - 1) * 100);

        return {
            name,
            periods,
            rate,
            rateType,
            monthlyInsurance,
            upfrontFee,
            baseQuota,
            monthlyQuota,
            totalInterest,
            totalInsurance,
            totalExtraCost,
            totalCost,
            effectiveAnnualRatePct
        };
    };

    const resA = evaluateOffer(offerA, 'Banco A');
    const resB = evaluateOffer(offerB, 'Banco B');

    if (amt <= 0) {
        return { valid: false, principal: 0, resA, resB, winner: null, totalSavings: 0, monthlyDiff: 0, higherQuotaWarning: false };
    }

    const diffTotal = round2(resA.totalCost - resB.totalCost);
    let winner = 'tie';
    if (diffTotal < -1) winner = 'A';
    else if (diffTotal > 1) winner = 'B';

    const totalSavings = Math.abs(diffTotal);
    const monthlyDiff = Math.abs(round2(resA.monthlyQuota - resB.monthlyQuota));

    // Detectar si el banco ganador en costo total exige una cuota mensual más alta (ej. menor plazo)
    const higherQuotaWarning =
        (winner === 'A' && resA.monthlyQuota > resB.monthlyQuota + 1) ||
        (winner === 'B' && resB.monthlyQuota > resA.monthlyQuota + 1);

    return {
        valid: true,
        principal: amt,
        resA,
        resB,
        winner,
        totalSavings,
        monthlyDiff,
        higherQuotaWarning
    };
};

// ==========================================
// FIN DE ARCHIVO: core.js
// ==========================================