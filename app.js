// ==========================================
// APP.JS - EL PINTOR: INTERFAZ, EVENTOS Y RENDERIZADO (v2.3)
// ==========================================

const fabBtn = document.getElementById('add-btn');
const fabMenu = document.getElementById('fab-menu');
const modal = document.getElementById('transaction-modal');
const form = document.getElementById('transaction-form');
const typeSelect = document.getElementById('type');
const toAccountGroup = document.getElementById('group-to-account');
const categoryGroup = document.getElementById('group-category');
const ccInstallmentsBox = document.getElementById('cc-installments-box');
const transferAllocBox = document.getElementById('transfer-debt-allocation-box');

// --- 0. FORMATEO NUMÉRICO EN VIVO ---
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
    if (e.target && e.target.matches('input[inputmode="decimal"]')) applyLiveDecimalFormatting(e.target);
});

// --- 0B. MODAL UNIVERSAL DE ACCIONES RÁPIDAS ---
let quickActionHandler = null;
const openQuickActionModal = ({ title, subtitle = 'Completa los datos', infoLabel = '', infoValue = '', showAccountSelect = false, accountLabel = 'Cuenta', defaultAccountId = '', amountLabel = 'Monto ($)', defaultAmount = 0, submitLabel = 'Confirmar', onConfirm }) => {
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
        } else infoBanner.classList.add('hidden');
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
        } else accGroup.classList.add('hidden');
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

document.getElementById('close-quick-action-btn')?.addEventListener('click', () => { hasUnsavedChanges = false; quickActionHandler = null; document.getElementById('quick-action-modal')?.classList.add('hidden'); });
document.getElementById('quick-action-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseMoneyInput(document.getElementById('quick-action-amount')?.value);
    const accountId = document.getElementById('quick-action-account')?.value || '';
    if (typeof quickActionHandler === 'function') {
        const ok = quickActionHandler(amount, accountId);
        if (ok === false) return;
    }
    hasUnsavedChanges = false; quickActionHandler = null; document.getElementById('quick-action-modal')?.classList.add('hidden');
});

// --- 1. GESTIÓN VISUAL DE SEGURIDAD, TEMAS Y MODALES ---
const authScreen = document.getElementById('auth-screen');
const registerView = document.getElementById('register-view');
const loginView = document.getElementById('login-view');
const authCard = document.getElementById('auth-card');

const applyThemeUI = (themeValue) => {
    const colors = getThemeColors(themeValue);
    document.documentElement.style.setProperty('--accent', colors.accent);
    document.documentElement.style.setProperty('--theme-gradient', colors.gradient);
    document.documentElement.style.setProperty('--theme-shadow', colors.shadow);
    const colorPicker = document.getElementById('custom-theme-color');
    if (colorPicker && themeValue && themeValue.startsWith('#')) colorPicker.value = themeValue;
};

function setActiveNav(activeEl) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (activeEl) activeEl.classList.add('active');
}

function isAnyModalOpen() { return Array.from(document.querySelectorAll('.modal')).some(m => !m.classList.contains('hidden')); }

document.addEventListener('input', (e) => {
    const parentForm = e.target.closest('form');
    if (parentForm && parentForm.classList.contains('data-form') && isAnyModalOpen()) hasUnsavedChanges = true;
});

document.addEventListener('change', (e) => {
    const parentForm = e.target.closest('form');
    if (parentForm && parentForm.classList.contains('data-form') && isAnyModalOpen()) hasUnsavedChanges = true;
});

const sideDrawer = document.getElementById('side-drawer');
const sideDrawerBackdrop = document.getElementById('side-drawer-backdrop');

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
    sideDrawerBackdrop?.classList.add('hidden');
    sideDrawer?.classList.add('closed');
    sideDrawer?.setAttribute('aria-hidden', 'true');
}

function forceCloseAllModals() {
    hasUnsavedChanges = false; quickActionHandler = null;
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('quick-calendar-popover')?.classList.add('hidden');
    closeSideDrawer();
    document.getElementById('tx-calculator-panel')?.classList.add('hidden');
    document.getElementById('toggle-tx-calc-btn')?.classList.remove('active');

    if (fabMenu && !fabMenu.classList.contains('hidden')) { fabMenu.classList.add('hidden'); fabBtn?.classList.remove('active'); }
    document.querySelectorAll('form.data-form').forEach(f => {
        if (f.id !== 'salary-config-form' && f.id !== 'tax-params-form' && f.id !== 'health-goals-form') f.reset();
    });
    setActiveNav(document.getElementById('nav-home'));
}

function attemptCloseModals() {
    const childModals = ['budget-monthly-config-modal', 'annual-control-modal', 'debt-planner-modal', 'quick-income-modal', 'quick-action-modal', 'health-modal'];
    for (const cId of childModals) {
        const cm = document.getElementById(cId);
        if (cm && !cm.classList.contains('hidden')) {
            if (cId === 'budget-monthly-config-modal' && hasUnsavedChanges) {
                if (!confirm("⚠️ Tienes cambios sin guardar en el presupuesto. ¿Seguro que quieres salir?")) return false;
            }
            hasUnsavedChanges = false;
            if (cId === 'quick-action-modal') quickActionHandler = null;
            cm.classList.add('hidden');
            return false;
        }
    }
    if (isAnyModalOpen() && hasUnsavedChanges) {
        if (!confirm("⚠️ Tienes cambios sin guardar en un formulario. ¿Estás seguro de que quieres salir y perderlos?")) return false;
    }
    forceCloseAllModals(); return true;
}

let modalBackdropPressed = null;
document.querySelectorAll('.modal').forEach(modalEl => {
    modalEl.addEventListener('pointerdown', (e) => { modalBackdropPressed = (e.target === modalEl) ? modalEl : null; });
    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl && modalBackdropPressed === modalEl) attemptCloseModals();
        modalBackdropPressed = null;
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (authScreen && !authScreen.classList.contains('hidden')) return;
    if (sideDrawer && !sideDrawer.classList.contains('closed')) { closeSideDrawer(); return; }
    const calPop = document.getElementById('quick-calendar-popover');
    if (calPop && !calPop.classList.contains('hidden')) { calPop.classList.add('hidden'); return; }
    if (fabMenu && !fabMenu.classList.contains('hidden')) { fabMenu.classList.add('hidden'); fabBtn?.classList.remove('active'); return; }
    if (isAnyModalOpen()) attemptCloseModals();
});

const syncUserUI = () => {
    if (!authData) return;
    const firstName = authData.name.split(' ')[0];
    const initial = authData.name.charAt(0).toUpperCase();

    if (document.getElementById('welcome-user')) document.getElementById('welcome-user').innerText = `Hola de nuevo, ${firstName}`;
    if (document.getElementById('app-title')) document.getElementById('app-title').innerText = `Mis Finanzas`;
    if (document.getElementById('profile-avatar-initial')) document.getElementById('profile-avatar-initial').innerText = initial;
    if (document.getElementById('profile-avatar-large-initial')) document.getElementById('profile-avatar-large-initial').innerText = initial;
    if (document.getElementById('profile-name-title')) document.getElementById('profile-name-title').innerText = `Hola, ${firstName}`;

    const profileEnablePin = document.getElementById('profile-enable-pin');
    const profilePinGroup = document.getElementById('profile-pin-group');
    const lockNowBtn = document.getElementById('btn-lock-app-profile');

    if (profileEnablePin) profileEnablePin.checked = !!authData.pinEnabled;
    if (profilePinGroup) {
        if (authData.pinEnabled) profilePinGroup.classList.remove('hidden');
        else profilePinGroup.classList.add('hidden');
    }
    if (lockNowBtn) {
        if (authData.pinEnabled) lockNowBtn.classList.remove('hidden');
        else lockNowBtn.classList.add('hidden');
    }
};

const initAuthUI = (forceLock = false) => {
    forceCloseAllModals();
    if (!authData) {
        authScreen?.classList.remove('hidden');
        registerView?.classList.remove('hidden');
        loginView?.classList.add('hidden');
        return;
    }
    syncUserUI();
    if (authData.pinEnabled || forceLock) {
        authScreen?.classList.remove('hidden');
        registerView?.classList.add('hidden');
        loginView?.classList.remove('hidden');
        if (document.getElementById('login-pin')) document.getElementById('login-pin').value = '';
        document.getElementById('login-error')?.classList.add('hidden');
        setTimeout(() => document.getElementById('login-pin')?.focus(), 100);
    } else {
        authScreen?.classList.add('hidden');
    }
};

document.getElementById('reg-enable-pin')?.addEventListener('change', (e) => {
    const pinGroup = document.getElementById('reg-pin-group');
    const regPin = document.getElementById('reg-pin');
    const regConfirm = document.getElementById('reg-pin-confirm');
    if (e.target.checked) {
        pinGroup?.classList.remove('hidden');
        if (regPin) regPin.required = true;
        if (regConfirm) regConfirm.required = true;
    } else {
        pinGroup?.classList.add('hidden');
        if (regPin) { regPin.required = false; regPin.value = ''; }
        if (regConfirm) { regConfirm.required = false; regConfirm.value = ''; }
    }
});

document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const usePin = document.getElementById('reg-enable-pin')?.checked;
    const pin = document.getElementById('reg-pin').value;
    const confirmPin = document.getElementById('reg-pin-confirm').value;
    const errorEl = document.getElementById('reg-error');

    if (usePin) {
        if (pin.length < 4) { errorEl.innerText = "El PIN debe tener al menos 4 dígitos."; errorEl.classList.remove('hidden'); return; }
        if (pin !== confirmPin) {
            errorEl.innerText = "Los PIN ingresados no coinciden.";
            errorEl.classList.remove('hidden');
            authCard?.classList.remove('shake');
            void authCard?.offsetWidth;
            authCard?.classList.add('shake');
            return;
        }
    }
    registerUser(name, pin, usePin);
    syncUserUI();
    authScreen?.classList.add('hidden');
});

document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputPin = document.getElementById('login-pin').value;
    if (verifyPin(inputPin)) {
        document.getElementById('login-pin').value = '';
        document.getElementById('login-error')?.classList.add('hidden');
        authScreen?.classList.add('hidden');
    } else {
        document.getElementById('login-error')?.classList.remove('hidden');
        document.getElementById('login-pin').value = '';
        authCard?.classList.remove('shake');
        void authCard?.offsetWidth;
        authCard?.classList.add('shake');
    }
});

const handleFullReset = () => {
    if (confirm("⚠️ ATENCIÓN: Se borrarán TODOS tus datos financieros locales y tu perfil para empezar de cero. ¿Deseas continuar?")) {
        localStorage.removeItem('myFinancesAuth');
        localStorage.removeItem('myFinances');
        localStorage.removeItem('myFinancesSalary');
        localStorage.removeItem('myFinancesTaxParams');
        localStorage.removeItem('myFinancesTheme');
        location.reload();
    }
};
document.getElementById('reset-auth-btn-login')?.addEventListener('click', handleFullReset);
document.getElementById('reset-auth-btn-profile')?.addEventListener('click', handleFullReset);

// --- 2. SELECTORES DE CUENTAS Y CATEGORÍAS (V2.3: ORDENADOS) ---
const renderAccountSelects = (onlyAssets = false, forceIncludeId = null) => {
    const accSelect = document.getElementById('account');
    const toAccSelect = document.getElementById('to-account');
    if (!accSelect || !toAccSelect) return;

    const assets = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset'));
    const cards = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'credit_card'));
    const debts = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'debt'));

    let accHtml = `<optgroup label="💵 Liquidez (Cuentas y Efectivo)">`;
    assets.forEach(acc => accHtml += `<option value="${acc.id}">${acc.name}${acc.isDefault ? ' ⭐' : ''}</option>`);
    accHtml += `</optgroup>`;

    if (!onlyAssets) {
        if (cards.length > 0) {
            accHtml += `<optgroup label="💳 Tarjetas de Crédito">`;
            cards.forEach(acc => accHtml += `<option value="${acc.id}">${acc.name}${acc.isDefault ? ' ⭐' : ''}</option>`);
            accHtml += `</optgroup>`;
        }
        if (debts.length > 0) {
            accHtml += `<optgroup label="💸 Deudas y Préstamos">`;
            debts.forEach(acc => accHtml += `<option value="${acc.id}">${acc.name}</option>`);
            accHtml += `</optgroup>`;
        }
    } else if (forceIncludeId) {
        const forcedAcc = financeData.customAccounts.find(a => a.id === forceIncludeId && a.category !== 'asset');
        if (forcedAcc) accHtml += `<optgroup label="⚖️ Cuenta de Ajuste"><option value="${forcedAcc.id}">${forcedAcc.name}</option></optgroup>`;
    }

    let fullHtml = `<optgroup label="💵 Liquidez (Cuentas y Efectivo)">`;
    assets.forEach(acc => fullHtml += `<option value="${acc.id}">${acc.name}${acc.isDefault ? ' ⭐' : ''}</option>`);
    fullHtml += `</optgroup>`;
    if (cards.length > 0) {
        fullHtml += `<optgroup label="💳 Tarjetas de Crédito">`;
        cards.forEach(acc => fullHtml += `<option value="${acc.id}">${acc.name}${acc.isDefault ? ' ⭐' : ''}</option>`);
        fullHtml += `</optgroup>`;
    }
    if (debts.length > 0) {
        fullHtml += `<optgroup label="💸 Deudas y Préstamos">`;
        debts.forEach(acc => fullHtml += `<option value="${acc.id}">${acc.name}</option>`);
        fullHtml += `</optgroup>`;
    }

    accSelect.innerHTML = accHtml;
    toAccSelect.innerHTML = fullHtml;
};

const renderCategoryOptions = (type) => {
    const catSelect = document.getElementById('trans-category');
    if (!catSelect || type === 'transfer') return;
    
    const list = [...(financeData.categories[type] || [])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    let html = '';
    
    if (list.length === 0) {
        html = `<option value="">⚠️ Crea una Categoría en la pestaña Presup.</option>`;
    } else {
        list.forEach(cat => {
            if (cat.subcategories && cat.subcategories.length > 0) {
                html += `<optgroup label="${cat.name}">`;
                const subs = [...cat.subcategories].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
                subs.forEach(sub => { html += `<option value="${cat.name}::${sub.name}">${sub.name}</option>`; });
                html += `</optgroup>`;
            } else html += `<option value="${cat.name}::General">${cat.name} (General)</option>`;
        });
    }
    catSelect.innerHTML = html;
};

// --- 3. DASHBOARD PRINCIPAL Y CALENDARIO ---
const updateDashboard = () => {
    const viewMonthId = getMonthId(viewDate);
    const currentMonthId = getMonthId(currentDate);
    const isFuture = viewMonthId > currentMonthId;

    if (document.getElementById('month-display')) document.getElementById('month-display').innerText = formatMonthName(viewDate);
    if (document.getElementById('quick-month-input')) document.getElementById('quick-month-input').value = viewMonthId;
    if (document.getElementById('analytics-month-label')) document.getElementById('analytics-month-label').innerText = formatMonthName(viewDate);
    if (document.getElementById('dash-budget-month')) document.getElementById('dash-budget-month').innerText = formatMonthName(viewDate);

    const badge = document.getElementById('period-context-badge');
    const todayBtn = document.getElementById('today-btn');
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

    if (document.getElementById('net-worth-header')) document.getElementById('net-worth-header').innerText = formatMoney(currSnap.netWorth);
    
    const currFlow = getMonthlyFlow(viewMonthId, false);
    let monthlyIncome = currFlow.inc, monthlyExpense = currFlow.exp, projectionData = null;
    const projLabel = document.getElementById('dash-flow-projection-label');

    if (isFuture) {
        const scheduledFlow = getMonthlyFlow(viewMonthId, true);
        if (scheduledFlow.inc > 0 || scheduledFlow.exp > 0) {
            monthlyIncome = scheduledFlow.inc; monthlyExpense = scheduledFlow.exp;
            if (projLabel) { projLabel.innerText = "Proyección programada"; projLabel.classList.remove('hidden'); }
            let accScheduledNet = 0, iter = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1), monthsDiff = 0;
            while (iter <= viewDate) {
                accScheduledNet = round2(accScheduledNet + getMonthlyFlow(getMonthId(iter), true).net);
                monthsDiff++; iter = new Date(iter.getFullYear(), iter.getMonth() + 1, 1);
            }
            projectionData = { mode: 'scheduled', avgIncome: monthlyIncome, avgExpense: monthlyExpense, avgCashFlow: round2(monthlyIncome - monthlyExpense), monthsDiff, currentLiquidity: currSnap.assetsTotal, projectedLiquidity: round2(currSnap.assetsTotal + accScheduledNet) };
        } else {
            const regularTrans = financeData.transactions.filter(t => t.type !== 'transfer' && !t.isAdjustment && isTxClosed(t));
            const monthsCount = new Set(regularTrans.map(t => t.monthId)).size || 1;
            const avgIncome = round2(regularTrans.filter(t => t.type === 'income').reduce((s, t) => s + round2(t.amount), 0) / monthsCount);
            const avgExpense = round2(regularTrans.filter(t => t.type === 'expense').reduce((s, t) => s + round2(t.amount), 0) / monthsCount);
            monthlyIncome = avgIncome; monthlyExpense = avgExpense;
            if (projLabel) { projLabel.innerText = "Proyección por promedios"; projLabel.classList.remove('hidden'); }
            const monthsDiff = (viewDate.getFullYear() - currentDate.getFullYear()) * 12 + (viewDate.getMonth() - currentDate.getMonth());
            projectionData = { mode: 'average', avgIncome, avgExpense, avgCashFlow: round2(avgIncome - avgExpense), monthsDiff, currentLiquidity: currSnap.assetsTotal, projectedLiquidity: round2(currSnap.assetsTotal + (round2(avgIncome - avgExpense) * monthsDiff)) };
        }
    } else { if (projLabel) projLabel.classList.add('hidden'); }

    const cashFlow = round2(monthlyIncome - monthlyExpense);
    
    // 1. RENDER FLOW WIDGET
    if (document.getElementById('dash-flow-inc')) document.getElementById('dash-flow-inc').innerText = formatMoney(monthlyIncome);
    if (document.getElementById('dash-flow-exp')) document.getElementById('dash-flow-exp').innerText = formatMoney(monthlyExpense);
    if (document.getElementById('dash-flow-net')) {
        const netEl = document.getElementById('dash-flow-net');
        netEl.innerText = formatMoney(cashFlow);
        netEl.className = cashFlow >= 0 ? 'positive' : 'negative';
    }
    const maxFlow = Math.max(monthlyIncome, monthlyExpense, 1);
    setTimeout(() => {
        if (document.getElementById('dash-bar-inc')) document.getElementById('dash-bar-inc').style.width = `${(monthlyIncome / maxFlow) * 100}%`;
        if (document.getElementById('dash-bar-exp')) document.getElementById('dash-bar-exp').style.width = `${(monthlyExpense / maxFlow) * 100}%`;
    }, 50);

    // 2. RENDER WIDGET SALUD FINANCIERA
    const healthData = calculateFinancialHealth(viewMonthId, currSnap);
    if (document.getElementById('dash-health-score')) document.getElementById('dash-health-score').innerText = healthData.scores.global;
    const badgeEl = document.getElementById('dash-health-badge'), healthCircle = document.getElementById('dash-health-circle');
    let hColor = 'var(--positive)';
    if (badgeEl) {
        if (healthData.scores.global >= 80) { badgeEl.innerText = "Excelente 🟢"; badgeEl.className = "widget-badge good"; hColor = 'var(--positive)'; }
        else if (healthData.scores.global >= 50) { badgeEl.innerText = "Estable 🟡"; badgeEl.className = "widget-badge warn"; hColor = '#f59e0b'; }
        else { badgeEl.innerText = "Riesgo Alto 🔴"; badgeEl.className = "widget-badge danger"; hColor = 'var(--negative)'; }
    }
    if (healthCircle) {
        healthCircle.style.stroke = hColor;
        setTimeout(() => { healthCircle.style.strokeDashoffset = 251.2 - (251.2 * healthData.scores.global / 100); }, 100);
    }

    // 3. RENDER WIDGET METAS AHORRO
    let totalPocketsGoal = 0;
    financeData.pockets.forEach(p => { totalPocketsGoal += round2(p.goal || 0); });
    const pocketsPct = totalPocketsGoal > 0 ? Math.min(100, (currSnap.pocketsTotal / totalPocketsGoal) * 100) : (currSnap.pocketsTotal > 0 ? 100 : 0);
    if (document.getElementById('dash-goals-pct')) document.getElementById('dash-goals-pct').innerText = `${pocketsPct.toFixed(0)}%`;
    if (document.getElementById('dash-goals-text')) document.getElementById('dash-goals-text').innerText = `${formatCompact(currSnap.pocketsTotal)} de ${formatCompact(totalPocketsGoal)}`;
    const goalsCircle = document.getElementById('dash-goals-circle');
    if (goalsCircle) setTimeout(() => { goalsCircle.style.strokeDashoffset = 251.2 - (251.2 * pocketsPct / 100); }, 150);

    // 4. RENDER WIDGET PRESUPUESTO
    let globalLimit = 0;
    financeData.categories.expense.forEach(c => { globalLimit += getCategoryLimitForMonth(c, viewDate.getMonth()); });
    if (document.getElementById('dash-budget-spent')) {
        const spentEl = document.getElementById('dash-budget-spent');
        spentEl.innerText = formatMoney(monthlyExpense);
        spentEl.className = (globalLimit > 0 && monthlyExpense > globalLimit) ? 'negative' : '';
    }
    const budgetPct = globalLimit > 0 ? Math.min(100, (monthlyExpense / globalLimit) * 100) : 0;
    const budgetBar = document.getElementById('dash-budget-bar');
    if (budgetBar) {
        budgetBar.style.backgroundColor = budgetPct > 90 ? 'var(--negative)' : (budgetPct > 75 ? '#f59e0b' : 'var(--positive)');
        setTimeout(() => { budgetBar.style.width = `${budgetPct}%`; }, 200);
    }

    const budgetCatsPreview = document.getElementById('dash-budget-categories-preview');
    if (budgetCatsPreview) {
        const totalsByCat = {};
        financeData.transactions.filter(t => t.monthId === viewMonthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t)).forEach(t => { totalsByCat[t.category || '📦 Otros'] = round2((totalsByCat[t.category || '📦 Otros'] || 0) + round2(t.amount)); });
        const sortedCats = Object.entries(totalsByCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
        if (sortedCats.length === 0) budgetCatsPreview.innerHTML = '<span style="font-size:11px; color:var(--text-muted);">Sin gastos registrados.</span>';
        else budgetCatsPreview.innerHTML = sortedCats.map(([cat, amt]) => `<div class="dash-budget-cat-row"><span>${cat.includes(' ') ? cat.split(' ').slice(1).join(' ') : cat}</span><b>${formatCompact(amt)}</b></div>`).join('');
    }

    renderBalanceSheet(currentBalances, currSnap.netWorth, currSnap);
    renderDashboardCardsSummary(currentBalances);
    renderDashboardDebtsSummary(currentBalances);
    renderHistory(viewMonthId, isFuture, projectionData);
    renderNetWorthChart(viewDate, prevDate, prevSnap, currSnap);
    renderCashFlowChart(viewDate, prevDate);
    renderDailySummary();
    renderBudgetDonut(viewMonthId, monthlyExpense);
    renderCalendar(viewDate, 'calendar-days-grid');
    renderCalendar(viewDate, 'header-cal-grid');

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
    const year = baseDate.getFullYear(), month = baseDate.getMonth(), firstDayOfWeek = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate(), todayStr = currentDate.toLocaleDateString('en-CA'), viewMonthId = getMonthId(baseDate);

    const dayActivity = {};
    financeData.transactions.forEach(t => {
        if (t.monthId === viewMonthId) {
            const dStr = new Date(t.id).toLocaleDateString('en-CA');
            if (!dayActivity[dStr]) dayActivity[dStr] = { inc: false, exp: false, trf: false };
            if (t.type === 'income') dayActivity[dStr].inc = true;
            if (t.type === 'expense') dayActivity[dStr].exp = true;
            if (t.type === 'transfer') dayActivity[dStr].trf = true;
        }
    });

    for (let i = 0; i < firstDayOfWeek; i++) grid.innerHTML += `<div class="cal-day empty"></div>`;
    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = new Date(year, month, day).toLocaleDateString('en-CA');
        const act = dayActivity[dStr];
        let dots = '';
        if (act) {
            if (act.inc) dots += `<span class="cal-dot" style="background:#10b981;"></span>`;
            if (act.exp) dots += `<span class="cal-dot" style="background:#ff3b30;"></span>`;
            if (act.trf) dots += `<span class="cal-dot" style="background:var(--accent);"></span>`;
        }
        const cell = document.createElement('div');
        cell.className = `cal-day ${dStr === todayStr ? 'today' : ''} ${selectedCalendarDay === dStr ? 'selected' : ''}`;
        cell.innerHTML = `<span>${day}</span><div class="cal-dots">${dots}</div>`;
        cell.onclick = () => { selectedCalendarDay = (selectedCalendarDay === dStr) ? null : dStr; forceCloseAllModals(); updateDashboard(); };
        grid.appendChild(cell);
    }
    const clearBtn = document.getElementById('clear-day-filter-btn');
    if (clearBtn) { if (selectedCalendarDay) clearBtn.classList.remove('hidden'); else clearBtn.classList.add('hidden'); }
};

