// ==========================================
// app.js (v2.1.0 - Fintech Editorial)
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
const applyLiveDecimalFormatting = (inputEl) => {
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
    // Nota: Se eliminó el bloqueo del selector de mes para permitir que
    // los gastos mensuales puedan iniciar en cualquier mes del año.
});

// UX: Auto-seleccionar todo el texto al tocar un campo de dinero
document.addEventListener('focusin', (e) => {
    if (e.target && e.target.classList.contains('money-input')) {
        setTimeout(() => {
            try {
                // Selecciona desde el inicio hasta el final de la cadena
                e.target.setSelectionRange(0, e.target.value.length);
            } catch (err) {}
        }, 10);
    }
});

// UX: Ocultar teclado numérico (Safari iOS) al tocar fuera de los formularios
document.addEventListener('touchstart', (e) => {
    const active = document.activeElement;
    if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) {
        // Si tocamos un lugar vacío que no sea un botón, input o elemento interactivo
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

// Inicializar el estado al abrir la app
if (localStorage.getItem('myFinancesExclusiveMode') === 'true') {
    document.body.classList.add('exclusive-mode-active');
    setTimeout(() => {
        const switchEl = document.getElementById('profile-exclusive-mode');
        if (switchEl) switchEl.checked = true;
    }, 500);
}

// Escuchar el interruptor
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

// Cambiar clave exclusiva
document.getElementById('btn-change-god-key')?.addEventListener('click', () => {
    const current = prompt('Ingresa tu código actual:');
    if (current !== getExclusiveKey()) {
        alert('Código actual incorrecto.');
        return;
    }
    const newKey = prompt('Ingresa el NUEVO código de acceso:');
    if (!newKey || newKey.trim() === '') return;
    
    const confirmKey = prompt('Confirma el NUEVO código:');
    if (newKey !== confirmKey) {
        alert('Los códigos no coinciden. Operacion cancelada.');
        return;
    }
    
    localStorage.setItem('myFinancesGodKey', newKey);
    alert('Código de acceso exclusivo actualizado correctamente.');
});

// --- 4. TEMAS, MODO CLARO/OSCURO Y SEGURIDAD ---
const applyColorModeUI = (mode) => {
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

const applyThemeUI = (themeValue = null) => {
    const trip = financeData.tripMode || {};
    let activeTheme = themeValue || localStorage.getItem('myFinancesTheme') || 'purple';
    
    // Si el modo viaje está activo, sobreescribir el tema principal temporalmente
    if (trip.active) {
        activeTheme = (financeData.preferences && financeData.preferences.tripTheme) ? financeData.preferences.tripTheme : '#0ea5e9';
    }

    const colors = getThemeColors(activeTheme);
    document.documentElement.style.setProperty('--accent', colors.accent);
    document.documentElement.style.setProperty('--theme-gradient', colors.gradient);
    document.documentElement.style.setProperty('--theme-shadow', colors.shadow);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', colors.accent);
    
    // Sincronizar el selector normal (ocultando que cambió si el viaje está activo)
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
    
    // Sincronizar el selector de viaje
    const tripPicker = document.getElementById('trip-theme-color');
    if (tripPicker && financeData.preferences && financeData.preferences.tripTheme) {
        tripPicker.value = financeData.preferences.tripTheme;
    }

    // Botones predeterminados (quitar el marco activo si el viaje tomó control)
    document.querySelectorAll('.theme-color-btn').forEach(b => {
        b.classList.toggle('active', !trip.active && b.getAttribute('data-theme') === activeTheme);
    });
};

const syncUserUI = () => {
    if (!authData) return;
    const firstName = authData.name.split(' ')[0];
    const initial = authData.name.charAt(0).toUpperCase();

    if (document.getElementById('app-title')) document.getElementById('app-title').innerText = 'Mis Finanzas';
    if (document.getElementById('profile-avatar-initial')) document.getElementById('profile-avatar-initial').innerText = initial;
    if (document.getElementById('profile-modal-avatar')) document.getElementById('profile-modal-avatar').innerText = initial;
    if (document.getElementById('profile-modal-name')) document.getElementById('profile-modal-name').innerText = `Hola, ${firstName}`;
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
                if (confirm('¿Borrar los datos de prueba e iniciar tu cuenta real en limpio?')) {
                    clearDemoDataAndStart();
                    location.reload();
                }
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

document.getElementById('reset-auth-btn-profile')?.addEventListener('click', () => {
    if (confirm('⚠️ ATENCIÓN: Se borrarán TODOS tus datos financieros locales y tu perfil para empezar de cero. ¿Deseas continuar?')) {
        localStorage.removeItem('myFinancesAuth');
        localStorage.removeItem('myFinances');
        localStorage.removeItem('myFinancesSalary');
        localStorage.removeItem('myFinancesTaxParams');
        localStorage.removeItem('myFinancesTheme');
        localStorage.removeItem('myFinancesColorMode');
        localStorage.removeItem('myFinancesWidgetOrder');
        location.reload();
    }
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

window.forceCloseAllModals = () => {
    hasUnsavedChanges = false;
    quickActionHandler = null;
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

window.attemptCloseModals = () => {
    const childModals = [
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
                if (!confirm('⚠️ Tienes cambios sin guardar en el presupuesto. ¿Seguro que quieres salir?')) return false;
            }
            hasUnsavedChanges = false;
            if (cId === 'quick-action-modal') quickActionHandler = null;
            cm.classList.add('hidden');
            return false;
        }
    }

    if (isAnyModalOpen() && hasUnsavedChanges) {
        if (!confirm('⚠️ Tienes cambios sin guardar en un formulario. ¿Estás seguro de que quieres salir y perderlos?')) return false;
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
        else if (id === 'drawer-report-bug') {
            const subject = encodeURIComponent(`Reporte de problema - Mis Finanzas`);
            const body = encodeURIComponent('Hola equipo de Función IF,\n\nQuisiera reportar el siguiente inconveniente o sugerencia en la app:\n\n');
            const mailLink = document.createElement('a');
            mailLink.href = `mailto:soporte@funcionif.app?subject=${subject}&body=${body}`;
            document.body.appendChild(mailLink);
            mailLink.click();
            document.body.removeChild(mailLink);
        } else if (id === 'drawer-share-app') {
            const currentUrl = window.location.href;
            const isWebUrl = /^https?:\/\//i.test(currentUrl);
            const shareText = 'Gestiona tus finanzas personales de forma 100% privada y local con Mis Finanzas • Función IF.';
            const sharePayload = isWebUrl
                ? { title: 'Mis Finanzas • Función IF', text: shareText, url: currentUrl }
                : { title: 'Mis Finanzas • Función IF', text: shareText };

            const fallbackCopy = async (textToCopy) => {
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(textToCopy);
                        alert('Enlace copiado al portapapeles.');
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
                    alert('Enlace copiado al portapapeles.');
                } catch (err) {
                    prompt('Copia este enlace:', textToCopy);
                }
                document.body.removeChild(tmp);
            };

            if (isWebUrl && typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(sharePayload))) {
                try {
                    await navigator.share(sharePayload);
                } catch (err) {
                    if (err && err.name !== 'AbortError') {
                        await fallbackCopy(currentUrl);
                    }
                }
            } else {
                await fallbackCopy(isWebUrl ? currentUrl : shareText);
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

    // 6. Cerrar menú FAB si se toca fuera de su contenedor
    const currentFabBtn = document.getElementById('fab-btn');
    const currentFabMenu = document.getElementById('fab-menu');
    if (currentFabMenu && !currentFabMenu.classList.contains('hidden') && !e.target.closest('.fab-container')) {
        currentFabMenu.classList.add('hidden');
        currentFabBtn?.classList.remove('active');
    }
});

// Controlador único en fase de captura para el botón flotante (+) y sus opciones
document.addEventListener('click', (e) => {
    const clickedFabBtn = e.target.closest('#fab-btn');
    if (clickedFabBtn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const menuEl = document.getElementById('fab-menu');
        const isNowHidden = menuEl?.classList.toggle('hidden');
        clickedFabBtn.classList.toggle('active', !isNowHidden);
        return;
    }

    const clickedFabOpt = e.target.closest('.fab-option');
    if (clickedFabOpt) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const selectedType = clickedFabOpt.getAttribute('data-type');
        document.getElementById('fab-menu')?.classList.add('hidden');
        document.getElementById('fab-btn')?.classList.remove('active');
        if (selectedType && typeof openOmniModal === 'function') {
            openOmniModal({ type: selectedType });
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
        if (t.monthId === monthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)) {
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
        const pendingCount = financeData.transactions.filter(t => t.monthId === monthId && t.status === 'pending').length;
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

document.addEventListener('DOMContentLoaded', () => {
    applyWidgetOrder();
    initDashboardDragAndControls();
    if (typeof renderTripModeBanner === 'function') renderTripModeBanner();
});

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
const updateDashboard = () => {
    const viewMonthId = getMonthId(viewDate);
    const currentMonthId = getMonthId(currentDate);
    const isFuture = viewMonthId > currentMonthId;

    if (document.getElementById('current-month-display')) document.getElementById('current-month-display').innerText = formatMonthName(viewDate);
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
            if (healthData.isNeutral) {
                hScoreEl.innerText = '--';
                hBadgeEl.innerText = 'Faltan datos ⚪';
                hBadgeEl.className = 'widget-badge neutral';
                hCircleEl.style.strokeDashoffset = 251.2;
            } else {
                const gScore = healthData.scores.global;
                hScoreEl.innerText = gScore;
                hCircleEl.style.stroke = gScore >= 80 ? 'var(--positive)' : (gScore >= 50 ? '#f59e0b' : 'var(--negative)');
                setTimeout(() => { hCircleEl.style.strokeDashoffset = 251.2 - (251.2 * Math.max(2, gScore) / 100); }, 150);
                if (gScore >= 80) { hBadgeEl.innerText = 'Excelente 🟢'; hBadgeEl.className = 'widget-badge good'; }
                else if (gScore >= 50) { hBadgeEl.innerText = 'Aceptable 🟡'; hBadgeEl.className = 'widget-badge warn'; }
                else { hBadgeEl.innerText = 'En Riesgo 🔴'; hBadgeEl.className = 'widget-badge danger'; }
            }
        }

        // 4. RENDER WIDGET PRESUPUESTO
        let globalLimit = 0, totalSpentExp = 0;
        financeData.categories.expense.forEach(c => { globalLimit += getCategoryLimitForMonth(c, viewDate.getMonth()); });
        financeData.transactions.forEach(t => { 
            if (!t.isDeleted && t.monthId === viewMonthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)) { 
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
            const displayVal = isLiab ? -bal : bal;
            
            // Forzamos el color exacto (verde / rojo) en línea para evitar conflictos CSS
            const inlineColor = isLiab ? 'var(--negative)' : 'var(--positive)';
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
        const payrollTag = debt.payrollDeduction ? ' • 🏢 Libranza' : '';
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

// --- 11. LOS 4 GRÁFICOS SVG DE ANÁLISIS FINANCIERO ---
const renderNetWorthChart = (baseDate, prevDate, prevSnap, currSnap) => {
    const chartContainer = document.getElementById('networth-chart-container');
    if (!chartContainer) return;

    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
        const snap = i === 0 ? currSnap : computeBalancesUpTo(getMonthId(d));
        months.push({
            label: getShortMonthLabel(d),
            assets: snap.assetsTotal + snap.fixedAssetsTotal + snap.pocketsTotal,
            liabilities: -snap.liabilitiesTotal,
            net: snap.netWorth
        });
    }

    const allVals = months.flatMap(m => [m.assets, m.liabilities, m.net, 0]);
    const maxVal = Math.max(...allVals, 1000);
    const minVal = Math.min(...allVals, -1000);
    const range = (maxVal - minVal) || 1;

    const W = 340, H = 135, padL = 44, padR = 12, padT = 14, padB = 22;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const getX = (idx) => padL + (idx / (months.length - 1)) * plotW;
    const getY = (val) => padT + ((maxVal - val) / range) * plotH;
    const zeroY = getY(0);

    const buildSmoothPath = (pts) => {
        if (pts.length === 0) return '';
        let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i], p1 = pts[i + 1];
            const cx = ((p0.x + p1.x) / 2).toFixed(1);
            d += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
        }
        return d;
    };

    const netPts = months.map((m, i) => ({ x: getX(i), y: getY(m.net) }));
    const assetsPts = months.map((m, i) => ({ x: getX(i), y: getY(m.assets) }));
    const liabPts = months.map((m, i) => ({ x: getX(i), y: getY(m.liabilities) }));

    const netCurve = buildSmoothPath(netPts);
    const netArea = `${netCurve} L ${netPts[netPts.length - 1].x.toFixed(1)} ${zeroY.toFixed(1)} L ${netPts[0].x.toFixed(1)} ${zeroY.toFixed(1)} Z`;

    let svg = `<svg viewBox="0 0 ${W} ${H}">
        <defs>
            <linearGradient id="nwAccentAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.32"/>
                <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.01"/>
            </linearGradient>
        </defs>
        <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="rgba(148,163,184,0.16)" stroke-dasharray="3,3"/>
        <line x1="${padL}" y1="${zeroY}" x2="${W - padR}" y2="${zeroY}" stroke="rgba(148,163,184,0.4)" stroke-width="1"/>
        <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="rgba(148,163,184,0.16)" stroke-dasharray="3,3"/>
        <text x="${padL - 5}" y="${padT + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompact(maxVal)}</text>
        <text x="${padL - 5}" y="${zeroY + 3}" text-anchor="end" font-size="9" fill="#94a3b8">$0</text>
        <text x="${padL - 5}" y="${H - padB}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompact(minVal)}</text>
        <path d="${netArea}" fill="url(#nwAccentAreaGrad)"/>
        <path d="${buildSmoothPath(assetsPts)}" fill="none" stroke="#10b981" stroke-width="1.6" stroke-opacity="0.75"/>
        <path d="${buildSmoothPath(liabPts)}" fill="none" stroke="#ff3b30" stroke-width="1.6" stroke-opacity="0.75"/>
        <path d="${netCurve}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/>`;

    months.forEach((m, i) => {
        const x = getX(i);
        const isLast = i === months.length - 1;
        svg += `
            <circle cx="${x}" cy="${getY(m.net)}" r="${isLast ? 4.2 : 2.8}" fill="var(--accent)" stroke="var(--card-bg)" stroke-width="1.5"/>
            <text x="${x}" y="${H - 5}" text-anchor="middle" font-size="9.5" font-weight="${isLast ? '700' : '500'}" fill="${isLast ? 'var(--text-main)' : '#94a3b8'}">${m.label}</text>
        `;
    });
    chartContainer.innerHTML = svg + `</svg>`;

    if (document.getElementById('nw-prev-col')) document.getElementById('nw-prev-col').innerText = getShortMonthLabel(prevDate);
    if (document.getElementById('nw-curr-col')) document.getElementById('nw-curr-col').innerText = getShortMonthLabel(baseDate);
    const nwBody = document.getElementById('nw-comp-body');
    if (nwBody) {
        nwBody.innerHTML = `
            <tr><td><i class="dot" style="background:#10b981;"></i>Activos</td><td>${formatMoney(prevSnap.assetsTotal + prevSnap.fixedAssetsTotal + prevSnap.pocketsTotal)}</td><td class="positive">${formatMoney(currSnap.assetsTotal + currSnap.fixedAssetsTotal + currSnap.pocketsTotal)}</td></tr>
            <tr><td><i class="dot" style="background:#ff3b30;"></i>Pasivos</td><td>${formatMoney(-prevSnap.liabilitiesTotal)}</td><td class="negative">${formatMoney(-currSnap.liabilitiesTotal)}</td></tr>
            <tr><td><i class="dot" style="background:var(--accent);"></i>Patrimonio</td><td>${formatMoney(prevSnap.netWorth)}</td><td>${formatMoney(currSnap.netWorth)}</td></tr>
        `;
    }
};

const renderCashFlowChart = (baseDate, prevDate) => {
    const chartContainer = document.getElementById('cashflow-chart-container');
    if (!chartContainer) return;

    const months = [];
    for (let i = 2; i >= 0; i--) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
        const flow = getMonthlyFlow(getMonthId(d), false);
        months.push({
            label: d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }),
            inc: flow.inc, exp: flow.exp, net: flow.net
        });
    }

    const maxVal = Math.max(...months.flatMap(m => [m.inc, m.exp]), 1000);
    const W = 340, H = 130, padL = 44, padR = 12, padT = 14, padB = 22;
    const plotW = W - padL - padR, plotH = H - padT - padB, baseY = padT + plotH;

    let svg = `<svg viewBox="0 0 ${W} ${H}">
        <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="rgba(148,163,184,0.18)" stroke-dasharray="3,3"/>
        <line x1="${padL}" y1="${padT + plotH / 2}" x2="${W - padR}" y2="${padT + plotH / 2}" stroke="rgba(148,163,184,0.18)" stroke-dasharray="3,3"/>
        <line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="rgba(148,163,184,0.45)" stroke-width="1"/>
        <text x="${padL - 5}" y="${padT + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompact(maxVal)}</text>
        <text x="${padL - 5}" y="${padT + plotH / 2 + 3}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompact(maxVal / 2)}</text>
        <text x="${padL - 5}" y="${baseY}" text-anchor="end" font-size="9" fill="#94a3b8">$0</text>`;

    const groupW = plotW / 3, barW = Math.min(26, groupW * 0.32);
    months.forEach((m, i) => {
        const centerX = padL + groupW * i + groupW / 2;
        const hInc = (m.inc / maxVal) * plotH;
        const hExp = (m.exp / maxVal) * plotH;
        svg += `
            <rect x="${centerX - barW - 2}" y="${baseY - hInc}" width="${barW}" height="${Math.max(2, hInc)}" rx="4" fill="#10b981"/>
            <rect x="${centerX + 2}" y="${baseY - hExp}" width="${barW}" height="${Math.max(2, hExp)}" rx="4" fill="#ff3b30"/>
            <text x="${centerX}" y="${H - 5}" text-anchor="middle" font-size="9.5" fill="#94a3b8">${m.label}</text>
        `;
    });
    const prevM = months[1], currM = months[2];
    const expDeltaPct = prevM.exp > 0 ? round2(((currM.exp - prevM.exp) / prevM.exp) * 100) : 0;
    const netDelta = round2(currM.net - prevM.net);
    const trendArrow = expDeltaPct > 0 ? '↑' : (expDeltaPct < 0 ? '↓' : '→');
    const trendLabel = prevM.exp > 0
        ? `Gastos ${expDeltaPct > 0 ? '+' : ''}${String(expDeltaPct).replace('.', ',')}% ${trendArrow} vs. ${prevM.label}`
        : `Flujo neto ${netDelta >= 0 ? '+' : ''}${formatCompact(netDelta)} vs. ${prevM.label}`;

    const bentoComparisonHtml = `
        <div class="bento-cf-grid">
            <div class="bento-cf-card">
                <span class="bento-cf-label">Total Ingresos</span>
                <strong class="positive">${formatMoneyHtml(currM.inc)}</strong>
            </div>
            <div class="bento-cf-card">
                <span class="bento-cf-label">Total Gastos</span>
                <strong class="negative">${formatMoneyHtml(currM.exp)}</strong>
            </div>
        </div>
        <div class="bento-cf-pill">
            <span>${trendLabel}</span>
            <strong class="${currM.net >= 0 ? 'positive' : 'negative'}">Neto: ${formatCompact(currM.net)}</strong>
        </div>
    `;

    chartContainer.innerHTML = svg + `</svg>` + bentoComparisonHtml;

    if (document.getElementById('cf-prev-col')) document.getElementById('cf-prev-col').innerText = getShortMonthLabel(prevDate);
    if (document.getElementById('cf-curr-col')) document.getElementById('cf-curr-col').innerText = getShortMonthLabel(baseDate);
    const cfBody = document.getElementById('cf-comp-body');
    if (cfBody) {
        cfBody.innerHTML = `
            <tr><td><i class="dot" style="background:#10b981;"></i>Entradas</td><td>${formatMoney(months[1].inc)}</td><td class="positive">${formatMoney(months[2].inc)}</td></tr>
            <tr><td><i class="dot" style="background:#ff3b30;"></i>Salidas</td><td>${formatMoney(-months[1].exp)}</td><td class="negative">${formatMoney(-months[2].exp)}</td></tr>
            <tr><td>Flujo neto</td><td>${formatMoney(months[1].net)}</td><td class="${months[2].net >= 0 ? 'positive' : 'negative'}">${formatMoney(months[2].net)}</td></tr>
        `;
    }
};

const renderDailySummary = () => {
    const chartContainer = document.getElementById('daily-chart-container');
    if (!chartContainer) return;

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i);
        const dayStr = d.toLocaleDateString('en-CA');
        let inc = 0, exp = 0;
        financeData.transactions.forEach(t => {
            if (!t.isAdjustment && t.type !== 'transfer' && isTxClosed(t) && new Date(t.id).toLocaleDateString('en-CA') === dayStr) {
                if (t.type === 'income') inc = round2(inc + round2(t.amount));
                if (t.type === 'expense') exp = round2(exp + round2(t.amount));
            }
        });
        days.push({ label: d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', ''), inc, exp, net: round2(inc - exp) });
    }

    const maxVal = Math.max(...days.flatMap(d => [d.inc, d.exp]), 1000);
    const W = 340, H = 100, padL = 10, padR = 10, padT = 16, padB = 20, baseY = padT + (H - padT - padB);
    const colW = (W - padL - padR) / 7, barW = 12;

    let svg = `<svg viewBox="0 0 ${W} ${H}"><line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="rgba(148,163,184,0.35)" stroke-width="1"/>`;
    days.forEach((d, i) => {
        const cx = padL + colW * i + colW / 2;
        const hInc = (d.inc / maxVal) * (H - padT - padB);
        const hExp = (d.exp / maxVal) * (H - padT - padB);
        if (d.inc > 0) svg += `<rect x="${cx - barW - 1}" y="${baseY - hInc}" width="${barW}" height="${Math.max(3, hInc)}" rx="3" fill="#10b981"/>`;
        if (d.exp > 0) {
            svg += `<rect x="${cx + 1}" y="${baseY - hExp}" width="${barW}" height="${Math.max(3, hExp)}" rx="3" fill="#ff3b30"/>`;
            svg += `<text x="${cx}" y="${Math.max(10, baseY - Math.max(hInc, hExp) - 3)}" text-anchor="middle" font-size="8" fill="#94a3b8">${formatCompact(d.exp)}</text>`;
        }
        svg += `<text x="${cx}" y="${H - 4}" text-anchor="middle" font-size="9.5" fill="#94a3b8">${d.label}</text>`;
    });
    chartContainer.innerHTML = svg + `</svg>`;

    let sum30 = 0;
    const thirtyDaysAgo = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 30).getTime();
    financeData.transactions.forEach(t => {
        if (!t.isAdjustment && t.type !== 'transfer' && isTxClosed(t) && t.id >= thirtyDaysAgo && t.id <= Date.now()) {
            sum30 = round2(sum30 + (t.type === 'income' ? round2(t.amount) : -round2(t.amount)));
        }
    });

    const avg7 = round2(days.reduce((s, d) => round2(s + d.net), 0) / 7);
    const avg30 = round2(sum30 / 30);
    const avg7El = document.getElementById('avg-7-days');
    const avg30El = document.getElementById('avg-30-days');
    if (avg7El) { avg7El.innerText = formatMoney(avg7); avg7El.className = avg7 >= 0 ? 'positive' : 'negative'; }
    if (avg30El) { avg30El.innerText = formatMoney(avg30); avg30El.className = avg30 >= 0 ? 'positive' : 'negative'; }
};

const renderBudgetDonut = (viewMonthId, totalMonthlyExpense) => {
    const donutBox = document.getElementById('budget-donut-container');
    const legendList = document.getElementById('budget-legend-list');
    if (!donutBox || !legendList) return;

    const totalsByCat = {};
    financeData.transactions
        .filter(t => t.monthId === viewMonthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t))
        .forEach(t => {
            const cat = t.category || '📦 Otros Gastos';
            totalsByCat[cat] = round2((totalsByCat[cat] || 0) + round2(t.amount));
        });

    const sorted = Object.entries(totalsByCat).sort((a, b) => b[1] - a[1]);
    legendList.innerHTML = '';

    if (sorted.length === 0 || totalMonthlyExpense <= 0) {
        donutBox.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" fill="none" stroke="rgba(148,163,184,0.25)" stroke-width="14"/><text x="50" y="53" text-anchor="middle" font-size="10" fill="#94a3b8">Sin gastos</text></svg>`;
        legendList.innerHTML = `<span style="color:var(--text-muted); font-size:11px;">Registra gastos este mes.</span>`;
    } else {
        const R = 36, C = 2 * Math.PI * R;
        let offset = 0;
        let svg = `<svg viewBox="0 0 100 100" style="transform: rotate(-90deg);">`;
        sorted.forEach(([catName, amt], idx) => {
            const pct = (amt / totalMonthlyExpense) * 100;
            const dash = (pct / 100) * C;
            const color = categoryColors[idx % categoryColors.length];
            svg += `<circle cx="50" cy="50" r="${R}" fill="none" stroke="${color}" stroke-width="15" stroke-dasharray="${dash} ${C}" stroke-dashoffset="${-offset}"/>`;
            offset += dash;
            if (idx < 5) {
                const shortName = cleanCatName(catName);
                legendList.innerHTML += `<div class="donut-legend-item"><div class="donut-legend-left"><i class="dot" style="background:${color};"></i><span>${shortName}</span></div><strong>${pct.toFixed(0)}%</strong></div>`;
            }
        });
        donutBox.innerHTML = svg + `</svg>`;
    }
};

let analyticsHideZeroAccounts = false;
let analyticsBsFilter = 'all';

const renderAnalyticsBalanceSheet = (balances, netWorth, snap) => {
    const analyticsContainer = document.getElementById('analytics-widgets-container');
    if (!analyticsContainer) return;

    let cardEl = document.getElementById('analytics-balancesheet-card');
    if (!cardEl) {
        const siblingCard = analyticsContainer.querySelector('[data-analytics-id]');
        const baseClasses = siblingCard
            ? siblingCard.className.replace(/\bedit-mode\b/g, '').trim()
            : 'chart-card';
        cardEl = document.createElement('div');
        cardEl.id = 'analytics-balancesheet-card';
        cardEl.className = baseClasses;
        cardEl.setAttribute('data-analytics-id', 'analytics-balancesheet');
        analyticsContainer.appendChild(cardEl);
        applyWidgetOrder();
    }

    const prevCloseDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0);
    const prevSnap = computeBalancesUpTo(getMonthId(prevCloseDate));
    const prevBals = prevSnap.bals || {};

    const isViewingRealCurrMonth = getMonthId(viewDate) === getMonthId(currentDate);
    const currDisplayDate = isViewingRealCurrMonth
        ? currentDate
        : new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

    const fmtColDate = (d) => `${d.getDate()} ${d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}. ${String(d.getFullYear()).slice(-2)}`;

    const totalAssets = round2(snap.assetsTotal + snap.fixedAssetsTotal + snap.pocketsTotal);
    const prevTotalAssets = round2(prevSnap.assetsTotal + prevSnap.fixedAssetsTotal + prevSnap.pocketsTotal);
    const totalLiabilities = round2(snap.liabilitiesTotal);
    const prevTotalLiabilities = round2(prevSnap.liabilitiesTotal);
    const prevNetWorth = round2(prevSnap.netWorth);
    const netDiff = round2(netWorth - prevNetWorth);

    const solvencyPct = totalAssets > 0
        ? Math.max(0, 100 - Math.round((totalLiabilities / totalAssets) * 100))
        : (totalLiabilities > 0 ? 0 : 100);

    const totalVolume = round2(totalAssets + totalLiabilities);
    const posBarPct = totalVolume > 0 ? Math.round((totalAssets / totalVolume) * 100) : 50;
    const negBarPct = totalVolume > 0 ? Math.max(0, 100 - posBarPct) : 50;

    let hiddenCount = 0;

    const buildDeltaPill = (diff, isLiab = false) => {
        if (Math.abs(diff) < 0.01) {
            return `<span class="bs-delta-pill neutral">Sin cambio</span>`;
        }
        const isFavorable = isLiab ? diff < 0 : diff > 0;
        const pillCls = isFavorable ? 'good' : 'bad';
        const netImpact = isLiab ? -diff : diff;
        const signStr = netImpact > 0 ? '+' : '−';
        return `<span class="bs-delta-pill ${pillCls} privacy-sensitive">${signStr}${formatMoney(Math.abs(netImpact))}</span>`;
    };

    const buildCompareRowHtml = ({ nameText, iconHtml, iconColor, starTag = '', prevRaw, currRaw, isLiab = false, shareTotal = 0, clickAttr = '' }) => {
        const prevVal = round2(prevRaw || 0);
        const currVal = round2(currRaw || 0);
        const diff = round2(currVal - prevVal);

        const prevDisplay = isLiab && prevVal > 0 ? -prevVal : prevVal;
        const currDisplay = isLiab && currVal > 0 ? -currVal : currVal;
        const mainColor = isLiab ? 'var(--negative)' : 'var(--positive)';

        let arrow = '';
        let arrowColor = 'var(--text-muted)';
        if (Math.abs(diff) >= 0.01) {
            const isFavorable = isLiab ? diff < 0 : diff > 0;
            arrow = diff > 0 ? '↑' : '↓';
            arrowColor = isFavorable ? 'var(--positive)' : 'var(--negative)';
        }

        const sharePct = shareTotal > 0 && currVal > 0 ? Math.round((currVal / shareTotal) * 100) : 0;
        const shareHtml = shareTotal > 0 ? `<span class="bs-share-pill">${sharePct}%</span>` : '';

        return `
            <div class="bs-row-compare" ${clickAttr}>
                <div class="bs-row-top">
                    <div class="bs-cell-name">
                        <span class="bs-inline-icon" style="color:${iconColor};">${iconHtml}</span>
                        <span class="bs-cell-name-text">${nameText}${starTag}</span>
                        ${shareHtml}
                    </div>
                    ${buildDeltaPill(diff, isLiab)}
                </div>
                <div class="bs-row-bottom">
                    <span class="bs-cell-prev privacy-sensitive">${formatMoneyHtml(prevDisplay)}</span>
                    <span class="bs-cell-arrow-sep">→</span>
                    <span class="bs-cell-curr-main privacy-sensitive" style="color:${mainColor};">
                        <span>${formatMoneyHtml(currDisplay)}</span>
                        ${arrow ? `<span style="color:${arrowColor}; font-size:11px; font-weight:900;">${arrow}</span>` : ''}
                    </span>
                </div>
            </div>
        `;
    };

    const assets = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset' && !a.id.startsWith('CxC_')));
    const cxcAccounts = financeData.customAccounts.filter(a => a.id.startsWith('CxC_'));
    const cards = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'credit_card'));
    const debts = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'debt' && (round2(balances[a.id] || 0) > 0 || round2(prevBals[a.id] || 0) > 0)));

    const rawAssetItems = [];
    assets.forEach(acc => {
        const bal = round2(balances[acc.id] || 0);
        const pBal = round2(prevBals[acc.id] || 0);
        const isZero = Math.abs(bal) < 0.01 && Math.abs(pBal) < 0.01;
        if (analyticsHideZeroAccounts && isZero) { hiddenCount++; return; }
        if (analyticsBsFilter === 'changed' && Math.abs(bal - pBal) < 0.01) return;
        rawAssetItems.push({
            nameText: stripLeadingEmoji(acc.name),
            iconHtml: getAccountIcon(acc.category),
            iconColor: 'var(--accent)',
            starTag: acc.isDefault ? ' ★' : '',
            prevRaw: pBal,
            currRaw: bal,
            clickAttr: `data-bs-acc-id="${acc.id}"`
        });
    });

    const cxcCurrTotal = round2(cxcAccounts.reduce((sum, a) => sum + Math.max(0, round2(balances[a.id] || 0)), 0));
    const cxcPrevTotal = round2(cxcAccounts.reduce((sum, a) => sum + Math.max(0, round2(prevBals[a.id] || 0)), 0));
    if ((cxcCurrTotal > 0 || cxcPrevTotal > 0) && (analyticsBsFilter !== 'changed' || Math.abs(cxcCurrTotal - cxcPrevTotal) >= 0.01)) {
        rawAssetItems.push({
            nameText: 'Deudas a Favor',
            iconHtml: renderIcon('users', 15),
            iconColor: 'var(--positive)',
            prevRaw: cxcPrevTotal,
            currRaw: cxcCurrTotal,
            clickAttr: `data-bs-special="receivables"`
        });
    }

    if ((snap.pocketsTotal > 0 || prevSnap.pocketsTotal > 0) && (analyticsBsFilter !== 'changed' || Math.abs(snap.pocketsTotal - prevSnap.pocketsTotal) >= 0.01)) {
        rawAssetItems.push({
            nameText: 'Bolsillos de Ahorro',
            iconHtml: renderIcon('piggy', 15),
            iconColor: 'var(--positive)',
            prevRaw: prevSnap.pocketsTotal,
            currRaw: snap.pocketsTotal,
            clickAttr: `data-bs-special="pockets"`
        });
    }

    if ((snap.visibleFixedAssetsTotal > 0 || prevSnap.visibleFixedAssetsTotal > 0) && (analyticsBsFilter !== 'changed' || Math.abs(snap.visibleFixedAssetsTotal - prevSnap.visibleFixedAssetsTotal) >= 0.01)) {
        rawAssetItems.push({
            nameText: 'Activos Fijos',
            iconHtml: renderIcon('diamond', 15),
            iconColor: 'var(--accent)',
            prevRaw: prevSnap.visibleFixedAssetsTotal,
            currRaw: snap.visibleFixedAssetsTotal,
            clickAttr: `data-bs-special="assets"`
        });
    }

    const visibleAssetsShareBase = round2(rawAssetItems.reduce((s, it) => s + Math.max(0, it.currRaw), 0));
    const excludedAssetsDiff = round2(totalAssets - visibleAssetsShareBase);

    const assetsRowsHtml = rawAssetItems.length > 0
        ? rawAssetItems.map(it => buildCompareRowHtml({ ...it, isLiab: false, shareTotal: visibleAssetsShareBase })).join('')
        : `<div style="padding:10px 2px;"><small style="color:var(--text-muted); font-size:11px;">${analyticsBsFilter === 'changed' ? 'Sin cambios en activos este periodo.' : 'Sin activos con saldo en este periodo.'}</small></div>`;

    const excludedNoteHtml = (analyticsBsFilter === 'all' && excludedAssetsDiff >= 1)
        ? `<div data-bs-special="assets" style="padding:8px 2px 9px 2px; font-size:10.5px; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center; border-top:1px dashed rgba(148,163,184,0.2); cursor:pointer;"><span>Activos fijos no listados ›</span><b class="privacy-sensitive" style="color:var(--text-main);">${formatMoney(excludedAssetsDiff)}</b></div>`
        : '';

    const allLiabilitiesList = [...cards, ...debts];
    const rawLiabItems = [];
    allLiabilitiesList.forEach(acc => {
        const bal = round2(balances[acc.id] || 0);
        const pBal = round2(prevBals[acc.id] || 0);
        const isZero = Math.abs(bal) < 0.01 && Math.abs(pBal) < 0.01;
        if (analyticsHideZeroAccounts && isZero) { hiddenCount++; return; }
        if (analyticsBsFilter === 'changed' && Math.abs(bal - pBal) < 0.01) return;
        rawLiabItems.push({
            nameText: stripLeadingEmoji(acc.name),
            iconHtml: getAccountIcon(acc.category),
            iconColor: 'var(--accent)',
            starTag: acc.isDefault ? ' ★' : '',
            prevRaw: pBal,
            currRaw: bal,
            clickAttr: `data-bs-acc-id="${acc.id}"`
        });
    });

    const liabRowsHtml = rawLiabItems.length > 0
        ? rawLiabItems.map(it => buildCompareRowHtml({ ...it, isLiab: true, shareTotal: totalLiabilities })).join('')
        : `<div style="padding:10px 2px;"><small style="color:var(--text-muted); font-size:11px;">${analyticsBsFilter === 'changed' ? 'Sin cambios en pasivos este periodo.' : 'Sin pasivos con saldo en este periodo.'}</small></div>`;

    const showAssetsSection = analyticsBsFilter !== 'liabilities';
    const showLiabSection = analyticsBsFilter !== 'assets' && (allLiabilitiesList.length > 0 || totalLiabilities > 0 || prevTotalLiabilities > 0);

    const netColor = netWorth >= 0 ? 'var(--positive)' : 'var(--negative)';
    const zeroBtnLabel = analyticsHideZeroAccounts
        ? `${renderIcon('eye', 12)} ${hiddenCount > 0 ? `+${hiddenCount}` : 'Ver $0'}`
        : `${renderIcon('eye-off', 12)} Ocultar $0`;

    const assetsDiff = round2(totalAssets - prevTotalAssets);
    const liabDiff = round2(totalLiabilities - prevTotalLiabilities);

    const filterPills = [
        { id: 'all', label: 'Todos' },
        { id: 'changed', label: 'Con cambios' },
        { id: 'assets', label: 'Activos' },
        { id: 'liabilities', label: 'Pasivos' }
    ];

    cardEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px;">
            <div>
                <h4 style="margin:0; font-size:15px; font-weight:800; color:var(--text-main);">Hoja de Balance</h4>
                <small style="font-size:10.5px; color:var(--text-muted); font-weight:600;">Cierre anterior vs. corte actual</small>
            </div>
            <button type="button" id="toggle-analytics-zero-btn" class="btn-sm btn-secondary ${analyticsHideZeroAccounts ? 'active' : ''}" style="border-radius:12px; font-size:10.5px; font-weight:700; padding:4px 9px; height:26px; display:inline-flex; align-items:center; gap:4px; flex-shrink:0;">
                ${zeroBtnLabel}
            </button>
        </div>

        <div class="bs-hero-box">
            <div class="bs-hero-top">
                <div>
                    <span style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.4px;">Patrimonio Neto Actual</span>
                    <div class="bs-hero-amount privacy-sensitive" style="color:${netColor};">${formatMoneyHtml(netWorth)}</div>
                </div>
                ${buildDeltaPill(netDiff, false)}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:10.5px; color:var(--text-muted); font-weight:600;">
                <span>Cierre ${fmtColDate(prevCloseDate)}: <b class="privacy-sensitive" style="color:var(--text-main);">${formatMoney(prevNetWorth)}</b></span>
                <span>Solvencia: <b style="color:var(--text-main);">${solvencyPct}%</b></span>
            </div>
            <div class="bs-ratio-track" title="Proporción Activos vs. Pasivos">
                <div class="bs-ratio-seg-pos" style="width:${posBarPct}%;"></div>
                <div class="bs-ratio-seg-neg" style="width:${negBarPct}%;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:700;">
                <span class="positive">Activos ${posBarPct}%</span>
                <span class="negative">Pasivos ${negBarPct}%</span>
            </div>
        </div>

        <div class="bs-filter-strip">
            ${filterPills.map(fp => `<button type="button" class="pill-btn ${analyticsBsFilter === fp.id ? 'active' : ''}" data-bs-filter="${fp.id}">${fp.label}</button>`).join('')}
        </div>

        <div class="bs-timeline-bar">
            <span>Cierre: ${fmtColDate(prevCloseDate)}</span>
            <span>Corte: ${fmtColDate(currDisplayDate)}</span>
        </div>

        ${showAssetsSection ? `
            <div class="bs-section-card">
                <div class="bs-section-head">
                    <div class="bs-section-head-top">
                        <span class="bs-section-title" style="color:var(--positive);">Activos</span>
                        ${buildDeltaPill(assetsDiff, false)}
                    </div>
                    <div class="bs-section-head-bottom">
                        <span class="bs-cell-prev privacy-sensitive">${formatMoneyHtml(prevTotalAssets)}</span>
                        <span class="bs-cell-arrow-sep">→</span>
                        <span class="bs-cell-curr-main privacy-sensitive" style="color:var(--positive); font-size:13.5px;">
                            <span>${formatMoneyHtml(totalAssets)}</span>
                            ${Math.abs(assetsDiff) >= 0.01 ? `<span style="color:${assetsDiff > 0 ? 'var(--positive)' : 'var(--negative)'}; font-size:11.5px; font-weight:900;">${assetsDiff > 0 ? '↑' : '↓'}</span>` : ''}
                        </span>
                    </div>
                </div>
                <div>${assetsRowsHtml}</div>
                ${excludedNoteHtml}
            </div>
        ` : ''}

        ${showLiabSection ? `
            <div class="bs-section-card">
                <div class="bs-section-head">
                    <div class="bs-section-head-top">
                        <span class="bs-section-title" style="color:var(--negative);">Pasivos</span>
                        ${buildDeltaPill(liabDiff, true)}
                    </div>
                    <div class="bs-section-head-bottom">
                        <span class="bs-cell-prev privacy-sensitive">${formatMoneyHtml(prevTotalLiabilities > 0 ? -prevTotalLiabilities : 0)}</span>
                        <span class="bs-cell-arrow-sep">→</span>
                        <span class="bs-cell-curr-main privacy-sensitive" style="color:var(--negative); font-size:13.5px;">
                            <span>${formatMoneyHtml(totalLiabilities > 0 ? -totalLiabilities : 0)}</span>
                            ${Math.abs(liabDiff) >= 0.01 ? `<span style="color:${liabDiff < 0 ? 'var(--positive)' : 'var(--negative)'}; font-size:11.5px; font-weight:900;">${liabDiff > 0 ? '↑' : '↓'}</span>` : ''}
                        </span>
                    </div>
                </div>
                <div>${liabRowsHtml}</div>
            </div>
        ` : ''}
    `;

    cardEl.querySelector('#toggle-analytics-zero-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        analyticsHideZeroAccounts = !analyticsHideZeroAccounts;
        renderAnalyticsBalanceSheet(currentBalances, netWorth, snap);
    });

    cardEl.querySelectorAll('[data-bs-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            analyticsBsFilter = btn.getAttribute('data-bs-filter') || 'all';
            renderAnalyticsBalanceSheet(currentBalances, netWorth, snap);
        });
    });

    cardEl.querySelectorAll('[data-bs-acc-id]').forEach(row => {
        row.addEventListener('click', () => {
            const accId = row.getAttribute('data-bs-acc-id');
            if (accId && attemptCloseModals()) openAccountDetail(accId, 'analytics');
        });
    });

    cardEl.querySelectorAll('[data-bs-special]').forEach(row => {
        row.addEventListener('click', () => {
            const target = row.getAttribute('data-bs-special');
            if (!attemptCloseModals()) return;
            if (target === 'receivables') openReceivablesModal();
            else if (target === 'pockets') { document.getElementById('pockets-modal')?.classList.remove('hidden'); renderPocketsView(); }
            else if (target === 'assets') { document.getElementById('assets-modal')?.classList.remove('hidden'); renderAssetsBreakdown(); }
        });
    });
};

// --- 12. HISTORIAL CON BUSCADOR INSTANTÁNEO, CONTADOR Y CONFIRMACIÓN RÁPIDA ---
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
        submitLabel: '✅ Confirmar Movimiento',
        onConfirm: (realAmt) => {
            if (realAmt < 0) { alert('Ingresa un monto válido.'); return false; }
            if (!tx.budgetedAmount) tx.budgetedAmount = defaultAmt;
            tx.amount = realAmt;
            tx.status = 'closed';
            if (tx.pendingLibranzas) {
                const appliedLib = applyPayrollLibranzas(tx.monthId, tx.payrollPeriod || 'M', new Date(tx.id), !!tx.isBiweeklyPayroll);
                if (appliedLib.length > 0) {
                    tx.linkedLibranzas = appliedLib.map(l => ({
                        txId: l.txId,
                        intTxId: l.intTxId,
                        debtId: l.debtId,
                        targetTxId: l.targetTxId,
                        pocketId: l.pocketId,
                        pocketAmt: l.pocketAmt,
                        quoteStep: l.quoteStep
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

const renderTransactionHistory = (monthId, snap, projectionData) => {
    const listEl = document.getElementById('transaction-list');
    const titleEl = document.getElementById('history-section-title');
    const countBadge = document.getElementById('history-count-badge');
    const projBox = document.getElementById('projection-summary-box');
    if (!listEl) return;

    if (titleEl) {
        if (historySearchQuery) titleEl.innerText = 'Resultados de Búsqueda';
        else if (selectedCalendarDay) {
            const dObj = new Date(selectedCalendarDay + 'T12:00:00');
            titleEl.innerText = `Movimientos del ${dObj.getDate()} de ${getShortMonthLabel(dObj)}`;
        } else {
            titleEl.innerText = 'Movimientos del Mes';
        }
    }

    let filteredTxs = financeData.transactions.filter(t => !t.isDeleted && getTxMonthId(t) === monthId);

    if (selectedCalendarDay) {
        filteredTxs = filteredTxs.filter(t => new Date(t.id).toLocaleDateString('en-CA') === selectedCalendarDay);
    }

    if (activeHistoryFilter !== 'all') {
        if (activeHistoryFilter === 'pending') {
            filteredTxs = filteredTxs.filter(t => t.status === 'pending');
            
            // -- INYECTAR OBLIGACIONES VIRTUALES COMO "PENDIENTES" --
            const currentMonthId = getMonthId(currentDate);
            if (monthId >= currentMonthId && financeData.preferences?.showProjections !== false) {
                
                // 1. Suscripciones y Fijos
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

                // 2. Préstamos y Deudas
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

                // 3. Tarjetas de Crédito
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
                
                // 4. Presupuestos Fijos (Servicios, Arriendos)
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
        } else if (pendingTxs.length > 0 && !historySearchQuery && (activeHistoryFilter === 'all' || activeHistoryFilter === 'pending')) {
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

        // Formateo de Categoría y Subcategoría (Línea 2)
        if (t.type !== 'transfer') {
            categoryDisplay = t.subcategory && t.subcategory !== 'General' 
                ? `${cleanCatName(t.category)} <span style="opacity:0.75; font-weight:500;">(${cleanCatName(t.subcategory)})</span>` 
                : cleanCatName(t.category || '');
        } else {
            categoryDisplay = 'Transferencia';
        }

        // Bloque de Badges (Líneas 6 y 7, si aplican)
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
        
        let clearBgClass = '';
        if (t.isCleared) {
            clearBgClass = 'style="background-color: var(--positive-bg); border-color: rgba(16, 185, 129, 0.3);"';
        }

        // Nueva estructura HTML asegurando que el texto largo se trunque y no empuje el precio
        listHtml += `
        <li class="history-item ${isPending ? 'pending-item' : ''}" data-action="edit-tx" data-id="${t.id}" ${clearBgClass} style="align-items:flex-start; padding: 14px 16px;">
            
            <div class="drawer-icon-box ${iconClass}" style="margin-right:12px; margin-top: 2px; flex-shrink: 0;">
                ${t.type === 'transfer' ? renderIcon('transfer', 16) : catIcon}
            </div>
            
            <!-- Columna central (textos) -->
            <div class="history-info" style="display:flex; flex-direction:column; gap:4px; flex: 1 1 auto; min-width: 0;">
                
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <strong style="font-size:14.5px; line-height:1.2; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${stripLeadingEmoji(t.description)}</strong>
                    <div class="history-amount ${colorClass}" style="text-align:right; font-size:15px; font-weight:800; white-space:nowrap; flex-shrink: 0;">
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
    
    // Si el modo conciliación está activo, actualizar el contador del banner
    const clearBanner = document.getElementById('clear-mode-banner');
    if (clearBanner && isClearModeActive) {
        const clearedCount = filteredTxs.filter(t => t.isCleared).length;
        document.getElementById('clear-mode-count').innerText = `${clearedCount} / ${filteredTxs.length}`;
    }
};

// (Enrutador consolidado arriba para evitar doble disparo en acordeones y cierre de modales)

// --- DELEGACIÓN DE EVENTOS Y MODO CONCILIACIÓN (TAP-TO-CLEAR) ---
let isClearModeActive = false;

document.getElementById('btn-toggle-clear-mode')?.addEventListener('click', (e) => {
    isClearModeActive = !isClearModeActive;
    e.target.closest('button').classList.toggle('active', isClearModeActive);
    const clearBanner = document.getElementById('clear-mode-banner');
    if (clearBanner) clearBanner.classList.toggle('hidden', !isClearModeActive);
    updateDashboard(); // Repinta el historial con los fondos si es necesario
});

document.getElementById('transaction-list')?.addEventListener('click', (e) => {
    // 1. Botón de confirmar pendiente o gestionar obligación
    const confirmBtn = e.target.closest('.btn-confirm-pending[data-action="confirm-tx"]');
    if (confirmBtn) {
        e.stopPropagation();
        const txId = confirmBtn.getAttribute('data-id');
        
        // Enrutador inteligente para Pendientes Virtuales (To-Do List)
        if (String(txId).startsWith('v_sub_')) {
            processSubscriptionPayment(txId.replace('v_sub_', ''));
            return;
        }
        if (String(txId).startsWith('v_debt_')) {
            openAccountDetail(txId.replace('v_debt_', ''), 'home');
            document.getElementById('open-pay-installment-btn')?.click();
            return;
        }
        if (String(txId).startsWith('v_card_')) {
            openAccountDetail(txId.replace('v_card_', ''), 'home');
            return;
        }
        if (String(txId).startsWith('v_budget_')) {
            openOmniModal({ type: 'expense', title: 'Pagar Gasto Fijo' });
            return;
        }
        
        // Comportamiento normal para transacciones programadas reales
        confirmPendingTx(txId, e);
        return;
    }

    // 2. Fila general (Detectar si editamos o conciliamos)
    const historyItem = e.target.closest('.history-item[data-action="edit-tx"]');
    if (historyItem) {
        const txId = historyItem.getAttribute('data-id');
        
        if (isClearModeActive) {
            // TAP-TO-CLEAR: Marcar o desmarcar transacción como conciliada
            const tx = financeData.transactions.find(t => String(t.id) === String(txId));
            if (tx) {
                tx.isCleared = !tx.isCleared;
                localStorage.setItem('myFinances', JSON.stringify(financeData));
                updateDashboard(); // Refresca visualmente rápido
            }
        } else {
            // COMPORTAMIENTO NORMAL: Abrir edición
            if (attemptCloseModals()) openEditModal(txId);
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

// --- 13. CONTROL ANUAL CONSOLIDADO (DISEÑO BENTO VERTICAL) ---
const renderAnnualControlTable = () => {
    const container = document.getElementById('annual-control-view');
    if (!container) return;

    if (document.getElementById('annual-year-title')) {
        document.getElementById('annual-year-title').innerText = annualViewYear;
    }

    const shortMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const { incPtto, incReal, expPtto, expReal, incRows, expRows } = computeAnnualControlMatrix(annualViewYear);

    let html = '';

    const fmtAnnual = (val) => {
        if (isPrivacyMode) return val < 0 ? '-****' : '****';
        if (financeData.useCompactNumbers && Math.abs(val) >= 1000) return formatCompact(val);
        const isNeg = val < 0;
        const absVal = Math.round(Math.abs(val));
        const numStr = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return (isNeg ? '-$' : '$') + numStr;
    };

    if (annualViewTab === 'summary') {
        let totIncP = 0, totIncR = 0, totExpP = 0, totExpR = 0;
        for(let i = 0; i < 12; i++){ totIncP = round2(totIncP+incPtto[i]); totIncR = round2(totIncR+incReal[i]); totExpP = round2(totExpP+expPtto[i]); totExpR = round2(totExpR+expReal[i]); }
        const totNetP = round2(totIncP - totExpP);
        const totNetR = round2(totIncR - totExpR);

        html += `
        <div class="glass-sub-box" style="border-color:color-mix(in srgb, var(--accent) 30%, transparent); background:var(--card-bg); padding:12px 10px;">
            <h4 style="font-size:13px; font-weight:800; color:var(--text-main); margin-bottom:12px; text-align:center; display:flex; justify-content:center; align-items:center; gap:6px;">
                <span style="color:var(--warning); display:flex;">${renderIcon('award', 16)}</span> BALANCE TOTAL AÑO ${annualViewYear}
            </h4>
            <div class="dash-strip-grid" style="grid-template-columns: 1fr 1fr 1fr; margin-bottom:0; padding:10px 4px; gap:4px;">
                <div class="dash-strip-item"><small>Ingresos</small><strong class="positive" style="font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.5px;">${fmtAnnual(totIncR)}</strong><span style="font-size:9.5px; color:var(--text-muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Ptto: ${fmtAnnual(totIncP)}</span></div>
                <div class="dash-strip-item"><small>Egresos</small><strong class="negative" style="font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.5px;">${fmtAnnual(totExpR)}</strong><span style="font-size:9.5px; color:var(--text-muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Ptto: ${fmtAnnual(totExpP)}</span></div>
                <div class="dash-strip-item"><small>Flujo Neto</small><strong class="${totNetR>=0?'positive':'negative'}" style="font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.5px;">${fmtAnnual(totNetR)}</strong><span style="font-size:9.5px; color:var(--text-muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Ptto: ${fmtAnnual(totNetP)}</span></div>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns: 50px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr); gap:4px; font-size:9.5px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin:16px 4px 6px 4px; padding-bottom:6px; border-bottom:1px solid var(--border-color);">
            <div>Mes</div>
            <div style="text-align:right;">Ptto</div>
            <div style="text-align:right;">Real</div>
            <div style="text-align:right;">Dif.</div>
        </div>
        `;

        for (let i = 0; i < 12; i++) {
            const netR = round2(incReal[i] - expReal[i]);
            const netP = round2(incPtto[i] - expPtto[i]);
            const diffInc = round2(incReal[i] - incPtto[i]);
            const diffExp = round2(expReal[i] - expPtto[i]);
            const diffNet = round2(netR - netP);
            const currM = currentDate.getMonth();
            const currY = currentDate.getFullYear();
            const isFutureAndEmpty = annualViewYear >= currY && (annualViewYear > currY || i > currM) && incPtto[i]===0 && expPtto[i]===0 && incReal[i]===0 && expReal[i]===0;
            
            if(!isFutureAndEmpty) {
                html += `
                <div class="glass-sub-box" style="padding:12px 10px; margin-bottom:10px;">
                    <h4 style="font-size:12px; font-weight:800; color:var(--text-main); margin-bottom:10px;">${shortMonths[i]} ${annualViewYear}</h4>
                    <div style="display:grid; grid-template-columns: 50px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr); gap:4px; font-size:11px; margin-bottom:6px; align-items:center; letter-spacing:-0.3px;">
                        <span style="color:var(--text-muted); font-weight:600;">Ingresos</span>
                        <span style="color:var(--text-muted); text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fmtAnnual(incPtto[i])}</span>
                        <strong class="positive" style="text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fmtAnnual(incReal[i])}</strong>
                        <span class="${diffInc >= 0 ? 'positive' : 'negative'}" style="text-align:right; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${diffInc >= 0 ? '+' : ''}${fmtAnnual(diffInc)}</span>
                    </div>
                    <div style="display:grid; grid-template-columns: 50px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr); gap:4px; font-size:11px; margin-bottom:8px; align-items:center; letter-spacing:-0.3px;">
                        <span style="color:var(--text-muted); font-weight:600;">Egresos</span>
                        <span style="color:var(--text-muted); text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fmtAnnual(expPtto[i])}</span>
                        <strong class="negative" style="text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fmtAnnual(expReal[i])}</strong>
                        <span class="${diffExp <= 0 ? 'positive' : 'negative'}" style="text-align:right; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${diffExp > 0 ? '+' : ''}${fmtAnnual(diffExp)}</span>
                    </div>
                    <div style="display:grid; grid-template-columns: 50px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr); gap:4px; font-size:11.5px; padding-top:8px; border-top:1px dashed var(--border-color); align-items:center; letter-spacing:-0.3px;">
                        <strong style="color:var(--text-main);">Neto</strong>
                        <span style="color:var(--text-muted); text-align:right; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fmtAnnual(netP)}</span>
                        <strong class="${netR>=0?'positive':'negative'}" style="text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fmtAnnual(netR)}</strong>
                        <span class="${diffNet >= 0 ? 'positive' : 'negative'}" style="text-align:right; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${diffNet >= 0 ? '+' : ''}${fmtAnnual(diffNet)}</span>
                    </div>
                </div>`;
            }
        }

    } else {
        const isInc = annualViewTab === 'income';
        const arrP = isInc ? incPtto : expPtto;
        const arrR = isInc ? incReal : expReal;
        const rows = isInc ? incRows : expRows;
        const mainColor = isInc ? 'var(--positive)' : 'var(--negative)';
        const title = isInc ? 'Total Ingresos' : 'Total Egresos';
        const iconTotal = isInc ? renderIcon('trending-up', 16) : renderIcon('arrow-down-left', 16);

        let totP = 0, totR = 0;
        for(let i=0; i<12; i++){ totP = round2(totP+arrP[i]); totR = round2(totR+arrR[i]); }

        html += `
        <div class="glass-sub-box" style="border-color:${mainColor}; background:color-mix(in srgb, ${mainColor} 6%, transparent); margin-bottom:14px; padding:12px 14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13.5px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                    <span style="color:${mainColor}; display:inline-flex;">${iconTotal}</span> ${title}
                </span>
                <strong style="font-size:17px; color:${mainColor}; letter-spacing:-0.5px;">${fmtAnnual(totR)}</strong>
            </div>
            <div style="font-size:11px; font-weight:600; color:var(--text-muted); margin-top:4px; text-align:right;">Presupuestado: ${fmtAnnual(totP)}</div>
        </div>`;

        rows.forEach(r => {
            let catTotP = 0, catTotR = 0;
            for(let i=0; i<12; i++){ catTotP = round2(catTotP+r.pttoArr[i]); catTotR = round2(catTotR+r.realArr[i]); }
            
            if (catTotP === 0 && catTotR === 0) return;

            const iconHtml = getCategoryIcon(r.name, isInc ? 'income' : 'expense');
            const catNameLabel = cleanCatName(r.name);

            let monthsHtml = '';
            for (let i = 0; i < 12; i++) {
                if (r.pttoArr[i] === 0 && r.realArr[i] === 0) continue;
                monthsHtml += `
                <div style="display:grid; grid-template-columns: 50px minmax(0,1fr) minmax(0,1fr); gap:4px; align-items:center; font-size:11px; padding:8px 4px; border-bottom:1px solid var(--border-color); letter-spacing:-0.3px;">
                    <span style="color:var(--text-muted); font-weight:600;">${shortMonths[i]}</span>
                    <span style="color:var(--text-muted); text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Ptto: ${fmtAnnual(r.pttoArr[i])}</span>
                    <strong style="color:${mainColor}; text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fmtAnnual(r.realArr[i])}</strong>
                </div>`;
            }

            html += `
            <details class="changelog-accordion" style="margin-bottom:10px; padding:12px 14px;">
                <summary style="display:flex; justify-content:space-between; align-items:flex-start; font-size:13px; font-weight:700; color:var(--text-main);">
                    <span style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                        <span class="drawer-icon-box subtle-box" style="width:28px; height:28px; border-radius:8px; color:${mainColor}; flex-shrink:0;">${iconHtml}</span>
                        <div style="display:flex; flex-direction:column; min-width:0; line-height:1.3;">
                            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px; display:block;">${catNameLabel}</span>
                            <small style="font-size:10px; color:var(--text-muted); font-weight:600; margin-top:2px;">Ptto Anual: ${fmtAnnual(catTotP)}</small>
                        </div>
                    </span>
                    <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                        <strong style="color:${mainColor}; font-size:14.5px; letter-spacing:-0.5px;">${fmtAnnual(catTotR)}</strong>
                        <span style="color:var(--text-muted); font-size:12px; margin-top:2px;">▾</span>
                    </div>
                </summary>
                <div style="margin-top:10px; padding-top:4px; border-top:1px dashed var(--border-color);">
                    ${monthsHtml}
                </div>
            </details>`;
        });
    }

    container.innerHTML = html;
};

document.getElementById('open-annual-from-budget-btn')?.addEventListener('click', () => {
    annualViewYear = viewDate.getFullYear();
    document.getElementById('annual-control-modal')?.classList.remove('hidden');
    renderAnnualControlTable();
});
document.getElementById('open-annual-from-analytics-btn')?.addEventListener('click', () => {
    annualViewYear = viewDate.getFullYear();
    document.getElementById('annual-control-modal')?.classList.remove('hidden');
    renderAnnualControlTable();
});
document.getElementById('annual-prev-year')?.addEventListener('click', () => { annualViewYear--; renderAnnualControlTable(); });
document.getElementById('annual-next-year')?.addEventListener('click', () => { annualViewYear++; renderAnnualControlTable(); });

document.querySelectorAll('#annual-filter-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#annual-filter-pills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        annualViewTab = btn.getAttribute('data-annual-tab') || 'summary';
        renderAnnualControlTable();
    });
});
// --- 14. DESGLOSES DE CUENTAS, TARJETAS, PRÉSTAMOS, GASTOS Y PRESUPUESTO ---
const renderAccountsBreakdown = (balances, totalLiquidity) => {
    if (document.getElementById('accounts-total-liquidity')) {
        document.getElementById('accounts-total-liquidity').innerText = formatMoney(totalLiquidity);
    }

    const combinedBar = document.getElementById('combined-bar');
    const combinedLegend = document.getElementById('combined-legend');
    const list = document.getElementById('accounts-summary-list');
    if (!combinedBar || !combinedLegend || !list) return;

    combinedBar.innerHTML = '';
    combinedLegend.innerHTML = '';
    list.innerHTML = '';

    const assets = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset' && !a.id.startsWith('CxC_')));

    assets.forEach((acc, index) => {
        const balance = round2(balances[acc.id] || 0);
        const isExcluded = acc.excludeFromLiquidity === true;
        const percentage = (totalLiquidity > 0 && !isExcluded) ? Math.max(0, (balance / totalLiquidity) * 100) : 0;
        const color = assetColors[index % assetColors.length];
        const starTag = acc.isDefault ? ` <span style="color:var(--accent); display:inline-flex; vertical-align:middle;" title="Predeterminada"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>` : '';
        const excludedTag = isExcluded ? `<span class="widget-badge neutral" style="font-size:9px; padding:2px 6px;">Excluida de liquidez</span>` : '';

        if (percentage > 0) {
            combinedBar.innerHTML += `<div class="segment" style="width:${percentage}%; background-color:${color};"></div>`;
        }
        if (!isExcluded) {
            combinedLegend.innerHTML += `
                <div class="legend-item">
                    <span class="dot" style="background-color:${color};"></span>
                    <span>${acc.name} ${percentage.toFixed(0)}%</span>
                </div>`;
        }

        const deleteBtnHTML = acc.id !== 'Efectivo'
            ? `<button type="button" onclick="event.stopPropagation(); deleteAccount('${acc.id}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); cursor:pointer; font-weight:bold; padding:5px 10px; border-radius:6px; margin-left:10px;">X</button>`
            : '';

        list.innerHTML += `
            <div class="acc-list-item" onclick="openAccountDetail('${acc.id}', 'asset')">
                <div class="acc-list-name" style="gap:6px;">
                    <span class="dot" style="background-color:${color};"></span>
                    <div>
                        <span>${acc.name}${starTag}</span>
                        ${excludedTag ? `<div style="margin-top:4px;">${excludedTag}</div>` : ''}
                    </div>
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="acc-list-balance">${formatMoney(balance)}</span>
                    ${deleteBtnHTML}
                    <span style="color:var(--text-muted); margin-left:8px; font-size:14px;">›</span>
                </div>
            </div>`;
    });

    syncDefaultAccountSwitchesUI();
};

const syncDefaultAccountSwitchesUI = () => {
    const existingDefault = financeData.customAccounts.find(a => a.isDefault);
    const configs = [
        { id: 'new-account-default', defaultText: 'Preseleccionar al registrar ingresos o gastos' },
        { id: 'new-card-default', defaultText: 'Preseleccionar al registrar nuevos gastos' }
    ];

    configs.forEach(({ id, defaultText }) => {
        const input = document.getElementById(id);
        if (!input) return;
        const row = input.closest('.switch-row');
        const small = row?.querySelector('small');
        if (existingDefault) {
            input.checked = false;
            input.disabled = true;
            if (row) row.style.opacity = '0.6';
            if (small) small.innerText = `Bloqueado: "${stripLeadingEmoji(existingDefault.name)}" es la predeterminada. Retírala primero.`;
        } else {
            input.disabled = false;
            if (row) row.style.opacity = '1';
            if (small) small.innerText = defaultText;
        }
    });
};

const renderCardsBreakdown = (balances) => {
    const cards = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'credit_card'));
    let totalCardsDebt = 0, totalCardsLimit = 0;

    cards.forEach(c => {
        totalCardsDebt = round2(totalCardsDebt + Math.max(0, round2(balances[c.id] || 0)));
        totalCardsLimit = round2(totalCardsLimit + round2(c.creditLimit || 0));
    });

    if (document.getElementById('cards-total-debt')) document.getElementById('cards-total-debt').innerText = formatMoney(totalCardsDebt);
    if (document.getElementById('cards-total-available')) document.getElementById('cards-total-available').innerText = formatMoney(Math.max(0, round2(totalCardsLimit - totalCardsDebt)));

    const combinedBar = document.getElementById('cards-combined-bar');
    const combinedLegend = document.getElementById('cards-combined-legend');
    const list = document.getElementById('cards-breakdown-list');
    if (!combinedBar || !combinedLegend || !list) return;

    combinedBar.innerHTML = '';
    combinedLegend.innerHTML = '';
    list.innerHTML = '';

    if (cards.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); font-size:13px; padding:10px 0;">No tienes tarjetas de crédito.</p>';
        return;
    }

    cards.forEach((card, index) => {
        const debt = round2(balances[card.id] || 0);
        const limit = round2(card.creditLimit || 0);
        const available = round2(limit - debt);
        const color = cardColors[index % cardColors.length];
        const starTag = card.isDefault ? ` <span style="color:var(--accent); display:inline-flex; vertical-align:middle;" title="Predeterminada"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>` : '';

        const debtShare = totalCardsDebt > 0 && debt > 0 ? (debt / totalCardsDebt) * 100 : 0;
        if (debtShare > 0) combinedBar.innerHTML += `<div class="segment" style="width:${debtShare}%; background-color:${color};"></div>`;

        combinedLegend.innerHTML += `
            <div class="legend-item">
                <span class="dot" style="background-color:${color};"></span>
                <span>${card.name} ${debtShare.toFixed(0)}%</span>
            </div>`;

        const usagePercent = limit > 0 ? Math.min(100, Math.max(0, (debt / limit) * 100)) : 0;
        const barColor = usagePercent > 80 ? 'var(--negative)' : (usagePercent > 50 ? '#f59e0b' : 'var(--positive)');

        list.innerHTML += `
            <div class="tc-card-item" onclick="openAccountDetail('${card.id}', 'credit_card')">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="acc-list-name">
                        <span class="dot" style="background-color:${color};"></span>
                        <span>${card.name}${starTag}</span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span class="acc-list-balance negative">${formatMoney(debt)}</span>
                        <button type="button" onclick="event.stopPropagation(); deleteAccount('${card.id}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); cursor:pointer; font-weight:bold; padding:4px 8px; border-radius:6px; margin-left:8px; font-size:11px;">X</button>
                        <span style="color:var(--text-muted); margin-left:6px; font-size:14px;">›</span>
                    </div>
                </div>
                <div class="tc-mini-bar"><div class="tc-mini-bar-fill" style="width:${usagePercent}%; background-color:${barColor};"></div></div>
                <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted);">
                    <span>Cupo: ${formatMoney(limit)}</span>
                    <span style="color:${available >= 0 ? 'var(--positive)' : 'var(--negative)'}; font-weight:600;">Disp: ${formatMoney(available)}</span>
                </div>
            </div>`;
    });

    syncDefaultAccountSwitchesUI();
    populateCardWaiverAccountSelects();
};

const syncCardWaiverFieldsVisibility = (prefix) => {
    const typeVal = document.getElementById(`${prefix}-card-mgmt-waiver-type`)?.value || 'spend';
    document.getElementById(`${prefix}-card-waiver-spend-box`)?.classList.toggle('hidden', typeVal === 'account_income');
    document.getElementById(`${prefix}-card-waiver-income-box`)?.classList.toggle('hidden', typeVal === 'spend');
};

const populateCardWaiverAccountSelects = (selectedEditAccId = '') => {
    const assets = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset' && !a.id.startsWith('CxC_')));
    const optsHtml = `<option value="">Seleccionar cuenta...</option>` + assets.map(a => `<option value="${a.id}">${stripLeadingEmoji(a.name)}</option>`).join('');

    const newSel = document.getElementById('new-card-mgmt-waiver-account');
    if (newSel) {
        const prev = newSel.value;
        newSel.innerHTML = optsHtml;
        if (prev && assets.some(a => a.id === prev)) newSel.value = prev;
    }

    const editSel = document.getElementById('edit-card-mgmt-waiver-account');
    if (editSel) {
        editSel.innerHTML = optsHtml;
        if (selectedEditAccId && assets.some(a => a.id === selectedEditAccId)) editSel.value = selectedEditAccId;
    }
};

const renderDebtsBreakdown = (balances, totalLoansDebt) => {
    const amountEl = document.getElementById('debts-total-amount');
    const combinedBar = document.getElementById('debts-combined-bar');
    const combinedLegend = document.getElementById('debts-combined-legend');
    const list = document.getElementById('debts-breakdown-list');
    if (!amountEl || !combinedBar || !combinedLegend || !list) return;

    amountEl.innerText = formatMoney(totalLoansDebt);
    combinedBar.innerHTML = '';
    combinedLegend.innerHTML = '';
    list.innerHTML = '';

    const allDebts = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'debt'));
    const activeDebts = allDebts.filter(a => balances[a.id] > 0);
    const paidDebts = allDebts.filter(a => balances[a.id] <= 0);

    const paidAccordion = document.getElementById('debts-paid-accordion');
    const paidList = document.getElementById('debts-paid-list');

    if (allDebts.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); font-size:13px; padding:10px 0;">No tienes préstamos u otras deudas.</p>';
        if (paidAccordion) paidAccordion.classList.add('hidden');
        return;
    }

    if (activeDebts.length === 0) {
        list.innerHTML = '<p style="color:var(--positive); font-size:13px; font-weight:700; padding:10px 0;">¡Felicidades! No tienes deudas activas. 🎉</p>';
    }

    const renderDebtRow = (acc, balance, isPaid, color) => {
        const qInfo = getDebtMonthlyQuotaBreakdown(acc, balance);
        const monthlyPay = isPaid ? 0 : qInfo.totalQuota;
        let subLabel = `${acc.debtPaidQuotes || 0}/${acc.debtTotalQuotes || 1}c`;
        if (qInfo.subPurchases.length > 0) {
            subLabel = acc.debtType === 'revolving'
                ? `${qInfo.subPurchases.length} comp. activas`
                : `${acc.debtPaidQuotes || 0}/${acc.debtTotalQuotes || 1}c + ${qInfo.subPurchases.length} comp.`;
        }

        const payrollTag = acc.payrollDeduction ? ' • 🏢 Libranza' : '';
        const colorClass = isPaid ? 'positive' : 'negative';
        const dotColor = isPaid ? 'var(--positive)' : color;

        return `
            <div class="acc-list-item" onclick="openAccountDetail('${acc.id}', 'debt')" style="${isPaid ? 'opacity:0.75; box-shadow:none;' : ''}">
                <div class="acc-list-name">
                    <span class="dot" style="background-color:${dotColor};"></span>
                    <div>
                        <span style="${isPaid ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${acc.name}</span>
                        <small style="display:block; font-size:11px; color:var(--text-muted); font-weight:500;">Cuota: ${formatMoney(monthlyPay)}${payrollTag} • ${subLabel}</small>
                    </div>
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="acc-list-balance ${colorClass}">${formatMoney(balance)}</span>
                    <button type="button" onclick="event.stopPropagation(); deleteAccount('${acc.id}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); cursor:pointer; font-weight:bold; padding:5px 10px; border-radius:6px; margin-left:10px;">X</button>
                    <span style="color:var(--text-muted); margin-left:8px; font-size:14px;">›</span>
                </div>
            </div>`;
    };

    activeDebts.forEach((acc, index) => {
        const balance = Math.max(0, round2(balances[acc.id] || 0));
        const percentage = totalLoansDebt > 0 ? (balance / totalLoansDebt) * 100 : 0;
        const color = debtColors[index % debtColors.length];

        if (percentage > 0) combinedBar.innerHTML += `<div class="segment" style="width:${percentage}%; background-color:${color};"></div>`;
        combinedLegend.innerHTML += `<div class="legend-item"><span class="dot" style="background-color:${color};"></span><span>${acc.name} ${percentage.toFixed(0)}%</span></div>`;
        list.innerHTML += renderDebtRow(acc, balance, false, color);
    });

    if (paidAccordion && paidList) {
        if (paidDebts.length > 0) {
            paidAccordion.classList.remove('hidden');
            paidList.innerHTML = paidDebts.map(acc => renderDebtRow(acc, 0, true, '')).join('');
        } else {
            paidAccordion.classList.add('hidden');
            paidList.innerHTML = '';
        }
    }
};

const renderExpensesBreakdown = (viewMonthId) => {
    if (document.getElementById('expenses-month-badge')) {
        document.getElementById('expenses-month-badge').innerText = formatMonthName(viewDate);
    }
    const combinedBar = document.getElementById('expenses-combined-bar');
    const combinedLegend = document.getElementById('expenses-combined-legend');
    const list = document.getElementById('expenses-category-list');
    if (!combinedBar || !combinedLegend || !list) return;

    combinedBar.innerHTML = '';
    combinedLegend.innerHTML = '';
    list.innerHTML = '';

    const monthExpenses = financeData.transactions.filter(t => !t.isDeleted && getTxMonthId(t) === viewMonthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t));
    const totalSpent = round2(monthExpenses.reduce((sum, t) => sum + round2(t.amount), 0));

    if (document.getElementById('expenses-total-amount')) document.getElementById('expenses-total-amount').innerText = formatMoney(totalSpent);
    if (totalSpent === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); font-size:13px; padding:10px 0;">No hay gastos registrados en este mes.</p>';
        return;
    }

    const totalsByCat = {};
    monthExpenses.forEach(t => {
        totalsByCat[t.category || '📦 Otros Gastos'] = round2((totalsByCat[t.category || '📦 Otros Gastos'] || 0) + round2(t.amount));
    });

    Object.entries(totalsByCat).sort((a, b) => b[1] - a[1]).forEach(([catName, amount], index) => {
        const percentage = (amount / totalSpent) * 100;
        const color = categoryColors[index % categoryColors.length];
        const cleanLabel = cleanCatName(catName);
        const catIcon = getCategoryIcon(catName, 'expense');

        combinedBar.innerHTML += `<div class="segment" style="width:${percentage}%; background-color:${color};"></div>`;
        combinedLegend.innerHTML += `
            <div class="legend-item">
                <span class="dot" style="background-color:${color};"></span>
                <span>${cleanLabel} ${percentage.toFixed(0)}%</span>
            </div>`;

        list.innerHTML += `
            <div class="acc-list-item" style="cursor:default;">
                <div class="acc-list-name" style="gap:10px;">
                    <span class="drawer-icon-box" style="width:32px; height:32px; border-radius:10px; background:color-mix(in srgb, ${color} 14%, transparent); color:${color}; flex-shrink:0;">
                        ${catIcon}
                    </span>
                    <div>
                        <span style="display:flex; align-items:center; gap:6px;">
                            <span class="dot" style="background-color:${color}; width:7px; height:7px;"></span>
                            <span>${cleanLabel}</span>
                        </span>
                        <small style="display:block; color:var(--text-muted); font-size:11px; font-weight:500; margin-top:2px;">${percentage.toFixed(1)}% del gasto mensual</small>
                    </div>
                </div>
                <span class="acc-list-balance">${formatMoney(amount)}</span>
            </div>`;
    });
};

const renderBudgetView = () => {
    const listContainer = document.getElementById('budget-categories-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const viewMonthId = getMonthId(viewDate), currentMonthIndex = viewDate.getMonth();
    const totalLimitEl = document.getElementById('budget-total-planned');
    const totalSpentEl = document.getElementById('budget-total-actual');
    const actualLabelEl = document.getElementById('budget-actual-label');

    if (currentBudgetType === 'expense') {
        if (actualLabelEl) actualLabelEl.innerText = 'Total Gastado';
        totalSpentEl?.classList.add('negative');
        totalSpentEl?.classList.remove('positive');
    } else {
        if (actualLabelEl) actualLabelEl.innerText = 'Total Recibido';
        totalSpentEl?.classList.remove('negative');
        totalSpentEl?.classList.add('positive');
    }

    // --- ACTUALIZACIÓN DINÁMICA DE TEXTOS (GASTO VS INGRESO) ---
    const catNameInput = document.getElementById('new-cat-name');
    const catLimitLabel = document.querySelector('#new-cat-limit')?.parentElement?.querySelector('label');
    const catFixedTitle = document.getElementById('cat-fixed-title-label');
    const catFixedDesc = document.getElementById('cat-fixed-desc-label');

    if (currentBudgetType === 'expense') {
        if (catNameInput) catNameInput.placeholder = 'Ej. Mascotas o Educación';
        if (catLimitLabel) catLimitLabel.innerText = 'Límite Mensual ($) - Opcional';
        if (catFixedTitle) {
            catFixedTitle.innerHTML = `<span style="color:var(--negative); display:inline-flex;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg></span> Es un Gasto Fijo`;
        }
        if (catFixedDesc) catFixedDesc.innerText = 'Ej: Arriendo, servicios. Reduce tu cupo de deuda.';
    } else {
        if (catNameInput) catNameInput.placeholder = 'Ej. Salario, Ventas o Rentas';
        if (catLimitLabel) catLimitLabel.innerText = 'Meta Mensual ($) - Opcional';
        if (catFixedTitle) {
            catFixedTitle.innerHTML = `<span style="color:var(--positive); display:inline-flex;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg></span> Es un Ingreso Fijo`;
        }
        if (catFixedDesc) catFixedDesc.innerText = 'Ej: Salario base o arriendos. Da estabilidad a tu flujo.';
    }

    let globalLimit = 0, globalSpent = 0;
    const showArchived = document.getElementById('toggle-archived-cats')?.checked;
    let categories = [...(financeData.categories[currentBudgetType] || [])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    if (!showArchived) categories = categories.filter(c => !c.isArchived);
    const monthTransactions = financeData.transactions.filter(t => !t.isDeleted && getTxMonthId(t) === viewMonthId && t.type === currentBudgetType && !t.isAdjustment && isTxClosed(t));
    const totalsByCat = {}, totalsBySubcat = {};

    monthTransactions.forEach(t => {
        totalsByCat[t.category] = round2((totalsByCat[t.category] || 0) + round2(t.amount));
        if (t.subcategory) {
            totalsBySubcat[`${t.category}::${t.subcategory}`] = round2((totalsBySubcat[`${t.category}::${t.subcategory}`] || 0) + round2(t.amount));
        }
    });

    if (categories.length === 0) {
        listContainer.innerHTML = `<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:20px 0;">No tienes categorías creadas. Crea una abajo.</p>`;
    }

    categories.forEach(catObj => {
        const cat = catObj.name, spent = totalsByCat[cat] || 0;
        let subcatsTotalLimit = 0;
        if (catObj.subcategories) {
            catObj.subcategories.forEach(sub => { subcatsTotalLimit = round2(subcatsTotalLimit + round2(sub.limit || 0)); });
        }

        const catStatus = getCategoryBudgetStatus(catObj, null, currentMonthIndex, viewDate.getFullYear());
        const limit = catStatus.currentLimit;
        globalSpent = round2(globalSpent + spent);
        globalLimit = round2(globalLimit + limit);
        
        const isExp = currentBudgetType === 'expense';
        const badgeBg = isExp ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)';
        const badgeColor = isExp ? 'var(--negative)' : 'var(--positive)';
        const catFixedBadge = catObj.isFixed ? ` <span class="widget-badge" style="font-size:9px; background:${badgeBg}; color:${badgeColor}; gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg> Fijo</span>` : '';
        
        const catRollTag = catStatus.rolloverAmt !== 0
            ? ` <small style="color:${catStatus.rolloverAmt > 0 ? 'var(--positive)' : 'var(--negative)'}; font-weight:700;">(Base ${formatCompact(catStatus.baseLimit)} ${catStatus.rolloverAmt > 0 ? '+' : '−'} ${formatCompact(Math.abs(catStatus.rolloverAmt))})</small>`
            : '';

        let progressHtml = '';
        if (limit > 0) {
            const pct = Math.min(100, (spent / limit) * 100);
            const remaining = round2(limit - spent);
            const barColor = currentBudgetType === 'expense'
                ? (pct > 90 ? 'var(--negative)' : (pct > 75 ? '#f59e0b' : 'var(--positive)'))
                : (pct >= 100 ? 'var(--positive)' : 'var(--accent)');
            
            const subText = currentBudgetType === 'expense'
                ? `<span style="color:${remaining >= 0 ? 'var(--text-muted)' : 'var(--negative)'}; font-weight:600;">${remaining >= 0 ? `Quedan ${formatMoney(remaining)}` : `Excedido ${formatMoney(Math.abs(remaining))}`}</span>`
                : `<span style="color:${remaining <= 0 ? 'var(--positive)' : 'var(--text-muted)'}; font-weight:600;">${remaining <= 0 ? '¡Meta superada!' : `Faltan ${formatMoney(remaining)}`}</span>`;

            const catLimitLabel = currentBudgetType === 'expense' ? 'Límite' : 'Meta';
            progressHtml = `
                <div style="margin-top:14px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; font-size:11.5px; margin-bottom:6px; font-weight:600; color:var(--text-muted);">
                        <span>${catLimitLabel}: ${formatMoney(limit)}${catRollTag}</span>
                        ${subText}
                    </div>
                    <div class="tc-mini-bar" style="height:8px; margin:0;"><div class="tc-mini-bar-fill" style="width:${pct}%; background-color:${barColor};"></div></div>
                </div>`;
        } else {
            progressHtml = `<div style="margin-top:10px; margin-bottom:12px; font-size:11.5px; color:var(--text-muted); font-weight:600;">Sin ${currentBudgetType === 'expense' ? 'límite definido' : 'meta definida'}</div>`;
        }

        let subcatsHtml = '';
        if (catObj.subcategories && catObj.subcategories.length > 0) {
            const sortedSubs = [...catObj.subcategories].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
            subcatsHtml += `<div style="margin-top:14px; padding-top:4px; border-top:1px dashed rgba(148,163,184,0.2); display:flex; flex-direction:column;">`;
            sortedSubs.forEach(subObj => {
                const subName = subObj.name;
                const subStatus = getCategoryBudgetStatus(catObj, subObj, currentMonthIndex, viewDate.getFullYear());
                const subLimitVal = subStatus.currentLimit;
                const subSpent = totalsBySubcat[`${cat}::${subName}`] || 0;
                const subFixedIcon = subObj.isFixed ? ` <span title="${currentBudgetType === 'expense' ? 'Gasto Fijo' : 'Ingreso Fijo'}" style="color:${currentBudgetType === 'expense' ? 'var(--negative)' : 'var(--positive)'};"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg></span>` : '';
                const subActualLabel = currentBudgetType === 'expense' ? 'Gasto' : 'Recibido';
                const subLimitLabel = currentBudgetType === 'expense' ? 'Límite' : 'Meta';
                
                let subProgressHtml = '';
                if (subLimitVal > 0) {
                    const sPct = Math.min(100, (subSpent / subLimitVal) * 100);
                    const sBarColor = currentBudgetType === 'expense' && subSpent > subLimitVal ? 'var(--negative)' : 'var(--positive)';
                    subProgressHtml = `
                        <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-bottom:3px;">
                            <span>${subActualLabel}: ${formatMoney(subSpent)}</span>
                            <span>${subLimitLabel}: ${formatMoney(subLimitVal)}</span>
                        </div>
                        <div class="tc-mini-bar" style="height:4px; margin:0; background:rgba(148,163,184,0.15);"><div class="tc-mini-bar-fill" style="width:${sPct}%; background-color:${sBarColor};"></div></div>`;
                } else {
                    subProgressHtml = `<div style="font-size:10.5px; color:var(--text-muted);">${subActualLabel}: ${formatMoney(subSpent)}</div>`;
                }

                subcatsHtml += `
                    <div class="budget-subcat-row">
                        <div class="budget-subcat-info">
                            <div style="font-size:12.5px; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:4px; margin-bottom:4px;">
                                <span style="color:var(--text-muted); opacity:0.5;">↳</span> ${subName}${subFixedIcon}
                            </div>
                            ${subProgressHtml}
                        </div>
                        <div class="budget-subcat-actions">
                            <button type="button" onclick="openSubcatMonthsConfig('${cat}', '${subName}', '${currentBudgetType}')" class="btn-icon-only" title="Editar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                            <button type="button" onclick="deleteSubcategory('${cat}', '${subName}', '${currentBudgetType}')" class="btn-icon-only" style="color:var(--negative); background:rgba(239,68,68,0.1); border-color:transparent;" title="Eliminar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                        </div>
                    </div>`;
            });
            subcatsHtml += `</div>`;
        }

        const metaPlaceholder = currentBudgetType === 'expense' ? 'Límite ($)' : 'Meta ($)';
        const fixedLabelTxt = currentBudgetType === 'expense' ? 'Gasto Fijo' : 'Ingreso Fijo';
        const fixedColorTxt = currentBudgetType === 'expense' ? 'var(--negative)' : 'var(--positive)';
        const fixedCheckHtml = `<label style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--text-muted); cursor:pointer; margin-top:2px;"><input type="checkbox" class="subcat-fixed-check" style="accent-color:${fixedColorTxt};"> ${fixedLabelTxt}</label>`;
        
        const addSubcatForm = `
            <details class="add-subcat-details">
                <summary><span style="display:flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nueva Subcategoría</span></summary>
                <form onsubmit="event.preventDefault(); addSubcategory('${cat}', '${currentBudgetType}', this.querySelector('.subcat-name-input').value, this.querySelector('.subcat-limit-input').value, this.querySelector('.subcat-fixed-check')?.checked || false, this.querySelector('.subcat-freq-select')?.value || 'monthly', parseInt(this.querySelector('.subcat-month-select')?.value, 10) || 0); this.reset();" class="add-subcat-form">
                    <div class="add-subcat-grid">
                        <input type="text" class="subcat-name-input modal-input" placeholder="Nombre..." required>
                        <input type="text" inputmode="decimal" class="subcat-limit-input money-input modal-input" placeholder="${metaPlaceholder}">
                        <select class="subcat-freq-select modal-input">
                            <option value="monthly">Mensual</option>
                            <option value="bimonthly">Bimestral</option>
                            <option value="quarterly">Trimestral</option>
                            <option value="semiannual">Semestral</option>
                            <option value="annual">Anual</option>
                        </select>
                        <select class="subcat-month-select modal-input">
                            ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => `<option value="${i}">${m}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                        ${fixedCheckHtml}
                        <button type="submit" class="btn btn-primary" style="padding:6px 14px; font-size:12px; border-radius:10px;">+ Agregar</button>
                    </div>
                </form>
            </details>
        `;

        const configBtnHtml = `<button type="button" onclick="openMonthlyBudgetConfig('${cat}', '${currentBudgetType}')" class="btn-icon-only" title="Editar Categoría"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>`;
        const deleteBtnHtml = `<button type="button" onclick="deleteCategory('${cat}', '${currentBudgetType}')" class="btn-icon-only" style="color:var(--negative); background:rgba(239,68,68,0.1); border-color:transparent;" title="Eliminar Categoría"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>`;
        
        const amountColorClass = (currentBudgetType === 'expense') ? (limit > 0 && spent > limit ? 'negative' : '') : 'positive';
        const catVectorIcon = getCategoryIcon(cat, currentBudgetType);

        listContainer.innerHTML += `
            <div class="budget-cat-card">
                <div class="budget-cat-card-header">
                    <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                        <span class="drawer-icon-box subtle-box" style="color:var(--accent); width:36px; height:36px; border-radius:12px;">${catVectorIcon}</span>
                        <div style="min-width:0;">
                            <span style="display:flex; align-items:center; gap:6px; font-size:15px; font-weight:800; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cleanCatName(cat)}${catFixedBadge}</span>
                            <div style="display:flex; gap:6px; margin-top:5px;">
                                ${configBtnHtml}
                                ${deleteBtnHtml}
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                        <span class="${amountColorClass}" style="font-size:17px; font-weight:800; letter-spacing:-0.5px;">${formatMoney(spent)}</span>
                    </div>
                </div>
                
                ${progressHtml}
                ${subcatsHtml}
                ${addSubcatForm}
            </div>`;
    });

    if (totalLimitEl) totalLimitEl.innerText = formatMoney(globalLimit);
    if (totalSpentEl) totalSpentEl.innerText = formatMoney(globalSpent);

    const globalBudgetPct = globalLimit > 0 ? Math.min(100, (globalSpent / globalLimit) * 100) : 0;
    const globalBar = document.getElementById('budget-global-progress');
    if (globalBar) {
        globalBar.style.width = `${globalBudgetPct}%`;
        globalBar.style.backgroundColor = currentBudgetType === 'expense'
            ? (globalBudgetPct > 90 ? 'var(--negative)' : (globalBudgetPct > 75 ? '#f59e0b' : 'var(--positive)'))
            : (globalBudgetPct >= 100 ? 'var(--positive)' : 'var(--accent)');
    }
};

window.openMonthlyBudgetConfig = (catName, type = 'expense') => {
    const modalEl = document.getElementById('cat-months-modal');
    const gridEl = document.getElementById('cat-12months-grid');
    const subListEl = document.getElementById('cat-edit-subcategories-list');
    if (!modalEl || !gridEl) return;

    document.getElementById('cat-months-target-name').value = catName;
    document.getElementById('cat-months-title').innerHTML = `<span style="display:inline-flex; align-items:center; gap:8px;"><span class="drawer-icon-box subtle-box" style="width:26px; height:26px; color:var(--accent);">${getCategoryIcon(catName, type)}</span> Editar: ${stripLeadingEmoji(catName)}</span>`;
    const nameInput = document.getElementById('cat-edit-name-input');
    if (nameInput) nameInput.value = stripLeadingEmoji(catName);

    const catObj = financeData.categories[type].find(c => c.name === catName);
    if (catObj) {
        if (document.getElementById('cat-edit-rollover')) document.getElementById('cat-edit-rollover').value = catObj.rollover || 'none';
        
        const fixedSwitch = document.getElementById('cat-edit-is-fixed');
        if (fixedSwitch) {
            fixedSwitch.checked = !!catObj.isFixed;
            if (document.getElementById('cat-edit-fixed-icon')) {
                document.getElementById('cat-edit-fixed-icon').style.color = type === 'expense' ? 'var(--negative)' : 'var(--positive)';
            }
            if (document.getElementById('cat-edit-fixed-text')) {
                document.getElementById('cat-edit-fixed-text').innerText = type === 'expense' ? 'Es un Gasto Fijo Global' : 'Es un Ingreso Fijo Global';
            }
        }
        
        const archBtn = document.getElementById('archive-cat-btn');
        if (archBtn) {
            archBtn.classList.remove('hidden');
            archBtn.innerHTML = catObj.isArchived 
                ? `<span style="display:inline-flex; align-items:center; gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Restaurar</span>`
                : `<span style="display:inline-flex; align-items:center; gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> Archivar</span>`;
            archBtn.onclick = () => {
                catObj.isArchived = !catObj.isArchived;
                localStorage.setItem('myFinances', JSON.stringify(financeData));
                hasUnsavedChanges = false;
                modalEl.classList.add('hidden');
                renderBudgetView();
                renderCategoryOptions(document.getElementById('type')?.value || 'expense');
            };
        }

        // Renderizar inputs para subcategorías
        if (subListEl) {
            if (catObj.subcategories && catObj.subcategories.length > 0) {
                const sortedSubs = [...catObj.subcategories].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
                subListEl.innerHTML = sortedSubs.map((sub, idx) => `
                    <div class="glass-sub-box" style="padding:10px; margin-bottom:0; background:rgba(0,0,0,0.02);">
                        <input type="hidden" class="edit-sub-old-name" value="${sub.name}">
                        <div class="form-row" style="margin-bottom:6px;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="font-size:10px;">Nombre</label>
                                <input type="text" class="edit-sub-name-input" value="${sub.name}" required style="padding:6px 8px; font-size:12.5px !important; min-height:34px !important;">
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="font-size:10px;">Tope Fijo ($)</label>
                                <input type="text" inputmode="decimal" class="edit-sub-limit-input money-input" value="${sub.limit > 0 ? formatNumberInput(sub.limit) : ''}" placeholder="0" style="padding:6px 8px; font-size:12.5px !important; min-height:34px !important;">
                            </div>
                        </div>
                        <div class="form-row" style="margin-bottom:8px;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="font-size:10px;">Frecuencia</label>
                                <select class="edit-sub-freq-select" style="padding:6px 8px; font-size:11.5px !important; min-height:34px !important;">
                                    <option value="monthly" ${sub.frequency === 'monthly' ? 'selected' : ''}>Mensual</option>
                                    <option value="bimonthly" ${sub.frequency === 'bimonthly' ? 'selected' : ''}>Bimestral</option>
                                    <option value="quarterly" ${sub.frequency === 'quarterly' ? 'selected' : ''}>Trimestral</option>
                                    <option value="semiannual" ${sub.frequency === 'semiannual' ? 'selected' : ''}>Semestral</option>
                                    <option value="annual" ${sub.frequency === 'annual' ? 'selected' : ''}>Anual</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="font-size:10px;">Mes Inicial</label>
                                <select class="edit-sub-month-select" style="padding:6px 8px; font-size:11.5px !important; min-height:34px !important;">
                                    ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => `<option value="${i}" ${(sub.startMonth || 0) == i ? 'selected' : ''}>${m}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--text-muted); cursor:pointer;">
                                <input type="checkbox" class="edit-sub-fixed-check" ${sub.isFixed ? 'checked' : ''} style="accent-color:var(--negative);"> 
                                <span style="display:inline-flex; align-items:center; gap:4px; color:var(--negative);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg> Gasto Fijo</span>
                            </label>
                            <button type="button" onclick="deleteSubcategory('${catName}', '${sub.name}', '${type}')" style="background:none; border:none; color:var(--negative); font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> Eliminar</button>
                        </div>
                    </div>
                `).join('');
                
                // Reconectar formateador en vivo a los nuevos inputs de dinero generados
                setTimeout(() => {
                    document.querySelectorAll('.edit-sub-limit-input').forEach(el => {
                        el.addEventListener('input', (e) => applyLiveDecimalFormatting(e.target));
                    });
                }, 50);
            } else {
                subListEl.innerHTML = '<small style="color:var(--text-muted); font-size:11px; display:block;">No hay subcategorías creadas.</small>';
            }
        }
    }

    const shortMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    gridEl.innerHTML = shortMonths.map((mName, idx) => `
        <div class="form-group" style="margin-bottom:6px;">
            <label style="font-size:10.5px;">${mName}</label>
            <input type="text" inputmode="decimal" id="b-m-${idx}" class="money-input" placeholder="0" style="padding:6px 8px; font-size:13px !important; min-height:36px !important;">
        </div>`).join('');

    const currentBudget = financeData.categoryBudgets[catName];
    const switchEl = document.getElementById('cat-is-monthly-check');
    const generalInput = document.getElementById('cat-general-limit-input');

    if (typeof currentBudget === 'object' && currentBudget !== null && currentBudget.isMonthly) {
        if (switchEl) switchEl.checked = true;
        document.getElementById('cat-general-limit-box')?.classList.add('hidden');
        gridEl.classList.remove('hidden');
        for (let i = 0; i < 12; i++) {
            const val = currentBudget.months ? (currentBudget.months[i] || 0) : 0;
            document.getElementById(`b-m-${i}`).value = val > 0 ? formatNumberInput(val) : '';
        }
        if (generalInput) generalInput.value = currentBudget.general > 0 ? formatNumberInput(currentBudget.general) : '';
    } else {
        if (switchEl) switchEl.checked = false;
        document.getElementById('cat-general-limit-box')?.classList.remove('hidden');
        gridEl.classList.add('hidden');
        const genVal = typeof currentBudget === 'number' ? currentBudget : (currentBudget ? currentBudget.general : 0);
        if (generalInput) generalInput.value = genVal > 0 ? formatNumberInput(genVal) : '';
        for (let i = 0; i < 12; i++) {
            const inputM = document.getElementById(`b-m-${i}`);
            if(inputM) inputM.value = genVal > 0 ? formatNumberInput(genVal) : '';
        }
    }
    hasUnsavedChanges = false;
    modalEl.classList.remove('hidden');
};

document.getElementById('cat-is-monthly-check')?.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.getElementById('cat-general-limit-box')?.classList.add('hidden');
        document.getElementById('cat-12months-grid')?.classList.remove('hidden');
    } else {
        document.getElementById('cat-general-limit-box')?.classList.remove('hidden');
        document.getElementById('cat-12months-grid')?.classList.add('hidden');
    }
});

document.getElementById('cat-months-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const oldCatName = document.getElementById('cat-months-target-name').value;
    const nameInputEl = document.getElementById('cat-edit-name-input');
    const newCatName = nameInputEl ? nameInputEl.value.trim() : oldCatName;
    const switchEl = document.getElementById('cat-is-monthly-check');
    const isMonthly = switchEl ? switchEl.checked : false;
    const rolloverEl = document.getElementById('cat-edit-rollover');
    const rollover = rolloverEl ? rolloverEl.value : 'none';
    const isFixedEl = document.getElementById('cat-edit-is-fixed');
    const isFixed = isFixedEl ? isFixedEl.checked : false;
    
    if (!newCatName) return;

    const catObj = financeData.categories[currentBudgetType].find(c => c.name === oldCatName);
    if (!catObj) return;

    // 1. CASCADA: Actualizar nombre de Categoría Principal
    if (oldCatName !== newCatName) {
        catObj.name = newCatName;
        
        // A. Migrar Transacciones
        financeData.transactions.forEach(t => {
            if (t.category === oldCatName && t.type === currentBudgetType) t.category = newCatName;
        });
        
        // B. Migrar Suscripciones
        financeData.subscriptions.forEach(sub => {
            if (sub.category === oldCatName) sub.category = newCatName;
        });

        // C. Migrar Presupuesto
        const oldBudget = financeData.categoryBudgets[oldCatName];
        if (oldBudget !== undefined) {
            financeData.categoryBudgets[newCatName] = oldBudget;
            delete financeData.categoryBudgets[oldCatName];
        }
    }
    
    // 2. CASCADA: Procesar cambios en Subcategorías
    const subListBoxes = document.querySelectorAll('#cat-edit-subcategories-list .glass-sub-box');
    subListBoxes.forEach(box => {
        const oldSubName = box.querySelector('.edit-sub-old-name').value;
        const newSubName = box.querySelector('.edit-sub-name-input').value.trim();
        const newSubLimit = parseMoneyInput(box.querySelector('.edit-sub-limit-input').value);
        const newSubFreq = box.querySelector('.edit-sub-freq-select').value;
        const newSubMonth = parseInt(box.querySelector('.edit-sub-month-select').value, 10) || 0;
        const newSubIsFixed = box.querySelector('.edit-sub-fixed-check').checked;

        if (newSubName) {
            const subObj = catObj.subcategories.find(s => s.name === oldSubName);
            if (subObj) {
                // Si cambió el nombre, cascada a las transacciones
                if (oldSubName !== newSubName) {
                    subObj.name = newSubName;
                    financeData.transactions.forEach(t => {
                        if (t.category === newCatName && t.type === currentBudgetType && t.subcategory === oldSubName) {
                            t.subcategory = newSubName;
                        }
                    });
                }
                // Actualizar límite, periodicidad y estado
                subObj.limit = newSubLimit;
                subObj.frequency = newSubFreq;
                subObj.startMonth = newSubMonth;
                subObj.isFixed = newSubIsFixed;
            }
        }
    });

    catObj.rollover = rollover;
    catObj.isFixed = isFixed;

    if (isMonthly) {
        const months = [];
        for (let i = 0; i < 12; i++) {
            const el = document.getElementById(`b-m-${i}`);
            months.push(el ? parseMoneyInput(el.value) : 0);
        }
        financeData.categoryBudgets[newCatName] = {
            isMonthly: true,
            general: parseMoneyInput(document.getElementById('cat-general-limit-input')?.value),
            months
        };
    } else {
        const genInput = document.getElementById('cat-general-limit-input');
        financeData.categoryBudgets[newCatName] = genInput ? parseMoneyInput(genInput.value) : 0;
    }
    
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    document.getElementById('cat-months-modal')?.classList.add('hidden');
    renderCategoryOptions(document.getElementById('type')?.value || 'expense');
    renderBudgetView();
    updateDashboard();
});

document.getElementById('tab-budget-expense')?.addEventListener('click', () => {
    currentBudgetType = 'expense';
    document.getElementById('tab-budget-expense')?.classList.add('active');
    document.getElementById('tab-budget-income')?.classList.remove('active');
    renderBudgetView();
});
document.getElementById('tab-budget-income')?.addEventListener('click', () => {
    currentBudgetType = 'income';
    document.getElementById('tab-budget-income')?.classList.add('active');
    document.getElementById('tab-budget-expense')?.classList.remove('active');
    renderBudgetView();
});

window.deleteCategory = (catName, type) => {
    // 1. Buscar si hay transacciones o suscripciones vinculadas
    const linkedTxs = financeData.transactions.filter(t => t.type === type && t.category === catName);
    const linkedSubs = financeData.subscriptions.filter(s => s.category === catName);

    if (linkedTxs.length > 0 || linkedSubs.length > 0) {
        const fallbackCat = prompt(`⚠️ ¡Atención! La categoría "${catName}" tiene ${linkedTxs.length} movimientos históricos y ${linkedSubs.length} suscripciones vinculadas.\n\nPara no perder tus estadísticas, ingresa el nombre EXACTO de la categoría a la que quieres mover este historial (Ej: Otros Gastos):`);
        
        if (!fallbackCat) return; // Canceló el prompt
        
        const fallbackExists = financeData.categories[type].some(c => c.name.toLowerCase() === fallbackCat.trim().toLowerCase());
        if (!fallbackExists) {
            alert(`❌ La categoría "${fallbackCat}" no existe. Debes escribir el nombre exacto de una categoría válida.`);
            return;
        }

        const exactTargetName = financeData.categories[type].find(c => c.name.toLowerCase() === fallbackCat.trim().toLowerCase()).name;

        // Migrar histórico y suscripciones
        linkedTxs.forEach(t => {
            t.category = exactTargetName;
            t.subcategory = 'General';
        });
        linkedSubs.forEach(s => s.category = exactTargetName);
    } else {
        if (!confirm(`¿Estás seguro de eliminar la categoría "${catName}" y TODAS sus subcategorías?`)) return;
    }

    // 2. Proceder con el borrado
    financeData.categories[type] = financeData.categories[type].filter(c => c.name !== catName);
    if (financeData.categoryBudgets[catName]) delete financeData.categoryBudgets[catName];
    
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    renderCategoryOptions(document.getElementById('type')?.value || 'expense');
    renderBudgetView();
    updateDashboard(); // Sincronización inmediata del tablero
};

window.addSubcategory = (catName, type, subName, limitVal, isFixed = false, frequency = 'monthly', startMonth = 0) => {
    const cleanName = subName.trim(), limit = parseMoneyInput(limitVal);
    if (!cleanName) return;
    const cat = financeData.categories[type].find(c => c.name === catName);
    if (cat && !cat.subcategories.some(s => s.name === cleanName)) {
        cat.subcategories.push({ name: cleanName, limit, isFixed, frequency, startMonth });
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        renderCategoryOptions(document.getElementById('type')?.value || 'expense');
        renderBudgetView();
    } else {
        alert('La subcategoría ya existe.');
    }
};

window.deleteSubcategory = (catName, subName, type) => {
    const linkedTxs = financeData.transactions.filter(t => t.type === type && t.category === catName && t.subcategory === subName);
    
    if (linkedTxs.length > 0) {
        if (!confirm(`⚠️ Esta subcategoría tiene ${linkedTxs.length} movimientos históricos.\n\nSi la eliminas, esos gastos se moverán a "${catName} (General)". ¿Deseas continuar?`)) return;
        
        linkedTxs.forEach(t => t.subcategory = 'General');
    } else {
        if (!confirm(`¿Eliminar la subcategoría "${subName}"?`)) return;
    }

    const cat = financeData.categories[type].find(c => c.name === catName);
    if (cat) {
        cat.subcategories = cat.subcategories.filter(s => s.name !== subName);
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        hasUnsavedChanges = false;
        renderCategoryOptions(document.getElementById('type')?.value || 'expense');
        renderBudgetView();
        updateDashboard(); // Sincronización inmediata del tablero
    }
};

document.getElementById('add-category-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-cat-name').value.trim();
    const limitInput = parseMoneyInput(document.getElementById('new-cat-limit').value);
    const rolloverEl = document.getElementById('new-cat-rollover');
    const rollover = rolloverEl ? rolloverEl.value : 'none';
    const isFixed = !!document.getElementById('new-cat-is-fixed')?.checked;
    
    if (!nameInput) return;

    if (financeData.categories[currentBudgetType].some(c => c.name.toLowerCase() === nameInput.toLowerCase())) {
        alert('Ya existe una categoría con ese nombre.');
        return;
    }

    financeData.categories[currentBudgetType].push({ 
        name: nameInput, 
        isFixed, 
        rollover, 
        subcategories: [] 
    });
    
    if (limitInput > 0) financeData.categoryBudgets[nameInput] = limitInput;

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('add-category-form').reset();
    document.getElementById('new-cat-rollover-hint')?.classList.add('hidden');
    e.target.closest('details')?.removeAttribute('open');
    hasUnsavedChanges = false;
    renderCategoryOptions(document.getElementById('type')?.value || 'expense');
    renderBudgetView();
});

// --- 15. FORMULARIOS CREACIÓN DE CUENTAS, TARJETAS Y PRÉSTAMOS ---
document.getElementById('add-account-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-account-name').value.trim();
    const initial = parseMoneyInput(document.getElementById('new-account-initial').value);
    const makeDefault = !!document.getElementById('new-account-default')?.checked;
    const excludeLiquidity = !document.getElementById('new-account-liquidity')?.checked;

    if (!name || financeData.customAccounts.some(a => a.id.toLowerCase() === name.toLowerCase())) {
        alert('Nombre de cuenta inválido o duplicado.');
        return;
    }

    financeData.customAccounts.push({ id: name, name, category: 'asset', isDefault: false, showWhenZero: false, excludeFromLiquidity: excludeLiquidity });
    if (makeDefault) setDefaultAccount(name, false);

    if (initial > 0) {
        const now = new Date();
        financeData.transactions.push({
            id: now.getTime(), monthId: getMonthId(now), type: 'income', status: 'closed',
            account: name, description: 'Saldo Inicial', amount: initial,
            date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
            isAdjustment: true
        });
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('add-account-form').reset();
    e.target.closest('details')?.removeAttribute('open');
    hasUnsavedChanges = false;
    renderAccountSelects();
    updateDashboard();
});

const updateNewCardPreview = () => {
    const prevEl = document.getElementById('new-card-available-preview');
    const lim = parseMoneyInput(document.getElementById('new-card-limit')?.value);
    const dbt = parseMoneyInput(document.getElementById('new-card-debt')?.value);
    if (prevEl) prevEl.innerText = `Saldo disponible inicial: ${formatMoney(round2(lim - dbt))}`;

    // Mostrar cuota estimada inicial (opcional) solo si la tarjeta ya trae deuda
    const initQuotaGroup = document.getElementById('new-card-initial-quota-group');
    if (initQuotaGroup) initQuotaGroup.classList.toggle('hidden', dbt <= 0);

    // Vista previa dinámica del seguro según modalidad elegida
    const insPreview = document.getElementById('new-card-insurance-preview');
    const insRate = parseMoneyInput(document.getElementById('new-card-insurance-rate')?.value);
    const insRule = document.getElementById('new-card-insurance-rule')?.value || 'per_million_min1';
    if (insPreview) {
        if (dbt > 0 && insRate > 0) {
            let estIns = 0;
            if (insRule === 'fixed_if_debt') estIns = insRate;
            else if (insRule === 'per_million_ceil') estIns = round2(Math.max(1, Math.ceil(dbt / 1000000)) * insRate);
            else if (insRule === 'per_million_exact') estIns = round2((dbt / 1000000) * insRate);
            else estIns = round2(Math.max(1, dbt / 1000000) * insRate);
            insPreview.innerText = `Seguro estimado sobre saldo inicial: ${formatMoney(estIns)}/mes`;
        } else if (insRule === 'per_million_min1') {
            insPreview.innerText = 'Si el saldo es ≤ $1M cobra la tarifa base; si es mayor, proporcional.';
        } else {
            insPreview.innerText = 'Solo se suma cuando exista saldo adeudado (> $0).';
        }
    }
};
['new-card-limit', 'new-card-debt', 'new-card-insurance-rate'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateNewCardPreview);
});
document.getElementById('new-card-insurance-rule')?.addEventListener('change', updateNewCardPreview);
document.getElementById('new-card-has-mgmt-fee')?.addEventListener('change', (e) => {
    document.getElementById('new-card-mgmt-fields')?.classList.toggle('hidden', !e.target.checked);
    populateCardWaiverAccountSelects();
    syncCardWaiverFieldsVisibility('new');
});
document.getElementById('new-card-mgmt-waiver-type')?.addEventListener('change', () => syncCardWaiverFieldsVisibility('new'));
document.getElementById('edit-card-mgmt-waiver-type')?.addEventListener('change', () => syncCardWaiverFieldsVisibility('edit'));

document.getElementById('new-card-has-insurance')?.addEventListener('change', (e) => {
    document.getElementById('new-card-insurance-fields')?.classList.toggle('hidden', !e.target.checked);
    updateNewCardPreview();
});

document.getElementById('new-card-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-card-name').value.trim();
    const limit = parseMoneyInput(document.getElementById('new-card-limit').value);
    const debt = parseMoneyInput(document.getElementById('new-card-debt').value);
    const makeDefault = !!document.getElementById('new-card-default')?.checked;
    const hasMgmtFee = !!document.getElementById('new-card-has-mgmt-fee')?.checked;
    const hasInsurance = !!document.getElementById('new-card-has-insurance')?.checked;
    const waiverType = document.getElementById('new-card-mgmt-waiver-type')?.value || 'spend';

    if (!name || financeData.customAccounts.some(a => a.id.toLowerCase() === name.toLowerCase())) {
        alert('Nombre de tarjeta inválido o duplicado.');
        return;
    }

    financeData.customAccounts.push({
        id: name, name, category: 'credit_card', isDefault: false, showWhenZero: false, creditLimit: limit,
        initialDebtQuota: debt > 0 ? parseMoneyInput(document.getElementById('new-card-initial-quota')?.value) : 0,
        cutoffDay: parseInt(document.getElementById('new-card-cutoff').value, 10) || 15,
        paymentDay: parseInt(document.getElementById('new-card-payment').value, 10) || 30,
        rate: parseMoneyInput(document.getElementById('new-card-rate').value),
        rateType: document.getElementById('new-card-rate-type').value,
        zeroInterestMax: parseInt(document.getElementById('new-card-zero-interest-max').value, 10) || 0,
        hasMgmtFee,
        mgmtFee: hasMgmtFee ? parseMoneyInput(document.getElementById('new-card-mgmt-fee')?.value) : 0,
        mgmtFeeRule: document.getElementById('new-card-mgmt-rule')?.value || 'balance_or_use',
        mgmtFeeWaiverType: waiverType,
        mgmtFeeWaiverSpend: hasMgmtFee && (waiverType === 'spend' || waiverType === 'either') ? parseMoneyInput(document.getElementById('new-card-mgmt-waiver')?.value) : 0,
        mgmtFeeWaiverAccountId: hasMgmtFee && (waiverType === 'account_income' || waiverType === 'either') ? (document.getElementById('new-card-mgmt-waiver-account')?.value || '') : '',
        mgmtFeeWaiverIncome: hasMgmtFee && (waiverType === 'account_income' || waiverType === 'either') ? parseMoneyInput(document.getElementById('new-card-mgmt-waiver-income')?.value) : 0,
        hasInsurance,
        insurancePerMillion: hasInsurance ? parseMoneyInput(document.getElementById('new-card-insurance-rate')?.value) : 0,
        insuranceRule: document.getElementById('new-card-insurance-rule')?.value || 'per_million_min1'
    });

    if (makeDefault) setDefaultAccount(name, false);

    if (debt > 0) {
        const now = new Date();
        financeData.transactions.push({
            id: now.getTime(), monthId: getMonthId(now), type: 'expense', status: 'closed',
            account: name, description: 'Saldo Inicial Tarjeta', amount: debt,
            date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
            isAdjustment: true
        });
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('new-card-form').reset();
    document.getElementById('new-card-initial-quota-group')?.classList.add('hidden');
    document.getElementById('new-card-mgmt-fields')?.classList.add('hidden');
    document.getElementById('new-card-insurance-fields')?.classList.add('hidden');
    e.target.closest('details')?.removeAttribute('open');
    updateNewCardPreview();
    hasUnsavedChanges = false;
    renderAccountSelects();
    updateDashboard();
});

document.getElementById('new-debt-type')?.addEventListener('change', (e) => {
    const type = e.target.value;
    const isRevolving = type === 'revolving';
    const isEducation = type === 'education';
    
    const nameInput = document.getElementById('new-debt-name');
    const commerceGroup = document.getElementById('new-debt-revolving-commerce-group');
    const eduPeriodGroup = document.getElementById('new-debt-education-period-group');
    const rateInput = document.getElementById('new-debt-rate');
    
    if (nameInput) {
        nameInput.placeholder = isRevolving ? 'Nombre del Cupo (Ej. Addi, Sistecrédito)' : (isEducation ? 'Universidad / Instituto (Ej. UNIR)' : 'Nombre (Ej. Crédito Vehículo)');
    }
    if (commerceGroup) commerceGroup.classList.toggle('hidden', !isRevolving);
    if (eduPeriodGroup) eduPeriodGroup.classList.toggle('hidden', !isEducation);
    
    if (rateInput && isEducation) {
        rateInput.value = '0';
        rateInput.readOnly = true;
    } else if (rateInput) {
        rateInput.readOnly = false;
    }
});

document.getElementById('new-debt-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-debt-name').value.trim();
    const debtType = document.getElementById('new-debt-type')?.value || 'fixed';
    const commerceName = document.getElementById('new-debt-commerce')?.value.trim() || '';
    const payrollDeduction = document.getElementById('new-debt-payroll')?.checked || false;
    const isNewExpense = !!document.getElementById('new-debt-is-new-expense')?.checked;

    const original = parseMoneyInput(document.getElementById('new-debt-original').value);
    const currentStr = document.getElementById('new-debt-current').value;
    const current = currentStr ? parseMoneyInput(currentStr) : original;

    const totalQuotes = parseInt(document.getElementById('new-debt-total-quotes').value, 10) || 1;
    const paidQuotes = parseInt(document.getElementById('new-debt-paid-quotes').value, 10) || 0;

    const rate = parseMoneyInput(document.getElementById('new-debt-rate').value);
    const rateType = document.getElementById('new-debt-rate-type').value;

    let monthlyPay = parseMoneyInput(document.getElementById('new-debt-monthly-payment').value);
    if (monthlyPay === 0 && original > 0) {
        monthlyPay = calculateAmortization(original, totalQuotes, rate, rateType).payment;
    }

    const id = 'Deuda_' + Date.now();
    const isRevWithPurchase = debtType === 'revolving' && current > 0;
    const academicPeriod = document.getElementById('new-debt-academic-period')?.value.trim() || '';
    const paymentDay = parseInt(document.getElementById('new-debt-payment-day')?.value, 10) || 1;

    financeData.customAccounts.push({
        id, name, category: 'debt', debtType, isDefault: false, showWhenZero: false,
        debtOriginal: original,
        debtTotalQuotes: isRevWithPurchase ? 0 : totalQuotes,
        debtPaidQuotes: isRevWithPurchase ? 0 : paidQuotes,
        debtRate: rate,
        debtRateType: rateType,
        debtMonthlyPayment: isRevWithPurchase ? 0 : monthlyPay,
        payrollDeduction,
        academicPeriod: debtType === 'education' ? academicPeriod : '',
        paymentDay: debtType === 'education' ? paymentDay : null,
        extraFees: debtType === 'education' ? [] : undefined
    });

    if (current > 0) {
        const now = new Date();
        if (debtType === 'revolving') {
            const amort = calculateAmortization(original, totalQuotes, rate, rateType);
            const remSchedule = amort.schedule.slice(paidQuotes);
            const rawRemCapital = round2(remSchedule.reduce((s, r) => s + r.principal, 0));
            const extraPrincipalPaid = current < rawRemCapital ? round2(rawRemCapital - current) : 0;

            financeData.transactions.push({
                id: now.getTime(), monthId: getMonthId(now), type: 'expense', status: 'closed',
                account: id, category: '🛍️ Compras', subcategory: 'General',
                description: commerceName || 'Compra Inicial Cupo',
                amount: original,
                date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
                isAdjustment: !isNewExpense,
                installments: totalQuotes,
                paidInstallments: paidQuotes,
                rate, rateType,
                zeroInterest: rate === 0,
                monthlyQuota: monthlyPay,
                totalWithInterest: amort.totalWithInterest,
                extraPrincipalPaid
            });

            if (current > rawRemCapital) {
                financeData.transactions.push({
                    id: now.getTime() + 600, monthId: getMonthId(now), type: 'expense', status: 'closed',
                    account: id, description: `⚖️ Ajuste Capital (${commerceName || 'Compra Inicial'})`,
                    amount: round2(current - rawRemCapital),
                    date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
                    isAdjustment: true
                });
            }
        } else {
            financeData.transactions.push({
                id: now.getTime(), monthId: getMonthId(now), type: 'expense', status: 'closed',
                account: id, category: '📦 Otros Gastos', subcategory: 'General',
                description: isNewExpense ? `Préstamo: ${name}` : 'Saldo Inicial Préstamo',
                amount: current,
                date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
                isAdjustment: !isNewExpense
            });
        }
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('new-debt-form').reset();
    document.getElementById('new-debt-revolving-commerce-group')?.classList.add('hidden');
    e.target.closest('details')?.removeAttribute('open');
    hasUnsavedChanges = false;
    renderSalaryUI(true); // <-- FUERZA LA SINCRONIZACIÓN DEL PRESUPUESTO
    updateDashboard();
    renderAccountSelects();
});

// --- 15.5 GESTOR DE SUSCRIPCIONES ---
const pickDefaultSubscriptionCategory = (catSelect, serviceName = '') => {
    if (!catSelect || catSelect.options.length === 0) return;
    const opts = Array.from(catSelect.options);
    const cleanName = serviceName.trim().toLowerCase();

    if (cleanName) {
        if (typeof inferCategoryFromName === 'function') {
            const inferred = inferCategoryFromName(cleanName, 'expense');
            if (inferred) {
                const exact = opts.find(o => o.value === `${inferred}::General`) || opts.find(o => o.value.startsWith(`${inferred}::`));
                if (exact) { catSelect.value = exact.value; return; }
            }
        }
        if (/gym|gimnasio|smart\s*fit|bodytech|salud|fit/.test(cleanName)) {
            const healthOpt = opts.find(o => /salud|deporte|bienestar/i.test(o.value));
            if (healthOpt) { catSelect.value = healthOpt.value; return; }
        }
        if (/icloud|google|chatgpt|claude|office|microsoft|adobe|canva|dropbox|dominio|hosting|software/.test(cleanName)) {
            const techOpt = opts.find(o => /tecnolog|software|suscrip|entreten/i.test(o.value));
            if (techOpt) { catSelect.value = techOpt.value; return; }
        }
    }

    const subOpt = opts.find(o => /suscrip/i.test(o.value)) || opts.find(o => /entreten/i.test(o.value));
    if (subOpt) catSelect.value = subOpt.value;
};

window.renderSubscriptionsView = () => {
    const listContainer = document.getElementById('subscriptions-list-container');
    if (!listContainer) return;

    const modalTitleEl = document.querySelector('#subscriptions-modal h3');
    if (modalTitleEl && /fijos/i.test(modalTitleEl.innerText)) modalTitleEl.innerText = 'Suscripciones';

    const formTitleEl = document.getElementById('sub-form-title');
    const editingId = document.getElementById('edit-sub-id')?.value || '';
    if (formTitleEl && !editingId) formTitleEl.innerText = 'Nueva Suscripción';

    const accSelect = document.getElementById('new-sub-account');
    const catSelect = document.getElementById('new-sub-category');
    if (accSelect) {
        const prevAcc = accSelect.value;
        const liqAndCards = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => (a.category === 'asset' && !a.id.startsWith('CxC_')) || a.category === 'credit_card'));
        accSelect.innerHTML = liqAndCards.map(a => `<option value="${a.id}">${stripLeadingEmoji(a.name)}${a.isDefault ? ' ★' : ''}</option>`).join('');
        if (prevAcc && liqAndCards.some(a => a.id === prevAcc)) accSelect.value = prevAcc;
    }
    if (catSelect) {
        const prevCat = catSelect.value;
        let html = '';
        [...(financeData.categories.expense || [])].filter(c => !c.isArchived && !c.archived).sort((a, b) => a.name.localeCompare(b.name, 'es')).forEach(cat => {
            if (cat.subcategories && cat.subcategories.length > 0) {
                html += `<optgroup label="${cleanCatName(cat.name)}">`;
                html += `<option value="${cat.name}::General">${cleanCatName(cat.name)} (General)</option>`;
                [...cat.subcategories].filter(s => !s.isArchived && !s.archived).sort((a, b) => a.name.localeCompare(b.name, 'es')).forEach(sub => {
                    html += `<option value="${cat.name}::${sub.name}">↳ ${cleanCatName(sub.name)}</option>`;
                });
                html += `</optgroup>`;
            } else {
                html += `<option value="${cat.name}::General">${cleanCatName(cat.name)}</option>`;
            }
        });
        catSelect.innerHTML = html;
        if (prevCat && Array.from(catSelect.options).some(o => o.value === prevCat)) {
            catSelect.value = prevCat;
        } else if (!editingId) {
            pickDefaultSubscriptionCategory(catSelect);
        }

        if (!catSelect.dataset.userBound) {
            catSelect.dataset.userBound = '1';
            catSelect.addEventListener('change', () => { catSelect.dataset.userEdited = '1'; });
        }
    }

    const nameInput = document.getElementById('new-sub-name');
    if (nameInput && !nameInput.dataset.autoCatBound) {
        nameInput.dataset.autoCatBound = '1';
        nameInput.addEventListener('input', () => {
            if (catSelect && catSelect.dataset.userEdited !== '1') {
                pickDefaultSubscriptionCategory(catSelect, nameInput.value);
            }
        });
    }

    const nextDateInput = document.getElementById('new-sub-next-date');
    if (nextDateInput && !editingId && !nextDateInput.value) {
        nextDateInput.value = currentDate.toLocaleDateString('en-CA');
    }

    const subForm = document.getElementById('new-subscription-form');
    if (subForm && !document.getElementById('sub-quick-chips-bar')) {
        const chipsBar = document.createElement('div');
        chipsBar.id = 'sub-quick-chips-bar';
        chipsBar.className = 'sub-quick-chips';
        const presets = ['Netflix', 'Spotify', 'YouTube', 'Prime', 'iCloud+', 'ChatGPT', 'Gimnasio'];
        chipsBar.innerHTML = presets.map(p => `<button type="button" class="sub-quick-chip" data-sub-preset="${p}">${p}</button>`).join('');
        chipsBar.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-sub-preset]');
            if (!chip) return;
            const presetName = chip.getAttribute('data-sub-preset');
            if (nameInput) nameInput.value = presetName;
            const cycleEl = document.getElementById('new-sub-cycle');
            if (cycleEl) cycleEl.value = 'monthly';
            if (catSelect) {
                catSelect.dataset.userEdited = '0';
                pickDefaultSubscriptionCategory(catSelect, presetName);
            }
            document.getElementById('new-sub-amount')?.focus();
        });
        subForm.prepend(chipsBar);
    }

    listContainer.innerHTML = '';
    let totalMonthly = 0, totalAnnual = 0;
    const allSubs = financeData.subscriptions || [];
    const activeSubs = allSubs.filter(s => s.status === 'active');
    const pausedSubs = allSubs.filter(s => s.status === 'paused');

    if (activeSubs.length === 0 && pausedSubs.length === 0) {
        listContainer.innerHTML = '<p style="color:var(--text-muted); font-size:12.5px; text-align:center; padding:20px 0;">No tienes suscripciones registradas.</p>';
        document.getElementById('subs-monthly-total').innerText = '$ 0,00';
        document.getElementById('subs-annual-total').innerText = '$ 0,00';
        return;
    }

    const cycleLabels = { monthly: 'Mes', bimonthly: 'Bimestre', quarterly: 'Trimestre', semiannual: 'Semestre', annual: 'Año', weekly: 'Semana' };

    if (activeSubs.length === 0) {
        listContainer.innerHTML = '<p style="color:var(--text-muted); font-size:12px; text-align:center; padding:12px 0;">No tienes suscripciones activas en este momento.</p>';
    }

    activeSubs.sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate)).forEach(sub => {
        let monthlyEquiv = sub.amount;
        if (sub.cycle === 'annual') monthlyEquiv = round2(sub.amount / 12);
        else if (sub.cycle === 'semiannual') monthlyEquiv = round2(sub.amount / 6);
        else if (sub.cycle === 'quarterly') monthlyEquiv = round2(sub.amount / 3);
        else if (sub.cycle === 'bimonthly') monthlyEquiv = round2(sub.amount / 2);
        else if (sub.cycle === 'weekly') monthlyEquiv = round2((sub.amount * 52) / 12);

        totalMonthly = round2(totalMonthly + monthlyEquiv);
        totalAnnual = round2(totalAnnual + round2(monthlyEquiv * 12));

        let diffDays = 999, badgeHtml = '', dateLabel = '';
        if (sub.nextBillingDate) {
            const [y, m, d] = sub.nextBillingDate.split('-').map(Number);
            const nextDate = new Date(y, m - 1, d, 8, 30, 0);
            dateLabel = `${d} ${nextDate.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}.`;
            diffDays = Math.ceil((nextDate - currentDate) / (1000 * 3600 * 24));
            if (diffDays < 0) badgeHtml = `<span class="widget-badge danger" style="font-size:9.5px; padding:2px 6px;">Vencido</span>`;
            else if (diffDays === 0) badgeHtml = `<span class="widget-badge warn" style="font-size:9.5px; padding:2px 6px;">Hoy</span>`;
            else if (diffDays <= 7) badgeHtml = `<span class="widget-badge warn" style="font-size:9.5px; padding:2px 6px;">En ${diffDays}d</span>`;
            else badgeHtml = `<span class="widget-badge neutral" style="font-size:9.5px; padding:2px 6px;">${dateLabel}</span>`;
        }

        const accObj = getAccountObj(sub.accountId);
        const accTag = accObj ? `<span style="display:inline-flex; align-items:center; gap:3px; opacity:0.85;">${getAccountIcon(accObj.category)} ${stripLeadingEmoji(accObj.name)}</span>` : '';
        const reserveBadge = sub.reserveInBudget ? `<span class="widget-badge good" style="font-size:9px; padding:2px 6px;">Ptto</span>` : '';
        const btnClass = diffDays <= 7 ? 'btn-confirm-pending' : 'mini-action-btn';

        listContainer.innerHTML += `
            <div class="acc-list-item" style="padding:12px 14px; gap:8px;">
                <div class="acc-list-name" style="flex:1; min-width:0;">
                    <div style="flex:1; min-width:0;">
                        <span style="font-size:14px; font-weight:800; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${stripLeadingEmoji(sub.name)}</span>
                        <small style="display:flex; align-items:center; flex-wrap:wrap; gap:5px; font-size:11px; color:var(--text-muted); font-weight:600; margin-top:2px;">
                            <b style="color:var(--text-main);">${formatMoneyHtml(sub.amount)}</b>/${cycleLabels[sub.cycle] || 'Mes'} ${badgeHtml} ${reserveBadge}
                        </small>
                        ${accTag ? `<small style="display:flex; align-items:center; gap:6px; font-size:10.5px; color:var(--text-muted); margin-top:3px;">${accTag}${dateLabel && diffDays <= 7 ? ` • Cobro: ${dateLabel}` : ''}</small>` : ''}
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:5px; align-items:flex-end; flex-shrink:0;">
                    <button type="button" onclick="processSubscriptionPayment('${sub.id}')" class="${btnClass}" style="margin:0;">Pagar</button>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button type="button" onclick="toggleSubscriptionPause('${sub.id}')" class="mini-action-btn" style="background:transparent; border:none; padding:2px 5px; font-size:10.5px; color:var(--text-muted);">Pausar</button>
                        <button type="button" onclick="editSubscription('${sub.id}')" class="mini-action-btn" style="background:transparent; border:none; padding:2px 5px; font-size:10.5px; color:var(--accent);">Editar</button>
                    </div>
                </div>
            </div>`;
    });

    if (pausedSubs.length > 0) {
        const pausedItemsHtml = pausedSubs.map(sub => `
            <div class="acc-list-item" style="padding:10px 12px; gap:8px; opacity:0.78; margin-bottom:6px;">
                <div style="flex:1; min-width:0;">
                    <span style="font-size:13px; font-weight:700; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${stripLeadingEmoji(sub.name)}</span>
                    <small style="font-size:10.5px; color:var(--text-muted);">${formatMoney(sub.amount)}/${cycleLabels[sub.cycle] || 'Mes'} • Pausada</small>
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button type="button" onclick="toggleSubscriptionPause('${sub.id}')" class="mini-action-btn" style="font-size:10.5px; padding:4px 8px; color:var(--positive);">Reanudar</button>
                    <button type="button" onclick="editSubscription('${sub.id}')" class="mini-action-btn" style="background:transparent; border:none; padding:2px 5px; font-size:10.5px; color:var(--text-muted);">Editar</button>
                </div>
            </div>
        `).join('');

        listContainer.innerHTML += `
            <details class="changelog-accordion" style="margin-top:10px; background:transparent; border:1px solid var(--border-color); padding:8px 10px; box-shadow:none;">
                <summary style="font-size:11px; color:var(--text-muted); font-weight:700;">
                    <span>Suscripciones pausadas (${pausedSubs.length})</span>
                    <span>▾</span>
                </summary>
                <div style="margin-top:8px;">${pausedItemsHtml}</div>
            </details>
        `;
    }

    document.getElementById('subs-monthly-total').innerText = formatMoney(totalMonthly);
    document.getElementById('subs-annual-total').innerText = formatMoney(totalAnnual);
};

window.toggleSubscriptionPause = (subId) => {
    const sub = financeData.subscriptions.find(s => s.id === subId);
    if (!sub) return;
    sub.status = sub.status === 'paused' ? 'active' : 'paused';
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    updateDashboard();
    renderSubscriptionsView();
};

window.processSubscriptionPayment = (subId) => {
    const sub = financeData.subscriptions.find(s => s.id === subId);
    if (!sub) return;
    const now = new Date();
    const txDateStr = sub.nextBillingDate || now.toLocaleDateString('en-CA');

    let catName = 'Entretenimiento', subName = 'General';
    if (sub.category) {
        const parts = sub.category.split('::');
        catName = parts[0] || catName;
        subName = parts[1] || subName;
    }

    financeData.transactions.push({
        id: now.getTime() + Math.floor(Math.random() * 500),
        monthId: getMonthId(new Date(txDateStr + 'T12:00:00')),
        type: 'expense',
        status: 'closed',
        account: sub.accountId || getDefaultAccountId(false),
        category: catName,
        subcategory: subName,
        description: `Suscripción: ${stripLeadingEmoji(sub.name)}`,
        amount: sub.amount,
        date: `${new Date(txDateStr + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, 08:00`,
        isAdjustment: false
    });

    const [y, m, d] = txDateStr.split('-').map(Number);
    const nextD = new Date(y, m - 1, d);
    if (sub.cycle === 'monthly') nextD.setMonth(nextD.getMonth() + 1);
    else if (sub.cycle === 'bimonthly') nextD.setMonth(nextD.getMonth() + 2);
    else if (sub.cycle === 'quarterly') nextD.setMonth(nextD.getMonth() + 3);
    else if (sub.cycle === 'semiannual') nextD.setMonth(nextD.getMonth() + 6);
    else if (sub.cycle === 'annual') nextD.setFullYear(nextD.getFullYear() + 1);
    else if (sub.cycle === 'weekly') nextD.setDate(nextD.getDate() + 7);

    sub.nextBillingDate = nextD.toLocaleDateString('en-CA');
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    updateDashboard();
    renderSubscriptionsView();
};

window.editSubscription = (id) => {
    const sub = financeData.subscriptions.find(s => s.id === id);
    if (!sub) return;
    document.getElementById('sub-form-title').innerText = 'Editar Suscripción';
    const wrap = document.getElementById('sub-details-wrapper');
    if (wrap) {
        wrap.open = true;
        wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    document.getElementById('edit-sub-id').value = sub.id;
    document.getElementById('new-sub-name').value = sub.name;
    document.getElementById('new-sub-amount').value = formatNumberInput(sub.amount);
    document.getElementById('new-sub-cycle').value = sub.cycle;
    document.getElementById('new-sub-next-date').value = sub.nextBillingDate;
    document.getElementById('new-sub-account').value = sub.accountId;
    const catSelect = document.getElementById('new-sub-category');
    if (catSelect) {
        catSelect.dataset.userEdited = '1';
        const targetVal = sub.category && sub.category.includes('::') ? sub.category : `${sub.category}::General`;
        if (Array.from(catSelect.options).some(o => o.value === targetVal)) {
            catSelect.value = targetVal;
        }
    }
    if (document.getElementById('new-sub-reserve')) document.getElementById('new-sub-reserve').checked = !!sub.reserveInBudget;
    document.getElementById('btn-sub-cancel').classList.remove('hidden');
    document.getElementById('btn-sub-delete').classList.remove('hidden');
};

document.getElementById('btn-sub-cancel')?.addEventListener('click', () => {
    document.getElementById('new-subscription-form').reset();
    document.getElementById('sub-form-title').innerText = 'Nueva Suscripción';
    document.getElementById('edit-sub-id').value = '';
    const wrap = document.getElementById('sub-details-wrapper');
    if (wrap) wrap.open = false;
    const catSelect = document.getElementById('new-sub-category');
    if (catSelect) {
        catSelect.dataset.userEdited = '0';
        pickDefaultSubscriptionCategory(catSelect);
    }
    const nextDateInput = document.getElementById('new-sub-next-date');
    if (nextDateInput) nextDateInput.value = currentDate.toLocaleDateString('en-CA');
    document.getElementById('btn-sub-cancel').classList.add('hidden');
    document.getElementById('btn-sub-delete').classList.add('hidden');
});

document.getElementById('btn-sub-delete')?.addEventListener('click', () => {
    const id = document.getElementById('edit-sub-id').value;
    if (confirm('¿Eliminar esta suscripción? (No se borrarán los pagos pasados)')) {
        financeData.subscriptions = financeData.subscriptions.filter(s => s.id !== id);
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        document.getElementById('btn-sub-cancel').click();
        updateDashboard();
        renderSubscriptionsView();
    }
});

document.getElementById('new-subscription-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-sub-id').value;
    const rawCat = document.getElementById('new-sub-category').value || '';
    const existing = id ? financeData.subscriptions.find(s => s.id === id) : null;
    const subData = {
        name: stripLeadingEmoji(document.getElementById('new-sub-name').value.trim()),
        amount: parseMoneyInput(document.getElementById('new-sub-amount').value),
        cycle: document.getElementById('new-sub-cycle').value,
        nextBillingDate: document.getElementById('new-sub-next-date').value,
        accountId: document.getElementById('new-sub-account').value,
        category: rawCat.split('::')[0] || rawCat,
        reserveInBudget: !!document.getElementById('new-sub-reserve')?.checked,
        reminderDays: 3,
        status: existing ? existing.status : 'active'
    };

    if (id) {
        const index = financeData.subscriptions.findIndex(s => s.id === id);
        if (index !== -1) financeData.subscriptions[index] = { ...financeData.subscriptions[index], ...subData };
    } else {
        subData.id = 'Sub_' + Date.now();
        financeData.subscriptions.push(subData);
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('btn-sub-cancel').click();
    updateDashboard();
    renderSubscriptionsView();
});



// --- 15B. DETALLE DE CUENTAS, TARJETAS, PRÉSTAMOS, BOLSILLOS Y ACTIVOS ---
window.openAccountDetail = (accountId, originType = 'home') => {
    const acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    lastAccountViewOrigin = originType;

    ['analytics-modal', 'cards-modal', 'debts-modal', 'receivables-modal', 'assets-modal', 'asset-detail-modal', 'budget-modal', 'accounts-list-view', 'health-modal'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });

    document.getElementById('accounts-modal')?.classList.remove('hidden');
    document.getElementById('account-detail-view')?.classList.remove('hidden');

    if (document.getElementById('detail-account-name')) {
        const starSvg = acc.isDefault ? `<span style="color:var(--accent); display:inline-flex; align-items:center; margin-left:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>` : '';
        document.getElementById('detail-account-name').innerHTML = `${stripLeadingEmoji(acc.name)}${starSvg}`;
    }
    if (document.getElementById('reconcile-account-id')) document.getElementById('reconcile-account-id').value = acc.id;
    if (document.getElementById('reconcile-real-amount')) document.getElementById('reconcile-real-amount').value = '';

    const lockNoticeEl = document.getElementById('default-account-lock-notice');
    if (lockNoticeEl) {
        lockNoticeEl.classList.add('hidden');
        lockNoticeEl.innerHTML = '';
    }

    const defBtn = document.getElementById('toggle-default-account-btn');
    if (defBtn) {
        if (acc.category === 'debt') defBtn.classList.add('hidden');
        else {
            defBtn.classList.remove('hidden');
            const otherDefault = financeData.customAccounts.find(a => a.isDefault && a.id !== acc.id);
            const starIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="${acc.isDefault ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; margin-bottom:-2px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
            defBtn.innerHTML = `${starIcon} Predet.`;
            defBtn.style.opacity = otherDefault ? '0.5' : '1';
            defBtn.title = acc.isDefault
                ? 'Toca para retirar de predeterminada'
                : (otherDefault ? `Bloqueado: ${stripLeadingEmoji(otherDefault.name)} ya es predeterminada` : 'Marcar como predeterminada');
        }
    }

    if (document.getElementById('account-show-when-zero')) {
        document.getElementById('account-show-when-zero').checked = !!acc.showWhenZero;
    }
    if (document.getElementById('account-include-liquidity')) {
        const liqCheck = document.getElementById('account-include-liquidity');
        liqCheck.checked = !acc.excludeFromLiquidity;
        liqCheck.dispatchEvent(new Event('change')); // Fuerza a que se actualice el texto de ayuda
    }

    const currentBal = round2(currentBalances[acc.id] || 0);
    if (document.getElementById('detail-account-balance')) document.getElementById('detail-account-balance').innerText = formatMoney(currentBal);

    const cardExtraBox = document.getElementById('card-extra-info'), editCardBtn = document.getElementById('edit-card-settings-btn');
    const debtExtraBox = document.getElementById('debt-extra-info'), editDebtBtn = document.getElementById('edit-debt-settings-btn');
    ['edit-card-form', 'edit-debt-form', 'pay-installment-box', 'amortization-panel'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
    document.getElementById('card-statement-overview')?.classList.remove('hidden');
    if (editCardBtn) {
        editCardBtn.style.background = '';
        editCardBtn.style.borderColor = '';
    }
    
    // Forzar reinicio de estado del botón universitario
    if (document.getElementById('open-education-extra-btn')) document.getElementById('open-education-extra-btn').classList.add('hidden');

    if (acc.category === 'credit_card') {
        cardExtraBox?.classList.remove('hidden'); editCardBtn?.classList.remove('hidden');
        debtExtraBox?.classList.add('hidden'); editDebtBtn?.classList.add('hidden');

        const limit = round2(acc.creditLimit || 0), available = round2(limit - currentBal), availEl = document.getElementById('detail-card-available');
        if (document.getElementById('detail-card-limit')) document.getElementById('detail-card-limit').innerText = formatMoney(limit);
        if (availEl) { availEl.innerText = formatMoney(available); availEl.className = available >= 0 ? 'positive' : 'negative'; }
        if (document.getElementById('detail-card-dates')) document.getElementById('detail-card-dates').innerText = `Corte: día ${acc.cutoffDay || '-'} • Pago: día ${acc.paymentDay || '-'}`;

        // Renderizar Extractos y Proyección Mensual (con Gráfica Interactiva)
        const est = calculateCardMinPaymentEstimate(acc, currentBal);
        const chartIconSlot = document.getElementById('statement-chart-icon-slot');
        if (chartIconSlot && !chartIconSlot.innerHTML) chartIconSlot.innerHTML = renderIcon('chart', 14);

        const isViewingCurrentMonth = getMonthId(viewDate) === getMonthId(currentDate);
        const statementRefDate = isViewingCurrentMonth
            ? currentDate
            : new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const statementOffsets = [-1, 0, 1, 2, 3, 4];
        const statementSeries = statementOffsets.map(off => calculateCardStatementProjection(acc, currentBal, off, statementRefDate));
        const maxBarAmt = Math.max(...statementSeries.map(s => s.minPayment), 1);

        const monthSelectEl = document.getElementById('detail-card-statement-month');
        const chartBoxEl = document.getElementById('card-statement-chart-box');
        const chartToggleBtn = document.getElementById('toggle-card-statement-chart-btn');

        let selectedOffset = 0;

        const renderStatementForOffset = (targetOffset) => {
            selectedOffset = Number(targetOffset);
            const st = statementSeries.find(s => s.monthOffset === selectedOffset) || statementSeries.find(s => s.monthOffset === 0) || statementSeries[1];

            if (monthSelectEl) monthSelectEl.value = String(st.monthOffset);

            if (chartBoxEl) {
                chartBoxEl.innerHTML = `
                    <div class="statement-bars-grid">
                        ${statementSeries.map(s => {
                            const hPct = s.minPayment > 0 ? Math.max(12, Math.round((s.minPayment / maxBarAmt) * 100)) : 8;
                            const isSelected = s.monthOffset === st.monthOffset;
                            return `
                                <button type="button" class="statement-bar-col ${isSelected ? 'active' : ''}" data-stmt-offset="${s.monthOffset}" title="${s.fullMonthLabel}: ${formatMoney(s.minPayment)}">
                                    <div class="statement-bar-fill" style="height:${hPct}%;"></div>
                                    <span class="statement-bar-label">${s.shortLabel}</span>
                                </button>`;
                        }).join('')}
                    </div>`;
            }

            const eyebrowEl = document.getElementById('detail-card-min-eyebrow');
            if (eyebrowEl) {
                eyebrowEl.innerText = st.isHistorical
                    ? 'Total facturado en este extracto'
                    : (st.monthOffset === 0 ? 'Este es tu pago mínimo estimado' : 'Pago mínimo estimado proyectado');
            }
            if (document.getElementById('detail-card-min-payment')) {
                document.getElementById('detail-card-min-payment').innerText = formatMoney(st.minPayment);
            }
            if (document.getElementById('detail-card-next-due-badge')) {
                document.getElementById('detail-card-next-due-badge').innerText = st.badgeText;
            }
            if (document.getElementById('detail-card-cutoff-debt')) {
                document.getElementById('detail-card-cutoff-debt').innerText = formatMoney(st.debtAtCutoff);
            }
            if (document.getElementById('detail-card-pay-date-label')) {
                document.getElementById('detail-card-pay-date-label').innerText = st.paymentDateLabel;
            }
            if (document.getElementById('detail-card-cut-date-label')) {
                document.getElementById('detail-card-cut-date-label').innerText = st.cutoffDateLabel;
            }
            if (document.getElementById('detail-card-cycle-usage')) {
                document.getElementById('detail-card-cycle-usage').innerText = st.monthOffset === 0
                    ? `Consumos en este ciclo: ${formatMoney(st.cycleSpend)} (${st.cycleTxCount} mov.)`
                    : (st.isHistorical ? `Movimientos del periodo: ${st.cycleTxCount}` : 'Proyección basada en cuotas vigentes');
            }

            const breakdownEl = document.getElementById('detail-card-min-breakdown');
            if (breakdownEl) {
                let rowsHtml = '';

                st.payments.forEach(pay => {
                    rowsHtml += `
                        <div class="statement-line-item" onclick="forceCloseAllModals(); openEditModal(${pay.txId});">
                            <div class="statement-line-top">
                                <div>
                                    <span class="statement-line-title" style="color:var(--positive);">${pay.title}</span>
                                    <span class="statement-line-sub">${pay.subtitle}</span>
                                </div>
                                <span class="statement-line-amount positive">- ${formatMoney(pay.amount)}</span>
                            </div>
                        </div>`;
                });

                st.items.forEach((it, idx) => {
                    const hasDetail = (it.principal > 0 || it.interest > 0) && it.kind !== 'historical_exp';
                    const detailId = `stmt-item-detail-${st.monthOffset}-${idx}`;
                    const clickAttr = hasDetail
                        ? `onclick="document.getElementById('${detailId}')?.classList.toggle('hidden');"`
                        : (it.txId ? `onclick="forceCloseAllModals(); openEditModal(${it.txId});"` : '');

                    rowsHtml += `
                        <div class="statement-line-item" ${clickAttr}>
                            <div class="statement-line-top">
                                <div style="min-width:0; flex:1;">
                                    <span class="statement-line-title">${it.title}</span>
                                    <span class="statement-line-sub">${it.subtitle}</span>
                                </div>
                                <span class="statement-line-amount ${it.isWaived ? 'positive' : ''}">
                                    ${formatMoney(it.amount)}
                                    ${hasDetail ? '<span style="font-size:10px; color:var(--text-muted);">▾</span>' : ''}
                                </span>
                            </div>
                            ${hasDetail ? `
                                <div id="${detailId}" class="statement-line-detail hidden">
                                    <span>Capital: <b class="positive">${formatMoney(it.principal)}</b> • Interés: <b class="negative">${formatMoney(it.interest)}</b></span>
                                    ${it.txId ? `<button type="button" class="mini-action-btn" style="padding:2px 7px; font-size:10px;" onclick="event.stopPropagation(); forceCloseAllModals(); openEditModal(${it.txId});">Editar</button>` : ''}
                                </div>` : ''}
                        </div>`;
                });

                if (!rowsHtml) {
                    rowsHtml = `<span style="color:var(--text-muted); font-size:11px;">Sin cargos, abonos ni cuotas pendientes en este periodo.</span>`;
                }
                breakdownEl.innerHTML = rowsHtml;
            }
        };

        if (monthSelectEl) {
            monthSelectEl.innerHTML = statementSeries
                .map(s => `<option value="${s.monthOffset}">${s.fullMonthLabel}</option>`)
                .join('');
            monthSelectEl.onchange = (e) => renderStatementForOffset(e.target.value);
        }

        if (chartBoxEl) {
            chartBoxEl.onclick = (e) => {
                const barBtn = e.target.closest('.statement-bar-col');
                if (barBtn) renderStatementForOffset(barBtn.getAttribute('data-stmt-offset'));
            };
        }

        if (chartToggleBtn && chartBoxEl) {
            chartToggleBtn.onclick = () => {
                const isHidden = chartBoxEl.classList.toggle('hidden');
                chartToggleBtn.classList.toggle('active', !isHidden);
            };
        }

        const defaultStmt = statementSeries.find(s => s.isCurrentCycle) || statementSeries.find(s => s.monthOffset === 0) || statementSeries[1];
        renderStatementForOffset(defaultStmt.monthOffset);

        const payCardMinBtn = document.getElementById('btn-pay-card-min');
        if (payCardMinBtn) {
            payCardMinBtn.onclick = () => {
                openOmniModal({
                    type: 'transfer',
                    title: `Abonar a ${stripLeadingEmoji(acc.name)}`,
                    account: getDefaultAccountId(true),
                    toAccount: acc.id,
                    amount: est.totalMinPayment > 0 ? est.totalMinPayment : currentBal,
                    description: `Pago tarjeta ${stripLeadingEmoji(acc.name)}`,
                    lockType: true,
                    hideRecurrence: true
                });
            };
        }

        const chargeFeesBtn = document.getElementById('btn-charge-card-fees');
        if (chargeFeesBtn) {
            const totalFees = round2(est.mgmtFeeAmt + est.insuranceAmt);
            if (totalFees > 0) {
                chargeFeesBtn.classList.remove('hidden');
                chargeFeesBtn.onclick = () => {
                    const itemsDesc = [];
                    if (est.mgmtFeeAmt > 0) itemsDesc.push(`• Cuota de manejo: ${formatMoney(est.mgmtFeeAmt)}`);
                    if (est.insuranceAmt > 0) itemsDesc.push(`• Seguro vida deudores: ${formatMoney(est.insuranceAmt)}`);
                    if (!confirm(`¿Cargar al saldo de ${stripLeadingEmoji(acc.name)} en este mes?\n\n${itemsDesc.join('\n')}\n\nTotal a cargar: ${formatMoney(totalFees)}`)) return;

                    const now = new Date();
                    const mId = getMonthId(now);
                    const dateStr = `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
                    const intCat = financeData.categories.expense.find(c => stripLeadingEmoji(c.name) === 'Cuotas / Intereses');
                    const catName = intCat ? intCat.name : 'Cuotas / Intereses';

                    if (est.mgmtFeeAmt > 0) {
                        financeData.transactions.push({
                            id: now.getTime() + 10, monthId: mId, type: 'expense', status: 'closed',
                            account: acc.id, category: catName, subcategory: 'General',
                            description: `Cuota de manejo (${stripLeadingEmoji(acc.name)})`,
                            amount: est.mgmtFeeAmt, date: dateStr, isAdjustment: false
                        });
                    }
                    if (est.insuranceAmt > 0) {
                        financeData.transactions.push({
                            id: now.getTime() + 20, monthId: mId, type: 'expense', status: 'closed',
                            account: acc.id, category: catName, subcategory: 'General',
                            description: `Seguro vida deudores (${stripLeadingEmoji(acc.name)})`,
                            amount: est.insuranceAmt, date: dateStr, isAdjustment: false
                        });
                    }

                    localStorage.setItem('myFinances', JSON.stringify(financeData));
                    updateDashboard();
                    openAccountDetail(acc.id, lastAccountViewOrigin);
                };
            } else {
                chargeFeesBtn.classList.add('hidden');
            }
        }

        const icsBtn = document.getElementById('btn-detail-card-ics');
        if (icsBtn) {
            icsBtn.onclick = () => {
                const payDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), acc.paymentDay || 15, 8, 30, 0);
                downloadIcsEvent(`Pagar Tarjeta ${acc.name}`, `Pago tarjeta ${acc.name} • Mínimo estimado: ${formatMoney(est.totalMinPayment)} • Saldo total: ${formatMoney(currentBal)}.`, payDate);
            };
        }

        if (document.getElementById('edit-card-limit')) document.getElementById('edit-card-limit').value = formatNumberInput(limit);
        if (document.getElementById('edit-card-initial-quota')) document.getElementById('edit-card-initial-quota').value = acc.initialDebtQuota > 0 ? formatNumberInput(acc.initialDebtQuota) : '';
        if (document.getElementById('edit-card-cutoff')) document.getElementById('edit-card-cutoff').value = acc.cutoffDay || 15;
        if (document.getElementById('edit-card-payment')) document.getElementById('edit-card-payment').value = acc.paymentDay || 30;
        if (document.getElementById('edit-card-rate')) document.getElementById('edit-card-rate').value = acc.rate ? formatNumberInput(acc.rate) : '';
        if (document.getElementById('edit-card-rate-type')) document.getElementById('edit-card-rate-type').value = acc.rateType || 'monthly';
        if (document.getElementById('edit-card-zero-interest-max')) document.getElementById('edit-card-zero-interest-max').value = acc.zeroInterestMax || 0;

        const editMgmtCheck = document.getElementById('edit-card-has-mgmt-fee');
        if (editMgmtCheck) editMgmtCheck.checked = !!acc.hasMgmtFee;
        document.getElementById('edit-card-mgmt-fields')?.classList.toggle('hidden', !acc.hasMgmtFee);
        if (document.getElementById('edit-card-mgmt-fee')) document.getElementById('edit-card-mgmt-fee').value = acc.mgmtFee > 0 ? formatNumberInput(acc.mgmtFee) : '';
        if (document.getElementById('edit-card-mgmt-rule')) document.getElementById('edit-card-mgmt-rule').value = acc.mgmtFeeRule || (acc.mgmtFeeOnlyWithDebt === false ? 'always' : 'balance_or_use');
        const editWaiverType = acc.mgmtFeeWaiverType || 'spend';
        if (document.getElementById('edit-card-mgmt-waiver-type')) document.getElementById('edit-card-mgmt-waiver-type').value = editWaiverType;
        if (document.getElementById('edit-card-mgmt-waiver')) document.getElementById('edit-card-mgmt-waiver').value = acc.mgmtFeeWaiverSpend > 0 ? formatNumberInput(acc.mgmtFeeWaiverSpend) : '';
        populateCardWaiverAccountSelects(acc.mgmtFeeWaiverAccountId || '');
        if (document.getElementById('edit-card-mgmt-waiver-income')) document.getElementById('edit-card-mgmt-waiver-income').value = acc.mgmtFeeWaiverIncome > 0 ? formatNumberInput(acc.mgmtFeeWaiverIncome) : '';
        syncCardWaiverFieldsVisibility('edit');

        const editInsCheck = document.getElementById('edit-card-has-insurance');
        if (editInsCheck) editInsCheck.checked = !!acc.hasInsurance;
        document.getElementById('edit-card-insurance-fields')?.classList.toggle('hidden', !acc.hasInsurance);
        if (document.getElementById('edit-card-insurance-rate')) document.getElementById('edit-card-insurance-rate').value = acc.insurancePerMillion > 0 ? formatNumberInput(acc.insurancePerMillion) : '';
        if (document.getElementById('edit-card-insurance-rule')) document.getElementById('edit-card-insurance-rule').value = acc.insuranceRule || 'per_million_min1';

        const deferredListEl = document.getElementById('card-deferred-list');
        if (deferredListEl) {
            const pendingPurchases = getPendingCardPurchases(acc.id);
            deferredListEl.innerHTML = pendingPurchases.length === 0
                ? '<small style="color:var(--text-muted); font-size:11px;">No hay compras con cuotas pendientes.</small>'
                : pendingPurchases.map(item => `
                    <div class="deferred-item-card" onclick="forceCloseAllModals(); openEditModal(${item.tx.id});" style="cursor:pointer;">
                        <div class="deferred-item-top"><span>${item.tx.description}</span><span class="negative">${formatMoney(item.remCapital)}</span></div>
                        <div class="deferred-item-sub"><span>Cuotas: <b>${item.paidInstallments}/${item.installments}</b></span><span>Próx. cuota: <b>${formatMoney(item.nextQuota)}</b></span></div>
                    </div>`).join('');
        }
    } else if (acc.category === 'debt') {
        cardExtraBox?.classList.add('hidden'); editCardBtn?.classList.add('hidden');
        debtExtraBox?.classList.remove('hidden'); editDebtBtn?.classList.remove('hidden');

        const originalDebt = round2(acc.debtOriginal || currentBal);
        const rate = acc.debtRate || 0, rateType = acc.debtRateType || 'monthly';
        const revPurchasesSection = document.getElementById('revolving-purchases-section');
        const nextQuotaBox = document.getElementById('detail-debt-next-quota-box');
        const amortBtn = document.getElementById('toggle-amortization-btn');
        const qInfo = getDebtMonthlyQuotaBreakdown(acc, currentBal);

        // Mostrar sección de compras/desembolsos tanto en Cupo Rotativo como en Préstamo Fijo
        if (acc.debtType === 'revolving' || acc.debtType === 'fixed') {
            revPurchasesSection?.classList.remove('hidden');
            const secTitle = document.getElementById('debt-purchases-section-title');
            if (secTitle) {
                secTitle.innerText = acc.debtType === 'revolving'
                    ? 'Compras Pendientes (Cupo Rotativo)'
                    : 'Compras / Desembolsos Adicionales';
            }
            const formTitle = document.getElementById('debt-new-purchase-form-title');
            if (formTitle) {
                formTitle.innerText = acc.debtType === 'revolving'
                    ? 'Registrar Compra en Cupo'
                    : 'Registrar Compra / Desembolso';
            }
            const listEl = document.getElementById('revolving-purchases-list');
            if (listEl) {
                const emptyText = acc.debtType === 'revolving'
                    ? 'No hay compras pendientes.'
                    : 'No hay compras o desembolsos adicionales.';
                listEl.innerHTML = qInfo.subPurchases.length === 0
                    ? `<small style="color:var(--text-muted); font-size:11px;">${emptyText}</small>`
                    : qInfo.subPurchases.map(item => `
                        <div class="deferred-item-card" onclick="forceCloseAllModals(); openEditModal(${item.tx.id});" style="cursor:pointer;">
                            <div class="deferred-item-top"><span>${item.tx.description}</span><span class="negative">${formatMoney(item.remCapital)}</span></div>
                            <div class="deferred-item-sub"><span>Cuotas: <b>${item.paidInstallments}/${item.installments}</b></span><span>Cuota Mes: <b>${formatMoney(item.nextQuota)}</b></span></div>
                        </div>`).join('');
            }
        } else {
            revPurchasesSection?.classList.add('hidden');
        }

        if (acc.debtType === 'revolving') {
            nextQuotaBox?.classList.add('hidden');
            amortBtn?.classList.add('hidden');
            const totalQuotes = acc.debtTotalQuotes || 1, paidQuotes = acc.debtPaidQuotes || 0;
            const progressPct = originalDebt > 0 ? Math.min(100, (Math.max(0, originalDebt - currentBal) / originalDebt) * 100) : 0;
            if (document.getElementById('detail-debt-original')) document.getElementById('detail-debt-original').innerText = formatMoney(originalDebt);
            if (document.getElementById('detail-debt-progress-pct')) document.getElementById('detail-debt-progress-pct').innerText = `${progressPct.toFixed(1)}%`;
            if (document.getElementById('detail-debt-progress-fill')) document.getElementById('detail-debt-progress-fill').style.width = `${progressPct}%`;
            if (document.getElementById('detail-debt-payment')) document.getElementById('detail-debt-payment').innerText = formatMoney(qInfo.totalQuota);
            if (document.getElementById('detail-debt-installments')) document.getElementById('detail-debt-installments').innerText = qInfo.subPurchases.length > 0 ? `${qInfo.subPurchases.length} comp.` : `${paidQuotes} / ${totalQuotes}`;
            if (document.getElementById('detail-debt-rate')) document.getElementById('detail-debt-rate').innerText = `${String(rate).replace('.', ',')}% ${rateType === 'monthly' ? 'M.V.' : 'E.A.'}`;

            if (document.getElementById('pay-debt-principal')) document.getElementById('pay-debt-principal').value = formatNumberInput(qInfo.totalPrincipal);
            if (document.getElementById('pay-debt-interest')) document.getElementById('pay-debt-interest').value = formatNumberInput(qInfo.totalInterest);
            if (document.getElementById('pay-debt-date')) document.getElementById('pay-debt-date').value = new Date().toLocaleDateString('en-CA');
            if (document.getElementById('pay-debt-source-acc')) {
                document.getElementById('pay-debt-source-acc').innerHTML = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset')).map(a => `<option value="${a.id}">${a.name}${a.isDefault ? ' ⭐' : ''}</option>`).join('');
            }
        } else {
            nextQuotaBox?.classList.remove('hidden');
            amortBtn?.classList.remove('hidden');
            const totalQuotes = acc.debtTotalQuotes || 1, paidQuotes = acc.debtPaidQuotes || 0;
            const remQuotes = Math.max(1, totalQuotes - paidQuotes);
            const amortData = calculateAmortization(originalDebt, totalQuotes, rate, rateType);
            const realRemAmort = (currentBal > 0 && paidQuotes < totalQuotes)
                ? calculateAmortization(currentBal, remQuotes, rate, rateType)
                : { schedule: [], totalInterest: 0, payment: amortData.payment };
            activeAmortizationSchedule = realRemAmort.schedule;
            const principalPaid = Math.max(0, round2(originalDebt - currentBal));
            const progressPct = originalDebt > 0 ? Math.min(100, (principalPaid / originalDebt) * 100) : 0;

            if (document.getElementById('detail-debt-original')) document.getElementById('detail-debt-original').innerText = formatMoney(originalDebt);
            if (document.getElementById('detail-debt-progress-pct')) document.getElementById('detail-debt-progress-pct').innerText = `${progressPct.toFixed(1)}%`;
            if (document.getElementById('detail-debt-progress-fill')) document.getElementById('detail-debt-progress-fill').style.width = `${progressPct}%`;
            if (document.getElementById('detail-debt-payment')) document.getElementById('detail-debt-payment').innerText = formatMoney(qInfo.totalQuota);
            if (document.getElementById('detail-debt-installments')) document.getElementById('detail-debt-installments').innerText = qInfo.subPurchases.length > 0 ? `${paidQuotes}/${totalQuotes} + ${qInfo.subPurchases.length}` : `${paidQuotes} / ${totalQuotes}`;
            if (document.getElementById('detail-debt-rate')) document.getElementById('detail-debt-rate').innerText = `${String(rate).replace('.', ',')}% ${rateType === 'monthly' ? 'M.V.' : 'E.A.'}`;

            if (document.getElementById('detail-debt-next-principal')) document.getElementById('detail-debt-next-principal').innerText = formatMoney(qInfo.totalPrincipal);
            if (document.getElementById('detail-debt-next-interest')) document.getElementById('detail-debt-next-interest').innerText = formatMoney(qInfo.totalInterest);

            let totalInterestRemaining = 0;
            activeAmortizationSchedule.forEach(r => totalInterestRemaining = round2(totalInterestRemaining + r.interest));
            if (document.getElementById('detail-debt-total-interest')) document.getElementById('detail-debt-total-interest').innerText = formatMoney(totalInterestRemaining);

            if (document.getElementById('pay-debt-principal')) document.getElementById('pay-debt-principal').value = formatNumberInput(qInfo.totalPrincipal);
            if (document.getElementById('pay-debt-interest')) document.getElementById('pay-debt-interest').value = formatNumberInput(qInfo.totalInterest);
            if (document.getElementById('pay-debt-date')) document.getElementById('pay-debt-date').value = new Date().toLocaleDateString('en-CA');
            if (document.getElementById('pay-debt-source-acc')) {
                document.getElementById('pay-debt-source-acc').innerHTML = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset')).map(a => `<option value="${a.id}">${a.name}${a.isDefault ? ' ⭐' : ''}</option>`).join('');
            }

            const standardAmortView = document.getElementById('standard-amortization-view');
            const eduScheduleView = document.getElementById('education-schedule-view');
            const openEduExtraBtn = document.getElementById('open-education-extra-btn');

            if (acc.debtType === 'education') {
                if (openEduExtraBtn) openEduExtraBtn.classList.remove('hidden');
                if (standardAmortView) standardAmortView.classList.add('hidden');
                if (eduScheduleView) eduScheduleView.classList.remove('hidden');

                const intRow = document.getElementById('detail-debt-total-interest');
                if (intRow && intRow.parentElement) intRow.parentElement.classList.add('hidden');
                
                const quotaAmt = round2(acc.debtMonthlyPayment || 0) > 0 ? round2(acc.debtMonthlyPayment) : amortData.payment;
                const currentBal = round2(currentBalances[acc.id] || 0);
                const pastStep = paidQuotes > 0 ? round2((originalDebt - currentBal) / paidQuotes) : quotaAmt;

                const eduBody = document.getElementById('education-table-body');
                if (eduBody) {
                    let html = '';
                    let runningBal = round2(originalDebt);
                    let baseDate = new Date();
                    baseDate.setMonth(baseDate.getMonth() - paidQuotes);

                    // Render Cuotas de Matrícula con la cuota mensual establecida
                    for (let i = 1; i <= totalQuotes; i++) {
                        const isPaid = i <= paidQuotes;
                        baseDate.setMonth(baseDate.getMonth() + 1);
                        const mLabel = `${getShortMonthLabel(baseDate)} ${String(baseDate.getFullYear()).slice(-2)}`;
                        
                        if (isPaid) {
                            runningBal = i === paidQuotes ? currentBal : Math.max(0, round2(runningBal - pastStep));
                        } else {
                            runningBal = Math.max(0, round2(runningBal - quotaAmt));
                        }

                        html += `<tr>
                            <td style="text-align:left;">Cuota ${String(i).padStart(2, '0')}/${totalQuotes}</td>
                            <td>${mLabel}</td>
                            <td class="${isPaid ? 'positive' : 'negative'}">${formatMoney(quotaAmt)}</td>
                            <td>${formatMoney(runningBal)}</td>
                        </tr>`;
                    }
                    
                    // Render Trámites Adicionales (Ej. Constancias)
                    if (acc.extraFees && acc.extraFees.length > 0) {
                        acc.extraFees.forEach(fee => {
                            html += `<tr style="background:var(--hover-bg);">
                                <td style="text-align:left; color:var(--text-muted);">${fee.name}</td>
                                <td>Extra</td>
                                <td class="${fee.paid ? 'positive' : 'negative'}">${formatMoney(fee.amount)}</td>
                                <td>-</td>
                            </tr>`;
                        });
                    }
                    eduBody.innerHTML = html;
                }
                
                // Acción para agregar trámites (sin emojis)
                if (openEduExtraBtn) {
                    openEduExtraBtn.onclick = () => {
                        const feeName = prompt('Nombre del Trámite Extra (Ej. Constancia, Derechos de Grado):');
                        if (!feeName) return;
                        const feeAmtStr = prompt('Valor del Trámite ($):');
                        if (!feeAmtStr) return;
                        const feeAmt = parseMoneyInput(feeAmtStr);
                        if (feeAmt <= 0) return;
                        
                        const isPaid = confirm('¿Este trámite ya fue pagado? (Aceptar = Sí, Cancelar = Queda en deuda)');
                        
                        if (!acc.extraFees) acc.extraFees = [];
                        acc.extraFees.push({ name: feeName, amount: feeAmt, paid: isPaid });
                        
                        if (!isPaid) {
                            acc.debtOriginal = round2((acc.debtOriginal || 0) + feeAmt);
                            const now = new Date();
                            financeData.transactions.push({ id: now.getTime(), monthId: getMonthId(now), type: 'expense', status: 'closed', account: acc.id, description: `Cargo Universidad: ${feeName}`, amount: feeAmt, date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: true });
                        } else {
                            const now = new Date();
                            const eduCat = financeData.categories.expense.find(c => stripLeadingEmoji(c.name) === 'Educación');
                            financeData.transactions.push({
                                id: now.getTime(), monthId: getMonthId(now), type: 'expense', status: 'closed', 
                                account: getDefaultAccountId(false), category: eduCat ? eduCat.name : 'Educación', subcategory: 'Trámites', 
                                description: `Trámite: ${feeName}`, amount: feeAmt, 
                                date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: false 
                            });
                        }
                        localStorage.setItem('myFinances', JSON.stringify(financeData));
                        updateDashboard();
                        openAccountDetail(acc.id, originType);
                    };
                }

                const btnDownloadEdu = document.getElementById('btn-download-edu-receipt');
                if (btnDownloadEdu) {
                    btnDownloadEdu.onclick = () => {
                        let txt = `COMPROBANTE DE PAGOS - ${acc.name.toUpperCase()}\n`;
                        txt += `Periodo Académico: ${acc.academicPeriod || 'N/A'}\n`;
                        txt += `Fecha de generación: ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}\n`;
                        txt += `----------------------------------------\n\n`;
                        txt += `CUOTAS (${paidQuotes} pagadas de ${totalQuotes}):\n`;
                        for (let i = 1; i <= totalQuotes; i++) {
                            txt += `- Cuota ${String(i).padStart(2, '0')}: ${i <= paidQuotes ? '[PAGADO] (' + formatMoney(quotaAmt) + ')' : '[PENDIENTE] (' + formatMoney(quotaAmt) + ')'}\n`;
                        }
                        if (acc.extraFees && acc.extraFees.length > 0) {
                            txt += `\nTRÁMITES EXTRAORDINARIOS:\n`;
                            acc.extraFees.forEach(fee => {
                                txt += `- ${fee.name}: ${formatMoney(fee.amount)} ${fee.paid ? '[PAGADO]' : '[PENDIENTE]'}\n`;
                            });
                        }
                        txt += `\n----------------------------------------\n`;
                        txt += `Deuda Inicial Base: ${formatMoney(acc.debtOriginal)}\n`;
                        txt += `Generado localmente por Mis Finanzas (Función IF)\n`;

                        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Soporte_Pagos_${acc.name.replace(/\s+/g, '_')}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    };
                }

            } else {
                if (openEduExtraBtn) openEduExtraBtn.classList.add('hidden');
                if (standardAmortView) standardAmortView.classList.remove('hidden');
                if (eduScheduleView) eduScheduleView.classList.add('hidden');
                
                const intRow = document.getElementById('detail-debt-total-interest');
                if (intRow && intRow.parentElement) intRow.parentElement.classList.remove('hidden');
                
                const tbody = document.getElementById('amortization-table-body');
                if (tbody) {
                    const remSched = activeAmortizationSchedule;
                    if (remSched.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Préstamo liquidado</td></tr>';
                    } else {
                        let h = '';
                        let baseDate = new Date();
                        remSched.forEach(row => {
                            baseDate.setMonth(baseDate.getMonth() + 1);
                            const mLabel = `${getShortMonthLabel(baseDate)} ${String(baseDate.getFullYear()).slice(-2)}`;
                            h += `<tr><td>${mLabel}</td><td>${formatMoney(row.payment)}</td><td class="positive">${formatMoney(row.principal)}</td><td class="negative">${formatMoney(row.interest)}</td><td>${formatMoney(row.balance)}</td></tr>`;
                        });
                        tbody.innerHTML = h;
                    }
                }
            }
        }
        if (document.getElementById('edit-debt-type')) document.getElementById('edit-debt-type').value = acc.debtType || 'fixed';
        if (document.getElementById('edit-debt-original')) document.getElementById('edit-debt-original').value = formatNumberInput(originalDebt);
        if (document.getElementById('edit-debt-total-quotes')) document.getElementById('edit-debt-total-quotes').value = acc.debtTotalQuotes || 1;
        if (document.getElementById('edit-debt-paid-quotes')) document.getElementById('edit-debt-paid-quotes').value = acc.debtPaidQuotes || 0;
        if (document.getElementById('edit-debt-rate')) document.getElementById('edit-debt-rate').value = formatNumberInput(rate);
        if (document.getElementById('edit-debt-rate-type')) document.getElementById('edit-debt-rate-type').value = rateType;
        if (document.getElementById('edit-debt-monthly-payment')) document.getElementById('edit-debt-monthly-payment').value = formatNumberInput(acc.debtMonthlyPayment || 0);
        if (document.getElementById('edit-debt-payroll')) document.getElementById('edit-debt-payroll').checked = !!acc.payrollDeduction;
    } else {
        cardExtraBox?.classList.add('hidden'); editCardBtn?.classList.add('hidden');
        debtExtraBox?.classList.add('hidden'); editDebtBtn?.classList.add('hidden');
    }

    const balEl = document.getElementById('detail-account-balance');
    if (balEl) {
        const scaleIcon = `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; margin-bottom:-2px;"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`;
        if (isLiabilityCategory(acc.category)) {
            if (document.getElementById('detail-balance-label')) document.getElementById('detail-balance-label').innerText = 'Deuda registrada:';
            if (document.getElementById('reconcile-input-label')) document.getElementById('reconcile-input-label').innerHTML = `${scaleIcon} Ajustar deuda real:`;
            balEl.classList.add('negative');
        } else {
            if (document.getElementById('detail-balance-label')) document.getElementById('detail-balance-label').innerText = 'Saldo registrado:';
            if (document.getElementById('reconcile-input-label')) document.getElementById('reconcile-input-label').innerHTML = `${scaleIcon} Ajustar saldo real:`;
            balEl.classList.remove('negative');
        }
    }

    const historyList = document.getElementById('detail-account-history');
    if (historyList) {
        const accTransactions = financeData.transactions.filter(t => t.account === accountId || t.toAccount === accountId).sort((a, b) => b.id - a.id);
        historyList.innerHTML = accTransactions.length === 0 ? '<li class="history-item"><small style="color:var(--text-muted);">Sin movimientos registrados</small></li>' : '';
        accTransactions.forEach(t => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.onclick = () => { forceCloseAllModals(); openEditModal(t.id); };
            let sign = '', colorClass = '';
            if (isLiabilityCategory(acc.category)) {
                if (t.type === 'expense') { sign = '+'; colorClass = 'negative'; } else { sign = '-'; colorClass = 'positive'; }
            } else {
                if (t.type === 'income' || (t.type === 'transfer' && t.toAccount === accountId)) { sign = '+'; colorClass = 'positive'; } else { sign = '-'; colorClass = 'negative'; }
            }
            li.innerHTML = `<div class="history-info"><strong>${stripLeadingEmoji(t.description)}</strong><small>${t.date}</small></div><div class="history-amount ${colorClass}">${sign} ${formatMoney(t.amount)}</div>`;
            historyList.appendChild(li);
        });
    }
};

document.getElementById('toggle-default-account-btn')?.addEventListener('click', () => {
    const accountId = document.getElementById('reconcile-account-id')?.value;
    if (!accountId) return;

    const currentAcc = financeData.customAccounts.find(a => a.id === accountId);
    const otherDefault = financeData.customAccounts.find(a => a.isDefault && a.id !== accountId);

    if (currentAcc && !currentAcc.isDefault && otherDefault) {
        const noticeEl = document.getElementById('default-account-lock-notice');
        if (noticeEl) {
            noticeEl.innerHTML = `
                <div style="display:flex; align-items:flex-start; gap:8px;">
                    <span style="color:#d97706; display:inline-flex; margin-top:1px; flex-shrink:0;">${renderIcon('lock', 15)}</span>
                    <div>
                        <strong style="display:block; color:#d97706; margin-bottom:2px;">"${stripLeadingEmoji(otherDefault.name)}" ya es predeterminada</strong>
                        <span style="color:var(--text-muted);">Ingresa primero a esa cuenta o tarjeta y retira su estrella de predeterminada antes de elegir una nueva.</span>
                    </div>
                </div>
            `;
            noticeEl.classList.remove('hidden', 'shake');
            void noticeEl.offsetWidth;
            noticeEl.classList.add('shake');
        }
        return;
    }

    setDefaultAccount(accountId, true);
    renderAccountSelects(); updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin);
});
document.getElementById('account-show-when-zero')?.addEventListener('change', (e) => {
    const accountId = document.getElementById('reconcile-account-id')?.value;
    const acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    acc.showWhenZero = !!e.target.checked;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false; updateDashboard();
});
document.getElementById('edit-card-settings-btn')?.addEventListener('click', () => {
    const editForm = document.getElementById('edit-card-form');
    const overviewBox = document.getElementById('card-statement-overview');
    const btn = document.getElementById('edit-card-settings-btn');
    if (!editForm) return;
    const willOpen = editForm.classList.contains('hidden');
    editForm.classList.toggle('hidden', !willOpen);
    overviewBox?.classList.toggle('hidden', willOpen);
    if (btn) {
        btn.style.background = willOpen ? 'var(--accent-soft)' : '';
        btn.style.borderColor = willOpen ? 'var(--accent)' : '';
    }
});
document.getElementById('edit-card-has-mgmt-fee')?.addEventListener('change', (e) => {
    document.getElementById('edit-card-mgmt-fields')?.classList.toggle('hidden', !e.target.checked);
});
document.getElementById('edit-card-has-insurance')?.addEventListener('change', (e) => {
    document.getElementById('edit-card-insurance-fields')?.classList.toggle('hidden', !e.target.checked);
});
document.getElementById('edit-card-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    const hasMgmtFee = !!document.getElementById('edit-card-has-mgmt-fee')?.checked;
    const hasInsurance = !!document.getElementById('edit-card-has-insurance')?.checked;

    acc.creditLimit = parseMoneyInput(document.getElementById('edit-card-limit').value);
    acc.initialDebtQuota = parseMoneyInput(document.getElementById('edit-card-initial-quota')?.value);
    acc.cutoffDay = parseInt(document.getElementById('edit-card-cutoff').value, 10) || 15;
    acc.paymentDay = parseInt(document.getElementById('edit-card-payment').value, 10) || 30;
    acc.rate = parseMoneyInput(document.getElementById('edit-card-rate').value);
    acc.rateType = document.getElementById('edit-card-rate-type').value;
    acc.zeroInterestMax = parseInt(document.getElementById('edit-card-zero-interest-max').value, 10) || 0;
    const editWaiverType = document.getElementById('edit-card-mgmt-waiver-type')?.value || 'spend';
    acc.hasMgmtFee = hasMgmtFee;
    acc.mgmtFee = hasMgmtFee ? parseMoneyInput(document.getElementById('edit-card-mgmt-fee')?.value) : 0;
    acc.mgmtFeeRule = document.getElementById('edit-card-mgmt-rule')?.value || 'balance_or_use';
    acc.mgmtFeeWaiverType = editWaiverType;
    acc.mgmtFeeWaiverSpend = hasMgmtFee && (editWaiverType === 'spend' || editWaiverType === 'either') ? parseMoneyInput(document.getElementById('edit-card-mgmt-waiver')?.value) : 0;
    acc.mgmtFeeWaiverAccountId = hasMgmtFee && (editWaiverType === 'account_income' || editWaiverType === 'either') ? (document.getElementById('edit-card-mgmt-waiver-account')?.value || '') : '';
    acc.mgmtFeeWaiverIncome = hasMgmtFee && (editWaiverType === 'account_income' || editWaiverType === 'either') ? parseMoneyInput(document.getElementById('edit-card-mgmt-waiver-income')?.value) : 0;
    acc.hasInsurance = hasInsurance;
    acc.insurancePerMillion = hasInsurance ? parseMoneyInput(document.getElementById('edit-card-insurance-rate')?.value) : 0;
    acc.insuranceRule = document.getElementById('edit-card-insurance-rule')?.value || 'per_million_min1';

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false; updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin);
});
document.getElementById('btn-revolving-new-purchase')?.addEventListener('click', () => {
    const revForm = document.getElementById('revolving-new-purchase-form');
    if (!revForm) return;
    revForm.classList.toggle('hidden');
    if (!revForm.classList.contains('hidden')) {
        const accountId = document.getElementById('reconcile-account-id')?.value;
        const acc = financeData.customAccounts.find(a => a.id === accountId);
        if (acc) {
            if (document.getElementById('rev-purch-rate')) document.getElementById('rev-purch-rate').value = acc.debtRate ? formatNumberInput(acc.debtRate) : '';
            if (document.getElementById('rev-purch-rate-type')) document.getElementById('rev-purch-rate-type').value = acc.debtRateType || 'annual';
        }
    }
});

document.getElementById('revolving-new-purchase-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id')?.value;
    const acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;

    const name = document.getElementById('rev-purch-name').value.trim();
    const original = parseMoneyInput(document.getElementById('rev-purch-original').value);
    const currentStr = document.getElementById('rev-purch-current').value;
    const current = currentStr ? parseMoneyInput(currentStr) : original;
    const totalQuotes = Math.max(1, parseInt(document.getElementById('rev-purch-total-quotes').value, 10) || 1);
    const paidQuotes = Math.max(0, parseInt(document.getElementById('rev-purch-paid-quotes').value, 10) || 0);
    const rate = parseMoneyInput(document.getElementById('rev-purch-rate').value);
    const rateType = document.getElementById('rev-purch-rate-type').value;
    const isNewExpense = !!document.getElementById('rev-purch-is-new-expense')?.checked;

    const amort = calculateAmortization(original, totalQuotes, rate, rateType);
    const customQuota = parseMoneyInput(document.getElementById('rev-purch-monthly-payment').value);
    const monthlyQuota = customQuota > 0 ? customQuota : amort.payment;

    const remSchedule = amort.schedule.slice(paidQuotes);
    const rawRemCapital = round2(remSchedule.reduce((s, r) => s + r.principal, 0));
    const extraPrincipalPaid = current < rawRemCapital ? round2(rawRemCapital - current) : 0;

    // Si es préstamo fijo sin cuota personalizada guardada, congelar su cuota base antes de sumar el desembolso
    if (acc.debtType === 'fixed' && !round2(acc.debtMonthlyPayment || 0) && round2(acc.debtOriginal || 0) > 0 && (acc.debtTotalQuotes || 0) > 0) {
        acc.debtMonthlyPayment = calculateAmortization(
            round2(acc.debtOriginal),
            acc.debtTotalQuotes,
            acc.debtRate || 0,
            acc.debtRateType || 'monthly'
        ).payment;
    }

    acc.debtOriginal = round2((acc.debtOriginal || 0) + original);

    const now = new Date();
    financeData.transactions.push({
        id: now.getTime() + Math.floor(Math.random() * 500),
        monthId: getMonthId(now),
        type: 'expense',
        status: 'closed',
        account: accountId,
        category: '🛍️ Compras',
        subcategory: 'General',
        description: name,
        amount: original,
        date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
        isAdjustment: !isNewExpense,
        installments: totalQuotes,
        paidInstallments: paidQuotes,
        rate,
        rateType,
        zeroInterest: rate === 0,
        monthlyQuota,
        totalWithInterest: amort.totalWithInterest,
        extraPrincipalPaid
    });

    if (current > rawRemCapital) {
        const diff = round2(current - rawRemCapital);
        financeData.transactions.push({
            id: now.getTime() + 600 + Math.floor(Math.random() * 500),
            monthId: getMonthId(now),
            type: 'expense',
            status: 'closed',
            account: accountId,
            description: `⚖️ Ajuste Capital (${name})`,
            amount: diff,
            date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
            isAdjustment: true
        });
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('revolving-new-purchase-form').reset();
    document.getElementById('revolving-new-purchase-form').classList.add('hidden');
    hasUnsavedChanges = false;
    updateDashboard();
    openAccountDetail(accountId, lastAccountViewOrigin);
});
document.getElementById('edit-debt-settings-btn')?.addEventListener('click', () => { document.getElementById('edit-debt-form')?.classList.toggle('hidden'); document.getElementById('pay-installment-box')?.classList.add('hidden'); document.getElementById('amortization-panel')?.classList.add('hidden'); });
document.getElementById('open-pay-installment-btn')?.addEventListener('click', () => { document.getElementById('pay-installment-box')?.classList.toggle('hidden'); document.getElementById('edit-debt-form')?.classList.add('hidden'); document.getElementById('amortization-panel')?.classList.add('hidden'); });
document.getElementById('toggle-amortization-btn')?.addEventListener('click', () => { document.getElementById('amortization-panel')?.classList.toggle('hidden'); document.getElementById('edit-debt-form')?.classList.add('hidden'); document.getElementById('pay-installment-box')?.classList.add('hidden'); });

document.getElementById('sim-extra-payment')?.addEventListener('input', (e) => {
    const accId = document.getElementById('reconcile-account-id').value;
    const acc = financeData.customAccounts.find(a => a.id === accId);
    if (!acc || acc.category !== 'debt' || acc.debtType === 'revolving') return;
    const extra = parseMoneyInput(e.target.value);
    const currentBal = round2(currentBalances[accId] || 0);
    const rate = acc.debtRate || 0;
    const rateType = acc.debtRateType || 'monthly';
    const totalQuotes = acc.debtTotalQuotes || 1;
    const paidQuotes = acc.debtPaidQuotes || 0;
    const remQuotes = totalQuotes - paidQuotes;
    
    const standardAmort = calculateAmortization(currentBal, remQuotes, rate, rateType);
    const baseQuota = standardAmort.payment;
    const tbody = document.getElementById('amortization-table-body');
    const resLab = document.getElementById('sim-savings-result');
    
    // Función auxiliar para pintar la tabla con meses proyectados
    const renderTable = (scheduleArr, pQuotes) => {
        let h = '';
        let baseDate = new Date();
        scheduleArr.forEach(row => {
            baseDate.setMonth(baseDate.getMonth() + 1);
            const mLabel = `${getShortMonthLabel(baseDate)} ${String(baseDate.getFullYear()).slice(-2)}`;
            h += `<tr><td>${mLabel}</td><td>${formatMoney(row.payment)}</td><td class="positive">${formatMoney(row.principal)}</td><td class="negative">${formatMoney(row.interest)}</td><td>${formatMoney(row.balance)}</td></tr>`;
        });
        return h;
    };

    if (extra <= 0) {
        if (resLab) resLab.innerHTML = '';
        if (tbody) tbody.innerHTML = renderTable(standardAmort.schedule, paidQuotes);
        return;
    }

    if (rate <= 0) {
        if (resLab) resLab.innerHTML = `<span style="color:var(--text-muted);">Tasa 0% - Abonar a capital no genera ahorro en intereses.</span>`;
        if (tbody) {
            const newBal = Math.max(0, currentBal - extra);
            const simpleAmort = calculateAmortization(newBal, remQuotes, 0, rateType);
            tbody.innerHTML = renderTable(simpleAmort.schedule, paidQuotes);
        }
        return;
    }
    
    const newBal = Math.max(0, currentBal - extra);
    
    // Simulador: Reducir Plazo manteniendo la cuota base
    let mRate = rate / 100;
    if (rateType === 'annual') mRate = Math.pow(1 + mRate, 1 / 12) - 1;
    
    let simBal = newBal;
    let newInterest = 0;
    let newMonths = 0;
    const newSchedule = [];
    
    while (simBal > 0 && newMonths < 360) {
        newMonths++;
        let int = simBal * mRate;
        newInterest += int;
        let p = Math.min(simBal, Math.max(0, baseQuota - int));
        
        if (p <= 0 && int >= baseQuota) {
            // Impagable con la cuota actual, forzamos recálculo por cuota nueva
            break; 
        }
        
        simBal = Math.max(0, simBal - p);
        newSchedule.push({
            payment: p + int,
            principal: p,
            interest: int,
            balance: simBal
        });
    }

    // Si logró simular manteniendo la cuota, mostramos reducción de plazo
    if (simBal === 0 && newMonths <= remQuotes) {
        const savedInt = standardAmort.totalInterest - newInterest;
        const savedMonths = remQuotes - newMonths;
        if (resLab) resLab.innerHTML = `<span style="display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Ahorras ${formatMoney(savedInt)} y terminas ${savedMonths} meses antes.</span>`;
        if (tbody) tbody.innerHTML = renderTable(newSchedule, paidQuotes);
    } else {
        // Fallback: Reducir cuota manteniendo plazo
        const newAmort = calculateAmortization(newBal, remQuotes, rate, rateType);
        const savedInt = standardAmort.totalInterest - newAmort.totalInterest;
        if (resLab) resLab.innerHTML = `<span style="display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Ahorras ${formatMoney(savedInt)} bajando tu cuota.</span>`;
        if (tbody) tbody.innerHTML = renderTable(newAmort.schedule, paidQuotes);
    }
});

document.getElementById('edit-debt-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    acc.debtType = document.getElementById('edit-debt-type').value;
    acc.debtOriginal = parseMoneyInput(document.getElementById('edit-debt-original').value);
    acc.debtTotalQuotes = parseInt(document.getElementById('edit-debt-total-quotes').value, 10) || 1;
    acc.debtPaidQuotes = parseInt(document.getElementById('edit-debt-paid-quotes').value, 10) || 0;
    acc.debtRate = parseMoneyInput(document.getElementById('edit-debt-rate').value);
    acc.debtRateType = document.getElementById('edit-debt-rate-type').value;
    acc.debtMonthlyPayment = parseMoneyInput(document.getElementById('edit-debt-monthly-payment').value);
    acc.payrollDeduction = !!document.getElementById('edit-debt-payroll').checked;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false; 
    renderSalaryUI(true); // <-- FUERZA LA SINCRONIZACIÓN DEL PRESUPUESTO
    updateDashboard(); 
    openAccountDetail(accountId, lastAccountViewOrigin);
});

document.getElementById('pay-installment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    const sourceAcc = document.getElementById('pay-debt-source-acc').value;
    const principalAmt = parseMoneyInput(document.getElementById('pay-debt-principal').value);
    const interestAmt = parseMoneyInput(document.getElementById('pay-debt-interest').value);
    const inputDate = document.getElementById('pay-debt-date').value;
    const now = new Date();
    const transactionDateObj = new Date(`${inputDate}T${now.toTimeString().slice(0, 5)}`);
    const displayDate = transactionDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    const displayTime = transactionDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const mId = getMonthId(transactionDateObj);
    const currentBal = round2(currentBalances[accountId] || 0);
    const qInfo = getDebtMonthlyQuotaBreakdown(acc, currentBal);

    const allocatedItems = [];
    if (acc.debtType !== 'revolving' && qInfo.basePrincipal > 0) {
        allocatedItems.push({ kind: 'debt_quota', debtId: accountId, amountApplied: qInfo.basePrincipal });
        acc.debtPaidQuotes = (acc.debtPaidQuotes || 0) + 1;
    }
    qInfo.subPurchases.forEach(p => {
        allocatedItems.push({ kind: 'cc_tx', txId: p.tx.id, mode: 'installments', amountApplied: p.nextQuota });
        p.tx.paidInstallments = (p.tx.paidInstallments || 0) + 1;
    });

    if (principalAmt > 0) {
        financeData.transactions.push({ id: transactionDateObj.getTime() + Math.floor(Math.random() * 500), monthId: mId, type: 'transfer', status: 'closed', account: sourceAcc, toAccount: accountId, description: `Pago Capital (${stripLeadingEmoji(acc.name)})`, amount: principalAmt, date: `${displayDate}, ${displayTime}`, isAdjustment: false, paymentMode: 'installments', allocatedItems });
    }
    if (interestAmt > 0) {
        financeData.transactions.push({ id: transactionDateObj.getTime() + 500 + Math.floor(Math.random() * 500), monthId: mId, type: 'expense', status: 'closed', account: sourceAcc, category: 'Cuotas / Intereses', subcategory: 'General', description: `Intereses Préstamo (${stripLeadingEmoji(acc.name)})`, amount: interestAmt, date: `${displayDate}, ${displayTime}`, isAdjustment: false });
    }
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false; updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin);
});

document.getElementById('reconcile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = getAccountObj(accountId);
    const realAmount = parseMoneyInput(document.getElementById('reconcile-real-amount').value);
    const currentBal = round2(currentBalances[accountId] || 0), diff = round2(realAmount - currentBal);
    if (diff === 0) { alert('El monto registrado ya coincide con el real.'); return; }
    const now = new Date();
    let adjustType = diff > 0 ? 'income' : 'expense';
    if (isLiabilityCategory(acc.category)) adjustType = diff > 0 ? 'expense' : 'income';
    financeData.transactions.push({ id: now.getTime() + Math.floor(Math.random() * 1000), monthId: getMonthId(now), type: adjustType, status: 'closed', account: accountId, description: 'Ajuste / Reconciliación', amount: round2(Math.abs(diff)), date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: true });
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false; updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin);
});

window.deleteAccount = (accountId) => {
    if (accountId === 'Efectivo') return;
    const accName = getAccountObj(accountId).name;
    if (confirm(`¿Seguro que deseas eliminar "${accName}"? Sus movimientos pasarán a "Efectivo".`)) {
        financeData.transactions.forEach(t => { if (t.account === accountId) t.account = 'Efectivo'; if (t.toAccount === accountId) t.toAccount = 'Efectivo'; });
        financeData.customAccounts = financeData.customAccounts.filter(a => a.id !== accountId);
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        renderSalaryUI(true); // <-- RECALCULA POR SI SE ELIMINÓ UNA LIBRANZA
        renderAccountSelects(); updateDashboard();
    }
};

window.openReceivablesModal = () => {
    const rModal = document.getElementById('receivables-modal');
    if (!rModal) return;
    document.getElementById('debts-receivable-view')?.classList.remove('hidden');
    
    if (typeof renderReceivablesBreakdown === 'function') {
        renderReceivablesBreakdown(currentBalances);
    }
    
    const recvAccSel = document.getElementById('new-recv-account');
    if (recvAccSel) {
        const assets = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset' && !a.id.startsWith('CxC_')));
        recvAccSel.innerHTML = assets.map(a => `<option value="${a.id}">${stripLeadingEmoji(a.name)}${a.isDefault ? ' ★' : ''}</option>`).join('');
    }
    
    const recvCatSel = document.getElementById('new-recv-category');
    if (recvCatSel) {
        const list = [...(financeData.categories['income'] || [])].filter(c => !c.isArchived).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        let html = '';

        if (list.length === 0) {
            html = `<option value="">Crea una categoría en la pestaña Presupuesto</option>`;
        } else {
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
        recvCatSel.innerHTML = html;
    }
    
    hasUnsavedChanges = false;
    rModal.classList.remove('hidden');
};

document.getElementById('drawer-receivables')?.addEventListener('click', () => {
    closeSideDrawer();
    if (attemptCloseModals()) openReceivablesModal();
});

document.getElementById('back-to-accounts-btn')?.addEventListener('click', () => {
    document.getElementById('account-detail-view')?.classList.add('hidden');
    if (lastAccountViewOrigin === 'home') forceCloseAllModals();
    else if (lastAccountViewOrigin === 'analytics') { document.getElementById('accounts-modal')?.classList.add('hidden'); document.getElementById('analytics-modal')?.classList.remove('hidden'); }
    else if (lastAccountViewOrigin === 'credit_card') { document.getElementById('accounts-modal')?.classList.add('hidden'); document.getElementById('cards-modal')?.classList.remove('hidden'); }
    else if (lastAccountViewOrigin === 'debt') { document.getElementById('accounts-modal')?.classList.add('hidden'); document.getElementById('debts-modal')?.classList.remove('hidden'); }
    else if (lastAccountViewOrigin === 'receivable') { document.getElementById('accounts-modal')?.classList.add('hidden'); openReceivablesModal(); }
    else document.getElementById('accounts-list-view')?.classList.remove('hidden');
});

// --- BOLSILLOS DE AHORRO ---
let userEditedNewPocketQuota = false;

const updateNewPocketQuotaPreview = (forceRecalc = false) => {
    const goal = parseMoneyInput(document.getElementById('new-pocket-goal')?.value);
    const initial = parseMoneyInput(document.getElementById('new-pocket-initial')?.value);
    const startStr = document.getElementById('new-pocket-start-date')?.value || currentDate.toLocaleDateString('en-CA');
    const endStr = document.getElementById('new-pocket-date')?.value || '';
    const quotaInput = document.getElementById('new-pocket-quota');
    const hintEl = document.getElementById('new-pocket-quota-hint');
    if (!quotaInput) return;

    const needed = Math.max(0, round2(goal - initial));
    if (needed > 0 && endStr) {
        const months = calcMonthsBetweenDates(startStr, endStr);
        const calcQuota = round2(needed / months);
        if (hintEl) hintEl.innerText = `${months} mes${months !== 1 ? 'es' : ''} • Auto: ${formatMoney(calcQuota)}`;
        if (forceRecalc || !userEditedNewPocketQuota) {
            quotaInput.value = formatNumberInput(calcQuota);
        }
    } else {
        if (hintEl) hintEl.innerText = '';
        if (forceRecalc || !userEditedNewPocketQuota) {
            quotaInput.value = '';
        }
    }
};

['new-pocket-goal', 'new-pocket-initial', 'new-pocket-start-date', 'new-pocket-date'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => updateNewPocketQuotaPreview(false));
    document.getElementById(id)?.addEventListener('change', () => updateNewPocketQuotaPreview(false));
});

document.getElementById('new-pocket-quota')?.addEventListener('input', () => {
    userEditedNewPocketQuota = true;
});

const renderPocketsView = () => {
    if (typeof initPocketsAndSimulatorTabs === 'function') initPocketsAndSimulatorTabs();
    const list = document.getElementById('pockets-list-container');
    if (!list) return;
    list.innerHTML = '';
    let totalSaved = 0, totalYields = 0, totalMonthlySuggested = 0;

    if (!financeData.pockets || financeData.pockets.length === 0) {
        list.innerHTML = `
            <div style="background:var(--card-inner-bg); border:2px dashed color-mix(in srgb, var(--accent) 30%, transparent); border-radius:18px; padding:26px 20px; text-align:center; margin:10px 0 20px 0; position:relative; overflow:hidden;">
                <!-- Brillo de fondo sutil -->
                <div style="position:absolute; top:-30px; right:-30px; width:120px; height:120px; background:color-mix(in srgb, var(--accent) 12%, transparent); border-radius:50%; filter:blur(24px);"></div>
                
                <div style="width:56px; height:56px; border-radius:16px; background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, transparent), var(--card-inner-bg)); border:1px solid color-mix(in srgb, var(--accent) 30%, transparent); display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto; color:var(--accent); box-shadow:0 8px 16px rgba(0,0,0,0.04); position:relative; z-index:1;">
                    ${renderIcon('trending-up', 26)}
                </div>
                <h4 style="margin:0 0 8px 0; font-size:17px; font-weight:800; color:var(--text-main); position:relative; z-index:1;">Dale un propósito a tu dinero</h4>
                <p style="margin:0 0 22px 0; font-size:12.5px; color:var(--text-muted); line-height:1.5; position:relative; z-index:1;">El saldo libre en tu cuenta de gastos es una tentación constante. <b>Aísla tus excedentes</b>, ponles una fecha límite y míralos crecer a tu favor.</p>
                <button type="button" class="btn btn-primary" style="width:100%; font-size:13.5px; font-weight:700; padding:12px; box-shadow:0 6px 16px color-mix(in srgb, var(--accent) 25%, transparent); position:relative; z-index:1;" onclick="const formDet = document.getElementById('add-pocket-form').closest('details'); if(formDet) formDet.open = true; setTimeout(() => document.getElementById('new-pocket-name').focus(), 100);">+ Crear mi primer bolsillo</button>
            </div>
        `;
    } else {
        financeData.pockets.forEach(p => {
            const m = computePocketMetrics(p);
            totalSaved = round2(totalSaved + m.balance);
            totalYields = round2(totalYields + m.yields);
            if (m.remaining > 0 || m.customQuota > 0) {
                totalMonthlySuggested = round2(totalMonthlySuggested + m.activeQuota);
            }

            let dateLabel = 'Sin fecha límite';
            if (p.targetDate && p.startDate) {
                dateLabel = `${p.startDate} → ${p.targetDate} (${m.monthsLeft}m rest.)`;
            } else if (p.targetDate) {
                dateLabel = `Meta: ${p.targetDate} (${m.monthsLeft}m rest.)`;
            } else if (p.startDate) {
                dateLabel = `Inicio: ${p.startDate}`;
            }
            if (p.payrollDeduction) dateLabel += ' • Desc. Nómina';
            if (p.excludeFromBalance) dateLabel += ' • Oculto del Balance';

            const paceBadge = m.paceStatus
                ? ` <span class="widget-badge ${m.paceStatus.cls}" style="font-size:9px; padding:1px 6px;">${m.paceStatus.label}</span>`
                : '';
            const customTag = m.customQuota > 0 ? ' (Fija)' : '';

            let barHtml = '';
            if (m.goal > 0) {
                const pct = Math.min(100, (m.balance / m.goal) * 100);
                const quotaText = m.remaining <= 0
                    ? '✅ Meta alcanzada'
                    : (m.activeQuota > 0 ? `Cuota${customTag}: <b>${formatMoney(m.activeQuota)}/m</b>` : 'Define fecha o cuota');
                barHtml = `<div class="tc-mini-bar"><div class="tc-mini-bar-fill positive-bg" style="width:${pct}%;"></div></div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted);">
                        <span>Meta: ${formatMoney(m.goal)} (${pct.toFixed(0)}%)</span>
                        <span>${quotaText}</span>
                    </div>`;
            } else if (m.activeQuota > 0) {
                barHtml = `<div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Ahorro planeado: <b>${formatMoney(m.activeQuota)}/m</b></div>`;
            }

            const pocketTxs = financeData.transactions
                .filter(t => (t.account === p.id || t.toAccount === p.id) && isTxClosed(t))
                .sort((a, b) => b.id - a.id);

            let historyHtml = '<div style="padding:10px; text-align:center; color:var(--text-muted); font-size:11px;">Sin movimientos registrados.</div>';
            if (pocketTxs.length > 0) {
                historyHtml = pocketTxs.map((t, idx, arr) => {
                    let sign = '', colorClass = '';
                    if (t.type === 'income' || (t.type === 'transfer' && t.toAccount === p.id)) {
                        sign = '+'; colorClass = 'positive';
                    } else {
                        sign = '-'; colorClass = 'negative';
                    }
                    const btmBorder = idx === arr.length - 1 ? 'none' : '1px dashed rgba(148,163,184,0.25)';
                    return `
                        <div onclick="forceCloseAllModals(); openEditModal(${t.id});" style="display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:${btmBorder}; font-size:11.5px; cursor:pointer;">
                            <div style="min-width:0; flex:1; padding-right:8px;">
                                <strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-main); font-size:11.5px;">${stripLeadingEmoji(t.description)}</strong>
                                <small style="color:var(--text-muted); font-size:10px;">${t.date}</small>
                            </div>
                            <div class="${colorClass}" style="font-weight:800; font-size:12.5px; white-space:nowrap; flex-shrink:0;">
                                ${sign} ${formatMoney(t.amount)}
                            </div>
                        </div>
                    `;
                }).join('');
            }

            const accordionHtml = `
                <details class="changelog-accordion" style="margin-top:10px; background:transparent; border:1px solid color-mix(in srgb, var(--accent) 15%, var(--border-color)); padding:8px 10px; box-shadow:none;">
                    <summary style="font-size:11px; color:var(--text-main); font-weight:700;">
                        <span style="display:inline-flex; align-items:center; gap:6px; color:var(--text-muted);">
                            ${renderIcon('clock', 14)} Historial de Ahorro
                        </span>
                        <span>▾</span>
                    </summary>
                    <div style="margin-top:10px; padding-top:4px; border-top:1px solid rgba(148,163,184,0.15);">
                        <div style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--text-muted); margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid rgba(148,163,184,0.15);">
                            <span>Aportes netos: <b style="color:var(--text-main);">${formatMoney(m.principal)}</b></span>
                            <span>Rendimientos: <b class="positive">+${formatMoney(m.yields)}</b></span>
                        </div>
                        <div style="max-height:160px; overflow-y:auto; padding-right:4px;">
                            ${historyHtml}
                        </div>
                    </div>
                </details>
            `;

            list.innerHTML += `
                <div class="pocket-card">
                    <div class="pocket-card-top">
                        <div>
                            <strong style="font-size:14px; display:flex; align-items:center; gap:6px;"><span style="color:var(--positive); display:inline-flex;">${renderIcon('piggy', 16)}</span> ${stripLeadingEmoji(p.name)}${p.entity ? ` (${p.entity})` : ''}${paceBadge}</strong>
                            <small style="display:block; font-size:11px; color:var(--text-muted);">${dateLabel}${m.yields > 0 ? ` • Rend: +${formatMoney(m.yields)}` : ''}</small>
                        </div>
                        <div style="text-align:right; display:flex; align-items:center; gap:6px; flex-shrink:0;">
                            <strong class="positive" style="font-size:15px; white-space:nowrap;">${formatMoney(m.balance)}</strong>
                            <button type="button" onclick="openEditPocket('${p.id}')" title="Editar bolsillo" style="background:var(--hover-bg); border:1px solid var(--border-color); color:var(--text-main); padding:4px 6px; border-radius:6px; cursor:pointer; display:inline-flex;">${renderIcon('edit', 13)}</button>
                            <button type="button" onclick="deletePocket('${p.id}')" title="Eliminar bolsillo" style="background:none; border:none; color:var(--negative); font-size:11px; font-weight:bold; cursor:pointer;">X</button>
                        </div>
                    </div>
                    ${barHtml}
                    ${accordionHtml}
                    <div class="pocket-actions-row">
                        <button type="button" class="pocket-mini-btn" onclick="openPocketAction('${p.id}', 'deposit')">+ Abonar</button>
                        <button type="button" class="pocket-mini-btn" onclick="openPocketAction('${p.id}', 'yield')" style="color:var(--accent); display:inline-flex; align-items:center; justify-content:center; gap:4px;">${renderIcon('trending-up', 13)} Rendim.</button>
                        <button type="button" class="pocket-mini-btn" onclick="openPocketAction('${p.id}', 'withdraw')" style="color:var(--negative);">- Retirar</button>
                    </div>
                </div>`;
        });
    }
    if (document.getElementById('pockets-modal-total')) document.getElementById('pockets-modal-total').innerText = formatMoney(totalSaved);
    if (document.getElementById('pockets-modal-yields')) document.getElementById('pockets-modal-yields').innerText = `+${formatMoney(totalYields)}`;
    if (document.getElementById('pockets-modal-quota')) document.getElementById('pockets-modal-quota').innerText = totalMonthlySuggested > 0 ? `${formatCompact(totalMonthlySuggested)}/m` : '$ 0/m';
};

window.openEditPocket = (id) => {
    const p = financeData.pockets.find(x => String(x.id) === String(id));
    if (!p) return;
    const m = computePocketMetrics(p);
    document.getElementById('edit-pocket-id').value = p.id;
    document.getElementById('edit-pocket-name').value = p.name || '';
    document.getElementById('edit-pocket-entity').value = p.entity || '';
    document.getElementById('edit-pocket-goal').value = p.goal > 0 ? formatNumberInput(p.goal) : '';
    document.getElementById('edit-pocket-start-date').value = p.startDate || '';
    document.getElementById('edit-pocket-date').value = p.targetDate || '';
    document.getElementById('edit-pocket-quota').value = m.activeQuota > 0 ? formatNumberInput(m.activeQuota) : '';
    if (document.getElementById('edit-pocket-payroll')) {
        document.getElementById('edit-pocket-payroll').checked = !!p.payrollDeduction;
    }
    if (document.getElementById('edit-pocket-include-balance')) {
        document.getElementById('edit-pocket-include-balance').checked = !p.excludeFromBalance;
    }

    const hintEl = document.getElementById('edit-pocket-quota-hint');
    if (hintEl) {
        hintEl.innerText = m.suggestedQuota > 0
            ? `Cuota sugerida según saldo pendiente (${formatMoney(m.remaining)} en ${m.monthsLeft}m): ${formatMoney(m.suggestedQuota)}/m`
            : 'Define meta y fecha objetivo para calcular cuota automática.';
    }
    hasUnsavedChanges = false;
    document.getElementById('pocket-edit-modal')?.classList.remove('hidden');
};

document.getElementById('btn-recalc-edit-pocket-quota')?.addEventListener('click', () => {
    const id = document.getElementById('edit-pocket-id').value;
    const p = financeData.pockets.find(x => String(x.id) === String(id));
    if (!p) return;
    const goal = parseMoneyInput(document.getElementById('edit-pocket-goal').value);
    const startStr = document.getElementById('edit-pocket-start-date').value;
    const endStr = document.getElementById('edit-pocket-date').value;
    const balance = round2((p.principal || 0) + (p.yields || 0));
    const rem = Math.max(0, round2(goal - balance));
    if (rem > 0 && endStr) {
        const months = calcMonthsBetweenDates(getEffectiveStartStr(startStr), endStr);
        document.getElementById('edit-pocket-quota').value = formatNumberInput(round2(rem / months));
    } else {
        document.getElementById('edit-pocket-quota').value = '';
    }
});

document.getElementById('edit-pocket-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-pocket-id').value;
    const p = financeData.pockets.find(x => String(x.id) === String(id));
    if (!p) return;

    p.name = document.getElementById('edit-pocket-name').value.trim();
    p.entity = document.getElementById('edit-pocket-entity').value.trim();
    p.goal = parseMoneyInput(document.getElementById('edit-pocket-goal').value);
    p.startDate = document.getElementById('edit-pocket-start-date').value;
    p.targetDate = document.getElementById('edit-pocket-date').value;

    const enteredQuota = parseMoneyInput(document.getElementById('edit-pocket-quota').value);
    const balance = round2((p.principal || 0) + (p.yields || 0));
    const rem = Math.max(0, round2(p.goal - balance));
    let autoQuota = 0;
    if (rem > 0 && p.targetDate) {
        autoQuota = round2(rem / calcMonthsBetweenDates(getEffectiveStartStr(p.startDate), p.targetDate));
    }
    p.customQuota = (enteredQuota > 0 && Math.abs(enteredQuota - autoQuota) > 1) ? enteredQuota : 0;
    if (document.getElementById('edit-pocket-payroll')) {
        p.payrollDeduction = !!document.getElementById('edit-pocket-payroll').checked;
    }
    if (document.getElementById('edit-pocket-include-balance')) {
        p.excludeFromBalance = !document.getElementById('edit-pocket-include-balance').checked;
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    document.getElementById('pocket-edit-modal')?.classList.add('hidden');
    renderSalaryUI(true);
    renderPocketsView();
    renderAccountSelects();
    updateDashboard();
});

document.getElementById('close-pocket-edit-btn')?.addEventListener('click', () => {
    hasUnsavedChanges = false;
    document.getElementById('pocket-edit-modal')?.classList.add('hidden');
});

window.openPocketAction = (id, actionType) => {
    const p = financeData.pockets.find(x => String(x.id) === String(id));
    if (!p) return;
    const metrics = computePocketMetrics(p);
    
    if (actionType === 'deposit') {
        openOmniModal({
            type: 'transfer',
            title: `Abonar a ${p.name}`,
            toAccount: p.id,
            amount: metrics.activeQuota > 0 ? metrics.activeQuota : '',
            description: `Abono a bolsillo: ${p.name}`,
            lockType: true,
            hideRecurrence: true
        });
    } else if (actionType === 'withdraw') {
        openOmniModal({
            type: 'transfer',
            title: `Retirar de ${p.name}`,
            account: p.id,
            description: `Retiro de bolsillo: ${p.name}`,
            lockType: true,
            hideRecurrence: true
        });
    } else if (actionType === 'yield') {
        const yieldCat = (financeData.categories.income || []).find(c => stripLeadingEmoji(c.name) === 'Rendimientos');
        const catValue = yieldCat ? `${yieldCat.name}::General` : 'Rendimientos::General';
        openOmniModal({
            type: 'income',
            title: `Rendimientos • ${stripLeadingEmoji(p.name)}`,
            account: p.id,
            category: catValue,
            description: `Rendimientos: ${stripLeadingEmoji(p.name)}`,
            lockType: true,
            hideRecurrence: true
        });
    }
};

document.getElementById('add-pocket-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-pocket-name').value.trim();
    if (!name) return;

    const goal = parseMoneyInput(document.getElementById('new-pocket-goal').value);
    const initial = parseMoneyInput(document.getElementById('new-pocket-initial').value);
    const startDate = document.getElementById('new-pocket-start-date').value;
    const targetDate = document.getElementById('new-pocket-date').value;
    const enteredQuota = parseMoneyInput(document.getElementById('new-pocket-quota').value);

    const needed = Math.max(0, round2(goal - initial));
    const effectiveStart = startDate || currentDate.toLocaleDateString('en-CA');
    const autoQuota = (needed > 0 && targetDate) ? round2(needed / calcMonthsBetweenDates(effectiveStart, targetDate)) : 0;
    const customQuota = (enteredQuota > 0 && Math.abs(enteredQuota - autoQuota) > 1) ? enteredQuota : 0;
    const payrollDeduction = !!document.getElementById('new-pocket-payroll')?.checked;
    const excludeFromBalance = !document.getElementById('new-pocket-include-balance').checked;

    financeData.pockets.push({
        id: 'Pocket_' + Date.now(),
        name,
        entity: document.getElementById('new-pocket-entity').value.trim(),
        goal,
        startDate,
        targetDate,
        customQuota,
        principal: initial,
        yields: 0,
        payrollDeduction,
        excludeFromBalance
    });
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('add-pocket-form').reset();
    e.target.closest('details')?.removeAttribute('open');
    userEditedNewPocketQuota = false;
    if (document.getElementById('new-pocket-quota-hint')) document.getElementById('new-pocket-quota-hint').innerText = '';
    hasUnsavedChanges = false;
    renderSalaryUI(true);
    renderPocketsView();
    renderAccountSelects();
    updateDashboard();
});

window.deletePocket = (id) => {
    if (confirm('¿Eliminar este bolsillo de ahorro?')) {
        financeData.pockets = financeData.pockets.filter(x => String(x.id) !== String(id));
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        renderSalaryUI(true);
        renderPocketsView(); renderAccountSelects(); updateDashboard();
    }
};

// --- ACTIVOS FIJOS ---
const renderAssetsBreakdown = () => {
    let totalVal = 0, totalDiff = 0;
    const list = document.getElementById('assets-list');
    if (!list) return;
    list.innerHTML = '';
    const filtered = financeData.fixedAssets.filter(a => a.status === currentAssetType);
    financeData.fixedAssets.filter(a => a.status === 'active').forEach(a => { totalVal = round2(totalVal + a.currentValue); totalDiff = round2(totalDiff + (a.currentValue - (a.purchaseValue || 0))); });
    if (document.getElementById('assets-total-value')) document.getElementById('assets-total-value').innerText = formatMoney(totalVal);
    if (document.getElementById('assets-total-diff')) { document.getElementById('assets-total-diff').innerText = formatMoney(totalDiff); document.getElementById('assets-total-diff').className = totalDiff >= 0 ? 'positive' : 'negative'; }
    if (filtered.length === 0) { list.innerHTML = `<p style="color:var(--text-muted); font-size:12px; padding:10px 0;">No tienes activos ${currentAssetType === 'active' ? 'vigentes' : 'vendidos'}.</p>`; return; }
    filtered.forEach(a => {
        const diff = a.currentValue - (a.purchaseValue || 0);
        list.innerHTML += `<div class="acc-list-item" onclick="openAssetDetail(${a.id})"><div class="acc-list-name"><span class="drawer-icon-box accent-box" style="width:32px; height:32px;">${getAssetVectorIcon(a.category)}</span><div><span>${a.name}</span><small style="display:block; font-size:11px; color:var(--text-muted);">${a.category || 'Otro'}</small></div></div><div style="text-align:right;"><span class="acc-list-balance">${formatMoney(a.currentValue)}</span><small class="${diff >= 0 ? 'positive' : 'negative'}" style="display:block; font-size:10px;">${diff >= 0 ? '+' : ''}${formatMoney(diff)}</small></div></div>`;
    });
};

document.querySelectorAll('#assets-type-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#assets-type-pills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); currentAssetType = btn.getAttribute('data-type'); renderAssetsBreakdown();
    });
});
document.getElementById('new-asset-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-asset-name').value.trim();
    if (!name) return;
    const currentVal = parseMoneyInput(document.getElementById('new-asset-current').value);
    const purchaseVal = parseMoneyInput(document.getElementById('new-asset-purchase').value);
    const showInBalance = document.getElementById('new-asset-show-balance') ? document.getElementById('new-asset-show-balance').checked : true;
    
    financeData.fixedAssets.push({ 
        id: Date.now(), 
        name, 
        category: document.getElementById('new-asset-category').value || 'Otro', 
        currentValue: currentVal, 
        purchaseValue: purchaseVal, 
        status: 'active', 
        linkedExpenses: 0,
        showInBalance,
        history: [{ date: currentDate.toLocaleDateString('en-CA'), value: currentVal, note: 'Registro Inicial' }]
    });
    
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('new-asset-form').reset();
    e.target.closest('details')?.removeAttribute('open');
    hasUnsavedChanges = false;
    updateDashboard();
    renderAssetsBreakdown();
});

document.getElementById('new-receivable-form')?.addEventListener('submit', (e) => {
    setTimeout(() => e.target.closest('details')?.removeAttribute('open'), 50);
});

window.openAssetDetail = (id) => {
    const a = financeData.fixedAssets.find(x => x.id === id);
    if (!a) return;
    document.getElementById('assets-modal')?.classList.add('hidden');
    document.getElementById('asset-detail-modal')?.classList.remove('hidden');
    document.getElementById('detail-asset-name').innerText = a.name;
    document.getElementById('detail-asset-status').innerText = a.status === 'active' ? 'Vigente' : 'Vendido';
    document.getElementById('detail-asset-category').innerHTML = `<span style="display:inline-flex; align-items:center; gap:5px; color:var(--accent);">${getAssetVectorIcon(a.category)} <span>${a.category || 'Otro'}</span></span>`;
    document.getElementById('detail-asset-current').innerText = formatMoney(a.currentValue);
    document.getElementById('detail-asset-purchase').innerText = formatMoney(a.purchaseValue || 0);
    
    const realProfit = a.currentValue - ((a.purchaseValue || 0) + (a.linkedExpenses || 0));
    document.getElementById('detail-asset-diff').innerText = formatMoney(realProfit);
    document.getElementById('detail-asset-diff').className = realProfit >= 0 ? 'positive' : 'negative';
    document.getElementById('detail-asset-expenses').innerText = formatMoney(a.linkedExpenses || 0);
    
    document.getElementById('edit-asset-id').value = a.id;
    document.getElementById('edit-asset-category').value = a.category || 'Otro';
    document.getElementById('edit-asset-val-current').value = formatNumberInput(a.currentValue);
    document.getElementById('edit-asset-date').value = currentDate.toLocaleDateString('en-CA');
    if (document.getElementById('edit-asset-show-balance')) {
        document.getElementById('edit-asset-show-balance').checked = a.showInBalance !== false;
    }
    document.getElementById('edit-asset-form')?.classList.add('hidden');

    const hList = document.getElementById('asset-history-list');
    if (hList) {
        hList.innerHTML = '';
        let hist = a.history || [];
        if (hist.length === 0) {
            hist.push({ date: new Date(a.id).toLocaleDateString('en-CA'), value: a.currentValue, note: 'Registro Inicial' });
            a.history = hist;
        }
        
        const sorted = [...hist].sort((x, y) => new Date(x.date) - new Date(y.date));
        const displayItems = [];
        
        for (let i = 0; i < sorted.length; i++) {
            const cur = sorted[i];
            const prevVal = i > 0 ? sorted[i-1].value : (a.purchaseValue > 0 ? a.purchaseValue : cur.value);
            const diff = cur.value - prevVal;
            const pct = prevVal > 0 ? (diff / prevVal) * 100 : 0;
            displayItems.unshift({ ...cur, diff, pct });
        }
        
        displayItems.forEach((item, idx) => {
            const colorCls = item.diff > 0 ? 'positive' : (item.diff < 0 ? 'negative' : 'neutral');
            const sign = item.diff > 0 ? '+' : '';
            const badgeStr = idx === 0 ? '<span class="widget-badge" style="font-size:9px; padding:2px 6px;">Actual</span>' : '';
            const diffStr = item.diff !== 0 
                ? `<small class="${colorCls}" style="display:block; font-size:10.5px; margin-top:2px;">${sign}${formatMoney(item.diff)} (${sign}${item.pct.toFixed(1)}%)</small>` 
                : '<small style="display:block; font-size:10.5px; color:var(--text-muted); margin-top:2px;">Sin variación</small>';
            
            hList.innerHTML += `
                <div class="acc-list-item" style="cursor:default; padding:10px 12px; margin-bottom:8px;">
                    <div>
                        <strong style="font-size:13.5px;">${formatMoney(item.value)}</strong>
                        <small style="display:block; color:var(--text-muted); font-size:10.5px; font-weight:500;">${item.date} • ${item.note}</small>
                    </div>
                    <div style="text-align:right;">
                        ${badgeStr}
                        ${diffStr}
                    </div>
                </div>`;
        });
    }
};
document.getElementById('back-to-assets-btn')?.addEventListener('click', () => { document.getElementById('asset-detail-modal')?.classList.add('hidden'); document.getElementById('assets-modal')?.classList.remove('hidden'); });
document.getElementById('edit-asset-settings-btn')?.addEventListener('click', () => document.getElementById('edit-asset-form')?.classList.toggle('hidden'));
document.getElementById('edit-asset-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-asset-id').value, 10);
    const a = financeData.fixedAssets.find(x => x.id === id);
    if (a) { 
        a.category = document.getElementById('edit-asset-category').value; 
        const newVal = parseMoneyInput(document.getElementById('edit-asset-val-current').value);
        const valDate = document.getElementById('edit-asset-date').value;
        if (document.getElementById('edit-asset-show-balance')) {
            a.showInBalance = document.getElementById('edit-asset-show-balance').checked;
        }
        
        a.currentValue = newVal;
        a.history = a.history || [];
        a.history.push({ date: valDate, value: newVal, note: 'Avalúo / Depreciación' });
        
        localStorage.setItem('myFinances', JSON.stringify(financeData)); 
        hasUnsavedChanges = false; 
        updateDashboard(); 
        renderAssetsBreakdown(); 
        openAssetDetail(id); 
    }
});
document.getElementById('btn-asset-delete')?.addEventListener('click', () => {
    const id = parseInt(document.getElementById('edit-asset-id').value, 10);
    if (confirm('¿Eliminar este activo?')) { financeData.fixedAssets = financeData.fixedAssets.filter(x => x.id !== id); localStorage.setItem('myFinances', JSON.stringify(financeData)); updateDashboard(); renderAssetsBreakdown(); document.getElementById('asset-detail-modal')?.classList.add('hidden'); document.getElementById('assets-modal')?.classList.remove('hidden'); }
});
document.getElementById('btn-asset-sell')?.addEventListener('click', () => {
    const id = parseInt(document.getElementById('edit-asset-id').value, 10), a = financeData.fixedAssets.find(x => x.id === id);
    if (!a) return;
    openQuickActionModal({ title: `Vender ${a.name}`, subtitle: 'Abona el dinero de la venta a una cuenta', infoLabel: 'Valor Actual:', infoValue: formatMoney(a.currentValue), showAccountSelect: true, accountLabel: 'Cuenta Destino', amountLabel: 'Precio de Venta ($)', defaultAmount: a.currentValue, submitLabel: '💰 Confirmar Venta', onConfirm: (val, dest) => { if (val <= 0) return false; a.status = 'sold'; a.currentValue = val; const now = new Date(); financeData.transactions.push({ id: now.getTime(), monthId: getMonthId(now), type: 'income', status: 'closed', account: dest, description: `💰 Venta Activo: ${a.name}`, amount: val, date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: false }); localStorage.setItem('myFinances', JSON.stringify(financeData)); updateDashboard(); renderAssetsBreakdown(); openAssetDetail(id); return true; } });
});
document.getElementById('btn-asset-expense')?.addEventListener('click', () => {
    const id = parseInt(document.getElementById('edit-asset-id').value, 10), a = financeData.fixedAssets.find(x => x.id === id);
    if (!a) return;
    openQuickActionModal({ 
        title: `Gasto en ${a.name}`, 
        subtitle: 'Mantenimiento, SOAT, impuestos o mejoras', 
        infoLabel: 'Gastos Previos:', 
        infoValue: formatMoney(a.linkedExpenses || 0), 
        showAccountSelect: true, 
        accountLabel: 'Cuenta Origen', 
        showCategorySelect: true,
        showDescription: true,
        amountLabel: 'Monto del Gasto ($)', 
        submitLabel: '📉 Registrar Gasto', 
        onConfirm: (val, src, catVal, descVal) => { 
            if (val <= 0) return false; 
            a.linkedExpenses = round2((a.linkedExpenses || 0) + val); 
            const now = new Date(); 
            
            let catName = '📦 Otros Gastos', subName = 'Activos';
            if (catVal) {
                const parts = catVal.split('::');
                catName = parts[0];
                subName = parts[1] || 'General';
            }
            
            const customDesc = descVal ? `🔧 ${descVal} (${a.name})` : `🔧 Gasto Activo: ${a.name}`;

            financeData.transactions.push({ 
                id: now.getTime(), 
                monthId: getMonthId(now), 
                type: 'expense', 
                status: 'closed', 
                account: src, 
                category: catName, 
                subcategory: subName, 
                description: customDesc, 
                amount: val, 
                date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, 
                isAdjustment: false 
            }); 
            
            localStorage.setItem('myFinances', JSON.stringify(financeData)); 
            updateDashboard(); 
            renderAssetsBreakdown(); 
            openAssetDetail(id); 
            return true; 
        } 
    });
});
// --- 15C. PLANIFICADOR DE DEUDAS (AVALANCHA / BOLA DE NIEVE) ---
function renderDebtPlanner() {
    const strategy = document.getElementById('planner-method')?.value || 'avalanche';
    const extraMonthly = parseMoneyInput(document.getElementById('planner-extra-monthly')?.value) || 0;
    const primaMode = document.getElementById('planner-prima-mode')?.value || 'both';

    const extrasListEl = document.getElementById('planner-extras-tags');
    if (extrasListEl) {
        extrasListEl.innerHTML = financeData.plannerExtras.map((ex, i) => `
            <span class="widget-badge" style="display:inline-flex; align-items:center; gap:6px;">
                ${ex.month}: <b>${formatCompact(ex.amount)}</b>
                <button type="button" onclick="removePlannerExtra(${i})" style="color:var(--negative); background:none; border:none; cursor:pointer; font-weight:bold;">✕</button>
            </span>`).join('');
    }

    const snap = computeBalancesUpTo(getMonthId(viewDate));
    const allPositiveDebts = financeData.customAccounts.filter(a => (a.category === 'debt' || a.category === 'credit_card') && snap.bals[a.id] > 0).map(a => {
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

    const warnBox = document.getElementById('planner-zero-rate-warning');
    if (warnBox) {
        if (excludedZeroRateDebts.length > 0) {
            const excludedNames = excludedZeroRateDebts.map(d => `${d.name} (${formatCompact(d.bal)})`).join(', ');
            warnBox.classList.remove('hidden');
            warnBox.innerHTML = `
                <div style="display:flex; align-items:flex-start; gap:8px;">
                    <span style="color:#d97706; display:inline-flex; margin-top:1px; flex-shrink:0;">${renderIcon('alert', 16)}</span>
                    <div>
                        <strong style="display:block; color:#d97706; margin-bottom:2px;">Plan Incompleto • Obligaciones al 0% excluidas</strong>
                        <span style="color:var(--text-muted);">Se excluyeron <b>${excludedNames}</b> porque registran tasa <b>0%</b> o no tienen % de interés configurado. Financieramente no conviene acelerar deudas sin costo financiero.</span>
                    </div>
                </div>
            `;
        } else {
            warnBox.classList.add('hidden');
            warnBox.innerHTML = '';
        }
    }

    if (activeDebts.length === 0) {
        if (document.getElementById('planner-schedule-body')) {
            document.getElementById('planner-schedule-body').innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay deudas con tasa de interés vigentes</td></tr>';
        }
        document.getElementById('planner-base-months').innerText = '-';
        document.getElementById('planner-base-interest').innerText = '-';
        document.getElementById('planner-accel-months').innerText = '-';
        document.getElementById('planner-accel-interest').innerText = '-';
        document.getElementById('planner-interest-saved').innerText = '$ 0,00';
        document.getElementById('planner-freedom-date').innerText = '-';
        lastPlannerScheduleText = '';
        return;
    }

    let halfPrima = 0;
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (salaryStr) halfPrima = calculateLaborMetrics(JSON.parse(salaryStr), currentDate).halfPrimaNeta;

    const simAmort = (debts, addExtra) => {
        let simDebts = debts.map(d => ({ ...d }));
        const baseMonthlyPool = round2(simDebts.reduce((s, d) => s + d.minPay, 0));
        let monthIter = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
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

            // Cascada real: mantiene el presupuesto base de cuotas y redirige lo liberado a la deuda objetivo
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
    
    document.getElementById('planner-base-months').innerText = baseRes.isUnpayable ? 'Impagable (+30 años)' : `${baseRes.months} meses`;
    document.getElementById('planner-base-interest').innerText = baseRes.isUnpayable ? 'Int: Infinito' : `Int: ${formatMoney(baseRes.interest)}`;
    document.getElementById('planner-base-interest').className = 'negative';

    document.getElementById('planner-accel-months').innerText = `${optRes.months} meses`;
    document.getElementById('planner-accel-interest').innerText = `Int: ${formatMoney(optRes.interest)}`;
    
    const savedEl = document.getElementById('planner-interest-saved');
    if (baseRes.isUnpayable) {
        savedEl.innerHTML = `<span style="display:inline-flex; align-items:center; gap:5px;">${renderIcon('alert', 15)} Salva tu vida financiera</span>`;
        savedEl.style.color = 'var(--negative)';
    } else {
        savedEl.innerText = formatMoney(Math.max(0, baseRes.interest - optRes.interest));
        savedEl.style.color = 'var(--positive)';
    }
    document.getElementById('planner-freedom-date').innerText = `${getShortMonthLabel(optRes.freedomDate)} ${optRes.freedomDate.getFullYear()}`;
    document.getElementById('planner-schedule-body').innerHTML = optRes.schedule.map(r => `<tr><td>${r.monthStr}</td><td>${r.targetName}</td><td>${formatMoney(r.pay)}</td><td class="negative">${formatMoney(r.int)}</td><td>${formatMoney(r.focusRem)}</td><td>${formatMoney(r.rem)}</td></tr>`).join('');
    lastPlannerScheduleText = optRes.schedule.map(r => `${r.monthStr} | ${r.targetName} | Pago: ${formatMoney(r.pay)} | Saldo Enfoque: ${formatMoney(r.focusRem)} | Saldo Global: ${formatMoney(r.rem)}`).join('\n');
}

document.getElementById('open-debt-planner-btn')?.addEventListener('click', () => { document.getElementById('debt-planner-modal')?.classList.remove('hidden'); renderDebtPlanner(); });
document.getElementById('planner-method')?.addEventListener('change', renderDebtPlanner);
document.getElementById('planner-extra-monthly')?.addEventListener('input', renderDebtPlanner);
document.getElementById('planner-prima-mode')?.addEventListener('change', renderDebtPlanner);
document.getElementById('btn-add-planner-extra')?.addEventListener('click', () => {
    const m = document.getElementById('planner-oneoff-month').value, a = parseMoneyInput(document.getElementById('planner-oneoff-amount').value);
    if (!m || a <= 0) return;
    financeData.plannerExtras.push({ month: m, amount: a });
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('planner-oneoff-month').value = ''; document.getElementById('planner-oneoff-amount').value = '';
    renderDebtPlanner();
});
window.removePlannerExtra = (i) => { financeData.plannerExtras.splice(i, 1); localStorage.setItem('myFinances', JSON.stringify(financeData)); renderDebtPlanner(); };
document.getElementById('btn-copy-debt-plan')?.addEventListener('click', async () => { if (lastPlannerScheduleText && navigator.clipboard) { await navigator.clipboard.writeText(lastPlannerScheduleText); alert('Plan copiado al portapapeles.'); } });

// --- 15D. CALCULADORA Y MODAL DE TRANSACCIONES ---
let userEditedBudgetField = false, calcExpression = '';
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
    const amort = calculateAmortization(amount, installments, installments === 1 ? 0 : parseMoneyInput(rateInput.value), rateTypeSelect.value);
    document.getElementById('cc-preview-quota').innerText = formatMoney(amort.payment);
    document.getElementById('cc-preview-interest').innerText = formatMoney(amort.totalInterest);
    document.getElementById('cc-preview-total').innerText = formatMoney(amort.totalWithInterest);
    
    // Calcular fechas desde el día 1 del mes elegido (evita saltos en días 30/31)
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
});

document.getElementById('toggle-tx-amort-btn')?.addEventListener('click', () => document.getElementById('tx-amortization-box')?.classList.toggle('hidden'));
document.getElementById('trans-installments')?.addEventListener('input', () => updateCCInstallmentsPreview(true));
document.getElementById('trans-rate')?.addEventListener('input', () => updateCCInstallmentsPreview(false));
document.getElementById('trans-rate-type')?.addEventListener('change', () => updateCCInstallmentsPreview(false));
document.getElementById('trans-zero-interest')?.addEventListener('change', () => updateCCInstallmentsPreview(true));
document.getElementById('account')?.addEventListener('change', () => updateCCInstallmentsPreview(true));
document.getElementById('trans-recurrence')?.addEventListener('change', (e) => { document.getElementById('group-recurrence-count')?.classList.toggle('hidden', e.target.value === 'none'); });

const updateTransferAllocationUI = () => {
    const box = document.getElementById('transfer-debt-allocation-box');
    const list = document.getElementById('transfer-pending-items-list');
    const sumEl = document.getElementById('transfer-allocation-summary');
    if (!box || !list) return;

    if (typeSelect.value !== 'transfer') {
        box.classList.add('hidden');
        return;
    }

    const toAccId = document.getElementById('to-account').value;
    const toAcc = financeData.customAccounts.find(a => a.id === toAccId);

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
                checkBoxes.forEach(c => { if(c.checked) totalSel += parseFloat(c.getAttribute('data-quota')); });
                if(sumEl) sumEl.innerHTML = totalSel > 0 ? `Suma seleccionada: <b style="color:var(--text-main);">${formatMoney(totalSel)}</b>` : '';
                
                // UX: Autocompletar el monto de la transferencia si seleccionas cuotas
                const amountInput = document.getElementById('amount');
                if (amountInput && totalSel > 0) {
                    amountInput.value = formatNumberInput(totalSel);
                    amountInput.dispatchEvent(new Event('input'));
                }
            });
        });
        if(sumEl) sumEl.innerHTML = '';
        const badge = document.getElementById('transfer-alloc-badge');
        if (badge) badge.innerText = pendingItems.length > 0 ? `${pendingItems.length} diferidos` : 'Sin diferidos';
    } else {
        box.classList.add('hidden');
    }
};

document.getElementById('to-account')?.addEventListener('change', updateTransferAllocationUI);

// Listener dedicado para el switch de Gasto Compartido
document.getElementById('is-shared-expense')?.addEventListener('change', (e) => {
    const sharedFields = document.getElementById('shared-expense-fields');
    if (e.target.checked) {
        sharedFields?.classList.remove('hidden');
        // Magia UX: Autocompletar el monto que me deben con el monto total para facilitar la división
        const mainAmount = document.getElementById('amount')?.value;
        const owedInput = document.getElementById('shared-owed-amount');
        if (mainAmount && owedInput && (!owedInput.value || owedInput.value === '0,00' || owedInput.value === '0')) {
            owedInput.value = mainAmount;
            // Parpadeo verde para indicar que se autocompletó
            owedInput.style.transition = 'box-shadow 0.3s ease';
            owedInput.style.boxShadow = '0 0 0 2px var(--positive)';
            setTimeout(() => owedInput.style.boxShadow = 'none', 1500);
        }
    } else {
        sharedFields?.classList.add('hidden');
    }
});

typeSelect?.addEventListener('change', () => {
    const accEl = document.getElementById('account'), budgetGroup = document.getElementById('group-budgeted-amount'), payrollShortcut = document.getElementById('quick-payroll-shortcut');
    const splitBtn = document.getElementById('btn-open-split-modal');
    // Mostrar/Ocultar bloque de Gasto Compartido según el tipo de transacción
    const sharedWrap = document.getElementById('shared-expense-wrapper');
    if (typeSelect.value === 'expense') {
        sharedWrap?.classList.remove('hidden');
    } else {
        sharedWrap?.classList.add('hidden');
        const sharedSwitch = document.getElementById('is-shared-expense');
        if (sharedSwitch) {
            sharedSwitch.checked = false;
            sharedSwitch.dispatchEvent(new Event('change')); // Fuerza a ocultar los campos
        }
    }
    
    // Elementos visuales dinámicos del Omni-Modal
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

// --- 15F. MEMORIA PREDICTIVA LOCAL (AUTOCOMPLETADO INTELIGENTE) ---
let predictTimeout;
document.getElementById('description')?.addEventListener('input', (e) => {
    clearTimeout(predictTimeout);
    predictTimeout = setTimeout(() => {
        const text = e.target.value.trim();
        if (text.length < 3) return;

        const currentType = document.getElementById('type')?.value;
        const editId = document.getElementById('edit-id')?.value;
        
        // Solo predecir si es nuevo registro y no es transferencia
        if (editId || currentType === 'transfer') return;

        const catSelect = document.getElementById('trans-category');
        const accSelect = document.getElementById('account');
        let aiActed = false;
        let bestCat = null;
        let bestAcc = null;

        // 1. Motor Regex (Reglas Duras predefinidas)
        const regexInferredCategory = inferCategoryFromName(text, currentType);
        if (regexInferredCategory) {
            // Intentar buscar la categoría general o la primera subcategoría que coincida con el nombre
            const options = Array.from(catSelect.options);
            const exactMatch = options.find(o => o.value === `${regexInferredCategory}::General`);
            const looseMatch = options.find(o => o.value.startsWith(`${regexInferredCategory}::`));
            
            if (exactMatch) bestCat = exactMatch.value;
            else if (looseMatch) bestCat = looseMatch.value;
        }

        // 2. Historial Estadístico (Fallback si el Regex no encontró nada, y para predecir la cuenta)
        const matches = financeData.transactions.filter(t => 
            t.type === currentType && 
            t.description && 
            t.description.toLowerCase().includes(text.toLowerCase())
        );

        if (matches.length > 0) {
            const catFreq = {}, accFreq = {};
            matches.forEach(t => {
                const catStr = t.subcategory && t.subcategory !== 'General' ? `${t.category}::${t.subcategory}` : `${t.category}::General`;
                catFreq[catStr] = (catFreq[catStr] || 0) + 1;
                if (t.account) accFreq[t.account] = (accFreq[t.account] || 0) + 1;
            });

            // Si el Regex no encontró categoría, usamos la moda del historial
            if (!bestCat) {
                bestCat = Object.keys(catFreq).sort((a, b) => catFreq[b] - catFreq[a])[0];
            }
            // Siempre usamos el historial para inferir la cuenta bancaria (el Regex no sabe de bancos)
            bestAcc = Object.keys(accFreq).sort((a, b) => accFreq[b] - accFreq[a])[0];
        }

        // 3. Aplicar Cuenta Inteligente
        if (bestAcc && accSelect && accSelect.value !== bestAcc && Array.from(accSelect.options).some(o => o.value === bestAcc)) {
            accSelect.value = bestAcc;
            accSelect.style.transition = 'box-shadow 0.3s ease';
            accSelect.style.boxShadow = '0 0 0 2px var(--accent)'; // Resplandor IA
            setTimeout(() => accSelect.style.boxShadow = 'none', 3000);
            accSelect.dispatchEvent(new Event('change')); // Fuerza re-cálculo de cuotas de TC si aplica
            aiActed = true;
        }

        // 4. Aplicar Categoría Inteligente (Regex o Historial)
        if (bestCat && catSelect && catSelect.value !== bestCat && Array.from(catSelect.options).some(o => o.value === bestCat)) {
            catSelect.value = bestCat;
            catSelect.style.transition = 'box-shadow 0.3s ease';
            catSelect.style.boxShadow = '0 0 0 2px var(--accent)'; // Resplandor IA
            setTimeout(() => catSelect.style.boxShadow = 'none', 3000);
            catSelect.dispatchEvent(new Event('change')); // Fuerza cálculos de presupuesto
            aiActed = true;
        }
        
        // 5. Efecto visual en la descripción confirmando la acción
        if (aiActed) {
            e.target.style.transition = 'box-shadow 0.3s ease';
            e.target.style.boxShadow = '0 0 0 2px var(--positive)';
            setTimeout(() => e.target.style.boxShadow = 'none', 3000);
        }
    }, 450); // Espera 450ms después de que dejes de teclear
});

let pendingOmniPayrollLibranza = null;

document.getElementById('btn-tx-quick-payroll')?.addEventListener('click', () => {
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (!salaryStr) { alert("Configura tu Salario en 'Mi Perfil' primero."); return; }
    const config = JSON.parse(salaryStr), metrics = calculateLaborMetrics(config, currentDate), isBiweekly = config.frequency === 'biweekly';
    
    // Buscar si hay anticipos registrados este mes
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
    // Crear la subcategoría si no existe para no romper el presupuesto
    const catObj = financeData.categories.income.find(c => c.name === '💼 Salario / Nómina');
    if (catObj && !catObj.subcategories.some(s => s.name === 'Anticipo')) {
        catObj.subcategories.push({ name: 'Anticipo', limit: 0, isFixed: false });
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        renderCategoryOptions('income');
    }
    
    document.getElementById('trans-category').value = '💼 Salario / Nómina::Anticipo';
    document.getElementById('description').value = '💸 Anticipo de Nómina';
    document.getElementById('amount').focus();
    document.getElementById('trans-category').dispatchEvent(new Event('change'));
});

// --- 15D. OMNI-MODAL: CENTRALIZACIÓN DE REGISTROS ---
window.openOmniModal = (config = {}) => {
    const {
        mode = 'create', txId = null, type = 'expense', title = null,
        lockType = false, amount = '', account = '', toAccount = '',
        category = '', description = '', status = 'closed',
        dateMs = null, hideRecurrence = false, installments = 1
    } = config;

    forceCloseAllModals();
    const tModal = document.getElementById('transaction-modal');
    if (!tModal) return;

    form?.reset();
    document.getElementById('edit-id').value = mode === 'edit' ? txId : '';
    document.getElementById('modal-title').innerText = title || { expense: 'Nuevo Gasto', income: 'Nuevo Ingreso', transfer: 'Nueva Transferencia' }[type];
    
    typeSelect.value = type; 
    typeSelect.disabled = lockType;
    typeSelect.dispatchEvent(new Event('change'));
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
            updateCCInstallmentsPreview(true);
        }
    }
    if (toAccount && type === 'transfer') document.getElementById('to-account').value = toAccount;
    if (category && type !== 'transfer') {
        document.getElementById('trans-category').value = category;
        userEditedBudgetField = false; 
        autoFillBudgetedAmountForTransaction(true);
    }
    if (description) document.getElementById('description').value = description;

    const targetDate = dateMs ? new Date(dateMs) : new Date();
    document.getElementById('trans-date').value = (mode === 'create' && selectedCalendarDay) ? selectedCalendarDay : targetDate.toLocaleDateString('en-CA');
    document.getElementById('trans-time').value = targetDate.toTimeString().slice(0, 5);

    const recGroup = document.getElementById('group-recurrence');
    if (recGroup) {
        if (hideRecurrence || mode === 'edit') recGroup.classList.add('hidden');
        else recGroup.classList.remove('hidden');
    }
    document.getElementById('group-recurrence-count')?.classList.add('hidden');
    
    const delBtn = document.getElementById('delete-btn');
    if (delBtn) {
        if (mode === 'edit') delBtn.classList.remove('hidden');
        else delBtn.classList.add('hidden');
    }

    document.getElementById('shared-expense-fields')?.classList.add('hidden');
    document.getElementById('coin-round-fields')?.classList.add('hidden');
    pendingOmniPayrollLibranza = null;
    hasUnsavedChanges = false;
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
    
    document.getElementById('trans-budgeted-amount').value = tx.budgetedAmount ? formatNumberInput(tx.budgetedAmount) : '';
    userEditedBudgetField = !!tx.budgetedAmount;
    autoFillBudgetedAmountForTransaction(false);
    if (tx.type === 'expense') {
        document.getElementById('trans-installments').value = tx.installments || 1;
        document.getElementById('trans-rate').value = tx.rate ? formatNumberInput(tx.rate) : '0';
        document.getElementById('trans-rate-type').value = tx.rateType || 'monthly';
        document.getElementById('trans-zero-interest').checked = !!tx.zeroInterest;
        updateCCInstallmentsPreview(false);
    }
    renderTxBudgetVariancePreview();
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
        if (oldT && oldT.type === 'transfer') revertTransferAllocation(oldT);
        if (oldT && oldT.type === 'income' && isTxClosed(oldT) && getAccountObj(oldT.account).category === 'pocket') {
            const oldPocket = financeData.pockets.find(x => String(x.id) === String(oldT.account));
            if (oldPocket) oldPocket.yields = Math.max(0, round2((oldPocket.yields || 0) - round2(oldT.amount)));
        }
        if (oldT && Array.isArray(oldT.linkedLibranzas)) {
            const linkedIds = oldT.linkedLibranzas.flatMap(l => [l.txId, l.intTxId].filter(Boolean).map(String));
            financeData.transactions = financeData.transactions.filter(t => !linkedIds.includes(String(t.id)));
            oldT.linkedLibranzas.forEach(l => {
                if (l.pocketId && l.pocketAmt > 0) {
                    adjustPocketBalance(l.pocketId, -l.pocketAmt);
                } else if (l.targetTxId && l.quoteStep > 0) {
                    const targetTx = financeData.transactions.find(t => String(t.id) === String(l.targetTxId));
                    if (targetTx) {
                        targetTx.paidInstallments = Math.max(0, (targetTx.paidInstallments || 0) - l.quoteStep);
                    }
                } else {
                    const debtAcc = financeData.customAccounts.find(a => a.id === l.debtId);
                    if (debtAcc && l.quoteStep > 0) {
                        debtAcc.debtPaidQuotes = Math.max(0, (debtAcc.debtPaidQuotes || 0) - l.quoteStep);
                    }
                }
            });
        }
        financeData.transactions = financeData.transactions.filter(t => String(t.id) !== String(editId));
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        forceCloseAllModals(); updateDashboard();
    }
});

form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-id').value, type = typeSelect.value, status = document.getElementById('trans-status').value;
    const recurrence = !editId ? (document.getElementById('trans-recurrence')?.value || 'none') : 'none';
    const recCount = recurrence !== 'none' ? Math.max(2, Math.min(60, parseInt(document.getElementById('trans-recurrence-count')?.value, 10) || 12)) : 1;
    const account = document.getElementById('account').value, toAccount = document.getElementById('to-account').value;
    let description = document.getElementById('description').value.trim();
    const amount = parseMoneyInput(document.getElementById('amount').value);
    const budgetedVal = parseMoneyInput(document.getElementById('trans-budgeted-amount')?.value);
    const baseDateObj = new Date(`${document.getElementById('trans-date').value}T${document.getElementById('trans-time').value}`);

    // --- LÓGICA DE GASTO COMPARTIDO ---
    let finalAmount = amount;
    const isShared = document.getElementById('is-shared-expense')?.checked;
    const owedAmount = parseMoneyInput(document.getElementById('shared-owed-amount')?.value);
    const debtorName = document.getElementById('shared-debtor-name')?.value.trim() || 'Alguien';

    if (type === 'expense' && isShared && owedAmount > 0) {
        if (owedAmount >= amount) { alert('El monto que te deben debe ser menor al total pagado.'); return; }
        finalAmount = round2(amount - owedAmount); // Se resta tu gasto real
        
        const originalAmountFormatted = formatMoney(amount);
        description = `${description} (Mi parte de ${originalAmountFormatted})`;

        // Crea la cuenta por cobrar si no existe
        const accId = 'CxC_' + debtorName.replace(/\s+/g, '_');
        if (!financeData.customAccounts.some(a => a.id === accId)) {
            financeData.customAccounts.push({ id: accId, name: `🤝 Me debe: ${debtorName}`, category: 'asset', isDefault: false, showWhenZero: true });
        }

        // Crea la transferencia de deuda
        financeData.transactions.push({
            id: baseDateObj.getTime() + 999,
            monthId: getMonthId(baseDateObj),
            type: 'transfer',
            status: status,
            account: account,
            toAccount: accId,
            description: `👥 Préstamo a ${debtorName} (Compra total: ${originalAmountFormatted})`,
            amount: owedAmount,
            date: `${baseDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${baseDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
            isAdjustment: false
        });
    }

    // --- LÓGICA DE AHORRO DE MONEDAS (DOBLE PARTIDA EXACTA) ---
    const isCoinRound = document.getElementById('is-coin-round')?.checked;
    const coinSavedAmt = parseMoneyInput(document.getElementById('coin-round-amount')?.value);
    if (type === 'expense' && account === 'Efectivo' && isCoinRound && coinSavedAmt > 0) {
        const coinPocketId = 'Pocket_Monedas';
        let coinPocket = financeData.pockets.find(p => p.id === coinPocketId);
        if (!coinPocket) {
            coinPocket = {
                id: coinPocketId, name: 'Alcancía Monedas', entity: 'Efectivo físico',
                goal: 0, startDate: baseDateObj.toLocaleDateString('en-CA'), targetDate: '',
                customQuota: 0, principal: 0, yields: 0, excludeFromBalance: true
            };
            financeData.pockets.push(coinPocket);
        }

        if (status === 'closed') {
            coinPocket.principal = round2((coinPocket.principal || 0) + coinSavedAmt);
        }

        // Transferencia pura Efectivo -> Alcancía (sin alterar el valor real del gasto)
        financeData.transactions.push({
            id: baseDateObj.getTime() + 998,
            monthId: getMonthId(baseDateObj),
            type: 'transfer',
            status: status,
            account: account,
            toAccount: coinPocketId,
            description: `Ahorro de monedas (de: ${description})`,
            amount: coinSavedAmt,
            date: `${baseDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${baseDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
            isAdjustment: false
        });
    }

    if (editId) {
        const oldT = financeData.transactions.find(t => String(t.id) === String(editId));
        if (oldT && oldT.type === 'transfer') revertTransferAllocation(oldT);
        if (oldT && oldT.type === 'income' && isTxClosed(oldT) && getAccountObj(oldT.account).category === 'pocket') {
            const oldPocket = financeData.pockets.find(x => String(x.id) === String(oldT.account));
            if (oldPocket) oldPocket.yields = Math.max(0, round2((oldPocket.yields || 0) - round2(oldT.amount)));
        }
        financeData.transactions = financeData.transactions.filter(t => String(t.id) !== String(editId));
    }

    let savedCategory = null, savedSubcategory = null;
    if (type !== 'transfer') {
        const parts = (document.getElementById('trans-category').value || '').split('::');
        savedCategory = parts[0]; savedSubcategory = parts[1] || 'General';
    }

    for (let step = 0; step < recCount; step++) {
        const txDate = advanceDateByRecurrence(baseDateObj, recurrence, step), instStatus = step === 0 ? status : 'pending';
        const txData = {
            id: txDate.getTime() + step + Math.floor(Math.random() * 500), monthId: getMonthId(txDate), type, status: instStatus,
            account, category: savedCategory, subcategory: savedSubcategory,
            description: recCount > 1 ? `${description} (${step + 1}/${recCount})` : description,
            amount: finalAmount, budgetedAmount: budgetedVal > 0 ? budgetedVal : (instStatus === 'pending' ? finalAmount : 0),
            date: `${txDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${txDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: false
        };
        const accObj = getAccountObj(account);
        if (type === 'expense' && (accObj.category === 'credit_card' || accObj.debtType === 'revolving')) {
            const inst = Math.max(1, parseInt(document.getElementById('trans-installments').value, 10) || 1);
            const rate = inst === 1 ? 0 : parseMoneyInput(document.getElementById('trans-rate').value);
            const rateType = document.getElementById('trans-rate-type').value;
            const amort = calculateAmortization(finalAmount, inst, rate, rateType);
            txData.installments = inst; txData.rate = rate; txData.rateType = rateType;
            txData.zeroInterest = document.getElementById('trans-zero-interest').checked || rate === 0;
            txData.paidInstallments = 0; txData.monthlyQuota = amort.payment; txData.totalWithInterest = amort.totalWithInterest;
        }
        if (type === 'transfer') {
            txData.toAccount = toAccount;
            const payMode = document.getElementById('transfer-payment-mode')?.value || 'installments';
            txData.paymentMode = payMode;
            
            const toAccObj = getAccountObj(toAccount);
            if (toAccObj && (toAccObj.category === 'credit_card' || toAccObj.debtType === 'revolving')) {
                const selectedChecks = Array.from(document.querySelectorAll('.transfer-alloc-check:checked'));
                if (selectedChecks.length > 0) {
                    if (payMode === 'extraordinary') {
                        // Repartir el monto real digitado entre las compras seleccionadas
                        const amountPerItem = round2(finalAmount / selectedChecks.length);
                        txData.allocatedItems = selectedChecks.map(cb => ({
                            kind: 'cc_tx',
                            txId: cb.value,
                            mode: payMode,
                            amountApplied: amountPerItem
                        }));
                    } else {
                        txData.allocatedItems = selectedChecks.map(cb => ({
                            kind: 'cc_tx',
                            txId: cb.value,
                            mode: payMode,
                            amountApplied: parseFloat(cb.getAttribute('data-quota'))
                        }));
                    }
                }
            } else if (toAccObj && toAccObj.category === 'debt') {
                txData.allocatedItems = [{ kind: 'debt_quota', debtId: toAccObj.id, mode: payMode, amountApplied: finalAmount }];
            }
        }
        
        if (instStatus === 'closed') {
            if (type === 'transfer') {
                if (accObj.category === 'pocket') adjustPocketBalance(accObj.id, -finalAmount);
                const toObj = getAccountObj(toAccount);
                if (toObj && toObj.category === 'pocket') adjustPocketBalance(toObj.id, finalAmount);
                
                // Aplicar abonos a compras o cuotas de deuda
                if (Array.isArray(txData.allocatedItems)) {
                    txData.allocatedItems.forEach(item => {
                        if (item.kind === 'cc_tx') {
                            const targetTx = financeData.transactions.find(t => String(t.id) === String(item.txId));
                            if (targetTx) {
                                if (item.mode === 'extraordinary') {
                                    targetTx.extraPrincipalPaid = round2((targetTx.extraPrincipalPaid || 0) + item.amountApplied);
                                } else {
                                    // Separar interés automáticamente al igual que Libranzas
                                    const inst = Math.max(1, parseInt(targetTx.installments, 10) || 1);
                                    const paid = Math.max(0, parseInt(targetTx.paidInstallments, 10) || 0);
                                    const rate = inst === 1 ? 0 : (parseFloat(targetTx.rate) || 0);
                                    const rateType = targetTx.rateType || 'monthly';
                                    
                                    const amort = calculateAmortization(round2(targetTx.amount), inst, rate, rateType);
                                    const remSchedule = amort.schedule.slice(paid);
                                    
                                    if (remSchedule.length > 0 && remSchedule[0].interest > 0) {
                                        const interestAmt = remSchedule[0].interest;
                                        const intCat = financeData.categories.expense.find(c => stripLeadingEmoji(c.name) === 'Cuotas / Intereses');
                                        
                                        financeData.transactions.push({
                                            id: baseDateObj.getTime() + 800 + Math.floor(Math.random() * 5000),
                                            monthId: txData.monthId,
                                            type: 'expense',
                                            status: 'closed',
                                            account: txData.toAccount, // Cargar interés a la tarjeta para balancearla
                                            category: intCat ? intCat.name : 'Cuotas / Intereses',
                                            subcategory: 'General',
                                            description: `Intereses (${targetTx.description})`,
                                            amount: interestAmt,
                                            date: txData.date,
                                            isAdjustment: false,
                                            linkedToTransfer: txData.id
                                        });
                                    }
                                    targetTx.paidInstallments = paid + 1;
                                }
                            }
                        } else if (item.kind === 'debt_quota') {
                            const debtAcc = financeData.customAccounts.find(a => a.id === item.debtId);
                            if (debtAcc && item.mode !== 'extraordinary') {
                                debtAcc.debtPaidQuotes = (debtAcc.debtPaidQuotes || 0) + 1;
                            }
                        }
                    });
                }
            } else if (type === 'income' && accObj.category === 'pocket') {
                const p = financeData.pockets.find(x => x.id === accObj.id);
                if (p) p.yields = round2((p.yields || 0) + finalAmount);
            } else if (type === 'expense' && accObj.category === 'pocket') {
                adjustPocketBalance(accObj.id, -finalAmount);
            } else if (step === 0 && type === 'income' && pendingOmniPayrollLibranza) {
                const appliedLib = applyPayrollLibranzas(
                    txData.monthId,
                    pendingOmniPayrollLibranza.periodVal,
                    txDate,
                    pendingOmniPayrollLibranza.isBiweekly
                );
                if (appliedLib.length > 0) {
                    txData.linkedLibranzas = appliedLib.map(l => ({
                        txId: l.txId,
                        intTxId: l.intTxId,
                        debtId: l.debtId,
                        targetTxId: l.targetTxId,
                        pocketId: l.pocketId,
                        pocketAmt: l.pocketAmt,
                        quoteStep: l.quoteStep
                    }));
                }
                pendingOmniPayrollLibranza = null;
            }
        }
        financeData.transactions.push(txData);
    }
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    viewDate = new Date(baseDateObj.getFullYear(), baseDateObj.getMonth(), 1);
    forceCloseAllModals(); updateDashboard();
});

// --- 15E. SALUD FINANCIERA, ACCESOS DESDE DASHBOARD Y COPIAR LIQUIDACIÓN ---
// Cálculo de Tendencia Histórica
const updateHealthTrend = () => {
    const trendEl = document.getElementById('health-trend-indicator');
    if (!trendEl) return;

    const currentMonthId = getMonthId(viewDate);
    const currSnap = computeBalancesUpTo(currentMonthId);
    const currentHealth = calculateFinancialHealth(currentMonthId, currSnap);
    
    let [y, m] = currentMonthId.split('-').map(Number);
    m -= 1;
    if (m === 0) { m = 12; y -= 1; }
    const prevMonthId = `${y}-${String(m).padStart(2, '0')}`;
    
    const prevSnap = computeBalancesUpTo(prevMonthId);
    const prevHealth = calculateFinancialHealth(prevMonthId, prevSnap);

    const diff = currentHealth.scores.global - prevHealth.scores.global;

    if (currentHealth.isNeutral || prevHealth.isNeutral) {
        trendEl.innerHTML = '';
    } else if (diff > 0) {
        trendEl.innerHTML = `<span style="color: var(--positive); background: rgba(16, 185, 129, 0.1); padding: 4px 10px; border-radius: 12px;">⬆️ +${diff} pts vs. mes anterior</span>`;
    } else if (diff < 0) {
        trendEl.innerHTML = `<span style="color: var(--negative); background: rgba(239, 68, 68, 0.1); padding: 4px 10px; border-radius: 12px;">⬇️ ${diff} pts vs. mes anterior</span>`;
    } else {
        trendEl.innerHTML = `<span style="color: var(--text-muted); background: rgba(148, 163, 184, 0.1); padding: 4px 10px; border-radius: 12px;">➖ Igual que el mes anterior</span>`;
    }
};

document.getElementById('widget-financial-health')?.addEventListener('click', () => {
    const hModal = document.getElementById('health-modal');
    if (!hModal) return;
    const monthId = getMonthId(viewDate), currSnap = computeBalancesUpTo(monthId), hData = calculateFinancialHealth(monthId, currSnap);
    
    updateHealthTrend(); // Llamada al cálculo de tendencia
    
    document.getElementById('health-modal-score').innerText = hData.isNeutral ? '--' : hData.scores.global;
    const badgeEl = document.getElementById('health-modal-badge');
    if (badgeEl) {
        if (hData.isNeutral) { badgeEl.innerText = 'Faltan datos'; badgeEl.className = 'widget-badge neutral'; }
        else if (hData.scores.global >= 80) { badgeEl.innerText = 'Excelente'; badgeEl.className = 'widget-badge good'; }
        else if (hData.scores.global >= 50) { badgeEl.innerText = 'Estable'; badgeEl.className = 'widget-badge warn'; }
        else { badgeEl.innerText = 'Riesgo Alto'; badgeEl.className = 'widget-badge danger'; }
    }
    document.getElementById('pillar-score-flow').innerText = `${hData.scores.flow}/100`;
    document.getElementById('pillar-score-liquidity').innerText = `${hData.scores.liquidity}/100`;
    document.getElementById('pillar-score-debt').innerText = `${hData.scores.debt}/100`;
    document.getElementById('pillar-score-networth').innerText = `${hData.scores.networth}/100`;
    document.getElementById('health-goal-margin').value = hData.goals.margin;
    document.getElementById('health-goal-liquidity').value = hData.goals.liquidity;
    document.getElementById('health-goal-debt').value = hData.goals.debt;
    document.getElementById('health-goal-networth').value = hData.goals.networth;

    const cap = computeDetailedBorrowingCapacity(monthId);
    const { totalFixedExpenses, healthyDebtLimit, freeCashFlow, mathAvailableDebt, visualQuota } = cap;

    document.getElementById('cap-usage-badge').innerText = `${String(cap.usedPct).replace('.', ',')}% / ${cap.maxPct}%`;
    const ratio = cap.maxPct > 0 ? Math.min(100, (cap.usedPct / cap.maxPct) * 100) : 0;
    const barEl = document.getElementById('cap-usage-bar');
    if (barEl) {
        barEl.style.width = `${ratio}%`;
        barEl.style.backgroundColor = cap.usedPct > cap.maxPct ? 'var(--negative)' : (cap.usedPct > (cap.maxPct - 10) ? '#f59e0b' : 'var(--positive)');
    }
    
    document.getElementById('cap-income-label').innerText = cap.incomeSource + ':';
    document.getElementById('cap-base-income').innerText = formatMoney(cap.baseIncome);
    
    if (document.getElementById('cap-fixed-expenses')) document.getElementById('cap-fixed-expenses').innerText = `-${formatMoney(totalFixedExpenses)}`;
    if (document.getElementById('cap-healthy-limit')) document.getElementById('cap-healthy-limit').innerText = formatMoney(healthyDebtLimit);
    document.getElementById('cap-committed-quota').innerText = `-${formatMoney(cap.committedMonthly)}`;
    
    const availEl = document.getElementById('cap-available-quota');
    if (availEl) {
        availEl.innerText = formatMoney(visualQuota);
        availEl.className = visualQuota >= 0 ? 'positive' : 'negative';
    }

    const estEl = document.getElementById('cap-loan-estimate');
    if (estEl) {
        if (cap.baseIncome <= 0) {
            estEl.innerHTML = '⚙️ Configura tu <b>Salario</b> o registra ingresos para calcular tu capacidad real.';
            estEl.style.borderLeftColor = 'var(--text-muted)';
        } else if (visualQuota > 0) {
            const loan24 = visualQuota * 24 * 0.75; // Descuento conservador por intereses
            const loan36 = visualQuota * 36 * 0.70;
            estEl.innerHTML = `💡 Según tu flujo libre, los bancos te prestarían de forma segura aprox. <b>${formatCompact(loan24)}</b> (a 24 meses) o <b>${formatCompact(loan36)}</b> (a 36 meses).`;
            estEl.style.borderLeftColor = 'var(--positive)';
        } else if (freeCashFlow < 0 && mathAvailableDebt > 0) {
            estEl.innerHTML = `⚠️ Tu límite bancario da espacio, pero <b>tu flujo de caja real es negativo</b> debido a tus altos gastos fijos. No tomes más deuda.`;
            estEl.style.borderLeftColor = 'var(--negative)';
        } else {
            estEl.innerHTML = `⚠️ Estás sobreendeudado para los estándares bancarios (déficit de <b>${formatMoney(Math.abs(mathAvailableDebt))}</b> frente al tope del 30%).`;
            estEl.style.borderLeftColor = 'var(--negative)';
        }
    }

    const circleEl = document.getElementById('health-modal-circle');
    if (circleEl) setTimeout(() => { circleEl.style.strokeDashoffset = 263.9 - (263.9 * (hData.isNeutral ? 0 : hData.scores.global) / 100); }, 120);
    hModal.classList.remove('hidden');
});

window.showHealthTip = (pillar) => {
    const tipBox = document.getElementById('health-tip-box');
    const monthId = getMonthId(viewDate);
    const currSnap = computeBalancesUpTo(monthId);
    const hData = calculateFinancialHealth(monthId, currSnap);
    
    if (!tipBox) return;
    tipBox.classList.remove('hidden');

    const m = hData.metrics;
    const liqStr = formatMoney(currSnap.assetsTotal + currSnap.allPocketsTotal);
    const expStr = formatMoney(m.effectiveExp || 0);
    const incStr = formatMoney(m.effectiveInc || 0);
    const debtStr = formatMoney(m.monthlyDebtPayments || 0);
    const assetsStr = formatMoney(m.totalAssets || 0);
    const liabStr = formatMoney(m.totalLiabilities || 0);
    const freeFlow = formatMoney((m.effectiveInc || 0) - (m.effectiveExp || 0));

    const tips = {
        flow: { 
            t: 'Flujo de Caja', 
            d: `Ingreso base evaluado: <b>${incStr}</b>.<br>Gasto base evaluado: <b>${expStr}</b>.<br>Flujo libre estimado: <b>${freeFlow}</b>.<br><br>Tu margen actual es <b>${m.margin}%</b> (Meta: ${hData.goals.margin}%).` 
        },
        liquidity: { 
            t: 'Liquidez (Reserva)', 
            d: `Fondo disponible para emergencias: <b>${liqStr}</b> (Cuentas + Bolsillos, sin CxC).<br>Base proyectada (Presupuesto/Real + Cuotas): <b>${expStr}</b>.<br><br>Tu dinero en caja alcanza para cubrir <b>${m.monthsReserve} meses</b> (${m.daysReserve} días) de tus obligaciones (Meta: ${hData.goals.liquidity}m).` 
        },
        debt: { 
            t: 'Carga de Deuda', 
            d: `Cuotas mensuales comprometidas: <b>${debtStr}</b>.<br>Ingreso base evaluado: <b>${incStr}</b>.<br><br>Tus deudas consumen el <b>${m.debtBurden}%</b> de tu ingreso mensual (Tope: ${hData.goals.debt}%).` 
        },
        networth: { 
            t: 'Patrimonio Neto', 
            d: `Total Activos (Cuentas, Bolsillos, Fijos): <b>${assetsStr}</b>.<br>Total Pasivos (Deudas y Tarjetas): <b>${liabStr}</b>.<br><br>Tu Patrimonio consolidado (Activos menos Pasivos) es de <b>${formatMoney(m.netWorth)}</b>.` 
        }
    };

    // --- INTELIGENCIA ACCIONABLE (COACH) ---
    let cta = '';
    if (pillar === 'flow') {
        if (m.margin < 0) cta = "⚠️ Gastas más de lo que ingresas. Detén compras no esenciales temporalmente y revisa tus suscripciones.";
        else if (m.margin < hData.goals.margin) cta = "💡 Tienes margen positivo, pero no llegas a la meta. Busca reducir un 10% tus gastos en salidas o antojos.";
        else cta = "✅ ¡Excelente flujo! Retienes buena parte de tu ingreso. Ideal para inyectar excedentes a tus bolsillos de ahorro.";
    } else if (pillar === 'liquidity') {
        if (m.monthsReserve < 1) cta = "⚠️ Peligro de liquidez. Ante una emergencia, tendrás que endeudarte. Prioriza crear un fondo base de 1 mes.";
        else if (m.monthsReserve < hData.goals.liquidity) cta = "💡 Tienes un colchón, pero aún no es suficiente. Sigue abonando a tus bolsillos hasta llegar a la meta.";
        else cta = "✅ Tienes un fondo de emergencia sólido. Ya puedes enfocar tu flujo libre en inversiones o pago agresivo de deudas.";
    } else if (pillar === 'debt') {
        if (m.debtBurden >= 60) cta = "⚠️ Sobre-apalancamiento. Congela el uso de tus tarjetas de crédito y aplica el método 'Avalancha' (paga primero la deuda más cara).";
        else if (m.debtBurden > hData.goals.debt) cta = "💡 Deuda alta pero manejable. Evita diferir consumo y abona a capital a deudas como Addi si te sobra flujo.";
        else cta = "✅ Nivel de deuda sano. Mantén tus cuotas bajo control y usa tus tarjetas siempre a 1 sola cuota.";
    } else if (pillar === 'networth') {
        if (m.netWorth < 0) cta = "⚠️ Tu patrimonio es negativo (debes más de lo que tienes). Enfócate agresivamente en liquidar pasivos antes de adquirir nuevos activos.";
        else cta = "✅ Patrimonio positivo. Estás construyendo riqueza real. Mantén el equilibrio entre ahorro y control de deuda.";
    }

    const ctaHtml = `<div style="margin-top:14px; padding:12px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:4px solid var(--accent); font-size:11.5px; line-height:1.4;">
        ${cta}
    </div>`;
    
    document.getElementById('health-tip-title').innerText = tips[pillar].t;
    document.getElementById('health-tip-desc').innerHTML = tips[pillar].d + ctaHtml;
};

document.getElementById('health-goals-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    financeData.healthGoals = { margin: parseFloat(document.getElementById('health-goal-margin').value) || 15, liquidity: parseFloat(document.getElementById('health-goal-liquidity').value) || 3, debt: parseFloat(document.getElementById('health-goal-debt').value) || 30, networth: parseFloat(document.getElementById('health-goal-networth').value) || 10 };
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    alert('✅ Metas actualizadas.'); document.getElementById('widget-financial-health')?.click(); updateDashboard();
});

document.getElementById('widget-savings-goals')?.addEventListener('click', () => { if (!isDashboardEditMode && attemptCloseModals()) { document.getElementById('pockets-modal')?.classList.remove('hidden'); renderPocketsView(); } });
document.getElementById('dashboard-budget-widget')?.addEventListener('click', () => { if (!isDashboardEditMode && attemptCloseModals()) { document.getElementById('budget-modal')?.classList.remove('hidden'); renderBudgetView(); setActiveNav(document.getElementById('nav-budget')); } });
document.getElementById('btn-copy-liquidation')?.addEventListener('click', async () => {
    const txt = `Liquidación Estimada a Hoy:\n- Prima Prop.: ${document.getElementById('liq-prima')?.innerText}\n- Cesantías Prop.: ${document.getElementById('liq-cesantias')?.innerText}\n- Int. Cesantías: ${document.getElementById('liq-intereses')?.innerText}\n- Vacaciones Pend.: ${document.getElementById('liq-vacaciones')?.innerText}\n- TOTAL NETO: ${document.getElementById('liq-total')?.innerText}`;
    if (navigator.clipboard) { await navigator.clipboard.writeText(txt); alert('📋 Liquidación copiada al portapapeles.'); }
});
// --- 16. PERFIL, CONFIGURACIÓN DE NÓMINA Y PRESTACIONES SOCIALES ---
const updateTaxParamsHints = () => {
    const uvt = parseMoneyInput(document.getElementById('param-uvt')?.value) || 52374, smmlv = parseMoneyInput(document.getElementById('profile-smmlv')?.value) || 1750905, aux = parseMoneyInput(document.getElementById('profile-transport-aid')?.value) || 249095, ex25Year = parseMoneyInput(document.getElementById('param-exempt25-annual-uvt')?.value) || 790, g40Year = parseMoneyInput(document.getElementById('param-global40-annual-uvt')?.value) || 1340, prepMonth = parseMoneyInput(document.getElementById('param-prepaid-monthly-uvt')?.value) || 16, depMonth = parseMoneyInput(document.getElementById('param-dependents-monthly-uvt')?.value) || 32, housMonth = parseMoneyInput(document.getElementById('param-housing-monthly-uvt')?.value) || 100, volYear = parseMoneyInput(document.getElementById('param-voluntary-annual-uvt')?.value) || 3800;
    if (document.getElementById('hint-exempt25-cop')) document.getElementById('hint-exempt25-cop').innerText = `${(ex25Year / 12).toFixed(2).replace('.', ',')} UVT/mes (${formatCompact((ex25Year / 12) * uvt)})`;
    if (document.getElementById('hint-global40-cop')) document.getElementById('hint-global40-cop').innerText = `${(g40Year / 12).toFixed(2).replace('.', ',')} UVT/mes (${formatCompact((g40Year / 12) * uvt)})`;
    if (document.getElementById('hint-prepaid-cop')) document.getElementById('hint-prepaid-cop').innerText = `${round2(prepMonth * 12)} UVT/año (${formatCompact(prepMonth * uvt)}/m)`;
    if (document.getElementById('hint-dependents-cop')) document.getElementById('hint-dependents-cop').innerText = `${round2(depMonth * 12)} UVT/año (${formatCompact(depMonth * uvt)}/m)`;
    if (document.getElementById('hint-housing-cop')) document.getElementById('hint-housing-cop').innerText = `${round2(housMonth * 12)} UVT/año (${formatCompact(housMonth * uvt)}/m)`;
    if (document.getElementById('hint-voluntary-cop')) document.getElementById('hint-voluntary-cop').innerText = `${(volYear / 12).toFixed(2).replace('.', ',')} UVT/mes (${formatCompact((volYear / 12) * uvt)})`;
    const ruleHint = document.getElementById('salary-transport-rule-hint');
    if (ruleHint) ruleHint.innerText = `Tope 2 SMMLV: ${formatMoney(smmlv * 2)} • Auxilio: ${formatMoney(aux)}`;
    
    if (typeof renderRentaProjection === 'function') renderRentaProjection();
};

const renderRentaProjection = () => {
    const year = parseInt(document.getElementById('param-tax-year')?.value, 10) || currentDate.getFullYear();
    const res = checkRentaDeclaration(year);
    
    if (document.getElementById('renta-proj-year')) document.getElementById('renta-proj-year').innerText = year;
    
    const badge = document.getElementById('renta-proj-badge');
    if (badge) {
        if (res.mustDeclare) {
            badge.innerHTML = `${renderIcon('alert', 12)} Topes Excedidos`;
            badge.className = 'widget-badge danger';
        } else {
            badge.innerHTML = `${renderIcon('check', 12)} Exento (Proyectado)`;
            badge.className = 'widget-badge good';
        }
    }

    const details = document.getElementById('renta-proj-details');
    if (details) {
        const buildRow = (label, currentVal, limitVal, exceeds) => {
            const pct = limitVal > 0 ? Math.min(100, (currentVal / limitVal) * 100) : 0;
            const color = exceeds ? 'var(--negative)' : 'var(--text-main)';
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; ${exceeds ? 'background:rgba(239, 68, 68, 0.05); border-radius:4px; padding:4px;' : ''}">
                    <span style="color:var(--text-muted);">${label}</span>
                    <div style="text-align:right;">
                        <strong style="color:${color};">${formatMoney(currentVal)}</strong>
                        <span style="display:block; font-size:9.5px; color:var(--text-muted);">Tope: ${formatCompact(limitVal)} (${pct.toFixed(0)}%)</span>
                    </div>
                </div>
            `;
        };

        let html = `
            ${buildRow('Patrimonio Bruto (4.500 UVT)', res.current.patrimonio, res.limits.patrimonio, res.exceeds.patrimonio)}
            ${buildRow('Ingresos Totales (1.400 UVT)', res.current.ingresos, res.limits.ingresos, res.exceeds.ingresos)}
            ${buildRow('Consignaciones (1.400 UVT)', res.current.consignaciones, res.limits.consignaciones, res.exceeds.consignaciones)}
            ${buildRow('Consumos T. Crédito (1.400 UVT)', res.current.tarjetas, res.limits.tarjetas, res.exceeds.tarjetas)}
            ${buildRow('Total Compras (1.400 UVT)', res.current.compras, res.limits.compras, res.exceeds.compras)}
        `;

        if (res.taxSimulation.hasSalaryConfig) {
            const sim = res.taxSimulation;
            const isFavor = sim.saldoAPagar < 0;
            const saldoColor = isFavor ? 'var(--positive)' : (sim.saldoAPagar > 0 ? 'var(--negative)' : 'var(--text-main)');
            
            html += `
            <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-color);">
                <strong style="display:flex; align-items:center; gap:4px; color:var(--text-main); margin-bottom:8px; font-size:11.5px;">
                    ${renderIcon('calculator', 13)} Cálculo Cédula General (Art. 241 E.T.)
                </strong>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:var(--text-muted);">Base Gravable (${formatCompact(sim.baseGravableUVT)} UVT):</span>
                    <b>${formatMoney(sim.baseGravableAnual)}</b>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:var(--text-muted);">Impuesto Estimado:</span>
                    <b class="negative">${formatMoney(sim.impuestoEstimado)}</b>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:var(--text-muted);">Retenciones Practicadas (Aprox):</span>
                    <b class="positive">${formatMoney(sim.retencionesEstimadas)}</b>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; padding-top:6px; border-top:1px solid rgba(0,0,0,0.05);">
                    <span style="font-weight:700;">Saldo a ${isFavor ? 'Favor' : 'Pagar'}:</span>
                    <strong style="color:${saldoColor}; font-size:14px;">${formatMoney(Math.abs(sim.saldoAPagar))}</strong>
                </div>
            </div>`;
        }

        details.innerHTML = html;
    }
};

const renderTaxParamsUI = () => {
    const p = getTaxParams();
    if (document.getElementById('param-tax-year')) document.getElementById('param-tax-year').value = p.year;
    if (document.getElementById('param-uvt')) document.getElementById('param-uvt').value = formatNumberInput(p.uvt);
    if (document.getElementById('profile-smmlv')) document.getElementById('profile-smmlv').value = formatNumberInput(p.smmlv);
    if (document.getElementById('profile-transport-aid')) document.getElementById('profile-transport-aid').value = formatNumberInput(p.transportAid);
    if (document.getElementById('param-exempt25-annual-uvt')) document.getElementById('param-exempt25-annual-uvt').value = formatNumberInput(p.exempt25AnnualUvt);
    if (document.getElementById('param-global40-annual-uvt')) document.getElementById('param-global40-annual-uvt').value = formatNumberInput(p.global40AnnualUvt);
    if (document.getElementById('param-prepaid-monthly-uvt')) document.getElementById('param-prepaid-monthly-uvt').value = formatNumberInput(p.prepaidMonthlyUvt);
    if (document.getElementById('param-dependents-monthly-uvt')) document.getElementById('param-dependents-monthly-uvt').value = formatNumberInput(p.dependentsMonthlyUvt);
    if (document.getElementById('param-housing-monthly-uvt')) document.getElementById('param-housing-monthly-uvt').value = formatNumberInput(p.housingMonthlyUvt);
    if (document.getElementById('param-voluntary-annual-uvt')) document.getElementById('param-voluntary-annual-uvt').value = formatNumberInput(p.voluntaryAnnualUvt);
    if (document.getElementById('param-non-salary-cap-pct')) document.getElementById('param-non-salary-cap-pct').value = formatNumberInput(p.nonSalaryCapPct);
    if (document.getElementById('param-fsp-smmlv')) document.getElementById('param-fsp-smmlv').value = formatNumberInput(p.fspSmmlvThreshold);
    updateTaxParamsHints();
};
['param-uvt', 'profile-smmlv', 'profile-transport-aid', 'param-exempt25-annual-uvt', 'param-global40-annual-uvt', 'param-prepaid-monthly-uvt', 'param-dependents-monthly-uvt', 'param-housing-monthly-uvt', 'param-voluntary-annual-uvt'].forEach(id => { document.getElementById(id)?.addEventListener('input', updateTaxParamsHints); });

document.getElementById('tax-params-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTaxParams({ year: parseInt(document.getElementById('param-tax-year')?.value, 10) || 2026, uvt: parseMoneyInput(document.getElementById('param-uvt')?.value) || 52374, smmlv: parseMoneyInput(document.getElementById('profile-smmlv')?.value) || 1750905, transportAid: parseMoneyInput(document.getElementById('profile-transport-aid')?.value) || 249095, exempt25AnnualUvt: parseMoneyInput(document.getElementById('param-exempt25-annual-uvt')?.value) || 790, global40AnnualUvt: parseMoneyInput(document.getElementById('param-global40-annual-uvt')?.value) || 1340, prepaidMonthlyUvt: parseMoneyInput(document.getElementById('param-prepaid-monthly-uvt')?.value) || 16, dependentsMonthlyUvt: parseMoneyInput(document.getElementById('param-dependents-monthly-uvt')?.value) || 32, housingMonthlyUvt: parseMoneyInput(document.getElementById('param-housing-monthly-uvt')?.value) || 100, voluntaryAnnualUvt: parseMoneyInput(document.getElementById('param-voluntary-annual-uvt')?.value) || 3800, nonSalaryCapPct: parseMoneyInput(document.getElementById('param-non-salary-cap-pct')?.value) || 40, fspSmmlvThreshold: parseMoneyInput(document.getElementById('param-fsp-smmlv')?.value) || 4 });
    hasUnsavedChanges = false; updateTaxParamsHints(); renderSalaryUI(false); alert('✅ Parámetros legales guardados. Tu cálculo salarial ha sido actualizado.');
});
document.getElementById('btn-reset-tax-params-2026')?.addEventListener('click', () => { if (confirm('¿Restaurar parámetros legales a los valores oficiales de 2026?')) { saveTaxParams(DEFAULT_TAX_PARAMS_2026); renderTaxParamsUI(); renderSalaryUI(false); hasUnsavedChanges = false; } });

let quickIncomeContext = null;

const getCesantiasPockets = () => {
    return (financeData.pockets || []).filter(p => p.isCesantiasFund || /cesant/i.test(p.name));
};

const updateQuickIncomePreviews = () => {
    if (!quickIncomeContext) return;
    const amount = parseMoneyInput(document.getElementById('quick-income-amount')?.value);
    const benefitType = document.getElementById('quick-income-benefit-type')?.value || '';
    const cesMode = document.getElementById('quick-income-cesantias-mode')?.value || 'fund';
    const isFundTransfer = benefitType === 'cesantias' && cesMode === 'fund';

    const fundGroup = document.getElementById('quick-income-fund-group');
    const accGroup = document.getElementById('quick-income-account-group');
    const netSummary = document.getElementById('quick-income-net-summary');
    const submitBtn = document.getElementById('quick-income-submit-btn');

    if (isFundTransfer) {
        fundGroup?.classList.remove('hidden');
        accGroup?.classList.add('hidden');
        netSummary?.classList.add('hidden');
        if (submitBtn) submitBtn.innerText = '🏦 Consignar al Fondo';

        const fundSel = document.getElementById('quick-income-fund-select');
        const newFundGroup = document.getElementById('quick-income-fund-new-group');
        const selectedFundId = fundSel?.value || 'new';
        if (selectedFundId === 'new') {
            newFundGroup?.classList.remove('hidden');
            if (document.getElementById('quick-income-fund-preview')) {
                document.getElementById('quick-income-fund-preview').innerText = formatMoney(amount);
            }
        } else {
            newFundGroup?.classList.add('hidden');
            const p = financeData.pockets.find(x => String(x.id) === String(selectedFundId));
            const curBal = p ? round2((p.principal || 0) + (p.yields || 0)) : 0;
            if (document.getElementById('quick-income-fund-preview')) {
                document.getElementById('quick-income-fund-preview').innerText = `${formatMoney(round2(curBal + amount))} (Antes: ${formatCompact(curBal)})`;
            }
        }
        return;
    }

    fundGroup?.classList.add('hidden');
    accGroup?.classList.remove('hidden');
    if (submitBtn) submitBtn.innerText = 'Confirmar Abono';

    if (!netSummary) return;
    const salStr = localStorage.getItem('myFinancesSalary');
    if (!salStr) {
        netSummary.classList.add('hidden');
        return;
    }

    const salCfg = JSON.parse(salStr);
    const m = calculateLaborMetrics(salCfg, currentDate);
    const period = document.getElementById('quick-income-period')?.value || 'M';
    const monthVal = document.getElementById('quick-income-month')?.value || getMonthId(currentDate);

    let periodLabel = 'Mes';
    let basePayrollNet = m.net;
    if (period === '1Q') {
        periodLabel = '1ra Quincena';
        basePayrollNet = m.net1Q;
    } else if (period === '2Q') {
        periodLabel = '2da Quincena';
        basePayrollNet = m.net2Q;
    }

    if (quickIncomeContext.isPayroll) {
        const ratio = (quickIncomeContext.isBiweeklyPayroll && (period === '1Q' || period === '2Q')) ? 0.5 : 1;
        const libranzaPeriodAmt = round2((m.payrollDebtDeductions || 0) * ratio);
        const savingsPeriodAmt = round2((m.payrollSavingsDeductions || 0) * ratio);
        const libranzaDebts = financeData.customAccounts.filter(a => a.category === 'debt' && a.payrollDeduction);
        const libranzaPockets = (financeData.pockets || []).filter(p => p.payrollDeduction && getPocketPayrollMonthlyQuota(p, currentDate) > 0);
        const prevCheck = document.getElementById('quick-income-apply-libranza');
        const wasChecked = prevCheck ? prevCheck.checked : true;

        let libranzaHtml = '';
        if ((libranzaPeriodAmt > 0 && libranzaDebts.length > 0) || (savingsPeriodAmt > 0 && libranzaPockets.length > 0)) {
            let rowsDetail = '';
            if (libranzaPeriodAmt > 0 && libranzaDebts.length > 0) {
                const debtNames = libranzaDebts.map(d => stripLeadingEmoji(d.name)).join(', ');
                rowsDetail += `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="color:var(--text-muted);">Libranza deuda (${debtNames}):</span>
                        <strong class="negative">-${formatMoney(libranzaPeriodAmt)}</strong>
                    </div>`;
            }
            if (savingsPeriodAmt > 0 && libranzaPockets.length > 0) {
                const pocketNames = libranzaPockets.map(p => stripLeadingEmoji(p.name)).join(', ');
                rowsDetail += `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="color:var(--text-muted);">Ahorro nómina (${pocketNames}):</span>
                        <strong style="color:var(--accent);">-${formatMoney(savingsPeriodAmt)}</strong>
                    </div>`;
            }
            libranzaHtml = `
                <div style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(148,163,184,0.35);">
                    ${rowsDetail}
                    <label style="display:flex; align-items:center; gap:7px; font-size:11px; color:var(--text-main); cursor:pointer; font-weight:600; margin-top:4px;">
                        <input type="checkbox" id="quick-income-apply-libranza" ${wasChecked ? 'checked' : ''} style="width:15px; height:15px; accent-color:var(--positive);">
                        <span>Aplicar abonos automáticos a deudas y bolsillos</span>
                    </label>
                </div>`;
        }

        netSummary.classList.remove('hidden');
        netSummary.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text-muted);">Neto a consignar (${periodLabel} • ${monthVal}):</span>
                <strong class="positive" style="font-size:13.5px;">${formatMoney(amount)}</strong>
            </div>
            ${libranzaHtml}`;
    } else if (basePayrollNet > 0) {
        const totalPeriodNet = round2(basePayrollNet + amount);
        netSummary.classList.remove('hidden');
        netSummary.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                <span style="color:var(--text-muted);">Nómina base (${periodLabel}):</span>
                <b>${formatMoney(basePayrollNet)}</b>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="color:var(--text-muted);">(+) Este abono:</span>
                <b class="positive">+${formatMoney(amount)}</b>
            </div>
            <div style="display:flex; justify-content:space-between; padding-top:5px; border-top:1px dashed rgba(148,163,184,0.35);">
                <span style="font-weight:700;">Total Neto ${periodLabel} (${monthVal}):</span>
                <strong class="positive" style="font-size:13.5px;">${formatMoney(totalPeriodNet)}</strong>
            </div>`;
    } else {
        netSummary.classList.add('hidden');
    }
};

const applyPayrollLibranzas = (monthVal, periodVal, txDateObj, isBiweekly = false) => {
    const snap = computeBalancesUpTo(monthVal);
    const ratio = (isBiweekly && (periodVal === '1Q' || periodVal === '2Q')) ? 0.5 : 1;
    const appliedList = [];

    financeData.customAccounts
        .filter(a => a.category === 'debt' && a.payrollDeduction)
        .forEach((d, idx) => {
            const bal = round2(snap.bals[d.id] || 0);
            if (bal <= 0) return;

            const qInfo = getDebtMonthlyQuotaBreakdown(d, bal);
            const quoteStep = (isBiweekly && periodVal === '1Q') ? 0 : 1;
            const dateStr = `${txDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${txDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
            const intCat = financeData.categories.expense.find(c => stripLeadingEmoji(c.name) === 'Cuotas / Intereses');

            // 1. Cuota base (Préstamo Fijo / Educativo)
            if (d.debtType !== 'revolving' && qInfo.basePrincipal > 0) {
                const totalQuotes = d.debtTotalQuotes || 1;
                const paidQuotes = d.debtPaidQuotes || 0;
                const appliedQuota = round2(qInfo.baseQuota * ratio);
                const appliedInterest = round2(qInfo.baseInterest * ratio);
                const appliedPrincipal = Math.min(qInfo.baseBal, Math.max(0, round2(appliedQuota - appliedInterest)));
                const nextQuoteNum = Math.min(totalQuotes, paidQuotes + (quoteStep || 1));

                if (appliedPrincipal > 0) {
                    const txId = txDateObj.getTime() + 100 + idx * 10;
                    const intTxId = appliedInterest > 0 ? (txDateObj.getTime() + 200 + idx * 10) : null;

                    if (appliedInterest > 0) {
                        financeData.transactions.push({
                            id: intTxId,
                            monthId: monthVal,
                            type: 'expense',
                            status: 'closed',
                            account: d.id,
                            category: intCat ? intCat.name : 'Cuotas / Intereses',
                            subcategory: 'General',
                            description: `Intereses Libranza ${stripLeadingEmoji(d.name)} (Cuota ${nextQuoteNum}/${totalQuotes})`,
                            amount: appliedInterest,
                            date: dateStr,
                            isAdjustment: false
                        });
                    }

                    financeData.transactions.push({
                        id: txId,
                        monthId: monthVal,
                        type: 'income',
                        status: 'closed',
                        account: d.id,
                        description: `Pago Cuota Libranza (${nextQuoteNum}/${totalQuotes})`,
                        amount: round2(appliedPrincipal + appliedInterest),
                        date: dateStr,
                        isAdjustment: true
                    });

                    if (quoteStep > 0) {
                        d.debtPaidQuotes = Math.min(totalQuotes, paidQuotes + quoteStep);
                    }

                    appliedList.push({
                        txId,
                        intTxId,
                        debtId: d.id,
                        quoteStep,
                        name: d.name,
                        quota: appliedQuota,
                        principal: appliedPrincipal,
                        interest: appliedInterest,
                        quoteLabel: `${d.debtPaidQuotes || paidQuotes}/${totalQuotes}`
                    });
                }
            }

            // 2. Compras / Desembolsos diferidos (Cupo Rotativo o adicionales en Préstamo Fijo)
            qInfo.subPurchases.forEach((p, pIdx) => {
                const pAppliedQuota = round2(p.nextQuota * ratio);
                const pAppliedInterest = round2(p.nextInterest * ratio);
                const pAppliedPrincipal = Math.min(p.remCapital, Math.max(0, round2(pAppliedQuota - pAppliedInterest)));
                const nextQuoteNum = Math.min(p.installments, p.paidInstallments + (quoteStep || 1));

                if (pAppliedPrincipal > 0) {
                    const txId = txDateObj.getTime() + 300 + idx * 50 + pIdx;
                    const intTxId = pAppliedInterest > 0 ? (txDateObj.getTime() + 400 + idx * 50 + pIdx) : null;

                    if (pAppliedInterest > 0) {
                        financeData.transactions.push({
                            id: intTxId,
                            monthId: monthVal,
                            type: 'expense',
                            status: 'closed',
                            account: d.id,
                            category: intCat ? intCat.name : 'Cuotas / Intereses',
                            subcategory: 'General',
                            description: `Intereses Libranza ${stripLeadingEmoji(d.name)} · ${stripLeadingEmoji(p.tx.description)} (${nextQuoteNum}/${p.installments})`,
                            amount: pAppliedInterest,
                            date: dateStr,
                            isAdjustment: false
                        });
                    }

                    financeData.transactions.push({
                        id: txId,
                        monthId: monthVal,
                        type: 'income',
                        status: 'closed',
                        account: d.id,
                        description: `Pago Libranza: ${stripLeadingEmoji(p.tx.description)} (${nextQuoteNum}/${p.installments})`,
                        amount: round2(pAppliedPrincipal + pAppliedInterest),
                        date: dateStr,
                        isAdjustment: true
                    });

                    if (quoteStep > 0) {
                        p.tx.paidInstallments = Math.min(p.installments, p.paidInstallments + quoteStep);
                    }

                    appliedList.push({
                        txId,
                        intTxId,
                        debtId: d.id,
                        targetTxId: p.tx.id,
                        quoteStep,
                        name: `${d.name} (${p.tx.description})`,
                        quota: pAppliedQuota,
                        principal: pAppliedPrincipal,
                        interest: pAppliedInterest,
                        quoteLabel: `${p.tx.paidInstallments}/${p.installments}`
                    });
                }
            });
        });

    // 3. Bolsillos de ahorro con descuento por nómina
    (financeData.pockets || [])
        .filter(p => p.payrollDeduction)
        .forEach((p, pIdx) => {
            const fullMonthlyQuota = getPocketPayrollMonthlyQuota(p, txDateObj);
            if (fullMonthlyQuota <= 0) return;

            let appliedSavings = round2(fullMonthlyQuota * ratio);
            if (p.goal > 0) {
                const curBal = round2((p.principal || 0) + (p.yields || 0));
                const remGoal = Math.max(0, round2(p.goal - curBal));
                appliedSavings = Math.min(remGoal, appliedSavings);
            }

            if (appliedSavings > 0) {
                const txId = txDateObj.getTime() + 600 + pIdx;
                const dateStr = `${txDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${txDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;

                adjustPocketBalance(p.id, appliedSavings);

                financeData.transactions.push({
                    id: txId,
                    monthId: monthVal,
                    type: 'income',
                    status: 'closed',
                    account: p.id,
                    description: `Ahorro Nómina: ${stripLeadingEmoji(p.name)}`,
                    amount: appliedSavings,
                    date: dateStr,
                    isAdjustment: true
                });

                const newBal = round2((p.principal || 0) + (p.yields || 0));
                appliedList.push({
                    txId,
                    pocketId: p.id,
                    pocketAmt: appliedSavings,
                    quoteStep: 0,
                    name: p.name,
                    quota: appliedSavings,
                    principal: appliedSavings,
                    interest: 0,
                    quoteLabel: p.goal > 0 ? `${Math.min(100, Math.round((newBal / p.goal) * 100))}% meta` : 'Ahorro'
                });
            }
        });

    return appliedList;
};

const openQuickIncomeModal = ({
    title, subtitle, category, benefitType = '', description, amount,
    isBiweeklyPayroll = false, metrics = null, defaultMonth = '', defaultPeriod = '', defaultCesantiasMode = 'fund'
}) => {
    const qModal = document.getElementById('quick-income-modal');
    if (!qModal) return;

    const assetsAcc = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset'));
    if (assetsAcc.length === 0 && benefitType !== 'cesantias') {
        alert("Crea primero una cuenta de liquidez en 'Cuentas'.");
        return;
    }

    const accSelect = document.getElementById('quick-income-account');
    if (accSelect) {
        accSelect.innerHTML = assetsAcc.map(a => `<option value="${a.id}">${stripLeadingEmoji(a.name)}${a.isDefault ? ' ★' : ''}</option>`).join('');
        const defAsset = getDefaultAccountId(true);
        if (defAsset && assetsAcc.some(a => a.id === defAsset)) accSelect.value = defAsset;
    }

    const salCfg = JSON.parse(localStorage.getItem('myFinancesSalary') || '{}');
    const isBiweekly = salCfg.frequency === 'biweekly';

    quickIncomeContext = { isPayroll: !benefitType, isBiweeklyPayroll, metrics, baseDescription: description };
    if (document.getElementById('quick-income-title')) document.getElementById('quick-income-title').innerText = title;
    if (document.getElementById('quick-income-subtitle')) document.getElementById('quick-income-subtitle').innerText = subtitle;
    if (document.getElementById('quick-income-category')) document.getElementById('quick-income-category').value = category;
    if (document.getElementById('quick-income-benefit-type')) document.getElementById('quick-income-benefit-type').value = benefitType;

    // Mes y Quincena por defecto
    const monthInput = document.getElementById('quick-income-month');
    if (monthInput) monthInput.value = defaultMonth || getMonthId(currentDate);

    const periodSelect = document.getElementById('quick-income-period');
    if (periodSelect) {
        if (isBiweekly) {
            periodSelect.innerHTML = `<option value="1Q">1ra Quincena (15)</option><option value="2Q">2da Quincena (30)</option>`;
            periodSelect.value = defaultPeriod || (currentDate.getDate() <= 16 ? '1Q' : '2Q');
        } else {
            periodSelect.innerHTML = `<option value="M">Pago Mensual (30)</option><option value="1Q">1ra Quincena (15)</option><option value="2Q">2da Quincena (30)</option>`;
            periodSelect.value = defaultPeriod || 'M';
        }
    }

    // Configuración especial si es Cesantías
    const cesModeGroup = document.getElementById('quick-income-cesantias-mode-group');
    const cesModeSelect = document.getElementById('quick-income-cesantias-mode');
    if (benefitType === 'cesantias') {
        cesModeGroup?.classList.remove('hidden');
        if (cesModeSelect) cesModeSelect.value = defaultCesantiasMode;

        const fundSel = document.getElementById('quick-income-fund-select');
        const existingFunds = getCesantiasPockets();
        if (fundSel) {
            let opts = existingFunds.map(f => `<option value="${f.id}">${stripLeadingEmoji(f.name)}${f.entity ? ` (${f.entity})` : ''} • ${formatCompact(round2((f.principal || 0) + (f.yields || 0)))}</option>`).join('');
            opts += `<option value="new">+ Crear Fondo de Cesantías...</option>`;
            fundSel.innerHTML = opts;
            fundSel.value = existingFunds.length > 0 ? existingFunds[0].id : 'new';
        }
    } else {
        cesModeGroup?.classList.add('hidden');
    }

    if (isBiweeklyPayroll && metrics && periodSelect) {
        const p = periodSelect.value;
        const chosenAmt = p === '1Q' ? metrics.net1Q : metrics.net2Q;
        if (document.getElementById('quick-income-amount')) document.getElementById('quick-income-amount').value = formatNumberInput(chosenAmt);
        if (document.getElementById('quick-income-desc')) document.getElementById('quick-income-desc').value = `💼 Pago Nómina (${p})`;
    } else {
        if (document.getElementById('quick-income-amount')) document.getElementById('quick-income-amount').value = formatNumberInput(amount);
        if (document.getElementById('quick-income-desc')) document.getElementById('quick-income-desc').value = description;
    }

    updateQuickIncomePreviews();
    hasUnsavedChanges = false;
    qModal.classList.remove('hidden');
};

document.getElementById('quick-income-period')?.addEventListener('change', (e) => {
    if (quickIncomeContext?.isBiweeklyPayroll && quickIncomeContext.metrics) {
        const p = e.target.value;
        const amt = p === '1Q' ? quickIncomeContext.metrics.net1Q : quickIncomeContext.metrics.net2Q;
        if (document.getElementById('quick-income-amount')) document.getElementById('quick-income-amount').value = formatNumberInput(amt);
        if (document.getElementById('quick-income-desc')) document.getElementById('quick-income-desc').value = `💼 Pago Nómina (${p})`;
    }
    updateQuickIncomePreviews();
});

['quick-income-month', 'quick-income-amount', 'quick-income-cesantias-mode', 'quick-income-fund-select'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateQuickIncomePreviews);
    document.getElementById(id)?.addEventListener('change', updateQuickIncomePreviews);
});

document.getElementById('close-quick-income-btn')?.addEventListener('click', () => {
    hasUnsavedChanges = false;
    document.getElementById('quick-income-modal')?.classList.add('hidden');
});

document.getElementById('quick-income-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseMoneyInput(document.getElementById('quick-income-amount').value);
    const description = document.getElementById('quick-income-desc').value.trim();
    const categoryName = document.getElementById('quick-income-category').value || '💼 Salario / Nómina';
    const benefitType = document.getElementById('quick-income-benefit-type').value || '';
    const cesMode = document.getElementById('quick-income-cesantias-mode')?.value || 'fund';
    const monthVal = document.getElementById('quick-income-month')?.value || getMonthId(currentDate);
    const periodVal = document.getElementById('quick-income-period')?.value || 'M';

    if (amount <= 0) {
        alert("El monto debe ser mayor a $0.");
        return;
    }

    // Opción 1: Consignar Cesantías al Fondo (Ahorro acumulado año a año, sin inflar liquidez)
    if (benefitType === 'cesantias' && cesMode === 'fund') {
        const fundSelVal = document.getElementById('quick-income-fund-select')?.value || 'new';
        let targetPocket = null;

        if (fundSelVal === 'new') {
            const entityName = document.getElementById('quick-income-fund-entity')?.value.trim() || '';
            targetPocket = {
                id: 'Pocket_Cesantias_' + Date.now(),
                name: 'Fondo de Cesantías',
                entity: entityName,
                goal: 0,
                startDate: currentDate.toLocaleDateString('en-CA'),
                targetDate: '',
                customQuota: 0,
                principal: amount,
                yields: 0,
                isCesantiasFund: true
            };
            financeData.pockets.push(targetPocket);
        } else {
            targetPocket = financeData.pockets.find(x => String(x.id) === String(fundSelVal));
            if (!targetPocket) return;
            targetPocket.isCesantiasFund = true;
            adjustPocketBalance(targetPocket.id, amount);
        }

        localStorage.setItem('myFinances', JSON.stringify(financeData));
        hasUnsavedChanges = false;
        document.getElementById('quick-income-modal')?.classList.add('hidden');
        renderPocketsView();
        renderAccountSelects();
        renderSalaryUI(false);
        updateDashboard();

        const newTotal = round2((targetPocket.principal || 0) + (targetPocket.yields || 0));
        alert(`🏦 Cesantías por ${formatMoney(amount)} consignadas en ${targetPocket.name}${targetPocket.entity ? ` (${targetPocket.entity})` : ''}.\n\nSaldo acumulado total: ${formatMoney(newTotal)}`);
        return;
    }

    // Opción 2: Abono a cuenta de liquidez en el Mes / Quincena seleccionado
    const accountId = document.getElementById('quick-income-account').value;
    if (!accountId) {
        alert("Selecciona una cuenta de destino.");
        return;
    }

    if (!financeData.categories.income.some(c => c.name === categoryName)) {
        financeData.categories.income.push({ name: categoryName, subcategories: [] });
    }

    const [yStr, mStr] = monthVal.split('-');
    const year = parseInt(yStr, 10);
    const monthIdx = parseInt(mStr, 10) - 1;
    const maxMonthDay = new Date(year, monthIdx + 1, 0).getDate();
    const targetDay = periodVal === '1Q' ? 15 : Math.min(30, maxMonthDay);

    const now = new Date();
    const txDateObj = new Date(year, monthIdx, targetDay, now.getHours(), now.getMinutes(), now.getSeconds());
    const isFutureMonth = monthVal > getMonthId(currentDate);
    const periodTag = periodVal === '1Q' ? ' (1Q)' : (periodVal === '2Q' ? ' (2Q)' : '');
    const finalDesc = description.includes('(1Q)') || description.includes('(2Q)') ? description : `${description}${periodTag}`;

    const newTx = {
        id: txDateObj.getTime() + Math.floor(Math.random() * 500),
        monthId: monthVal,
        type: 'income',
        status: isFutureMonth ? 'pending' : 'closed',
        account: accountId,
        category: categoryName,
        subcategory: 'General',
        description: finalDesc,
        amount,
        budgetedAmount: amount,
        date: `${txDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${txDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
        isAdjustment: false
    };

    if (benefitType) newTx.benefitType = benefitType;
    if (benefitType === 'vacaciones') {
        const salCfg = JSON.parse(localStorage.getItem('myFinancesSalary') || '{}');
        const dailyBasic = (salCfg.basicSalary || 0) / 30;
        if (dailyBasic > 0) {
            const compDays = round2(amount / dailyBasic);
            salCfg.vacDaysCompensated = round2((salCfg.vacDaysCompensated || 0) + compDays);
            localStorage.setItem('myFinancesSalary', JSON.stringify(salCfg));
        }
    }

    const shouldApplyLibranza = !!quickIncomeContext?.isPayroll && (document.getElementById('quick-income-apply-libranza')?.checked !== false);
    let appliedLibranzas = [];

    if (shouldApplyLibranza) {
        if (isFutureMonth) {
            newTx.pendingLibranzas = true;
            newTx.payrollPeriod = periodVal;
            newTx.isBiweeklyPayroll = !!quickIncomeContext?.isBiweeklyPayroll;
        } else {
            appliedLibranzas = applyPayrollLibranzas(monthVal, periodVal, txDateObj, !!quickIncomeContext?.isBiweeklyPayroll);
            if (appliedLibranzas.length > 0) {
                newTx.linkedLibranzas = appliedLibranzas.map(l => ({
                    txId: l.txId,
                    intTxId: l.intTxId,
                    debtId: l.debtId,
                    targetTxId: l.targetTxId,
                    pocketId: l.pocketId,
                    pocketAmt: l.pocketAmt,
                    quoteStep: l.quoteStep
                }));
            }
        }
    }

    financeData.transactions.push(newTx);
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    document.getElementById('quick-income-modal')?.classList.add('hidden');
    renderSalaryUI(false);
    renderPocketsView();
    updateDashboard();

    const statusMsg = isFutureMonth ? ' (programado para ese periodo)' : '';
    let libranzaMsg = '';
    if (appliedLibranzas.length > 0) {
        const details = appliedLibranzas.map(l => l.pocketId
            ? `• Ahorro ${stripLeadingEmoji(l.name)}: +${formatMoney(l.pocketAmt)} (${l.quoteLabel})`
            : `• Libranza ${stripLeadingEmoji(l.name)}: -${formatMoney(l.principal)} a capital (Cuota ${l.quoteLabel})`
        ).join('\n');
        libranzaMsg = `\n\nDescuentos aplicados automáticamente:\n${details}`;
    }
    alert(`✓ Ingreso de ${formatMoney(amount)} registrado en ${stripLeadingEmoji(getAccountObj(accountId).name)} para ${monthVal}${periodTag}${statusMsg}.${libranzaMsg}`);
});

const renderBonusSimulator = () => {
    const resultsBox = document.getElementById('sim-bonus-results');
    if (!resultsBox) return;
    const bonusAmt = parseMoneyInput(document.getElementById('sim-bonus-amount')?.value);
    const bonusType = document.getElementById('sim-bonus-type')?.value || 'non_salary';
    if (bonusAmt <= 0) {
        resultsBox.classList.add('hidden');
        resultsBox.innerHTML = '';
        return;
    }
    const salaryStr = localStorage.getItem('myFinancesSalary');
    const config = salaryStr ? JSON.parse(salaryStr) : {
        basicSalary: parseMoneyInput(document.getElementById('profile-basic-salary')?.value),
        nonSalary: parseMoneyInput(document.getElementById('profile-non-salary')?.value),
        transportAuto: document.getElementById('profile-transport-auto')?.checked !== false,
        retProc: document.getElementById('profile-retefuente-proc')?.value || '1',
        retPct: parseMoneyInput(document.getElementById('profile-retefuente-pct')?.value) || 0,
        dedPrepaid: parseMoneyInput(document.getElementById('profile-ded-prepaid')?.value) || 0,
        dedHousing: parseMoneyInput(document.getElementById('profile-ded-housing')?.value) || 0,
        dedVoluntary: parseMoneyInput(document.getElementById('profile-ded-voluntary')?.value) || 0,
        dedDependents: !!document.getElementById('profile-ded-dependents')?.checked
    };
    const sim = simulateExtraBonus(config, bonusAmt, bonusType);
    let alertsHtml = '';
    if (sim.triggeredLey1393) alertsHtml += `<div style="font-size:10.5px; color:#d97706; margin-top:6px;">⚠️ <b>Ley 1393:</b> ${formatMoney(sim.deltaExcessLey1393)} suma a tu IBC.</div>`;
    if (sim.crossedFsp) alertsHtml += `<div style="font-size:10.5px; color:#d97706; margin-top:4px;">⚠️ <b>Umbral FSP:</b> El bono activa aporte Solidaridad.</div>`;
    resultsBox.classList.remove('hidden');
    resultsBox.innerHTML = `<div class="glass-sub-box" style="font-size:11px;"><div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Bono Bruto:</span><b>${formatMoney(sim.bonus)}</b></div><div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>(-) Salud/Pens/FSP:</span><span class="negative">-${formatMoney(sim.deltaSS)}</span></div><div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>(-) Retefuente:</span><span class="negative">-${formatMoney(sim.deltaRet)}</span></div><div style="display:flex; justify-content:space-between; align-items:center; padding-top:6px; border-top:1px dashed rgba(148,163,184,0.35);"><div><span style="display:block; font-size:10px; color:var(--text-muted);">Neto (Desc. ${String(sim.effectiveTaxRate).replace('.', ',')}%)</span><strong class="positive" style="font-size:15px;">${formatMoney(sim.netBonus)}</strong></div><button type="button" id="btn-reg-simulated-bonus" class="btn-confirm-pending" style="margin-top:0;">+ Registrar</button></div>${alertsHtml}</div>`;
    document.getElementById('btn-reg-simulated-bonus')?.addEventListener('click', () => {
        openQuickIncomeModal({
            title: 'Registrar Bonificación',
            subtitle: `Neto tras deducciones`,
            category: '💼 Salario / Nómina',
            description: bonusType === 'salary' ? '🎯 Bonificación Salarial' : '🎯 Bonificación Ocasional',
            amount: sim.netBonus
        });
    });
};
document.getElementById('sim-bonus-amount')?.addEventListener('input', renderBonusSimulator);
document.getElementById('sim-bonus-type')?.addEventListener('change', renderBonusSimulator);

const toggleBiweeklyModeVisibility = () => { const freq = document.getElementById('profile-pay-frequency')?.value || 'monthly', biweeklyGroup = document.getElementById('biweekly-ret-mode-group'); if (!biweeklyGroup) return; if (freq === 'biweekly') biweeklyGroup.classList.remove('hidden'); else biweeklyGroup.classList.add('hidden'); };
document.getElementById('profile-pay-frequency')?.addEventListener('change', toggleBiweeklyModeVisibility);

const renderSalaryUI = (shouldSyncBudget = false) => {
    const salaryStr = localStorage.getItem('myFinancesSalary'); if (!salaryStr) return;
    const config = JSON.parse(salaryStr);
    if (document.getElementById('profile-basic-salary')) document.getElementById('profile-basic-salary').value = config.basicSalary ? formatNumberInput(config.basicSalary) : '';
    if (document.getElementById('profile-non-salary')) document.getElementById('profile-non-salary').value = config.nonSalary ? formatNumberInput(config.nonSalary) : '';
    if (document.getElementById('profile-transport-auto')) document.getElementById('profile-transport-auto').checked = config.transportAuto !== false;
    if (document.getElementById('profile-transport-pay-net')) document.getElementById('profile-transport-pay-net').checked = config.transportPayNet !== false;
    if (document.getElementById('profile-transport-in-benefits')) document.getElementById('profile-transport-in-benefits').checked = config.transportInBenefits !== false;
    if (document.getElementById('profile-ded-prepaid')) document.getElementById('profile-ded-prepaid').value = config.dedPrepaid ? formatNumberInput(config.dedPrepaid) : '';
    if (document.getElementById('profile-ded-housing')) document.getElementById('profile-ded-housing').value = config.dedHousing ? formatNumberInput(config.dedHousing) : '';
    if (document.getElementById('profile-ded-voluntary')) document.getElementById('profile-ded-voluntary').value = config.dedVoluntary ? formatNumberInput(config.dedVoluntary) : '';
    if (document.getElementById('profile-ded-dependents')) document.getElementById('profile-ded-dependents').checked = !!config.dedDependents;
    if (document.getElementById('profile-vac-days-taken')) document.getElementById('profile-vac-days-taken').value = config.vacDaysTaken || 0;
    if (document.getElementById('profile-vac-days-comp')) document.getElementById('profile-vac-days-comp').value = config.vacDaysCompensated || 0;
    const activeProc = config.retProc !== undefined ? String(config.retProc) : '1';
    if (document.getElementById('profile-retefuente-proc')) { document.getElementById('profile-retefuente-proc').value = activeProc; if (activeProc === '2') { document.getElementById('proc2-pct-group')?.classList.remove('hidden'); if (document.getElementById('profile-retefuente-pct')) document.getElementById('profile-retefuente-pct').value = config.retPct ? formatNumberInput(config.retPct) : ''; } else { document.getElementById('proc2-pct-group')?.classList.add('hidden'); } }
    if (config.startDate && document.getElementById('profile-start-date')) document.getElementById('profile-start-date').value = config.startDate;
    if (document.getElementById('profile-pay-frequency')) document.getElementById('profile-pay-frequency').value = config.frequency;
    if (document.getElementById('profile-pay-day')) document.getElementById('profile-pay-day').value = config.payDay;
    if (document.getElementById('profile-biweekly-ret-mode')) document.getElementById('profile-biweekly-ret-mode').value = config.biweeklyRetMode || 'prorated';
    if (document.getElementById('profile-sync-budget')) document.getElementById('profile-sync-budget').checked = config.syncBudget !== false;
    toggleBiweeklyModeVisibility();

    const effectiveVacationConfig = {
        ...config,
        vacDaysTaken: round2((config.vacDaysTaken || 0) + (config.vacDaysCompensated || 0))
    };
    const metrics = calculateLaborMetrics(effectiveVacationConfig, currentDate), tabMonthly = document.getElementById('salary-tab-monthly');
    if (tabMonthly) {
        const retSubLabel = metrics.retProc === '0' ? 'Retefuente (Exenta)' : `Retefuente (${String(metrics.numeroUVT).replace('.', ',')} UVT)`;
        const ley1393AlertHtml = metrics.excessNonSalary > 0 ? `<div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:8px 10px; margin-top:8px; font-size:11px; color:#d97706;">⚠️ <b>Ley 1393 (${metrics.params.nonSalaryCapPct}%):</b> Tus bonos exceden el tope en <b>${formatMoney(metrics.excessNonSalary)}</b>, tu IBC sube a <b>${formatMoney(metrics.ibc)}</b>.</div>` : '';
        const isBiweekly = config.frequency === 'biweekly';
        const biweeklyBreakdownHtml = isBiweekly ? `<div class="glass-sub-box" style="margin-top:10px; border-color:rgba(139,92,246,0.3);"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><span style="font-size:11.5px; font-weight:700; color:var(--accent);">🗓️ Distribución Quincenal</span><span class="widget-badge" style="font-size:9.5px;">${metrics.biweeklyRetMode === 'second_half' ? 'Ret. en 2Q' : '50% / 50%'}</span></div><div class="debt-metrics-grid" style="margin-bottom:0;"><div class="debt-metric-cell"><small>1ra Quincena (1Q)</small><strong class="positive">${formatMoney(metrics.net1Q)}</strong><small style="font-size:9.5px; margin-top:2px;">Retefuente: ${formatMoney(metrics.ret1Q)}</small></div><div class="debt-metric-cell"><small>2da Quincena (2Q)</small><strong class="positive">${formatMoney(metrics.net2Q)}</strong><small style="font-size:9.5px; margin-top:2px;">Retefuente: ${formatMoney(metrics.ret2Q)}</small></div></div></div>` : '';
        const debtDeductionHtml = metrics.payrollDebtDeductions > 0 ? `<div class="debt-metric-cell"><small>Deudas (Libranza)</small><strong class="negative">${formatMoney(metrics.payrollDebtDeductions)}</strong></div>` : '';
        const savingsDeductionHtml = metrics.payrollSavingsDeductions > 0 ? `<div class="debt-metric-cell"><small>Ahorro (Nómina)</small><strong style="color:var(--accent);">${formatMoney(metrics.payrollSavingsDeductions)}</strong></div>` : '';

        // Buscar anticipos visuales
        const mId = getMonthId(currentDate);
        let advances = 0;
        financeData.transactions.forEach(t => {
            if (t.monthId === mId && t.type === 'income' && t.category === '💼 Salario / Nómina' && t.subcategory === 'Anticipo' && t.status !== 'pending') advances += round2(t.amount);
        });
        
        let advancesHtml = '';
        if (advances > 0) {
            advancesHtml = `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(16,185,129,0.3); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; color:var(--text-muted);">(-) Anticipos este mes:</span>
                <strong class="negative">-${formatMoney(advances)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                <span style="font-size:12px; font-weight:700;">Remanente a recibir:</span>
                <strong class="positive" style="font-size:15px;">${formatMoney(Math.max(0, metrics.net - advances))}</strong>
            </div>`;
        }

        tabMonthly.innerHTML = `<h4 style="font-size:13px; margin-bottom:10px; color:var(--text-muted);">Desglose Mensual (${metrics.params.year})</h4><div class="debt-metrics-grid" style="grid-template-columns: repeat(2, 1fr);"><div class="debt-metric-cell"><small>Salud (4% IBC)</small><strong class="negative">${formatMoney(metrics.health)}</strong></div><div class="debt-metric-cell"><small>Pensión (4% IBC)</small><strong class="negative">${formatMoney(metrics.pension)}</strong></div><div class="debt-metric-cell"><small>FSP</small><strong class="${metrics.fsp > 0 ? 'negative' : ''}">${formatMoney(metrics.fsp)}</strong></div><div class="debt-metric-cell"><small>${retSubLabel}</small><strong class="${metrics.ret > 0 ? 'negative' : ''}">${formatMoney(metrics.ret)}</strong></div><div class="debt-metric-cell"><small>Aux. Transporte</small><strong class="positive">${formatMoney(metrics.effectiveTransport)}</strong></div><div class="debt-metric-cell"><small>No Salarial</small><strong class="positive">${formatMoney(metrics.nonSalary)}</strong></div>${debtDeductionHtml}${savingsDeductionHtml}</div>${ley1393AlertHtml}${biweeklyBreakdownHtml}
        <details class="changelog-accordion" style="margin-top:10px;"><summary style="font-size:11.5px; font-weight:700; color:var(--text-muted); cursor:pointer;"><span>Ver Depuración Retefuente</span><span>▾</span></summary><div style="margin-top:8px; font-size:11px; display:flex; flex-direction:column; gap:4px;"><div style="display:flex; justify-content:space-between;"><span>Ingresos Brutos Laborales:</span><b>${formatMoney(metrics.ingresosBrutos)}</b></div><div style="display:flex; justify-content:space-between;"><span>(-) Salud/Pens/FSP:</span><span class="negative">-${formatMoney(metrics.incrngo)}</span></div><div style="display:flex; justify-content:space-between; border-top:1px dashed rgba(148,163,184,0.3); padding-top:3px;"><span>Renta Líquida:</span><b>${formatMoney(metrics.rentaLiquida)}</b></div><div style="display:flex; justify-content:space-between;"><span>(-) Alivios Art.387 + AFC:</span><span class="positive">-${formatMoney(round2(metrics.totalDeduccionesArt387 + metrics.dedVoluntary))}</span></div><div style="display:flex; justify-content:space-between;"><span>(-) Renta Exenta 25%:</span><span class="positive">-${formatMoney(metrics.exempt25)}</span></div><div style="display:flex; justify-content:space-between;"><span>Beneficios Limitados (Tope 40%):</span><b>-${formatMoney(metrics.beneficiosLimitados)}</b></div><div style="display:flex; justify-content:space-between; border-top:1px solid rgba(148,163,184,0.3); padding-top:4px; color:var(--accent);"><span>Base Gravable (${String(metrics.numeroUVT).replace('.', ',')} UVT):</span><b>${formatMoney(metrics.baseGravable)}</b></div><div style="display:flex; justify-content:space-between;"><span>Retención Mensual (${String(metrics.effectiveRetPct).replace('.', ',')}%):</span><b class="${metrics.ret > 0 ? 'negative' : ''}">${formatMoney(metrics.ret)}</b></div>${metrics.retPrima > 0 ? `<div style="display:flex; justify-content:space-between; color:var(--negative);"><span>Retención Prima Semestral:</span><b>${formatMoney(metrics.retPrima)}</b></div>` : ''}</div></details>
        <div class="tc-summary-banner" style="margin-top:10px; background-color:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.25);"><div><span style="color:var(--text-muted); font-size:11px; display:block;">Salario Neto Base</span><strong id="calc-net-salary" class="positive" style="font-size:18px;">${formatMoney(metrics.net)}</strong></div><div style="text-align:right;"><span id="calc-pay-frequency-label" style="color:var(--text-muted); font-size:11px; display:block; margin-top:8px;">${!isBiweekly ? 'Pago mensual' : (metrics.net1Q === metrics.net2Q ? `Quincenal (${formatCompact(metrics.net1Q)} c/u)` : `1Q: ${formatCompact(metrics.net1Q)} • 2Q: ${formatCompact(metrics.net2Q)}`)}</span></div>${advancesHtml}</div>
        <button type="button" id="btn-quick-register-payroll" class="btn btn-secondary" style="width:100%; margin-top:10px; color:var(--positive); font-weight:700;">+ Registrar Pago de Nómina</button>`;
        
        document.getElementById('btn-quick-register-payroll')?.addEventListener('click', () => {
            if (metrics.net <= 0) { alert("Configura un sueldo básico mayor a $0."); return; }
            openQuickIncomeModal({ title: 'Registrar Pago de Nómina', subtitle: isBiweekly ? 'Selecciona la quincena y cuenta' : 'Abono de salario neto', category: 'Salario / Nómina', description: 'Pago Nómina Mensual', amount: metrics.net, isBiweeklyPayroll: isBiweekly, metrics });
        });
    }

    const primaJunNeta = metrics.halfPrimaJunNeta ?? metrics.halfPrimaNeta;
    const primaDecNeta = metrics.halfPrimaDecNeta ?? metrics.halfPrimaNeta;
    const primaTotalNeta = round2(primaJunNeta + primaDecNeta);
    const annualIntereses = round2(metrics.projCesantiasBase * 0.12);
    if (document.getElementById('proj-prima-total')) document.getElementById('proj-prima-total').innerText = formatMoney(primaTotalNeta);
    if (document.getElementById('proj-prima-junio')) document.getElementById('proj-prima-junio').innerText = formatMoney(primaJunNeta);
    if (document.getElementById('proj-prima-dic')) document.getElementById('proj-prima-dic').innerText = formatMoney(primaDecNeta);
    if (document.getElementById('proj-cesantias')) document.getElementById('proj-cesantias').innerText = formatMoney(metrics.projCesantiasBase);
    if (document.getElementById('proj-intereses')) document.getElementById('proj-intereses').innerText = formatMoney(annualIntereses);
    if (document.getElementById('proj-vacaciones')) document.getElementById('proj-vacaciones').innerText = formatMoney(round2(metrics.basic / 2));
    
    if (document.getElementById('liq-days-year')) document.getElementById('liq-days-year').innerText = `${metrics.daysYear} días`;
    if (document.getElementById('liq-days-semester')) document.getElementById('liq-days-semester').innerText = `${metrics.daysSemester} días`;
    if (document.getElementById('liq-prima')) document.getElementById('liq-prima').innerText = formatMoney(metrics.liqPrima);
    if (document.getElementById('liq-prima-sub')) document.getElementById('liq-prima-sub').innerText = metrics.usedPrimaAverage ? `Base promedio semestral: ${formatMoney(metrics.primaBase)}` : 'Del semestre en curso';
    if (document.getElementById('liq-cesantias')) document.getElementById('liq-cesantias').innerText = formatMoney(metrics.liqCesantias);
    if (document.getElementById('liq-cesantias-sub')) document.getElementById('liq-cesantias-sub').innerText = metrics.usedCesantiasAverage ? `Base promedio anual (Art. 253): ${formatMoney(metrics.cesantiasBase)}` : 'Acumuladas este año';
    if (document.getElementById('liq-intereses')) document.getElementById('liq-intereses').innerText = formatMoney(metrics.liqIntereses);
    if (document.getElementById('liq-vacaciones')) document.getElementById('liq-vacaciones').innerText = formatMoney(metrics.liqVacaciones);
    if (document.getElementById('liq-vac-summary-hint')) document.getElementById('liq-vac-summary-hint').innerText = `Causados: ${metrics.vacDaysEarned}d • Pendientes: ${metrics.vacDaysPending}d`;
    if (document.getElementById('liq-total')) document.getElementById('liq-total').innerText = formatMoney(round2(metrics.liqPrima + metrics.liqCesantias + metrics.liqIntereses + metrics.liqVacaciones));

    const legalBox = document.getElementById('legal-average-reminder-box');
    const legalContent = document.getElementById('legal-average-reminder-content');
    if (legalBox && legalContent) {
        const hasAnyAverage = metrics.usedPrimaAverage || metrics.usedCesantiasAverage;
        if (hasAnyAverage) legalBox.setAttribute('open', '');
        const currMonthlyBase = round2(metrics.basic + metrics.benefitsTransport);
        const retroTag = metrics.isRetroApplied ? ' con retroactivo' : '';

        const primaFormula = (metrics.semWeighted?.usedAverage && metrics.oldMonthlyBase > 0)
            ? `Base = ((${formatMoney(metrics.oldMonthlyBase)} × ${metrics.semWeighted.oldDays}d) + (${formatMoney(currMonthlyBase)} × ${metrics.semWeighted.newDays}d)) ÷ ${metrics.daysSemester}d = <b style="color:var(--text-main);">${formatMoney(metrics.primaBase)}</b><br>Prima = (${formatMoney(metrics.primaBase)} × ${metrics.daysSemester}d) ÷ 360 = <b class="positive">${formatMoney(metrics.liqPrima)}</b>`
            : `Base vigente = <b style="color:var(--text-main);">${formatMoney(metrics.primaBase)}</b><br>Prima = (${formatMoney(metrics.primaBase)} × ${metrics.daysSemester}d) ÷ 360 = <b class="positive">${formatMoney(metrics.liqPrima)}</b>`;

        const cesFormula = (metrics.yearWeighted?.usedAverage && metrics.oldMonthlyBase > 0)
            ? `Base = ((${formatMoney(metrics.oldMonthlyBase)} × ${metrics.yearWeighted.oldDays}d) + (${formatMoney(currMonthlyBase)} × ${metrics.yearWeighted.newDays}d)) ÷ ${metrics.daysYear}d = <b style="color:var(--text-main);">${formatMoney(metrics.cesantiasBase)}</b><br>Cesantías = (${formatMoney(metrics.cesantiasBase)} × ${metrics.daysYear}d) ÷ 360 = <b class="positive">${formatMoney(metrics.liqCesantias)}</b>`
            : `Base vigente = <b style="color:var(--text-main);">${formatMoney(metrics.cesantiasBase)}</b><br>Cesantías = (${formatMoney(metrics.cesantiasBase)} × ${metrics.daysYear}d) ÷ 360 = <b class="positive">${formatMoney(metrics.liqCesantias)}</b>`;

        const intFormula = `Intereses = (${formatMoney(metrics.liqCesantias)} × ${metrics.daysYear}d × 12%) ÷ 360 = <b class="positive">${formatMoney(metrics.liqIntereses)}</b>`;
        const vacFormula = `Vacaciones = (${formatMoney(metrics.basic)} × ${metrics.vacDaysPending}d) ÷ 30 = <b class="positive">${formatMoney(metrics.liqVacaciones)}</b>`;

        legalContent.innerHTML = `
            <div style="padding:8px 10px; margin-bottom:8px; border-radius:10px; background:var(--card-bg); border:1px solid var(--border-color);">
                <strong style="display:block; color:var(--text-main); font-size:11px; margin-bottom:3px;">1. Prima de Servicios (Art. 306 CST · Semestre${retroTag})</strong>
                <span style="display:block; font-size:10.5px; line-height:1.45;">${primaFormula}</span>
                <small style="display:block; margin-top:3px; font-size:10px; color:var(--accent);">Proyección cierre Dic. (180d): Base ${formatMoney(metrics.projPrimaDecBase)}</small>
            </div>
            <div style="padding:8px 10px; margin-bottom:8px; border-radius:10px; background:var(--card-bg); border:1px solid var(--border-color);">
                <strong style="display:block; color:var(--text-main); font-size:11px; margin-bottom:3px;">2. Cesantías e Intereses (Art. 253 CST · Variación &lt; 3 meses)</strong>
                <span style="display:block; font-size:10.5px; line-height:1.45;">${cesFormula}<br>${intFormula}</span>
                <small style="display:block; margin-top:3px; font-size:10px; color:var(--accent);">Proyección cierre Año (360d): Base ${formatMoney(metrics.projCesantiasBase)}</small>
            </div>
            <div style="padding:8px 10px; border-radius:10px; background:var(--card-bg); border:1px solid var(--border-color);">
                <strong style="display:block; color:var(--text-main); font-size:11px; margin-bottom:3px;">3. Vacaciones (Art. 192 CST · Último salario sin promediar)</strong>
                <span style="display:block; font-size:10.5px; line-height:1.45;">${vacFormula}</span>
            </div>
        `;
    }
    
    document.getElementById('salary-results-box')?.classList.remove('hidden');

    const bindBenefitBtn = (btnId, opts) => { const btn = document.getElementById(btnId); if (!btn) return; btn.onclick = () => { if (opts.amount <= 0) { alert("El saldo disponible para esta prestación es $0."); return; } openQuickIncomeModal(opts); }; };
    bindBenefitBtn('btn-reg-prima-junio', { title: 'Registrar Prima Junio', subtitle: 'Prima 1er semestre', category: 'Prima de Servicios', benefitType: 'prima', description: `Prima (Junio ${metrics.currentYear})`, amount: primaJunNeta, defaultMonth: `${metrics.currentYear}-06`, defaultPeriod: config.frequency === 'biweekly' ? '2Q' : 'M' });
    bindBenefitBtn('btn-reg-prima-dic', { title: 'Registrar Prima Diciembre', subtitle: 'Prima 2do semestre', category: 'Prima de Servicios', benefitType: 'prima', description: `Prima (Dic ${metrics.currentYear})`, amount: primaDecNeta, defaultMonth: `${metrics.currentYear}-12`, defaultPeriod: config.frequency === 'biweekly' ? '1Q' : 'M' });
    bindBenefitBtn('btn-reg-proj-cesantias', { title: 'Consignar Cesantías Anuales', subtitle: `Año ${metrics.currentYear} • Fondo de Cesantías`, category: 'Cesantías e Intereses', benefitType: 'cesantias', description: `Cesantías Anuales (${metrics.currentYear})`, amount: metrics.projCesantiasBase, defaultCesantiasMode: 'fund' });
    bindBenefitBtn('btn-reg-proj-intereses', { title: 'Registrar Int. de Cesantías', subtitle: 'Pago anual directo', category: 'Cesantías e Intereses', benefitType: 'intereses_cesantias', description: `Intereses sobre Cesantías (${metrics.currentYear})`, amount: annualIntereses, defaultMonth: `${metrics.currentYear}-01`, defaultPeriod: config.frequency === 'biweekly' ? '2Q' : 'M' });
    bindBenefitBtn('btn-reg-liq-prima', { title: 'Prima Proporcional', subtitle: `Causada a hoy (${metrics.daysSemester}d)`, category: 'Prima de Servicios', benefitType: 'prima', description: `Prima Prop. (${metrics.daysSemester}d)`, amount: metrics.liqPrima });
    bindBenefitBtn('btn-reg-liq-cesantias', { title: 'Cesantías Proporcionales', subtitle: `Causadas a hoy (${metrics.daysYear}d)`, category: 'Cesantías e Intereses', benefitType: 'cesantias', description: `Cesantías Prop. (${metrics.daysYear}d)`, amount: metrics.liqCesantias, defaultCesantiasMode: 'fund' });
    bindBenefitBtn('btn-reg-liq-intereses', { title: 'Int. Cesantías Prop.', subtitle: `Causados a hoy (${metrics.daysYear}d)`, category: 'Cesantías e Intereses', benefitType: 'intereses_cesantias', description: `Intereses Prop. (${metrics.daysYear}d)`, amount: metrics.liqIntereses });
    bindBenefitBtn('btn-reg-liq-vacaciones', { title: 'Vacaciones Compensadas', subtitle: `Pendientes a hoy (${metrics.vacDaysPending}d)`, category: 'Vacaciones', benefitType: 'vacaciones', description: `Vacaciones Compensadas (${metrics.vacDaysPending}d)`, amount: metrics.liqVacaciones });
    renderBonusSimulator();

    // Inicializar meses por defecto en el formulario de aumento
    const defaultMonthStr = getMonthId(currentDate);
    if (document.getElementById('raise-effective-month') && !document.getElementById('raise-effective-month').value) {
        document.getElementById('raise-effective-month').value = defaultMonthStr;
    }
    if (document.getElementById('raise-retro-from-month') && !document.getElementById('raise-retro-from-month').value) {
        document.getElementById('raise-retro-from-month').value = defaultMonthStr;
    }
    if (document.getElementById('raise-retro-pay-month') && !document.getElementById('raise-retro-pay-month').value) {
        document.getElementById('raise-retro-pay-month').value = defaultMonthStr;
    }

    // Mostrar etiqueta del último aumento si existe
    const raiseBanner = document.getElementById('last-raise-banner');
    const raiseText = document.getElementById('last-raise-text');
    const raiseSubtext = document.getElementById('last-raise-subtext');
    if (raiseBanner && raiseText) {
        if (config.lastRaise && config.lastRaise.diff > 0) {
            raiseBanner.classList.remove('hidden');
            raiseBanner.style.display = 'block';
            raiseText.innerText = `+${formatMoney(config.lastRaise.diff)} (+${String(config.lastRaise.pct).replace('.', ',')}%)`;
            if (raiseSubtext) {
                const effLabel = config.lastRaise.effectiveMonth ? `Aplica desde ${config.lastRaise.effectiveMonth}${config.lastRaise.effectivePeriod && config.lastRaise.effectivePeriod !== 'M' ? ` (${config.lastRaise.effectivePeriod})` : ''}` : config.lastRaise.date;
                const retroLabel = (config.lastRaise.isRetro && config.lastRaise.retroNetAmount > 0) ? ` • Retroactivo: +${formatMoney(config.lastRaise.retroNetAmount)} en ${config.lastRaise.retroPayMonth}` : '';
                raiseSubtext.innerText = `${effLabel}${retroLabel}`;
            }
        } else {
            raiseBanner.classList.add('hidden');
            raiseBanner.style.display = 'none';
        }
    }

    if (shouldSyncBudget && config.syncBudget !== false) {
        const currM = currentDate.getMonth();
        const sched = config.raiseSchedule || null;

        let effYear = currentDate.getFullYear();
        let effMonthIdx = currM;
        let effPeriod = 'M';

        if (sched && sched.effectiveMonth && sched.effectiveMonth.includes('-')) {
            const [ey, em] = sched.effectiveMonth.split('-').map(Number);
            effYear = ey;
            effMonthIdx = em - 1;
            effPeriod = sched.effectivePeriod || 'M';
        }

        // 1. Sincronización inteligente de Salario respetando mes/quincena de vigencia
        const salCatName = '💼 Salario / Nómina';
        if (!financeData.categories.income.some(c => c.name === salCatName)) financeData.categories.income.unshift({ name: salCatName, subcategories: [] });
        
        const oldSalCfg = financeData.categoryBudgets[salCatName];
        const salaryMonths = (oldSalCfg && oldSalCfg.isMonthly && oldSalCfg.months) ? [...oldSalCfg.months] : Array(12).fill(oldSalCfg ? (oldSalCfg.general || 0) : 0);
        
        for (let m = 0; m < 12; m++) {
            if (metrics.currentYear > effYear || (metrics.currentYear === effYear && m > effMonthIdx)) {
                salaryMonths[m] = metrics.net;
            } else if (metrics.currentYear === effYear && m === effMonthIdx) {
                if (effPeriod === '2Q' && sched && sched.oldNet1Q > 0) {
                    salaryMonths[m] = round2(sched.oldNet1Q + metrics.net2Q);
                } else {
                    salaryMonths[m] = metrics.net;
                }
            }
            if (metrics.startObj.getFullYear() === metrics.currentYear && m < metrics.startObj.getMonth()) {
                salaryMonths[m] = 0;
            }
        }

        // Si hay retroactivo en este año, sumarlo al presupuesto del mes en que se paga
        if (sched && sched.isRetro && sched.retroNetAmount > 0 && sched.retroPayMonth) {
            const [rpy, rpm] = sched.retroPayMonth.split('-').map(Number);
            if (rpy === metrics.currentYear && rpm >= 1 && rpm <= 12) {
                salaryMonths[rpm - 1] = round2(salaryMonths[rpm - 1] + sched.retroNetAmount);
            }
        }

        financeData.categoryBudgets[salCatName] = { isMonthly: true, general: metrics.net, months: salaryMonths };

        // 2. Sincronización inteligente de Primas
        const primaCatName = '🎁 Prima de Servicios';
        if (!financeData.categories.income.some(c => c.name === primaCatName)) financeData.categories.income.splice(1, 0, { name: primaCatName, subcategories: [] });
        
        const oldPrimaCfg = financeData.categoryBudgets[primaCatName];
        const primaMonths = (oldPrimaCfg && oldPrimaCfg.isMonthly && oldPrimaCfg.months) ? [...oldPrimaCfg.months] : Array(12).fill(0);
        const junEnd = new Date(metrics.currentYear, 5, 30), decEnd = new Date(metrics.currentYear, 11, 30);
        
        if (5 >= currM) {
            if (metrics.startObj <= junEnd) { 
                const jan1 = new Date(metrics.currentYear, 0, 1);
                const propRatio = Math.min(180, calcCommercialDays(metrics.startObj > jan1 ? metrics.startObj : jan1, junEnd)) / 180; 
                primaMonths[5] = round2(metrics.halfPrimaNeta * propRatio); 
            } else { primaMonths[5] = 0; }
        }
        
        if (11 >= currM) {
            if (metrics.startObj <= decEnd) { 
                const jul1 = new Date(metrics.currentYear, 6, 1);
                const propRatio = Math.min(180, calcCommercialDays(metrics.startObj > jul1 ? metrics.startObj : jul1, decEnd)) / 180; 
                primaMonths[11] = round2(metrics.halfPrimaNeta * propRatio); 
            } else { primaMonths[11] = 0; }
        }
        
        financeData.categoryBudgets[primaCatName] = { isMonthly: true, general: 0, months: primaMonths };
        localStorage.setItem('myFinances', JSON.stringify(financeData)); 
        renderCategoryOptions(document.getElementById('type')?.value || 'expense');
    }
};

document.getElementById('profile-vac-days-taken')?.addEventListener('input', (e) => {
    const config = JSON.parse(localStorage.getItem('myFinancesSalary') || '{}');
    config.vacDaysTaken = parseFloat(e.target.value) || 0;
    localStorage.setItem('myFinancesSalary', JSON.stringify(config));
    renderSalaryUI(false);
});

document.getElementById('profile-vac-days-comp')?.addEventListener('input', (e) => {
    const config = JSON.parse(localStorage.getItem('myFinancesSalary') || '{}');
    config.vacDaysCompensated = parseFloat(e.target.value) || 0;
    localStorage.setItem('myFinancesSalary', JSON.stringify(config));
    renderSalaryUI(false);
});

// --- LÓGICA DE AUMENTO DE SUELDO CON VIGENCIA Y RETROACTIVO ---
let isSyncingRaise = false;

const parseCleanCOP = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return round2(val);
    const clean = String(val).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    return round2(parseFloat(clean) || 0);
};

const computeRaiseSimulation = (newBasic) => {
    const prevConfig = JSON.parse(localStorage.getItem('myFinancesSalary') || '{}');
    const formBasic = parseCleanCOP(document.getElementById('profile-basic-salary')?.value);
    const currentBasic = (formBasic === newBasic && prevConfig.lastRaise?.oldBasic > 0)
        ? round2(prevConfig.lastRaise.oldBasic)
        : formBasic;

    return computeSalaryRaiseSimulation({
        currentBasic,
        newBasic,
        baseSalaryConfig: prevConfig,
        effMonth: document.getElementById('raise-effective-month')?.value,
        effPeriod: document.getElementById('raise-effective-period')?.value || 'M',
        isRetro: !!document.getElementById('raise-is-retro')?.checked,
        retroFromMonth: document.getElementById('raise-retro-from-month')?.value,
        retroFromPeriod: document.getElementById('raise-retro-from-period')?.value || 'M',
        retroPayMonth: document.getElementById('raise-retro-pay-month')?.value,
        retroPayPeriod: document.getElementById('raise-retro-pay-period')?.value || 'M'
    });
};

const renderSalaryRaisePreview = (newBasic) => {
    const previewBox = document.getElementById('raise-preview-box');
    if (!previewBox) return;

    const sim = computeRaiseSimulation(newBasic);
    if (!sim) {
        previewBox.classList.add('hidden');
        previewBox.innerHTML = '';
        return;
    }

    const isIncrease = sim.diff > 0;
    let retroHtml = '';
    if (sim.isRetro) {
        if (sim.retroHalfMonths > 0 && sim.retroNetAmount > 0) {
            const monthsEq = sim.retroHalfMonths / 2;
            const periodText = `${sim.retroHalfMonths} quincena${sim.retroHalfMonths !== 1 ? 's' : ''} (${String(monthsEq).replace('.', ',')} mes${monthsEq !== 1 ? 'es' : ''})`;
            retroHtml = `
                <div style="display:flex; justify-content:space-between; margin-top:4px; padding-top:4px; border-top:1px dashed rgba(139,92,246,0.35); color:var(--accent);">
                    <span>🎁 Retroactivo (${periodText}):</span>
                    <strong>+${formatMoney(sim.retroNetAmount)}</strong>
                </div>`;
        } else {
            retroHtml = `<div style="margin-top:4px; font-size:10.5px; color:#d97706;">⚠️ La fecha retroactiva debe ser anterior a la fecha en que aplica el aumento.</div>`;
        }
    }

    previewBox.classList.remove('hidden');
    previewBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:var(--text-muted);">Diferencia Bruta:</span>
            <strong class="${isIncrease ? 'positive' : 'negative'}">${isIncrease ? '+' : ''}${formatMoney(sim.diff)} (${isIncrease ? '+' : ''}${String(sim.pct).replace('.', ',')}%)</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:var(--text-muted);">Nuevo Neto Mensual:</span>
            <strong style="color:var(--text-main);">${formatMoney(sim.newMetrics.net)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding-top:4px; border-top:1px dashed rgba(148,163,184,0.35);">
            <span style="color:var(--text-muted);">Aumento Real en Bolsillo:</span>
            <strong class="${sim.netDiff >= 0 ? 'positive' : 'negative'}">${sim.netDiff >= 0 ? '+' : ''}${formatMoney(sim.netDiff)}/mes</strong>
        </div>
        ${retroHtml}
    `;
};

document.getElementById('raise-is-retro')?.addEventListener('change', (e) => {
    const fields = document.getElementById('raise-retro-fields');
    if (e.target.checked) fields?.classList.remove('hidden');
    else fields?.classList.add('hidden');
    renderSalaryRaisePreview(parseCleanCOP(document.getElementById('raise-new-salary-input')?.value));
});

document.getElementById('raise-effective-month')?.addEventListener('change', (e) => {
    const payMonthEl = document.getElementById('raise-retro-pay-month');
    if (payMonthEl && e.target.value) payMonthEl.value = e.target.value;
    renderSalaryRaisePreview(parseCleanCOP(document.getElementById('raise-new-salary-input')?.value));
});

['raise-effective-period', 'raise-retro-from-month', 'raise-retro-from-period', 'raise-retro-pay-month', 'raise-retro-pay-period'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
        renderSalaryRaisePreview(parseCleanCOP(document.getElementById('raise-new-salary-input')?.value));
    });
});

// 1. Cuando escribes directo el Nuevo Sueldo Básico ($), calcula el % automáticamente
document.getElementById('raise-new-salary-input')?.addEventListener('input', (e) => {
    if (isSyncingRaise) return;
    isSyncingRaise = true;
    const currentBasic = parseCleanCOP(document.getElementById('profile-basic-salary')?.value);
    const newBasic = parseCleanCOP(e.target.value);
    const pctInput = document.getElementById('raise-pct-input');

    if (currentBasic > 0 && newBasic > 0) {
        const pct = round2(((newBasic - currentBasic) / currentBasic) * 100);
        if (pctInput) pctInput.value = pct !== 0 ? String(pct).replace('.', ',') : '';
        renderSalaryRaisePreview(newBasic);
    } else {
        if (pctInput) pctInput.value = '';
        renderSalaryRaisePreview(0);
    }
    isSyncingRaise = false;
});

// 2. Opcional: Si solo sabes el %, lo escribes y te calcula el Nuevo Sueldo Básico ($)
document.getElementById('raise-pct-input')?.addEventListener('input', (e) => {
    if (isSyncingRaise) return;
    isSyncingRaise = true;
    const currentBasic = parseCleanCOP(document.getElementById('profile-basic-salary')?.value);
    const pct = parseCleanCOP(e.target.value);
    const newSalInput = document.getElementById('raise-new-salary-input');

    if (currentBasic > 0 && pct !== 0) {
        const newBasic = round2(currentBasic * (1 + pct / 100));
        if (newSalInput) newSalInput.value = formatNumberInput(newBasic);
        renderSalaryRaisePreview(newBasic);
    } else {
        if (newSalInput) newSalInput.value = '';
        renderSalaryRaisePreview(0);
    }
    isSyncingRaise = false;
});

const buildSalaryConfigFromForm = (prevConfig = {}, customRaiseSchedule = null) => {
    const newBasic = parseCleanCOP(document.getElementById('profile-basic-salary').value);
    const oldBasic = round2(prevConfig.basicSalary || 0);
    let lastRaise = prevConfig.lastRaise || null;
    const raiseSchedule = customRaiseSchedule || prevConfig.raiseSchedule || null;

    if (oldBasic > 0 && newBasic > oldBasic) {
        const diff = round2(newBasic - oldBasic);
        const pct = round2((diff / oldBasic) * 100);
        lastRaise = {
            date: currentDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
            oldBasic,
            newBasic,
            diff,
            pct,
            effectiveMonth: raiseSchedule?.effectiveMonth || getMonthId(currentDate),
            effectivePeriod: raiseSchedule?.effectivePeriod || 'M',
            isRetro: !!raiseSchedule?.isRetro,
            retroFromMonth: raiseSchedule?.retroFromMonth || '',
            retroFromPeriod: raiseSchedule?.retroFromPeriod || 'M',
            retroPayMonth: raiseSchedule?.retroPayMonth || '',
            retroNetAmount: raiseSchedule?.retroNetAmount || 0
        };
    }

    return {
        basicSalary: newBasic,
        nonSalary: parseCleanCOP(document.getElementById('profile-non-salary')?.value),
        transportAuto: document.getElementById('profile-transport-auto')?.checked !== false,
        transportPayNet: document.getElementById('profile-transport-pay-net')?.checked !== false,
        transportInBenefits: document.getElementById('profile-transport-in-benefits')?.checked !== false,
        retProc: document.getElementById('profile-retefuente-proc')?.value || '1',
        retPct: parseCleanCOP(document.getElementById('profile-retefuente-pct')?.value),
        dedPrepaid: parseCleanCOP(document.getElementById('profile-ded-prepaid')?.value),
        dedHousing: parseCleanCOP(document.getElementById('profile-ded-housing')?.value),
        dedVoluntary: parseCleanCOP(document.getElementById('profile-ded-voluntary')?.value),
        dedDependents: !!document.getElementById('profile-ded-dependents')?.checked,
        vacDaysTaken: parseFloat(document.getElementById('profile-vac-days-taken')?.value) || 0,
        vacDaysCompensated: parseFloat(document.getElementById('profile-vac-days-comp')?.value) || 0,
        startDate: document.getElementById('profile-start-date').value,
        frequency: document.getElementById('profile-pay-frequency').value,
        payDay: document.getElementById('profile-pay-day').value,
        biweeklyRetMode: document.getElementById('profile-biweekly-ret-mode')?.value || 'prorated',
        syncBudget: document.getElementById('profile-sync-budget')?.checked,
        lastRaise,
        raiseSchedule
    };
};

document.getElementById('btn-apply-salary-raise')?.addEventListener('click', () => {
    const prevConfig = JSON.parse(localStorage.getItem('myFinancesSalary') || '{}');
    const newBasic = parseCleanCOP(document.getElementById('raise-new-salary-input')?.value);
    const sim = computeRaiseSimulation(newBasic);

    if (!sim) {
        alert('Ingresa un Nuevo Sueldo Básico válido.');
        return;
    }

    const raiseSchedule = {
        effectiveMonth: sim.effMonth,
        effectivePeriod: sim.effPeriod,
        oldNet: sim.currentMetrics.net,
        oldNet1Q: sim.currentMetrics.net1Q,
        oldNet2Q: sim.currentMetrics.net2Q,
        isRetro: sim.isRetro,
        retroFromMonth: sim.retroFromMonth,
        retroFromPeriod: sim.retroFromPeriod,
        retroPayMonth: sim.retroPayMonth,
        retroPayPeriod: sim.retroPayPeriod,
        retroNetAmount: sim.retroNetAmount
    };

    // Alimentar el Sueldo Básico principal con el nuevo valor
    document.getElementById('profile-basic-salary').value = formatNumberInput(newBasic);

    // Activar vinculación con presupuesto
    const syncCheck = document.getElementById('profile-sync-budget');
    if (syncCheck) syncCheck.checked = true;

    const config = buildSalaryConfigFromForm({ ...prevConfig, basicSalary: sim.currentBasic }, raiseSchedule);
    localStorage.setItem('myFinancesSalary', JSON.stringify(config));

    // Programar ingreso pendiente del retroactivo en el historial si está marcado
    const createRetroTx = !!document.getElementById('raise-retro-create-tx')?.checked;
    let retroTxCreated = false;
    if (sim.isRetro && sim.retroNetAmount > 0 && createRetroTx) {
        const salCatName = '💼 Salario / Nómina';
        if (!financeData.categories.income.some(c => c.name === salCatName)) {
            financeData.categories.income.unshift({ name: salCatName, subcategories: [] });
        }
        const [py, pm] = sim.retroPayMonth.split('-').map(Number);
        const maxDay = new Date(py, pm, 0).getDate();
        const payDay = sim.retroPayPeriod === '1Q' ? 15 : Math.min(30, maxDay);
        const now = new Date();
        const txDateObj = new Date(py, pm - 1, payDay, now.getHours(), now.getMinutes(), now.getSeconds());
        const periodTag = sim.retroPayPeriod === '1Q' ? ' (1Q)' : (sim.retroPayPeriod === '2Q' ? ' (2Q)' : '');

        financeData.transactions.push({
            id: txDateObj.getTime() + Math.floor(Math.random() * 500),
            monthId: sim.retroPayMonth,
            type: 'income',
            status: 'pending',
            account: getDefaultAccountId(true),
            category: salCatName,
            subcategory: 'General',
            description: `🎁 Retroactivo Aumento Sueldo (${sim.retroFromMonth} a ${sim.effMonth})${periodTag}`,
            amount: sim.retroNetAmount,
            budgetedAmount: sim.retroNetAmount,
            date: `${txDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${txDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
            isAdjustment: false
        });
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        retroTxCreated = true;
    }

    // Limpiar y cerrar panel de aumento
    document.getElementById('raise-pct-input').value = '';
    document.getElementById('raise-new-salary-input').value = '';
    if (document.getElementById('raise-is-retro')) document.getElementById('raise-is-retro').checked = false;
    document.getElementById('raise-retro-fields')?.classList.add('hidden');
    document.getElementById('raise-preview-box')?.classList.add('hidden');
    document.getElementById('salary-raise-accordion')?.removeAttribute('open');

    hasUnsavedChanges = false;
    renderSalaryUI(true);
    updateDashboard();

    let msg = `🎉 ¡Aumento aplicado!\n\n• Nuevo Sueldo: ${formatMoney(newBasic)} (${sim.diff >= 0 ? '+' : ''}${String(sim.pct).replace('.', ',')}%)`;
    msg += `\n• Vigencia: Desde ${sim.effMonth}${sim.effPeriod !== 'M' ? ` (${sim.effPeriod})` : ''}`;
    if (sim.isRetro && sim.retroNetAmount > 0) {
        msg += `\n• Retroactivo: +${formatMoney(sim.retroNetAmount)} aplicado en ${sim.retroPayMonth}${sim.retroPayPeriod !== 'M' ? ` (${sim.retroPayPeriod})` : ''}`;
        if (retroTxCreated) msg += ` (programado como pendiente en tu historial)`;
    }
    alert(msg);
});

document.getElementById('salary-config-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const prevConfig = JSON.parse(localStorage.getItem('myFinancesSalary') || '{}');
    const config = buildSalaryConfigFromForm(prevConfig);
    localStorage.setItem('myFinancesSalary', JSON.stringify(config));
    hasUnsavedChanges = false;
    renderSalaryUI(true);
    updateDashboard();
    if (config.syncBudget) alert("✅ Salario calculado y actualizado en tu Presupuesto.");
});

const switchSalaryTab = (tabName) => { ['monthly', 'annual', 'liquidation'].forEach(t => { const btn = document.getElementById(`tab-btn-salary-${t}`), panel = document.getElementById(`salary-tab-${t}`); if (t === tabName) { btn?.classList.add('active'); panel?.classList.remove('hidden'); } else { btn?.classList.remove('active'); panel?.classList.add('hidden'); } }); };
document.getElementById('tab-btn-salary-monthly')?.addEventListener('click', () => switchSalaryTab('monthly'));
document.getElementById('tab-btn-salary-annual')?.addEventListener('click', () => switchSalaryTab('annual'));
document.getElementById('tab-btn-salary-liquidation')?.addEventListener('click', () => switchSalaryTab('liquidation'));

// --- 17. BOTONES DE EXPORTACIÓN Y BACKUP DE PERFIL ---
document.getElementById('btn-export-data')?.addEventListener('click', () => {
    try {
        const dbData = localStorage.getItem('myFinances'); if (!dbData) { alert("No hay datos para exportar."); return; }
        const fData = JSON.parse(dbData);
        fData.lastBackupDate = Date.now();
        localStorage.setItem('myFinances', JSON.stringify(fData));
        const backup = { finances: fData, auth: JSON.parse(localStorage.getItem('myFinancesAuth') || 'null'), salary: JSON.parse(localStorage.getItem('myFinancesSalary') || 'null'), taxParams: getTaxParams(), theme: localStorage.getItem('myFinancesTheme') || 'purple', colorMode: localStorage.getItem('myFinancesColorMode') || 'auto', widgetOrder: JSON.parse(localStorage.getItem('myFinancesWidgetOrder') || 'null'), exportDate: new Date().toISOString() };
        const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = `MisFinanzas_Respaldo_${new Date().toLocaleDateString('en-CA')}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        updateDashboard(); // Refresca alertas (quita aviso)
    } catch (e) { alert("Error al exportar respaldo."); }
});

document.getElementById('btn-import-trigger')?.addEventListener('click', () => document.getElementById('import-file-input')?.click());

document.getElementById('import-file-input')?.addEventListener('change', (event) => {
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result); if (!importedData?.finances?.transactions) { alert("Formato JSON incorrecto."); return; }
            if (confirm("⚠️ ADVERTENCIA: Esto reemplazará los datos actuales. ¿Continuar?")) {
                localStorage.setItem('myFinances', JSON.stringify(importedData.finances));
                if (importedData.auth) localStorage.setItem('myFinancesAuth', JSON.stringify(importedData.auth));
                if (importedData.salary) localStorage.setItem('myFinancesSalary', JSON.stringify(importedData.salary));
                if (importedData.taxParams) localStorage.setItem('myFinancesTaxParams', JSON.stringify(importedData.taxParams));
                if (importedData.theme) localStorage.setItem('myFinancesTheme', importedData.theme);
                if (importedData.colorMode) localStorage.setItem('myFinancesColorMode', importedData.colorMode);
                if (importedData.widgetOrder) localStorage.setItem('myFinancesWidgetOrder', JSON.stringify(importedData.widgetOrder));
                alert("✅ Respaldo restaurado exitosamente."); location.reload();
            }
        } catch (error) { alert("Error al leer archivo JSON."); }
        event.target.value = '';
    };
    reader.readAsText(file);
});

const parseCSVLine = (line, delimiter) => { const res = []; let cur = '', inQuotes = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') inQuotes = !inQuotes; else if (ch === delimiter && !inQuotes) { res.push(cur.trim()); cur = ''; } else cur += ch; } res.push(cur.trim()); return res; };
const parseFlexibleDate = (rawStr) => {
    if (!rawStr) return null; const clean = rawStr.trim().split(' ')[0];
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) { const [y, m, d] = clean.split('-').map(Number); return new Date(y, m - 1, d, 12, 0, 0); }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) { const [d, m, y] = clean.split('/').map(Number); return new Date(y, m - 1, d, 12, 0, 0); }
    const parsed = new Date(clean); return isNaN(parsed.getTime()) ? null : parsed;
};

document.getElementById('btn-download-csv-template')?.addEventListener('click', () => {
    const csvRows = [
        'FECHA;TIPO;CATEGORIA;SUBCATEGORIA;DESCRIPCION;PRESUPUESTO;VALOR;ESTADO',
        '2026-11-01;INGRESO;Salario / Nómina;General;Pago nómina quincenal (Ejemplo);2500000;2500000;CERRADO',
        '2026-11-05;EGRESO;Alimentación;Mercado;Compra supermercado (Ejemplo);400000;385000;CERRADO',
        '2026-11-20;EGRESO;Vivienda y Servicios;Internet;Factura fibra óptica (Ejemplo);95000;0;PENDIENTE',
        'AAAA-MM-DD;NOTA (Borra los ejemplos antes de subir);INGRESO o EGRESO;Nombre categoría;Opcional o General;Detalle del movimiento;Monto planeado (0 si no aplica);Monto real;CERRADO o PENDIENTE'
    ];
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_MisFinanzas.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});
document.getElementById('btn-import-csv-trigger')?.addEventListener('click', () => document.getElementById('import-csv-input')?.click());
document.getElementById('import-csv-input')?.addEventListener('change', (event) => {
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const lines = e.target.result.split(/\r?\n/).filter(l => l.trim().length > 0); if (lines.length < 2) { alert("El archivo CSV está vacío."); return; }
            const delimiter = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
            const headers = parseCSVLine(lines[0], delimiter).map(h => h.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            const idxFecha = headers.findIndex(h => h.includes('FECHA')), idxTipo = headers.findIndex(h => h.includes('REGISTRO') || h.includes('TIPO')), idxCat = headers.findIndex(h => h === 'CATEGORIA'), idxSub = headers.findIndex(h => h.includes('SUBCATEGORIA')), idxConc = headers.findIndex(h => h.includes('CONCEPTO') || h.includes('DESCRIPCION')), idxPtto = headers.findIndex(h => h.includes('PRESUPUESTO')), idxVal = headers.findIndex(h => h.includes('VALOR') || h.includes('MONTO')), idxEst = headers.findIndex(h => h.includes('ESTADO'));
            if (idxFecha === -1 || idxTipo === -1) { alert("Faltan columnas FECHA o REGISTRO/TIPO en el CSV."); return; }
            const defaultAcc = getDefaultAccountId(true), importedTxs = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = parseCSVLine(lines[i], delimiter), dateObj = parseFlexibleDate(cols[idxFecha]); if (!dateObj) continue;
                const rawTipo = (cols[idxTipo] || '').toUpperCase(); if (rawTipo !== 'INGRESO' && rawTipo !== 'EGRESO') continue;
                const txType = rawTipo === 'INGRESO' ? 'income' : 'expense', rawCat = (idxCat !== -1 && cols[idxCat]) ? cols[idxCat].trim() : (txType === 'income' ? 'Otros Ingresos' : 'Otros Gastos'), rawSub = (idxSub !== -1 && cols[idxSub]) ? cols[idxSub].trim() : 'General', rawDesc = (idxConc !== -1 && cols[idxConc]) ? cols[idxConc].trim() : rawSub, pttoAmt = idxPtto !== -1 ? parseMoneyInput(cols[idxPtto]) : 0, realAmt = idxVal !== -1 ? parseMoneyInput(cols[idxVal]) : 0, rawEst = (idxEst !== -1 && cols[idxEst]) ? cols[idxEst].toUpperCase().trim() : 'CERRADO', isPending = rawEst === 'PENDIENTE' || rawEst === 'PARCIAL', finalAmt = isPending ? (realAmt > 0 ? realAmt : pttoAmt) : realAmt;
                if (finalAmt === 0 && pttoAmt === 0) continue;
                const catList = financeData.categories[txType]; let catObj = catList.find(c => c.name.toLowerCase().includes(rawCat.toLowerCase()));
                if (!catObj) { catObj = { name: `${txType === 'income' ? '💰 ' : '📦 '}${rawCat}`, subcategories: [] }; catList.push(catObj); }
                if (rawSub && rawSub !== 'General' && !catObj.subcategories.some(s => s.name.toLowerCase() === rawSub.toLowerCase())) catObj.subcategories.push({ name: rawSub, limit: 0 });
                importedTxs.push({ id: dateObj.getTime() + i, monthId: getMonthId(dateObj), type: txType, status: isPending ? 'pending' : 'closed', account: defaultAcc, category: catObj.name, subcategory: rawSub || 'General', description: rawDesc || rawSub, amount: finalAmt, budgetedAmount: pttoAmt, date: `${dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, 12:00`, isAdjustment: false });
            }
            if (importedTxs.length === 0) { alert("No hay registros válidos."); return; }
            if (confirm(`Se encontraron ${importedTxs.length} registros.\n\n• ACEPTAR: Reemplazar actuales.\n• CANCELAR: Agregarlos a los que ya tienes.`)) financeData.transactions = importedTxs; else financeData.transactions = financeData.transactions.concat(importedTxs);
            localStorage.setItem('myFinances', JSON.stringify(financeData)); renderCategoryOptions(document.getElementById('type')?.value || 'expense'); updateDashboard(); alert(`✅ Se cargaron ${importedTxs.length} movimientos.`);
        } catch (err) { alert("Error al procesar CSV."); }
        event.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
});

// ==========================================
// 18. ARRANQUE DE LA APLICACIÓN Y MENÚS PRINCIPALES
// ==========================================

const showProfileSubView = (viewElement) => {
    ['profile-main-view', 'profile-salary-view', 'profile-tax-params-view', 'profile-theme-view', 'profile-notifications-view', 'profile-backup-view', 'profile-security-view'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });
    viewElement?.classList.remove('hidden');
    hasUnsavedChanges = false;
};

// Listeners Menú Navegación Principal
document.getElementById('nav-home')?.addEventListener('click', attemptCloseModals);
document.getElementById('nav-analytics')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('analytics-modal')?.classList.remove('hidden'); setActiveNav(document.getElementById('nav-analytics')); } });
document.getElementById('nav-budget')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('budget-modal')?.classList.remove('hidden'); renderBudgetView(); setActiveNav(document.getElementById('nav-budget')); } });

// Listeners Menú Drawer
document.getElementById('drawer-accounts')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('account-detail-view')?.classList.add('hidden'); document.getElementById('accounts-list-view')?.classList.remove('hidden'); document.getElementById('accounts-modal')?.classList.remove('hidden'); } });
document.getElementById('drawer-cards')?.addEventListener('click', () => { if (attemptCloseModals()) document.getElementById('cards-modal')?.classList.remove('hidden'); });
document.getElementById('drawer-debts')?.addEventListener('click', () => { if (attemptCloseModals()) document.getElementById('debts-modal')?.classList.remove('hidden'); });
document.getElementById('drawer-debt-planner')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('debt-planner-modal')?.classList.remove('hidden'); renderDebtPlanner(); } });
document.getElementById('drawer-pockets')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('pockets-modal')?.classList.remove('hidden'); renderPocketsView(); } });
document.getElementById('drawer-assets')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('assets-modal')?.classList.remove('hidden'); renderAssetsBreakdown(); } });
document.getElementById('drawer-budget')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('budget-modal')?.classList.remove('hidden'); renderBudgetView(); setActiveNav(document.getElementById('nav-budget')); } });
document.getElementById('drawer-expenses')?.addEventListener('click', () => { if (attemptCloseModals()) document.getElementById('expenses-modal')?.classList.remove('hidden'); });
document.getElementById('drawer-subscriptions')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('subscriptions-modal')?.classList.remove('hidden'); renderSubscriptionsView(); } });
document.getElementById('drawer-analytics')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('analytics-modal')?.classList.remove('hidden'); setActiveNav(document.getElementById('nav-analytics')); } });
document.getElementById('drawer-annual')?.addEventListener('click', () => { if (attemptCloseModals()) { annualViewYear = viewDate.getFullYear(); document.getElementById('annual-control-modal')?.classList.remove('hidden'); renderAnnualControlTable(); } });
document.getElementById('drawer-health')?.addEventListener('click', () => { if (attemptCloseModals()) document.getElementById('widget-financial-health')?.click(); });

document.getElementById('drawer-salary')?.addEventListener('click', () => { if (attemptCloseModals()) { syncUserUI(); document.getElementById('profile-modal')?.classList.remove('hidden'); renderSalaryUI(false); showProfileSubView(document.getElementById('profile-salary-view')); } });
document.getElementById('drawer-tax')?.addEventListener('click', () => { if (attemptCloseModals()) { syncUserUI(); document.getElementById('profile-modal')?.classList.remove('hidden'); renderTaxParamsUI(); showProfileSubView(document.getElementById('profile-tax-params-view')); } });
document.getElementById('drawer-backup')?.addEventListener('click', () => { if (attemptCloseModals()) { syncUserUI(); document.getElementById('profile-modal')?.classList.remove('hidden'); showProfileSubView(document.getElementById('profile-backup-view')); } });
document.getElementById('drawer-version-btn')?.addEventListener('click', () => { if (typeof closeSideDrawer === 'function') closeSideDrawer(); openUniversalInfoModal('about'); });
document.getElementById('transfer-payment-mode')?.addEventListener('change', (e) => {
    const strategyGroup = document.getElementById('extraordinary-strategy-group');
    if (e.target.value === 'extraordinary') {
        strategyGroup?.classList.remove('hidden');
    } else {
        strategyGroup?.classList.add('hidden');
    }
});
// Acciones DOM de Botones
document.getElementById('open-drawer-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openSideDrawer(); });
document.getElementById('close-drawer-btn')?.addEventListener('click', closeSideDrawer);
sideDrawerBackdrop?.addEventListener('click', closeSideDrawer);

if (fabBtn && fabMenu) {
    fabBtn.addEventListener('click', () => {
        closeSideDrawer();
        if (fabMenu.classList.contains('hidden')) {
            fabMenu.classList.remove('hidden');
            fabBtn.classList.add('active');
        } else {
            fabMenu.classList.add('hidden');
            fabBtn.classList.remove('active');
        }
    });
}
document.querySelectorAll('.btn-close-modal').forEach(btn => { btn.addEventListener('click', attemptCloseModals); });

// Listeners Perfil Principal
document.getElementById('profile-trigger-btn')?.addEventListener('click', () => { if (attemptCloseModals()) { syncUserUI(); document.getElementById('profile-modal')?.classList.remove('hidden'); showProfileSubView(document.getElementById('profile-main-view')); } });
document.getElementById('menu-salary-btn')?.addEventListener('click', () => { renderSalaryUI(false); showProfileSubView(document.getElementById('profile-salary-view')); });
document.getElementById('menu-tax-params-btn')?.addEventListener('click', () => { renderTaxParamsUI(); showProfileSubView(document.getElementById('profile-tax-params-view')); });
document.getElementById('menu-theme-btn')?.addEventListener('click', () => {
    const compactCheck = document.getElementById('profile-use-compact-numbers');
    if (compactCheck) compactCheck.checked = !!financeData.useCompactNumbers;
    showProfileSubView(document.getElementById('profile-theme-view'));
});

document.getElementById('profile-use-compact-numbers')?.addEventListener('change', (e) => {
    financeData.useCompactNumbers = !!e.target.checked;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    updateDashboard();
});

document.getElementById('menu-notifications-btn')?.addEventListener('click', () => { 
    const prefs = getNotificationPrefs();
    document.getElementById('notif-days-before').value = prefs.daysBefore;
    document.getElementById('notif-budget-pct').value = prefs.budgetPct;
    document.getElementById('notif-pending-enabled').checked = prefs.pendingEnabled;
    showProfileSubView(document.getElementById('profile-notifications-view'));
});
document.getElementById('menu-backup-btn')?.addEventListener('click', () => showProfileSubView(document.getElementById('profile-backup-view')));
document.getElementById('menu-security-btn')?.addEventListener('click', () => {
    syncUserUI();
    showProfileSubView(document.getElementById('profile-security-view'));
});

document.getElementById('back-from-salary-btn')?.addEventListener('click', () => { if (!hasUnsavedChanges || confirm("⚠️ Tienes cambios sin guardar. ¿Salir?")) showProfileSubView(document.getElementById('profile-main-view')); });
document.getElementById('shortcut-to-tax-params-btn')?.addEventListener('click', () => { renderTaxParamsUI(); showProfileSubView(document.getElementById('profile-tax-params-view')); });
document.getElementById('back-from-tax-params-btn')?.addEventListener('click', () => { if (!hasUnsavedChanges || confirm("⚠️ Tienes cambios sin guardar. ¿Salir?")) showProfileSubView(document.getElementById('profile-main-view')); });
document.getElementById('back-from-theme-btn')?.addEventListener('click', () => showProfileSubView(document.getElementById('profile-main-view')));
document.getElementById('back-from-notifications-btn')?.addEventListener('click', () => showProfileSubView(document.getElementById('profile-main-view')));
document.getElementById('back-from-backup-btn')?.addEventListener('click', () => showProfileSubView(document.getElementById('profile-main-view')));
document.getElementById('back-from-security-btn')?.addEventListener('click', () => { if (!hasUnsavedChanges || confirm("⚠️ Tienes cambios sin guardar. ¿Salir?")) showProfileSubView(document.getElementById('profile-main-view')); });

document.querySelectorAll('#theme-mode-segmented .segmented-btn').forEach(btn => {
    btn.addEventListener('click', () => applyColorModeUI(btn.getAttribute('data-mode')));
});
document.querySelectorAll('.theme-color-btn').forEach(btn => { 
    btn.addEventListener('click', () => { 
        const themeKey = btn.getAttribute('data-theme');
        localStorage.setItem('myFinancesTheme', themeKey); 
        applyThemeUI(themeKey); 
    }); 
});
document.getElementById('custom-theme-color')?.addEventListener('input', (e) => { 
    const hex = e.target.value; 
    localStorage.setItem('myFinancesTheme', hex); 
    applyThemeUI(hex); 
});

document.getElementById('btn-generate-monthly-ics')?.addEventListener('click', () => {
    const payD = parseInt(document.getElementById('profile-pay-day')?.value, 10) || 30;
    const evDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), payD, 18, 0, 0);
    downloadIcsEvent('Revisar Presupuesto Mis Finanzas', 'Alarma general para revisar tu cierre de mes y pagos de nómina.', evDate);
});
document.getElementById('btn-lock-app-profile')?.addEventListener('click', () => initAuthUI(true));
document.getElementById('profile-enable-pin')?.addEventListener('change', (e) => {
    const pinGroup = document.getElementById('profile-pin-group');
    const disableGroup = document.getElementById('profile-disable-pin-group');
    const submitBtn = document.getElementById('profile-pin-submit-btn');
    const hasExistingPin = !!(authData && authData.pinEnabled && authData.pinHash);

    document.getElementById('profile-pin-error')?.classList.add('hidden');

    if (e.target.checked) {
        disableGroup?.classList.add('hidden');
        pinGroup?.classList.remove('hidden');
        if (submitBtn) submitBtn.innerText = hasExistingPin ? 'Actualizar Seguridad' : 'Guardar y Activar PIN';
        setTimeout(() => document.getElementById('profile-new-pin')?.focus(), 80);
    } else {
        pinGroup?.classList.add('hidden');
        if (hasExistingPin) {
            disableGroup?.classList.remove('hidden');
            if (submitBtn) submitBtn.innerText = 'Desactivar Bloqueo';
            setTimeout(() => document.getElementById('profile-current-pin')?.focus(), 80);
        } else {
            disableGroup?.classList.add('hidden');
            if (submitBtn) submitBtn.innerText = 'Actualizar Seguridad';
        }
    }
});

document.getElementById('profile-pin-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!authData) return;
    const enablePin = !!document.getElementById('profile-enable-pin')?.checked;
    const newPin = document.getElementById('profile-new-pin')?.value.trim() || '';
    const confirmPin = document.getElementById('profile-new-pin-confirm')?.value.trim() || '';
    const currentPin = document.getElementById('profile-current-pin')?.value.trim() || '';
    const errEl = document.getElementById('profile-pin-error');
    const hasExistingPin = !!(authData.pinEnabled && authData.pinHash);

    if (enablePin) {
        if (!newPin && hasExistingPin) {
            errEl?.classList.add('hidden');
            hasUnsavedChanges = false;
            alert('Configuración de seguridad actualizada.');
            return;
        }
        if (newPin.length < 4 || !/^\d+$/.test(newPin)) {
            if (errEl) { errEl.innerText = 'Ingresa un PIN de 4 a 6 dígitos numéricos.'; errEl.classList.remove('hidden'); }
            return;
        }
        if (newPin !== confirmPin) {
            if (errEl) { errEl.innerText = 'Los PIN ingresados no coinciden.'; errEl.classList.remove('hidden'); }
            return;
        }
        authData.pinEnabled = true;
        authData.pinHash = hashSecret(newPin);
    } else {
        if (hasExistingPin && !verifyPin(currentPin)) {
            if (errEl) { errEl.innerText = 'PIN actual incorrecto. No se desactivó el bloqueo.'; errEl.classList.remove('hidden'); }
            return;
        }
        authData.pinEnabled = false;
        authData.pinHash = null;
    }

    localStorage.setItem('myFinancesAuth', JSON.stringify(authData));
    errEl?.classList.add('hidden');
    if (document.getElementById('profile-new-pin')) document.getElementById('profile-new-pin').value = '';
    if (document.getElementById('profile-new-pin-confirm')) document.getElementById('profile-new-pin-confirm').value = '';
    if (document.getElementById('profile-current-pin')) document.getElementById('profile-current-pin').value = '';
    hasUnsavedChanges = false;
    syncUserUI();
    alert(enablePin ? 'PIN de acceso guardado y activado.' : 'Bloqueo con PIN desactivado.');
});
document.getElementById('home-version-btn')?.addEventListener('click', () => openUniversalInfoModal('about'));
document.getElementById('profile-version-btn')?.addEventListener('click', () => openUniversalInfoModal('about'));

// --- 15.6 DIVISIÓN DE TRANSACCIONES (SPLIT) ---
let splitState = { baseAmount: 0, type: 'expense', items: [] };

const renderSplitItems = () => {
    const container = document.getElementById('split-items-container');
    if (!container) return;
    container.innerHTML = '';
    
    let assigned = 0;
    
    // Obtener opciones de cuenta y categoría una sola vez para inyectarlas
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
    
    // Restaurar selecciones
    setTimeout(() => {
        document.querySelectorAll('.split-cat-select').forEach(el => { el.value = splitState.items[el.getAttribute('data-index')].category; });
        document.querySelectorAll('.split-acc-select').forEach(el => { el.value = splitState.items[el.getAttribute('data-index')].account; });
        
        // Re-vincular eventos de inputs de monto
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
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
        }
    } else {
        remEl.className = rem < 0 ? 'negative' : 'neutral';
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = '0.5';
        }
    }
};

window.removeSplitItem = (index) => {
    splitState.items.splice(index, 1);
    renderSplitItems();
};

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
    // --- BARRERA DEFENSIVA ---
    let currentAssigned = splitState.items.reduce((sum, item) => round2(sum + (parseFloat(item.amount) || 0)), 0);
    const rem = round2(splitState.baseAmount - currentAssigned);
    
    if (Math.abs(rem) >= 0.01) {
        alert(`La división no es exacta. Tienes un descuadre de ${formatMoney(rem)}.`);
        return;
    }
    
    if (splitState.items.length < 2) {
        alert('Debes agregar al menos dos sub-transacciones para dividir el movimiento.');
        return;
    }
    // --- FIN BARRERA ---
    let assigned = splitState.items.reduce((sum, item) => sum + round2(item.amount), 0);
    if (round2(splitState.baseAmount - assigned) !== 0) {
        alert('La suma de las divisiones debe ser EXACTAMENTE igual al monto total base. Verifica el restante.');
        return;
    }

    const validItems = splitState.items.filter(i => i.amount > 0);
    if (validItems.length < 2) {
        alert('Debes tener al menos 2 divisiones con monto mayor a $0.');
        return;
    }

    const status = document.getElementById('trans-status').value;
    const baseDateObj = new Date(`${document.getElementById('trans-date').value}T${document.getElementById('trans-time').value}`);
    const splitGroupId = 'Split_' + Date.now();
    const commonDesc = document.getElementById('description').value.trim();

    validItems.forEach((item, idx) => {
        let catName = '', subName = 'General';
        if (item.category) { const parts = item.category.split('::'); catName = parts[0]; subName = parts[1] || 'General'; }

        financeData.transactions.push({
            id: baseDateObj.getTime() + idx + Math.floor(Math.random() * 500),
            monthId: getMonthId(baseDateObj),
            type: splitState.type,
            status: status,
            account: item.account,
            category: catName,
            subcategory: subName,
            description: `${item.description || commonDesc} [${idx+1}/${validItems.length}]`,
            amount: item.amount,
            budgetedAmount: status === 'pending' ? item.amount : 0,
            date: `${baseDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${baseDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
            isAdjustment: false,
            splitGroupId: splitGroupId
        });
    });

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    viewDate = new Date(baseDateObj.getFullYear(), baseDateObj.getMonth(), 1);
    document.getElementById('split-tx-modal')?.classList.add('hidden');
    forceCloseAllModals(); 
    updateDashboard();
    alert(`✅ Transacción dividida y guardada en ${validItems.length} partes.`);
});

// --- 15G. GENERADORES DE REPORTES PDF (MÚLTIPLES TIPOS) ---
const basePrintStyles = `
    .print-header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .print-header h1 { margin: 0; font-size: 18pt; font-weight: 800; color: #111; }
    .print-header p { margin: 5px 0 0 0; font-size: 10pt; color: #444; }
    .print-section { margin-bottom: 25px; page-break-inside: avoid; }
    .print-section-title { font-size: 12pt; font-weight: 700; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase; color: #333; }
    .print-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 15px; }
    .print-table th { background: #f4f6f9; padding: 6px; text-align: left; border-bottom: 2px solid #ccc; font-weight: bold; color: #111; }
    .print-table td { padding: 6px; border-bottom: 1px solid #eee; color: #222; }
    .print-table tr:nth-child(even) { background-color: #fafafa; }
    .print-text-right { text-align: right !important; }
    .print-positive { color: #059669 !important; font-weight: bold; }
    .print-negative { color: #dc2626 !important; font-weight: bold; }
    .print-footer { text-align:center; font-size:8pt; color:#888; margin-top:40px; border-top:1px solid #ddd; padding-top:10px; }
`;

// 1. EXTRACTO MENSUAL COMPLETO
document.getElementById('btn-generate-pdf-report')?.addEventListener('click', () => {
    const rc = document.getElementById('print-report-container');
    if (!rc) return;
    const monthId = getMonthId(viewDate), snap = computeBalancesUpTo(monthId), flow = getMonthlyFlow(monthId, false);
    
    // Gasto Desglosado VS Presupuesto
    const expRows = [];
    let totalPtto = 0, totalReal = 0;
    (financeData.categories.expense || []).filter(c => !c.isArchived).forEach(cat => {
        const ptto = getCategoryLimitForMonth(cat, viewDate.getMonth(), viewDate.getFullYear());
        let real = 0;
        financeData.transactions.forEach(t => {
            if (t.monthId === monthId && t.type === 'expense' && t.category === cat.name && !t.isAdjustment && isTxClosed(t)) real = round2(real + t.amount);
        });
        totalPtto += ptto; totalReal += real;
        if (ptto > 0 || real > 0) {
            const v = calculateBudgetVariance('expense', real, ptto);
            const vHtml = ptto === 0 ? '-' : `<span class="${v.isFavorable ? 'print-positive' : 'print-negative'}">${String(v.pct).replace('.',',')}%</span>`;
            expRows.push(`<tr><td>${cat.name}</td><td class="print-text-right">${formatMoney(ptto)}</td><td class="print-text-right">${formatMoney(real)}</td><td class="print-text-right">${vHtml}</td></tr>`);
        }
    });

    // Detalle de Transacciones del Mes
    let txHtml = '';
    const txs = financeData.transactions.filter(t => t.monthId === monthId && isTxClosed(t)).sort((a,b) => b.id - a.id);
    txs.forEach(t => {
        const dStr = new Date(t.id).toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit' });
        const typeStr = t.type === 'income' ? 'Ingreso' : (t.type === 'expense' ? 'Gasto' : 'Transferencia');
        const color = t.type === 'income' ? 'print-positive' : (t.type === 'expense' ? 'print-negative' : '');
        const sign = t.type === 'income' ? '+' : (t.type === 'expense' ? '-' : '');
        txHtml += `<tr><td>${dStr}</td><td>${typeStr}</td><td>${t.category || t.account}</td><td>${t.description}</td><td class="print-text-right ${color}">${sign}${formatMoney(t.amount)}</td></tr>`;
    });

    rc.innerHTML = `<style>${basePrintStyles}</style>
        <div class="print-header">
            <h1>Extracto Financiero Mensual</h1>
            <p><strong>Titular:</strong> ${authData ? authData.name : 'Usuario'} | <strong>Periodo:</strong> ${formatMonthName(viewDate)} | <strong>Generado el:</strong> ${currentDate.toLocaleDateString('es-CO')} ${currentDate.toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}</p>
        </div>
        <div class="print-section"><div class="print-section-title">1. Resumen de Flujo de Caja</div>
            <table class="print-table">
                <tr><td>Total Ingresos Realizados:</td><td class="print-text-right print-positive">${formatMoney(flow.inc)}</td></tr>
                <tr><td>Total Egresos Realizados:</td><td class="print-text-right print-negative">-${formatMoney(flow.exp)}</td></tr>
                <tr><td><strong>Flujo Neto del Mes:</strong></td><td class="print-text-right ${flow.net >= 0 ? 'print-positive' : 'print-negative'}">${formatMoney(flow.net)}</td></tr>
            </table>
        </div>
        <div class="print-section"><div class="print-section-title">2. Hoja de Balance General (Acumulado)</div>
            <table class="print-table">
                <tr><td>Total Activos (Liquidez, Bolsillos, Fijos):</td><td class="print-text-right print-positive">${formatMoney(snap.assetsTotal + snap.fixedAssetsTotal + snap.pocketsTotal + snap.cxcTotal)}</td></tr>
                <tr><td>Total Pasivos (Deudas, Tarjetas):</td><td class="print-text-right print-negative">-${formatMoney(snap.liabilitiesTotal)}</td></tr>
                <tr style="background:#f4f6f9;"><td><strong>Patrimonio Neto Total:</strong></td><td class="print-text-right ${snap.netWorth >= 0 ? 'print-positive' : 'print-negative'}">${formatMoney(snap.netWorth)}</td></tr>
            </table>
        </div>
        <div class="print-section"><div class="print-section-title">3. Ejecución Presupuestal de Gastos</div>
            <table class="print-table">
                <thead><tr><th>Categoría</th><th class="print-text-right">Presupuestado</th><th class="print-text-right">Real Ejecutado</th><th class="print-text-right">Desviación</th></tr></thead>
                <tbody>${expRows.length > 0 ? expRows.join('') : '<tr><td colspan="4" style="text-align:center;">Sin ejecución</td></tr>'}</tbody>
                <tfoot><tr><th>TOTAL</th><th class="print-text-right">${formatMoney(totalPtto)}</th><th class="print-text-right print-negative">${formatMoney(totalReal)}</th><th></th></tr></tfoot>
            </table>
        </div>
        <div class="print-section"><div class="print-section-title">4. Bitácora de Movimientos</div>
            <table class="print-table">
                <thead><tr><th>Día</th><th>Tipo</th><th>Clasificación</th><th>Descripción</th><th class="print-text-right">Valor</th></tr></thead>
                <tbody>${txHtml.length > 0 ? txHtml : '<tr><td colspan="5" style="text-align:center;">Sin movimientos este mes</td></tr>'}</tbody>
            </table>
        </div>
        <div class="print-footer">Documento informativo generado localmente sin conexión a servidores. Mis Finanzas (Función IF) v2.1.0.</div>`;
    window.print();
});

// 2. REPORTE DE ESTADO DE CUENTA A FAVOR (COBROS)
document.getElementById('btn-print-cxc-report')?.addEventListener('click', () => {
    const rc = document.getElementById('print-report-container');
    if (!rc) return;
    const receivables = financeData.customAccounts.filter(a => a.id.startsWith('CxC_'));
    let html = `
        <div class="print-header">
            <div class="print-brand">
                <div class="print-brand-icon">
                    ${renderIcon('users', 24)}
                </div>
                <div>
                    <h1>DEUDAS A FAVOR Y COBROS PENDIENTES</h1>
                    <span>Función IF • Mis Finanzas</span>
                </div>
            </div>
            <div class="print-meta">
                <p><strong>Titular:</strong> ${authData ? authData.name : 'Usuario'}</p>
                <p><strong>Generado:</strong> ${currentDate.toLocaleDateString('es-CO')} a las ${currentDate.toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}</p>
            </div>
        </div>`;
    
    if (receivables.length === 0) {
        html += '<div class="print-section"><p>No existen deudas a favor registradas en el sistema.</p></div>';
    } else {
        receivables.forEach(acc => {
            const bal = round2(currentBalances[acc.id] || 0);
            if (bal === 0) return;
            const nameClean = stripLeadingEmoji(acc.name).replace('Me debe:', '').trim();
            let txHtml = '';
            
            const accTxs = financeData.transactions.filter(t => t.account === acc.id || t.toAccount === acc.id).sort((a,b) => b.id - a.id);
            accTxs.forEach(t => {
                const isLoan = (t.type === 'transfer' && t.toAccount === acc.id) || (t.type === 'income' && t.isAdjustment && t.account === acc.id);
                const isPayment = (t.type === 'transfer' && t.account === acc.id) || (t.type === 'expense' && t.isAdjustment && t.account === acc.id);
                if (isLoan) txHtml += `<tr><td>${t.date.split(',')[0]}</td><td>Préstamo / Gasto asignado</td><td>${stripLeadingEmoji(t.description)}</td><td class="print-text-right"><span class="print-negative">-${formatMoney(t.amount)}</span></td></tr>`;
                if (isPayment) txHtml += `<tr><td>${t.date.split(',')[0]}</td><td>Abono recibido</td><td>${stripLeadingEmoji(t.description)}</td><td class="print-text-right"><span class="print-positive">+${formatMoney(t.amount)}</span></td></tr>`;
            });

            html += `
            <div class="print-section"><div class="print-section-title">Detalle de Deudor: ${nameClean}</div>
                <table class="print-table">
                    <thead><tr><th style="width:15%;">Fecha</th><th style="width:30%;">Concepto</th><th style="width:35%;">Descripción</th><th class="print-text-right" style="width:20%;">Valor</th></tr></thead>
                    <tbody>${txHtml}</tbody>
                    <tfoot><tr><td colspan="3" style="font-weight:700; text-align:right;">SALDO PENDIENTE POR COBRAR:</td><td class="print-text-right"><span class="print-positive" style="font-size:11pt;">${formatMoney(bal)}</span></td></tr></tfoot>
                </table>
            </div>`;
        });
    }
    html += `<div class="print-footer">Soporte de gastos compartidos y préstamos informales. Mis Finanzas (Función IF).</div>`;
    triggerSafePdfPrint(html, 'Deudas_a_Favor');
});

// 3. REPORTE LABORAL Y DE LIQUIDACIÓN
document.getElementById('btn-print-liquidation-report')?.addEventListener('click', () => {
    const rc = document.getElementById('print-report-container');
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (!rc || !salaryStr) return;
    const config = JSON.parse(salaryStr), m = calculateLaborMetrics(config, currentDate);
    
    rc.innerHTML = `
        <div class="print-header">
            <div class="print-brand">
                <div class="print-brand-icon">
                    ${renderIcon('briefcase', 24)}
                </div>
                <div>
                    <h1>ANÁLISIS LABORAL Y LIQUIDACIÓN</h1>
                    <span>Función IF • Mis Finanzas</span>
                </div>
            </div>
            <div class="print-meta">
                <p><strong>Empleado:</strong> ${authData ? authData.name : 'Usuario'}</p>
                <p><strong>Generado:</strong> ${currentDate.toLocaleDateString('es-CO')} a las ${currentDate.toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}</p>
            </div>
        </div>
        
        <div class="print-section"><div class="print-section-title">1. Resumen Salarial Mensual</div>
            <table class="print-table">
                <tr><td>Sueldo Básico:</td><td class="print-text-right">${formatMoney(m.basic)}</td></tr>
                <tr><td>Ingreso No Salarial / Bonos (Tope Ley 1393: ${m.params.nonSalaryCapPct}%):</td><td class="print-text-right">${formatMoney(m.nonSalary)}</td></tr>
                <tr><td>Auxilio de Transporte Efectivo (Legal):</td><td class="print-text-right">${formatMoney(m.effectiveTransport)}</td></tr>
                <tr><td>Deducciones de Ley (Salud, Pensión, FSP):</td><td class="print-text-right"><span class="print-negative">-${formatMoney(m.health + m.pension + m.fsp)}</span></td></tr>
                <tr><td>Retención en la Fuente (UVT ${m.params.year}):</td><td class="print-text-right"><span class="print-negative">-${formatMoney(m.ret)}</span></td></tr>
                <tr><td>Libranzas / Cuotas de Deuda Nómina:</td><td class="print-text-right"><span class="print-negative">-${formatMoney(m.payrollDebtDeductions)}</span></td></tr>
                <tr style="background:#f8fafc;"><td style="font-weight:800;">SALARIO NETO EFECTIVO (A Recibir):</td><td class="print-text-right"><span class="print-positive" style="font-size:12pt;">${formatMoney(m.net)}</span></td></tr>
            </table>
        </div>

        <div class="print-section"><div class="print-section-title">2. Proyección de Prestaciones Sociales (Proporcional a la fecha)</div>
            <table class="print-table">
                <thead><tr><th style="width:38%;">Concepto Legal</th><th style="width:25%;">Base de Cálculo</th><th style="width:20%;">Tiempo Causado</th><th class="print-text-right" style="width:17%;">Valor</th></tr></thead>
                <tbody>
                    <tr><td>Prima de Servicios (Semestre en curso)</td><td>${formatMoney(m.primaBase)}</td><td>${m.daysSemester} días</td><td class="print-text-right"><span class="print-positive">${formatMoney(m.liqPrima)}</span></td></tr>
                    <tr><td>Cesantías (Año en curso)</td><td>${formatMoney(m.cesantiasBase)}</td><td>${m.daysYear} días</td><td class="print-text-right"><span class="print-positive">${formatMoney(m.liqCesantias)}</span></td></tr>
                    <tr><td>Intereses de Cesantías (12% Anual)</td><td>${formatMoney(m.liqCesantias)} (Cesantías)</td><td>${m.daysYear} días</td><td class="print-text-right"><span class="print-positive">${formatMoney(m.liqIntereses)}</span></td></tr>
                    <tr><td>Vacaciones Pendientes (Causadas - Tomadas)</td><td>${formatMoney(m.basic)}</td><td>${m.vacDaysPending} días</td><td class="print-text-right"><span class="print-positive">${formatMoney(m.liqVacaciones)}</span></td></tr>
                </tbody>
                <tfoot><tr><td colspan="3" style="font-weight:700; text-align:right;">TOTAL LIQUIDACIÓN SIMULADA AL CORTE:</td><td class="print-text-right"><span class="print-positive" style="font-size:12pt;">${formatMoney(m.liqPrima + m.liqCesantias + m.liqIntereses + m.liqVacaciones)}</span></td></tr></tfoot>
            </table>
        </div>
        
        <div class="print-footer">Cálculos tributarios y laborales basados en parámetros de ${m.params.year} ingresados por el usuario. Son estimaciones referenciales de Mis Finanzas (Función IF).</div>`;
    
    triggerSafePdfPrint(rc.innerHTML, 'Analisis_Laboral_Liquidacion');
});

// --- RENDERIZADO DE DEUDAS A FAVOR (CUENTAS POR COBRAR) ---
const renderReceivablesBreakdown = () => {
    const list = document.getElementById('receivables-breakdown-list');
    const totalEl = document.getElementById('receivables-total-amount');
    if (!list || !totalEl) return;

    const receivables = financeData.customAccounts.filter(a => a.id.startsWith('CxC_'));
    let totalReceivables = 0;
    list.innerHTML = '';

    if (receivables.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:20px 0;">Nadie te debe dinero actualmente. ¡Qué paz! 🍃</p>';
    } else {
        receivables.forEach((acc) => {
            const balance = round2(currentBalances[acc.id] || 0);
            if (balance <= 0) return; // Si ya te pagaron, no lo mostramos en la lista principal
            totalReceivables += balance;

            list.innerHTML += `
                <div class="acc-list-item" onclick="openAccountDetail('${acc.id}', 'home')">
                    <div class="acc-list-name">
                        <span class="dot" style="background-color:var(--positive);"></span>
                        <div>
                            <span>${acc.name.replace('🤝 Me debe: ', '')}</span>
                            <small style="display:block; font-size:11px; color:var(--text-muted); font-weight:500;">Esperando cobro</small>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span class="acc-list-balance positive">${formatMoney(balance)}</span>
                        <span style="color:var(--text-muted); margin-left:8px; font-size:14px;">›</span>
                    </div>
                </div>`;
        });
        
        if (totalReceivables === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:20px 0;">Todas las deudas a favor han sido saldadas. ✅</p>';
        }
    }
    totalEl.innerText = formatMoney(totalReceivables);
};

// --- LÓGICA DE FORMULARIO: CREAR DEUDA A FAVOR ---
const populateReceivableAccounts = () => {
    const select = document.getElementById('new-recv-account');
    if (!select) return;
    const assets = financeData.customAccounts.filter(a => a.category === 'asset' && !a.id.startsWith('CxC_'));
    let html = '<option value="adjustment">Ya lo presté (Solo registrar saldo a favor)</option>';
    html += `<optgroup label="Descontar dinero ahora mismo de:">`;
    assets.forEach(a => { html += `<option value="${a.id}">${a.name}</option>`; });
    html += `</optgroup>`;
    select.innerHTML = html;
};

// Lógica de Pestañas en el Modal de Deudas
document.querySelectorAll('#debts-type-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#debts-type-pills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const type = btn.getAttribute('data-type');
        if (type === 'payable') {
            document.getElementById('debts-payable-view').classList.remove('hidden');
            document.getElementById('debts-receivable-view').classList.add('hidden');
        } else {
            document.getElementById('debts-payable-view').classList.add('hidden');
            document.getElementById('debts-receivable-view').classList.remove('hidden');
            renderReceivablesBreakdown();
            populateReceivableAccounts();
        }
    });
});

// Alternar campos según el motivo de la deuda a favor
document.getElementById('new-recv-type')?.addEventListener('change', (e) => {
    const isLoan = e.target.value === 'loan';
    document.getElementById('group-new-recv-account')?.classList.toggle('hidden', !isLoan);
    document.getElementById('group-new-recv-category')?.classList.toggle('hidden', isLoan);
});

// Guardar nueva deuda a favor
document.getElementById('new-receivable-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawName = document.getElementById('new-recv-name').value.trim();
    const amount = parseMoneyInput(document.getElementById('new-recv-amount').value);
    const type = document.getElementById('new-recv-type')?.value || 'loan';
    
    if (!rawName || amount <= 0) return;

    const accId = 'CxC_' + rawName.replace(/\s+/g, '_');

    // Crear la cuenta si no existe (Cero emojis en la DB)
    if (!financeData.customAccounts.some(a => a.id === accId)) {
        financeData.customAccounts.push({ id: accId, name: `Me debe: ${rawName}`, category: 'asset', isDefault: false, showWhenZero: true });
    }

    const now = new Date();
    const mId = getMonthId(now);
    const dateStr = `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;

    if (type === 'loan') {
        const sourceAcc = document.getElementById('new-recv-account')?.value;
        if (sourceAcc === 'adjustment') {
            // Ajuste directo (saldo inicial) sin restar de otra cuenta
            financeData.transactions.push({
                id: now.getTime(), monthId: mId, type: 'income', status: 'closed',
                account: accId, description: 'Saldo Inicial (Préstamo a favor)', amount: amount,
                date: dateStr, isAdjustment: true
            });
        } else {
            // Transferencia automática de tu cuenta a la cuenta por cobrar
            financeData.transactions.push({
                id: now.getTime(), monthId: mId, type: 'transfer', status: 'closed',
                account: sourceAcc, toAccount: accId, description: `Préstamo a ${rawName}`, amount: amount,
                date: dateStr, isAdjustment: false
            });
        }
    } else if (type === 'sale') {
        // Ingreso por venta o servicio
        const catVal = document.getElementById('new-recv-category')?.value || 'Otros Ingresos::General';
        const [catName, subName] = catVal.split('::');
        financeData.transactions.push({
            id: now.getTime(), monthId: mId, type: 'income', status: 'closed',
            account: accId, category: catName, subcategory: subName || 'General',
            description: `Venta/Servicio por cobrar a ${rawName}`, amount: amount,
            date: dateStr, isAdjustment: false
        });
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    e.target.reset();
    document.getElementById('new-recv-type')?.dispatchEvent(new Event('change'));
    setTimeout(() => e.target.closest('details')?.removeAttribute('open'), 50);
    hasUnsavedChanges = false;
    updateDashboard();
    
    // Refrescar modal de cuentas por cobrar si está abierto
    if (typeof renderReceivablesBreakdown === 'function' && typeof currentBalances !== 'undefined') {
        renderReceivablesBreakdown(currentBalances);
    }
    
    alert(`Deuda a favor de ${formatMoney(amount)} registrada a nombre de ${rawName}.`);
});

// --- LÓGICA VISUAL: AHORRO DE MONEDAS EN EFECTIVO (DENOMINACIONES COLOMBIA) ---
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
            ? (completesBill5k
                ? `Sugerido: guardar ${formatMoney(suggested)} (completar ${formatMoney(amount + suggested)})`
                : `Sugerido: guardar ${formatMoney(suggested)} (vuelto en monedas)`)
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
                    if (coinInput) {
                        coinInput.value = formatNumberInput(val);
                        userEditedCoinAmount = true;
                    }
                });
            });
        }

        if (coinInput && !userEditedCoinAmount) {
            coinInput.value = formatNumberInput(suggested);
        }

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
    if (e.target.checked) {
        fields?.classList.remove('hidden');
        updateCoinRoundingUI();
    } else {
        fields?.classList.add('hidden');
    }
});

document.getElementById('coin-round-amount')?.addEventListener('input', () => {
    userEditedCoinAmount = true;
});

document.getElementById('account')?.addEventListener('change', updateCoinRoundingUI);
document.getElementById('amount')?.addEventListener('input', updateCoinRoundingUI);
document.getElementById('type')?.addEventListener('change', updateCoinRoundingUI);

// --- INIT APP ---
applyColorModeUI(localStorage.getItem('myFinancesColorMode') || 'auto');
applyThemeUI(localStorage.getItem('myFinancesTheme') || 'purple');
applyWidgetOrder();
initDashboardDragAndControls();
renderAccountSelects();
renderCategoryOptions('expense');
renderTaxParamsUI();
renderSalaryUI(false);
initAuthUI(false);
updateDashboard();
// Listener para desplegar los campos de "Quién me debe"
document.getElementById('is-shared-expense')?.addEventListener('change', (e) => {
    const fields = document.getElementById('shared-expense-fields');
    if (e.target.checked) fields?.classList.remove('hidden');
    else fields?.classList.add('hidden');
});

// --- LÓGICA DEL MODAL DE EDICIÓN DE SUBCATEGORÍAS ---
window.openSubcatMonthsConfig = (catName, subName, type = 'expense') => {
    const modalEl = document.getElementById('subcat-months-modal');
    const gridEl = document.getElementById('subcat-12months-grid');
    if (!modalEl || !gridEl) return;

    const catObj = financeData.categories[type].find(c => c.name === catName);
    if (!catObj) return;
    const subObj = catObj.subcategories.find(s => s.name === subName);
    if (!subObj) return;

    document.getElementById('subcat-months-cat-name').value = catName;
    document.getElementById('subcat-months-target-name').value = subName;
    document.getElementById('subcat-months-title').innerText = `Editar: ${subName}`;
    document.getElementById('subcat-edit-name-input').value = subName;
    
    if (document.getElementById('subcat-edit-rollover')) document.getElementById('subcat-edit-rollover').value = subObj.rollover || 'none';
    if (document.getElementById('subcat-edit-is-fixed')) document.getElementById('subcat-edit-is-fixed').checked = !!subObj.isFixed;
    
    const shortMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    gridEl.innerHTML = shortMonths.map((mName, idx) => `
        <div class="form-group" style="margin-bottom:6px;">
            <label style="font-size:10.5px;">${mName}</label>
            <input type="text" inputmode="decimal" id="sub-b-m-${idx}" class="money-input" placeholder="0" style="padding:6px 8px; font-size:13px !important; min-height:36px !important;">
        </div>`).join('');

    setTimeout(() => {
        gridEl.querySelectorAll('.money-input').forEach(input => {
            input.addEventListener('input', (e) => applyLiveDecimalFormatting(e.target));
        });
    }, 50);

    const switchEl = document.getElementById('subcat-is-monthly-check');
    const generalInput = document.getElementById('subcat-general-limit-input');
    const freqSelect = document.getElementById('subcat-freq-select');
    const monthSelect = document.getElementById('subcat-month-select');

    if (freqSelect) {
        freqSelect.value = subObj.frequency || 'monthly';
        // Eliminamos el onchange que bloqueaba el mes
    }
    if (monthSelect) {
        monthSelect.value = subObj.startMonth || 0;
        monthSelect.disabled = false; // Forzamos a que siempre esté libre
    }

    if (subObj.isMonthly) {
        if (switchEl) switchEl.checked = true;
        document.getElementById('subcat-general-limit-box')?.classList.add('hidden');
        gridEl.classList.remove('hidden');
        for (let i = 0; i < 12; i++) {
            const val = subObj.months ? (subObj.months[i] || 0) : 0;
            document.getElementById(`sub-b-m-${i}`).value = val > 0 ? formatNumberInput(val) : '';
        }
        if (generalInput) generalInput.value = subObj.limit > 0 ? formatNumberInput(subObj.limit) : '';
    } else {
        if (switchEl) switchEl.checked = false;
        document.getElementById('subcat-general-limit-box')?.classList.remove('hidden');
        gridEl.classList.add('hidden');
        if (generalInput) generalInput.value = subObj.limit > 0 ? formatNumberInput(subObj.limit) : '';
        for (let i = 0; i < 12; i++) {
            const inputM = document.getElementById(`sub-b-m-${i}`);
            if(inputM) inputM.value = subObj.limit > 0 ? formatNumberInput(subObj.limit) : '';
        }
    }
    hasUnsavedChanges = false;
    modalEl.classList.remove('hidden');
};

document.getElementById('subcat-is-monthly-check')?.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.getElementById('subcat-general-limit-box')?.classList.add('hidden');
        document.getElementById('subcat-12months-grid')?.classList.remove('hidden');
        
        // Autollenado inteligente según frecuencia seleccionada
        const limit = parseMoneyInput(document.getElementById('subcat-general-limit-input')?.value);
        const freq = document.getElementById('subcat-freq-select')?.value || 'monthly';
        const startM = parseInt(document.getElementById('subcat-month-select')?.value, 10) || 0;
        
        for (let i = 0; i < 12; i++) {
            const input = document.getElementById(`sub-b-m-${i}`);
            if (input) {
                if (isPeriodMatching(freq, startM, i)) {
                    input.value = limit > 0 ? formatNumberInput(limit) : '';
                } else {
                    input.value = '';
                }
            }
        }
    } else {
        document.getElementById('subcat-general-limit-box')?.classList.remove('hidden');
        document.getElementById('subcat-12months-grid')?.classList.add('hidden');
    }
});

document.getElementById('subcat-months-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const catName = document.getElementById('subcat-months-cat-name').value;
    const oldSubName = document.getElementById('subcat-months-target-name').value;
    const newSubName = document.getElementById('subcat-edit-name-input').value.trim();
    
    if (!newSubName) return;

    const catObj = financeData.categories[currentBudgetType].find(c => c.name === catName);
    if (!catObj) return;
    
    const subObj = catObj.subcategories.find(s => s.name === oldSubName);
    if (!subObj) return;

    // Cascada de renombrado a transacciones históricas
    if (oldSubName !== newSubName) {
        subObj.name = newSubName;
        financeData.transactions.forEach(t => {
            if (t.category === catName && t.type === currentBudgetType && t.subcategory === oldSubName) {
                t.subcategory = newSubName;
            }
        });
    }

    subObj.rollover = document.getElementById('subcat-edit-rollover')?.value || 'none';
    subObj.isFixed = !!document.getElementById('subcat-edit-is-fixed')?.checked;
    const isMonthly = !!document.getElementById('subcat-is-monthly-check')?.checked;

    if (isMonthly) {
        const months = [];
        for (let i = 0; i < 12; i++) {
            const el = document.getElementById(`sub-b-m-${i}`);
            months.push(el ? parseMoneyInput(el.value) : 0);
        }
        subObj.isMonthly = true;
        subObj.months = months;
        subObj.limit = parseMoneyInput(document.getElementById('subcat-general-limit-input')?.value);
        subObj.frequency = 'monthly';
        subObj.startMonth = 0;
    } else {
        subObj.isMonthly = false;
        subObj.months = [];
        subObj.limit = parseMoneyInput(document.getElementById('subcat-general-limit-input')?.value);
        subObj.frequency = document.getElementById('subcat-freq-select')?.value || 'monthly';
        subObj.startMonth = parseInt(document.getElementById('subcat-month-select')?.value, 10) || 0;
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    document.getElementById('subcat-months-modal')?.classList.add('hidden');
    renderCategoryOptions(document.getElementById('type')?.value || 'expense');
    renderBudgetView();
    updateDashboard();
});

document.getElementById('close-subcat-months-btn')?.addEventListener('click', () => {
    document.getElementById('subcat-months-modal')?.classList.add('hidden');
});

document.getElementById('toggle-archived-cats')?.addEventListener('change', renderBudgetView);
// ... llamadas finales de inicialización de app.js ...
applyColorModeUI(localStorage.getItem('myFinancesColorMode') || 'auto');
applyThemeUI(localStorage.getItem('myFinancesTheme') || 'purple');
applyWidgetOrder();
initDashboardDragAndControls();
renderAccountSelects();
renderCategoryOptions('expense');
initAuthUI();
updateDashboard();

// --- REGISTRO Y ACTUALIZACIÓN AUTOMÁTICA DEL SERVICE WORKER (iOS PWA) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });

            const promptUpdate = (worker) => {
                if (!worker) return;
                const toast = document.getElementById('sw-update-toast');
                if (toast) toast.classList.remove('hidden');
                worker.postMessage({ type: 'SKIP_WAITING' });
            };

            if (reg.waiting) promptUpdate(reg.waiting);

            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        promptUpdate(newWorker);
                    }
                });
            });

            // Revisar actualizaciones cada vez que el iPhone trae la PWA al frente
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    reg.update().catch(() => {});
                }
            });
        } catch (err) {
            console.warn('SW error:', err);
        }
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });
}
// --- MODO PRIVACIDAD ---
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

    // Refrescar vistas para aplicar o quitar asteriscos
    updateDashboard(); 
    if (document.getElementById('profile-salary-view') && !document.getElementById('profile-salary-view').classList.contains('hidden')) {
        renderSalaryUI(false);
    }
});

// Configurar ícono correcto al cargar la página
if (isPrivacyMode) {
    document.querySelector('#toggle-privacy-btn .privacy-icon-open')?.classList.add('hidden');
    document.querySelector('#toggle-privacy-btn .privacy-icon-closed')?.classList.remove('hidden');
}
// --- 17. EJECUCIÓN DE CIERRE DE AÑO ASÍNCRONO (INDEXEDDB) ---
document.getElementById('btn-archive-year')?.addEventListener('click', async () => {
    const yearInput = document.getElementById('archive-year-input')?.value;
    const targetYear = parseInt(yearInput, 10);
    
    if (!targetYear || targetYear < 2000 || targetYear > 2050) {
        alert('Por favor, ingresa un año válido para archivar (Ej. 2024).');
        return;
    }

    if (!confirm(`⚠️ ATENCIÓN: Se van a comprimir todos los movimientos del año ${targetYear} y anteriores.\n\nSe reemplazarán por saldos iniciales consolidados en localStorage y el historial detallado se moverá silenciosamente a la base de datos profunda (IndexedDB).\n\n¿Estás completamente seguro de continuar?`)) {
        return;
    }

    const btn = document.getElementById('btn-archive-year');
    const originalText = btn.innerText;
    btn.innerText = 'Archivando...';
    btn.disabled = true;

    try {
        // Llamada asíncrona al core
        const result = await archiveYearData(targetYear);
        
        if (result.success) {
            if (result.deleted > 0) {
                alert(`✅ Cierre exitoso.\n\nSe comprimieron ${result.deleted} movimientos antiguos en ${result.added} saldos consolidados.\nEl historial detallado está a salvo en IndexedDB y tu localStorage ahora es más rápido.`);
                document.getElementById('archive-year-input').value = '';
                updateDashboard(); // Refrescar la UI con los nuevos saldos
            } else {
                alert(`ℹ️ No se encontraron movimientos cerrados en ${targetYear} o años anteriores para comprimir.`);
            }
        } else {
            alert('❌ Ocurrió un error al guardar en la base de datos profunda. No se borró ningún dato por seguridad.');
        }
    } catch (error) {
        alert('❌ Error inesperado durante la compresión.');
        console.error(error);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});
// --- 17. ENRUTADOR GLOBAL Y NAVEGACIÓN (DRAWER, FAB, BOTTOM NAV Y PERFIL) ---
const initGlobalNavigation = () => {
    // 1. FAB (Botón Flotante)
    document.getElementById('fab-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('fab-menu')?.classList.toggle('hidden');
        document.getElementById('fab-btn')?.classList.toggle('active');
    });

    // 3. Side Drawer (Abrir/Cerrar)
    document.getElementById('open-drawer-btn')?.addEventListener('click', openSideDrawer);
    document.getElementById('close-drawer-btn')?.addEventListener('click', closeSideDrawer);
    document.getElementById('side-drawer-backdrop')?.addEventListener('click', closeSideDrawer);

    // 4. Enrutamiento de Botones del Side Drawer
    const drawerRoutes = {
        'drawer-accounts': () => { document.getElementById('accounts-modal')?.classList.remove('hidden'); document.getElementById('accounts-list-view')?.classList.remove('hidden'); },
        'drawer-cards': () => { document.getElementById('cards-modal')?.classList.remove('hidden'); },
        'drawer-debts': () => { document.getElementById('debts-modal')?.classList.remove('hidden'); document.getElementById('debts-payable-view')?.classList.remove('hidden'); },
        'drawer-debt-planner': () => { document.getElementById('debt-planner-modal')?.classList.remove('hidden'); if(typeof renderDebtPlanner === 'function') renderDebtPlanner(); },
        'drawer-pockets': () => { document.getElementById('pockets-modal')?.classList.remove('hidden'); if(typeof renderPocketsView === 'function') renderPocketsView(); },
        'drawer-budget': () => { document.getElementById('budget-modal')?.classList.remove('hidden'); if(typeof renderBudgetView === 'function') renderBudgetView(); setActiveNav(document.getElementById('nav-budget')); },
        'drawer-expenses': () => { document.getElementById('expenses-modal')?.classList.remove('hidden'); },
        'drawer-subscriptions': () => { document.getElementById('subscriptions-modal')?.classList.remove('hidden'); if(typeof renderSubscriptionsView === 'function') renderSubscriptionsView(); },
        'drawer-salary': () => { document.getElementById('profile-modal')?.classList.remove('hidden'); document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-salary-view')?.classList.remove('hidden'); },
        'drawer-health': () => { document.getElementById('widget-financial-health')?.click(); },
        'drawer-analytics': () => { document.getElementById('analytics-modal')?.classList.remove('hidden'); },
        'drawer-annual': () => { document.getElementById('annual-control-modal')?.classList.remove('hidden'); if(typeof renderAnnualControlTable === 'function') renderAnnualControlTable(); },
        'drawer-assets': () => { document.getElementById('assets-modal')?.classList.remove('hidden'); if(typeof renderAssetsBreakdown === 'function') renderAssetsBreakdown(); },
        'drawer-tax': () => { document.getElementById('profile-modal')?.classList.remove('hidden'); document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-tax-params-view')?.classList.remove('hidden'); if(typeof renderTaxParamsUI === 'function') renderTaxParamsUI(); },
        'drawer-backup': () => { document.getElementById('profile-modal')?.classList.remove('hidden'); document.getElementById('profile-main-view')?.classList.add('hidden'); document.getElementById('profile-backup-view')?.classList.remove('hidden'); }
    };

    Object.keys(drawerRoutes).forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.dataset.boundRoute) {
            el.dataset.boundRoute = '1';
            el.addEventListener('click', (e) => {
                closeSideDrawer();
                if (attemptCloseModals()) drawerRoutes[id]();
            });
        }
    });

    // 5. Bottom Nav
    document.getElementById('nav-home')?.addEventListener('click', () => {
        if(attemptCloseModals()) setActiveNav(document.getElementById('nav-home'));
    });
    document.getElementById('nav-analytics')?.addEventListener('click', () => {
        if(attemptCloseModals()) { document.getElementById('analytics-modal')?.classList.remove('hidden'); setActiveNav(document.getElementById('nav-analytics')); }
    });
    document.getElementById('nav-budget')?.addEventListener('click', () => {
        if(attemptCloseModals()) { document.getElementById('budget-modal')?.classList.remove('hidden'); if(typeof renderBudgetView === 'function') renderBudgetView(); setActiveNav(document.getElementById('nav-budget')); }
    });

    // 6. Perfil y Submódulos
    document.getElementById('profile-trigger-btn')?.addEventListener('click', () => {
        if(attemptCloseModals()) {
            document.querySelectorAll('.profile-body').forEach(el => el.classList.add('hidden'));
            document.getElementById('profile-main-view')?.classList.remove('hidden');
            document.getElementById('profile-modal')?.classList.remove('hidden');
        }
    });

    ['salary', 'tax-params', 'theme', 'notifications', 'backup', 'security'].forEach(mod => {
        document.getElementById(`menu-${mod}-btn`)?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('profile-main-view')?.classList.add('hidden');
            document.getElementById(`profile-${mod}-view`)?.classList.remove('hidden');
            if (mod === 'tax-params' && typeof renderTaxParamsUI === 'function') renderTaxParamsUI();
        });
        document.getElementById(`back-from-${mod}-btn`)?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById(`profile-${mod}-view`)?.classList.add('hidden');
            document.getElementById('profile-main-view')?.classList.remove('hidden');
        });
    });

    // 7. Botones de cerrar modales universales
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        if (!btn.dataset.boundClose) {
            btn.dataset.boundClose = '1';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                attemptCloseModals();
            });
        }
    });
};

// Autoejecutar al cargar
document.addEventListener('DOMContentLoaded', () => {
    initGlobalNavigation();
});
// --- ACTUALIZACIÓN DINÁMICA DE EXPLICACIÓN DE ARRASTRE DE SALDO ---
const updateRolloverHint = (selectId, hintBoxId, titleId, descId) => {
    const selectEl = document.getElementById(selectId);
    const hintBox = document.getElementById(hintBoxId);
    if (!selectEl || !hintBox) return;

    const val = selectEl.value;
    const isExp = currentBudgetType === 'expense';
    
    if (val === 'none') {
        hintBox.classList.add('hidden');
        return;
    }

    const titleEl = document.getElementById(titleId);
    const descEl = document.getElementById(descId);
    
    hintBox.classList.remove('hidden');

    if (val === 'positive') {
        titleEl.innerText = isExp ? 'Guardar sobrante del mes (+)' : 'Exigir meta faltante (+)';
        descEl.innerText = isExp 
            ? 'Si tu límite es $100.000 y gastas $80.000, el próximo mes tendrás $120.000 (ideal para ahorrar para un regalo). Si gastas de más, no te castiga.' 
            : 'Si tu meta era $100.000 y solo ganaste $80.000, el próximo mes la meta subirá a $120.000 para exigirte recuperar lo perdido.';
    } else if (val === 'both') {
        titleEl.innerText = isExp ? 'Compensar Sobrante y Déficit (+/-)' : 'Compensar Faltante y Excedente (+/-)';
        descEl.innerText = isExp 
            ? 'Igual que el anterior, pero si te pasas y gastas $120.000, el próximo mes tu límite bajará a $80.000 para obligarte a compensar (ideal para servicios).' 
            : 'Igual que el anterior, pero si tienes un buen mes y ganas $120.000, el otro mes tu meta bajará a $80.000 porque ya vas adelantado en el año.';
    }
};

document.getElementById('new-cat-rollover')?.addEventListener('change', () => updateRolloverHint('new-cat-rollover', 'new-cat-rollover-hint', 'new-cat-rollover-title', 'new-cat-rollover-desc'));
document.getElementById('cat-edit-rollover')?.addEventListener('change', () => updateRolloverHint('cat-edit-rollover', 'edit-cat-rollover-hint', 'edit-cat-rollover-title', 'edit-cat-rollover-desc'));

// Asegurar que al cambiar de pestaña Gastos/Ingresos se actualice el texto si el aviso está visible
document.getElementById('tab-budget-expense')?.addEventListener('click', () => {
    setTimeout(() => {
        updateRolloverHint('new-cat-rollover', 'new-cat-rollover-hint', 'new-cat-rollover-title', 'new-cat-rollover-desc');
    }, 50);
});
document.getElementById('tab-budget-income')?.addEventListener('click', () => {
    setTimeout(() => {
        updateRolloverHint('new-cat-rollover', 'new-cat-rollover-hint', 'new-cat-rollover-title', 'new-cat-rollover-desc');
    }, 50);
});
document.getElementById('subcat-edit-rollover')?.addEventListener('change', () => updateRolloverHint('subcat-edit-rollover', 'subcat-edit-rollover-hint', 'subcat-edit-rollover-title', 'subcat-edit-rollover-desc'));

// --- PREFERENCIAS DE RENDIMIENTO (ANIMACIONES) ---
document.addEventListener('DOMContentLoaded', () => {
    if (financeData.preferences?.disableAnimations) {
        document.body.classList.add('no-animations');
        const animSwitch = document.getElementById('profile-enable-animations');
        if (animSwitch) animSwitch.checked = false;
    }
});

document.getElementById('profile-enable-animations')?.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    if (isEnabled) {
        document.body.classList.remove('no-animations');
    } else {
        document.body.classList.add('no-animations');
    }
    
    financeData.preferences = financeData.preferences || {};
    financeData.preferences.disableAnimations = !isEnabled;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
});
// --- PREFERENCIAS DE MONEDA (PARTE B) ---
function syncCurrencyPrefs() {
    const prefs = financeData.preferences || {};
    const showSymbolEl = document.getElementById('pref-show-symbol');
    const negFormatEl = document.getElementById('pref-negative-format');
    const decEl = document.getElementById('pref-decimals');

    if (showSymbolEl) showSymbolEl.checked = prefs.showCurrencySymbol !== false;
    if (negFormatEl) negFormatEl.value = prefs.negativeFormat || 'minus';
    if (decEl) decEl.value = prefs.decimals !== undefined ? prefs.decimals : 2;
}

['pref-show-symbol', 'pref-negative-format', 'pref-decimals'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', (e) => {
        if (!financeData.preferences) financeData.preferences = {};
        if (id === 'pref-show-symbol') financeData.preferences.showCurrencySymbol = e.target.checked;
        if (id === 'pref-negative-format') financeData.preferences.negativeFormat = e.target.value;
        if (id === 'pref-decimals') financeData.preferences.decimals = parseInt(e.target.value, 10);
        
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        updateDashboard();
    });
});// --- LÓGICA DE USABILIDAD (FASE 2) ---
document.getElementById('account-include-liquidity')?.addEventListener('change', (e) => {
    const accountId = document.getElementById('reconcile-account-id')?.value;
    const acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    acc.excludeFromLiquidity = !e.target.checked;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false; updateDashboard();
});

document.getElementById('notifications-config-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    financeData.notificationPrefs = {
        daysBefore: parseInt(document.getElementById('notif-days-before').value, 10) || 5,
        budgetPct: parseInt(document.getElementById('notif-budget-pct').value, 10) || 85,
        pendingEnabled: !!document.getElementById('notif-pending-enabled')?.checked
    };
    if (!financeData.preferences) financeData.preferences = {};
    financeData.preferences.showProjections = !!document.getElementById('pref-show-projections')?.checked;
    financeData.preferences.rememberAccount = !!document.getElementById('pref-remember-account')?.checked;
    financeData.preferences.rememberCategory = !!document.getElementById('pref-remember-category')?.checked;
    
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    
    // Le decimos a la app que ya no hay cambios pendientes para que no bloquee la salida
    hasUnsavedChanges = false; 
    
    // Mostramos tu alerta personalizada de éxito
    if (typeof showToast === 'function') {
        showToast('✅ Preferencias de alertas guardadas.');
    } else {
        alert('Preferencias de alertas guardadas.');
    }
    
    updateDashboard();
});

// Guardar Memoria al confirmar transacción
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'transaction-form') {
        if (financeData.preferences?.rememberAccount) {
            financeData.preferences.lastAccount = document.getElementById('account').value;
        }
        if (financeData.preferences?.rememberCategory && document.getElementById('type').value === 'expense') {
            financeData.preferences.lastCategory = document.getElementById('trans-category').value;
        }
        localStorage.setItem('myFinances', JSON.stringify(financeData));
    }
});

// Cargar Memoria al abrir modal de nuevo registro
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
                }
            }
        }, 60);
    }
}, true);
// --- LÓGICA DE AYUDA VISUAL (Liquidez de Cuenta) ---
const toggleLiquidityHint = (checkboxId, hintId) => {
    const check = document.getElementById(checkboxId);
    const hint = document.getElementById(hintId);
    if (!check || !hint) return;
    
    check.addEventListener('change', (e) => {
        if (e.target.checked) {
            hint.style.backgroundColor = '';
            hint.style.borderColor = '';
            hint.innerHTML = `
                <span style="display:flex; align-items:flex-start; gap:6px;">
                    <span style="color:var(--positive); display:inline-flex; flex-shrink:0;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </span>
                    <span><b>Cuenta Líquida (Activado):</b> El saldo sumará a tu Patrimonio y estará disponible para tu "Libre Seguro". Ideal para cuentas de nómina o efectivo de uso diario.</span>
                </span>`;
        } else {
            hint.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
            hint.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            hint.innerHTML = `
                <span style="display:flex; align-items:flex-start; gap:6px;">
                    <span style="color:#f59e0b; display:inline-flex; flex-shrink:0;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </span>
                    <span><b>Cuenta Aislada (Desactivado):</b> El saldo aparecerá en la Hoja de Balance, pero <b>NO sumará</b> a tu "Libre Seguro". Ideal para CDTs, ahorros intocables o fondos de emergencia.</span>
                </span>`;
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    toggleLiquidityHint('new-account-liquidity', 'new-account-liquidity-hint');
    toggleLiquidityHint('account-include-liquidity', 'edit-account-liquidity-hint');
});
// --- SISTEMA DE PAPELERA DE RECICLAJE (FASE 3A) ---
window.moveTxToTrash = (txId) => {
    const tx = financeData.transactions.find(t => String(t.id) === String(txId));
    if (!tx) return;
    if (typeof revertTransferAllocation === 'function' && tx.type === 'transfer') {
        revertTransferAllocation(tx);
    }
    tx.isDeleted = true;
    tx.deletedAt = Date.now();
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    forceCloseAllModals();
    updateDashboard();
    updateTrashBadge();
};

window.restoreTxFromTrash = (txId) => {
    const tx = financeData.transactions.find(t => String(t.id) === String(txId));
    if (!tx) return;
    delete tx.isDeleted;
    delete tx.deletedAt;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    renderTrashModal();
    updateDashboard();
    updateTrashBadge();
};

window.permanentlyDeleteTx = (txId) => {
    if (!confirm('¿Eliminar este movimiento definitivamente? Esta acción no se puede deshacer.')) return;
    financeData.transactions = financeData.transactions.filter(t => String(t.id) !== String(txId));
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    renderTrashModal();
    updateTrashBadge();
};

const updateTrashBadge = () => {
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

// Interceptar el botón Eliminar del formulario de edición para enviar a Papelera
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

document.addEventListener('DOMContentLoaded', updateTrashBadge);
// --- SISTEMA DE ETIQUETAS #TAGS (FASE 3B) ---
window.filterByTxTag = (tag, event) => {
    if (event) event.stopPropagation();
    const targetQuery = `#${String(tag).toLowerCase()}`;
    const searchInput = document.getElementById('history-search-input');

    if (historySearchQuery.toLowerCase() !== targetQuery) {
        historySearchQuery = targetQuery;
        if (searchInput) searchInput.value = targetQuery;
    }
    
    // Forzamos la navegación al historial de movimientos
    forceCloseAllModals();
    
    // Simulamos el clic en el botón inferior si existe
    const navHistoryBtn = document.getElementById('nav-analytics'); 
    
    // ATENCIÓN: Como la pestaña de historial a veces comparte espacio 
    // con otros elementos (o se abre desde el tablero), nos aseguramos de repintarlo todo.
    updateDashboard();
    
    // Si la app tiene scroll, bajamos hasta la lista de movimientos
    const listContainer = document.getElementById('transaction-list');
    if (listContainer) {
        listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
            const netTag = round2(tagInc - tagExp);
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

// Sincronizar etiquetas al abrir el modal (Nuevo o Editar)
const txModalEl = document.getElementById('transaction-modal');
if (txModalEl) {
    const txModalObserver = new MutationObserver(() => {
        if (!txModalEl.classList.contains('hidden')) {
            const editId = document.getElementById('edit-id')?.value;
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

// Capturar y guardar etiquetas al enviar #transaction-form
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
    }
}, true);

document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'transaction-form' && pendingTxTagsPayload) {
        const payload = pendingTxTagsPayload;
        pendingTxTagsPayload = null;

        // Solo aplicar si el modal se cerró exitosamente (no hubo error de validación)
        if (!document.getElementById('transaction-modal')?.classList.contains('hidden')) return;

        if (payload.editId) {
            const tx = financeData.transactions.find(t => String(t.id) === String(payload.editId));
            if (tx) {
                if (payload.tags.length > 0) tx.tags = payload.tags;
                else delete tx.tags;
            }
        } else if (financeData.transactions.length > payload.beforeCount) {
            // Aplicar etiquetas a los movimientos recién creados (incluye recurrentes)
            for (let i = payload.beforeCount; i < financeData.transactions.length; i++) {
                const newTx = financeData.transactions[i];
                if (newTx && !newTx.isAdjustment) {
                    if (payload.tags.length > 0) newTx.tags = [...payload.tags];
                }
            }
        }

        localStorage.setItem('myFinances', JSON.stringify(financeData));
        updateDashboard();
    }
}, false);
// --- FASE 4: ANALÍTICA GLOBAL DE #TAGS, CLONACIÓN Y REPORTE PDF ---
let analyticsTagsScope = 'all'; // 'all' = Histórico Total, 'month' = Mes Actual

window.renderAnalyticsTagsCard = () => {
    const container = document.getElementById('analytics-tags-list');
    const scopeBtn = document.getElementById('toggle-analytics-tags-scope');
    if (!container) return;

    if (scopeBtn) {
        scopeBtn.innerText = analyticsTagsScope === 'all' ? 'Histórico Total' : 'Mes Actual';
    }

    const activeMonthId = getMonthId(viewDate);
    const tagStats = {};
    financeData.transactions.forEach(t => {
        if (t.isDeleted || t.isAdjustment || !Array.isArray(t.tags) || t.tags.length === 0) return;
        if (analyticsTagsScope === 'month' && t.monthId !== activeMonthId) return;

        const amt = round2(t.status === 'pending' ? (t.budgetedAmount || t.amount) : t.amount);
        t.tags.forEach(rawTag => {
            const tg = String(rawTag).toLowerCase().trim();
            if (!tg) return;
            if (!tagStats[tg]) tagStats[tg] = { tag: tg, inc: 0, exp: 0, count: 0 };
            tagStats[tg].count++;
            if (t.type === 'income') tagStats[tg].inc = round2(tagStats[tg].inc + amt);
            else if (t.type === 'expense') tagStats[tg].exp = round2(tagStats[tg].exp + amt);
        });
    });

    const list = Object.values(tagStats).sort((a, b) => (b.exp + b.inc) - (a.exp + a.inc));
    if (list.length === 0) {
        const emptyMsg = analyticsTagsScope === 'month'
            ? 'No hay movimientos etiquetados en este mes. Toca <b>Mes Actual</b> para ver el histórico.'
            : 'Aún no tienes movimientos etiquetados. Escribe <b>#vacaciones</b> o <b>#proyecto</b> en el campo Etiquetas al guardar.';
        container.innerHTML = `<span style="color:var(--text-muted); font-size:11.5px; line-height:1.4;">${emptyMsg}</span>`;
        return;
    }

    container.innerHTML = list.map(item => {
        let rightHtml = '';
        if (item.inc > 0 && item.exp > 0) {
            rightHtml = `<span class="positive" style="font-size:11.5px; font-weight:700;">+${formatCompact(item.inc)}</span> <span style="color:var(--text-muted);">/</span> <span class="negative" style="font-size:11.5px; font-weight:700;">-${formatCompact(item.exp)}</span>`;
        } else if (item.inc > 0) {
            rightHtml = `<strong class="positive" style="font-size:13px;">+${formatMoney(item.inc)}</strong>`;
        } else {
            rightHtml = `<strong class="negative" style="font-size:13px;">-${formatMoney(item.exp)}</strong>`;
        }

        return `
            <div class="bs-row" style="padding:8px 6px;" onclick="forceCloseAllModals(); filterByTxTag('${item.tag}');">
                <div style="min-width:0;">
                    <span style="color:var(--accent); font-weight:800; font-size:13px;">#${item.tag}</span>
                    <small style="display:block; font-size:10.5px; color:var(--text-muted);">${item.count} movimiento${item.count !== 1 ? 's' : ''}</small>
                </div>
                <div style="text-align:right; flex-shrink:0;">${rightHtml}</div>
            </div>
        `;
    }).join('');
};

document.getElementById('toggle-analytics-tags-scope')?.addEventListener('click', (e) => {
    e.stopPropagation();
    analyticsTagsScope = analyticsTagsScope === 'all' ? 'month' : 'all';
    renderAnalyticsTagsCard();
});

// Mostrar/Ocultar botón Duplicar según si estamos editando o creando
const dupModalEl = document.getElementById('transaction-modal');
if (dupModalEl) {
    const dupObserver = new MutationObserver(() => {
        if (!dupModalEl.classList.contains('hidden')) {
            const editId = document.getElementById('edit-id')?.value;
            const dupBtn = document.getElementById('duplicate-tx-btn');
            if (dupBtn) dupBtn.classList.toggle('hidden', !editId);
        }
    });
    dupObserver.observe(dupModalEl, { attributes: true, attributeFilter: ['class'] });
}

// Acción de Clonar / Duplicar Movimiento con fecha y hora de hoy
document.getElementById('duplicate-tx-btn')?.addEventListener('click', () => {
    const editInput = document.getElementById('edit-id');
    if (!editInput || !editInput.value) return;

    editInput.value = '';
    document.getElementById('delete-btn')?.classList.add('hidden');
    document.getElementById('duplicate-tx-btn')?.classList.add('hidden');

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

// Generador de Estado de Cuenta Ejecutivo PDF
window.generateExecutivePdfReport = () => {
    const printBox = document.getElementById('print-report-container');
    if (!printBox) return;

    const viewMonthId = getMonthId(viewDate);
    const periodTitle = formatMonthName(viewDate);
    const snap = computeBalancesUpTo(viewMonthId);
    const flow = getMonthlyFlow(viewMonthId, false);
    const userName = (authData && authData.name) ? authData.name : 'Usuario';
    const todayStr = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

    const monthTxs = financeData.transactions
        .filter(t => !t.isDeleted && t.monthId === viewMonthId && isTxClosed(t))
        .sort((a, b) => b.id - a.id);

    const accountsRows = financeData.customAccounts
        .filter(a => !a.id.startsWith('CxC_') && Math.abs(round2(snap.bals[a.id] || 0)) > 0)
        .map(a => {
            const bal = round2(snap.bals[a.id] || 0);
            const isLiab = isLiabilityCategory(a.category);
            const catLabel = a.category === 'credit_card' ? 'Tarjeta de Crédito' : (a.category === 'debt' ? 'Préstamo / Deuda' : 'Liquidez');
            return `<tr>
                <td>${stripLeadingEmoji(a.name)}</td>
                <td>${catLabel}</td>
                <td class="print-text-right ${isLiab ? 'print-negative' : 'print-positive'}">${isLiab ? '-' : ''}${formatMoney(bal)}</td>
            </tr>`;
        }).join('');

    const txRows = monthTxs.length === 0
        ? `<tr><td colspan="5" class="print-text-center">Sin movimientos cerrados en este periodo.</td></tr>`
        : monthTxs.map(t => {
            const sign = t.type === 'income' ? '+' : (t.type === 'expense' ? '-' : '');
            const cls = t.type === 'income' ? 'print-positive' : (t.type === 'expense' ? 'print-negative' : '');
            const tagsStr = Array.isArray(t.tags) && t.tags.length > 0 ? ` [${t.tags.map(tg => '#' + tg).join(' ')}]` : '';
            const catStr = t.type === 'transfer' ? 'Transferencia' : cleanCatName(t.category || 'General');
            const accStr = t.type === 'transfer'
                ? `${stripLeadingEmoji(getAccountObj(t.account).name)} → ${stripLeadingEmoji(getAccountObj(t.toAccount).name)}`
                : stripLeadingEmoji(getAccountObj(t.account).name);
            return `<tr>
                <td>${t.date}</td>
                <td>${stripLeadingEmoji(t.description)}${tagsStr}</td>
                <td>${catStr}</td>
                <td>${accStr}</td>
                <td class="print-text-right ${cls}">${sign}${formatMoney(t.amount)}</td>
            </tr>`;
        }).join('');

    printBox.innerHTML = `
        <div class="print-header">
            <div class="print-brand">
                <div class="print-brand-icon">IF</div>
                <div>
                    <h1>Mis Finanzas</h1>
                    <span>Estado de Cuenta Mensual • Local-First</span>
                </div>
            </div>
            <div class="print-meta">
                <p>Titular: <strong>${userName}</strong></p>
                <p>Periodo: <strong style="text-transform:capitalize;">${periodTitle}</strong></p>
                <p>Generado: <strong>${todayStr}</strong></p>
            </div>
        </div>

        <div class="print-kpi-grid">
            <div class="print-kpi-box">
                <small>Ingresos del Mes</small>
                <strong class="print-positive">+${formatMoney(flow.inc)}</strong>
            </div>
            <div class="print-kpi-box">
                <small>Gastos del Mes</small>
                <strong class="print-negative">-${formatMoney(flow.exp)}</strong>
            </div>
            <div class="print-kpi-box">
                <small>Flujo Neto</small>
                <strong class="${flow.net >= 0 ? 'print-positive' : 'print-negative'}">${flow.net >= 0 ? '+' : ''}${formatMoney(flow.net)}</strong>
            </div>
            <div class="print-kpi-box">
                <small>Patrimonio Neto</small>
                <strong>${formatMoney(snap.netWorth)}</strong>
            </div>
        </div>

        <div class="print-section">
            <div class="print-section-title">Resumen de Cuentas y Obligaciones</div>
            <table class="print-table">
                <thead><tr><th>Cuenta / Producto</th><th>Tipo</th><th class="print-text-right">Saldo al Corte</th></tr></thead>
                <tbody>${accountsRows || '<tr><td colspan="3" class="print-text-center">Sin saldos registrados.</td></tr>'}</tbody>
            </table>
        </div>

        <div class="print-section">
            <div class="print-section-title">Detalle de Movimientos (${monthTxs.length})</div>
            <table class="print-table">
                <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Cuenta</th><th class="print-text-right">Monto</th></tr></thead>
                <tbody>${txRows}</tbody>
            </table>
        </div>

        <div class="print-footer">
            Documento informativo generado localmente sin conexión a servidores. Mis Finanzas (Función IF) v2.1.0.
        </div>
    `;

    setTimeout(() => window.print(), 120);
};

document.getElementById('btn-print-pdf-report')?.addEventListener('click', () => {
    generateExecutivePdfReport();
});
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderAnalyticsTagsCard === 'function') renderAnalyticsTagsCard();
});
// --- AUTO-SINCRONIZACIÓN DEL HISTORIAL DE MOVIMIENTOS ---
const ensureHistoryRendered = () => {
    const listEl = document.getElementById('transaction-list');
    if (!listEl || typeof renderTransactionHistory !== 'function') return;

    const viewMonthId = getMonthId(viewDate);
    const currentMonthId = getMonthId(currentDate);
    const snap = computeBalancesUpTo(viewMonthId);
    let projData = null;

    if (viewMonthId > currentMonthId && typeof simulateFutureLiquidity === 'function') {
        const sim = simulateFutureLiquidity(currentMonthId, viewMonthId, snap.assetsTotal);
        projData = {
            mode: 'hybrid',
            avgIncome: sim.avgInc,
            avgExpense: sim.avgExp,
            avgCashFlow: sim.avgNet,
            monthsDiff: sim.monthsDiff,
            currentLiquidity: snap.assetsTotal,
            projectedLiquidity: sim.projectedLiquidity
        };
    }

    try {
        renderTransactionHistory(viewMonthId, snap, projData);
    } catch (err) {
        console.error('Error al renderizar historial:', err);
        listEl.innerHTML = `<li style="text-align:center; padding:14px; color:var(--negative); font-size:12px;">Error en historial: ${err.message}</li>`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ensureHistoryRendered, 100);
});

['prev-month', 'next-month', 'today-month-btn', 'clear-day-filter-btn'].forEach(btnId => {
    document.getElementById(btnId)?.addEventListener('click', () => setTimeout(ensureHistoryRendered, 30));
});
document.getElementById('quick-month-input')?.addEventListener('change', () => setTimeout(ensureHistoryRendered, 30));
document.getElementById('history-search-input')?.addEventListener('input', () => setTimeout(ensureHistoryRendered, 30));
document.querySelectorAll('.pill-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(ensureHistoryRendered, 30));
});
document.getElementById('transaction-form')?.addEventListener('submit', () => setTimeout(ensureHistoryRendered, 80));
// --- CICLOS DE FECHA PERSONALIZADOS (FASE 5A) ---
const syncCycleStartDayUI = () => {
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

const updateCycleRangeBadge = () => {
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
    if (typeof ensureHistoryRendered === 'function') ensureHistoryRendered();
});

document.addEventListener('DOMContentLoaded', () => {
    syncCycleStartDayUI();
    updateCycleRangeBadge();
});

['prev-month', 'next-month', 'today-month-btn'].forEach(btnId => {
    document.getElementById(btnId)?.addEventListener('click', () => setTimeout(updateCycleRangeBadge, 20));
});
document.getElementById('quick-month-input')?.addEventListener('change', () => setTimeout(updateCycleRangeBadge, 20));

// --- MODO VIAJE COMPLETO Y ONBOARDING ---

window.renderTripModeBanner = () => {
    const banner = document.getElementById('active-trip-banner');
    const drawerBadge = document.getElementById('drawer-trip-badge');
    const trip = financeData.tripMode || { active: false };
    if (drawerBadge) drawerBadge.classList.toggle('hidden', !trip.active);
    if (!banner) return;
    if (!trip.active || !trip.name) { banner.classList.add('hidden'); banner.innerHTML = ''; return; }

    const st = computeActiveTripStats();
    const barColor = st.budget > 0 && st.spent > st.budget ? 'var(--negative)' : 'var(--accent)';
    const budgetLine = st.budget > 0
        ? `<div class="pace-bar-track" style="margin:8px 0 6px 0;"><div class="pace-bar-fill" style="width:${st.pct}%; background-color:${barColor};"></div></div>
           <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); font-weight:600;">
               <span>Tope viaje: <b style="color:var(--text-main);">${formatMoney(st.budget)}</b></span>
               <span style="color:${st.remaining >= 0 ? 'var(--positive)' : 'var(--negative)'}; font-weight:700;">${st.remaining >= 0 ? `Quedan ${formatMoney(st.remaining)}` : `Excedido ${formatMoney(Math.abs(st.remaining))}`}</span>
           </div>`
        : `<small style="display:block; font-size:11px; color:var(--text-muted); margin-top:4px;">Sin tope definido • ${st.count} gasto${st.count !== 1 ? 's' : ''} registrado${st.count !== 1 ? 's' : ''}</small>`;

    banner.classList.remove('hidden');
    banner.style.background = 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--card-bg)), var(--card-bg))';
    banner.style.borderColor = 'color-mix(in srgb, var(--accent) 35%, transparent)';
    banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div>
                <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; color:var(--accent);">Modo Viaje Activo • #${st.slug}</span>
                <h3 style="margin:2px 0 0 0; font-size:16px; font-weight:800;">${trip.name}</h3>
            </div>
            <div style="text-align:right;">
                <strong class="negative" style="font-size:16px;">-${formatMoney(st.spent)}</strong>
                <div style="display:flex; gap:5px; justify-content:flex-end; margin-top:4px;">
                    <button type="button" class="mini-action-btn" style="font-size:10px; padding:3px 8px;" onclick="forceCloseAllModals(); filterByTxTag('${st.slug}', event)">Ver gastos</button>
                    <button type="button" class="mini-action-btn" style="font-size:10px; padding:3px 8px; color:var(--text-muted);" onclick="document.getElementById('drawer-trip-mode')?.click()">Config.</button>
                </div>
            </div>
        </div>
        ${budgetLine}
    `;
};

const setTripModalStep = (step) => {
    const onboardView = document.getElementById('trip-onboarding-view');
    const formView = document.getElementById('trip-mode-form');
    const guideBtn = document.getElementById('btn-show-trip-guide');
    if (!onboardView || !formView) return;
    if (step === 'guide') {
        onboardView.classList.remove('hidden'); formView.classList.add('hidden');
        if (guideBtn) guideBtn.classList.add('hidden');
    } else {
        onboardView.classList.add('hidden'); formView.classList.remove('hidden');
        if (guideBtn) guideBtn.classList.remove('hidden');
    }
};

window.renderTripModeUI = () => {
    const allTripModals = document.querySelectorAll('#trip-mode-modal');
    if (allTripModals.length > 1) { for (let i = 1; i < allTripModals.length; i++) allTripModals[i].remove(); }
    const trip = financeData.tripMode || { active: false, name: '', budget: 0, isolateBudget: true };
    setTripModalStep(trip.active ? 'form' : 'guide');

    const activeEl = document.getElementById('trip-active-check');
    const nameEl = document.getElementById('trip-name-input');
    const budgetEl = document.getElementById('trip-budget-input');
    const isolateEl = document.getElementById('trip-isolate-check');
    const statsBox = document.getElementById('trip-modal-stats-box');

    if (activeEl) activeEl.checked = !!trip.active;
    if (nameEl) nameEl.value = trip.active ? (trip.name || '') : '';
    if (budgetEl) budgetEl.value = (trip.active && trip.budget > 0) ? formatNumberInput(trip.budget) : '';
    if (isolateEl) isolateEl.checked = trip.isolateBudget !== false;

    if (statsBox) {
        if (trip.active && trip.name) {
            const st = computeActiveTripStats();
            statsBox.classList.remove('hidden');
            statsBox.innerHTML = `<div style="display:flex; justify-content:space-between; font-size:12px;"><span>Acumulado en <b>#${st.slug}</b> (${st.count} mov.):</span><strong class="negative">-${formatMoney(st.spent)}</strong></div>`;
        } else {
            statsBox.classList.add('hidden');
            statsBox.innerHTML = '';
        }
    }
};

// Delegación global de clic
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-continue-trip-setup')) {
        setTripModalStep('form');
        const activeCheck = document.getElementById('trip-active-check');
        const nameEl = document.getElementById('trip-name-input');
        const budgetEl = document.getElementById('trip-budget-input');
        const isolateEl = document.getElementById('trip-isolate-check');
        const statsBox = document.getElementById('trip-modal-stats-box');
        if (activeCheck) activeCheck.checked = true;
        if (nameEl) nameEl.value = '';
        if (budgetEl) budgetEl.value = '';
        if (isolateEl) isolateEl.checked = true;
        if (statsBox) { statsBox.classList.add('hidden'); statsBox.innerHTML = ''; }
        setTimeout(() => nameEl?.focus(), 80);
    } else if (e.target.closest('#btn-show-trip-guide')) {
        setTripModalStep('guide');
    }
});

// Guardado infalible vía delegación (evita duplicados de listeners en modales)
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'trip-mode-form') {
        e.preventDefault();
        const isActive = !!document.getElementById('trip-active-check')?.checked;
        const name = document.getElementById('trip-name-input')?.value.trim() || '';
        const budget = parseMoneyInput(document.getElementById('trip-budget-input')?.value);
        const isolateBudget = !!document.getElementById('trip-isolate-check')?.checked;

        if (isActive && !name) {
            alert('Debes escribir un destino o nombre para el viaje.');
            return;
        }

        financeData.tripMode = isActive
            ? { active: true, name, tag: getTripTagSlug(name), budget, isolateBudget }
            : { active: false, name: '', tag: '', budget: 0, isolateBudget: true };
        
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        hasUnsavedChanges = false;
        
        document.getElementById('trip-mode-modal')?.classList.add('hidden');
        if (typeof forceCloseAllModals === 'function') forceCloseAllModals();
        
        if (typeof applyThemeUI === 'function') applyThemeUI();
        if (typeof renderTripModeBanner === 'function') renderTripModeBanner();
        if (typeof updateDashboard === 'function') updateDashboard();

        const scrollToTop = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            document.querySelectorAll('.app-container, main').forEach(el => { el.scrollTop = 0; });
        };
        scrollToTop();
        setTimeout(scrollToTop, 60);
    }
});

document.getElementById('trip-theme-color')?.addEventListener('input', (e) => {
    if (!financeData.preferences) financeData.preferences = {};
    financeData.preferences.tripTheme = e.target.value;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    if (financeData.tripMode && financeData.tripMode.active) applyThemeUI();
});

const tripTxModal = document.getElementById('transaction-modal');
if (tripTxModal) {
    const tripObserver = new MutationObserver(() => {
        if (!tripTxModal.classList.contains('hidden')) {
            const editId = document.getElementById('edit-id')?.value;
            const trip = financeData.tripMode;
            if (!editId && trip && trip.active && trip.name) {
                const tagsInput = document.getElementById('trans-tags');
                const slug = trip.tag || getTripTagSlug(trip.name);
                if (tagsInput && !tagsInput.value.includes(`#${slug}`)) {
                    tagsInput.value = `${tagsInput.value} #${slug}`.trim();
                    if (typeof renderTxModalTagSuggestions === 'function') renderTxModalTagSuggestions();
                }
            }
        }
    });
    tripObserver.observe(tripTxModal, { attributes: true, attributeFilter: ['class'] });
}

let tripBeforeSubmitCount = 0;
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'transaction-form') {
        tripBeforeSubmitCount = financeData.transactions.length;
    }
}, true);

document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'transaction-form') {
        const trip = financeData.tripMode;
        if (trip && trip.active && trip.name && financeData.transactions.length > tripBeforeSubmitCount) {
            const slug = trip.tag || getTripTagSlug(trip.name);
            for (let i = tripBeforeSubmitCount; i < financeData.transactions.length; i++) {
                const tx = financeData.transactions[i];
                if (tx && tx.type === 'expense' && !tx.isAdjustment) {
                    tx.tripName = trip.name;
                    if (trip.isolateBudget !== false) tx.isTripIsolated = true;
                    if (!Array.isArray(tx.tags)) tx.tags = [];
                    if (!tx.tags.includes(slug)) tx.tags.push(slug);
                }
            }
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            if (typeof renderTripModeBanner === 'function') renderTripModeBanner();
            if (typeof updateDashboard === 'function') updateDashboard();
        }
    }
}, false);

// --- FASE 5C: SOPORTE MULTIMONEDA OFFLINE ---
let activeTxCurrency = 'COP';

document.getElementById('btn-save-rates')?.addEventListener('click', () => {
    const usd = parseMoneyInput(document.getElementById('rate-usd-input').value) || 4150;
    const eur = parseMoneyInput(document.getElementById('rate-eur-input').value) || 4420;
    if (!financeData.exchangeRates) financeData.exchangeRates = {};
    financeData.exchangeRates.USD = usd;
    financeData.exchangeRates.EUR = eur;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    alert('Tasas de cambio actualizadas correctamente.');
});

document.getElementById('menu-currency-btn')?.addEventListener('click', () => {
    const rates = financeData.exchangeRates || { USD: 4150, EUR: 4420 };
    const usdInput = document.getElementById('rate-usd-input');
    const eurInput = document.getElementById('rate-eur-input');
    if (usdInput) usdInput.value = formatNumberInput(rates.USD);
    if (eurInput) eurInput.value = formatNumberInput(rates.EUR);
});

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
        
        // Limpiar el campo para evitar que se guarde un número gigante por accidente al cambiar de moneda
        const amtInput = document.getElementById('amount');
        if (amtInput) {
            amtInput.value = '';
            updateTxCurrencyPreview();
            amtInput.focus();
        }
    });
});

// Reseteamos el selector de moneda cada que abrimos el modal
const currencyTxModal = document.getElementById('transaction-modal');
if (currencyTxModal) {
    const currObserver = new MutationObserver(() => {
        if (!currencyTxModal.classList.contains('hidden')) {
            document.querySelectorAll('#tx-currency-pills .pill-btn').forEach(b => {
                const isCop = b.getAttribute('data-curr') === 'COP';
                b.classList.toggle('active', isCop);
                if (isCop) activeTxCurrency = 'COP';
            });
            const previewEl = document.getElementById('tx-currency-preview');
            if (previewEl) previewEl.classList.add('hidden');
        }
    });
    currObserver.observe(currencyTxModal, { attributes: true, attributeFilter: ['class'] });
}

// Interceptar y convertir la moneda justo antes de que se procese el submit global
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'transaction-form' && activeTxCurrency !== 'COP') {
        const inputEl = document.getElementById('amount');
        const descEl = document.getElementById('description');
        const tagsInput = document.getElementById('trans-tags');
        
        if (inputEl && descEl && tagsInput) {
            const rawForeign = parseMoneyInput(inputEl.value);
            const rate = (financeData.exchangeRates && financeData.exchangeRates[activeTxCurrency]) || (activeTxCurrency === 'USD' ? 4150 : 4420);
            const convertedCop = round2(rawForeign * rate);
            
            // 1. Sobreescribir el input visual con el valor real en pesos (COP) para que la lógica de guardado no se rompa
            inputEl.value = formatNumberInput(convertedCop);
            
            // 2. Modificar la descripción para que quede constancia del valor original
            descEl.value = `${descEl.value.trim()} [${formatNumberInput(rawForeign, 2)} ${activeTxCurrency}]`;
            
            // 3. Etiquetar automáticamente la moneda para que la puedas filtrar
            const currencyTag = `#${activeTxCurrency.toLowerCase()}`;
            if (!tagsInput.value.includes(currencyTag)) {
                tagsInput.value = `${tagsInput.value} ${currencyTag}`.trim();
            }
        }
    }
}, true); // UseCapture en true asegura que esto se ejecuta ANTES de que el formulario principal guarde los datos
// --- CONSULTA EN TIEMPO REAL API PÚBLICA (ER-API) ---
document.getElementById('btn-sync-rates')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = '↻ Consultando...';
    btn.disabled = true;

    try {
        if (!navigator.onLine) {
            throw new Error('No hay conexión a internet.');
        }

        // Consultar USD a COP
        const resUsd = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!resUsd.ok) throw new Error('Error al conectar con el servidor (USD).');
        const dataUsd = await resUsd.json();
        const usdCop = dataUsd.rates.COP;

        // Consultar EUR a COP
        const resEur = await fetch('https://open.er-api.com/v6/latest/EUR');
        if (!resEur.ok) throw new Error('Error al conectar con el servidor (EUR).');
        const dataEur = await resEur.json();
        const eurCop = dataEur.rates.COP;

        if (usdCop && eurCop) {
            // Actualizar inputs visuales
            const usdInput = document.getElementById('rate-usd-input');
            const eurInput = document.getElementById('rate-eur-input');
            if (usdInput) usdInput.value = formatNumberInput(usdCop);
            if (eurInput) eurInput.value = formatNumberInput(eurCop);

            // Guardar en base de datos local
            if (!financeData.exchangeRates) financeData.exchangeRates = {};
            financeData.exchangeRates.USD = round2(usdCop);
            financeData.exchangeRates.EUR = round2(eurCop);
            localStorage.setItem('myFinances', JSON.stringify(financeData));

            alert(`✅ Tasas actualizadas con éxito desde ExchangeRate-API (open.er-api.com):\n\n1 USD = ${formatMoney(usdCop)} COP\n1 EUR = ${formatMoney(eurCop)} COP`);
        } else {
            throw new Error('Datos incompletos de la API.');
        }
    } catch (err) {
        alert(`⚠️ No se pudo consultar: ${err.message}\n\nRevisa tu conexión a internet o ingresa los valores manualmente.`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
// --- PROYECCIÓN DE EFECTIVO DÍA POR DÍA ---
let cashProjectionHorizon = 'eom'; // 'eom' | '15d' | '30d' | '60d'

const ensureCashProjectionModal = () => {
    let modalEl = document.getElementById('cash-projection-modal');
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.id = 'cash-projection-modal';
    modalEl.className = 'modal hidden';
    modalEl.innerHTML = `
        <div class="modal-content cash-proj-modal-box">
            <div class="modal-header" style="align-items:flex-start; flex-shrink:0;">
                <div>
                    <h3 style="margin:0; font-size:19px; font-weight:800;">Proyección de Efectivo</h3>
                    <small style="color:var(--text-muted); font-size:12px;">Anticipa cómo evolucionará tu liquidez</small>
                </div>
                <button type="button" class="btn-close-modal" aria-label="Cerrar">✕</button>
            </div>

            <div style="margin-bottom:12px; flex-shrink:0;">
                <select id="cash-proj-horizon-select" style="width:100%; font-weight:700; font-size:13px; padding:10px 12px;">
                    <option value="eom">Hasta fin de este mes</option>
                    <option value="15d">Próximos 15 días</option>
                    <option value="30d">Próximos 30 días</option>
                    <option value="60d">Próximos 60 días</option>
                </select>
            </div>

            <div class="cash-proj-hero">
                <div>
                    <span style="display:block; font-size:11.5px; font-weight:700; color:var(--text-muted);">Efectivo proyectado</span>
                    <small id="cash-proj-range-label" style="font-size:10.5px; color:var(--text-muted); font-weight:600;"></small>
                </div>
                <strong id="cash-proj-final-val" style="font-size:20px; font-weight:800; color:var(--positive);">$ 0,00</strong>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-shrink:0; padding:0 4px;">
                <strong style="font-size:12.5px; color:var(--text-main);">Movimientos y saldo por fecha</strong>
                <small style="font-size:10.5px; color:var(--text-muted);">Toca un día para ver detalle</small>
            </div>

            <div id="cash-proj-timeline-body" class="cash-proj-timeline-wrap"></div>

            <div id="cash-proj-summary-box" class="cash-proj-summary"></div>
        </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) modalEl.classList.add('hidden');
    });
    modalEl.querySelector('.btn-close-modal')?.addEventListener('click', () => {
        modalEl.classList.add('hidden');
    });
    modalEl.querySelector('#cash-proj-horizon-select')?.addEventListener('change', (e) => {
        cashProjectionHorizon = e.target.value;
        renderCashProjectionView();
    });

    return modalEl;
};

const renderCashProjectionView = () => {
    const modalEl = ensureCashProjectionModal();
    const sel = modalEl.querySelector('#cash-proj-horizon-select');
    if (sel) sel.value = cashProjectionHorizon;

    const eomDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const eomOpt = sel?.querySelector('option[value="eom"]');
    if (eomOpt) {
        eomOpt.textContent = `Hasta ${eomDate.getDate()} ${getShortMonthLabel(eomDate).toLowerCase()}. (Fin de mes)`;
    }

    const data = computeCashProjectionData(cashProjectionHorizon);
    const fmtValHtml = (v) => formatMoneyHtml(v);
    const fmtDayShort = (d) => `${d.getDate()} ${getShortMonthLabel(d).toLowerCase()}.`;
    const fmtWeekday = (d) => {
        const w = d.toLocaleDateString('es-CO', { weekday: 'long' });
        return w.charAt(0).toUpperCase() + w.slice(1);
    };

    const finalEl = modalEl.querySelector('#cash-proj-final-val');
    if (finalEl) {
        finalEl.innerHTML = fmtValHtml(data.endBalance);
        finalEl.style.color = data.endBalance >= 0 ? 'var(--positive)' : 'var(--negative)';
    }

    const rangeEl = modalEl.querySelector('#cash-proj-range-label');
    if (rangeEl) rangeEl.textContent = `${fmtDayShort(data.today)} – ${fmtDayShort(data.endDate)}`;

    const bodyEl = modalEl.querySelector('#cash-proj-timeline-body');
    if (bodyEl) {
        let html = `
            <div class="cash-proj-item" style="cursor:default;">
                <div class="cash-proj-left">
                    <div class="cash-proj-date-col">
                        <strong style="display:block; font-size:13px; color:var(--text-main);">Hoy</strong>
                        <small style="font-size:10.5px; color:var(--text-muted);">${fmtDayShort(data.today)}</small>
                    </div>
                    <div class="cash-proj-flows-col">
                        <span style="color:var(--text-muted); font-weight:600;">Efectivo disponible</span>
                    </div>
                </div>
                <div class="cash-proj-right">
                    <strong style="font-size:14px; color:${data.startBalance < 0 ? 'var(--negative)' : 'var(--text-main)'};">${fmtValHtml(data.startBalance)}</strong>
                    <small style="font-size:10px; color:var(--text-muted);">Saldo inicial</small>
                </div>
            </div>
        `;

        if (data.sortedDays.length === 0) {
            html += `<div style="text-align:center; padding:32px 12px; color:var(--text-muted); font-size:12.5px;">No hay ingresos ni pagos programados en este rango de fechas.</div>`;
        } else {
            data.sortedDays.forEach((day, idx) => {
                const incItems = day.items.filter(i => i.type === 'income');
                const expItems = day.items.filter(i => i.type === 'expense');
                const isLowest = day.dateStr === data.lowestDateStr && data.lowestBalance < data.startBalance;
                const balColor = day.endBalance < 0 ? 'var(--negative)' : (isLowest ? 'var(--accent)' : 'var(--text-main)');

                const flowsHtml = [
                    ...incItems.map(i => `<span class="positive">+ ${fmtValHtml(i.amount)}</span>`),
                    ...expItems.map(i => `<span class="negative">− ${fmtValHtml(i.amount)}</span>`)
                ].join('');

                const detailId = `cash-proj-det-${idx}`;
                const detailsRows = day.items.map(i => `
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">• ${i.label}</span>
                        <b class="${i.type === 'income' ? 'positive' : 'negative'}" style="flex-shrink:0;">${i.type === 'income' ? '+' : '−'}${fmtValHtml(i.amount)}</b>
                    </div>
                `).join('');

                html += `
                    <div style="border-bottom:1px solid var(--border-color);">
                        <div class="cash-proj-item ${isLowest ? 'is-lowest' : ''}" style="border-bottom:none;" onclick="document.getElementById('${detailId}')?.classList.toggle('hidden')">
                            <div class="cash-proj-left">
                                <div class="cash-proj-date-col">
                                    <strong style="display:block; font-size:13px; color:var(--text-main);">${fmtDayShort(day.dateObj)}</strong>
                                    <small style="font-size:10.5px; color:var(--text-muted);">${fmtWeekday(day.dateObj)}</small>
                                </div>
                                <div class="cash-proj-flows-col">${flowsHtml}</div>
                            </div>
                            <div class="cash-proj-right">
                                <strong style="font-size:14px; color:${balColor};">${fmtValHtml(day.endBalance)}</strong>
                                ${isLowest
                                    ? `<span class="widget-badge ${day.endBalance < 0 ? 'danger' : 'warn'}" style="font-size:9px; padding:1px 6px;">Punto bajo</span>`
                                    : `<small style="font-size:10px; color:var(--text-muted);">Saldo</small>`}
                            </div>
                        </div>
                        <div id="${detailId}" class="cash-proj-day-details hidden" style="margin:0 6px 10px 6px;">${detailsRows}</div>
                    </div>
                `;
            });
        }
        bodyEl.innerHTML = html;
    }

    const summaryEl = modalEl.querySelector('#cash-proj-summary-box');
    if (summaryEl) {
        const isNegLow = data.lowestBalance < 0;
        const lowColor = isNegLow ? 'var(--negative)' : 'var(--accent)';
        const [ly, lm, ld] = data.lowestDateStr.split('-').map(Number);
        const lowDateObj = new Date(ly, lm - 1, ld);
        const lowDateLabel = fmtDayShort(lowDateObj);

        summaryEl.innerHTML = `
            <div class="cash-proj-kpi-pair">
                <div class="cash-proj-kpi-card">
                    <small style="font-size:10.5px; color:var(--text-muted); font-weight:700;">Por recibir</small>
                    <strong class="positive" style="font-size:14px;">${fmtValHtml(data.totalIn)}</strong>
                </div>
                <div class="cash-proj-kpi-card">
                    <small style="font-size:10.5px; color:var(--text-muted); font-weight:700;">Por pagar</small>
                    <strong class="negative" style="font-size:14px;">${fmtValHtml(data.totalOut)}</strong>
                </div>
            </div>
            <div class="cash-proj-lowest-bar ${isNegLow ? 'is-negative' : ''}">
                <div>
                    <strong style="display:block; color:var(--text-main); font-size:12px;">Punto más bajo</strong>
                    <small style="font-size:10.5px; color:var(--text-muted);">El ${lowDateLabel}${isNegLow ? ' • Déficit de caja' : ''}</small>
                </div>
                <strong style="font-size:15px; color:${lowColor};">${fmtValHtml(data.lowestBalance)}</strong>
            </div>
        `;
    }
};

window.openCashProjectionModal = () => {
    const modalEl = ensureCashProjectionModal();
    renderCashProjectionView();
    modalEl.classList.remove('hidden');
};
// --- CALCULADORA DE AHORRO Y PROYECCIÓN (INTERÉS COMPUESTO) ---
const setupSavingsDrawerAccordion = () => {
    const pocketsBtn = document.getElementById('drawer-pockets');
    if (!pocketsBtn) return;
    pocketsBtn.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && /metas de ahorro/i.test(node.textContent)) {
            node.textContent = ' Bolsillos de Ahorro';
        }
    });
    const spanLabel = pocketsBtn.querySelector('span:not(.drawer-icon-box):not(.widget-badge)');
    if (spanLabel && /metas de ahorro/i.test(spanLabel.textContent)) {
        spanLabel.textContent = 'Bolsillos de Ahorro';
    }
};

document.addEventListener('DOMContentLoaded', setupSavingsDrawerAccordion);

const switchPocketsModalTab = (tabName = 'pockets') => {
    const modalContent = document.querySelector('#pockets-modal .modal-content');
    const headerTitle = modalContent?.querySelector('.modal-header h3');
    const tabsBar = document.getElementById('pockets-mode-tabs');
    const listView = document.getElementById('pockets-tab-list-view');
    const simView = document.getElementById('pockets-tab-sim-view');

    if (tabsBar) tabsBar.classList.add('hidden');

    if (tabName === 'simulator') {
        if (headerTitle) headerTitle.textContent = 'Calculadora de Ahorro';
        listView?.classList.add('hidden');
        simView?.classList.remove('hidden');
    } else {
        if (headerTitle) headerTitle.textContent = 'Bolsillos de Ahorro';
        simView?.classList.add('hidden');
        listView?.classList.remove('hidden');
    }
};

window.openSavingsSection = (section = 'pockets') => {
    const modalEl = document.getElementById('pockets-modal');
    if (!modalEl) return;
    modalEl.classList.remove('hidden');
    renderPocketsView();
    switchPocketsModalTab(section);
};

const initPocketsAndSimulatorTabs = () => {
    setupSavingsDrawerAccordion();
    const modalContent = document.querySelector('#pockets-modal .modal-content');
    if (!modalContent) return;

    if (document.getElementById('pockets-mode-tabs')) return;

    const headerEl = modalContent.querySelector('.modal-header');
    const existingNodes = Array.from(modalContent.children).filter(el => el !== headerEl);

    const listWrapper = document.createElement('div');
    listWrapper.id = 'pockets-tab-list-view';
    existingNodes.forEach(node => listWrapper.appendChild(node));

    const tabsBar = document.createElement('div');
    tabsBar.id = 'pockets-mode-tabs';
    tabsBar.className = 'segmented-control';
    tabsBar.style.marginBottom = '14px';
    tabsBar.innerHTML = `
        <button type="button" class="segmented-btn active" data-ptab="pockets">Mis Bolsillos</button>
        <button type="button" class="segmented-btn" data-ptab="simulator">Calculadora</button>
    `;

    const savedSim = JSON.parse(localStorage.getItem('myFinancesSavingsSim') || 'null') || {
        currentAge: 30,
        targetAge: 60,
        initial: 0,
        frequency: '12',
        contribution: 300000,
        annualRate: 8
    };

    const simWrapper = document.createElement('div');
    simWrapper.id = 'pockets-tab-sim-view';
    simWrapper.className = 'hidden';
    simWrapper.innerHTML = `
        <details class="changelog-accordion" style="margin-bottom:12px; background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245, 158, 11, 0.28); padding:11px 13px; box-shadow:none;">
            <summary style="font-size:12px; font-weight:800; color:#d97706;">
                <span style="display:inline-flex; align-items:center; gap:6px;">
                    ${renderIcon('help', 15)} ¿Cómo funciona esta calculadora?
                </span>
                <span>▾</span>
            </summary>
            <div style="margin-top:10px; padding-top:10px; border-top:1px dashed rgba(245, 158, 11, 0.3); font-size:11.5px; color:var(--text-muted); line-height:1.45; display:flex; flex-direction:column; gap:9px;">
                <div>
                    <strong style="color:var(--text-main); display:block; margin-bottom:2px;">1. El efecto "bola de nieve" (Interés Compuesto)</strong>
                    <span>Cada periodo (quincena, mes, trimestre o año) tus rendimientos se suman al saldo acumulado, de modo que el siguiente periodo ganas intereses sobre tu capital <b>más</b> los intereses anteriores.</span>
                </div>

                <div style="background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:10px; padding:9px 10px;">
                    <strong style="color:var(--text-main); display:block; margin-bottom:4px;">2. Fórmulas financieras (Estándar Colombia E.A.)</strong>
                    <div style="font-size:11px; display:flex; flex-direction:column; gap:3px;">
                        <span>• <b>Tasa periódica:</b> (1 + Tasa E.A.)<sup>1/periodos</sup> − 1</span>
                        <span>• <b>Nuevo saldo:</b> Saldo anterior × (1 + Tasa periódica) + Aporte</span>
                    </div>
                </div>

                <div style="background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:10px; padding:9px 10px;">
                    <strong style="color:var(--text-main); display:block; margin-bottom:4px;">3. Ejemplo paso a paso</strong>
                    <span>Imagina que tienes <b>30 años</b>, empiezas con <b>$ 1.000.000</b>, aportas <b>$ 300.000 mensuales</b> hasta los <b>40 años</b> (10 años = 120 meses) al <b>8% E.A.</b> (0,6434% mensual):</span>
                    <div style="margin-top:6px; padding-left:8px; border-left:2px solid var(--positive); font-size:11px; display:flex; flex-direction:column; gap:3px;">
                        <span>• <b>Mes 1:</b> Ganas <b>$ 6.434</b> de interés + $ 300.000 aporte = <b>$ 1.306.434</b></span>
                        <span>• <b>Mes 2:</b> Ganas <b>$ 8.406</b> de interés + $ 300.000 aporte = <b>$ 1.614.840</b></span>
                        <span>• <b>Año 10:</b> Tú pusiste <b>$ 37.000.000</b>, ganaste <b class="positive">+$ 19.196.207</b> en rendimientos y terminas con <b class="positive">$ 56.196.207</b>.</span>
                    </div>
                    <button type="button" id="btn-sav-sim-load-example" class="mini-action-btn" style="margin-top:8px; width:100%; justify-content:center; font-size:11px; padding:6px;">
                        Probar este ejemplo ahora
                    </button>
                </div>
            </div>
        </details>

        <form id="savings-simulator-form" class="sav-sim-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <strong style="font-size:13.5px; color:var(--text-main);">Tu escenario</strong>
                <span id="sav-sim-years-badge" class="sav-sim-horizon-pill">Horizonte: 30 años</span>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Edad actual</label>
                    <input type="number" id="sav-sim-age-now" min="15" max="90" value="${savedSim.currentAge}" required>
                </div>
                <div class="form-group">
                    <label>Edad objetivo</label>
                    <input type="number" id="sav-sim-age-goal" min="16" max="100" value="${savedSim.targetAge}" required>
                </div>
            </div>

            <div class="form-group">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <label style="margin:0;">Ahorro actual ($)</label>
                    <button type="button" id="btn-sav-sim-use-pockets" class="mini-action-btn" style="font-size:10px; padding:2px 8px;">Usar saldo bolsillos</button>
                </div>
                <input type="text" id="sav-sim-initial" class="money-input" inputmode="decimal" placeholder="0,00" value="${savedSim.initial > 0 ? formatNumberInput(savedSim.initial) : ''}">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Frecuencia aporte</label>
                    <select id="sav-sim-freq">
                        <option value="24" ${String(savedSim.frequency) === '24' ? 'selected' : ''}>Quincenal</option>
                        <option value="12" ${String(savedSim.frequency) === '12' ? 'selected' : ''}>Mensual</option>
                        <option value="4" ${String(savedSim.frequency) === '4' ? 'selected' : ''}>Trimestral</option>
                        <option value="1" ${String(savedSim.frequency) === '1' ? 'selected' : ''}>Anual</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Aporte periódico ($)</label>
                    <input type="text" id="sav-sim-contrib" class="money-input" inputmode="decimal" placeholder="0,00" value="${savedSim.contribution > 0 ? formatNumberInput(savedSim.contribution) : ''}">
                </div>
            </div>

            <div class="form-group" style="margin-bottom:12px;">
                <label>Rendimiento anual estimado (% E.A.)</label>
                <input type="text" id="sav-sim-rate" inputmode="decimal" placeholder="Ej. 8" value="${String(savedSim.annualRate).replace('.', ',')}">
                <small style="display:block; font-size:10.5px; color:var(--text-muted); margin-top:4px;">Puedes usar una tasa entre 0% y 30% anual.</small>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; display:flex; align-items:center; justify-content:center; gap:6px;">
                ${renderIcon('calculator', 15)} Calcular ahorro
            </button>
        </form>

        <div id="sav-sim-results-box"></div>

        <div class="sav-sim-note">
            <span style="color:var(--accent); flex-shrink:0; margin-top:1px;">${renderIcon('info', 15)}</span>
            <div>
                <strong style="display:block; color:var(--text-main); margin-bottom:2px;">Estimación, no garantía</strong>
                <span>El resultado no incluye inflación, retención en la fuente ni comisiones. El rendimiento real puede variar.</span>
            </div>
        </div>
    `;

    modalContent.appendChild(tabsBar);
    modalContent.appendChild(listWrapper);
    modalContent.appendChild(simWrapper);

    tabsBar.querySelectorAll('.segmented-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPocketsModalTab(btn.getAttribute('data-ptab')));
    });

    const syncHorizonLabel = () => {
        const aNow = parseInt(document.getElementById('sav-sim-age-now')?.value, 10) || 0;
        const aGoal = parseInt(document.getElementById('sav-sim-age-goal')?.value, 10) || 0;
        const diff = aGoal - aNow;
        const pill = document.getElementById('sav-sim-years-badge');
        if (pill) {
            pill.textContent = diff > 0 ? `Horizonte: ${diff} año${diff !== 1 ? 's' : ''}` : 'Revisa las edades';
        }
    };

    ['sav-sim-age-now', 'sav-sim-age-goal'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', syncHorizonLabel);
    });
    syncHorizonLabel();

    document.getElementById('btn-sav-sim-use-pockets')?.addEventListener('click', () => {
        const totalPockets = getPocketsTotalSaved();
        const initInput = document.getElementById('sav-sim-initial');
        if (initInput) {
            initInput.value = totalPockets > 0 ? formatNumberInput(totalPockets) : '';
            runSavingsSimulation();
        }
    });

    document.getElementById('btn-sav-sim-load-example')?.addEventListener('click', (e) => {
        const ageNowEl = document.getElementById('sav-sim-age-now');
        const ageGoalEl = document.getElementById('sav-sim-age-goal');
        const initEl = document.getElementById('sav-sim-initial');
        const freqEl = document.getElementById('sav-sim-freq');
        const contribEl = document.getElementById('sav-sim-contrib');
        const rateEl = document.getElementById('sav-sim-rate');

        if (ageNowEl) ageNowEl.value = '30';
        if (ageGoalEl) ageGoalEl.value = '40';
        if (initEl) initEl.value = formatNumberInput(1000000);
        if (freqEl) freqEl.value = '12';
        if (contribEl) contribEl.value = formatNumberInput(300000);
        if (rateEl) rateEl.value = '8';

        syncHorizonLabel();
        e.target.closest('details')?.removeAttribute('open');
        runSavingsSimulation(true);
    });

    document.getElementById('savings-simulator-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        runSavingsSimulation(true);
    });

    renderEmptySavingsPlaceholder();
};

const renderEmptySavingsPlaceholder = () => {
    const box = document.getElementById('sav-sim-results-box');
    if (!box) return;
    box.innerHTML = `
        <div class="sav-sim-card" style="text-align:center; padding:24px 16px;">
            <div style="width:42px; height:42px; border-radius:50%; background:var(--hover-bg); color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; margin-bottom:8px;">
                ${renderIcon('piggy', 20)}
            </div>
            <strong style="display:block; font-size:13.5px; color:var(--text-main); margin-bottom:4px;">Tu proyección aparecerá acá</strong>
            <small style="color:var(--text-muted); font-size:11.5px;">Completa el escenario y calcula para ver el crecimiento compuesto.</small>
        </div>
    `;
};

const runSavingsSimulation = (showAlertOnError = false) => {
    const box = document.getElementById('sav-sim-results-box');
    if (!box) return;

    const currentAge = parseInt(document.getElementById('sav-sim-age-now')?.value, 10) || 30;
    const targetAge = parseInt(document.getElementById('sav-sim-age-goal')?.value, 10) || 60;
    const initial = parseMoneyInput(document.getElementById('sav-sim-initial')?.value);
    const periodsPerYear = parseInt(document.getElementById('sav-sim-freq')?.value, 10) || 12;
    const contribution = parseMoneyInput(document.getElementById('sav-sim-contrib')?.value);
    const rawRateStr = (document.getElementById('sav-sim-rate')?.value || '0').replace(',', '.');
    const annualRate = Math.max(0, Math.min(30, parseFloat(rawRateStr) || 0));

    const simRes = calculateCompoundSavingsProjection({
        currentAge, targetAge, initial, periodsPerYear, contribution, annualRate
    });

    if (!simRes.valid) {
        if (showAlertOnError) alert('La edad objetivo debe ser mayor a la edad actual (máximo 70 años de proyección).');
        return;
    }

    localStorage.setItem('myFinancesSavingsSim', JSON.stringify({
        currentAge, targetAge, initial, frequency: String(periodsPerYear), contribution, annualRate
    }));

    const { years, totalAdded, finalSnap, principalPct, interestPct, timeline } = simRes;

    // Gráfica SVG de crecimiento compuesto
    const W = 320, H = 115, padL = 44, padR = 10, padT = 12, padB = 20;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const maxVal = Math.max(finalSnap.balance, 1000);
    const getX = (idx) => padL + (idx / Math.max(1, timeline.length - 1)) * plotW;
    const getY = (val) => padT + ((maxVal - val) / maxVal) * plotH;

    const balPts = timeline.map((pt, idx) => `${getX(idx).toFixed(1)},${getY(pt.balance).toFixed(1)}`);
    const capPts = timeline.map((pt, idx) => `${getX(idx).toFixed(1)},${getY(pt.contributed).toFixed(1)}`);
    const baseY = (padT + plotH).toFixed(1);
    const areaPath = `M ${padL},${baseY} L ${balPts.join(' L ')} L ${(padL + plotW).toFixed(1)},${baseY} Z`;

    const svgChart = `
        <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto; display:block; margin-top:8px;">
            <defs>
                <linearGradient id="savSimGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--positive)" stop-opacity="0.32"/>
                    <stop offset="100%" stop-color="var(--positive)" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="rgba(148,163,184,0.18)" stroke-dasharray="3,3"/>
            <line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="rgba(148,163,184,0.4)"/>
            <text x="${padL - 5}" y="${padT + 4}" text-anchor="end" font-size="8.5" fill="#94a3b8">${formatCompact(maxVal)}</text>
            <text x="${padL - 5}" y="${baseY}" text-anchor="end" font-size="8.5" fill="#94a3b8">$0</text>
            <path d="${areaPath}" fill="url(#savSimGrad)"/>
            <polyline fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-dasharray="4,3" points="${capPts.join(' ')}"/>
            <polyline fill="none" stroke="var(--positive)" stroke-width="2.4" stroke-linecap="round" points="${balPts.join(' ')}"/>
            <text x="${padL}" y="${H - 4}" text-anchor="start" font-size="9" fill="#94a3b8">${currentAge} años</text>
            <text x="${W - padR}" y="${H - 4}" text-anchor="end" font-size="9" font-weight="700" fill="var(--text-main)">${targetAge} años</text>
        </svg>
    `;

    const rowsHtml = timeline.slice(1).map(r => `
        <tr>
            <td style="text-align:left;">Año ${r.year} (${r.age}a)</td>
            <td>${formatCompact(r.contributed)}</td>
            <td class="positive">+${formatCompact(r.interest)}</td>
            <td><b>${formatCompact(r.balance)}</b></td>
        </tr>
    `).join('');

    box.innerHTML = `
        <div class="sav-sim-hero">
            <span style="display:block; font-size:11px; font-weight:700; color:var(--text-muted);">Capital proyectado a los ${targetAge} años</span>
            <div style="font-size:22px; font-weight:800; color:var(--positive); margin-top:2px;">${formatMoneyHtml(finalSnap.balance)}</div>
            <div class="sav-sim-bar-track">
                <div class="sav-sim-bar-principal" style="width:${principalPct}%;"></div>
                <div class="sav-sim-bar-interest" style="width:${interestPct}%;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:10.5px; font-weight:700;">
                <span style="color:var(--accent);">● Capital aportado (${principalPct}%)</span>
                <span class="positive">● Rendimientos (${interestPct}%)</span>
            </div>
            ${svgChart}
        </div>

        <div class="sav-sim-kpis">
            <div class="sav-sim-kpi">
                <small>Saldo inicial</small>
                <strong>${formatMoneyHtml(initial)}</strong>
            </div>
            <div class="sav-sim-kpi">
                <small>Aportes nuevos</small>
                <strong style="color:var(--accent);">${formatMoneyHtml(totalAdded)}</strong>
            </div>
            <div class="sav-sim-kpi">
                <small>Interés ganado</small>
                <strong class="positive">+${formatMoneyHtml(finalSnap.interest)}</strong>
            </div>
        </div>

        <details class="changelog-accordion" style="padding:10px 12px;">
            <summary style="font-size:11.5px; font-weight:700; color:var(--text-main);">
                <span>Ver evolución año por año (${years} años)</span>
                <span>▾</span>
            </summary>
            <div class="table-responsive" style="margin-top:8px; max-height:190px; overflow-y:auto;">
                <table class="amort-table" style="font-size:10.5px;">
                    <thead>
                        <tr>
                            <th style="text-align:left;">Edad</th>
                            <th>Aportado</th>
                            <th>Intereses</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        </details>
    `;
};
// --- 16. UI DE ASESORES INTELIGENTES, COMPRA CONSCIENTE, CIERRE DE MES Y GASTOS HORMIGA ---
const setupSmartAdvisorsDrawer = () => {
    if (document.getElementById('drawer-advisors-group')) return;
    const anchorGroup = document.getElementById('drawer-savings-group') || document.getElementById('drawer-pockets');
    if (!anchorGroup || !anchorGroup.parentNode) return;

    const groupDiv = document.createElement('div');
    groupDiv.id = 'drawer-advisors-group';
    groupDiv.className = 'drawer-accordion-group';

    const templateTrigger = document.querySelector('#side-drawer .drawer-accordion-trigger');
    let triggerBtn;

    if (templateTrigger) {
        triggerBtn = templateTrigger.cloneNode(true);
        triggerBtn.setAttribute('data-target', 'drawer-advisors-sublist');
        const iconBox = triggerBtn.querySelector('.drawer-icon-box');
        if (iconBox) {
            iconBox.style.background = 'color-mix(in srgb, var(--accent) 15%, transparent)';
            iconBox.style.color = 'var(--accent)';
            iconBox.innerHTML = renderIcon('calculator', 17);
        }
        triggerBtn.querySelectorAll('span, div').forEach(el => {
            if (!el.classList.contains('drawer-icon-box') && !el.classList.contains('drawer-chevron') && el.children.length === 0 && el.textContent.trim()) {
                el.textContent = 'Asesores Inteligentes';
            }
        });
        const chev = triggerBtn.querySelector('.drawer-chevron');
        if (chev) chev.style.transform = 'rotate(-90deg)';
    } else {
        triggerBtn = document.createElement('button');
        triggerBtn.type = 'button';
        triggerBtn.className = 'drawer-item drawer-accordion-trigger';
        triggerBtn.setAttribute('data-target', 'drawer-advisors-sublist');
        triggerBtn.innerHTML = `
            <span style="display:inline-flex; align-items:center; gap:12px;">
                <span class="drawer-icon-box" style="background:color-mix(in srgb, var(--accent) 15%, transparent); color:var(--accent);">${renderIcon('calculator', 17)}</span>
                <span>Asesores Inteligentes</span>
            </span>
            <span class="drawer-chevron" style="font-size:11px; color:var(--text-muted); transition:transform 0.2s; transform:rotate(-90deg);">▼</span>
        `;
    }

    const subList = document.createElement('div');
    subList.id = 'drawer-advisors-sublist';
    subList.className = 'drawer-accordion-content hidden';
    subList.innerHTML = `
        <button type="button" id="drawer-card-advisor" class="drawer-sub-item">
            <span class="drawer-icon-box" style="background:rgba(59, 130, 246, 0.14); color:#3b82f6;">${renderIcon('card', 15)}</span>
            <span>¿Con qué tarjeta pago?</span>
        </button>
        <button type="button" id="drawer-smart-purchase" class="drawer-sub-item">
            <span class="drawer-icon-box" style="background:rgba(16, 185, 129, 0.14); color:var(--positive);">${renderIcon('shield', 15)}</span>
            <span>Compra Inteligente</span>
        </button>
        <button type="button" id="drawer-credit-sim" class="drawer-sub-item">
            <span class="drawer-icon-box" style="background:rgba(239, 68, 68, 0.14); color:var(--negative);">${renderIcon('scale', 15)}</span>
            <span>Simulador de Crédito</span>
        </button>
        <button type="button" id="drawer-credit-compare" class="drawer-sub-item">
            <span class="drawer-icon-box" style="background:rgba(139, 92, 246, 0.14); color:#8b5cf6;">${renderIcon('arrow-up-right', 15)}</span>
            <span>Banco A vs. Banco B</span>
        </button>
        <button type="button" id="drawer-savings-calc" class="drawer-sub-item">
            <span class="drawer-icon-box" style="background:rgba(16, 185, 129, 0.14); color:var(--positive);">${renderIcon('trending-up', 15)}</span>
            <span>Calculadora de Ahorro</span>
        </button>
        <button type="button" id="drawer-month-recap" class="drawer-sub-item">
            <span class="drawer-icon-box" style="background:rgba(245, 158, 11, 0.14); color:#d97706;">${renderIcon('award', 15)}</span>
            <span>Resumen del Mes</span>
        </button>
    `;

    groupDiv.appendChild(triggerBtn);
    groupDiv.appendChild(subList);
    anchorGroup.insertAdjacentElement('afterend', groupDiv);
};

document.addEventListener('DOMContentLoaded', setupSmartAdvisorsDrawer);

// 1. MODAL: ¿CON QUÉ TARJETA PAGO HOY?
window.openCardAdvisorModal = () => {
    let modalEl = document.getElementById('card-advisor-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'card-advisor-modal';
        modalEl.className = 'modal hidden';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width:460px;">
                <div class="modal-header" style="align-items:flex-start;">
                    <div>
                        <h3 style="margin:0; font-size:18px; font-weight:800;">¿Con qué tarjeta pago hoy?</h3>
                        <small style="color:var(--text-muted); font-size:11.5px;">Compara días de gracia, cupo y exoneración de manejo</small>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Cerrar">✕</button>
                </div>
                <div class="form-row" style="margin-bottom:12px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Monto compra (opcional)</label>
                        <input type="text" id="card-adv-amount" class="money-input" inputmode="decimal" placeholder="0,00">
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Cuotas</label>
                        <select id="card-adv-installments">
                            <option value="1">1 cuota (Contado)</option>
                            <option value="2">2 cuotas</option>
                            <option value="3">3 cuotas</option>
                            <option value="6">6 cuotas</option>
                            <option value="12">12 cuotas</option>
                            <option value="24">24 cuotas</option>
                        </select>
                    </div>
                </div>
                <div id="card-adv-results-list" style="max-height:56vh; overflow-y:auto;"></div>
            </div>
        `;
        document.body.appendChild(modalEl);
        modalEl.addEventListener('click', (e) => { if (e.target === modalEl) modalEl.classList.add('hidden'); });
        modalEl.querySelector('.btn-close-modal')?.addEventListener('click', () => modalEl.classList.add('hidden'));
        modalEl.querySelector('#card-adv-amount')?.addEventListener('input', renderCardAdvisorResults);
        modalEl.querySelector('#card-adv-installments')?.addEventListener('change', renderCardAdvisorResults);
    }
    renderCardAdvisorResults();
    modalEl.classList.remove('hidden');
};

const renderCardAdvisorResults = () => {
    const listEl = document.getElementById('card-adv-results-list');
    if (!listEl) return;

    const amt = parseMoneyInput(document.getElementById('card-adv-amount')?.value);
    const inst = parseInt(document.getElementById('card-adv-installments')?.value, 10) || 1;
    const { cards } = evaluateBestCreditCardForPurchase(amt, inst, currentDate);

    if (cards.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding:24px 12px; color:var(--text-muted); font-size:12.5px;">No tienes tarjetas de crédito registradas todavía.</div>`;
        return;
    }

    listEl.innerHTML = cards.map((c, idx) => {
        const isBest = idx === 0 && c.hasEnoughCredit;
        const badgeHtml = !c.hasEnoughCredit
            ? `<span class="widget-badge danger" style="font-size:9.5px;">Cupo insuficiente</span>`
            : (isBest ? `<span class="widget-badge good" style="font-size:9.5px;">★ Mejor opción hoy</span>` : `<span class="widget-badge neutral" style="font-size:9.5px;">#${idx + 1}</span>`);

        return `
            <div class="advisor-card ${isBest ? 'is-best' : ''} ${!c.hasEnoughCredit ? 'is-disabled' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                    <strong style="font-size:14px; color:var(--text-main);">${c.name}</strong>
                    ${badgeHtml}
                </div>
                <div style="display:flex; justify-content:space-between; font-size:11.5px; color:var(--text-muted); margin-bottom:6px;">
                    <span>Plazo sin interés: <b style="color:var(--accent);">${c.daysToPayment} días</b> (${c.payDateStr})</span>
                    <span>Disp: <b class="${c.hasEnoughCredit ? 'positive' : 'negative'}">${formatCompact(c.available)}</b></span>
                </div>
                <div style="font-size:11px; color:var(--text-muted); display:flex; flex-direction:column; gap:2px; margin-bottom:8px;">
                    ${c.reasons.map(r => `<span>• ${r}</span>`).join('')}
                </div>
                ${c.hasEnoughCredit ? `
                    <button type="button" class="mini-action-btn" style="width:100%; justify-content:center; font-size:11px; padding:6px;" onclick="document.getElementById('card-advisor-modal')?.classList.add('hidden'); openOmniModal({ type: 'expense', account: '${c.id}', amount: ${amt > 0 ? amt : "''"}, installments: ${inst} });">
                        Registrar gasto con ${c.name}
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
};

// 2. MODAL: SIMULADOR DE COMPRA INTELIGENTE
window.openSmartPurchaseModal = () => {
    let modalEl = document.getElementById('smart-purchase-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'smart-purchase-modal';
        modalEl.className = 'modal hidden';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width:460px;">
                <div class="modal-header" style="align-items:flex-start;">
                    <div>
                        <h3 style="margin:0; font-size:18px; font-weight:800;">Simulador Compra Inteligente</h3>
                        <small style="color:var(--text-muted); font-size:11.5px;">Evalúa horas de trabajo, flujo de caja e intereses antes de comprar</small>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Cerrar">✕</button>
                </div>

                <div class="form-group">
                    <label>¿Cuánto cuesta lo que quieres comprar? ($)</label>
                    <input type="text" id="sp-sim-amount" class="money-input" inputmode="decimal" placeholder="Ej. 450.000">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Medio de pago</label>
                        <select id="sp-sim-method"></select>
                    </div>
                    <div class="form-group" id="sp-sim-inst-group">
                        <label>Cuotas</label>
                        <select id="sp-sim-installments">
                            <option value="1">1 cuota</option>
                            <option value="2">2 cuotas</option>
                            <option value="3">3 cuotas</option>
                            <option value="6">6 cuotas</option>
                            <option value="12">12 cuotas</option>
                            <option value="24">24 cuotas</option>
                            <option value="36">36 cuotas</option>
                        </select>
                    </div>
                </div>

                <div id="sp-sim-results-box"></div>
            </div>
        `;
        document.body.appendChild(modalEl);
        modalEl.addEventListener('click', (e) => { if (e.target === modalEl) modalEl.classList.add('hidden'); });
        modalEl.querySelector('.btn-close-modal')?.addEventListener('click', () => modalEl.classList.add('hidden'));
        modalEl.querySelector('#sp-sim-amount')?.addEventListener('input', renderSmartPurchaseResults);
        modalEl.querySelector('#sp-sim-method')?.addEventListener('change', renderSmartPurchaseResults);
        modalEl.querySelector('#sp-sim-installments')?.addEventListener('change', renderSmartPurchaseResults);
    }

    const methodSel = modalEl.querySelector('#sp-sim-method');
    if (methodSel) {
        const cards = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'credit_card'));
        methodSel.innerHTML = `<option value="cash">Efectivo / Cuenta Débito</option>` +
            cards.map(c => `<option value="card::${c.id}">Tarjeta: ${stripLeadingEmoji(c.name)}</option>`).join('');
    }

    renderSmartPurchaseResults();
    modalEl.classList.remove('hidden');
};

const renderSmartPurchaseResults = () => {
    const box = document.getElementById('sp-sim-results-box');
    if (!box) return;

    const amt = parseMoneyInput(document.getElementById('sp-sim-amount')?.value);
    const rawMethod = document.getElementById('sp-sim-method')?.value || 'cash';
    const isCard = rawMethod.startsWith('card::');
    const cardId = isCard ? rawMethod.replace('card::', '') : '';
    const instGroup = document.getElementById('sp-sim-inst-group');
    if (instGroup) instGroup.classList.toggle('hidden', !isCard);

    const inst = isCard ? (parseInt(document.getElementById('sp-sim-installments')?.value, 10) || 1) : 1;
    const res = simulateSmartPurchase({
        amount: amt,
        installments: inst,
        paymentMethod: isCard ? 'credit_card' : 'cash',
        cardId
    });

    if (res.amount <= 0) {
        box.innerHTML = `<div class="smart-verdict-box" style="text-align:center; color:var(--text-muted); font-size:12px;">Escribe el precio arriba para calcular el impacto en tu vida y en tu caja.</div>`;
        return;
    }

    const lifeHtml = res.hasSalary
        ? `<strong style="font-size:16px; color:var(--accent);">${String(res.workHoursCost).replace('.', ',')} horas</strong> <small style="color:var(--text-muted);">(${String(res.workDaysCost).replace('.', ',')} días laborales)</small>`
        : `<small style="color:var(--text-muted);">Configura tu nómina en Perfil para ver el costo en horas de trabajo.</small>`;

    box.innerHTML = `
        <div class="smart-verdict-box ${res.verdict}">
            <strong style="display:block; font-size:13px; color:var(--text-main); margin-bottom:4px;">${res.verdictTitle}</strong>
            <small style="color:var(--text-muted); font-size:11px;">Evaluado con ${res.methodLabel}${res.installments > 1 ? ` a ${res.installments} cuotas` : ''}</small>
        </div>

        <div class="sav-sim-card" style="display:flex; flex-direction:column; gap:9px; font-size:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:8px; border-bottom:1px dashed var(--border-color);">
                <span style="color:var(--text-muted); font-weight:600;">Costo en tiempo de vida:</span>
                <div style="text-align:right;">${lifeHtml}</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text-muted); font-weight:600;">Libre Seguro tras compra:</span>
                <strong class="${res.safeAfter >= 0 ? 'positive' : 'negative'}">${formatMoneyHtml(res.safeAfter)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text-muted); font-weight:600;">Punto más bajo caja (30d):</span>
                <strong class="${res.lowestAfter >= 0 ? 'positive' : 'negative'}">${formatMoneyHtml(res.lowestAfter)}</strong>
            </div>
            ${isCard && res.installments > 1 ? `
                <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px dashed var(--border-color);">
                    <span style="color:var(--text-muted); font-weight:600;">Cuota mensual / Total con int.:</span>
                    <strong style="color:var(--text-main);">${formatCompact(res.monthlyQuota)}/m • <span class="${res.isZeroInterest ? 'positive' : 'negative'}">${formatMoney(res.totalCost)}</span></strong>
                </div>
            ` : ''}
        </div>
    `;
};

// 3. MODAL: RESUMEN Y CIERRE DEL MES (3 TARJETAS BENTO DESLIZABLES)
let activeRecapSlide = 0;

window.openMonthlyRecapModal = () => {
    let modalEl = document.getElementById('monthly-recap-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'monthly-recap-modal';
        modalEl.className = 'modal hidden';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width:450px;">
                <div class="modal-header" style="align-items:flex-start;">
                    <div>
                        <h3 style="margin:0; font-size:18px; font-weight:800;">Resumen del Mes</h3>
                        <small id="recap-month-subtitle" style="color:var(--text-muted); font-size:11.5px;"></small>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Cerrar">✕</button>
                </div>
                <div id="recap-bento-container" class="recap-bento-stage"></div>
            </div>
        `;
        document.body.appendChild(modalEl);
        modalEl.addEventListener('click', (e) => { if (e.target === modalEl) modalEl.classList.add('hidden'); });
        modalEl.querySelector('.btn-close-modal')?.addEventListener('click', () => modalEl.classList.add('hidden'));
    }

    activeRecapSlide = 0;
    renderMonthlyRecapView();
    modalEl.classList.remove('hidden');
};

const renderMonthlyRecapView = () => {
    const container = document.getElementById('recap-bento-container');
    const subEl = document.getElementById('recap-month-subtitle');
    if (!container) return;

    const mId = getMonthId(viewDate);
    if (subEl) subEl.textContent = `Balance y cierre de ${formatMonthName(viewDate)}`;

    const data = computeMonthlyRecapData(mId);
    const slides = [
        // Hoja 1: Flujo y Tasa de Ahorro
        `
            <div class="recap-slide-card onb-anim-enter">
                <span class="onb-step-pill">1 / 3 • Balance General</span>
                <h4 style="margin:10px 0 4px 0; font-size:16px; font-weight:800; color:var(--text-main);">
                    ${data.surplus >= 0 ? '¡Cerraste con saldo a favor!' : 'Mes con déficit de flujo'}
                </h4>
                <div style="font-size:24px; font-weight:800; color:${data.surplus >= 0 ? 'var(--positive)' : 'var(--negative)'}; margin-bottom:12px;">
                    ${data.surplus >= 0 ? '+' : ''}${formatMoneyHtml(data.surplus)}
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
                    <div style="background:var(--hover-bg); padding:9px 10px; border-radius:11px;">
                        <small style="font-size:10px; color:var(--text-muted); display:block;">Ingresos</small>
                        <strong class="positive" style="font-size:13px;">${formatMoney(data.inc)}</strong>
                    </div>
                    <div style="background:var(--hover-bg); padding:9px 10px; border-radius:11px;">
                        <small style="font-size:10px; color:var(--text-muted); display:block;">Gastos</small>
                        <strong class="negative" style="font-size:13px;">${formatMoney(data.exp)}</strong>
                    </div>
                </div>
                <div style="font-size:11.5px; color:var(--text-muted);">
                    Tasa de ahorro del mes: <b style="color:var(--text-main);">${String(data.savingsRate).replace('.', ',')}%</b>
                    ${data.prevFlow.exp > 0 ? ` • Gasto vs mes ant.: <b class="${data.expChangePct <= 0 ? 'positive' : 'negative'}">${data.expChangePct > 0 ? '+' : ''}${String(data.expChangePct).replace('.', ',')}%</b>` : ''}
                </div>
            </div>
        `,
        // Hoja 2: Categorías y Presupuesto
        `
            <div class="recap-slide-card onb-anim-enter">
                <span class="onb-step-pill">2 / 3 • Radiografía de Gasto</span>
                <h4 style="margin:10px 0 10px 0; font-size:16px; font-weight:800; color:var(--text-main);">¿A dónde se fue tu dinero?</h4>
                ${data.topCategory ? `
                    <div style="background:var(--hover-bg); padding:10px 12px; border-radius:12px; margin-bottom:8px;">
                        <small style="font-size:10px; color:var(--text-muted); display:block;">Categoría con mayor gasto</small>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                            <strong style="font-size:13.5px; color:var(--text-main);">${data.topCategory.name}</strong>
                            <strong class="negative" style="font-size:13.5px;">${formatMoney(data.topCategory.spent)}</strong>
                        </div>
                    </div>
                ` : `<p style="font-size:12px; color:var(--text-muted);">Sin gastos cerrados en este mes.</p>`}
                ${data.mostOverBudget ? `
                    <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); padding:10px 12px; border-radius:12px;">
                        <small style="font-size:10px; color:var(--negative); font-weight:700; display:block;">Mayor desviación de presupuesto</small>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                            <strong style="font-size:13px; color:var(--text-main);">${data.mostOverBudget.name}</strong>
                            <strong class="negative" style="font-size:13px;">+${formatMoney(data.mostOverBudget.diff)}</strong>
                        </div>
                    </div>
                ` : `
                    <div style="background:color-mix(in srgb, var(--positive) 10%, transparent); padding:10px 12px; border-radius:12px; font-size:12px; color:var(--positive); font-weight:700;">
                        ✓ Ninguna categoría excedió su presupuesto.
                    </div>
                `}
            </div>
        `,
        // Hoja 3: Acción de Cierre (Trasladar Sobrante a Bolsillo)
        `
            <div class="recap-slide-card onb-anim-enter">
                <span class="onb-step-pill">3 / 3 • Acción de Cierre</span>
                <h4 style="margin:10px 0 6px 0; font-size:16px; font-weight:800; color:var(--text-main);">Asegura tu excedente</h4>
                ${data.surplus > 0 && data.pockets.length > 0 ? `
                    <p style="font-size:12px; color:var(--text-muted); margin:0 0 10px 0;">
                        Tienes <b class="positive">${formatMoney(data.surplus)}</b> libres este mes. Envíalos directo a uno de tus bolsillos antes de gastarlos:
                    </p>
                    <select id="recap-target-pocket" style="width:100%; margin-bottom:10px; font-size:12.5px; font-weight:700;">
                        ${data.pockets.map(p => `<option value="${p.id}">${p.name} (Saldo: ${formatCompact(p.balance)})</option>`).join('')}
                    </select>
                    <button type="button" id="btn-recap-save-surplus" class="btn btn-primary" style="width:100%; font-size:13px;">
                        Transferir ${formatMoney(data.surplus)} al bolsillo
                    </button>
                ` : data.surplus > 0 ? `
                    <p style="font-size:12px; color:var(--text-muted); margin:0 0 10px 0;">
                        Tienes <b class="positive">${formatMoney(data.surplus)}</b> de excedente. Crea un bolsillo en <b>Ahorro y Proyección</b> para apartarlos.
                    </p>
                    <button type="button" class="btn btn-primary" style="width:100%;" onclick="document.getElementById('monthly-recap-modal')?.classList.add('hidden'); openSavingsSection('pockets');">
                        Ir a Bolsillos de Ahorro
                    </button>
                ` : `
                    <p style="font-size:12px; color:var(--text-muted); margin:0;">
                        Este mes no dejó excedente neto para trasladar. Revisa la hoja anterior para ajustar tus topes el próximo mes.
                    </p>
                `}
            </div>
        `
    ];

    const isLast = activeRecapSlide === slides.length - 1;
    container.innerHTML = `
        <div>${slides[activeRecapSlide]}</div>
        <div>
            <div class="onb-dots-row">
                ${slides.map((_, i) => `<button type="button" class="onb-dot ${i === activeRecapSlide ? 'active' : ''}" data-recap-idx="${i}"></button>`).join('')}
            </div>
            <div style="display:flex; gap:8px;">
                ${activeRecapSlide > 0 ? `<button type="button" id="btn-recap-prev" class="btn btn-secondary" style="flex:1;">Anterior</button>` : ''}
                <button type="button" id="btn-recap-next" class="btn btn-primary" style="flex:2;">${isLast ? 'Finalizar' : 'Siguiente'}</button>
            </div>
        </div>
    `;

    container.querySelectorAll('.onb-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            activeRecapSlide = parseInt(dot.getAttribute('data-recap-idx'), 10);
            renderMonthlyRecapView();
        });
    });
    container.querySelector('#btn-recap-prev')?.addEventListener('click', () => {
        activeRecapSlide = Math.max(0, activeRecapSlide - 1);
        renderMonthlyRecapView();
    });
    container.querySelector('#btn-recap-next')?.addEventListener('click', () => {
        if (!isLast) {
            activeRecapSlide++;
            renderMonthlyRecapView();
        } else {
            document.getElementById('monthly-recap-modal')?.classList.add('hidden');
        }
    });
    container.querySelector('#btn-recap-save-surplus')?.addEventListener('click', () => {
        const pocketId = document.getElementById('recap-target-pocket')?.value;
        if (!pocketId) return;
        document.getElementById('monthly-recap-modal')?.classList.add('hidden');
        openOmniModal({
            type: 'transfer',
            toAccount: pocketId,
            amount: data.surplus,
            description: `Ahorro excedente (${formatMonthName(viewDate)})`,
            lockType: true,
            hideRecurrence: true
        });
    });
};

// 4. TARJETA EN ANÁLISIS: DETECTOR DE GASTOS HORMIGA Y ALZAS EN SUSCRIPCIONES
let antExpenseThresholdPref = 35000;

const renderAnalyticsAntExpensesCard = () => {
    const analyticsContainer = document.getElementById('analytics-widgets-container');
    if (!analyticsContainer) return;

    let cardEl = document.getElementById('analytics-ant-card');
    if (!cardEl) {
        const siblingCard = analyticsContainer.querySelector('[data-analytics-id]');
        const baseClasses = siblingCard
            ? siblingCard.className.replace(/\bedit-mode\b/g, '').trim()
            : 'chart-card';
        cardEl = document.createElement('div');
        cardEl.id = 'analytics-ant-card';
        cardEl.className = baseClasses;
        cardEl.setAttribute('data-analytics-id', 'analytics-ant');
        analyticsContainer.appendChild(cardEl);
        applyWidgetOrder();
    }

    const viewMonthId = getMonthId(viewDate);
    const info = computeAntExpensesAndSubHikes(viewMonthId, antExpenseThresholdPref);

    const hikesHtml = info.subHikes.length > 0 ? `
        <div style="margin-top:10px; padding:9px 11px; border-radius:12px; background:rgba(245, 158, 11, 0.1); border:1px solid rgba(245, 158, 11, 0.3);">
            <strong style="display:block; font-size:11.5px; color:#d97706; margin-bottom:4px;">⚠ Alzas detectadas en suscripciones</strong>
            ${info.subHikes.map(h => `
                <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-main); margin-top:2px;">
                    <span>• ${h.name}</span>
                    <b class="negative">+${formatMoney(h.delta)} (+${String(h.pctIncrease).replace('.', ',')}%)</b>
                </div>
            `).join('')}
        </div>
    ` : '';

    const itemsHtml = info.topAntItems.length > 0 ? info.topAntItems.map(it => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px dashed var(--border-color); font-size:11.5px;">
            <span style="min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:8px;">
                <b style="color:var(--text-main);">${it.label}</b> <small style="color:var(--text-muted);">(${it.count}x)</small>
            </span>
            <strong class="negative" style="flex-shrink:0;">${formatMoney(it.total)}</strong>
        </div>
    `).join('') : `<small style="color:var(--text-muted); font-size:11.5px;">No hay compras pequeñas variables bajo este tope en el mes.</small>`;

    cardEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px;">
            <div>
                <h4 style="margin:0; font-size:15px; font-weight:800; color:var(--text-main);">Gastos Hormiga</h4>
                <small style="font-size:10.5px; color:var(--text-muted); font-weight:600;">Compras variables ≤ ${formatCompact(info.threshold)}</small>
            </div>
            <select id="ant-threshold-select" style="width:auto; padding:4px 8px; font-size:11px; font-weight:700; min-height:28px;">
                <option value="20000" ${antExpenseThresholdPref === 20000 ? 'selected' : ''}>≤ $ 20k</option>
                <option value="35000" ${antExpenseThresholdPref === 35000 ? 'selected' : ''}>≤ $ 35k</option>
                <option value="50000" ${antExpenseThresholdPref === 50000 ? 'selected' : ''}>≤ $ 50k</option>
            </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <div style="background:var(--hover-bg); padding:10px 12px; border-radius:12px;">
                <small style="font-size:10px; color:var(--text-muted); font-weight:700; display:block;">Acumulado mes (${info.antCount})</small>
                <strong class="negative" style="font-size:14.5px;">${formatMoneyHtml(info.totalAntSpend)}</strong>
            </div>
            <div style="background:var(--hover-bg); padding:10px 12px; border-radius:12px;">
                <small style="font-size:10px; color:var(--text-muted); font-weight:700; display:block;">Impacto anual (×12)</small>
                <strong style="font-size:14.5px; color:#d97706;">${formatMoneyHtml(info.annualizedAntSpend)}</strong>
            </div>
        </div>

        <div>${itemsHtml}</div>
        ${hikesHtml}
    `;

    cardEl.querySelector('#ant-threshold-select')?.addEventListener('change', (e) => {
        antExpenseThresholdPref = parseInt(e.target.value, 10) || 35000;
        renderAnalyticsAntExpensesCard();
    });
};
// 5. MODALES: SIMULADOR DE CRÉDITO Y COMPARADOR BANCO A VS. B
const openCreateDebtWithPreset = ({ name = '', principal = 0, periods = 12, rate = 0, rateType = 'annual', monthlyQuota = 0 }) => {
    document.getElementById('credit-simulator-modal')?.classList.add('hidden');
    document.getElementById('credit-compare-modal')?.classList.add('hidden');
    if (attemptCloseModals()) {
        const debtsModal = document.getElementById('debts-modal');
        debtsModal?.classList.remove('hidden');
        let totalLoansDebt = 0;
        financeData.customAccounts.forEach(acc => {
            if (acc.category === 'debt' && currentBalances[acc.id] > 0) totalLoansDebt = round2(totalLoansDebt + currentBalances[acc.id]);
        });
        renderDebtsBreakdown(currentBalances, totalLoansDebt);

        const debtForm = document.getElementById('new-debt-form');
        const detailsWrap = debtForm?.closest('details');
        if (detailsWrap) detailsWrap.open = true;

        if (name && document.getElementById('new-debt-name')) document.getElementById('new-debt-name').value = name;
        if (document.getElementById('new-debt-original')) document.getElementById('new-debt-original').value = formatNumberInput(principal);
        if (document.getElementById('new-debt-current')) document.getElementById('new-debt-current').value = formatNumberInput(principal);
        if (document.getElementById('new-debt-total-quotes')) document.getElementById('new-debt-total-quotes').value = String(periods);
        if (document.getElementById('new-debt-paid-quotes')) document.getElementById('new-debt-paid-quotes').value = '0';
        if (document.getElementById('new-debt-rate')) document.getElementById('new-debt-rate').value = formatNumberInput(rate);
        if (document.getElementById('new-debt-rate-type')) document.getElementById('new-debt-rate-type').value = rateType;
        if (document.getElementById('new-debt-monthly-payment')) document.getElementById('new-debt-monthly-payment').value = formatNumberInput(monthlyQuota);
        setTimeout(() => document.getElementById('new-debt-name')?.focus(), 100);
    }
};

window.openCreditSimulatorModal = () => {
    let modalEl = document.getElementById('credit-simulator-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'credit-simulator-modal';
        modalEl.className = 'modal hidden';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width:480px;">
                <div class="modal-header" style="align-items:flex-start;">
                    <div>
                        <h3 style="margin:0; font-size:18px; font-weight:800;">Simulador de Crédito</h3>
                        <small style="color:var(--text-muted); font-size:11.5px;">Proyecta cuotas, intereses y valida tu capacidad real</small>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Cerrar">✕</button>
                </div>

                <div id="csim-view-single">
                    <details class="changelog-accordion" style="margin-bottom:12px; background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245, 158, 11, 0.28); padding:10px 12px; box-shadow:none;">
                        <summary style="font-size:12px; font-weight:800; color:#d97706;">
                            <span style="display:inline-flex; align-items:center; gap:6px;">
                                ${renderIcon('help', 15)} ¿Cómo funciona este simulador?
                            </span>
                            <span>▾</span>
                        </summary>
                        <div style="margin-top:9px; padding-top:9px; border-top:1px dashed rgba(245, 158, 11, 0.3); font-size:11.5px; color:var(--text-muted); line-height:1.45; display:flex; flex-direction:column; gap:7px;">
                            <span>• <b>Amortización Francesa (Cuota Fija):</b> Al inicio pagas mayor proporción de intereses y conforme avanza el plazo abonas más a capital.</span>
                            <span>• <b>Conversión Colombia (% E.A. ↔ % M.V.):</b> Si ingresas tasa Efectiva Anual, se convierte automáticamente a tasa mensual con <code>(1 + E.A.)<sup>1/12</sup> − 1</code>.</span>
                            <span>• <b>Validación con tus finanzas:</b> Cruza la cuota resultante contra tu <b>capacidad saludable de endeudamiento</b> y tu <b>flujo libre</b> tras gastos fijos.</span>
                            <button type="button" id="btn-csim-load-example" class="mini-action-btn" style="margin-top:4px; width:100%; justify-content:center; font-size:11px; padding:6px;">
                                Probar ejemplo ($ 10.000.000 a 24 meses)
                            </button>
                        </div>
                    </details>

                    <div class="sub-quick-chips" style="margin-bottom:10px; flex-wrap:wrap;">
                        <button type="button" class="sub-quick-chip" data-csim-preset="libre">Libre Inversión</button>
                        <button type="button" class="sub-quick-chip" data-csim-preset="vehiculo">Vehículo</button>
                        <button type="button" class="sub-quick-chip" data-csim-preset="vivienda">Vivienda</button>
                        <button type="button" class="sub-quick-chip" data-csim-preset="max" style="color:var(--positive); border-color:color-mix(in srgb, var(--positive) 35%, transparent);">★ Cupo máximo</button>
                    </div>

                    <div class="sav-sim-card">
                        <div class="form-group">
                            <label>Monto a solicitar ($)</label>
                            <input type="text" id="csim-amount" class="money-input" inputmode="decimal" placeholder="Ej. 10.000.000">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Plazo (meses)</label>
                                <input type="number" id="csim-months" min="1" max="360" placeholder="Ej. 24">
                            </div>
                            <div class="form-group">
                                <label>Modalidad tasa</label>
                                <select id="csim-rate-type">
                                    <option value="annual" selected>% E.A. (Anual)</option>
                                    <option value="monthly">% M.V. (Mensual)</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Tasa de interés (%)</label>
                                <input type="text" id="csim-rate" inputmode="decimal" placeholder="Ej. 22">
                            </div>
                            <div class="form-group">
                                <label>Seguro / Cargo mensual ($)</label>
                                <input type="text" id="csim-insurance" class="money-input" inputmode="decimal" placeholder="0,00">
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom:0;">
                            <label>Abono extra mensual opcional ($)</label>
                            <input type="text" id="csim-extra" class="money-input" inputmode="decimal" placeholder="Opcional: reduce el plazo">
                        </div>
                    </div>

                    <div id="csim-results-box"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);

        modalEl.addEventListener('click', (e) => { if (e.target === modalEl) modalEl.classList.add('hidden'); });
        modalEl.querySelector('.btn-close-modal')?.addEventListener('click', () => modalEl.classList.add('hidden'));

        ['#csim-amount', '#csim-months', '#csim-rate-type', '#csim-rate', '#csim-insurance', '#csim-extra'].forEach(sel => {
            const el = modalEl.querySelector(sel);
            el?.addEventListener('input', renderCreditSimulatorResults);
            el?.addEventListener('change', renderCreditSimulatorResults);
        });

        modalEl.querySelector('#btn-csim-load-example')?.addEventListener('click', (e) => {
            modalEl.querySelector('#csim-amount').value = formatNumberInput(10000000);
            modalEl.querySelector('#csim-months').value = '24';
            modalEl.querySelector('#csim-rate-type').value = 'annual';
            modalEl.querySelector('#csim-rate').value = '22';
            modalEl.querySelector('#csim-insurance').value = formatNumberInput(15000);
            modalEl.querySelector('#csim-extra').value = formatNumberInput(100000);
            e.target.closest('details')?.removeAttribute('open');
            renderCreditSimulatorResults();
        });

        modalEl.querySelectorAll('[data-csim-preset]').forEach(chip => {
            chip.addEventListener('click', () => {
                const preset = chip.getAttribute('data-csim-preset');
                const amtEl = modalEl.querySelector('#csim-amount');
                const monthsEl = modalEl.querySelector('#csim-months');
                const typeEl = modalEl.querySelector('#csim-rate-type');
                const rateEl = modalEl.querySelector('#csim-rate');

                if (preset === 'libre') {
                    monthsEl.value = '24';
                    typeEl.value = 'annual';
                    rateEl.value = '22';
                } else if (preset === 'vehiculo') {
                    monthsEl.value = '48';
                    typeEl.value = 'annual';
                    rateEl.value = '16,5';
                } else if (preset === 'vivienda') {
                    monthsEl.value = '120';
                    typeEl.value = 'annual';
                    rateEl.value = '11,5';
                } else if (preset === 'max') {
                    if (!monthsEl.value) monthsEl.value = '24';
                    if (!rateEl.value) {
                        typeEl.value = 'annual';
                        rateEl.value = '22';
                    }
                    const probe = simulateCreditLoan({
                        principal: 1000000,
                        periods: parseInt(monthsEl.value, 10) || 24,
                        rate: parseFloat((rateEl.value || '0').replace(',', '.')) || 0,
                        rateType: typeEl.value,
                        monthlyInsurance: parseMoneyInput(modalEl.querySelector('#csim-insurance')?.value)
                    });
                    if (probe.maxAffordablePrincipal > 0) {
                        amtEl.value = formatNumberInput(probe.maxAffordablePrincipal);
                    } else {
                        alert('Tu capacidad de endeudamiento actual no tiene cupo libre disponible para un nuevo crédito.');
                    }
                }
                renderCreditSimulatorResults();
                if (preset !== 'max' && !amtEl.value) amtEl.focus();
            });
        });
    }

    modalEl.classList.remove('hidden');
    try { renderCreditSimulatorResults(); } catch (err) { console.error('Error en Simulador de Crédito:', err); }
};

window.openCreditCompareModal = () => {
    let modalEl = document.getElementById('credit-compare-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'credit-compare-modal';
        modalEl.className = 'modal hidden';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width:480px;">
                <div class="modal-header" style="align-items:flex-start;">
                    <div>
                        <h3 style="margin:0; font-size:18px; font-weight:800;">Banco A vs. Banco B</h3>
                        <small style="color:var(--text-muted); font-size:11.5px;">Compara ofertas y descubre cuál es más barata</small>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Cerrar">✕</button>
                </div>

                <div id="csim-view-compare">
                    <details class="changelog-accordion" style="margin-bottom:12px; background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245, 158, 11, 0.28); padding:10px 12px; box-shadow:none;">
                        <summary style="font-size:12px; font-weight:800; color:#d97706;">
                            <span style="display:inline-flex; align-items:center; gap:6px;">
                                ${renderIcon('help', 15)} ¿Qué compara esta herramienta?
                            </span>
                            <span>▾</span>
                        </summary>
                        <div style="margin-top:9px; padding-top:9px; border-top:1px dashed rgba(245, 158, 11, 0.3); font-size:11.5px; color:var(--text-muted); line-height:1.45; display:flex; flex-direction:column; gap:7px;">
                            <span>• A veces un banco ofrece una tasa más baja pero te cobra un <b>seguro de vida costoso</b> o un <b>estudio de crédito inicial</b> que encarece el préstamo.</span>
                            <span>• Aquí sumamos <b>capital + intereses + seguros + comisiones</b> para revelarte cuánto dinero sale realmente de tu bolsillo en cada entidad.</span>
                            <button type="button" id="btn-ccmp-load-example" class="mini-action-btn" style="margin-top:4px; width:100%; justify-content:center; font-size:11px; padding:6px;">
                                Probar ejemplo comparativo ($ 15.000.000)
                            </button>
                        </div>
                    </details>

                    <div class="sav-sim-card" style="margin-bottom:10px;">
                        <div class="form-group" style="margin-bottom:0;">
                            <label>Monto del crédito a cotizar ($)</label>
                            <input type="text" id="ccmp-amount" class="money-input" inputmode="decimal" placeholder="Ej. 15.000.000">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
                        <!-- COLUMNA BANCO A -->
                        <div class="sav-sim-card" style="margin-bottom:0; padding:11px 10px;">
                            <div class="form-group" style="margin-bottom:8px;">
                                <label style="color:var(--accent);">Entidad A</label>
                                <input type="text" id="ccmp-a-name" placeholder="Banco A" style="font-weight:700;">
                            </div>
                            <div class="form-group" style="margin-bottom:8px;">
                                <label>Plazo (meses)</label>
                                <input type="number" id="ccmp-a-months" min="1" max="360" placeholder="Ej. 24">
                            </div>
                            <div class="form-group" style="margin-bottom:8px;">
                                <label>Modalidad</label>
                                <select id="ccmp-a-rate-type">
                                    <option value="annual" selected>% E.A.</option>
                                    <option value="monthly">% M.V.</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom:8px;">
                                <label>Tasa (%)</label>
                                <input type="text" id="ccmp-a-rate" inputmode="decimal" placeholder="Ej. 19,5">
                            </div>
                            <div class="form-group" style="margin-bottom:8px;">
                                <label>Seguro/mes ($)</label>
                                <input type="text" id="ccmp-a-ins" class="money-input" inputmode="decimal" placeholder="0,00">
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Estudio / Com. ($)</label>
                                <input type="text" id="ccmp-a-fee" class="money-input" inputmode="decimal" placeholder="0,00">
                            </div>
                        </div>

                        <!-- COLUMNA BANCO B -->
                        <div class="sav-sim-card" style="margin-bottom:0; padding:11px 10px;">
                            <div class="form-group" style="margin-bottom:8px;">
                                <label style="color:var(--positive);">Entidad B</label>
                                <input type="text" id="ccmp-b-name" placeholder="Banco B" style="font-weight:700;">
                            </div>
                            <div class="form-group" style="margin-bottom:8px;">
                                <label>Plazo (meses)</label>
                                <input type="number" id="ccmp-b-months" min="1" max="360" placeholder="Ej. 36">
                            </div>
                            <div class="form-group" style="margin-bottom:8px;">
                                <label>Modalidad</label>
                                <select id="ccmp-b-rate-type">
                                    <option value="annual" selected>% E.A.</option>
                                    <option value="monthly">% M.V.</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom:8px;">
                                <label>Tasa (%)</label>
                                <input type="text" id="ccmp-b-rate" inputmode="decimal" placeholder="Ej. 22,5">
                            </div>
                            <div class="form-group" style="margin-bottom:8px;">
                                <label>Seguro/mes ($)</label>
                                <input type="text" id="ccmp-b-ins" class="money-input" inputmode="decimal" placeholder="0,00">
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Estudio / Com. ($)</label>
                                <input type="text" id="ccmp-b-fee" class="money-input" inputmode="decimal" placeholder="0,00">
                            </div>
                        </div>
                    </div>

                    <div id="ccmp-results-box"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);

        modalEl.addEventListener('click', (e) => { if (e.target === modalEl) modalEl.classList.add('hidden'); });
        modalEl.querySelector('.btn-close-modal')?.addEventListener('click', () => modalEl.classList.add('hidden'));

        ['#ccmp-amount', '#ccmp-a-name', '#ccmp-a-months', '#ccmp-a-rate-type', '#ccmp-a-rate', '#ccmp-a-ins', '#ccmp-a-fee', '#ccmp-b-name', '#ccmp-b-months', '#ccmp-b-rate-type', '#ccmp-b-rate', '#ccmp-b-ins', '#ccmp-b-fee'].forEach(sel => {
            const el = modalEl.querySelector(sel);
            el?.addEventListener('input', renderCreditCompareResults);
            el?.addEventListener('change', renderCreditCompareResults);
        });

        modalEl.querySelector('#btn-ccmp-load-example')?.addEventListener('click', (e) => {
            modalEl.querySelector('#ccmp-amount').value = formatNumberInput(15000000);
            modalEl.querySelector('#ccmp-a-name').value = 'Banco A';
            modalEl.querySelector('#ccmp-a-months').value = '24';
            modalEl.querySelector('#ccmp-a-rate-type').value = 'annual';
            modalEl.querySelector('#ccmp-a-rate').value = '19,5';
            modalEl.querySelector('#ccmp-a-ins').value = formatNumberInput(28000);
            modalEl.querySelector('#ccmp-a-fee').value = formatNumberInput(180000);

            modalEl.querySelector('#ccmp-b-name').value = 'Banco B';
            modalEl.querySelector('#ccmp-b-months').value = '24';
            modalEl.querySelector('#ccmp-b-rate-type').value = 'annual';
            modalEl.querySelector('#ccmp-b-rate').value = '21,2';
            modalEl.querySelector('#ccmp-b-ins').value = '0';
            modalEl.querySelector('#ccmp-b-fee').value = '0';

            e.target.closest('details')?.removeAttribute('open');
            renderCreditCompareResults();
        });
    }

    const singleAmtEl = document.getElementById('csim-amount');
    const cmpAmtEl = modalEl.querySelector('#ccmp-amount');
    if (cmpAmtEl && !cmpAmtEl.value && singleAmtEl && singleAmtEl.value) {
        cmpAmtEl.value = singleAmtEl.value;
    }

    modalEl.classList.remove('hidden');
    try { renderCreditCompareResults(); } catch (err) { console.error('Error en Comparador de Crédito:', err); }
};

const renderCreditSimulatorResults = () => {
    const box = document.getElementById('csim-results-box');
    if (!box) return;

    if (typeof simulateCreditLoan !== 'function') {
        box.innerHTML = `<div class="smart-verdict-box warn" style="font-size:12px;">Falta actualizar <b>core.js</b> con <code>simulateCreditLoan</code>.</div>`;
        return;
    }

    const principal = parseMoneyInput(document.getElementById('csim-amount')?.value);
    const periods = parseInt(document.getElementById('csim-months')?.value, 10) || 12;
    const rateType = document.getElementById('csim-rate-type')?.value || 'annual';
    const rate = parseFloat((document.getElementById('csim-rate')?.value || '0').replace(',', '.')) || 0;
    const monthlyInsurance = parseMoneyInput(document.getElementById('csim-insurance')?.value);
    const extraMonthly = parseMoneyInput(document.getElementById('csim-extra')?.value);

    const res = simulateCreditLoan({ principal, periods, rate, rateType, monthlyInsurance, extraMonthly });

    if (res.principal <= 0) {
        box.innerHTML = `
            <div class="sav-sim-card" style="text-align:center; padding:22px 16px;">
                <div style="width:42px; height:42px; border-radius:50%; background:var(--hover-bg); color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; margin-bottom:8px;">
                    ${renderIcon('scale', 20)}
                </div>
                <strong style="display:block; font-size:13.5px; color:var(--text-main); margin-bottom:4px;">Tu simulación aparecerá acá</strong>
                <small style="color:var(--text-muted); font-size:11.5px;">Ingresa el monto, plazo y tasa para calcular la cuota y validar tu capacidad.</small>
            </div>
        `;
        return;
    }

    const extraBannerHtml = res.savedMonths > 0 ? `
        <div style="margin-bottom:12px; padding:10px 12px; border-radius:12px; background:color-mix(in srgb, var(--positive) 10%, transparent); border:1px solid color-mix(in srgb, var(--positive) 30%, transparent); font-size:11.5px; color:var(--text-main);">
            <strong class="positive" style="display:block; margin-bottom:2px;">⚡ Con abono extra de ${formatMoney(res.extraMonthly)}/mes:</strong>
            <span>Terminas <b>${res.savedMonths} ${res.savedMonths === 1 ? 'mes' : 'meses'} antes</b> (en ${res.accelMonths}m) y te ahorras <b class="positive">${formatMoney(res.savedInterest)}</b> en intereses.</span>
        </div>
    ` : '';

    const rowsHtml = res.schedule.map(r => `
        <tr>
            <td style="text-align:left;">Mes ${r.period}</td>
            <td>${formatCompact(round2(r.payment + res.monthlyInsurance))}</td>
            <td class="positive">${formatCompact(r.principal)}</td>
            <td class="negative">${formatCompact(r.interest)}</td>
            <td><b>${formatCompact(r.balance)}</b></td>
        </tr>
    `).join('');

    box.innerHTML = `
        <div class="sav-sim-hero" style="background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 11%, var(--card-inner-bg)), var(--card-inner-bg)); border-color:color-mix(in srgb, var(--accent) 30%, transparent);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; font-weight:700; color:var(--text-muted);">Cuota mensual estimada</span>
                <span class="widget-badge neutral" style="font-size:9.5px;">${String(res.effectiveMonthlyRatePct).replace('.', ',')}% M.V. • ${String(res.effectiveAnnualRatePct).replace('.', ',')}% E.A.</span>
            </div>
            <div style="font-size:22px; font-weight:800; color:var(--text-main); margin-top:3px;">${formatMoneyHtml(res.totalMonthlyQuota)}<span style="font-size:12px; font-weight:600; color:var(--text-muted);"> / mes</span></div>
            <div class="sav-sim-bar-track">
                <div class="sav-sim-bar-principal" style="width:${res.principalPct}%;"></div>
                <div class="sav-sim-bar-interest" style="width:${res.extraCostPct}%; background:var(--negative);"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:10.5px; font-weight:700;">
                <span style="color:var(--accent);">● Capital (${res.principalPct}%)</span>
                <span class="negative">● Intereses + Seguros (${res.extraCostPct}%)</span>
            </div>
        </div>

        <div class="smart-verdict-box ${res.viability}">
            <strong style="display:block; font-size:12.5px; color:var(--text-main); margin-bottom:4px;">${res.viabilityTitle}</strong>
            ${res.cap.baseIncome > 0 ? `
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:4px 10px; font-size:11px; color:var(--text-muted); margin-top:6px;">
                    <span>Endeudamiento: <b>${String(res.cap.usedPct).replace('.', ',')}% → ${String(res.newDebtBurdenPct).replace('.', ',')}%</b></span>
                    <span>Flujo libre: <b class="${res.remainingFreeCashFlow >= 0 ? 'positive' : 'negative'}">${formatMoney(res.remainingFreeCashFlow)}</b></span>
                </div>
            ` : ''}
        </div>

        ${extraBannerHtml}

        <div class="sav-sim-kpis">
            <div class="sav-sim-kpi">
                <small>Monto pedido</small>
                <strong>${formatMoneyHtml(res.principal)}</strong>
            </div>
            <div class="sav-sim-kpi">
                <small>Intereses + Seg.</small>
                <strong class="negative">${formatMoneyHtml(round2(res.totalInterest + res.totalInsurance))}</strong>
            </div>
            <div class="sav-sim-kpi">
                <small>Total a pagar</small>
                <strong>${formatMoneyHtml(res.totalCost)}</strong>
            </div>
        </div>

        <button type="button" id="btn-csim-create-debt" class="btn btn-secondary" style="width:100%; margin-bottom:10px; font-size:12.5px; font-weight:700;">
            + Crear este préstamo en mis Deudas
        </button>

        <details class="changelog-accordion" style="padding:10px 12px;">
            <summary style="font-size:11.5px; font-weight:700; color:var(--text-main);">
                <span>Ver tabla de amortización (${res.periods} cuotas)</span>
                <span>▾</span>
            </summary>
            <div class="table-responsive" style="margin-top:8px; max-height:200px; overflow-y:auto;">
                <table class="amort-table" style="font-size:10.5px;">
                    <thead>
                        <tr>
                            <th style="text-align:left;">Mes</th>
                            <th>Cuota</th>
                            <th>Capital</th>
                            <th>Interés</th>
                            <th>Saldo</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        </details>
    `;

    box.querySelector('#btn-csim-create-debt')?.addEventListener('click', () => {
        openCreateDebtWithPreset({
            principal: res.principal,
            periods: res.periods,
            rate: res.rate,
            rateType: res.rateType,
            monthlyQuota: res.totalMonthlyQuota
        });
    });
};

const renderCreditCompareResults = () => {
    const box = document.getElementById('ccmp-results-box');
    if (!box) return;

    if (typeof compareCreditOffers !== 'function') {
        box.innerHTML = `<div class="smart-verdict-box warn" style="font-size:12px;">Falta actualizar <b>core.js</b> con <code>compareCreditOffers</code>.</div>`;
        return;
    }

    const principal = parseMoneyInput(document.getElementById('ccmp-amount')?.value);
    const cmp = compareCreditOffers({
        principal,
        offerA: {
            name: document.getElementById('ccmp-a-name')?.value,
            periods: document.getElementById('ccmp-a-months')?.value,
            rateType: document.getElementById('ccmp-a-rate-type')?.value,
            rate: (document.getElementById('ccmp-a-rate')?.value || '0').replace(',', '.'),
            monthlyInsurance: parseMoneyInput(document.getElementById('ccmp-a-ins')?.value),
            upfrontFee: parseMoneyInput(document.getElementById('ccmp-a-fee')?.value)
        },
        offerB: {
            name: document.getElementById('ccmp-b-name')?.value,
            periods: document.getElementById('ccmp-b-months')?.value,
            rateType: document.getElementById('ccmp-b-rate-type')?.value,
            rate: (document.getElementById('ccmp-b-rate')?.value || '0').replace(',', '.'),
            monthlyInsurance: parseMoneyInput(document.getElementById('ccmp-b-ins')?.value),
            upfrontFee: parseMoneyInput(document.getElementById('ccmp-b-fee')?.value)
        }
    });

    if (!cmp.valid) {
        box.innerHTML = `
            <div class="sav-sim-card" style="text-align:center; padding:20px 14px;">
                <strong style="display:block; font-size:13px; color:var(--text-main); margin-bottom:4px;">Comparativa lista para calcular</strong>
                <small style="color:var(--text-muted); font-size:11.5px;">Ingresa el monto del crédito y las condiciones de cada banco para descubrir cuál es más económico.</small>
            </div>
        `;
        return;
    }

    const { resA, resB, winner, totalSavings, monthlyDiff, higherQuotaWarning } = cmp;
    const winOffer = winner === 'B' ? resB : resA;

    let bannerTitle = 'Ambas ofertas cuestan exactamente lo mismo';
    let bannerSub = `Costo total: ${formatMoney(resA.totalCost)} en ambas opciones.`;
    if (winner === 'A' || winner === 'B') {
        bannerTitle = `★ Conviene más ${winOffer.name}`;
        bannerSub = `Te ahorras ${formatMoney(totalSavings)} en el costo total real del crédito.`;
    }

    const quotaNoteHtml = higherQuotaWarning ? `
        <div style="margin-top:6px; font-size:11px; color:#d97706; font-weight:600;">
            Nota: ${winOffer.name} es más barato en total, pero su cuota mensual es ${formatMoney(monthlyDiff)} más alta por el plazo.
        </div>
    ` : '';

    const extrasA = round2(resA.totalInsurance + resA.upfrontFee);
    const extrasB = round2(resB.totalInsurance + resB.upfrontFee);

    box.innerHTML = `
        <div class="smart-verdict-box ${winner === 'tie' ? 'neutral' : 'good'}">
            <strong style="display:block; font-size:13.5px; color:var(--text-main); margin-bottom:2px;">${bannerTitle}</strong>
            <span style="font-size:11.5px; color:var(--text-muted);">${bannerSub}</span>
            ${quotaNoteHtml}
        </div>

        <div class="sav-sim-card" style="padding:12px;">
            <div style="display:grid; grid-template-columns:1.1fr 1fr 1fr; gap:6px; font-size:11px; padding-bottom:8px; border-bottom:1px solid var(--border-color); font-weight:800;">
                <span style="color:var(--text-muted);">Concepto</span>
                <span style="text-align:right; color:var(--accent);">${resA.name}</span>
                <span style="text-align:right; color:var(--positive);">${resB.name}</span>
            </div>

            <div style="display:grid; grid-template-columns:1.1fr 1fr 1fr; gap:6px; font-size:11.5px; padding:8px 0; border-bottom:1px dashed var(--border-color);">
                <span style="color:var(--text-muted);">Cuota mensual</span>
                <strong style="text-align:right; ${resA.monthlyQuota <= resB.monthlyQuota ? 'color:var(--positive);' : ''}">${formatCompact(resA.monthlyQuota)}</strong>
                <strong style="text-align:right; ${resB.monthlyQuota <= resA.monthlyQuota ? 'color:var(--positive);' : ''}">${formatCompact(resB.monthlyQuota)}</strong>
            </div>

            <div style="display:grid; grid-template-columns:1.1fr 1fr 1fr; gap:6px; font-size:11.5px; padding:8px 0; border-bottom:1px dashed var(--border-color);">
                <span style="color:var(--text-muted);">Tasa (% E.A.)</span>
                <span style="text-align:right;">${String(resA.effectiveAnnualRatePct).replace('.', ',')}%</span>
                <span style="text-align:right;">${String(resB.effectiveAnnualRatePct).replace('.', ',')}%</span>
            </div>

            <div style="display:grid; grid-template-columns:1.1fr 1fr 1fr; gap:6px; font-size:11.5px; padding:8px 0; border-bottom:1px dashed var(--border-color);">
                <span style="color:var(--text-muted);">Total intereses</span>
                <span style="text-align:right;" class="negative">${formatCompact(resA.totalInterest)}</span>
                <span style="text-align:right;" class="negative">${formatCompact(resB.totalInterest)}</span>
            </div>

            <div style="display:grid; grid-template-columns:1.1fr 1fr 1fr; gap:6px; font-size:11.5px; padding:8px 0; border-bottom:1px dashed var(--border-color);">
                <span style="color:var(--text-muted);">Seguros + Com.</span>
                <span style="text-align:right;">${formatCompact(extrasA)}</span>
                <span style="text-align:right;">${formatCompact(extrasB)}</span>
            </div>

            <div style="display:grid; grid-template-columns:1.1fr 1fr 1fr; gap:6px; font-size:12px; padding-top:8px; font-weight:800;">
                <span style="color:var(--text-main);">Total real</span>
                <span style="text-align:right; ${winner === 'A' ? 'color:var(--positive);' : ''}">${formatCompact(resA.totalCost)}</span>
                <span style="text-align:right; ${winner === 'B' ? 'color:var(--positive);' : ''}">${formatCompact(resB.totalCost)}</span>
            </div>
        </div>

        <button type="button" id="btn-ccmp-adopt-winner" class="btn btn-secondary" style="width:100%; font-size:12.5px; font-weight:700;">
            + Crear préstamo con ${winOffer.name}
        </button>
    `;

    box.querySelector('#btn-ccmp-adopt-winner')?.addEventListener('click', () => {
        openCreateDebtWithPreset({
            name: winOffer.name,
            principal: cmp.principal,
            periods: winOffer.periods,
            rate: winOffer.rate,
            rateType: winOffer.rateType,
            monthlyQuota: winOffer.monthlyQuota
        });
    });
};