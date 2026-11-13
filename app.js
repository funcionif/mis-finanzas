// --- SISTEMA DE SEGURIDAD Y CIFRADO LOCAL ---
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
const authScreen = document.getElementById('auth-screen');
const registerView = document.getElementById('register-view');
const loginView = document.getElementById('login-view');
const authCard = document.getElementById('auth-card');

const initAuth = () => {
    if(authScreen) authScreen.classList.remove('hidden');
    if (!authData) {
        if(registerView) registerView.classList.remove('hidden');
        if(loginView) loginView.classList.add('hidden');
    } else {
        if(registerView) registerView.classList.add('hidden');
        if(loginView) loginView.classList.remove('hidden');
        if(document.getElementById('welcome-user')) document.getElementById('welcome-user').innerText = `Hola, ${authData.name}`;
        if(document.getElementById('app-title')) document.getElementById('app-title').innerText = `Finanzas de ${authData.name}`;
        if(document.getElementById('login-pin')) document.getElementById('login-pin').value = '';
        if(document.getElementById('login-error')) document.getElementById('login-error').classList.add('hidden');
        setTimeout(() => { if(document.getElementById('login-pin')) document.getElementById('login-pin').focus(); }, 100);
    }
};

document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const pin = document.getElementById('reg-pin').value;
    const confirmPin = document.getElementById('reg-pin-confirm').value;
    const errorEl = document.getElementById('reg-error');

    if (pin !== confirmPin) {
        errorEl.innerText = "Las claves no coinciden. Inténtalo de nuevo.";
        errorEl.classList.remove('hidden');
        authCard.classList.remove('shake');
        void authCard.offsetWidth;
        authCard.classList.add('shake');
        return;
    }

    authData = { name: name, pinHash: hashSecret(pin) };
    localStorage.setItem('myFinancesAuth', JSON.stringify(authData));
    if(document.getElementById('app-title')) document.getElementById('app-title').innerText = `Finanzas de ${authData.name}`;
    if(authScreen) authScreen.classList.add('hidden');
});

document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputPin = document.getElementById('login-pin').value;
    if (hashSecret(inputPin) === authData.pinHash) {
        document.getElementById('login-pin').value = '';
        document.getElementById('login-error').classList.add('hidden');
        if(authScreen) authScreen.classList.add('hidden');
    } else {
        document.getElementById('login-error').classList.remove('hidden');
        document.getElementById('login-pin').value = '';
        authCard.classList.remove('shake');
        void authCard.offsetWidth;
        authCard.classList.add('shake');
    }
});

document.getElementById('manual-lock-btn')?.addEventListener('click', () => initAuth());
document.getElementById('reset-auth-btn')?.addEventListener('click', () => {
    if (confirm("⚠️ ATENCIÓN: Por seguridad, si olvidaste tu clave se borrarán los datos locales para crear un usuario nuevo. ¿Deseas continuar?")) {
        localStorage.removeItem('myFinancesAuth');
        localStorage.removeItem('myFinances');
        location.reload();
    }
});

initAuth();

// --- UTILIDADES CONTABLES Y DECIMALES ---
const round2 = (num) => Math.round(((num || 0) + Number.EPSILON) * 100) / 100;
const parseMoneyInput = (val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const normalized = String(val).replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : round2(parsed);
};

const formatMoney = (amount) => {
    const clean = round2(amount);
    const hasDecimals = Math.abs(clean % 1) > 0;
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP',
        minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2
    }).format(clean);
};