document.getElementById('prev-month')?.addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); selectedCalendarDay = null; updateDashboard(); });
document.getElementById('next-month')?.addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); selectedCalendarDay = null; updateDashboard(); });
const triggerBtn = document.getElementById('calendar-trigger-btn'), popover = document.getElementById('quick-calendar-popover');
if (triggerBtn && popover) {
    triggerBtn.addEventListener('click', (e) => { e.stopPropagation(); popover.classList.toggle('hidden'); });
    document.addEventListener('click', (e) => { if (!popover.classList.contains('hidden') && !popover.contains(e.target) && !triggerBtn.contains(e.target)) popover.classList.add('hidden'); });
}
const goToday = () => { viewDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); selectedCalendarDay = null; if (popover) popover.classList.add('hidden'); updateDashboard(); };
document.getElementById('today-btn')?.addEventListener('click', goToday);
document.getElementById('popover-today-btn')?.addEventListener('click', goToday);
document.getElementById('quick-month-input')?.addEventListener('change', (e) => { if (e.target.value) { const [y, m] = e.target.value.split('-'); viewDate = new Date(y, m - 1, 1); selectedCalendarDay = null; if (popover) popover.classList.add('hidden'); updateDashboard(); } });
document.querySelectorAll('.quick-jump-btn').forEach(btn => {
    btn.addEventListener('click', () => { viewDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + parseInt(btn.getAttribute('data-offset')), 1); selectedCalendarDay = null; if (popover) popover.classList.add('hidden'); updateDashboard(); });
});
document.getElementById('clear-day-filter-btn')?.addEventListener('click', () => { selectedCalendarDay = null; updateDashboard(); });
// --- 4. WIDGETS DEL DASHBOARD Y GRÁFICOS SVG ---
document.getElementById('toggle-zero-accounts-btn')?.addEventListener('click', () => {
    financeData.hideZeroAccounts = !financeData.hideZeroAccounts;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    updateDashboard();
});

const renderBalanceSheet = (balances, netWorth, snap) => {
    const list = document.getElementById('balance-sheet-list');
    const dateBadge = document.getElementById('balance-sheet-date');
    const totalEl = document.getElementById('balance-sheet-total');
    const toggleZeroBtn = document.getElementById('toggle-zero-accounts-btn');
    if (!list || !dateBadge || !totalEl) return;

    dateBadge.innerText = currentDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    totalEl.innerText = formatMoney(netWorth);
    totalEl.className = netWorth >= 0 ? 'positive' : 'negative';

    // V2.3: Actualizar resumen gráfico superior del balance
    if (document.getElementById('dash-balance-networth-center')) {
        document.getElementById('dash-balance-networth-center').innerText = formatCompact(netWorth);
    }
    
    const totalAssets = snap.assetsTotal + snap.fixedAssetsTotal + snap.pocketsTotal;
    const totalLiabilities = snap.liabilitiesTotal;
    
    if (document.getElementById('dash-bal-assets')) {
        document.getElementById('dash-bal-assets').innerText = formatCompact(totalAssets);
    }
    if (document.getElementById('dash-bal-liabilities')) {
        document.getElementById('dash-bal-liabilities').innerText = formatCompact(totalLiabilities);
    }

    const balCircle = document.getElementById('dash-balance-circle');
    if (balCircle) {
        if (totalAssets > 0) {
            const pct = Math.max(0, Math.min(100, (netWorth / totalAssets) * 100));
            balCircle.style.stroke = pct >= 50 ? 'var(--positive)' : (pct > 20 ? '#f59e0b' : 'var(--negative)');
            setTimeout(() => {
                balCircle.style.strokeDashoffset = 251.2 - (251.2 * pct / 100);
            }, 250);
        } else {
            balCircle.style.stroke = 'var(--negative)';
            balCircle.style.strokeDashoffset = 251.2;
        }
    }

    list.innerHTML = '';
    let hiddenCount = 0;

    const sortedAccounts = sortAlphabeticallyWithDefault(financeData.customAccounts);

    sortedAccounts.forEach(acc => {
        const bal = round2(balances[acc.id] || 0);
        const isZero = Math.abs(bal) < 0.01;

        if (financeData.hideZeroAccounts && isZero && !acc.showWhenZero) {
            hiddenCount++;
            return;
        }

        const isLiab = isLiabilityCategory(acc.category);
        const displayVal = isLiab ? -bal : bal;
        const colorClass = isLiab ? (bal > 0 ? 'negative' : '') : (bal > 0 ? 'positive' : '');
        const icon = acc.category === 'credit_card' ? '💳' : (acc.category === 'debt' ? '💸' : '💵');
        const starTag = acc.isDefault ? ' ⭐' : '';

        const row = document.createElement('div');
        row.className = 'bs-row';
        row.onclick = () => { 
            if (attemptCloseModals()) openAccountDetail(acc.id, 'home'); 
        };
        row.innerHTML = `
            <span>${icon} ${acc.name}${starTag}</span>
            <strong class="${colorClass}">${formatMoney(displayVal)}</strong>
        `;
        list.appendChild(row);
    });

    if (toggleZeroBtn) {
        if (financeData.hideZeroAccounts) {
            toggleZeroBtn.innerText = hiddenCount > 0 ? `👁️ Ver todas (+${hiddenCount})` : '👁️ Ver todas';
        } else {
            toggleZeroBtn.innerText = '👁️ Ocultar $0';
        }
    }

    if (snap.pocketsTotal > 0) {
        const pRow = document.createElement('div');
        pRow.className = 'bs-row';
        pRow.onclick = () => { 
            if (attemptCloseModals()) { 
                document.getElementById('pockets-modal')?.classList.remove('hidden'); 
                renderPocketsView(); 
            } 
        };
        pRow.innerHTML = `
            <span>🐷 Bolsillos de Ahorro</span>
            <strong class="positive">${formatMoney(snap.pocketsTotal)}</strong>
        `;
        list.appendChild(pRow);
    }

    if (list.children.length === 0) {
        list.innerHTML = '<div class="bs-row" style="cursor:default;"><small style="color:var(--text-muted);">Todas las cuentas están en $ 0,00.</small></div>';
    }
};

const renderDashboardCardsSummary = (balances) => {
    const widget = document.getElementById('dashboard-tc-widget');
    const summaryStrip = document.getElementById('dashboard-tc-summary');
    const healthBadge = document.getElementById('dashboard-tc-health');
    const list = document.getElementById('dashboard-tc-list');
    if (!widget || !summaryStrip || !healthBadge || !list) return;

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
            pendingItems.forEach(p => { 
                scheduledNextStatement = round2(scheduledNextStatement + p.nextQuota); 
            });
        }
    });

    const totalCardsAvailable = Math.max(0, round2(totalCardsLimit - totalCardsDebt));
    const displayNextQuota = hasDeferredItems ? Math.min(totalCardsDebt, scheduledNextStatement) : round2(totalCardsDebt / 12);
    const quotaLabel = hasDeferredItems ? 'Cuota Próximo Corte' : 'Cuota Est. (1/12)';
    const utilPct = totalCardsLimit > 0 ? (totalCardsDebt / totalCardsLimit) * 100 : 0;

    if (utilPct <= 30) { 
        healthBadge.innerText = `Saludable 🟢 (${utilPct.toFixed(0)}%)`; 
        healthBadge.className = 'widget-badge good'; 
    } else if (utilPct <= 70) { 
        healthBadge.innerText = `Moderado 🟡 (${utilPct.toFixed(0)}%)`; 
        healthBadge.className = 'widget-badge warn'; 
    } else { 
        healthBadge.innerText = `Crítico 🔴 (${utilPct.toFixed(0)}%)`; 
        healthBadge.className = 'widget-badge danger'; 
    }

    summaryStrip.innerHTML = `
        <div class="dash-strip-item">
            <small>Deuda Total TC</small>
            <strong class="negative">${formatMoney(totalCardsDebt)}</strong>
        </div>
        <div class="dash-strip-item">
            <small>Cupo Disponible</small>
            <strong class="positive">${formatMoney(totalCardsAvailable)}</strong>
        </div>
        <div class="dash-strip-item">
            <small>${quotaLabel}</small>
            <strong>${formatMoney(displayNextQuota)}</strong>
        </div>
    `;

    const todayDay = currentDate.getDate();
    
    cards.forEach(card => {
        const debt = round2(balances[card.id] || 0);
        const limit = round2(card.creditLimit || 0);
        const pct = limit > 0 ? Math.min(100, Math.max(0, (debt / limit) * 100)) : 0;
        const barColor = pct > 80 ? 'var(--negative)' : (pct > 50 ? '#f59e0b' : 'var(--positive)');
        const cutoff = card.cutoffDay || 15;
        const cyclePos = Math.min(98, Math.max(2, (todayDay / 30) * 100));
        
        const pendingCount = getPendingCardPurchases(card.id).length;
        const zeroTag = card.zeroInterestMax > 0 ? ` • ✨ 0% hasta ${card.zeroInterestMax}c` : '';

        const row = document.createElement('div');
        row.className = 'dash-tc-row';
        row.onclick = () => { 
            if (attemptCloseModals()) openAccountDetail(card.id, 'home'); 
        };
        row.innerHTML = `
            <div class="dash-tc-top">
                <span>💳 ${card.name}${card.isDefault ? ' ⭐' : ''} ${pendingCount > 0 ? `<small style="color:var(--accent); font-weight:600;">(${pendingCount} diff.)</small>` : ''}</span>
                <span>${formatMoney(debt)} <small style="color:var(--text-muted); font-weight:500;">/ ${formatMoney(limit)}</small></span>
            </div>
            <div class="pace-bar-track" style="height: 8px;">
                <div class="pace-bar-fill" style="width: ${pct}%; background-color: ${barColor};"></div>
                <div class="pace-marker" style="left: ${cyclePos}%; height: 14px; top: -3px;"></div>
            </div>
            <div class="dash-tc-sub">
                <span>Disp: <b style="color:var(--positive);">${formatMoney(limit - debt)}</b>${zeroTag}</span>
                <span>Corte: ${cutoff} • Pago: ${card.paymentDay || '-'}</span>
            </div>
        `;
        list.appendChild(row);
    });
};

const renderDashboardDebtsSummary = (balances) => {
    const widget = document.getElementById('dashboard-debts-widget');
    const summaryStrip = document.getElementById('dashboard-debts-summary');
    const badge = document.getElementById('dashboard-debts-badge');
    const list = document.getElementById('dashboard-debts-list');
    if (!widget || !summaryStrip || !badge || !list) return;

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
        
        if (monthlyPay === 0 && orig > 0 && totQ > 0 && debt.debtType !== 'revolving') {
            monthlyPay = calculateAmortization(orig, totQ, debt.debtRate || 0, debt.debtRateType || 'monthly').payment;
        } else if (debt.debtType === 'revolving') {
            const revPurchases = getPendingRevolvingPurchases(debt.id);
            monthlyPay = revPurchases.reduce((s, p) => s + p.nextQuota, 0);
        }
        
        totalDebtsBalance = round2(totalDebtsBalance + bal);
        totalOriginalDebts = round2(totalOriginalDebts + orig);
        if (bal > 0) {
            totalMonthlyQuotas = round2(totalMonthlyQuotas + monthlyPay);
        }
    });

    const amortPct = totalOriginalDebts > 0 ? Math.min(100, (Math.max(0, round2(totalOriginalDebts - totalDebtsBalance)) / totalOriginalDebts) * 100) : 0;
    
    badge.innerText = `${debts.length} ${debts.length === 1 ? 'crédito' : 'créditos'}`;
    
    summaryStrip.innerHTML = `
        <div class="dash-strip-item">
            <small>Deuda Vigente</small>
            <strong class="negative">${formatMoney(totalDebtsBalance)}</strong>
        </div>
        <div class="dash-strip-item">
            <small>Total Cuotas / Mes</small>
            <strong style="color: var(--accent);">${formatMoney(totalMonthlyQuotas)}</strong>
        </div>
        <div class="dash-strip-item">
            <small>Amortizado</small>
            <strong class="positive">${amortPct.toFixed(0)}%</strong>
        </div>
    `;

    debts.forEach(debt => {
        const bal = Math.max(0, round2(balances[debt.id] || 0));
        const orig = round2(debt.debtOriginal || bal);
        const totQ = debt.debtTotalQuotes || 1;
        const paidQ = debt.debtPaidQuotes || 0;
        const rate = debt.debtRate || 0;
        const rateType = debt.debtRateType || 'monthly';
        
        let monthlyPay = round2(debt.debtMonthlyPayment || 0);
        let labelProgress = `Cuotas: ${paidQ}/${totQ}`;
        let subBadge = '';

        if (debt.debtType === 'revolving') {
            const revPurchases = getPendingRevolvingPurchases(debt.id);
            monthlyPay = revPurchases.reduce((s, p) => s + p.nextQuota, 0);
            labelProgress = `Compras pendientes: ${revPurchases.length}`;
            subBadge = ` <span class="widget-badge warn" style="font-size:8px; padding:2px 4px;">Rotativo BNPL</span>`;
        } else if (monthlyPay === 0 && orig > 0 && totQ > 0) {
            monthlyPay = calculateAmortization(orig, totQ, rate, rateType).payment;
        }

        const itemPct = orig > 0 ? Math.min(100, Math.max(0, (Math.max(0, round2(orig - bal)) / orig) * 100)) : 0;
        const payrollTag = debt.payrollDeduction ? ` • 🏢 Nómina` : '';
        
        const row = document.createElement('div');
        row.className = 'dash-tc-row';
        row.onclick = () => { 
            if (attemptCloseModals()) openAccountDetail(debt.id, 'home'); 
        };
        
        row.innerHTML = `
            <div class="dash-tc-top">
                <span>💸 ${debt.name}${subBadge}</span>
                <span>${formatMoney(bal)} <small style="color:var(--text-muted); font-weight:500;">/ ${formatMoney(orig)}</small></span>
            </div>
            <div class="pace-bar-track" style="height: 8px;">
                <div class="pace-bar-fill" style="width: ${itemPct}%; background-color: var(--positive);"></div>
            </div>
            <div class="dash-tc-sub">
                <span>Cuota: <b style="color:var(--accent);">${formatMoney(monthlyPay)}/mes</b>${payrollTag}</span>
                <span>${labelProgress} • Tasa: ${String(rate).replace('.', ',')}% ${rateType === 'monthly' ? 'M.V.' : 'E.A.'}</span>
            </div>
        `;
        list.appendChild(row);
    });
};

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

    const ptsAssets = months.map((m, i) => `${getX(i)},${getY(m.assets)}`).join(' ');
    const ptsLiab = months.map((m, i) => `${getX(i)},${getY(m.liabilities)}`).join(' ');
    const ptsNet = months.map((m, i) => `${getX(i)},${getY(m.net)}`).join(' ');

    let svg = `<svg viewBox="0 0 ${W} ${H}">
        <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="rgba(148,163,184,0.18)" stroke-dasharray="3,3"/>
        <line x1="${padL}" y1="${zeroY}" x2="${W - padR}" y2="${zeroY}" stroke="rgba(148,163,184,0.45)" stroke-width="1"/>
        <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="rgba(148,163,184,0.18)" stroke-dasharray="3,3"/>
        <text x="${padL - 5}" y="${padT + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompact(maxVal)}</text>
        <text x="${padL - 5}" y="${zeroY + 3}" text-anchor="end" font-size="9" fill="#94a3b8">$0</text>
        <text x="${padL - 5}" y="${H - padB}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompact(minVal)}</text>
        <polygon points="${getX(0)},${zeroY} ${ptsAssets} ${getX(months.length - 1)},${zeroY}" fill="rgba(16, 185, 129, 0.14)"/>
        <polygon points="${getX(0)},${zeroY} ${ptsLiab} ${getX(months.length - 1)},${zeroY}" fill="rgba(255, 59, 48, 0.14)"/>
        <polyline fill="none" stroke="#10b981" stroke-width="2" points="${ptsAssets}"/>
        <polyline fill="none" stroke="#ff3b30" stroke-width="2" points="${ptsLiab}"/>
        <polyline fill="none" stroke="var(--accent)" stroke-width="2.2" points="${ptsNet}"/>`;

    months.forEach((m, i) => {
        const x = getX(i);
        svg += `
            <circle cx="${x}" cy="${getY(m.assets)}" r="3" fill="#10b981"/>
            <circle cx="${x}" cy="${getY(m.liabilities)}" r="3" fill="#ff3b30"/>
            <circle cx="${x}" cy="${getY(m.net)}" r="3.2" fill="var(--accent)"/>
            <text x="${x}" y="${H - 5}" text-anchor="middle" font-size="9.5" fill="#94a3b8">${m.label}</text>
        `;
    });
    
    chartContainer.innerHTML = svg + `</svg>`;

    if (document.getElementById('nw-prev-col')) document.getElementById('nw-prev-col').innerText = getShortMonthLabel(prevDate);
    if (document.getElementById('nw-curr-col')) document.getElementById('nw-curr-col').innerText = getShortMonthLabel(baseDate);
    
    const nwBody = document.getElementById('nw-comp-body');
    if (nwBody) {
        nwBody.innerHTML = `
            <tr>
                <td><i class="dot" style="background:#10b981;"></i>Activos</td>
                <td>${formatMoney(prevSnap.assetsTotal + prevSnap.fixedAssetsTotal + prevSnap.pocketsTotal)}</td>
                <td class="positive">${formatMoney(currSnap.assetsTotal + currSnap.fixedAssetsTotal + currSnap.pocketsTotal)}</td>
            </tr>
            <tr>
                <td><i class="dot" style="background:#ff3b30;"></i>Pasivos</td>
                <td>${formatMoney(-prevSnap.liabilitiesTotal)}</td>
                <td class="negative">${formatMoney(-currSnap.liabilitiesTotal)}</td>
            </tr>
            <tr>
                <td><i class="dot" style="background:var(--accent);"></i>Patrimonio</td>
                <td>${formatMoney(prevSnap.netWorth)}</td>
                <td>${formatMoney(currSnap.netWorth)}</td>
            </tr>
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
            inc: flow.inc, 
            exp: flow.exp, 
            net: flow.net 
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
    
    chartContainer.innerHTML = svg + `</svg>`;

    if (document.getElementById('cf-prev-col')) document.getElementById('cf-prev-col').innerText = getShortMonthLabel(prevDate);
    if (document.getElementById('cf-curr-col')) document.getElementById('cf-curr-col').innerText = getShortMonthLabel(baseDate);
    
    const cfBody = document.getElementById('cf-comp-body');
    if (cfBody) {
        cfBody.innerHTML = `
            <tr>
                <td><i class="dot" style="background:#10b981;"></i>Entradas</td>
                <td>${formatMoney(months[1].inc)}</td>
                <td class="positive">${formatMoney(months[2].inc)}</td>
            </tr>
            <tr>
                <td><i class="dot" style="background:#ff3b30;"></i>Salidas</td>
                <td>${formatMoney(-months[1].exp)}</td>
                <td class="negative">${formatMoney(-months[2].exp)}</td>
            </tr>
            <tr>
                <td>Flujo neto</td>
                <td>${formatMoney(months[1].net)}</td>
                <td class="${months[2].net >= 0 ? 'positive' : 'negative'}">${formatMoney(months[2].net)}</td>
            </tr>
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

    let svg = `<svg viewBox="0 0 ${W} ${H}">
        <line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="rgba(148,163,184,0.35)" stroke-width="1"/>`;
        
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
    
    if (avg7El) { 
        avg7El.innerText = formatMoney(avg7); 
        avg7El.className = avg7 >= 0 ? 'positive' : 'negative'; 
    }
    if (avg30El) { 
        avg30El.innerText = formatMoney(avg30); 
        avg30El.className = avg30 >= 0 ? 'positive' : 'negative'; 
    }
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
        donutBox.innerHTML = `
            <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(148,163,184,0.25)" stroke-width="14"/>
                <text x="50" y="53" text-anchor="middle" font-size="10" fill="#94a3b8">Sin gastos</text>
            </svg>
        `;
        legendList.innerHTML = `<span style="color: var(--text-muted); font-size: 11px;">Registra gastos este mes.</span>`;
    } else {
        const R = 36;
        const C = 2 * Math.PI * R; 
        let offset = 0;
        
        let svg = `<svg viewBox="0 0 100 100" style="transform: rotate(-90deg);">`;
        
        sorted.forEach(([catName, amt], idx) => {
            const pct = (amt / totalMonthlyExpense) * 100;
            const dash = (pct / 100) * C;
            const color = categoryColors[idx % categoryColors.length];
            
            svg += `<circle cx="50" cy="50" r="${R}" fill="none" stroke="${color}" stroke-width="15" stroke-dasharray="${dash} ${C}" stroke-dashoffset="${-offset}"/>`;
            offset += dash;
            
            if (idx < 5) {
                const shortName = catName.includes(' ') ? catName.split(' ').slice(1).join(' ') : catName;
                legendList.innerHTML += `
                    <div class="donut-legend-item">
                        <div class="donut-legend-left">
                            <i class="dot" style="background:${color};"></i>
                            <span>${shortName}</span>
                        </div>
                        <strong>${pct.toFixed(0)}%</strong>
                    </div>
                `;
            }
        });
        
        donutBox.innerHTML = svg + `</svg>`;
    }
};

// --- 5. HISTORIAL DE MOVIMIENTOS Y PENDIENTES ---
document.querySelectorAll('#history-filter-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#history-filter-pills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeHistoryFilter = btn.getAttribute('data-filter');
        updateDashboard();
    });
});

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
            if (realAmt < 0) {
                alert('Ingresa un monto válido.');
                return false;
            }
            if (!tx.budgetedAmount) tx.budgetedAmount = defaultAmt;
            
            tx.amount = realAmt;
            tx.status = 'closed';
            
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            updateDashboard();
            return true;
        }
    });
};

const renderHistory = (viewMonthId, isFuture, projectionData) => {
    const list = document.getElementById('history-list');
    const titleEl = document.getElementById('history-title');
    const countBadge = document.getElementById('history-count-badge');
    if (!list || !titleEl || !countBadge) return;

    list.innerHTML = '';
    let filtered = financeData.transactions.filter(t => t.monthId === viewMonthId);

    if (selectedCalendarDay) {
        titleEl.innerText = `Mov. del ${selectedCalendarDay}`;
        filtered = filtered.filter(t => new Date(t.id).toLocaleDateString('en-CA') === selectedCalendarDay);
    } else {
        titleEl.innerText = isFuture ? "Movimientos programados (Mes)" : "Movimientos del mes";
    }

    if (activeHistoryFilter === 'pending') {
        filtered = filtered.filter(t => t.status === 'pending');
    } else if (activeHistoryFilter !== 'all') {
        filtered = filtered.filter(t => t.type === activeHistoryFilter);
    }

    filtered.sort((a, b) => {
        if ((a.status === 'pending') !== (b.status === 'pending')) return a.status === 'pending' ? -1 : 1;
        return b.id - a.id;
    });

    countBadge.innerText = filtered.length;

    if (isFuture && projectionData) {
        const projLi = document.createElement('li');
        projLi.className = 'history-item projection-box';
        projLi.style.marginBottom = '10px';
        
        if (projectionData.mode === 'scheduled') {
            projLi.innerHTML = `
                <div>
                    <strong>📅 Proyección Programada</strong>
                    Ingresos est.: <b>${formatMoney(projectionData.avgIncome)}</b> • Gastos est.: <b>${formatMoney(projectionData.avgExpense)}</b><br>
                    Liquidez proyectada (+${projectionData.monthsDiff}m): <b>${formatMoney(projectionData.projectedLiquidity)}</b>
                </div>`;
        } else {
            projLi.innerHTML = `
                <div>
                    <strong>📊 Simulación por Promedio</strong>
                    Flujo Neto Promedio: <b>${formatMoney(projectionData.avgCashFlow)}/mes</b><br>
                    Liquidez proyectada (+${projectionData.monthsDiff}m): <b>${formatMoney(projectionData.projectedLiquidity)}</b>
                </div>`;
        }
        list.appendChild(projLi);
    }

    if (filtered.length === 0) {
        if (!isFuture) {
            list.innerHTML = '<li class="history-item"><div class="history-info"><small>No hay movimientos registrados</small></div></li>';
        }
        return;
    }

    filtered.forEach(t => {
        const isPending = t.status === 'pending';
        const li = document.createElement('li');
        li.className = `history-item ${isPending ? 'pending-item' : ''}`;
        
        li.onclick = () => { 
            if (attemptCloseModals()) openEditModal(t.id); 
        };

        let sign = '', colorClass = '', accountText = t.account || '';
        const subText = t.subcategory && t.subcategory !== 'General' ? ` (${t.subcategory})` : '';
        const catBadge = t.category && t.type !== 'transfer' ? ` • ${t.category}${subText}` : '';
        let extraBadge = '';

        if (isPending) {
            extraBadge += ` • <span style="color:#d97706; font-weight:700;">⏳ Pendiente</span>`;
        } else if (t.budgetedAmount && t.budgetedAmount > 0) {
            const variance = calculateBudgetVariance(t.type, t.amount, t.budgetedAmount);
            if (variance.hasBudget) {
                const signPct = variance.pct > 0 ? '+' : '';
                const pctStr = `${signPct}${String(variance.pct).replace('.', ',')}%`;
                const colorVar = variance.isFavorable ? 'var(--positive)' : 'var(--negative)';
                extraBadge += ` • <span style="color:${colorVar}; font-weight:600;">Ptto: ${formatCompact(t.budgetedAmount)} (${pctStr})</span>`;
            }
        }

        if (t.type === 'expense' && t.installments && t.installments > 1) {
            const rateLabel = (t.zeroInterest || !t.rate) ? '0% int.' : `${String(t.rate).replace('.', ',')}%`;
            extraBadge += ` • ${t.paidInstallments || 0}/${t.installments}c (${rateLabel})`;
        } else if (t.type === 'transfer' && t.paymentMode === 'extraordinary') {
            extraBadge += ` • 🚀 Abono Extra`;
        }

        if (t.type === 'income') { 
            sign = '+'; 
            colorClass = 'positive'; 
        } else if (t.type === 'expense') { 
            sign = '-'; 
            colorClass = 'negative'; 
        } else if (t.type === 'transfer') { 
            sign = '🔄'; 
            colorClass = ''; 
            accountText = `${t.account} ➔ ${t.toAccount}`; 
        }

        const displayAmt = isPending ? (t.budgetedAmount || t.amount) : t.amount;
        const confirmBtnHtml = isPending ? `<button type="button" class="btn-confirm-pending" onclick="confirmPendingTx('${t.id}', event)">✓ Confirmar</button>` : '';

        li.innerHTML = `
            <div class="history-info">
                <strong>${t.description}</strong>
                <small>${t.date} • <i>${accountText}</i>${catBadge}${extraBadge}</small>
            </div>
            <div class="history-amount ${colorClass}">
                <div>${sign} ${formatMoney(displayAmt)}</div>
                ${confirmBtnHtml}
            </div>
        `;
        list.appendChild(li);
    });
};
// --- CONTROL ANUAL CONSOLIDADO (12 MESES) ---
const renderAnnualControlTable = () => {
    const thead = document.getElementById('annual-control-thead');
    const tbody = document.getElementById('annual-control-tbody');
    if (!thead || !tbody) return;
    
    if (document.getElementById('annual-year-display')) {
        document.getElementById('annual-year-display').innerText = annualViewYear;
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
document.getElementById('close-annual-control-btn')?.addEventListener('click', () => {
    document.getElementById('annual-control-modal')?.classList.add('hidden');
});
document.getElementById('annual-prev-year')?.addEventListener('click', () => { annualViewYear--; renderAnnualControlTable(); });
document.getElementById('annual-next-year')?.addEventListener('click', () => { annualViewYear++; renderAnnualControlTable(); });

document.querySelectorAll('#annual-filter-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#annual-filter-pills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); 
        annualViewTab = btn.getAttribute('data-view'); 
        renderAnnualControlTable();
    });
});

