// ==========================================
// app.js (v2.2.0 - Fintech Editorial)
// EL PINTOR: INTERFAZ, EVENTOS Y RENDERIZADO
// ==========================================

let isDashboardEditMode = false;
let historySearchQuery = '';
let lastPlannerScheduleText = '';
let isPrivacyMode = localStorage.getItem('myFinancesPrivacyMode') === 'true';

// --- MODO DEMO ---
const applyDemoData = () => {
    const d = new Date();
    const curY = d.getFullYear();
    const curM = d.getMonth();
    const pad = (n) => String(n).padStart(2, '0');
    const curId = `${curY}-${pad(curM + 1)}`;
    const now = d.getTime();

    const dTrans = [
        { id: now-86400000*20, monthId: curId, type: 'income', status: 'closed', account: 'Efectivo', category: 'Salario / Nómina', description: 'Pago de quincena', amount: 1500000, date: `${d.getDate()-20} ${getShortMonthLabel(d)}` },
        { id: now-86400000*18, monthId: curId, type: 'expense', status: 'closed', account: 'Efectivo', category: 'Vivienda y Servicios', description: 'Arriendo', amount: 800000, date: `${d.getDate()-18} ${getShortMonthLabel(d)}` },
        { id: now-86400000*15, monthId: curId, type: 'expense', status: 'closed', account: 'Efectivo', category: 'Alimentación', description: 'Mercado Exito', amount: 250000, date: `${d.getDate()-15} ${getShortMonthLabel(d)}` },
        { id: now-86400000*10, monthId: curId, type: 'expense', status: 'closed', account: 'Efectivo', category: 'Transporte', description: 'Gasolina', amount: 60000, date: `${d.getDate()-10} ${getShortMonthLabel(d)}` },
        { id: now-86400000*5, monthId: curId, type: 'expense', status: 'closed', account: 'Demo_CC', category: 'Alimentación', description: 'Restaurante', amount: 85000, date: `${d.getDate()-5} ${getShortMonthLabel(d)}` },
        { id: now-86400000*2, monthId: curId, type: 'expense', status: 'closed', account: 'Demo_CC', category: 'Entretenimiento', description: 'Cine', amount: 45000, date: `${d.getDate()-2} ${getShortMonthLabel(d)}` },
        { id: now-86400000*1, monthId: curId, type: 'expense', status: 'pending', account: 'Efectivo', category: 'Salud', description: 'Cita médica (agendada)', amount: 40000, date: 'Mañana' }
    ];

    financeData.customAccounts = [
        { id: 'Efectivo', name: 'Cuenta Nómina', category: 'asset', isDefault: true, showWhenZero: false },
        { id: 'Demo_CC', name: 'Tarjeta Crédito Clásica', category: 'credit_card', isDefault: false, creditLimit: 2000000, cutoffDay: 15, paymentDay: 30, rate: 2.1, rateType: 'monthly' },
        { id: 'Demo_Debt', name: 'Crédito Vehículo', category: 'debt', debtType: 'fixed', isDefault: false, debtOriginal: 15000000, debtTotalQuotes: 48, debtPaidQuotes: 12, debtRate: 1.8, debtRateType: 'monthly', debtMonthlyPayment: 420000, paymentDay: 5 }
    ];
    
    financeData.pockets = [
        { id: 'Demo_Pck', name: 'Vacaciones', goal: 2000000, principal: 400000, yields: 12000, activeQuota: 150000, startDate: `${curY}-01-01`, targetDate: `${curY}-12-15` }
    ];

    financeData.subscriptions = [
        { id: 'Demo_Sub1', name: 'Netflix Premium', amount: 39900, cycle: 'monthly', nextBillingDate: `${curY}-${pad(curM+1)}-${pad(Math.min(28, d.getDate()+3))}`, accountId: 'Demo_CC', category: 'Entretenimiento', status: 'active' }
    ];

    financeData.transactions = dTrans;
    financeData.categoryBudgets = { 'Alimentación': 600000, 'Entretenimiento': 200000, 'Vivienda y Servicios': 900000, 'Transporte': 150000 };
    financeData.isDemoMode = true;

    localStorage.setItem('myFinances', JSON.stringify(financeData));
};

const clearDemoDataAndStart = () => {
    financeData = {
        transactions: [],
        customAccounts: [{ id: 'Efectivo', name: 'Efectivo', category: 'asset', isDefault: false, showWhenZero: false }],
        monthlyBudget: 0,
        fixedAssets: [],
        pockets: [],
        subscriptions: [],
        hideZeroAccounts: false,
        categories: financeData.categories, 
        preferences: financeData.preferences,
        isDemoMode: false
    };
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    localStorage.removeItem('myFinancesSalary');
};

// --- ICONOGRAFÍA VECTORIAL ---
const getAccountIcon = (category) => {
    const icons = { 'asset': 'bank', 'credit_card': 'card', 'debt': 'scale', 'pocket': 'piggy' };
    return renderIcon(icons[category] || 'bank', 16);
};

const getCategoryIcon = (categoryName, type) => {
    if (!categoryName) return renderIcon(type === 'income' ? 'trending-up' : 'shopping-bag', 16);
    const list = financeData.categories[type] || [];
    const cat = list.find(c => c.name === categoryName);
    if (cat && cat.icon) return renderIcon(cat.icon, 16);
    return renderIcon(inferCategoryIcon(categoryName, type), 16);
};

const cleanCatName = (name) => stripLeadingEmoji(name);

const getAssetVectorIcon = (cat) => {
    const map = { 'Inmueble': 'home', 'Vehículo': 'car', 'Inversión': 'trending-up', 'Tecnología': 'laptop', 'Coleccionable': 'diamond', 'Otro': 'layers' };
    return renderIcon(map[cat] || 'layers', 16);
};

// --- 1. REFERENCIAS PRINCIPALES DEL DOM ---
const modal = document.getElementById('transaction-modal');
const fabBtn = document.getElementById('fab-btn');
const fabMenu = document.getElementById('fab-menu');
const form = document.getElementById('transaction-form');
const typeSelect = document.getElementById('type');
const toAccountGroup = document.getElementById('group-to-account');
const categoryGroup = document.getElementById('group-category');
const ccInstallmentsBox = document.getElementById('cc-installments-box');
const transferAllocBox = document.getElementById('transfer-debt-allocation-box');
const sideDrawer = document.getElementById('side-drawer');
const sideDrawerBackdrop = document.getElementById('side-drawer-backdrop');

// --- 1.5 FORMATO VISUAL FINTECH Y PRIVACIDAD GLOBAL ---
const PRIVACY_STRING = '****';
const formatMoneyHtml = (amount) => {
    if (isPrivacyMode) {
        return amount < 0 ? `<span style="font-weight:700;">-${PRIVACY_STRING}</span>` : `<span style="font-weight:700;">${PRIVACY_STRING}</span>`;
    }
    const rawFormat = formatMoney(amount);
    const isCompact = financeData.useCompactNumbers && Math.abs(amount) >= 1000;
    if (isCompact) return formatCompact(amount);
    if (rawFormat.includes(',')) {
        const parts = rawFormat.split(',');
        return `${parts[0]}<span style="font-size: 0.66em; opacity: 0.58; font-weight: 600;">,${parts[1]}</span>`;
    }
    return rawFormat;
};

// --- 2. FORMATEO NUMÉRICO EN VIVO ---
window.applyLiveDecimalFormatting = (inputEl) => {
    if (!inputEl) return;
    const rawVal = inputEl.value;
    const selStart = inputEl.selectionStart;

    let sigCharsBefore = 0;
    if (typeof selStart === 'number') {
        for (let i = 0; i < selStart; i++) {
            const ch = rawVal[i];
            if ((ch >= '0' && ch <= '9') || ch === ',' || ch === '.' || ch === '-') {
                if (ch === '.' && (rawVal.match(/\./g) || []).length > 1) continue;
                sigCharsBefore++;
            }
        }
    }

    const formatted = formatNumberInput(rawVal);
    if (formatted === rawVal) return;

    inputEl.value = formatted;

    if (typeof selStart === 'number') {
        let newCursor = 0;
        let seenSig = 0;
        while (newCursor < formatted.length && seenSig < sigCharsBefore) {
            const ch = formatted[newCursor];
            if ((ch >= '0' && ch <= '9') || ch === ',' || ch === '-') seenSig++;
            newCursor++;
        }
        try { inputEl.setSelectionRange(newCursor, newCursor); } catch (err) {}
    }
};

document.addEventListener('input', (e) => {
    if (e.target && (e.target.matches('input[inputmode="decimal"]') || e.target.classList.contains('money-input'))) {
        applyLiveDecimalFormatting(e.target);
    }
    const parentForm = e.target.closest('form');
    if (parentForm && parentForm.classList.contains('data-form') && isAnyModalOpen()) {
        hasUnsavedChanges = true;
    }
}, true);

document.addEventListener('change', (e) => {
    const parentForm = e.target.closest('form');
    if (parentForm && parentForm.classList.contains('data-form') && isAnyModalOpen()) {
        hasUnsavedChanges = true;
    }
});

document.addEventListener('focusin', (e) => {
    if (e.target && e.target.classList.contains('money-input')) {
        setTimeout(() => { try { e.target.setSelectionRange(0, e.target.value.length); } catch (err) {} }, 10);
    }
});

document.addEventListener('touchstart', (e) => {
    const active = document.activeElement;
    if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) {
        if (!e.target.closest('input, textarea, select, button, .calc-key, .fab-option, .fab-btn, a, summary, label')) {
            active.blur();
        }
    }
}, { passive: true });

// --- 3. MODAL UNIVERSAL DE ACCIONES RÁPIDAS ---
let quickActionHandler = null;

const openQuickActionModal = ({
    title, subtitle = 'Completa los datos', infoLabel = '', infoValue = '',
    showAccountSelect = false, accountLabel = 'Cuenta', defaultAccountId = '',
    showCategorySelect = false, showDescription = false,
    amountLabel = 'Monto ($)', defaultAmount = 0, submitLabel = 'Confirmar', onConfirm
}) => {
    const qModal = document.getElementById('quick-action-modal');
    if (!qModal) return;

    const assetsAcc = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset'));
    if (showAccountSelect && assetsAcc.length === 0) {
        alert("Crea primero una cuenta de liquidez en 'Cuentas'.");
        return;
    }

    if (document.getElementById('quick-action-title')) document.getElementById('quick-action-title').innerText = title;
    if (document.getElementById('quick-action-subtitle')) document.getElementById('quick-action-subtitle').innerText = subtitle;

    const infoBanner = document.getElementById('quick-action-info-banner');
    if (infoBanner) {
        if (infoLabel && infoValue) {
            infoBanner.classList.remove('hidden');
            if (document.getElementById('quick-action-info-label')) document.getElementById('quick-action-info-label').innerText = infoLabel;
            if (document.getElementById('quick-action-info-val')) document.getElementById('quick-action-info-val').innerText = infoValue;
        } else {
            infoBanner.classList.add('hidden');
        }
    }

    const accGroup = document.getElementById('quick-action-account-group');
    const accSelect = document.getElementById('quick-action-account');
    if (accGroup && accSelect) {
        if (showAccountSelect) {
            accGroup.classList.remove('hidden');
            if (document.getElementById('quick-action-account-label')) document.getElementById('quick-action-account-label').innerText = accountLabel;
            accSelect.innerHTML = assetsAcc.map(a => `<option value="${a.id}">${a.name}${a.isDefault ? ' ⭐' : ''}</option>`).join('');
            const preferredId = defaultAccountId || getDefaultAccountId(true);
            if (preferredId && assetsAcc.some(a => a.id === preferredId)) accSelect.value = preferredId;
        } else {
            accGroup.classList.add('hidden');
        }
    }

    const catGroup = document.getElementById('quick-action-category-group');
    const catSelect = document.getElementById('quick-action-category');
    if (catGroup && catSelect) {
        if (showCategorySelect) {
            catGroup.classList.remove('hidden');
            const list = [...(financeData.categories['expense'] || [])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
            let html = '';
            list.forEach(cat => {
                if (cat.subcategories && cat.subcategories.length > 0) {
                    html += `<optgroup label="${cat.name}">`;
                    html += `<option value="${cat.name}::General">${cat.name} (General)</option>`;
                    const subs = [...cat.subcategories].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
                    subs.forEach(sub => { html += `<option value="${cat.name}::${sub.name}">↳ ${sub.name}</option>`; });
                    html += `</optgroup>`;
                } else {
                    html += `<option value="${cat.name}::General">${cat.name}</option>`;
                }
            });
            catSelect.innerHTML = html;
        } else {
            catGroup.classList.add('hidden');
        }
    }

    const descGroup = document.getElementById('quick-action-desc-group');
    const descInput = document.getElementById('quick-action-desc');
    if (descGroup && descInput) {
        if (showDescription) {
            descGroup.classList.remove('hidden');
            descInput.value = '';
        } else {
            descGroup.classList.add('hidden');
        }
    }

    if (document.getElementById('quick-action-amount-label')) document.getElementById('quick-action-amount-label').innerText = amountLabel;
    const amtInput = document.getElementById('quick-action-amount');
    if (amtInput) amtInput.value = defaultAmount > 0 ? formatNumberInput(defaultAmount) : '';
    if (document.getElementById('quick-action-submit-btn')) document.getElementById('quick-action-submit-btn').innerText = submitLabel;

    quickActionHandler = onConfirm;
    hasUnsavedChanges = false;
    qModal.classList.remove('hidden');
    setTimeout(() => amtInput?.focus(), 80);
};

document.getElementById('quick-action-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseMoneyInput(document.getElementById('quick-action-amount')?.value);
    const accountId = document.getElementById('quick-action-account')?.value || '';
    const categoryVal = document.getElementById('quick-action-category')?.value || '';
    const descVal = document.getElementById('quick-action-desc')?.value.trim() || '';

    if (typeof quickActionHandler === 'function') {
        const ok = quickActionHandler(amount, accountId, categoryVal, descVal);
        if (ok === false) return;
    }
    hasUnsavedChanges = false;
    quickActionHandler = null;
    document.getElementById('quick-action-modal')?.classList.add('hidden');
});

// --- 3.5 MODO EXCLUSIVO / MODO DIOS ---
const getExclusiveKey = () => localStorage.getItem('myFinancesGodKey') || '@K3y$a%2026*';

if (localStorage.getItem('myFinancesExclusiveMode') === 'true') {
    document.body.classList.add('exclusive-mode-active');
    setTimeout(() => {
        const switchEl = document.getElementById('profile-exclusive-mode');
        if (switchEl) switchEl.checked = true;
    }, 500);
}

document.getElementById('profile-exclusive-mode')?.addEventListener('change', (e) => {
    if (e.target.checked) {
        const userInput = prompt('Ingresa el código de acceso exclusivo:');
        if (userInput === getExclusiveKey()) {
            localStorage.setItem('myFinancesExclusiveMode', 'true');
            document.body.classList.add('exclusive-mode-active');
            alert('Acceso concedido. Funciones exclusivas activadas.');
        } else {
            alert('Código incorrecto.');
            e.target.checked = false; 
        }
    } else {
        localStorage.removeItem('myFinancesExclusiveMode');
        document.body.classList.remove('exclusive-mode-active');
        alert('Funciones exclusivas desactivadas y ocultas.');
    }
});

document.getElementById('btn-change-god-key')?.addEventListener('click', () => {
    const current = prompt('Ingresa tu código actual:');
    if (current !== getExclusiveKey()) { alert('Código actual incorrecto.'); return; }
    const newKey = prompt('Ingresa el NUEVO código de acceso:');
    if (!newKey || newKey.trim() === '') return;
    const confirmKey = prompt('Confirma el NUEVO código:');
    if (newKey !== confirmKey) { alert('Los códigos no coinciden. Operacion cancelada.'); return; }
    localStorage.setItem('myFinancesGodKey', newKey);
    alert('Código de acceso exclusivo actualizado correctamente.');
});

// --- 4. TEMAS, MODO CLARO/OSCURO Y SEGURIDAD ---
window.applyColorModeUI = (mode) => {
    const cleanMode = ['light', 'dark', 'black', 'auto'].includes(mode) ? mode : 'auto';
    localStorage.setItem('myFinancesColorMode', cleanMode);
    if (cleanMode === 'auto') {
        document.documentElement.removeAttribute('data-color-mode');
    } else {
        document.documentElement.setAttribute('data-color-mode', cleanMode);
    }
    document.querySelectorAll('#theme-mode-segmented .segmented-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-mode') === cleanMode);
    });
};

window.applyThemeUI = (themeValue = null) => {
    const trip = financeData.tripMode || {};
    let activeTheme = themeValue || localStorage.getItem('myFinancesTheme') || 'purple';
    
    if (trip.active) {
        activeTheme = (financeData.preferences && financeData.preferences.tripTheme) ? financeData.preferences.tripTheme : '#0ea5e9';
    }

    const colors = getThemeColors(activeTheme);
    document.documentElement.style.setProperty('--accent', colors.accent);
    document.documentElement.style.setProperty('--theme-gradient', colors.gradient);
    document.documentElement.style.setProperty('--theme-shadow', colors.shadow);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', colors.accent);
    
    const picker = document.getElementById('custom-theme-color');
    if (picker && !trip.active) {
        picker.value = colors.accent;
        const isPreset = Array.from(document.querySelectorAll('.theme-color-btn')).some(b => b.getAttribute('data-theme') === activeTheme);
        const pickerWrap = picker.closest('.custom-color-row') || picker.parentElement;
        if (pickerWrap) {
            pickerWrap.style.borderColor = !isPreset ? 'var(--accent)' : '';
            pickerWrap.style.boxShadow = !isPreset ? '0 0 0 2px var(--accent-soft)' : '';
        }
    }
    
    const tripPicker = document.getElementById('trip-theme-color');
    if (tripPicker && financeData.preferences && financeData.preferences.tripTheme) {
        tripPicker.value = financeData.preferences.tripTheme;
    }

    document.querySelectorAll('.theme-color-btn').forEach(b => {
        b.classList.toggle('active', !trip.active && b.getAttribute('data-theme') === activeTheme);
    });
};

const persistProfileDisplayName = (rawName) => {
    if (!authData) return false;
    const cleanName = String(rawName || '').trim();
    if (!cleanName) return false;

    const oldName = authData.name;
    authData.name = cleanName;

    let updated = false;
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || k === 'myFinances' || k === 'myFinancesSalary') continue;
        try {
            const parsed = JSON.parse(localStorage.getItem(k));
            if (parsed && typeof parsed === 'object' && parsed.name === oldName) {
                parsed.name = cleanName;
                localStorage.setItem(k, JSON.stringify(parsed));
                updated = true;
                break;
            }
        } catch (e) {}
    }
    if (!updated) {
        localStorage.setItem('myFinancesAuth', JSON.stringify(authData));
    }
    syncUserUI();
    return true;
};

document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-save-profile-name')) {
        const input = document.getElementById('profile-display-name-input');
        const btn = document.getElementById('btn-save-profile-name');
        if (!input || !persistProfileDisplayName(input.value)) {
            alert('Escribe un nombre válido para tu perfil.');
            return;
        }
        if (btn) {
            const origText = btn.innerText;
            btn.innerText = '✓ Listo';
            setTimeout(() => { btn.innerText = origText; }, 1400);
        }
    } else if (e.target.closest('#profile-modal-name')) {
        document.getElementById('profile-main-view')?.classList.add('hidden');
        document.querySelectorAll('.profile-body').forEach(v => v.classList.add('hidden'));
        const themeView = document.getElementById('profile-theme-view');
        if (themeView) {
            themeView.classList.remove('hidden');
            themeView.scrollTop = 0;
        }
    }
});

document.getElementById('profile-display-name-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-save-profile-name')?.click();
    }
});

const syncUserUI = () => {
    if (!authData) return;
    const firstName = authData.name.split(' ')[0];
    const initial = authData.name.charAt(0).toUpperCase();

    if (document.getElementById('app-title')) document.getElementById('app-title').innerText = 'Mis Finanzas';
    if (document.getElementById('profile-avatar-initial')) document.getElementById('profile-avatar-initial').innerText = initial;
    if (document.getElementById('profile-modal-avatar')) document.getElementById('profile-modal-avatar').innerText = initial;

    const modalNameEl = document.getElementById('profile-modal-name');
    if (modalNameEl) {
        modalNameEl.style.cursor = 'pointer';
        modalNameEl.title = 'Toca para cambiar tu nombre';
        modalNameEl.innerHTML = `Hola, <span style="border-bottom: 2px dashed rgba(255,255,255,0.4); padding-bottom: 2px;">${firstName}</span>`;
    }

    const nameInputEl = document.getElementById('profile-display-name-input');
    if (nameInputEl && document.activeElement !== nameInputEl) {
        nameInputEl.value = authData.name || '';
        nameInputEl.style.width = '';
    }

    if (document.getElementById('login-greeting')) document.getElementById('login-greeting').innerText = `Hola de nuevo, ${firstName}`;

    const lockBtn = document.getElementById('btn-lock-app-profile');
    const pinCheck = document.getElementById('profile-enable-pin');
    const pinGroup = document.getElementById('profile-pin-group');
    const disableGroup = document.getElementById('profile-disable-pin-group');
    const modeHint = document.getElementById('profile-pin-mode-hint');
    const newPinLabel = document.getElementById('profile-new-pin-label');
    const confirmPinLabel = document.getElementById('profile-confirm-pin-label');
    const submitBtn = document.getElementById('profile-pin-submit-btn');

    document.getElementById('profile-pin-error')?.classList.add('hidden');
    disableGroup?.classList.add('hidden');
    if (document.getElementById('profile-current-pin')) document.getElementById('profile-current-pin').value = '';

    if (authData.pinEnabled && authData.pinHash) {
        lockBtn?.classList.remove('hidden');
        if (pinCheck) pinCheck.checked = true;
        pinGroup?.classList.remove('hidden');
        modeHint?.classList.remove('hidden');
        if (newPinLabel) newPinLabel.innerText = 'Cambiar PIN (opcional)';
        if (confirmPinLabel) confirmPinLabel.innerText = 'Confirmar nuevo PIN';
        if (submitBtn) submitBtn.innerText = 'Actualizar Seguridad';
    } else {
        lockBtn?.classList.add('hidden');
        if (pinCheck) pinCheck.checked = false;
        pinGroup?.classList.add('hidden');
        modeHint?.classList.add('hidden');
        if (newPinLabel) newPinLabel.innerText = 'Crear PIN (4-6 dígitos)';
        if (confirmPinLabel) confirmPinLabel.innerText = 'Confirmar PIN';
        if (submitBtn) submitBtn.innerText = 'Guardar y Activar PIN';
    }

    if (financeData.isDemoMode) {
        let demoBanner = document.getElementById('demo-mode-profile-banner');
        if (!demoBanner) {
            const wrap = document.getElementById('profile-main-view');
            demoBanner = document.createElement('div');
            demoBanner.id = 'demo-mode-profile-banner';
            demoBanner.style.cssText = 'background:rgba(59, 130, 246, 0.1); border:1px dashed #3b82f6; border-radius:12px; padding:14px; margin-bottom:14px; text-align:center;';
            demoBanner.innerHTML = `
                <strong style="color:#3b82f6; font-size:13.5px; display:block; margin-bottom:6px;">Modo Demostración Activo</strong>
                <small style="color:var(--text-muted); font-size:11.5px; display:block; margin-bottom:12px;">Estás viendo datos de prueba.</small>
                <button type="button" id="btn-clear-demo" class="btn btn-primary" style="width:100%; font-size:13px; background:#ef4444; border-color:#ef4444;">Limpiar datos y Empezar</button>
            `;
            wrap?.insertBefore(demoBanner, wrap.firstChild);
            
            document.getElementById('btn-clear-demo')?.addEventListener('click', () => {
    window.openBentoConfirmModal({
        title: 'Limpiar datos de prueba',
        subtitle: 'Modo Demostración Activo',
        message: 'Se eliminarán los movimientos, cuentas y presupuestos de ejemplo para que inicies tu cuenta real en limpio.',
        confirmText: 'Limpiar y empezar',
        cancelText: 'Cancelar',
        danger: true,
        onConfirm: () => {
            localStorage.removeItem('myFinancesRecapDismissedMonth');
            localStorage.removeItem('myFinancesAutoRecapSeenMonth');
            clearDemoDataAndStart();
            location.reload();
        }
    });
});
        }
    }
};

const initAuthUI = (forceLock = false) => {
    forceCloseAllModals();
    const overlay = document.getElementById('auth-overlay');
    const welcomeView = document.getElementById('welcome-view');
    const loginView = document.getElementById('login-view');
    if (!overlay) return;

    if (!authData) {
        document.body.classList.add('app-locked');
        overlay.classList.remove('hidden');
        welcomeView?.classList.remove('hidden');
        document.getElementById('welcome-step-1')?.classList.remove('hidden');
        document.getElementById('welcome-step-2')?.classList.add('hidden');
        loginView?.classList.add('hidden');
    } else if (authData.pinEnabled || forceLock) {
        document.body.classList.add('app-locked');
        syncUserUI();
        overlay.classList.remove('hidden');
        welcomeView?.classList.add('hidden');
        loginView?.classList.remove('hidden');
        const pinInput = document.getElementById('login-pin');
        if (pinInput) { pinInput.value = ''; setTimeout(() => pinInput.focus(), 120); }
    } else {
        document.body.classList.remove('app-locked');
        syncUserUI();
        overlay.classList.add('hidden');
        if (typeof checkWhatsNewBanner === 'function') checkWhatsNewBanner();
    }
};