const formatCompact = (amount) => {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(0)}k`;
    return `${sign}${abs.toFixed(0)}`;
};

const getAssetEmoji = (cat) => {
    const map = { 'Inmueble': '🏠', 'Vehículo': '🚗', 'Inversión': '📈', 'Tecnología': '💻', 'Coleccionable': '💎', 'Otro': '📦' };
    return map[cat] || '📦';
};

// --- MOTOR FINANCIERO Y MODELO DE DATOS ---
let financeData = JSON.parse(localStorage.getItem('myFinances')) || {
    transactions: [], customAccounts: [], monthlyBudget: 0, fixedAssets: []
};

if (!financeData.fixedAssets) financeData.fixedAssets = [];
if (!financeData.customAccounts || financeData.customAccounts.length === 0) {
    financeData.customAccounts = [{ id: 'Efectivo', name: 'Efectivo', category: 'asset' }];
}
if (financeData.monthlyBudget === undefined) financeData.monthlyBudget = 0;

if (!financeData.categories || (financeData.categories.expense && financeData.categories.expense.length === 0 && financeData.categories.income && financeData.categories.income.length === 0) || (financeData.categories.expense.length > 0 && typeof financeData.categories.expense[0] === 'string')) {
    financeData.categories = {
        expense: [
            { name: '🍔 Alimentación', subcategories: [] },
            { name: '🏠 Vivienda y Servicios', subcategories: [] },
            { name: '🚗 Transporte', subcategories: [] },
            { name: '🛍️ Compras', subcategories: [] },
            { name: '🎬 Entretenimiento', subcategories: [] },
            { name: '🏥 Salud', subcategories: [] },
            { name: '💳 Cuotas / Intereses', subcategories: [] },
            { name: '📦 Otros Gastos', subcategories: [] }
        ],
        income: [
            { name: '💼 Salario / Nómina', subcategories: [] },
            { name: '💻 Honorarios / Ventas', subcategories: [] },
            { name: '📈 Rendimientos', subcategories: [] },
            { name: '🎁 Regalos / Bonos', subcategories: [] },
            { name: '✨ Otros Ingresos', subcategories: [] }
        ]
    };
} else {
    financeData.categories.expense.forEach(cat => {
        if (cat.subcategories) { cat.subcategories = cat.subcategories.map(sub => (typeof sub === 'string') ? { name: sub, limit: 0 } : sub); }
    });
    financeData.categories.income.forEach(cat => {
        if (cat.subcategories) { cat.subcategories = cat.subcategories.map(sub => (typeof sub === 'string') ? { name: sub, limit: 0 } : sub); }
    });
}

if (!financeData.categoryBudgets) { financeData.categoryBudgets = {}; }

financeData.customAccounts.forEach(acc => {
    if (!acc.category) acc.category = 'asset';
    if (acc.category === 'liability') acc.category = 'debt';
});
localStorage.setItem('myFinances', JSON.stringify(financeData));

const assetColors = ['#0f4c81', '#0d9488', '#0284c7', '#059669', '#4f46e5', '#64748b', '#0891b2', '#2563eb'];
const cardColors = ['#4f46e5', '#0284c7', '#7c3aed', '#0d9488', '#db2777', '#2563eb', '#059669', '#d97706'];
const debtColors = ['#e11d48', '#d97706', '#dc2626', '#ea580c', '#be185d', '#b91c1c', '#9333ea', '#64748b'];
const categoryColors = ['#007aff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

// --- VARIABLES GLOBALES Y REFERENCIAS DE UI ---
let currentDate = new Date();
let viewDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); 
let currentBalances = {}; 
let lastAccountViewOrigin = 'home'; 
let selectedCalendarDay = null;
let activeHistoryFilter = 'all';
let currentBudgetType = 'expense'; 
let currentAssetType = 'active';

const modal = document.getElementById('transaction-modal');
const form = document.getElementById('transaction-form');
const typeSelect = document.getElementById('type');
const toAccountGroup = document.getElementById('group-to-account');
const categoryGroup = document.getElementById('group-category');
const ccInstallmentsBox = document.getElementById('cc-installments-box');
const transferAllocBox = document.getElementById('transfer-debt-allocation-box');

const getMonthId = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const getShortMonthLabel = (date) => date.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
const formatMonthName = (date) => date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
const getAccountObj = (id) => financeData.customAccounts.find(a => a.id === id) || { id: id, name: id, category: 'asset' };
const isLiabilityCategory = (cat) => cat === 'credit_card' || cat === 'debt';

// --- FUNCIONES MATEMÁTICAS ---
const computeBalancesUpTo = (targetMonthId) => {
    const bals = {};
    financeData.customAccounts.forEach(acc => bals[acc.id] = 0);

    financeData.transactions.forEach(t => {
        if (t.monthId <= targetMonthId) {
            const accObj = getAccountObj(t.account);
            const toAccObj = t.toAccount ? getAccountObj(t.toAccount) : null;
            const amt = round2(t.amount);

            if (t.type === 'income') {
                if (isLiabilityCategory(accObj.category)) { if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] - amt); } 
                else { if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] + amt); }
            } else if (t.type === 'expense') {
                if (isLiabilityCategory(accObj.category)) { if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] + amt); } 
                else { if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] - amt); }
            } else if (t.type === 'transfer') {
                if (isLiabilityCategory(accObj.category)) { if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] + amt); } 
                else { if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] - amt); }
                
                if (toAccObj) {
                    if (isLiabilityCategory(toAccObj.category)) { if (bals[t.toAccount] !== undefined) bals[t.toAccount] = round2(bals[t.toAccount] - amt); } 
                    else { if (bals[t.toAccount] !== undefined) bals[t.toAccount] = round2(bals[t.toAccount] + amt); }
                }
            }
        }
    });

    let assetsTotal = 0, cardsTotal = 0, debtsTotal = 0, fixedAssetsTotal = 0;
    
    financeData.customAccounts.forEach(acc => {
        const b = round2(bals[acc.id] || 0);
        if (acc.category === 'credit_card') cardsTotal = round2(cardsTotal + b);
        else if (acc.category === 'debt') debtsTotal = round2(debtsTotal + b);
        else assetsTotal = round2(assetsTotal + b);
    });

    if (financeData.fixedAssets) {
        financeData.fixedAssets.forEach(fa => {
            if (fa.status === 'active') fixedAssetsTotal = round2(fixedAssetsTotal + fa.currentValue);
        });
    }

    const liabilitiesTotal = round2(cardsTotal + debtsTotal);
    const netWorth = round2(assetsTotal + fixedAssetsTotal - liabilitiesTotal);

    return { bals, assetsTotal, cardsTotal, debtsTotal, liabilitiesTotal, fixedAssetsTotal, netWorth };
};

const getMonthlyFlow = (targetMonthId) => {
    let inc = 0, exp = 0;
    financeData.transactions.forEach(t => {
        if (t.monthId === targetMonthId && t.type !== 'transfer' && !t.isAdjustment) {
            if (t.type === 'income') inc = round2(inc + round2(t.amount));
            else if (t.type === 'expense') exp = round2(exp + round2(t.amount));
        }
    });
    return { inc, exp, net: round2(inc - exp) };
};

let activeAmortizationSchedule = [];
const calculateAmortization = (principal, periods, rate, rateType) => {
    let monthlyRate = rate / 100;
    if (rateType === 'annual') { monthlyRate = Math.pow(1 + monthlyRate, 1 / 12) - 1; }
    
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
            period: i, payment: round2(payment), principal: round2(principalPayment),
            interest: round2(interest), balance: round2(balance)
        });
    }
    return { payment: round2(payment), schedule, monthlyRate, totalInterest: round2(totalInterest), totalWithInterest: round2(principal + totalInterest) };
};

const getPendingCardPurchases = (cardId) => {
    return financeData.transactions
        .filter(t => t.account === cardId && t.type === 'expense' && !t.isAdjustment)
        .map(t => {
            const inst = Math.max(1, parseInt(t.installments) || 1);
            const paid = Math.max(0, parseInt(t.paidInstallments) || 0);
            const rate = inst === 1 ? 0 : (parseFloat(t.rate) || 0);
            const rateType = t.rateType || 'monthly';
            const amort = calculateAmortization(round2(t.amount), inst, rate, rateType);
            const remSchedule = amort.schedule.slice(paid);
            const extraPaid = round2(t.extraPrincipalPaid || 0);
            const rawRemCapital = round2(remSchedule.reduce((s, r) => s + r.principal, 0));
            const remCapital = Math.max(0, round2(rawRemCapital - extraPaid));
            const nextQuota = remSchedule.length > 0 ? Math.min(remSchedule[0].payment, round2(remCapital + remSchedule[0].interest)) : 0;

            return {
                tx: t, installments: inst, paidInstallments: paid, remainingInstallments: Math.max(0, inst - paid),
                rate, rateType, zeroInterest: !!t.zeroInterest || rate === 0,
                nextPeriod: paid + 1, nextQuota: round2(nextQuota), remCapital
            };
        })
        .filter(item => item.remainingInstallments > 0 && item.remCapital > 0)
        .sort((a, b) => a.tx.id - b.tx.id);
};

// --- RENDER DE SELECTORES ---
const renderAccountSelects = (onlyAssets = false, forceIncludeId = null) => {
    const accSelect = document.getElementById('account');
    const toAccSelect = document.getElementById('to-account');
    if(!accSelect || !toAccSelect) return;

    const assets = financeData.customAccounts.filter(a => a.category === 'asset');
    const cards = financeData.customAccounts.filter(a => a.category === 'credit_card');
    const debts = financeData.customAccounts.filter(a => a.category === 'debt');

    let accHtml = `<optgroup label="💵 Liquidez (Cuentas y Efectivo)">`;
    assets.forEach(acc => accHtml += `<option value="${acc.id}">${acc.name}</option>`);
    accHtml += `</optgroup>`;

    if (!onlyAssets) {
        if (cards.length > 0) {
            accHtml += `<optgroup label="💳 Tarjetas de Crédito">`;
            cards.forEach(acc => accHtml += `<option value="${acc.id}">${acc.name}</option>`);
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
    assets.forEach(acc => fullHtml += `<option value="${acc.id}">${acc.name}</option>`);
    fullHtml += `</optgroup>`;

    if (cards.length > 0) {
        fullHtml += `<optgroup label="💳 Tarjetas de Crédito">`;
        cards.forEach(acc => fullHtml += `<option value="${acc.id}">${acc.name}</option>`);
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
    const list = financeData.categories[type] || [];
    let html = '';
    if (list.length === 0) {
        html = `<option value="">⚠️ Crea un Sobre en la pestaña Presup.</option>`;
    } else {
        list.forEach(cat => {
            if (cat.subcategories && cat.subcategories.length > 0) {
                html += `<optgroup label="${cat.name}">`;
                cat.subcategories.forEach(sub => { html += `<option value="${cat.name}::${sub.name}">${sub.name}</option>`; });
                html += `</optgroup>`;
            } else {
                html += `<option value="${cat.name}::General">${cat.name} (General)</option>`;
            }
        });
    }
    catSelect.innerHTML = html;
};

renderAccountSelects();
renderCategoryOptions('expense');

// --- ACTUALIZADOR PRINCIPAL ---
const updateDashboard = () => {
    const viewMonthId = getMonthId(viewDate);
    const currentMonthId = getMonthId(currentDate);
    const isFuture = viewMonthId > currentMonthId;
    
    if(document.getElementById('month-display')) document.getElementById('month-display').innerText = formatMonthName(viewDate);
    if(document.getElementById('quick-month-input')) document.getElementById('quick-month-input').value = viewMonthId;
    
    const badge = document.getElementById('period-context-badge');
    const todayBtn = document.getElementById('today-btn');

    if(badge && todayBtn) {
        if (selectedCalendarDay) {
            badge.innerText = `Día: ${selectedCalendarDay.split('-')[2]}`;
            badge.className = 'period-badge day';
            todayBtn.classList.remove('hidden');
        } else if (isFuture) {
            badge.innerText = 'Proyección';
            badge.className = 'period-badge future';
            todayBtn.classList.remove('hidden');
        } else if (viewMonthId < currentMonthId) {
            badge.innerText = 'Histórico';
            badge.className = 'period-badge past';
            todayBtn.classList.remove('hidden');
        } else {
            badge.innerText = 'Actual';
            badge.className = 'period-badge';
            todayBtn.classList.add('hidden');
        }
    }

    if(document.getElementById('analytics-month-label')) document.getElementById('analytics-month-label').innerText = formatMonthName(viewDate);

    const currSnap = computeBalancesUpTo(viewMonthId);
    currentBalances = currSnap.bals;

    const prevDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    const prevMonthId = getMonthId(prevDate);
    const prevSnap = computeBalancesUpTo(prevMonthId);

    const currFlow = getMonthlyFlow(viewMonthId);
    let monthlyIncome = currFlow.inc;
    let monthlyExpense = currFlow.exp;
    let cumulativeLiquidity = currSnap.assetsTotal;
    const totalDebt = currSnap.liabilitiesTotal;
    let projectionData = null;

    let projectionLabel = "";
    if (isFuture) {
        projectionLabel = "<br><span class='projection-tag'>(Proyección basada en promedio)</span>";
        
        const regularTrans = financeData.transactions.filter(t => t.type !== 'transfer' && !t.isAdjustment);
        const uniqueMonths = new Set(regularTrans.map(t => t.monthId));
        const monthsCount = uniqueMonths.size || 1;
        
        const totalInc = round2(regularTrans.filter(t => t.type === 'income').reduce((s, t) => s + round2(t.amount), 0));
        const totalExp = round2(regularTrans.filter(t => t.type === 'expense').reduce((s, t) => s + round2(t.amount), 0));
        
        const avgIncome = round2(totalInc / monthsCount);
        const avgExpense = round2(totalExp / monthsCount);
        const avgCashFlow = round2(avgIncome - avgExpense);

        monthlyIncome = avgIncome; 
        monthlyExpense = avgExpense;
        
        let monthsDiff = (viewDate.getFullYear() - currentDate.getFullYear()) * 12 + (viewDate.getMonth() - currentDate.getMonth());
        let currentRealLiquidity = cumulativeLiquidity;
        cumulativeLiquidity = round2(currentRealLiquidity + (avgCashFlow * monthsDiff));

        projectionData = { monthsCount, avgIncome, avgExpense, avgCashFlow, monthsDiff, currentLiquidity: currentRealLiquidity, projectedLiquidity: cumulativeLiquidity };
    }

    const cashFlow = round2(monthlyIncome - monthlyExpense);
    const netWorth = currSnap.netWorth;
    const debtCapacity = round2((monthlyIncome * 0.3) - monthlyExpense); 

    if(document.getElementById('net-worth')) document.getElementById('net-worth').innerText = formatMoney(netWorth);
    if(document.getElementById('cash-flow')) document.getElementById('cash-flow').innerHTML = formatMoney(cashFlow) + projectionLabel;
    if(document.getElementById('total-debt')) document.getElementById('total-debt').innerText = formatMoney(totalDebt);
    if(document.getElementById('liquidity')) document.getElementById('liquidity').innerText = formatMoney(cumulativeLiquidity);
    if(document.getElementById('debt-capacity')) document.getElementById('debt-capacity').innerText = formatMoney(debtCapacity > 0 ? debtCapacity : 0);

    const deltaBadge = document.getElementById('networth-delta-badge');
    if(deltaBadge) {
        const diffNW = round2(netWorth - prevSnap.netWorth);
        if (prevSnap.netWorth !== 0) {
            const pct = ((diffNW / Math.abs(prevSnap.netWorth)) * 100).toFixed(1);
            deltaBadge.innerText = `${diffNW >= 0 ? '+' : ''}${pct}% vs ${getShortMonthLabel(prevDate)}`;
            deltaBadge.className = `delta-badge ${diffNW >= 0 ? 'up' : 'down'}`;
        } else {
            deltaBadge.innerText = `${diffNW >= 0 ? '+' : ''}${formatCompact(diffNW)} vs ${getShortMonthLabel(prevDate)}`;
            deltaBadge.className = `delta-badge ${diffNW >= 0 ? 'up' : 'down'}`;
        }
    }

    const healthStatus = document.getElementById('health-status');
    if(healthStatus) {
        if (netWorth > 0 && cashFlow > 0) { healthStatus.innerText = "Excelente 🟢"; healthStatus.style.color = "#10b981"; } 
        else if (cashFlow < 0 || totalDebt > cumulativeLiquidity) { healthStatus.innerText = "Alerta: Revisar Flujo/Deuda 🔴"; healthStatus.style.color = "#ff3b30"; } 
        else { healthStatus.innerText = "Estable 🟡"; healthStatus.style.color = "#eab308"; }
    }

    renderBalanceSheet(currentBalances, netWorth);
    renderDashboardCardsSummary(currentBalances);
    renderDashboardDebtsSummary(currentBalances);
    renderHistory(viewMonthId, isFuture, projectionData);

    renderNetWorthChart(viewDate, prevDate, prevSnap, currSnap);
    renderCashFlowChart(viewDate, prevDate);
    renderDailySummary();
    renderBudgetDonut(viewMonthId, monthlyExpense);
    
    renderCalendar(viewDate, 'calendar-days-grid');
    renderCalendar(viewDate, 'header-cal-grid');
    
    let positiveAssetTotal = 0; let positiveLoansTotal = 0;
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
    if (bModal && !bModal.classList.contains('hidden')) {
        renderBudgetView();
    }
};

// --- CALENDARIO INTERACTIVO (HEADER) Y SALTOS RÁPIDOS ---
document.getElementById('prev-month')?.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    selectedCalendarDay = null; updateDashboard();
});
document.getElementById('next-month')?.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    selectedCalendarDay = null; updateDashboard();
});

const triggerBtn = document.getElementById('calendar-trigger-btn');
const popover = document.getElementById('quick-calendar-popover');
if (triggerBtn && popover) {
    triggerBtn.addEventListener('click', (e) => { e.stopPropagation(); popover.classList.toggle('hidden'); });
    document.addEventListener('click', (e) => {
        if (!popover.classList.contains('hidden') && !popover.contains(e.target) && !triggerBtn.contains(e.target)) {
            popover.classList.add('hidden');
        }
    });
}

const goToday = () => {
    viewDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    selectedCalendarDay = null; 
    if(popover) popover.classList.add('hidden'); 
    updateDashboard();
};
document.getElementById('today-btn')?.addEventListener('click', goToday);
document.getElementById('popover-today-btn')?.addEventListener('click', goToday);

document.getElementById('quick-month-input')?.addEventListener('change', (e) => {
    if (e.target.value) {
        const [y, m] = e.target.value.split('-');
        viewDate = new Date(y, m - 1, 1);
        selectedCalendarDay = null; 
        if(popover) popover.classList.add('hidden'); 
        updateDashboard();
    }
});

document.querySelectorAll('.quick-jump-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const offset = parseInt(btn.getAttribute('data-offset'));
        viewDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        selectedCalendarDay = null; 
        if(popover) popover.classList.add('hidden'); 
        updateDashboard();
    });
});

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
        let classes = `cal-day ${dStr === todayStr ? 'today' : ''} ${selectedCalendarDay === dStr ? 'selected' : ''}`;
        let dots = '';
        if (act) {
            if (act.inc) dots += `<span class="cal-dot" style="background:#10b981;"></span>`;
            if (act.exp) dots += `<span class="cal-dot" style="background:#ff3b30;"></span>`;
            if (act.trf) dots += `<span class="cal-dot" style="background:#007aff;"></span>`;
        }
        const cell = document.createElement('div');
        cell.className = classes; cell.innerHTML = `<span>${day}</span><div class="cal-dots">${dots}</div>`;
        cell.onclick = () => { 
            selectedCalendarDay = (selectedCalendarDay === dStr) ? null : dStr; 
            closeAllModals(); 
            if(popover) popover.classList.add('hidden'); 
            updateDashboard(); 
        };
        grid.appendChild(cell);
    }
    
    const clearBtn = document.getElementById('clear-day-filter-btn');
    if (clearBtn) {
        if (selectedCalendarDay) clearBtn.classList.remove('hidden'); else clearBtn.classList.add('hidden');
    }
};

document.getElementById('clear-day-filter-btn')?.addEventListener('click', () => {
    selectedCalendarDay = null; updateDashboard();
});

// --- RENDER DE MÓDULOS DEL DASHBOARD ---
const renderBalanceSheet = (balances, netWorth) => {
    const list = document.getElementById('balance-sheet-list');
    const dateBadge = document.getElementById('balance-sheet-date');
    const totalEl = document.getElementById('balance-sheet-total');
    if(!list || !dateBadge || !totalEl) return;

    dateBadge.innerText = currentDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    totalEl.innerText = formatMoney(netWorth);
    totalEl.className = netWorth >= 0 ? 'positive' : 'negative';

    list.innerHTML = '';
    financeData.customAccounts.forEach(acc => {
        const bal = round2(balances[acc.id] || 0);
        const isLiab = isLiabilityCategory(acc.category);
        const displayVal = isLiab ? -bal : bal;
        const colorClass = isLiab ? (bal > 0 ? 'negative' : '') : (bal > 0 ? 'positive' : '');
        const icon = acc.category === 'credit_card' ? '💳' : (acc.category === 'debt' ? '💸' : '💵');

        const row = document.createElement('div');
        row.className = 'bs-row';
        row.onclick = () => openAccountDetail(acc.id, 'home');
        row.innerHTML = `<span>${icon} ${acc.name}</span><strong class="${colorClass}">${formatMoney(displayVal)}</strong>`;
        list.appendChild(row);
    });
};

const renderDashboardCardsSummary = (balances) => {
    const widget = document.getElementById('dashboard-tc-widget');
    const summaryStrip = document.getElementById('dashboard-tc-summary');
    const healthBadge = document.getElementById('dashboard-tc-health');
    const list = document.getElementById('dashboard-tc-list');
    if(!widget || !summaryStrip || !healthBadge || !list) return;

    const cards = financeData.customAccounts.filter(a => a.category === 'credit_card');

    if (cards.length === 0) { widget.classList.add('hidden'); return; }
    widget.classList.remove('hidden'); list.innerHTML = '';

    let totalCardsDebt = 0, totalCardsLimit = 0, scheduledNextStatement = 0, hasDeferredItems = false;

    cards.forEach(card => {
        const debt = Math.max(0, round2(balances[card.id] || 0));
        const limit = round2(card.creditLimit || 0);
        totalCardsDebt = round2(totalCardsDebt + debt);
        totalCardsLimit = round2(totalCardsLimit + limit);

        const pendingItems = getPendingCardPurchases(card.id);
        if (pendingItems.length > 0) {
            hasDeferredItems = true;
            pendingItems.forEach(p => { scheduledNextStatement = round2(scheduledNextStatement + p.nextQuota); });
        }
    });

    const totalCardsAvailable = Math.max(0, round2(totalCardsLimit - totalCardsDebt));
    const displayNextQuota = hasDeferredItems ? Math.min(totalCardsDebt, scheduledNextStatement) : round2(totalCardsDebt / 12);
    const quotaLabel = hasDeferredItems ? 'Cuota Próximo Corte' : 'Cuota Est. (1/12)';
    const utilPct = totalCardsLimit > 0 ? (totalCardsDebt / totalCardsLimit) * 100 : 0;

    if (utilPct <= 30) { healthBadge.innerText = `Saludable 🟢 (${utilPct.toFixed(0)}%)`; healthBadge.className = 'widget-badge good'; }
    else if (utilPct <= 70) { healthBadge.innerText = `Moderado 🟡 (${utilPct.toFixed(0)}%)`; healthBadge.className = 'widget-badge warn'; }
    else { healthBadge.innerText = `Crítico 🔴 (${utilPct.toFixed(0)}%)`; healthBadge.className = 'widget-badge danger'; }

    summaryStrip.innerHTML = `<div class="dash-strip-item"><small>Deuda Total TC</small><strong class="negative">${formatMoney(totalCardsDebt)}</strong></div><div class="dash-strip-item"><small>Cupo Disponible</small><strong class="positive">${formatMoney(totalCardsAvailable)}</strong></div><div class="dash-strip-item"><small>${quotaLabel}</small><strong>${formatMoney(displayNextQuota)}</strong></div>`;

    const todayDay = currentDate.getDate();
    cards.forEach(card => {
        const debt = round2(balances[card.id] || 0), limit = round2(card.creditLimit || 0);
        const pct = limit > 0 ? Math.min(100, Math.max(0, (debt / limit) * 100)) : 0;
        const barColor = pct > 80 ? 'var(--negative)' : (pct > 50 ? '#f59e0b' : 'var(--positive)');
        const cutoff = card.cutoffDay || 15;
        const cyclePos = Math.min(98, Math.max(2, (todayDay / 30) * 100));
        const pendingCount = getPendingCardPurchases(card.id).length;
        const zeroTag = card.zeroInterestMax > 0 ? ` • ✨ 0% hasta ${card.zeroInterestMax}c` : '';

        const row = document.createElement('div');
        row.className = 'dash-tc-row';
        row.onclick = () => openAccountDetail(card.id, 'home');
        row.innerHTML = `<div class="dash-tc-top"><span>💳 ${card.name} ${pendingCount > 0 ? `<small style="color:var(--accent); font-weight:600;">(${pendingCount} diff.)</small>` : ''}</span><span>${formatMoney(debt)} <small style="color:var(--text-muted); font-weight:500;">/ ${formatMoney(limit)}</small></span></div><div class="pace-bar-track" style="height: 8px;"><div class="pace-bar-fill" style="width: ${pct}%; background-color: ${barColor};"></div><div class="pace-marker" style="left: ${cyclePos}%; height: 14px; top: -3px;"></div></div><div class="dash-tc-sub"><span>Disp: <b style="color:var(--positive);">${formatMoney(limit - debt)}</b>${zeroTag}</span><span>Corte: ${cutoff} • Pago: ${card.paymentDay || '-'}</span></div>`;
        list.appendChild(row);
    });
};

const renderDashboardDebtsSummary = (balances) => {
    const widget = document.getElementById('dashboard-debts-widget');
    const summaryStrip = document.getElementById('dashboard-debts-summary');
    const badge = document.getElementById('dashboard-debts-badge');
    const list = document.getElementById('dashboard-debts-list');
    if(!widget || !summaryStrip || !badge || !list) return;

    const debts = financeData.customAccounts.filter(a => a.category === 'debt');

    if (debts.length === 0) { widget.classList.add('hidden'); return; }
    widget.classList.remove('hidden'); list.innerHTML = '';

    let totalDebtsBalance = 0, totalOriginalDebts = 0, totalMonthlyQuotas = 0;

    debts.forEach(debt => {
        const bal = Math.max(0, round2(balances[debt.id] || 0));
        const orig = round2(debt.debtOriginal || bal);
        const totQ = debt.debtTotalQuotes || 1;
        const rate = debt.debtRate || 0, rateType = debt.debtRateType || 'monthly';
        let monthlyPay = round2(debt.debtMonthlyPayment || 0);

        if (monthlyPay === 0 && orig > 0 && totQ > 0) monthlyPay = calculateAmortization(orig, totQ, rate, rateType).payment;
        totalDebtsBalance = round2(totalDebtsBalance + bal);
        totalOriginalDebts = round2(totalOriginalDebts + orig);
        if (bal > 0) totalMonthlyQuotas = round2(totalMonthlyQuotas + monthlyPay);
    });

    const amortizedTotal = Math.max(0, round2(totalOriginalDebts - totalDebtsBalance));
    const amortPct = totalOriginalDebts > 0 ? Math.min(100, (amortizedTotal / totalOriginalDebts) * 100) : 0;
    badge.innerText = `${debts.length} ${debts.length === 1 ? 'crédito' : 'créditos'}`;
    summaryStrip.innerHTML = `<div class="dash-strip-item"><small>Deuda Vigente</small><strong class="negative">${formatMoney(totalDebtsBalance)}</strong></div><div class="dash-strip-item"><small>Total Cuotas / Mes</small><strong style="color: var(--accent);">${formatMoney(totalMonthlyQuotas)}</strong></div><div class="dash-strip-item"><small>Amortizado</small><strong class="positive">${amortPct.toFixed(0)}%</strong></div>`;

    debts.forEach(debt => {
        const bal = Math.max(0, round2(balances[debt.id] || 0));
        const orig = round2(debt.debtOriginal || bal);
        const totQ = debt.debtTotalQuotes || 1, paidQ = debt.debtPaidQuotes || 0, rate = debt.debtRate || 0, rateType = debt.debtRateType || 'monthly';
        let monthlyPay = round2(debt.debtMonthlyPayment || 0);
        if (monthlyPay === 0 && orig > 0 && totQ > 0) monthlyPay = calculateAmortization(orig, totQ, rate, rateType).payment;

        const itemAmort = Math.max(0, round2(orig - bal));
        const itemPct = orig > 0 ? Math.min(100, Math.max(0, (itemAmort / orig) * 100)) : 0;

        const row = document.createElement('div');
        row.className = 'dash-tc-row';
        row.onclick = () => openAccountDetail(debt.id, 'home');
        row.innerHTML = `<div class="dash-tc-top"><span>💸 ${debt.name}</span><span>${formatMoney(bal)} <small style="color:var(--text-muted); font-weight:500;">/ ${formatMoney(orig)}</small></span></div><div class="pace-bar-track" style="height: 8px;"><div class="pace-bar-fill" style="width: ${itemPct}%; background-color: var(--positive);"></div></div><div class="dash-tc-sub"><span>Cuota: <b style="color:var(--accent);">${formatMoney(monthlyPay)}/mes</b></span><span>Cuotas: ${paidQ}/${totQ} • Tasa: ${rate}% ${rateType === 'monthly' ? 'M.V.' : 'E.A.'}</span></div>`;
        list.appendChild(row);
    });
};

const renderNetWorthChart = (baseDate, prevDate, prevSnap, currSnap) => {
    const chartContainer = document.getElementById('networth-chart-container');
    if(!chartContainer) return;

    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
        const snap = i === 0 ? currSnap : computeBalancesUpTo(getMonthId(d));
        months.push({ label: getShortMonthLabel(d), assets: snap.assetsTotal + snap.fixedAssetsTotal, liabilities: -snap.liabilitiesTotal, net: snap.netWorth });
    }

    const allVals = months.flatMap(m => [m.assets, m.liabilities, m.net, 0]);
    const maxVal = Math.max(...allVals, 1000); const minVal = Math.min(...allVals, -1000); const range = (maxVal - minVal) || 1;
    const W = 340, H = 135, padL = 44, padR = 12, padT = 14, padB = 22;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const getX = (idx) => padL + (idx / (months.length - 1)) * plotW;
    const getY = (val) => padT + ((maxVal - val) / range) * plotH;
    const zeroY = getY(0);

    const ptsAssets = months.map((m, i) => `${getX(i)},${getY(m.assets)}`).join(' ');
    const ptsLiab = months.map((m, i) => `${getX(i)},${getY(m.liabilities)}`).join(' ');
    const ptsNet = months.map((m, i) => `${getX(i)},${getY(m.net)}`).join(' ');
    const areaAssets = `${getX(0)},${zeroY} ${ptsAssets} ${getX(months.length - 1)},${zeroY}`;
    const areaLiab = `${getX(0)},${zeroY} ${ptsLiab} ${getX(months.length - 1)},${zeroY}`;

    let svg = `<svg viewBox="0 0 ${W} ${H}">
        <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="rgba(148,163,184,0.18)" stroke-dasharray="3,3"/>
        <line x1="${padL}" y1="${zeroY}" x2="${W - padR}" y2="${zeroY}" stroke="rgba(148,163,184,0.45)" stroke-width="1"/>
        <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="rgba(148,163,184,0.18)" stroke-dasharray="3,3"/>
        <text x="${padL - 5}" y="${padT + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompact(maxVal)}</text>
        <text x="${padL - 5}" y="${zeroY + 3}" text-anchor="end" font-size="9" fill="#94a3b8">$0</text>
        <text x="${padL - 5}" y="${H - padB}" text-anchor="end" font-size="9" fill="#94a3b8">${formatCompact(minVal)}</text>
        <polygon points="${areaAssets}" fill="rgba(16, 185, 129, 0.14)"/><polygon points="${areaLiab}" fill="rgba(255, 59, 48, 0.14)"/>
        <polyline fill="none" stroke="#10b981" stroke-width="2" points="${ptsAssets}"/>
        <polyline fill="none" stroke="#ff3b30" stroke-width="2" points="${ptsLiab}"/>
        <polyline fill="none" stroke="#007aff" stroke-width="2.2" points="${ptsNet}"/>`;

    months.forEach((m, i) => {
        const x = getX(i);
        svg += `<circle cx="${x}" cy="${getY(m.assets)}" r="3" fill="#10b981"/><circle cx="${x}" cy="${getY(m.liabilities)}" r="3" fill="#ff3b30"/><circle cx="${x}" cy="${getY(m.net)}" r="3.2" fill="#007aff"/><text x="${x}" y="${H - 5}" text-anchor="middle" font-size="9.5" fill="#94a3b8">${m.label}</text>`;
    });
    svg += `</svg>`;
    chartContainer.innerHTML = svg;

    if(document.getElementById('nw-prev-col')) document.getElementById('nw-prev-col').innerText = getShortMonthLabel(prevDate);
    if(document.getElementById('nw-curr-col')) document.getElementById('nw-curr-col').innerText = getShortMonthLabel(baseDate);
    if(document.getElementById('nw-comp-body')) document.getElementById('nw-comp-body').innerHTML = `
        <tr><td><i class="dot" style="background:#10b981;"></i>Activos</td><td>${formatMoney(prevSnap.assetsTotal + prevSnap.fixedAssetsTotal)}</td><td class="positive">${formatMoney(currSnap.assetsTotal + currSnap.fixedAssetsTotal)}</td></tr>
        <tr><td><i class="dot" style="background:#ff3b30;"></i>Pasivos</td><td>${formatMoney(-prevSnap.liabilitiesTotal)}</td><td class="negative">${formatMoney(-currSnap.liabilitiesTotal)}</td></tr>
        <tr><td><i class="dot" style="background:#007aff;"></i>Patrimonio</td><td>${formatMoney(prevSnap.netWorth)}</td><td>${formatMoney(currSnap.netWorth)}</td></tr>
    `;
};

const renderCashFlowChart = (baseDate, prevDate) => {
    const chartContainer = document.getElementById('cashflow-chart-container');
    if(!chartContainer) return;

    const months = [];
    for (let i = 2; i >= 0; i--) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
        const flow = getMonthlyFlow(getMonthId(d));
        months.push({ label: d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }), inc: flow.inc, exp: flow.exp, net: flow.net });
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
        const hInc = (m.inc / maxVal) * plotH, hExp = (m.exp / maxVal) * plotH;
        svg += `<rect x="${centerX - barW - 2}" y="${baseY - hInc}" width="${barW}" height="${Math.max(2, hInc)}" rx="4" fill="#10b981"/>
            <rect x="${centerX + 2}" y="${baseY - hExp}" width="${barW}" height="${Math.max(2, hExp)}" rx="4" fill="#ff3b30"/>
            <text x="${centerX}" y="${H - 5}" text-anchor="middle" font-size="9.5" fill="#94a3b8">${m.label}</text>`;
    });
    svg += `</svg>`;
    chartContainer.innerHTML = svg;

    if(document.getElementById('cf-prev-col')) document.getElementById('cf-prev-col').innerText = getShortMonthLabel(prevDate);
    if(document.getElementById('cf-curr-col')) document.getElementById('cf-curr-col').innerText = getShortMonthLabel(baseDate);
    if(document.getElementById('cf-comp-body')) document.getElementById('cf-comp-body').innerHTML = `
        <tr><td><i class="dot" style="background:#10b981;"></i>Entradas</td><td>${formatMoney(months[1].inc)}</td><td class="positive">${formatMoney(months[2].inc)}</td></tr>
        <tr><td><i class="dot" style="background:#ff3b30;"></i>Salidas</td><td>${formatMoney(-months[1].exp)}</td><td class="negative">${formatMoney(-months[2].exp)}</td></tr>
        <tr><td>Flujo neto</td><td>${formatMoney(months[1].net)}</td><td class="${months[2].net >= 0 ? 'positive' : 'negative'}">${formatMoney(months[2].net)}</td></tr>
    `;
};

const renderDailySummary = () => {
    const chartContainer = document.getElementById('daily-chart-container');
    if(!chartContainer) return;

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i);
        const dayStr = d.toLocaleDateString('en-CA');
        let inc = 0, exp = 0;
        financeData.transactions.forEach(t => {
            if (!t.isAdjustment && t.type !== 'transfer' && new Date(t.id).toLocaleDateString('en-CA') === dayStr) {
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
        const hInc = (d.inc / maxVal) * (H - padT - padB), hExp = (d.exp / maxVal) * (H - padT - padB);
        if (d.inc > 0) svg += `<rect x="${cx - barW - 1}" y="${baseY - hInc}" width="${barW}" height="${Math.max(3, hInc)}" rx="3" fill="#10b981"/>`;
        if (d.exp > 0) {
            svg += `<rect x="${cx + 1}" y="${baseY - hExp}" width="${barW}" height="${Math.max(3, hExp)}" rx="3" fill="#ff3b30"/>`;
            svg += `<text x="${cx}" y="${Math.max(10, baseY - Math.max(hInc, hExp) - 3)}" text-anchor="middle" font-size="8" fill="#94a3b8">${formatCompact(d.exp)}</text>`;
        }
        svg += `<text x="${cx}" y="${H - 4}" text-anchor="middle" font-size="9.5" fill="#94a3b8">${d.label}</text>`;
    });
    svg += `</svg>`;
    chartContainer.innerHTML = svg;

    let sum30 = 0; const thirtyDaysAgo = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 30).getTime();
    financeData.transactions.forEach(t => {
        if (!t.isAdjustment && t.type !== 'transfer' && t.id >= thirtyDaysAgo && t.id <= Date.now()) {
            sum30 = round2(sum30 + (t.type === 'income' ? round2(t.amount) : -round2(t.amount)));
        }
    });

    const avg7 = round2(days.reduce((s, d) => round2(s + d.net), 0) / 7);
    const avg30 = round2(sum30 / 30);
    
    if(document.getElementById('avg-7-days')) {
        document.getElementById('avg-7-days').innerText = formatMoney(avg7);
        document.getElementById('avg-7-days').className = avg7 >= 0 ? 'positive' : 'negative';
    }
    if(document.getElementById('avg-30-days')) {
        document.getElementById('avg-30-days').innerText = formatMoney(avg30);
        document.getElementById('avg-30-days').className = avg30 >= 0 ? 'positive' : 'negative';
    }
};

const renderBudgetDonut = (viewMonthId, totalMonthlyExpense) => {
    const donutBox = document.getElementById('budget-donut-container');
    const legendList = document.getElementById('budget-legend-list');
    if(!donutBox || !legendList) return;
    
    const totalsByCat = {};
    financeData.transactions.filter(t => t.monthId === viewMonthId && t.type === 'expense' && !t.isAdjustment).forEach(t => {
        const cat = t.category || '📦 Otros Gastos';
        totalsByCat[cat] = round2((totalsByCat[cat] || 0) + round2(t.amount));
    });

    const sorted = Object.entries(totalsByCat).sort((a, b) => b[1] - a[1]);
    legendList.innerHTML = '';

    if (sorted.length === 0 || totalMonthlyExpense <= 0) {
        donutBox.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" fill="none" stroke="rgba(148,163,184,0.25)" stroke-width="14"/><text x="50" y="53" text-anchor="middle" font-size="10" fill="#94a3b8">Sin gastos</text></svg>`;
        legendList.innerHTML = `<span style="color: var(--text-muted); font-size: 11px;">Registra gastos este mes para ver su distribución.</span>`;
    } else {
        const R = 36, C = 2 * Math.PI * R; let offset = 0;
        let svg = `<svg viewBox="0 0 100 100" style="transform: rotate(-90deg);">`;
        
        sorted.forEach(([catName, amt], idx) => {
            const pct = (amt / totalMonthlyExpense) * 100, dash = (pct / 100) * C, color = categoryColors[idx % categoryColors.length];
            svg += `<circle cx="50" cy="50" r="${R}" fill="none" stroke="${color}" stroke-width="15" stroke-dasharray="${dash} ${C}" stroke-dashoffset="${-offset}"/>`;
            offset += dash;
            if (idx < 5) legendList.innerHTML += `<div class="donut-legend-item"><div class="donut-legend-left"><i class="dot" style="background:${color};"></i><span>${catName.split(' ').slice(1).join(' ') || catName}</span></div><strong>${pct.toFixed(0)}%</strong></div>`;
        });
        svg += `</svg>`; donutBox.innerHTML = svg;
    }
};