// --- 11. CUENTAS, TARJETAS, DEUDAS, PRESUPUESTOS Y ACTIVOS ---
const renderAccountsBreakdown = (balances, totalLiquidity) => {
    if (document.getElementById('accounts-total-liquidity')) {
        document.getElementById('accounts-total-liquidity').innerText = formatMoney(totalLiquidity);
    }
    
    const combinedBar = document.getElementById('combined-bar');
    const combinedLegend = document.getElementById('combined-legend');
    const list = document.getElementById('accounts-breakdown-list');
    
    if (!combinedBar || !combinedLegend || !list) return;

    combinedBar.innerHTML = ''; 
    combinedLegend.innerHTML = ''; 
    list.innerHTML = '';
    
    const assets = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset'));

    assets.forEach((acc, index) => {
        const balance = round2(balances[acc.id] || 0);
        let percentage = totalLiquidity > 0 ? Math.max(0, (balance / totalLiquidity) * 100) : 0;
        const color = assetColors[index % assetColors.length];
        const starTag = acc.isDefault ? ' ⭐' : '';
        
        if (percentage > 0) {
            combinedBar.innerHTML += `<div class="segment" style="width: ${percentage}%; background-color: ${color};"></div>`;
        }
        
        combinedLegend.innerHTML += `
            <div class="legend-item">
                <span class="dot" style="background-color: ${color};"></span>
                <span>${acc.name} ${percentage.toFixed(0)}%</span>
            </div>
        `;
            
        let deleteBtnHTML = acc.id !== 'Efectivo' 
            ? `<button type="button" onclick="event.stopPropagation(); deleteAccount('${acc.id}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); cursor:pointer; font-weight:bold; padding:5px 10px; border-radius:6px; margin-left:10px;">X</button>` 
            : '';
            
        list.innerHTML += `
            <div class="acc-list-item" onclick="openAccountDetail('${acc.id}', 'asset')">
                <div class="acc-list-name">
                    <span class="dot" style="background-color: ${color};"></span>
                    ${acc.name}${starTag}
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="acc-list-balance">${formatMoney(balance)}</span>
                    ${deleteBtnHTML}
                    <span style="color: var(--text-muted); margin-left: 8px; font-size: 14px;">›</span>
                </div>
            </div>
        `;
    });
};

const renderCardsBreakdown = (balances) => {
    const cards = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'credit_card'));
    let totalCardsDebt = 0, totalCardsLimit = 0;
    
    cards.forEach(c => { 
        totalCardsDebt = round2(totalCardsDebt + Math.max(0, round2(balances[c.id] || 0))); 
        totalCardsLimit = round2(totalCardsLimit + round2(c.creditLimit || 0)); 
    });

    if (document.getElementById('cards-total-debt')) {
        document.getElementById('cards-total-debt').innerText = formatMoney(totalCardsDebt);
    }
    if (document.getElementById('cards-total-available')) {
        document.getElementById('cards-total-available').innerText = formatMoney(Math.max(0, round2(totalCardsLimit - totalCardsDebt)));
    }

    const combinedBar = document.getElementById('cards-combined-bar');
    const combinedLegend = document.getElementById('cards-combined-legend');
    const list = document.getElementById('cards-breakdown-list');
    
    if (!combinedBar || !combinedLegend || !list) return;
    combinedBar.innerHTML = ''; combinedLegend.innerHTML = ''; list.innerHTML = '';

    if (cards.length === 0) { 
        list.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 10px 0;">No tienes tarjetas de crédito.</p>'; 
        return; 
    }

    cards.forEach((card, index) => {
        const debt = round2(balances[card.id] || 0);
        const limit = round2(card.creditLimit || 0);
        const available = round2(limit - debt);
        const color = cardColors[index % cardColors.length];
        const starTag = card.isDefault ? ' ⭐' : '';
        
        let debtShare = totalCardsDebt > 0 && debt > 0 ? (debt / totalCardsDebt) * 100 : 0;
        if (debtShare > 0) {
            combinedBar.innerHTML += `<div class="segment" style="width: ${debtShare}%; background-color: ${color};"></div>`;
        }
        
        combinedLegend.innerHTML += `
            <div class="legend-item">
                <span class="dot" style="background-color: ${color};"></span>
                <span>${card.name} ${debtShare.toFixed(0)}%</span>
            </div>
        `;
            
        let usagePercent = limit > 0 ? Math.min(100, Math.max(0, (debt / limit) * 100)) : 0;
        let barColor = usagePercent > 80 ? 'var(--negative)' : (usagePercent > 50 ? '#f59e0b' : 'var(--positive)');
        
        list.innerHTML += `
            <div class="tc-card-item" onclick="openAccountDetail('${card.id}', 'credit_card')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="acc-list-name">
                        <span class="dot" style="background-color: ${color};"></span>
                        <span>${card.name}${starTag}</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span class="acc-list-balance negative">${formatMoney(debt)}</span>
                        <button type="button" onclick="event.stopPropagation(); deleteAccount('${card.id}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); cursor:pointer; font-weight:bold; padding:4px 8px; border-radius:6px; margin-left:8px; font-size: 11px;">X</button>
                        <span style="color: var(--text-muted); margin-left: 6px; font-size: 14px;">›</span>
                    </div>
                </div>
                <div class="tc-mini-bar">
                    <div class="tc-mini-bar-fill" style="width: ${usagePercent}%; background-color: ${barColor};"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
                    <span>Cupo: ${formatMoney(limit)}</span>
                    <span style="color: ${available >= 0 ? 'var(--positive)' : 'var(--negative)'}; font-weight: 600;">Disp: ${formatMoney(available)}</span>
                </div>
            </div>
        `;
    });
};

const renderDebtsBreakdown = (balances, totalLoansDebt) => {
    // Actualizar Capacidad de Endeudamiento
    const cap = calculateBorrowingCapacity(getMonthId(viewDate));
    const capBadge = document.getElementById('cap-usage-badge');
    const capBar = document.getElementById('cap-usage-bar');
    if (capBadge && capBar) {
        const ratio = cap.maxPct > 0 ? Math.min(100, (cap.usedPct / cap.maxPct) * 100) : 0;
        capBadge.innerText = `${String(cap.usedPct).replace('.', ',')}% / ${cap.maxPct}%`;
        capBadge.className = `widget-badge ${cap.availableMonthlyCapacity < 0 ? 'danger' : (ratio > 80 ? 'warn' : 'good')}`;
        capBar.style.width = `${ratio}%`;
        capBar.style.backgroundColor = cap.availableMonthlyCapacity < 0 ? 'var(--negative)' : (ratio > 80 ? '#f59e0b' : 'var(--positive)');
    }
    if (document.getElementById('cap-income-label')) document.getElementById('cap-income-label').innerText = cap.incomeSource;
    if (document.getElementById('cap-base-income')) document.getElementById('cap-base-income').innerText = formatCompact(cap.baseIncome);
    if (document.getElementById('cap-committed-quota')) document.getElementById('cap-committed-quota').innerText = formatCompact(cap.committedMonthly);
    const availQuotaEl = document.getElementById('cap-available-quota');
    if (availQuotaEl) {
        availQuotaEl.innerText = formatCompact(cap.availableMonthlyCapacity);
        availQuotaEl.className = cap.availableMonthlyCapacity >= 0 ? 'positive' : 'negative';
    }
    const estEl = document.getElementById('cap-loan-estimate');
    if (estEl) {
        if (cap.baseIncome <= 0) {
            estEl.innerHTML = 'Configura tu <b>Salario</b> o registra ingresos para calcular tu capacidad.';
        } else if (cap.availableMonthlyCapacity > 0) {
            estEl.innerHTML = `💡 Cupo libre aprox.: <b>${formatCompact(cap.estLoan24m)}</b> (a 24m) o <b>${formatCompact(cap.estLoan36m)}</b> (a 36m).`;
        } else {
            estEl.innerHTML = `<span class="negative">⚠️ Excedes tu límite recomendado en <b>${formatMoney(Math.abs(cap.availableMonthlyCapacity))}/mes</b>.</span>`;
        }
    }

    const amountEl = document.getElementById('debts-total-amount');
    const combinedBar = document.getElementById('debts-combined-bar');
    const combinedLegend = document.getElementById('debts-combined-legend');
    const list = document.getElementById('debts-breakdown-list');
    
    if (!amountEl || !combinedBar || !combinedLegend || !list) return;
    
    amountEl.innerText = formatMoney(totalLoansDebt);
    combinedBar.innerHTML = ''; combinedLegend.innerHTML = ''; list.innerHTML = '';

    const debts = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'debt'));
    if (debts.length === 0) { 
        list.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 10px 0;">No tienes préstamos u otras deudas.</p>'; 
        return; 
    }

    debts.forEach((acc, index) => {
        const balance = Math.max(0, round2(balances[acc.id] || 0)); 
        let percentage = totalLoansDebt > 0 ? (balance / totalLoansDebt) * 100 : 0;
        const color = debtColors[index % debtColors.length];
        
        if (percentage > 0) {
            combinedBar.innerHTML += `<div class="segment" style="width: ${percentage}%; background-color: ${color};"></div>`;
        }
        
        combinedLegend.innerHTML += `
            <div class="legend-item">
                <span class="dot" style="background-color: ${color};"></span>
                <span>${acc.name} ${percentage.toFixed(0)}%</span>
            </div>
        `;
            
        let monthlyPay = round2(acc.debtMonthlyPayment || 0);
        let subLabel = `${acc.debtPaidQuotes || 0}/${acc.debtTotalQuotes || 1}c`;
        
        if (acc.debtType === 'revolving') {
            const revPurchases = getPendingRevolvingPurchases(acc.id);
            monthlyPay = revPurchases.reduce((s, p) => s + p.nextQuota, 0);
            subLabel = `${revPurchases.length} compras`;
        } else if (monthlyPay === 0) {
            monthlyPay = calculateAmortization(acc.debtOriginal || balance, acc.debtTotalQuotes || 1, acc.debtRate || 0, acc.debtRateType || 'monthly').payment;
        }

        const payrollTag = acc.payrollDeduction ? ` • 🏢 Nom.` : '';

        list.innerHTML += `
            <div class="acc-list-item" onclick="openAccountDetail('${acc.id}', 'debt')">
                <div class="acc-list-name">
                    <span class="dot" style="background-color: ${color};"></span>
                    <div>
                        <span>${acc.name}</span>
                        <small style="display:block; font-size:11px; color:var(--text-muted); font-weight:500;">
                            Cuota: ${formatMoney(monthlyPay)} ${payrollTag} • ${subLabel}
                        </small>
                    </div>
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="acc-list-balance negative">${formatMoney(balance)}</span>
                    <button type="button" onclick="event.stopPropagation(); deleteAccount('${acc.id}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); cursor:pointer; font-weight:bold; padding:5px 10px; border-radius:6px; margin-left:10px;">X</button>
                    <span style="color: var(--text-muted); margin-left: 8px; font-size: 14px;">›</span>
                </div>
            </div>
        `;
    });
};

const renderExpensesBreakdown = (viewMonthId) => {
    if (document.getElementById('expenses-month-badge')) {
        document.getElementById('expenses-month-badge').innerText = formatMonthName(viewDate);
    }
    const combinedBar = document.getElementById('expenses-combined-bar');
    const combinedLegend = document.getElementById('expenses-combined-legend');
    const list = document.getElementById('expenses-category-list');
    
    if (!combinedBar || !combinedLegend || !list) return;
    combinedBar.innerHTML = ''; combinedLegend.innerHTML = ''; list.innerHTML = '';

    const monthExpenses = financeData.transactions.filter(t => t.monthId === viewMonthId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t));
    const totalSpent = round2(monthExpenses.reduce((sum, t) => sum + round2(t.amount), 0));
    
    if (document.getElementById('expenses-total-amount')) {
        document.getElementById('expenses-total-amount').innerText = formatMoney(totalSpent);
    }
    
    if (totalSpent === 0) { 
        list.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 10px 0;">No hay gastos registrados en este mes.</p>'; 
        return; 
    }

    const totalsByCat = {};
    monthExpenses.forEach(t => { 
        totalsByCat[t.category || '📦 Otros Gastos'] = round2((totalsByCat[t.category || '📦 Otros Gastos'] || 0) + round2(t.amount)); 
    });
    
    Object.entries(totalsByCat).sort((a, b) => b[1] - a[1]).forEach(([catName, amount], index) => {
        const percentage = (amount / totalSpent) * 100;
        const color = categoryColors[index % categoryColors.length];
        
        combinedBar.innerHTML += `<div class="segment" style="width: ${percentage}%; background-color: ${color};"></div>`;
        combinedLegend.innerHTML += `
            <div class="legend-item">
                <span class="dot" style="background-color: ${color};"></span>
                <span>${catName.split(' ')[1] || catName} ${percentage.toFixed(0)}%</span>
            </div>
        `;
            
        list.innerHTML += `
            <div class="acc-list-item" style="cursor: default;">
                <div class="acc-list-name">
                    <span class="dot" style="background-color: ${color};"></span>
                    <div>
                        <span>${catName}</span>
                        <small style="display: block; color: var(--text-muted); font-size: 11px; font-weight: 500;">${percentage.toFixed(1)}% del gasto mensual</small>
                    </div>
                </div>
                <span class="acc-list-balance">${formatMoney(amount)}</span>
            </div>
        `;
    });
};

const renderBudgetView = () => {
    const listContainer = document.getElementById('budget-categories-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    const viewMonthId = getMonthId(viewDate), currentMonthIndex = viewDate.getMonth();

    const totalLimitEl = document.getElementById('budget-total-limit'), totalSpentEl = document.getElementById('budget-total-spent');
    const catTitle = document.getElementById('new-cat-title'), catBtn = document.getElementById('new-cat-submit-btn'), catLimitLabel = document.querySelector('#new-cat-limit-group label');
    const summarySpans = document.querySelectorAll('#budget-summary-box span');

    if (currentBudgetType === 'expense') {
        if (catTitle) catTitle.innerText = 'Añadir Nueva Categoría';
        if (catBtn) catBtn.innerText = '+ Crear Categoría';
        if (catLimitLabel) catLimitLabel.innerText = 'Límite General Mensual ($) - Opcional';
        if (summarySpans[0]) summarySpans[0].innerText = 'Total Presupuestado';
        if (summarySpans[1]) summarySpans[1].innerText = 'Total Gastado';
        totalSpentEl?.classList.add('negative'); totalSpentEl?.classList.remove('positive');
    } else {
        if (catTitle) catTitle.innerText = 'Añadir Nueva Categoría de Ingreso';
        if (catBtn) catBtn.innerText = '+ Crear Categoría';
        if (catLimitLabel) catLimitLabel.innerText = 'Meta de Ingreso General ($) - Opcional';
        if (summarySpans[0]) summarySpans[0].innerText = 'Total Meta Ingresos';
        if (summarySpans[1]) summarySpans[1].innerText = 'Total Recibido';
        totalSpentEl?.classList.remove('negative'); totalSpentEl?.classList.add('positive');
    }

    let globalLimit = 0, globalSpent = 0;
    const categories = [...(financeData.categories[currentBudgetType] || [])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    
    const monthTransactions = financeData.transactions.filter(t => t.monthId === viewMonthId && t.type === currentBudgetType && !t.isAdjustment && isTxClosed(t));
    const totalsByCat = {}, totalsBySubcat = {};

    monthTransactions.forEach(t => {
        totalsByCat[t.category] = round2((totalsByCat[t.category] || 0) + round2(t.amount));
        if (t.subcategory) {
            totalsBySubcat[`${t.category}::${t.subcategory}`] = round2((totalsBySubcat[`${t.category}::${t.subcategory}`] || 0) + round2(t.amount));
        }
    });

    if (categories.length === 0) {
        listContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">No tienes categorías creadas. Crea una abajo.</p>`;
    }

    categories.forEach(catObj => {
        const cat = catObj.name, spent = totalsByCat[cat] || 0;
        let subcatsTotalLimit = 0;
        
        if (catObj.subcategories) {
            catObj.subcategories.forEach(sub => { 
                subcatsTotalLimit = round2(subcatsTotalLimit + round2(sub.limit || 0)); 
            });
        }
        
        const limit = getCategoryLimitForMonth(catObj, currentMonthIndex);
        const hasSubLimits = subcatsTotalLimit > 0;
        globalSpent = round2(globalSpent + spent); 
        globalLimit = round2(globalLimit + limit);

        let progressHtml = '';
        if (limit > 0) {
            const pct = Math.min(100, (spent / limit) * 100);
            const remaining = round2(limit - spent);
            const barColor = currentBudgetType === 'expense' 
                ? (pct > 90 ? 'var(--negative)' : (pct > 75 ? '#f59e0b' : 'var(--positive)')) 
                : (pct >= 100 ? 'var(--positive)' : 'var(--accent)');
            
            const mainText = currentBudgetType === 'expense' ? `Límite: ${formatMoney(limit)}` : `Meta: ${formatMoney(limit)}`;
            const subText = currentBudgetType === 'expense'
                ? `<span style="color: ${remaining >= 0 ? 'var(--text-muted)' : 'var(--negative)'}; font-weight:600;">${remaining >= 0 ? `Quedan ${formatMoney(remaining)}` : `Excedido ${formatMoney(Math.abs(remaining))}`}</span>`
                : `<span style="color: ${remaining <= 0 ? 'var(--positive)' : 'var(--text-muted)'}; font-weight:600;">${remaining <= 0 ? `¡Meta superada!` : `Faltan ${formatMoney(remaining)}`}</span>`;
                
            progressHtml = `
                <div class="tc-mini-bar">
                    <div class="tc-mini-bar-fill" style="width: ${pct}%; background-color: ${barColor};"></div>
                </div>
                <div class="budget-cat-sub">
                    <span>${mainText}</span>${subText}
                </div>
            `;
        } else {
            progressHtml = `<div class="budget-cat-sub"><span>Sin ${currentBudgetType === 'expense' ? 'límite definido' : 'meta definida'}</span></div>`;
        }

        let subcatsHtml = `<div class="subcat-list">`;
        if (catObj.subcategories) {
            const sortedSubs = [...catObj.subcategories].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
            sortedSubs.forEach(subObj => {
                const subName = subObj.name;
                const subLimit = round2(subObj.limit || 0);
                const subSpent = totalsBySubcat[`${cat}::${subName}`] || 0;
                
                let subProgressHtml = subLimit > 0
                    ? `<div class="tc-mini-bar" style="margin-top: 4px; height: 4px;">
                           <div class="tc-mini-bar-fill" style="width: ${Math.min(100, (subSpent / subLimit) * 100)}%; background-color: ${currentBudgetType === 'expense' && subSpent > subLimit ? 'var(--negative)' : 'var(--positive)'};"></div>
                       </div>
                       <div style="font-size: 10px; color: var(--text-muted); margin-top:2px;">${formatMoney(subSpent)} / ${formatMoney(subLimit)}</div>`
                    : `<div style="font-size: 10px; color: var(--text-muted); margin-top:2px;">${currentBudgetType === 'expense' ? 'Gasto' : 'Ingreso'}: ${formatMoney(subSpent)}</div>`;
                    
                subcatsHtml += `
                    <div class="subcat-item" style="display:flex; flex-direction:column; align-items:stretch; margin-bottom:6px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>↳ ${subName}</span>
                            <button type="button" onclick="deleteSubcategory('${cat}', '${subName}', '${currentBudgetType}')" style="background:none; border:none; color:var(--negative); font-size:10px; cursor:pointer;">X</button>
                        </div>
                        ${subProgressHtml}
                    </div>
                `;
            });
        }

        const metaPlaceholder = currentBudgetType === 'expense' ? 'Límite ($)' : 'Meta ($)';
        subcatsHtml += `
            <form onsubmit="event.preventDefault(); addSubcategory('${cat}', '${currentBudgetType}', this.querySelector('.subcat-name-input').value, this.querySelector('.subcat-limit-input').value); this.reset();" class="add-subcat-form">
                <input type="text" class="subcat-name-input" placeholder="+ Subcategoría..." required style="flex: 1.4;">
                <input type="text" inputmode="decimal" class="subcat-limit-input" placeholder="${metaPlaceholder}" style="flex: 1;">
                <button type="submit" class="btn btn-secondary" style="padding: 6px 9px; font-size: 11px;">Añadir</button>
            </form>
        </div>`;

        const configBtnHtml = !hasSubLimits ? `<button type="button" onclick="openMonthlyBudgetConfig('${cat}', '${currentBudgetType}')" title="Configurar por mes" style="background:rgba(148,163,184,0.18); border:none; color:var(--text-main); border-radius:6px; padding:3px 6px; margin-left:8px; font-size:11px; cursor:pointer;">⚙️ Meses</button>` : '';
        const amountColorClass = (currentBudgetType === 'expense') ? (limit > 0 && spent > limit ? 'negative' : '') : 'positive';
        
        listContainer.innerHTML += `
            <div class="budget-cat-item">
                <div class="budget-cat-top">
                    <span>${cat}</span>
                    <div style="display:flex; align-items:center;">
                        <span class="${amountColorClass}">${formatMoney(spent)}</span>
                        ${configBtnHtml}
                        <button type="button" onclick="deleteCategory('${cat}', '${currentBudgetType}')" style="background:none; border:none; color:var(--negative); margin-left:8px; font-weight:bold; font-size:12px; cursor:pointer;">X</button>
                    </div>
                </div>
                ${progressHtml}
                ${subcatsHtml}
            </div>
        `;
    });

    if (totalLimitEl) totalLimitEl.innerText = formatMoney(globalLimit);
    if (totalSpentEl) totalSpentEl.innerText = formatMoney(globalSpent);
};

window.openMonthlyBudgetConfig = (catName, type) => {
    const modalEl = document.getElementById('budget-monthly-config-modal');
    if (!modalEl) return;
    document.getElementById('budget-monthly-cat-id').value = catName;
    document.getElementById('budget-monthly-type').value = type;
    document.getElementById('budget-monthly-cat-name').innerText = catName;

    const currentBudget = financeData.categoryBudgets[catName];
    const switchEl = document.getElementById('budget-monthly-switch');
    const generalInput = document.getElementById('budget-general-input');

    if (typeof currentBudget === 'object' && currentBudget !== null && currentBudget.isMonthly) {
        switchEl.checked = true;
        document.getElementById('budget-general-view').classList.add('hidden');
        document.getElementById('budget-12months-view').classList.remove('hidden');
        for (let i = 0; i < 12; i++) {
            const val = currentBudget.months ? (currentBudget.months[i] || 0) : 0;
            document.getElementById(`b-m-${i}`).value = val > 0 ? formatNumberInput(val) : '';
        }
        generalInput.value = currentBudget.general > 0 ? formatNumberInput(currentBudget.general) : '';
    } else {
        switchEl.checked = false;
        document.getElementById('budget-general-view').classList.remove('hidden');
        document.getElementById('budget-12months-view').classList.add('hidden');
        const genVal = typeof currentBudget === 'number' ? currentBudget : (currentBudget ? currentBudget.general : 0);
        generalInput.value = genVal > 0 ? formatNumberInput(genVal) : '';
        for (let i = 0; i < 12; i++) {
            document.getElementById(`b-m-${i}`).value = genVal > 0 ? formatNumberInput(genVal) : '';
        }
    }
    hasUnsavedChanges = false; 
    modalEl.classList.remove('hidden');
};

document.getElementById('budget-monthly-switch')?.addEventListener('change', (e) => {
    if (e.target.checked) { 
        document.getElementById('budget-general-view').classList.add('hidden'); 
        document.getElementById('budget-12months-view').classList.remove('hidden'); 
    } else { 
        document.getElementById('budget-general-view').classList.remove('hidden'); 
        document.getElementById('budget-12months-view').classList.add('hidden'); 
    }
});

document.getElementById('budget-fill-all-btn')?.addEventListener('click', () => { 
    const fVal = document.getElementById('b-m-0').value; 
    for (let i = 1; i < 12; i++) document.getElementById(`b-m-${i}`).value = fVal; 
    hasUnsavedChanges = true; 
});
document.getElementById('budget-clear-all-btn')?.addEventListener('click', () => { 
    for (let i = 0; i < 12; i++) document.getElementById(`b-m-${i}`).value = ''; 
    hasUnsavedChanges = true; 
});

document.getElementById('budget-monthly-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const catName = document.getElementById('budget-monthly-cat-id').value;
    const isMonthly = document.getElementById('budget-monthly-switch').checked;
    
    if (isMonthly) {
        const months = [];
        for (let i = 0; i < 12; i++) months.push(parseMoneyInput(document.getElementById(`b-m-${i}`).value));
        financeData.categoryBudgets[catName] = { 
            isMonthly: true, 
            general: parseMoneyInput(document.getElementById('budget-general-input').value), 
            months 
        };
    } else {
        financeData.categoryBudgets[catName] = parseMoneyInput(document.getElementById('budget-general-input').value);
    }
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    document.getElementById('budget-monthly-config-modal').classList.add('hidden');
    renderBudgetView(); 
    updateDashboard();
});

document.querySelectorAll('#budget-type-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#budget-type-pills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); 
        currentBudgetType = btn.getAttribute('data-type'); 
        renderBudgetView();
    });
});