const ONBOARDING_SLIDES = [
    {
        title: 'Tu bóveda financiera, 100% tuya',
        desc: 'Organiza cuentas, tarjetas y bolsillos directamente en tu teléfono, sin vincular claves bancarias ni subir datos a la nube.',
        art: `
            <div style="width:100%; display:flex; flex-direction:column; justify-content:center; gap:8px;">
                <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:14px; padding:10px 12px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 6px 16px rgba(0,0,0,0.05);">
                    <div style="display:flex; align-items:center; gap:8px; text-align:left;">
                        <span style="width:28px; height:28px; border-radius:8px; background:color-mix(in srgb, var(--accent) 14%, transparent); color:var(--accent); display:flex; align-items:center; justify-content:center;">${renderIcon('shield', 15)}</span>
                        <div>
                            <strong style="display:block; font-size:11.5px; color:var(--text-main);">Privacidad Local-First</strong>
                            <small style="font-size:9.5px; color:var(--text-muted);">Cifrado en tu dispositivo</small>
                        </div>
                    </div>
                    <span style="font-size:9.5px; font-weight:800; color:var(--positive); background:color-mix(in srgb, var(--positive) 14%, transparent); padding:2px 7px; border-radius:99px;">Activo</span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:11px; padding:8px 6px; text-align:center;">
                        <span style="color:var(--positive); display:inline-flex;">${renderIcon('bank', 14)}</span>
                        <small style="display:block; font-size:9.5px; font-weight:700; color:var(--text-main); margin-top:2px;">Liquidez</small>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:11px; padding:8px 6px; text-align:center;">
                        <span style="color:var(--accent); display:inline-flex;">${renderIcon('card', 14)}</span>
                        <small style="display:block; font-size:9.5px; font-weight:700; color:var(--text-main); margin-top:2px;">Tarjetas</small>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:11px; padding:8px 6px; text-align:center;">
                        <span style="color:#f59e0b; display:inline-flex;">${renderIcon('piggy', 14)}</span>
                        <small style="display:block; font-size:9.5px; font-weight:700; color:var(--text-main); margin-top:2px;">Bolsillos</small>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: 'Anticipa tu Libre Seguro Hoy',
        desc: 'Descuenta automáticamente tus compromisos y proyecta tu saldo día por día para detectar puntos bajos antes de que ocurran.',
        art: `
            <div style="width:100%; display:flex; flex-direction:column; justify-content:center;">
                <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:16px; padding:11px 13px; box-shadow:0 8px 20px rgba(0,0,0,0.06); text-align:left; width:100%;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:10px; font-weight:700; color:var(--text-muted); display:inline-flex; align-items:center; gap:4px;">${renderIcon('shield', 12)} Libre Seguro Hoy</span>
                        <span style="font-size:9.5px; font-weight:800; color:var(--accent);">Proyección</span>
                    </div>
                    <div style="font-size:16px; font-weight:800; color:var(--text-main); margin-bottom:6px;">$ 1.480.000<span style="font-size:11px; opacity:0.55;">,00</span></div>
                    <svg viewBox="0 0 220 44" style="width:100%; height:40px; display:block; overflow:visible;">
                        <defs>
                            <linearGradient id="onbCurveGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stop-color="#3b82f6"/>
                                <stop offset="55%" stop-color="#8b5cf6"/>
                                <stop offset="100%" stop-color="#10b981"/>
                            </linearGradient>
                        </defs>
                        <path d="M 4 28 Q 48 10, 92 34 T 174 14 L 216 6" fill="none" stroke="url(#onbCurveGrad)" stroke-width="3" stroke-linecap="round"/>
                        <circle cx="96" cy="34" r="4" fill="#ef4444" stroke="var(--card-bg)" stroke-width="1.5"/>
                        <circle cx="216" cy="6" r="4.5" fill="#10b981" stroke="var(--card-bg)" stroke-width="1.5"/>
                    </svg>
                    <div style="display:flex; justify-content:space-between; font-size:9px; font-weight:700; color:var(--text-muted); margin-top:2px;">
                        <span>Hoy</span>
                        <span style="color:#ef4444;">● Punto bajo</span>
                        <span class="positive">Cierre mes</span>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: 'Detecta fugas y viaja sin enredos',
        desc: 'Identifica tus días de mayor gasto discrecional con el mapa de calor y aísla el presupuesto de tus viajes en un solo toque.',
        art: `
            <div style="width:100%; display:flex; flex-direction:column; justify-content:center;">
                <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:16px; padding:11px 12px; box-shadow:0 8px 20px rgba(0,0,0,0.06); width:100%;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:10px; font-weight:800; color:var(--text-main);">Intensidad diaria</span>
                        <span style="font-size:9.5px; font-weight:800; color:#0ea5e9; background:rgba(14,165,233,0.12); padding:2px 8px; border-radius:99px;">✈ Modo Viaje</span>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:5px; margin-bottom:8px;">
                        <span style="height:22px; border-radius:6px; background:rgba(16,185,129,0.16); font-size:9px; font-weight:700; display:flex; align-items:center; justify-content:center; color:var(--text-main);">12</span>
                        <span style="height:22px; border-radius:6px; background:rgba(16,185,129,0.16); font-size:9px; font-weight:700; display:flex; align-items:center; justify-content:center; color:var(--text-main);">13</span>
                        <span style="height:22px; border-radius:6px; background:rgba(245,158,11,0.24); font-size:9px; font-weight:700; display:flex; align-items:center; justify-content:center; color:var(--text-main);">14</span>
                        <span style="height:22px; border-radius:6px; background:rgba(245,158,11,0.24); font-size:9px; font-weight:700; display:flex; align-items:center; justify-content:center; color:var(--text-main);">15</span>
                        <span style="height:22px; border-radius:6px; background:rgba(239,68,68,0.28); font-size:9px; font-weight:800; display:flex; align-items:center; justify-content:center; color:#ef4444;">16</span>
                        <span style="height:22px; border-radius:6px; border:1.5px solid var(--accent); font-size:9px; font-weight:800; display:flex; align-items:center; justify-content:center; color:var(--accent);">17</span>
                        <span style="height:22px; border-radius:6px; background:var(--hover-bg); font-size:9px; color:var(--text-muted); display:flex; align-items:center; justify-content:center;">18</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:9.5px; color:var(--text-muted); font-weight:600;">
                        <span>Solo variable</span>
                        <span>Prom. activo: <b style="color:var(--text-main);">$ 38.450</b></span>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: 'Nómina, deudas e interés compuesto',
        desc: 'Calcula tu salario y retención en Colombia, acelera la salida de deudas y proyecta el crecimiento de tu ahorro a largo plazo.',
        art: `
            <div style="width:100%; display:flex; flex-direction:column; justify-content:center; gap:7px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:7px;">
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:8px 10px; text-align:left;">
                        <small style="font-size:9px; font-weight:700; color:var(--text-muted); display:block;">Nómina & UVT</small>
                        <strong style="font-size:11.5px; color:var(--text-main);">Art. 383 • 2026</strong>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:8px 10px; text-align:left;">
                        <small style="font-size:9px; font-weight:700; color:var(--text-muted); display:block;">Plan Deudas</small>
                        <strong style="font-size:11.5px; color:var(--positive);">Avalancha</strong>
                    </div>
                </div>
                <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:9px 11px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 6px 16px rgba(0,0,0,0.05);">
                    <div style="text-align:left;">
                        <small style="font-size:9.5px; font-weight:700; color:var(--text-muted); display:block;">Interés Compuesto (8% E.A.)</small>
                        <strong style="font-size:13px; color:var(--positive);">+$ 19.196.207 <span style="font-size:9.5px; color:var(--text-muted); font-weight:600;">en rendim.</span></strong>
                    </div>
                    <span style="width:28px; height:28px; border-radius:50%; background:rgba(245,158,11,0.16); color:#f59e0b; display:flex; align-items:center; justify-content:center;">${renderIcon('trending-up', 15)}</span>
                </div>
            </div>
        `
    }
];

const goToWelcomeRegistration = () => {
    document.getElementById('welcome-step-1')?.classList.add('hidden');
    document.getElementById('welcome-step-2')?.classList.remove('hidden');
    setTimeout(() => document.getElementById('welcome-name')?.focus(), 100);
};

const initOnboardingCarousel = () => {
    const step1 = document.getElementById('welcome-step-1');
    if (!step1 || step1.dataset.onbReady === '1') return;
    step1.dataset.onbReady = '1';

    let activeSlide = 0;
    let touchStartX = 0;

    step1.innerHTML = `
        <div id="onb-cover-screen" class="onb-stage">
            <div class="onb-top-bar"></div>
            <div>
                <div class="onb-cover-icon">
                    <img src="icon.png" alt="Logo Mis Finanzas" class="onb-logo-light" onerror="this.style.display='none'; this.parentElement.querySelector('.onb-logo-fallback')?.classList.remove('hidden');">
                    <img src="icon2.png" alt="Logo Mis Finanzas" class="onb-logo-dark" onerror="this.src='icon.png'; this.onerror=function(){ this.style.display='none'; this.parentElement.querySelector('.onb-logo-fallback')?.classList.remove('hidden'); };">
                    <svg class="onb-logo-fallback hidden" width="56" height="56" viewBox="0 0 120 120" fill="none">
                        <defs>
                            <linearGradient id="mfInfGrad" x1="20" y1="90" x2="85" y2="35" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stop-color="#3b82f6"/>
                                <stop offset="100%" stop-color="#8b5cf6"/>
                            </linearGradient>
                        </defs>
                        <path d="M26 88 L56 58 C66 48 62 32 48 32 C34 32 28 48 36 60" stroke="url(#mfInfGrad)" stroke-width="8" stroke-linecap="round"/>
                        <path d="M48 74 C58 86 78 84 84 68 C89 55 78 42 64 46" stroke="#8b5cf6" stroke-width="8" stroke-linecap="round"/>
                        <path d="M52 66 C62 72 72 66 80 54 L94 34" stroke="#f59e0b" stroke-width="8" stroke-linecap="round"/>
                        <path d="M80 32 L98 28 L94 46" stroke="#f59e0b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h2 class="onb-slide-title" style="font-size:25px;">¡Hola!</h2>
                <p class="onb-slide-desc">Bienvenido a <b>Mis Finanzas</b>, tu centro privado para controlar dinero, deudas y metas desde tu dispositivo.</p>
                <button type="button" id="btn-onb-start-tour" class="btn btn-primary" style="width:100%; margin-top:24px; padding:13px; font-size:14px;">Saber cómo</button>
            </div>
            <div style="padding-top:14px;">
                <button type="button" id="btn-onb-skip-cover" class="onb-skip-btn" style="font-size:13px;">Omitir demostración</button>
            </div>
        </div>

        <div id="onb-slides-screen" class="onb-stage hidden">
            <div class="onb-top-bar">
                <span id="onb-step-counter" class="onb-step-pill">1 / 4</span>
                <button type="button" id="btn-onb-skip-slides" class="onb-skip-btn">Omitir</button>
            </div>
            <div id="onb-slide-body" class="onb-anim-enter">
                <div id="onb-slide-art" class="onb-showcase-frame"></div>
                <h2 id="onb-slide-title" class="onb-slide-title"></h2>
                <p id="onb-slide-desc" class="onb-slide-desc"></p>
            </div>
            <div>
                <div id="onb-dots-row" class="onb-dots-row"></div>
                <button type="button" id="btn-onb-next-slide" class="btn btn-primary" style="width:100%; padding:13px; font-size:14px;">Siguiente</button>
            </div>
        </div>
    `;

    const renderSlide = (idx) => {
        activeSlide = Math.max(0, Math.min(ONBOARDING_SLIDES.length - 1, idx));
        const slide = ONBOARDING_SLIDES[activeSlide];
        const isLast = activeSlide === ONBOARDING_SLIDES.length - 1;

        const bodyEl = document.getElementById('onb-slide-body');
        if (bodyEl) {
            bodyEl.classList.remove('onb-anim-enter');
            void bodyEl.offsetWidth;
            bodyEl.classList.add('onb-anim-enter');
        }
        const artEl = document.getElementById('onb-slide-art');
        const titleEl = document.getElementById('onb-slide-title');
        const descEl = document.getElementById('onb-slide-desc');
        const nextBtn = document.getElementById('btn-onb-next-slide');
        const dotsEl = document.getElementById('onb-dots-row');

        if (artEl) artEl.innerHTML = slide.art;
        if (titleEl) titleEl.textContent = slide.title;
        if (descEl) descEl.textContent = slide.desc;
        if (nextBtn) nextBtn.textContent = isLast ? 'Empecemos' : 'Siguiente';
        if (dotsEl) {
            dotsEl.innerHTML = ONBOARDING_SLIDES.map((_, i) =>
                `<button type="button" class="onb-dot ${i === activeSlide ? 'active' : ''}" data-onb-idx="${i}" aria-label="Hoja ${i + 1}"></button>`
            ).join('');
            dotsEl.querySelectorAll('.onb-dot').forEach(dot => {
                dot.addEventListener('click', () => renderSlide(parseInt(dot.getAttribute('data-onb-idx'), 10)));
            });
        }
    };

    document.getElementById('btn-onb-start-tour')?.addEventListener('click', () => {
        document.getElementById('onb-cover-screen')?.classList.add('hidden');
        document.getElementById('onb-slides-screen')?.classList.remove('hidden');
        renderSlide(0);
    });

    const skipCoverBtn = document.getElementById('btn-onb-skip-cover');
    if (skipCoverBtn) {
        skipCoverBtn.innerText = 'Omitir demostración';
        skipCoverBtn.style.color = 'var(--accent)';
        skipCoverBtn.addEventListener('click', goToWelcomeRegistration);
    }
    
    document.getElementById('btn-onb-skip-slides')?.addEventListener('click', goToWelcomeRegistration);

    document.getElementById('btn-onb-next-slide')?.addEventListener('click', () => {
        if (activeSlide < ONBOARDING_SLIDES.length - 1) renderSlide(activeSlide + 1);
        else goToWelcomeRegistration();
    });

    const slidesScreen = document.getElementById('onb-slides-screen');
    slidesScreen?.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX;
    }, { passive: true });
    slidesScreen?.addEventListener('touchend', (e) => {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 42) return;
        if (dx < 0 && activeSlide < ONBOARDING_SLIDES.length - 1) renderSlide(activeSlide + 1);
        else if (dx > 0 && activeSlide > 0) renderSlide(activeSlide - 1);
    }, { passive: true });
};

document.addEventListener('DOMContentLoaded', initOnboardingCarousel);

document.getElementById('btn-welcome-back')?.addEventListener('click', () => {
    document.getElementById('welcome-step-2')?.classList.add('hidden');
    document.getElementById('welcome-step-1')?.classList.remove('hidden');
    document.getElementById('onb-slides-screen')?.classList.add('hidden');
    document.getElementById('onb-cover-screen')?.classList.remove('hidden');
    document.getElementById('welcome-error')?.classList.add('hidden');
});

document.getElementById('welcome-link-terms')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.openUniversalInfoModal) window.openUniversalInfoModal('terms');
});

document.getElementById('welcome-link-privacy')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.openUniversalInfoModal) window.openUniversalInfoModal('privacy');
});

document.getElementById('welcome-use-pin')?.addEventListener('change', (e) => {
    const fields = document.getElementById('welcome-pin-fields');
    if (e.target.checked) fields?.classList.remove('hidden');
    else fields?.classList.add('hidden');
});

document.getElementById('welcome-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('welcome-name').value.trim();
    const usePin = document.getElementById('welcome-use-pin').checked;
    const pin = document.getElementById('welcome-pin').value;
    const pinConfirm = document.getElementById('welcome-pin-confirm').value;
    const acceptedTerms = !!document.getElementById('welcome-accept-terms')?.checked;
    const errEl = document.getElementById('welcome-error');

    if (!name) return;

    if (usePin) {
        if (pin.length < 4 || !/^\d+$/.test(pin)) {
            if (errEl) {
                errEl.innerText = 'El PIN debe tener entre 4 y 6 dígitos numéricos.';
                errEl.classList.remove('hidden');
            }
            return;
        }
        if (pin !== pinConfirm) {
            if (errEl) {
                errEl.innerText = 'Los PIN ingresados no coinciden.';
                errEl.classList.remove('hidden');
            }
            return;
        }
    }

    if (!acceptedTerms) {
        if (errEl) {
            errEl.innerText = 'Debes aceptar los Términos y la Política de Protección de Datos.';
            errEl.classList.remove('hidden');
        }
        return;
    }

    if (errEl) errEl.classList.add('hidden');
    registerUser(name, pin, usePin);
    if (typeof APP_VERSION !== 'undefined') localStorage.setItem('myFinancesLastSeenVersion', APP_VERSION);
    syncUserUI();
    document.body.classList.remove('app-locked');
    document.getElementById('auth-overlay')?.classList.add('hidden');
    updateDashboard();
});

document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = document.getElementById('login-pin').value;
    const errEl = document.getElementById('login-error');
    const card = document.getElementById('auth-card');

    if (verifyPin(pin)) {
        errEl?.classList.add('hidden');
        document.body.classList.remove('app-locked');
        document.getElementById('auth-overlay')?.classList.add('hidden');
        if (typeof checkWhatsNewBanner === 'function') checkWhatsNewBanner();
    } else {
        errEl?.classList.remove('hidden');
        card?.classList.remove('shake');
        void card?.offsetWidth;
        card?.classList.add('shake');
        document.getElementById('login-pin').value = '';
    }
});

document.getElementById('btn-forgot-pin')?.addEventListener('click', () => {
    const box = document.getElementById('forgot-pin-confirm-box');
    const iconSlot = document.getElementById('forgot-pin-icon-slot');
    if (iconSlot && !iconSlot.innerHTML) iconSlot.innerHTML = renderIcon('alert', 16);
    box?.classList.remove('hidden');
});

document.getElementById('btn-cancel-forgot-pin')?.addEventListener('click', () => {
    document.getElementById('forgot-pin-confirm-box')?.classList.add('hidden');
});

document.getElementById('btn-confirm-forgot-pin')?.addEventListener('click', () => {
    authData.pinEnabled = false;
    authData.pinHash = null;
    localStorage.setItem('myFinancesAuth', JSON.stringify(authData));
    document.getElementById('forgot-pin-confirm-box')?.classList.add('hidden');
    document.body.classList.remove('app-locked');
    document.getElementById('auth-overlay')?.classList.add('hidden');
    syncUserUI();
});

const resetAppModal = document.getElementById('reset-app-confirm-modal');
const closeResetAppModal = () => resetAppModal?.classList.add('hidden');

document.getElementById('reset-auth-btn-profile')?.addEventListener('click', () => {
    if (resetAppModal) {
        resetAppModal.classList.remove('hidden');
    }
});

document.getElementById('close-reset-app-modal-btn')?.addEventListener('click', closeResetAppModal);
document.getElementById('btn-cancel-reset-app')?.addEventListener('click', closeResetAppModal);

document.getElementById('btn-confirm-reset-app')?.addEventListener('click', () => {
    localStorage.removeItem('myFinancesAuth');
    localStorage.removeItem('myFinances');
    localStorage.removeItem('myFinancesSalary');
    localStorage.removeItem('myFinancesTaxParams');
    localStorage.removeItem('myFinancesTheme');
    localStorage.removeItem('myFinancesColorMode');
    localStorage.removeItem('myFinancesWidgetOrder');
    location.reload();
});

// --- 4.5 AUTO-BLOQUEO POR SEGUNDO PLANO (VISIBILITY API) ---
let lastHiddenTime = null;
const LOCK_GRACE_PERIOD = 2 * 60 * 1000; // 2 minutos de tolerancia (en milisegundos)

document.addEventListener('visibilitychange', () => {
    // Si no hay PIN configurado o activo, no hacemos nada
    if (!authData || !authData.pinEnabled) return;
    
    if (document.visibilityState === 'hidden') {
        // La app se fue al fondo (cambio de app, pantalla apagada)
        lastHiddenTime = Date.now();
    } else if (document.visibilityState === 'visible' && lastHiddenTime) {
        // La app regresó a primer plano, comprobamos cuánto tiempo pasó
        if (Date.now() - lastHiddenTime > LOCK_GRACE_PERIOD) {
            initAuthUI(true); // Fuerza el bloqueo de seguridad
        }
        lastHiddenTime = null; // Reiniciar contador
    }
});

// --- 5. GESTIÓN INTELIGENTE DE MODALES ---
function setActiveNav(activeEl) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (activeEl) activeEl.classList.add('active');
}

function isAnyModalOpen() {
    return Array.from(document.querySelectorAll('.modal')).some(m => !m.classList.contains('hidden'));
}

window.openSideDrawer = () => {
    if (fabMenu && !fabMenu.classList.contains('hidden')) {
        fabMenu.classList.add('hidden');
        fabBtn?.classList.remove('active');
    }
    document.getElementById('quick-calendar-popover')?.classList.add('hidden');
    document.body.classList.add('drawer-open');
    sideDrawerBackdrop?.classList.remove('hidden');
    sideDrawer?.classList.remove('closed');
    sideDrawer?.setAttribute('aria-hidden', 'false');
    const scrollArea = sideDrawer?.querySelector('.drawer-scroll');
    if (scrollArea) scrollArea.scrollTop = 0;
};

window.closeSideDrawer = () => {
    document.body.classList.remove('drawer-open');
    sideDrawer?.classList.add('closed');
    sideDrawerBackdrop?.classList.add('hidden');
    sideDrawer?.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('#side-drawer .drawer-accordion-group').forEach(group => {
        group.classList.remove('open');
        group.querySelector('.drawer-accordion-content')?.classList.add('hidden');
        const chev = group.querySelector('.drawer-chevron');
        if (chev) chev.style.transform = 'rotate(-90deg)';
    });
};

// --- 5.1 CONTROLADOR DE ELIMINACIÓN SEGURA (SAFE DELETE) ---
let safeDeleteCallback = null;

window.openSafeDeleteModal = (targetName, impactItems, onConfirm) => {
    const sdModal = document.getElementById('safe-delete-modal');
    if (!sdModal) return;

    document.getElementById('safe-delete-target-name').innerText = targetName;
    
    const impactList = document.getElementById('safe-delete-impact-list');
    impactList.innerHTML = impactItems.map(item => `<li>${item}</li>`).join('');
    impactList.innerHTML += `<li><b>Esta acción no se puede deshacer.</b> Recomendamos hacer un respaldo antes de continuar.</li>`;

    const input = document.getElementById('safe-delete-input');
    const submitBtn = document.getElementById('btn-confirm-safe-delete');
    
    input.value = '';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';

    // Validación estricta en vivo
    input.oninput = (e) => {
        if (e.target.value === 'ELIMINAR') {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            input.style.borderColor = 'var(--negative)';
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            input.style.borderColor = 'var(--border-color)';
        }
    };

    safeDeleteCallback = onConfirm;
    sdModal.classList.remove('hidden');
    setTimeout(() => input.focus(), 100);
};

document.getElementById('close-safe-delete-btn')?.addEventListener('click', () => {
    document.getElementById('safe-delete-modal')?.classList.add('hidden');
    safeDeleteCallback = null;
});

document.getElementById('btn-cancel-safe-delete')?.addEventListener('click', () => {
    document.getElementById('safe-delete-modal')?.classList.add('hidden');
    safeDeleteCallback = null;
});

document.getElementById('safe-delete-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.getElementById('safe-delete-input').value === 'ELIMINAR') {
        if (typeof safeDeleteCallback === 'function') safeDeleteCallback();
        document.getElementById('safe-delete-modal')?.classList.add('hidden');
        safeDeleteCallback = null;
    }
});

// Apertura instantánea al primer toque en iOS Safari y clic en Desktop
let drawerTouchStartY = 0;
let lastAccordionToggleAt = 0;

sideDrawer?.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) drawerTouchStartY = e.touches[0].clientY;
}, { passive: true });

const handleDrawerAccordionInstant = (e) => {
    const trigger = e.target.closest('.drawer-accordion-trigger');
    if (!trigger) return;

    if (e.type === 'touchend' && e.changedTouches && e.changedTouches[0]) {
        if (Math.abs(e.changedTouches[0].clientY - drawerTouchStartY) > 10) return;
    }

    const now = Date.now();
    if (now - lastAccordionToggleAt < 350) return;
    lastAccordionToggleAt = now;

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const targetId = trigger.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);
    const groupEl = trigger.closest('.drawer-accordion-group');
    if (!targetEl || !groupEl) return;

    const willOpen = targetEl.classList.contains('hidden');
    groupEl.classList.toggle('open', willOpen);
    targetEl.classList.toggle('hidden', !willOpen);
    const chev = trigger.querySelector('.drawer-chevron');
    if (chev) chev.style.transform = willOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
};

sideDrawer?.addEventListener('touchend', handleDrawerAccordionInstant, { passive: false });
sideDrawer?.addEventListener('click', handleDrawerAccordionInstant);

// Gesto táctil instantáneo para abrir (deslizar a la derecha) y cerrar (deslizar a la izquierda) el menú lateral
let swipeMenuStartX = 0;
let swipeMenuStartY = 0;
let swipeMenuValidStart = false;
let swipeMenuTriggered = false;

const evaluateDrawerSwipe = (currX, currY) => {
    const dx = currX - swipeMenuStartX;
    const dy = currY - swipeMenuStartY;

    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 18) {
        swipeMenuValidStart = false;
        return;
    }

    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

    swipeMenuTriggered = true;
    swipeMenuValidStart = false;

    const drawerEl = document.getElementById('side-drawer');
    const isDrawerOpen = drawerEl && !drawerEl.classList.contains('closed');
    if (!isDrawerOpen && dx > 0 && typeof window.openSideDrawer === 'function') {
        window.openSideDrawer();
    } else if (isDrawerOpen && dx < 0 && typeof window.closeSideDrawer === 'function') {
        window.closeSideDrawer();
    }
};

document.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length !== 1) {
        swipeMenuValidStart = false;
        return;
    }
    const t = e.touches[0];
    swipeMenuStartX = t.clientX;
    swipeMenuStartY = t.clientY;
    swipeMenuTriggered = false;

    const drawerEl = document.getElementById('side-drawer');
    const isDrawerOpen = drawerEl && !drawerEl.classList.contains('closed');
    if (isDrawerOpen) {
        swipeMenuValidStart = true;
        return;
    }

    const blockedByUI = document.body.classList.contains('app-locked') || isAnyModalOpen();
    const inHorizontalScroll = e.target.closest('.bs-filter-strip, .pill-row, .table-responsive, input, select, textarea');
    swipeMenuValidStart = !blockedByUI && !inHorizontalScroll;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!swipeMenuValidStart || swipeMenuTriggered || !e.touches || e.touches.length !== 1) return;
    evaluateDrawerSwipe(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

document.addEventListener('touchend', (e) => {
    if (!swipeMenuValidStart || swipeMenuTriggered || !e.changedTouches || e.changedTouches.length !== 1) return;
    evaluateDrawerSwipe(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    swipeMenuValidStart = false;
}, { passive: true });

window.returnToPocketHistoryId = null;

window.forceCloseAllModals = () => {
    hasUnsavedChanges = false;
    quickActionHandler = null;
    window.returnToPocketHistoryId = null;
    closeSideDrawer();
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('quick-calendar-popover')?.classList.add('hidden');
    document.getElementById('tx-calculator-panel')?.classList.add('hidden');
    document.getElementById('toggle-tx-calc-btn')?.classList.remove('active');

    if (fabMenu && !fabMenu.classList.contains('hidden')) {
        fabMenu.classList.add('hidden');
        fabBtn?.classList.remove('active');
    }

    document.querySelectorAll('form.data-form').forEach(f => {
        if (f.id !== 'salary-config-form' && f.id !== 'tax-params-form' && f.id !== 'health-goals-form' && f.id !== 'notifications-config-form') {
            f.reset();
        }
    });
    document.querySelectorAll('details.add-subcat-details').forEach(d => { d.open = false; });
    setActiveNav(document.getElementById('nav-home'));
};

let pendingUnsavedAction = null;

function requestUnsavedDiscard(message, onConfirm) {
    const modal = document.getElementById('unsaved-changes-modal');
    const msgEl = document.getElementById('unsaved-changes-msg');
    if (!modal) {
        if (confirm(message)) onConfirm();
        return;
    }
    if (msgEl) msgEl.textContent = message;
    pendingUnsavedAction = onConfirm;
    modal.classList.remove('hidden');
}

const closeUnsavedModal = () => {
    pendingUnsavedAction = null;
    document.getElementById('unsaved-changes-modal')?.classList.add('hidden');
};

document.getElementById('close-unsaved-modal-btn')?.addEventListener('click', closeUnsavedModal);
document.getElementById('btn-cancel-unsaved')?.addEventListener('click', closeUnsavedModal);
document.getElementById('btn-confirm-unsaved')?.addEventListener('click', () => {
    const action = pendingUnsavedAction;
    closeUnsavedModal();
    hasUnsavedChanges = false;
    if (typeof action === 'function') action();
});
window.attemptCloseModals = () => {
    const childModals = [
        'pocket-history-modal',
        'pockets-faq-modal',        // <-- Se cierra primero
        'pocket-yield-modal',
        'pockets-earnings-modal',   // <-- Se cierra después
        'universal-info-modal',
        'health-modal',
        'quick-action-modal',
        'pocket-edit-modal',
        'pocket-action-modal',
        'quick-income-modal',
        'debt-planner-modal',
        'annual-control-modal',
        'subcat-months-modal',
        'cat-months-modal',
        'asset-detail-modal',
        'subscriptions-modal',
        'split-tx-modal'
    ];
    for (const cId of childModals) {
        const cm = document.getElementById(cId);
        if (cm && !cm.classList.contains('hidden')) {
            if (cId === 'cat-months-modal' && hasUnsavedChanges) {
                requestUnsavedDiscard('Tienes cambios sin guardar en el presupuesto. ¿Seguro que quieres salir?', () => {
                    hasUnsavedChanges = false;
                    cm.classList.add('hidden');
                });
                return false;
            }
            hasUnsavedChanges = false;
            if (cId === 'quick-action-modal') quickActionHandler = null;
            cm.classList.add('hidden');
            return false;
        }
    }

    if (isAnyModalOpen() && hasUnsavedChanges) {
        requestUnsavedDiscard('Tienes cambios sin guardar en un formulario. ¿Estás seguro de que quieres salir y perderlos?', () => {
            hasUnsavedChanges = false;
            document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
        });
        return false;
    }

    const txModal = document.getElementById('transaction-modal');
    const prevPocketId = window.returnToPocketHistoryId;
    if (txModal && !txModal.classList.contains('hidden') && prevPocketId) {
        forceCloseAllModals();
        document.getElementById('pockets-modal')?.classList.remove('hidden');
        if (typeof openPocketHistoryModal === 'function') openPocketHistoryModal(prevPocketId);
        return false;
    }

    forceCloseAllModals();
    return true;
};

let modalBackdropPressed = null;
document.querySelectorAll('.modal').forEach(modalEl => {
    modalEl.addEventListener('pointerdown', (e) => {
        modalBackdropPressed = (e.target === modalEl) ? modalEl : null;
    });
    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl && modalBackdropPressed === modalEl) {
            attemptCloseModals();
        }
        modalBackdropPressed = null;
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const authOverlay = document.getElementById('auth-overlay');
    if (authOverlay && !authOverlay.classList.contains('hidden')) return;
    if (sideDrawer && !sideDrawer.classList.contains('closed')) { closeSideDrawer(); return; }
    const calPop = document.getElementById('quick-calendar-popover');
    if (calPop && !calPop.classList.contains('hidden')) { calPop.classList.add('hidden'); return; }
    if (fabMenu && !fabMenu.classList.contains('hidden')) {
        fabMenu.classList.add('hidden');
        fabBtn?.classList.remove('active');
        return;
    }
    if (isAnyModalOpen()) attemptCloseModals();
});

// Ocultar temporalmente el botón de reporte hasta activar el correo oficial de Función IF
document.getElementById('drawer-report-bug')?.classList.add('hidden');

// --- ENRUTADOR GLOBAL ÚNICO (MODALES, MENÚ LATERAL, ACORDEONES Y PERFIL) ---
document.addEventListener('click', async (e) => {
    // 1. Cierre unificado de modales
    if (e.target.closest('.btn-close-modal')) {
        e.stopPropagation();
        attemptCloseModals();
        return;
    }

    // 2. Abrir / Cerrar Menú Lateral
    if (e.target.closest('#open-drawer-btn')) {
        e.stopPropagation();
        openSideDrawer();
        return;
    }
    if (e.target.closest('#close-drawer-btn') || e.target.closest('#side-drawer-backdrop')) {
        e.stopPropagation();
        closeSideDrawer();
        return;
    }

    // 3. Acordeones del Menú Lateral (gestionado por handler táctil/clic directo abajo)
    if (e.target.closest('.drawer-accordion-trigger')) {
        return;
    }

    // 4. Ítems del Menú Lateral y Sub-ítems (incluye Ayuda y Legal)
    const drawerItem = e.target.closest('.drawer-item, .drawer-sub-item, #drawer-version-btn');
    if (drawerItem && !drawerItem.classList.contains('drawer-accordion-trigger')) {
        e.stopPropagation();
        const id = drawerItem.id;
        closeSideDrawer();

        if (id === 'drawer-accounts') { if (attemptCloseModals()) document.getElementById('accounts-modal')?.classList.remove('hidden'); }
        else if (id === 'drawer-cards') { if (attemptCloseModals()) { document.getElementById('cards-modal')?.classList.remove('hidden'); renderCardsBreakdown(currentBalances); } }
        else if (id === 'drawer-debts') { if (attemptCloseModals()) { document.getElementById('debts-modal')?.classList.remove('hidden'); let totalLoansDebt = 0; financeData.customAccounts.forEach(acc => { if (acc.category === 'debt' && currentBalances[acc.id] > 0) totalLoansDebt = round2(totalLoansDebt + currentBalances[acc.id]); }); renderDebtsBreakdown(currentBalances, totalLoansDebt); } }
        else if (id === 'drawer-receivables') { if (attemptCloseModals()) openReceivablesModal(); }
        else if (id === 'drawer-debt-planner') { if (attemptCloseModals()) { document.getElementById('debt-planner-modal')?.classList.remove('hidden'); renderDebtPlanner(); } }
        else if (id === 'drawer-pockets') { if (attemptCloseModals()) { openSavingsSection('pockets'); } }
        else if (id === 'drawer-savings-calc') { if (attemptCloseModals()) { openSavingsSection('simulator'); } }
        else if (id === 'drawer-card-advisor') { if (attemptCloseModals()) { openCardAdvisorModal(); } }
        else if (id === 'drawer-smart-purchase') { if (attemptCloseModals()) { openSmartPurchaseModal(); } }
        else if (id === 'drawer-credit-sim') { if (attemptCloseModals()) { openCreditSimulatorModal(); } }
        else if (id === 'drawer-credit-compare') { if (attemptCloseModals()) { openCreditCompareModal(); } }
        else if (id === 'drawer-month-recap') { if (attemptCloseModals()) { openMonthlyRecapModal(); } }
        else if (id === 'drawer-budget') { if (attemptCloseModals()) { document.getElementById('budget-modal')?.classList.remove('hidden'); renderBudgetView(); setActiveNav(document.getElementById('nav-budget')); } }
        else if (id === 'drawer-expenses') { if (attemptCloseModals()) { document.getElementById('expenses-modal')?.classList.remove('hidden'); renderExpensesBreakdown(getMonthId(viewDate)); } }
        else if (id === 'drawer-subscriptions') { if (attemptCloseModals()) { document.getElementById('subscriptions-modal')?.classList.remove('hidden'); renderSubscriptionsView(); } }
        else if (id === 'drawer-trip-mode') { if (attemptCloseModals()) { document.getElementById('trip-mode-modal')?.classList.remove('hidden'); renderTripModeUI(); } }
        else if (id === 'drawer-salary') { if (attemptCloseModals()) { document.getElementById('profile-modal')?.classList.remove('hidden'); document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-salary-view')?.classList.remove('hidden'); renderSalaryUI(true); } }
        else if (id === 'drawer-health') { if (attemptCloseModals()) document.getElementById('widget-financial-health')?.click(); }
        else if (id === 'drawer-analytics') { if (attemptCloseModals()) { document.getElementById('analytics-modal')?.classList.remove('hidden'); setActiveNav(document.getElementById('nav-analytics')); } }
        else if (id === 'drawer-annual') { if (attemptCloseModals()) { document.getElementById('annual-control-modal')?.classList.remove('hidden'); annualViewYear = viewDate.getFullYear(); renderAnnualControlTable(); } }
        else if (id === 'drawer-assets') { if (attemptCloseModals()) { document.getElementById('assets-modal')?.classList.remove('hidden'); renderAssetsBreakdown(); } }
        else if (id === 'drawer-tax') { if (attemptCloseModals()) { document.getElementById('profile-modal')?.classList.remove('hidden'); document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-tax-params-view')?.classList.remove('hidden'); renderTaxParamsUI(); } }
        else if (id === 'drawer-trash') { if (attemptCloseModals()) { document.getElementById('trash-modal')?.classList.remove('hidden'); renderTrashModal(); } }
        else if (id === 'drawer-backup') { if (attemptCloseModals()) { document.getElementById('profile-modal')?.classList.remove('hidden'); document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-backup-view')?.classList.remove('hidden'); } }
        else if (id === 'drawer-version-btn' || id === 'drawer-help-about') { if (attemptCloseModals()) { if (typeof openUniversalInfoModal === 'function') openUniversalInfoModal('about'); } }
        else if (id === 'drawer-help-faq') { if (attemptCloseModals()) { if (typeof openUniversalInfoModal === 'function') openUniversalInfoModal('faq'); } }
        else if (id === 'drawer-help-terms') { if (attemptCloseModals()) { if (typeof openUniversalInfoModal === 'function') openUniversalInfoModal('terms'); } }
        else if (id === 'drawer-help-privacy') { if (attemptCloseModals()) { if (typeof openUniversalInfoModal === 'function') openUniversalInfoModal('privacy'); } }
        else if (id === 'drawer-system-storage') { if (attemptCloseModals()) { if (typeof openUniversalInfoModal === 'function') openUniversalInfoModal('storage'); } }
        else if (id === 'drawer-share-app') {
            const rawUrl = window.location.href.split('#')[0].split('?')[0];
            const isPublicWeb = /^https?:\/\//i.test(rawUrl) && !/localhost|127\.0\.0\.1/i.test(rawUrl);
            const appUrl = isPublicWeb ? rawUrl : 'https://funcionif.github.io/mis-finanzas/index.html';

            const shareText = [
                'Gestiona tus finanzas personales de forma 100% privada y local con *Mis Finanzas • Función IF*',
                '',
                'Ábrela aquí:',
                appUrl,
                '',
                '*¿Cómo instalarla en tu celular?*',
                '• *iPhone (Safari):* Toca el botón Compartir (cuadrado con flecha hacia arriba) y selecciona *"Agregar a inicio"*.',
                '• *Android (Chrome):* Toca el menú (⋮) arriba a la derecha y selecciona *"Instalar aplicación"* o *"Agregar a pantalla principal"*.'
            ].join('\n');

            const sharePayload = { title: 'Mis Finanzas • Función IF', text: shareText };

            const fallbackCopy = async (textToCopy) => {
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(textToCopy);
                        alert('Mensaje e instrucciones de instalación copiados al portapapeles.');
                        return;
                    }
                } catch (err) {}
                const tmp = document.createElement('textarea');
                tmp.value = textToCopy;
                tmp.setAttribute('readonly', '');
                tmp.style.position = 'fixed';
                tmp.style.top = '0';
                tmp.style.left = '0';
                tmp.style.opacity = '0';
                document.body.appendChild(tmp);
                tmp.focus();
                tmp.select();
                tmp.setSelectionRange(0, tmp.value.length);
                try {
                    document.execCommand('copy');
                    alert('Mensaje e instrucciones de instalación copiados al portapapeles.');
                } catch (err) {
                    prompt('Copia este mensaje:', textToCopy);
                }
                document.body.removeChild(tmp);
            };

            if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(sharePayload))) {
                try {
                    await navigator.share(sharePayload);
                } catch (err) {
                    if (err && err.name !== 'AbortError') {
                        await fallbackCopy(shareText);
                    }
                }
            } else {
                await fallbackCopy(shareText);
            }
        }
        return;
    }

    // 5. Navegación Dock Inferior, Perfil y Footers de Versión
    const navBtn = e.target.closest('.nav-item, #profile-trigger-btn, .profile-menu-btn, #shortcut-to-tax-params-btn, #home-version-btn, #profile-version-btn, #back-from-salary-btn, #back-from-tax-params-btn, #back-from-theme-btn, #back-from-currency-btn, #back-from-notifications-btn, #back-from-backup-btn, #back-from-security-btn');
    if (navBtn) {
        const id = navBtn.id;
        if (id === 'nav-home') { forceCloseAllModals(); setActiveNav(document.getElementById('nav-home')); }
        else if (id === 'nav-analytics') { if (attemptCloseModals()) { document.getElementById('analytics-modal')?.classList.remove('hidden'); setActiveNav(document.getElementById('nav-analytics')); } }
        else if (id === 'nav-budget') { if (attemptCloseModals()) { document.getElementById('budget-modal')?.classList.remove('hidden'); renderBudgetView(); setActiveNav(document.getElementById('nav-budget')); } }
        else if (id === 'home-version-btn' || id === 'profile-version-btn') { window.openUniversalInfoModal?.('about'); }
        else if (id === 'profile-trigger-btn') { if (attemptCloseModals()) { document.getElementById('profile-modal')?.classList.remove('hidden'); document.getElementById('profile-main-view')?.classList.remove('hidden'); ['profile-salary-view', 'profile-tax-params-view', 'profile-theme-view', 'profile-currency-view', 'profile-notifications-view', 'profile-backup-view', 'profile-security-view'].forEach(x => document.getElementById(x)?.classList.add('hidden')); } }
        else if (id === 'menu-salary-btn') { document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-salary-view')?.classList.remove('hidden'); renderSalaryUI(true); }
        else if (id === 'menu-tax-params-btn' || id === 'shortcut-to-tax-params-btn') { document.getElementById('profile-salary-view')?.classList.add('hidden'); document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-tax-params-view')?.classList.remove('hidden'); renderTaxParamsUI(); }
        else if (id === 'menu-theme-btn') { document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-theme-view')?.classList.remove('hidden'); }
        else if (id === 'menu-currency-btn') { document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-currency-view')?.classList.remove('hidden'); syncCurrencyPrefs(); }
        else if (id === 'menu-notifications-btn') { 
            document.getElementById('profile-main-view')?.classList.add('hidden'); 
            document.getElementById('profile-notifications-view')?.classList.remove('hidden'); 
            const prefs = getNotificationPrefs(); 
            document.getElementById('notif-days-before').value = prefs.daysBefore; 
            document.getElementById('notif-budget-pct').value = prefs.budgetPct; 
            document.getElementById('notif-pending-enabled').checked = !!prefs.pendingEnabled; 
            if(document.getElementById('pref-show-projections')) document.getElementById('pref-show-projections').checked = financeData.preferences?.showProjections !== false;
            if(document.getElementById('pref-remember-account')) document.getElementById('pref-remember-account').checked = financeData.preferences?.rememberAccount !== false;
            if(document.getElementById('pref-remember-category')) document.getElementById('pref-remember-category').checked = financeData.preferences?.rememberCategory !== false;
            syncDismissedAlertsButton(); 
        }
        else if (id === 'menu-backup-btn') { document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-backup-view')?.classList.remove('hidden'); }
        else if (id === 'menu-security-btn') { document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-security-view')?.classList.remove('hidden'); syncUserUI(); }
        else if (id.startsWith('back-from-')) { ['profile-salary-view', 'profile-tax-params-view', 'profile-theme-view', 'profile-currency-view', 'profile-notifications-view', 'profile-backup-view', 'profile-security-view'].forEach(x => document.getElementById(x)?.classList.add('hidden')); document.getElementById('profile-main-view')?.classList.remove('hidden'); }
        return;
    }

    });

// Controlador único en fase de captura para apertura directa desde el botón flotante (+)
document.addEventListener('click', (e) => {
    const clickedFabBtn = e.target.closest('#fab-btn');
    if (clickedFabBtn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        clickedFabBtn.classList.remove('active');
        if (typeof openOmniModal === 'function') {
            openOmniModal({ type: 'expense' });
        }
    }
}, true);

// --- 6. ALERTAS INTELIGENTES, .ICS iOS Y AVISO PREVENTIVO DE RESPALDO ---
const getNotificationPrefs = () => {
    return financeData.notificationPrefs || { daysBefore: 5, budgetPct: 85, pendingEnabled: true };
};

const downloadIcsEvent = (title, description, dateObj) => {
    const blob = generateICSBlob(title, description, dateObj);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const renderSmartAlerts = (monthId, snap) => {
    const container = document.getElementById('ios-alerts-container');
    if (!container) return;
    const prefs = getNotificationPrefs();
    const alerts = [];

    // --- ALERTA DE MEMORIA LOCAL-FIRST ---
    let totalBytes = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalBytes += ((localStorage[key].length + key.length) * 2);
        }
    }
    const storageKB = totalBytes / 1024;
    const storagePct = (storageKB / 5120) * 100;
    
    const currRealMonthId = getMonthId(currentDate);

    if (storagePct >= 80) {
        alerts.push({
            id: `storage_${currRealMonthId}`,
            title: `${renderIcon('database', 14)} Espacio Crítico`,
            desc: `Tu base de datos está al ${storagePct.toFixed(1)}%. Realiza un Cierre de Año pronto.`,
            actionLabel: 'Ver Memoria',
            onAction: () => { if (typeof openUniversalInfoModal === 'function') openUniversalInfoModal('storage'); }
        });
    }

    const daysSinceBackup = Math.floor((Date.now() - (financeData.lastBackupDate || 0)) / (1000 * 3600 * 24));
    if (financeData.transactions.length > 0 && daysSinceBackup >= 30 && storagePct < 80) { 
        alerts.push({
            id: `backup_${currRealMonthId}`,
            title: `${renderIcon('archive', 14)} Respaldo preventivo`,
            desc: `Han pasado ${daysSinceBackup} días desde tu última copia.`,
            actionLabel: 'Exportar JSON',
            onAction: () => document.getElementById('btn-export-data')?.click()
        });
    }

    financeData.customAccounts.filter(a => a.category === 'credit_card').forEach(c => {
        const bal = round2(snap.bals[c.id] || 0);
        if (bal > 0 && c.paymentDay) {
            const payDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), c.paymentDay, 8, 30, 0);
            const diffDays = Math.ceil((payDate - currentDate) / (1000 * 3600 * 24));
            if (diffDays >= 0 && diffDays <= prefs.daysBefore) {
                const est = calculateCardMinPaymentEstimate(c, bal);
                const daysLine = diffDays === 0
                    ? `Hoy (día ${c.paymentDay})`
                    : `En ${diffDays} día(s) (día ${c.paymentDay})`;
                const balanceLine = `Saldo: ${formatMoney(bal)}`;
                const quotaLine = est.totalMinPayment > 0
                    ? `<span style="display:block; margin-top:2px; color:var(--text-main); font-weight:700;">Cuota: <b style="font-size:12.5px; font-weight:800;">${formatMoneyHtml(est.totalMinPayment)}</b></span>`
                    : '';

                alerts.push({
                    id: `card_${c.id}_${currRealMonthId}`,
                    title: `${renderIcon('card', 14)} Pago Tarjeta ${c.name}`,
                    desc: `<span style="display:block; margin-top:2px;">${daysLine}</span><span style="display:block; margin-top:2px;">${balanceLine}</span>${quotaLine}`,
                    actionLabel: `${renderIcon('calendar', 12)} Calendario`,
                    onAction: () => downloadIcsEvent(`Pagar Tarjeta ${c.name}`, `Pago tarjeta ${c.name} • Cuota mínima estimada: ${formatMoney(est.totalMinPayment)} • Saldo vigente: ${formatMoney(bal)}.`, payDate)
                });
            }
        }
    });

    financeData.customAccounts.filter(a => a.debtType === 'education').forEach(edu => {
        const bal = round2(snap.bals[edu.id] || 0);
        if (bal > 0 && edu.paymentDay) {
            const payDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), edu.paymentDay, 8, 30, 0);
            const diffDays = Math.ceil((payDate - currentDate) / (1000 * 3600 * 24));
            if (diffDays >= -5 && diffDays <= 7) {
                const quotaAmt = calculateAmortization(edu.debtOriginal, edu.debtTotalQuotes || 1, 0, 'monthly').payment;
                alerts.push({
                    id: `edu_${edu.id}_${currRealMonthId}`,
                    title: `${renderIcon('award', 14)} Universidad: ${edu.name}`,
                    desc: diffDays < 0 ? `Atrasada ${Math.abs(diffDays)} día(s) • ${formatMoney(quotaAmt)}` : (diffDays === 0 ? `¡Vence HOY! • ${formatMoney(quotaAmt)}` : `Vence en ${diffDays} día(s) • ${formatMoney(quotaAmt)}`),
                    actionLabel: 'Ver Detalle',
                    onAction: () => { openAccountDetail(edu.id, 'home'); document.getElementById('open-pay-installment-btn')?.click(); }
                });
            }
        }
    });

    if (financeData.subscriptions) {
        financeData.subscriptions.filter(s => s.status === 'active').forEach(sub => {
            if (!sub.nextBillingDate) return;
            const [y, m, d] = sub.nextBillingDate.split('-').map(Number);
            const nextDate = new Date(y, m - 1, d, 8, 30, 0);
            const diffDays = Math.ceil((nextDate - currentDate) / (1000 * 3600 * 24));
            
            if (diffDays >= -5 && diffDays <= (sub.reminderDays || 3)) {
                alerts.push({
                    id: `sub_${sub.id}_${sub.nextBillingDate}`,
                    title: `${renderIcon('repeat', 14)} Pago ${sub.name}`,
                    desc: diffDays < 0 ? `Vencido hace ${Math.abs(diffDays)} día(s) • ${formatMoney(sub.amount)}` : (diffDays === 0 ? `Vence hoy • ${formatMoney(sub.amount)}` : `Vence en ${diffDays} día(s) • ${formatMoney(sub.amount)}`),
                    actionLabel: `${renderIcon('check', 12)} Pagar`,
                    onAction: () => {
                        if (confirm(`¿Registrar el pago de ${sub.name} por ${formatMoney(sub.amount)} y actualizar al próximo ciclo?`)) {
                            if (typeof processSubscriptionPayment === 'function') processSubscriptionPayment(sub.id);
                        }
                    }
                });
            }
        });
    }

    let totalPlannedExp = 0, totalSpentExp = 0;
    const mIdx = viewDate.getMonth();
    financeData.categories.expense.forEach(cat => { totalPlannedExp = round2(totalPlannedExp + getCategoryLimitForMonth(cat, mIdx)); });
    financeData.transactions.forEach(t => {
        if (!t.isDeleted && !t.isTripIsolated && t.monthId === monthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)) {
            totalSpentExp = round2(totalSpentExp + round2(t.amount));
        }
    });
    
    if (totalPlannedExp > 0) {
        const pct = Math.round((totalSpentExp / totalPlannedExp) * 100);
        if (pct >= prefs.budgetPct) {
            alerts.push({
                id: `budget_${monthId}_${pct >= 100 ? '100' : prefs.budgetPct}`,
                title: pct >= 100 ? `${renderIcon('alert', 14)} Presupuesto excedido` : `${renderIcon('alert', 14)} Presupuesto al ${pct}%`,
                desc: `Has gastado ${formatMoney(totalSpentExp)} de ${formatMoney(totalPlannedExp)} este mes.`,
                actionLabel: 'Ver detalle',
                onAction: () => { document.getElementById('budget-modal')?.classList.remove('hidden'); renderBudgetView(); }
            });
        }
    }

    if (prefs.pendingEnabled) {
        const pendingCount = financeData.transactions.filter(t => !t.isDeleted && t.monthId === monthId && t.status === 'pending').length;
        if (pendingCount > 0 && monthId === currRealMonthId) {
            alerts.push({
                id: `pending_${monthId}_${pendingCount}`,
                title: `${renderIcon('clock', 14)} ${pendingCount} pendiente(s)`,
                desc: 'Tienes pagos o ingresos programados por confirmar este mes.',
                actionLabel: 'Filtrar',
                onAction: () => {
                    activeHistoryFilter = 'pending';
                    document.querySelectorAll('.pill-btn[data-filter]').forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === 'pending'));
                    updateDashboard();
                }
            });
        }
    }

    const dismissedList = Array.isArray(financeData.dismissedAlerts) ? financeData.dismissedAlerts : [];
    const activeAlerts = alerts.filter(al => !dismissedList.includes(al.id));

    if (activeAlerts.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = '';
    const visibleAlerts = activeAlerts.slice(0, 3);
    const hasMultiple = visibleAlerts.length >= 2;

    if (hasMultiple) {
        const grid = document.createElement('div');
        grid.className = 'upcoming-bento-grid';
        visibleAlerts.forEach((al, idx) => {
            const card = document.createElement('div');
            card.className = `upcoming-bento-card ${idx === 0 ? 'soonest' : ''}`;
            card.innerHTML = `
                <div class="upcoming-bento-top">
                    <span class="upcoming-bento-tag">${idx === 0 ? 'Más próximo' : 'Aviso'}</span>
                    <button type="button" class="btn-dismiss-alert" title="Marcar como leída" aria-label="Marcar como leída">${renderIcon('check', 13)}</button>
                </div>
                <strong style="display:flex; align-items:center; gap:4px;">${al.title}</strong>
                <small>${al.desc}</small>
                <button type="button" class="btn-download-ics" style="display:flex; align-items:center; justify-content:center; gap:4px;">${al.actionLabel}</button>
            `;
            card.querySelector('.btn-dismiss-alert').addEventListener('click', (e) => {
                e.stopPropagation();
                dismissSmartAlert(al.id);
                updateDashboard();
            });
            card.querySelector('.btn-download-ics').addEventListener('click', al.onAction);
            grid.appendChild(card);
        });
        container.appendChild(grid);
    } else {
        visibleAlerts.forEach(al => {
            const div = document.createElement('div');
            div.className = 'ios-alert-banner';
            div.innerHTML = `
                <div class="ios-alert-info">
                    <strong style="display:flex; align-items:center; gap:4px;">${al.title}</strong>
                    <small>${al.desc}</small>
                </div>
                <div class="ios-alert-actions">
                    <button type="button" class="btn-download-ics" style="display:flex; align-items:center; justify-content:center; gap:4px;">${al.actionLabel}</button>
                    <button type="button" class="btn-dismiss-alert" title="Marcar como leída" aria-label="Marcar como leída">${renderIcon('check', 14)}</button>
                </div>
            `;
            div.querySelector('.btn-download-ics').addEventListener('click', al.onAction);
            div.querySelector('.btn-dismiss-alert').addEventListener('click', (e) => {
                e.stopPropagation();
                dismissSmartAlert(al.id);
                updateDashboard();
            });
            container.appendChild(div);
        });
    }
};

const syncDismissedAlertsButton = () => {
    const restoreBtn = document.getElementById('btn-restore-dismissed-alerts');
    if (!restoreBtn) return;
    const count = Array.isArray(financeData.dismissedAlerts) ? financeData.dismissedAlerts.length : 0;
    restoreBtn.classList.toggle('hidden', count === 0);
    if (count > 0) {
        restoreBtn.innerText = `Restaurar avisos silenciados (${count})`;
    }
};

document.getElementById('btn-restore-dismissed-alerts')?.addEventListener('click', () => {
    financeData.dismissedAlerts = [];
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    syncDismissedAlertsButton();
    updateDashboard();
});
// --- 7. TABLERO PERSONALIZABLE (ORDEN DE WIDGETS) ---
const DEFAULT_WIDGET_ORDER = ['cash-flow', 'summary-rings', 'budget-preview', 'balance-sheet', 'credit-cards', 'debts-summary', 'history-list'];
const DEFAULT_ANALYTICS_ORDER = ['analytics-networth', 'analytics-cashflow', 'analytics-balancesheet', 'analytics-daily', 'analytics-donut', 'analytics-tags', 'analytics-ant'];

let analyticsOrder = [];

const applyWidgetOrder = () => {
    // 1. Dashboard Principal
    const container = document.getElementById('dashboard-widgets-container');
    if (container) {
        const saved = JSON.parse(localStorage.getItem('myFinancesWidgetOrder') || 'null');
        widgetOrder = Array.isArray(saved) && saved.length > 0 ? saved : [...DEFAULT_WIDGET_ORDER];
        DEFAULT_WIDGET_ORDER.forEach(id => { if (!widgetOrder.includes(id)) widgetOrder.push(id); });

        widgetOrder.forEach(id => {
            const el = container.querySelector(`[data-widget-id="${id}"]`);
            if (el) container.appendChild(el);
        });
    }

    // 2. Modal de Análisis Financiero
    const analyticsContainer = document.getElementById('analytics-widgets-container');
    if (analyticsContainer) {
        const savedAnalytics = JSON.parse(localStorage.getItem('myFinancesAnalyticsOrder') || 'null');
        analyticsOrder = Array.isArray(savedAnalytics) && savedAnalytics.length > 0 ? savedAnalytics : [...DEFAULT_ANALYTICS_ORDER];
        DEFAULT_ANALYTICS_ORDER.forEach(id => { if (!analyticsOrder.includes(id)) analyticsOrder.push(id); });

        analyticsOrder.forEach(id => {
            const el = analyticsContainer.querySelector(`[data-analytics-id="${id}"]`);
            if (el) analyticsContainer.appendChild(el);
        });
    }
};

const WIDGET_NAMES = {
    'cash-flow': 'Flujo de Caja',
    'summary-rings': 'Metas y Salud',
    'budget-preview': 'Presupuesto',
    'balance-sheet': 'Hoja de Balance',
    'credit-cards': 'Tarjetas',
    'debts-summary': 'Préstamos',
    'history-list': 'Movimientos',
    'analytics-networth': 'Patrimonio Neto',
    'analytics-cashflow': 'Flujo de Caja',
    'analytics-balancesheet': 'Hoja de Balance',
    'analytics-daily': 'Resumen Diario',
    'analytics-donut': 'Distribución de Gastos',
    'analytics-tags': 'Proyectos (#Tags)',
    'analytics-ant': 'Gastos Hormiga y Suscripciones'
};

const refreshEditControlsLimits = (containerId = 'dashboard-widgets-container', selectorAttr = 'data-widget-id') => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const visibleEls = Array.from(container.querySelectorAll(`[${selectorAttr}]`)).filter(el => !el.classList.contains('hidden'));
    visibleEls.forEach((el, idx) => {
        const upBtn = el.querySelector('.widget-move-btn[data-dir="-1"]');
        const downBtn = el.querySelector('.widget-move-btn[data-dir="1"]');
        if (upBtn) upBtn.disabled = (idx === 0);
        if (downBtn) downBtn.disabled = (idx === visibleEls.length - 1);
    });
};

const moveWidgetByOffset = (widgetId, delta, isAnalytics = false) => {
    const containerId = isAnalytics ? 'analytics-widgets-container' : 'dashboard-widgets-container';
    const attrName = isAnalytics ? 'data-analytics-id' : 'data-widget-id';
    const container = document.getElementById(containerId);
    if (!container) return;

    const visibleIds = Array.from(container.querySelectorAll(`[${attrName}]`))
        .filter(el => !el.classList.contains('hidden'))
        .map(el => el.getAttribute(attrName));

    const visIdx = visibleIds.indexOf(widgetId);
    const targetVisIdx = visIdx + delta;
    if (visIdx === -1 || targetVisIdx < 0 || targetVisIdx >= visibleIds.length) return;

    const targetId = visibleIds[targetVisIdx];
    const targetArr = isAnalytics ? analyticsOrder : widgetOrder;
    const storageKey = isAnalytics ? 'myFinancesAnalyticsOrder' : 'myFinancesWidgetOrder';

    const fromIdx = targetArr.indexOf(widgetId);
    const toIdx = targetArr.indexOf(targetId);
    
    // Intercambiar en el array
    const temp = targetArr[fromIdx];
    targetArr[fromIdx] = targetArr[toIdx];
    targetArr[toIdx] = temp;
    
    localStorage.setItem(storageKey, JSON.stringify(targetArr));
    applyWidgetOrder();
    refreshEditControlsLimits(containerId, attrName);
};

const toggleDashboardEditMode = (forceState = null) => {
    isDashboardEditMode = forceState !== null ? forceState : !isDashboardEditMode;
    const dashContainer = document.getElementById('dashboard-widgets-container');
    const analyticsContainer = document.getElementById('analytics-widgets-container');
    const toggleBtn = document.getElementById('toggle-edit-widgets-btn');
    const analyticsToggleBtn = document.getElementById('toggle-edit-analytics-btn');

    if (toggleBtn) toggleBtn.innerText = isDashboardEditMode ? '✓ Listo' : 'Ordenar';
    if (analyticsToggleBtn) analyticsToggleBtn.innerText = isDashboardEditMode ? '✓ Listo' : 'Ordenar';

    document.getElementById('floating-done-edit-btn')?.remove();
    if (isDashboardEditMode) {
        const donePill = document.createElement('button');
        donePill.id = 'floating-done-edit-btn';
        donePill.type = 'button';
        donePill.className = 'floating-done-edit-btn';
        donePill.innerText = '✓ Listo';
        donePill.onclick = () => toggleDashboardEditMode(false);
        document.body.appendChild(donePill);
    }

    const attachControls = (container, isAnalytics) => {
        if (!container) return;
        const attrName = isAnalytics ? 'data-analytics-id' : 'data-widget-id';
        container.querySelectorAll(`[${attrName}]`).forEach(el => {
            const wId = el.getAttribute(attrName);
            const oldControls = el.querySelector('.widget-edit-controls');
            if (oldControls) oldControls.remove();

            if (isDashboardEditMode) {
                el.classList.add('edit-mode');
                const bar = document.createElement('div');
                bar.className = 'widget-edit-controls';
                bar.innerHTML = `
                    <span class="widget-edit-label">⠿ ${WIDGET_NAMES[wId] || 'Bloque'}</span>
                    <div class="widget-edit-btns">
                        <button type="button" class="widget-move-btn" data-dir="-1">▲ Subir</button>
                        <button type="button" class="widget-move-btn" data-dir="1">▼ Bajar</button>
                    </div>
                `;
                bar.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        moveWidgetByOffset(wId, parseInt(btn.getAttribute('data-dir'), 10), isAnalytics);
                    });
                });
                el.prepend(bar);
            } else {
                el.classList.remove('edit-mode');
            }
        });
    };

    attachControls(dashContainer, false);
    attachControls(analyticsContainer, true);

    if (isDashboardEditMode) {
        refreshEditControlsLimits('dashboard-widgets-container', 'data-widget-id');
        refreshEditControlsLimits('analytics-widgets-container', 'data-analytics-id');
    }
};

const initDashboardDragAndControls = () => {
    document.getElementById('toggle-edit-widgets-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDashboardEditMode();
    });
    document.getElementById('toggle-edit-analytics-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDashboardEditMode();
    });

    const savingsWidget = document.getElementById('widget-savings-goals');
    if (savingsWidget && !savingsWidget.dataset.bound) {
        savingsWidget.dataset.bound = '1';
        savingsWidget.addEventListener('click', () => {
            if (isDashboardEditMode) return;
            if (attemptCloseModals()) {
                document.getElementById('pockets-modal')?.classList.remove('hidden');
                renderPocketsView();
            }
        });
    }
};

// --- 8. SELECTORES DE CUENTAS (CON BOLSILLOS) Y CATEGORÍAS ---
const renderAccountSelects = (onlyAssetsForMain = false, forcedSelectedId = null) => {
    const accountSelect = document.getElementById('account');
    const toAccountSelect = document.getElementById('to-account');
    if (!accountSelect) return;

    const prevFrom = forcedSelectedId || accountSelect.value;
    const prevTo = toAccountSelect ? toAccountSelect.value : '';

    const allAssets = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset'));
    const standardAssets = allAssets.filter(a => !a.id.startsWith('CxC_'));
    const cxcAssets = allAssets.filter(a => a.id.startsWith('CxC_'));
    
    const cards = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'credit_card'));
    const debts = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'debt' && currentBalances[a.id] > 0));
    const pockets = [...(financeData.pockets || [])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

    const buildOptionsHtml = (includeLiabilities = true, includePockets = false) => {
        let html = '';
        if (standardAssets.length > 0) {
            html += `<optgroup label="Liquidez (Cuentas y Efectivo)">`;
            standardAssets.forEach(a => { html += `<option value="${a.id}">${stripLeadingEmoji(a.name)}${a.isDefault ? ' ★' : ''}</option>`; });
            html += `</optgroup>`;
        }
        if (cxcAssets.length > 0) {
            html += `<optgroup label="Deudas a Favor (Por Cobrar)">`;
            cxcAssets.forEach(a => { html += `<option value="${a.id}">${stripLeadingEmoji(a.name)}</option>`; });
            html += `</optgroup>`;
        }
        if (includePockets && pockets.length > 0) {
            html += `<optgroup label="Bolsillos de Ahorro">`;
            pockets.forEach(p => {
                const bal = round2((p.principal || 0) + (p.yields || 0));
                html += `<option value="${p.id}">${stripLeadingEmoji(p.name)} (${formatCompact(bal)})</option>`;
            });
            html += `</optgroup>`;
        }
        if (includeLiabilities && cards.length > 0) {
            html += `<optgroup label="Tarjetas de Crédito">`;
            cards.forEach(c => { html += `<option value="${c.id}">${stripLeadingEmoji(c.name)}${c.isDefault ? ' ★' : ''}</option>`; });
            html += `</optgroup>`;
        }
        if (includeLiabilities && debts.length > 0) {
            html += `<optgroup label="Préstamos">`;
            debts.forEach(d => { html += `<option value="${d.id}">${stripLeadingEmoji(d.name)}</option>`; });
            html += `</optgroup>`;
        }
        return html;
    };

    const isTransfer = typeSelect && typeSelect.value === 'transfer';
    const isExpense = typeSelect && typeSelect.value === 'expense';
    const isIncome = typeSelect && typeSelect.value === 'income';
    // Permitir elegir bolsillos en transferencias, gastos e ingresos (rendimientos)
    accountSelect.innerHTML = buildOptionsHtml(!onlyAssetsForMain, isTransfer || isExpense || isIncome);
    if (prevFrom && Array.from(accountSelect.options).some(o => o.value === String(prevFrom))) {
        accountSelect.value = String(prevFrom);
    }

    if (toAccountSelect) {
        toAccountSelect.innerHTML = buildOptionsHtml(true, true);
        if (prevTo && Array.from(toAccountSelect.options).some(o => o.value === String(prevTo))) {
            toAccountSelect.value = String(prevTo);
        } else if (pockets.length > 0 && isTransfer) {
            const alternatives = Array.from(toAccountSelect.options).filter(o => o.value !== accountSelect.value);
            if (alternatives.length > 0) toAccountSelect.value = alternatives[0].value;
        }
    }
};

const renderCategoryOptions = (type = 'expense') => {
    const catSelect = document.getElementById('trans-category');
    if (!catSelect || type === 'transfer') return;
    const list = [...(financeData.categories[type] || [])].filter(c => !c.isArchived).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    let html = '';

    if (list.length === 0) {
        html = `<option value="">Crea una categoría en la pestaña Presupuesto</option>`;
    } else {
        html = `<option value="">Seleccionar categoría...</option>`;
        list.forEach(cat => {
            const labelCat = cleanCatName(cat.name);
            if (cat.subcategories && cat.subcategories.length > 0) {
                html += `<optgroup label="${labelCat}">`;
                html += `<option value="${cat.name}::General">${labelCat} (General)</option>`;
                const subs = [...cat.subcategories].filter(s => !s.isArchived).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
                subs.forEach(sub => {
                    html += `<option value="${cat.name}::${sub.name}">↳ ${cleanCatName(sub.name)}</option>`;
                });
                html += `</optgroup>`;
            } else {
                html += `<option value="${cat.name}::General">${labelCat}</option>`;
            }
        });
    }
    catSelect.innerHTML = html;
};
// --- 9. DASHBOARD PRINCIPAL Y CALENDARIO ---
window.updateDashboard = () => {
    const viewMonthId = getMonthId(viewDate);
    const currentMonthId = getMonthId(currentDate);
    const isFuture = viewMonthId > currentMonthId;

    if (document.getElementById('current-month-display')) document.getElementById('current-month-display').innerText = formatMonthName(viewDate);
    // Lógica para mostrar días restantes solo en el mes actual
    const daysBar = document.getElementById('days-remaining-bar');
    const daysMonthEl = document.getElementById('days-left-month');
    const daysYearEl = document.getElementById('days-left-year');
    
    if (daysBar && daysMonthEl && daysYearEl) {
        const isCurrentMonth = viewDate.getMonth() === currentDate.getMonth() && viewDate.getFullYear() === currentDate.getFullYear();
        
        if (isCurrentMonth) {
            const today = currentDate;
            
            // Días restantes del mes (+1 para contar el día actual)
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const daysLeftMonth = lastDayOfMonth.getDate() - today.getDate() + 1;
            
            // Días restantes del año (+1 para contar el día actual)
            const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
            const diffTimeYear = Math.abs(lastDayOfYear - today);
            const daysLeftYear = Math.ceil(diffTimeYear / (1000 * 60 * 60 * 24)) + 1;
            
            daysMonthEl.innerText = `Faltan ${daysLeftMonth} días del mes`;
            daysYearEl.innerText = `Faltan ${daysLeftYear} días del año`;
            
            daysBar.classList.remove('hidden');
        } else {
            daysBar.classList.add('hidden');
        }
    }
    if (document.getElementById('quick-month-input')) document.getElementById('quick-month-input').value = viewMonthId;
    if (document.getElementById('analytics-month-label')) document.getElementById('analytics-month-label').innerText = formatMonthName(viewDate);

    document.querySelectorAll('#quick-jump-pills .pill-btn').forEach(btn => {
        const offset = parseInt(btn.getAttribute('data-offset'), 10);
        const targetD = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        btn.classList.toggle('active', getMonthId(targetD) === viewMonthId);
    });

    const badge = document.getElementById('period-status-badge');
    const todayBtn = document.getElementById('today-month-btn');
    if (badge && todayBtn) {
        if (selectedCalendarDay) { badge.innerText = `Día: ${selectedCalendarDay.split('-')[2]}`; badge.className = 'period-badge day'; todayBtn.classList.remove('hidden'); }
        else if (isFuture) { badge.innerText = 'Proyección'; badge.className = 'period-badge future'; todayBtn.classList.remove('hidden'); }
        else if (viewMonthId < currentMonthId) { badge.innerText = 'Histórico'; badge.className = 'period-badge past'; todayBtn.classList.remove('hidden'); }
        else { badge.innerText = 'Actual'; badge.className = 'period-badge'; todayBtn.classList.add('hidden'); }
    }

    const currSnap = computeBalancesUpTo(viewMonthId);
    currentBalances = currSnap.bals;
    const prevDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    const prevSnap = computeBalancesUpTo(getMonthId(prevDate));

    const headerBalEl = document.getElementById('net-worth-header');
    if (headerBalEl) {
        headerBalEl.innerHTML = formatMoneyHtml(currSnap.assetsTotal);
        headerBalEl.style.color = currSnap.assetsTotal < 0 ? 'var(--negative)' : 'var(--text-main)';
    }

    const headerLiqBtn = document.getElementById('header-liquidity-trigger');
    if (headerLiqBtn && !headerLiqBtn.dataset.bound) {
        headerLiqBtn.dataset.bound = '1';
        headerLiqBtn.addEventListener('click', () => document.getElementById('drawer-accounts')?.click());
    }

    const bsCutoffEl = document.getElementById('bs-cutoff-badge');
    if (bsCutoffEl) {
        const now = new Date();
        const realCurrId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const activeMonthId = document.getElementById('quick-month-input')?.value || realCurrId;
        if (activeMonthId === realCurrId) {
            const mShort = now.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
            bsCutoffEl.innerText = `${now.getDate()} ${mShort}.`;
        } else {
            bsCutoffEl.innerText = activeMonthId > realCurrId ? 'Proyectado' : 'Cierre';
        }
    }

    const currFlow = getMonthlyFlow(viewMonthId, false);
    let monthlyIncome = currFlow.inc, monthlyExpense = currFlow.exp, projectionData = null;

    if (isFuture) {
        // Ejecutar el motor de simulación realista
        const sim = simulateFutureLiquidity(currentMonthId, viewMonthId, currSnap.assetsTotal);
        
        // Mantener los valores programados para el widget de flujo si existen
        const scheduledFlow = getMonthlyFlow(viewMonthId, true);
        if (scheduledFlow.inc > 0 || scheduledFlow.exp > 0) {
            monthlyIncome = scheduledFlow.inc; 
            monthlyExpense = scheduledFlow.exp;
        } else {
            monthlyIncome = sim.avgInc; 
            monthlyExpense = sim.avgExp;
        }
        
        projectionData = { 
            mode: 'hybrid', 
            avgIncome: sim.avgInc, 
            avgExpense: sim.avgExp, 
            avgCashFlow: sim.avgNet, 
            monthsDiff: sim.monthsDiff, 
            currentLiquidity: currSnap.assetsTotal, 
            projectedLiquidity: sim.projectedLiquidity 
        };
    }

    const cashFlow = round2(monthlyIncome - monthlyExpense);

    // 1. RENDER WIDGET FLUJO DE CAJA Y LIBRE SEGURO
    if (document.getElementById('monthly-income')) document.getElementById('monthly-income').innerHTML = formatMoneyHtml(monthlyIncome);
    if (document.getElementById('monthly-expense')) document.getElementById('monthly-expense').innerHTML = formatMoneyHtml(monthlyExpense);
    if (document.getElementById('monthly-net')) {
        const netEl = document.getElementById('monthly-net');
        netEl.innerHTML = formatMoneyHtml(cashFlow);
        netEl.className = 'hero-amount';
        netEl.style.color = cashFlow >= 0 ? 'var(--positive)' : 'var(--negative)';
        
        const heroLabel = document.querySelector('.hero-label');
        if (heroLabel) heroLabel.innerText = 'Flujo de Caja del Mes';
    }

    const maxFlow = Math.max(monthlyIncome, monthlyExpense, 1);
    setTimeout(() => {
        if (document.getElementById('flow-income-bar')) document.getElementById('flow-income-bar').style.width = `${(monthlyIncome / maxFlow) * 100}%`;
        if (document.getElementById('flow-expense-bar')) document.getElementById('flow-expense-bar').style.width = `${(monthlyExpense / maxFlow) * 100}%`;
    }, 50);

    // Mover el Badge fuera de las columnas para que no rompa el diseño (Banner ancho abajo)
        let safeBadge = document.getElementById('safe-to-spend-badge');
        if (!safeBadge) {
            safeBadge = document.createElement('div');
            safeBadge.id = 'safe-to-spend-badge';
            safeBadge.title = 'Toca para ver la proyección día por día';
            safeBadge.style.cssText = 'margin-top:14px; font-size:12px; font-weight:600; color:var(--text-muted); background:var(--hover-bg); display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-radius:12px; border:1px solid var(--border-color); cursor:pointer;';
            safeBadge.innerHTML = '<span style="display:flex; align-items:center; gap:6px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Libre Seguro Hoy:</span> <span style="display:inline-flex; align-items:center; gap:5px;"><span id="libre-seguro-amount" style="font-size:14px; color:var(--text-main); font-weight:800;">$ 0,00</span><span style="color:var(--text-muted); font-size:15px; font-weight:700;">›</span></span>';
            safeBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof openCashProjectionModal === 'function') openCashProjectionModal();
            });
            const flowWidget = document.getElementById('widget-cash-flow');
            if (flowWidget) flowWidget.appendChild(safeBadge);
        }

if (viewMonthId === currentMonthId && document.getElementById('libre-seguro-amount')) {
            const { safeToSpend } = computeSafeToSpendToday(currentMonthId, currSnap);
            document.getElementById('libre-seguro-amount').innerText = formatMoney(safeToSpend);
        }

        let positiveAssetTotal = 0, positiveLoansTotal = 0;
        financeData.customAccounts.forEach(acc => {
            const b = round2(currentBalances[acc.id] || 0);
            if (acc.category === 'asset' && b > 0) positiveAssetTotal = round2(positiveAssetTotal + b);
            if (acc.category === 'debt' && b > 0) positiveLoansTotal = round2(positiveLoansTotal + b);
        });

        // Banner de Modo Demo en el Tablero si la app está vacía
        let emptyDemoBanner = document.getElementById('dashboard-empty-demo-banner');
        if (financeData.transactions.length === 0 && !financeData.isDemoMode) {
            if (!emptyDemoBanner) {
                const dashContainer = document.getElementById('dashboard-widgets-container');
                emptyDemoBanner = document.createElement('div');
                emptyDemoBanner.id = 'dashboard-empty-demo-banner';
                emptyDemoBanner.style.cssText = 'background:linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); border:1px dashed #8b5cf6; border-radius:16px; padding:18px 16px; text-align:center; margin-bottom:14px; box-shadow:0 8px 24px rgba(139, 92, 246, 0.15);';
                emptyDemoBanner.innerHTML = `
                    <div style="width:48px; height:48px; border-radius:14px; background:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 12px auto; box-shadow:0 4px 12px rgba(0,0,0,0.05); color:#8b5cf6;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                    </div>
                    <strong style="color:var(--text-main); font-size:15px; display:block; margin-bottom:6px;">Tu tablero está en blanco</strong>
                    <small style="color:var(--text-muted); font-size:12.5px; display:block; margin-bottom:16px; line-height:1.4;">Comienza a registrar tus cuentas y gastos, o carga datos de prueba para explorar cómo funciona la app sin miedo a dañar nada.</small>
                    <button type="button" id="btn-dash-load-demo" class="btn btn-primary" style="width:100%; font-size:13.5px; padding:12px;">Poblar con datos de prueba</button>
                `;
                dashContainer?.insertBefore(emptyDemoBanner, dashContainer.firstChild);

                emptyDemoBanner.querySelector('#btn-dash-load-demo')?.addEventListener('click', () => {
                    if (typeof applyDemoData === 'function') {
                        applyDemoData();
                        updateDashboard();
                        location.reload();
                    }
                });
            }
        } else if (emptyDemoBanner) {
            emptyDemoBanner.remove();
        }

        renderAccountsBreakdown(currentBalances, positiveAssetTotal);

        // 3. RENDER WIDGET METAS AHORRO (BOLSILLOS)
        let totalPocketsGoal = 0, sumBal = 0;
        financeData.pockets.forEach(p => {
            const g = round2(p.goal ? p.goal : 0);
            totalPocketsGoal = round2(totalPocketsGoal + g);
            if (g > 0) {
                const pPrincipal = p.principal ? p.principal : 0;
                const pYields = p.yields ? p.yields : 0;
                sumBal += Math.min(g, round2(pPrincipal + pYields));
            }
        });

        let pocketsPct = 0;
        if (totalPocketsGoal > 0) pocketsPct = Math.min(100, Math.round((sumBal / totalPocketsGoal) * 100));
        else if (currSnap && currSnap.pocketsTotal > 0) pocketsPct = 100;

        if (document.getElementById('pockets-ring-pct')) document.getElementById('pockets-ring-pct').innerText = `${pocketsPct}%`;
        if (document.getElementById('pockets-saved-total')) {
            document.getElementById('pockets-saved-total').innerText = `${formatCompact(currSnap ? (currSnap.allPocketsTotal || currSnap.pocketsTotal || 0) : 0)} de ${formatCompact(totalPocketsGoal)}`;
        }

        const goalsCircle = document.getElementById('pockets-ring-progress');
        if (goalsCircle) {
            if (pocketsPct === 100 && totalPocketsGoal > 0) goalsCircle.style.stroke = 'var(--positive)';
            else goalsCircle.style.stroke = 'var(--accent)';
            const visualPct = Math.max(0.5, pocketsPct);
            setTimeout(() => { goalsCircle.style.strokeDashoffset = 251.2 - (251.2 * visualPct / 100); }, 150);
        }

        // 3.5 RENDER WIDGET SALUD FINANCIERA
        const healthData = calculateFinancialHealth(viewMonthId, currSnap);
        const hScoreEl = document.getElementById('health-score-val');
        const hBadgeEl = document.getElementById('health-score-badge');
        const hCircleEl = document.getElementById('health-ring-progress');
        if (hScoreEl && hBadgeEl && hCircleEl) {
            const renderStatusPill = (label, dotColor, badgeClass) => {
                hBadgeEl.className = `widget-badge ${badgeClass}`;
                hBadgeEl.style.display = 'inline-flex';
                hBadgeEl.style.alignItems = 'center';
                hBadgeEl.style.justifyContent = 'center';
                hBadgeEl.style.gap = '6px';
                hBadgeEl.innerHTML = `<span>${label}</span><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${dotColor}; flex-shrink:0;"></span>`;
            };

            if (healthData.isNeutral) {
                hScoreEl.innerText = '--';
                renderStatusPill('Faltan datos', 'var(--text-muted)', 'neutral');
                hCircleEl.style.strokeDashoffset = 251.2;
            } else {
                const gScore = healthData.scores.global;
                hScoreEl.innerText = gScore;
                hCircleEl.style.stroke = gScore >= 80 ? 'var(--positive)' : (gScore >= 50 ? '#f59e0b' : 'var(--negative)');
                setTimeout(() => { hCircleEl.style.strokeDashoffset = 251.2 - (251.2 * Math.max(2, gScore) / 100); }, 150);
                if (gScore >= 80) renderStatusPill('Excelente', 'var(--positive)', 'good');
                else if (gScore >= 50) renderStatusPill('Aceptable', '#f59e0b', 'warn');
                else renderStatusPill('En Riesgo', 'var(--negative)', 'danger');
            }
        }

        // 4. RENDER WIDGET PRESUPUESTO
        let globalLimit = 0, totalSpentExp = 0;
        financeData.categories.expense.forEach(c => { globalLimit += getCategoryLimitForMonth(c, viewDate.getMonth()); });
        financeData.transactions.forEach(t => { 
            if (!t.isDeleted && !t.isTripIsolated && t.monthId === viewMonthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)) { 
                totalSpentExp = round2(totalSpentExp + round2(t.amount)); 
            } 
        });

        const budgetPct = globalLimit > 0 ? Math.min(100, (totalSpentExp / globalLimit) * 100) : 0;
        const bFill = document.getElementById('dash-budget-fill');
        const bBadge = document.getElementById('dash-budget-badge');
        const bPace = document.getElementById('dash-budget-pace-marker');

        if (document.getElementById('dash-budget-spent-text')) {
            document.getElementById('dash-budget-spent-text').innerText = `Gastado: ${formatMoney(totalSpentExp)}`;
        }
        if (document.getElementById('dash-budget-rem-text')) {
            const remBudget = Math.max(0, round2(globalLimit - totalSpentExp));
            document.getElementById('dash-budget-rem-text').innerText = `Disponible: ${formatMoney(remBudget)}`;
        }

        if (bFill) {
            if (globalLimit > 0) {
                bFill.style.backgroundColor = budgetPct > 90 ? 'var(--negative)' : (budgetPct > 75 ? '#f59e0b' : 'var(--positive)');
                setTimeout(() => { bFill.style.width = `${budgetPct}%`; }, 200);

                const rem = Math.max(0, round2(globalLimit - totalSpentExp));
                const mDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
                
                if (bBadge) {
                    bBadge.innerText = rem > 0 ? `Quedan ${formatMoney(rem)}` : `Excedido ${formatMoney(Math.abs(rem))}`;
                    bBadge.className = rem > 0 ? 'widget-badge good' : 'widget-badge danger';
                }
                if (bPace) {
                    bPace.classList.remove('hidden');
                    const todayPos = viewMonthId === getMonthId(currentDate) ? Math.min(100, (currentDate.getDate() / mDays) * 100) : 100;
                    bPace.style.left = `${todayPos}%`;
                }
            } else {
                bFill.style.width = '0%';
                if (bBadge) { bBadge.innerText = 'Sin presupuesto'; bBadge.className = 'widget-badge neutral'; }
            }
        }

        // 5. RENDER ALERTAS, CALENDARIO, HOJA DE BALANCE Y GRÁFICOS DE ANÁLISIS
        try { renderSmartAlerts(viewMonthId, currSnap); } catch (e) { console.error(e); }
        try { renderCalendar(viewDate, 'calendar-days-grid'); } catch (e) { console.error(e); }
        try { renderBalanceSheet(currentBalances, currSnap.netWorth, currSnap); } catch (e) { console.error(e); }
        try { renderDashboardCardsSummary(currentBalances); } catch (e) { console.error(e); }
        try { renderDashboardDebtsSummary(currentBalances); } catch (e) { console.error(e); }
        try { renderNetWorthChart(viewDate, prevDate, prevSnap, currSnap); } catch (e) { console.error(e); }
        try { renderCashFlowChart(viewDate, prevDate); } catch (e) { console.error(e); }
        try { renderDailySummary(); } catch (e) { console.error(e); }
        try { renderBudgetDonut(viewMonthId, monthlyExpense); } catch (e) { console.error(e); }
        try { renderAnalyticsBalanceSheet(currentBalances, currSnap.netWorth, currSnap); } catch (e) { console.error(e); }
        try { if (typeof renderAnalyticsTagsCard === 'function') renderAnalyticsTagsCard(); } catch (e) { console.error(e); }
        try { if (typeof renderAnalyticsAntExpensesCard === 'function') renderAnalyticsAntExpensesCard(); } catch (e) { console.error(e); }

        // 6. RENDER HISTORIAL Y PROYECCIONES
        try { renderTransactionHistory(viewMonthId, currSnap, projectionData); } catch (e) { console.error(e); }
        if (typeof renderTripModeBanner === 'function') renderTripModeBanner();
};