const renderHistory = (viewMonthId, isFuture, projectionData) => {
    const list = document.getElementById('history-list');
    const titleEl = document.getElementById('history-title');
    const countBadge = document.getElementById('history-count-badge');
    if(!list || !titleEl || !countBadge) return;

    list.innerHTML = '';

    if (isFuture && projectionData) {
        titleEl.innerText = "Desglose Simulación Futura"; countBadge.innerText = "Proyección";
        list.innerHTML = `<li class="history-item projection-box"><div><strong>📊 ¿Cómo se calcula?</strong><b>Promedio mensual:</b><br>• Ingresos: ${formatMoney(projectionData.avgIncome)}<br>• Gastos: ${formatMoney(projectionData.avgExpense)}<br>• Flujo Neto: <b>${formatMoney(projectionData.avgCashFlow)}</b><br><br><b>A ${projectionData.monthsDiff} meses:</b> Liquidez actual de ${formatMoney(projectionData.currentLiquidity)} + (${formatMoney(projectionData.avgCashFlow)} × ${projectionData.monthsDiff}) = <b>${formatMoney(projectionData.projectedLiquidity)}</b></div></li>`;
        return;
    }

    let filtered = financeData.transactions.filter(t => t.monthId === viewMonthId);
    if (selectedCalendarDay) {
        titleEl.innerText = `Mov. del ${selectedCalendarDay}`;
        filtered = filtered.filter(t => new Date(t.id).toLocaleDateString('en-CA') === selectedCalendarDay);
    } else {
        titleEl.innerText = "Movimientos del mes";
    }

    if (activeHistoryFilter !== 'all') filtered = filtered.filter(t => t.type === activeHistoryFilter);
    filtered.sort((a, b) => b.id - a.id);
    countBadge.innerText = filtered.length;

    if (filtered.length === 0) { list.innerHTML = '<li class="history-item"><div class="history-info"><small>No hay movimientos</small></div></li>'; return; }

    filtered.forEach(t => {
        const li = document.createElement('li'); li.className = 'history-item';
        li.onclick = () => openEditModal(t.id);
        
        let sign = '', colorClass = '', accountText = t.account || '';
        const subText = t.subcategory && t.subcategory !== 'General' ? ` (${t.subcategory})` : '';
        const catBadge = t.category && t.type !== 'transfer' ? ` • ${t.category}${subText}` : '';
        
        let extraBadge = '';
        if (t.type === 'expense' && t.installments && t.installments > 1) {
            const rateLabel = (t.zeroInterest || !t.rate) ? '0% int.' : `${t.rate}%`;
            extraBadge = ` • ${t.paidInstallments || 0}/${t.installments}c (${rateLabel})`;
        } else if (t.type === 'transfer' && t.paymentMode === 'extraordinary') {
            extraBadge = ` • 🚀 Abono Extra`;
        }

        if (t.type === 'income') { sign = '+'; colorClass = 'positive'; } 
        else if (t.type === 'expense') { sign = '-'; colorClass = 'negative'; } 
        else if (t.type === 'transfer') { sign = '🔄'; colorClass = ''; accountText = `${t.account} ➔ ${t.toAccount}`; }
        
        li.innerHTML = `<div class="history-info"><strong>${t.description}</strong><small>${t.date} • <i>${accountText}</i>${catBadge}${extraBadge}</small></div><div class="history-amount ${colorClass}">${sign} ${formatMoney(t.amount)}</div>`;
        list.appendChild(li);
    });
};

const renderAccountsBreakdown = (balances, totalLiquidity) => {
    if(document.getElementById('accounts-total-liquidity')) document.getElementById('accounts-total-liquidity').innerText = formatMoney(totalLiquidity);
    const combinedBar = document.getElementById('combined-bar'), combinedLegend = document.getElementById('combined-legend'), list = document.getElementById('accounts-breakdown-list');
    if(!combinedBar || !combinedLegend || !list) return;

    combinedBar.innerHTML = ''; combinedLegend.innerHTML = ''; list.innerHTML = '';
    
    financeData.customAccounts.filter(a => a.category === 'asset').forEach((acc, index) => {
        const balance = round2(balances[acc.id] || 0);
        let percentage = totalLiquidity > 0 ? (balance / totalLiquidity) * 100 : 0; if (percentage < 0) percentage = 0; 
        const color = assetColors[index % assetColors.length];
        
        if (percentage > 0) combinedBar.innerHTML += `<div class="segment" style="width: ${percentage}%; background-color: ${color};"></div>`;
        combinedLegend.innerHTML += `<div class="legend-item"><span class="dot" style="background-color: ${color};"></span><span>${acc.name} ${percentage.toFixed(0)}%</span></div>`;
        
        let deleteBtnHTML = acc.id !== 'Efectivo' ? `<button type="button" onclick="event.stopPropagation(); deleteAccount('${acc.id}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); cursor:pointer; font-weight:bold; padding:5px 10px; border-radius:6px; margin-left:10px;">X</button>` : '';

        list.innerHTML += `<div class="acc-list-item" onclick="openAccountDetail('${acc.id}', 'asset')">
                <div class="acc-list-name"><span class="dot" style="background-color: ${color};"></span>${acc.name}</div>
                <div style="display:flex; align-items:center;"><span class="acc-list-balance">${formatMoney(balance)}</span>${deleteBtnHTML}<span style="color: var(--text-muted); margin-left: 8px; font-size: 14px;">›</span></div>
            </div>`;
    });
};