window.deleteCategory = (catName, type) => {
    if (confirm(`¿Eliminar la categoría "${catName}" y TODAS sus subcategorías?`)) {
        financeData.categories[type] = financeData.categories[type].filter(c => c.name !== catName);
        if (financeData.categoryBudgets[catName]) delete financeData.categoryBudgets[catName];
        localStorage.setItem('myFinances', JSON.stringify(financeData)); 
        renderCategoryOptions(document.getElementById('type').value); 
        renderBudgetView();
    }
};

window.addSubcategory = (catName, type, subName, limitVal) => {
    const cleanName = subName.trim(), limit = parseMoneyInput(limitVal);
    if (!cleanName) return;
    const cat = financeData.categories[type].find(c => c.name === catName);
    if (cat && !cat.subcategories.some(s => s.name === cleanName)) {
        cat.subcategories.push({ name: cleanName, limit });
        localStorage.setItem('myFinances', JSON.stringify(financeData)); 
        renderCategoryOptions(document.getElementById('type').value); 
        renderBudgetView();
    } else alert("La subcategoría ya existe.");
};

window.deleteSubcategory = (catName, subName, type) => {
    if (confirm(`¿Eliminar la subcategoría "${subName}"?`)) {
        const cat = financeData.categories[type].find(c => c.name === catName);
        if (cat) {
            cat.subcategories = cat.subcategories.filter(s => s.name !== subName);
            localStorage.setItem('myFinances', JSON.stringify(financeData)); 
            renderCategoryOptions(document.getElementById('type').value); 
            renderBudgetView();
        }
    }
};

document.getElementById('new-category-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-cat-name').value.trim();
    const limitInput = parseMoneyInput(document.getElementById('new-cat-limit').value);
    
    if (!nameInput) return;
    if (financeData.categories[currentBudgetType].some(c => c.name.toLowerCase() === nameInput.toLowerCase())) { 
        alert("Ya existe una categoría con ese nombre."); 
        return; 
    }
    
    financeData.categories[currentBudgetType].push({ name: nameInput, subcategories: [] });
    if (limitInput > 0) financeData.categoryBudgets[nameInput] = limitInput;
    
    localStorage.setItem('myFinances', JSON.stringify(financeData)); 
    document.getElementById('new-category-form').reset(); 
    hasUnsavedChanges = false;
    renderCategoryOptions(document.getElementById('type').value); 
    renderBudgetView();
});

// --- FORMULARIOS CUENTAS, TARJETAS, DEUDAS Y ACTIVOS ---
document.getElementById('new-account-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-account-name').value.trim();
    const initial = parseMoneyInput(document.getElementById('new-account-initial').value);
    const makeDefault = !!document.getElementById('new-account-default')?.checked;
    
    if (!name || financeData.customAccounts.some(a => a.id.toLowerCase() === name.toLowerCase())) { 
        alert("Nombre de cuenta inválido o duplicado."); 
        return; 
    }
    
    financeData.customAccounts.push({ id: name, name, category: 'asset', isDefault: false, showWhenZero: false });
    if (makeDefault) setDefaultAccount(name, false);
    
    if (initial > 0) {
        const now = new Date();
        financeData.transactions.push({ 
            id: now.getTime(), 
            monthId: getMonthId(now), 
            type: 'income', 
            status: 'closed', 
            account: name, 
            description: 'Saldo Inicial', 
            amount: initial, 
            date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, 
            isAdjustment: true 
        });
    }
    
    localStorage.setItem('myFinances', JSON.stringify(financeData)); 
    document.getElementById('new-account-form').reset(); 
    hasUnsavedChanges = false; 
    renderAccountSelects(); 
    updateDashboard();
});

document.getElementById('new-card-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-card-name').value.trim();
    const limit = parseMoneyInput(document.getElementById('new-card-limit').value);
    const debt = parseMoneyInput(document.getElementById('new-card-debt').value);
    const makeDefault = !!document.getElementById('new-card-default')?.checked;
    
    if (!name || financeData.customAccounts.some(a => a.id.toLowerCase() === name.toLowerCase())) { 
        alert("Nombre de tarjeta inválido o duplicado."); 
        return; 
    }
    
    financeData.customAccounts.push({
        id: name, name, category: 'credit_card', isDefault: false, showWhenZero: false, creditLimit: limit,
        cutoffDay: parseInt(document.getElementById('new-card-cutoff').value) || 15,
        paymentDay: parseInt(document.getElementById('new-card-payment').value) || 30,
        rate: parseMoneyInput(document.getElementById('new-card-rate').value),
        rateType: document.getElementById('new-card-rate-type').value,
        zeroInterestMax: parseInt(document.getElementById('new-card-zero-interest-max').value) || 0
    });
    
    if (makeDefault) setDefaultAccount(name, false);
    
    if (debt > 0) {
        const now = new Date();
        financeData.transactions.push({ 
            id: now.getTime(), 
            monthId: getMonthId(now), 
            type: 'expense', 
            status: 'closed', 
            account: name, 
            description: 'Saldo Inicial Tarjeta', 
            amount: debt, 
            date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, 
            isAdjustment: true 
        });
    }
    
    localStorage.setItem('myFinances', JSON.stringify(financeData)); 
    document.getElementById('new-card-form').reset(); 
    hasUnsavedChanges = false; 
    renderAccountSelects(); 
    updateDashboard();
});

// V2.3: Selector de tipo de deuda
document.getElementById('new-debt-type')?.addEventListener('change', (e) => {
    const fixedOptions = document.getElementById('new-debt-fixed-options');
    const monthlyGroup = document.getElementById('new-debt-monthly-group');
    if (e.target.value === 'revolving') {
        fixedOptions?.classList.add('hidden');
        monthlyGroup?.classList.add('hidden');
    } else {
        fixedOptions?.classList.remove('hidden');
        monthlyGroup?.classList.remove('hidden');
    }
});