let calendarHeatmapMode = 'variable'; // 'variable' | 'total'

const renderCalendar = (baseDate, containerId) => {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';

    const { offset, days, avgDailySpend, zeroSpendDays, maxElapsedDay } = computeCalendarHeatmapData(baseDate, calendarHeatmapMode);

    for (let i = 0; i < offset; i++) grid.innerHTML += `<div class="cal-day empty"></div>`;

    days.forEach(({ day, dStr, act, daySpend, heatClass, isToday }) => {
        const classes = `cal-day ${heatClass} ${isToday ? 'today' : ''} ${selectedCalendarDay === dStr ? 'selected' : ''}`;
        let dots = '';
        if (act) {
            if (act.inc) dots += `<span class="cal-dot positive-bg"></span>`;
            if (act.exp) dots += `<span class="cal-dot negative-bg"></span>`;
            if (act.pend) dots += `<span class="cal-dot" style="background:#f59e0b;"></span>`;
            if (act.trf && !act.pend) dots += `<span class="cal-dot" style="background:var(--accent);"></span>`;
        }
        const cell = document.createElement('div');
        cell.className = classes;
        if (daySpend > 0) cell.title = `${day}/${baseDate.getMonth() + 1}: ${formatMoney(daySpend)}`;
        cell.innerHTML = `<span>${day}</span><div class="cal-dots">${dots}</div>`;
        cell.onclick = () => {
            selectedCalendarDay = (selectedCalendarDay === dStr) ? null : dStr;
            forceCloseAllModals();
            updateDashboard();
        };
        grid.appendChild(cell);
    });

    let footerEl = document.getElementById('calendar-heatmap-footer');
    if (!footerEl && grid) {
        footerEl = document.createElement('div');
        footerEl.id = 'calendar-heatmap-footer';
        footerEl.className = 'cal-heatmap-footer';
        grid.insertAdjacentElement('afterend', footerEl);
    }
    if (footerEl) {
        const isVarMode = calendarHeatmapMode === 'variable';
        const modeLabel = isVarMode ? 'Solo variable' : 'Gasto total';
        const tooltipText = isVarMode 
            ? '<b>Solo Variable:</b> Mide tu intensidad de gasto diario ignorando gastos fijos marcados en tu presupuesto y viajes. (Mide tus hábitos/fugas)'
            : '<b>Gasto Total:</b> Incluye todo: fijos, suscripciones, compras y viajes. (Mide el impacto real en tu bolsillo)';
        const zeroText = maxElapsedDay > 0 ? `<b class="positive">${zeroSpendDays}d</b> sin gasto` : 'Mes futuro';
        
        footerEl.innerHTML = `
            <div class="cal-heatmap-row">
                <div class="cal-heat-scale">
                    <span class="cal-heat-item"><i class="cal-heat-swatch low"></i>Bajo</span>
                    <span class="cal-heat-item"><i class="cal-heat-swatch med"></i>Medio</span>
                    <span class="cal-heat-item"><i class="cal-heat-swatch high"></i>Alto</span>
                </div>
                <div style="display:flex; align-items:center;">
                    <button type="button" id="toggle-cal-heat-mode" class="mini-action-btn" style="font-size:10px; padding:2px 8px;">${modeLabel}</button>
                    <span class="cal-heat-info-icon" id="info-cal-heat-mode">i
                        <span class="cal-heat-tooltip">${tooltipText}</span>
                    </span>
                </div>
            </div>
            <div class="cal-heatmap-row">
                <span>${zeroText}</span>
                <span>Prom. día activo: <b style="color:var(--text-main);">${formatCompact(avgDailySpend)}</b></span>
            </div>
        `;

        footerEl.querySelector('#toggle-cal-heat-mode')?.addEventListener('click', (e) => {
            e.stopPropagation();
            calendarHeatmapMode = calendarHeatmapMode === 'variable' ? 'total' : 'variable';
            renderCalendar(baseDate, containerId);
        });

        footerEl.querySelector('#info-cal-heat-mode')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const icon = e.currentTarget;
            const wasActive = icon.classList.contains('active');
            document.querySelectorAll('.cal-heat-info-icon').forEach(el => el.classList.remove('active'));
            if (!wasActive) icon.classList.add('active');
        });

        grid.parentNode.addEventListener('click', () => {
            document.querySelectorAll('.cal-heat-info-icon').forEach(el => el.classList.remove('active'));
        }, { once: true });
    }

    const clearBtn = document.getElementById('clear-day-filter-btn');
    if (clearBtn) { if (selectedCalendarDay) clearBtn.classList.remove('hidden'); else clearBtn.classList.add('hidden'); }
};