const renderCardsBreakdown = (balances) => {
    const cards = financeData.customAccounts.filter(a => a.category === 'credit_card');
    let totalCardsDebt = 0, totalCardsLimit = 0;

    cards.forEach(c => {
        const debt = Math.max(0, round2(balances[c.id] || 0)); const limit = round2(c.creditLimit || 0);
        totalCardsDebt = round2(totalCardsDebt + debt); totalCardsLimit = round2(totalCardsLimit + limit);
    });

    if(document.getElementById('cards-total-debt')) document.getElementById('cards-total-debt').innerText = formatMoney(totalCardsDebt);
    if(document.getElementById('cards-total-available')) document.getElementById('cards-total-available').innerText = formatMoney(Math.max(0, round2(totalCardsLimit - totalCardsDebt)));

    const combinedBar = document.getElementById('cards-combined-bar'), combinedLegend = document.getElementById('cards-combined-legend'), list = document.getElementById('cards-breakdown-list');
    if(!combinedBar || !combinedLegend || !list) return;

    combinedBar.innerHTML = ''; combinedLegend.innerHTML = ''; list.innerHTML = '';

    if (cards.length === 0) { list.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 10px 0;">No tienes tarjetas de crédito.</p>'; return; }

    cards.forEach((card, index) => {
        const debt = round2(balances[card.id] || 0), limit = round2(card.creditLimit || 0), available = round2(limit - debt), color = cardColors[index % cardColors.length];
        let debtShare = totalCardsDebt > 0 && debt > 0 ? (debt / totalCardsDebt) * 100 : 0;
        if (debtShare > 0) combinedBar.innerHTML += `<div class="segment" style="width: ${debtShare}%; background-color: ${color};"></div>`;
        combinedLegend.innerHTML += `<div class="legend-item"><span class="dot" style="background-color: ${color};"></span><span>${card.name} ${debtShare.toFixed(0)}%</span></div>`;

        let usagePercent = limit > 0 ? Math.min(100, Math.max(0, (debt / limit) * 100)) : 0;
        let barColor = usagePercent > 80 ? 'var(--negative)' : (usagePercent > 50 ? '#f59e0b' : 'var(--positive)');
        const rateInfo = card.rate > 0 ? ` • Tasa: ${card.rate}% ${card.rateType === 'annual' ? 'E.A.' : 'M.V.'}` : '';
        const zeroInfo = card.zeroInterestMax > 0 ? ` • ✨ 0% hasta ${card.zeroInterestMax}c` : '';

        list.innerHTML += `
            <div class="tc-card-item" onclick="openAccountDetail('${card.id}', 'credit_card')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="acc-list-name"><span class="dot" style="background-color: ${color};"></span><span>${card.name}</span></div>
                    <div style="display: flex; align-items: center;"><span class="acc-list-balance negative">${formatMoney(debt)}</span><button type="button" onclick="event.stopPropagation(); deleteAccount('${card.id}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); cursor:pointer; font-weight:bold; padding:4px 8px; border-radius:6px; margin-left:8px; font-size: 11px;">X</button><span style="color: var(--text-muted); margin-left: 6px; font-size: 14px;">›</span></div>
                </div>
                <div class="tc-mini-bar"><div class="tc-mini-bar-fill" style="width: ${usagePercent}%; background-color: ${barColor};"></div></div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);"><span>Cupo: ${formatMoney(limit)}</span><span style="color: ${available >= 0 ? 'var(--positive)' : 'var(--negative)'}; font-weight: 600;">Disp: ${formatMoney(available)}</span></div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">📅 Corte: ${card.cutoffDay || '-'} • Pago: ${card.paymentDay || '-'}${rateInfo}${zeroInfo}</div>
            </div>`;
    });
};

const renderDebtsBreakdown = (balances, totalLoansDebt) => {
    const amountEl = document.getElementById('debts-total-amount');
    const combinedBar = document.getElementById('debts-combined-bar');
    const combinedLegend = document.getElementById('debts-combined-legend');
    const list = document.getElementById('debts-breakdown-list');
    
    if(!amountEl || !combinedBar || !combinedLegend || !list) return;

    amountEl.innerText = formatMoney(totalLoansDebt);
    combinedBar.innerHTML = ''; combinedLegend.innerHTML = ''; list.innerHTML = '';
    
    const debts = financeData.customAccounts.filter(a => a.category === 'debt');
    if (debts.length === 0) { list.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 10px 0;">No tienes préstamos u otras deudas.</p>'; return; }

    debts.forEach((acc, index) => {
        const balance = round2(balances[acc.id] || 0); let percentage = totalLoansDebt > 0 ? (balance / totalLoansDebt) * 100 : 0;
        const color = debtColors[index % debtColors.length];
        const monthlyPay = round2(acc.debtMonthlyPayment || 0);
        const totQ = acc.debtTotalQuotes || 1;
        const paidQ = acc.debtPaidQuotes || 0;
        
        if (percentage > 0) combinedBar.innerHTML += `<div class="segment" style="width: ${percentage}%; background-color: ${color};"></div>`;
        combinedLegend.innerHTML += `<div class="legend-item"><span class="dot" style="background-color: ${color};"></span><span>${acc.name} ${percentage.toFixed(0)}%</span></div>`;
        
        list.innerHTML += `<div class="acc-list-item" onclick="openAccountDetail('${acc.id}', 'debt')">
                <div class="acc-list-name">
                    <span class="dot" style="background-color: ${color};"></span>
                    <div>
                        <span>${acc.name}</span>
                        <small style="display:block; font-size:11px; color:var(--text-muted); font-weight:500;">Cuota: ${formatMoney(monthlyPay)} • ${paidQ}/${totQ} cuotas</small>
                    </div>
                </div>
                <div style="display:flex; align-items:center;"><span class="acc-list-balance negative">${formatMoney(balance)}</span><button type="button" onclick="event.stopPropagation(); deleteAccount('${acc.id}')" style="background:rgba(255,59,48,0.15); border:none; color:var(--negative); cursor:pointer; font-weight:bold; padding:5px 10px; border-radius:6px; margin-left:10px;">X</button><span style="color: var(--text-muted); margin-left: 8px; font-size: 14px;">›</span></div>
            </div>`;
    });
};

const renderExpensesBreakdown = (viewMonthId) => {
    if(document.getElementById('expenses-month-badge')) document.getElementById('expenses-month-badge').innerText = formatMonthName(viewDate);
    const combinedBar = document.getElementById('expenses-combined-bar'), combinedLegend = document.getElementById('expenses-combined-legend'), list = document.getElementById('expenses-category-list');
    if(!combinedBar || !combinedLegend || !list) return;

    combinedBar.innerHTML = ''; combinedLegend.innerHTML = ''; list.innerHTML = '';

    const monthExpenses = financeData.transactions.filter(t => t.monthId === viewMonthId && t.type === 'expense' && !t.isAdjustment);
    const totalSpent = round2(monthExpenses.reduce((sum, t) => sum + round2(t.amount), 0));
    if(document.getElementById('expenses-total-amount')) document.getElementById('expenses-total-amount').innerText = formatMoney(totalSpent);

    if (totalSpent === 0) { list.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 10px 0;">No hay gastos registrados en este mes.</p>'; return; }

    const totalsByCat = {};
    monthExpenses.forEach(t => { totalsByCat[t.category || '📦 Otros Gastos'] = round2((totalsByCat[t.category || '📦 Otros Gastos'] || 0) + round2(t.amount)); });

    Object.entries(totalsByCat).sort((a, b) => b[1] - a[1]).forEach(([catName, amount], index) => {
        const percentage = (amount / totalSpent) * 100, color = categoryColors[index % categoryColors.length];
        combinedBar.innerHTML += `<div class="segment" style="width: ${percentage}%; background-color: ${color};"></div>`;
        combinedLegend.innerHTML += `<div class="legend-item"><span class="dot" style="background-color: ${color};"></span><span>${catName.split(' ')[1] || catName} ${percentage.toFixed(0)}%</span></div>`;
        list.innerHTML += `<div class="acc-list-item" style="cursor: default;"><div class="acc-list-name"><span class="dot" style="background-color: ${color};"></span><div><span>${catName}</span><small style="display: block; color: var(--text-muted); font-size: 11px; font-weight: 500;">${percentage.toFixed(1)}% del gasto mensual</small></div></div><span class="acc-list-balance">${formatMoney(amount)}</span></div>`;
    });
};

// --- MÓDULO DE PRESUPUESTO Y METAS DINÁMICO (GASTOS E INGRESOS) ---
const renderBudgetView = () => {
    const listContainer = document.getElementById('budget-categories-list');
    if(!listContainer) return;
    listContainer.innerHTML = '';
    const viewMonthId = getMonthId(viewDate);
    
    const summaryBox = document.getElementById('budget-summary-box');
    const totalLimitEl = document.getElementById('budget-total-limit');
    const totalSpentEl = document.getElementById('budget-total-spent');
    
    const catTitle = document.getElementById('new-cat-title');
    const catBtn = document.getElementById('new-cat-submit-btn');
    const catLimitGroup = document.getElementById('new-cat-limit-group');
    const catLimitLabel = document.querySelector('#new-cat-limit-group label');

    if(summaryBox) summaryBox.classList.remove('hidden');
    if(catLimitGroup) catLimitGroup.classList.remove('hidden');

    if (currentBudgetType === 'expense') {
        if (catTitle) catTitle.innerText = 'Añadir Nuevo Sobre / Categoría';
        if (catBtn) catBtn.innerText = '+ Crear Sobre';
        if (catLimitLabel) catLimitLabel.innerText = 'Límite o Tope Mensual ($) - Opcional';
        
        if(document.querySelector('#budget-summary-box span:nth-child(1)')) document.querySelectorAll('#budget-summary-box span')[0].innerText = 'Total Presupuestado';
        if(document.querySelectorAll('#budget-summary-box span')[1]) document.querySelectorAll('#budget-summary-box span')[1].innerText = 'Total Gastado';
        
        if(totalSpentEl) { totalSpentEl.classList.add('negative'); totalSpentEl.classList.remove('positive'); }
    } else {
        if (catTitle) catTitle.innerText = 'Añadir Nueva Categoría de Ingreso';
        if (catBtn) catBtn.innerText = '+ Crear Categoría';
        if (catLimitLabel) catLimitLabel.innerText = 'Meta de Ingreso Mensual ($) - Opcional';
        
        if(document.querySelector('#budget-summary-box span:nth-child(1)')) document.querySelectorAll('#budget-summary-box span')[0].innerText = 'Total Meta de Ingresos';
        if(document.querySelectorAll('#budget-summary-box span')[1]) document.querySelectorAll('#budget-summary-box span')[1].innerText = 'Total Recibido';
        
        if(totalSpentEl) { totalSpentEl.classList.remove('negative'); totalSpentEl.classList.add('positive'); }
    }
    
    let globalLimit = 0; let globalSpent = 0;
    const categories = financeData.categories[currentBudgetType];
    const monthTransactions = financeData.transactions.filter(t => t.monthId === viewMonthId && t.type === currentBudgetType && !t.isAdjustment);
    const totalsByCat = {};
    const totalsBySubcat = {};
    
    monthTransactions.forEach(t => { 
        totalsByCat[t.category] = round2((totalsByCat[t.category] || 0) + round2(t.amount)); 
        if (t.subcategory) {
            const subKey = `${t.category}::${t.subcategory}`;
            totalsBySubcat[subKey] = round2((totalsBySubcat[subKey] || 0) + round2(t.amount));
        }
    });

    if (categories.length === 0) listContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">No tienes ${currentBudgetType === 'expense' ? 'Sobres/Categorías' : 'Categorías de Ingreso'}. Crea una abajo.</p>`;

    categories.forEach(catObj => {
        const cat = catObj.name;
        const spent = totalsByCat[cat] || 0;
        
        let subcatsTotalLimit = 0;
        catObj.subcategories.forEach(sub => { subcatsTotalLimit = round2(subcatsTotalLimit + round2(sub.limit || 0)); });
        const baseLimit = round2(financeData.categoryBudgets[cat] || 0);
        const limit = subcatsTotalLimit > 0 ? subcatsTotalLimit : baseLimit;
        
        globalSpent = round2(globalSpent + spent);
        globalLimit = round2(globalLimit + limit);
        
        let progressHtml = '';
        if (limit > 0) {
            const pct = Math.min(100, (spent / limit) * 100);
            const remaining = round2(limit - spent);
            let barColor, mainText, subText;
            
            if (currentBudgetType === 'expense') {
                barColor = pct > 90 ? 'var(--negative)' : (pct > 75 ? '#f59e0b' : 'var(--positive)');
                mainText = `Límite: ${formatMoney(limit)}`;
                subText = `<span style="color: ${remaining >= 0 ? 'var(--text-muted)' : 'var(--negative)'}; font-weight:600;">${remaining >= 0 ? `Quedan ${formatMoney(remaining)}` : `Excedido ${formatMoney(Math.abs(remaining))}`}</span>`;
            } else {
                barColor = pct >= 100 ? 'var(--positive)' : '#007aff';
                mainText = `Meta: ${formatMoney(limit)}`;
                subText = `<span style="color: ${remaining <= 0 ? 'var(--positive)' : 'var(--text-muted)'}; font-weight:600;">${remaining <= 0 ? `¡Meta superada por ${formatMoney(Math.abs(remaining))}!` : `Faltan ${formatMoney(remaining)}`}</span>`;
            }
            progressHtml = `<div class="tc-mini-bar"><div class="tc-mini-bar-fill" style="width: ${pct}%; background-color: ${barColor};"></div></div><div class="budget-cat-sub"><span>${mainText}</span>${subText}</div>`;
        } else {
            progressHtml = `<div class="budget-cat-sub"><span>Sin ${currentBudgetType === 'expense' ? 'límite definido' : 'meta definida'}</span></div>`;
        }

        let subcatsHtml = `<div class="subcat-list">`;
        catObj.subcategories.forEach(subObj => {
            const subName = subObj.name;
            const subLimit = round2(subObj.limit || 0);
            const subSpent = totalsBySubcat[`${cat}::${subName}`] || 0;
            
            let subProgressHtml = '';
            if (subLimit > 0) {
                const subPct = Math.min(100, (subSpent / subLimit) * 100);
                let subBarColor, subText;
                
                if (currentBudgetType === 'expense') {
                    subBarColor = subPct > 90 ? 'var(--negative)' : (subPct > 75 ? '#f59e0b' : 'var(--positive)');
                    subText = `Gasto: ${formatMoney(subSpent)} / ${formatMoney(subLimit)}`;
                } else {
                    subBarColor = subPct >= 100 ? 'var(--positive)' : '#007aff';
                    subText = `Ingreso: ${formatMoney(subSpent)} / Meta: ${formatMoney(subLimit)}`;
                }
                
                subProgressHtml = `
                    <div class="tc-mini-bar" style="margin-top: 4px; height: 4px;"><div class="tc-mini-bar-fill" style="width: ${subPct}%; background-color: ${subBarColor};"></div></div>
                    <div style="font-size: 10px; color: var(--text-muted); display:flex; justify-content:space-between; margin-top:2px;">
                        <span>${subText}</span>
                    </div>
                `;
            } else {
                const lbl = currentBudgetType === 'expense' ? 'Gasto' : 'Ingreso';
                subProgressHtml = `<div style="font-size: 10px; color: var(--text-muted); margin-top:2px;">${lbl}: ${formatMoney(subSpent)}</div>`;
            }
            
            subcatsHtml += `
            <div class="subcat-item" style="display:flex; flex-direction:column; align-items:stretch; margin-bottom:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>↳ ${subName}</span> 
                    <button type="button" onclick="deleteSubcategory('${cat}', '${subName}', '${currentBudgetType}')" style="background:none; border:none; color:var(--negative); font-size:10px; cursor:pointer;">X</button>
                </div>
                ${subProgressHtml}
            </div>`;
        });
        
        const metaPlaceholder = currentBudgetType === 'expense' ? 'Límite ($)' : 'Meta ($)';
        subcatsHtml += `
        <form onsubmit="event.preventDefault(); addSubcategory('${cat}', '${currentBudgetType}', this.querySelector('.subcat-name-input').value, this.querySelector('.subcat-limit-input').value); this.reset();" class="add-subcat-form">
            <input type="text" class="subcat-name-input" placeholder="+ Agregar subcategoría..." required style="flex: 2;">
            <input type="number" class="subcat-limit-input" step="any" inputmode="decimal" placeholder="${metaPlaceholder}" style="flex: 1.5; width: 80px;">
            <button type="submit" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">Añadir</button>
        </form></div>`;
        
        const amountColorClass = (currentBudgetType === 'expense') ? (limit > 0 && spent > limit ? 'negative' : '') : 'positive';
        
        listContainer.innerHTML += `<div class="budget-cat-item"><div class="budget-cat-top"><span>${cat}</span><div style="display:flex; align-items:center;"><span class="${amountColorClass}">${formatMoney(spent)}</span><button type="button" onclick="deleteCategory('${cat}', '${currentBudgetType}')" style="background:none; border:none; color:var(--negative); margin-left:12px; font-weight:bold; font-size:12px; cursor:pointer;">X</button></div></div>${progressHtml}${subcatsHtml}</div>`;
    });
    
    if(totalLimitEl) totalLimitEl.innerText = formatMoney(globalLimit); 
    if(totalSpentEl) totalSpentEl.innerText = formatMoney(globalSpent);
};

document.querySelectorAll('#budget-type-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#budget-type-pills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentBudgetType = btn.getAttribute('data-type');
        renderBudgetView();
    });
});

