// ==========================================
// CORE.JS - EL CEREBRO: LÓGICA PURA, MATEMÁTICAS Y BASE DE DATOS (v2.3)
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

// --- 2. SISTEMA DE SEGURIDAD Y CIFRADO ---
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

// --- 3. BASE DE DATOS LOCAL Y ESTRUCTURAS ---
let financeData = JSON.parse(localStorage.getItem('myFinances')) || {
    transactions: [], 
    customAccounts: [], 
    monthlyBudget: 0, 
    fixedAssets: [], 
    pockets: [], 
    hideZeroAccounts: false
};

if (!financeData.fixedAssets) {
    financeData.fixedAssets = [];
}
if (!financeData.pockets) {
    financeData.pockets = [];
}
if (!financeData.customAccounts || financeData.customAccounts.length === 0) {
    financeData.customAccounts = [
        { id: 'Efectivo', name: 'Efectivo', category: 'asset', isDefault: false, showWhenZero: false }
    ];
}
if (financeData.monthlyBudget === undefined) {
    financeData.monthlyBudget = 0;
}
if (financeData.hideZeroAccounts === undefined) {
    financeData.hideZeroAccounts = false;
}

// Inicialización de categorías por defecto si no existen
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
            { name: '🎁 Prima de Servicios', subcategories: [] },
            { name: '💰 Cesantías e Intereses', subcategories: [] },
            { name: '💻 Honorarios / Ventas', subcategories: [] },
            { name: '📈 Rendimientos', subcategories: [] },
            { name: '✨ Otros Ingresos', subcategories: [] }
        ]
    };
} else {
    financeData.categories.expense.forEach(cat => { 
        if (cat.subcategories) {
            cat.subcategories = cat.subcategories.map(sub => (typeof sub === 'string') ? { name: sub, limit: 0 } : sub); 
        }
    });
    financeData.categories.income.forEach(cat => { 
        if (cat.subcategories) {
            cat.subcategories = cat.subcategories.map(sub => (typeof sub === 'string') ? { name: sub, limit: 0 } : sub); 
        }
    });
}

if (!financeData.categoryBudgets) {
    financeData.categoryBudgets = {};
}
if (!financeData.plannerExtras) {
    financeData.plannerExtras = [];
}
// Metas de Salud Financiera por defecto
if (!financeData.healthGoals) {
    financeData.healthGoals = { margin: 15, liquidity: 3, debt: 30, networth: 10 };
}

financeData.customAccounts.forEach(acc => {
    if (!acc.category) acc.category = 'asset';
    if (acc.category === 'liability') acc.category = 'debt';
    if (acc.isDefault === undefined) acc.isDefault = false;
    if (acc.showWhenZero === undefined) acc.showWhenZero = false;
});
localStorage.setItem('myFinances', JSON.stringify(financeData));

// --- 4. MOTOR MATEMÁTICO, DECIMALES, CALCULADORA Y FORMATOS ---
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
    const clean = round2(amount);
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP',
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(clean);
};