document.getElementById('new-debt-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-debt-name').value.trim();
    const debtType = document.getElementById('new-debt-type')?.value || 'fixed';
    const payrollDeduction = document.getElementById('new-debt-payroll')?.checked || false;
    
    const original = parseMoneyInput(document.getElementById('new-debt-original').value);
    const currentStr = document.getElementById('new-debt-current').value;
    const current = currentStr ? parseMoneyInput(currentStr) : original;
    
    const totalQuotes = debtType === 'fixed' ? (parseInt(document.getElementById('new-debt-total-quotes').value) || 1) : 1;
    const paidQuotes = debtType === 'fixed' ? (parseInt(document.getElementById('new-debt-paid-quotes').value) || 0) : 0;
    
    const rate = parseMoneyInput(document.getElementById('new-debt-rate').value);
    const rateType = document.getElementById('new-debt-rate-type').value;
    
    let monthlyPay = debtType === 'fixed' ? parseMoneyInput(document.getElementById('new-debt-monthly-payment').value) : 0;
    if (debtType === 'fixed' && monthlyPay === 0) {
        monthlyPay = calculateAmortization(original, totalQuotes, rate, rateType).payment;
    }

    const id = 'Deuda_' + Date.now();
    financeData.customAccounts.push({ 
        id, 
        name, 
        category: 'debt', 
        debtType, 
        isDefault: false, 
        showWhenZero: false, 
        debtOriginal: original, 
        debtTotalQuotes: totalQuotes, 
        debtPaidQuotes: paidQuotes, 
        debtRate: rate, 
        debtRateType: rateType, 
        debtMonthlyPayment: monthlyPay,
        payrollDeduction
    });
    
    if (current > 0) {
        const now = new Date();
        financeData.transactions.push({ 
            id: now.getTime(), 
            monthId: getMonthId(now), 
            type: 'expense', 
            status: 'closed', 
            account: id, 
            description: debtType === 'revolving' ? 'Cupo Utilizado Inicial' : 'Saldo Inicial Préstamo', 
            amount: current, 
            date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, 
            isAdjustment: true 
        });
    }
    
    localStorage.setItem('myFinances', JSON.stringify(financeData)); 
    document.getElementById('new-debt-form').reset(); 
    hasUnsavedChanges = false; 
    updateDashboard(); 
    renderAccountSelects();
});
// --- DETALLE DE CUENTA / TARJETA / DEUDA ---
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
        if (acc.category === 'debt') {
            defBtn.classList.add('hidden');
        } else {
            defBtn.classList.remove('hidden');
            defBtn.innerText = acc.isDefault ? '⭐ Predeterminada' : '☆ Hacer predet.';
            defBtn.style.background = acc.isDefault ? 'rgba(245, 158, 11, 0.2)' : '';
            defBtn.style.color = acc.isDefault ? '#d97706' : '';
        }
    }

    if (document.getElementById('account-show-when-zero')) {
        document.getElementById('account-show-when-zero').checked = !!acc.showWhenZero;
    }

    const currentBal = round2(currentBalances[acc.id] || 0);
    if (document.getElementById('detail-account-balance')) {
        document.getElementById('detail-account-balance').innerText = formatMoney(currentBal);
    }

    const cardExtraBox = document.getElementById('card-extra-info'), editCardBtn = document.getElementById('edit-card-settings-btn');
    const debtExtraBox = document.getElementById('debt-extra-info'), editDebtBtn = document.getElementById('edit-debt-settings-btn');
    
    ['edit-card-form', 'edit-debt-form', 'pay-installment-box', 'amortization-panel'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });
    
    if (document.getElementById('sim-extra-payment')) document.getElementById('sim-extra-payment').value = '';
    if (document.getElementById('sim-savings-result')) document.getElementById('sim-savings-result').innerText = '';

    if (acc.category === 'credit_card') {
        cardExtraBox?.classList.remove('hidden'); editCardBtn?.classList.remove('hidden');
        debtExtraBox?.classList.add('hidden'); editDebtBtn?.classList.add('hidden');

        const limit = round2(acc.creditLimit || 0), available = round2(limit - currentBal), availEl = document.getElementById('detail-card-available');
        if (document.getElementById('detail-card-limit')) document.getElementById('detail-card-limit').innerText = formatMoney(limit);
        if (availEl) { 
            availEl.innerText = formatMoney(available); 
            availEl.className = available >= 0 ? 'positive' : 'negative'; 
        }
        if (document.getElementById('detail-card-dates')) document.getElementById('detail-card-dates').innerText = `📅 Corte: ${acc.cutoffDay || '-'} • Pago: ${acc.paymentDay || '-'}`;
        
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
                ? '<small style="color: var(--text-muted); font-size: 11px;">No hay compras con cuotas pendientes.</small>'
                : pendingPurchases.map(item => `
                    <div class="deferred-item-card" onclick="forceCloseAllModals(); openEditModal(${item.tx.id});" style="cursor:pointer;">
                        <div class="deferred-item-top">
                            <span>${item.tx.description}</span>
                            <span class="negative">${formatMoney(item.remCapital)}</span>
                        </div>
                        <div class="deferred-item-sub">
                            <span>Cuotas: <b>${item.paidInstallments}/${item.installments}</b></span>
                            <span>Próx. cuota: <b>${formatMoney(item.nextQuota)}</b></span>
                        </div>
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
                    ? '<small style="color: var(--text-muted); font-size: 11px;">No hay compras pendientes.</small>'
                    : pendingPurchases.map(item => `
                        <div class="deferred-item-card" onclick="forceCloseAllModals(); openEditModal(${item.tx.id});" style="cursor:pointer;">
                            <div class="deferred-item-top">
                                <span>${item.tx.description}</span>
                                <span class="negative">${formatMoney(item.remCapital)}</span>
                            </div>
                            <div class="deferred-item-sub">
                                <span>Cuotas: <b>${item.paidInstallments}/${item.installments}</b></span>
                                <span>Cuota Mes: <b>${formatMoney(item.nextQuota)}</b></span>
                            </div>
                        </div>`).join('');
            }
            
            const totalNextQuota = getPendingRevolvingPurchases(acc.id).reduce((s, p) => s + p.nextQuota, 0);
            const progressPct = originalDebt > 0 ? Math.min(100, (Math.max(0, originalDebt - currentBal) / originalDebt) * 100) : 0;
            
            if (document.getElementById('detail-debt-original')) document.getElementById('detail-debt-original').innerText = formatMoney(originalDebt);
            if (document.getElementById('detail-debt-progress-pct')) document.getElementById('detail-debt-progress-pct').innerText = `${progressPct.toFixed(1)}%`;
            if (document.getElementById('detail-debt-progress-fill')) document.getElementById('detail-debt-progress-fill').style.width = `${progressPct}%`;
            if (document.getElementById('detail-debt-payment')) document.getElementById('detail-debt-payment').innerText = formatMoney(totalNextQuota);
            if (document.getElementById('detail-debt-installments')) document.getElementById('detail-debt-installments').innerText = 'N/A';
            if (document.getElementById('detail-debt-rate')) document.getElementById('detail-debt-rate').innerText = `${String(rate).replace('.', ',')}% ${rateType === 'monthly' ? 'M.V.' : 'E.A.'}`;
            
            if (document.getElementById('btn-revolving-new-purchase')) {
                document.getElementById('btn-revolving-new-purchase').onclick = () => {
                    forceCloseAllModals();
                    document.getElementById('add-btn')?.click();
                    setTimeout(() => {
                        const opt = document.querySelector('.fab-option[data-type="expense"]');
                        if (opt) opt.click();
                        setTimeout(() => {
                            if (document.getElementById('account')) {
                                document.getElementById('account').value = acc.id;
                                document.getElementById('account').dispatchEvent(new Event('change'));
                            }
                        }, 50);
                    }, 50);
                };
            }
            
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

            let nextInterest = round2(currentBal * amortData.monthlyRate);
            let nextPrincipal = Math.min(currentBal, Math.max(0, round2(customMonthlyPayment - nextInterest)));
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

            const tbody = document.getElementById('amortization-table-body');
            if (tbody) {
                const remSched = activeAmortizationSchedule.slice(paidQuotes);
                tbody.innerHTML = remSched.length === 0 ? '<tr><td colspan="5" style="text-align:center;">Préstamo liquidado 🎉</td></tr>' : remSched.map(row => `<tr><td>${row.period}</td><td>${formatMoney(row.payment)}</td><td class="positive">${formatMoney(row.principal)}</td><td class="negative">${formatMoney(row.interest)}</td><td>${formatMoney(row.balance)}</td></tr>`).join('');
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
        historyList.innerHTML = accTransactions.length === 0 ? '<li class="history-item"><small style="color: var(--text-muted);">Sin movimientos registrados</small></li>' : '';
        accTransactions.forEach(t => {
            const li = document.createElement('li'); 
            li.className = 'history-item';
            li.onclick = () => { forceCloseAllModals(); openEditModal(t.id); };
            
            let sign = '', colorClass = '';
            if (isLiabilityCategory(acc.category)) {
                if (t.type === 'expense') { sign = '+'; colorClass = 'negative'; } 
                else { sign = '-'; colorClass = 'positive'; }
            } else {
                if (t.type === 'income' || (t.type === 'transfer' && t.toAccount === accountId)) { sign = '+'; colorClass = 'positive'; } 
                else { sign = '-'; colorClass = 'negative'; }
            }
            
            li.innerHTML = `
                <div class="history-info">
                    <strong>${t.description}</strong>
                    <small>${t.date}</small>
                </div>
                <div class="history-amount ${colorClass}">${sign} ${formatMoney(t.amount)}</div>
            `;
            historyList.appendChild(li);
        });
    }
};

document.getElementById('toggle-default-account-btn')?.addEventListener('click', () => {
    const accountId = document.getElementById('reconcile-account-id')?.value;
    if (!accountId) return;
    setDefaultAccount(accountId, true);
    renderAccountSelects();
    updateDashboard();
    openAccountDetail(accountId, lastAccountViewOrigin);
});

document.getElementById('account-show-when-zero')?.addEventListener('change', (e) => {
    const accountId = document.getElementById('reconcile-account-id')?.value;
    const acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    acc.showWhenZero = !!e.target.checked;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    updateDashboard();
});

document.getElementById('edit-card-settings-btn')?.addEventListener('click', () => document.getElementById('edit-card-form')?.classList.toggle('hidden'));
document.getElementById('edit-card-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    acc.creditLimit = parseMoneyInput(document.getElementById('edit-card-limit').value);
    acc.cutoffDay = parseInt(document.getElementById('edit-card-cutoff').value) || 15;
    acc.paymentDay = parseInt(document.getElementById('edit-card-payment').value) || 30;
    acc.rate = parseMoneyInput(document.getElementById('edit-card-rate').value);
    acc.rateType = document.getElementById('edit-card-rate-type').value;
    acc.zeroInterestMax = parseInt(document.getElementById('edit-card-zero-interest-max').value) || 0;
    localStorage.setItem('myFinances', JSON.stringify(financeData)); 
    hasUnsavedChanges = false; updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin);
});

document.getElementById('edit-debt-settings-btn')?.addEventListener('click', () => { 
    document.getElementById('edit-debt-form')?.classList.toggle('hidden'); 
    document.getElementById('pay-installment-box')?.classList.add('hidden'); 
    document.getElementById('amortization-panel')?.classList.add('hidden'); 
});
document.getElementById('open-pay-installment-btn')?.addEventListener('click', () => { 
    document.getElementById('pay-installment-box')?.classList.toggle('hidden'); 
    document.getElementById('edit-debt-form')?.classList.add('hidden'); 
    document.getElementById('amortization-panel')?.classList.add('hidden'); 
});
document.getElementById('toggle-amortization-btn')?.addEventListener('click', () => { 
    document.getElementById('amortization-panel')?.classList.toggle('hidden'); 
    document.getElementById('edit-debt-form')?.classList.add('hidden'); 
    document.getElementById('pay-installment-box')?.classList.add('hidden'); 
});

document.getElementById('sim-extra-payment')?.addEventListener('input', (e) => {
    const extraAmt = parseMoneyInput(e.target.value);
    const resultEl = document.getElementById('sim-savings-result');
    const accountId = document.getElementById('reconcile-account-id').value;
    const acc = financeData.customAccounts.find(a => a.id === accountId);
    
    if (!acc || extraAmt <= 0) { 
        if (resultEl) resultEl.innerText = ''; 
        return; 
    }
    
    const currentBal = round2(currentBalances[accountId] || 0);
    const monthlyPayment = acc.debtMonthlyPayment || 0;
    
    if (monthlyPayment > 0 && currentBal > extraAmt) {
        const monthlyRate = acc.debtRateType === 'monthly' ? acc.debtRate / 100 : (Math.pow(1 + acc.debtRate / 100, 1 / 12) - 1);
        const currentInterest = round2(currentBal * monthlyRate);
        const avgPrincipal = monthlyPayment - currentInterest;
        
        if (avgPrincipal > 0) { 
            const monthsSaved = extraAmt / avgPrincipal;
            const interestSaved = round2(extraAmt * monthlyRate * monthsSaved); 
            resultEl.innerText = `✨ Ahorrarías aprox. ${monthsSaved.toFixed(1)} meses y ~${formatMoney(interestSaved)} en intereses.`; 
            return; 
        }
    }
    if (resultEl) resultEl.innerText = 'Ingresa una cuota mensual válida para simular el ahorro.';
});

document.getElementById('pay-installment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value;
    const acc = financeData.customAccounts.find(a => a.id === accountId);
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
        financeData.transactions.push({ 
            id: transactionDateObj.getTime() + Math.floor(Math.random() * 500), 
            monthId: mId, 
            type: 'transfer', 
            status: 'closed', 
            account: sourceAcc, 
            toAccount: accountId, 
            description: `💸 Pago Capital (Cuota ${(acc.debtPaidQuotes || 0) + 1})`, 
            amount: principalAmt, 
            date: `${displayDate}, ${displayTime}`, 
            isAdjustment: false, 
            paymentMode: 'installments', 
            allocatedItems: [{ kind: 'debt_quota', debtId: accountId, amountApplied: principalAmt }] 
        });
    }
    if (interestAmt > 0) {
        financeData.transactions.push({ 
            id: transactionDateObj.getTime() + 500 + Math.floor(Math.random() * 500), 
            monthId: mId, 
            type: 'expense', 
            status: 'closed', 
            account: sourceAcc, 
            category: '💳 Cuotas / Intereses', 
            subcategory: 'General', 
            description: `📉 Intereses Préstamo (${acc.name})`, 
            amount: interestAmt, 
            date: `${displayDate}, ${displayTime}`, 
            isAdjustment: false 
        });
    }
    
    acc.debtPaidQuotes = (acc.debtPaidQuotes || 0) + 1;
    localStorage.setItem('myFinances', JSON.stringify(financeData)); 
    hasUnsavedChanges = false; updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin);
});

document.getElementById('reconcile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value;
    const acc = getAccountObj(accountId);
    const realAmount = parseMoneyInput(document.getElementById('reconcile-real-amount').value);
    const currentBal = round2(currentBalances[accountId] || 0);
    const diff = round2(realAmount - currentBal);
    
    if (diff === 0) { 
        alert("El monto registrado ya coincide con el real."); 
        return; 
    }
    
    const now = new Date();
    const displayDate = now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    const displayTime = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    
    let adjustType = diff > 0 ? 'income' : 'expense';
    if (isLiabilityCategory(acc.category)) {
        adjustType = diff > 0 ? 'expense' : 'income';
    }
    
    financeData.transactions.push({ 
        id: now.getTime() + Math.floor(Math.random() * 1000), 
        monthId: getMonthId(now), 
        type: adjustType, 
        status: 'closed', 
        account: accountId, 
        description: '⚖️ Ajuste / Reconciliación', 
        amount: round2(Math.abs(diff)), 
        date: `${displayDate}, ${displayTime}`, 
        isAdjustment: true 
    });
    
    localStorage.setItem('myFinances', JSON.stringify(financeData)); 
    hasUnsavedChanges = false; updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin);
});

window.deleteAccount = (accountId) => {
    if (accountId === 'Efectivo') return;
    if (confirm(`¿Seguro que deseas eliminar "${accountId}"? Sus movimientos pasarán a "Efectivo".`)) {
        financeData.transactions.forEach(t => { 
            if (t.account === accountId) t.account = 'Efectivo'; 
            if (t.toAccount === accountId) t.toAccount = 'Efectivo'; 
        });
        financeData.customAccounts = financeData.customAccounts.filter(a => a.id !== accountId);
        localStorage.setItem('myFinances', JSON.stringify(financeData)); 
        renderAccountSelects(); updateDashboard();
    }
};

document.getElementById('back-to-accounts-btn')?.addEventListener('click', () => {
    document.getElementById('account-detail-view')?.classList.add('hidden');
    if (lastAccountViewOrigin === 'home') forceCloseAllModals();
    else if (lastAccountViewOrigin === 'credit_card') { 
        document.getElementById('accounts-modal')?.classList.add('hidden'); 
        document.getElementById('cards-modal')?.classList.remove('hidden'); 
    }
    else if (lastAccountViewOrigin === 'debt') { 
        document.getElementById('accounts-modal')?.classList.add('hidden'); 
        document.getElementById('debts-modal')?.classList.remove('hidden'); 
    }
    else document.getElementById('accounts-list-view')?.classList.remove('hidden');
});

// --- BOLSILLOS (SINKING FUNDS) ---
const renderPocketsView = () => {
    const list = document.getElementById('pockets-list');
    if (!list) return;
    list.innerHTML = '';

    let totalSaved = 0, totalYields = 0, totalMonthlySuggested = 0;

    if (!financeData.pockets || financeData.pockets.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:18px 0;">No tienes bolsillos creados. Crea provisiones para SOAT, impuestos o fondos de ahorro.</p>';
    } else {
        financeData.pockets.forEach(p => {
            const principal = round2(p.principal || 0), yields = round2(p.yields || 0);
            const balance = round2(principal + yields), goal = round2(p.goal || 0);
            
            totalSaved = round2(totalSaved + balance); totalYields = round2(totalYields + yields);

            let monthlyQuota = 0, dateLabel = 'Sin fecha límite';
            if (p.targetDate) {
                const [ty, tm] = p.targetDate.split('-').map(Number);
                const monthsLeft = Math.max(1, (ty - currentDate.getFullYear()) * 12 + ((tm - 1) - currentDate.getMonth()) + 1);
                dateLabel = `Meta: ${p.targetDate} (${monthsLeft}m)`;
                if (goal > balance) { 
                    monthlyQuota = round2((goal - balance) / monthsLeft); 
                    totalMonthlySuggested = round2(totalMonthlySuggested + monthlyQuota); 
                }
            }

            let barHtml = '';
            if (goal > 0) {
                const pct = Math.min(100, (balance / goal) * 100);
                barHtml = `
                    <div class="tc-mini-bar"><div class="tc-mini-bar-fill" style="width:${pct}%; background-color:var(--positive);"></div></div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted);">
                        <span>Meta: ${formatMoney(goal)} (${pct.toFixed(0)}%)</span>
                        <span>${monthlyQuota > 0 ? `Ahorrar: <b>${formatMoney(monthlyQuota)}/m</b>` : '✅ Meta alcanzada'}</span>
                    </div>
                `;
            }

            const yieldBadge = yields > 0 ? ` • <span style="color:var(--accent); font-weight:600;">Rend: +${formatMoney(yields)}</span>` : '';
            const entityBadge = p.entity ? ` (${p.entity})` : '';

            list.innerHTML += `
                <div class="pocket-card">
                    <div class="pocket-card-top">
                        <div>
                            <strong style="font-size:14px;">🐷 ${p.name}${entityBadge}</strong>
                            <small style="display:block; font-size:11px; color:var(--text-muted);">${dateLabel}${yieldBadge}</small>
                        </div>
                        <div style="text-align:right;">
                            <strong class="positive" style="font-size:15px;">${formatMoney(balance)}</strong>
                            <button type="button" onclick="deletePocket(${p.id})" style="background:none; border:none; color:var(--negative); font-size:11px; font-weight:bold; margin-left:8px; cursor:pointer;">X</button>
                        </div>
                    </div>
                    ${barHtml}
                    <div class="pocket-actions-row">
                        <button type="button" class="pocket-mini-btn" onclick="pocketDeposit(${p.id})">+ Abonar</button>
                        <button type="button" class="pocket-mini-btn" onclick="pocketAddYield(${p.id})" style="color:var(--accent);">📈 Rendim.</button>
                        <button type="button" class="pocket-mini-btn" onclick="pocketWithdraw(${p.id})" style="color:var(--negative);">- Retirar</button>
                    </div>
                </div>
            `;
        });
    }

    if (document.getElementById('pockets-total-saved')) document.getElementById('pockets-total-saved').innerText = formatMoney(totalSaved);
    if (document.getElementById('pockets-total-yields')) document.getElementById('pockets-total-yields').innerText = `+${formatMoney(totalYields)}`;
    if (document.getElementById('pockets-monthly-suggested')) document.getElementById('pockets-monthly-suggested').innerText = `${formatCompact(totalMonthlySuggested)}/m`;
};

document.getElementById('new-pocket-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-pocket-name').value.trim();
    const entity = document.getElementById('new-pocket-entity').value.trim();
    const goal = parseMoneyInput(document.getElementById('new-pocket-goal').value);
    const targetDate = document.getElementById('new-pocket-date').value;
    const initial = parseMoneyInput(document.getElementById('new-pocket-initial').value);

    if (!name) return;
    
    financeData.pockets.push({ id: Date.now(), name, entity, goal, targetDate, principal: initial, yields: 0 });
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('new-pocket-form').reset();
    hasUnsavedChanges = false; renderPocketsView(); updateDashboard();
});

window.pocketDeposit = (id) => {
    const p = financeData.pockets.find(x => x.id === id);
    if (!p) return;
    const currentTotal = round2((p.principal || 0) + (p.yields || 0));
    
    openQuickActionModal({
        title: `Abonar a ${p.name}`,
        subtitle: 'Incrementa el capital de tu bolsillo',
        infoLabel: 'Saldo Actual:',
        infoValue: formatMoney(currentTotal),
        amountLabel: 'Monto a Abonar ($)',
        submitLabel: '+ Confirmar Abono',
        onConfirm: (val) => {
            if (val <= 0) { alert('Ingresa un monto mayor a $0.'); return false; }
            p.principal = round2((p.principal || 0) + val);
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            renderPocketsView(); updateDashboard(); return true;
        }
    });
};

window.pocketAddYield = (id) => {
    const p = financeData.pockets.find(x => x.id === id);
    if (!p) return;
    openQuickActionModal({
        title: `Rendimientos • ${p.name}`,
        subtitle: 'Registra intereses o dividendos ganados',
        infoLabel: 'Rendimientos Acumulados:',
        infoValue: formatMoney(p.yields || 0),
        amountLabel: 'Rendimientos Ganados ($)',
        submitLabel: '📈 Registrar Rendimientos',
        onConfirm: (val) => {
            if (val <= 0) { alert('Ingresa un monto mayor a $0.'); return false; }
            p.yields = round2((p.yields || 0) + val);
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            renderPocketsView(); updateDashboard(); return true;
        }
    });
};

window.pocketWithdraw = (id) => {
    const p = financeData.pockets.find(x => x.id === id);
    if (!p) return;
    const total = round2((p.principal || 0) + (p.yields || 0));
    if (total <= 0) { alert('Este bolsillo tiene saldo $0.'); return; }
    
    openQuickActionModal({
        title: `Retirar de ${p.name}`,
        subtitle: 'Descuenta del saldo disponible del bolsillo',
        infoLabel: 'Saldo Disponible:',
        infoValue: formatMoney(total),
        amountLabel: 'Monto a Retirar ($)',
        submitLabel: 'Confirmar Retiro',
        onConfirm: (val) => {
            if (val <= 0 || val > total) { alert('Monto inválido o superior al saldo disponible.'); return false; }
            if (val <= (p.yields || 0)) p.yields = round2(p.yields - val);
            else { const rem = round2(val - (p.yields || 0)); p.yields = 0; p.principal = Math.max(0, round2((p.principal || 0) - rem)); }
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            renderPocketsView(); updateDashboard(); return true;
        }
    });
};

window.deletePocket = (id) => {
    if (confirm('¿Eliminar este bolsillo de ahorro?')) {
        financeData.pockets = financeData.pockets.filter(x => x.id !== id);
        localStorage.setItem('myFinances', JSON.stringify(financeData)); 
        renderPocketsView(); updateDashboard();
    }
};

// --- ACTIVOS FIJOS ---
const renderAssetsBreakdown = () => {
    let totalVal = 0, totalDiff = 0;
    const list = document.getElementById('assets-list');
    if (!list) return;
    list.innerHTML = '';
    
    const filtered = financeData.fixedAssets.filter(a => a.status === currentAssetType);
    financeData.fixedAssets.filter(a => a.status === 'active').forEach(a => { 
        totalVal = round2(totalVal + a.currentValue); 
        totalDiff = round2(totalDiff + (a.currentValue - (a.purchaseValue || 0))); 
    });
    
    if (document.getElementById('assets-total-value')) document.getElementById('assets-total-value').innerText = formatMoney(totalVal);
    if (document.getElementById('assets-total-diff')) { 
        document.getElementById('assets-total-diff').innerText = formatMoney(totalDiff); 
        document.getElementById('assets-total-diff').className = totalDiff >= 0 ? 'positive' : 'negative'; 
    }

    if (filtered.length === 0) { 
        list.innerHTML = `<p style="color:var(--text-muted); font-size:12px; padding:10px 0;">No tienes activos ${currentAssetType === 'active' ? 'vigentes' : 'vendidos'}.</p>`; 
        return; 
    }
    
    filtered.forEach(a => {
        const diff = a.currentValue - (a.purchaseValue || 0);
        const catLabel = a.category || 'Otro';
        
        list.innerHTML += `
            <div class="acc-list-item" onclick="openAssetDetail(${a.id})">
                <div class="acc-list-name">
                    <span class="dot" style="background-color: var(--accent); display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; font-size: 12px; border-radius: 6px; color: white;">
                        ${getAssetEmoji(catLabel)}
                    </span>
                    <div>
                        <span>${a.name}</span>
                        <small style="display:block; font-size:11px; color:var(--text-muted);">${catLabel}</small>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                    <span class="acc-list-balance">${formatMoney(a.currentValue)}</span>
                    <small class="${diff >= 0 ? 'positive' : 'negative'}" style="font-size:10px;">${diff >= 0 ? '+' : ''}${formatMoney(diff)}</small>
                </div>
            </div>
        `;
    });
};

document.querySelectorAll('#assets-type-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#assets-type-pills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); 
        currentAssetType = btn.getAttribute('data-type'); 
        renderAssetsBreakdown();
    });
});

document.getElementById('new-asset-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-asset-name').value.trim();
    const category = document.getElementById('new-asset-category').value || 'Otro';
    const current = parseMoneyInput(document.getElementById('new-asset-current').value);
    const purchase = parseMoneyInput(document.getElementById('new-asset-purchase').value);
    
    if (name) {
        financeData.fixedAssets.push({ id: Date.now(), name, category, currentValue: current, purchaseValue: purchase, status: 'active', linkedExpenses: 0 });
        localStorage.setItem('myFinances', JSON.stringify(financeData)); 
        document.getElementById('new-asset-form').reset(); 
        hasUnsavedChanges = false; updateDashboard(); renderAssetsBreakdown();
    }
});

window.openAssetDetail = (id) => {
    const a = financeData.fixedAssets.find(x => x.id === id);
    if (!a) return;
    
    document.getElementById('assets-modal')?.classList.add('hidden');
    document.getElementById('asset-detail-modal')?.classList.remove('hidden');
    
    if (document.getElementById('detail-asset-name')) document.getElementById('detail-asset-name').innerText = a.name;
    const badge = document.getElementById('detail-asset-status');
    if (badge) { badge.innerText = a.status === 'active' ? 'Vigente' : 'Vendido'; badge.className = `period-badge ${a.status === 'sold' ? 'past' : ''}`; }
    
    if (document.getElementById('detail-asset-category')) document.getElementById('detail-asset-category').innerText = `${getAssetEmoji(a.category)} ${a.category || 'Otro'}`;
    if (document.getElementById('edit-asset-category')) document.getElementById('edit-asset-category').value = a.category || 'Otro';
    if (document.getElementById('detail-asset-current')) document.getElementById('detail-asset-current').innerText = formatMoney(a.currentValue);
    if (document.getElementById('detail-asset-purchase')) document.getElementById('detail-asset-purchase').innerText = formatMoney(a.purchaseValue || 0);
    
    const diff = a.currentValue - (a.purchaseValue || 0);
    if (document.getElementById('detail-asset-diff')) { document.getElementById('detail-asset-diff').innerText = formatMoney(diff); document.getElementById('detail-asset-diff').className = diff >= 0 ? 'positive' : 'negative'; }
    if (document.getElementById('detail-asset-expenses')) document.getElementById('detail-asset-expenses').innerText = formatMoney(a.linkedExpenses || 0);
    
    if (document.getElementById('edit-asset-id')) document.getElementById('edit-asset-id').value = a.id;
    if (document.getElementById('edit-asset-val-current')) document.getElementById('edit-asset-val-current').value = formatNumberInput(a.currentValue);

    const actionsBox = document.getElementById('asset-action-buttons');
    if (a.status === 'sold') {
        actionsBox?.classList.add('hidden');
        document.getElementById('edit-asset-settings-btn')?.classList.add('hidden');
    } else {
        actionsBox?.classList.remove('hidden');
        document.getElementById('edit-asset-settings-btn')?.classList.remove('hidden');
    }
    document.getElementById('edit-asset-form')?.classList.add('hidden');
};

document.getElementById('back-to-assets-btn')?.addEventListener('click', () => { 
    document.getElementById('asset-detail-modal')?.classList.add('hidden'); 
    document.getElementById('assets-modal')?.classList.remove('hidden'); 
});
document.getElementById('edit-asset-settings-btn')?.addEventListener('click', () => document.getElementById('edit-asset-form')?.classList.toggle('hidden'));

document.getElementById('edit-asset-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-asset-id').value);
    const a = financeData.fixedAssets.find(x => x.id === id);
    if (a) { 
        a.category = document.getElementById('edit-asset-category').value || 'Otro'; 
        a.currentValue = parseMoneyInput(document.getElementById('edit-asset-val-current').value); 
        localStorage.setItem('myFinances', JSON.stringify(financeData)); 
        hasUnsavedChanges = false; updateDashboard(); renderAssetsBreakdown(); openAssetDetail(id); 
    }
});

document.getElementById('btn-asset-delete')?.addEventListener('click', () => {
    const id = parseInt(document.getElementById('edit-asset-id').value);
    if (confirm('¿Eliminar este activo por completo?')) { 
        financeData.fixedAssets = financeData.fixedAssets.filter(x => x.id !== id); 
        localStorage.setItem('myFinances', JSON.stringify(financeData)); 
        updateDashboard(); renderAssetsBreakdown(); 
        document.getElementById('asset-detail-modal')?.classList.add('hidden'); 
        document.getElementById('assets-modal')?.classList.remove('hidden'); 
    }
});

document.getElementById('btn-asset-sell')?.addEventListener('click', () => {
    const id = parseInt(document.getElementById('edit-asset-id').value);
    const a = financeData.fixedAssets.find(x => x.id === id);
    if (!a) return;

    openQuickActionModal({
        title: `Vender ${a.name}`,
        subtitle: 'Registra el ingreso de la venta en una cuenta',
        infoLabel: 'Valor Registrado:',
        infoValue: formatMoney(a.currentValue),
        showAccountSelect: true,
        accountLabel: 'Cuenta Destino del Dinero',
        amountLabel: 'Precio de Venta ($)',
        defaultAmount: a.currentValue,
        submitLabel: '💰 Confirmar Venta',
        onConfirm: (val, dest) => {
            if (val <= 0) { alert('Ingresa un valor de venta mayor a $0.'); return false; }
            a.status = 'sold'; a.soldValue = val; a.currentValue = val;
            const now = new Date();
            financeData.transactions.push({ 
                id: now.getTime(), monthId: getMonthId(now), type: 'income', status: 'closed', account: dest, 
                description: `💰 Venta de Activo: ${a.name}`, amount: val, date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: false 
            });
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            updateDashboard(); renderAssetsBreakdown(); openAssetDetail(id); return true;
        }
    });
});

document.getElementById('btn-asset-expense')?.addEventListener('click', () => {
    const id = parseInt(document.getElementById('edit-asset-id').value);
    const a = financeData.fixedAssets.find(x => x.id === id);
    if (!a) return;

    openQuickActionModal({
        title: `Gasto en ${a.name}`,
        subtitle: 'Mantenimiento, impuestos o mejoras del activo',
        infoLabel: 'Gastos Acumulados:',
        infoValue: formatMoney(a.linkedExpenses || 0),
        showAccountSelect: true,
        accountLabel: 'Cuenta Origen del Pago',
        amountLabel: 'Valor del Gasto ($)',
        submitLabel: '📉 Registrar Gasto',
        onConfirm: (val, source) => {
            if (val <= 0) { alert('Ingresa un monto mayor a $0.'); return false; }
            a.linkedExpenses = round2((a.linkedExpenses || 0) + val);
            const now = new Date();
            financeData.transactions.push({ 
                id: now.getTime(), monthId: getMonthId(now), type: 'expense', status: 'closed', account: source, 
                category: '📦 Otros Gastos', subcategory: 'Activos', description: `🔧 Gasto en Activo: ${a.name}`, amount: val, date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: false 
            });
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            updateDashboard(); renderAssetsBreakdown(); openAssetDetail(id); return true;
        }
    });
});

// --- PLANIFICADOR DE DEUDAS (DEBT PLANNER) ---
document.getElementById('open-debt-planner-btn')?.addEventListener('click', () => {
    document.getElementById('debt-planner-modal')?.classList.remove('hidden');
    renderDebtPlanner();
});
document.getElementById('close-debt-planner-btn')?.addEventListener('click', () => {
    document.getElementById('debt-planner-modal')?.classList.add('hidden');
});
document.getElementById('planner-strategy')?.addEventListener('change', renderDebtPlanner);
document.getElementById('planner-extra-monthly')?.addEventListener('input', renderDebtPlanner);
document.getElementById('planner-use-primas')?.addEventListener('change', renderDebtPlanner);

document.getElementById('planner-add-extra-btn')?.addEventListener('click', () => {
    const monthVal = document.getElementById('planner-extra-month').value;
    const amtVal = parseMoneyInput(document.getElementById('planner-extra-amount').value);
    if (!monthVal || amtVal <= 0) return;
    financeData.plannerExtras.push({ month: monthVal, amount: amtVal });
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('planner-extra-month').value = '';
    document.getElementById('planner-extra-amount').value = '';
    renderDebtPlanner();
});

window.removePlannerExtra = (index) => {
    financeData.plannerExtras.splice(index, 1);
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    renderDebtPlanner();
};

function renderDebtPlanner() {
    const strategy = document.getElementById('planner-strategy')?.value || 'avalanche';
    const extraMonthly = parseMoneyInput(document.getElementById('planner-extra-monthly')?.value) || 0;
    const usePrimas = document.getElementById('planner-use-primas')?.checked || false;
    
    const extrasListEl = document.getElementById('planner-extra-list');
    if (extrasListEl) {
        extrasListEl.innerHTML = financeData.plannerExtras.map((ex, i) => `
            <div class="glass-sub-box" style="display:flex; justify-content:space-between; align-items:center; padding:5px 8px; border-radius:8px; margin-bottom:4px; font-size:11px;">
                <span>${ex.month}: <b>${formatMoney(ex.amount)}</b></span>
                <button type="button" onclick="removePlannerExtra(${i})" style="color:var(--negative); background:none; border:none; cursor:pointer;">X</button>
            </div>
        `).join('');
    }

    const snap = computeBalancesUpTo(getMonthId(viewDate));
    const activeDebts = financeData.customAccounts.filter(a => (a.category === 'debt' || a.category === 'credit_card') && snap.bals[a.id] > 0).map(a => {
        const bal = round2(snap.bals[a.id]);
        let rate = 0, minPay = 0;
        if (a.category === 'debt') {
            rate = a.debtRateType === 'annual' ? (Math.pow(1 + (a.debtRate || 0)/100, 1/12) - 1)*100 : (a.debtRate || 0);
            minPay = a.debtMonthlyPayment || 0;
            if (minPay === 0 && a.debtType !== 'revolving') minPay = calculateAmortization(a.debtOriginal || bal, a.debtTotalQuotes || 1, rate, 'monthly').payment;
            else if (a.debtType === 'revolving') minPay = getPendingRevolvingPurchases(a.id).reduce((s, p) => s + p.nextQuota, 0);
        } else {
            rate = a.rateType === 'annual' ? (Math.pow(1 + (a.rate || 0)/100, 1/12) - 1)*100 : (a.rate || 0);
            minPay = bal * 0.05; 
        }
        return { id: a.id, name: a.name, bal, rate, minPay };
    });

    if (activeDebts.length === 0) {
        document.getElementById('planner-schedule-body').innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay deudas vigentes 🎉</td></tr>';
        ['planner-min-summary', 'planner-min-interest', 'planner-opt-summary', 'planner-opt-interest', 'planner-interest-saved', 'planner-freedom-date'].forEach(id => {
            const el = document.getElementById(id); if(el) el.innerText = '-';
        });
        return;
    }

    const simAmort = (debts, addExtra) => {
        let simDebts = debts.map(d => ({ ...d }));
        let monthIter = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        let totalInterest = 0, monthsCount = 0;
        const schedule = [];

        let primaJune = 0, primaDec = 0;
        if (usePrimas) {
            const salaryStr = localStorage.getItem('myFinancesSalary');
            if (salaryStr) {
                const cfg = JSON.parse(salaryStr);
                const metrics = calculateLaborMetrics(cfg, currentDate);
                primaJune = metrics.halfPrimaNeta;
                primaDec = metrics.halfPrimaNeta;
            }
        }

        while (simDebts.length > 0 && monthsCount < 360) {
            monthsCount++;
            let currentMonthExtra = addExtra ? extraMonthly : 0;
            
            if (addExtra) {
                const mStr = `${monthIter.getFullYear()}-${String(monthIter.getMonth() + 1).padStart(2, '0')}`;
                const mExtraObj = financeData.plannerExtras.find(e => e.month === mStr);
                if (mExtraObj) currentMonthExtra += mExtraObj.amount;
                
                if (usePrimas) {
                    if (monthIter.getMonth() === 5) currentMonthExtra += primaJune;
                    if (monthIter.getMonth() === 11) currentMonthExtra += primaDec;
                }
            }

            let monthInterest = 0, monthPrincipal = 0, monthTotalPay = 0;
            
            simDebts.forEach(d => {
                const int = round2(d.bal * (d.rate / 100));
                monthInterest += int; totalInterest += int; d.bal = round2(d.bal + int);
            });

            if (addExtra) simDebts.sort((a, b) => strategy === 'avalanche' ? b.rate - a.rate : a.bal - b.bal);

            simDebts.forEach(d => {
                let pay = Math.min(d.bal, d.minPay);
                d.bal = round2(d.bal - pay); monthTotalPay += pay;
            });

            let leftoverExtra = currentMonthExtra;
            if (addExtra && leftoverExtra > 0 && simDebts.length > 0) {
                for (let i = 0; i < simDebts.length; i++) {
                    const target = simDebts[i];
                    if (target.bal > 0) {
                        const extraPay = Math.min(target.bal, leftoverExtra);
                        target.bal = round2(target.bal - extraPay);
                        monthTotalPay += extraPay; leftoverExtra -= extraPay;
                        if (leftoverExtra <= 0) break;
                    }
                }
            }

            monthPrincipal = round2(monthTotalPay - monthInterest);
            simDebts = simDebts.filter(d => d.bal > 0);
            
            if (addExtra && monthsCount <= 24) {
                schedule.push({
                    monthStr: getShortMonthLabel(monthIter) + " " + monthIter.getFullYear().toString().slice(-2),
                    targetName: simDebts.length > 0 ? (strategy === 'avalanche' ? "Tasa Alta" : "Saldo Menor") : "Liberado 🎉",
                    pay: monthTotalPay, int: monthInterest, rem: simDebts.reduce((s, d) => s + d.bal, 0)
                });
            }
            monthIter.setMonth(monthIter.getMonth() + 1);
        }
        return { months: monthsCount, interest: totalInterest, schedule, freedomDate: monthIter };
    };

    const baseRes = simAmort(activeDebts, false);
    const optRes = simAmort(activeDebts, true);

    if (document.getElementById('planner-min-summary')) document.getElementById('planner-min-summary').innerText = `${baseRes.months} meses`;
    if (document.getElementById('planner-min-interest')) document.getElementById('planner-min-interest').innerText = `Int: ${formatMoney(baseRes.interest)}`;
    if (document.getElementById('planner-opt-summary')) document.getElementById('planner-opt-summary').innerText = `${optRes.months} meses`;
    if (document.getElementById('planner-opt-interest')) document.getElementById('planner-opt-interest').innerText = `Int: ${formatMoney(optRes.interest)}`;
    if (document.getElementById('planner-interest-saved')) document.getElementById('planner-interest-saved').innerText = formatMoney(Math.max(0, baseRes.interest - optRes.interest));
    if (document.getElementById('planner-freedom-date')) document.getElementById('planner-freedom-date').innerText = getShortMonthLabel(optRes.freedomDate) + " " + optRes.freedomDate.getFullYear();

    const tbody = document.getElementById('planner-schedule-body');
    if (tbody) {
        tbody.innerHTML = optRes.schedule.map(r => `
            <tr>
                <td>${r.monthStr}</td>
                <td style="color:var(--text-muted); font-size:10px;">${r.targetName}</td>
                <td>${formatMoney(r.pay)}</td>
                <td class="negative">${formatMoney(r.int)}</td>
                <td>${formatMoney(r.rem)}</td>
            </tr>
        `).join('');
    }
}

// --- CALCULADORA ---
let userEditedBudgetField = false;
let calcExpression = '';

const updateCalculatorDisplay = () => {
    const exprEl = document.getElementById('calc-expression'), resEl = document.getElementById('calc-result');
    if (exprEl) exprEl.innerText = calcExpression || '0';
    const evalRes = evaluateCalculatorExpression(calcExpression);
    if (resEl) resEl.innerText = evalRes.valid ? (formatNumberInput(evalRes.value) || '0,00') : 'Error';
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
        const key = btn.getAttribute('data-calc');
        const amountEl = document.getElementById('amount');
        const ops = ['+', '-', '×', '÷'];

        if (key === 'C') { calcExpression = ''; updateCalculatorDisplay(); return; }
        if (key === 'BACK') { calcExpression = calcExpression.slice(0, -1); updateCalculatorDisplay(); return; }
        if (key === 'OK') {
            const evalRes = evaluateCalculatorExpression(calcExpression);
            if (!evalRes.valid) { alert('Operación matemática inválida.'); return; }
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
            if (ops.includes(lastCh)) calcExpression = calcExpression.slice(0, -1) + key;
            else if (lastCh !== ',') calcExpression += key;
            updateCalculatorDisplay(); return;
        }

        if (key === '%') {
            const lastCh = calcExpression.slice(-1);
            if (lastCh >= '0' && lastCh <= '9') { calcExpression += '%'; updateCalculatorDisplay(); }
            return;
        }

        const lastOpIdx = Math.max(calcExpression.lastIndexOf('+'), calcExpression.lastIndexOf('-'), calcExpression.lastIndexOf('×'), calcExpression.lastIndexOf('÷'));
        const currentToken = calcExpression.slice(lastOpIdx + 1);
        if (currentToken.endsWith('%')) return;

        if (key === ',') {
            if (!currentToken.includes(',')) { calcExpression += currentToken.length === 0 ? '0,' : ','; updateCalculatorDisplay(); }
            return;
        }

        if (key === '000') {
            if (currentToken.length === 0 || currentToken === '0') { if (currentToken.length === 0) calcExpression += '0'; } 
            else calcExpression += '000';
            updateCalculatorDisplay(); return;
        }

        if (currentToken === '0' && key === '0') return;
        if (currentToken === '0' && key !== '0') calcExpression = calcExpression.slice(0, -1) + key;
        else calcExpression += key;
        updateCalculatorDisplay();
    });
});

const renderTxBudgetVariancePreview = () => {
    const box = document.getElementById('tx-budget-variance-box');
    if (!box) return;
    if (!typeSelect || typeSelect.value === 'transfer') { box.classList.add('hidden'); return; }

    const realAmt = parseMoneyInput(document.getElementById('amount')?.value);
    const budgetAmt = parseMoneyInput(document.getElementById('trans-budgeted-amount')?.value);
    const variance = calculateBudgetVariance(typeSelect.value, realAmt, budgetAmt);

    if (!variance.hasBudget) { box.classList.add('hidden'); return; }

    const signDiff = variance.diff > 0 ? '+' : '';
    const signPct = variance.pct > 0 ? '+' : '';
    const colorClass = variance.isFavorable ? 'positive' : 'negative';
    const diffLabel = typeSelect.value === 'expense' ? (variance.diff >= 0 ? 'Diferencia (Ahorro)' : 'Diferencia (Exceso)') : (variance.diff >= 0 ? 'Diferencia (Superávit)' : 'Diferencia (Faltante)');

    box.classList.remove('hidden');
    box.innerHTML = `<span>${diffLabel}: <b class="${colorClass}">${signDiff}${formatMoney(variance.diff)}</b></span><span>Variación: <b class="${colorClass}">${signPct}${String(variance.pct).replace('.', ',')}%</b></span>`;
};

const autoFillBudgetedAmountForTransaction = (force = false) => {
    const budgetInput = document.getElementById('trans-budgeted-amount');
    if (!budgetInput || !typeSelect) return;
    if (typeSelect.value === 'transfer') { budgetInput.value = ''; renderTxBudgetVariancePreview(); return; }

    const rawCat = document.getElementById('trans-category')?.value || '';
    const [catName, subName] = rawCat.split('::');
    const dateVal = document.getElementById('trans-date')?.value;
    let monthIdx = viewDate.getMonth();
    
    if (dateVal && dateVal.includes('-')) {
        const parts = dateVal.split('-');
        if (parts[1]) monthIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
    }

    const budgeted = getBudgetedAmountForSelection(typeSelect.value, catName, subName || 'General', monthIdx);
    if (force || !userEditedBudgetField) budgetInput.value = budgeted > 0 ? formatNumberInput(budgeted) : '';
    renderTxBudgetVariancePreview();
};

document.getElementById('trans-category')?.addEventListener('change', () => { userEditedBudgetField = false; autoFillBudgetedAmountForTransaction(true); });
document.getElementById('trans-date')?.addEventListener('change', () => autoFillBudgetedAmountForTransaction(false));
document.getElementById('trans-budgeted-amount')?.addEventListener('input', () => { userEditedBudgetField = true; renderTxBudgetVariancePreview(); });

const renderTransferAllocationItems = (preselectedIds = []) => {
    if (!transferAllocBox) return;
    const toAcc = getAccountObj(document.getElementById('to-account').value);
    
    if (typeSelect.value !== 'transfer' || !isLiabilityCategory(toAcc.category)) { transferAllocBox.classList.add('hidden'); return; }
    transferAllocBox.classList.remove('hidden');
    const mode = document.getElementById('transfer-payment-mode').value;
    const strategyGroup = document.getElementById('extraordinary-strategy-group');
    if (strategyGroup) { if (mode === 'extraordinary') strategyGroup.classList.remove('hidden'); else strategyGroup.classList.add('hidden'); }

    const listEl = document.getElementById('transfer-pending-items-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (toAcc.category === 'credit_card') {
        const pending = getPendingCardPurchases(toAcc.id);
        if (pending.length === 0) listEl.innerHTML = '<small style="color: var(--text-muted); font-size: 11px;">No hay compras con cuotas pendientes.</small>';
        else {
            pending.forEach(item => {
                const isChecked = preselectedIds.includes(String(item.tx.id)) ? 'checked' : '';
                const displayAmt = mode === 'extraordinary' ? item.remCapital : item.nextQuota;
                const subLabel = mode === 'extraordinary' ? `Saldo capital pendiente (${item.remainingInstallments}c rest.)` : `Cuota ${item.nextPeriod}/${item.installments} • Cap. rest: ${formatMoney(item.remCapital)}`;
                const row = document.createElement('label'); row.className = 'alloc-item-row';
                row.innerHTML = `<input type="checkbox" value="${item.tx.id}" data-kind="cc_tx" data-quota="${item.nextQuota}" data-remaining="${item.remCapital}" ${isChecked}>
                    <div class="alloc-item-info"><strong>${item.tx.description}</strong><small>${subLabel}</small></div>
                    <span class="alloc-item-amount">${formatMoney(displayAmt)}</span>`;
                listEl.appendChild(row);
            });
        }
    } else if (toAcc.category === 'debt') {
        const currentBal = Math.max(0, round2(currentBalances[toAcc.id] || 0));
        let monthlyPay = round2(toAcc.debtMonthlyPayment || 0);
        
        if (toAcc.debtType === 'revolving') {
            const revPurchases = getPendingRevolvingPurchases(toAcc.id);
            if (revPurchases.length === 0) listEl.innerHTML = '<small style="color: var(--text-muted); font-size: 11px;">No hay compras pendientes en este cupo.</small>';
            else {
                revPurchases.forEach(item => {
                    const isChecked = preselectedIds.includes(String(item.tx.id)) ? 'checked' : '';
                    const displayAmt = mode === 'extraordinary' ? item.remCapital : item.nextQuota;
                    const subLabel = mode === 'extraordinary' ? `Saldo capital pendiente (${item.remainingInstallments}c rest.)` : `Cuota ${item.nextPeriod}/${item.installments} • Cap. rest: ${formatMoney(item.remCapital)}`;
                    const row = document.createElement('label'); row.className = 'alloc-item-row';
                    row.innerHTML = `<input type="checkbox" value="${item.tx.id}" data-kind="cc_tx" data-quota="${item.nextQuota}" data-remaining="${item.remCapital}" ${isChecked}>
                        <div class="alloc-item-info"><strong>${item.tx.description}</strong><small>${subLabel}</small></div>
                        <span class="alloc-item-amount">${formatMoney(displayAmt)}</span>`;
                    listEl.appendChild(row);
                });
            }
        } else {
            if (monthlyPay === 0) monthlyPay = calculateAmortization(round2(toAcc.debtOriginal || currentBal), toAcc.debtTotalQuotes || 1, toAcc.debtRate || 0, toAcc.debtRateType || 'monthly').payment;
            if (currentBal <= 0) listEl.innerHTML = '<small style="color: var(--positive); font-size: 11px;">Este préstamo ya está en $0 🎉</small>';
            else {
                const isChecked = preselectedIds.includes(toAcc.id) ? 'checked' : '';
                const displayAmt = mode === 'extraordinary' ? currentBal : monthlyPay;
                const row = document.createElement('label'); row.className = 'alloc-item-row';
                row.innerHTML = `<input type="checkbox" value="${toAcc.id}" data-kind="debt_quota" data-quota="${monthlyPay}" data-remaining="${currentBal}" ${isChecked}>
                    <div class="alloc-item-info"><strong>Cuota Préstamo ${toAcc.name}</strong><small>Saldo vigente: ${formatMoney(currentBal)}</small></div>
                    <span class="alloc-item-amount">${formatMoney(displayAmt)}</span>`;
                listEl.appendChild(row);
            }
        }
    }

    listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            const currentMode = document.getElementById('transfer-payment-mode').value;
            let sum = 0;
            listEl.querySelectorAll('input[type="checkbox"]:checked').forEach(checkedBox => { sum = round2(sum + parseMoneyInput(currentMode === 'extraordinary' ? checkedBox.getAttribute('data-remaining') : checkedBox.getAttribute('data-quota'))); });
            if (sum > 0) document.getElementById('amount').value = formatNumberInput(sum);
            updateTransferAllocationSummary();
        });
    });
    updateTransferAllocationSummary();
};

const updateTransferAllocationSummary = () => {
    if (!transferAllocBox || transferAllocBox.classList.contains('hidden')) return;
    const mode = document.getElementById('transfer-payment-mode').value, checkboxes = document.querySelectorAll('#transfer-pending-items-list input[type="checkbox"]:checked'), summaryEl = document.getElementById('transfer-allocation-summary');
    if (document.getElementById('transfer-alloc-badge')) document.getElementById('transfer-alloc-badge').innerText = `${checkboxes.length} selec.`;
    const amountVal = parseMoneyInput(document.getElementById('amount').value);
    let selectedSum = 0;
    checkboxes.forEach(cb => { selectedSum = round2(selectedSum + parseMoneyInput(mode === 'extraordinary' ? cb.getAttribute('data-remaining') : cb.getAttribute('data-quota'))); });
    if (!summaryEl) return;
    
    if (checkboxes.length === 0) { summaryEl.innerText = mode === 'extraordinary' ? "Abono extraordinario general al saldo del pasivo." : "Selecciona cuotas para calcular cobertura."; return; }
    
    const diff = round2(amountVal - selectedSum);
    if (Math.abs(diff) < 1) summaryEl.innerHTML = `<span style="color:var(--positive);">✓ Cubre exactamente ${formatMoney(selectedSum)}.</span>`;
    else if (diff > 0) summaryEl.innerHTML = `Marcadas: <b>${formatMoney(selectedSum)}</b> • Excedente: <b style="color:var(--positive);">${formatMoney(diff)}</b> a capital.`;
    else summaryEl.innerHTML = `Marcadas: <b>${formatMoney(selectedSum)}</b> • Faltan <b style="color:var(--negative);">${formatMoney(Math.abs(diff))}</b>.`;
};

const updateCCInstallmentsPreview = (syncRateFromCard = false) => {
    if (!ccInstallmentsBox) return;
    const acc = getAccountObj(document.getElementById('account').value);
    
    // V2.3: Mostrar para TC y Cupos Rotativos
    if (typeSelect.value !== 'expense' || (acc.category !== 'credit_card' && acc.debtType !== 'revolving')) { ccInstallmentsBox.classList.add('hidden'); return; }

    ccInstallmentsBox.classList.remove('hidden');
    const amount = parseMoneyInput(document.getElementById('amount').value), installmentsInput = document.getElementById('trans-installments'), rateInput = document.getElementById('trans-rate'), rateTypeSelect = document.getElementById('trans-rate-type'), zeroCheck = document.getElementById('trans-zero-interest'), zeroHint = document.getElementById('zero-interest-hint');
    let installments = Math.max(1, parseInt(installmentsInput.value) || 1);
    const maxZero = acc.zeroInterestMax || 0;

    if (syncRateFromCard) {
        rateTypeSelect.value = (acc.category === 'debt') ? (acc.debtRateType || 'monthly') : (acc.rateType || 'monthly');
        const defaultRate = (acc.category === 'debt') ? acc.debtRate : acc.rate;
        if (installments === 1) { rateInput.value = '0'; zeroCheck.checked = false; } 
        else if (zeroCheck.checked) { if (maxZero > 0 && installments > maxZero) { zeroCheck.checked = false; rateInput.value = defaultRate ? formatNumberInput(defaultRate) : '0'; } else rateInput.value = '0'; } 
        else rateInput.value = defaultRate ? formatNumberInput(defaultRate) : '0';
    }

    if (installments === 1) zeroHint.innerText = "A 1 cuota no se generan intereses.";
    else if (maxZero > 0) zeroHint.innerText = `✨ Beneficio ${acc.name}: hasta ${maxZero} cuotas sin interés.`;
    else zeroHint.innerText = "Marca si esta compra aplica a promoción 0% interés.";

    const effectiveRate = installments === 1 ? 0 : parseMoneyInput(rateInput.value);
    const amort = calculateAmortization(amount, installments, effectiveRate, rateTypeSelect.value);

    if (document.getElementById('cc-preview-quota')) document.getElementById('cc-preview-quota').innerText = formatMoney(amort.payment);
    if (document.getElementById('cc-preview-interest')) document.getElementById('cc-preview-interest').innerText = formatMoney(amort.totalInterest);
    if (document.getElementById('cc-preview-total')) document.getElementById('cc-preview-total').innerText = formatMoney(amort.totalWithInterest);

    const tbody = document.getElementById('tx-amortization-body');
    if (tbody) tbody.innerHTML = amort.schedule.length === 0 || amount <= 0 ? '<tr><td colspan="5" style="text-align:center;">Ingresa un monto</td></tr>' : amort.schedule.map(row => `<tr><td>${row.period}</td><td>${formatMoney(row.payment)}</td><td class="positive">${formatMoney(row.principal)}</td><td class="negative">${formatMoney(row.interest)}</td><td>${formatMoney(row.balance)}</td></tr>`).join('');
};

document.getElementById('toggle-tx-amort-btn')?.addEventListener('click', () => document.getElementById('tx-amortization-box')?.classList.toggle('hidden'));
document.getElementById('trans-zero-interest')?.addEventListener('change', (e) => {
    const acc = getAccountObj(document.getElementById('account').value);
    const installments = Math.max(1, parseInt(document.getElementById('trans-installments').value) || 1), maxZero = acc.zeroInterestMax || 0, defaultRate = (acc.category === 'debt') ? acc.debtRate : acc.rate;
    if (e.target.checked) { if (maxZero > 0 && installments > maxZero) { alert(`Máximo ${maxZero} cuotas sin interés.`); e.target.checked = false; document.getElementById('trans-rate').value = defaultRate ? formatNumberInput(defaultRate) : '0'; } else document.getElementById('trans-rate').value = '0'; } 
    else document.getElementById('trans-rate').value = installments === 1 ? '0' : (defaultRate ? formatNumberInput(defaultRate) : '0');
    updateCCInstallmentsPreview(false);
});

document.getElementById('trans-installments')?.addEventListener('input', () => updateCCInstallmentsPreview(true));
document.getElementById('trans-rate')?.addEventListener('input', () => { if (parseMoneyInput(document.getElementById('trans-rate').value) > 0) document.getElementById('trans-zero-interest').checked = false; updateCCInstallmentsPreview(false); });
document.getElementById('trans-rate-type')?.addEventListener('change', () => updateCCInstallmentsPreview(false));
document.getElementById('account')?.addEventListener('change', () => updateCCInstallmentsPreview(true));
document.getElementById('to-account')?.addEventListener('change', () => renderTransferAllocationItems([]));
document.getElementById('transfer-payment-mode')?.addEventListener('change', () => renderTransferAllocationItems([]));

document.getElementById('trans-recurrence')?.addEventListener('change', (e) => {
    const countGroup = document.getElementById('group-recurrence-count');
    if (e.target.value !== 'none') countGroup?.classList.remove('hidden'); else countGroup?.classList.add('hidden');
});

const openEditModal = (id) => {
    const transaction = financeData.transactions.find(t => String(t.id) === String(id));
    if (!transaction) return;

    const titleMap = { expense: 'Editar Gasto', income: 'Editar Ingreso', transfer: 'Editar Transferencia' };
    if (document.getElementById('modal-title')) document.getElementById('modal-title').innerText = titleMap[transaction.type] || 'Editar Transacción';
    if (document.getElementById('edit-id')) document.getElementById('edit-id').value = transaction.id;

    document.getElementById('group-recurrence')?.classList.add('hidden');
    document.getElementById('group-recurrence-count')?.classList.add('hidden');
    document.getElementById('tx-calculator-panel')?.classList.add('hidden');
    document.getElementById('toggle-tx-calc-btn')?.classList.remove('active');

    const statusEl = document.getElementById('trans-status');
    if (statusEl) statusEl.value = transaction.status === 'pending' ? 'pending' : 'closed';
    if (typeSelect) { typeSelect.value = transaction.type; typeSelect.dispatchEvent(new Event('change')); }

    if (transaction.type === 'income' && transaction.account) renderAccountSelects(true, transaction.account);
    if (document.getElementById('account')) document.getElementById('account').value = transaction.account || financeData.customAccounts[0].id;
    if (document.getElementById('description')) document.getElementById('description').value = transaction.description;
    if (document.getElementById('amount')) document.getElementById('amount').value = formatNumberInput(transaction.amount);
    if (document.getElementById('trans-budgeted-amount')) document.getElementById('trans-budgeted-amount').value = transaction.budgetedAmount ? formatNumberInput(transaction.budgetedAmount) : '';
    userEditedBudgetField = true;

    const tDate = new Date(transaction.id);
    if (document.getElementById('trans-date')) document.getElementById('trans-date').value = tDate.toLocaleDateString('en-CA');
    if (document.getElementById('trans-time')) document.getElementById('trans-time').value = tDate.toTimeString().slice(0, 5);

    if (transaction.type === 'transfer') {
        if (document.getElementById('to-account')) document.getElementById('to-account').value = transaction.toAccount;
        if (document.getElementById('transfer-payment-mode')) document.getElementById('transfer-payment-mode').value = transaction.paymentMode || 'installments';
        if (document.getElementById('transfer-extra-strategy')) document.getElementById('transfer-extra-strategy').value = transaction.extraStrategy || 'reduce_term';
        renderTransferAllocationItems(Array.isArray(transaction.allocatedItems) ? transaction.allocatedItems.map(i => String(i.txId || i.debtId)) : []);
    } else {
        if (transaction.category && document.getElementById('trans-category')) document.getElementById('trans-category').value = `${transaction.category}::${transaction.subcategory || 'General'}`;
        if (!transaction.budgetedAmount) { userEditedBudgetField = false; autoFillBudgetedAmountForTransaction(true); }
        if (transaction.type === 'expense') {
            if (document.getElementById('trans-installments')) document.getElementById('trans-installments').value = transaction.installments || 1;
            if (document.getElementById('trans-rate')) document.getElementById('trans-rate').value = transaction.rate !== undefined ? formatNumberInput(transaction.rate) : '0';
            if (document.getElementById('trans-rate-type')) document.getElementById('trans-rate-type').value = transaction.rateType || 'monthly';
            if (document.getElementById('trans-zero-interest')) document.getElementById('trans-zero-interest').checked = !!transaction.zeroInterest;
            document.getElementById('tx-amortization-box')?.classList.add('hidden'); 
            updateCCInstallmentsPreview(false);
        }
    }

    renderTxBudgetVariancePreview();
    document.getElementById('delete-btn')?.classList.remove('hidden');
    modal?.classList.remove('hidden'); hasUnsavedChanges = false;
};

document.querySelectorAll('.fab-option').forEach(option => {
    option.addEventListener('click', () => {
        const selectedType = option.getAttribute('data-type');
        if (!selectedType) return;
        const titleMap = { expense: 'Nuevo Gasto', income: 'Nuevo Ingreso', transfer: 'Nueva Transferencia' };
        if (document.getElementById('modal-title')) document.getElementById('modal-title').innerText = titleMap[selectedType] || 'Nueva Transacción';
        if (document.getElementById('edit-id')) document.getElementById('edit-id').value = '';
        if (form) form.reset();

        document.getElementById('group-recurrence')?.classList.remove('hidden');
        document.getElementById('group-recurrence-count')?.classList.add('hidden');
        document.getElementById('tx-calculator-panel')?.classList.add('hidden');
        document.getElementById('toggle-tx-calc-btn')?.classList.remove('active');
        
        if (document.getElementById('trans-status')) document.getElementById('trans-status').value = 'closed';
        if (document.getElementById('trans-installments')) document.getElementById('trans-installments').value = 1;
        if (document.getElementById('trans-zero-interest')) document.getElementById('trans-zero-interest').checked = false;
        document.getElementById('tx-amortization-box')?.classList.add('hidden');

        const now = new Date();
        if (document.getElementById('trans-date')) document.getElementById('trans-date').value = selectedCalendarDay || now.toLocaleDateString('en-CA');
        if (document.getElementById('trans-time')) document.getElementById('trans-time').value = now.toTimeString().slice(0, 5);

        if (typeSelect) { typeSelect.value = selectedType; typeSelect.dispatchEvent(new Event('change')); }
        
        userEditedBudgetField = false;
        autoFillBudgetedAmountForTransaction(true);

        document.getElementById('delete-btn')?.classList.add('hidden');
        fabMenu?.classList.add('hidden'); fabBtn?.classList.remove('active'); 
        modal?.classList.remove('hidden'); hasUnsavedChanges = false;
    });
});

document.getElementById('delete-btn')?.addEventListener('click', () => {
    const editId = document.getElementById('edit-id').value;
    if (editId && confirm('¿Eliminar movimiento?')) {
        const oldT = financeData.transactions.find(t => String(t.id) === String(editId));
        if (oldT && oldT.type === 'transfer') revertTransferAllocation(oldT);
        financeData.transactions = financeData.transactions.filter(t => String(t.id) !== String(editId));
        localStorage.setItem('myFinances', JSON.stringify(financeData)); forceCloseAllModals(); updateDashboard();
    }
});

form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const editId = document.getElementById('edit-id').value, type = document.getElementById('type').value, status = document.getElementById('trans-status')?.value || 'closed', recurrence = !editId ? (document.getElementById('trans-recurrence')?.value || 'none') : 'none', recCount = recurrence !== 'none' ? Math.max(2, Math.min(60, parseInt(document.getElementById('trans-recurrence-count')?.value) || 12)) : 1;
    const account = document.getElementById('account').value, toAccount = document.getElementById('to-account').value, category = document.getElementById('trans-category').value, description = document.getElementById('description').value, amount = parseMoneyInput(document.getElementById('amount').value), budgetedVal = parseMoneyInput(document.getElementById('trans-budgeted-amount')?.value), finalBudgeted = budgetedVal > 0 ? budgetedVal : (status === 'pending' ? amount : 0);
    const baseDateObj = new Date(`${document.getElementById('trans-date').value}T${document.getElementById('trans-time').value}`);
    
    let wasAdjustment = false, preservedPaidInstallments = 0, preservedExtraPaid = 0, preservedBenefitType = null;
    if (editId) {
        const oldT = financeData.transactions.find(t => String(t.id) === String(editId));
        if (oldT) { if (oldT.isAdjustment) wasAdjustment = true; if (oldT.paidInstallments) preservedPaidInstallments = oldT.paidInstallments; if (oldT.extraPrincipalPaid) preservedExtraPaid = oldT.extraPrincipalPaid; if (oldT.benefitType) preservedBenefitType = oldT.benefitType; if (oldT.type === 'transfer') revertTransferAllocation(oldT); }
        financeData.transactions = financeData.transactions.filter(t => String(t.id) !== String(editId));
    }

    let savedCategory = null, savedSubcategory = null;
    if (type !== 'transfer' && category) { const parts = category.split('::'); savedCategory = parts[0]; savedSubcategory = parts[1] || 'General'; }

    for (let step = 0; step < recCount; step++) {
        const transactionDateObj = advanceDateByRecurrence(baseDateObj, recurrence, step), instStatus = step === 0 ? status : 'pending';
        const transactionData = { id: transactionDateObj.getTime() + step + Math.floor(Math.random() * 500), monthId: getMonthId(transactionDateObj), type, status: instStatus, account, category: savedCategory, subcategory: savedSubcategory, description: recCount > 1 ? `${description} (${step + 1}/${recCount})` : description, amount, budgetedAmount: finalBudgeted, date: `${transactionDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${transactionDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: wasAdjustment };
        if (preservedBenefitType) transactionData.benefitType = preservedBenefitType;
        const accObj = getAccountObj(account);
        
        // V2.3: Cuotas para Tarjetas y BNPL
        if (type === 'expense' && (accObj.category === 'credit_card' || (accObj.category === 'debt' && accObj.debtType === 'revolving'))) {
            const inst = Math.max(1, parseInt(document.getElementById('trans-installments').value) || 1), rate = inst === 1 ? 0 : parseMoneyInput(document.getElementById('trans-rate').value), rateType = document.getElementById('trans-rate-type').value, amort = calculateAmortization(amount, inst, rate, rateType);
            transactionData.installments = inst; transactionData.rate = rate; transactionData.rateType = rateType; transactionData.zeroInterest = document.getElementById('trans-zero-interest').checked || rate === 0; transactionData.paidInstallments = Math.min(inst, preservedPaidInstallments); transactionData.extraPrincipalPaid = preservedExtraPaid; transactionData.monthlyQuota = amort.payment; transactionData.totalWithInterest = amort.totalWithInterest;
        }

        if (type === 'transfer') {
            transactionData.toAccount = toAccount; const toAccObj = getAccountObj(toAccount);
            if (step === 0 && instStatus === 'closed' && isLiabilityCategory(toAccObj.category)) {
                const paymentMode = document.getElementById('transfer-payment-mode').value, extraStrategy = document.getElementById('transfer-extra-strategy').value, checkedBoxes = Array.from(document.querySelectorAll('#transfer-pending-items-list input[type="checkbox"]:checked'));
                transactionData.paymentMode = paymentMode; transactionData.extraStrategy = extraStrategy; transactionData.allocatedItems = [];
                let remainingPool = amount;
                checkedBoxes.forEach(cb => {
                    const kind = cb.getAttribute('data-kind');
                    if (kind === 'cc_tx') {
                        const targetTx = financeData.transactions.find(t => String(t.id) === String(cb.value));
                        if (targetTx) {
                            if (paymentMode === 'extraordinary') {
                                const remCap = parseMoneyInput(cb.getAttribute('data-remaining')), applied = Math.min(remainingPool, remCap);
                                remainingPool = round2(remainingPool - applied); targetTx.extraPrincipalPaid = round2((targetTx.extraPrincipalPaid || 0) + applied);
                                let closed = false; if (applied >= remCap - 1) { targetTx.paidInstallments = targetTx.installments || 1; targetTx.wasClosedByExtra = true; closed = true; }
                                transactionData.allocatedItems.push({ kind: 'cc_tx', txId: targetTx.id, mode: 'extraordinary', amountApplied: applied, closed });
                            } else {
                                targetTx.paidInstallments = Math.min(targetTx.installments || 1, (targetTx.paidInstallments || 0) + 1);
                                transactionData.allocatedItems.push({ kind: 'cc_tx', txId: targetTx.id, mode: 'installments', amountApplied: parseMoneyInput(cb.getAttribute('data-quota')) });
                            }
                        }
                    } else if (kind === 'debt_quota') {
                        const debtAcc = financeData.customAccounts.find(a => a.id === cb.value);
                        if (debtAcc) {
                            if (paymentMode === 'extraordinary') {
                                const prevDebtState = { debtTotalQuotes: debtAcc.debtTotalQuotes, debtMonthlyPayment: debtAcc.debtMonthlyPayment };
                                const newBal = Math.max(0, round2(Math.max(0, round2(currentBalances[debtAcc.id] || 0)) - amount)), remQuotes = Math.max(1, (debtAcc.debtTotalQuotes || 1) - (debtAcc.debtPaidQuotes || 0));
                                if (newBal > 0) {
                                    if (extraStrategy === 'reduce_quota') debtAcc.debtMonthlyPayment = calculateAmortization(newBal, remQuotes, debtAcc.debtRate || 0, debtAcc.debtRateType || 'monthly').payment;
                                    else if (extraStrategy === 'reduce_term' && debtAcc.debtMonthlyPayment > 0) {
                                        const mRate = debtAcc.debtRateType === 'annual' ? (Math.pow(1 + (debtAcc.debtRate || 0) / 100, 1 / 12) - 1) : ((debtAcc.debtRate || 0) / 100);
                                        if (mRate > 0 && debtAcc.debtMonthlyPayment > newBal * mRate) debtAcc.debtTotalQuotes = (debtAcc.debtPaidQuotes || 0) + Math.max(1, Math.ceil(-Math.log(1 - (newBal * mRate) / debtAcc.debtMonthlyPayment) / Math.log(1 + mRate)));
                                        else if (mRate === 0) debtAcc.debtTotalQuotes = (debtAcc.debtPaidQuotes || 0) + Math.max(1, Math.ceil(newBal / debtAcc.debtMonthlyPayment));
                                    }
                                }
                                transactionData.allocatedItems.push({ kind: 'debt_quota', debtId: debtAcc.id, mode: 'extraordinary', amountApplied: amount, prevDebtState });
                            } else {
                                debtAcc.debtPaidQuotes = (debtAcc.debtPaidQuotes || 0) + 1;
                                transactionData.allocatedItems.push({ kind: 'debt_quota', debtId: debtAcc.id, mode: 'installments', amountApplied: amount });
                            }
                        }
                    }
                });

                if (toAccObj.category === 'debt' && paymentMode === 'extraordinary' && checkedBoxes.length === 0 && amount > 0) {
                    const prevDebtState = { debtTotalQuotes: toAccObj.debtTotalQuotes, debtMonthlyPayment: toAccObj.debtMonthlyPayment }, newBal = Math.max(0, round2(Math.max(0, round2(currentBalances[toAccObj.id] || 0)) - amount)), remQuotes = Math.max(1, (toAccObj.debtTotalQuotes || 1) - (toAccObj.debtPaidQuotes || 0));
                    if (newBal > 0) {
                        if (extraStrategy === 'reduce_quota') toAccObj.debtMonthlyPayment = calculateAmortization(newBal, remQuotes, toAccObj.debtRate || 0, toAccObj.debtRateType || 'monthly').payment;
                        else if (extraStrategy === 'reduce_term' && toAccObj.debtMonthlyPayment > 0) {
                            const mRate = toAccObj.debtRateType === 'annual' ? (Math.pow(1 + (toAccObj.debtRate || 0) / 100, 1 / 12) - 1) : ((toAccObj.debtRate || 0) / 100);
                            if (mRate > 0 && toAccObj.debtMonthlyPayment > newBal * mRate) toAccObj.debtTotalQuotes = (toAccObj.debtPaidQuotes || 0) + Math.max(1, Math.ceil(-Math.log(1 - (newBal * mRate) / toAccObj.debtMonthlyPayment) / Math.log(1 + mRate)));
                            else if (mRate === 0) toAccObj.debtTotalQuotes = (toAccObj.debtPaidQuotes || 0) + Math.max(1, Math.ceil(newBal / toAccObj.debtMonthlyPayment));
                        }
                    }
                    transactionData.allocatedItems.push({ kind: 'debt_quota', debtId: toAccObj.id, mode: 'extraordinary', amountApplied: amount, prevDebtState });
                }
            }
        }
        financeData.transactions.push(transactionData);
    }
    localStorage.setItem('myFinances', JSON.stringify(financeData)); viewDate = new Date(baseDateObj.getFullYear(), baseDateObj.getMonth(), 1); forceCloseAllModals(); updateDashboard();
});