document.getElementById('prev-month')?.addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); selectedCalendarDay = null; updateDashboard(); });
document.getElementById('next-month')?.addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); selectedCalendarDay = null; updateDashboard(); });

const triggerBtn = document.getElementById('month-picker-trigger');
const popover = document.getElementById('quick-calendar-popover');
if (triggerBtn && popover) {
    triggerBtn.addEventListener('click', (e) => { e.stopPropagation(); popover.classList.toggle('hidden'); });
    document.addEventListener('click', (e) => { if (!popover.classList.contains('hidden') && !popover.contains(e.target) && !triggerBtn.contains(e.target)) popover.classList.add('hidden'); });
}

const goToday = () => { viewDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); selectedCalendarDay = null; if (popover) popover.classList.add('hidden'); updateDashboard(); };
document.getElementById('today-month-btn')?.addEventListener('click', goToday);

document.getElementById('quick-month-input')?.addEventListener('change', (e) => {
    if (e.target.value) {
        const [y, m] = e.target.value.split('-');
        viewDate = new Date(y, m - 1, 1);
        selectedCalendarDay = null;
        if (popover) popover.classList.add('hidden');
        updateDashboard();
    }
});

const pillsWrap = document.getElementById('quick-jump-pills');
if (pillsWrap) {
    const jumpOptions = [
        { offset: -1, label: 'Mes ant.' },
        { offset: 0, label: 'Mes actual' },
        { offset: 3, label: '+3 Meses' },
        { offset: 6, label: '+6 Meses' },
        { offset: 12, label: '+1 Año' }
    ];
    pillsWrap.innerHTML = jumpOptions.map(j => `<button type="button" class="pill-btn" data-offset="${j.offset}">${j.label}</button>`).join('');
    pillsWrap.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const offset = parseInt(btn.getAttribute('data-offset'), 10);
            viewDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
            selectedCalendarDay = null;
            if (popover) popover.classList.add('hidden');
            updateDashboard();
        });
    });
}
document.getElementById('close-quick-cal-btn')?.addEventListener('click', () => { if (popover) popover.classList.add('hidden'); });
document.getElementById('clear-day-filter-btn')?.addEventListener('click', () => { selectedCalendarDay = null; updateDashboard(); });

// --- 10. HOJA DE BALANCE, TARJETAS Y PRÉSTAMOS EN INICIO ---
document.getElementById('toggle-zero-accounts-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    financeData.hideZeroAccounts = !financeData.hideZeroAccounts;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    updateDashboard();
});

const renderBalanceSheet = (balances, netWorth, snap) => {
    const list = document.getElementById('balance-sheet-list');
    const totalEl = document.getElementById('bs-net-worth');
    const toggleZeroBtn = document.getElementById('toggle-zero-accounts-btn');
    if (!list || !totalEl) return;

    totalEl.innerHTML = formatMoneyHtml(netWorth);
    totalEl.className = netWorth >= 0 ? 'positive' : 'negative';

    const totalAssets = round2(snap.assetsTotal + snap.fixedAssetsTotal + snap.pocketsTotal);
    const totalLiabilities = round2(snap.liabilitiesTotal);

    if (document.getElementById('bs-kpi-assets')) document.getElementById('bs-kpi-assets').innerHTML = formatMoneyHtml(totalAssets);
    if (document.getElementById('bs-kpi-liabilities')) document.getElementById('bs-kpi-liabilities').innerHTML = formatMoneyHtml(totalLiabilities);

    const bsRing = document.getElementById('bs-ring-progress');
    const bsPct = document.getElementById('bs-ring-pct');
    if (bsRing && bsPct) {
        let p = 100;
        if (totalAssets > 0) p = Math.max(0, 100 - Math.round((totalLiabilities / totalAssets) * 100));
        else if (totalLiabilities > 0) p = 0;

        bsPct.innerText = `${p}%`;
        bsRing.style.strokeDashoffset = 251.2 - (251.2 * p / 100);
        if (p >= 80) bsRing.style.stroke = 'var(--positive)';
        else if (p >= 50) bsRing.style.stroke = '#f59e0b';
        else bsRing.style.stroke = 'var(--negative)';
    }

    list.innerHTML = '';
    let hiddenCount = 0;

    const assets = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset' && !a.id.startsWith('CxC_')));
    const cxcAccounts = financeData.customAccounts.filter(a => a.id.startsWith('CxC_'));
    const cards = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'credit_card'));
    const debts = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'debt' && balances[a.id] > 0));

    const renderAccGroup = (accGroup) => {
        accGroup.forEach(acc => {
            const bal = round2(balances[acc.id] || 0);
            const isZero = Math.abs(bal) < 0.01;

            if (financeData.hideZeroAccounts && isZero && !acc.showWhenZero) {
                hiddenCount++;
                return;
            }

            const isLiab = isLiabilityCategory(acc.category);
            const displayVal = isZero ? 0 : (isLiab ? -bal : bal);
            
            // Color semántico dinámico: gris en $0, rojo si es negativo/deuda, verde si es positivo
            const inlineColor = isZero
                ? 'var(--text-muted)'
                : (displayVal < 0 ? 'var(--negative)' : 'var(--positive)');
            const iconSvg = getAccountIcon(acc.category);
            const starTag = acc.isDefault ? ' ★' : '';

            const row = document.createElement('div');
            row.className = 'bs-row';
            row.onclick = (e) => {
                e.stopPropagation();
                if (attemptCloseModals()) openAccountDetail(acc.id, 'home');
            };
            
            // El nowrap garantiza que los centavos no salten a la línea de abajo.
            row.innerHTML = `<span style="min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-right:8px;"><span style="color:var(--accent); display:inline-flex;">${iconSvg}</span> ${stripLeadingEmoji(acc.name)}${starTag}</span><strong class="privacy-sensitive" style="color: ${inlineColor}; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: baseline;">${formatMoneyHtml(displayVal)}</strong>`;
            list.appendChild(row);
        });
    };

    renderAccGroup(assets);
    renderAccGroup(cards);
    renderAccGroup(debts);

    if (toggleZeroBtn) {
        if (financeData.hideZeroAccounts) {
            toggleZeroBtn.innerHTML = `${renderIcon('eye', 13)} ${hiddenCount > 0 ? `Ver todas (+${hiddenCount})` : 'Ver todas'}`;
        } else {
            toggleZeroBtn.innerHTML = `${renderIcon('eye-off', 13)} Ocultar $0`;
        }
    }

    const cxcTotal = round2(cxcAccounts.reduce((sum, a) => sum + Math.max(0, round2(balances[a.id] || 0)), 0));
    if (cxcTotal > 0) {
        const cxcRow = document.createElement('div');
        cxcRow.className = 'bs-row';
        cxcRow.onclick = (e) => {
            e.stopPropagation();
            if (attemptCloseModals()) openReceivablesModal();
        };
        cxcRow.innerHTML = `<span style="min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-right:8px;"><span style="color:var(--positive); display:inline-flex;">${renderIcon('users', 16)}</span> Deudas a Favor</span><strong style="color: var(--positive); white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: baseline;">${formatMoneyHtml(cxcTotal)}</strong>`;
        list.appendChild(cxcRow);
    }

    if (snap.pocketsTotal > 0) {
        const pRow = document.createElement('div');
        pRow.className = 'bs-row';
        pRow.onclick = (e) => {
            e.stopPropagation();
            if (attemptCloseModals()) {
                document.getElementById('pockets-modal')?.classList.remove('hidden');
                renderPocketsView();
            }
        };
        pRow.innerHTML = `<span style="min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-right:8px;"><span style="color:var(--positive); display:inline-flex;">${renderIcon('piggy', 16)}</span> Bolsillos de Ahorro</span><strong style="color: var(--positive); white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: baseline;">${formatMoneyHtml(snap.pocketsTotal)}</strong>`;
        list.appendChild(pRow);
    }

    if (snap.visibleFixedAssetsTotal > 0) {
        const faRow = document.createElement('div');
        faRow.className = 'bs-row';
        faRow.onclick = (e) => {
            e.stopPropagation();
            if (attemptCloseModals()) {
                document.getElementById('assets-modal')?.classList.remove('hidden');
                renderAssetsBreakdown();
            }
        };
        faRow.innerHTML = `<span style="min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-right:8px;"><span style="color:var(--accent); display:inline-flex;">${renderIcon('diamond', 16)}</span> Activos Fijos</span><strong style="color: var(--positive); white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: baseline;">${formatMoneyHtml(snap.visibleFixedAssetsTotal)}</strong>`;
        list.appendChild(faRow);
    }

    if (list.children.length === 0) {
        list.innerHTML = '<div class="bs-row" style="cursor:default;"><small style="color:var(--text-muted);">Todas las cuentas están en $ 0,00.</small></div>';
    }
};

const renderDashboardCardsSummary = (balances) => {
    const widget = document.getElementById('dashboard-cards-widget');
    const badge = document.getElementById('dash-tc-count-badge');
    const list = document.getElementById('dash-tc-list');
    if (!widget || !list) return;

    const cards = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'credit_card'));
    if (cards.length === 0) {
        widget.classList.add('hidden');
        return;
    }

    widget.classList.remove('hidden');
    list.innerHTML = '';

    let totalCardsDebt = 0, totalCardsLimit = 0, totalMinQuotas = 0;
    cards.forEach(card => {
        const debt = Math.max(0, round2(balances[card.id] || 0));
        totalCardsDebt = round2(totalCardsDebt + debt);
        totalCardsLimit = round2(totalCardsLimit + round2(card.creditLimit || 0));
        const est = calculateCardMinPaymentEstimate(card, debt);
        totalMinQuotas = round2(totalMinQuotas + est.totalMinPayment);
    });

    const totalCardsAvailable = Math.max(0, round2(totalCardsLimit - totalCardsDebt));
    const utilPct = totalCardsLimit > 0 ? (totalCardsDebt / totalCardsLimit) * 100 : 0;

    if (badge) {
        badge.innerText = `${cards.length} activa${cards.length !== 1 ? 's' : ''} • ${utilPct.toFixed(0)}%`;
        badge.className = `widget-badge ${utilPct <= 30 ? 'good' : (utilPct <= 70 ? 'warn' : 'danger')}`;
    }

    if (document.getElementById('dash-tc-total-debt')) document.getElementById('dash-tc-total-debt').innerText = formatCompact(totalCardsDebt);
    if (document.getElementById('dash-tc-total-avail')) document.getElementById('dash-tc-total-avail').innerText = formatCompact(totalCardsAvailable);
    if (document.getElementById('dash-tc-monthly-quota')) document.getElementById('dash-tc-monthly-quota').innerText = formatCompact(totalMinQuotas);

    const todayDay = currentDate.getDate();
    cards.forEach(card => {
        const debt = round2(balances[card.id] || 0);
        const limit = round2(card.creditLimit || 0);
        const pct = limit > 0 ? Math.min(100, Math.max(0, (debt / limit) * 100)) : 0;
        const barColor = pct > 80 ? 'var(--negative)' : (pct > 50 ? '#f59e0b' : 'var(--positive)');
        const cyclePos = Math.min(98, Math.max(2, (todayDay / 30) * 100));
        const est = calculateCardMinPaymentEstimate(card, debt);
        const iconSvg = renderIcon('card', 14);
        const minTag = est.totalMinPayment > 0 ? ` • Mín: <b style="color:var(--accent);">${formatCompact(est.totalMinPayment)}</b>` : '';

        const row = document.createElement('div');
        row.className = 'dash-tc-row';
        row.onclick = (e) => {
            e.stopPropagation();
            if (attemptCloseModals()) openAccountDetail(card.id, 'home');
        };
        row.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:4px;">
                <span style="display:flex; align-items:center; gap:6px; font-size:13.5px; font-weight:700; color:var(--text-main);">
                    <span class="drawer-icon-box subtle-box" style="width:22px; height:22px; flex-shrink:0;">${iconSvg}</span>
                    <span>${stripLeadingEmoji(card.name)}${card.isDefault ? ' ★' : ''}</span>
                </span>
                ${est.deferredCount > 0 ? `<small style="color:var(--accent); font-weight:700; font-size:11px; flex-shrink:0;">(${est.deferredCount} diff.)</small>` : ''}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:baseline; font-size:12.5px; font-weight:700; margin-bottom:6px; padding-left:28px;">
                <span>${formatMoneyHtml(debt)} <small style="color:var(--text-muted); font-weight:500;">/ ${formatCompact(limit)}</small></span>
                <span style="font-size:11px; color:var(--text-muted); font-weight:600;">Corte: ${card.cutoffDay || '-'} • Pago: ${card.paymentDay || '-'}</span>
            </div>
            <div class="pace-bar-track">
                <div class="pace-bar-fill" style="width:${pct}%; background-color:${barColor};"></div>
                <div class="pace-marker" style="left:${cyclePos}%; height:14px; top:-3px;"></div>
            </div>
            <div class="dash-tc-sub" style="align-items:center; margin-top:6px;">
                <span>Disp: <b class="positive">${formatMoneyHtml(Math.max(0, limit - debt))}</b></span>
                ${est.totalMinPayment > 0 ? `<span>Mín: <b style="color:var(--accent);">${formatMoneyHtml(est.totalMinPayment)}</b></span>` : ''}
            </div>
        `;
        list.appendChild(row);
    });
};

const renderDashboardDebtsSummary = (balances) => {
    const widget = document.getElementById('dashboard-debts-widget');
    const badge = document.getElementById('dash-debts-count-badge');
    const list = document.getElementById('dashboard-debts-list');
    if (!widget || !list) return;

    const debts = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'debt'));
    if (debts.length === 0) {
        widget.classList.add('hidden');
        return;
    }

    widget.classList.remove('hidden');
    list.innerHTML = '';

    let totalDebtsBalance = 0, totalOriginalDebts = 0, totalMonthlyQuotas = 0;
    debts.forEach(debt => {
        const bal = Math.max(0, round2(balances[debt.id] || 0));
        const orig = round2(debt.debtOriginal || bal);
        const qInfo = getDebtMonthlyQuotaBreakdown(debt, bal);

        totalDebtsBalance = round2(totalDebtsBalance + bal);
        totalOriginalDebts = round2(totalOriginalDebts + Math.max(orig, bal));
        if (bal > 0) totalMonthlyQuotas = round2(totalMonthlyQuotas + qInfo.totalQuota);
    });

    const amortPct = totalOriginalDebts > 0 ? Math.min(100, (Math.max(0, round2(totalOriginalDebts - totalDebtsBalance)) / totalOriginalDebts) * 100) : 0;
    if (badge) badge.innerText = `${debts.length} activo${debts.length !== 1 ? 's' : ''}`;
    if (document.getElementById('dash-debts-total-bal')) document.getElementById('dash-debts-total-bal').innerText = formatCompact(totalDebtsBalance);
    if (document.getElementById('dash-debts-monthly-quota')) document.getElementById('dash-debts-monthly-quota').innerText = formatCompact(totalMonthlyQuotas);
    if (document.getElementById('dash-debts-avg-progress')) document.getElementById('dash-debts-avg-progress').innerText = `${amortPct.toFixed(0)}%`;

    debts.forEach(debt => {
        const bal = Math.max(0, round2(balances[debt.id] || 0));
        const orig = Math.max(bal, round2(debt.debtOriginal || bal));
        const totQ = debt.debtTotalQuotes || 1, paidQ = debt.debtPaidQuotes || 0;
        const rate = debt.debtRate || 0, rateType = debt.debtRateType || 'monthly';
        const qInfo = getDebtMonthlyQuotaBreakdown(debt, bal);

        const monthlyPay = qInfo.totalQuota;
        let labelProgress = qInfo.subPurchases.length > 0
            ? (debt.debtType === 'revolving' ? `${qInfo.subPurchases.length} comp. activas` : `${paidQ}/${totQ}c + ${qInfo.subPurchases.length} comp.`)
            : `Cuotas: ${paidQ}/${totQ}`;
        const subBadge = debt.debtType === 'revolving'
            ? ` <span class="widget-badge warn" style="font-size:9px; padding:1px 6px;">Rotativo</span>`
            : '';

        const itemPct = orig > 0 ? Math.min(100, Math.max(0, (Math.max(0, round2(orig - bal)) / orig) * 100)) : 0;
        const payrollTag = debt.payrollDeduction
            ? ` • <span style="display:inline-flex; align-items:center; gap:3px;">${renderIcon('briefcase', 11)} Libranza</span>`
            : '';
        const iconSvg = renderIcon('scale', 14);

        const row = document.createElement('div');
        row.className = 'dash-tc-row';
        row.onclick = (e) => {
            e.stopPropagation();
            if (attemptCloseModals()) openAccountDetail(debt.id, 'home');
        };
        row.innerHTML = `
            <div class="dash-tc-top">
                <span style="display:flex; align-items:center; gap:6px;"><span class="drawer-icon-box subtle-box" style="width:22px; height:22px;">${iconSvg}</span> ${debt.name}${subBadge}</span>
                <span>${formatMoneyHtml(bal)} <small style="color:var(--text-muted); font-weight:500;">/ ${formatCompact(orig)}</small></span>
            </div>
            <div class="pace-bar-track">
                <div class="pace-bar-fill positive-bg" style="width:${itemPct}%;"></div>
            </div>
            <div class="dash-tc-sub">
                <span>Cuota: <b style="color:var(--accent);">${formatMoneyHtml(monthlyPay)}/m</b>${payrollTag}</span>
                <span>${labelProgress} • ${String(rate).replace('.', ',')}%</span>
            </div>
        `;
        list.appendChild(row);
    });
};

// ==========================================
// 11B. PRIVACIDAD, CICLOS, PAPELERA, #TAGS Y MULTIMONEDA
// ==========================================

// --- MODO PRIVACIDAD (OJITO HEADER) ---
document.getElementById('toggle-privacy-btn')?.addEventListener('click', () => {
    isPrivacyMode = !isPrivacyMode;
    localStorage.setItem('myFinancesPrivacyMode', isPrivacyMode);
    
    const iconOpen = document.querySelector('#toggle-privacy-btn .privacy-icon-open');
    const iconClosed = document.querySelector('#toggle-privacy-btn .privacy-icon-closed');
    
    if (isPrivacyMode) {
        iconOpen?.classList.add('hidden');
        iconClosed?.classList.remove('hidden');
    } else {
        iconOpen?.classList.remove('hidden');
        iconClosed?.classList.add('hidden');
    }

    updateDashboard(); 
    if (document.getElementById('profile-salary-view') && !document.getElementById('profile-salary-view').classList.contains('hidden')) {
        if (typeof renderSalaryUI === 'function') renderSalaryUI(false);
    }
});

if (isPrivacyMode) {
    document.querySelector('#toggle-privacy-btn .privacy-icon-open')?.classList.add('hidden');
    document.querySelector('#toggle-privacy-btn .privacy-icon-closed')?.classList.remove('hidden');
}

// --- CICLOS DE FECHA PERSONALIZADOS ---
window.syncCycleStartDayUI = () => {
    const sel = document.getElementById('pref-month-start-day');
    const hint = document.getElementById('pref-month-start-hint');
    const currentDay = getMonthStartDay();
    if (sel) sel.value = String(currentDay);
    if (hint) {
        hint.innerText = currentDay === 1
            ? 'Tus presupuestos y gráficos van del día 1 al último día del mes.'
            : `Ejemplo: Tu ciclo actual va del ${getCycleRangeText(getMonthId(viewDate))}.`;
    }
};

window.updateCycleRangeBadge = () => {
    const pill = document.getElementById('cycle-range-pill');
    if (!pill) return;
    const rangeTxt = getCycleRangeText(getMonthId(viewDate));
    if (rangeTxt) {
        pill.innerText = rangeTxt;
        pill.classList.remove('hidden');
    } else {
        pill.classList.add('hidden');
    }
};

document.getElementById('menu-notifications-btn')?.addEventListener('click', syncCycleStartDayUI);

document.getElementById('pref-month-start-day')?.addEventListener('change', (e) => {
    if (!financeData.preferences) financeData.preferences = {};
    financeData.preferences.monthStartDay = parseInt(e.target.value, 10) || 1;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    syncCycleStartDayUI();
    updateCycleRangeBadge();
    updateDashboard();
});

['prev-month', 'next-month', 'today-month-btn'].forEach(btnId => {
    document.getElementById(btnId)?.addEventListener('click', () => setTimeout(updateCycleRangeBadge, 20));
});
document.getElementById('quick-month-input')?.addEventListener('change', () => setTimeout(updateCycleRangeBadge, 20));

// --- SISTEMA DE PAPELERA DE RECICLAJE Y BORRADO EN CASCADA ---
window.moveTxToTrash = (txId) => {
    const tx = financeData.transactions.find(t => String(t.id) === String(txId));
    if (!tx) return;

    // Detectar registros hijos vinculados (intereses, libranzas, cobros compartidos, splits)
    const children = financeData.transactions.filter(t =>
        !t.isDeleted && (
            String(t.linkedToTransfer) === String(tx.id) ||
            String(t.parentId) === String(tx.id) ||
            String(t.linkedLibranza) === String(tx.id)
        )
    );

    const allToTrash = [tx, ...children];
    const deleteTimestamp = Date.now();

    allToTrash.forEach(targetTx => {
        if (typeof revertTransferAllocation === 'function' && targetTx.type === 'transfer') {
            try {
                revertTransferAllocation(targetTx);
            } catch (err) {
                console.warn('No se pudo revertir asignación de transferencia:', err);
            }
        }
        if (targetTx.type === 'income' && isTxClosed(targetTx) && getAccountObj(targetTx.account).category === 'pocket') {
            const p = financeData.pockets.find(x => String(x.id) === String(targetTx.account));
            if (p) p.yields = Math.max(0, round2((p.yields || 0) - round2(targetTx.amount)));
        }
        targetTx.isDeleted = true;
        targetTx.deletedAt = deleteTimestamp;
        if (targetTx.id !== tx.id) {
            targetTx.deletedWithParent = tx.id;
        }
    });

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;

    const returnAcc = window.returnToAccountDetail;
    window.returnToAccountDetail = null;

    forceCloseAllModals();
    updateDashboard();
    if (typeof updateTrashBadge === 'function') updateTrashBadge();

    if (returnAcc && returnAcc.accountId && typeof openAccountDetail === 'function') {
        openAccountDetail(returnAcc.accountId, returnAcc.originType || 'home');
    }
};

window.restoreTxFromTrash = (txId) => {
    const tx = financeData.transactions.find(t => String(t.id) === String(txId));
    if (!tx) return;

    // Restaurar también los hijos que fueron borrados junto a este padre
    const toRestore = financeData.transactions.filter(t => 
        String(t.id) === String(txId) || String(t.deletedWithParent) === String(txId)
    );

    toRestore.forEach(targetTx => {
        if (targetTx.type === 'income' && isTxClosed(targetTx) && getAccountObj(targetTx.account).category === 'pocket') {
            const p = financeData.pockets.find(x => String(x.id) === String(targetTx.account));
            if (p) p.yields = round2((p.yields || 0) + round2(targetTx.amount));
        }
        delete targetTx.isDeleted;
        delete targetTx.deletedAt;
        delete targetTx.deletedWithParent;
    });

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    if (typeof renderTrashModal === 'function') renderTrashModal();
    updateDashboard();
    if (typeof updateTrashBadge === 'function') updateTrashBadge();
};

window.permanentlyDeleteTx = (txId) => {
    if (!confirm('¿Eliminar este movimiento definitivamente? Esta acción no se puede deshacer.')) return;
    
    // Eliminar definitivamente el padre y sus hijos en cascada
    financeData.transactions = financeData.transactions.filter(t => 
        String(t.id) !== String(txId) && String(t.deletedWithParent) !== String(txId)
    );

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    if (typeof renderTrashModal === 'function') renderTrashModal();
    if (typeof updateTrashBadge === 'function') updateTrashBadge();
};

window.updateTrashBadge = () => {
    const count = financeData.transactions.filter(t => t.isDeleted).length;
    const badge = document.getElementById('drawer-trash-badge');
    if (badge) {
        badge.innerText = count;
        badge.classList.toggle('hidden', count === 0);
    }
};

window.renderTrashModal = () => {
    const container = document.getElementById('trash-list-container');
    const countLabel = document.getElementById('trash-count-label');
    const emptyBtn = document.getElementById('btn-empty-trash');
    if (!container) return;

    const deletedTxs = financeData.transactions
        .filter(t => t.isDeleted)
        .sort((a, b) => (b.deletedAt || b.id) - (a.deletedAt || a.id));

    if (countLabel) countLabel.innerText = `${deletedTxs.length} elemento${deletedTxs.length !== 1 ? 's' : ''}`;
    if (emptyBtn) emptyBtn.classList.toggle('hidden', deletedTxs.length === 0);

    if (deletedTxs.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:13px;">La papelera está vacía.</div>`;
        return;
    }

    container.innerHTML = deletedTxs.map(t => {
        const sign = t.type === 'income' ? '+' : (t.type === 'expense' ? '-' : '');
        const colorCls = t.type === 'income' ? 'positive' : (t.type === 'expense' ? 'negative' : 'accent');
        const accName = stripLeadingEmoji(getAccountObj(t.account).name);
        return `
            <div class="acc-list-item" style="cursor:default; padding:12px; align-items:center; gap:8px;">
                <div style="flex:1; min-width:0;">
                    <strong style="display:block; font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${stripLeadingEmoji(t.description)}</strong>
                    <small style="display:block; font-size:11px; color:var(--text-muted);">${accName} • ${t.date}</small>
                    <strong class="${colorCls}" style="font-size:13px;">${sign}${formatMoney(t.amount)}</strong>
                </div>
                <div style="display:flex; gap:6px; flex-shrink:0;">
                    <button type="button" onclick="restoreTxFromTrash('${t.id}')" class="mini-action-btn" style="color:var(--positive); border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.1); font-weight:700;">Restaurar</button>
                    <button type="button" onclick="permanentlyDeleteTx('${t.id}')" class="mini-action-btn" style="color:var(--negative); border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.08);">✕</button>
                </div>
            </div>
        `;
    }).join('');
};

