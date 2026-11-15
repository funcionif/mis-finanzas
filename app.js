// ==========================================
// app.js (v4.0.0 - Fintech Editorial)
// EL PINTOR: INTERFAZ, EVENTOS Y RENDERIZADO
// ==========================================

let isDashboardEditMode = false;
let historySearchQuery = '';
let lastPlannerScheduleText = '';

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

// --- 1.5 FORMATO VISUAL FINTECH (DECIMALES ATENUADOS) ---
const formatMoneyHtml = (amount) => {
    const rawFormat = formatMoney(amount);
    const isCompact = financeData.useCompactNumbers && Math.abs(amount) >= 1000;
    
    // Si está compacto (ej. 1,5M) no atenuamos centavos
    if (isCompact) return formatCompact(amount);

    // Atenuar los centavos si existen (ej. ,00 o ,50) para lectura limpia en millones
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
});

document.addEventListener('change', (e) => {
    const parentForm = e.target.closest('form');
    if (parentForm && parentForm.classList.contains('data-form') && isAnyModalOpen()) {
        hasUnsavedChanges = true;
    }
});

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

// --- 4. TEMAS, MODO CLARO/OSCURO Y SEGURIDAD ---
const applyColorModeUI = (mode) => {
    const cleanMode = ['light', 'dark', 'auto'].includes(mode) ? mode : 'auto';
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

const applyThemeUI = (themeValue) => {
    const colors = getThemeColors(themeValue);
    document.documentElement.style.setProperty('--accent', colors.accent);
    document.documentElement.style.setProperty('--theme-gradient', colors.gradient);
    document.documentElement.style.setProperty('--theme-shadow', colors.shadow);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', colors.accent);
    const picker = document.getElementById('custom-theme-color');
    if (picker) {
        picker.value = colors.accent;
        const isPreset = Array.from(document.querySelectorAll('.theme-color-btn')).some(b => b.getAttribute('data-theme') === themeValue);
        const pickerWrap = picker.closest('.custom-color-row') || picker.parentElement;
        if (pickerWrap) {
            pickerWrap.style.borderColor = !isPreset ? 'var(--accent)' : '';
            pickerWrap.style.boxShadow = !isPreset ? '0 0 0 2px var(--accent-soft)' : '';
        }
    }
    document.querySelectorAll('.theme-color-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-theme') === themeValue);
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
};

const initAuthUI = (forceLock = false) => {
    forceCloseAllModals();
    const overlay = document.getElementById('auth-overlay');
    const welcomeView = document.getElementById('welcome-view');
    const loginView = document.getElementById('login-view');
    if (!overlay) return;

    if (!authData) {
        overlay.classList.remove('hidden');
        welcomeView?.classList.remove('hidden');
        document.getElementById('welcome-step-1')?.classList.remove('hidden');
        document.getElementById('welcome-step-2')?.classList.add('hidden');
        loginView?.classList.add('hidden');
    } else if (authData.pinEnabled || forceLock) {
        syncUserUI();
        overlay.classList.remove('hidden');
        welcomeView?.classList.add('hidden');
        loginView?.classList.remove('hidden');
        const pinInput = document.getElementById('login-pin');
        if (pinInput) { pinInput.value = ''; setTimeout(() => pinInput.focus(), 120); }
    } else {
        syncUserUI();
        overlay.classList.add('hidden');
        if (typeof checkWhatsNewBanner === 'function') checkWhatsNewBanner();
    }
};

document.getElementById('btn-welcome-next')?.addEventListener('click', () => {
    document.getElementById('welcome-step-1')?.classList.add('hidden');
    document.getElementById('welcome-step-2')?.classList.remove('hidden');
    setTimeout(() => document.getElementById('welcome-name')?.focus(), 100);
});

document.getElementById('btn-welcome-back')?.addEventListener('click', () => {
    document.getElementById('welcome-step-2')?.classList.add('hidden');
    document.getElementById('welcome-step-1')?.classList.remove('hidden');
    document.getElementById('welcome-error')?.classList.add('hidden');
});

document.getElementById('welcome-link-terms')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof openUniversalInfoModal === 'function') openUniversalInfoModal('terms');
});

document.getElementById('welcome-link-privacy')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof openUniversalInfoModal === 'function') openUniversalInfoModal('privacy');
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
    if (confirm('⚠️ Si restableces el PIN, se desactivará el bloqueo pero tus datos financieros permanecerán intactos. ¿Continuar?')) {
        authData.pinEnabled = false;
        authData.pinHash = null;
        localStorage.setItem('myFinancesAuth', JSON.stringify(authData));
        document.getElementById('auth-overlay')?.classList.add('hidden');
        syncUserUI();
    }
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

function openSideDrawer() {
    if (fabMenu && !fabMenu.classList.contains('hidden')) {
        fabMenu.classList.add('hidden');
        fabBtn?.classList.remove('active');
    }
    document.getElementById('quick-calendar-popover')?.classList.add('hidden');
    sideDrawerBackdrop?.classList.remove('hidden');
    sideDrawer?.classList.remove('closed');
    sideDrawer?.setAttribute('aria-hidden', 'false');
}

function closeSideDrawer() {
    sideDrawer?.classList.add('closed');
    sideDrawerBackdrop?.classList.add('hidden');
    sideDrawer?.setAttribute('aria-hidden', 'true');
}

function forceCloseAllModals() {
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
    setActiveNav(document.getElementById('nav-home'));
}