// --- TRANSACCIONES MODAL: V2.3 ATAJO NÓMINA ---
document.getElementById('btn-tx-quick-payroll')?.addEventListener('click', () => {
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (!salaryStr) { alert("Configura tu Salario en 'Mi Perfil' primero."); return; }
    const config = JSON.parse(salaryStr), metrics = calculateLaborMetrics(config, currentDate), isBiweekly = config.frequency === 'biweekly', amt = isBiweekly ? (currentDate.getDate() <= 16 ? metrics.net1Q : metrics.net2Q) : metrics.net, desc = isBiweekly ? (currentDate.getDate() <= 16 ? '💼 Pago Nómina (1Q)' : '💼 Pago Nómina (2Q)') : '💼 Pago Nómina Mensual';
    if (document.getElementById('trans-category')) document.getElementById('trans-category').value = '💼 Salario / Nómina::General';
    if (document.getElementById('description')) document.getElementById('description').value = desc;
    if (document.getElementById('amount')) document.getElementById('amount').value = formatNumberInput(amt);
    document.getElementById('trans-category').dispatchEvent(new Event('change'));
    document.getElementById('amount').dispatchEvent(new Event('input'));
});

typeSelect?.addEventListener('change', () => {
    const accEl = document.getElementById('account'), budgetGroup = document.getElementById('group-budgeted-amount'), payrollShortcut = document.getElementById('quick-payroll-shortcut');
    if (typeSelect.value === 'transfer') {
        renderAccountSelects(false); if (accEl) accEl.value = getDefaultAccountId(true);
        toAccountGroup?.classList.remove('hidden'); categoryGroup?.classList.add('hidden'); budgetGroup?.classList.add('hidden'); payrollShortcut?.classList.add('hidden'); document.getElementById('cc-installments-box')?.classList.add('hidden'); document.getElementById('label-account').innerText = "Cuenta Origen"; document.getElementById('to-account').required = true; renderTransferAllocationItems([]); renderTxBudgetVariancePreview();
    } else if (typeSelect.value === 'income') {
        renderAccountSelects(true); if (accEl) accEl.value = getDefaultAccountId(true);
        toAccountGroup?.classList.add('hidden'); categoryGroup?.classList.remove('hidden'); budgetGroup?.classList.remove('hidden'); payrollShortcut?.classList.remove('hidden'); document.getElementById('cc-installments-box')?.classList.add('hidden'); document.getElementById('transfer-debt-allocation-box')?.classList.add('hidden'); document.getElementById('label-account').innerText = "Cuenta (Activo / Liquidez)"; document.getElementById('to-account').required = false; renderCategoryOptions('income');
    } else {
        renderAccountSelects(false); if (accEl) accEl.value = getDefaultAccountId(false);
        toAccountGroup?.classList.add('hidden'); categoryGroup?.classList.remove('hidden'); budgetGroup?.classList.remove('hidden'); payrollShortcut?.classList.add('hidden'); document.getElementById('transfer-debt-allocation-box')?.classList.add('hidden'); document.getElementById('label-account').innerText = "Cuenta / Tarjeta / Deuda"; document.getElementById('to-account').required = false; renderCategoryOptions('expense'); updateCCInstallmentsPreview(true);
    }
});