document.addEventListener('click', (e) => {
    const delBtn = e.target.closest('#delete-btn');
    if (delBtn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const editId = document.getElementById('edit-id')?.value;
        if (!editId) return;
        if (confirm('¿Mover este movimiento a la papelera de reciclaje?')) {
            moveTxToTrash(editId);
        }
    }
}, true);

document.getElementById('btn-empty-trash')?.addEventListener('click', () => {
    const count = financeData.transactions.filter(t => t.isDeleted).length;
    if (count === 0) return;
    if (confirm(`¿Vaciar la papelera y eliminar definitivamente ${count} movimiento(s)?`)) {
        financeData.transactions = financeData.transactions.filter(t => !t.isDeleted);
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        renderTrashModal();
        updateTrashBadge();
    }
});

// --- SISTEMA DE ETIQUETAS #TAGS Y CLONACIÓN DE MOVIMIENTOS ---
window.filterByTxTag = (tag, event) => {
    if (event) event.stopPropagation();
    const targetQuery = `#${String(tag).toLowerCase()}`;
    const searchInput = document.getElementById('history-search-input');

    if (historySearchQuery.toLowerCase() !== targetQuery) {
        historySearchQuery = targetQuery;
        if (searchInput) searchInput.value = targetQuery;
    } else if (event) {
        historySearchQuery = '';
        if (searchInput) searchInput.value = '';
    }
    
    forceCloseAllModals();
    updateDashboard();
    
    const listContainer = document.getElementById('transaction-list');
    if (listContainer) listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const renderHistoryTagsUI = (monthId, filteredTxs) => {
    const stripEl = document.getElementById('history-tags-strip');
    const summaryEl = document.getElementById('history-tag-summary');

    if (stripEl) {
        const monthTagCounts = {};
        financeData.transactions.forEach(t => {
            if (!t.isDeleted && t.monthId === monthId && Array.isArray(t.tags)) {
                t.tags.forEach(tg => {
                    monthTagCounts[tg] = (monthTagCounts[tg] || 0) + 1;
                });
            }
        });
        const monthTags = Object.keys(monthTagCounts).sort((a, b) => monthTagCounts[b] - monthTagCounts[a]);

        if (monthTags.length === 0) {
            stripEl.classList.add('hidden');
            stripEl.innerHTML = '';
        } else {
            stripEl.classList.remove('hidden');
            const activeClean = historySearchQuery.startsWith('#') ? historySearchQuery.slice(1).toLowerCase() : '';
            stripEl.innerHTML = monthTags.map(tg => {
                const isActive = activeClean === tg.toLowerCase();
                return `<button type="button" class="pill-btn ${isActive ? 'active' : ''}" style="font-size:10.5px; padding:4px 9px;" onclick="filterByTxTag('${tg}', event)">#${tg} (${monthTagCounts[tg]})</button>`;
            }).join('');
        }
    }

    if (summaryEl) {
        if (historySearchQuery.startsWith('#') && historySearchQuery.length > 1) {
            const tagLabel = historySearchQuery;
            let tagInc = 0, tagExp = 0;
            filteredTxs.forEach(t => {
                const amt = round2(t.status === 'pending' ? (t.budgetedAmount || t.amount) : t.amount);
                if (t.type === 'income') tagInc = round2(tagInc + amt);
                else if (t.type === 'expense') tagExp = round2(tagExp + amt);
            });
            const displayTotal = tagInc > 0 && tagExp > 0
                ? `<span class="positive">+${formatCompact(tagInc)}</span> / <span class="negative">-${formatCompact(tagExp)}</span>`
                : (tagInc > 0
                    ? `<strong class="positive">+${formatMoney(tagInc)}</strong>`
                    : `<strong class="negative">-${formatMoney(tagExp)}</strong>`);

            summaryEl.classList.remove('hidden');
            summaryEl.innerHTML = `
                <div style="min-width:0;">
                    <strong style="color:var(--accent); display:block;">Resumen ${tagLabel} (${filteredTxs.length})</strong>
                    <div style="margin-top:2px;">Total acumulado: ${displayTotal}</div>
                </div>
                <button type="button" class="mini-action-btn" onclick="filterByTxTag('${tagLabel.slice(1)}', event)">✕ Limpiar</button>
            `;
        } else {
            summaryEl.classList.add('hidden');
            summaryEl.innerHTML = '';
        }
    }
};

const renderTxModalTagSuggestions = () => {
    const box = document.getElementById('trans-tags-suggestions');
    const input = document.getElementById('trans-tags');
    if (!box || !input) return;

    const topTags = getAllUsedTags().slice(0, 8);
    if (topTags.length === 0) {
        box.classList.add('hidden');
        box.innerHTML = '';
        return;
    }

    const currentSelected = new Set(extractTransactionTags(input.value, ''));
    box.classList.remove('hidden');
    box.innerHTML = topTags.map(({ tag }) => {
        const isSel = currentSelected.has(tag);
        return `<button type="button" class="tag-suggestion-chip ${isSel ? 'selected' : ''}" data-suggest-tag="${tag}">#${tag}</button>`;
    }).join('');
};

document.getElementById('trans-tags')?.addEventListener('input', renderTxModalTagSuggestions);

document.getElementById('trans-tags-suggestions')?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-suggest-tag]');
    const input = document.getElementById('trans-tags');
    if (!chip || !input) return;

    const clickedTag = chip.getAttribute('data-suggest-tag');
    const current = new Set(extractTransactionTags(input.value, ''));
    if (current.has(clickedTag)) current.delete(clickedTag);
    else current.add(clickedTag);

    input.value = Array.from(current).map(tg => `#${tg}`).join(' ');
    renderTxModalTagSuggestions();
});

// --- ORGANIZADOR VISUAL Y LÓGICA DE BOTONES (GUARDAR / DUPLICAR / ELIMINAR) ---
window.syncTxModalActionButtons = (isEditMode = false) => {
    const txForm = document.getElementById('transaction-form');
    if (!txForm) return;

    const submitBtn = txForm.querySelector('button[type="submit"]');
    const delBtn = document.getElementById('delete-btn');
    let dupBtn = document.getElementById('duplicate-tx-btn');

    if (!submitBtn) return;

    if (!dupBtn) {
        dupBtn = document.createElement('button');
        dupBtn.type = 'button';
        dupBtn.id = 'duplicate-tx-btn';
    }

    let actionsStack = document.getElementById('tx-modal-actions-stack');
    if (!actionsStack) {
        actionsStack = document.createElement('div');
        actionsStack.id = 'tx-modal-actions-stack';
        actionsStack.style.cssText = 'display:flex; flex-direction:column; gap:10px; margin-top:16px; width:100%;';

        const secondaryRow = document.createElement('div');
        secondaryRow.id = 'tx-edit-secondary-actions';
        secondaryRow.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%;';

        const oldWrapper = submitBtn.parentElement;
        txForm.appendChild(actionsStack);
        actionsStack.appendChild(submitBtn);
        actionsStack.appendChild(secondaryRow);
        secondaryRow.appendChild(dupBtn);
        if (delBtn) secondaryRow.appendChild(delBtn);

        if (oldWrapper && oldWrapper !== txForm && oldWrapper.children.length === 0) {
            oldWrapper.style.display = 'none';
        }
    }

    submitBtn.style.width = '100%';
    submitBtn.style.margin = '0';
    submitBtn.style.minHeight = '46px';
    submitBtn.style.borderRadius = '14px';
    submitBtn.style.fontSize = '14.5px';
    submitBtn.style.fontWeight = '700';

    dupBtn.className = 'btn btn-secondary';
    dupBtn.style.cssText = 'display:inline-flex; align-items:center; justify-content:center; gap:6px; width:100%; min-height:42px; margin:0; padding:0 12px; border-radius:13px; font-size:13px; font-weight:700; background:var(--hover-bg); color:var(--text-main); border:1px solid var(--border-color);';
    dupBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Duplicar</span>`;

    if (delBtn) {
        delBtn.className = 'btn';
        delBtn.style.cssText = 'display:inline-flex; align-items:center; justify-content:center; gap:6px; width:100%; min-height:42px; margin:0; padding:0 12px; border-radius:13px; font-size:13px; font-weight:700; background:rgba(239, 68, 68, 0.12); color:var(--negative); border:1px solid rgba(239, 68, 68, 0.28);';
        delBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg><span>Eliminar</span>`;
    }

    const secondaryRow = document.getElementById('tx-edit-secondary-actions');
    if (secondaryRow) {
        secondaryRow.classList.toggle('hidden', !isEditMode);
        secondaryRow.style.display = isEditMode ? 'grid' : 'none';
    }
    dupBtn.classList.toggle('hidden', !isEditMode);
    if (delBtn) delBtn.classList.toggle('hidden', !isEditMode);

    if (!dupBtn.dataset.boundDup) {
        dupBtn.dataset.boundDup = '1';
        dupBtn.addEventListener('click', () => {
            const editInput = document.getElementById('edit-id');
            if (!editInput || !editInput.value) return;

            editInput.value = '';
            syncTxModalActionButtons(false);

            const titleEl = document.getElementById('modal-title');
            if (titleEl) titleEl.innerText = 'Duplicar Movimiento';

            const now = new Date();
            const dateInput = document.getElementById('trans-date');
            const timeInput = document.getElementById('trans-time');
            if (dateInput) dateInput.value = now.toLocaleDateString('en-CA');
            if (timeInput) timeInput.value = now.toTimeString().slice(0, 5);

            const statusInput = document.getElementById('trans-status');
            if (statusInput) statusInput.value = 'closed';

            hasUnsavedChanges = true;
            document.getElementById('amount')?.focus();
        });
    }
};

const txModalEl = document.getElementById('transaction-modal');
if (txModalEl) {
    const txModalObserver = new MutationObserver(() => {
        if (!txModalEl.classList.contains('hidden')) {
            const editId = document.getElementById('edit-id')?.value;
            syncTxModalActionButtons(!!editId);

            const tagsInput = document.getElementById('trans-tags');
            if (tagsInput) {
                if (editId) {
                    const tx = financeData.transactions.find(t => String(t.id) === String(editId));
                    tagsInput.value = (tx && Array.isArray(tx.tags) && tx.tags.length > 0)
                        ? tx.tags.map(tg => `#${tg}`).join(' ')
                        : '';
                } else {
                    tagsInput.value = '';
                }
                renderTxModalTagSuggestions();
            }
        }
    });
    txModalObserver.observe(txModalEl, { attributes: true, attributeFilter: ['class'] });
}

let pendingTxTagsPayload = null;
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'transaction-form') {
        const editId = document.getElementById('edit-id')?.value || '';
        const rawTags = document.getElementById('trans-tags')?.value || '';
        const desc = document.getElementById('description')?.value || '';
        pendingTxTagsPayload = {
            editId,
            tags: extractTransactionTags(rawTags, desc),
            beforeCount: financeData.transactions.length
        };
        if (financeData.preferences?.rememberAccount) {
            financeData.preferences.lastAccount = document.getElementById('account')?.value;
        }
        if (financeData.preferences?.rememberCategory && document.getElementById('type')?.value === 'expense') {
            financeData.preferences.lastCategory = document.getElementById('trans-category')?.value;
        }
    }
}, true);

document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'transaction-form' && pendingTxTagsPayload) {
        const payload = pendingTxTagsPayload;
        pendingTxTagsPayload = null;
        if (!document.getElementById('transaction-modal')?.classList.contains('hidden')) return;

        if (payload.editId) {
            const tx = financeData.transactions.find(t => String(t.id) === String(payload.editId));
            if (tx) {
                if (payload.tags.length > 0) tx.tags = payload.tags;
                else delete tx.tags;
            }
        } else if (financeData.transactions.length > payload.beforeCount) {
            for (let i = payload.beforeCount; i < financeData.transactions.length; i++) {
                const newTx = financeData.transactions[i];
                if (newTx && !newTx.isAdjustment && payload.tags.length > 0) {
                    newTx.tags = [...payload.tags];
                }
            }
        }
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        updateDashboard();
    }
}, false);

// --- SOPORTE MULTIMONEDA OFFLINE EN MODAL ---
let activeTxCurrency = 'COP';

const updateTxCurrencyPreview = () => {
    const previewEl = document.getElementById('tx-currency-preview');
    const inputEl = document.getElementById('amount');
    if (!previewEl || !inputEl) return;

    if (activeTxCurrency === 'COP') {
        previewEl.classList.add('hidden');
        return;
    }

    const rawForeign = parseMoneyInput(inputEl.value);
    if (rawForeign <= 0) {
        previewEl.classList.add('hidden');
        return;
    }

    const rate = (financeData.exchangeRates && financeData.exchangeRates[activeTxCurrency]) || (activeTxCurrency === 'USD' ? 4150 : 4420);
    const convertedCop = round2(rawForeign * rate);
    
    previewEl.classList.remove('hidden');
    previewEl.innerHTML = `Conversión: <b style="color:var(--text-main);">${formatMoney(convertedCop)} COP</b> (Tasa: ${formatMoney(rate)})`;
};

document.getElementById('amount')?.addEventListener('input', updateTxCurrencyPreview);

document.querySelectorAll('#tx-currency-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('#tx-currency-pills .pill-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        activeTxCurrency = e.target.getAttribute('data-curr');
        
        const amtInput = document.getElementById('amount');
        if (amtInput) {
            amtInput.value = '';
            updateTxCurrencyPreview();
            amtInput.focus();
        }
    });
});

if (txModalEl) {
    const currObserver = new MutationObserver(() => {
        if (!txModalEl.classList.contains('hidden')) {
            document.querySelectorAll('#tx-currency-pills .pill-btn').forEach(b => {
                const isCop = b.getAttribute('data-curr') === 'COP';
                b.classList.toggle('active', isCop);
                if (isCop) activeTxCurrency = 'COP';
            });
            const previewEl = document.getElementById('tx-currency-preview');
            if (previewEl) previewEl.classList.add('hidden');
        }
    });
    currObserver.observe(txModalEl, { attributes: true, attributeFilter: ['class'] });
}

document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'transaction-form' && activeTxCurrency !== 'COP') {
        const inputEl = document.getElementById('amount');
        const descEl = document.getElementById('description');
        const tagsInput = document.getElementById('trans-tags');
        
        if (inputEl && descEl && tagsInput) {
            const rawForeign = parseMoneyInput(inputEl.value);
            const rate = (financeData.exchangeRates && financeData.exchangeRates[activeTxCurrency]) || (activeTxCurrency === 'USD' ? 4150 : 4420);
            const convertedCop = round2(rawForeign * rate);
            
            inputEl.value = formatNumberInput(convertedCop);
            descEl.value = `${descEl.value.trim()} [${formatNumberInput(rawForeign, 2)} ${activeTxCurrency}]`;
            
            const currencyTag = `#${activeTxCurrency.toLowerCase()}`;
            if (!tagsInput.value.includes(currencyTag)) {
                tagsInput.value = `${tagsInput.value} ${currencyTag}`.trim();
            }
        }
    }
}, true);

// --- MEMORIA PREDICTIVA DE ÚLTIMA CUENTA / CATEGORÍA ---
document.addEventListener('click', (e) => {
    const clickedFabOpt = e.target.closest('.fab-option');
    if (clickedFabOpt) {
        setTimeout(() => {
            const prefs = financeData.preferences || {};
            if (prefs.rememberAccount && prefs.lastAccount) {
                const accSelect = document.getElementById('account');
                if (accSelect && Array.from(accSelect.options).some(o => o.value === prefs.lastAccount)) {
                    accSelect.value = prefs.lastAccount;
                }
            }
            if (prefs.rememberCategory && prefs.lastCategory && clickedFabOpt.getAttribute('data-type') === 'expense') {
                const catSelect = document.getElementById('trans-category');
                if (catSelect && Array.from(catSelect.options).some(o => o.value === prefs.lastCategory)) {
                    catSelect.value = prefs.lastCategory;
                    catSelect.dispatchEvent(new Event('change'));
                }
            }
        }, 60);
    }
}, true);

// ==========================================
// 15D. OMNI-MODAL: CENTRALIZACIÓN DE REGISTROS
// ==========================================
let pendingOmniPayrollLibranza = null;
let pendingOmniSubscriptionId = null;
let userEditedBudgetField = false;

window.openOmniModal = (config = {}) => {
    const {
        mode = 'create', txId = null, type = 'expense', title = null,
        lockType = false, amount = '', account = '', toAccount = '',
        category = '', description = '', status = 'closed',
        dateMs = null, hideRecurrence = false, installments = 1
    } = config;

    if (typeof forceCloseAllModals === 'function') forceCloseAllModals();
    const tModal = document.getElementById('transaction-modal');
    if (!tModal) return;

    form?.reset();
    document.getElementById('edit-id').value = mode === 'edit' ? txId : '';
    const defaultTitles = mode === 'edit'
        ? { expense: 'Editar Gasto', income: 'Editar Ingreso', transfer: 'Editar Transferencia' }
        : { expense: 'Nuevo Gasto', income: 'Nuevo Ingreso', transfer: 'Nueva Transferencia' };
    document.getElementById('modal-title').innerText = title || defaultTitles[type];
    
    if (typeSelect) {
        typeSelect.value = type; 
        typeSelect.disabled = lockType;
        typeSelect.dispatchEvent(new Event('change'));
    }
    
    if (lockType) {
        document.getElementById('quick-payroll-shortcut')?.classList.add('hidden');
    }

    const statusEl = document.getElementById('trans-status');
    if (statusEl) statusEl.value = status;
    
    if (amount !== '') {
        document.getElementById('amount').value = formatNumberInput(amount);
        document.getElementById('amount').dispatchEvent(new Event('input'));
    }
    if (account) {
        document.getElementById('account').value = account;
        if (type === 'expense') {
            if (installments > 1 && document.getElementById('trans-installments')) {
                document.getElementById('trans-installments').value = installments;
            }
            if (typeof updateCCInstallmentsPreview === 'function') updateCCInstallmentsPreview(true);
        }
    }
    if (toAccount && type === 'transfer') document.getElementById('to-account').value = toAccount;
    if (category && type !== 'transfer') {
        document.getElementById('trans-category').value = category;
        userEditedBudgetField = false; 
        if (typeof autoFillBudgetedAmountForTransaction === 'function') autoFillBudgetedAmountForTransaction(true);
    }
    if (description) document.getElementById('description').value = description;

    const targetDate = dateMs ? new Date(dateMs) : new Date();
    document.getElementById('trans-date').value = (mode === 'create' && typeof selectedCalendarDay !== 'undefined' && selectedCalendarDay) ? selectedCalendarDay : targetDate.toLocaleDateString('en-CA');
    document.getElementById('trans-time').value = targetDate.toTimeString().slice(0, 5);

    const recGroup = document.getElementById('group-recurrence');
    if (recGroup) {
        if (hideRecurrence || mode === 'edit') recGroup.classList.add('hidden');
        else recGroup.classList.remove('hidden');
    }
    document.getElementById('group-recurrence-count')?.classList.add('hidden');
    
    if (typeof syncTxModalActionButtons === 'function') {
        syncTxModalActionButtons(mode === 'edit');
    }

    document.getElementById('shared-expense-fields')?.classList.add('hidden');
    document.getElementById('coin-round-fields')?.classList.add('hidden');
    document.getElementById('omni-sub-suggest-box')?.classList.add('hidden');
    if (typeof resetTransferAllocationBox === 'function') resetTransferAllocationBox();
    if (typeof updateTransferAllocationUI === 'function') updateTransferAllocationUI();
    pendingOmniPayrollLibranza = null;
    pendingOmniSubscriptionId = null;
    if (typeof hasUnsavedChanges !== 'undefined') hasUnsavedChanges = false;
    tModal.classList.remove('hidden');
};

window.openEditModal = (id) => {
    const tx = financeData.transactions.find(t => String(t.id) === String(id));
    if (!tx) return;
    
    let catFull = '';
    if (tx.type !== 'transfer' && tx.category) catFull = `${tx.category}::${tx.subcategory || 'General'}`;
    
    openOmniModal({
        mode: 'edit', txId: tx.id, type: tx.type, 
        amount: tx.amount, account: tx.account, toAccount: tx.toAccount,
        category: catFull, description: tx.description,
        status: tx.status === 'pending' ? 'pending' : 'closed', dateMs: tx.id
    });
    
    const budgetInput = document.getElementById('trans-budgeted-amount');
    if(budgetInput) budgetInput.value = tx.budgetedAmount ? formatNumberInput(tx.budgetedAmount) : '';
    userEditedBudgetField = !!tx.budgetedAmount;
    if (typeof autoFillBudgetedAmountForTransaction === 'function') autoFillBudgetedAmountForTransaction(false);
    
if (tx.type === 'expense') {
        if (tx.basePurchaseAmount > 0 && tx.fianzaAmount > 0) {
            document.getElementById('amount').value = formatNumberInput(tx.basePurchaseAmount);
            document.getElementById('description').value = tx.description.replace(/\s*\(\+Fianza [^)]+\)$/, '');
        }
        const instInput = document.getElementById('trans-installments');
        if (instInput) instInput.value = tx.installments || 1;
        const rateInput = document.getElementById('trans-rate');
        if (rateInput) rateInput.value = tx.rate ? formatNumberInput(tx.rate) : '0';
        const rateTypeInput = document.getElementById('trans-rate-type');
        if (rateTypeInput) rateTypeInput.value = tx.rateType || 'monthly';
        const zeroCheck = document.getElementById('trans-zero-interest');
        if (zeroCheck) zeroCheck.checked = !!tx.zeroInterest;
        const fianzaInput = document.getElementById('trans-fianza');
        if (fianzaInput) fianzaInput.value = tx.fianzaRate ? formatNumberInput(tx.fianzaRate) : '';
        const fianzaTypeSel = document.getElementById('trans-fianza-type');
        if (fianzaTypeSel) fianzaTypeSel.value = tx.fianzaType || 'pct';
        const fianzaIvaCheck = document.getElementById('trans-fianza-iva');
        if (fianzaIvaCheck) fianzaIvaCheck.checked = !!tx.fianzaHasIva;
        if (typeof updateCCInstallmentsPreview === 'function') updateCCInstallmentsPreview(false);
    } else if (tx.type === 'transfer') {
        const extraChargesInput = document.getElementById('transfer-extra-charges');
        if (extraChargesInput) extraChargesInput.value = tx.extraCharges > 0 ? formatNumberInput(tx.extraCharges) : '';
        if (tx.extraCharges > 0) {
            document.getElementById('amount').value = formatNumberInput(round2(tx.amount + tx.extraCharges));
        }
    }
};

document.querySelectorAll('.fab-option').forEach(opt => {
    opt.addEventListener('click', () => {
        const selectedType = opt.getAttribute('data-type');
        if (!selectedType) return;
        fabMenu?.classList.add('hidden'); fabBtn?.classList.remove('active');
        openOmniModal({ type: selectedType });
    });
});

document.getElementById('delete-btn')?.addEventListener('click', () => {
    const editId = document.getElementById('edit-id').value;
    if (editId && confirm('¿Eliminar este movimiento?')) {
        const oldT = financeData.transactions.find(t => String(t.id) === String(editId));
        if (oldT && oldT.type === 'transfer' && typeof revertTransferAllocation === 'function') revertTransferAllocation(oldT);
        if (oldT && oldT.type === 'income' && typeof isTxClosed === 'function' && isTxClosed(oldT) && typeof getAccountObj === 'function' && getAccountObj(oldT.account).category === 'pocket') {
            const oldPocket = financeData.pockets.find(x => String(x.id) === String(oldT.account));
            if (oldPocket) oldPocket.yields = Math.max(0, round2((oldPocket.yields || 0) - round2(oldT.amount)));
        }
        if (oldT && Array.isArray(oldT.linkedLibranzas)) {
            const linkedIds = oldT.linkedLibranzas.flatMap(l => [l.txId, l.intTxId].filter(Boolean).map(String));
            financeData.transactions = financeData.transactions.filter(t => !linkedIds.includes(String(t.id)));
            oldT.linkedLibranzas.forEach(l => {
                if (l.pocketId && l.pocketAmt > 0) {
                    if (typeof adjustPocketBalance === 'function') adjustPocketBalance(l.pocketId, -l.pocketAmt);
                } else if (l.targetTxId && l.quoteStep > 0) {
                    const targetTx = financeData.transactions.find(t => String(t.id) === String(l.targetTxId));
                    if (targetTx) targetTx.paidInstallments = Math.max(0, (targetTx.paidInstallments || 0) - l.quoteStep);
                } else {
                    const debtAcc = financeData.customAccounts.find(a => a.id === l.debtId);
                    if (debtAcc && l.quoteStep > 0) debtAcc.debtPaidQuotes = Math.max(0, (debtAcc.debtPaidQuotes || 0) - l.quoteStep);
                }
            });
        }
        const prevPocketId = window.returnToPocketHistoryId;
        financeData.transactions = financeData.transactions.filter(t => String(t.id) !== String(editId));
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        if (typeof forceCloseAllModals === 'function') forceCloseAllModals(); 
        if (typeof updateDashboard === 'function') updateDashboard();
        if (prevPocketId) {
            document.getElementById('pockets-modal')?.classList.remove('hidden');
            if (typeof openPocketHistoryModal === 'function') openPocketHistoryModal(prevPocketId);
        }
    }
});