window.deleteCategory = (catName, type) => {
    if (confirm(`¿Eliminar la categoría/sobre "${catName}" y TODAS sus subcategorías?\nNota: Los movimientos pasados no se alterarán.`)) {
        financeData.categories[type] = financeData.categories[type].filter(c => c.name !== catName);
        if (financeData.categoryBudgets[catName]) delete financeData.categoryBudgets[catName];
        localStorage.setItem('myFinances', JSON.stringify(financeData)); renderCategoryOptions(document.getElementById('type').value); renderBudgetView();
    }
};

window.addSubcategory = (catName, type, subName, limitVal) => {
    const cleanName = subName.trim(); 
    const limit = parseMoneyInput(limitVal);
    if (!cleanName) return;
    
    const cat = financeData.categories[type].find(c => c.name === catName);
    if (cat && !cat.subcategories.some(s => s.name === cleanName)) {
        cat.subcategories.push({ name: cleanName, limit: limit });
        localStorage.setItem('myFinances', JSON.stringify(financeData)); renderCategoryOptions(document.getElementById('type').value); renderBudgetView();
    } else { alert("La subcategoría ya existe."); }
};

window.deleteSubcategory = (catName, subName, type) => {
    if (confirm(`¿Eliminar la subcategoría "${subName}"?`)) {
        const cat = financeData.categories[type].find(c => c.name === catName);
        if (cat) {
            cat.subcategories = cat.subcategories.filter(s => s.name !== subName);
            localStorage.setItem('myFinances', JSON.stringify(financeData)); renderCategoryOptions(document.getElementById('type').value); renderBudgetView();
        }
    }
};

document.getElementById('new-category-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-cat-name').value.trim();
    const limitInput = parseMoneyInput(document.getElementById('new-cat-limit').value);
    
    if (!nameInput) return;
    if (financeData.categories[currentBudgetType].some(c => c.name.toLowerCase() === nameInput.toLowerCase())) { alert("Ya existe una categoría con ese nombre."); return; }
    
    financeData.categories[currentBudgetType].push({ name: nameInput, subcategories: [] });
    if (limitInput > 0) financeData.categoryBudgets[nameInput] = limitInput;
    
    localStorage.setItem('myFinances', JSON.stringify(financeData)); document.getElementById('new-category-form').reset();
    renderCategoryOptions(document.getElementById('type').value); renderBudgetView();
});

// --- FORMULARIO NUEVA DEUDA ---
document.getElementById('new-debt-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-debt-name').value.trim();
    const original = parseMoneyInput(document.getElementById('new-debt-original').value);
    const currentStr = document.getElementById('new-debt-current').value;
    const current = currentStr ? parseMoneyInput(currentStr) : original;
    const totalQuotes = parseInt(document.getElementById('new-debt-total-quotes').value) || 1;
    const paidQuotes = parseInt(document.getElementById('new-debt-paid-quotes').value) || 0;
    const rate = parseMoneyInput(document.getElementById('new-debt-rate').value);
    const rateType = document.getElementById('new-debt-rate-type').value;
    let monthlyPay = parseMoneyInput(document.getElementById('new-debt-monthly-payment').value);

    if (monthlyPay === 0) {
        monthlyPay = calculateAmortization(original, totalQuotes, rate, rateType).payment;
    }

    const id = 'Deuda_' + Date.now();
    financeData.customAccounts.push({
        id: id,
        name: name,
        category: 'debt',
        debtOriginal: original,
        debtTotalQuotes: totalQuotes,
        debtPaidQuotes: paidQuotes,
        debtRate: rate,
        debtRateType: rateType,
        debtMonthlyPayment: monthlyPay
    });

    if (current > 0) {
        const now = new Date();
        financeData.transactions.push({
            id: now.getTime(), monthId: getMonthId(now), type: 'expense',
            account: id, description: 'Saldo Inicial Préstamo', amount: current,
            date: `${now.toLocaleDateString('es-CO', {day:'2-digit',month:'short'})}, ${now.toLocaleTimeString('es-CO', {hour:'2-digit',minute:'2-digit'})}`,
            isAdjustment: true
        });
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('new-debt-form').reset();
    updateDashboard(); renderAccountSelects();
});