document.getElementById('amount')?.addEventListener('input', () => {
    updateCCInstallmentsPreview(false); updateTransferAllocationSummary(); renderTxBudgetVariancePreview();
    const bnplBox = document.getElementById('tx-bnpl-impact-box'), accountId = document.getElementById('account')?.value, type = typeSelect?.value, amt = parseMoneyInput(document.getElementById('amount').value);
    if (bnplBox && type === 'expense' && accountId && amt > 0) {
        const acc = financeData.customAccounts.find(a => a.id === accountId);
        if (acc && acc.category === 'debt' && acc.debtType === 'revolving') {
            const inst = parseInt(document.getElementById('trans-installments')?.value) || 1, rate = parseMoneyInput(document.getElementById('trans-rate')?.value) || 0, rateType = document.getElementById('trans-rate-type')?.value || 'monthly', amort = calculateAmortization(amt, inst, rate, rateType), currSnap = computeBalancesUpTo(getMonthId(currentDate)), flow = getMonthlyFlow(getMonthId(currentDate), false), currentHealth = calculateFinancialHealth(getMonthId(currentDate), currSnap);
            if (flow.inc > 0) {
                const newDebtBurden = currentHealth.metrics.debtBurden + round2((amort.payment / flow.inc) * 100), goals = currentHealth.goals;
                let newScoreDebt = 100;
                if (newDebtBurden > goals.debt) { if (newDebtBurden >= 60) newScoreDebt = 0; else newScoreDebt = Math.max(0, 100 - Math.round(((newDebtBurden - goals.debt) / (60 - goals.debt)) * 100)); }
                const oldScore = currentHealth.scores.global, newGlobalScore = Math.round((currentHealth.scores.flow + currentHealth.scores.liquidity + newScoreDebt + currentHealth.scores.networth) / 4);
                if (newGlobalScore < oldScore) { bnplBox.innerHTML = `⚠️ <b>Simulador Salud Fin.:</b> Esta compra bajará tu puntaje de <b>${oldScore}</b> a <b>${newGlobalScore}</b> por la nueva cuota.`; bnplBox.classList.remove('hidden'); return; }
            }
        }
    }
    if (bnplBox) bnplBox.classList.add('hidden');
});

// --- SALUD FINANCIERA MODAL (NUEVO V2.3) ---
document.getElementById('widget-financial-health')?.addEventListener('click', () => {
    const hModal = document.getElementById('health-modal'); if (!hModal) return;
    const currSnap = computeBalancesUpTo(getMonthId(viewDate)), hData = calculateFinancialHealth(getMonthId(viewDate), currSnap);
    if (document.getElementById('health-modal-score')) document.getElementById('health-modal-score').innerText = hData.scores.global;
    if (document.getElementById('pillar-score-flow')) document.getElementById('pillar-score-flow').innerText = `${hData.scores.flow}/100`;
    if (document.getElementById('pillar-score-liquidity')) document.getElementById('pillar-score-liquidity').innerText = `${hData.scores.liquidity}/100`;
    if (document.getElementById('pillar-score-debt')) document.getElementById('pillar-score-debt').innerText = `${hData.scores.debt}/100`;
    if (document.getElementById('pillar-score-networth')) document.getElementById('pillar-score-networth').innerText = `${hData.scores.networth}/100`;
    if (document.getElementById('health-goal-margin')) document.getElementById('health-goal-margin').value = hData.goals.margin;
    if (document.getElementById('health-goal-liquidity')) document.getElementById('health-goal-liquidity').value = hData.goals.liquidity;
    if (document.getElementById('health-goal-debt')) document.getElementById('health-goal-debt').value = hData.goals.debt;
    if (document.getElementById('health-goal-networth')) document.getElementById('health-goal-networth').value = hData.goals.networth;

    const badgeEl = document.getElementById('health-modal-badge'), circleEl = document.getElementById('health-modal-circle'); let hColor = 'var(--positive)';
    if (hData.scores.global >= 80) { if (badgeEl) { badgeEl.innerText = "Excelente 🟢"; badgeEl.className = "widget-badge good"; } hColor = 'var(--positive)'; }
    else if (hData.scores.global >= 50) { if (badgeEl) { badgeEl.innerText = "Estable 🟡"; badgeEl.className = "widget-badge warn"; } hColor = '#f59e0b'; }
    else { if (badgeEl) { badgeEl.innerText = "Riesgo Alto 🔴"; badgeEl.className = "widget-badge danger"; } hColor = 'var(--negative)'; }
    if (circleEl) { circleEl.style.stroke = hColor; setTimeout(() => { circleEl.style.strokeDashoffset = 263.9 - (263.9 * hData.scores.global / 100); }, 150); }
    document.getElementById('health-tip-box')?.classList.add('hidden'); hModal.classList.remove('hidden');
});
document.getElementById('close-health-modal-btn')?.addEventListener('click', () => { document.getElementById('health-modal')?.classList.add('hidden'); });

window.showHealthTip = (pillarStr) => {
    const tipBox = document.getElementById('health-tip-box');
    const tipTitle = document.getElementById('health-tip-title');
    const tipDesc = document.getElementById('health-tip-desc');
    if (!tipBox || !tipTitle || !tipDesc) return;
    
    const currSnap = computeBalancesUpTo(getMonthId(viewDate));
    const hData = calculateFinancialHealth(getMonthId(viewDate), currSnap);
    
    tipBox.classList.remove('hidden');
    
    if (pillarStr === 'flow') {
        tipTitle.innerText = "Flujo de Caja (Margen)";
        tipDesc.innerHTML = `Tu margen actual es <b>${hData.metrics.margin}%</b>; la meta es <b>${hData.goals.margin}%</b>.<br><br>💡 Trata de gastar menos de lo que ingresas para tener un superávit mensual robusto.`;
    } else if (pillarStr === 'liquidity') {
        tipTitle.innerText = "Liquidez (Reserva)";
        tipDesc.innerHTML = `Tu efectivo cubre <b>${hData.metrics.monthsReserve} meses</b> de tus gastos; la meta es <b>${hData.goals.liquidity} meses</b>.<br><br>💡 Aumenta tu fondo disponible en cuentas bancarias para emergencias.`;
    } else if (pillarStr === 'debt') {
        tipTitle.innerText = "Carga de Deuda";
        tipDesc.innerHTML = `Tus cuotas usan el <b>${hData.metrics.debtBurden}%</b> de tus ingresos; el máximo recomendado es <b>${hData.goals.debt}%</b>.<br><br>💡 Reduce tus cuotas mensuales consolidando deuda o haciendo abonos extra a capital.`;
    } else if (pillarStr === 'networth') {
        tipTitle.innerText = "Patrimonio Neto";
        const ratio = (hData.metrics.netWorth > 0) ? (snap => (snap.liabilitiesTotal / (snap.assetsTotal+snap.fixedAssetsTotal+snap.pocketsTotal))*100)(currSnap) : 100;
        tipDesc.innerHTML = `Tu relación Pasivo/Activo es <b>${ratio.toFixed(0)}%</b>.<br><br>💡 Reduce deudas agresivamente o adquiere activos que aumenten tu patrimonio. Si el porcentaje es 0, no tienes deudas.`;
    }
};
document.getElementById('health-goals-form')?.addEventListener('submit', (e) => {
    e.preventDefault(); financeData.healthGoals = { margin: parseFloat(document.getElementById('health-goal-margin').value) || 15, liquidity: parseFloat(document.getElementById('health-goal-liquidity').value) || 3, debt: parseFloat(document.getElementById('health-goal-debt').value) || 30, networth: parseFloat(document.getElementById('health-goal-networth').value) || 10 }; localStorage.setItem('myFinances', JSON.stringify(financeData)); alert("✅ Metas de Salud Financiera actualizadas."); document.getElementById('widget-financial-health')?.click(); updateDashboard();
});

// --- NAVEGACIÓN DOCK, MENÚ LATERAL, PERFIL Y TEMAS ---
const navHome = document.getElementById('nav-home');
const navAnalytics = document.getElementById('nav-analytics');
const navBudget = document.getElementById('nav-budget');

document.getElementById('open-drawer-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openSideDrawer();
});
document.getElementById('close-drawer-btn')?.addEventListener('click', closeSideDrawer);
sideDrawerBackdrop?.addEventListener('click', closeSideDrawer);

document.querySelectorAll('.drawer-accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
        const group = trigger.closest('.drawer-accordion-group');
        const targetId = trigger.getAttribute('data-target');
        const content = targetId ? document.getElementById(targetId) : null;
        if (group && content) {
            group.classList.toggle('open');
            content.classList.toggle('hidden');
        }
    });
});

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

const profileModal = document.getElementById('profile-modal'), profileMainView = document.getElementById('profile-main-view'), profileSalaryView = document.getElementById('profile-salary-view'), profileTaxParamsView = document.getElementById('profile-tax-params-view'), profileBackupView = document.getElementById('profile-backup-view'), profileSecurityView = document.getElementById('profile-security-view'), profileThemeView = document.getElementById('profile-theme-view');
const showProfileSubView = (viewElement) => { [profileMainView, profileSalaryView, profileTaxParamsView, profileBackupView, profileSecurityView, profileThemeView].forEach(v => v?.classList.add('hidden')); viewElement?.classList.remove('hidden'); hasUnsavedChanges = false; };
document.getElementById('profile-trigger-btn')?.addEventListener('click', () => { if (attemptCloseModals()) { syncUserUI(); profileModal?.classList.remove('hidden'); showProfileSubView(profileMainView); } });
document.getElementById('menu-salary-btn')?.addEventListener('click', () => { renderSalaryUI(false); showProfileSubView(profileSalaryView); });
document.getElementById('menu-tax-params-btn')?.addEventListener('click', () => { renderTaxParamsUI(); showProfileSubView(profileTaxParamsView); });
document.getElementById('shortcut-to-tax-params-btn')?.addEventListener('click', () => { renderTaxParamsUI(); showProfileSubView(profileTaxParamsView); });
document.getElementById('menu-backup-btn')?.addEventListener('click', () => showProfileSubView(profileBackupView));
document.getElementById('menu-security-btn')?.addEventListener('click', () => showProfileSubView(profileSecurityView));
document.getElementById('menu-theme-btn')?.addEventListener('click', () => showProfileSubView(profileThemeView));
document.getElementById('back-from-salary-btn')?.addEventListener('click', () => { if (!hasUnsavedChanges || confirm("⚠️ Tienes cambios sin guardar. ¿Salir?")) showProfileSubView(profileMainView); });
document.getElementById('back-from-tax-params-btn')?.addEventListener('click', () => { if (!hasUnsavedChanges || confirm("⚠️ Tienes cambios sin guardar. ¿Salir?")) showProfileSubView(profileMainView); });
document.getElementById('back-from-backup-btn')?.addEventListener('click', () => showProfileSubView(profileMainView));
document.getElementById('back-from-security-btn')?.addEventListener('click', () => { if (!hasUnsavedChanges || confirm("⚠️ Tienes cambios sin guardar. ¿Salir?")) showProfileSubView(profileMainView); });
document.getElementById('back-from-theme-btn')?.addEventListener('click', () => showProfileSubView(profileMainView));
document.querySelectorAll('.theme-color-btn').forEach(btn => { btn.addEventListener('click', () => { const themeKey = btn.getAttribute('data-theme'); document.querySelectorAll('.theme-color-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); localStorage.setItem('myFinancesTheme', themeKey); applyThemeUI(themeKey); }); });
document.getElementById('custom-theme-color')?.addEventListener('input', (e) => { const hex = e.target.value; document.querySelectorAll('.theme-color-btn').forEach(b => b.classList.remove('active')); localStorage.setItem('myFinancesTheme', hex); applyThemeUI(hex); });
document.getElementById('profile-enable-pin')?.addEventListener('change', (e) => { const pinGroup = document.getElementById('profile-pin-group'); if (e.target.checked) pinGroup?.classList.remove('hidden'); else pinGroup?.classList.add('hidden'); });
document.getElementById('profile-pin-form')?.addEventListener('submit', (e) => { e.preventDefault(); const usePin = document.getElementById('profile-enable-pin').checked, newPin = document.getElementById('profile-new-pin').value, confirmPin = document.getElementById('profile-new-pin-confirm').value, errorEl = document.getElementById('profile-pin-error'); if (usePin) { if (newPin || !authData.pinHash) { if (newPin.length < 4) { errorEl.innerText = "Mínimo 4 dígitos."; errorEl.classList.remove('hidden'); return; } if (newPin !== confirmPin) { errorEl.innerText = "No coinciden."; errorEl.classList.remove('hidden'); return; } authData.pinHash = hashSecret(newPin); } authData.pinEnabled = true; } else { authData.pinEnabled = false; } localStorage.setItem('myFinancesAuth', JSON.stringify(authData)); errorEl?.classList.add('hidden'); document.getElementById('profile-new-pin').value = ''; document.getElementById('profile-new-pin-confirm').value = ''; hasUnsavedChanges = false; syncUserUI(); alert("✅ Preferencias de seguridad actualizadas."); });
document.getElementById('btn-lock-app-profile')?.addEventListener('click', () => initAuthUI(true));

navHome?.addEventListener('click', attemptCloseModals);
navAnalytics?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('analytics-modal')?.classList.remove('hidden'); setActiveNav(navAnalytics); } });
navBudget?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('budget-modal')?.classList.remove('hidden'); renderBudgetView(); setActiveNav(navBudget); } });

// Accesos desde el Menú Lateral Desplegable (Side Drawer)
document.getElementById('drawer-accounts')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('account-detail-view')?.classList.add('hidden'); document.getElementById('accounts-list-view')?.classList.remove('hidden'); document.getElementById('accounts-modal')?.classList.remove('hidden'); } });
document.getElementById('drawer-cards')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('cards-modal')?.classList.remove('hidden'); } });
document.getElementById('drawer-debts')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('debts-modal')?.classList.remove('hidden'); } });
document.getElementById('drawer-debt-planner')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('debt-planner-modal')?.classList.remove('hidden'); renderDebtPlanner(); } });
document.getElementById('drawer-pockets')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('pockets-modal')?.classList.remove('hidden'); renderPocketsView(); } });
document.getElementById('drawer-assets')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('assets-modal')?.classList.remove('hidden'); renderAssetsBreakdown(); } });
document.getElementById('drawer-budget')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('budget-modal')?.classList.remove('hidden'); renderBudgetView(); setActiveNav(navBudget); } });
document.getElementById('drawer-expenses')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('expenses-modal')?.classList.remove('hidden'); } });
document.getElementById('drawer-analytics')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('analytics-modal')?.classList.remove('hidden'); setActiveNav(navAnalytics); } });
document.getElementById('drawer-annual')?.addEventListener('click', () => { if (attemptCloseModals()) { annualViewYear = viewDate.getFullYear(); document.getElementById('annual-control-modal')?.classList.remove('hidden'); renderAnnualControlTable(); } });
document.getElementById('drawer-health')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('widget-financial-health')?.click(); } });
document.getElementById('drawer-salary')?.addEventListener('click', () => { if (attemptCloseModals()) { syncUserUI(); profileModal?.classList.remove('hidden'); renderSalaryUI(false); showProfileSubView(profileSalaryView); } });
document.getElementById('drawer-tax')?.addEventListener('click', () => { if (attemptCloseModals()) { syncUserUI(); profileModal?.classList.remove('hidden'); renderTaxParamsUI(); showProfileSubView(profileTaxParamsView); } });
document.getElementById('drawer-backup')?.addEventListener('click', () => { if (attemptCloseModals()) { syncUserUI(); profileModal?.classList.remove('hidden'); showProfileSubView(profileBackupView); } });

// Accesos directos desde los widgets del Dashboard
document.getElementById('widget-savings-goals')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('pockets-modal')?.classList.remove('hidden'); renderPocketsView(); } });
document.getElementById('dashboard-budget-widget')?.addEventListener('click', () => { if (attemptCloseModals()) { document.getElementById('budget-modal')?.classList.remove('hidden'); renderBudgetView(); setActiveNav(navBudget); } });

document.querySelectorAll('.btn-close-modal').forEach(btn => { btn.addEventListener('click', attemptCloseModals); });

// --- LÓGICA DE SALARIO Y PARÁMETROS TRIBUTARIOS ---
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
    saveTaxParams({ year: parseInt(document.getElementById('param-tax-year')?.value) || 2026, uvt: parseMoneyInput(document.getElementById('param-uvt')?.value) || 52374, smmlv: parseMoneyInput(document.getElementById('profile-smmlv')?.value) || 1750905, transportAid: parseMoneyInput(document.getElementById('profile-transport-aid')?.value) || 249095, exempt25AnnualUvt: parseMoneyInput(document.getElementById('param-exempt25-annual-uvt')?.value) || 790, global40AnnualUvt: parseMoneyInput(document.getElementById('param-global40-annual-uvt')?.value) || 1340, prepaidMonthlyUvt: parseMoneyInput(document.getElementById('param-prepaid-monthly-uvt')?.value) || 16, dependentsMonthlyUvt: parseMoneyInput(document.getElementById('param-dependents-monthly-uvt')?.value) || 32, housingMonthlyUvt: parseMoneyInput(document.getElementById('param-housing-monthly-uvt')?.value) || 100, voluntaryAnnualUvt: parseMoneyInput(document.getElementById('param-voluntary-annual-uvt')?.value) || 3800, nonSalaryCapPct: parseMoneyInput(document.getElementById('param-non-salary-cap-pct')?.value) || 40, fspSmmlvThreshold: parseMoneyInput(document.getElementById('param-fsp-smmlv')?.value) || 4 });
    hasUnsavedChanges = false; updateTaxParamsHints(); renderSalaryUI(false); alert("✅ Parámetros legales y tributarios guardados. Tu cálculo salarial ha sido actualizado.");
});
document.getElementById('btn-reset-tax-params-2026')?.addEventListener('click', () => { if (confirm("¿Restaurar todos los parámetros legales y topes UVT a los valores oficiales de 2026?")) { saveTaxParams(DEFAULT_TAX_PARAMS_2026); renderTaxParamsUI(); renderSalaryUI(false); hasUnsavedChanges = false; } });