form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-id').value;
    const type = typeSelect ? typeSelect.value : 'expense';
    const status = document.getElementById('trans-status').value;
    const recurrence = !editId ? (document.getElementById('trans-recurrence')?.value || 'none') : 'none';
    const recCount = recurrence !== 'none' ? Math.max(2, Math.min(60, parseInt(document.getElementById('trans-recurrence-count')?.value, 10) || 12)) : 1;
    const account = document.getElementById('account').value;
    const toAccount = document.getElementById('to-account').value;
    let description = document.getElementById('description').value.trim();
    const amount = parseMoneyInput(document.getElementById('amount').value);
    const budgetedVal = parseMoneyInput(document.getElementById('trans-budgeted-amount')?.value);
    const baseDateObj = new Date(`${document.getElementById('trans-date').value}T${document.getElementById('trans-time').value}`);

    if (amount <= 0) {
        alert("El monto debe ser mayor a $0.");
        return;
    }

    // --- LÓGICA DE GASTO COMPARTIDO ---
    let finalAmount = amount;
    const isShared = document.getElementById('is-shared-expense')?.checked;
    const owedAmount = parseMoneyInput(document.getElementById('shared-owed-amount')?.value);
    const debtorName = document.getElementById('shared-debtor-name')?.value.trim() || 'Alguien';

    if (type === 'expense' && isShared && owedAmount > 0) {
        if (owedAmount >= amount) { alert('El monto que te deben debe ser menor al total pagado.'); return; }
        finalAmount = round2(amount - owedAmount); 
        const originalAmountFormatted = formatMoney(amount);
        description = `${description} (Mi parte de ${originalAmountFormatted})`;

        const accId = 'CxC_' + debtorName.replace(/\s+/g, '_');
        if (!financeData.customAccounts.some(a => a.id === accId)) {
            financeData.customAccounts.push({ id: accId, name: `Me debe: ${debtorName}`, category: 'asset', isDefault: false, showWhenZero: true });
        }

        financeData.transactions.push({
            id: baseDateObj.getTime() + 999, monthId: (typeof getMonthId === 'function') ? getMonthId(baseDateObj) : '0000-00', type: 'transfer', status: status,
            account: account, toAccount: accId, description: `Préstamo a ${debtorName} (Compra total: ${originalAmountFormatted})`,
            amount: owedAmount, date: `${baseDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${baseDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
            isAdjustment: false
        });
    }

    // --- LÓGICA DE AHORRO DE MONEDAS ---
    const isCoinRound = document.getElementById('is-coin-round')?.checked;
    const coinSavedAmt = parseMoneyInput(document.getElementById('coin-round-amount')?.value);
    if (type === 'expense' && account === 'Efectivo' && isCoinRound && coinSavedAmt > 0) {
        const coinPocketId = 'Pocket_Monedas';
        let coinPocket = financeData.pockets.find(p => p.id === coinPocketId);
        if (!coinPocket) {
            coinPocket = {
                id: coinPocketId, name: 'Alcancía Monedas', entity: 'Efectivo físico', goal: 0, startDate: baseDateObj.toLocaleDateString('en-CA'), targetDate: '', customQuota: 0, principal: 0, yields: 0, excludeFromBalance: true
            };
            financeData.pockets.push(coinPocket);
        }
        if (status === 'closed') coinPocket.principal = round2((coinPocket.principal || 0) + coinSavedAmt);

        financeData.transactions.push({
            id: baseDateObj.getTime() + 998, monthId: (typeof getMonthId === 'function') ? getMonthId(baseDateObj) : '0000-00', type: 'transfer', status: status,
            account: account, toAccount: coinPocketId, description: `Ahorro de monedas (de: ${description})`,
            amount: coinSavedAmt, date: `${baseDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${baseDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
            isAdjustment: false
        });
    }

    if (editId) {
        const oldT = financeData.transactions.find(t => String(t.id) === String(editId));
        if (oldT && oldT.type === 'transfer' && typeof revertTransferAllocation === 'function') revertTransferAllocation(oldT);
        if (oldT && oldT.type === 'income' && typeof isTxClosed === 'function' && isTxClosed(oldT) && typeof getAccountObj === 'function' && getAccountObj(oldT.account).category === 'pocket') {
            const oldPocket = financeData.pockets.find(x => String(x.id) === String(oldT.account));
            if (oldPocket) oldPocket.yields = Math.max(0, round2((oldPocket.yields || 0) - round2(oldT.amount)));
        }
        financeData.transactions = financeData.transactions.filter(t => String(t.id) !== String(editId));
    }

    let savedCategory = null, savedSubcategory = null;
    if (type !== 'transfer') {
        const parts = (document.getElementById('trans-category')?.value || '').split('::');
        savedCategory = parts[0]; savedSubcategory = parts[1] || 'General';
    }

    for (let step = 0; step < recCount; step++) {
        const txDate = (typeof advanceDateByRecurrence === 'function') ? advanceDateByRecurrence(baseDateObj, recurrence, step) : baseDateObj;
        const instStatus = step === 0 ? status : 'pending';
        const txData = {
            id: txDate.getTime() + step + Math.floor(Math.random() * 500), monthId: (typeof getMonthId === 'function') ? getMonthId(txDate) : '0000-00', type, status: instStatus,
            account, category: savedCategory, subcategory: savedSubcategory,
            description: recCount > 1 ? `${description} (${step + 1}/${recCount})` : description,
            amount: finalAmount, budgetedAmount: budgetedVal > 0 ? budgetedVal : (instStatus === 'pending' ? finalAmount : 0),
            date: `${txDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${txDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: false
        };
        
        const accObj = (typeof getAccountObj === 'function') ? getAccountObj(account) : { category: 'asset' };
        
        if (type === 'expense' && (accObj.category === 'credit_card' || accObj.debtType === 'revolving')) {
            const inst = Math.max(1, parseInt(document.getElementById('trans-installments')?.value, 10) || 1);
            const rate = inst === 1 ? 0 : parseMoneyInput(document.getElementById('trans-rate')?.value);
            const rateType = document.getElementById('trans-rate-type')?.value || 'monthly';
            const fianzaVal = parseMoneyInput(document.getElementById('trans-fianza')?.value);
            const fianzaType = document.getElementById('trans-fianza-type')?.value || 'pct';
            const fianzaIva = !!document.getElementById('trans-fianza-iva')?.checked;
            const fianzaAmt = typeof calculateFianzaAmount === 'function'
                ? calculateFianzaAmount(finalAmount, fianzaVal, fianzaType, fianzaIva)
                : 0;
            const financedPrincipal = round2(finalAmount + fianzaAmt);

            if (fianzaAmt > 0) {
                txData.basePurchaseAmount = finalAmount;
                txData.fianzaAmount = fianzaAmt;
                txData.fianzaRate = fianzaVal;
                txData.fianzaType = fianzaType;
                txData.fianzaHasIva = fianzaIva;
                txData.amount = financedPrincipal;
                if (!txData.description.includes('(+Fianza')) {
                    txData.description = `${txData.description} (+Fianza ${formatCompact(fianzaAmt)})`;
                }
            }

            if (typeof calculateAmortization === 'function') {
                const amort = calculateAmortization(financedPrincipal, inst, rate, rateType);
                txData.installments = inst; txData.rate = rate; txData.rateType = rateType;
                txData.zeroInterest = document.getElementById('trans-zero-interest')?.checked || rate === 0;
                txData.paidInstallments = 0; txData.monthlyQuota = amort.payment; txData.totalWithInterest = amort.totalWithInterest;
            }
        }
        
        let extraChargesAmt = 0;
        if (type === 'transfer') {
            txData.toAccount = toAccount;
            const payMode = document.getElementById('transfer-payment-mode')?.value || 'installments';
            txData.paymentMode = payMode;
            extraChargesAmt = round2(parseMoneyInput(document.getElementById('transfer-extra-charges')?.value));

            if (extraChargesAmt > 0) {
                if (extraChargesAmt >= finalAmount) {
                    alert('Los intereses o cargos extra deben ser menores al monto total transferido.');
                    return;
                }
                txData.extraCharges = extraChargesAmt;
                txData.amount = round2(finalAmount - extraChargesAmt);
            }
            
            const netDebtPayment = txData.amount;
            const toAccObj = (typeof getAccountObj === 'function') ? getAccountObj(toAccount) : null;
            if (toAccObj && (toAccObj.category === 'credit_card' || toAccObj.debtType === 'revolving')) {
                const selectedChecks = Array.from(document.querySelectorAll('.transfer-alloc-check:checked'));
                if (selectedChecks.length > 0) {
                    if (payMode === 'extraordinary') {
                        const amountPerItem = round2(netDebtPayment / selectedChecks.length);
                        txData.allocatedItems = selectedChecks.map(cb => ({
                            kind: 'cc_tx', txId: cb.value, mode: payMode, amountApplied: amountPerItem
                        }));
                    } else {
                        txData.allocatedItems = selectedChecks.map(cb => ({
                            kind: 'cc_tx', txId: cb.value, mode: payMode, amountApplied: parseFloat(cb.getAttribute('data-quota'))
                        }));
                    }
                }
            } else if (toAccObj && toAccObj.category === 'debt') {
                txData.allocatedItems = [{ kind: 'debt_quota', debtId: toAccObj.id, mode: payMode, amountApplied: netDebtPayment }];
            }
        }
        
        if (instStatus === 'closed') {
            if (type === 'transfer') {
                const netTransferAmt = txData.amount;
                if (accObj.category === 'pocket' && typeof adjustPocketBalance === 'function') adjustPocketBalance(accObj.id, -netTransferAmt);
                const toObj = (typeof getAccountObj === 'function') ? getAccountObj(toAccount) : null;
                if (toObj && toObj.category === 'pocket' && typeof adjustPocketBalance === 'function') adjustPocketBalance(toObj.id, netTransferAmt);

                const applyAdvanceFee = !!document.getElementById('tx-apply-tc-advance-fee')?.checked;
                const tcAdvanceFeeAmt = (accObj.category === 'credit_card' && accObj.hasAdvanceFee && toAccount && toAccount !== account && applyAdvanceFee)
                    ? round2(accObj.advanceFee || 0)
                    : 0;

                if (tcAdvanceFeeAmt > 0) {
                    const feeCat = (financeData.categories?.expense || []).find(c => /cuotas|intereses|bancari|financiero/i.test(c.name));
                    const catName = feeCat ? feeCat.name : 'Cuotas / Intereses';
                    const destLabel = toObj ? stripLeadingEmoji(toObj.name) : 'otra cuenta';
                    financeData.transactions.push({
                        id: txData.id + 333,
                        monthId: txData.monthId,
                        type: 'expense',
                        status: 'closed',
                        account: account,
                        category: catName,
                        subcategory: 'General',
                        description: `Comisión avance TC → ${destLabel}`,
                        amount: tcAdvanceFeeAmt,
                        date: txData.date,
                        isAdjustment: false,
                        linkedToTransfer: txData.id
                    });
                }

                if (extraChargesAmt > 0) {
                    const intCat = financeData.categories.expense.find(c => stripLeadingEmoji(c.name) === 'Cuotas / Intereses');
                    const targetLabel = toObj ? stripLeadingEmoji(toObj.name) : 'Crédito';
                    financeData.transactions.push({
                        id: baseDateObj.getTime() + 750 + Math.floor(Math.random() * 500),
                        monthId: txData.monthId,
                        type: 'expense',
                        status: 'closed',
                        account: account,
                        category: intCat ? intCat.name : 'Cuotas / Intereses',
                        subcategory: 'General',
                        description: `Cargos / Fianza / Intereses (${targetLabel})`,
                        amount: extraChargesAmt,
                        date: txData.date,
                        isAdjustment: false,
                        linkedToTransfer: txData.id
                    });
                }
                
                if (Array.isArray(txData.allocatedItems)) {
                    txData.allocatedItems.forEach(item => {
                        if (item.kind === 'cc_tx') {
                            const targetTx = financeData.transactions.find(t => String(t.id) === String(item.txId));
                            if (targetTx) {
                                if (item.mode === 'extraordinary') {
                                    targetTx.extraPrincipalPaid = round2((targetTx.extraPrincipalPaid || 0) + item.amountApplied);
                                } else {
                                    const inst = Math.max(1, parseInt(targetTx.installments, 10) || 1);
                                    const paid = Math.max(0, parseInt(targetTx.paidInstallments, 10) || 0);
                                    const rate = inst === 1 ? 0 : (parseFloat(targetTx.rate) || 0);
                                    const rateType = targetTx.rateType || 'monthly';
                                    
                                    if (typeof calculateAmortization === 'function') {
                                        const amort = calculateAmortization(round2(targetTx.amount), inst, rate, rateType);
                                        const remSchedule = amort.schedule.slice(paid);
                                        
                                        if (remSchedule.length > 0 && remSchedule[0].interest > 0) {
                                            const interestAmt = remSchedule[0].interest;
                                            const intCat = financeData.categories.expense.find(c => stripLeadingEmoji(c.name) === 'Cuotas / Intereses');
                                            
                                            financeData.transactions.push({
                                                id: baseDateObj.getTime() + 800 + Math.floor(Math.random() * 5000), monthId: txData.monthId,
                                                type: 'expense', status: 'closed', account: txData.toAccount, 
                                                category: intCat ? intCat.name : 'Cuotas / Intereses', subcategory: 'General',
                                                description: `Intereses (${targetTx.description})`, amount: interestAmt,
                                                date: txData.date, isAdjustment: false, linkedToTransfer: txData.id
                                            });
                                        }
                                    }
                                    targetTx.paidInstallments = paid + 1;
                                }
                            }
                        } else if (item.kind === 'debt_quota') {
                            const debtAcc = financeData.customAccounts.find(a => a.id === item.debtId);
                            if (debtAcc && item.mode !== 'extraordinary') debtAcc.debtPaidQuotes = (debtAcc.debtPaidQuotes || 0) + 1;
                        }
                    });
                }
            } else if (type === 'income' && accObj.category === 'pocket' && typeof adjustPocketBalance === 'function') {
                const p = financeData.pockets.find(x => x.id === accObj.id);
                if (p) p.yields = round2((p.yields || 0) + finalAmount);
            } else if (type === 'expense' && accObj.category === 'pocket' && typeof adjustPocketBalance === 'function') {
                adjustPocketBalance(accObj.id, -finalAmount);
            } else if (step === 0 && type === 'income' && pendingOmniPayrollLibranza && typeof applyPayrollLibranzas === 'function') {
                const appliedLib = applyPayrollLibranzas(txData.monthId, pendingOmniPayrollLibranza.periodVal, txDate, pendingOmniPayrollLibranza.isBiweekly);
                if (appliedLib.length > 0) {
                    txData.linkedLibranzas = appliedLib.map(l => ({ txId: l.txId, intTxId: l.intTxId, debtId: l.debtId, targetTxId: l.targetTxId, pocketId: l.pocketId, pocketAmt: l.pocketAmt, quoteStep: l.quoteStep }));
                }
                pendingOmniPayrollLibranza = null;
            }
        }
        financeData.transactions.push(txData);
    }

    // --- AUTO-VINCULACIÓN CON SUSCRIPCIONES ---
    if (!editId && type === 'expense' && status === 'closed' && recCount === 1 && typeof findMatchingSubscriptionForExpense === 'function') {
        const matchedSub = findMatchingSubscriptionForExpense(description, pendingOmniSubscriptionId);
        if (matchedSub) {
            const paidDateStr = document.getElementById('trans-date')?.value || baseDateObj.toLocaleDateString('en-CA');
            if (typeof advanceSubscriptionNextDate === 'function') {
                advanceSubscriptionNextDate(matchedSub, paidDateStr);
            }
            const oldSubAmt = round2(matchedSub.amount || 0);
            if (oldSubAmt > 0 && Math.abs(finalAmount - oldSubAmt) >= 1) {
                const subCleanName = stripLeadingEmoji(matchedSub.name);
                if (confirm(`Detectamos que pagaste ${formatMoney(finalAmount)} por "${subCleanName}", pero la tarifa guardada es ${formatMoney(oldSubAmt)}.\n\n¿Deseas actualizar la tarifa de ${subCleanName} a ${formatMoney(finalAmount)}?`)) {
                    matchedSub.amount = finalAmount;
                }
            }
        }
    }
    pendingOmniSubscriptionId = null;

    const prevPocketId = window.returnToPocketHistoryId;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    if (typeof viewDate !== 'undefined') viewDate = new Date(baseDateObj.getFullYear(), baseDateObj.getMonth(), 1);
    
    if (typeof forceCloseAllModals === 'function') forceCloseAllModals(); 
    if (typeof updateDashboard === 'function') updateDashboard();
    if (prevPocketId) {
        document.getElementById('pockets-modal')?.classList.remove('hidden');
        if (typeof openPocketHistoryModal === 'function') openPocketHistoryModal(prevPocketId);
    }
});
// ==========================================
// 15E. LÓGICA DE INTERFAZ DEL OMNI-MODAL Y CALCULADORA
// ==========================================
let calcExpression = '';
let activeCalcInput = null;

const updateCalculatorDisplay = () => {
    if (document.getElementById('calc-expression')) document.getElementById('calc-expression').innerText = calcExpression || '0';
    const evalRes = evaluateCalculatorExpression(calcExpression);
    if (document.getElementById('calc-result')) document.getElementById('calc-result').innerText = evalRes.valid ? (formatNumberInput(evalRes.value) || '0,00') : 'Error';
};

const openCalculatorFor = (inputId, btnEl) => {
    const panel = document.getElementById('tx-calculator-panel');
    if (!panel) return;
    
    if (activeCalcInput && activeCalcInput.id === inputId && !panel.classList.contains('hidden')) {
        panel.classList.add('hidden');
        btnEl.classList.remove('active');
        activeCalcInput = null;
        return;
    }

    document.querySelectorAll('.btn-calc-toggle').forEach(b => b.classList.remove('active'));

    activeCalcInput = document.getElementById(inputId);
    const curAmt = parseMoneyInput(activeCalcInput?.value);
    calcExpression = curAmt > 0 ? formatNumberInput(curAmt).replace(/\./g, '') : '';
    updateCalculatorDisplay(); 
    panel.classList.remove('hidden'); 
    btnEl.classList.add('active');
};

document.getElementById('toggle-tx-calc-btn')?.addEventListener('click', (e) => openCalculatorFor('amount', e.currentTarget));
document.getElementById('toggle-shared-calc-btn')?.addEventListener('click', (e) => openCalculatorFor('shared-owed-amount', e.currentTarget));

document.querySelectorAll('#tx-calculator-panel [data-calc]').forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-calc'), ops = ['+', '-', '×', '÷'];
        if (key === 'C') { calcExpression = ''; updateCalculatorDisplay(); return; }
        if (key === 'BACK') { calcExpression = calcExpression.slice(0, -1); updateCalculatorDisplay(); return; }
        if (key === 'OK') {
            const evalRes = evaluateCalculatorExpression(calcExpression);
            if (!evalRes.valid) { alert('Operación inválida.'); return; }
            if (activeCalcInput) { 
                activeCalcInput.value = evalRes.value > 0 ? formatNumberInput(evalRes.value) : ''; 
                activeCalcInput.dispatchEvent(new Event('input', { bubbles: true })); 
            }
            document.getElementById('tx-calculator-panel')?.classList.add('hidden');
            document.querySelectorAll('.btn-calc-toggle').forEach(b => b.classList.remove('active'));
            activeCalcInput = null;
            return;
        }
        if (ops.includes(key)) {
            if (!calcExpression) {
                const curAmt = parseMoneyInput(activeCalcInput?.value);
                if (curAmt > 0) calcExpression = formatNumberInput(curAmt).replace(/\./g, '');
                else if (key === '-') { calcExpression = '-'; updateCalculatorDisplay(); return; }
                else return;
            }
            const lastCh = calcExpression.slice(-1);
            calcExpression = ops.includes(lastCh) ? calcExpression.slice(0, -1) + key : calcExpression + key;
            updateCalculatorDisplay(); return;
        }
        calcExpression += key; updateCalculatorDisplay();
    });
});

const renderTxBudgetVariancePreview = () => {
    const box = document.getElementById('tx-budget-variance-box');
    if (!box) return;
    if (!typeSelect || typeSelect.value === 'transfer') { box.classList.add('hidden'); return; }
    const realVal = parseMoneyInput(document.getElementById('amount')?.value);
    const budgetVal = parseMoneyInput(document.getElementById('trans-budgeted-amount')?.value);
    const v = calculateBudgetVariance(typeSelect.value, realVal, budgetVal);
    if (!v.hasBudget) { box.classList.add('hidden'); return; }
    const colorClass = v.isFavorable ? 'positive' : 'negative';
    box.classList.remove('hidden');
    box.innerHTML = `<span>Diferencia: <b class="${colorClass}">${v.diff > 0 ? '+' : ''}${formatMoney(v.diff)}</b></span><span>Variación: <b class="${colorClass}">${v.pct > 0 ? '+' : ''}${String(v.pct).replace('.', ',')}%</b></span>`;
};

const autoFillBudgetedAmountForTransaction = (force = false) => {
    const budgetInput = document.getElementById('trans-budgeted-amount');
    const bannerEl = document.getElementById('tx-budget-info-banner');
    if (!budgetInput || !typeSelect) return;

    if (typeSelect.value === 'transfer') {
        budgetInput.value = '';
        if (bannerEl) bannerEl.innerHTML = '';
        renderTxBudgetVariancePreview();
        return;
    }

    const [catName, subName] = (document.getElementById('trans-category')?.value || '').split('::');
    if (!catName) {
        budgetInput.value = '';
        if (bannerEl) {
            bannerEl.style.borderColor = 'var(--border-color)';
            bannerEl.innerHTML = `
                <div style="display:flex; align-items:center; gap:7px; font-size:11.5px; color:var(--text-muted); line-height:1.35;">
                    <span style="display:inline-flex; flex-shrink:0;">${renderIcon('info', 14)}</span>
                    <span>Selecciona una categoría para consultar su presupuesto.</span>
                </div>
            `;
        }
        renderTxBudgetVariancePreview();
        return;
    }

    const dateVal = document.getElementById('trans-date')?.value;
    const targetMonthId = (dateVal && dateVal.length >= 7) ? dateVal.slice(0, 7) : getMonthId(viewDate);
    const excludeTxId = document.getElementById('edit-id')?.value || null;

    const info = getRemainingBudgetForSelection(typeSelect.value, catName, subName || 'General', targetMonthId, excludeTxId);

    if (force || !userEditedBudgetField) {
        budgetInput.value = info.remaining > 0 ? formatNumberInput(info.remaining) : '';
    }

    const savedBudgetVal = parseMoneyInput(budgetInput.value);
    const cleanLabel = `${cleanCatName(catName || '')}${subName && subName !== 'General' ? ` (${cleanCatName(subName)})` : ''}`;

    if (bannerEl) {
        if (info.hasBudget) {
            const isIncome = typeSelect.value === 'income';
            const titleLabel = isIncome ? 'Meta presupuestada restante' : 'Presupuesto disponible';
            const execLabel = isIncome ? 'Recibido' : 'Gastado';
            const remColor = isIncome ? (info.remaining <= 0 ? 'var(--positive)' : 'var(--accent)') : (info.remaining > 0 ? 'var(--positive)' : 'var(--negative)');

            let breakdownText = `Tope: ${formatMoney(info.totalLimit)} • ${execLabel}: ${formatMoney(info.spent)}`;
            if (info.rolloverAmt !== 0) {
                const rollSign = info.rolloverAmt > 0 ? '+' : '−';
                breakdownText = `Base: ${formatCompact(info.baseLimit)} ${rollSign} Arrastre: ${formatCompact(Math.abs(info.rolloverAmt))} • ${execLabel}: ${formatCompact(info.spent)}`;
            }

            bannerEl.style.borderColor = 'var(--accent-border)';
            bannerEl.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <span style="display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:700; color:var(--accent);">
                        ${renderIcon('target', 14)} ${titleLabel}:
                    </span>
                    <strong style="font-size:13px; color:${remColor};">${formatMoney(info.remaining)}</strong>
                </div>
                <small style="display:block; font-size:10.5px; color:var(--text-muted); margin-top:4px; font-weight:600;">${breakdownText}</small>
            `;
        } else if (savedBudgetVal > 0) {
            bannerEl.style.borderColor = 'var(--accent-border)';
            bannerEl.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <span style="display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:700; color:var(--accent);">
                        ${renderIcon('target', 14)} Presupuesto registrado:
                    </span>
                    <strong style="font-size:13px; color:var(--text-main);">${formatMoney(savedBudgetVal)}</strong>
                </div>
            `;
        } else {
            bannerEl.style.borderColor = 'var(--border-color)';
            bannerEl.innerHTML = `
                <div style="display:flex; align-items:center; gap:7px; font-size:11.5px; color:var(--text-muted); line-height:1.35;">
                    <span style="display:inline-flex; flex-shrink:0;">${renderIcon('info', 14)}</span>
                    <span>No hay un valor presupuestado para <b>${cleanLabel || 'esta categoría'}</b> este mes.</span>
                </div>
            `;
        }
    }

    renderTxBudgetVariancePreview();
};

document.getElementById('trans-category')?.addEventListener('change', () => { userEditedBudgetField = false; autoFillBudgetedAmountForTransaction(true); });
document.getElementById('trans-date')?.addEventListener('change', () => autoFillBudgetedAmountForTransaction(false));

const updateCCInstallmentsPreview = (syncRate = false) => {
    if (!ccInstallmentsBox) return;
    const acc = getAccountObj(document.getElementById('account')?.value);
    if (typeSelect.value !== 'expense' || (acc.category !== 'credit_card' && acc.debtType !== 'revolving')) { ccInstallmentsBox.classList.add('hidden'); return; }
    ccInstallmentsBox.classList.remove('hidden');
    const amount = parseMoneyInput(document.getElementById('amount').value);
    const installments = Math.max(1, parseInt(document.getElementById('trans-installments').value, 10) || 1);
    const rateInput = document.getElementById('trans-rate'), rateTypeSelect = document.getElementById('trans-rate-type'), zeroCheck = document.getElementById('trans-zero-interest');
    if (syncRate) {
        rateTypeSelect.value = acc.category === 'debt' ? (acc.debtRateType || 'monthly') : (acc.rateType || 'monthly');
        const defRate = acc.category === 'debt' ? acc.debtRate : acc.rate;
        rateInput.value = (installments === 1 || zeroCheck.checked) ? '0' : (defRate ? formatNumberInput(defRate) : '0');
    }

    const fianzaVal = parseMoneyInput(document.getElementById('trans-fianza')?.value);
    const fianzaType = document.getElementById('trans-fianza-type')?.value || 'pct';
    const fianzaIva = !!document.getElementById('trans-fianza-iva')?.checked;
    const fianzaAmt = typeof calculateFianzaAmount === 'function'
        ? calculateFianzaAmount(amount, fianzaVal, fianzaType, fianzaIva)
        : 0;
    const financedPrincipal = round2(amount + fianzaAmt);

    const fianzaNoteEl = document.getElementById('cc-fianza-preview-note');
    if (fianzaNoteEl) {
        fianzaNoteEl.innerText = fianzaAmt > 0 ? `+${formatMoney(fianzaAmt)} (Cap: ${formatCompact(financedPrincipal)})` : '';
    }

    const amort = calculateAmortization(financedPrincipal, installments, installments === 1 ? 0 : parseMoneyInput(rateInput.value), rateTypeSelect.value);
    document.getElementById('cc-preview-quota').innerText = formatMoney(amort.payment);
    document.getElementById('cc-preview-interest').innerText = formatMoney(amort.totalInterest);
    document.getElementById('cc-preview-total').innerText = formatMoney(amort.totalWithInterest);
    
    const txDateInput = document.getElementById('trans-date')?.value;
    let baseDate;
    if (txDateInput && txDateInput.includes('-')) {
        const [y, m] = txDateInput.split('-').map(Number);
        baseDate = new Date(y, m - 1, 1);
    } else {
        const now = new Date();
        baseDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    document.getElementById('tx-amortization-body').innerHTML = amort.schedule.map(r => {
        baseDate.setMonth(baseDate.getMonth() + 1);
        const mLabel = `${getShortMonthLabel(baseDate)} ${String(baseDate.getFullYear()).slice(-2)}`;
        return `<tr><td>${mLabel}</td><td>${formatMoney(r.payment)}</td><td class="positive">${formatMoney(r.principal)}</td><td class="negative">${formatMoney(r.interest)}</td><td>${formatMoney(r.balance)}</td></tr>`;
    }).join('');
};

['change', 'input'].forEach(evt => {
    document.getElementById('trans-date')?.addEventListener(evt, () => updateCCInstallmentsPreview(false));
    document.getElementById('trans-fianza')?.addEventListener(evt, () => updateCCInstallmentsPreview(false));
    document.getElementById('trans-fianza-type')?.addEventListener(evt, () => updateCCInstallmentsPreview(false));
    document.getElementById('trans-fianza-iva')?.addEventListener(evt, () => updateCCInstallmentsPreview(false));
});
document.getElementById('toggle-tx-amort-btn')?.addEventListener('click', () => document.getElementById('tx-amortization-box')?.classList.toggle('hidden'));
document.getElementById('trans-installments')?.addEventListener('input', () => updateCCInstallmentsPreview(true));
document.getElementById('trans-rate')?.addEventListener('input', () => updateCCInstallmentsPreview(false));
document.getElementById('trans-rate-type')?.addEventListener('change', () => updateCCInstallmentsPreview(false));
document.getElementById('trans-zero-interest')?.addEventListener('change', () => updateCCInstallmentsPreview(true));
document.getElementById('account')?.addEventListener('change', () => updateCCInstallmentsPreview(true));
document.getElementById('trans-recurrence')?.addEventListener('change', (e) => { document.getElementById('group-recurrence-count')?.classList.toggle('hidden', e.target.value === 'none'); });

const syncTransferAllocationSummary = (fromExtraInput = false) => {
    const list = document.getElementById('transfer-pending-items-list');
    const sumEl = document.getElementById('transfer-allocation-summary');
    const extraInput = document.getElementById('transfer-extra-charges');
    const amountInput = document.getElementById('amount');
    if (!list || !sumEl) return;

    let totalSel = 0;
    list.querySelectorAll('.transfer-alloc-check:checked').forEach(c => {
        totalSel = round2(totalSel + (parseFloat(c.getAttribute('data-quota')) || 0));
    });

    const extraVal = round2(parseMoneyInput(extraInput?.value));
    const currentAmount = round2(parseMoneyInput(amountInput?.value));

    if (fromExtraInput && totalSel > 0 && amountInput) {
        amountInput.value = formatNumberInput(round2(totalSel + extraVal));
    }

    const updatedAmount = round2(parseMoneyInput(amountInput?.value));
    const unallocatedDiff = round2(updatedAmount - totalSel);

    if (totalSel > 0) {
        let html = `Cuotas selec.: <b style="color:var(--text-main);">${formatMoney(totalSel)}</b>`;
        if (extraVal > 0) {
            html += ` • Cargos extra: <b class="negative">+${formatMoney(extraVal)}</b>`;
        } else if (unallocatedDiff > 0.01) {
            html += `<div style="margin-top:6px;"><button type="button" id="btn-apply-transfer-diff" class="mini-action-btn" style="width:100%; justify-content:center; font-size:11px; padding:6px;">+ Usar diferencia (${formatMoney(unallocatedDiff)}) como intereses/cargos</button></div>`;
        }
        sumEl.innerHTML = html;
        sumEl.querySelector('#btn-apply-transfer-diff')?.addEventListener('click', () => {
            if (extraInput) {
                extraInput.value = formatNumberInput(unallocatedDiff);
                syncTransferAllocationSummary(true);
            }
        });
    } else {
        sumEl.innerHTML = extraVal > 0 ? `Cargos extra (sin abono a capital): <b class="negative">${formatMoney(extraVal)}</b>` : '';
    }
};

const resetTransferAllocationBox = () => {
    const box = document.getElementById('transfer-debt-allocation-box');
    const list = document.getElementById('transfer-pending-items-list');
    const sumEl = document.getElementById('transfer-allocation-summary');
    const badge = document.getElementById('transfer-alloc-badge');
    const extraInput = document.getElementById('transfer-extra-charges');
    if (box) box.classList.add('hidden');
    if (list) list.innerHTML = '';
    if (sumEl) sumEl.innerHTML = '';
    if (badge) badge.innerText = '0 selec.';
    if (extraInput) extraInput.value = '';
};

const updateTransferAllocationUI = () => {
    const box = document.getElementById('transfer-debt-allocation-box');
    const list = document.getElementById('transfer-pending-items-list');
    const sumEl = document.getElementById('transfer-allocation-summary');
    const extraInput = document.getElementById('transfer-extra-charges');
    if (!box || !list) return;

    const currentType = typeSelect?.value || document.getElementById('type')?.value;
    if (currentType !== 'transfer') {
        resetTransferAllocationBox();
        return;
    }

    const toAccId = document.getElementById('to-account')?.value || '';
    const isPocketTarget = String(toAccId).startsWith('Pocket_') || (financeData.pockets || []).some(p => String(p.id) === String(toAccId));
    if (isPocketTarget) {
        resetTransferAllocationBox();
        return;
    }

    const toAcc = financeData.customAccounts.find(a => String(a.id) === String(toAccId));

    if (toAcc && (toAcc.category === 'credit_card' || toAcc.debtType === 'revolving' || (toAcc.category === 'debt' && getPendingRevolvingPurchases(toAccId).length > 0))) {
        box.classList.remove('hidden');
        const pendingItems = toAcc.category === 'credit_card' ? getPendingCardPurchases(toAccId) : getPendingRevolvingPurchases(toAccId);
        
        if (pendingItems.length > 0) {
            list.innerHTML = pendingItems.map(item => `
                <label style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:10px; margin-bottom:6px; cursor:pointer;">
                    <div style="min-width:0; flex:1;">
                        <strong style="display:block; font-size:11.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-main);">${item.tx.description}</strong>
                        <small style="font-size:10.5px; color:var(--text-muted);">Cuota ${item.nextPeriod}/${item.installments} • ${formatMoney(item.nextQuota)}</small>
                    </div>
                    <input type="checkbox" class="transfer-alloc-check" value="${item.tx.id}" data-quota="${item.nextQuota}" style="width:16px; height:16px; accent-color:var(--accent);">
                </label>
            `).join('');
        } else {
            list.innerHTML = '<small style="color:var(--text-muted); font-size:11px;">No hay compras con cuotas pendientes.</small>';
        }

        const checkBoxes = list.querySelectorAll('.transfer-alloc-check');
        checkBoxes.forEach(cb => {
            cb.addEventListener('change', () => {
                let totalSel = 0;
                checkBoxes.forEach(c => { if (c.checked) totalSel = round2(totalSel + parseFloat(c.getAttribute('data-quota'))); });
                const extraVal = round2(parseMoneyInput(extraInput?.value));
                const amountInput = document.getElementById('amount');
                if (amountInput && totalSel > 0) {
                    amountInput.value = formatNumberInput(round2(totalSel + extraVal));
                    amountInput.dispatchEvent(new Event('input'));
                }
                syncTransferAllocationSummary(false);
            });
        });
        if (sumEl) sumEl.innerHTML = '';
        const badge = document.getElementById('transfer-alloc-badge');
        if (badge) badge.innerText = pendingItems.length > 0 ? `${pendingItems.length} diferidos` : 'Sin diferidos';
        syncTransferAllocationSummary(false);
    } else {
        box.classList.add('hidden');
        if (extraInput) extraInput.value = '';
    }
};

document.getElementById('transfer-extra-charges')?.addEventListener('input', () => syncTransferAllocationSummary(true));
document.getElementById('amount')?.addEventListener('input', () => {
    if (typeSelect?.value === 'transfer') syncTransferAllocationSummary(false);
});
document.getElementById('to-account')?.addEventListener('change', updateTransferAllocationUI);

document.getElementById('is-shared-expense')?.addEventListener('change', (e) => {
    const sharedFields = document.getElementById('shared-expense-fields');
    if (e.target.checked) {
        sharedFields?.classList.remove('hidden');
        const mainAmount = document.getElementById('amount')?.value;
        const owedInput = document.getElementById('shared-owed-amount');
        if (mainAmount && owedInput && (!owedInput.value || owedInput.value === '0,00' || owedInput.value === '0')) {
            owedInput.value = mainAmount;
            owedInput.style.transition = 'box-shadow 0.3s ease';
            owedInput.style.boxShadow = '0 0 0 2px var(--positive)';
            setTimeout(() => owedInput.style.boxShadow = 'none', 1500);
        }
    } else {
        sharedFields?.classList.add('hidden');
    }
});

// --- EL CONTROLADOR MAESTRO DEL MODAL (AQUÍ ESTABA EL ERROR VISUAL) ---
typeSelect?.addEventListener('change', () => {
    const accEl = document.getElementById('account'), budgetGroup = document.getElementById('group-budgeted-amount'), payrollShortcut = document.getElementById('quick-payroll-shortcut');
    const splitBtn = document.getElementById('btn-open-split-modal');
    const sharedWrap = document.getElementById('shared-expense-wrapper');
    if (typeSelect.value === 'expense') {
        sharedWrap?.classList.remove('hidden');
    } else {
        sharedWrap?.classList.add('hidden');
        const sharedSwitch = document.getElementById('is-shared-expense');
        if (sharedSwitch) {
            sharedSwitch.checked = false;
            sharedSwitch.dispatchEvent(new Event('change')); 
        }
    }
    
    const submitBtn = document.querySelector('#transaction-modal button[type="submit"]');
    const modalContent = document.querySelector('#transaction-modal .modal-content');

    const catEl = document.getElementById('trans-category');
    if (typeSelect.value === 'transfer') {
        if (submitBtn) { submitBtn.style.backgroundColor = 'var(--accent)'; submitBtn.innerText = 'Guardar Transferencia'; }
        if (modalContent) modalContent.style.boxShadow = '0 0 0 2px var(--accent)';
        
        if (splitBtn) splitBtn.classList.add('hidden');
        if (catEl) { catEl.required = false; catEl.value = ''; }
        renderAccountSelects(false); if (accEl) accEl.value = getDefaultAccountId(true);
        toAccountGroup?.classList.remove('hidden'); categoryGroup?.classList.add('hidden'); budgetGroup?.classList.add('hidden'); payrollShortcut?.classList.add('hidden'); ccInstallmentsBox?.classList.add('hidden');
        document.getElementById('label-account').innerText = 'Cuenta Origen';
        updateTransferAllocationUI();
    } else if (typeSelect.value === 'income') {
        if (submitBtn) { submitBtn.style.backgroundColor = 'var(--positive)'; submitBtn.innerText = 'Guardar Ingreso'; }
        if (modalContent) modalContent.style.boxShadow = '0 0 0 2px var(--positive)';
        
        if (splitBtn) splitBtn.classList.remove('hidden');
        if (catEl) catEl.required = true;
        renderAccountSelects(true); if (accEl) accEl.value = getDefaultAccountId(true);
        toAccountGroup?.classList.add('hidden'); categoryGroup?.classList.remove('hidden'); budgetGroup?.classList.remove('hidden'); payrollShortcut?.classList.remove('hidden'); ccInstallmentsBox?.classList.add('hidden');
        document.getElementById('label-account').innerText = 'Cuenta Destino'; renderCategoryOptions('income');
    } else {
        if (submitBtn) { submitBtn.style.backgroundColor = 'var(--negative)'; submitBtn.innerText = 'Guardar Gasto'; }
        if (modalContent) modalContent.style.boxShadow = '0 0 0 2px var(--negative)';
        
        if (splitBtn) splitBtn.classList.remove('hidden');
        if (catEl) catEl.required = true;
        renderAccountSelects(false); if (accEl) accEl.value = getDefaultAccountId(false);
        toAccountGroup?.classList.add('hidden'); categoryGroup?.classList.remove('hidden'); budgetGroup?.classList.remove('hidden'); payrollShortcut?.classList.add('hidden');
        document.getElementById('label-account').innerText = 'Cuenta / Tarjeta'; renderCategoryOptions('expense'); updateCCInstallmentsPreview(true);
    }
    if (typeof updateTransferAllocationUI === 'function') updateTransferAllocationUI();
    userEditedBudgetField = false;
    autoFillBudgetedAmountForTransaction(true);
});

['input', 'change', 'blur'].forEach(evt => {
    document.getElementById('amount')?.addEventListener(evt, () => {
        updateCCInstallmentsPreview(false);
        renderTxBudgetVariancePreview();
        requestAnimationFrame(renderTxBudgetVariancePreview);
    });
});

const renderOmniSubscriptionSuggestions = (rawText) => {
    const descInput = document.getElementById('description');
    if (!descInput) return;

    let suggestBox = document.getElementById('omni-sub-suggest-box');
    if (!suggestBox) {
        suggestBox = document.createElement('div');
        suggestBox.id = 'omni-sub-suggest-box';
        suggestBox.className = 'hidden';
        suggestBox.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;';
        const parentGroup = descInput.closest('.form-group') || descInput.parentElement;
        parentGroup?.appendChild(suggestBox);
    }

    const currentType = typeSelect ? typeSelect.value : document.getElementById('type')?.value;
    const editId = document.getElementById('edit-id')?.value;
    const query = (rawText || '').trim().toLowerCase();

    if (editId || currentType !== 'expense' || query.length < 2) {
        suggestBox.classList.add('hidden');
        suggestBox.innerHTML = '';
        return;
    }

    const activeSubs = (financeData.subscriptions || []).filter(s => s.status === 'active');
    const matches = activeSubs.filter(s => {
        const cleanName = stripLeadingEmoji(s.name || '').trim().toLowerCase();
        return cleanName.includes(query) || (query.length >= 3 && query.includes(cleanName));
    });

    if (matches.length === 0) {
        suggestBox.classList.add('hidden');
        suggestBox.innerHTML = '';
        return;
    }

    suggestBox.classList.remove('hidden');
    suggestBox.innerHTML = matches.slice(0, 3).map(sub => {
        const cleanName = stripLeadingEmoji(sub.name);
        let dateTag = '';
        if (sub.nextBillingDate) {
            const [y, m, d] = sub.nextBillingDate.split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            dateTag = ` • ${d} ${dt.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}.`;
        }
        return `
            <button type="button" data-omni-sub-id="${sub.id}" style="display:inline-flex; align-items:center; gap:5px; padding:5px 10px; border-radius:999px; border:1px solid var(--accent); background:color-mix(in srgb, var(--accent) 12%, var(--card-inner-bg)); color:var(--text-main); font-size:11.5px; font-weight:700; cursor:pointer;">
                <span style="color:var(--accent);">↻</span>
                <span>${cleanName} • ${formatMoney(sub.amount)}${dateTag}</span>
            </button>
        `;
    }).join('');

    suggestBox.querySelectorAll('[data-omni-sub-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const subId = btn.getAttribute('data-omni-sub-id');
            const sub = (financeData.subscriptions || []).find(s => String(s.id) === String(subId));
            if (!sub) return;

            pendingOmniSubscriptionId = sub.id;
            descInput.value = stripLeadingEmoji(sub.name);

            const amtEl = document.getElementById('amount');
            if (amtEl) {
                amtEl.value = formatNumberInput(sub.amount);
                amtEl.dispatchEvent(new Event('input'));
            }

            const accEl = document.getElementById('account');
            if (accEl && sub.accountId && Array.from(accEl.options).some(o => o.value === sub.accountId)) {
                accEl.value = sub.accountId;
                accEl.dispatchEvent(new Event('change'));
            }

            const catEl = document.getElementById('trans-category');
            if (catEl && sub.category) {
                const targetCat = sub.category.includes('::') ? sub.category : `${sub.category}::General`;
                if (Array.from(catEl.options).some(o => o.value === targetCat)) {
                    catEl.value = targetCat;
                    catEl.dispatchEvent(new Event('change'));
                }
            }

            suggestBox.classList.add('hidden');
            suggestBox.innerHTML = '';
        });
    });
};

document.getElementById('description')?.addEventListener('input', (e) => {
    const text = e.target.value.trim();
    renderOmniSubscriptionSuggestions(text);
    if (text.length < 3) return;
    const currentType = document.getElementById('type')?.value;
    const editId = document.getElementById('edit-id')?.value;
    if (editId || currentType === 'transfer') return;

    const catSelect = document.getElementById('trans-category');
    const accSelect = document.getElementById('account');
    let aiActed = false, bestCat = null, bestAcc = null;

    const regexInferredCategory = inferCategoryFromName(text, currentType);
    if (regexInferredCategory) {
        const options = Array.from(catSelect.options);
        const exactMatch = options.find(o => o.value === `${regexInferredCategory}::General`);
        const looseMatch = options.find(o => o.value.startsWith(`${regexInferredCategory}::`));
        if (exactMatch) bestCat = exactMatch.value;
        else if (looseMatch) bestCat = looseMatch.value;
    }

    const matches = financeData.transactions.filter(t => t.type === currentType && t.description && t.description.toLowerCase().includes(text.toLowerCase()));
    if (matches.length > 0) {
        const catFreq = {}, accFreq = {};
        matches.forEach(t => {
            const catStr = t.subcategory && t.subcategory !== 'General' ? `${t.category}::${t.subcategory}` : `${t.category}::General`;
            catFreq[catStr] = (catFreq[catStr] || 0) + 1;
            if (t.account) accFreq[t.account] = (accFreq[t.account] || 0) + 1;
        });
        if (!bestCat) bestCat = Object.keys(catFreq).sort((a, b) => catFreq[b] - catFreq[a])[0];
        bestAcc = Object.keys(accFreq).sort((a, b) => accFreq[b] - accFreq[a])[0];
    }

    if (bestAcc && accSelect && accSelect.value !== bestAcc && Array.from(accSelect.options).some(o => o.value === bestAcc)) {
        accSelect.value = bestAcc;
        accSelect.style.transition = 'box-shadow 0.3s ease';
        accSelect.style.boxShadow = '0 0 0 2px var(--accent)';
        setTimeout(() => accSelect.style.boxShadow = 'none', 3000);
        accSelect.dispatchEvent(new Event('change'));
        aiActed = true;
    }

    if (bestCat && catSelect && catSelect.value !== bestCat && Array.from(catSelect.options).some(o => o.value === bestCat)) {
        catSelect.value = bestCat;
        catSelect.style.transition = 'box-shadow 0.3s ease';
        catSelect.style.boxShadow = '0 0 0 2px var(--accent)';
        setTimeout(() => catSelect.style.boxShadow = 'none', 3000);
        catSelect.dispatchEvent(new Event('change'));
        aiActed = true;
    }
    
    if (aiActed) {
        e.target.style.transition = 'box-shadow 0.3s ease';
        e.target.style.boxShadow = '0 0 0 2px var(--positive)';
        setTimeout(() => e.target.style.boxShadow = 'none', 3000);
    }
});

document.getElementById('btn-tx-quick-payroll')?.addEventListener('click', () => {
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (!salaryStr) { alert("Configura tu Salario en 'Mi Perfil' primero."); return; }
    const config = JSON.parse(salaryStr), metrics = calculateLaborMetrics(config, currentDate), isBiweekly = config.frequency === 'biweekly';
    const mId = getMonthId(currentDate);
    let advances = 0;
    financeData.transactions.forEach(t => {
        if (t.monthId === mId && t.type === 'income' && stripLeadingEmoji(t.category) === 'Salario / Nómina' && t.subcategory === 'Anticipo' && t.status !== 'pending') {
            advances += round2(t.amount);
        }
    });

    const periodVal = isBiweekly ? (currentDate.getDate() <= 16 ? '1Q' : '2Q') : 'M';
    let amt = isBiweekly ? (periodVal === '1Q' ? metrics.net1Q : metrics.net2Q) : metrics.net;
    
    if (advances > 0) {
        if (confirm(`Tienes anticipos registrados por ${formatMoney(advances)} este mes.\n\n¿Deseas descontarlos automáticamente de este pago de nómina?`)) {
            amt = Math.max(0, round2(amt - advances));
        }
    }

    const salCat = financeData.categories.income.find(c => stripLeadingEmoji(c.name) === 'Salario / Nómina');
    if (salCat) {
        const catSel = document.getElementById('trans-category');
        catSel.value = `${salCat.name}::General`;
        catSel.dispatchEvent(new Event('change'));
    }
    document.getElementById('description').value = isBiweekly ? `Pago Nómina (${periodVal})` : 'Pago Nómina Mensual';
    document.getElementById('amount').value = formatNumberInput(amt);
    document.getElementById('amount').dispatchEvent(new Event('input'));
    pendingOmniPayrollLibranza = (metrics.payrollDebtDeductions > 0 || metrics.payrollSavingsDeductions > 0) ? { periodVal, isBiweekly } : null;
});

document.getElementById('btn-tx-advance-payroll')?.addEventListener('click', () => {
    const catObj = financeData.categories.income.find(c => stripLeadingEmoji(c.name) === 'Salario / Nómina');
    if (catObj) {
        if (!catObj.subcategories.some(s => s.name === 'Anticipo')) {
            catObj.subcategories.push({ name: 'Anticipo', limit: 0, isFixed: false });
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            renderCategoryOptions('income');
        }
        document.getElementById('trans-category').value = `${catObj.name}::Anticipo`;
    }
    document.getElementById('description').value = 'Anticipo de Nómina';
    document.getElementById('amount').focus();
    document.getElementById('trans-category').dispatchEvent(new Event('change'));
});

// --- LÓGICA DE SPLIT (DIVISIÓN DE TRANSACCIONES) ---
let splitState = { baseAmount: 0, type: 'expense', items: [] };

const renderSplitItems = () => {
    const container = document.getElementById('split-items-container');
    if (!container) return;
    container.innerHTML = '';
    
    let assigned = 0;
    const assetsAcc = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset' || a.category === 'credit_card'));
    const accOptionsHtml = assetsAcc.map(a => `<option value="${a.id}">${a.name}${a.isDefault ? ' ⭐' : ''}</option>`).join('');
    
    let catOptionsHtml = '';
    [...(financeData.categories[splitState.type] || [])].sort((a, b) => a.name.localeCompare(b.name, 'es')).forEach(cat => {
        if (cat.subcategories && cat.subcategories.length > 0) {
            catOptionsHtml += `<optgroup label="${cat.name}">`;
            catOptionsHtml += `<option value="${cat.name}::General">${cat.name} (General)</option>`;
            [...cat.subcategories].sort((a, b) => a.name.localeCompare(b.name, 'es')).forEach(sub => { catOptionsHtml += `<option value="${cat.name}::${sub.name}">↳ ${sub.name}</option>`; });
            catOptionsHtml += `</optgroup>`;
        } else { catOptionsHtml += `<option value="${cat.name}::General">${cat.name}</option>`; }
    });

    splitState.items.forEach((item, index) => {
        assigned += round2(item.amount);
        container.innerHTML += `
            <div class="glass-sub-box" style="padding:12px; margin-bottom:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong style="font-size:12.5px;">Parte ${index + 1}</strong>
                    <button type="button" class="mini-action-btn" onclick="removeSplitItem(${index})" style="background:rgba(255,59,48,0.15); color:var(--negative); border:none; padding:3px 8px;">✕ Eliminar</button>
                </div>
                <div class="form-row" style="margin-bottom:8px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <input type="text" class="money-input split-amt-input" data-index="${index}" inputmode="decimal" value="${item.amount > 0 ? formatNumberInput(item.amount) : ''}" placeholder="Monto ($)" style="font-weight:700;">
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <select class="split-cat-select" data-index="${index}">${catOptionsHtml}</select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="margin-bottom:0;">
                        <select class="split-acc-select" data-index="${index}">${accOptionsHtml}</select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <input type="text" class="split-desc-input" data-index="${index}" value="${item.description}" placeholder="Nota (Ej. Aseo)">
                    </div>
                </div>
            </div>`;
    });
    
    setTimeout(() => {
        document.querySelectorAll('.split-cat-select').forEach(el => { el.value = splitState.items[el.getAttribute('data-index')].category; });
        document.querySelectorAll('.split-acc-select').forEach(el => { el.value = splitState.items[el.getAttribute('data-index')].account; });
        document.querySelectorAll('.split-amt-input').forEach(el => {
            el.addEventListener('input', (e) => {
                applyLiveDecimalFormatting(e.target);
                splitState.items[el.getAttribute('data-index')].amount = parseMoneyInput(e.target.value);
                updateSplitTotals();
            });
        });
        document.querySelectorAll('.split-cat-select').forEach(el => { el.addEventListener('change', (e) => splitState.items[el.getAttribute('data-index')].category = e.target.value); });
        document.querySelectorAll('.split-acc-select').forEach(el => { el.addEventListener('change', (e) => splitState.items[el.getAttribute('data-index')].account = e.target.value); });
        document.querySelectorAll('.split-desc-input').forEach(el => { el.addEventListener('input', (e) => splitState.items[el.getAttribute('data-index')].description = e.target.value); });
    }, 50);
    updateSplitTotals();
};

const updateSplitTotals = () => {
    let assigned = splitState.items.reduce((sum, item) => round2(sum + (parseFloat(item.amount) || 0)), 0);
    const rem = round2(splitState.baseAmount - assigned);
    document.getElementById('split-base-total').innerText = formatMoney(splitState.baseAmount);
    document.getElementById('split-assigned-total').innerText = formatMoney(assigned);
    document.getElementById('split-remaining-total').innerText = formatMoney(rem);

    const remEl = document.getElementById('split-remaining-total');
    const confirmBtn = document.getElementById('btn-confirm-splits');
    if (Math.abs(rem) < 0.01) { 
        remEl.className = 'positive';
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.style.opacity = '1'; }
    } else {
        remEl.className = rem < 0 ? 'negative' : 'neutral';
        if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.style.opacity = '0.5'; }
    }
};

window.removeSplitItem = (index) => { splitState.items.splice(index, 1); renderSplitItems(); };

document.getElementById('btn-add-split-item')?.addEventListener('click', () => {
    let currentAssigned = splitState.items.reduce((sum, item) => sum + round2(item.amount), 0);
    let rem = Math.max(0, round2(splitState.baseAmount - currentAssigned));
    const baseCat = document.getElementById('trans-category')?.value || '';
    const baseAcc = document.getElementById('account')?.value || getDefaultAccountId(splitState.type === 'income');
    const baseDesc = document.getElementById('description')?.value || '';
    splitState.items.push({ amount: rem, category: baseCat, account: baseAcc, description: baseDesc });
    renderSplitItems();
});

document.getElementById('btn-open-split-modal')?.addEventListener('click', () => {
    const baseAmt = parseMoneyInput(document.getElementById('amount')?.value);
    if (baseAmt <= 0) { alert('Ingresa primero el Monto Total en el formulario principal.'); return; }
    splitState.type = typeSelect.value;
    splitState.baseAmount = baseAmt;
    
    const badge = document.getElementById('split-tx-type-badge');
    if (badge) {
        badge.innerText = splitState.type === 'expense' ? 'Gasto' : 'Ingreso';
        badge.className = splitState.type === 'expense' ? 'widget-badge negative-bg' : 'widget-badge positive-bg';
        badge.style.color = 'white';
    }
    const baseCat = document.getElementById('trans-category')?.value || '';
    const baseAcc = document.getElementById('account')?.value || getDefaultAccountId(splitState.type === 'income');
    const baseDesc = document.getElementById('description')?.value || '';

    splitState.items = [
        { amount: baseAmt, category: baseCat, account: baseAcc, description: baseDesc },
        { amount: 0, category: baseCat, account: baseAcc, description: baseDesc }
    ];
    document.getElementById('split-tx-modal')?.classList.remove('hidden');
    renderSplitItems();
});

document.getElementById('close-split-modal-btn')?.addEventListener('click', () => {
    document.getElementById('split-tx-modal')?.classList.add('hidden');
});

document.getElementById('btn-confirm-splits')?.addEventListener('click', () => {
    const showSplitToast = (text, isError = false) => {
        document.querySelectorAll('.sw-toast').forEach(t => t.remove());
        const toast = document.createElement('div');
        toast.className = 'sw-toast';
        toast.style.gap = '7px';
        toast.style.whiteSpace = 'normal';
        toast.style.lineHeight = '1.3';
        toast.style.borderRadius = '16px';
        if (isError) {
            toast.style.background = 'var(--negative)';
            toast.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.35)';
        }
        const iconSvg = isError
            ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
            : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        toast.innerHTML = `${iconSvg}<span>${text}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2600);
    };

    let currentAssigned = splitState.items.reduce((sum, item) => round2(sum + (parseFloat(item.amount) || 0)), 0);
    const rem = round2(splitState.baseAmount - currentAssigned);
    if (Math.abs(rem) >= 0.01) { showSplitToast(`La división no es exacta. Descuadre de ${formatMoney(rem)}.`, true); return; }
    if (splitState.items.length < 2) { showSplitToast('Agrega al menos dos sub-transacciones para dividir.', true); return; }
    
    let assigned = splitState.items.reduce((sum, item) => sum + round2(item.amount), 0);
    if (round2(splitState.baseAmount - assigned) !== 0) { showSplitToast('La suma debe ser igual al monto total base.', true); return; }

    const validItems = splitState.items.filter(i => i.amount > 0);
    if (validItems.length < 2) { showSplitToast('Debes tener al menos 2 divisiones mayores a $0.', true); return; }

    const status = document.getElementById('trans-status').value;
    const baseDateObj = new Date(`${document.getElementById('trans-date').value}T${document.getElementById('trans-time').value}`);
    const splitGroupId = 'Split_' + Date.now();
    const commonDesc = document.getElementById('description').value.trim();

    validItems.forEach((item, idx) => {
        let catName = '', subName = 'General';
        if (item.category) { const parts = item.category.split('::'); catName = parts[0]; subName = parts[1] || 'General'; }

        financeData.transactions.push({
            id: baseDateObj.getTime() + idx + Math.floor(Math.random() * 500),
            monthId: getMonthId(baseDateObj), type: splitState.type, status: status,
            account: item.account, category: catName, subcategory: subName,
            description: `${item.description || commonDesc} [${idx+1}/${validItems.length}]`,
            amount: item.amount, budgetedAmount: status === 'pending' ? item.amount : 0,
            date: `${baseDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${baseDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
            isAdjustment: false, splitGroupId: splitGroupId
        });
    });

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    viewDate = new Date(baseDateObj.getFullYear(), baseDateObj.getMonth(), 1);
    document.getElementById('split-tx-modal')?.classList.add('hidden');
    forceCloseAllModals(); updateDashboard();
    showSplitToast(`Transacción dividida y guardada en ${validItems.length} partes`);
});

// --- LÓGICA DE AHORRO DE MONEDAS (UI) ---
let userEditedCoinAmount = false;
const updateCoinRoundingUI = () => {
    const wrap = document.getElementById('coin-round-wrapper');
    const fields = document.getElementById('coin-round-fields');
    const pillsWrap = document.getElementById('coin-round-pills');
    const coinInput = document.getElementById('coin-round-amount');
    if (!wrap) return;
    
    const type = document.getElementById('type')?.value;
    const acc = document.getElementById('account')?.value;
    const amount = Math.round(parseCleanCOP(document.getElementById('amount')?.value));

    if (type === 'expense' && acc === 'Efectivo' && amount > 0) {
        const rem5k = amount % 5000;
        const diff5k = rem5k !== 0 ? (5000 - rem5k) : 0;
        const exactCoins = diff5k % 2000;

        const rem2k = amount % 2000;
        const diff2k = rem2k !== 0 ? (2000 - rem2k) : 0;

        const rem1k = amount % 1000;
        const diff1k = rem1k !== 0 ? (1000 - rem1k) : 0;

        const suggested = exactCoins > 0 ? exactCoins : (diff2k > 0 ? diff2k : (diff1k > 0 ? diff1k : 1000));
        const completesBill5k = (amount + suggested) % 5000 === 0;

        document.getElementById('coin-round-desc').innerText = exactCoins > 0
            ? (completesBill5k ? `Sugerido: guardar ${formatMoney(suggested)} (completar ${formatMoney(amount + suggested)})` : `Sugerido: guardar ${formatMoney(suggested)} (vuelto en monedas)`)
            : 'Guardar vuelto en monedas en tu alcancía';

        if (pillsWrap) {
            const options = [];
            if (exactCoins > 0) options.push({ val: exactCoins, label: `${formatMoney(exactCoins)} (Billete $5k/$10k)` });
            if (diff2k > 0 && !options.some(o => o.val === diff2k)) options.push({ val: diff2k, label: `${formatMoney(diff2k)} (Billete $2k)` });
            if (diff1k > 0 && !options.some(o => o.val === diff1k)) options.push({ val: diff1k, label: `${formatMoney(diff1k)} (Múltiplo $1k)` });

            pillsWrap.innerHTML = options.map(o => `<button type="button" class="pill-btn" data-coin-val="${o.val}">${o.label}</button>`).join('');
            pillsWrap.querySelectorAll('.pill-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const val = parseFloat(btn.getAttribute('data-coin-val')) || 0;
                    if (coinInput) { coinInput.value = formatNumberInput(val); userEditedCoinAmount = true; }
                });
            });
        }
        if (coinInput && !userEditedCoinAmount) coinInput.value = formatNumberInput(suggested);
        wrap.classList.remove('hidden');
        const isChecked = !!document.getElementById('is-coin-round')?.checked;
        fields?.classList.toggle('hidden', !isChecked);
    } else {
        wrap.classList.add('hidden');
        fields?.classList.add('hidden');
        if (document.getElementById('is-coin-round')) document.getElementById('is-coin-round').checked = false;
        userEditedCoinAmount = false;
    }
};

document.getElementById('is-coin-round')?.addEventListener('change', (e) => {
    const fields = document.getElementById('coin-round-fields');
    if (e.target.checked) { fields?.classList.remove('hidden'); updateCoinRoundingUI(); } 
    else { fields?.classList.add('hidden'); }
});
document.getElementById('coin-round-amount')?.addEventListener('input', () => { userEditedCoinAmount = true; });
document.getElementById('account')?.addEventListener('change', updateCoinRoundingUI);
document.getElementById('amount')?.addEventListener('input', updateCoinRoundingUI);
document.getElementById('type')?.addEventListener('change', updateCoinRoundingUI);

// ==========================================
// 12. HISTORIAL CON BUSCADOR INSTANTÁNEO Y CONFIRMACIÓN
// ==========================================
window.confirmPendingTx = (id, event) => {
    if (event) event.stopPropagation();
    const tx = financeData.transactions.find(t => String(t.id) === String(id));
    if (!tx) return;

    const defaultAmt = tx.amount > 0 ? tx.amount : (tx.budgetedAmount || 0);
    const refAmt = tx.budgetedAmount || defaultAmt;

    openQuickActionModal({
        title: 'Confirmar Movimiento',
        subtitle: tx.description,
        infoLabel: 'Valor Presupuestado:',
        infoValue: formatMoney(refAmt),
        showAccountSelect: false,
        amountLabel: 'Valor REAL Pagado / Recibido ($)',
        defaultAmount: defaultAmt,
        submitLabel: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Confirmar Movimiento</span>`,
        onConfirm: (realAmt) => {
            if (realAmt < 0) { alert('Ingresa un monto válido.'); return false; }
            if (!tx.budgetedAmount) tx.budgetedAmount = defaultAmt;
            tx.amount = realAmt;
            tx.status = 'closed';
            if (tx.pendingLibranzas) {
                const appliedLib = applyPayrollLibranzas(tx.monthId, tx.payrollPeriod || 'M', new Date(tx.id), !!tx.isBiweeklyPayroll);
                if (appliedLib.length > 0) {
                    tx.linkedLibranzas = appliedLib.map(l => ({
                        txId: l.txId, intTxId: l.intTxId, debtId: l.debtId,
                        targetTxId: l.targetTxId, pocketId: l.pocketId,
                        pocketAmt: l.pocketAmt, quoteStep: l.quoteStep
                    }));
                }
                delete tx.pendingLibranzas;
            }

            if (tx.type === 'transfer') {
                const fromObj = getAccountObj(tx.account);
                const toObj = getAccountObj(tx.toAccount);
                if (fromObj.category === 'pocket') adjustPocketBalance(fromObj.id, -realAmt);
                if (toObj.category === 'pocket') adjustPocketBalance(toObj.id, realAmt);
            }

            localStorage.setItem('myFinances', JSON.stringify(financeData));
            updateDashboard();
            return true;
        }
    });
};

window.renderTransactionHistory = (monthId, snap, projectionData) => {
    const listEl = document.getElementById('transaction-list');
    const titleEl = document.getElementById('history-section-title');
    const countBadge = document.getElementById('history-count-badge');
    const projBox = document.getElementById('projection-summary-box');
    if (!listEl) return;

    if (titleEl) {
        if (historySearchQuery) titleEl.innerText = 'Resultados de Búsqueda';
        else if (typeof selectedCalendarDay !== 'undefined' && selectedCalendarDay) {
            const dObj = new Date(selectedCalendarDay + 'T12:00:00');
            titleEl.innerText = `Movimientos del ${dObj.getDate()} de ${getShortMonthLabel(dObj)}`;
        } else {
            titleEl.innerText = 'Movimientos del Mes';
        }
    }

    let filteredTxs = financeData.transactions.filter(t => !t.isDeleted && getTxMonthId(t) === monthId);

    if (typeof selectedCalendarDay !== 'undefined' && selectedCalendarDay) {
        filteredTxs = filteredTxs.filter(t => new Date(t.id).toLocaleDateString('en-CA') === selectedCalendarDay);
    }

    if (typeof activeHistoryFilter !== 'undefined' && activeHistoryFilter !== 'all') {
        if (activeHistoryFilter === 'pending') {
            filteredTxs = filteredTxs.filter(t => t.status === 'pending');
            const currentMonthId = getMonthId(currentDate);
            if (monthId >= currentMonthId && financeData.preferences?.showProjections !== false) {
                
                financeData.subscriptions.forEach(sub => {
                    if (sub.status === 'active' && sub.nextBillingDate) {
                        const subMonthId = sub.nextBillingDate.slice(0, 7);
                        if (subMonthId <= monthId) {
                            filteredTxs.push({
                                id: `v_sub_${sub.id}`, isVirtual: true, status: 'pending', type: 'expense',
                                account: sub.accountId || getDefaultAccountId(false),
                                category: sub.category || 'Entretenimiento',
                                description: `Suscripción: ${sub.name}`,
                                amount: sub.amount, date: `Vence: ${sub.nextBillingDate}`
                            });
                        }
                    }
                });

                financeData.customAccounts.filter(a => a.category === 'debt').forEach(d => {
                    const bal = round2(snap.bals[d.id] || 0);
                    if (bal > 0) {
                        const paidThisMonth = financeData.transactions.some(t => t.monthId === monthId && t.toAccount === d.id && t.type === 'transfer' && isTxClosed(t));
                        if (!paidThisMonth) {
                            const qInfo = getDebtMonthlyQuotaBreakdown(d, bal);
                            if (qInfo.totalQuota > 0) {
                                filteredTxs.push({
                                    id: `v_debt_${d.id}`, isVirtual: true, status: 'pending', type: 'expense',
                                    account: getDefaultAccountId(true), category: 'Cuotas / Intereses',
                                    description: `Préstamo: ${d.name}`,
                                    amount: qInfo.totalQuota, date: d.paymentDay ? `Pago esperado: Día ${d.paymentDay}` : 'Cuota del mes'
                                });
                            }
                        }
                    }
                });

                financeData.customAccounts.filter(a => a.category === 'credit_card').forEach(c => {
                    const bal = round2(snap.bals[c.id] || 0);
                    if (bal > 0) {
                        const paidThisMonth = financeData.transactions.some(t => t.monthId === monthId && t.toAccount === c.id && t.type === 'transfer' && isTxClosed(t));
                        if (!paidThisMonth) {
                            const est = calculateCardMinPaymentEstimate(c, bal);
                            if (est.totalMinPayment > 0) {
                                filteredTxs.push({
                                    id: `v_card_${c.id}`, isVirtual: true, status: 'pending', type: 'expense',
                                    account: getDefaultAccountId(true), category: 'Cuotas / Intereses',
                                    description: `Tarjeta: ${c.name}`,
                                    amount: est.totalMinPayment, date: `Corte: Día ${c.cutoffDay || '-'}`
                                });
                            }
                        }
                    }
                });
                
                const mIdx = viewDate.getMonth();
                const vYear = viewDate.getFullYear();
                financeData.categories.expense.forEach(cat => {
                    if (cat.isFixed) {
                        const limit = getCategoryBudgetStatus(cat, null, mIdx, vYear).currentLimit;
                        const spent = financeData.transactions.filter(t => t.monthId === monthId && t.type === 'expense' && t.category === cat.name && !t.isAdjustment && isTxClosed(t)).reduce((s,t) => s + round2(t.amount), 0);
                        const remaining = round2(limit - spent);
                        if (remaining > 0) {
                            filteredTxs.push({
                                id: `v_budget_${cat.name}`, isVirtual: true, status: 'pending', type: 'expense',
                                account: getDefaultAccountId(false), category: cat.name,
                                description: `Presupuesto Fijo: ${cat.name}`,
                                amount: remaining, date: 'Falta por gastar'
                            });
                        }
                    }
                    if (cat.subcategories) {
                        cat.subcategories.forEach(sub => {
                            if (sub.isFixed) {
                                const subLimit = getCategoryBudgetStatus(cat, sub, mIdx, vYear).currentLimit;
                                const spent = financeData.transactions.filter(t => t.monthId === monthId && t.type === 'expense' && t.category === cat.name && t.subcategory === sub.name && !t.isAdjustment && isTxClosed(t)).reduce((s,t) => s + round2(t.amount), 0);
                                const remaining = round2(subLimit - spent);
                                if (remaining > 0) {
                                    filteredTxs.push({
                                        id: `v_budget_${cat.name}_${sub.name}`, isVirtual: true, status: 'pending', type: 'expense',
                                        account: getDefaultAccountId(false), category: `${cat.name}::${sub.name}`,
                                        description: `Fijo: ${sub.name}`,
                                        amount: remaining, date: 'Falta por gastar'
                                    });
                                }
                            }
                        });
                    }
                });
            }
        }
        else {
            filteredTxs = filteredTxs.filter(t => t.type === activeHistoryFilter);
        }
    }

    if (historySearchQuery) {
        const q = historySearchQuery.toLowerCase();
        const cleanTagQuery = q.startsWith('#') ? q.slice(1) : q;
        filteredTxs = filteredTxs.filter(t => {
            const acc = getAccountObj(t.account).name.toLowerCase();
            const toAcc = t.toAccount ? getAccountObj(t.toAccount).name.toLowerCase() : '';
            const cat = (t.category || '').toLowerCase();
            const desc = (t.description || '').toLowerCase();
            const tagsArr = Array.isArray(t.tags) ? t.tags.map(tg => tg.toLowerCase()) : [];
            const matchesTag = q.startsWith('#')
                ? tagsArr.some(tg => tg === cleanTagQuery || tg.includes(cleanTagQuery))
                : tagsArr.some(tg => tg.includes(cleanTagQuery));
            return desc.includes(q) || cat.includes(q) || acc.includes(q) || toAcc.includes(q) || matchesTag;
        });
    }

    if (typeof renderHistoryTagsUI === 'function') {
        renderHistoryTagsUI(monthId, filteredTxs);
    }

    filteredTxs.sort((a, b) => {
        if ((a.status === 'pending') !== (b.status === 'pending')) return a.status === 'pending' ? -1 : 1;
        return b.id - a.id;
    });

    if (countBadge) {
        countBadge.innerText = filteredTxs.length;
    }

    listEl.innerHTML = '';

    if (projBox) {
        const pendingTxs = financeData.transactions.filter(t => t.monthId === monthId && t.status === 'pending');
        if (projectionData) {
            projBox.classList.remove('hidden');
            const deltaLiq = round2(projectionData.projectedLiquidity - projectionData.currentLiquidity);
            projBox.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <strong style="color:var(--accent); font-size:13.5px; display:inline-flex; align-items:center; gap:6px; margin-bottom:0;">${renderIcon('trending-up', 15)} Proyección Realista Híbrida</strong>
                    <span class="widget-badge" style="font-size:9.5px;">+${projectionData.monthsDiff}m</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:11.5px; color:var(--text-muted); margin-bottom:2px;">
                    <span>Flujo Neto Estimado:</span>
                    <b class="${projectionData.avgCashFlow >= 0 ? 'positive' : 'negative'}">${projectionData.avgCashFlow >= 0 ? '+' : ''}${formatMoney(projectionData.avgCashFlow)}/mes</b>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12.5px; padding-top:6px; border-top:1px dashed rgba(139,92,246,0.3);">
                    <span style="color:var(--text-main); font-weight:700;">Liquidez Proyectada:</span>
                    <strong class="${projectionData.projectedLiquidity >= 0 ? 'positive' : 'negative'}">${formatMoney(projectionData.projectedLiquidity)}</strong>
                </div>
                <details class="changelog-accordion" style="margin-top:10px; background:transparent; border:1px solid color-mix(in srgb, var(--accent) 20%, transparent); padding:8px 10px; box-shadow:none;">
                    <summary style="font-size:10.5px; color:var(--accent); font-weight:700;"><span style="display:inline-flex; align-items:center; gap:6px;">${renderIcon('calculator', 14)} Ver fórmula de cálculo</span> <span>▾</span></summary>
                    <div style="margin-top:8px; font-size:10.5px; color:var(--text-muted); display:flex; flex-direction:column; gap:4px;">
                        <div style="display:flex; justify-content:space-between;"><span>Prom. Ingresos (Presup. + Nómina):</span><b class="positive">${formatMoney(projectionData.avgIncome)}</b></div>
                        <div style="display:flex; justify-content:space-between;"><span>(-) Prom. Egresos (Presup. + Deudas):</span><b class="negative">-${formatMoney(projectionData.avgExpense)}</b></div>
                        <div style="display:flex; justify-content:space-between; border-top:1px dashed rgba(148,163,184,0.3); padding-top:3px;"><span>Flujo Neto Resultante:</span><b class="${projectionData.avgCashFlow >= 0 ? 'positive' : 'negative'}">${formatMoney(projectionData.avgCashFlow)} / mes</b></div>
                        <div style="margin:4px 0; border-top:1px solid rgba(148,163,184,0.1);"></div>
                        <div style="display:flex; justify-content:space-between;"><span>Liquidez Disponible Hoy:</span><b>${formatMoney(projectionData.currentLiquidity)}</b></div>
                        <div style="display:flex; justify-content:space-between;"><span>(±) Flujo acumulado (${projectionData.monthsDiff} meses):</span><b class="${deltaLiq >= 0 ? 'positive' : 'negative'}">${deltaLiq >= 0 ? '+' : ''}${formatMoney(deltaLiq)}</b></div>
                        <div style="display:flex; justify-content:space-between; border-top:1px dashed rgba(148,163,184,0.3); padding-top:3px; color:var(--text-main); font-weight:700;"><span>Total Proyectado:</span><b class="${projectionData.projectedLiquidity >= 0 ? 'positive' : 'negative'}">${formatMoney(projectionData.projectedLiquidity)}</b></div>
                    </div>
                </details>
            `;
        } else if (pendingTxs.length > 0 && !historySearchQuery && (typeof activeHistoryFilter === 'undefined' || activeHistoryFilter === 'all' || activeHistoryFilter === 'pending')) {
            let pInc = 0, pExp = 0;
            pendingTxs.forEach(p => {
                const v = round2(p.budgetedAmount || p.amount);
                if (p.type === 'income') pInc += v;
                else if (p.type === 'expense') pExp += v;
            });
            const flow = getMonthlyFlow(monthId, false);
            const projNet = round2(flow.net + pInc - pExp);
            projBox.classList.remove('hidden');
            projBox.innerHTML = `
                <div style="display:flex; justify-content:space-between;"><span>Balance realizado:</span><b class="${flow.net >= 0 ? 'positive' : 'negative'}">${formatMoney(flow.net)}</b></div>
                <div style="display:flex; justify-content:space-between; margin-top:2px;"><span>Si confirmas pendientes:</span><b class="${projNet >= 0 ? 'positive' : 'negative'}">${formatMoney(projNet)}</b></div>
            `;
        } else {
            projBox.classList.add('hidden');
        }
    }

    if (filteredTxs.length === 0) {
        listEl.innerHTML = `<li style="text-align:center; padding:18px; color:var(--text-muted); font-size:13px;">${historySearchQuery ? 'No se encontraron coincidencias.' : 'No hay movimientos registrados.'}</li>`;
        return;
    }

    let listHtml = '';
    filteredTxs.forEach(t => {
        const isPending = t.status === 'pending';
        let sign = '', colorClass = '', iconClass = '';
        const accObj = getAccountObj(t.account);
        let accInfo = stripLeadingEmoji(accObj.name);
        
        let categoryDisplay = '';

        if (t.type === 'income') { sign = '+'; colorClass = 'positive'; iconClass = 'positive-bg'; }
        else if (t.type === 'expense') { sign = '-'; colorClass = 'negative'; iconClass = 'negative-box'; }
        else { sign = ''; colorClass = 'accent'; iconClass = 'accent-box'; accInfo = `${stripLeadingEmoji(accObj.name)} ➔ ${stripLeadingEmoji(getAccountObj(t.toAccount).name)}`; }

        if (t.type !== 'transfer') {
            categoryDisplay = t.subcategory && t.subcategory !== 'General' 
                ? `${cleanCatName(t.category)} <span style="opacity:0.75; font-weight:500;">(${cleanCatName(t.subcategory)})</span>` 
                : cleanCatName(t.category || '');
        } else {
            categoryDisplay = 'Transferencia';
        }

        let badgesHtml = '';
        if (isPending) {
            badgesHtml += `<div style="color:#d97706; font-weight:700; margin-top:4px; font-size:11px; display:flex; align-items:center; gap:4px;">${renderIcon('clock', 12)} Pendiente</div>`;
        }
        
        if (t.budgetedAmount && t.budgetedAmount > 0 && t.type !== 'transfer') {
            const variance = calculateBudgetVariance(t.type, t.amount, t.budgetedAmount);
            if (variance.hasBudget) {
                const signDiff = variance.diff > 0 ? '+' : '';
                const signPct = variance.pct > 0 ? '+' : '';
                const colorVar = variance.isFavorable ? 'var(--positive)' : 'var(--negative)';
                badgesHtml += `<div style="color:${colorVar}; font-weight:600; margin-top:4px; font-size:11px;">Ptto: ${formatMoney(t.budgetedAmount)} • Dif: ${signDiff}${formatMoney(variance.diff)} (${signPct}${String(variance.pct).replace('.', ',')}%)</div>`;
            }
        }
        
        if (t.type === 'expense' && t.installments && t.installments > 1) {
            badgesHtml += `<div style="color:var(--text-muted); font-weight:600; margin-top:4px; font-size:11px; display:flex; align-items:center; gap:4px;">${renderIcon('card', 12)} Cuotas: ${t.paidInstallments || 0}/${t.installments}</div>`;
        }

        if (Array.isArray(t.tags) && t.tags.length > 0) {
            const pills = t.tags.map(tg => `<span class="tx-tag-pill" onclick="filterByTxTag('${tg}', event)">#${tg}</span>`).join('');
            badgesHtml += `<div class="tx-tags-row">${pills}</div>`;
        }

        const baseAmt = isPending ? round2(t.budgetedAmount || t.amount) : round2(t.amount);
        const btnLabel = t.isVirtual ? 'Gestionar ➔' : '✓ Confirmar';
        const confirmBtnHtml = isPending ? `<button type="button" class="btn-confirm-pending" data-action="confirm-tx" data-id="${t.id}" style="margin-top:8px;">${btnLabel}</button>` : '';
        const catIcon = getCategoryIcon(t.category, t.type);
        const accIcon = getAccountIcon(accObj.category);
        
        const isSelectedInBatch = isBatchSelectMode && selectedBatchIds.has(String(t.id));
        let itemHighlightStyle = '';
        if (t.isCleared) {
            itemHighlightStyle = 'background-color: var(--positive-bg); border-color: rgba(16, 185, 129, 0.3);';
        } else if (isSelectedInBatch) {
            itemHighlightStyle = 'background-color: color-mix(in srgb, var(--accent) 8%, var(--card-bg)); border-color: var(--accent);';
        }

        const showBatchBox = isBatchSelectMode && !isClearModeActive && !t.isVirtual;
        const checkboxHtml = showBatchBox
            ? `<div style="margin-right:8px; margin-top:4px; display:flex; align-items:center; flex-shrink:0;">
                 <input type="checkbox" class="tx-batch-check" value="${t.id}" ${isSelectedInBatch ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--accent); cursor:pointer;">
               </div>`
            : '';

        const itemPadding = showBatchBox ? '12px 12px' : '14px 16px';
        const iconBoxStyle = showBatchBox
            ? 'width:30px; height:30px; border-radius:9px; margin-right:9px; margin-top:2px; flex-shrink:0;'
            : 'margin-right:12px; margin-top:2px; flex-shrink:0;';

        listHtml += `
        <li class="history-item ${isPending ? 'pending-item' : ''}" data-action="edit-tx" data-id="${t.id}" style="align-items:flex-start; padding:${itemPadding}; ${itemHighlightStyle}">
            ${checkboxHtml}
            <div class="drawer-icon-box ${iconClass}" style="${iconBoxStyle}">
                ${t.type === 'transfer' ? renderIcon('transfer', showBatchBox ? 14 : 16) : catIcon}
            </div>
            <div class="history-info" style="display:flex; flex-direction:column; gap:4px; flex: 1 1 auto; min-width: 0;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
                    <strong style="font-size:14px; line-height:1.2; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${stripLeadingEmoji(t.description)}</strong>
                    <div class="history-amount ${colorClass}" style="text-align:right; font-size:14.5px; font-weight:800; white-space:nowrap; flex-shrink: 0;">
                        ${sign}${formatMoneyHtml(baseAmt)}
                    </div>
                </div>
                <span style="font-size:11.5px; color:var(--text-muted); font-weight:700; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${categoryDisplay}</span>
                <span style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--text-muted); line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    <span style="display:inline-flex; opacity:0.75; color:var(--text-main);">${accIcon}</span> 
                    <span>${accInfo}</span>
                </span>
                <span style="font-size:10.5px; color:var(--text-muted); opacity:0.85;">${t.date}</span>
                ${badgesHtml}
                ${confirmBtnHtml ? `<div style="text-align:right;">${confirmBtnHtml}</div>` : ''}
            </div>
        </li>`;
    });
    
    listEl.innerHTML = listHtml;
    
    const clearBanner = document.getElementById('clear-mode-banner');
    if (clearBanner && typeof isClearModeActive !== 'undefined' && isClearModeActive) {
        const clearedCount = filteredTxs.filter(t => t.isCleared).length;
        document.getElementById('clear-mode-count').innerText = `${clearedCount} / ${filteredTxs.length}`;
    }

    ensureBatchSelectToggleBtn();
    syncBatchActionsToolbar();
};

let isBatchSelectMode = false;
const selectedBatchIds = new Set();

const setBatchSelectMode = (active, initialId = null) => {
    isBatchSelectMode = !!active;
    if (!isBatchSelectMode) {
        selectedBatchIds.clear();
    } else {
        if (isClearModeActive) {
            isClearModeActive = false;
            document.getElementById('btn-toggle-clear-mode')?.classList.remove('active');
            document.getElementById('clear-mode-banner')?.classList.add('hidden');
        }
        if (initialId) selectedBatchIds.add(String(initialId));
    }
    updateDashboard();
};

const ensureBatchSelectToggleBtn = () => {
    const countBadge = document.getElementById('history-count-badge');
    if (!countBadge || !countBadge.parentElement) return;

    let btn = document.getElementById('btn-toggle-batch-select');
    if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'btn-toggle-batch-select';
        btn.className = 'mini-action-btn';
        btn.style.cssText = 'font-size:11px; padding:4px 9px; margin-right:6px;';
        countBadge.parentElement.insertBefore(btn, countBadge);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            setBatchSelectMode(!isBatchSelectMode);
        });
    }

    btn.innerText = isBatchSelectMode ? 'Cancelar' : 'Seleccionar';
    btn.classList.toggle('active', isBatchSelectMode);
};