const formatCompact = (amount) => {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`;
    return `${sign}${abs.toFixed(2)}`;
};

// Evaluador matemático puro para la calculadora integrada (sin eval)
const evaluateCalculatorExpression = (rawExpr) => {
    if (!rawExpr) return { valid: true, value: 0 };
    let clean = String(rawExpr)
        .replace(/\s+/g, '')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/,/g, '.');

    // Quitar operadores sueltos al final para evaluar parciales
    clean = clean.replace(/[+\-*/.]+$/, '');
    if (!clean) return { valid: true, value: 0 };

    // Tokenizar números y operadores
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

    // Resolver porcentajes
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

    // Primera pasada: multiplicación y división
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

    // Segunda pasada: suma y resta
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

// --- 5. LÓGICA FINANCIERA (BALANCES, DEUDAS, PRESUPUESTO Y FLUJO) ---
const getAccountObj = (id) => financeData.customAccounts.find(a => a.id === id) || { id: id, name: id, category: 'asset' };
const isLiabilityCategory = (cat) => cat === 'credit_card' || cat === 'debt';
const isTxClosed = (t) => t.status !== 'pending';

// ORDENAMIENTO INTELIGENTE (Prioriza predeterminada, luego alfabético)
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
        const defAsset = financeData.customAccounts.find(a => a.category === 'asset' && a.isDefault);
        if (defAsset) return defAsset.id;
        const firstAsset = sortAlphabeticallyWithDefault(financeData.customAccounts.filter(a => a.category === 'asset'))[0];
        return firstAsset ? firstAsset.id : 'Efectivo';
    }
    const defAny = financeData.customAccounts.find(a => a.isDefault);
    if (defAny) return defAny.id;
    const firstAcc = sortAlphabeticallyWithDefault(financeData.customAccounts)[0];
    return firstAcc ? firstAcc.id : 'Efectivo';
};

const getCategoryLimitForMonth = (catObj, monthIndex) => {
    let subcatsTotalLimit = 0;
    if (catObj.subcategories) {
        catObj.subcategories.forEach(sub => { 
            subcatsTotalLimit = round2(subcatsTotalLimit + round2(sub.limit || 0)); 
        });
    }
    if (subcatsTotalLimit > 0) return subcatsTotalLimit;

    const cfg = financeData.categoryBudgets[catObj.name];
    if (!cfg) return 0;
    if (typeof cfg === 'number') return round2(cfg);
    if (cfg.isMonthly && Array.isArray(cfg.months)) {
        return round2(cfg.months[monthIndex] || 0);
    }
    return round2(cfg.general || 0);
};

const getBudgetedAmountForSelection = (type, categoryName, subcategoryName, monthIndex) => {
    if (!type || type === 'transfer' || !categoryName) return 0;
    const catList = financeData.categories[type] || [];
    const catObj = catList.find(c => c.name === categoryName);
    if (!catObj) return 0;

    if (subcategoryName && subcategoryName !== 'General' && Array.isArray(catObj.subcategories)) {
        const subObj = catObj.subcategories.find(s => s.name === subcategoryName);
        if (subObj && round2(subObj.limit || 0) > 0) {
            return round2(subObj.limit);
        }
    }

    const cfg = financeData.categoryBudgets[catObj.name];
    if (!cfg) return 0;
    if (typeof cfg === 'number') return round2(cfg);
    if (cfg.isMonthly && Array.isArray(cfg.months)) {
        return round2(cfg.months[monthIndex] || 0);
    }
    return round2(cfg.general || 0);
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
const computeBalancesUpTo = (targetMonthId) => {
    const bals = {};
    financeData.customAccounts.forEach(acc => {
        bals[acc.id] = 0;
    });

    financeData.transactions.forEach(t => {
        if (t.monthId <= targetMonthId && isTxClosed(t)) {
            const accObj = getAccountObj(t.account);
            const toAccObj = t.toAccount ? getAccountObj(t.toAccount) : null;
            const amt = round2(t.amount);

            if (t.type === 'income') {
                if (isLiabilityCategory(accObj.category)) {
                    if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] - amt);
                } else {
                    if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] + amt);
                }
            } else if (t.type === 'expense') {
                if (isLiabilityCategory(accObj.category)) {
                    if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] + amt);
                } else {
                    if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] - amt);
                }
            } else if (t.type === 'transfer') {
                if (isLiabilityCategory(accObj.category)) {
                    if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] + amt);
                } else {
                    if (bals[t.account] !== undefined) bals[t.account] = round2(bals[t.account] - amt);
                }

                if (toAccObj) {
                    if (isLiabilityCategory(toAccObj.category)) {
                        if (bals[t.toAccount] !== undefined) bals[t.toAccount] = round2(bals[t.toAccount] - amt);
                    } else {
                        if (bals[t.toAccount] !== undefined) bals[t.toAccount] = round2(bals[t.toAccount] + amt);
                    }
                }
            }
        }
    });

    let assetsTotal = 0, cardsTotal = 0, debtsTotal = 0, fixedAssetsTotal = 0, pocketsTotal = 0;
    
    financeData.customAccounts.forEach(acc => {
        const b = round2(bals[acc.id] || 0);
        if (acc.category === 'credit_card') {
            cardsTotal = round2(cardsTotal + b);
        } else if (acc.category === 'debt') {
            debtsTotal = round2(debtsTotal + b);
        } else {
            assetsTotal = round2(assetsTotal + b);
        }
    });

    if (financeData.fixedAssets) {
        financeData.fixedAssets.forEach(fa => { 
            if (fa.status === 'active') fixedAssetsTotal = round2(fixedAssetsTotal + fa.currentValue); 
        });
    }
    
    if (financeData.pockets) {
        financeData.pockets.forEach(p => {
            pocketsTotal = round2(pocketsTotal + round2(p.principal || 0) + round2(p.yields || 0));
        });
    }

    const liabilitiesTotal = round2(cardsTotal + debtsTotal);
    const netWorth = round2(assetsTotal + fixedAssetsTotal + pocketsTotal - liabilitiesTotal);

    return { 
        bals, 
        assetsTotal, 
        cardsTotal, 
        debtsTotal, 
        liabilitiesTotal, 
        fixedAssetsTotal, 
        pocketsTotal, 
        netWorth 
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

// --- 6. CÁLCULO DE SALUD FINANCIERA (V2.3) ---
const calculateFinancialHealth = (monthId, snap) => {
    const calculateBorrowingCapacity = (monthId, customMaxPct = null) => {
    const snap = computeBalancesUpTo(monthId);
    const maxPct = customMaxPct !== null ? customMaxPct : (financeData.healthGoals?.debt || 30);

    // 1. Ingreso Neto Base (prioriza Salario Neto antes de descuentos de préstamos; si no hay, usa ingresos del mes)
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

    // 2. Cuotas mensuales comprometidas (Préstamos fijos + Cupos BNPL + Tarjetas de Crédito)
    let committedMonthly = 0;

    financeData.customAccounts.filter(a => a.category === 'debt').forEach(d => {
        const bal = Math.max(0, round2(snap.bals[d.id] || 0));
        if (bal > 0) {
            if (d.debtType === 'revolving') {
                const revQuotas = getPendingRevolvingPurchases(d.id).reduce((s, p) => s + p.nextQuota, 0);
                committedMonthly = round2(committedMonthly + revQuotas);
            } else {
                let q = round2(d.debtMonthlyPayment || 0);
                if (q === 0) {
                    q = calculateAmortization(d.debtOriginal || bal, d.debtTotalQuotes || 1, d.debtRate || 0, d.debtRateType || 'monthly').payment;
                }
                committedMonthly = round2(committedMonthly + q);
            }
        }
    });

    financeData.customAccounts.filter(a => a.category === 'credit_card').forEach(c => {
        const bal = Math.max(0, round2(snap.bals[c.id] || 0));
        if (bal > 0) {
            const pending = getPendingCardPurchases(c.id);
            if (pending.length > 0) {
                const ccQuota = pending.reduce((s, p) => s + p.nextQuota, 0);
                committedMonthly = round2(committedMonthly + Math.min(bal, ccQuota));
            } else {
                committedMonthly = round2(committedMonthly + round2(bal / 12));
            }
        }
    });

    // 3. Capacidad máxima, cuota libre y monto de préstamo estimado (tasa ref. 1,5% M.V.)
    const maxMonthlyCapacity = round2(baseIncome * (maxPct / 100));
    const availableMonthlyCapacity = round2(maxMonthlyCapacity - committedMonthly);
    const usedPct = baseIncome > 0 ? round2((committedMonthly / baseIncome) * 100) : 0;

    const refRate = 0.015;
    const calcMaxPrincipal = (months) => {
        if (availableMonthlyCapacity <= 0) return 0;
        return round2(availableMonthlyCapacity * ((1 - Math.pow(1 + refRate, -months)) / refRate));
    };

    return {
        baseIncome,
        incomeSource,
        maxPct,
        usedPct,
        maxMonthlyCapacity,
        committedMonthly,
        availableMonthlyCapacity,
        estLoan24m: calcMaxPrincipal(24),
        estLoan36m: calcMaxPrincipal(36)
    };
};
    const goals = financeData.healthGoals || { margin: 15, liquidity: 3, debt: 30, networth: 10 };
    const flow = getMonthlyFlow(monthId, false);
    
    // 1. Pilar Flujo (Ingresos vs Gastos)
    let margin = 0, scoreFlow = 0;
    if (flow.inc > 0) {
        margin = round2((flow.net / flow.inc) * 100);
        if (margin >= goals.margin) {
            scoreFlow = 100;
        } else {
            scoreFlow = Math.max(0, Math.round((margin / goals.margin) * 100));
        }
    }

    // 2. Pilar Liquidez (Meses de reserva)
    let monthsReserve = 0, scoreLiq = 0;
    if (flow.exp > 0) {
        monthsReserve = round2(snap.assetsTotal / flow.exp);
        if (monthsReserve >= goals.liquidity) {
            scoreLiq = 100;
        } else {
            scoreLiq = Math.max(0, Math.round((monthsReserve / goals.liquidity) * 100));
        }
    } else if (snap.assetsTotal > 0) {
        scoreLiq = 100;
    }

    // 3. Pilar Deuda (Carga mensual)
    let debtBurden = 0, scoreDebt = 100;
    let monthlyDebtPayments = 0;
    
    financeData.customAccounts.filter(a => a.category === 'debt').forEach(d => {
        const bal = round2(snap.bals[d.id] || 0);
        if (bal > 0) {
            monthlyDebtPayments += round2(d.debtMonthlyPayment || 0);
        }
    });
    
    // Aproximación cuotas TC (si no hay detalle de cuotas individuales)
    financeData.customAccounts.filter(a => a.category === 'credit_card').forEach(c => {
        const bal = round2(snap.bals[c.id] || 0);
        if (bal > 0) {
            monthlyDebtPayments += round2(bal / 12); 
        }
    });

    if (flow.inc > 0) {
        debtBurden = round2((monthlyDebtPayments / flow.inc) * 100);
        if (debtBurden <= goals.debt) {
            scoreDebt = 100;
        } else if (debtBurden >= 60) {
            scoreDebt = 0;
        } else {
            scoreDebt = Math.max(0, 100 - Math.round(((debtBurden - goals.debt) / (60 - goals.debt)) * 100));
        }
    }

    // 4. Pilar Patrimonio (Activos vs Pasivos)
    let scoreNw = 0, totalAssets = snap.assetsTotal + snap.fixedAssetsTotal + snap.pocketsTotal;
    if (totalAssets > 0) {
        const liabilityRatio = (snap.liabilitiesTotal / totalAssets) * 100;
        if (liabilityRatio === 0) {
            scoreNw = 100;
        } else if (liabilityRatio >= 100) {
            scoreNw = 0;
        } else {
            scoreNw = Math.max(0, 100 - Math.round(liabilityRatio));
        }
    }

    // Puntuación Global (Promedio simple)
    const globalScore = Math.round((scoreFlow + scoreLiq + scoreDebt + scoreNw) / 4);

    return {
        scores: { flow: scoreFlow, liquidity: scoreLiq, debt: scoreDebt, networth: scoreNw, global: globalScore },
        metrics: { margin, monthsReserve, debtBurden, netWorth: snap.netWorth },
        goals
    };
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
        .filter(t => t.account === cardId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t))
        .map(t => {
            const inst = Math.max(1, parseInt(t.installments) || 1);
            const paid = Math.max(0, parseInt(t.paidInstallments) || 0);
            const rate = inst === 1 ? 0 : (parseFloat(t.rate) || 0);
            const rateType = t.rateType || 'monthly';
            
            const amort = calculateAmortization(round2(t.amount), inst, rate, rateType);
            const remSchedule = amort.schedule.slice(paid);
            const rawRemCapital = round2(remSchedule.reduce((s, r) => s + r.principal, 0));
            const remCapital = Math.max(0, round2(rawRemCapital - round2(t.extraPrincipalPaid || 0)));
            const nextQuota = remSchedule.length > 0 ? Math.min(remSchedule[0].payment, round2(remCapital + remSchedule[0].interest)) : 0;
            
            return { 
                tx: t, 
                installments: inst, 
                paidInstallments: paid, 
                remainingInstallments: Math.max(0, inst - paid), 
                rate, 
                rateType, 
                zeroInterest: !!t.zeroInterest || rate === 0, 
                nextPeriod: paid + 1, 
                nextQuota: round2(nextQuota), 
                remCapital 
            };
        })
        .filter(item => item.remainingInstallments > 0 && item.remCapital > 0)
        .sort((a, b) => a.tx.id - b.tx.id);
};

// NUEVO V2.3: COMPRAS EN CUPO ROTATIVO (BNPL)
const getPendingRevolvingPurchases = (debtId) => {
    return financeData.transactions
        .filter(t => t.account === debtId && t.type === 'expense' && !t.isAdjustment && isTxClosed(t))
        .map(t => {
            const inst = Math.max(1, parseInt(t.installments) || 1);
            const paid = Math.max(0, parseInt(t.paidInstallments) || 0);
            const rate = inst === 1 ? 0 : (parseFloat(t.rate) || 0);
            const rateType = t.rateType || 'monthly';
            
            const amort = calculateAmortization(round2(t.amount), inst, rate, rateType);
            const remSchedule = amort.schedule.slice(paid);
            const rawRemCapital = round2(remSchedule.reduce((s, r) => s + r.principal, 0));
            const remCapital = Math.max(0, round2(rawRemCapital - round2(t.extraPrincipalPaid || 0)));
            const nextQuota = remSchedule.length > 0 ? Math.min(remSchedule[0].payment, round2(remCapital + remSchedule[0].interest)) : 0;
            
            return { 
                tx: t, 
                installments: inst, 
                paidInstallments: paid, 
                remainingInstallments: Math.max(0, inst - paid), 
                rate, 
                rateType, 
                nextPeriod: paid + 1, 
                nextQuota: round2(nextQuota), 
                remCapital 
            };
        })
        .filter(item => item.remainingInstallments > 0 && item.remCapital > 0)
        .sort((a, b) => a.tx.id - b.tx.id);
};

const revertTransferAllocation = (tx) => {
    if (!tx || tx.type !== 'transfer' || !Array.isArray(tx.allocatedItems)) return;
    
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

// --- 7. PARÁMETROS TRIBUTARIOS Y NÓMINA (ESTATUTO TRIBUTARIO) ---
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
    if (stored) {
        return { ...DEFAULT_TAX_PARAMS_2026, ...stored };
    }
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
    
    const effectiveTransport = overrideTransport !== null ? round2(overrideTransport) : ((config.transportAuto !== false) ? (basic > 0 && basic <= round2(smmlv * 2) ? rawTransport : 0) : rawTransport);
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

    // V2.3: Descuentos de Nómina por Deudas
    let payrollDebtDeductions = 0;
    financeData.customAccounts.filter(a => a.category === 'debt' && a.payrollDeduction).forEach(d => {
        let quota = round2(d.debtMonthlyPayment || 0);
        // Si no tiene cuota manual y es préstamo fijo, calcularla
        if (quota === 0 && d.debtType !== 'revolving') {
            quota = calculateAmortization(d.debtOriginal || 0, d.debtTotalQuotes || 1, d.debtRate || 0, d.debtRateType || 'monthly').payment;
        }
        payrollDebtDeductions += quota;
    });

    const grossNet = round2(basic + effectiveTransport + nonSalary - health - pension - fsp - ret);
    // Neto real en bolsillo (después de pagar las deudas marcadas como descuento de nómina)
    const net = Math.max(0, round2(grossNet - payrollDebtDeductions)); 

    const biweeklyRetMode = config.biweeklyRetMode || 'prorated';
    const gross1Q = round2((basic + effectiveTransport + nonSalary) / 2);
    const gross2Q = round2((basic + effectiveTransport + nonSalary) - gross1Q);
    
    const ssTotal = round2(health + pension + fsp);
    const ss1Q = round2(ssTotal / 2);
    const ss2Q = round2(ssTotal - ss1Q);
    
    const ret1Q = biweeklyRetMode === 'second_half' ? 0 : round2(ret / 2);
    const ret2Q = biweeklyRetMode === 'second_half' ? ret : round2(ret - ret1Q);
    
    const debt1Q = round2(payrollDebtDeductions / 2);
    const debt2Q = round2(payrollDebtDeductions - debt1Q);
    
    const net1Q = Math.max(0, round2(gross1Q - ss1Q - ret1Q - debt1Q));
    const net2Q = Math.max(0, round2(gross2Q - ss2Q - ret2Q - debt2Q));

    const prestacionesBase = round2(basic + effectiveTransport);
    const halfPrimaBruta = round2(prestacionesBase / 2);
    const primaExempt25 = Math.min(round2(halfPrimaBruta * 0.25), exempt25MonthlyCapCOP, globalUvtMonthlyCapCOP);
    const primaBaseGravable = Math.max(0, round2(halfPrimaBruta - primaExempt25));
    const primaUVT = uvt > 0 ? round2(primaBaseGravable / uvt) : 0;
    
    let retPrima = 0;
    if (retProc === '1') retPrima = round2(calcArt383TableUVT(primaUVT) * uvt);
    else if (retProc === '2') retPrima = round2(primaBaseGravable * (effectiveRetPct / 100));
    
    const halfPrimaNeta = Math.max(0, round2(halfPrimaBruta - retPrima));

    let startObj = new Date(today.getFullYear(), 0, 1);
    if (config.startDate) { 
        const [sy, sm, sd] = config.startDate.split('-').map(Number); 
        startObj = new Date(sy, sm - 1, sd); 
    }
    
    const currentYear = today.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const daysYear = startObj > today ? 0 : calcCommercialDays(startObj > startOfYear ? startObj : startOfYear, today);
    const semStart = today.getMonth() < 6 ? new Date(currentYear, 0, 1) : new Date(currentYear, 6, 1);
    const daysSemester = startObj > today ? 0 : calcCommercialDays(startObj > semStart ? startObj : semStart, today);

    let liqPrima = round2((prestacionesBase * daysSemester) / 360);
    let liqCesantias = round2((prestacionesBase * daysYear) / 360);
    let liqIntereses = round2((liqCesantias * daysYear * 0.12) / 360);
    
    let advPrima = 0, advCes = 0, advInt = 0;
    financeData.transactions.forEach(t => {
        if (t.type === 'income' && isTxClosed(t)) {
            const txDate = new Date(t.id);
            if (txDate.getFullYear() === currentYear) {
                if (t.benefitType === 'prima') { 
                    if (txDate >= semStart) advPrima = round2(advPrima + t.amount); 
                } 
                else if (t.benefitType === 'intereses_cesantias') advInt = round2(advInt + t.amount);
                else if (t.benefitType === 'cesantias') advCes = round2(advCes + t.amount);
            }
        }
    });

    return {
        params, uvt, smmlv, basic, nonSalary, excessNonSalary, ibc, effectiveTransport, health, pension, fsp,
        ingresosBrutos, incrngo, rentaLiquida, dedPrepaid, dedHousing, dedDependents, dedVoluntary, totalDeduccionesArt387,
        exempt25, totalBeneficiosBrutos, beneficiosLimitados, baseGravable, numeroUVT, retProc, effectiveRetPct, ret,
        net, grossNet, payrollDebtDeductions, biweeklyRetMode, gross1Q, gross2Q, ss1Q, ss2Q, ret1Q, ret2Q, net1Q, net2Q,
        prestacionesBase, halfPrimaBruta, retPrima, halfPrimaNeta, daysYear, daysSemester, startObj, currentYear,
        liqPrima: Math.max(0, round2(liqPrima - advPrima)), liqCesantias: Math.max(0, round2(liqCesantias - advCes)), liqIntereses: Math.max(0, round2(liqIntereses - advInt))
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

const getMonthId = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const getShortMonthLabel = (date) => date.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
const formatMonthName = (date) => date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
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
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);
    
    R = parseInt(R * (100 + percent) / 100); 
    G = parseInt(G * (100 + percent) / 100); 
    B = parseInt(B * (100 + percent) / 100);
    
    R = (R<255)?R:255; 
    G = (G<255)?G:255; 
    B = (B<255)?B:255;
    
    const rHex = (R.toString(16).length==1) ? "0"+R.toString(16) : R.toString(16);
    const gHex = (G.toString(16).length==1) ? "0"+G.toString(16) : G.toString(16);
    const bHex = (B.toString(16).length==1) ? "0"+B.toString(16) : B.toString(16);
    
    return "#" + rHex + gHex + bHex;
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