function attemptCloseModals() {
    const childModals = [
        'universal-info-modal',
        'health-modal',
        'quick-action-modal',
        'pocket-edit-modal',
        'pocket-action-modal',
        'quick-income-modal',
        'debt-planner-modal',
        'annual-control-modal',
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
}

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

    const daysSinceBackup = Math.floor((Date.now() - (financeData.lastBackupDate || 0)) / (1000 * 3600 * 24));
    if (financeData.transactions.length > 0 && daysSinceBackup >= 30) {
        alerts.push({
            title: '💾 Respaldo preventivo recomendado',
            desc: `Han pasado ${daysSinceBackup} días desde tu última copia de seguridad.`,
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
                alerts.push({
                    title: `💳 Pago Tarjeta ${c.name}`,
                    desc: diffDays === 0 ? `Vence hoy • Saldo: ${formatMoney(bal)}` : `Vence en ${diffDays} día(s) (día ${c.paymentDay}) • Saldo: ${formatMoney(bal)}`,
                    actionLabel: '📅 Calendario',
                    onAction: () => downloadIcsEvent(`Pagar Tarjeta ${c.name}`, `Pago tarjeta ${c.name} por saldo vigente de ${formatMoney(bal)}.`, payDate)
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
                    title: `🎓 Universidad: ${edu.name}`,
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
                    title: `🔁 Pago ${sub.name}`,
                    desc: diffDays < 0 ? `Vencido hace ${Math.abs(diffDays)} día(s) • ${formatMoney(sub.amount)}` : (diffDays === 0 ? `Vence hoy • ${formatMoney(sub.amount)}` : `Vence en ${diffDays} día(s) • ${formatMoney(sub.amount)}`),
                    actionLabel: '💸 Pagar',
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
    financeData.categories.expense.forEach(cat => {
        totalPlannedExp = round2(totalPlannedExp + getCategoryLimitForMonth(cat, mIdx));
    });
    financeData.transactions.forEach(t => {
        if (t.monthId === monthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)) {
            totalSpentExp = round2(totalSpentExp + round2(t.amount));
        }
    });
    if (totalPlannedExp > 0) {
        const pct = Math.round((totalSpentExp / totalPlannedExp) * 100);
        if (pct >= prefs.budgetPct) {
            alerts.push({
                title: pct >= 100 ? '🚨 Presupuesto de gastos excedido' : `⚠️ Presupuesto al ${pct}%`,
                desc: `Has gastado ${formatMoney(totalSpentExp)} de ${formatMoney(totalPlannedExp)} este mes.`,
                actionLabel: 'Ver detalle',
                onAction: () => { document.getElementById('budget-modal')?.classList.remove('hidden'); renderBudgetView(); }
            });
        }
    }

    if (prefs.pendingEnabled) {
        const pendingCount = financeData.transactions.filter(t => t.monthId === monthId && t.status === 'pending').length;
        if (pendingCount > 0 && monthId === getMonthId(currentDate)) {
            alerts.push({
                title: `⏳ ${pendingCount} movimiento(s) pendiente(s)`,
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

    if (alerts.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = '';
    const visibleAlerts = alerts.slice(0, 3);
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
                </div>
                <strong>${stripLeadingEmoji(al.title)}</strong>
                <small>${al.desc}</small>
                <button type="button" class="btn-download-ics">${stripLeadingEmoji(al.actionLabel)}</button>
            `;
            card.querySelector('button').addEventListener('click', al.onAction);
            grid.appendChild(card);
        });
        container.appendChild(grid);
    } else {
        visibleAlerts.forEach(al => {
            const div = document.createElement('div');
            div.className = 'ios-alert-banner';
            div.innerHTML = `
                <div class="ios-alert-info">
                    <strong>${stripLeadingEmoji(al.title)}</strong>
                    <small>${al.desc}</small>
                </div>
                <button type="button" class="btn-download-ics">${stripLeadingEmoji(al.actionLabel)}</button>
            `;
            div.querySelector('button').addEventListener('click', al.onAction);
            container.appendChild(div);
        });
    }
};

// --- 7. TABLERO PERSONALIZABLE (ORDEN DE WIDGETS) ---
const DEFAULT_WIDGET_ORDER = ['cash-flow', 'summary-rings', 'budget-preview', 'balance-sheet', 'credit-cards', 'debts-summary', 'history-list'];

const applyWidgetOrder = () => {
    const container = document.getElementById('dashboard-widgets-container');
    if (!container) return;
    const saved = JSON.parse(localStorage.getItem('myFinancesWidgetOrder') || 'null');
    widgetOrder = Array.isArray(saved) && saved.length > 0 ? saved : [...DEFAULT_WIDGET_ORDER];
    DEFAULT_WIDGET_ORDER.forEach(id => { if (!widgetOrder.includes(id)) widgetOrder.push(id); });

    widgetOrder.forEach(id => {
        const el = container.querySelector(`[data-widget-id="${id}"]`);
        if (el) container.appendChild(el);
    });
};

const WIDGET_NAMES = {
    'cash-flow': 'Flujo de Caja',
    'summary-rings': 'Metas y Salud',
    'budget-preview': 'Presupuesto',
    'balance-sheet': 'Hoja de Balance',
    'credit-cards': 'Tarjetas',
    'debts-summary': 'Préstamos',
    'history-list': 'Movimientos'
};

const refreshEditControlsLimits = () => {
    const container = document.getElementById('dashboard-widgets-container');
    if (!container) return;
    const visibleEls = Array.from(container.querySelectorAll('[data-widget-id]')).filter(el => !el.classList.contains('hidden'));
    visibleEls.forEach((el, idx) => {
        const upBtn = el.querySelector('.widget-move-btn[data-dir="-1"]');
        const downBtn = el.querySelector('.widget-move-btn[data-dir="1"]');
        if (upBtn) upBtn.disabled = (idx === 0);
        if (downBtn) downBtn.disabled = (idx === visibleEls.length - 1);
    });
};

const moveWidgetByOffset = (widgetId, delta) => {
    const container = document.getElementById('dashboard-widgets-container');
    if (!container) return;
    const visibleIds = Array.from(container.querySelectorAll('[data-widget-id]'))
        .filter(el => !el.classList.contains('hidden'))
        .map(el => el.getAttribute('data-widget-id'));

    const visIdx = visibleIds.indexOf(widgetId);
    const targetVisIdx = visIdx + delta;
    if (visIdx === -1 || targetVisIdx < 0 || targetVisIdx >= visibleIds.length) return;

    const targetId = visibleIds[targetVisIdx];
    const fromIdx = widgetOrder.indexOf(widgetId);
    const toIdx = widgetOrder.indexOf(targetId);
    applyWidgetOrder();
    refreshEditControlsLimits();
};

const toggleDashboardEditMode = (forceState = null) => {
    isDashboardEditMode = forceState !== null ? forceState : !isDashboardEditMode;
    const container = document.getElementById('dashboard-widgets-container');
    const toggleBtn = document.getElementById('toggle-edit-widgets-btn');
    if (!container) return;

    if (toggleBtn) toggleBtn.innerText = isDashboardEditMode ? '✓ Listo' : 'Ordenar';

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

    container.querySelectorAll('[data-widget-id]').forEach(el => {
        const wId = el.getAttribute('data-widget-id');
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
                    moveWidgetByOffset(wId, parseInt(btn.getAttribute('data-dir'), 10));
                });
            });
            el.prepend(bar);
        } else {
            el.classList.remove('edit-mode');
        }
    });

    if (isDashboardEditMode) refreshEditControlsLimits();
};

const initDashboardDragAndControls = () => {
    document.getElementById('toggle-edit-widgets-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDashboardEditMode();
    });
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
    // Permitir elegir bolsillos (como la alcancía) para pagar gastos
    accountSelect.innerHTML = buildOptionsHtml(!onlyAssetsForMain, isTransfer || isExpense);
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
        html = `<option value="">⚠️ Crea una Categoría en la pestaña Presupuesto</option>`;
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

    // 1. RENDER WIDGET FLUJO DE CAJA
    if (document.getElementById('monthly-income')) document.getElementById('monthly-income').innerHTML = formatMoneyHtml(monthlyIncome);
    if (document.getElementById('monthly-expense')) document.getElementById('monthly-expense').innerHTML = formatMoneyHtml(monthlyExpense);
    if (document.getElementById('monthly-net')) {
        const netEl = document.getElementById('monthly-net');
        netEl.innerHTML = formatMoneyHtml(cashFlow);
        netEl.className = cashFlow >= 0 ? 'positive' : 'negative';
    }
    const maxFlow = Math.max(monthlyIncome, monthlyExpense, 1);
    setTimeout(() => {
        if (document.getElementById('flow-income-bar')) document.getElementById('flow-income-bar').style.width = `${(monthlyIncome / maxFlow) * 100}%`;
        if (document.getElementById('flow-expense-bar')) document.getElementById('flow-expense-bar').style.width = `${(monthlyExpense / maxFlow) * 100}%`;
    }, 50);

    // 2. RENDER WIDGET SALUD FINANCIERA
    const healthData = calculateFinancialHealth(viewMonthId, currSnap);
    if (document.getElementById('health-score-val')) {
        document.getElementById('health-score-val').innerText = healthData.isNeutral ? '--' : healthData.scores.global;
    }

    const badgeEl = document.getElementById('health-score-badge');
    const healthCircle = document.getElementById('health-ring-progress');

    let hColor = 'var(--positive)';
    if (badgeEl) {
        if (healthData.isNeutral) { badgeEl.innerText = 'Faltan datos ⚪'; badgeEl.className = 'widget-badge neutral'; hColor = 'rgba(148, 163, 184, 0.45)'; }
        else if (healthData.scores.global >= 80) { badgeEl.innerText = 'Excelente 🟢'; badgeEl.className = 'widget-badge good'; hColor = 'var(--positive)'; }
        else if (healthData.scores.global >= 50) { badgeEl.innerText = 'Estable 🟡'; badgeEl.className = 'widget-badge warn'; hColor = '#f59e0b'; }
        else { badgeEl.innerText = 'Riesgo Alto 🔴'; badgeEl.className = 'widget-badge danger'; hColor = 'var(--negative)'; }
    }
    if (healthCircle) {
        healthCircle.style.stroke = hColor;
        const healthVisualPct = Math.max(0.5, healthData.isNeutral ? 0 : healthData.scores.global);
        setTimeout(() => { healthCircle.style.strokeDashoffset = 251.2 - (251.2 * healthVisualPct / 100); }, 100);
    }

    // 3. RENDER WIDGET METAS AHORRO (BOLSILLOS)
    let totalPocketsGoal = 0, sumBal = 0;
    financeData.pockets.forEach(p => {
        const g = round2(p.goal || 0);
        totalPocketsGoal = round2(totalPocketsGoal + g);
        if (g > 0) {
            sumBal += Math.min(g, round2((p.principal || 0) + (p.yields || 0)));
        }
    });

    let pocketsPct = 0;
    if (totalPocketsGoal > 0) pocketsPct = Math.min(100, Math.round((sumBal / totalPocketsGoal) * 100));
    else if (currSnap.pocketsTotal > 0) pocketsPct = 100;

    if (document.getElementById('pockets-ring-pct')) document.getElementById('pockets-ring-pct').innerText = `${pocketsPct}%`;
    if (document.getElementById('pockets-saved-total')) {
        document.getElementById('pockets-saved-total').innerText = `${formatCompact(currSnap.allPocketsTotal)} de ${formatCompact(totalPocketsGoal)}`;
    }

    const goalsCircle = document.getElementById('pockets-ring-progress');
    if (goalsCircle) {
        if (pocketsPct === 100 && totalPocketsGoal > 0) goalsCircle.style.stroke = 'var(--positive)';
        else goalsCircle.style.stroke = 'var(--accent)';
        const visualPct = Math.max(0.5, pocketsPct);
        setTimeout(() => { goalsCircle.style.strokeDashoffset = 251.2 - (251.2 * visualPct / 100); }, 150);
    }

    // 4. RENDER WIDGET PRESUPUESTO
    let globalLimit = 0, totalSpentExp = 0;
    financeData.categories.expense.forEach(c => { globalLimit += getCategoryLimitForMonth(c, viewDate.getMonth()); });
    financeData.transactions.forEach(t => { if (t.monthId === viewMonthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)) { totalSpentExp = round2(totalSpentExp + round2(t.amount)); } });

    const budgetPct = globalLimit > 0 ? Math.min(100, (totalSpentExp / globalLimit) * 100) : 0;
    const bFill = document.getElementById('dash-budget-fill');
    const bBadge = document.getElementById('dash-budget-badge');
    const bPace = document.getElementById('dash-budget-pace-marker');

    if (bFill) {
        if (globalLimit > 0) {
            bFill.style.backgroundColor = budgetPct > 90 ? 'var(--negative)' : (budgetPct > 75 ? '#f59e0b' : 'var(--positive)');
            setTimeout(() => { bFill.style.width = `${budgetPct}%`; }, 200);

            const rem = Math.max(0, round2(globalLimit - totalSpentExp));
            const mDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
            const remainingDays = viewMonthId === getMonthId(currentDate) ? Math.max(1, mDays - currentDate.getDate() + 1) : mDays;
            const dailyAvailable = round2(rem / remainingDays);
            
            if (document.getElementById('dash-budget-spent-text')) document.getElementById('dash-budget-spent-text').innerText = `Gastado: ${formatMoney(totalSpentExp)}`;
            if (document.getElementById('dash-budget-rem-text')) document.getElementById('dash-budget-rem-text').innerHTML = `Libre: ${formatMoney(rem)} <small style="font-weight:600; color:var(--text-muted);">(${formatMoney(dailyAvailable)}/día)</small>`;

            if (bBadge) {
                if (budgetPct <= 75) { bBadge.className = 'widget-badge good'; bBadge.innerText = 'En control'; }
                else if (budgetPct <= 95) { bBadge.className = 'widget-badge warn'; bBadge.innerText = 'Precaución'; }
                else { bBadge.className = 'widget-badge danger'; bBadge.innerText = 'Excedido'; }
            }

            const idealPace = viewMonthId === getMonthId(currentDate) ? (currentDate.getDate() / mDays) * 100 : (viewMonthId < getMonthId(currentDate) ? 100 : 0);

            if (bPace) {
                if (viewMonthId === getMonthId(currentDate)) {
                    bPace.classList.remove('hidden');
                    bPace.style.left = `${idealPace}%`;
                    const hintEl = document.getElementById('dash-budget-pace-hint');
                    if (hintEl) {
                        const paceDiff = budgetPct - idealPace;
                        if (paceDiff > 5) hintEl.innerHTML = `Llevas un <b>ritmo de gasto alto</b> para la fecha (ideal: ${Math.round(idealPace)}%).`;
                        else if (paceDiff < -5) hintEl.innerHTML = `Llevas un ritmo <b>ahorrativo</b> (ideal: ${Math.round(idealPace)}%).`;
                        else hintEl.innerHTML = `Ritmo de gasto <b>acorde al calendario</b> (ideal: ${Math.round(idealPace)}%).`;
                    }
                } else {
                    bPace.classList.add('hidden');
                    if (document.getElementById('dash-budget-pace-hint')) document.getElementById('dash-budget-pace-hint').innerText = '';
                }
            }
        } else {
            bFill.style.width = '0%';
            if (bBadge) { bBadge.className = 'widget-badge neutral'; bBadge.innerText = 'Sin definir'; }
            if (document.getElementById('dash-budget-spent-text')) document.getElementById('dash-budget-spent-text').innerText = `Gastado: ${formatMoney(totalSpentExp)}`;
            if (document.getElementById('dash-budget-rem-text')) document.getElementById('dash-budget-rem-text').innerText = 'Define topes';
            if (bPace) bPace.classList.add('hidden');
            if (document.getElementById('dash-budget-pace-hint')) document.getElementById('dash-budget-pace-hint').innerText = '';
        }
    }

    const budgetCatsPreview = document.getElementById('dash-budget-top-cats');
    if (budgetCatsPreview) {
        const totalsByCat = {};
        financeData.transactions.filter(t => t.monthId === viewMonthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)).forEach(t => {
            totalsByCat[t.category || '📦 Otros'] = round2((totalsByCat[t.category || '📦 Otros'] || 0) + round2(t.amount));
        });
        const sortedCats = Object.entries(totalsByCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
        if (sortedCats.length === 0) budgetCatsPreview.innerHTML = '<span style="font-size:11px; color:var(--text-muted);">Sin gastos registrados.</span>';
        else budgetCatsPreview.innerHTML = sortedCats.map(([cat, amt]) => `<div class="dash-budget-cat-row"><span>${cleanCatName(cat)}</span><b>${formatCompact(amt)}</b></div>`).join('');
    }

    renderSmartAlerts(viewMonthId, currSnap);
    renderTransactionHistory(viewMonthId, currSnap, projectionData);
    renderBalanceSheet(currentBalances, currSnap.netWorth, currSnap);
    renderDashboardCardsSummary(currentBalances);
    renderDashboardDebtsSummary(currentBalances);

    renderNetWorthChart(viewDate, prevDate, prevSnap, currSnap);
    renderCashFlowChart(viewDate, prevDate);
    renderDailySummary();
    renderBudgetDonut(viewMonthId, monthlyExpense);
    renderCalendar(viewDate, 'calendar-days-grid');

    let positiveAssetTotal = 0, positiveLoansTotal = 0;
    financeData.customAccounts.forEach(acc => {
        const b = round2(currentBalances[acc.id] || 0);
        if (acc.category === 'asset' && b > 0) positiveAssetTotal = round2(positiveAssetTotal + b);
        if (acc.category === 'debt' && b > 0) positiveLoansTotal = round2(positiveLoansTotal + b);
    });

    renderAccountsBreakdown(currentBalances, positiveAssetTotal);
    renderCardsBreakdown(currentBalances);
    renderDebtsBreakdown(currentBalances, positiveLoansTotal);
    renderExpensesBreakdown(viewMonthId);

    const bModal = document.getElementById('budget-modal');
    if (bModal && !bModal.classList.contains('hidden')) renderBudgetView();
};

const renderCalendar = (baseDate, containerId) => {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';
    const year = baseDate.getFullYear(), month = baseDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = currentDate.toLocaleDateString('en-CA');
    const viewMonthId = getMonthId(baseDate);

    const dayActivity = {};
    financeData.transactions.forEach(t => {
        if (t.monthId === viewMonthId) {
            const dStr = new Date(t.id).toLocaleDateString('en-CA');
            if (!dayActivity[dStr]) dayActivity[dStr] = { inc: false, exp: false, trf: false, pend: false };
            if (t.status === 'pending') dayActivity[dStr].pend = true;
            else if (t.type === 'income') dayActivity[dStr].inc = true;
            else if (t.type === 'expense') dayActivity[dStr].exp = true;
            else if (t.type === 'transfer') dayActivity[dStr].trf = true;
        }
    });

    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < offset; i++) grid.innerHTML += `<div class="cal-day empty"></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = new Date(year, month, day).toLocaleDateString('en-CA');
        const act = dayActivity[dStr];
        const classes = `cal-day ${dStr === todayStr ? 'today' : ''} ${selectedCalendarDay === dStr ? 'selected' : ''}`;
        let dots = '';
        if (act) {
            if (act.inc) dots += `<span class="cal-dot positive-bg"></span>`;
            if (act.exp) dots += `<span class="cal-dot negative-bg"></span>`;
            if (act.pend) dots += `<span class="cal-dot" style="background:#f59e0b;"></span>`;
            if (act.trf && !act.pend) dots += `<span class="cal-dot" style="background:var(--accent);"></span>`;
        }
        const cell = document.createElement('div');
        cell.className = classes;
        cell.innerHTML = `<span>${day}</span><div class="cal-dots">${dots}</div>`;
        cell.onclick = () => {
            selectedCalendarDay = (selectedCalendarDay === dStr) ? null : dStr;
            forceCloseAllModals();
            updateDashboard();
        };
        grid.appendChild(cell);
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

    if (document.getElementById('bs-kpi-assets')) document.getElementById('bs-kpi-assets').innerText = formatCompact(totalAssets);
    if (document.getElementById('bs-kpi-liabilities')) document.getElementById('bs-kpi-liabilities').innerText = formatCompact(totalLiabilities);

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
            const colorClass = isLiab ? (bal > 0 ? 'negative' : '') : (bal > 0 ? 'positive' : '');
            const iconSvg = getAccountIcon(acc.category);
            const starTag = acc.isDefault ? ' ★' : '';

            const row = document.createElement('div');
            row.className = 'bs-row';
            row.onclick = (e) => {
                e.stopPropagation();
                if (attemptCloseModals()) openAccountDetail(acc.id, 'home');
            };
            row.innerHTML = `<span><span style="color:var(--accent); display:inline-flex;">${iconSvg}</span> ${stripLeadingEmoji(acc.name)}${starTag}</span><strong class="${colorClass}">${formatMoney(displayVal)}</strong>`;
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
            if (attemptCloseModals()) {
                document.getElementById('debts-modal')?.classList.remove('hidden');
                document.querySelector('#debts-type-pills .pill-btn[data-type="receivable"]')?.click();
            }
        };
        cxcRow.innerHTML = `<span><span style="color:var(--positive); display:inline-flex;">${renderIcon('users', 16)}</span> Deudas a Favor</span><strong class="positive">${formatMoney(cxcTotal)}</strong>`;
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
        pRow.innerHTML = `<span><span style="color:var(--positive); display:inline-flex;">${renderIcon('piggy', 16)}</span> Bolsillos de Ahorro</span><strong class="positive">${formatMoney(snap.pocketsTotal)}</strong>`;
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
        faRow.innerHTML = `<span><span style="color:var(--accent); display:inline-flex;">${renderIcon('diamond', 16)}</span> Activos Fijos</span><strong class="positive">${formatMoney(snap.visibleFixedAssetsTotal)}</strong>`;
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

    let totalCardsDebt = 0, totalCardsLimit = 0, scheduledNextStatement = 0, hasDeferredItems = false;
    cards.forEach(card => {
        const debt = Math.max(0, round2(balances[card.id] || 0));
        totalCardsDebt = round2(totalCardsDebt + debt);
        totalCardsLimit = round2(totalCardsLimit + round2(card.creditLimit || 0));
        const pendingItems = getPendingCardPurchases(card.id);
        if (pendingItems.length > 0) {
            hasDeferredItems = true;
            pendingItems.forEach(p => { scheduledNextStatement = round2(scheduledNextStatement + p.nextQuota); });
        }
    });

    const totalCardsAvailable = Math.max(0, round2(totalCardsLimit - totalCardsDebt));
    const displayNextQuota = hasDeferredItems ? Math.min(totalCardsDebt, scheduledNextStatement) : round2(totalCardsDebt / 12);
    const utilPct = totalCardsLimit > 0 ? (totalCardsDebt / totalCardsLimit) * 100 : 0;

    if (badge) {
        badge.innerText = `${cards.length} activa${cards.length !== 1 ? 's' : ''} • ${utilPct.toFixed(0)}%`;
        badge.className = `widget-badge ${utilPct <= 30 ? 'good' : (utilPct <= 70 ? 'warn' : 'danger')}`;
    }

    if (document.getElementById('dash-tc-total-debt')) document.getElementById('dash-tc-total-debt').innerText = formatCompact(totalCardsDebt);
    if (document.getElementById('dash-tc-total-avail')) document.getElementById('dash-tc-total-avail').innerText = formatCompact(totalCardsAvailable);
    if (document.getElementById('dash-tc-monthly-quota')) document.getElementById('dash-tc-monthly-quota').innerText = formatCompact(displayNextQuota);

    const todayDay = currentDate.getDate();
    cards.forEach(card => {
        const debt = round2(balances[card.id] || 0);
        const limit = round2(card.creditLimit || 0);
        const pct = limit > 0 ? Math.min(100, Math.max(0, (debt / limit) * 100)) : 0;
        const barColor = pct > 80 ? 'var(--negative)' : (pct > 50 ? '#f59e0b' : 'var(--positive)');
        const cyclePos = Math.min(98, Math.max(2, (todayDay / 30) * 100));
        const pendingCount = getPendingCardPurchases(card.id).length;
        const iconSvg = renderIcon('card', 14);

        const row = document.createElement('div');
        row.className = 'dash-tc-row';
        row.onclick = (e) => {
            e.stopPropagation();
            if (attemptCloseModals()) openAccountDetail(card.id, 'home');
        };
        row.innerHTML = `
            <div class="dash-tc-top">
                <span style="display:flex; align-items:center; gap:6px;"><span class="drawer-icon-box subtle-box" style="width:22px; height:22px;">${iconSvg}</span> ${card.name}${card.isDefault ? ' ⭐' : ''} ${pendingCount > 0 ? `<small style="color:var(--accent);">(${pendingCount} diff.)</small>` : ''}</span>
                <span>${formatMoneyHtml(debt)} <small style="color:var(--text-muted); font-weight:500;">/ ${formatCompact(limit)}</small></span>
            </div>
            <div class="pace-bar-track">
                <div class="pace-bar-fill" style="width:${pct}%; background-color:${barColor};"></div>
                <div class="pace-marker" style="left:${cyclePos}%; height:14px; top:-3px;"></div>
            </div>
            <div class="dash-tc-sub">
                <span>Disp: <b class="positive">${formatMoneyHtml(Math.max(0, limit - debt))}</b></span>
                <span>Corte: ${card.cutoffDay || '-'} • Pago: ${card.paymentDay || '-'}</span>
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
        const totQ = debt.debtTotalQuotes || 1;
        let monthlyPay = round2(debt.debtMonthlyPayment || 0);

        if (debt.debtType === 'revolving') {
            const revQuotas = getPendingRevolvingPurchases(debt.id).reduce((s, p) => s + p.nextQuota, 0);
            monthlyPay = round2((debt.debtMonthlyPayment || 0) + revQuotas);
        } else if (monthlyPay === 0 && orig > 0 && totQ > 0) {
            monthlyPay = calculateAmortization(orig, totQ, debt.debtRate || 0, debt.debtRateType || 'monthly').payment;
        }

        totalDebtsBalance = round2(totalDebtsBalance + bal);
        totalOriginalDebts = round2(totalOriginalDebts + Math.max(orig, bal));
        if (bal > 0) totalMonthlyQuotas = round2(totalMonthlyQuotas + monthlyPay);
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

        let monthlyPay = round2(debt.debtMonthlyPayment || 0);
        let labelProgress = `Cuotas: ${paidQ}/${totQ}`;
        let subBadge = '';

        if (debt.debtType === 'revolving') {
            const revPurchases = getPendingRevolvingPurchases(debt.id);
            const revQuotas = revPurchases.reduce((s, p) => s + p.nextQuota, 0);
            monthlyPay = round2((debt.debtMonthlyPayment || 0) + revQuotas);
            labelProgress = revPurchases.length > 0 ? `${paidQ}/${totQ}c + ${revPurchases.length} comp.` : `Cuotas: ${paidQ}/${totQ}`;
            subBadge = ` <span class="widget-badge warn" style="font-size:9px; padding:1px 6px;">Rotativo</span>`;
        } else if (monthlyPay === 0 && orig > 0 && totQ > 0) {
            monthlyPay = calculateAmortization(orig, totQ, rate, rateType).payment;
        }

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

    let filteredTxs = financeData.transactions.filter(t => t.monthId === monthId);

    if (selectedCalendarDay) {
        filteredTxs = filteredTxs.filter(t => new Date(t.id).toLocaleDateString('en-CA') === selectedCalendarDay);
    }

    if (activeHistoryFilter !== 'all') {
        if (activeHistoryFilter === 'pending') filteredTxs = filteredTxs.filter(t => t.status === 'pending');
        else filteredTxs = filteredTxs.filter(t => t.type === activeHistoryFilter);
    }

    if (historySearchQuery) {
        const q = historySearchQuery.toLowerCase();
        filteredTxs = filteredTxs.filter(t => {
            const acc = getAccountObj(t.account).name.toLowerCase();
            const toAcc = t.toAccount ? getAccountObj(t.toAccount).name.toLowerCase() : '';
            const cat = (t.category || '').toLowerCase();
            const desc = (t.description || '').toLowerCase();
            return desc.includes(q) || cat.includes(q) || acc.includes(q) || toAcc.includes(q);
        });
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
                    <strong style="color:var(--accent); font-size:13.5px;">🔮 Proyección Realista Híbrida</strong>
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
                    <summary style="font-size:10.5px; color:var(--accent); font-weight:700;">📊 Ver fórmula de cálculo <span>▾</span></summary>
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

    filteredTxs.forEach(t => {
        const isPending = t.status === 'pending';
        const li = document.createElement('li');
        li.className = `history-item ${isPending ? 'pending-item' : ''}`;
        li.onclick = () => { if (attemptCloseModals()) openEditModal(t.id); };

        let sign = '', colorClass = '', iconClass = '', catStr = '';
        const accObj = getAccountObj(t.account);
        let accInfo = accObj.name;
        
        catStr = t.subcategory && t.subcategory !== 'General' ? `${cleanCatName(t.category)} (${t.subcategory})` : cleanCatName(t.category || '');

        if (t.type === 'income') { sign = '+'; colorClass = 'positive'; iconClass = 'positive-bg'; }
        else if (t.type === 'expense') { sign = '-'; colorClass = 'negative'; iconClass = 'subtle-box'; }
        else { sign = ''; colorClass = ''; iconClass = 'accent-box'; catStr = 'Transferencia'; accInfo = `${accObj.name} ➔ ${getAccountObj(t.toAccount).name}`; }

        let extraBadge = '';
        if (isPending) {
            extraBadge += ` • <span style="color:#d97706; font-weight:700;">⏳ Pendiente</span>`;
        } else if (t.budgetedAmount && t.budgetedAmount > 0 && t.type !== 'transfer') {
            const variance = calculateBudgetVariance(t.type, t.amount, t.budgetedAmount);
            if (variance.hasBudget) {
                const signPct = variance.pct > 0 ? '+' : '';
                const colorVar = variance.isFavorable ? 'var(--positive)' : 'var(--negative)';
                extraBadge += ` • <span style="color:${colorVar}; font-weight:600;">Ptto: ${formatCompact(t.budgetedAmount)} (${signPct}${String(variance.pct).replace('.', ',')}%)</span>`;
            }
        }
        if (t.type === 'expense' && t.installments && t.installments > 1) {
            extraBadge += ` • ${t.paidInstallments || 0}/${t.installments}c`;
        }

        const baseAmt = isPending ? round2(t.budgetedAmount || t.amount) : round2(t.amount);
        const confirmBtnHtml = isPending ? `<button type="button" class="btn-confirm-pending" onclick="confirmPendingTx('${t.id}', event)">✓ Confirmar</button>` : '';

        const catIcon = getCategoryIcon(t.category, t.type);
        const accIcon = getAccountIcon(accObj.category);

        li.innerHTML = `
            <div class="drawer-icon-box ${iconClass}" style="margin-right:4px;">
                ${t.type === 'transfer' ? renderIcon('transfer', 16) : catIcon}
            </div>
            <div class="history-info">
                <strong>${stripLeadingEmoji(t.description)}</strong>
                <small><span style="display:inline-flex; align-items:center; gap:3px;">${accIcon}</span> ${catStr ? catStr + ' • ' : ''}${stripLeadingEmoji(accInfo)} • ${t.date}${extraBadge}</small>
            </div>
            <div class="history-amount ${colorClass}">
                <div>${sign}${formatMoneyHtml(baseAmt)}</div>
                ${confirmBtnHtml}
            </div>
        `;
        listEl.appendChild(li);
    });
};

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

// --- 13. CONTROL ANUAL CONSOLIDADO (PTTO VS REAL 12 MESES) ---
const renderAnnualControlTable = () => {
    const thead = document.getElementById('annual-control-thead');
    const tbody = document.getElementById('annual-control-tbody');
    if (!thead || !tbody) return;

    if (document.getElementById('annual-year-title')) {
        document.getElementById('annual-year-title').innerText = annualViewYear;
    }

    const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    let headHtml = `<tr><th>Concepto (${annualViewYear})</th>`;

    shortMonths.forEach(m => {
        headHtml += `<th colspan="2" style="text-align:center; border-left:1px solid rgba(148,163,184,0.2);">${m}</th>`;
    });
    headHtml += `<th colspan="2" style="text-align:center; border-left:2px solid rgba(148,163,184,0.35);">TOTAL AÑO</th></tr><tr><th>Categoría</th>`;

    for (let i = 0; i < 13; i++) {
        headHtml += `<th style="font-size:9px; border-left:1px solid rgba(148,163,184,0.15);">PTTO</th><th style="font-size:9px;">REAL</th>`;
    }
    headHtml += `</tr>`;
    thead.innerHTML = headHtml;

    const incPtto = Array(12).fill(0), incReal = Array(12).fill(0);
    const expPtto = Array(12).fill(0), expReal = Array(12).fill(0);

    const getCatMatrix = (type) => {
        const sortedCats = [...(financeData.categories[type] || [])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        return sortedCats.map(catObj => {
            const pttoArr = Array(12).fill(0), realArr = Array(12).fill(0);
            for (let m = 0; m < 12; m++) {
                const mId = `${annualViewYear}-${String(m + 1).padStart(2, '0')}`;
                const lim = getCategoryLimitForMonth(catObj, m);
                pttoArr[m] = lim;

                realArr[m] = round2(financeData.transactions
                    .filter(t => t.monthId === mId && t.type === type && t.category === catObj.name && !t.isAdjustment && isTxClosed(t))
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

    const incRows = getCatMatrix('income'), expRows = getCatMatrix('expense');

    const buildRowHtml = (label, pArr, rArr, isSummary = false, colorType = 'neutral') => {
        let row = `<tr class="${isSummary ? 'annual-summary-row' : ''}"><td>${label}</td>`;
        let totP = 0, totR = 0;

        for (let m = 0; m < 12; m++) {
            totP = round2(totP + pArr[m]);
            totR = round2(totR + rArr[m]);

            let rColor = '';
            if (colorType === 'income' && rArr[m] > 0) rColor = 'positive';
            else if (colorType === 'expense' && pArr[m] > 0 && rArr[m] > pArr[m]) rColor = 'negative';
            else if (colorType === 'net') rColor = rArr[m] >= 0 ? 'positive' : 'negative';

            row += `<td style="color:var(--text-muted); border-left:1px solid rgba(148,163,184,0.15);">${pArr[m] > 0 ? formatCompact(pArr[m]) : '-'}</td>
                    <td class="${rColor}"><b>${rArr[m] !== 0 ? formatCompact(rArr[m]) : '-'}</b></td>`;
        }
        row += `<td style="border-left:2px solid rgba(148,163,184,0.35); color:var(--text-muted);">${formatCompact(totP)}</td>
                <td><b>${formatCompact(totR)}</b></td></tr>`;
        return row;
    };

    let bodyHtml = '';
    if (annualViewTab === 'summary' || annualViewTab === 'income') {
        bodyHtml += buildRowHtml('📈 TOTAL INGRESOS', incPtto, incReal, true, 'income');
        if (annualViewTab === 'income') incRows.forEach(r => bodyHtml += buildRowHtml(r.name, r.pttoArr, r.realArr, false, 'income'));
    }
    if (annualViewTab === 'summary' || annualViewTab === 'expense') {
        bodyHtml += buildRowHtml('📉 TOTAL EGRESOS', expPtto, expReal, true, 'expense');
        if (annualViewTab === 'expense') expRows.forEach(r => bodyHtml += buildRowHtml(r.name, r.pttoArr, r.realArr, false, 'expense'));
    }
    if (annualViewTab === 'summary') {
        const netPtto = incPtto.map((v, i) => round2(v - expPtto[i]));
        const netReal = incReal.map((v, i) => round2(v - expReal[i]));
        bodyHtml += buildRowHtml('⚖️ FLUJO NETO MES', netPtto, netReal, true, 'net');
    }

    tbody.innerHTML = bodyHtml;
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
        const percentage = totalLiquidity > 0 ? Math.max(0, (balance / totalLiquidity) * 100) : 0;
        const color = assetColors[index % assetColors.length];
        const starTag = acc.isDefault ? ' ⭐' : '';

        if (percentage > 0) {
            combinedBar.innerHTML += `<div class="segment" style="width:${percentage}%; background-color:${color};"></div>`;
        }
        combinedLegend.innerHTML += `
            <div class="legend-item">
                <span class="dot" style="background-color:${color};"></span>
                <span>${acc.name} ${percentage.toFixed(0)}%</span>
            </div>`;

        const deleteBtnHTML = acc.id !== 'Efectivo'
            ? `<button type="button" onclick="event.stopPropagation(); deleteAccount('${acc.id}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); cursor:pointer; font-weight:bold; padding:5px 10px; border-radius:6px; margin-left:10px;">X</button>`
            : '';

        list.innerHTML += `
            <div class="acc-list-item" onclick="openAccountDetail('${acc.id}', 'asset')">
                <div class="acc-list-name">
                    <span class="dot" style="background-color:${color};"></span>
                    <span>${acc.name}${starTag}</span>
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="acc-list-balance">${formatMoney(balance)}</span>
                    ${deleteBtnHTML}
                    <span style="color:var(--text-muted); margin-left:8px; font-size:14px;">›</span>
                </div>
            </div>`;
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
        const starTag = card.isDefault ? ' ⭐' : '';

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
        let monthlyPay = round2(acc.debtMonthlyPayment || 0);
        let subLabel = `${acc.debtPaidQuotes || 0}/${acc.debtTotalQuotes || 1}c`;

        if (acc.debtType === 'revolving') {
            const revPurchases = getPendingRevolvingPurchases(acc.id);
            const revQuotas = revPurchases.reduce((s, p) => s + p.nextQuota, 0);
            monthlyPay = round2((acc.debtMonthlyPayment || 0) + revQuotas);
            subLabel = revPurchases.length > 0 ? `${acc.debtPaidQuotes || 0}/${acc.debtTotalQuotes || 1}c + ${revPurchases.length} comp.` : `${acc.debtPaidQuotes || 0}/${acc.debtTotalQuotes || 1}c`;
        } else if (monthlyPay === 0 && !isPaid) {
            monthlyPay = calculateAmortization(acc.debtOriginal || balance, acc.debtTotalQuotes || 1, acc.debtRate || 0, acc.debtRateType || 'monthly').payment;
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

    const monthExpenses = financeData.transactions.filter(t => t.monthId === viewMonthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t));
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

        combinedBar.innerHTML += `<div class="segment" style="width:${percentage}%; background-color:${color};"></div>`;
        combinedLegend.innerHTML += `
            <div class="legend-item">
                <span class="dot" style="background-color:${color};"></span>
                <span>${cleanCatName(catName)} ${percentage.toFixed(0)}%</span>
            </div>`;

        list.innerHTML += `
            <div class="acc-list-item" style="cursor:default;">
                <div class="acc-list-name">
                    <span class="dot" style="background-color:${color};"></span>
                    <div>
                        <span>${catName}</span>
                        <small style="display:block; color:var(--text-muted); font-size:11px; font-weight:500;">${percentage.toFixed(1)}% del gasto mensual</small>
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

    let globalLimit = 0, globalSpent = 0;
    const showArchived = document.getElementById('toggle-archived-cats')?.checked;
    let categories = [...(financeData.categories[currentBudgetType] || [])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    if (!showArchived) categories = categories.filter(c => !c.isArchived);
    const monthTransactions = financeData.transactions.filter(t => t.monthId === viewMonthId && t.type === currentBudgetType && !t.isAdjustment && isTxClosed(t));
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
        const hasSubLimits = subcatsTotalLimit > 0;
        globalSpent = round2(globalSpent + spent);
        globalLimit = round2(globalLimit + limit);
        
        const catFixedBadge = catObj.isFixed ? ` <span class="widget-badge" style="font-size:9px; background:rgba(239,68,68,0.1); color:var(--negative); gap:3px;">${renderIcon('pin', 10)} Fijo</span>` : '';
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
            const mainText = currentBudgetType === 'expense' ? `Límite: ${formatMoney(limit)}${catRollTag}` : `Meta: ${formatMoney(limit)}${catRollTag}`;
            const subText = currentBudgetType === 'expense'
                ? `<span style="color:${remaining >= 0 ? 'var(--text-muted)' : 'var(--negative)'}; font-weight:600;">${remaining >= 0 ? `Quedan ${formatMoney(remaining)}` : `Excedido ${formatMoney(Math.abs(remaining))}`}</span>`
                : `<span style="color:${remaining <= 0 ? 'var(--positive)' : 'var(--text-muted)'}; font-weight:600;">${remaining <= 0 ? '¡Meta superada!' : `Faltan ${formatMoney(remaining)}`}</span>`;

            progressHtml = `
                <div class="tc-mini-bar"><div class="tc-mini-bar-fill" style="width:${pct}%; background-color:${barColor};"></div></div>
                <div class="budget-cat-sub"><span>${mainText}</span>${subText}</div>`;
        } else {
            progressHtml = `<div class="budget-cat-sub"><span>Sin ${currentBudgetType === 'expense' ? 'límite definido' : 'meta definida'}</span></div>`;
        }

        let subcatsHtml = `<div style="margin-top:10px; padding-left:12px; border-left:2px solid rgba(148,163,184,0.25);">`;
        if (catObj.subcategories) {
            const sortedSubs = [...catObj.subcategories].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
            sortedSubs.forEach(subObj => {
                const subName = subObj.name;
                const subStatus = getCategoryBudgetStatus(catObj, subObj, currentMonthIndex, viewDate.getFullYear());
                const subLimitVal = subStatus.currentLimit;
                const subSpent = totalsBySubcat[`${cat}::${subName}`] || 0;
                const subFixedIcon = subObj.isFixed ? ` <span title="Gasto Fijo" style="color:var(--negative); display:inline-flex; vertical-align:middle; margin-left:3px;">${renderIcon('pin', 11)}</span>` : '';
                const subRollTag = subStatus.rolloverAmt !== 0
                    ? ` <span style="color:${subStatus.rolloverAmt > 0 ? 'var(--positive)' : 'var(--negative)'}; font-weight:700;">(Base ${formatCompact(subStatus.baseLimit)} ${subStatus.rolloverAmt > 0 ? '+' : '−'} ${formatCompact(Math.abs(subStatus.rolloverAmt))})</span>`
                    : '';
                
                const subProgressHtml = subLimitVal > 0
                    ? `<div class="tc-mini-bar" style="margin-top:4px; height:4px;"><div class="tc-mini-bar-fill" style="width:${Math.min(100, (subSpent / subLimitVal) * 100)}%; background-color:${currentBudgetType === 'expense' && subSpent > subLimitVal ? 'var(--negative)' : 'var(--positive)'};"></div></div>
                       <div style="font-size:10.5px; color:var(--text-muted); margin-top:3px;">${formatMoney(subSpent)} / ${formatMoney(subLimitVal)}${subRollTag}</div>`
                    : `<div style="font-size:10.5px; color:var(--text-muted); margin-top:3px;">${currentBudgetType === 'expense' ? 'Gasto' : 'Ingreso'}: ${formatMoney(subSpent)}</div>`;

                subcatsHtml += `
                    <div style="margin-bottom:8px; font-size:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:600; color:var(--text-main);">↳ ${subName}${subFixedIcon}</span>
                            <div style="display:flex; gap:6px; align-items:center;">
                                <button type="button" onclick="openSubcatMonthsConfig('${cat}', '${subName}', '${currentBudgetType}')" style="background:var(--hover-bg); border:1px solid var(--border-color); border-radius:6px; padding:3px 6px; font-size:10px; font-weight:700; color:var(--text-main); cursor:pointer;">⚙️ Editar</button>
                                <button type="button" onclick="deleteSubcategory('${cat}', '${subName}', '${currentBudgetType}')" style="background:rgba(255,59,48,0.1); border:none; color:var(--negative); font-size:10px; font-weight:bold; cursor:pointer; padding:3px 6px; border-radius:6px;">X</button>
                            </div>
                        </div>
                        ${subProgressHtml}
                    </div>`;
            });
        }

        const metaPlaceholder = currentBudgetType === 'expense' ? 'Límite ($)' : 'Meta ($)';
        const fixedCheckHtml = currentBudgetType === 'expense' ? `<label style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--text-muted); cursor:pointer; margin-right:4px;"><input type="checkbox" class="subcat-fixed-check" style="accent-color:var(--negative);"> Fijo</label>` : '';
        
        subcatsHtml += `
            <form onsubmit="event.preventDefault(); addSubcategory('${cat}', '${currentBudgetType}', this.querySelector('.subcat-name-input').value, this.querySelector('.subcat-limit-input').value, this.querySelector('.subcat-fixed-check')?.checked || false, this.querySelector('.subcat-freq-select')?.value || 'monthly', parseInt(this.querySelector('.subcat-month-select')?.value, 10) || 0); this.reset();" style="display:flex; flex-direction:column; gap:8px; margin-top:10px; padding-top:10px; border-top:1px dashed rgba(148,163,184,0.3);">
                <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
                    <input type="text" class="subcat-name-input modal-input" placeholder="Nueva subcategoría..." required style="flex:1; min-width:120px; padding:7px 10px; font-size:12.5px !important; min-height:36px !important;">
                    <input type="text" inputmode="decimal" class="subcat-limit-input money-input modal-input" placeholder="${metaPlaceholder}" style="width:85px; padding:7px 10px; font-size:12.5px !important; min-height:36px !important;">
                    ${fixedCheckHtml}
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
                    <select class="subcat-freq-select modal-input" onchange="this.nextElementSibling.disabled = (this.value === 'monthly')" style="flex:1; padding:7px 10px; font-size:11.5px !important; min-height:36px !important;">
                        <option value="monthly">Mensual</option>
                        <option value="bimonthly">Bimestral</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="semiannual">Semestral</option>
                        <option value="annual">Anual</option>
                    </select>
                    <select class="subcat-month-select modal-input" disabled style="flex:1; padding:7px 10px; font-size:11.5px !important; min-height:36px !important;">
                        ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => `<option value="${i}">${m}</option>`).join('')}
                    </select>
                    <button type="submit" class="btn btn-primary" style="padding:6px 16px; font-size:16px; border-radius:10px; min-height:36px !important; margin-left:auto;">+</button>
                </div>
            </form></div>`;

        const configBtnHtml = `<button type="button" onclick="openMonthlyBudgetConfig('${cat}', '${currentBudgetType}')" title="Editar Categoría" class="mini-action-btn" style="padding:5px 8px; margin-left:8px; font-size:11px;">${renderIcon('sliders', 12)} Editar</button>`;
        const amountColorClass = (currentBudgetType === 'expense') ? (limit > 0 && spent > limit ? 'negative' : '') : 'positive';
        const catVectorIcon = getCategoryIcon(cat, currentBudgetType);

        listContainer.innerHTML += `
            <div class="budget-cat-item">
                <div class="budget-cat-top">
                    <span style="display:inline-flex; align-items:center; gap:8px; min-width:0;"><span class="drawer-icon-box subtle-box" style="width:26px; height:26px; color:var(--accent);">${catVectorIcon}</span><span style="overflow:hidden; text-overflow:ellipsis;">${cleanCatName(cat)}</span>${catFixedBadge}</span>
                    <div style="display:flex; align-items:center;">
                        <span class="${amountColorClass}" style="font-size:15.5px; font-weight:800;">${formatMoney(spent)}</span>
                        ${configBtnHtml}
                        <button type="button" onclick="deleteCategory('${cat}', '${currentBudgetType}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); font-weight:bold; font-size:11px; cursor:pointer; padding:5px 9px; border-radius:8px; margin-left:10px;">X</button>
                    </div>
                </div>
                ${progressHtml}
                ${subcatsHtml}
            </div>`;
    });

    if (totalLimitEl) totalLimitEl.innerText = formatMoney(globalLimit);
    if (totalSpentEl) totalSpentEl.innerText = formatMoney(globalSpent);
};

window.openMonthlyBudgetConfig = (catName, type = 'expense') => {
    const modalEl = document.getElementById('cat-months-modal');
    const gridEl = document.getElementById('cat-12months-grid');
    const subListEl = document.getElementById('cat-edit-subcategories-list');
    if (!modalEl || !gridEl) return;

    document.getElementById('cat-months-target-name').value = catName;
    document.getElementById('cat-months-title').innerText = `Editar: ${catName}`;
    const nameInput = document.getElementById('cat-edit-name-input');
    if (nameInput) nameInput.value = catName;

    const catObj = financeData.categories[type].find(c => c.name === catName);
    if (catObj) {
        if (document.getElementById('cat-edit-rollover')) document.getElementById('cat-edit-rollover').value = catObj.rollover || 'none';
        if (document.getElementById('cat-edit-is-fixed')) document.getElementById('cat-edit-is-fixed').checked = !!catObj.isFixed;
        
        const archBtn = document.getElementById('archive-cat-btn');
        if (archBtn) {
            archBtn.classList.remove('hidden');
            archBtn.innerText = catObj.isArchived ? '📦 Restaurar' : '📦 Archivar';
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
                                <select class="edit-sub-freq-select" onchange="this.parentElement.nextElementSibling.querySelector('select').disabled = (this.value === 'monthly')" style="padding:6px 8px; font-size:11.5px !important; min-height:34px !important;">
                                    <option value="monthly" ${sub.frequency === 'monthly' ? 'selected' : ''}>Mensual</option>
                                    <option value="bimonthly" ${sub.frequency === 'bimonthly' ? 'selected' : ''}>Bimestral</option>
                                    <option value="quarterly" ${sub.frequency === 'quarterly' ? 'selected' : ''}>Trimestral</option>
                                    <option value="semiannual" ${sub.frequency === 'semiannual' ? 'selected' : ''}>Semestral</option>
                                    <option value="annual" ${sub.frequency === 'annual' ? 'selected' : ''}>Anual</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="font-size:10px;">Mes Inicial</label>
                                <select class="edit-sub-month-select" ${(!sub.frequency || sub.frequency === 'monthly') ? 'disabled' : ''} style="padding:6px 8px; font-size:11.5px !important; min-height:34px !important;">
                                    ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => `<option value="${i}" ${(sub.startMonth || 0) == i ? 'selected' : ''}>${m}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--text-muted); cursor:pointer;">
                                <input type="checkbox" class="edit-sub-fixed-check" ${sub.isFixed ? 'checked' : ''} style="accent-color:var(--negative);"> 📌 Gasto Fijo
                            </label>
                            <button type="button" onclick="deleteSubcategory('${catName}', '${sub.name}', '${type}')" style="background:none; border:none; color:var(--negative); font-size:11px; font-weight:700; cursor:pointer;">✕ Eliminar</button>
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

    if (!name || financeData.customAccounts.some(a => a.id.toLowerCase() === name.toLowerCase())) {
        alert('Nombre de cuenta inválido o duplicado.');
        return;
    }

    financeData.customAccounts.push({ id: name, name, category: 'asset', isDefault: false, showWhenZero: false });
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
    hasUnsavedChanges = false;
    renderAccountSelects();
    updateDashboard();
});

const updateNewCardPreview = () => {
    const prevEl = document.getElementById('new-card-available-preview');
    if (!prevEl) return;
    const lim = parseMoneyInput(document.getElementById('new-card-limit')?.value);
    const dbt = parseMoneyInput(document.getElementById('new-card-debt')?.value);
    prevEl.innerText = `Saldo disponible inicial: ${formatMoney(round2(lim - dbt))}`;
};
document.getElementById('new-card-limit')?.addEventListener('input', updateNewCardPreview);
document.getElementById('new-card-debt')?.addEventListener('input', updateNewCardPreview);

document.getElementById('new-card-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-card-name').value.trim();
    const limit = parseMoneyInput(document.getElementById('new-card-limit').value);
    const debt = parseMoneyInput(document.getElementById('new-card-debt').value);
    const makeDefault = !!document.getElementById('new-card-default')?.checked;

    if (!name || financeData.customAccounts.some(a => a.id.toLowerCase() === name.toLowerCase())) {
        alert('Nombre de tarjeta inválido o duplicado.');
        return;
    }

    financeData.customAccounts.push({
        id: name, name, category: 'credit_card', isDefault: false, showWhenZero: false, creditLimit: limit,
        cutoffDay: parseInt(document.getElementById('new-card-cutoff').value, 10) || 15,
        paymentDay: parseInt(document.getElementById('new-card-payment').value, 10) || 30,
        rate: parseMoneyInput(document.getElementById('new-card-rate').value),
        rateType: document.getElementById('new-card-rate-type').value,
        zeroInterestMax: parseInt(document.getElementById('new-card-zero-interest-max').value, 10) || 0
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
    hasUnsavedChanges = false;
    renderSalaryUI(true); // <-- FUERZA LA SINCRONIZACIÓN DEL PRESUPUESTO
    updateDashboard();
    renderAccountSelects();
});

// --- 15.5 GESTOR DE SUSCRIPCIONES Y GASTOS FIJOS ---
window.renderSubscriptionsView = () => {
    const listContainer = document.getElementById('subscriptions-list-container');
    if (!listContainer) return;

    const accSelect = document.getElementById('new-sub-account');
    const catSelect = document.getElementById('new-sub-category');
    if (accSelect && accSelect.options.length <= 1) {
        const liqAndCards = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset' || a.category === 'credit_card'));
        accSelect.innerHTML = liqAndCards.map(a => `<option value="${a.id}">${a.name}${a.isDefault ? ' ⭐' : ''}</option>`).join('');
    }
    if (catSelect && catSelect.options.length <= 1) {
        let html = '';
        [...(financeData.categories.expense || [])].filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name, 'es')).forEach(cat => {
            if (cat.subcategories && cat.subcategories.length > 0) {
                html += `<optgroup label="${cleanCatName(cat.name)}">`;
                html += `<option value="${cat.name}::General">${cleanCatName(cat.name)} (General)</option>`;
                [...cat.subcategories].filter(s => !s.archived).sort((a, b) => a.name.localeCompare(b.name, 'es')).forEach(sub => {
                    html += `<option value="${cat.name}::${sub.name}">↳ ${sub.name}</option>`;
                });
                html += `</optgroup>`;
            } else {
                html += `<option value="${cat.name}::General">${cleanCatName(cat.name)}</option>`;
            }
        });
        catSelect.innerHTML = html;
    }

    listContainer.innerHTML = '';
    let totalMonthly = 0, totalAnnual = 0;
    const activeSubs = (financeData.subscriptions || []).filter(s => s.status === 'active');

    if (activeSubs.length === 0) {
        listContainer.innerHTML = '<p style="color:var(--text-muted); font-size:12.5px; text-align:center; padding:20px 0;">No tienes suscripciones registradas.</p>';
        document.getElementById('subs-monthly-total').innerText = '$ 0,00';
        document.getElementById('subs-annual-total').innerText = '$ 0,00';
        return;
    }

    const cycleLabels = { monthly: 'Mes', bimonthly: 'Bimestre', quarterly: 'Trimestre', semiannual: 'Semestre', annual: 'Año', weekly: 'Semana' };

    activeSubs.sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate)).forEach(sub => {
        let monthlyEquiv = sub.amount;
        if (sub.cycle === 'annual') monthlyEquiv = round2(sub.amount / 12);
        else if (sub.cycle === 'semiannual') monthlyEquiv = round2(sub.amount / 6);
        else if (sub.cycle === 'quarterly') monthlyEquiv = round2(sub.amount / 3);
        else if (sub.cycle === 'bimonthly') monthlyEquiv = round2(sub.amount / 2);
        else if (sub.cycle === 'weekly') monthlyEquiv = round2((sub.amount * 52) / 12);

        totalMonthly = round2(totalMonthly + monthlyEquiv);
        totalAnnual = round2(totalAnnual + round2(monthlyEquiv * 12));

        let diffDays = 999, badgeHtml = '';
        if (sub.nextBillingDate) {
            const [y, m, d] = sub.nextBillingDate.split('-').map(Number);
            const nextDate = new Date(y, m - 1, d, 8, 30, 0);
            diffDays = Math.ceil((nextDate - currentDate) / (1000 * 3600 * 24));
            if (diffDays < 0) badgeHtml = `<span class="widget-badge danger" style="font-size:9.5px; padding:2px 6px;">Vencido</span>`;
            else if (diffDays === 0) badgeHtml = `<span class="widget-badge warn" style="font-size:9.5px; padding:2px 6px;">Hoy</span>`;
            else if (diffDays <= 7) badgeHtml = `<span class="widget-badge warn" style="font-size:9.5px; padding:2px 6px;">En ${diffDays}d</span>`;
            else badgeHtml = `<span class="widget-badge neutral" style="font-size:9.5px; padding:2px 6px;">${diffDays}d</span>`;
        }

        const reserveBadge = sub.reserveInBudget ? `<span class="widget-badge good" style="font-size:9px; padding:2px 6px;">Ptto</span>` : '';
        const btnClass = diffDays <= 7 ? 'btn-confirm-pending' : 'mini-action-btn';

        listContainer.innerHTML += `
            <div class="acc-list-item" style="padding:12px 14px; gap:8px;">
                <div class="acc-list-name" style="flex:1;">
                    <div style="flex:1; min-width:0;">
                        <span style="font-size:14px; font-weight:800; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sub.name}</span>
                        <small style="display:flex; align-items:center; flex-wrap:wrap; gap:5px; font-size:11px; color:var(--text-muted); font-weight:600;">
                            ${formatMoneyHtml(sub.amount)}/${cycleLabels[sub.cycle] || 'Mes'} ${badgeHtml} ${reserveBadge}
                        </small>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                    <button type="button" onclick="processSubscriptionPayment('${sub.id}')" class="${btnClass}" style="margin:0;">Pagar</button>
                    <button type="button" onclick="editSubscription('${sub.id}')" class="mini-action-btn" style="background:transparent; border:none; padding:2px 6px; font-size:10.5px; color:var(--text-muted);">Editar</button>
                </div>
            </div>`;
    });

    document.getElementById('subs-monthly-total').innerText = formatMoney(totalMonthly);
    document.getElementById('subs-annual-total').innerText = formatMoney(totalAnnual);
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
        description: `Pago fijo: ${sub.name}`,
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
    document.getElementById('edit-sub-id').value = sub.id;
    document.getElementById('new-sub-name').value = sub.name;
    document.getElementById('new-sub-amount').value = formatNumberInput(sub.amount);
    document.getElementById('new-sub-cycle').value = sub.cycle;
    document.getElementById('new-sub-next-date').value = sub.nextBillingDate;
    document.getElementById('new-sub-account').value = sub.accountId;
    document.getElementById('new-sub-category').value = sub.category;
    if (document.getElementById('new-sub-reserve')) document.getElementById('new-sub-reserve').checked = !!sub.reserveInBudget;
    document.getElementById('btn-sub-cancel').classList.remove('hidden');
    document.getElementById('btn-sub-delete').classList.remove('hidden');
};

document.getElementById('btn-sub-cancel')?.addEventListener('click', () => {
    document.getElementById('new-subscription-form').reset();
    document.getElementById('sub-form-title').innerText = 'Nueva Suscripción / Fijo';
    document.getElementById('edit-sub-id').value = '';
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
    const subData = {
        name: document.getElementById('new-sub-name').value.trim(),
        amount: parseMoneyInput(document.getElementById('new-sub-amount').value),
        cycle: document.getElementById('new-sub-cycle').value,
        nextBillingDate: document.getElementById('new-sub-next-date').value,
        accountId: document.getElementById('new-sub-account').value,
        category: rawCat.split('::')[0] || rawCat,
        reserveInBudget: !!document.getElementById('new-sub-reserve')?.checked,
        reminderDays: 3,
        status: 'active'
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

    ['analytics-modal', 'cards-modal', 'debts-modal', 'assets-modal', 'asset-detail-modal', 'budget-modal', 'accounts-list-view', 'health-modal'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });

    document.getElementById('accounts-modal')?.classList.remove('hidden');
    document.getElementById('account-detail-view')?.classList.remove('hidden');

    if (document.getElementById('detail-account-name')) document.getElementById('detail-account-name').innerText = `${acc.name}${acc.isDefault ? ' ⭐' : ''}`;
    if (document.getElementById('reconcile-account-id')) document.getElementById('reconcile-account-id').value = acc.id;
    if (document.getElementById('reconcile-real-amount')) document.getElementById('reconcile-real-amount').value = '';

    const defBtn = document.getElementById('toggle-default-account-btn');
    if (defBtn) {
        if (acc.category === 'debt') defBtn.classList.add('hidden');
        else {
            defBtn.classList.remove('hidden');
            defBtn.innerText = acc.isDefault ? '⭐ Predet.' : '☆ Predet.';
        }
    }

    if (document.getElementById('account-show-when-zero')) {
        document.getElementById('account-show-when-zero').checked = !!acc.showWhenZero;
    }

    const currentBal = round2(currentBalances[acc.id] || 0);
    if (document.getElementById('detail-account-balance')) document.getElementById('detail-account-balance').innerText = formatMoney(currentBal);

    const cardExtraBox = document.getElementById('card-extra-info'), editCardBtn = document.getElementById('edit-card-settings-btn');
    const debtExtraBox = document.getElementById('debt-extra-info'), editDebtBtn = document.getElementById('edit-debt-settings-btn');
    ['edit-card-form', 'edit-debt-form', 'pay-installment-box', 'amortization-panel'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
    
    // Forzar reinicio de estado del botón universitario
    if (document.getElementById('open-education-extra-btn')) document.getElementById('open-education-extra-btn').classList.add('hidden');

    if (acc.category === 'credit_card') {
        cardExtraBox?.classList.remove('hidden'); editCardBtn?.classList.remove('hidden');
        debtExtraBox?.classList.add('hidden'); editDebtBtn?.classList.add('hidden');

        const limit = round2(acc.creditLimit || 0), available = round2(limit - currentBal), availEl = document.getElementById('detail-card-available');
        if (document.getElementById('detail-card-limit')) document.getElementById('detail-card-limit').innerText = formatMoney(limit);
        if (availEl) { availEl.innerText = formatMoney(available); availEl.className = available >= 0 ? 'positive' : 'negative'; }
        if (document.getElementById('detail-card-dates')) document.getElementById('detail-card-dates').innerText = `📅 Corte: ${acc.cutoffDay || '-'} • Pago: ${acc.paymentDay || '-'}`;

        const icsBtn = document.getElementById('btn-detail-card-ics');
        if (icsBtn) {
            icsBtn.onclick = () => {
                const payDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), acc.paymentDay || 15, 8, 30, 0);
                downloadIcsEvent(`Pagar Tarjeta ${acc.name}`, `Pago tarjeta ${acc.name} por saldo vigente de ${formatMoney(currentBal)}.`, payDate);
            };
        }

        if (document.getElementById('edit-card-limit')) document.getElementById('edit-card-limit').value = formatNumberInput(limit);
        if (document.getElementById('edit-card-cutoff')) document.getElementById('edit-card-cutoff').value = acc.cutoffDay || 15;
        if (document.getElementById('edit-card-payment')) document.getElementById('edit-card-payment').value = acc.paymentDay || 30;
        if (document.getElementById('edit-card-rate')) document.getElementById('edit-card-rate').value = acc.rate ? formatNumberInput(acc.rate) : '';
        if (document.getElementById('edit-card-rate-type')) document.getElementById('edit-card-rate-type').value = acc.rateType || 'monthly';
        if (document.getElementById('edit-card-zero-interest-max')) document.getElementById('edit-card-zero-interest-max').value = acc.zeroInterestMax || 0;

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

        if (acc.debtType === 'revolving') {
            revPurchasesSection?.classList.remove('hidden');
            nextQuotaBox?.classList.add('hidden');
            amortBtn?.classList.add('hidden');
            const listEl = document.getElementById('revolving-purchases-list');
            if (listEl) {
                const pendingPurchases = getPendingRevolvingPurchases(acc.id);
                listEl.innerHTML = pendingPurchases.length === 0
                    ? '<small style="color:var(--text-muted); font-size:11px;">No hay compras pendientes.</small>'
                    : pendingPurchases.map(item => `
                        <div class="deferred-item-card" onclick="forceCloseAllModals(); openEditModal(${item.tx.id});" style="cursor:pointer;">
                            <div class="deferred-item-top"><span>${item.tx.description}</span><span class="negative">${formatMoney(item.remCapital)}</span></div>
                            <div class="deferred-item-sub"><span>Cuotas: <b>${item.paidInstallments}/${item.installments}</b></span><span>Cuota Mes: <b>${formatMoney(item.nextQuota)}</b></span></div>
                        </div>`).join('');
            }
            const totalQuotes = acc.debtTotalQuotes || 1, paidQuotes = acc.debtPaidQuotes || 0;
            const revQuotas = getPendingRevolvingPurchases(acc.id).reduce((s, p) => s + p.nextQuota, 0);
            const totalNextQuota = round2((acc.debtMonthlyPayment || 0) + revQuotas);
            const progressPct = originalDebt > 0 ? Math.min(100, (Math.max(0, originalDebt - currentBal) / originalDebt) * 100) : 0;
            if (document.getElementById('detail-debt-original')) document.getElementById('detail-debt-original').innerText = formatMoney(originalDebt);
            if (document.getElementById('detail-debt-progress-pct')) document.getElementById('detail-debt-progress-pct').innerText = `${progressPct.toFixed(1)}%`;
            if (document.getElementById('detail-debt-progress-fill')) document.getElementById('detail-debt-progress-fill').style.width = `${progressPct}%`;
            if (document.getElementById('detail-debt-payment')) document.getElementById('detail-debt-payment').innerText = formatMoney(totalNextQuota);
            if (document.getElementById('detail-debt-installments')) document.getElementById('detail-debt-installments').innerText = `${paidQuotes} / ${totalQuotes}`;
            if (document.getElementById('detail-debt-rate')) document.getElementById('detail-debt-rate').innerText = `${String(rate).replace('.', ',')}% ${rateType === 'monthly' ? 'M.V.' : 'E.A.'}`;
        } else {
            revPurchasesSection?.classList.add('hidden');
            nextQuotaBox?.classList.remove('hidden');
            amortBtn?.classList.remove('hidden');
            const totalQuotes = acc.debtTotalQuotes || 1, paidQuotes = acc.debtPaidQuotes || 0;
            const amortData = calculateAmortization(originalDebt, totalQuotes, rate, rateType);
            activeAmortizationSchedule = amortData.schedule;
            const customMonthlyPayment = round2(acc.debtMonthlyPayment || amortData.payment);
            const principalPaid = Math.max(0, round2(originalDebt - currentBal));
            const progressPct = originalDebt > 0 ? Math.min(100, (principalPaid / originalDebt) * 100) : 0;

            if (document.getElementById('detail-debt-original')) document.getElementById('detail-debt-original').innerText = formatMoney(originalDebt);
            if (document.getElementById('detail-debt-progress-pct')) document.getElementById('detail-debt-progress-pct').innerText = `${progressPct.toFixed(1)}%`;
            if (document.getElementById('detail-debt-progress-fill')) document.getElementById('detail-debt-progress-fill').style.width = `${progressPct}%`;
            if (document.getElementById('detail-debt-payment')) document.getElementById('detail-debt-payment').innerText = formatMoney(customMonthlyPayment);
            if (document.getElementById('detail-debt-installments')) document.getElementById('detail-debt-installments').innerText = `${paidQuotes} / ${totalQuotes}`;
            if (document.getElementById('detail-debt-rate')) document.getElementById('detail-debt-rate').innerText = `${String(rate).replace('.', ',')}% ${rateType === 'monthly' ? 'M.V.' : 'E.A.'}`;

            const nextInterest = round2(currentBal * amortData.monthlyRate);
            const nextPrincipal = Math.min(currentBal, Math.max(0, round2(customMonthlyPayment - nextInterest)));
            if (document.getElementById('detail-debt-next-principal')) document.getElementById('detail-debt-next-principal').innerText = formatMoney(nextPrincipal);
            if (document.getElementById('detail-debt-next-interest')) document.getElementById('detail-debt-next-interest').innerText = formatMoney(nextInterest);

            let totalInterestRemaining = 0;
            if (activeAmortizationSchedule.length > paidQuotes) {
                activeAmortizationSchedule.slice(paidQuotes).forEach(r => totalInterestRemaining = round2(totalInterestRemaining + r.interest));
            }
            if (document.getElementById('detail-debt-total-interest')) document.getElementById('detail-debt-total-interest').innerText = formatMoney(totalInterestRemaining);

            if (document.getElementById('pay-debt-principal')) document.getElementById('pay-debt-principal').value = formatNumberInput(nextPrincipal);
            if (document.getElementById('pay-debt-interest')) document.getElementById('pay-debt-interest').value = formatNumberInput(nextInterest);
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
                
                const eduBody = document.getElementById('education-table-body');
                if (eduBody) {
                    let html = '';
                    let runningBal = round2(originalDebt);
                    
                    // Render Cuotas de Matrícula
                    for (let i = 1; i <= totalQuotes; i++) {
                        const isPaid = i <= paidQuotes;
                        const payAmt = isPaid ? amortData.payment : 0;
                        if (isPaid) runningBal = Math.max(0, round2(runningBal - amortData.payment));
                        html += `<tr><td style="text-align:left;">Cuota ${String(i).padStart(2, '0')} de ${totalQuotes}</td><td>${formatMoney(amortData.payment)}</td><td class="positive">${isPaid ? formatMoney(payAmt) : ''}</td><td>${formatMoney(runningBal)}</td></tr>`;
                    }
                    
                    // Render Trámites Adicionales (Ej. Constancias)
                    if (acc.extraFees && acc.extraFees.length > 0) {
                        acc.extraFees.forEach(fee => {
                            html += `<tr style="background:rgba(148,163,184,0.06);"><td style="text-align:left; color:var(--text-muted);">${fee.name}</td><td>${formatMoney(fee.amount)}</td><td class="positive">${fee.paid ? formatMoney(fee.amount) : ''}</td><td>-</td></tr>`;
                        });
                    }
                    eduBody.innerHTML = html;
                }
                
                // Acción para agregar trámites
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
                            financeData.transactions.push({ id: now.getTime(), monthId: getMonthId(now), type: 'expense', status: 'closed', account: acc.id, description: `⚖️ Cargo Universidad: ${feeName}`, amount: feeAmt, date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: true });
                        } else {
                            const now = new Date();
                            financeData.transactions.push({
                                id: now.getTime(), monthId: getMonthId(now), type: 'expense', status: 'closed', 
                                account: getDefaultAccountId(false), category: '🎓 Educación', subcategory: 'Trámites', 
                                description: `🎓 Trámite: ${feeName}`, amount: feeAmt, 
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
                        txt += `CUOTAS PAGADAS (${paidQuotes} de ${totalQuotes}):\n`;
                        for (let i = 1; i <= totalQuotes; i++) {
                            txt += `- Cuota ${String(i).padStart(2, '0')}: ${i <= paidQuotes ? '✅ PAGADO (' + formatMoney(amortData.payment) + ')' : '⏳ Pendiente'}\n`;
                        }
                        if (acc.extraFees && acc.extraFees.length > 0) {
                            txt += `\nTRÁMITES EXTRAORDINARIOS:\n`;
                            acc.extraFees.forEach(fee => {
                                txt += `- ${fee.name}: ${formatMoney(fee.amount)} ${fee.paid ? '[✅ PAGADO]' : '[⏳ PENDIENTE]'}\n`;
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
                    const remSched = activeAmortizationSchedule.slice(paidQuotes);
                    tbody.innerHTML = remSched.length === 0 ? '<tr><td colspan="5" style="text-align:center;">Préstamo liquidado 🎉</td></tr>' : remSched.map(row => `<tr><td>${row.period}</td><td>${formatMoney(row.payment)}</td><td class="positive">${formatMoney(row.principal)}</td><td class="negative">${formatMoney(row.interest)}</td><td>${formatMoney(row.balance)}</td></tr>`).join('');
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
        if (isLiabilityCategory(acc.category)) {
            if (document.getElementById('detail-balance-label')) document.getElementById('detail-balance-label').innerText = 'Deuda registrada:';
            if (document.getElementById('reconcile-input-label')) document.getElementById('reconcile-input-label').innerText = '⚖️ Ajustar deuda real:';
            balEl.classList.add('negative');
        } else {
            if (document.getElementById('detail-balance-label')) document.getElementById('detail-balance-label').innerText = 'Saldo registrado:';
            if (document.getElementById('reconcile-input-label')) document.getElementById('reconcile-input-label').innerText = '⚖️ Ajustar saldo real:';
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
            li.innerHTML = `<div class="history-info"><strong>${t.description}</strong><small>${t.date}</small></div><div class="history-amount ${colorClass}">${sign} ${formatMoney(t.amount)}</div>`;
            historyList.appendChild(li);
        });
    }
};

document.getElementById('toggle-default-account-btn')?.addEventListener('click', () => {
    const accountId = document.getElementById('reconcile-account-id')?.value;
    if (!accountId) return;
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
document.getElementById('edit-card-settings-btn')?.addEventListener('click', () => document.getElementById('edit-card-form')?.classList.toggle('hidden'));
document.getElementById('edit-card-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    acc.creditLimit = parseMoneyInput(document.getElementById('edit-card-limit').value);
    acc.cutoffDay = parseInt(document.getElementById('edit-card-cutoff').value, 10) || 15;
    acc.paymentDay = parseInt(document.getElementById('edit-card-payment').value, 10) || 30;
    acc.rate = parseMoneyInput(document.getElementById('edit-card-rate').value);
    acc.rateType = document.getElementById('edit-card-rate-type').value;
    acc.zeroInterestMax = parseInt(document.getElementById('edit-card-zero-interest-max').value, 10) || 0;
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
    const newBal = Math.max(0, currentBal - extra);
    
    const tbody = document.getElementById('amortization-table-body');
    const resLab = document.getElementById('sim-savings-result');
    
    if (extra <= 0) {
        if (resLab) resLab.innerText = '';
        if (tbody) tbody.innerHTML = standardAmort.schedule.map(row => `<tr><td>${row.period + paidQuotes}</td><td>${formatMoney(row.payment)}</td><td class="positive">${formatMoney(row.principal)}</td><td class="negative">${formatMoney(row.interest)}</td><td>${formatMoney(row.balance)}</td></tr>`).join('');
        return;
    }
    
    const newAmort = calculateAmortization(newBal, remQuotes, rate, rateType);
    const savedInt = standardAmort.totalInterest - newAmort.totalInterest;
    if (resLab) resLab.innerText = `💡 Ahorrarías ${formatMoney(savedInt)} en intereses.`;
    if (tbody) tbody.innerHTML = newAmort.schedule.map(row => `<tr><td>${row.period + paidQuotes}</td><td>${formatMoney(row.payment)}</td><td class="positive">${formatMoney(row.principal)}</td><td class="negative">${formatMoney(row.interest)}</td><td>${formatMoney(row.balance)}</td></tr>`).join('');
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

    if (principalAmt > 0) {
        financeData.transactions.push({ id: transactionDateObj.getTime() + Math.floor(Math.random() * 500), monthId: mId, type: 'transfer', status: 'closed', account: sourceAcc, toAccount: accountId, description: `💸 Pago Capital (Cuota ${(acc.debtPaidQuotes || 0) + 1})`, amount: principalAmt, date: `${displayDate}, ${displayTime}`, isAdjustment: false, paymentMode: 'installments', allocatedItems: [{ kind: 'debt_quota', debtId: accountId, amountApplied: principalAmt }] });
    }
    if (interestAmt > 0) {
        financeData.transactions.push({ id: transactionDateObj.getTime() + 500 + Math.floor(Math.random() * 500), monthId: mId, type: 'expense', status: 'closed', account: sourceAcc, category: '💳 Cuotas / Intereses', subcategory: 'General', description: `📉 Intereses Préstamo (${acc.name})`, amount: interestAmt, date: `${displayDate}, ${displayTime}`, isAdjustment: false });
    }
    acc.debtPaidQuotes = (acc.debtPaidQuotes || 0) + 1;
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
    financeData.transactions.push({ id: now.getTime() + Math.floor(Math.random() * 1000), monthId: getMonthId(now), type: adjustType, status: 'closed', account: accountId, description: '⚖️ Ajuste / Reconciliación', amount: round2(Math.abs(diff)), date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: true });
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

document.getElementById('back-to-accounts-btn')?.addEventListener('click', () => {
    document.getElementById('account-detail-view')?.classList.add('hidden');
    if (lastAccountViewOrigin === 'home') forceCloseAllModals();
    else if (lastAccountViewOrigin === 'credit_card') { document.getElementById('accounts-modal')?.classList.add('hidden'); document.getElementById('cards-modal')?.classList.remove('hidden'); }
    else if (lastAccountViewOrigin === 'debt') { document.getElementById('accounts-modal')?.classList.add('hidden'); document.getElementById('debts-modal')?.classList.remove('hidden'); }
    else document.getElementById('accounts-list-view')?.classList.remove('hidden');
});

// --- BOLSILLOS DE AHORRO ---
let userEditedNewPocketQuota = false;

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

    // Indicador de ritmo si tiene fecha de inicio, fecha objetivo y meta
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
    const list = document.getElementById('pockets-list-container');
    if (!list) return;
    list.innerHTML = '';
    let totalSaved = 0, totalYields = 0, totalMonthlySuggested = 0;

    if (!financeData.pockets || financeData.pockets.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:18px 0;">No tienes bolsillos creados.</p>';
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
            if (p.excludeFromBalance) dateLabel += ' • 👁️ Oculto del Balance';

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

            list.innerHTML += `
                <div class="pocket-card">
                    <div class="pocket-card-top">
                        <div>
                            <strong style="font-size:14px; display:flex; align-items:center; gap:6px;"><span style="color:var(--positive); display:inline-flex;">${renderIcon('piggy', 16)}</span> ${stripLeadingEmoji(p.name)}${p.entity ? ` (${p.entity})` : ''}${paceBadge}</strong>
                            <small style="display:block; font-size:11px; color:var(--text-muted);">${dateLabel}${m.yields > 0 ? ` • Rend: +${formatMoney(m.yields)}` : ''}</small>
                        </div>
                        <div style="text-align:right; display:flex; align-items:center; gap:6px;">
                            <strong class="positive" style="font-size:15px;">${formatMoney(m.balance)}</strong>
                            <button type="button" onclick="openEditPocket('${p.id}')" title="Editar bolsillo" style="background:var(--hover-bg); border:1px solid var(--border-color); color:var(--text-main); padding:4px 6px; border-radius:6px; cursor:pointer; display:inline-flex;">${renderIcon('edit', 13)}</button>
                            <button type="button" onclick="deletePocket('${p.id}')" title="Eliminar bolsillo" style="background:none; border:none; color:var(--negative); font-size:11px; font-weight:bold; cursor:pointer;">X</button>
                        </div>
                    </div>
                    ${barHtml}
                    <div class="pocket-actions-row">
                        <button type="button" class="pocket-mini-btn" onclick="openPocketAction('${p.id}', 'deposit')">+ Abonar</button>
                        <button type="button" class="pocket-mini-btn" onclick="openPocketAction('${p.id}', 'yield')" style="color:var(--accent);">📈 Rendim.</button>
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
    if (document.getElementById('edit-pocket-include-balance')) {
        p.excludeFromBalance = !document.getElementById('edit-pocket-include-balance').checked;
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    document.getElementById('pocket-edit-modal')?.classList.add('hidden');
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
        openOmniModal({
            type: 'income',
            title: `Rendimientos • ${p.name}`,
            account: p.id,
            category: '📈 Rendimientos::General',
            description: `📈 Rendimientos: ${p.name}`,
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
        excludeFromBalance
    });
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('add-pocket-form').reset();
    userEditedNewPocketQuota = false;
    if (document.getElementById('new-pocket-quota-hint')) document.getElementById('new-pocket-quota-hint').innerText = '';
    hasUnsavedChanges = false;
    renderPocketsView();
    renderAccountSelects();
    updateDashboard();
});

window.deletePocket = (id) => {
    if (confirm('¿Eliminar este bolsillo de ahorro?')) {
        financeData.pockets = financeData.pockets.filter(x => String(x.id) !== String(id));
        localStorage.setItem('myFinances', JSON.stringify(financeData));
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
    hasUnsavedChanges = false; updateDashboard(); renderAssetsBreakdown();
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
    const activeDebts = financeData.customAccounts.filter(a => (a.category === 'debt' || a.category === 'credit_card') && snap.bals[a.id] > 0).map(a => {
        const bal = round2(snap.bals[a.id]);
        let rate = 0, minPay = 0;
        if (a.category === 'debt') {
            rate = a.debtRateType === 'annual' ? (Math.pow(1 + (a.debtRate || 0) / 100, 1 / 12) - 1) * 100 : (a.debtRate || 0);
            minPay = a.debtMonthlyPayment || 0;
            if (minPay === 0 && a.debtType !== 'revolving') minPay = calculateAmortization(a.debtOriginal || bal, a.debtTotalQuotes || 1, rate, 'monthly').payment;
            else if (a.debtType === 'revolving') minPay = round2(minPay + getPendingRevolvingPurchases(a.id).reduce((s, p) => s + p.nextQuota, 0));
        } else {
            rate = a.rateType === 'annual' ? (Math.pow(1 + (a.rate || 0) / 100, 1 / 12) - 1) * 100 : (a.rate || 0);
            minPay = bal * 0.05;
        }
        return { id: a.id, name: a.name, bal, rate, minPay };
    });

    if (activeDebts.length === 0) {
        if (document.getElementById('planner-schedule-body')) document.getElementById('planner-schedule-body').innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay deudas vigentes 🎉</td></tr>';
        return;
    }

    let halfPrima = 0;
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (salaryStr) halfPrima = calculateLaborMetrics(JSON.parse(salaryStr), currentDate).halfPrimaNeta;

    const simAmort = (debts, addExtra) => {
        let simDebts = debts.map(d => ({ ...d }));
        let monthIter = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        let totalInterest = 0, monthsCount = 0;
        const schedule = [];

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
                monthInterest += int; totalInterest += int; d.bal = round2(d.bal + int);
            });
            if (addExtra) simDebts.sort((a, b) => strategy === 'avalanche' ? b.rate - a.rate : a.bal - b.bal);
            simDebts.forEach(d => { const pay = Math.min(d.bal, d.minPay); d.bal = round2(d.bal - pay); monthTotalPay += pay; });
            let leftover = currentMonthExtra;
            if (addExtra && leftover > 0) {
                for (const target of simDebts) {
                    if (target.bal > 0) {
                        const extraPay = Math.min(target.bal, leftover);
                        target.bal = round2(target.bal - extraPay); monthTotalPay += extraPay; leftover -= extraPay;
                        if (leftover <= 0) break;
                    }
                }
            }
            simDebts = simDebts.filter(d => d.bal > 0);
            if (addExtra && monthsCount <= 36) {
                schedule.push({
                    monthStr: `${getShortMonthLabel(monthIter)} ${String(monthIter.getFullYear()).slice(-2)}`,
                    targetName: simDebts.length > 0 ? simDebts[0].name : 'Liberado 🎉',
                    pay: monthTotalPay, int: monthInterest, rem: simDebts.reduce((s, d) => s + d.bal, 0)
                });
            }
            monthIter.setMonth(monthIter.getMonth() + 1);
        }
        return { months: monthsCount, interest: totalInterest, schedule, freedomDate: monthIter };
    };

    const baseRes = simAmort(activeDebts, false);
    const optRes = simAmort(activeDebts, true);
    document.getElementById('planner-base-months').innerText = `${baseRes.months} meses`;
    document.getElementById('planner-base-interest').innerText = `Int: ${formatMoney(baseRes.interest)}`;
    document.getElementById('planner-accel-months').innerText = `${optRes.months} meses`;
    document.getElementById('planner-accel-interest').innerText = `Int: ${formatMoney(optRes.interest)}`;
    document.getElementById('planner-interest-saved').innerText = formatMoney(Math.max(0, baseRes.interest - optRes.interest));
    document.getElementById('planner-freedom-date').innerText = `${getShortMonthLabel(optRes.freedomDate)} ${optRes.freedomDate.getFullYear()}`;
    document.getElementById('planner-schedule-body').innerHTML = optRes.schedule.map(r => `<tr><td>${r.monthStr}</td><td>${r.targetName}</td><td>${formatMoney(r.pay)}</td><td class="negative">${formatMoney(r.int)}</td><td>${formatMoney(r.rem)}</td></tr>`).join('');
    lastPlannerScheduleText = optRes.schedule.map(r => `${r.monthStr} | ${r.targetName} | Pago: ${formatMoney(r.pay)} | Saldo: ${formatMoney(r.rem)}`).join('\n');
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
document.getElementById('btn-copy-debt-plan')?.addEventListener('click', async () => { if (lastPlannerScheduleText && navigator.clipboard) { await navigator.clipboard.writeText(lastPlannerScheduleText); alert('📋 Plan copiado al portapapeles.'); } });

// --- 15D. CALCULADORA Y MODAL DE TRANSACCIONES ---
let userEditedBudgetField = false, calcExpression = '';
const updateCalculatorDisplay = () => {
    if (document.getElementById('calc-expression')) document.getElementById('calc-expression').innerText = calcExpression || '0';
    const evalRes = evaluateCalculatorExpression(calcExpression);
    if (document.getElementById('calc-result')) document.getElementById('calc-result').innerText = evalRes.valid ? (formatNumberInput(evalRes.value) || '0,00') : 'Error';
};
document.getElementById('toggle-tx-calc-btn')?.addEventListener('click', () => {
    const panel = document.getElementById('tx-calculator-panel'), btn = document.getElementById('toggle-tx-calc-btn');
    if (!panel) return;
    if (panel.classList.contains('hidden')) {
        const curAmt = parseMoneyInput(document.getElementById('amount')?.value);
        calcExpression = curAmt > 0 ? formatNumberInput(curAmt).replace(/\./g, '') : '';
        updateCalculatorDisplay(); panel.classList.remove('hidden'); btn?.classList.add('active');
    } else { panel.classList.add('hidden'); btn?.classList.remove('active'); }
});
document.querySelectorAll('#tx-calculator-panel [data-calc]').forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-calc'), amountEl = document.getElementById('amount'), ops = ['+', '-', '×', '÷'];
        if (key === 'C') { calcExpression = ''; updateCalculatorDisplay(); return; }
        if (key === 'BACK') { calcExpression = calcExpression.slice(0, -1); updateCalculatorDisplay(); return; }
        if (key === 'OK') {
            const evalRes = evaluateCalculatorExpression(calcExpression);
            if (!evalRes.valid) { alert('Operación inválida.'); return; }
            if (amountEl) { amountEl.value = evalRes.value > 0 ? formatNumberInput(evalRes.value) : ''; amountEl.dispatchEvent(new Event('input', { bubbles: true })); }
            document.getElementById('tx-calculator-panel')?.classList.add('hidden');
            document.getElementById('toggle-tx-calc-btn')?.classList.remove('active');
            return;
        }
        if (ops.includes(key)) {
            if (!calcExpression) {
                const curAmt = parseMoneyInput(amountEl?.value);
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
    const hintEl = document.getElementById('tx-budget-context-hint');
    if (!budgetInput || !typeSelect) return;
    if (typeSelect.value === 'transfer') {
        budgetInput.value = '';
        hintEl?.classList.add('hidden');
        renderTxBudgetVariancePreview();
        return;
    }
    const [catName, subName] = (document.getElementById('trans-category')?.value || '').split('::');
    const dateVal = document.getElementById('trans-date')?.value;
    const targetMonthId = (dateVal && dateVal.length >= 7) ? dateVal.slice(0, 7) : getMonthId(viewDate);
    const excludeTxId = document.getElementById('edit-id')?.value || null;

    const info = getRemainingBudgetForSelection(typeSelect.value, catName, subName || 'General', targetMonthId, excludeTxId);

    if (hintEl) {
        if (info.hasBudget) {
            if (info.rolloverAmt !== 0) {
                const rollSign = info.rolloverAmt > 0 ? '+' : '−';
                hintEl.innerText = `Base: ${formatCompact(info.baseLimit)} ${rollSign} Arrastre: ${formatCompact(Math.abs(info.rolloverAmt))} − Gastado: ${formatCompact(info.spent)} = Disp: ${formatMoney(info.remaining)}`;
            } else {
                hintEl.innerText = `Base: ${formatMoney(info.baseLimit)} − Gastado: ${formatMoney(info.spent)} = Disp: ${formatMoney(info.remaining)}`;
            }
            hintEl.classList.remove('hidden');
        } else {
            hintEl.classList.add('hidden');
        }
    }

    if (force || !userEditedBudgetField) {
        budgetInput.value = info.remaining > 0 ? formatNumberInput(info.remaining) : '';
    }
    renderTxBudgetVariancePreview();
};

document.getElementById('trans-category')?.addEventListener('change', () => { userEditedBudgetField = false; autoFillBudgetedAmountForTransaction(true); });
document.getElementById('trans-date')?.addEventListener('change', () => autoFillBudgetedAmountForTransaction(false));
document.getElementById('trans-budgeted-amount')?.addEventListener('input', () => {
    userEditedBudgetField = true;
    renderTxBudgetVariancePreview();
    requestAnimationFrame(renderTxBudgetVariancePreview);
});

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
    document.getElementById('tx-amortization-body').innerHTML = amort.schedule.map(r => `<tr><td>${r.period}</td><td>${formatMoney(r.payment)}</td><td class="positive">${formatMoney(r.principal)}</td><td class="negative">${formatMoney(r.interest)}</td><td>${formatMoney(r.balance)}</td></tr>`).join('');
};

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

    if (toAcc && (toAcc.category === 'credit_card' || toAcc.debtType === 'revolving')) {
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

typeSelect?.addEventListener('change', () => {
    const accEl = document.getElementById('account'), budgetGroup = document.getElementById('group-budgeted-amount'), payrollShortcut = document.getElementById('quick-payroll-shortcut');
    const splitBtn = document.getElementById('btn-open-split-modal');
    // Mostrar/Ocultar bloque de Gasto Compartido
    const sharedWrap = document.getElementById('shared-expense-wrapper');
    if (typeSelect.value === 'expense') {
        sharedWrap?.classList.remove('hidden');
    } else {
        sharedWrap?.classList.add('hidden');
        if(document.getElementById('is-shared-expense')) document.getElementById('is-shared-expense').checked = false;
        document.getElementById('shared-expense-fields')?.classList.add('hidden');
    }
    
    // Elementos visuales dinámicos del Omni-Modal
    const submitBtn = document.querySelector('#transaction-modal button[type="submit"]');
    const modalContent = document.querySelector('#transaction-modal .modal-content');

    if (typeSelect.value === 'transfer') {
        if (submitBtn) { submitBtn.style.backgroundColor = 'var(--accent)'; submitBtn.innerText = 'Guardar Transferencia'; }
        if (modalContent) modalContent.style.boxShadow = '0 0 0 2px var(--accent)';
        
        if (splitBtn) splitBtn.classList.add('hidden');
        renderAccountSelects(false); if (accEl) accEl.value = getDefaultAccountId(true);
        toAccountGroup?.classList.remove('hidden'); categoryGroup?.classList.add('hidden'); budgetGroup?.classList.add('hidden'); payrollShortcut?.classList.add('hidden'); ccInstallmentsBox?.classList.add('hidden');
        document.getElementById('label-account').innerText = 'Cuenta Origen';
        updateTransferAllocationUI();
    } else if (typeSelect.value === 'income') {
        if (submitBtn) { submitBtn.style.backgroundColor = 'var(--positive)'; submitBtn.innerText = 'Guardar Ingreso'; }
        if (modalContent) modalContent.style.boxShadow = '0 0 0 2px var(--positive)';
        
        if (splitBtn) splitBtn.classList.remove('hidden');
        renderAccountSelects(true); if (accEl) accEl.value = getDefaultAccountId(true);
        toAccountGroup?.classList.add('hidden'); categoryGroup?.classList.remove('hidden'); budgetGroup?.classList.remove('hidden'); payrollShortcut?.classList.remove('hidden'); ccInstallmentsBox?.classList.add('hidden');
        document.getElementById('label-account').innerText = 'Cuenta Destino'; renderCategoryOptions('income');
    } else {
        if (submitBtn) { submitBtn.style.backgroundColor = 'var(--negative)'; submitBtn.innerText = 'Guardar Gasto'; }
        if (modalContent) modalContent.style.boxShadow = '0 0 0 2px var(--negative)';
        
        if (splitBtn) splitBtn.classList.remove('hidden');
        renderAccountSelects(false); if (accEl) accEl.value = getDefaultAccountId(false);
        toAccountGroup?.classList.add('hidden'); categoryGroup?.classList.remove('hidden'); budgetGroup?.classList.remove('hidden'); payrollShortcut?.classList.add('hidden');
        document.getElementById('label-account').innerText = 'Cuenta / Tarjeta'; renderCategoryOptions('expense'); updateCCInstallmentsPreview(true);
    }
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
        const text = e.target.value.trim().toLowerCase();
        const currentType = document.getElementById('type')?.value;
        const editId = document.getElementById('edit-id')?.value;
        
        // Solo predecir si es nuevo registro, tiene más de 2 letras y no es transferencia
        if (editId || text.length < 3 || currentType === 'transfer') return;

        // 1. Filtrar historial buscando coincidencias exactas o parciales
        const matches = financeData.transactions.filter(t => 
            t.type === currentType && 
            t.description && 
            t.description.toLowerCase().includes(text)
        );

        if (matches.length === 0) return;

        // 2. Calcular frecuencia (Moda estadística)
        const catFreq = {}, accFreq = {};
        matches.forEach(t => {
            const catStr = t.subcategory && t.subcategory !== 'General' ? `${t.category}::${t.subcategory}` : `${t.category}::General`;
            catFreq[catStr] = (catFreq[catStr] || 0) + 1;
            if (t.account) accFreq[t.account] = (accFreq[t.account] || 0) + 1;
        });

        // 3. Obtener los más usados históricamente para ese texto
        const bestCat = Object.keys(catFreq).sort((a, b) => catFreq[b] - catFreq[a])[0];
        const bestAcc = Object.keys(accFreq).sort((a, b) => accFreq[b] - accFreq[a])[0];

        const catSelect = document.getElementById('trans-category');
        const accSelect = document.getElementById('account');
        let aiActed = false;

        // 4. Aplicar Cuenta Inteligente
        if (bestAcc && accSelect && accSelect.value !== bestAcc && Array.from(accSelect.options).some(o => o.value === bestAcc)) {
            accSelect.value = bestAcc;
            accSelect.style.transition = 'box-shadow 0.3s ease';
            accSelect.style.boxShadow = '0 0 0 2px var(--accent)'; // Resplandor IA
            setTimeout(() => accSelect.style.boxShadow = 'none', 3000);
            accSelect.dispatchEvent(new Event('change')); // Fuerza re-cálculo de cuotas de TC si aplica
            aiActed = true;
        }

        // 5. Aplicar Categoría Inteligente
        if (bestCat && catSelect && catSelect.value !== bestCat && Array.from(catSelect.options).some(o => o.value === bestCat)) {
            catSelect.value = bestCat;
            catSelect.style.transition = 'box-shadow 0.3s ease';
            catSelect.style.boxShadow = '0 0 0 2px var(--accent)'; // Resplandor IA
            setTimeout(() => catSelect.style.boxShadow = 'none', 3000);
            catSelect.dispatchEvent(new Event('change')); // Fuerza cálculos de presupuesto
            aiActed = true;
        }
        
        // 6. Efecto visual en la descripción confirmando la acción
        if (aiActed) {
            e.target.style.transition = 'box-shadow 0.3s ease';
            e.target.style.boxShadow = '0 0 0 2px var(--positive)';
            setTimeout(() => e.target.style.boxShadow = 'none', 3000);
        }
    }, 450); // Espera 450ms después de que dejes de teclear para no saturar
});

document.getElementById('btn-tx-quick-payroll')?.addEventListener('click', () => {
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (!salaryStr) { alert("Configura tu Salario en 'Mi Perfil' primero."); return; }
    const config = JSON.parse(salaryStr), metrics = calculateLaborMetrics(config, currentDate), isBiweekly = config.frequency === 'biweekly';
    
    // Buscar si hay anticipos registrados este mes
    const mId = getMonthId(currentDate);
    let advances = 0;
    financeData.transactions.forEach(t => {
        if (t.monthId === mId && t.type === 'income' && t.category === '💼 Salario / Nómina' && t.subcategory === 'Anticipo' && t.status !== 'pending') {
            advances += round2(t.amount);
        }
    });

    let amt = isBiweekly ? (currentDate.getDate() <= 16 ? metrics.net1Q : metrics.net2Q) : metrics.net;
    
    if (advances > 0) {
        if (confirm(`Tienes anticipos registrados por ${formatMoney(advances)} este mes.\n\n¿Deseas descontarlos automáticamente de este pago de nómina?`)) {
            amt = Math.max(0, round2(amt - advances));
        }
    }

    document.getElementById('trans-category').value = '💼 Salario / Nómina::General';
    document.getElementById('description').value = isBiweekly ? (currentDate.getDate() <= 16 ? '💼 Pago Nómina (1Q)' : '💼 Pago Nómina (2Q)') : '💼 Pago Nómina Mensual';
    document.getElementById('amount').value = formatNumberInput(amt);
    document.getElementById('amount').dispatchEvent(new Event('input'));
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
        dateMs = null, hideRecurrence = false
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

    document.getElementById('trans-status').value = status;
    
    if (amount !== '') {
        document.getElementById('amount').value = formatNumberInput(amount);
        document.getElementById('amount').dispatchEvent(new Event('input'));
    }
    if (account) document.getElementById('account').value = account;
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
    userEditedCoinAmount = false;
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
    const description = document.getElementById('description').value.trim(), amount = parseMoneyInput(document.getElementById('amount').value);
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
            description: `👥 Préstamo a ${debtorName} (de: ${description})`,
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
                    txData.allocatedItems = selectedChecks.map(cb => ({
                        kind: 'cc_tx',
                        txId: cb.value,
                        mode: payMode,
                        amountApplied: parseFloat(cb.getAttribute('data-quota'))
                    }));
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
                                    targetTx.paidInstallments = (targetTx.paidInstallments || 0) + 1;
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

    const cap = calculateBorrowingCapacity(monthId);
    
    // 1. Sumar los Gastos Fijos marcados en el presupuesto
    let totalFixedExpenses = 0;
    const mIdx = viewDate.getMonth();
    (financeData.categories.expense || []).forEach(c => {
        if (c.isFixed) {
            totalFixedExpenses += getCategoryLimitForMonth(c, mIdx) || 0;
        } else if (c.subcategories) {
            c.subcategories.forEach(sub => {
                if (sub.isFixed) totalFixedExpenses += (sub.limit || 0);
            });
        }
    });

    // 2. Matemática del Flujo Libre
    const healthyDebtLimit = (cap.baseIncome * cap.maxPct) / 100;
    const freeCashFlow = cap.baseIncome - totalFixedExpenses - cap.committedMonthly;
    
    // El cupo real es el mínimo entre lo que el banco te presta (tope 30%) y lo que tu bolsillo aguanta (flujo libre)
    const mathAvailableDebt = healthyDebtLimit - cap.committedMonthly;
    const realSafeQuota = Math.max(0, Math.min(mathAvailableDebt, freeCashFlow));
    const isDeficit = (freeCashFlow < 0 || mathAvailableDebt < 0);
    
    const visualQuota = isDeficit ? Math.min(mathAvailableDebt, freeCashFlow) : realSafeQuota;

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

    if (quickIncomeContext.isBiweeklyPayroll) {
        netSummary.classList.remove('hidden');
        netSummary.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text-muted);">Neto ${periodLabel} (${monthVal}):</span>
                <strong class="positive" style="font-size:13.5px;">${formatMoney(amount)}</strong>
            </div>`;
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
        accSelect.innerHTML = assetsAcc.map(a => `<option value="${a.id}">${a.name}${a.isDefault ? ' ⭐' : ''}</option>`).join('');
        const defAsset = getDefaultAccountId(true);
        if (defAsset && assetsAcc.some(a => a.id === defAsset)) accSelect.value = defAsset;
    }

    const salCfg = JSON.parse(localStorage.getItem('myFinancesSalary') || '{}');
    const isBiweekly = salCfg.frequency === 'biweekly';

    quickIncomeContext = { isBiweeklyPayroll, metrics, baseDescription: description };
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
            let opts = existingFunds.map(f => `<option value="${f.id}">🐷 ${f.name}${f.entity ? ` (${f.entity})` : ''} • ${formatCompact(round2((f.principal || 0) + (f.yields || 0)))}</option>`).join('');
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

    financeData.transactions.push(newTx);
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    document.getElementById('quick-income-modal')?.classList.add('hidden');
    renderSalaryUI(false);
    updateDashboard();

    const statusMsg = isFutureMonth ? ' (programado para ese periodo)' : '';
    alert(`✅ Ingreso de ${formatMoney(amount)} registrado en ${getAccountObj(accountId).name} para ${monthVal}${periodTag}${statusMsg}.`);
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

        tabMonthly.innerHTML = `<h4 style="font-size:13px; margin-bottom:10px; color:var(--text-muted);">Desglose Mensual (${metrics.params.year})</h4><div class="debt-metrics-grid" style="grid-template-columns: repeat(2, 1fr);"><div class="debt-metric-cell"><small>Salud (4% IBC)</small><strong class="negative">${formatMoney(metrics.health)}</strong></div><div class="debt-metric-cell"><small>Pensión (4% IBC)</small><strong class="negative">${formatMoney(metrics.pension)}</strong></div><div class="debt-metric-cell"><small>FSP</small><strong class="${metrics.fsp > 0 ? 'negative' : ''}">${formatMoney(metrics.fsp)}</strong></div><div class="debt-metric-cell"><small>${retSubLabel}</small><strong class="${metrics.ret > 0 ? 'negative' : ''}">${formatMoney(metrics.ret)}</strong></div><div class="debt-metric-cell"><small>Aux. Transporte</small><strong class="positive">${formatMoney(metrics.effectiveTransport)}</strong></div><div class="debt-metric-cell"><small>No Salarial</small><strong class="positive">${formatMoney(metrics.nonSalary)}</strong></div>${debtDeductionHtml}</div>${ley1393AlertHtml}${biweeklyBreakdownHtml}
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

const getHalfMonthIndex = (monthStr, period) => {
    if (!monthStr || !monthStr.includes('-')) return 0;
    const [y, m] = monthStr.split('-').map(Number);
    return y * 24 + (m - 1) * 2 + (period === '2Q' ? 1 : 0);
};

const computeRaiseSimulation = (newBasic) => {
    const prevConfig = JSON.parse(localStorage.getItem('myFinancesSalary') || '{}');
    const formBasic = parseCleanCOP(document.getElementById('profile-basic-salary')?.value);
    const currentBasic = (formBasic === newBasic && prevConfig.lastRaise?.oldBasic > 0)
        ? round2(prevConfig.lastRaise.oldBasic)
        : formBasic;
    if (currentBasic <= 0 || newBasic <= 0 || newBasic === currentBasic) return null;

    const diff = round2(newBasic - currentBasic);
    const pct = round2((diff / currentBasic) * 100);

    const baseCfg = JSON.parse(localStorage.getItem('myFinancesSalary') || '{}');
    const currentMetrics = calculateLaborMetrics({ ...baseCfg, basicSalary: currentBasic }, currentDate);
    const newMetrics = calculateLaborMetrics({ ...baseCfg, basicSalary: newBasic }, currentDate);
    const netDiff = round2(newMetrics.net - currentMetrics.net);

    const effMonth = document.getElementById('raise-effective-month')?.value || getMonthId(currentDate);
    const effPeriod = document.getElementById('raise-effective-period')?.value || 'M';
    const isRetro = !!document.getElementById('raise-is-retro')?.checked;
    const retroFromMonth = document.getElementById('raise-retro-from-month')?.value || effMonth;
    const retroFromPeriod = document.getElementById('raise-retro-from-period')?.value || 'M';
    const retroPayMonth = document.getElementById('raise-retro-pay-month')?.value || effMonth;
    const retroPayPeriod = document.getElementById('raise-retro-pay-period')?.value || 'M';

    let retroHalfMonths = 0;
    let retroNetAmount = 0;

    if (isRetro) {
        const effIdx = getHalfMonthIndex(effMonth, effPeriod);
        const fromIdx = getHalfMonthIndex(retroFromMonth, retroFromPeriod);
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
        currentBasic, newBasic, diff, pct,
        currentMetrics, newMetrics, netDiff,
        effMonth, effPeriod,
        isRetro, retroFromMonth, retroFromPeriod,
        retroPayMonth, retroPayPeriod,
        retroHalfMonths, retroNetAmount
    };
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

document.getElementById('notifications-config-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    financeData.notificationPrefs = {
        daysBefore: parseInt(document.getElementById('notif-days-before').value, 10) || 5,
        budgetPct: parseInt(document.getElementById('notif-budget-pct').value, 10) || 85,
        pendingEnabled: document.getElementById('notif-pending-enabled').checked
    };
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    updateDashboard();
    alert('✅ Preferencias de alertas guardadas.');
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

document.querySelectorAll('.drawer-accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
        const group = trigger.closest('.drawer-accordion-group');
        const targetId = trigger.getAttribute('data-target');
        const content = document.getElementById(targetId);
        const chevron = trigger.querySelector('.drawer-chevron');
        if (group && content) {
            group.classList.toggle('open');
            const isOpen = group.classList.contains('open');
            content.classList.toggle('hidden', !isOpen);
            if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
        }
    });
});

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
    let assigned = splitState.items.reduce((sum, item) => sum + round2(item.amount), 0);
    const rem = round2(splitState.baseAmount - assigned);
    
    document.getElementById('split-base-total').innerText = formatMoney(splitState.baseAmount);
    document.getElementById('split-assigned-total').innerText = formatMoney(assigned);
    document.getElementById('split-remaining-total').innerText = formatMoney(rem);
    
    const remEl = document.getElementById('split-remaining-total');
    if (rem === 0) remEl.className = 'positive';
    else if (rem < 0) remEl.className = 'negative';
    else remEl.className = 'neutral';
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
        <div class="print-footer">Documento informativo generado localmente sin conexión a servidores. Mis Finanzas (Función IF) v4.0.0.</div>`;
    window.print();
});

// 2. REPORTE DE ESTADO DE CUENTA A FAVOR (COBROS)
document.getElementById('btn-print-cxc-report')?.addEventListener('click', () => {
    const rc = document.getElementById('print-report-container');
    if (!rc) return;
    const receivables = financeData.customAccounts.filter(a => a.id.startsWith('CxC_'));
    let html = `<style>${basePrintStyles}</style>
        <div class="print-header">
            <h1>Estado de Deudas a Favor (Cobros Pendientes)</h1>
            <p><strong>Titular:</strong> ${authData ? authData.name : 'Usuario'} | <strong>Corte a:</strong> ${currentDate.toLocaleDateString('es-CO')} ${currentDate.toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}</p>
        </div>`;
    
    if (receivables.length === 0) {
        html += '<p>No existen deudas a favor registradas en el sistema.</p>';
    } else {
        receivables.forEach(acc => {
            const bal = round2(currentBalances[acc.id] || 0);
            if (bal === 0) return;
            const nameClean = acc.name.replace('🤝 Me debe: ', '');
            let txHtml = '';
            
            const accTxs = financeData.transactions.filter(t => t.account === acc.id || t.toAccount === acc.id).sort((a,b) => b.id - a.id);
            accTxs.forEach(t => {
                const isLoan = (t.type === 'transfer' && t.toAccount === acc.id) || (t.type === 'income' && t.isAdjustment && t.account === acc.id);
                const isPayment = (t.type === 'transfer' && t.account === acc.id) || (t.type === 'expense' && t.isAdjustment && t.account === acc.id);
                if (isLoan) txHtml += `<tr><td>${t.date}</td><td>Préstamo / Gasto asignado</td><td>${t.description}</td><td class="print-text-right print-negative">-${formatMoney(t.amount)}</td></tr>`;
                if (isPayment) txHtml += `<tr><td>${t.date}</td><td>Abono recibido</td><td>${t.description}</td><td class="print-text-right print-positive">+${formatMoney(t.amount)}</td></tr>`;
            });

            html += `
            <div class="print-section"><div class="print-section-title">Deudor: ${nameClean}</div>
                <table class="print-table">
                    <thead><tr><th>Fecha</th><th>Concepto</th><th>Descripción</th><th class="print-text-right">Valor</th></tr></thead>
                    <tbody>${txHtml}</tbody>
                    <tfoot><tr><th colspan="3">SALDO PENDIENTE POR COBRAR A LA FECHA</th><th class="print-text-right print-positive" style="font-size:12pt;">${formatMoney(bal)}</th></tr></tfoot>
                </table>
            </div>`;
        });
    }
    html += `<div class="print-footer">Soporte de gastos compartidos y préstamos informales. Mis Finanzas (Función IF) v4.0.0.</div>`;
    rc.innerHTML = html;
    window.print();
});

// 3. REPORTE LABORAL Y DE LIQUIDACIÓN
document.getElementById('btn-print-liquidation-report')?.addEventListener('click', () => {
    const rc = document.getElementById('print-report-container');
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (!rc || !salaryStr) return;
    const config = JSON.parse(salaryStr), m = calculateLaborMetrics(config, currentDate);
    
    rc.innerHTML = `<style>${basePrintStyles}</style>
        <div class="print-header">
            <h1>Certificado de Análisis Laboral y Retención</h1>
            <p><strong>Empleado:</strong> ${authData ? authData.name : 'Usuario'} | <strong>Fecha de Simulación:</strong> ${currentDate.toLocaleDateString('es-CO')} ${currentDate.toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}</p>
        </div>
        
        <div class="print-section"><div class="print-section-title">1. Resumen Salarial Mensual</div>
            <table class="print-table">
                <tr><td>Sueldo Básico:</td><td class="print-text-right">${formatMoney(m.basic)}</td></tr>
                <tr><td>Ingreso No Salarial / Bonos (Tope Ley 1393: ${m.params.nonSalaryCapPct}%):</td><td class="print-text-right">${formatMoney(m.nonSalary)}</td></tr>
                <tr><td>Auxilio de Transporte Efectivo (Legal):</td><td class="print-text-right">${formatMoney(m.effectiveTransport)}</td></tr>
                <tr><td>Deducciones de Ley (Salud, Pensión, FSP):</td><td class="print-text-right print-negative">-${formatMoney(m.health + m.pension + m.fsp)}</td></tr>
                <tr><td>Retención en la Fuente (UVT ${m.params.year}):</td><td class="print-text-right print-negative">-${formatMoney(m.ret)}</td></tr>
                <tr><td>Libranzas / Cuotas de Deuda Nómina:</td><td class="print-text-right print-negative">-${formatMoney(m.payrollDebtDeductions)}</td></tr>
                <tr style="background:#f4f6f9;"><td><strong>SALARIO NETO EFECTIVO (A Recibir):</strong></td><td class="print-text-right print-positive" style="font-size:12pt;">${formatMoney(m.net)}</td></tr>
            </table>
        </div>

        <div class="print-section"><div class="print-section-title">2. Proyección de Prestaciones Sociales (Proporcional a la fecha)</div>
            <table class="print-table">
                <thead><tr><th>Concepto Legal</th><th>Base de Cálculo ($)</th><th>Tiempo Causado</th><th class="print-text-right">Valor Consolidado</th></tr></thead>
                <tbody>
                    <tr><td>Prima de Servicios (Semestre en curso)</td><td>${formatMoney(m.primaBase)}</td><td>${m.daysSemester} días</td><td class="print-text-right print-positive">${formatMoney(m.liqPrima)}</td></tr>
                    <tr><td>Cesantías (Año en curso)</td><td>${formatMoney(m.cesantiasBase)}</td><td>${m.daysYear} días</td><td class="print-text-right print-positive">${formatMoney(m.liqCesantias)}</td></tr>
                    <tr><td>Intereses de Cesantías (12% Anual)</td><td>${formatMoney(m.liqCesantias)} (Cesantías)</td><td>${m.daysYear} días</td><td class="print-text-right print-positive">${formatMoney(m.liqIntereses)}</td></tr>
                    <tr><td>Vacaciones Pendientes (Causadas - Tomadas)</td><td>${formatMoney(m.basic)}</td><td>${m.vacDaysPending} días pendientes</td><td class="print-text-right print-positive">${formatMoney(m.liqVacaciones)}</td></tr>
                </tbody>
                <tfoot><tr><th colspan="3">TOTAL LIQUIDACIÓN SIMULADA AL CORTE</th><th class="print-text-right print-positive" style="font-size:13pt;">${formatMoney(m.liqPrima + m.liqCesantias + m.liqIntereses + m.liqVacaciones)}</th></tr></tfoot>
            </table>
        </div>
        
        <div class="print-footer">Cálculos tributarios y laborales basados en parámetros de ${m.params.year} ingresados por el usuario. Son estimaciones referenciales de Mis Finanzas (Función IF) v4.0.0.</div>`;
    window.print();
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

// Guardar nueva deuda a favor
document.getElementById('new-receivable-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawName = document.getElementById('new-recv-name').value.trim();
    const amount = parseMoneyInput(document.getElementById('new-recv-amount').value);
    const sourceAcc = document.getElementById('new-recv-account').value;

    if (!rawName || amount <= 0) return;

    const accId = 'CxC_' + rawName.replace(/\s+/g, '_');

    // Crear la cuenta si no existe
    if (!financeData.customAccounts.some(a => a.id === accId)) {
        financeData.customAccounts.push({ id: accId, name: `🤝 Me debe: ${rawName}`, category: 'asset', isDefault: false, showWhenZero: true });
    }

    const now = new Date();
    const mId = getMonthId(now);
    const dateStr = `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;

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
            account: sourceAcc, toAccount: accId, description: `💸 Préstamo a ${rawName}`, amount: amount,
            date: dateStr, isAdjustment: false
        });
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('new-receivable-form').reset();
    hasUnsavedChanges = false;
    updateDashboard();
    renderReceivablesBreakdown();
    alert(`✅ Deuda a favor de ${formatMoney(amount)} registrada a nombre de ${rawName}.`);
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
        freqSelect.onchange = (e) => {
            if (monthSelect) monthSelect.disabled = (e.target.value === 'monthly');
        };
    }
    if (monthSelect) {
        monthSelect.value = subObj.startMonth || 0;
        monthSelect.disabled = (subObj.frequency === 'monthly' || !subObj.frequency);
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

// Registro PWA Service Worker (solo en HTTP/HTTPS para compatibilidad local)
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker?.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        const toast = document.getElementById('sw-update-toast');
                        if (toast) {
                            toast.classList.remove('hidden');
                            setTimeout(() => window.location.reload(), 2200);
                        }
                    }
                });
            });
        }).catch(() => {});
    });
}
document.getElementById('toggle-archived-cats')?.addEventListener('change', renderBudgetView);