let quickIncomeContext = null;
const openQuickIncomeModal = ({ title, subtitle, category, benefitType = '', description, amount, isBiweeklyPayroll = false, metrics = null }) => {
    const qModal = document.getElementById('quick-income-modal'); if (!qModal) return;
    const assetsAcc = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset'));
    if (assetsAcc.length === 0) { alert("Crea primero una cuenta de liquidez en 'Cuentas'."); return; }
    const accSelect = document.getElementById('quick-income-account');
    if (accSelect) { accSelect.innerHTML = assetsAcc.map(a => `<option value="${a.id}">${a.name}${a.isDefault ? ' ⭐' : ''}</option>`).join(''); const defAsset = getDefaultAccountId(true); if (defAsset && assetsAcc.some(a => a.id === defAsset)) accSelect.value = defAsset; }
    quickIncomeContext = { isBiweeklyPayroll, metrics, baseDescription: description };
    if (document.getElementById('quick-income-title')) document.getElementById('quick-income-title').innerText = title;
    if (document.getElementById('quick-income-subtitle')) document.getElementById('quick-income-subtitle').innerText = subtitle;
    if (document.getElementById('quick-income-category')) document.getElementById('quick-income-category').value = category;
    if (document.getElementById('quick-income-benefit-type')) document.getElementById('quick-income-benefit-type').value = benefitType;
    if (document.getElementById('quick-income-date')) document.getElementById('quick-income-date').value = new Date().toLocaleDateString('en-CA');
    const periodGroup = document.getElementById('quick-income-period-group'), periodSelect = document.getElementById('quick-income-period');
    if (isBiweeklyPayroll && metrics && periodGroup && periodSelect) { periodGroup.classList.remove('hidden'); const defaultPeriod = currentDate.getDate() <= 16 ? '1Q' : '2Q'; periodSelect.value = defaultPeriod; const chosenAmt = defaultPeriod === '1Q' ? metrics.net1Q : metrics.net2Q; if (document.getElementById('quick-income-amount')) document.getElementById('quick-income-amount').value = formatNumberInput(chosenAmt); if (document.getElementById('quick-income-desc')) document.getElementById('quick-income-desc').value = `💼 Pago Nómina (${defaultPeriod})`; } 
    else { periodGroup?.classList.add('hidden'); if (document.getElementById('quick-income-amount')) document.getElementById('quick-income-amount').value = formatNumberInput(amount); if (document.getElementById('quick-income-desc')) document.getElementById('quick-income-desc').value = description; }
    hasUnsavedChanges = false; qModal.classList.remove('hidden');
};
document.getElementById('quick-income-period')?.addEventListener('change', (e) => { if (!quickIncomeContext || !quickIncomeContext.isBiweeklyPayroll || !quickIncomeContext.metrics) return; const p = e.target.value, amt = p === '1Q' ? quickIncomeContext.metrics.net1Q : quickIncomeContext.metrics.net2Q; if (document.getElementById('quick-income-amount')) document.getElementById('quick-income-amount').value = formatNumberInput(amt); if (document.getElementById('quick-income-desc')) document.getElementById('quick-income-desc').value = `💼 Pago Nómina (${p})`; });
document.getElementById('close-quick-income-btn')?.addEventListener('click', () => { hasUnsavedChanges = false; document.getElementById('quick-income-modal')?.classList.add('hidden'); });
document.getElementById('quick-income-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('quick-income-account').value, amount = parseMoneyInput(document.getElementById('quick-income-amount').value), dateStr = document.getElementById('quick-income-date').value, description = document.getElementById('quick-income-desc').value.trim(), categoryName = document.getElementById('quick-income-category').value || '💼 Salario / Nómina', benefitType = document.getElementById('quick-income-benefit-type').value || '';
    if (amount <= 0) { alert("El monto debe ser mayor a $0."); return; }
    if (!financeData.categories.income.some(c => c.name === categoryName)) financeData.categories.income.push({ name: categoryName, subcategories: [] });
    const now = new Date(), txDateObj = dateStr ? new Date(`${dateStr}T${now.toTimeString().slice(0, 5)}`) : now;
    const newTx = { id: txDateObj.getTime() + Math.floor(Math.random() * 500), monthId: getMonthId(txDateObj), type: 'income', status: 'closed', account: accountId, category: categoryName, subcategory: 'General', description, amount, budgetedAmount: amount, date: `${txDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${txDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, isAdjustment: false };
    if (benefitType) newTx.benefitType = benefitType;
    financeData.transactions.push(newTx); localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false; document.getElementById('quick-income-modal')?.classList.add('hidden'); renderSalaryUI(false); updateDashboard(); alert(`✅ Ingreso de ${formatMoney(amount)} registrado en ${accountId}.`);
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
    if (sim.triggeredLey1393) alertsHtml += `<div style="font-size: 10.5px; color: #d97706; margin-top: 6px;">⚠️ <b>Ley 1393 (40%):</b> ${formatMoney(sim.deltaExcessLey1393)} del bono entra a sumar al IBC.</div>`;
    if (sim.crossedFsp) alertsHtml += `<div style="font-size: 10.5px; color: #d97706; margin-top: 4px;">⚠️ <b>Umbral FSP:</b> Con este bono superas ${sim.baseMetrics.params.fspSmmlvThreshold} SMMLV y se activa Fondo de Solidaridad.</div>`;
    resultsBox.classList.remove('hidden');
    resultsBox.innerHTML = `<div class="glass-sub-box" style="font-size: 11px;"><div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Bonificación Bruta:</span><b>${formatMoney(sim.bonus)}</b></div><div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>(-) Impacto Salud, Pensión y FSP:</span><span class="negative">-${formatMoney(sim.deltaSS)}</span></div><div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>(-) Impacto Retefuente (Art. 383):</span><span class="negative">-${formatMoney(sim.deltaRet)}</span></div><div style="display:flex; justify-content:space-between; align-items:center; padding-top:6px; border-top:1px dashed rgba(148,163,184,0.35);"><div><span style="display:block; font-size:10px; color:var(--text-muted);">Neto en Bolsillo (Desc. ${String(sim.effectiveTaxRate).replace('.', ',')}%)</span><strong class="positive" style="font-size:15px;">${formatMoney(sim.netBonus)}</strong></div><button type="button" id="btn-reg-simulated-bonus" class="btn-confirm-pending" style="margin-top:0;">+ Registrar</button></div>${alertsHtml}</div>`;
    document.getElementById('btn-reg-simulated-bonus')?.addEventListener('click', () => {
        openQuickIncomeModal({
            title: 'Registrar Bonificación',
            subtitle: `Neto estimado tras deducciones marginales`,
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
    if (document.getElementById('profile-ded-prepaid')) document.getElementById('profile-ded-prepaid').value = config.dedPrepaid ? formatNumberInput(config.dedPrepaid) : '';
    if (document.getElementById('profile-ded-housing')) document.getElementById('profile-ded-housing').value = config.dedHousing ? formatNumberInput(config.dedHousing) : '';
    if (document.getElementById('profile-ded-voluntary')) document.getElementById('profile-ded-voluntary').value = config.dedVoluntary ? formatNumberInput(config.dedVoluntary) : '';
    if (document.getElementById('profile-ded-dependents')) document.getElementById('profile-ded-dependents').checked = !!config.dedDependents;
    const activeProc = config.retProc !== undefined ? String(config.retProc) : '1';
    if (document.getElementById('profile-retefuente-proc')) { document.getElementById('profile-retefuente-proc').value = activeProc; if (activeProc === '2') { document.getElementById('proc2-pct-group')?.classList.remove('hidden'); if (document.getElementById('profile-retefuente-pct')) document.getElementById('profile-retefuente-pct').value = config.retPct ? formatNumberInput(config.retPct) : ''; } else { document.getElementById('proc2-pct-group')?.classList.add('hidden'); } }
    if (config.startDate && document.getElementById('profile-start-date')) document.getElementById('profile-start-date').value = config.startDate;
    if (document.getElementById('profile-pay-frequency')) document.getElementById('profile-pay-frequency').value = config.frequency;
    if (document.getElementById('profile-pay-day')) document.getElementById('profile-pay-day').value = config.payDay;
    if (document.getElementById('profile-biweekly-ret-mode')) document.getElementById('profile-biweekly-ret-mode').value = config.biweeklyRetMode || 'prorated';
    if (document.getElementById('profile-sync-budget')) document.getElementById('profile-sync-budget').checked = config.syncBudget !== false;
    toggleBiweeklyModeVisibility();

    const metrics = calculateLaborMetrics(config, currentDate), tabMonthly = document.getElementById('salary-tab-monthly');
    if (tabMonthly) {
        const retSubLabel = metrics.retProc === '0' ? 'Retefuente (Exento)' : `Retefuente (${String(metrics.numeroUVT).replace('.', ',')} UVT)`;
        const ley1393AlertHtml = metrics.excessNonSalary > 0 ? `<div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 8px 10px; margin-top: 8px; font-size: 11px; color: #d97706;">⚠️ <b>Ley 1393 (${metrics.params.nonSalaryCapPct}%):</b> Tus bonos exceden el tope en <b>${formatMoney(metrics.excessNonSalary)}</b>, por lo que tu IBC sube a <b>${formatMoney(metrics.ibc)}</b>.</div>` : '';
        const isBiweekly = config.frequency === 'biweekly';
        const biweeklyBreakdownHtml = isBiweekly ? `<div style="margin-top: 10px; background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 12px; padding: 10px;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><span style="font-size:11.5px; font-weight:700; color:var(--accent);">🗓️ Distribución Quincenal (1Q vs 2Q)</span><span class="widget-badge" style="font-size:9.5px;">${metrics.biweeklyRetMode === 'second_half' ? 'Ret. en 2Q' : '50% / 50%'}</span></div><div class="debt-metrics-grid" style="margin-bottom: 0;"><div class="debt-metric-cell"><small>1ra Quincena (1Q)</small><strong class="positive">${formatMoney(metrics.net1Q)}</strong><small style="font-size:9.5px; margin-top:2px;">Retefuente: ${formatMoney(metrics.ret1Q)}</small></div><div class="debt-metric-cell"><small>2da Quincena (2Q)</small><strong class="positive">${formatMoney(metrics.net2Q)}</strong><small style="font-size:9.5px; margin-top:2px;">Retefuente: ${formatMoney(metrics.ret2Q)}</small></div></div></div>` : '';
        const debtDeductionHtml = metrics.payrollDebtDeductions > 0 ? `<div class="debt-metric-cell"><small>Deudas (Nómina)</small><strong class="negative">${formatMoney(metrics.payrollDebtDeductions)}</strong></div>` : '';

        tabMonthly.innerHTML = `<h4 style="font-size: 13px; margin-bottom: 10px; color: var(--text-muted);">Desglose de Nómina Mensual (${metrics.params.year})</h4><div class="debt-metrics-grid" style="grid-template-columns: repeat(2, 1fr);"><div class="debt-metric-cell"><small>Salud (4% sobre IBC)</small><strong class="negative">${formatMoney(metrics.health)}</strong></div><div class="debt-metric-cell"><small>Pensión (4% sobre IBC)</small><strong class="negative">${formatMoney(metrics.pension)}</strong></div><div class="debt-metric-cell"><small>FSP (Solidaridad)</small><strong class="${metrics.fsp > 0 ? 'negative' : ''}">${formatMoney(metrics.fsp)}</strong></div><div class="debt-metric-cell"><small>${retSubLabel}</small><strong class="${metrics.ret > 0 ? 'negative' : ''}">${formatMoney(metrics.ret)}</strong></div><div class="debt-metric-cell"><small>Aux. Transporte</small><strong class="positive">${formatMoney(metrics.effectiveTransport)}</strong></div><div class="debt-metric-cell"><small>No Salarial / Bonos</small><strong class="positive">${formatMoney(metrics.nonSalary)}</strong></div>${debtDeductionHtml}</div>${ley1393AlertHtml}${biweeklyBreakdownHtml}<details style="margin-top: 10px; background: rgba(148,163,184,0.08); border: 1px solid rgba(148,163,184,0.2); border-radius: 10px; padding: 8px 10px;"><summary style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); cursor: pointer;">📋 Ver Depuración Retefuente (UVT $${metrics.uvt.toLocaleString('es-CO')})</summary><div style="margin-top: 8px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;"><div style="display:flex; justify-content:space-between;"><span>Ingresos Brutos Laborales:</span><b>${formatMoney(metrics.ingresosBrutos)}</b></div><div style="display:flex; justify-content:space-between;"><span>(-) Salud, Pensión y FSP (INCRNGO):</span><span class="negative">-${formatMoney(metrics.incrngo)}</span></div><div style="display:flex; justify-content:space-between; border-top:1px dashed rgba(148,163,184,0.3); padding-top:3px;"><span>Renta Líquida:</span><b>${formatMoney(metrics.rentaLiquida)}</b></div><div style="display:flex; justify-content:space-between;"><span>(-) Alivios Art. 387 + AFC/FVP:</span><span class="positive">-${formatMoney(round2(metrics.totalDeduccionesArt387 + metrics.dedVoluntary))}</span></div><div style="display:flex; justify-content:space-between;"><span>(-) Renta Exenta 25% (Tope ${(metrics.params.exempt25AnnualUvt / 12).toFixed(2).replace('.', ',')} UVT):</span><span class="positive">-${formatMoney(metrics.exempt25)}</span></div><div style="display:flex; justify-content:space-between;"><span>Beneficios Limitados (Tope 40% / ${(metrics.params.global40AnnualUvt / 12).toFixed(2).replace('.', ',')} UVT):</span><b>-${formatMoney(metrics.beneficiosLimitados)}</b></div><div style="display:flex; justify-content:space-between; border-top:1px solid rgba(148,163,184,0.3); padding-top:4px; color:var(--accent);"><span>Base Gravable (${String(metrics.numeroUVT).replace('.', ',')} UVT):</span><b>${formatMoney(metrics.baseGravable)}</b></div><div style="display:flex; justify-content:space-between;"><span>Retención Mensual (${String(metrics.effectiveRetPct).replace('.', ',')}%):</span><b class="${metrics.ret > 0 ? 'negative' : ''}">${formatMoney(metrics.ret)}</b></div>${metrics.retPrima > 0 ? `<div style="display:flex; justify-content:space-between; color:var(--negative);"><span>Retención Prima Semestral:</span><b>${formatMoney(metrics.retPrima)}</b></div>` : ''}</div></details><div class="tc-summary-banner" style="margin-top: 10px; background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.25);"><div><span style="color: var(--text-muted); font-size: 11px; display: block;">Salario Neto Mensual</span><strong id="calc-net-salary" class="positive" style="font-size: 18px;">${formatMoney(metrics.net)}</strong></div><div style="text-align: right;"><span id="calc-pay-frequency-label" style="color: var(--text-muted); font-size: 11px; display: block; margin-top: 8px;">${!isBiweekly ? 'Pago mensual' : (metrics.net1Q === metrics.net2Q ? `Quincenal (${formatMoney(metrics.net1Q)} c/u)` : `1Q: ${formatCompact(metrics.net1Q)} • 2Q: ${formatCompact(metrics.net2Q)}`)}</span></div></div><button type="button" id="btn-quick-register-payroll" class="btn btn-secondary" style="width: 100%; margin-top: 10px; padding: 10px; font-size: 12.5px; color: var(--positive); font-weight: 700;">💸 Registrar Pago de Nómina</button>`;
        document.getElementById('btn-quick-register-payroll')?.addEventListener('click', () => {
            if (metrics.net <= 0) { alert("Configura un sueldo básico mayor a $0."); return; }
            openQuickIncomeModal({ title: 'Registrar Pago de Nómina', subtitle: isBiweekly ? 'Selecciona la quincena y cuenta destino' : 'Abono de salario neto mensual', category: '💼 Salario / Nómina', description: '💼 Pago Nómina Mensual', amount: metrics.net, isBiweeklyPayroll: isBiweekly, metrics });
        });
    }

    const primaTotalNeta = round2(metrics.halfPrimaNeta * 2), annualIntereses = round2(metrics.prestacionesBase * 0.12);
    if (document.getElementById('proj-prima-total')) document.getElementById('proj-prima-total').innerText = formatMoney(primaTotalNeta);
    if (document.getElementById('proj-prima-junio')) document.getElementById('proj-prima-junio').innerText = formatMoney(metrics.halfPrimaNeta);
    if (document.getElementById('proj-prima-dic')) document.getElementById('proj-prima-dic').innerText = formatMoney(metrics.halfPrimaNeta);
    if (document.getElementById('proj-cesantias')) document.getElementById('proj-cesantias').innerText = formatMoney(metrics.prestacionesBase);
    if (document.getElementById('proj-intereses')) document.getElementById('proj-intereses').innerText = formatMoney(annualIntereses);
    if (document.getElementById('proj-vacaciones')) document.getElementById('proj-vacaciones').innerText = formatMoney(round2(metrics.basic / 2));
    if (document.getElementById('liq-days-year')) document.getElementById('liq-days-year').innerText = `${metrics.daysYear} días`;
    if (document.getElementById('liq-days-semester')) document.getElementById('liq-days-semester').innerText = `${metrics.daysSemester} días`;
    if (document.getElementById('liq-prima')) document.getElementById('liq-prima').innerText = formatMoney(metrics.liqPrima);
    if (document.getElementById('liq-cesantias')) document.getElementById('liq-cesantias').innerText = formatMoney(metrics.liqCesantias);
    if (document.getElementById('liq-intereses')) document.getElementById('liq-intereses').innerText = formatMoney(metrics.liqIntereses);
    if (document.getElementById('liq-total')) document.getElementById('liq-total').innerText = formatMoney(round2(metrics.liqPrima + metrics.liqCesantias + metrics.liqIntereses));
    document.getElementById('salary-results-box')?.classList.remove('hidden');

    const bindBenefitBtn = (btnId, opts) => { const btn = document.getElementById(btnId); if (!btn) return; btn.onclick = () => { if (opts.amount <= 0) { alert("El saldo disponible para esta prestación es $0."); return; } openQuickIncomeModal(opts); }; };
    bindBenefitBtn('btn-reg-prima-junio', { title: 'Registrar Prima de Junio', subtitle: 'Prima legal 1er semestre', category: '🎁 Prima de Servicios', benefitType: 'prima', description: `🎁 Prima de Servicios (Junio ${metrics.currentYear})`, amount: metrics.halfPrimaNeta });
    bindBenefitBtn('btn-reg-prima-dic', { title: 'Registrar Prima de Diciembre', subtitle: 'Prima legal 2do semestre', category: '🎁 Prima de Servicios', benefitType: 'prima', description: `🎁 Prima de Servicios (Diciembre ${metrics.currentYear})`, amount: metrics.halfPrimaNeta });
    bindBenefitBtn('btn-reg-proj-intereses', { title: 'Registrar Int. de Cesantías', subtitle: 'Pago anual directo al trabajador', category: '💰 Cesantías e Intereses', benefitType: 'intereses_cesantias', description: `💰 Intereses sobre Cesantías (${metrics.currentYear})`, amount: annualIntereses });
    bindBenefitBtn('btn-reg-liq-prima', { title: 'Registrar Prima Proporcional', subtitle: `Causada a hoy (${metrics.daysSemester}d)`, category: '🎁 Prima de Servicios', benefitType: 'prima', description: `🎁 Prima Proporcional (${metrics.daysSemester}d)`, amount: metrics.liqPrima });
    bindBenefitBtn('btn-reg-liq-intereses', { title: 'Registrar Int. Cesantías Prop.', subtitle: `Causados a hoy (${metrics.daysYear}d)`, category: '💰 Cesantías e Intereses', benefitType: 'intereses_cesantias', description: `💰 Intereses Cesantías Prop. (${metrics.daysYear}d)`, amount: metrics.liqIntereses });
    renderBonusSimulator();

    if (shouldSyncBudget && config.syncBudget !== false) {
        const salCatName = '💼 Salario / Nómina';
        if (!financeData.categories.income.some(c => c.name === salCatName)) financeData.categories.income.unshift({ name: salCatName, subcategories: [] });
        const salaryMonths = Array(12).fill(metrics.net);
        if (metrics.startObj.getFullYear() === metrics.currentYear) { for (let m = 0; m < metrics.startObj.getMonth(); m++) salaryMonths[m] = 0; } else if (metrics.startObj.getFullYear() > metrics.currentYear) salaryMonths.fill(0);
        financeData.categoryBudgets[salCatName] = { isMonthly: true, general: metrics.net, months: salaryMonths };

        const primaCatName = '🎁 Prima de Servicios';
        if (!financeData.categories.income.some(c => c.name === primaCatName)) financeData.categories.income.splice(1, 0, { name: primaCatName, subcategories: [] });
        const primaMonths = Array(12).fill(0), junEnd = new Date(metrics.currentYear, 5, 30), decEnd = new Date(metrics.currentYear, 11, 30);
        if (metrics.startObj <= junEnd) { const jan1 = new Date(metrics.currentYear, 0, 1), propRatio = Math.min(180, calcCommercialDays(metrics.startObj > jan1 ? metrics.startObj : jan1, junEnd)) / 180; primaMonths[5] = round2(metrics.halfPrimaNeta * propRatio); }
        if (metrics.startObj <= decEnd) { const jul1 = new Date(metrics.currentYear, 6, 1), propRatio = Math.min(180, calcCommercialDays(metrics.startObj > jul1 ? metrics.startObj : jul1, decEnd)) / 180; primaMonths[11] = round2(metrics.halfPrimaNeta * propRatio); }
        financeData.categoryBudgets[primaCatName] = { isMonthly: true, general: 0, months: primaMonths };
        localStorage.setItem('myFinances', JSON.stringify(financeData)); renderCategoryOptions(document.getElementById('type')?.value || 'expense');
    }
};

document.getElementById('salary-config-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const config = { basicSalary: parseMoneyInput(document.getElementById('profile-basic-salary').value), nonSalary: parseMoneyInput(document.getElementById('profile-non-salary')?.value), transportAuto: document.getElementById('profile-transport-auto')?.checked !== false, retProc: document.getElementById('profile-retefuente-proc')?.value || '1', retPct: parseMoneyInput(document.getElementById('profile-retefuente-pct')?.value) || 0, dedPrepaid: parseMoneyInput(document.getElementById('profile-ded-prepaid')?.value) || 0, dedHousing: parseMoneyInput(document.getElementById('profile-ded-housing')?.value) || 0, dedVoluntary: parseMoneyInput(document.getElementById('profile-ded-voluntary')?.value) || 0, dedDependents: !!document.getElementById('profile-ded-dependents')?.checked, startDate: document.getElementById('profile-start-date').value, frequency: document.getElementById('profile-pay-frequency').value, payDay: document.getElementById('profile-pay-day').value, biweeklyRetMode: document.getElementById('profile-biweekly-ret-mode')?.value || 'prorated', syncBudget: document.getElementById('profile-sync-budget')?.checked };
    localStorage.setItem('myFinancesSalary', JSON.stringify(config)); hasUnsavedChanges = false; renderSalaryUI(true); if (config.syncBudget) alert("✅ Salario depurado proyectado en tu Presupuesto de Ingresos.");
});

const switchSalaryTab = (tabName) => { ['monthly', 'annual', 'liquidation'].forEach(t => { const btn = document.getElementById(`tab-btn-salary-${t}`), panel = document.getElementById(`salary-tab-${t}`); if (t === tabName) { btn?.classList.add('active'); panel?.classList.remove('hidden'); } else { btn?.classList.remove('active'); panel?.classList.add('hidden'); } }); };
document.getElementById('tab-btn-salary-monthly')?.addEventListener('click', () => switchSalaryTab('monthly'));
document.getElementById('tab-btn-salary-annual')?.addEventListener('click', () => switchSalaryTab('annual'));
document.getElementById('tab-btn-salary-liquidation')?.addEventListener('click', () => switchSalaryTab('liquidation'));

// --- IMPORTACIÓN Y EXPORTACIÓN CSV / JSON ---
document.getElementById('btn-export-data')?.addEventListener('click', () => {
    try {
        const dbData = localStorage.getItem('myFinances'); if (!dbData) { alert("No hay datos para exportar."); return; }
        const backup = { finances: JSON.parse(dbData), auth: JSON.parse(localStorage.getItem('myFinancesAuth') || 'null'), salary: JSON.parse(localStorage.getItem('myFinancesSalary') || 'null'), taxParams: getTaxParams(), theme: localStorage.getItem('myFinancesTheme') || 'purple', exportDate: new Date().toISOString() };
        const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = `MisFinanzas_Respaldo_${new Date().toLocaleDateString('en-CA')}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
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
                alert("✅ Respaldo restaurado."); location.reload();
            }
        } catch (error) { alert("Error al leer JSON."); }
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
            if (confirm(`Se encontraron ${importedTxs.length} registros.\n\n• ACEPTAR: Reemplazar actuales.\n• CANCELAR: Agregarlos.`)) financeData.transactions = importedTxs; else financeData.transactions = financeData.transactions.concat(importedTxs);
            localStorage.setItem('myFinances', JSON.stringify(financeData)); renderCategoryOptions(document.getElementById('type')?.value || 'expense'); updateDashboard(); alert(`✅ Se cargaron ${importedTxs.length} movimientos.`);
        } catch (err) { alert("Error al procesar CSV."); }
        event.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
});

// ==========================================
// 15. ARRANQUE DE LA APLICACIÓN Y SERVICE WORKER (V2.3)
// ==========================================
const savedTheme = localStorage.getItem('myFinancesTheme') || 'purple';
applyThemeUI(savedTheme);
document.querySelectorAll('.theme-color-btn').forEach(b => {
    if (b.getAttribute('data-theme') === savedTheme) b.classList.add('active');
    else b.classList.remove('active');
});

renderAccountSelects();
renderCategoryOptions('expense');
renderTaxParamsUI();
renderSalaryUI(false);
initAuthUI(false);
updateDashboard();

if ('serviceWorker' in navigator) {
    let refreshingSW = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshingSW) return;
        refreshingSW = true;
        window.location.reload();
    });

    navigator.serviceWorker.register('sw.js').then((reg) => {
        if (reg.waiting) {
            document.getElementById('sw-update-toast')?.classList.remove('hidden');
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    document.getElementById('sw-update-toast')?.classList.remove('hidden');
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
    }).catch(() => {});
}