const syncBatchActionsToolbar = () => {
    let toolbar = document.getElementById('batch-actions-toolbar');
    if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.id = 'batch-actions-toolbar';
        toolbar.className = 'hidden';
        toolbar.style.cssText = 'position:fixed; bottom:calc(88px + env(safe-area-inset-bottom, 0px)); left:50%; transform:translateX(-50%); z-index:1500; background:var(--card-bg); border:1.5px solid var(--accent-border); border-radius:18px; padding:10px 14px; box-shadow:0 12px 32px rgba(0,0,0,0.22); display:flex; align-items:center; justify-content:space-between; gap:10px; width:calc(100% - 32px); max-width:400px;';
        
        toolbar.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                <button type="button" id="btn-batch-close" style="background:none; border:none; color:var(--text-muted); font-size:16px; font-weight:800; cursor:pointer; padding:4px 6px;">✕</button>
                <div style="display:flex; flex-direction:column; line-height:1.2;">
                    <strong id="batch-count-label" style="font-size:13.5px; font-weight:800; color:var(--text-main);">0 selec.</strong>
                    <button type="button" id="btn-batch-select-all" style="background:none; border:none; padding:0; text-align:left; font-size:10.5px; color:var(--accent); font-weight:700; cursor:pointer;">Marcar todos</button>
                </div>
            </div>
            <button type="button" id="btn-batch-delete" class="btn" style="background:rgba(239, 68, 68, 0.12); color:var(--negative); border:1px solid rgba(239, 68, 68, 0.28); font-size:12.5px; font-weight:800; padding:8px 14px; border-radius:12px; display:inline-flex; align-items:center; gap:6px; flex-shrink:0;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Borrar
            </button>
        `;
        document.body.appendChild(toolbar);

        toolbar.querySelector('#btn-batch-close').addEventListener('click', () => {
            setBatchSelectMode(false);
        });

        toolbar.querySelector('#btn-batch-select-all').addEventListener('click', () => {
            const visibleChecks = Array.from(document.querySelectorAll('#transaction-list .tx-batch-check'));
            const allSelected = visibleChecks.length > 0 && visibleChecks.every(c => selectedBatchIds.has(String(c.value)));
            if (allSelected) {
                selectedBatchIds.clear();
            } else {
                visibleChecks.forEach(c => selectedBatchIds.add(String(c.value)));
            }
            updateDashboard();
        });

        toolbar.querySelector('#btn-batch-delete').addEventListener('click', () => {
            const selectedIds = Array.from(selectedBatchIds);
            if (selectedIds.length === 0) return;
            
            if (typeof openSafeDeleteModal === 'function') {
                openSafeDeleteModal(
                    `${selectedIds.length} Movimiento${selectedIds.length !== 1 ? 's' : ''}`,
                    [
                        `Se enviarán a la Papelera de Reciclaje.`,
                        `Se ajustarán los saldos y presupuestos.`,
                        `Los intereses y cuotas asociadas también se borrarán.`
                    ],
                    () => {
                        selectedIds.forEach(id => moveTxToTrash(id));
                        setBatchSelectMode(false);
                    }
                );
            } else {
                if (confirm(`¿Mover ${selectedIds.length} movimiento(s) a la papelera?`)) {
                    selectedIds.forEach(id => moveTxToTrash(id));
                    setBatchSelectMode(false);
                }
            }
        });
    }

    if (isBatchSelectMode && selectedBatchIds.size > 0) {
        toolbar.classList.remove('hidden');
        toolbar.style.display = 'flex';
        const count = selectedBatchIds.size;
        document.getElementById('batch-count-label').innerText = `${count} selec.`;
        const visibleChecks = document.querySelectorAll('#transaction-list .tx-batch-check');
        const allSelected = visibleChecks.length > 0 && visibleChecks.length === count;
        const selAllBtn = document.getElementById('btn-batch-select-all');
        if (selAllBtn) selAllBtn.innerText = allSelected ? 'Desmarcar todos' : 'Marcar todos';
    } else {
        toolbar.classList.add('hidden');
        toolbar.style.display = 'none';
    }
};

let isClearModeActive = false;
document.getElementById('btn-toggle-clear-mode')?.addEventListener('click', (e) => {
    isClearModeActive = !isClearModeActive;
    if (isClearModeActive && isBatchSelectMode) {
        isBatchSelectMode = false;
        selectedBatchIds.clear();
    }
    e.target.closest('button').classList.toggle('active', isClearModeActive);
    const clearBanner = document.getElementById('clear-mode-banner');
    if (clearBanner) clearBanner.classList.toggle('hidden', !isClearModeActive);
    updateDashboard(); 
});

// Mantener pulsado un movimiento (450ms) activa la selección múltiple al instante
let txLongPressTimer = null;
let txLongPressTriggered = false;

document.getElementById('transaction-list')?.addEventListener('touchstart', (e) => {
    const item = e.target.closest('.history-item[data-action="edit-tx"]');
    if (!item || isBatchSelectMode || isClearModeActive) return;
    const txId = item.getAttribute('data-id');
    if (!txId || String(txId).startsWith('v_')) return;

    txLongPressTriggered = false;
    txLongPressTimer = setTimeout(() => {
        txLongPressTriggered = true;
        setBatchSelectMode(true, txId);
    }, 450);
}, { passive: true });

['touchmove', 'touchend', 'touchcancel'].forEach(evt => {
    document.getElementById('transaction-list')?.addEventListener(evt, () => {
        if (txLongPressTimer) {
            clearTimeout(txLongPressTimer);
            txLongPressTimer = null;
        }
    }, { passive: true });
});

document.getElementById('transaction-list')?.addEventListener('click', (e) => {
    if (txLongPressTriggered) {
        txLongPressTriggered = false;
        return;
    }

    const isCheckbox = e.target.closest('.tx-batch-check');
    if (isCheckbox) {
        const id = String(isCheckbox.value);
        if (isCheckbox.checked) selectedBatchIds.add(id);
        else selectedBatchIds.delete(id);
        updateDashboard();
        return;
    }

    const confirmBtn = e.target.closest('.btn-confirm-pending[data-action="confirm-tx"]');
    if (confirmBtn && !isBatchSelectMode) {
        e.stopPropagation();
        const txId = confirmBtn.getAttribute('data-id');
        
        if (String(txId).startsWith('v_sub_')) {
            if (typeof processSubscriptionPayment === 'function') processSubscriptionPayment(txId.replace('v_sub_', ''));
            return;
        }
        if (String(txId).startsWith('v_debt_')) {
            if (typeof openAccountDetail === 'function') openAccountDetail(txId.replace('v_debt_', ''), 'home');
            document.getElementById('open-pay-installment-btn')?.click();
            return;
        }
        if (String(txId).startsWith('v_card_')) {
            if (typeof openAccountDetail === 'function') openAccountDetail(txId.replace('v_card_', ''), 'home');
            return;
        }
        if (String(txId).startsWith('v_budget_')) {
            if (typeof openOmniModal === 'function') openOmniModal({ type: 'expense', title: 'Pagar Gasto Fijo' });
            return;
        }
        
        confirmPendingTx(txId, e);
        return;
    }

    const historyItem = e.target.closest('.history-item[data-action="edit-tx"]');
    if (historyItem) {
        const txId = String(historyItem.getAttribute('data-id'));
        
        if (isBatchSelectMode) {
            if (txId.startsWith('v_')) return;
            if (selectedBatchIds.has(txId)) selectedBatchIds.delete(txId);
            else selectedBatchIds.add(txId);
            updateDashboard();
            return;
        }

        if (isClearModeActive) {
            const tx = financeData.transactions.find(t => String(t.id) === txId);
            if (tx) {
                tx.isCleared = !tx.isCleared;
                localStorage.setItem('myFinances', JSON.stringify(financeData));
                updateDashboard(); 
            }
        } else {
            if (typeof attemptCloseModals === 'function' && attemptCloseModals()) openEditModal(txId);
        }
    }
});

document.getElementById('history-search-input')?.addEventListener('input', (e) => {
    historySearchQuery = e.target.value.trim();
    updateDashboard();
});

document.querySelectorAll('.pill-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-btn[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeHistoryFilter = btn.getAttribute('data-filter');
        updateDashboard();
    });
});
// ==========================================
// MÓDULO GMF (4x1000): ALERTA EN GASTOS/TRANSFERENCIAS Y ONBOARDING
// ==========================================
const renderTransactionGmfPreview = () => {
    const box = document.getElementById('tx-gmf-impact-box');
    if (!box) return;

    const editId = document.getElementById('edit-id')?.value;
    const type = document.getElementById('type')?.value || 'expense';
    const accountId = document.getElementById('account')?.value || '';
    const toAccountId = document.getElementById('to-account')?.value || '';
    const rawAmt = parseMoneyInput(document.getElementById('amount')?.value);

    // Convertir moneda si el usuario está registrando en USD/EUR
    const rate = (typeof activeTxCurrency !== 'undefined' && activeTxCurrency !== 'COP')
        ? ((financeData.exchangeRates && financeData.exchangeRates[activeTxCurrency]) || (activeTxCurrency === 'USD' ? 4150 : 4420))
        : 1;
    const amountCop = round2(rawAmt * rate);

    if (editId || amountCop <= 0 || (type !== 'expense' && type !== 'transfer') || typeof calculateTransactionGmf !== 'function') {
        box.classList.add('hidden');
        box.innerHTML = '';
        return;
    }

    const sameBankCheck = document.getElementById('tx-same-bank-transfer');
    const isSameBank = type === 'transfer' && !!sameBankCheck?.checked;

    const dateVal = document.getElementById('trans-date')?.value;
    const dateObj = dateVal ? new Date(`${dateVal}T12:00:00`) : new Date();

    const gmf = calculateTransactionGmf({
        accountId,
        amount: amountCop,
        type,
        toAccountId,
        isSameBank,
        dateObj
    });

    if (!gmf.applies) {
        box.classList.add('hidden');
        box.innerHTML = '';
        return;
    }

    const toAcc = type === 'transfer' ? getAccountObj(toAccountId) : null;
    const showSameBankOption = type === 'transfer' && toAcc && toAcc.category === 'asset' && toAcc.id !== 'Efectivo' && !String(toAcc.id).startsWith('CxC_');

    if (gmf.gmfAmount <= 0 && !showSameBankOption) {
        box.classList.add('hidden');
        box.innerHTML = '';
        return;
    }

    const totalDebit = round2(amountCop + gmf.gmfAmount);
    const reasonText = gmf.isExempt
        ? `Excede tu tope mensual exento de ${gmf.capUvt} UVT (${formatMoney(gmf.monthlyCapCop)}). Se grava el excedente de ${formatMoney(gmf.taxableAmount)}.`
        : `Esta cuenta no está marcada como exenta del 4x1000 (0,4%).`;

    const prevChecked = document.getElementById('tx-apply-gmf-check')?.checked !== false;

    box.classList.remove('hidden');
    box.innerHTML = `
        ${gmf.gmfAmount > 0 ? `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px;">
                <span style="display:inline-flex; align-items:center; gap:6px; font-weight:800; color:#d97706; font-size:12px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Impuesto 4x1000 (GMF):</span>
                </span>
                <strong class="negative" style="font-size:13px; white-space:nowrap;">+ ${formatMoney(gmf.gmfAmount)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; margin-bottom:6px; padding-bottom:6px; border-bottom:1px dashed rgba(245, 158, 11, 0.3);">
                <span style="color:var(--text-muted);">Total real a debitar de la cuenta:</span>
                <strong style="color:var(--text-main);">${formatMoney(totalDebit)}</strong>
            </div>
            <small style="display:block; font-size:10.5px; color:var(--text-muted); line-height:1.35; margin-bottom:7px;">${reasonText}</small>
            <label style="display:flex; align-items:center; gap:7px; font-size:11px; font-weight:700; color:var(--text-main); cursor:pointer;">
                <input type="checkbox" id="tx-apply-gmf-check" ${prevChecked ? 'checked' : ''} style="width:15px; height:15px; accent-color:#d97706;">
                <span>Debitar y registrar el 4x1000 automáticamente</span>
            </label>
        ` : ''}
        ${showSameBankOption ? `
            <label style="display:flex; align-items:center; gap:7px; font-size:11px; font-weight:600; color:var(--text-muted); cursor:pointer; ${gmf.gmfAmount > 0 ? 'margin-top:7px; padding-top:7px; border-top:1px dashed rgba(245, 158, 11, 0.25);' : ''}">
                <input type="checkbox" id="tx-same-bank-transfer" ${isSameBank ? 'checked' : ''} style="width:15px; height:15px; accent-color:var(--accent);">
                <span>Mismo banco y mismo titular (Exenta de 4x1000)</span>
            </label>
        ` : ''}
    `;

    box.querySelector('#tx-same-bank-transfer')?.addEventListener('change', renderTransactionGmfPreview);
};

['amount', 'account', 'to-account', 'type', 'trans-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', renderTransactionGmfPreview);
        el.addEventListener('change', renderTransactionGmfPreview);
    }
});

document.querySelectorAll('#tx-currency-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(renderTransactionGmfPreview, 20));
});

const gmfTxModal = document.getElementById('transaction-modal');
if (gmfTxModal) {
    new MutationObserver(() => {
        if (!gmfTxModal.classList.contains('hidden')) {
            setTimeout(renderTransactionGmfPreview, 40);
        }
    }).observe(gmfTxModal, { attributes: true, attributeFilter: ['class'] });
}

// Registro automático del débito 4x1000 al guardar el gasto o transferencia
let pendingTxGmfPayload = null;

document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'transaction-form') {
        pendingTxGmfPayload = null;
        const editId = document.getElementById('edit-id')?.value;
        const status = document.getElementById('trans-status')?.value || 'closed';
        const type = document.getElementById('type')?.value || 'expense';
        const applyCheck = document.getElementById('tx-apply-gmf-check');

        if (!editId && status === 'closed' && (type === 'expense' || type === 'transfer') && applyCheck?.checked) {
            const accountId = document.getElementById('account')?.value || '';
            const toAccountId = document.getElementById('to-account')?.value || '';
            const isSameBank = type === 'transfer' && !!document.getElementById('tx-same-bank-transfer')?.checked;
            const amountCop = parseMoneyInput(document.getElementById('amount')?.value);
            const dateVal = document.getElementById('trans-date')?.value;
            const timeVal = document.getElementById('trans-time')?.value || '12:00';
            const dateObj = dateVal ? new Date(`${dateVal}T${timeVal}`) : new Date();

            const gmf = calculateTransactionGmf({ accountId, amount: amountCop, type, toAccountId, isSameBank, dateObj });
            if (gmf.gmfAmount > 0) {
                pendingTxGmfPayload = {
                    accountId,
                    gmfAmount: gmf.gmfAmount,
                    desc: stripLeadingEmoji(document.getElementById('description')?.value || 'Movimiento').trim(),
                    dateObj,
                    beforeCount: financeData.transactions.length
                };
            }
        }
    }
}, true);

document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'transaction-form' && pendingTxGmfPayload) {
        const payload = pendingTxGmfPayload;
        pendingTxGmfPayload = null;
        if (!document.getElementById('transaction-modal')?.classList.contains('hidden')) return;

        if (financeData.transactions.length > payload.beforeCount) {
            const taxCat = (financeData.categories?.expense || []).find(c => /impuesto|bancari|financiero/i.test(c.name));
            const catName = taxCat ? taxCat.name : 'Impuestos / 4x1000';
            const dObj = payload.dateObj;

            financeData.transactions.push({
                id: dObj.getTime() + 777,
                monthId: getMonthId(dObj),
                type: 'expense',
                status: 'closed',
                account: payload.accountId,
                category: catName,
                subcategory: '4x1000 (GMF)',
                description: `4x1000 (GMF): ${payload.desc}`,
                amount: payload.gmfAmount,
                date: `${dObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${dObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
                isAdjustment: false,
                isGmfTax: true
            });

            localStorage.setItem('myFinances', JSON.stringify(financeData));
            updateDashboard();
        }
    }
}, false);