// --- MÓDULO DE ACTIVOS FIJOS Y BIENES ---
const renderAssetsBreakdown = () => {
    let totalVal = 0, totalDiff = 0;
    const list = document.getElementById('assets-list');
    if(!list) return;
    list.innerHTML = '';
    
    const filtered = financeData.fixedAssets.filter(a => a.status === currentAssetType);
    financeData.fixedAssets.filter(a => a.status === 'active').forEach(a => {
        totalVal += a.currentValue;
        totalDiff += (a.currentValue - (a.purchaseValue || 0));
    });
    
    if(document.getElementById('assets-total-value')) document.getElementById('assets-total-value').innerText = formatMoney(totalVal);
    if(document.getElementById('assets-total-diff')) {
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
        const catEmoji = getAssetEmoji(catLabel);
        
        list.innerHTML += `
            <div class="acc-list-item" onclick="openAssetDetail(${a.id})">
                <div class="acc-list-name">
                    <span class="dot" style="background-color: var(--accent); display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; font-size: 12px; border-radius: 6px; color: white;">${catEmoji}</span>
                    <div>
                        <span>${a.name}</span>
                        <small style="display:block; font-size:11px; color:var(--text-muted);">${catLabel} • ${a.status === 'active' ? 'Vigente' : 'Vendido'}</small>
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
        updateDashboard(); renderAssetsBreakdown();
    }
});

window.openAssetDetail = (id) => {
    const a = financeData.fixedAssets.find(x => x.id === id);
    if (!a) return;
    document.getElementById('assets-modal')?.classList.add('hidden');
    document.getElementById('asset-detail-modal')?.classList.remove('hidden');
    
    if(document.getElementById('detail-asset-name')) document.getElementById('detail-asset-name').innerText = a.name;
    const badge = document.getElementById('detail-asset-status');
    if(badge) {
        badge.innerText = a.status === 'active' ? 'Vigente' : 'Vendido';
        badge.className = `period-badge ${a.status === 'sold' ? 'past' : ''}`;
    }
    
    const catLabel = a.category || 'Otro';
    const catEmoji = getAssetEmoji(catLabel);
    if(document.getElementById('detail-asset-category')) document.getElementById('detail-asset-category').innerText = `${catEmoji} ${catLabel}`;
    if(document.getElementById('edit-asset-category')) document.getElementById('edit-asset-category').value = catLabel;
    
    if(document.getElementById('detail-asset-current')) document.getElementById('detail-asset-current').innerText = formatMoney(a.currentValue);
    if(document.getElementById('detail-asset-purchase')) document.getElementById('detail-asset-purchase').innerText = formatMoney(a.purchaseValue || 0);
    const diff = a.currentValue - (a.purchaseValue || 0);
    if(document.getElementById('detail-asset-diff')) {
        document.getElementById('detail-asset-diff').innerText = formatMoney(diff);
        document.getElementById('detail-asset-diff').className = diff >= 0 ? 'positive' : 'negative';
    }
    if(document.getElementById('detail-asset-expenses')) document.getElementById('detail-asset-expenses').innerText = formatMoney(a.linkedExpenses || 0);
    
    if(document.getElementById('edit-asset-id')) document.getElementById('edit-asset-id').value = a.id;
    if(document.getElementById('edit-asset-val-current')) document.getElementById('edit-asset-val-current').value = a.currentValue;
    
    const actionsBox = document.getElementById('asset-action-buttons');
    if (a.status === 'sold') {
        if(actionsBox) actionsBox.classList.add('hidden');
        if(document.getElementById('edit-asset-settings-btn')) document.getElementById('edit-asset-settings-btn').classList.add('hidden');
    } else {
        if(actionsBox) actionsBox.classList.remove('hidden');
        if(document.getElementById('edit-asset-settings-btn')) document.getElementById('edit-asset-settings-btn').classList.remove('hidden');
    }
    document.getElementById('edit-asset-form')?.classList.add('hidden');
};

document.getElementById('back-to-assets-btn')?.addEventListener('click', () => {
    document.getElementById('asset-detail-modal')?.classList.add('hidden');
    document.getElementById('assets-modal')?.classList.remove('hidden');
});

document.getElementById('edit-asset-settings-btn')?.addEventListener('click', () => { document.getElementById('edit-asset-form')?.classList.toggle('hidden'); });
document.getElementById('edit-asset-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-asset-id').value);
    const a = financeData.fixedAssets.find(x => x.id === id);
    if (a) {
        a.category = document.getElementById('edit-asset-category').value || 'Otro';
        a.currentValue = parseMoneyInput(document.getElementById('edit-asset-val-current').value);
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        updateDashboard(); renderAssetsBreakdown(); openAssetDetail(id);
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
    const sellVal = prompt(`¿En cuánto vendiste ${a.name}?`, a.currentValue);
    if (sellVal === null) return;
    const val = parseMoneyInput(sellVal);
    
    const assetsAcc = financeData.customAccounts.filter(acc => acc.category === 'asset');
    let accMsg = "Escribe el nombre exacto de la cuenta donde ingresa el dinero:\n\n";
    assetsAcc.forEach(acc => accMsg += `- ${acc.id}\n`);
    let dest = prompt(accMsg, assetsAcc[0] ? assetsAcc[0].id : 'Efectivo');
    if (dest === null) return;
    
    if (!assetsAcc.some(acc => acc.id === dest)) { alert('Cuenta no válida. Operación cancelada.'); return; }
    
    a.status = 'sold'; a.soldValue = val; a.currentValue = val;
    
    const now = new Date();
    financeData.transactions.push({
        id: now.getTime(), monthId: getMonthId(now), type: 'income',
        account: dest, description: `💰 Venta de Activo: ${a.name}`, amount: val,
        date: `${now.toLocaleDateString('es-CO', {day:'2-digit',month:'short'})}, ${now.toLocaleTimeString('es-CO', {hour:'2-digit',minute:'2-digit'})}`,
        isAdjustment: false
    });
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    updateDashboard(); renderAssetsBreakdown(); openAssetDetail(id);
});

document.getElementById('btn-asset-expense')?.addEventListener('click', () => {
    const id = parseInt(document.getElementById('edit-asset-id').value);
    const a = financeData.fixedAssets.find(x => x.id === id);
    if (!a) return;
    const expVal = prompt(`¿Cuánto gastaste en ${a.name} (ej. mantenimiento, impuestos)?`);
    if (expVal === null) return;
    const val = parseMoneyInput(expVal);
    if (val <= 0) return;
    
    const assetsAcc = financeData.customAccounts.filter(acc => acc.category === 'asset');
    let accMsg = "Escribe el nombre exacto de la cuenta desde donde pagas:\n\n";
    assetsAcc.forEach(acc => accMsg += `- ${acc.id}\n`);
    let source = prompt(accMsg, assetsAcc[0] ? assetsAcc[0].id : 'Efectivo');
    if (source === null) return;
    
    if (!assetsAcc.some(acc => acc.id === source)) { alert('Cuenta no válida. Operación cancelada.'); return; }
    
    a.linkedExpenses = (a.linkedExpenses || 0) + val;
    
    const now = new Date();
    financeData.transactions.push({
        id: now.getTime(), monthId: getMonthId(now), type: 'expense',
        account: source, category: '📦 Otros Gastos', subcategory: 'Activos',
        description: `🔧 Gasto en Activo: ${a.name}`, amount: val,
        date: `${now.toLocaleDateString('es-CO', {day:'2-digit',month:'short'})}, ${now.toLocaleTimeString('es-CO', {hour:'2-digit',minute:'2-digit'})}`,
        isAdjustment: false
    });
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    updateDashboard(); renderAssetsBreakdown(); openAssetDetail(id);
});

// --- REVERSIÓN Y LÓGICA DE TRASPASOS (DEUDAS / TC) ---
const revertTransferAllocation = (tx) => {
    if (!tx || tx.type !== 'transfer' || !Array.isArray(tx.allocatedItems)) return;
    tx.allocatedItems.forEach(item => {
        if (item.kind === 'cc_tx') {
            const targetTx = financeData.transactions.find(t => String(t.id) === String(item.txId));
            if (targetTx) {
                if (item.mode === 'extraordinary') {
                    targetTx.extraPrincipalPaid = Math.max(0, round2((targetTx.extraPrincipalPaid || 0) - (item.amountApplied || 0)));
                    if (targetTx.paidInstallments > 0 && targetTx.wasClosedByExtra) {
                        targetTx.paidInstallments = Math.max(0, targetTx.paidInstallments - 1); delete targetTx.wasClosedByExtra;
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

const renderTransferAllocationItems = (preselectedIds = []) => {
    if(!transferAllocBox) return;
    const type = typeSelect.value;
    const toAccId = document.getElementById('to-account').value;
    const toAcc = getAccountObj(toAccId);

    if (type !== 'transfer' || !isLiabilityCategory(toAcc.category)) {
        transferAllocBox.classList.add('hidden'); return;
    }

    transferAllocBox.classList.remove('hidden');
    const mode = document.getElementById('transfer-payment-mode').value;
    const strategyGroup = document.getElementById('extraordinary-strategy-group');
    if(strategyGroup) {
        if (mode === 'extraordinary') strategyGroup.classList.remove('hidden'); else strategyGroup.classList.add('hidden');
    }

    const listEl = document.getElementById('transfer-pending-items-list');
    if(!listEl) return;
    listEl.innerHTML = '';

    if (toAcc.category === 'credit_card') {
        const pending = getPendingCardPurchases(toAcc.id);
        if (pending.length === 0) { listEl.innerHTML = '<small style="color: var(--text-muted); font-size: 11px;">No hay compras con cuotas pendientes.</small>'; } 
        else {
            pending.forEach(item => {
                const isChecked = preselectedIds.includes(String(item.tx.id)) ? 'checked' : '';
                const displayAmt = mode === 'extraordinary' ? item.remCapital : item.nextQuota;
                const subLabel = mode === 'extraordinary' ? `Saldo capital pendiente (${item.remainingInstallments}c rest.)` : `Cuota ${item.nextPeriod}/${item.installments} • Cap. rest: ${formatMoney(item.remCapital)}`;
                const row = document.createElement('label'); row.className = 'alloc-item-row';
                row.innerHTML = `<input type="checkbox" value="${item.tx.id}" data-kind="cc_tx" data-quota="${item.nextQuota}" data-remaining="${item.remCapital}" ${isChecked}><div class="alloc-item-info"><strong>${item.tx.description}</strong><small>${subLabel}</small></div><span class="alloc-item-amount">${formatMoney(displayAmt)}</span>`;
                listEl.appendChild(row);
            });
        }
    } else if (toAcc.category === 'debt') {
        const currentBal = Math.max(0, round2(currentBalances[toAcc.id] || 0));
        const originalDebt = round2(toAcc.debtOriginal || currentBal);
        const totalQuotes = toAcc.debtTotalQuotes || 1, paidQuotes = toAcc.debtPaidQuotes || 0;
        const rate = toAcc.debtRate || 0, rateType = toAcc.debtRateType || 'monthly';
        const amort = calculateAmortization(originalDebt, totalQuotes, rate, rateType);
        const monthlyPay = round2(toAcc.debtMonthlyPayment || amort.payment);
        const nextInterest = round2(currentBal * amort.monthlyRate);
        const nextPrincipal = Math.min(currentBal, Math.max(0, round2(monthlyPay - nextInterest)));

        if (currentBal <= 0) { listEl.innerHTML = '<small style="color: var(--positive); font-size: 11px;">Este préstamo ya está en $0 🎉</small>'; } 
        else {
            const isChecked = preselectedIds.includes(toAcc.id) ? 'checked' : '';
            const displayAmt = mode === 'extraordinary' ? currentBal : monthlyPay;
            const subLabel = mode === 'extraordinary' ? `Saldo total deuda vigente (${Math.max(0, totalQuotes - paidQuotes)}c rest.)` : `Cuota ${paidQuotes + 1}/${totalQuotes} (Cap: ${formatMoney(nextPrincipal)} + Int: ${formatMoney(nextInterest)})`;
            const row = document.createElement('label'); row.className = 'alloc-item-row';
            row.innerHTML = `<input type="checkbox" value="${toAcc.id}" data-kind="debt_quota" data-quota="${monthlyPay}" data-principal="${nextPrincipal}" data-interest="${nextInterest}" data-remaining="${currentBal}" ${isChecked}><div class="alloc-item-info"><strong>Cuota Préstamo ${toAcc.name}</strong><small>${subLabel}</small></div><span class="alloc-item-amount">${formatMoney(displayAmt)}</span>`;
            listEl.appendChild(row);
        }
    }

    listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            const currentMode = document.getElementById('transfer-payment-mode').value;
            let sum = 0;
            listEl.querySelectorAll('input[type="checkbox"]:checked').forEach(checkedBox => { sum = round2(sum + parseMoneyInput(currentMode === 'extraordinary' ? checkedBox.getAttribute('data-remaining') : checkedBox.getAttribute('data-quota'))); });
            if (sum > 0) document.getElementById('amount').value = sum;
            updateTransferAllocationSummary();
        });
    });
    updateTransferAllocationSummary();
};

const updateTransferAllocationSummary = () => {
    if (!transferAllocBox || transferAllocBox.classList.contains('hidden')) return;
    const mode = document.getElementById('transfer-payment-mode').value;
    const checkboxes = document.querySelectorAll('#transfer-pending-items-list input[type="checkbox"]:checked');
    const summaryEl = document.getElementById('transfer-allocation-summary');
    if(document.getElementById('transfer-alloc-badge')) document.getElementById('transfer-alloc-badge').innerText = `${checkboxes.length} selec.`;
    const amountVal = parseMoneyInput(document.getElementById('amount').value);

    let selectedSum = 0;
    checkboxes.forEach(cb => { selectedSum = round2(selectedSum + parseMoneyInput(mode === 'extraordinary' ? cb.getAttribute('data-remaining') : cb.getAttribute('data-quota'))); });

    if(!summaryEl) return;
    if (checkboxes.length === 0) { summaryEl.innerText = mode === 'extraordinary' ? "Abono extraordinario general al saldo del pasivo." : "Selecciona cuotas para calcular cobertura y saldo restante."; return; }
    
    const diff = round2(amountVal - selectedSum);
    if (Math.abs(diff) < 1) { summaryEl.innerHTML = `<span style="color:var(--positive);">✓ Cubre exactamente ${formatMoney(selectedSum)} de las cuotas marcadas.</span>`; } 
    else if (diff > 0) { summaryEl.innerHTML = `Cuotas marcadas: <b>${formatMoney(selectedSum)}</b> • Excedente de <b style="color:var(--positive);">${formatMoney(diff)}</b> irá a capital.`; } 
    else { summaryEl.innerHTML = `Cuotas marcadas: <b>${formatMoney(selectedSum)}</b> • Faltan <b style="color:var(--negative);">${formatMoney(Math.abs(diff))}</b> para cubrirlas.`; }
};

const updateCCInstallmentsPreview = (syncRateFromCard = false) => {
    if(!ccInstallmentsBox) return;
    const acc = getAccountObj(document.getElementById('account').value);
    if (typeSelect.value !== 'expense' || acc.category !== 'credit_card') { ccInstallmentsBox.classList.add('hidden'); return; }
    
    ccInstallmentsBox.classList.remove('hidden');
    const amount = parseMoneyInput(document.getElementById('amount').value);
    const installmentsInput = document.getElementById('trans-installments'), rateInput = document.getElementById('trans-rate'), rateTypeSelect = document.getElementById('trans-rate-type'), zeroCheck = document.getElementById('trans-zero-interest'), zeroHint = document.getElementById('zero-interest-hint');
    
    let installments = Math.max(1, parseInt(installmentsInput.value) || 1);
    const maxZero = acc.zeroInterestMax || 0;

    if (syncRateFromCard) {
        rateTypeSelect.value = acc.rateType || 'monthly';
        if (installments === 1) { rateInput.value = 0; zeroCheck.checked = false; } 
        else if (zeroCheck.checked) {
            if (maxZero > 0 && installments > maxZero) { zeroCheck.checked = false; rateInput.value = acc.rate || 0; } else { rateInput.value = 0; }
        } else { rateInput.value = acc.rate || 0; }
    }

    if (installments === 1) { zeroHint.innerText = "A 1 cuota no se generan intereses (pago de contado)."; } 
    else if (maxZero > 0) {
        if (zeroCheck.checked && installments > maxZero) { zeroHint.innerText = `⚠️ ${acc.name} permite 0% hasta ${maxZero} cuotas. Se aplicará tasa habitual.`; } 
        else { zeroHint.innerText = `✨ Beneficio ${acc.name}: hasta ${maxZero} cuotas sin interés.`; }
    } else { zeroHint.innerText = "Marca si esta compra aplica a promoción 0% interés."; }

    const effectiveRate = installments === 1 ? 0 : parseMoneyInput(rateInput.value);
    const amort = calculateAmortization(amount, installments, effectiveRate, rateTypeSelect.value);

    if(document.getElementById('cc-preview-quota')) document.getElementById('cc-preview-quota').innerText = formatMoney(amort.payment);
    if(document.getElementById('cc-preview-interest')) document.getElementById('cc-preview-interest').innerText = formatMoney(amort.totalInterest);
    if(document.getElementById('cc-preview-total')) document.getElementById('cc-preview-total').innerText = formatMoney(amort.totalWithInterest);

    const tbody = document.getElementById('tx-amortization-body');
    if(tbody) {
        tbody.innerHTML = '';
        if (amort.schedule.length === 0 || amount <= 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Ingresa un monto para simular</td></tr>'; } 
        else { amort.schedule.forEach(row => { tbody.innerHTML += `<tr><td>${row.period}</td><td>${formatMoney(row.payment)}</td><td class="positive">${formatMoney(row.principal)}</td><td class="negative">${formatMoney(row.interest)}</td><td>${formatMoney(row.balance)}</td></tr>`; }); }
    }
};

window.openAccountDetail = (accountId, originType = 'home') => {
    const acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    lastAccountViewOrigin = originType;

    document.getElementById('analytics-modal')?.classList.add('hidden'); document.getElementById('cards-modal')?.classList.add('hidden');
    document.getElementById('debts-modal')?.classList.add('hidden'); document.getElementById('assets-modal')?.classList.add('hidden');
    document.getElementById('asset-detail-modal')?.classList.add('hidden'); document.getElementById('budget-modal')?.classList.add('hidden');
    document.getElementById('accounts-list-view')?.classList.add('hidden');
    document.getElementById('accounts-modal')?.classList.remove('hidden'); document.getElementById('account-detail-view')?.classList.remove('hidden');

    if(document.getElementById('detail-account-name')) document.getElementById('detail-account-name').innerText = acc.name;
    if(document.getElementById('reconcile-account-id')) document.getElementById('reconcile-account-id').value = acc.id; 
    if(document.getElementById('reconcile-real-amount')) document.getElementById('reconcile-real-amount').value = '';
    
    const currentBal = round2(currentBalances[acc.id] || 0), balEl = document.getElementById('detail-account-balance');
    if(balEl) balEl.innerText = formatMoney(currentBal);

    const cardExtraBox = document.getElementById('card-extra-info'), editCardBtn = document.getElementById('edit-card-settings-btn');
    const debtExtraBox = document.getElementById('debt-extra-info'), editDebtBtn = document.getElementById('edit-debt-settings-btn');
    document.getElementById('edit-card-form')?.classList.add('hidden'); document.getElementById('edit-debt-form')?.classList.add('hidden');
    document.getElementById('pay-installment-box')?.classList.add('hidden'); document.getElementById('amortization-panel')?.classList.add('hidden');
    if(document.getElementById('sim-extra-payment')) document.getElementById('sim-extra-payment').value = ''; 
    if(document.getElementById('sim-savings-result')) document.getElementById('sim-savings-result').innerText = '';

    if (acc.category === 'credit_card') {
        if(cardExtraBox) cardExtraBox.classList.remove('hidden'); 
        if(editCardBtn) editCardBtn.classList.remove('hidden');
        if(debtExtraBox) debtExtraBox.classList.add('hidden'); 
        if(editDebtBtn) editDebtBtn.classList.add('hidden');
        
        const limit = round2(acc.creditLimit || 0), available = round2(limit - currentBal), availEl = document.getElementById('detail-card-available');
        if(document.getElementById('detail-card-limit')) document.getElementById('detail-card-limit').innerText = formatMoney(limit); 
        if(availEl) { availEl.innerText = formatMoney(available); availEl.className = available >= 0 ? 'positive' : 'negative'; }
        
        const rateTxt = acc.rate > 0 ? ` • Tasa: ${acc.rate}% ${acc.rateType === 'annual' ? 'E.A.' : 'M.V.'}` : '';
        const zeroTxt = acc.zeroInterestMax > 0 ? ` • ✨ 0% hasta ${acc.zeroInterestMax}c` : '';
        if(document.getElementById('detail-card-dates')) document.getElementById('detail-card-dates').innerText = `📅 Corte: ${acc.cutoffDay || '-'} • Límite: ${acc.paymentDay || '-'}${rateTxt}${zeroTxt}`;
        
        if(document.getElementById('edit-card-limit')) document.getElementById('edit-card-limit').value = limit; 
        if(document.getElementById('edit-card-cutoff')) document.getElementById('edit-card-cutoff').value = acc.cutoffDay || 15;
        if(document.getElementById('edit-card-payment')) document.getElementById('edit-card-payment').value = acc.paymentDay || 30; 
        if(document.getElementById('edit-card-rate')) document.getElementById('edit-card-rate').value = acc.rate || '';
        if(document.getElementById('edit-card-rate-type')) document.getElementById('edit-card-rate-type').value = acc.rateType || 'monthly'; 
        if(document.getElementById('edit-card-zero-interest-max')) document.getElementById('edit-card-zero-interest-max').value = acc.zeroInterestMax || 0;

        const deferredListEl = document.getElementById('card-deferred-list');
        if(deferredListEl) {
            const pendingPurchases = getPendingCardPurchases(acc.id);
            deferredListEl.innerHTML = '';

            if (pendingPurchases.length === 0) { deferredListEl.innerHTML = '<small style="color: var(--text-muted); font-size: 11px;">No hay compras con cuotas pendientes.</small>'; } 
            else {
                pendingPurchases.forEach(item => {
                    const badgeRate = item.zeroInterest ? '<span style="color:var(--positive); font-weight:700;">0% int.</span>' : `${item.rate}% ${item.rateType === 'annual' ? 'E.A.' : 'M.V.'}`;
                    deferredListEl.innerHTML += `<div class="deferred-item-card" onclick="closeAllModals(); openEditModal(${item.tx.id});" style="cursor:pointer;"><div class="deferred-item-top"><span>${item.tx.description}</span><span class="negative">${formatMoney(item.remCapital)}</span></div><div class="deferred-item-sub"><span>Cuotas: <b>${item.paidInstallments}/${item.installments}</b> • ${badgeRate}</span><span>Próx. cuota: <b>${formatMoney(item.nextQuota)}</b></span></div></div>`;
                });
            }
        }
    } else if (acc.category === 'debt') {
        if(cardExtraBox) cardExtraBox.classList.add('hidden'); 
        if(editCardBtn) editCardBtn.classList.add('hidden');
        if(debtExtraBox) debtExtraBox.classList.remove('hidden'); 
        if(editDebtBtn) editDebtBtn.classList.remove('hidden');
        
        const originalDebt = round2(acc.debtOriginal || currentBal), totalQuotes = acc.debtTotalQuotes || 1, paidQuotes = acc.debtPaidQuotes || 0;
        const rate = acc.debtRate || 0, rateType = acc.debtRateType || 'monthly';
        let customMonthlyPayment = round2(acc.debtMonthlyPayment || 0);
        
        const amortData = calculateAmortization(originalDebt, totalQuotes, rate, rateType);
        activeAmortizationSchedule = amortData.schedule;
        if (customMonthlyPayment === 0 && amortData.payment > 0) customMonthlyPayment = amortData.payment;

        const principalPaid = Math.max(0, round2(originalDebt - currentBal)), progressPct = originalDebt > 0 ? Math.min(100, (principalPaid / originalDebt) * 100) : 0;
        
        if(document.getElementById('detail-debt-original')) document.getElementById('detail-debt-original').innerText = formatMoney(originalDebt); 
        if(document.getElementById('detail-debt-progress-pct')) document.getElementById('detail-debt-progress-pct').innerText = `${progressPct.toFixed(1)}%`;
        if(document.getElementById('detail-debt-progress-fill')) document.getElementById('detail-debt-progress-fill').style.width = `${progressPct}%`; 
        if(document.getElementById('detail-debt-payment')) document.getElementById('detail-debt-payment').innerText = formatMoney(customMonthlyPayment);
        if(document.getElementById('detail-debt-installments')) document.getElementById('detail-debt-installments').innerText = `${paidQuotes} / ${totalQuotes}`; 
        if(document.getElementById('detail-debt-rate')) document.getElementById('detail-debt-rate').innerText = `${rate}% ${rateType === 'monthly' ? 'M.V.' : 'E.A.'}`;

        let nextInterest = round2(currentBal * amortData.monthlyRate), nextPrincipal = round2(customMonthlyPayment - nextInterest);
        if (nextPrincipal < 0) nextPrincipal = 0; if (nextPrincipal > currentBal) nextPrincipal = currentBal;
        
        if(document.getElementById('detail-debt-next-principal')) document.getElementById('detail-debt-next-principal').innerText = formatMoney(nextPrincipal); 
        if(document.getElementById('detail-debt-next-interest')) document.getElementById('detail-debt-next-interest').innerText = formatMoney(nextInterest);
        
        let totalInterestRemaining = 0;
        if (activeAmortizationSchedule.length > paidQuotes) { activeAmortizationSchedule.slice(paidQuotes).forEach(r => totalInterestRemaining = round2(totalInterestRemaining + r.interest)); }
        if(document.getElementById('detail-debt-total-interest')) document.getElementById('detail-debt-total-interest').innerText = formatMoney(totalInterestRemaining);
        
        if(document.getElementById('edit-debt-original')) document.getElementById('edit-debt-original').value = originalDebt; 
        if(document.getElementById('edit-debt-total-quotes')) document.getElementById('edit-debt-total-quotes').value = totalQuotes;
        if(document.getElementById('edit-debt-paid-quotes')) document.getElementById('edit-debt-paid-quotes').value = paidQuotes; 
        if(document.getElementById('edit-debt-rate')) document.getElementById('edit-debt-rate').value = rate;
        if(document.getElementById('edit-debt-rate-type')) document.getElementById('edit-debt-rate-type').value = rateType; 
        if(document.getElementById('edit-debt-monthly-payment')) document.getElementById('edit-debt-monthly-payment').value = customMonthlyPayment;
        
        if(document.getElementById('pay-debt-principal')) document.getElementById('pay-debt-principal').value = nextPrincipal; 
        if(document.getElementById('pay-debt-interest')) document.getElementById('pay-debt-interest').value = nextInterest;
        if(document.getElementById('pay-debt-date')) document.getElementById('pay-debt-date').value = new Date().toLocaleDateString('en-CA');
        
        if(document.getElementById('pay-debt-source-acc')) document.getElementById('pay-debt-source-acc').innerHTML = financeData.customAccounts.filter(a => a.category === 'asset').map(a => `<option value="${a.id}">${a.name}</option>`).join('');

        const tbody = document.getElementById('amortization-table-body'); 
        if(tbody) {
            tbody.innerHTML = '';
            const remSched = activeAmortizationSchedule.slice(paidQuotes);
            if (remSched.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Préstamo liquidado 🎉</td></tr>'; } 
            else { remSched.forEach(row => { tbody.innerHTML += `<tr><td>${row.period}</td><td>${formatMoney(row.payment)}</td><td class="positive">${formatMoney(row.principal)}</td><td class="negative">${formatMoney(row.interest)}</td><td>${formatMoney(row.balance)}</td></tr>`; }); }
        }
    } else {
        if(cardExtraBox) cardExtraBox.classList.add('hidden'); 
        if(editCardBtn) editCardBtn.classList.add('hidden');
        if(debtExtraBox) debtExtraBox.classList.add('hidden'); 
        if(editDebtBtn) editDebtBtn.classList.add('hidden');
    }

    if(balEl) {
        if (isLiabilityCategory(acc.category)) { 
            if(document.getElementById('detail-balance-label')) document.getElementById('detail-balance-label').innerText = 'Deuda registrada:'; 
            if(document.getElementById('reconcile-input-label')) document.getElementById('reconcile-input-label').innerText = '⚖️ Ajustar deuda real:'; 
            balEl.classList.add('negative'); 
        } else { 
            if(document.getElementById('detail-balance-label')) document.getElementById('detail-balance-label').innerText = 'Saldo registrado:'; 
            if(document.getElementById('reconcile-input-label')) document.getElementById('reconcile-input-label').innerText = '⚖️ Ajustar saldo real:'; 
            balEl.classList.remove('negative'); 
        }
    }

    const historyList = document.getElementById('detail-account-history'); 
    if(historyList) {
        historyList.innerHTML = '';
        const accTransactions = financeData.transactions.filter(t => t.account === accountId || t.toAccount === accountId).sort((a, b) => b.id - a.id);

        if (accTransactions.length === 0) { historyList.innerHTML = '<li class="history-item"><small style="color: var(--text-muted);">Sin movimientos registrados</small></li>'; return; }

        accTransactions.forEach(t => {
            const li = document.createElement('li'); li.className = 'history-item';
            li.onclick = () => { closeAllModals(); openEditModal(t.id); };
            let sign = '', colorClass = '', extraNote = '';
            if (isLiabilityCategory(acc.category)) {
                if (t.type === 'expense') { sign = '+'; colorClass = 'negative'; if (t.installments && t.installments > 1) extraNote = ` (${t.paidInstallments || 0}/${t.installments}c)`; } 
                else if (t.type === 'income') { sign = '-'; colorClass = 'positive'; }
                else if (t.type === 'transfer') { if (t.toAccount === accountId) { sign = '-'; colorClass = 'positive'; extraNote = ` (Pago desde ${t.account})`; } else { sign = '+'; colorClass = 'negative'; extraNote = ` (Avance a ${t.toAccount})`; } }
            } else {
                if (t.type === 'income') { sign = '+'; colorClass = 'positive'; }
                else if (t.type === 'expense') { sign = '-'; colorClass = 'negative'; }
                else if (t.type === 'transfer') { if (t.account === accountId) { sign = '-'; colorClass = 'negative'; extraNote = ` ➔ ${t.toAccount}`; } else { sign = '+'; colorClass = 'positive'; extraNote = ` ← ${t.account}`; } }
            }
            li.innerHTML = `<div class="history-info"><strong>${t.description}${extraNote}</strong><small>${t.date}</small></div><div class="history-amount ${colorClass}">${sign} ${formatMoney(t.amount)}</div>`;
            historyList.appendChild(li);
        });
    }
};

document.getElementById('edit-card-settings-btn')?.addEventListener('click', () => { document.getElementById('edit-card-form')?.classList.toggle('hidden'); });
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
    localStorage.setItem('myFinances', JSON.stringify(financeData)); updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin);
});

document.getElementById('edit-debt-settings-btn')?.addEventListener('click', () => { document.getElementById('edit-debt-form')?.classList.toggle('hidden'); document.getElementById('pay-installment-box')?.classList.add('hidden'); document.getElementById('amortization-panel')?.classList.add('hidden'); });
document.getElementById('open-pay-installment-btn')?.addEventListener('click', () => { document.getElementById('pay-installment-box')?.classList.toggle('hidden'); document.getElementById('edit-debt-form')?.classList.add('hidden'); document.getElementById('amortization-panel')?.classList.add('hidden'); });
document.getElementById('toggle-amortization-btn')?.addEventListener('click', () => { document.getElementById('amortization-panel')?.classList.toggle('hidden'); document.getElementById('edit-debt-form')?.classList.add('hidden'); document.getElementById('pay-installment-box')?.classList.add('hidden'); });
document.getElementById('edit-debt-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    acc.debtOriginal = parseMoneyInput(document.getElementById('edit-debt-original').value); acc.debtTotalQuotes = parseInt(document.getElementById('edit-debt-total-quotes').value) || 1;
    acc.debtPaidQuotes = parseInt(document.getElementById('edit-debt-paid-quotes').value) || 0; acc.debtRate = parseMoneyInput(document.getElementById('edit-debt-rate').value);
    acc.debtRateType = document.getElementById('edit-debt-rate-type').value; acc.debtMonthlyPayment = parseMoneyInput(document.getElementById('edit-debt-monthly-payment').value);
    localStorage.setItem('myFinances', JSON.stringify(financeData)); updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin);
});

document.getElementById('pay-installment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    const sourceAcc = document.getElementById('pay-debt-source-acc').value, principalAmt = parseMoneyInput(document.getElementById('pay-debt-principal').value), interestAmt = parseMoneyInput(document.getElementById('pay-debt-interest').value);
    const inputDate = document.getElementById('pay-debt-date').value, now = new Date(), transactionDateObj = new Date(`${inputDate}T${now.toTimeString().slice(0, 5)}`), displayDate = transactionDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), displayTime = transactionDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), mId = getMonthId(transactionDateObj);

    if (principalAmt > 0) {
        financeData.transactions.push({
            id: transactionDateObj.getTime() + Math.floor(Math.random() * 500), monthId: mId, type: 'transfer',
            account: sourceAcc, toAccount: accountId, description: `💸 Pago Capital (Cuota ${(acc.debtPaidQuotes || 0) + 1})`, amount: principalAmt, date: `${displayDate}, ${displayTime}`, isAdjustment: false,
            paymentMode: 'installments', allocatedItems: [{ debtId: accountId, amountApplied: principalAmt, type: 'debt_quota' }]
        });
    }
    if (interestAmt > 0) {
        let interestCat = "📦 Otros Gastos";
        if (financeData.categories.expense.some(c => c.name.includes("Intereses"))) interestCat = financeData.categories.expense.find(c => c.name.includes("Intereses")).name;
        financeData.transactions.push({ id: transactionDateObj.getTime() + 500 + Math.floor(Math.random() * 500), monthId: mId, type: 'expense', account: sourceAcc, category: interestCat, subcategory: 'General', description: `📉 Intereses Préstamo (${acc.name})`, amount: interestAmt, date: `${displayDate}, ${displayTime}`, isAdjustment: false });
    }
    acc.debtPaidQuotes = (acc.debtPaidQuotes || 0) + 1;
    localStorage.setItem('myFinances', JSON.stringify(financeData)); updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin);
});

document.getElementById('sim-extra-payment')?.addEventListener('input', (e) => {
    const extraAmt = parseMoneyInput(e.target.value), resultEl = document.getElementById('sim-savings-result'), accountId = document.getElementById('reconcile-account-id').value, acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc || extraAmt <= 0) { resultEl.innerText = ''; return; }
    const currentBal = round2(currentBalances[accountId] || 0), monthlyPayment = acc.debtMonthlyPayment || 0;
    if (monthlyPayment > 0 && currentBal > extraAmt) {
        const monthlyRate = acc.debtRateType === 'monthly' ? acc.debtRate / 100 : (Math.pow(1 + acc.debtRate / 100, 1 / 12) - 1), currentInterest = round2(currentBal * monthlyRate), avgPrincipal = monthlyPayment - currentInterest;
        if (avgPrincipal > 0) { const monthsSaved = extraAmt / avgPrincipal, interestSaved = round2(extraAmt * monthlyRate * monthsSaved); resultEl.innerText = `✨ Ahorrarías aprox. ${monthsSaved.toFixed(1)} meses y ~${formatMoney(interestSaved)} en intereses.`; return; }
    }
    resultEl.innerText = 'Ingresa una cuota mensual válida para simular el ahorro.';
});

document.getElementById('back-to-accounts-btn')?.addEventListener('click', () => {
    document.getElementById('account-detail-view')?.classList.add('hidden');
    if (lastAccountViewOrigin === 'home') closeAllModals();
    else if (lastAccountViewOrigin === 'credit_card') { document.getElementById('accounts-modal')?.classList.add('hidden'); document.getElementById('cards-modal')?.classList.remove('hidden'); }
    else if (lastAccountViewOrigin === 'debt') { document.getElementById('accounts-modal')?.classList.add('hidden'); document.getElementById('debts-modal')?.classList.remove('hidden'); }
    else document.getElementById('accounts-list-view')?.classList.remove('hidden');
});

document.getElementById('reconcile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = getAccountObj(accountId);
    const realAmount = parseMoneyInput(document.getElementById('reconcile-real-amount').value), currentBal = round2(currentBalances[accountId] || 0), diff = round2(realAmount - currentBal);
    if (diff === 0) { alert("El monto registrado ya coincide con el real."); return; }
    const now = new Date(), displayDate = now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), displayTime = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    let adjustType = diff > 0 ? 'income' : 'expense';
    if (isLiabilityCategory(acc.category)) adjustType = diff > 0 ? 'expense' : 'income';
    financeData.transactions.push({ id: now.getTime() + Math.floor(Math.random() * 1000), monthId: getMonthId(now), type: adjustType, account: accountId, description: '⚖️ Ajuste / Reconciliación', amount: round2(Math.abs(diff)), date: `${displayDate}, ${displayTime}`, isAdjustment: true });
    localStorage.setItem('myFinances', JSON.stringify(financeData)); updateDashboard(); openAccountDetail(accountId, lastAccountViewOrigin); 
});

window.deleteAccount = (accountId) => {
    if (accountId === 'Efectivo') return; 
    if (confirm(`¿Seguro que deseas eliminar "${accountId}"? Sus movimientos pasarán a "Efectivo".`)) {
        financeData.transactions.forEach(t => { if (t.account === accountId) t.account = 'Efectivo'; if (t.toAccount === accountId) t.toAccount = 'Efectivo'; });
        financeData.customAccounts = financeData.customAccounts.filter(a => a.id !== accountId);
        localStorage.setItem('myFinances', JSON.stringify(financeData)); renderAccountSelects(); updateDashboard();
    }
};

document.getElementById('toggle-tx-amort-btn')?.addEventListener('click', () => { document.getElementById('tx-amortization-box')?.classList.toggle('hidden'); });

document.getElementById('trans-zero-interest')?.addEventListener('change', (e) => {
    const acc = getAccountObj(document.getElementById('account').value), installments = Math.max(1, parseInt(document.getElementById('trans-installments').value) || 1), maxZero = acc.zeroInterestMax || 0;
    if (e.target.checked) {
        if (maxZero > 0 && installments > maxZero) { alert(`Esta tarjeta permite cuotas sin interés hasta máximo ${maxZero} cuotas.`); e.target.checked = false; document.getElementById('trans-rate').value = acc.rate || 0; } 
        else { document.getElementById('trans-rate').value = 0; }
    } else { document.getElementById('trans-rate').value = installments === 1 ? 0 : (acc.rate || 0); }
    updateCCInstallmentsPreview(false);
});

document.getElementById('trans-installments')?.addEventListener('input', () => updateCCInstallmentsPreview(true));
document.getElementById('trans-rate')?.addEventListener('input', () => {
    if (parseMoneyInput(document.getElementById('trans-rate').value) > 0) document.getElementById('trans-zero-interest').checked = false;
    updateCCInstallmentsPreview(false);
});
document.getElementById('trans-rate-type')?.addEventListener('change', () => updateCCInstallmentsPreview(false));
document.getElementById('amount')?.addEventListener('input', () => { updateCCInstallmentsPreview(false); updateTransferAllocationSummary(); });
document.getElementById('transfer-payment-mode')?.addEventListener('change', () => {
    const preselected = Array.from(document.querySelectorAll('#transfer-pending-items-list input[type="checkbox"]:checked')).map(cb => cb.value);
    renderTransferAllocationItems(preselected);
});
document.getElementById('account')?.addEventListener('change', () => { updateCCInstallmentsPreview(true); });
document.getElementById('to-account')?.addEventListener('change', () => { renderTransferAllocationItems([]); });

if(typeSelect) {
    typeSelect.addEventListener('change', () => {
        if (typeSelect.value === 'transfer') {
            renderAccountSelects(false); toAccountGroup.classList.remove('hidden'); categoryGroup.classList.add('hidden');
            document.getElementById('cc-installments-box')?.classList.add('hidden'); document.getElementById('label-account').innerText = "Cuenta Origen"; document.getElementById('to-account').required = true;
            renderTransferAllocationItems([]);
        } else if (typeSelect.value === 'income') {
            renderAccountSelects(true); toAccountGroup.classList.add('hidden'); categoryGroup.classList.remove('hidden');
            document.getElementById('cc-installments-box')?.classList.add('hidden'); document.getElementById('transfer-debt-allocation-box')?.classList.add('hidden');
            document.getElementById('label-account').innerText = "Cuenta (Activo / Liquidez)"; document.getElementById('to-account').required = false;
            renderCategoryOptions('income');
        } else {
            renderAccountSelects(false); toAccountGroup.classList.add('hidden'); categoryGroup.classList.remove('hidden');
            document.getElementById('transfer-debt-allocation-box')?.classList.add('hidden'); document.getElementById('label-account').innerText = "Cuenta / Tarjeta"; document.getElementById('to-account').required = false;
            renderCategoryOptions(typeSelect.value); updateCCInstallmentsPreview(true);
        }
    });
}

const openEditModal = (id) => {
    const transaction = financeData.transactions.find(t => t.id === id);
    if (!transaction) return;
    
    let titleText = 'Editar Transacción';
    if (transaction.type === 'expense') titleText = 'Editar Gasto';
    if (transaction.type === 'income') titleText = 'Editar Ingreso';
    if (transaction.type === 'transfer') titleText = 'Editar Transferencia';
    
    if(document.getElementById('modal-title')) document.getElementById('modal-title').innerText = titleText; 
    if(document.getElementById('edit-id')) document.getElementById('edit-id').value = id;
    if(typeSelect) { typeSelect.value = transaction.type; typeSelect.dispatchEvent(new Event('change')); }
    
    if (transaction.type === 'income' && transaction.account) renderAccountSelects(true, transaction.account);
    if(document.getElementById('account')) document.getElementById('account').value = transaction.account || financeData.customAccounts[0].id;
    if(document.getElementById('description')) document.getElementById('description').value = transaction.description; 
    if(document.getElementById('amount')) document.getElementById('amount').value = transaction.amount;

    if (transaction.type === 'transfer') {
        if(document.getElementById('to-account')) document.getElementById('to-account').value = transaction.toAccount;
        if(document.getElementById('transfer-payment-mode')) document.getElementById('transfer-payment-mode').value = transaction.paymentMode || 'installments';
        if(document.getElementById('transfer-extra-strategy')) document.getElementById('transfer-extra-strategy').value = transaction.extraStrategy || 'reduce_term';
        const preselected = Array.isArray(transaction.allocatedItems) ? transaction.allocatedItems.map(i => String(i.txId || i.debtId)) : [];
        renderTransferAllocationItems(preselected);
    } else {
        if (transaction.category) { const sub = transaction.subcategory ? transaction.subcategory : 'General'; if(document.getElementById('trans-category')) document.getElementById('trans-category').value = `${transaction.category}::${sub}`; }
        if (transaction.type === 'expense') {
            if(document.getElementById('trans-installments')) document.getElementById('trans-installments').value = transaction.installments || 1; 
            if(document.getElementById('trans-rate')) document.getElementById('trans-rate').value = transaction.rate !== undefined ? transaction.rate : 0;
            if(document.getElementById('trans-rate-type')) document.getElementById('trans-rate-type').value = transaction.rateType || 'monthly'; 
            if(document.getElementById('trans-zero-interest')) document.getElementById('trans-zero-interest').checked = !!transaction.zeroInterest;
            document.getElementById('tx-amortization-box')?.classList.add('hidden'); updateCCInstallmentsPreview(false);
        }
    }
    
    const tDate = new Date(transaction.id);
    if(document.getElementById('trans-date')) document.getElementById('trans-date').value = tDate.toLocaleDateString('en-CA'); 
    if(document.getElementById('trans-time')) document.getElementById('trans-time').value = tDate.toTimeString().slice(0, 5);
    document.getElementById('delete-btn')?.classList.remove('hidden'); 
    modal?.classList.remove('hidden');
};

const fabBtn = document.getElementById('add-btn'), fabMenu = document.getElementById('fab-menu');

document.querySelectorAll('.fab-option').forEach(option => {
    option.addEventListener('click', () => {
        const selectedType = option.getAttribute('data-type');
        
        if (!selectedType) return; 

        let titleText = 'Nueva Transacción';
        if (selectedType === 'expense') titleText = 'Nuevo Gasto';
        if (selectedType === 'income') titleText = 'Nuevo Ingreso';
        if (selectedType === 'transfer') titleText = 'Nueva Transferencia';
        
        if(document.getElementById('modal-title')) document.getElementById('modal-title').innerText = titleText; 
        if(document.getElementById('edit-id')) document.getElementById('edit-id').value = ''; 
        if(form) form.reset(); 
        
        if(document.getElementById('trans-installments')) document.getElementById('trans-installments').value = 1; 
        if(document.getElementById('trans-zero-interest')) document.getElementById('trans-zero-interest').checked = false;
        document.getElementById('tx-amortization-box')?.classList.add('hidden'); 
        if(document.getElementById('transfer-payment-mode')) document.getElementById('transfer-payment-mode').value = 'installments';
        if(document.getElementById('transfer-extra-strategy')) document.getElementById('transfer-extra-strategy').value = 'reduce_term';
        
        if(typeSelect) { typeSelect.value = selectedType; typeSelect.dispatchEvent(new Event('change')); }
        const now = new Date(); 
        if(document.getElementById('trans-date')) document.getElementById('trans-date').value = selectedCalendarDay || now.toLocaleDateString('en-CA'); 
        if(document.getElementById('trans-time')) document.getElementById('trans-time').value = now.toTimeString().slice(0, 5); 
        document.getElementById('delete-btn')?.classList.add('hidden'); 
        fabMenu?.classList.add('hidden'); fabBtn?.classList.remove('active'); modal?.classList.remove('hidden');
    });
});

document.getElementById('cancel-btn')?.addEventListener('click', () => { modal?.classList.add('hidden'); form?.reset(); });
document.getElementById('delete-btn')?.addEventListener('click', () => {
    const editId = document.getElementById('edit-id').value;
    if (editId && confirm('¿Eliminar movimiento?')) {
        const oldT = financeData.transactions.find(t => t.id === parseInt(editId));
        if (oldT && oldT.type === 'transfer') revertTransferAllocation(oldT);
        financeData.transactions = financeData.transactions.filter(t => t.id !== parseInt(editId));
        localStorage.setItem('myFinances', JSON.stringify(financeData)); modal?.classList.add('hidden'); updateDashboard();
    }
});

if(form) {
    form.addEventListener('submit', (event) => {
        event.preventDefault(); 
        const editId = document.getElementById('edit-id').value, type = document.getElementById('type').value;
        const account = document.getElementById('account').value, toAccount = document.getElementById('to-account').value;
        const category = document.getElementById('trans-category').value, description = document.getElementById('description').value;
        const amount = parseMoneyInput(document.getElementById('amount').value);
        
        const inputDate = document.getElementById('trans-date').value, inputTime = document.getElementById('trans-time').value;
        const transactionDateObj = new Date(`${inputDate}T${inputTime}`);
        const displayDate = transactionDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), displayTime = transactionDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        let wasAdjustment = false, preservedPaidInstallments = 0, preservedExtraPaid = 0;

        if (editId) {
            const oldT = financeData.transactions.find(t => t.id === parseInt(editId));
            if (oldT) {
                if (oldT.isAdjustment) wasAdjustment = true;
                if (oldT.paidInstallments) preservedPaidInstallments = oldT.paidInstallments;
                if (oldT.extraPrincipalPaid) preservedExtraPaid = oldT.extraPrincipalPaid;
                if (oldT.type === 'transfer') revertTransferAllocation(oldT);
            }
            financeData.transactions = financeData.transactions.filter(t => t.id !== parseInt(editId));
        }

        let savedCategory = null, savedSubcategory = null;
        if (type !== 'transfer' && category) { const parts = category.split('::'); savedCategory = parts[0]; savedSubcategory = parts[1] || 'General'; }

        const transactionData = {
            id: transactionDateObj.getTime() + Math.floor(Math.random() * 1000), monthId: getMonthId(transactionDateObj), 
            type: type, account: account, category: savedCategory, subcategory: savedSubcategory,
            description: description, amount: amount, date: `${displayDate}, ${displayTime}`, isAdjustment: wasAdjustment
        };

        const accObj = getAccountObj(account);
        if (type === 'expense' && accObj.category === 'credit_card') {
            const inst = Math.max(1, parseInt(document.getElementById('trans-installments').value) || 1), zeroInt = document.getElementById('trans-zero-interest').checked;
            const rate = inst === 1 ? 0 : parseMoneyInput(document.getElementById('trans-rate').value), rateType = document.getElementById('trans-rate-type').value;
            const amort = calculateAmortization(amount, inst, rate, rateType);

            transactionData.installments = inst; transactionData.rate = rate; transactionData.rateType = rateType; transactionData.zeroInterest = zeroInt || rate === 0;
            transactionData.paidInstallments = Math.min(inst, preservedPaidInstallments); transactionData.extraPrincipalPaid = preservedExtraPaid;
            transactionData.monthlyQuota = amort.payment; transactionData.totalWithInterest = amort.totalWithInterest;
        }

        if (type === 'transfer') {
            transactionData.toAccount = toAccount; const toAccObj = getAccountObj(toAccount);

            if (isLiabilityCategory(toAccObj.category)) {
                const paymentMode = document.getElementById('transfer-payment-mode').value, extraStrategy = document.getElementById('transfer-extra-strategy').value;
                const checkedBoxes = Array.from(document.querySelectorAll('#transfer-pending-items-list input[type="checkbox"]:checked'));
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
                                let closed = false;
                                if (applied >= remCap - 1) { targetTx.paidInstallments = targetTx.installments || 1; targetTx.wasClosedByExtra = true; closed = true; }
                                transactionData.allocatedItems.push({ kind: 'cc_tx', txId: targetTx.id, mode: 'extraordinary', amountApplied: applied, closed });
                            } else {
                                const quotaAmt = parseMoneyInput(cb.getAttribute('data-quota')); targetTx.paidInstallments = Math.min(targetTx.installments || 1, (targetTx.paidInstallments || 0) + 1);
                                transactionData.allocatedItems.push({ kind: 'cc_tx', txId: targetTx.id, mode: 'installments', amountApplied: quotaAmt });
                            }
                        }
                    } else if (kind === 'debt_quota') {
                        const debtAcc = financeData.customAccounts.find(a => a.id === cb.value);
                        if (debtAcc) {
                            if (paymentMode === 'extraordinary') {
                                const prevDebtState = { debtTotalQuotes: debtAcc.debtTotalQuotes, debtMonthlyPayment: debtAcc.debtMonthlyPayment };
                                const curBal = Math.max(0, round2(currentBalances[debtAcc.id] || 0)), newBal = Math.max(0, round2(curBal - amount));
                                const remQuotes = Math.max(1, (debtAcc.debtTotalQuotes || 1) - (debtAcc.debtPaidQuotes || 0));
                                if (newBal > 0) {
                                    if (extraStrategy === 'reduce_quota') { debtAcc.debtMonthlyPayment = calculateAmortization(newBal, remQuotes, debtAcc.debtRate || 0, debtAcc.debtRateType || 'monthly').payment; } 
                                    else if (extraStrategy === 'reduce_term' && debtAcc.debtMonthlyPayment > 0) {
                                        const mRate = debtAcc.debtRateType === 'annual' ? (Math.pow(1 + (debtAcc.debtRate || 0) / 100, 1 / 12) - 1) : ((debtAcc.debtRate || 0) / 100);
                                        if (mRate > 0 && debtAcc.debtMonthlyPayment > newBal * mRate) { const newRemMonths = Math.ceil(-Math.log(1 - (newBal * mRate) / debtAcc.debtMonthlyPayment) / Math.log(1 + mRate)); debtAcc.debtTotalQuotes = (debtAcc.debtPaidQuotes || 0) + Math.max(1, newRemMonths); } 
                                        else if (mRate === 0) { const newRemMonths = Math.ceil(newBal / debtAcc.debtMonthlyPayment); debtAcc.debtTotalQuotes = (debtAcc.debtPaidQuotes || 0) + Math.max(1, newRemMonths); }
                                    }
                                }
                                transactionData.allocatedItems.push({ kind: 'debt_quota', debtId: debtAcc.id, mode: 'extraordinary', amountApplied: amount, prevDebtState });
                            } else {
                                debtAcc.debtPaidQuotes = (debtAcc.debtPaidQuotes || 0) + 1; transactionData.allocatedItems.push({ kind: 'debt_quota', debtId: debtAcc.id, mode: 'installments', amountApplied: amount });
                            }
                        }
                    }
                });

                if (toAccObj.category === 'debt' && paymentMode === 'extraordinary' && checkedBoxes.length === 0 && amount > 0) {
                    const prevDebtState = { debtTotalQuotes: toAccObj.debtTotalQuotes, debtMonthlyPayment: toAccObj.debtMonthlyPayment };
                    const curBal = Math.max(0, round2(currentBalances[toAccObj.id] || 0)), newBal = Math.max(0, round2(curBal - amount));
                    const remQuotes = Math.max(1, (toAccObj.debtTotalQuotes || 1) - (toAccObj.debtPaidQuotes || 0));
                    if (newBal > 0) {
                        if (extraStrategy === 'reduce_quota') { toAccObj.debtMonthlyPayment = calculateAmortization(newBal, remQuotes, toAccObj.debtRate || 0, toAccObj.debtRateType || 'monthly').payment; } 
                        else if (extraStrategy === 'reduce_term' && toAccObj.debtMonthlyPayment > 0) {
                            const mRate = toAccObj.debtRateType === 'annual' ? (Math.pow(1 + (toAccObj.debtRate || 0) / 100, 1 / 12) - 1) : ((toAccObj.debtRate || 0) / 100);
                            if (mRate > 0 && toAccObj.debtMonthlyPayment > newBal * mRate) { const newRemMonths = Math.ceil(-Math.log(1 - (newBal * mRate) / toAccObj.debtMonthlyPayment) / Math.log(1 + mRate)); toAccObj.debtTotalQuotes = (toAccObj.debtPaidQuotes || 0) + Math.max(1, newRemMonths); } 
                            else if (mRate === 0) { const newRemMonths = Math.ceil(newBal / toAccObj.debtMonthlyPayment); toAccObj.debtTotalQuotes = (toAccObj.debtPaidQuotes || 0) + Math.max(1, newRemMonths); }
                        }
                    }
                    transactionData.allocatedItems.push({ kind: 'debt_quota', debtId: toAccObj.id, mode: 'extraordinary', amountApplied: amount, prevDebtState });
                }
            }
        }
        
        financeData.transactions.push(transactionData); localStorage.setItem('myFinances', JSON.stringify(financeData));
        viewDate = new Date(transactionDateObj.getFullYear(), transactionDateObj.getMonth(), 1); modal?.classList.add('hidden'); updateDashboard();
    });
}

// --- NAVEGACIÓN INFERIOR (TIPO DOCK iOS) Y CARPETAS ---
const analyticsModal = document.getElementById('analytics-modal');
const accountsModal = document.getElementById('accounts-modal');
const cardsModal = document.getElementById('cards-modal');
const debtsModal = document.getElementById('debts-modal');
const assetsModal = document.getElementById('assets-modal');
const assetDetailModal = document.getElementById('asset-detail-modal');
const expensesModal = document.getElementById('expenses-modal');
const budgetModal = document.getElementById('budget-modal');

const navHome = document.getElementById('nav-home');
const navAnalytics = document.getElementById('nav-analytics');
const navBudget = document.getElementById('nav-budget');
const navMoreBtn = document.getElementById('nav-more-btn');
const moreMenuOverlay = document.getElementById('more-menu-overlay');

const navAccounts = document.getElementById('nav-accounts');
const navCards = document.getElementById('nav-cards');
const navDebts = document.getElementById('nav-debts');
const navAssets = document.getElementById('nav-assets');
const navExpenses = document.getElementById('nav-expenses');

const setActiveNav = (activeEl) => {
    [navHome, navAnalytics, navBudget, navMoreBtn, navAccounts, navCards, navDebts, navAssets, navExpenses].forEach(el => {
        if(el) el.classList.remove('active');
    });
    if(activeEl) activeEl.classList.add('active');
};

const closeAllModals = () => {
    analyticsModal?.classList.add('hidden'); accountsModal?.classList.add('hidden'); cardsModal?.classList.add('hidden');
    debtsModal?.classList.add('hidden'); assetsModal?.classList.add('hidden'); assetDetailModal?.classList.add('hidden');
    expensesModal?.classList.add('hidden'); budgetModal?.classList.add('hidden');
    document.getElementById('quick-calendar-popover')?.classList.add('hidden');
    moreMenuOverlay?.classList.add('hidden');
    if (fabMenu && !fabMenu.classList.contains('hidden')) { fabMenu.classList.add('hidden'); fabBtn?.classList.remove('active'); }
    setActiveNav(navHome);
};

// EXCLUSIÓN MUTUA Y EVENTOS DEL MENÚ DE CARPETAS (MORE MENU)
if(navMoreBtn && moreMenuOverlay) {
    navMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (fabMenu && !fabMenu.classList.contains('hidden')) {
            fabMenu.classList.add('hidden');
            if(fabBtn) fabBtn.classList.remove('active');
        }
        
        moreMenuOverlay.classList.toggle('hidden');
        setActiveNav(navMoreBtn);
    });

    document.addEventListener('click', (e) => {
        if (!moreMenuOverlay.classList.contains('hidden') && !moreMenuOverlay.contains(e.target) && !navMoreBtn.contains(e.target)) {
            moreMenuOverlay.classList.add('hidden');
        }
    });
}

// EXCLUSIÓN MUTUA Y EVENTOS DEL BOTÓN '+'
if (fabBtn && fabMenu) {
    fabBtn.addEventListener('click', () => {
        
        if (moreMenuOverlay && !moreMenuOverlay.classList.contains('hidden')) {
            moreMenuOverlay.classList.add('hidden');
            setActiveNav(navHome);
        }
        
        if (fabMenu.classList.contains('hidden')) { 
            fabMenu.classList.remove('hidden'); 
            fabBtn.classList.add('active'); 
        } else { 
            fabMenu.classList.add('hidden'); 
            fabBtn.classList.remove('active'); 
        }
    });
}

navHome?.addEventListener('click', closeAllModals);
navAnalytics?.addEventListener('click', () => { closeAllModals(); analyticsModal?.classList.remove('hidden'); setActiveNav(navAnalytics); });
navBudget?.addEventListener('click', () => { closeAllModals(); budgetModal?.classList.remove('hidden'); renderBudgetView(); setActiveNav(navBudget); });

navAccounts?.addEventListener('click', () => { closeAllModals(); document.getElementById('account-detail-view')?.classList.add('hidden'); document.getElementById('accounts-list-view')?.classList.remove('hidden'); accountsModal?.classList.remove('hidden'); setActiveNav(navMoreBtn); });
navCards?.addEventListener('click', () => { closeAllModals(); cardsModal?.classList.remove('hidden'); setActiveNav(navMoreBtn); });
navDebts?.addEventListener('click', () => { closeAllModals(); debtsModal?.classList.remove('hidden'); setActiveNav(navMoreBtn); });
navAssets?.addEventListener('click', () => { closeAllModals(); assetsModal?.classList.remove('hidden'); renderAssetsBreakdown(); setActiveNav(navMoreBtn); });
navExpenses?.addEventListener('click', () => { closeAllModals(); expensesModal?.classList.remove('hidden'); setActiveNav(navMoreBtn); });

// EVENTOS DE BOTONES CERRAR
document.getElementById('close-analytics-btn')?.addEventListener('click', closeAllModals);
document.getElementById('close-accounts-btn')?.addEventListener('click', closeAllModals);
document.getElementById('close-cards-btn')?.addEventListener('click', closeAllModals);
document.getElementById('close-debts-btn')?.addEventListener('click', closeAllModals);
document.getElementById('close-assets-btn')?.addEventListener('click', closeAllModals);
document.getElementById('close-expenses-btn')?.addEventListener('click', closeAllModals);
document.getElementById('close-budget-btn')?.addEventListener('click', closeAllModals);

updateDashboard();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');