// ==========================================
// MODAL DE BIENVENIDA: CONFIGURACIÓN INICIAL 4x1000
// ==========================================
window.openGmfWelcomeModal = () => {
    if (typeof hasAnyGmfConfiguredAccount === 'function' && hasAnyGmfConfiguredAccount()) return;

    const bankAssets = (financeData.customAccounts || []).filter(
        a => a.category === 'asset' && a.id !== 'Efectivo' && !String(a.id).startsWith('CxC_') && a.accountSubType !== 'cash'
    );
    if (bankAssets.length === 0) return;

    let modalEl = document.getElementById('gmf-welcome-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'gmf-welcome-modal';
        modalEl.className = 'modal hidden';
        modalEl.style.zIndex = '1450';
        document.body.appendChild(modalEl);
    }

    const uvt = round2((typeof getTaxParams === 'function' ? getTaxParams().uvt : 52374) || 52374);
    const cap350 = formatMoney(round2(350 * uvt));
    const cap65 = formatMoney(round2(65 * uvt));

    const rowsHtml = bankAssets.map((acc, idx) => {
        const defaultSub = acc.accountSubType || (/nequi|daviplata|dale|movii|rappipay|uala/i.test(acc.name) ? 'wallet' : 'savings');
        return `
            <div class="glass-sub-box" style="padding:10px 12px; margin-bottom:8px; border-color:var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <strong style="font-size:13px; color:var(--text-main);">${stripLeadingEmoji(acc.name)}</strong>
                    <select class="gmf-welcome-subtype" data-acc-id="${acc.id}" style="width:auto; min-width:155px; padding:5px 8px; font-size:11px; border-radius:9px;">
                        <option value="savings" ${defaultSub === 'savings' ? 'selected' : ''}>Cuenta de Ahorros</option>
                        <option value="wallet" ${defaultSub === 'wallet' ? 'selected' : ''}>Billetera (65 UVT)</option>
                        <option value="checking" ${defaultSub === 'checking' ? 'selected' : ''}>Cuenta Corriente</option>
                        <option value="cash" ${defaultSub === 'cash' ? 'selected' : ''}>Efectivo</option>
                    </select>
                </div>
                <label class="gmf-welcome-radio-row" data-acc-id="${acc.id}" style="display:flex; align-items:center; gap:8px; font-size:11.5px; color:var(--text-muted); cursor:pointer; margin-top:8px;">
                    <input type="radio" name="gmf-welcome-exempt-choice" value="${acc.id}" ${idx === 0 && defaultSub === 'savings' ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--positive);">
                    <span>Marcar como mi cuenta exenta (350 UVT / mes)</span>
                </label>
                <div class="gmf-welcome-wallet-badge hidden" data-acc-id="${acc.id}" style="margin-top:7px; font-size:11px; color:var(--positive); font-weight:600; display:flex; align-items:center; gap:5px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Exenta por ley hasta 65 UVT/mes sin gastar tu marca</span>
                </div>
            </div>
        `;
    }).join('');

    modalEl.innerHTML = `
        <div class="modal-content" style="max-width:450px; max-height:88dvh; display:flex; flex-direction:column; overflow:hidden; padding:0;">
            <div style="padding:18px 18px 12px 18px; border-bottom:1px solid var(--border-color); flex-shrink:0;">
                <span class="widget-badge" style="font-size:10px; margin-bottom:6px; display:inline-block;">Novedad en Mis Finanzas</span>
                <h2 style="margin:0; font-size:18px; font-weight:800;">Configura tu exención del 4x1000</h2>
                <small style="color:var(--text-muted); font-size:11.5px; display:block; margin-top:3px; line-height:1.35;">
                    Ahora calculamos automáticamente el impuesto GMF (0,4%) cuando pagas desde cuentas no exentas.
                </small>
            </div>

            <div style="flex:1; overflow-y:auto; padding:14px 18px 18px 18px; -webkit-overflow-scrolling:touch;">
                <details class="changelog-accordion" open style="width:100%; display:block; box-sizing:border-box; margin-bottom:14px; background:rgba(245, 158, 11, 0.07); border:1px solid rgba(245, 158, 11, 0.28); border-radius:14px; padding:11px 12px; box-shadow:none;">
                    <summary style="display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:800; color:#d97706; cursor:pointer;">
                        <span style="display:inline-flex; align-items:center; gap:7px;">
                            <span style="width:22px; height:22px; border-radius:7px; background:rgba(245, 158, 11, 0.16); display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            </span>
                            <span>Reglas y cálculo del 4x1000 (GMF)</span>
                        </span>
                        <span style="font-size:11px; opacity:0.85;">▾</span>
                    </summary>

                    <div style="margin-top:10px; padding-top:10px; border-top:1px dashed rgba(245, 158, 11, 0.3); display:flex; flex-direction:column; gap:8px;">
                        <!-- Tarjeta de reglas legales -->
                        <div style="background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:11px; padding:10px 11px; display:flex; flex-direction:column; gap:9px; font-size:11.5px; color:var(--text-muted); line-height:1.4;">
                            <div style="display:flex; align-items:flex-start; gap:8px;">
                                <span style="width:18px; height:18px; border-radius:50%; background:rgba(245, 158, 11, 0.16); color:#d97706; font-size:10px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;">1</span>
                                <div><strong style="color:var(--text-main);">Cuenta de Ahorros Exenta (350 UVT/mes):</strong> Puedes marcar <b>1 única cuenta</b> exenta hasta <b style="color:var(--text-main); white-space:nowrap;">${cap350}/mes</b>. Solo pagas 4x1000 sobre el dinero que supere ese tope.</div>
                            </div>
                            <div style="display:flex; align-items:flex-start; gap:8px; padding-top:8px; border-top:1px dashed var(--border-color);">
                                <span style="width:18px; height:18px; border-radius:50%; background:rgba(245, 158, 11, 0.16); color:#d97706; font-size:10px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;">2</span>
                                <div><strong style="color:var(--text-main);">Billeteras Bajo Monto (65 UVT/mes):</strong> Cuentas como Nequi o DaviPlata tienen <b style="color:var(--text-main); white-space:nowrap;">${cap65}/mes</b> exentos por ley sin gastar tu marca de 350 UVT.</div>
                            </div>
                            <div style="display:flex; align-items:flex-start; gap:8px; padding-top:8px; border-top:1px dashed var(--border-color);">
                                <span style="width:18px; height:18px; border-radius:50%; background:rgba(245, 158, 11, 0.16); color:#d97706; font-size:10px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;">3</span>
                                <div><strong style="color:var(--text-main);">Operaciones sin impuesto:</strong> Recibir dinero, usar <b>Efectivo</b> o transferir entre tus propias cuentas del <b>mismo banco</b> no genera 4x1000.</div>
                            </div>
                        </div>

                        <!-- Tarjeta de explicación de cálculo -->
                        <div style="background:var(--card-inner-bg); border:1px solid color-mix(in srgb, var(--accent) 28%, var(--border-color)); border-radius:11px; padding:10px 11px;">
                            <div style="margin-bottom:8px;">
                                <strong style="font-size:11.5px; color:var(--text-main); display:inline-flex; align-items:center; gap:6px;">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
                                    <span>¿Cómo se calcula? <span style="white-space:nowrap;">(0,4% = $4 por cada $1.000)</span></span>
                                </strong>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:5px; font-size:11px; color:var(--text-muted); margin-bottom:9px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                    <span>Fórmula legal:</span>
                                    <b style="color:var(--text-main); white-space:nowrap;">Valor gravado × 0,004</b>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                    <span>Ejemplo pago (cuenta no exenta):</span>
                                    <b style="color:var(--text-main); white-space:nowrap;">$ 1.000.000</b>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                    <span>Impuesto 4x1000 (0,4%):</span>
                                    <b class="negative" style="white-space:nowrap;">+$ 4.000</b>
                                </div>
                            </div>

                            <div style="background:rgba(16, 185, 129, 0.1); border:1px dashed rgba(16, 185, 129, 0.35); border-radius:8px; padding:7px 10px; display:flex; flex-direction:column; gap:3px; font-size:11.5px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                    <span style="color:var(--text-main); font-weight:600;">Total debitado de tu cuenta:</span>
                                    <strong style="color:var(--text-main); font-size:12.5px; white-space:nowrap;">$ 1.004.000</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:10.5px; color:var(--text-muted);">
                                    <span>En cuenta exenta (dentro del tope UVT):</span>
                                    <b class="positive" style="white-space:nowrap;">$ 0 de impuesto</b>
                                </div>
                            </div>
                        </div>
                    </div>
                </details>

                ${rowsHtml}

                <div style="display:flex; flex-direction:column; gap:8px; margin-top:14px;">
                    <button type="button" id="btn-save-gmf-welcome" class="btn btn-primary" style="width:100%;">Guardar mi cuenta exenta</button>
                    <button type="button" id="btn-none-gmf-welcome" class="btn btn-secondary" style="width:100%; font-size:12px;">Ninguna está exenta (todas pagan 4x1000)</button>
                    <button type="button" id="btn-later-gmf-welcome" style="background:none; border:none; color:var(--text-muted); font-size:11.5px; padding:6px; cursor:pointer;">Recordármelo después</button>
                </div>
            </div>
        </div>
    `;

    modalEl.querySelectorAll('.gmf-welcome-subtype').forEach(sel => {
        sel.addEventListener('change', () => {
            const accId = sel.getAttribute('data-acc-id');
            const row = modalEl.querySelector(`.gmf-welcome-radio-row[data-acc-id="${accId}"]`);
            const walletBadge = modalEl.querySelector(`.gmf-welcome-wallet-badge[data-acc-id="${accId}"]`);
            const radio = row?.querySelector('input[type="radio"]');
            const isSavings = sel.value === 'savings';
            const isWallet = sel.value === 'wallet';

            if (row) row.classList.toggle('hidden', !isSavings);
            if (walletBadge) {
                walletBadge.classList.toggle('hidden', !isWallet);
                walletBadge.style.display = isWallet ? 'flex' : 'none';
            }
            if (!isSavings && radio) radio.checked = false;
        });
        sel.dispatchEvent(new Event('change'));
    });

    modalEl.querySelector('#btn-save-gmf-welcome')?.addEventListener('click', () => {
        const selectedExemptId = modalEl.querySelector('input[name="gmf-welcome-exempt-choice"]:checked')?.value || '';
        modalEl.querySelectorAll('.gmf-welcome-subtype').forEach(sel => {
            const accId = sel.getAttribute('data-acc-id');
            const acc = financeData.customAccounts.find(a => a.id === accId);
            if (acc) {
                acc.accountSubType = sel.value;
                acc.gmfExempt = (acc.id === selectedExemptId) && (sel.value === 'savings' || sel.value === 'wallet');
                acc.gmfReviewed = true;
            }
        });
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        modalEl.classList.add('hidden');
        if (typeof updateDashboard === 'function') updateDashboard();
    });

    modalEl.querySelector('#btn-none-gmf-welcome')?.addEventListener('click', () => {
        modalEl.querySelectorAll('.gmf-welcome-subtype').forEach(sel => {
            const accId = sel.getAttribute('data-acc-id');
            const acc = financeData.customAccounts.find(a => a.id === accId);
            if (acc) {
                acc.accountSubType = sel.value;
                acc.gmfExempt = false;
                acc.gmfReviewed = true;
            }
        });
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        modalEl.classList.add('hidden');
        if (typeof updateDashboard === 'function') updateDashboard();
    });

    modalEl.querySelector('#btn-later-gmf-welcome')?.addEventListener('click', () => {
        modalEl.classList.add('hidden');
    });

    modalEl.classList.remove('hidden');
};

// Verificar al iniciar la app (cuando ya esté desbloqueada / en sesión)
setTimeout(() => {
    const authOverlay = document.getElementById('auth-overlay') || document.getElementById('pin-overlay');
    const isLocked = authOverlay && !authOverlay.classList.contains('hidden');
    if (!isLocked) {
        window.openGmfWelcomeModal();
    } else if (authOverlay) {
        const unlockObs = new MutationObserver(() => {
            if (authOverlay.classList.contains('hidden')) {
                unlockObs.disconnect();
                setTimeout(() => window.openGmfWelcomeModal(), 300);
            }
        });
        unlockObs.observe(authOverlay, { attributes: true, attributeFilter: ['class'] });
    }
}, 500);
// --- CASCARÓN VISUAL: SINCRONIZACIÓN GOOGLE DRIVE ---
document.getElementById('pref-link-gdrive')?.addEventListener('change', (e) => {
    const controls = document.getElementById('cloud-sync-controls');
    const nameEl = document.getElementById('cloud-account-name');
    const emailEl = document.getElementById('cloud-account-email');

    if (e.target.checked) {
        // Simular un pequeño tiempo de carga de Google Sign-In
        setTimeout(() => {
            const auth = JSON.parse(localStorage.getItem('myFinancesAuth') || '{}');
            const userName = auth.name || 'Usuario';
            nameEl.innerText = userName;
            nameEl.style.color = '#0ea5e9';
            emailEl.innerText = 'Vinculado a Google Drive';
            controls?.classList.remove('hidden');
            
            alert('[Próximamente] Aquí se abrirá la ventana de Google para autorizar a la app a crear una carpeta de respaldo en tu Drive.');
        }, 400);
    } else {
        nameEl.innerText = 'Vincular Google Drive';
        nameEl.style.color = 'var(--text-main)';
        emailEl.innerText = 'Activa para iniciar sesión';
        controls?.classList.add('hidden');
    }
});

document.getElementById('btn-cloud-backup')?.addEventListener('click', () => {
    alert('[Próximamente] Se subirá un archivo cifrado con todas tus finanzas a tu Google Drive personal.');
});

document.getElementById('btn-cloud-restore')?.addEventListener('click', () => {
    alert('[Próximamente] La app descargará y aplicará tu último respaldo desde Google Drive.');
});
