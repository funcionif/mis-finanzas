// ==========================================
// modules.js (v2.2.0 - Fintech Editorial)
// MÓDULOS ESPECIALIZADOS, ANALÍTICA Y SIMULADORES
// ==========================================

// ==========================================
// MÓDULO 1: ANALÍTICA VISUAL (GRÁFICOS SVG Y COMPARATIVAS)
// ==========================================
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
    const W = 340, H = 130, padL = 68, padR = 10, padT = 14, padB = 22;
    const plotW = W - padL - padR, plotH = H - padT - padB, baseY = padT + plotH;

    let svg = `<svg viewBox="0 0 ${W} ${H}">
        <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="rgba(148,163,184,0.18)" stroke-dasharray="3,3"/>
        <line x1="${padL}" y1="${padT + plotH / 2}" x2="${W - padR}" y2="${padT + plotH / 2}" stroke="rgba(148,163,184,0.18)" stroke-dasharray="3,3"/>
        <line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="rgba(148,163,184,0.45)" stroke-width="1"/>
        <text x="${padL - 6}" y="${padT + 4}" text-anchor="end" font-size="8" fill="#94a3b8">${formatCompact(maxVal)}</text>
        <text x="${padL - 6}" y="${padT + plotH / 2 + 3}" text-anchor="end" font-size="8" fill="#94a3b8">${formatCompact(maxVal / 2)}</text>
        <text x="${padL - 6}" y="${baseY}" text-anchor="end" font-size="8" fill="#94a3b8">$0</text>`;

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
    const trendTop = prevM.exp > 0
        ? `Gastos ${expDeltaPct > 0 ? '+' : ''}${String(expDeltaPct).replace('.', ',')}% ${trendArrow}`
        : `Variación ${netDelta >= 0 ? '+' : ''}${formatCompact(netDelta)}`;
    const trendSub = `vs. ${prevM.label}`;

    const bentoComparisonHtml = `
        <div class="bento-cf-grid">
            <div class="bento-cf-card">
                <span class="bento-cf-label">Total Ingresos</span>
                <strong class="positive" style="white-space:nowrap;">${formatMoneyHtml(currM.inc)}</strong>
            </div>
            <div class="bento-cf-card">
                <span class="bento-cf-label">Total Gastos</span>
                <strong class="negative" style="white-space:nowrap;">${formatMoneyHtml(currM.exp)}</strong>
            </div>
        </div>
        <div class="bento-cf-pill" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div style="min-width:0; flex:1; line-height:1.35;">
                <span style="display:block; font-size:11.5px; font-weight:700; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${trendTop}</span>
                <small style="display:block; font-size:10.5px; color:var(--text-muted);">${trendSub}</small>
            </div>
            <div style="text-align:right; flex-shrink:0; white-space:nowrap; line-height:1.3;">
                <small style="display:block; font-size:9.5px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px;">Flujo neto</small>
                <strong class="${currM.net >= 0 ? 'positive' : 'negative'}" style="font-size:13px; white-space:nowrap;">${formatCompact(currM.net)}</strong>
            </div>
        </div>
    `;

    chartContainer.innerHTML = svg + `</svg>` + bentoComparisonHtml;

    if (document.getElementById('cf-prev-col')) document.getElementById('cf-prev-col').innerText = getShortMonthLabel(prevDate);
    if (document.getElementById('cf-curr-col')) document.getElementById('cf-curr-col').innerText = getShortMonthLabel(baseDate);
    const cfBody = document.getElementById('cf-comp-body');
    if (cfBody) {
        cfBody.innerHTML = `
            <tr><td style="white-space:nowrap;"><i class="dot" style="background:#10b981;"></i>Entradas</td><td style="white-space:nowrap;">${formatMoney(months[1].inc)}</td><td class="positive" style="white-space:nowrap;">${formatMoney(months[2].inc)}</td></tr>
            <tr><td style="white-space:nowrap;"><i class="dot" style="background:#ff3b30;"></i>Salidas</td><td style="white-space:nowrap;">${formatMoney(-months[1].exp)}</td><td class="negative" style="white-space:nowrap;">${formatMoney(-months[2].exp)}</td></tr>
            <tr><td style="white-space:nowrap;">Flujo neto</td><td style="white-space:nowrap;">${formatMoney(months[1].net)}</td><td class="${months[2].net >= 0 ? 'positive' : 'negative'}" style="white-space:nowrap;">${formatMoney(months[2].net)}</td></tr>
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

let analyticsTagsScope = 'all';

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

// ==========================================
// MÓDULO 2: CONTROL ANUAL MATRICIAL (12M)
// ==========================================
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
        for (let i = 0; i < 12; i++) { totIncP = round2(totIncP + incPtto[i]); totIncR = round2(totIncR + incReal[i]); totExpP = round2(totExpP + expPtto[i]); totExpR = round2(totExpR + expReal[i]); }
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
                <div class="dash-strip-item"><small>Flujo Neto</small><strong class="${totNetR >= 0 ? 'positive' : 'negative'}" style="font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.5px;">${fmtAnnual(totNetR)}</strong><span style="font-size:9.5px; color:var(--text-muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Ptto: ${fmtAnnual(totNetP)}</span></div>
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
            const isFutureAndEmpty = annualViewYear >= currY && (annualViewYear > currY || i > currM) && incPtto[i] === 0 && expPtto[i] === 0 && incReal[i] === 0 && expReal[i] === 0;
            
            if (!isFutureAndEmpty) {
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
                        <strong class="${netR >= 0 ? 'positive' : 'negative'}" style="text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fmtAnnual(netR)}</strong>
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
        for (let i = 0; i < 12; i++) { totP = round2(totP + arrP[i]); totR = round2(totR + arrR[i]); }

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
            for (let i = 0; i < 12; i++) { catTotP = round2(catTotP + r.pttoArr[i]); catTotR = round2(catTotR + r.realArr[i]); }
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

// ==========================================
// MÓDULO 3: PRESUPUESTO, CATEGORÍAS Y ARRASTRE (ROLLOVER)
// ==========================================
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
document.getElementById('subcat-edit-rollover')?.addEventListener('change', () => updateRolloverHint('subcat-edit-rollover', 'subcat-edit-rollover-hint', 'subcat-edit-rollover-title', 'subcat-edit-rollover-desc'));

let isBudgetEditMode = false;

const moveBudgetCategoryByOffset = (catName, delta) => {
    const allCats = financeData.categories[currentBudgetType];
    if (!Array.isArray(allCats)) return;

    const showArchived = document.getElementById('toggle-archived-cats')?.checked;
    const visibleCats = showArchived ? allCats : allCats.filter(c => !c.isArchived);

    const visIdx = visibleCats.findIndex(c => c.name === catName);
    const targetVisIdx = visIdx + delta;
    if (visIdx === -1 || targetVisIdx < 0 || targetVisIdx >= visibleCats.length) return;

    const targetName = visibleCats[targetVisIdx].name;
    const fromIdx = allCats.findIndex(c => c.name === catName);
    const toIdx = allCats.findIndex(c => c.name === targetName);
    if (fromIdx === -1 || toIdx === -1) return;

    const temp = allCats[fromIdx];
    allCats[fromIdx] = allCats[toIdx];
    allCats[toIdx] = temp;

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    renderBudgetView();
    if (typeof renderCategoryOptions === 'function') {
        renderCategoryOptions(document.getElementById('type')?.value || 'expense');
    }
};

const ensureBudgetOrderButton = () => {
    const annualBtn = document.getElementById('open-annual-from-budget-btn');
    if (!annualBtn || !annualBtn.parentElement) return;

    let orderBtn = document.getElementById('toggle-edit-budget-cats-btn');
    if (!orderBtn) {
        orderBtn = document.createElement('button');
        orderBtn.type = 'button';
        orderBtn.id = 'toggle-edit-budget-cats-btn';
        orderBtn.className = annualBtn.className || 'btn-sm btn-secondary';
        orderBtn.style.cssText = 'white-space:nowrap; font-size:11.5px; padding:5px 10px;';
        annualBtn.style.whiteSpace = 'nowrap';
        annualBtn.style.fontSize = '11.5px';
        annualBtn.style.padding = '5px 10px';
        annualBtn.parentElement.style.gap = '6px';
        annualBtn.parentElement.insertBefore(orderBtn, annualBtn);

        orderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isBudgetEditMode = !isBudgetEditMode;
            renderBudgetView();
        });

        document.querySelector('#budget-modal .btn-close-modal')?.addEventListener('click', () => {
            isBudgetEditMode = false;
        });
    }

    orderBtn.innerText = isBudgetEditMode ? '✓ Listo' : 'Ordenar';
    orderBtn.classList.toggle('active', isBudgetEditMode);
};

const renderBudgetView = () => {
    ensureBudgetOrderButton();
    const listContainer = document.getElementById('budget-categories-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (!listContainer.dataset.orderBound) {
        listContainer.dataset.orderBound = '1';
        listContainer.addEventListener('click', (e) => {
            const moveBtn = e.target.closest('.widget-move-btn[data-cat-move]');
            if (!moveBtn) return;
            e.stopPropagation();
            const catName = moveBtn.getAttribute('data-cat-move');
            const dir = parseInt(moveBtn.getAttribute('data-dir'), 10);
            if (catName && !isNaN(dir)) moveBudgetCategoryByOffset(catName, dir);
        });
    }

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
    let categories = [...(financeData.categories[currentBudgetType] || [])];
    if (!showArchived) categories = categories.filter(c => !c.isArchived);
    const monthTransactions = financeData.transactions.filter(t => !t.isDeleted && !t.isTripIsolated && getTxMonthId(t) === viewMonthId && t.type === currentBudgetType && !t.isAdjustment && isTxClosed(t));
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

    categories.forEach((catObj, visIdx) => {
        const cat = catObj.name, spent = totalsByCat[cat] || 0;
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
        const safeAttrCat = cat.replace(/"/g, '&quot;');
        const editBarHtml = isBudgetEditMode ? `
            <div class="widget-edit-controls">
                <span class="widget-edit-label">⠿ ${cleanCatName(cat)}</span>
                <div class="widget-edit-btns">
                    <button type="button" class="widget-move-btn" data-cat-move="${safeAttrCat}" data-dir="-1" ${visIdx === 0 ? 'disabled' : ''}>▲ Subir</button>
                    <button type="button" class="widget-move-btn" data-cat-move="${safeAttrCat}" data-dir="1" ${visIdx === categories.length - 1 ? 'disabled' : ''}>▼ Bajar</button>
                </div>
            </div>` : '';

        listContainer.innerHTML += `
            <div class="budget-cat-card${isBudgetEditMode ? ' edit-mode' : ''}">
                ${editBarHtml}
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

        if (subListEl) {
            if (catObj.subcategories && catObj.subcategories.length > 0) {
                const sortedSubs = [...catObj.subcategories].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
                subListEl.innerHTML = sortedSubs.map(sub => `
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
            if (inputM) inputM.value = genVal > 0 ? formatNumberInput(genVal) : '';
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

    if (oldCatName !== newCatName) {
        catObj.name = newCatName;
        financeData.transactions.forEach(t => {
            if (t.category === oldCatName && t.type === currentBudgetType) t.category = newCatName;
        });
        financeData.subscriptions.forEach(sub => {
            if (sub.category === oldCatName) sub.category = newCatName;
        });
        const oldBudget = financeData.categoryBudgets[oldCatName];
        if (oldBudget !== undefined) {
            financeData.categoryBudgets[newCatName] = oldBudget;
            delete financeData.categoryBudgets[oldCatName];
        }
    }
    
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
                if (oldSubName !== newSubName) {
                    subObj.name = newSubName;
                    financeData.transactions.forEach(t => {
                        if (t.category === newCatName && t.type === currentBudgetType && t.subcategory === oldSubName) {
                            t.subcategory = newSubName;
                        }
                    });
                }
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
    setTimeout(() => updateRolloverHint('new-cat-rollover', 'new-cat-rollover-hint', 'new-cat-rollover-title', 'new-cat-rollover-desc'), 50);
});
document.getElementById('tab-budget-income')?.addEventListener('click', () => {
    currentBudgetType = 'income';
    document.getElementById('tab-budget-income')?.classList.add('active');
    document.getElementById('tab-budget-expense')?.classList.remove('active');
    renderBudgetView();
    setTimeout(() => updateRolloverHint('new-cat-rollover', 'new-cat-rollover-hint', 'new-cat-rollover-title', 'new-cat-rollover-desc'), 50);
});

window.deleteCategory = (catName, type) => {
    const linkedTxs = financeData.transactions.filter(t => t.type === type && t.category === catName);
    const linkedSubs = financeData.subscriptions.filter(s => s.category === catName);

    if (linkedTxs.length > 0 || linkedSubs.length > 0) {
        const fallbackCat = prompt(`⚠️ ¡Atención! La categoría "${catName}" tiene ${linkedTxs.length} movimientos históricos y ${linkedSubs.length} suscripciones vinculadas.\n\nPara no perder tus estadísticas, ingresa el nombre EXACTO de la categoría a la que quieres mover este historial (Ej: Otros Gastos):`);
        if (!fallbackCat) return;
        const fallbackExists = financeData.categories[type].some(c => c.name.toLowerCase() === fallbackCat.trim().toLowerCase());
        if (!fallbackExists) {
            alert(`❌ La categoría "${fallbackCat}" no existe. Debes escribir el nombre exacto de una categoría válida.`);
            return;
        }
        const exactTargetName = financeData.categories[type].find(c => c.name.toLowerCase() === fallbackCat.trim().toLowerCase()).name;
        linkedTxs.forEach(t => {
            t.category = exactTargetName;
            t.subcategory = 'General';
        });
        linkedSubs.forEach(s => s.category = exactTargetName);
    } else {
        if (!confirm(`¿Estás seguro de eliminar la categoría "${catName}" y TODAS sus subcategorías?`)) return;
    }

    financeData.categories[type] = financeData.categories[type].filter(c => c.name !== catName);
    if (financeData.categoryBudgets[catName]) delete financeData.categoryBudgets[catName];
    
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    renderCategoryOptions(document.getElementById('type')?.value || 'expense');
    renderBudgetView();
    updateDashboard();
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
        updateDashboard();
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

    financeData.categories[currentBudgetType].push({ name: nameInput, isFixed, rollover, subcategories: [] });
    if (limitInput > 0) financeData.categoryBudgets[nameInput] = limitInput;

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('add-category-form').reset();
    document.getElementById('new-cat-rollover-hint')?.classList.add('hidden');
    e.target.closest('details')?.removeAttribute('open');
    hasUnsavedChanges = false;
    renderCategoryOptions(document.getElementById('type')?.value || 'expense');
    renderBudgetView();
});

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

    if (freqSelect) freqSelect.value = subObj.frequency || 'monthly';
    if (monthSelect) {
        monthSelect.value = subObj.startMonth || 0;
        monthSelect.disabled = false;
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
            if (inputM) inputM.value = subObj.limit > 0 ? formatNumberInput(subObj.limit) : '';
        }
    }
    hasUnsavedChanges = false;
    modalEl.classList.remove('hidden');
};

document.getElementById('subcat-is-monthly-check')?.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.getElementById('subcat-general-limit-box')?.classList.add('hidden');
        document.getElementById('subcat-12months-grid')?.classList.remove('hidden');
        const limit = parseMoneyInput(document.getElementById('subcat-general-limit-input')?.value);
        const freq = document.getElementById('subcat-freq-select')?.value || 'monthly';
        const startM = parseInt(document.getElementById('subcat-month-select')?.value, 10) || 0;
        for (let i = 0; i < 12; i++) {
            const input = document.getElementById(`sub-b-m-${i}`);
            if (input) {
                input.value = (isPeriodMatching(freq, startM, i) && limit > 0) ? formatNumberInput(limit) : '';
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

// ==========================================
// MÓDULO 4: CUENTAS, TARJETAS, PRÉSTAMOS, COBROS Y PLAN AVALANCHA
// ==========================================
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

        const payrollTag = acc.payrollDeduction
            ? ` • <span style="display:inline-flex; align-items:center; gap:3px; vertical-align:middle;">${renderIcon('briefcase', 11)} Libranza</span>`
            : '';
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

const syncNewAccountGmfUI = () => {
    const subType = document.getElementById('new-account-subtype')?.value || 'savings';
    const box = document.getElementById('new-account-gmf-box');
    const exemptCheck = document.getElementById('new-account-gmf-exempt');
    const hintEl = document.getElementById('new-account-gmf-hint');
    const subEl = document.getElementById('new-account-gmf-sub');
    if (!box || !exemptCheck || !hintEl || !subEl) return;

    const uvt = round2((typeof getTaxParams === 'function' ? getTaxParams().uvt : 52374) || 52374);
    const existingExempt = (financeData.customAccounts || []).find(a => a.category === 'asset' && a.gmfExempt);

    if (subType === 'cash' || subType === 'checking') {
        box.classList.add('hidden');
        exemptCheck.checked = false;
        exemptCheck.disabled = false;
        exemptCheck.closest('.switch-row').style.opacity = '1';
        return;
    }

    box.classList.remove('hidden');

    if (existingExempt) {
        exemptCheck.checked = false;
        exemptCheck.disabled = true;
        exemptCheck.closest('.switch-row').style.opacity = '0.5';
        subEl.innerHTML = `<span style="color:#d97706; display:inline-flex; align-items:center; gap:5px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Bloqueado: "${stripLeadingEmoji(existingExempt.name)}" ya está exenta.</span>`;
        hintEl.innerHTML = '';
        hintEl.classList.add('hidden');
    } else {
        exemptCheck.disabled = false;
        exemptCheck.closest('.switch-row').style.opacity = '1';
        subEl.innerHTML = `Tope exento hasta 350 UVT/mes (1 cuenta por titular)`;
        hintEl.classList.remove('hidden');
        
        const hintContent = subType === 'wallet'
            ? `Las billeteras tienen exención automática hasta <b>65 UVT/mes</b> sin gastar tu marca de 350 UVT. Actívalo solo si elegiste esta cuenta para el tope principal.`
            : `Por ley en Colombia solo puedes marcar <b>1 cuenta de ahorros</b> exenta hasta 350 UVT/mes (${formatMoney(round2(350 * uvt))}).`;
            
        hintEl.innerHTML = `
            <div style="background:rgba(0,0,0,0.03); border:1px solid var(--border-color); border-radius:10px; padding:8px 10px; font-size:10.5px; color:var(--text-muted); line-height:1.35; display:flex; align-items:flex-start; gap:6px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span>${hintContent}</span>
            </div>
        `;
    }
};

document.getElementById('new-account-subtype')?.addEventListener('change', syncNewAccountGmfUI);
document.getElementById('new-account-gmf-exempt')?.addEventListener('change', syncNewAccountGmfUI);
syncNewAccountGmfUI();

// Formularios de Creación de Cuentas, Tarjetas y Préstamos
document.getElementById('add-account-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-account-name').value.trim();
    const initial = parseMoneyInput(document.getElementById('new-account-initial').value);
    const makeDefault = !!document.getElementById('new-account-default')?.checked;
    const excludeLiquidity = !document.getElementById('new-account-liquidity')?.checked;
    const accountSubType = document.getElementById('new-account-subtype')?.value || 'savings';
    const gmfExempt = (accountSubType === 'savings' || accountSubType === 'wallet') && !!document.getElementById('new-account-gmf-exempt')?.checked;

    if (!name || financeData.customAccounts.some(a => a.id.toLowerCase() === name.toLowerCase())) {
        alert('Nombre de cuenta inválido o duplicado.');
        return;
    }

    if (gmfExempt) {
        financeData.customAccounts.forEach(a => { if (a.category === 'asset') a.gmfExempt = false; });
    }

    financeData.customAccounts.push({
        id: name,
        name,
        category: 'asset',
        accountSubType,
        gmfExempt,
        gmfReviewed: true,
        isDefault: false,
        showWhenZero: false,
        excludeFromLiquidity: excludeLiquidity
    });
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

    const initQuotaGroup = document.getElementById('new-card-initial-quota-group');
    if (initQuotaGroup) initQuotaGroup.classList.toggle('hidden', dbt <= 0);

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
    renderCardsBreakdown(currentBalances);
});

document.getElementById('new-debt-type')?.addEventListener('change', (e) => {
    const type = e.target.value;
    const isRevolving = type === 'revolving';
    const isEducation = type === 'education';
    
    const nameInput = document.getElementById('new-debt-name');
    const commerceGroup = document.getElementById('new-debt-revolving-commerce-group');
    const limitSection = document.getElementById('new-debt-revolving-limit-section');
    const fianzaGroup = document.getElementById('new-debt-fianza-group');
    const eduPeriodGroup = document.getElementById('new-debt-education-period-group');
    const rateInput = document.getElementById('new-debt-rate');
    
    if (nameInput) {
        nameInput.placeholder = isRevolving ? 'Ej. Addi, Sistecrédito' : (isEducation ? 'Universidad / Instituto (Ej. UNIR)' : 'Nombre (Ej. Crédito Vehículo)');
    }
    if (commerceGroup) commerceGroup.classList.toggle('hidden', !isRevolving);
    if (limitSection) limitSection.classList.toggle('hidden', !isRevolving);
    if (fianzaGroup) fianzaGroup.classList.toggle('hidden', !isRevolving);
    if (eduPeriodGroup) eduPeriodGroup.classList.toggle('hidden', !isEducation);
    
    if (rateInput && isEducation) {
        rateInput.value = '0';
        rateInput.readOnly = true;
    } else if (rateInput) {
        rateInput.readOnly = false;
    }
});

document.getElementById('new-debt-has-limit')?.addEventListener('change', (e) => {
    document.getElementById('new-debt-limit-amount-group')?.classList.toggle('hidden', !e.target.checked);
});

document.getElementById('edit-debt-type')?.addEventListener('change', (e) => {
    document.getElementById('edit-debt-revolving-limit-section')?.classList.toggle('hidden', e.target.value !== 'revolving');
});

document.getElementById('edit-debt-has-limit')?.addEventListener('change', (e) => {
    document.getElementById('edit-debt-limit-amount-group')?.classList.toggle('hidden', !e.target.checked);
});

document.getElementById('new-debt-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-debt-name').value.trim();
    const debtType = document.getElementById('new-debt-type')?.value || 'fixed';
    const commerceName = document.getElementById('new-debt-commerce')?.value.trim() || '';
    const payrollDeduction = document.getElementById('new-debt-payroll')?.checked || false;
    const isNewExpense = !!document.getElementById('new-debt-is-new-expense')?.checked;

    const hasCreditLimit = debtType === 'revolving' && !!document.getElementById('new-debt-has-limit')?.checked;
    const creditLimit = hasCreditLimit ? parseMoneyInput(document.getElementById('new-debt-credit-limit')?.value) : 0;

    const rawOriginal = parseMoneyInput(document.getElementById('new-debt-original').value);
    const fianzaVal = parseMoneyInput(document.getElementById('new-debt-fianza')?.value);
    const fianzaType = document.getElementById('new-debt-fianza-type')?.value || 'pct';
    const fianzaIva = !!document.getElementById('new-debt-fianza-iva')?.checked;
    const fianzaAmt = typeof calculateFianzaAmount === 'function'
        ? calculateFianzaAmount(rawOriginal, fianzaVal, fianzaType, fianzaIva)
        : (fianzaVal > 0 ? (fianzaType === 'pct' ? round2(rawOriginal * (fianzaVal / 100)) : fianzaVal) : 0);

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
        hasCreditLimit, creditLimit, debtOriginal: original,
        debtTotalQuotes: isRevWithPurchase ? 0 : totalQuotes,
        debtPaidQuotes: isRevWithPurchase ? 0 : paidQuotes,
        debtRate: rate, debtRateType: rateType,
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
            const fianzaNote = fianzaAmt > 0 ? ` (+Fianza ${formatCompact(fianzaAmt)})` : '';

            financeData.transactions.push({
                id: now.getTime(), monthId: getMonthId(now), type: 'expense', status: 'closed',
                account: id, category: '🛍️ Compras', subcategory: 'General',
                description: `${commerceName || 'Compra Inicial Cupo'}${fianzaNote}`,
                amount: original, fianzaAmount: fianzaAmt,
                date: `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
                isAdjustment: !isNewExpense,
                installments: totalQuotes, paidInstallments: paidQuotes,
                rate, rateType, zeroInterest: rate === 0,
                monthlyQuota: monthlyPay, totalWithInterest: amort.totalWithInterest,
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
    document.getElementById('new-debt-revolving-limit-section')?.classList.add('hidden');
    document.getElementById('new-debt-limit-amount-group')?.classList.add('hidden');
    document.getElementById('new-debt-fianza-group')?.classList.add('hidden');
    e.target.closest('details')?.removeAttribute('open');
    hasUnsavedChanges = false;
    renderSalaryUI(true);
    updateDashboard();
    renderAccountSelects();
    let totalLoansDebt = 0;
    financeData.customAccounts.forEach(acc => { if (acc.category === 'debt' && currentBalances[acc.id] > 0) totalLoansDebt = round2(totalLoansDebt + currentBalances[acc.id]); });
    renderDebtsBreakdown(currentBalances, totalLoansDebt);
});
// --- CONTINUACIÓN MÓDULO 4: DETALLE DE CUENTAS, PAGOS, COBROS Y PLAN AVALANCHA ---
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
        liqCheck.dispatchEvent(new Event('change'));
    }

    const gmfSection = document.getElementById('edit-account-gmf-section');
    if (gmfSection) {
        const isBankAsset = acc.category === 'asset' && acc.id !== 'Efectivo' && !String(acc.id).startsWith('CxC_');
        gmfSection.classList.toggle('hidden', !isBankAsset);

        if (isBankAsset) {
            const subSel = document.getElementById('edit-account-subtype');
            const exCheck = document.getElementById('edit-account-gmf-exempt');
            const toggleRow = document.getElementById('edit-account-gmf-toggle-row');
            const usageHint = document.getElementById('edit-account-gmf-usage-hint');

            const refreshEditGmfState = () => {
                const curSub = acc.accountSubType || 'savings';
                if (subSel) subSel.value = curSub;
                
                const existingExempt = (financeData.customAccounts || []).find(a => a.category === 'asset' && a.gmfExempt && a.id !== acc.id);
                const subEl = document.getElementById('edit-account-gmf-status-sub');

                if (exCheck) {
                    exCheck.checked = !!acc.gmfExempt;
                    if (existingExempt) {
                        exCheck.disabled = true;
                        if (toggleRow) toggleRow.style.opacity = '0.5';
                        if (subEl) subEl.innerHTML = `<span style="color:#d97706; display:flex; align-items:flex-start; gap:4px; margin-top:3px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:2px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> <span>Bloqueado: "${stripLeadingEmoji(existingExempt.name)}" ya está exenta.</span></span>`;
                    } else {
                        exCheck.disabled = false;
                        if (toggleRow) toggleRow.style.opacity = '1';
                        if (subEl) subEl.innerHTML = `Tope legal de hasta 350 UVT/mes`;
                    }
                }
                
                if (toggleRow) toggleRow.classList.toggle('hidden', curSub === 'checking' || curSub === 'cash');

                if (usageHint && typeof getGmfAccountInfo === 'function') {
                    const info = getGmfAccountInfo(acc);
                    const used = typeof getMonthlyGmfUsedOutflows === 'function' ? getMonthlyGmfUsedOutflows(acc.id, getMonthId(currentDate)) : 0;
                    
                    usageHint.classList.remove('hidden');
                    
                    if (info.monthlyCapCop > 0) {
                        const rem = Math.max(0, round2(info.monthlyCapCop - used));
                        usageHint.innerHTML = `
                            <div style="background:rgba(16, 185, 129, 0.08); border:1px dashed rgba(16, 185, 129, 0.3); border-radius:10px; padding:10px 12px; margin-top:0;">
                                <strong style="color:var(--positive); font-size:11.5px; display:block; margin-bottom:6px;">Cuenta Exenta (Activa)</strong>
                                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;"><span>Tope (${info.capUvt} UVT):</span><strong style="color:var(--text-main);">${formatMoney(info.monthlyCapCop)}</strong></div>
                                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;"><span>Usado este mes:</span><strong style="color:var(--text-main);">${formatMoney(used)}</strong></div>
                                <div style="display:flex; justify-content:space-between; padding-top:4px; border-top:1px solid rgba(16, 185, 129, 0.2); font-size:11px;"><span>Disponible sin 4x1000:</span><strong class="${rem > 0 ? 'positive' : 'negative'}">${formatMoney(rem)}</strong></div>
                            </div>
                        `;
                    } else {
                        const hintText = curSub === 'cash' 
                            ? `El efectivo no pertenece al sistema financiero y no genera impuesto 4x1000.` 
                            : `<b>Cuenta gravada:</b> se debitará el <b>0,4% (4x1000)</b> automáticamente en cada pago o retiro.`;
                        
                        usageHint.innerHTML = `
                            <div style="background:rgba(0,0,0,0.03); border:1px solid var(--border-color); border-radius:10px; padding:8px 10px; font-size:10.5px; color:var(--text-muted); line-height:1.35; display:flex; align-items:flex-start; gap:6px; margin-top:0;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                <span>${hintText}</span>
                            </div>
                        `;
                    }
                }
            };

            refreshEditGmfState();

            if (subSel) {
                subSel.onchange = () => {
                    acc.accountSubType = subSel.value;
                    acc.gmfReviewed = true;
                    if (acc.accountSubType === 'checking' || acc.accountSubType === 'cash') acc.gmfExempt = false;
                    localStorage.setItem('myFinances', JSON.stringify(financeData));
                    refreshEditGmfState();
                    syncNewAccountGmfUI();
                };
            }

            if (exCheck) {
                exCheck.onchange = () => {
                    const checked = !!exCheck.checked;
                    if (checked) {
                        financeData.customAccounts.forEach(a => { if (a.category === 'asset' && a.id !== acc.id) a.gmfExempt = false; });
                        if (!acc.accountSubType) acc.accountSubType = 'savings';
                    }
                    acc.gmfExempt = checked;
                    acc.gmfReviewed = true;
                    localStorage.setItem('myFinances', JSON.stringify(financeData));
                    refreshEditGmfState();
                    syncNewAccountGmfUI();
                };
            }
        }
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
    if (document.getElementById('open-education-extra-btn')) document.getElementById('open-education-extra-btn').classList.add('hidden');

    if (acc.category === 'credit_card') {
        cardExtraBox?.classList.remove('hidden'); editCardBtn?.classList.remove('hidden');
        debtExtraBox?.classList.add('hidden'); editDebtBtn?.classList.add('hidden');

        const limit = round2(acc.creditLimit || 0), available = round2(limit - currentBal), availEl = document.getElementById('detail-card-available');
        if (document.getElementById('detail-card-limit')) document.getElementById('detail-card-limit').innerText = formatMoney(limit);
        if (availEl) { availEl.innerText = formatMoney(available); availEl.className = available >= 0 ? 'positive' : 'negative'; }
        if (document.getElementById('detail-card-dates')) document.getElementById('detail-card-dates').innerText = `Corte: día ${acc.cutoffDay || '-'} • Pago: día ${acc.paymentDay || '-'}`;

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
            if (document.getElementById('detail-card-min-payment')) document.getElementById('detail-card-min-payment').innerText = formatMoney(st.minPayment);
            if (document.getElementById('detail-card-next-due-badge')) document.getElementById('detail-card-next-due-badge').innerText = st.badgeText;
            if (document.getElementById('detail-card-cutoff-debt')) document.getElementById('detail-card-cutoff-debt').innerText = formatMoney(st.debtAtCutoff);
            if (document.getElementById('detail-card-pay-date-label')) document.getElementById('detail-card-pay-date-label').innerText = st.paymentDateLabel;
            if (document.getElementById('detail-card-cut-date-label')) document.getElementById('detail-card-cut-date-label').innerText = st.cutoffDateLabel;
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
            if (currentBal > 0 || totalFees > 0) {
                chargeFeesBtn.classList.remove('hidden');
                chargeFeesBtn.onclick = () => {
                    openCardStatementChargeModal(acc, currentBal, est);
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
        if (document.getElementById('edit-card-initial-term')) document.getElementById('edit-card-initial-term').value = acc.initialDebtTerm || 12;
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
                const balForEdu = round2(currentBalances[acc.id] || 0);
                const pastStep = paidQuotes > 0 ? round2((originalDebt - balForEdu) / paidQuotes) : quotaAmt;

                const eduBody = document.getElementById('education-table-body');
                if (eduBody) {
                    let html = '';
                    let runningBal = round2(originalDebt);
                    let baseDate = new Date();
                    baseDate.setMonth(baseDate.getMonth() - paidQuotes);

                    for (let i = 1; i <= totalQuotes; i++) {
                        const isPaid = i <= paidQuotes;
                        baseDate.setMonth(baseDate.getMonth() + 1);
                        const mLabel = `${getShortMonthLabel(baseDate)} ${String(baseDate.getFullYear()).slice(-2)}`;
                        
                        if (isPaid) {
                            runningBal = i === paidQuotes ? balForEdu : Math.max(0, round2(runningBal - pastStep));
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
        const revLimitBanner = document.getElementById('revolving-limit-banner');
        if (revLimitBanner) {
            if (acc.debtType === 'revolving' && acc.hasCreditLimit && acc.creditLimit > 0) {
                const limitTot = round2(acc.creditLimit);
                const usedAmt = Math.max(0, currentBal);
                const availAmt = round2(limitTot - usedAmt);
                const usedPct = Math.min(100, Math.max(0, (usedAmt / limitTot) * 100));
                const barColor = usedPct > 85 ? 'var(--negative)' : (usedPct > 60 ? '#f59e0b' : 'var(--positive)');
                revLimitBanner.classList.remove('hidden');
                revLimitBanner.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:12px; font-weight:700; color:var(--text-main);">Cupo disponible</span>
                        <strong class="${availAmt >= 0 ? 'positive' : 'negative'}" style="font-size:16px;">${formatMoney(availAmt)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; color:var(--text-muted); margin-bottom:8px;">
                        <span>Cupo que has gastado</span>
                        <strong style="color:var(--text-main);">${formatMoney(usedAmt)} <small style="font-weight:500;">/ ${formatCompact(limitTot)}</small></strong>
                    </div>
                    <div class="tc-mini-bar" style="margin:0;"><div class="tc-mini-bar-fill" style="width:${usedPct}%; background-color:${barColor};"></div></div>
                `;
            } else {
                revLimitBanner.classList.add('hidden');
            }
        }
        document.getElementById('edit-debt-revolving-limit-section')?.classList.toggle('hidden', acc.debtType !== 'revolving');
        if (document.getElementById('edit-debt-has-limit')) document.getElementById('edit-debt-has-limit').checked = !!acc.hasCreditLimit;
        document.getElementById('edit-debt-limit-amount-group')?.classList.toggle('hidden', !acc.hasCreditLimit);
        if (document.getElementById('edit-debt-credit-limit')) document.getElementById('edit-debt-credit-limit').value = acc.creditLimit > 0 ? formatNumberInput(acc.creditLimit) : '';
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
        const accTransactions = financeData.transactions
            .filter(t => !t.isDeleted && (t.account === accountId || t.toAccount === accountId))
            .sort((a, b) => b.id - a.id);

        historyList.innerHTML = accTransactions.length === 0
            ? '<li class="history-item"><small style="color:var(--text-muted);">Sin movimientos registrados</small></li>'
            : '';

        accTransactions.forEach(t => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.onclick = () => {
                window.returnToAccountDetail = { accountId, originType };
                forceCloseAllModals();
                openEditModal(t.id);
            };
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
    acc.initialDebtTerm = Math.max(1, parseInt(document.getElementById('edit-card-initial-term')?.value, 10) || 12);
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

    const rawName = document.getElementById('rev-purch-name').value.trim();
    const rawOriginal = parseMoneyInput(document.getElementById('rev-purch-original').value);
    const fianzaVal = parseMoneyInput(document.getElementById('rev-purch-fianza')?.value);
    const fianzaType = document.getElementById('rev-purch-fianza-type')?.value || 'pct';
    const fianzaIva = !!document.getElementById('rev-purch-fianza-iva')?.checked;
    const fianzaAmt = typeof calculateFianzaAmount === 'function'
        ? calculateFianzaAmount(rawOriginal, fianzaVal, fianzaType, fianzaIva)
        : (fianzaVal > 0 ? (fianzaType === 'pct' ? round2(rawOriginal * (fianzaVal / 100)) : fianzaVal) : 0);
    const original = round2(rawOriginal + fianzaAmt);
    const name = fianzaAmt > 0 ? `${rawName} (+Fianza ${formatCompact(fianzaAmt)})` : rawName;
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
    
    const renderTable = (scheduleArr) => {
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
        if (tbody) tbody.innerHTML = renderTable(standardAmort.schedule);
        return;
    }

    if (rate <= 0) {
        if (resLab) resLab.innerHTML = `<span style="color:var(--text-muted);">Tasa 0% - Abonar a capital no genera ahorro en intereses.</span>`;
        if (tbody) {
            const newBal = Math.max(0, currentBal - extra);
            const simpleAmort = calculateAmortization(newBal, remQuotes, 0, rateType);
            tbody.innerHTML = renderTable(simpleAmort.schedule);
        }
        return;
    }
    
    const newBal = Math.max(0, currentBal - extra);
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
        if (p <= 0 && int >= baseQuota) break; 
        simBal = Math.max(0, simBal - p);
        newSchedule.push({ payment: p + int, principal: p, interest: int, balance: simBal });
    }

    if (simBal === 0 && newMonths <= remQuotes) {
        const savedInt = standardAmort.totalInterest - newInterest;
        const savedMonths = remQuotes - newMonths;
        if (resLab) resLab.innerHTML = `<span style="display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Ahorras ${formatMoney(savedInt)} y terminas ${savedMonths} meses antes.</span>`;
        if (tbody) tbody.innerHTML = renderTable(newSchedule);
    } else {
        const newAmort = calculateAmortization(newBal, remQuotes, rate, rateType);
        const savedInt = standardAmort.totalInterest - newAmort.totalInterest;
        if (resLab) resLab.innerHTML = `<span style="display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Ahorras ${formatMoney(savedInt)} bajando tu cuota.</span>`;
        if (tbody) tbody.innerHTML = renderTable(newAmort.schedule);
    }
});

document.getElementById('edit-debt-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    acc.debtType = document.getElementById('edit-debt-type').value;
    acc.hasCreditLimit = acc.debtType === 'revolving' && !!document.getElementById('edit-debt-has-limit')?.checked;
    acc.creditLimit = acc.hasCreditLimit ? parseMoneyInput(document.getElementById('edit-debt-credit-limit')?.value) : 0;
    acc.debtOriginal = parseMoneyInput(document.getElementById('edit-debt-original').value);
    acc.debtTotalQuotes = parseInt(document.getElementById('edit-debt-total-quotes').value, 10) || 1;
    acc.debtPaidQuotes = parseInt(document.getElementById('edit-debt-paid-quotes').value, 10) || 0;
    acc.debtRate = parseMoneyInput(document.getElementById('edit-debt-rate').value);
    acc.debtRateType = document.getElementById('edit-debt-rate-type').value;
    acc.debtMonthlyPayment = parseMoneyInput(document.getElementById('edit-debt-monthly-payment').value);
    acc.payrollDeduction = !!document.getElementById('edit-debt-payroll').checked;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false; 
    renderSalaryUI(true);
    updateDashboard(); 
    openAccountDetail(accountId, lastAccountViewOrigin);
});

const updatePayDebtTotalPreview = () => {
    const principal = parseMoneyInput(document.getElementById('pay-debt-principal')?.value);
    const interest = parseMoneyInput(document.getElementById('pay-debt-interest')?.value);
    const extra = document.getElementById('pay-debt-has-extra')?.checked ? parseMoneyInput(document.getElementById('pay-debt-extra-amount')?.value) : 0;
    const totalEl = document.getElementById('pay-debt-total-preview');
    if (totalEl) totalEl.innerText = formatMoney(principal + interest + extra);
};

['pay-debt-principal', 'pay-debt-interest', 'pay-debt-extra-amount'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePayDebtTotalPreview);
});
document.getElementById('pay-debt-has-extra')?.addEventListener('change', (e) => {
    document.getElementById('pay-debt-extra-group')?.classList.toggle('hidden', !e.target.checked);
    updatePayDebtTotalPreview();
});

document.getElementById('pay-installment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountId = document.getElementById('reconcile-account-id').value, acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    const sourceAcc = document.getElementById('pay-debt-source-acc').value;
    const principalAmt = parseMoneyInput(document.getElementById('pay-debt-principal').value);
    const interestAmt = parseMoneyInput(document.getElementById('pay-debt-interest').value);
    
    const hasExtra = !!document.getElementById('pay-debt-has-extra')?.checked;
    const extraAmt = hasExtra ? parseMoneyInput(document.getElementById('pay-debt-extra-amount')?.value) : 0;
    const extraDesc = hasExtra ? document.getElementById('pay-debt-extra-desc')?.value.trim() || 'Seguros y Cargos Extra' : '';

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
        allocatedItems.push({ kind: 'debt_quota', debtId: accountId, amountApplied: Math.min(principalAmt, qInfo.basePrincipal) });
        acc.debtPaidQuotes = (acc.debtPaidQuotes || 0) + 1;
    }
    
    let remPrincipal = principalAmt;
    qInfo.subPurchases.forEach(p => {
        if (remPrincipal > 0) {
            const applied = Math.min(remPrincipal, p.remCapital);
            allocatedItems.push({ kind: 'cc_tx', txId: p.tx.id, mode: 'installments', amountApplied: applied });
            p.tx.paidInstallments = (p.tx.paidInstallments || 0) + 1;
            remPrincipal = round2(remPrincipal - applied);
        }
    });

    if (principalAmt > 0) {
        financeData.transactions.push({ id: transactionDateObj.getTime() + Math.floor(Math.random() * 500), monthId: mId, type: 'transfer', status: 'closed', account: sourceAcc, toAccount: accountId, description: `Pago Capital (${stripLeadingEmoji(acc.name)})`, amount: principalAmt, date: `${displayDate}, ${displayTime}`, isAdjustment: false, paymentMode: 'installments', allocatedItems });
    }
    
    const intCat = financeData.categories.expense.find(c => stripLeadingEmoji(c.name) === 'Cuotas / Intereses');
    const catName = intCat ? intCat.name : 'Cuotas / Intereses';

    if (interestAmt > 0) {
        financeData.transactions.push({ id: transactionDateObj.getTime() + 500 + Math.floor(Math.random() * 500), monthId: mId, type: 'expense', status: 'closed', account: sourceAcc, category: catName, subcategory: 'General', description: `Intereses Préstamo (${stripLeadingEmoji(acc.name)})`, amount: interestAmt, date: `${displayDate}, ${displayTime}`, isAdjustment: false });
    }

    if (extraAmt > 0) {
        financeData.transactions.push({ id: transactionDateObj.getTime() + 800 + Math.floor(Math.random() * 500), monthId: mId, type: 'expense', status: 'closed', account: sourceAcc, category: catName, subcategory: 'General', description: `${extraDesc} (${stripLeadingEmoji(acc.name)})`, amount: extraAmt, date: `${displayDate}, ${displayTime}`, isAdjustment: false });
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    document.getElementById('pay-installment-form').reset();
    document.getElementById('pay-debt-has-extra').checked = false;
    document.getElementById('pay-debt-extra-group').classList.add('hidden');
    hasUnsavedChanges = false; 
    updateDashboard(); 
    openAccountDetail(accountId, lastAccountViewOrigin);
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
    if (accountId === 'Efectivo') {
        alert("La cuenta Efectivo no se puede eliminar.");
        return;
    }
    const accObj = getAccountObj(accountId);
    const accName = accObj.name;
    const affectedTxs = financeData.transactions.filter(t => t.account === accountId || t.toAccount === accountId).length;
    
    const impactText = [
        `Eliminarás la cuenta/deuda "${stripLeadingEmoji(accName)}".`,
        affectedTxs > 0 ? `<b>${affectedTxs} movimientos históricos</b> se reasignarán a "Efectivo" para no alterar tu patrimonio neto.` : 'No hay movimientos asociados que reasignar.'
    ];

    openSafeDeleteModal(accName, impactText, () => {
        financeData.transactions.forEach(t => { 
            if (t.account === accountId) t.account = 'Efectivo'; 
            if (t.toAccount === accountId) t.toAccount = 'Efectivo'; 
        });
        financeData.customAccounts = financeData.customAccounts.filter(a => a.id !== accountId);
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        
        renderSalaryUI(true);
        renderAccountSelects(); 
        updateDashboard();
        attemptCloseModals();
    });
};

// Deudas a Favor (Cuentas por Cobrar)
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
            if (balance <= 0) return;
            totalReceivables += balance;

            list.innerHTML += `
                <div class="acc-list-item" onclick="openAccountDetail('${acc.id}', 'home')">
                    <div class="acc-list-name">
                        <span class="dot" style="background-color:var(--positive);"></span>
                        <div>
                            <span>${stripLeadingEmoji(acc.name).replace(/^Me debe:\s*/i, '')}</span>
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

window.openReceivablesModal = () => {
    const rModal = document.getElementById('receivables-modal');
    if (!rModal) return;
    document.getElementById('debts-receivable-view')?.classList.remove('hidden');
    renderReceivablesBreakdown();
    
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

document.getElementById('back-to-accounts-btn')?.addEventListener('click', () => {
    document.getElementById('account-detail-view')?.classList.add('hidden');
    if (lastAccountViewOrigin === 'home') forceCloseAllModals();
    else if (lastAccountViewOrigin === 'analytics') { document.getElementById('accounts-modal')?.classList.add('hidden'); document.getElementById('analytics-modal')?.classList.remove('hidden'); }
    else if (lastAccountViewOrigin === 'credit_card') { document.getElementById('accounts-modal')?.classList.add('hidden'); document.getElementById('cards-modal')?.classList.remove('hidden'); }
    else if (lastAccountViewOrigin === 'debt') { document.getElementById('accounts-modal')?.classList.add('hidden'); document.getElementById('debts-modal')?.classList.remove('hidden'); }
    else if (lastAccountViewOrigin === 'receivable') { document.getElementById('accounts-modal')?.classList.add('hidden'); openReceivablesModal(); }
    else document.getElementById('accounts-list-view')?.classList.remove('hidden');
});

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

document.getElementById('new-recv-type')?.addEventListener('change', (e) => {
    const isLoan = e.target.value === 'loan';
    document.getElementById('group-new-recv-account')?.classList.toggle('hidden', !isLoan);
    document.getElementById('group-new-recv-category')?.classList.toggle('hidden', isLoan);
});

document.getElementById('new-receivable-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawName = document.getElementById('new-recv-name').value.trim();
    const amount = parseMoneyInput(document.getElementById('new-recv-amount').value);
    const type = document.getElementById('new-recv-type')?.value || 'loan';
    
    if (!rawName || amount <= 0) return;

    const accId = 'CxC_' + rawName.replace(/\s+/g, '_');

    if (!financeData.customAccounts.some(a => a.id === accId)) {
        financeData.customAccounts.push({ id: accId, name: `Me debe: ${rawName}`, category: 'asset', isDefault: false, showWhenZero: true });
    }

    const now = new Date();
    const mId = getMonthId(now);
    const dateStr = `${now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;

    if (type === 'loan') {
        const sourceAcc = document.getElementById('new-recv-account')?.value;
        if (sourceAcc === 'adjustment') {
            financeData.transactions.push({
                id: now.getTime(), monthId: mId, type: 'income', status: 'closed',
                account: accId, description: 'Saldo Inicial (Préstamo a favor)', amount: amount,
                date: dateStr, isAdjustment: true
            });
        } else {
            financeData.transactions.push({
                id: now.getTime(), monthId: mId, type: 'transfer', status: 'closed',
                account: sourceAcc, toAccount: accId, description: `Préstamo a ${rawName}`, amount: amount,
                date: dateStr, isAdjustment: false
            });
        }
    } else if (type === 'sale') {
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
    renderReceivablesBreakdown();
    alert(`Deuda a favor de ${formatMoney(amount)} registrada a nombre de ${rawName}.`);
});

// Planificador de Salida de Deudas (Avalancha / Bola de Nieve)
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

// ==========================================
// MÓDULO 5: GESTOR DE SUSCRIPCIONES
// ==========================================
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

    const subModalContent = document.querySelector('#subscriptions-modal .modal-content');
    if (subModalContent && !subModalContent.dataset.fixedHeaderInit) {
        subModalContent.dataset.fixedHeaderInit = '1';
        const headerEl = subModalContent.querySelector('.modal-header');
        const bodyNodes = Array.from(subModalContent.children).filter(el => el !== headerEl);
        const scrollBody = document.createElement('div');
        scrollBody.style.cssText = 'flex:1; overflow-y:auto; padding:14px 18px 22px 18px; -webkit-overflow-scrolling:touch;';
        bodyNodes.forEach(n => scrollBody.appendChild(n));

        subModalContent.style.display = 'flex';
        subModalContent.style.flexDirection = 'column';
        subModalContent.style.maxHeight = '88dvh';
        subModalContent.style.overflow = 'hidden';
        subModalContent.style.padding = '0';

        if (headerEl) {
            headerEl.style.padding = '18px 18px 12px 18px';
            headerEl.style.marginBottom = '0';
            headerEl.style.borderBottom = '1px solid var(--border-color)';
            headerEl.style.flexShrink = '0';
            headerEl.style.background = 'var(--card-bg)';
        }
        subModalContent.appendChild(scrollBody);
    }

    const subForm = document.getElementById('new-subscription-form');
    if (subForm) {
        let chipsBar = document.getElementById('sub-quick-chips-bar');
        if (!chipsBar) {
            chipsBar = document.createElement('div');
            chipsBar.id = 'sub-quick-chips-bar';
            chipsBar.className = 'sub-quick-chips';
            chipsBar.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; width:100%; overflow:visible;';
            const presets = ['Netflix', 'Spotify', 'YouTube', 'Prime', 'iCloud+', 'ChatGPT', 'Gimnasio'];
            chipsBar.innerHTML = presets.map(p => `<button type="button" class="sub-quick-chip" data-sub-preset="${p}" style="white-space:nowrap; flex:0 0 auto; padding:5px 10px; font-size:11.5px;">${p}</button>`).join('');
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
        chipsBar.classList.toggle('hidden', !!editingId);

        const submitBtn = subForm.querySelector('button[type="submit"]');
        const cancelBtn = document.getElementById('btn-sub-cancel');
        const deleteBtn = document.getElementById('btn-sub-delete');
        const actionsRow = submitBtn?.parentElement;
        if (actionsRow && !actionsRow.dataset.layoutNormalized) {
            actionsRow.dataset.layoutNormalized = '1';
            actionsRow.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; width:100%;';
            if (submitBtn) {
                submitBtn.style.gridColumn = '1 / -1';
                submitBtn.style.width = '100%';
                submitBtn.style.order = '-1';
                submitBtn.style.minHeight = '42px';
            }
            if (cancelBtn) {
                cancelBtn.style.width = '100%';
                cancelBtn.style.minHeight = '40px';
            }
            if (deleteBtn) {
                deleteBtn.style.width = '100%';
                deleteBtn.style.minHeight = '40px';
            }
        }
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
            <div class="acc-list-item" style="flex-direction:column; align-items:stretch; padding:13px 14px; gap:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                    <div class="acc-list-name" style="flex:1; min-width:0;">
                        <div style="flex:1; min-width:0;">
                            <span style="font-size:14.5px; font-weight:800; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${stripLeadingEmoji(sub.name)}</span>
                            <small style="display:flex; align-items:center; flex-wrap:wrap; gap:5px; font-size:11.5px; color:var(--text-muted); font-weight:600; margin-top:3px;">
                                <b style="color:var(--text-main);">${formatMoneyHtml(sub.amount)}</b>/${cycleLabels[sub.cycle] || 'Mes'} ${badgeHtml} ${reserveBadge}
                            </small>
                            ${accTag ? `<small style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-muted); margin-top:4px;">${accTag}${dateLabel && diffDays <= 7 ? ` • Cobro: ${dateLabel}` : ''}</small>` : ''}
                        </div>
                    </div>
                    <button type="button" onclick="processSubscriptionPayment('${sub.id}')" class="${btnClass}" style="margin:0; min-height:36px; padding:7px 14px; font-size:12px; font-weight:700; flex-shrink:0;">Pagar</button>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; padding-top:9px; border-top:1px dashed var(--border-color);">
                    <button type="button" onclick="toggleSubscriptionPause('${sub.id}')" class="mini-action-btn" style="width:100%; min-height:36px; justify-content:center; font-size:12px; font-weight:600; color:var(--text-muted); background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:10px;">Pausar</button>
                    <button type="button" onclick="editSubscription('${sub.id}')" class="mini-action-btn" style="width:100%; min-height:36px; justify-content:center; font-size:12px; font-weight:700; color:var(--accent); background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:10px;">Editar</button>
                </div>
            </div>`;
    });

    if (pausedSubs.length > 0) {
        const pausedItemsHtml = pausedSubs.map(sub => `
            <div class="acc-list-item" style="flex-direction:column; align-items:stretch; padding:11px 12px; gap:9px; opacity:0.85; margin-bottom:8px;">
                <div style="flex:1; min-width:0;">
                    <span style="font-size:13.5px; font-weight:700; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${stripLeadingEmoji(sub.name)}</span>
                    <small style="font-size:11px; color:var(--text-muted);">${formatMoney(sub.amount)}/${cycleLabels[sub.cycle] || 'Mes'} • Pausada</small>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; padding-top:8px; border-top:1px dashed var(--border-color);">
                    <button type="button" onclick="toggleSubscriptionPause('${sub.id}')" class="mini-action-btn" style="width:100%; min-height:36px; justify-content:center; font-size:12px; font-weight:700; color:var(--positive); background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:10px;">Reanudar</button>
                    <button type="button" onclick="editSubscription('${sub.id}')" class="mini-action-btn" style="width:100%; min-height:36px; justify-content:center; font-size:12px; font-weight:600; color:var(--text-main); background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:10px;">Editar</button>
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

window.advanceSubscriptionNextDate = (sub, fallbackDateStr = null) => {
    if (!sub) return;
    const baseStr = sub.nextBillingDate || fallbackDateStr || currentDate.toLocaleDateString('en-CA');
    const [y, m, d] = baseStr.split('-').map(Number);
    const nextD = new Date(y, m - 1, d);
    if (sub.cycle === 'monthly') nextD.setMonth(nextD.getMonth() + 1);
    else if (sub.cycle === 'bimonthly') nextD.setMonth(nextD.getMonth() + 2);
    else if (sub.cycle === 'quarterly') nextD.setMonth(nextD.getMonth() + 3);
    else if (sub.cycle === 'semiannual') nextD.setMonth(nextD.getMonth() + 6);
    else if (sub.cycle === 'annual') nextD.setFullYear(nextD.getFullYear() + 1);
    else if (sub.cycle === 'weekly') nextD.setDate(nextD.getDate() + 7);
    sub.nextBillingDate = nextD.toLocaleDateString('en-CA');
};

window.findMatchingSubscriptionForExpense = (description, explicitSubId = null) => {
    const activeSubs = (financeData.subscriptions || []).filter(s => s.status === 'active');
    if (activeSubs.length === 0) return null;

    if (explicitSubId) {
        const direct = activeSubs.find(s => String(s.id) === String(explicitSubId));
        if (direct) return direct;
    }

    const cleanDesc = stripLeadingEmoji(description || '')
        .replace(/^suscripci[oó]n:\s*/i, '')
        .trim()
        .toLowerCase();
    if (cleanDesc.length < 3) return null;

    const matches = activeSubs.filter(s => {
        const subName = stripLeadingEmoji(s.name || '').trim().toLowerCase();
        return subName.length >= 3 && (cleanDesc === subName || cleanDesc.includes(subName) || subName.includes(cleanDesc));
    });

    if (matches.length === 0) return null;
    return matches.sort((a, b) => new Date(a.nextBillingDate || '2099-12-31') - new Date(b.nextBillingDate || '2099-12-31'))[0];
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

    advanceSubscriptionNextDate(sub, txDateStr);
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
    document.getElementById('sub-quick-chips-bar')?.classList.add('hidden');
    document.getElementById('btn-sub-cancel').classList.remove('hidden');
    document.getElementById('btn-sub-delete').classList.remove('hidden');
};

document.getElementById('btn-sub-cancel')?.addEventListener('click', () => {
    document.getElementById('new-subscription-form').reset();
    document.getElementById('sub-form-title').innerText = 'Nueva Suscripción';
    document.getElementById('edit-sub-id').value = '';
    document.getElementById('sub-quick-chips-bar')?.classList.remove('hidden');
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

// ==========================================
// MÓDULO 6: BOLSILLOS DE AHORRO, RENDIMIENTOS E INTERÉS COMPUESTO
// ==========================================
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
            
            // FILTRO INTELIGENTE: ¿El bolsillo está activo en el mes que estoy mirando?
            const refDate = typeof viewDate !== 'undefined' ? viewDate : new Date();
            const currM = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`;
            let isFuture = false;
            
            if (p.startDate) {
                const startM = p.startDate.slice(0, 7); // Extrae "YYYY-MM"
                if (startM > currM) isFuture = true;
            }

            // Suma a la Cuota Sugerida SÓLO si ya arrancó y le falta plata
            if (!isFuture && (m.remaining > 0 || m.customQuota > 0)) {
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

            const pocketTxCount = financeData.transactions.filter(
                t => !t.isDeleted && (t.account === p.id || t.toAccount === p.id) && isTxClosed(t)
            ).length;

            const historyTriggerHtml = `
                <button type="button" onclick="openPocketHistoryModal('${p.id}')" style="margin-top:10px; width:100%; display:flex; justify-content:space-between; align-items:center; padding:9px 12px; background:var(--card-inner-bg); border:1px solid color-mix(in srgb, var(--accent) 16%, var(--border-color)); border-radius:10px; color:var(--text-main); font-size:11.5px; font-weight:700; cursor:pointer;">
                    <span style="display:inline-flex; align-items:center; gap:6px; color:var(--text-muted);">
                        ${renderIcon('clock', 14)} Historial de Ahorro${pocketTxCount > 0 ? ` (${pocketTxCount})` : ''}
                    </span>
                    <span style="font-size:14px; color:var(--accent); font-weight:800; line-height:1;">›</span>
                </button>
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
                    ${historyTriggerHtml}
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

window.openPocketHistoryModal = (pocketId) => {
    const p = (financeData.pockets || []).find(x => String(x.id) === String(pocketId));
    const modal = document.getElementById('pocket-history-modal');
    const listEl = document.getElementById('pocket-history-list');
    if (!p || !modal || !listEl) return;

    const m = computePocketMetrics(p);
    const titleEl = document.getElementById('pocket-history-title');
    const subEl = document.getElementById('pocket-history-subtitle');
    if (titleEl) titleEl.innerText = stripLeadingEmoji(p.name);
    if (subEl) subEl.innerText = p.entity ? `${p.entity} • Historial de Ahorro` : 'Historial completo de movimientos';

    if (document.getElementById('pocket-history-balance')) document.getElementById('pocket-history-balance').innerText = formatMoney(m.balance);
    if (document.getElementById('pocket-history-principal')) document.getElementById('pocket-history-principal').innerText = formatMoney(m.principal);
    if (document.getElementById('pocket-history-yields')) document.getElementById('pocket-history-yields').innerText = `+${formatMoney(m.yields)}`;

    const pocketTxs = financeData.transactions
        .filter(t => !t.isDeleted && (t.account === p.id || t.toAccount === p.id) && isTxClosed(t))
        .sort((a, b) => b.id - a.id);

    if (pocketTxs.length === 0) {
        listEl.innerHTML = '<div class="glass-sub-box" style="text-align:center; padding:24px 14px; color:var(--text-muted); font-size:12px;">Sin movimientos registrados en este bolsillo.</div>';
    } else {
        listEl.innerHTML = pocketTxs.map(t => {
            let sign = '-', colorClass = 'negative', kindLabel = 'Retiro', badgeBg = 'rgba(255,59,48,0.12)';
            if (t.type === 'income' && t.account === p.id) {
                sign = '+'; colorClass = 'positive'; kindLabel = 'Rendimiento'; badgeBg = 'rgba(16,185,129,0.12)';
            } else if (t.type === 'transfer' && t.toAccount === p.id) {
                sign = '+'; colorClass = 'positive'; kindLabel = 'Abono'; badgeBg = 'color-mix(in srgb, var(--accent) 12%, transparent)';
            }

            const safePocketId = String(p.id).replace(/'/g, "\\'");
            return `
                <div onclick="openEditModal(${t.id}); window.returnToPocketHistoryId='${safePocketId}';" style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:11px 12px; background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:12px; cursor:pointer;">
                    <div style="min-width:0; flex:1;">
                        <strong style="display:block; color:var(--text-main); font-size:12.5px; line-height:1.35; word-break:break-word;">${stripLeadingEmoji(t.description)}</strong>
                        <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-top:4px;">
                            <span style="font-size:10px; font-weight:700; padding:2px 7px; border-radius:999px; background:${badgeBg}; color:var(--text-main);">${kindLabel}</span>
                            <small style="color:var(--text-muted); font-size:10.5px;">${t.date}</small>
                        </div>
                    </div>
                    <div class="${colorClass}" style="font-weight:800; font-size:13px; white-space:nowrap; flex-shrink:0; padding-top:1px;">
                        ${sign} ${formatMoney(t.amount)}
                    </div>
                </div>
            `;
        }).join('');
    }

    modal.classList.remove('hidden');
};

let earningsChartOffset = 0;
let selectedEarningsMonthKey = null;

const getAllPocketYieldEntries = (pocketFilter = 'all') => {
    const entries = [];
    (financeData.pockets || []).forEach(p => {
        if (pocketFilter !== 'all' && String(p.id) !== String(pocketFilter)) return;
        const hist = Array.isArray(p.yieldHistory) ? p.yieldHistory : [];
        let histSum = 0;
        hist.forEach(h => {
            const amt = round2(h.amount || 0);
            if (amt > 0) {
                histSum = round2(histSum + amt);
                entries.push({ pocketId: p.id, pocketName: stripLeadingEmoji(p.name), dateStr: h.dateStr, monthId: (h.dateStr || '').slice(0, 7), amount: amt });
            }
        });
        const unallocatedYields = round2((p.yields || 0) - histSum);
        if (unallocatedYields > 0.01) {
            const fallbackDate = currentDate.toLocaleDateString('en-CA');
            entries.push({ pocketId: p.id, pocketName: stripLeadingEmoji(p.name), dateStr: fallbackDate, monthId: fallbackDate.slice(0, 7), amount: unallocatedYields });
        }
    });
    return entries;
};

window.renderPocketsEarningsDashboard = () => {
    const filterSel = document.getElementById('earnings-pocket-filter');
    const selectedPocket = filterSel ? filterSel.value : 'all';

    if (filterSel && filterSel.options.length <= 1) {
        (financeData.pockets || []).forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = stripLeadingEmoji(p.name);
            filterSel.appendChild(opt);
        });
        filterSel.value = selectedPocket;
    }

    const entries = getAllPocketYieldEntries(selectedPocket);
    const totalReceived = round2(entries.reduce((s, e) => s + e.amount, 0));
    const heroEl = document.getElementById('earnings-hero-total');
    if (heroEl) heroEl.textContent = formatMoney(totalReceived);

    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i - (earningsChartOffset * 6), 1);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthSum = round2(entries.filter(e => e.monthId === mKey).reduce((s, e) => s + e.amount, 0));
        months.push({
            mKey,
            shortLabel: getShortMonthLabel(d),
            fullLabel: `${getShortMonthLabel(d).toUpperCase()} ${d.getFullYear()}`,
            amount: monthSum
        });
    }

    if (!selectedEarningsMonthKey || !months.some(m => m.mKey === selectedEarningsMonthKey)) {
        const lastWithData = [...months].reverse().find(m => m.amount > 0);
        selectedEarningsMonthKey = lastWithData ? lastWithData.mKey : months[months.length - 1].mKey;
    }

    const activeMonth = months.find(m => m.mKey === selectedEarningsMonthKey) || months[months.length - 1];
    const calloutEl = document.getElementById('earnings-selected-callout');
    if (calloutEl) {
        calloutEl.innerHTML = `
            <div style="display:inline-block; padding:5px 12px; border-radius:12px; background:var(--card-inner-bg); border:1px solid var(--border-color);">
                <strong class="positive" style="display:block; font-size:13.5px;">${formatMoney(activeMonth.amount)}</strong>
                <small style="font-size:9.5px; font-weight:800; color:var(--text-muted);">${activeMonth.fullLabel}</small>
            </div>
        `;
    }

    const maxVal = Math.max(...months.map(m => m.amount), 1);
    const barsEl = document.getElementById('earnings-bars-chart');
    if (barsEl) {
        barsEl.innerHTML = months.map(m => {
            const hPct = m.amount > 0 ? Math.max(14, Math.round((m.amount / maxVal) * 100)) : 6;
            const isSel = m.mKey === selectedEarningsMonthKey;
            const barColor = isSel ? 'var(--positive)' : 'color-mix(in srgb, var(--positive) 35%, transparent)';
            return `
                <button type="button" data-earn-month="${m.mKey}" style="display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; gap:5px; background:transparent; border:none; cursor:pointer; padding:0;">
                    <div style="width:72%; max-width:28px; height:${hPct}%; background:${barColor}; border-radius:6px 6px 3px 3px; transition:all 0.25s ease;"></div>
                    <span style="font-size:10px; font-weight:${isSel ? '800' : '600'}; color:${isSel ? 'var(--text-main)' : 'var(--text-muted)'};">${m.shortLabel}</span>
                </button>
            `;
        }).join('');
    }

    const winLabel = document.getElementById('earnings-window-label');
    if (winLabel && months.length > 0) winLabel.textContent = `${months[0].fullLabel} – ${months[months.length - 1].fullLabel}`;

    const targetPockets = (financeData.pockets || []).filter(p => selectedPocket === 'all' || String(p.id) === String(selectedPocket));
    let weightedBalance = 0, weightedRateSum = 0, estNextMonth = 0;
    targetPockets.forEach(p => {
        const bal = round2((p.principal || 0) + (p.yields || 0));
        const rate = parseFloat(p.annualRate) || 0;
        if (rate > 0 && bal > 0) {
            weightedBalance = round2(weightedBalance + bal);
            weightedRateSum = round2(weightedRateSum + (bal * rate));
            const mRate = Math.pow(1 + rate / 100, 1 / 12) - 1;
            estNextMonth = round2(estNextMonth + (bal * mRate));
        }
    });
    const avgRate = weightedBalance > 0 ? round2(weightedRateSum / weightedBalance) : (targetPockets[0]?.annualRate || 0);
    if (document.getElementById('earnings-avg-rate')) document.getElementById('earnings-avg-rate').textContent = `${String(avgRate).replace('.', ',')}% E.A.`;
    if (document.getElementById('earnings-est-next-month')) document.getElementById('earnings-est-next-month').textContent = `+${formatMoney(estNextMonth)}`;
};

document.getElementById('btn-open-earnings-dashboard')?.addEventListener('click', () => {
    earningsChartOffset = 0;
    const filterSel = document.getElementById('earnings-pocket-filter');
    if (filterSel) filterSel.innerHTML = '<option value="all">Todos los bolsillos</option>';
    renderPocketsEarningsDashboard();
    document.getElementById('pockets-earnings-modal')?.classList.remove('hidden');
});

document.getElementById('earnings-pocket-filter')?.addEventListener('change', () => {
    selectedEarningsMonthKey = null;
    renderPocketsEarningsDashboard();
});

document.getElementById('earnings-bars-chart')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-earn-month]');
    if (btn) {
        selectedEarningsMonthKey = btn.getAttribute('data-earn-month');
        renderPocketsEarningsDashboard();
    }
});

document.getElementById('close-pocket-yield-btn')?.addEventListener('click', () => document.getElementById('pocket-yield-modal')?.classList.add('hidden'));

document.getElementById('pocket-yield-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pId = document.getElementById('pocket-yield-id')?.value;
    const p = (financeData.pockets || []).find(x => String(x.id) === String(pId));
    if (!p) return;

    const amt = parseMoneyInput(document.getElementById('pocket-yield-amount')?.value);
    const dateStr = document.getElementById('pocket-yield-date')?.value || currentDate.toLocaleDateString('en-CA');
    const syncIncome = !!document.getElementById('pocket-yield-sync-income')?.checked;
    if (amt <= 0) { alert('Ingresa un monto mayor a $ 0.'); return; }

    p.yields = round2((p.yields || 0) + amt);
    if (!Array.isArray(p.yieldHistory)) p.yieldHistory = [];
    p.yieldHistory.push({ id: Date.now(), dateStr, amount: amt });

    if (syncIncome) {
        const dObj = new Date(`${dateStr}T12:00:00`);
        const yieldCat = (financeData.categories.income || []).find(c => stripLeadingEmoji(c.name) === 'Rendimientos');
        financeData.transactions.push({
            id: dObj.getTime() + Math.floor(Math.random() * 500),
            monthId: getMonthId(dObj),
            type: 'income',
            status: 'closed',
            account: p.id,
            category: yieldCat ? yieldCat.name : 'Rendimientos',
            subcategory: 'General',
            description: `Rendimientos: ${stripLeadingEmoji(p.name)}`,
            amount: amt,
            date: `${dObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, 12:00`,
            isAdjustment: false
        });
    }

    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false;
    document.getElementById('pocket-yield-modal')?.classList.add('hidden');
    renderPocketsView();
    renderAccountSelects();
    updateDashboard();
});

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
    if (document.getElementById('edit-pocket-rate')) {
        document.getElementById('edit-pocket-rate').value = p.annualRate > 0 ? formatNumberInput(p.annualRate) : '';
    }
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
    p.annualRate = parseMoneyInput(document.getElementById('edit-pocket-rate')?.value);

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
        const bal = round2((p.principal || 0) + (p.yields || 0));
        const rate = parseFloat(p.annualRate) || 0;
        const estBanner = document.getElementById('pocket-yield-estimate-banner');
        let estMonthly = 0;

        if (rate > 0 && bal > 0) {
            const mRate = Math.pow(1 + rate / 100, 1 / 12) - 1;
            estMonthly = round2(bal * mRate);
            estBanner?.classList.remove('hidden');
            if (document.getElementById('pocket-yield-estimate-val')) {
                document.getElementById('pocket-yield-estimate-val').textContent = `+${formatMoney(estMonthly)} (${String(rate).replace('.', ',')}% E.A.)`;
            }
        } else {
            estBanner?.classList.add('hidden');
        }

        document.getElementById('pocket-yield-id').value = p.id;
        document.getElementById('pocket-yield-title').textContent = `Rendimiento • ${stripLeadingEmoji(p.name)}`;
        document.getElementById('pocket-yield-amount').value = estMonthly > 0 ? formatNumberInput(estMonthly) : '';
        document.getElementById('pocket-yield-date').value = currentDate.toLocaleDateString('en-CA');
        const syncCheck = document.getElementById('pocket-yield-sync-income');
        if (syncCheck) syncCheck.checked = !p.excludeFromBalance;
        hasUnsavedChanges = false;
        document.getElementById('pocket-yield-modal')?.classList.remove('hidden');
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
    const annualRate = parseMoneyInput(document.getElementById('new-pocket-rate')?.value);

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
        annualRate,
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

// Calculadora de Ahorro e Interés Compuesto
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
    
    // Forzar el estado visual de la pestaña
    const tabs = document.querySelectorAll('#pockets-mode-tabs .segmented-btn');
    if (tabs.length > 0) {
        tabs.forEach(t => t.classList.remove('active'));
        const activeTab = Array.from(tabs).find(t => t.getAttribute('data-ptab') === section);
        if (activeTab) activeTab.classList.add('active');
    }
    
    modalEl.classList.remove('hidden');
    renderPocketsView();
    switchPocketsModalTab(section);

    const listView = document.getElementById('pockets-tab-list-view');
    const simView = document.getElementById('pockets-tab-sim-view');
    if (listView) listView.scrollTop = 0;
    if (simView) simView.scrollTop = 0;

    if (section === 'simulator') {
        ['sav-sim-age-now', 'sav-sim-age-goal', 'sav-sim-initial', 'sav-sim-contrib', 'sav-sim-rate'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const freqEl = document.getElementById('sav-sim-freq');
        if (freqEl) freqEl.value = '12';
        const pill = document.getElementById('sav-sim-years-badge');
        if (pill) pill.classList.add('hidden');
        document.querySelector('#pockets-tab-sim-view details')?.removeAttribute('open');
        renderEmptySavingsPlaceholder();
    }
};

const initPocketsAndSimulatorTabs = () => {
    setupSavingsDrawerAccordion();
    const modalContent = document.querySelector('#pockets-modal .modal-content');
    if (!modalContent || document.getElementById('pockets-mode-tabs')) return;

    const headerEl = modalContent.querySelector('.modal-header');
    const existingNodes = Array.from(modalContent.children).filter(el => el !== headerEl);

    // Fijar estructura flex del modal para anclar la cabecera arriba
    modalContent.style.display = 'flex';
    modalContent.style.flexDirection = 'column';
    modalContent.style.maxHeight = '88dvh';
    modalContent.style.overflow = 'hidden';
    modalContent.style.padding = '0';

    if (headerEl) {
        headerEl.style.padding = '18px 18px 12px 18px';
        headerEl.style.marginBottom = '0';
        headerEl.style.borderBottom = '1px solid var(--border-color)';
        headerEl.style.flexShrink = '0';
        headerEl.style.background = 'var(--card-bg)';
    }

    const listWrapper = document.createElement('div');
    listWrapper.id = 'pockets-tab-list-view';
    listWrapper.style.cssText = 'flex:1; overflow-y:auto; padding:14px 18px 22px 18px; -webkit-overflow-scrolling:touch;';
    existingNodes.forEach(node => listWrapper.appendChild(node));

    const tabsBar = document.createElement('div');
    tabsBar.id = 'pockets-mode-tabs';
    tabsBar.className = 'segmented-control';
    tabsBar.style.margin = '12px 18px 0 18px';
    tabsBar.style.flexShrink = '0';
    tabsBar.innerHTML = `
        <button type="button" class="segmented-btn active" data-ptab="pockets">Mis Bolsillos</button>
        <button type="button" class="segmented-btn" data-ptab="simulator">Calculadora</button>
    `;

    const simWrapper = document.createElement('div');
    simWrapper.id = 'pockets-tab-sim-view';
    simWrapper.className = 'hidden';
    simWrapper.style.cssText = 'flex:1; overflow-y:auto; padding:14px 18px 22px 18px; -webkit-overflow-scrolling:touch;';
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
                    <strong style="color:var(--text-main); display:block; margin-bottom:2px;">1. El efecto "bola de nieve"</strong>
                    <span>Cada periodo tus rendimientos se suman al saldo acumulado, de modo que el siguiente periodo ganas intereses sobre tu capital <b>más</b> los intereses anteriores (interés compuesto).</span>
                </div>
                <div style="background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:10px; padding:9px 10px;">
                    <strong style="color:var(--text-main); display:block; margin-bottom:4px;">2. Retención e Inflación</strong>
                    <div style="font-size:11px; display:flex; flex-direction:column; gap:3px;">
                        <span>• <b>Retención:</b> Se descuenta automáticamente del interés ganado <i>antes</i> de sumarse a tu capital en cada periodo, afectando el crecimiento real.</span>
                        <span>• <b>Inflación:</b> El "Poder adquisitivo real" te muestra a cuánto dinero de <i>hoy</i> equivaldría tu capital futuro, descontando el aumento proyectado del costo de vida.</span>
                    </div>
                </div>
                <div style="background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:10px; padding:9px 10px;">
                    <strong style="color:var(--text-main); display:block; margin-bottom:4px;">3. Ejemplo paso a paso</strong>
                    <span>Imagina que tienes <b>30 años</b>, empiezas con <b>$ 1.000.000</b>, aportas <b>$ 300.000 mensuales</b> hasta los <b>40 años</b> (10 años = 120 meses) al <b>8% E.A.</b> con retención del <b>7%</b> (Cajita):</span>
                    <div style="margin-top:6px; padding-left:8px; border-left:2px solid var(--positive); font-size:11px; display:flex; flex-direction:column; gap:3px;">
                        <span>• <b>Mes 1:</b> Interés bruto de $ 6.434 − $ 450 (Retención) = <b>$ 5.984 netos</b> + $ 300.000 aporte = <b>$ 1.305.984</b></span>
                        <span>• <b>Año 10:</b> Aportaste <b>$ 37.000.000</b>, pagaste <b>-$ 1.258.490</b> de retención, y ganaste <b class="positive">+$ 16.720.013</b> netos. Terminas con <b class="positive">$ 53.720.013</b> en el banco.</span>
                        <span>• <b>Inflación (5%):</b> Esos $ 53.720.013 comprarán en 10 años lo mismo que compran <b>$ 32.979.791</b> hoy.</span>
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
                <span id="sav-sim-years-badge" class="sav-sim-horizon-pill hidden"></span>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label style="white-space:nowrap;">Edad actual</label>
                    <input type="number" id="sav-sim-age-now" min="15" max="90" placeholder="Ej. 30" required>
                </div>
                <div class="form-group">
                    <label style="white-space:nowrap;">Edad objetivo</label>
                    <input type="number" id="sav-sim-age-goal" min="16" max="100" placeholder="Ej. 60" required>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <label style="margin:0;">Ahorro actual ($)</label>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:10.5px; font-weight:700; color:var(--text-muted);">Importar bolsillo</span>
                        <label class="switch" style="transform:scale(0.85); transform-origin:right center; margin:0;"><input type="checkbox" id="toggle-sav-sim-pocket"><span class="slider"></span></label>
                    </div>
                </div>
                <div id="sav-sim-pocket-select-box" class="hidden" style="margin-bottom:8px;">
                    <select id="sav-sim-pocket-select" style="font-size:13px; font-weight:600; background:var(--card-inner-bg); border:1px dashed var(--accent);">
                        <option value="">Selecciona un bolsillo...</option>
                    </select>
                </div>
                <input type="text" id="sav-sim-initial" class="money-input" inputmode="decimal" placeholder="0,00">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label style="white-space:nowrap;">Frecuencia aporte</label>
                    <select id="sav-sim-freq">
                        <option value="24">Quincenal</option>
                        <option value="12" selected>Mensual</option>
                        <option value="4">Trimestral</option>
                        <option value="1">Anual</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="white-space:nowrap;">Aporte ($)</label>
                    <input type="text" id="sav-sim-contrib" class="money-input" inputmode="decimal" placeholder="Ej. 300.000">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group" style="margin-bottom:12px;">
                    <label>Rendimiento (% E.A.)</label>
                    <input type="text" id="sav-sim-rate" inputmode="decimal" placeholder="Ej. 8">
                </div>
                <div class="form-group" style="margin-bottom:12px;">
                    <label>Inflación esperada (%)</label>
                    <input type="text" id="sav-sim-inflation" inputmode="decimal" placeholder="Ej. 5">
                </div>
            </div>

            <div class="form-group" style="margin-bottom:14px; background:rgba(245, 158, 11, 0.05); padding:8px 10px; border-radius:10px; border:1px dashed rgba(245, 158, 11, 0.25);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <label style="margin:0; color:#d97706; display:flex; align-items:center; gap:4px;">${renderIcon('file-text', 14)} Retención en la fuente</label>
                </div>
                <small style="display:block; font-size:10.5px; color:var(--text-muted); margin-bottom:6px; line-height:1.2;">Tarifa sobre rendimientos (descontada cada periodo).</small>
                <select id="sav-sim-tax" style="background:var(--card-bg); font-size:12px; padding:8px; border-color:rgba(245, 158, 11, 0.25);">
                    <option value="0">Sin retención (0%) — Ej. AFC / FPV</option>
                    <option value="7">Cuentas de Ahorro / Cajitas (7%)</option>
                    <option value="4">Certificados a Término / CDT (4%)</option>
                </select>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; display:flex; align-items:center; justify-content:center; gap:6px;">
                ${renderIcon('calculator', 15)} Calcular ahorro
            </button>
        </form>

        <div id="sav-sim-results-box"></div>

        <div class="sav-sim-note">
            <span style="color:var(--accent); flex-shrink:0; margin-top:1px;">${renderIcon('info', 15)}</span>
            <div>
                <strong style="display:block; color:var(--text-main); margin-bottom:2px;">Estimación referencial, no garantía</strong>
                <span>La proyección es informativa y no reemplaza asesoría tributaria. No contempla exenciones por componente inflacionario anual, topes diarios de UVT ni comisiones.</span>
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
        const rawNow = (document.getElementById('sav-sim-age-now')?.value || '').trim();
        const rawGoal = (document.getElementById('sav-sim-age-goal')?.value || '').trim();
        const pill = document.getElementById('sav-sim-years-badge');
        if (!pill) return;

        if (!rawNow || !rawGoal) {
            pill.classList.add('hidden');
            return;
        }
        const aNow = parseInt(rawNow, 10) || 0;
        const aGoal = parseInt(rawGoal, 10) || 0;
        const diff = aGoal - aNow;
        pill.classList.remove('hidden');
        pill.textContent = diff > 0 ? `Horizonte: ${diff} año${diff !== 1 ? 's' : ''}` : 'Revisa las edades';
    };

    ['sav-sim-age-now', 'sav-sim-age-goal'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', syncHorizonLabel);
    });
    syncHorizonLabel();

    const togglePocket = document.getElementById('toggle-sav-sim-pocket');
    const pocketBox = document.getElementById('sav-sim-pocket-select-box');
    const pocketSelect = document.getElementById('sav-sim-pocket-select');

    if (togglePocket && pocketBox && pocketSelect) {
        togglePocket.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            pocketBox.classList.toggle('hidden', !isChecked);
            
            if (isChecked) {
                const totalPockets = typeof getPocketsTotalSaved === 'function' ? getPocketsTotalSaved() : 0;
                let html = `<option value="">Selecciona un bolsillo...</option>`;
                
                if (totalPockets > 0) {
                    html += `<option value="${totalPockets}">Todos los bolsillos (${formatCompact(totalPockets)})</option>`;
                    if (financeData.pockets && financeData.pockets.length > 0) {
                        financeData.pockets.forEach(p => {
                            const m = computePocketMetrics(p);
                            if (m.balance > 0) {
                                html += `<option value="${m.balance}">• ${stripLeadingEmoji(p.name)} (${formatCompact(m.balance)})</option>`;
                            }
                        });
                    }
                } else {
                    html += `<option value="" disabled>No hay saldo en bolsillos</option>`;
                }
                pocketSelect.innerHTML = html;
            }
        });

        pocketSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val) {
                const initInput = document.getElementById('sav-sim-initial');
                if (initInput) {
                    initInput.value = formatNumberInput(parseFloat(val));
                    runSavingsSimulation();
                }
            }
        });
    }

    document.getElementById('btn-sav-sim-load-example')?.addEventListener('click', (e) => {
        document.getElementById('sav-sim-age-now').value = '30';
        document.getElementById('sav-sim-age-goal').value = '40';
        document.getElementById('sav-sim-initial').value = formatNumberInput(1000000);
        document.getElementById('sav-sim-freq').value = '12';
        document.getElementById('sav-sim-contrib').value = formatNumberInput(300000);
        document.getElementById('sav-sim-rate').value = '8';
        
        const storedInf = (financeData.exchangeRates && financeData.exchangeRates.infCurr > 0) 
            ? financeData.exchangeRates.infCurr 
            : 5;
            
        if (document.getElementById('sav-sim-inflation')) document.getElementById('sav-sim-inflation').value = String(storedInf).replace('.', ',');
        if (document.getElementById('sav-sim-tax')) document.getElementById('sav-sim-tax').value = '7';
        
        syncHorizonLabel();
        e.target.closest('details')?.removeAttribute('open');
        runSavingsSimulation(true);
    });
    document.getElementById('btn-sav-sim-load-example')?.addEventListener('click', (e) => {
        document.getElementById('sav-sim-age-now').value = '30';
        document.getElementById('sav-sim-age-goal').value = '40';
        document.getElementById('sav-sim-initial').value = formatNumberInput(1000000);
        document.getElementById('sav-sim-freq').value = '12';
        document.getElementById('sav-sim-contrib').value = formatNumberInput(300000);
        document.getElementById('sav-sim-rate').value = '8';
        
        const storedInf = (financeData.exchangeRates && financeData.exchangeRates.infCurr > 0) 
            ? financeData.exchangeRates.infCurr 
            : 5;
            
        if (document.getElementById('sav-sim-inflation')) document.getElementById('sav-sim-inflation').value = String(storedInf).replace('.', ',');
        if (document.getElementById('sav-sim-tax')) document.getElementById('sav-sim-tax').value = '7';
        
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

    const currentAge = parseInt(document.getElementById('sav-sim-age-now')?.value, 10) || 0;
    const targetAge = parseInt(document.getElementById('sav-sim-age-goal')?.value, 10) || 0;
    const initial = parseMoneyInput(document.getElementById('sav-sim-initial')?.value);
    const periodsPerYear = parseInt(document.getElementById('sav-sim-freq')?.value, 10) || 12;
    const contribution = parseMoneyInput(document.getElementById('sav-sim-contrib')?.value);
    const rawRateStr = (document.getElementById('sav-sim-rate')?.value || '0').replace(',', '.');
    const annualRate = Math.max(0, Math.min(30, parseFloat(rawRateStr) || 0));
    
    // Nuevos valores: Inflación y Retención
    const rawInfStr = (document.getElementById('sav-sim-inflation')?.value || '0').replace(',', '.');
    const inflationRate = Math.max(0, Math.min(30, parseFloat(rawInfStr) || 0));
    const taxRate = parseFloat(document.getElementById('sav-sim-tax')?.value || '0') / 100;

    if (currentAge <= 0 || targetAge <= currentAge) {
        if (showAlertOnError) alert('La edad objetivo debe ser mayor a la edad actual (máximo 70 años de proyección).');
        return;
    }

    const simRes = calculateCompoundSavingsProjection({
        currentAge, targetAge, initial, periodsPerYear, contribution, annualRate, taxRate
    });

    if (!simRes.valid) {
        if (showAlertOnError) alert('La edad objetivo debe ser mayor a la edad actual (máximo 70 años de proyección).');
        return;
    }

    const { years, totalAdded, totalTax, finalSnap, principalPct, interestPct, timeline } = simRes;
    
    // Cálculo de poder adquisitivo descontando la inflación
    const purchasingPower = finalSnap.balance / Math.pow(1 + (inflationRate / 100), years);

    const W = 340, H = 118, padL = 76, padR = 10, padT = 12, padB = 20;
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
            <text x="${padL - 6}" y="${padT + 4}" text-anchor="end" font-size="8" fill="#94a3b8">${formatCompact(maxVal)}</text>
            <text x="${padL - 6}" y="${baseY}" text-anchor="end" font-size="8" fill="#94a3b8">$0</text>
            <path d="${areaPath}" fill="url(#savSimGrad)"/>
            <polyline fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-dasharray="4,3" points="${capPts.join(' ')}"/>
            <polyline fill="none" stroke="var(--positive)" stroke-width="2.4" stroke-linecap="round" points="${balPts.join(' ')}"/>
            <text x="${padL}" y="${H - 4}" text-anchor="start" font-size="9" fill="#94a3b8">${currentAge} años</text>
            <text x="${W - padR}" y="${H - 4}" text-anchor="end" font-size="9" font-weight="700" fill="var(--text-main)">${targetAge} años</text>
        </svg>
    `;

    const rowsHtml = timeline.slice(1).map(r => `
        <tr>
            <td style="text-align:left; white-space:nowrap;">Año ${r.year}</td>
            <td style="white-space:nowrap;">${formatCompact(r.contributed)}</td>
            <td class="positive" style="white-space:nowrap;">+${formatCompact(r.interest)}</td>
            <td style="white-space:nowrap;"><b>${formatCompact(r.balance)}</b></td>
        </tr>
    `).join('');

    box.innerHTML = `
        <div class="sav-sim-hero">
            <span style="display:block; font-size:11px; font-weight:700; color:var(--text-muted);">Capital proyectado a los ${targetAge} años</span>
            <div style="font-size:22px; font-weight:800; color:var(--positive); margin-top:2px;">${formatMoneyHtml(finalSnap.balance)}</div>
            
            ${inflationRate > 0 ? `
            <div style="font-size:11px; font-weight:600; color:var(--text-muted); margin-top:4px;">
                Poder adquisitivo real (${String(inflationRate).replace('.', ',')}% infl.): <b style="color:var(--text-main);">${formatMoney(purchasingPower)}</b>
            </div>
            ` : ''}

            <div class="sav-sim-bar-track" style="margin-top:10px;">
                <div class="sav-sim-bar-principal" style="width:${principalPct}%;"></div>
                <div class="sav-sim-bar-interest" style="width:${interestPct}%;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:10.5px; font-weight:700;">
                <span style="color:var(--accent);">● Capital aportado (${principalPct}%)</span>
                <span class="positive">● Rendimientos (${interestPct}%)</span>
            </div>
            ${svgChart}
        </div>

        <div class="sav-sim-card" style="display:flex; flex-direction:column; gap:10px; padding:13px 14px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; font-size:12.5px;">
                <span style="color:var(--text-muted); font-weight:600;">Saldo inicial</span>
                <strong style="color:var(--text-main); font-size:13.5px; white-space:nowrap;">${formatMoneyHtml(initial)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; font-size:12.5px;">
                <span style="color:var(--text-muted); font-weight:600;">Aportes nuevos</span>
                <strong style="color:var(--accent); font-size:13.5px; white-space:nowrap;">${formatMoneyHtml(totalAdded)}</strong>
            </div>
            
            ${totalTax > 0 ? `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; font-size:12px; color:var(--text-muted);">
                <span style="display:flex; align-items:center; gap:4px;">Retención en la fuente</span>
                <strong class="negative" style="white-space:nowrap;">-${formatMoneyHtml(totalTax)}</strong>
            </div>
            ` : ''}
            
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding-top:10px; border-top:1px dashed var(--border-color); font-size:13px;">
                <span style="color:var(--text-main); font-weight:800;">Interés neto ganado</span>
                <strong class="positive" style="font-size:15px; font-weight:800; white-space:nowrap;">+${formatMoneyHtml(finalSnap.interest)}</strong>
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
                            <th style="text-align:left; white-space:nowrap;">Edad</th>
                            <th style="white-space:nowrap;">Aportado</th>
                            <th style="white-space:nowrap;">Int. Neto</th>
                            <th style="white-space:nowrap;">Total</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        </details>
    `;
};

// ==========================================
// MÓDULO 7: ACTIVOS FIJOS Y BIENES
// ==========================================
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
            const prevVal = i > 0 ? sorted[i - 1].value : (a.purchaseValue > 0 ? a.purchaseValue : cur.value);
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
                id: now.getTime(), monthId: getMonthId(now), type: 'expense', status: 'closed', 
                account: src, category: catName, subcategory: subName, 
                description: customDesc, amount: val, 
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

// ==========================================
// MÓDULO 8: SALUD FINANCIERA Y CAPACIDAD DE ENDEUDAMIENTO
// ==========================================
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
    
    updateHealthTrend();
    
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
            const loan24 = visualQuota * 24 * 0.75;
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
// ==========================================
// MÓDULO 9: NÓMINA, PRESTACIONES Y TRIBUTACIÓN COLOMBIA
// ==========================================
const getBaseTaxReference = () => {
    const ref = (typeof DEFAULT_TAX_PARAMS_2026 !== 'undefined') ? DEFAULT_TAX_PARAMS_2026 : getTaxParams();
    return { ...ref, year: currentDate.getFullYear() };
};

const updateTaxParamsHints = () => {
    const ref = getBaseTaxReference();
    const uvt = parseMoneyInput(document.getElementById('param-uvt')?.value) || ref.uvt;
    const smmlv = parseMoneyInput(document.getElementById('profile-smmlv')?.value) || ref.smmlv;
    const aux = parseMoneyInput(document.getElementById('profile-transport-aid')?.value) || ref.transportAid;
    const ex25Year = parseMoneyInput(document.getElementById('param-exempt25-annual-uvt')?.value) || ref.exempt25AnnualUvt;
    const g40Year = parseMoneyInput(document.getElementById('param-global40-annual-uvt')?.value) || ref.global40AnnualUvt;
    const prepMonth = parseMoneyInput(document.getElementById('param-prepaid-monthly-uvt')?.value) || ref.prepaidMonthlyUvt;
    const depMonth = parseMoneyInput(document.getElementById('param-dependents-monthly-uvt')?.value) || ref.dependentsMonthlyUvt;
    const housMonth = parseMoneyInput(document.getElementById('param-housing-monthly-uvt')?.value) || ref.housingMonthlyUvt;
    const volYear = parseMoneyInput(document.getElementById('param-voluntary-annual-uvt')?.value) || ref.voluntaryAnnualUvt;

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
    const details = document.getElementById('renta-proj-details');
    if (!details) return;

    const badgeHtml = res.mustDeclare
        ? `<span class="widget-badge danger" style="display:inline-flex; align-items:center; gap:4px;">${renderIcon('alert', 12)} Topes Excedidos</span>`
        : `<span class="widget-badge good" style="display:inline-flex; align-items:center; gap:4px;">${renderIcon('check', 12)} Exento (Proyectado)</span>`;

    const buildRow = (label, currentVal, limitVal, exceeds) => {
        const rawPct = limitVal > 0 ? (currentVal / limitVal) * 100 : 0;
        const pct = Math.round(rawPct);
        const barWidth = currentVal > 0 ? Math.min(100, Math.max(2.5, rawPct)) : 0;
        const valColor = exceeds ? 'var(--negative)' : 'var(--text-main)';
        const barColor = exceeds
            ? 'var(--negative)'
            : (pct >= 80 ? '#f59e0b' : 'var(--positive)');

        return `
            <div style="padding:7px 0; ${exceeds ? 'background:rgba(239, 68, 68, 0.06); border-radius:8px; padding:8px;' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                    <span style="color:var(--text-muted); line-height:1.3;">${label}</span>
                    <div style="text-align:right; flex-shrink:0;">
                        <strong style="color:${valColor}; display:block; font-size:12.5px;">${formatMoney(currentVal)}</strong>
                        <span style="display:block; font-size:10px; color:var(--text-muted); margin-top:1px;">Tope: ${formatMoney(limitVal)} (${pct}%)</span>
                    </div>
                </div>
                <div style="width:100%; height:6px; background:var(--hover-bg); border-radius:99px; overflow:hidden; margin-top:6px;">
                    <div style="width:${barWidth}%; height:100%; background-color:${barColor}; border-radius:99px; transition:width 0.35s ease;"></div>
                </div>
            </div>
        `;
    };

    const sim = res.taxSimulation || {};
    const hasSalary = !!sim.hasSalaryConfig;
    const baseGravableUVT = hasSalary ? (sim.baseGravableUVT || 0) : 0;
    const baseGravableAnual = hasSalary ? (sim.baseGravableAnual || 0) : 0;
    const impuestoEstimado = hasSalary ? (sim.impuestoEstimado || 0) : 0;
    const retencionesEstimadas = hasSalary ? (sim.retencionesEstimadas || 0) : 0;
    const saldoAPagar = hasSalary ? (sim.saldoAPagar || 0) : 0;

    const isFavor = saldoAPagar < 0;
    const saldoColor = isFavor ? 'var(--positive)' : (saldoAPagar > 0 ? 'var(--negative)' : 'var(--text-main)');
    const uvtLabel = String(round2(baseGravableUVT)).replace('.', ',');

    const cedulaHtml = `
        <div style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--border-color);">
            <strong style="display:flex; align-items:center; gap:5px; color:var(--text-main); margin-bottom:8px; font-size:12px;">
                ${renderIcon('calculator', 14)} Cálculo Cédula General (Art. 241 E.T.)
            </strong>
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="color:var(--text-muted);">Base Gravable (${uvtLabel} UVT):</span>
                <b>${formatMoney(baseGravableAnual)}</b>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="color:var(--text-muted);">Impuesto Estimado:</span>
                <b class="negative">${formatMoney(impuestoEstimado)}</b>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="color:var(--text-muted);">Retenciones Practicadas (Aprox):</span>
                <b class="positive">${formatMoney(retencionesEstimadas)}</b>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; padding-top:7px; border-top:1px solid var(--border-color);">
                <span style="font-weight:800; color:var(--text-main);">Saldo a ${isFavor ? 'Favor' : 'Pagar'}:</span>
                <strong style="color:${saldoColor}; font-size:14.5px;">${formatMoney(Math.abs(saldoAPagar))}</strong>
            </div>
            ${!hasSalary ? `<small style="display:block; margin-top:5px; font-size:10px; color:var(--text-muted);">Configura tu salario en Perfil para proyectar tu renta laboral.</small>` : ''}
        </div>
    `;

    const avisoHtml = `
        <div style="margin-top:10px; background:rgba(245, 158, 11, 0.08); border-left:3px solid #f59e0b; padding:8px 10px; border-radius:6px; font-size:10px; color:var(--text-muted); line-height:1.4; display:flex; gap:6px; align-items:flex-start;">
            <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:1px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div><b>AVISO:</b> Estos son datos informativos proyectados según la información registrada en la app. <b>NO</b> reemplazan la realidad económica ni la información exógena oficial con la que la DIAN u otras entidades validan tu obligación de declarar.</div>
        </div>
    `;

    details.innerHTML = `
        <div style="margin-bottom:10px;">
            <strong style="color:var(--accent); display:flex; align-items:center; gap:6px; margin-bottom:6px; font-size:14px;">
                ${renderIcon('file-text', 16)}
                <span>Proyección Renta ${year}</span>
            </strong>
            ${badgeHtml}
        </div>
        <div style="font-size:11.5px; display:flex; flex-direction:column; gap:4px;">
            ${buildRow('Patrimonio Bruto (4.500 UVT)', res.current.patrimonio, res.limits.patrimonio, res.exceeds.patrimonio)}
            ${buildRow('Ingresos Totales (1.400 UVT)', res.current.ingresos, res.limits.ingresos, res.exceeds.ingresos)}
            ${buildRow('Consignaciones (1.400 UVT)', res.current.consignaciones, res.limits.consignaciones, res.exceeds.consignaciones)}
            ${buildRow('Consumos T. Crédito (1.400 UVT)', res.current.tarjetas, res.limits.tarjetas, res.exceeds.tarjetas)}
            ${buildRow('Total Compras (1.400 UVT)', res.current.compras, res.limits.compras, res.exceeds.compras)}
            ${cedulaHtml}
            ${avisoHtml}
        </div>
    `;
};

const renderTaxParamsUI = () => {
    const p = getTaxParams();
    if (document.getElementById('param-tax-year')) document.getElementById('param-tax-year').value = p.year || currentDate.getFullYear();
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

['param-tax-year', 'param-uvt', 'profile-smmlv', 'profile-transport-aid', 'param-exempt25-annual-uvt', 'param-global40-annual-uvt', 'param-prepaid-monthly-uvt', 'param-dependents-monthly-uvt', 'param-housing-monthly-uvt', 'param-voluntary-annual-uvt'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateTaxParamsHints);
    document.getElementById(id)?.addEventListener('change', updateTaxParamsHints);
});

document.getElementById('tax-params-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ref = getBaseTaxReference();
    saveTaxParams({
        year: parseInt(document.getElementById('param-tax-year')?.value, 10) || ref.year,
        uvt: parseMoneyInput(document.getElementById('param-uvt')?.value) || ref.uvt,
        smmlv: parseMoneyInput(document.getElementById('profile-smmlv')?.value) || ref.smmlv,
        transportAid: parseMoneyInput(document.getElementById('profile-transport-aid')?.value) || ref.transportAid,
        exempt25AnnualUvt: parseMoneyInput(document.getElementById('param-exempt25-annual-uvt')?.value) || ref.exempt25AnnualUvt,
        global40AnnualUvt: parseMoneyInput(document.getElementById('param-global40-annual-uvt')?.value) || ref.global40AnnualUvt,
        prepaidMonthlyUvt: parseMoneyInput(document.getElementById('param-prepaid-monthly-uvt')?.value) || ref.prepaidMonthlyUvt,
        dependentsMonthlyUvt: parseMoneyInput(document.getElementById('param-dependents-monthly-uvt')?.value) || ref.dependentsMonthlyUvt,
        housingMonthlyUvt: parseMoneyInput(document.getElementById('param-housing-monthly-uvt')?.value) || ref.housingMonthlyUvt,
        voluntaryAnnualUvt: parseMoneyInput(document.getElementById('param-voluntary-annual-uvt')?.value) || ref.voluntaryAnnualUvt,
        nonSalaryCapPct: parseMoneyInput(document.getElementById('param-non-salary-cap-pct')?.value) || ref.nonSalaryCapPct,
        fspSmmlvThreshold: parseMoneyInput(document.getElementById('param-fsp-smmlv')?.value) || ref.fspSmmlvThreshold
    });
    hasUnsavedChanges = false;
    updateTaxParamsHints();
    renderSalaryUI(false);
    alert('✅ Parámetros legales guardados. Tu cálculo salarial y tributario ha sido actualizado.');
});

document.getElementById('btn-reset-tax-params-2026')?.addEventListener('click', () => {
    if (confirm('¿Restaurar los parámetros legales a los valores base de referencia?')) {
        saveTaxParams(getBaseTaxReference());
        renderTaxParamsUI();
        renderSalaryUI(false);
        hasUnsavedChanges = false;
    }
});

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
                        txId, intTxId, debtId: d.id, quoteStep, name: d.name,
                        quota: appliedQuota, principal: appliedPrincipal, interest: appliedInterest,
                        quoteLabel: `${d.debtPaidQuotes || paidQuotes}/${totalQuotes}`
                    });
                }
            }

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
                        txId, intTxId, debtId: d.id, targetTxId: p.tx.id, quoteStep,
                        name: `${d.name} (${p.tx.description})`,
                        quota: pAppliedQuota, principal: pAppliedPrincipal, interest: pAppliedInterest,
                        quoteLabel: `${p.tx.paidInstallments}/${p.installments}`
                    });
                }
            });
        });

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
                    txId, pocketId: p.id, pocketAmt: appliedSavings, quoteStep: 0,
                    name: p.name, quota: appliedSavings, principal: appliedSavings, interest: 0,
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
                    txId: l.txId, intTxId: l.intTxId, debtId: l.debtId, targetTxId: l.targetTxId,
                    pocketId: l.pocketId, pocketAmt: l.pocketAmt, quoteStep: l.quoteStep
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
    const hasNonSalDOM = !!document.getElementById('profile-has-non-salary')?.checked;
    const nsItemsDOM = hasNonSalDOM ? getNonSalaryItemsFromDOM() : [];
    const config = salaryStr ? JSON.parse(salaryStr) : {
        basicSalary: parseMoneyInput(document.getElementById('profile-basic-salary')?.value),
        hasNonSalary: hasNonSalDOM,
        nonSalaryItems: nsItemsDOM,
        nonSalary: summarizeNonSalaryForMonth(nsItemsDOM, hasNonSalDOM, currentDate).totalMonth,
        transportAuto: document.getElementById('profile-transport-auto')?.checked !== false,
        retProc: document.getElementById('profile-retefuente-proc')?.value || '1',
        retPct: parseMoneyInput(document.getElementById('profile-retefuente-pct')?.value) || 0,
        dedPrepaid: parseMoneyInput(document.getElementById('profile-ded-prepaid')?.value) || 0,
        dedHousing: parseMoneyInput(document.getElementById('profile-ded-housing')?.value) || 0,
        dedVoluntary: parseMoneyInput(document.getElementById('profile-ded-voluntary')?.value) || 0,
        dedDependents: !!document.getElementById('profile-ded-dependents')?.checked
    };
    const sim = simulateExtraBonus(config, bonusAmt, bonusType);
    const orderTag = sim.retOrder === 'first_payment' ? 'Primer pago' : 'En salario';
    const capTag = sim.retCapEval === 'annual' ? 'Tope Anual' : 'Tope Mensual';
    let alertsHtml = '';
    if (sim.retOrder === 'first_payment' && sim.salaryRetImpact > 0) {
        alertsHtml += `<div style="font-size:10.5px; color:var(--accent); margin-top:6px;">El bono consume primero el cupo exento; tu salario de fin de mes asumirá <b>+${formatMoney(sim.salaryRetImpact)}</b> de Retefuente.</div>`;
    }
    if (sim.triggeredLey1393) alertsHtml += `<div style="font-size:10.5px; color:#d97706; margin-top:6px; display:flex; align-items:flex-start; gap:5px;">${renderIcon('alert', 13)}<span><b>Ley 1393:</b> ${formatMoney(sim.deltaExcessLey1393)} suma a tu IBC.</span></div>`;
    if (sim.crossedFsp) alertsHtml += `<div style="font-size:10.5px; color:#d97706; margin-top:4px; display:flex; align-items:flex-start; gap:5px;">${renderIcon('alert', 13)}<span><b>Umbral FSP:</b> El bono activa aporte Solidaridad.</span></div>`;
    resultsBox.classList.remove('hidden');
    resultsBox.innerHTML = `<div class="glass-sub-box" style="font-size:11px;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding-bottom:5px; border-bottom:1px dashed rgba(148,163,184,0.3);"><span style="color:var(--text-muted); font-size:10px;">Regla aplicada:</span><span class="widget-badge" style="font-size:9.5px;">${orderTag} • ${capTag}</span></div><div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Bono Bruto:</span><b>${formatMoney(sim.bonus)}</b></div><div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>(-) Salud/Pens/FSP:</span><span class="negative">-${formatMoney(sim.deltaSS)}</span></div><div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>(-) Retefuente en bono:</span><span class="negative">-${formatMoney(sim.deltaRet)}</span></div><div style="display:flex; justify-content:space-between; align-items:center; padding-top:6px; border-top:1px dashed rgba(148,163,184,0.35);"><div><span style="display:block; font-size:10px; color:var(--text-muted);">Neto (Desc. ${String(sim.effectiveTaxRate).replace('.', ',')}%)</span><strong class="positive" style="font-size:15px;">${formatMoney(sim.netBonus)}</strong></div><button type="button" id="btn-reg-simulated-bonus" class="btn-confirm-pending" style="margin-top:0;">+ Registrar</button></div>${alertsHtml}</div>`;
    document.getElementById('btn-reg-simulated-bonus')?.addEventListener('click', () => {
        const salCat = financeData.categories.income.find(c => stripLeadingEmoji(c.name) === 'Salario / Nómina');
        openQuickIncomeModal({
            title: 'Registrar Bonificación',
            subtitle: 'Neto tras deducciones',
            category: salCat ? salCat.name : 'Salario / Nómina',
            description: bonusType === 'salary' ? 'Bonificación Salarial' : 'Bonificación Ocasional',
            amount: sim.netBonus
        });
    });
};
document.getElementById('sim-bonus-amount')?.addEventListener('input', renderBonusSimulator);
document.getElementById('sim-bonus-type')?.addEventListener('change', renderBonusSimulator);

const toggleBiweeklyModeVisibility = () => {
    const freq = document.getElementById('profile-pay-frequency')?.value || 'monthly', biweeklyGroup = document.getElementById('biweekly-ret-mode-group');
    if (!biweeklyGroup) return;
    if (freq === 'biweekly') biweeklyGroup.classList.remove('hidden'); else biweeklyGroup.classList.add('hidden');
};
document.getElementById('profile-pay-frequency')?.addEventListener('change', toggleBiweeklyModeVisibility);

const renderSalaryUI = (shouldSyncBudget = false) => {
    const salaryStr = localStorage.getItem('myFinancesSalary'); if (!salaryStr) return;
    const config = JSON.parse(salaryStr);
    if (document.getElementById('profile-basic-salary')) document.getElementById('profile-basic-salary').value = config.basicSalary ? formatNumberInput(config.basicSalary) : '';
    
    // Migración automática si tenía un valor único anterior y sincronización de la lista dinámica
    if (!Array.isArray(config.nonSalaryItems)) {
        config.nonSalaryItems = config.nonSalary > 0
            ? [{ id: 'ns_legacy', name: 'Bonos / No Salarial', amount: round2(config.nonSalary), month: 'all', taxable: true }]
            : [];
    }
    const hasNonSal = config.hasNonSalary !== undefined ? !!config.hasNonSalary : config.nonSalaryItems.length > 0;
    const hasNonSalCheck = document.getElementById('profile-has-non-salary');
    if (hasNonSalCheck) hasNonSalCheck.checked = hasNonSal;
    renderNonSalaryItemsUI(config.nonSalaryItems, hasNonSal, currentDate);
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
    if (document.getElementById('profile-retefuente-proc')) {
        document.getElementById('profile-retefuente-proc').value = activeProc;
        if (activeProc === '2') {
            document.getElementById('proc2-pct-group')?.classList.remove('hidden');
            if (document.getElementById('profile-retefuente-pct')) document.getElementById('profile-retefuente-pct').value = config.retPct ? formatNumberInput(config.retPct) : '';
        } else {
            document.getElementById('proc2-pct-group')?.classList.add('hidden');
        }
    }
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
        const isBiweekly = config.frequency === 'biweekly';
        
        const totalDev = round2(metrics.basic + metrics.nonSalary + metrics.effectiveTransport);
        document.getElementById('colilla-basic').innerText = formatMoney(metrics.basic);
        document.getElementById('colilla-non-salary').innerText = formatMoney(metrics.nonSalary);
        document.getElementById('colilla-transport').innerText = formatMoney(metrics.effectiveTransport);
        document.getElementById('colilla-total-dev').innerText = formatMoney(totalDev);

        const totalDed = round2(metrics.health + metrics.pension + metrics.fsp + metrics.ret);
        document.getElementById('colilla-health').innerText = `-${formatMoney(metrics.health)}`;
        document.getElementById('colilla-pension').innerText = `-${formatMoney(metrics.pension)}`;
        document.getElementById('colilla-fsp').innerText = `-${formatMoney(metrics.fsp)}`;
        document.getElementById('colilla-ret').innerText = `-${formatMoney(metrics.ret)}`;
        document.getElementById('colilla-total-ded').innerText = `-${formatMoney(totalDed)}`;
        
        const fspLabel = document.getElementById('colilla-fsp-label');
        if (fspLabel) fspLabel.innerText = `FSP (${metrics.fspPct ? String(metrics.fspPct).replace('.', ',') : '0'}%):`;
        
        const retLabel = document.getElementById('colilla-ret-label');
        if (retLabel) retLabel.innerText = metrics.retProc === '0' ? 'Retefuente (Exenta):' : `Retefuente (${String(metrics.numeroUVT || 0).replace('.', ',')} UVT):`;

        const mId = getMonthId(currentDate);
        let advances = 0;
        financeData.transactions.forEach(t => {
            if (t.monthId === mId && t.type === 'income' && stripLeadingEmoji(t.category) === 'Salario / Nómina' && t.subcategory === 'Anticipo' && t.status !== 'pending') {
                advances += round2(t.amount);
            }
        });
        const advContainer = document.getElementById('salary-advances-container');
        if (advContainer) {
            if (advances > 0) {
                advContainer.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px; padding:9px 12px; background:rgba(239, 68, 68, 0.08); border:1px dashed rgba(239, 68, 68, 0.3); border-radius:12px;"><div style="min-width:0;"><span style="display:block; font-size:11.5px; color:var(--text-main); font-weight:600;">Anticipos registrados este mes</span><small style="display:block; font-size:10px; color:var(--text-muted);">Ya descontados del saldo a recibir arriba</small></div><strong class="negative" style="font-size:13.5px; white-space:nowrap; flex-shrink:0;">-${formatMoney(advances)}</strong></div>`;
            } else {
                advContainer.innerHTML = '';
            }
        }

        const dedBox = document.getElementById('salary-payroll-deductions-box');
        const dedList = document.getElementById('salary-payroll-deductions-list');
        let dedHtml = '';
        
        financeData.customAccounts.forEach(acc => {
            if (acc.category === 'debt' && acc.payrollDeduction && currentBalances[acc.id] > 0) {
                const qInfo = getDebtMonthlyQuotaBreakdown(acc, currentBalances[acc.id]);
                dedHtml += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;"><span style="color:var(--text-muted); display:inline-flex; align-items:center; gap:5px;">${renderIcon('briefcase', 12)} ${stripLeadingEmoji(acc.name)}</span><strong class="negative">-${formatMoney(qInfo.totalQuota)}</strong></div>`;
            }
        });
        
        (financeData.pockets || []).forEach(p => {
            if (p.payrollDeduction) {
                let q = p.customQuota > 0 ? p.customQuota : 0;
                if (q === 0 && p.goal > 0 && p.targetDate) {
                    const bal = (p.principal || 0) + (p.yields || 0);
                    const rem = Math.max(0, p.goal - bal);
                    const months = calcMonthsBetweenDates(getEffectiveStartStr(p.startDate), p.targetDate);
                    q = months > 0 ? round2(rem / months) : rem;
                }
                if (q > 0) dedHtml += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;"><span style="color:var(--text-muted); display:inline-flex; align-items:center; gap:5px;">${renderIcon('piggy', 12)} ${stripLeadingEmoji(p.name)}</span><strong style="color:var(--accent);">-${formatMoney(q)}</strong></div>`;
            }
        });

        if (dedBox && dedList) {
            if (dedHtml) {
                dedBox.classList.remove('hidden');
                dedList.innerHTML = dedHtml;
            } else {
                dedBox.classList.add('hidden');
            }
        }

        let alertsHtml = '';
        if (metrics.excessNonSalary > 0) {
            alertsHtml += `<div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:8px 10px; margin-bottom:12px; font-size:11px; color:#d97706; display:flex; align-items:flex-start; gap:6px;">${renderIcon('alert', 14)}<span><b>Ley 1393 (${metrics.params.nonSalaryCapPct}%):</b> Tus bonos exceden el tope en <b>${formatMoney(metrics.excessNonSalary)}</b>, tu IBC sube a <b>${formatMoney(metrics.ibc)}</b>.</span></div>`;
        }
        if (isBiweekly) {
            alertsHtml += `<div class="glass-sub-box" style="margin-bottom:12px; border-color:rgba(139,92,246,0.3); padding:10px 12px;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><span style="font-size:11.5px; font-weight:700; color:var(--accent); display:inline-flex; align-items:center; gap:5px;">${renderIcon('calendar', 13)} Distribución Quincenal</span><span class="widget-badge" style="font-size:9.5px;">${metrics.biweeklyRetMode === 'second_half' ? 'Ret. en 2Q' : '50% / 50%'}</span></div><div class="debt-metrics-grid" style="margin-bottom:0;"><div class="debt-metric-cell"><small>1ra Quincena (1Q)</small><strong class="positive">${formatMoney(metrics.net1Q)}</strong><small style="font-size:9.5px; margin-top:2px;">Retefuente: ${formatMoney(metrics.ret1Q)}</small></div><div class="debt-metric-cell"><small>2da Quincena (2Q)</small><strong class="positive">${formatMoney(metrics.net2Q)}</strong><small style="font-size:9.5px; margin-top:2px;">Retefuente: ${formatMoney(metrics.ret2Q)}</small></div></div></div>`;
        }
        const alertsContainer = document.getElementById('salary-dynamic-alerts');
        if (alertsContainer) alertsContainer.innerHTML = alertsHtml;

        const depBody = document.getElementById('salary-ret-depuration-body');
        if (depBody) {
            depBody.innerHTML = `
                <div style="display:flex; justify-content:space-between;"><span>Ingresos Brutos Laborales:</span><b>${formatMoney(metrics.ingresosBrutos)}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>(-) Salud/Pens/FSP:</span><span class="negative">-${formatMoney(metrics.incrngo)}</span></div>
                <div style="display:flex; justify-content:space-between; border-top:1px dashed rgba(148,163,184,0.3); padding-top:3px;"><span>Renta Líquida:</span><b>${formatMoney(metrics.rentaLiquida)}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>(-) Alivios Art.387 + AFC:</span><span class="positive">-${formatMoney(round2(metrics.totalDeduccionesArt387 + metrics.dedVoluntary))}</span></div>
                <div style="display:flex; justify-content:space-between;"><span>(-) Renta Exenta 25%:</span><span class="positive">-${formatMoney(metrics.exempt25)}</span></div>
                <div style="display:flex; justify-content:space-between;"><span>Beneficios Limitados (Tope 40%):</span><b>-${formatMoney(metrics.beneficiosLimitados)}</b></div>
                <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(148,163,184,0.3); padding-top:4px; color:var(--accent);"><span>Base Gravable (${String(metrics.numeroUVT).replace('.', ',')} UVT):</span><b>${formatMoney(metrics.baseGravable)}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>Retención Mensual (${String(metrics.effectiveRetPct).replace('.', ',')}%):</span><b class="${metrics.ret > 0 ? 'negative' : ''}">${formatMoney(metrics.ret)}</b></div>
                ${metrics.retPrima > 0 ? `<div style="display:flex; justify-content:space-between; color:var(--negative);"><span>Retención Prima Semestral:</span><b>${formatMoney(metrics.retPrima)}</b></div>` : ''}
            `;
        }

        const netToReceive = Math.max(0, metrics.net - advances);
        if (document.getElementById('calc-net-salary')) document.getElementById('calc-net-salary').innerText = formatMoney(netToReceive);
        if (document.getElementById('calc-pay-frequency-label')) {
            document.getElementById('calc-pay-frequency-label').innerText = isBiweekly
                ? (metrics.net1Q === metrics.net2Q ? `Quincenal (${formatCompact(metrics.net1Q)} c/u)` : `1Q: ${formatCompact(metrics.net1Q)} • 2Q: ${formatCompact(metrics.net2Q)}`)
                : 'Pago mensual';
        }

        const btnCopy = document.getElementById('btn-copy-colilla');
        if (btnCopy) {
            const newBtnCopy = btnCopy.cloneNode(true);
            btnCopy.parentNode.replaceChild(newBtnCopy, btnCopy);
            
            newBtnCopy.addEventListener('click', async () => {
                const txt = `COLILLA DE PAGO ESTIMADA\n\nDEVENGADOS:\nSueldo Básico: ${formatMoney(metrics.basic)}\nNo Salarial: ${formatMoney(metrics.nonSalary)}\nAux. Transporte: ${formatMoney(metrics.effectiveTransport)}\nTotal Devengado: ${formatMoney(totalDev)}\n\nDEDUCCIONES:\nSalud: -${formatMoney(metrics.health)}\nPensión: -${formatMoney(metrics.pension)}\nFSP: -${formatMoney(metrics.fsp)}\nRetefuente: -${formatMoney(metrics.ret)}\nTotal Ley: -${formatMoney(totalDed)}\n\nLIBRANZAS Y AHORRO:\nDeudas: -${formatMoney(metrics.payrollDebtDeductions)}\nAhorros: -${formatMoney(metrics.payrollSavingsDeductions)}\n\nNETO A PAGAR: ${formatMoney(metrics.net)}\nAnticipos descontados: -${formatMoney(advances)}\n\nTOTAL A RECIBIR: ${formatMoney(netToReceive)}`;
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(txt);
                        alert('📋 Colilla copiada al portapapeles.');
                        return;
                    }
                } catch (err) {}
                
                const tmp = document.createElement('textarea');
                tmp.value = txt;
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
                    alert('📋 Colilla copiada al portapapeles.');
                } catch (err) {
                    prompt('Tu navegador bloqueó el portapapeles. Copia este texto manualmente:', txt);
                }
                document.body.removeChild(tmp);
            });
        }

        const btnReg = document.getElementById('btn-quick-register-payroll');
        if (btnReg) {
            const newBtnReg = btnReg.cloneNode(true);
            btnReg.parentNode.replaceChild(newBtnReg, btnReg);
            newBtnReg.addEventListener('click', () => {
                if (metrics.net <= 0) { alert("Configura un sueldo básico mayor a $0."); return; }
                const salCat = financeData.categories.income.find(c => stripLeadingEmoji(c.name) === 'Salario / Nómina');
                const catValue = salCat ? `${salCat.name}::General` : '💼 Salario / Nómina::General';
                openQuickIncomeModal({ 
                    title: 'Registrar Pago de Nómina', 
                    subtitle: isBiweekly ? 'Selecciona la quincena y cuenta' : 'Abono de salario neto', 
                    category: catValue, 
                    description: 'Pago Nómina', 
                    amount: netToReceive, 
                    isBiweeklyPayroll: isBiweekly, 
                    metrics 
                });
            });
        }
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

    const bindBenefitBtn = (btnId, opts) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.onclick = () => {
            if (opts.amount <= 0) { alert("El saldo disponible para esta prestación es $0."); return; }
            openQuickIncomeModal(opts);
        };
    };
    bindBenefitBtn('btn-reg-prima-junio', { title: 'Registrar Prima Junio', subtitle: 'Prima 1er semestre', category: 'Prima de Servicios', benefitType: 'prima', description: `Prima (Junio ${metrics.currentYear})`, amount: primaJunNeta, defaultMonth: `${metrics.currentYear}-06`, defaultPeriod: config.frequency === 'biweekly' ? '2Q' : 'M' });
    bindBenefitBtn('btn-reg-prima-dic', { title: 'Registrar Prima Diciembre', subtitle: 'Prima 2do semestre', category: 'Prima de Servicios', benefitType: 'prima', description: `Prima (Dic ${metrics.currentYear})`, amount: primaDecNeta, defaultMonth: `${metrics.currentYear}-12`, defaultPeriod: config.frequency === 'biweekly' ? '1Q' : 'M' });
    bindBenefitBtn('btn-reg-proj-cesantias', { title: 'Consignar Cesantías Anuales', subtitle: `Año ${metrics.currentYear} • Fondo de Cesantías`, category: 'Cesantías e Intereses', benefitType: 'cesantias', description: `Cesantías Anuales (${metrics.currentYear})`, amount: metrics.projCesantiasBase, defaultCesantiasMode: 'fund' });
    bindBenefitBtn('btn-reg-proj-intereses', { title: 'Registrar Int. de Cesantías', subtitle: 'Pago anual directo', category: 'Cesantías e Intereses', benefitType: 'intereses_cesantias', description: `Intereses sobre Cesantías (${metrics.currentYear})`, amount: annualIntereses, defaultMonth: `${metrics.currentYear}-01`, defaultPeriod: config.frequency === 'biweekly' ? '2Q' : 'M' });
    bindBenefitBtn('btn-reg-liq-prima', { title: 'Prima Proporcional', subtitle: `Causada a hoy (${metrics.daysSemester}d)`, category: 'Prima de Servicios', benefitType: 'prima', description: `Prima Prop. (${metrics.daysSemester}d)`, amount: metrics.liqPrima });
    bindBenefitBtn('btn-reg-liq-cesantias', { title: 'Cesantías Proporcionales', subtitle: `Causadas a hoy (${metrics.daysYear}d)`, category: 'Cesantías e Intereses', benefitType: 'cesantias', description: `Cesantías Prop. (${metrics.daysYear}d)`, amount: metrics.liqCesantias, defaultCesantiasMode: 'fund' });
    bindBenefitBtn('btn-reg-liq-intereses', { title: 'Int. Cesantías Prop.', subtitle: `Causados a hoy (${metrics.daysYear}d)`, category: 'Cesantías e Intereses', benefitType: 'intereses_cesantias', description: `Intereses Prop. (${metrics.daysYear}d)`, amount: metrics.liqIntereses });
    bindBenefitBtn('btn-reg-liq-vacaciones', { title: 'Vacaciones Compensadas', subtitle: `Pendientes a hoy (${metrics.vacDaysPending}d)`, category: 'Vacaciones', benefitType: 'vacaciones', description: `Vacaciones Compensadas (${metrics.vacDaysPending}d)`, amount: metrics.liqVacaciones });
    renderBonusSimulator();

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

        const normCat = (str) => {
            const clean = typeof stripLeadingEmoji === 'function' ? stripLeadingEmoji(str) : String(str || '').replace(/^[^\w\s]+/, '').trim();
            return typeof normalizeCategoryName === 'function'
                ? normalizeCategoryName(clean)
                : clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        };

        const resolveAndCleanIncomeCat = (baseName, insertIdx) => {
            const targetNorm = normCat(baseName);
            const matches = financeData.categories.income.filter(c => normCat(c.name) === targetNorm);
            let survivor = matches.find(c => c.name.trim() === baseName) || matches[0];

            if (!survivor) {
                survivor = { name: baseName, subcategories: [] };
                financeData.categories.income.splice(Math.min(insertIdx, financeData.categories.income.length), 0, survivor);
            }

            let inheritedBudget = financeData.categoryBudgets[survivor.name] || null;
            matches.forEach(dup => {
                if (dup === survivor) return;
                if (!inheritedBudget && financeData.categoryBudgets[dup.name]) {
                    inheritedBudget = financeData.categoryBudgets[dup.name];
                }
                (financeData.transactions || []).forEach(t => {
                    if (t.type === 'income' && t.category === dup.name) t.category = survivor.name;
                });
                delete financeData.categoryBudgets[dup.name];
                const dupIdx = financeData.categories.income.indexOf(dup);
                if (dupIdx !== -1) financeData.categories.income.splice(dupIdx, 1);
            });

            return { catName: survivor.name, prevCfg: inheritedBudget };
        };

        const { catName: salCatName, prevCfg: oldSalCfg } = resolveAndCleanIncomeCat('Salario / Nómina', 0);
        const salaryMonths = (oldSalCfg && oldSalCfg.isMonthly && oldSalCfg.months) ? [...oldSalCfg.months] : Array(12).fill(oldSalCfg ? (oldSalCfg.general || 0) : 0);
        
        for (let m = 0; m < 12; m++) {
            const monthMetrics = calculateLaborMetrics(effectiveVacationConfig, new Date(metrics.currentYear, m, 15));
            if (metrics.currentYear > effYear || (metrics.currentYear === effYear && m > effMonthIdx)) {
                salaryMonths[m] = monthMetrics.net;
            } else if (metrics.currentYear === effYear && m === effMonthIdx) {
                if (effPeriod === '2Q' && sched && sched.oldNet1Q > 0) {
                    salaryMonths[m] = round2(sched.oldNet1Q + monthMetrics.net2Q);
                } else {
                    salaryMonths[m] = monthMetrics.net;
                }
            }
            if (metrics.startObj.getFullYear() === metrics.currentYear && m < metrics.startObj.getMonth()) {
                salaryMonths[m] = 0;
            }
        }

        if (sched && sched.isRetro && sched.retroNetAmount > 0 && sched.retroPayMonth) {
            const [rpy, rpm] = sched.retroPayMonth.split('-').map(Number);
            if (rpy === metrics.currentYear && rpm >= 1 && rpm <= 12) {
                salaryMonths[rpm - 1] = round2(salaryMonths[rpm - 1] + sched.retroNetAmount);
            }
        }

        financeData.categoryBudgets[salCatName] = { isMonthly: true, general: metrics.net, months: salaryMonths };

        const { catName: primaCatName, prevCfg: oldPrimaCfg } = resolveAndCleanIncomeCat('Prima de Servicios', 1);
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

// Aumento de Sueldo con Vigencia y Retroactivo
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

const NON_SALARY_MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const getNonSalaryItemsFromDOM = () => {
    const rows = document.querySelectorAll('#non-salary-items-list .non-salary-item-row');
    const items = [];
    rows.forEach((row, idx) => {
        const name = (row.querySelector('.ns-item-name')?.value || '').trim() || `Concepto ${idx + 1}`;
        const amount = parseCleanCOP(row.querySelector('.ns-item-amount')?.value);
        const month = row.querySelector('.ns-item-month')?.value || 'all';
        const taxable = !!row.querySelector('.ns-item-taxable')?.checked;
        if (amount > 0 || name) {
            items.push({
                id: row.dataset.itemId || `ns_${Date.now()}_${idx}`,
                name,
                amount,
                month,
                taxable
            });
        }
    });
    return items;
};

const summarizeNonSalaryForMonth = (items = [], hasNonSalary = true, refDate = currentDate) => {
    if (!hasNonSalary || !Array.isArray(items)) return { totalMonth: 0, taxableMonth: 0, activeCount: 0 };
    const mIdx = String(refDate.getMonth());
    let totalMonth = 0;
    let taxableMonth = 0;
    let activeCount = 0;
    items.forEach(it => {
        const amt = round2(it.amount || 0);
        if (amt <= 0) return;
        if (it.month === 'all' || String(it.month) === mIdx) {
            totalMonth = round2(totalMonth + amt);
            if (it.taxable !== false) taxableMonth = round2(taxableMonth + amt);
            activeCount++;
        }
    });
    return { totalMonth, taxableMonth, activeCount };
};

const updateNonSalaryMonthSummaryBadge = () => {
    const summaryEl = document.getElementById('non-salary-month-summary');
    if (!summaryEl) return;
    const hasNonSal = !!document.getElementById('profile-has-non-salary')?.checked;
    const items = getNonSalaryItemsFromDOM();
    const { totalMonth, activeCount } = summarizeNonSalaryForMonth(items, hasNonSal, currentDate);
    const monthName = NON_SALARY_MONTH_NAMES[currentDate.getMonth()];
    summaryEl.innerText = `Activos en ${monthName}: ${formatMoney(totalMonth)} (${activeCount} concepto${activeCount !== 1 ? 's' : ''})`;
};

const createNonSalaryItemRowHTML = (item = {}) => {
    const id = item.id || `ns_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const name = item.name || '';
    const amountVal = item.amount > 0 ? formatNumberInput(item.amount) : '';
    const selectedMonth = item.month !== undefined ? String(item.month) : 'all';
    const isTaxable = item.taxable !== false;

    const monthOptions = [
        `<option value="all" ${selectedMonth === 'all' ? 'selected' : ''}>Todos los meses (Fijo)</option>`,
        ...NON_SALARY_MONTH_NAMES.map((mName, idx) => `<option value="${idx}" ${selectedMonth === String(idx) ? 'selected' : ''}>Solo en ${mName}</option>`)
    ].join('');

    return `
        <div class="non-salary-item-row" data-item-id="${id}" style="padding:10px; border-radius:12px; background:var(--card-bg); border:1px solid var(--border-color);">
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:8px;">
                <input type="text" class="ns-item-name" value="${name.replace(/"/g, '&quot;')}" placeholder="Nombre (Ej. Prima extralegal)" style="flex:1.3; min-width:0; padding:7px 9px; font-size:12px;">
                <input type="text" class="ns-item-amount money-input" inputmode="decimal" value="${amountVal}" placeholder="Valor ($)" style="flex:1; min-width:0; padding:7px 9px; font-size:12px; text-align:right;">
                <button type="button" class="btn-remove-ns-item mini-action-btn" style="padding:6px 8px; color:var(--negative); border-color:rgba(239,68,68,0.25); flex-shrink:0;" title="Eliminar concepto">✕</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                <select class="ns-item-month" style="flex:1; min-width:140px; padding:6px 8px; font-size:11.5px;">
                    ${monthOptions}
                </select>
                <label style="display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:var(--text-main); cursor:pointer; user-select:none; padding:4px 8px; border-radius:8px; background:var(--hover-bg);">
                    <input type="checkbox" class="ns-item-taxable" ${isTaxable ? 'checked' : ''} style="width:14px; height:14px; accent-color:var(--accent);">
                    <span>Base Retefuente</span>
                </label>
            </div>
        </div>
    `;
};

const renderNonSalaryItemsUI = (items = [], hasNonSalary = false, refDate = currentDate) => {
    const section = document.getElementById('non-salary-section');
    const list = document.getElementById('non-salary-items-list');
    if (!section || !list) return;

    section.classList.toggle('hidden', !hasNonSalary);
    const itemsToRender = items.length > 0 ? items : [{ id: `ns_${Date.now()}`, name: '', amount: 0, month: 'all', taxable: true }];
    list.innerHTML = itemsToRender.map(it => createNonSalaryItemRowHTML(it)).join('');
    updateNonSalaryMonthSummaryBadge();
};

document.getElementById('profile-has-non-salary')?.addEventListener('change', (e) => {
    const section = document.getElementById('non-salary-section');
    const list = document.getElementById('non-salary-items-list');
    if (e.target.checked) {
        section?.classList.remove('hidden');
        if (list && list.children.length === 0) {
            list.insertAdjacentHTML('beforeend', createNonSalaryItemRowHTML({ name: '', amount: 0, month: 'all', taxable: true }));
        }
    } else {
        section?.classList.add('hidden');
    }
    updateNonSalaryMonthSummaryBadge();
});

document.getElementById('btn-add-non-salary-item')?.addEventListener('click', () => {
    const list = document.getElementById('non-salary-items-list');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', createNonSalaryItemRowHTML({ name: '', amount: 0, month: 'all', taxable: true }));
    updateNonSalaryMonthSummaryBadge();
});

document.getElementById('non-salary-items-list')?.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove-ns-item');
    if (!removeBtn) return;
    const row = removeBtn.closest('.non-salary-item-row');
    const list = document.getElementById('non-salary-items-list');
    if (row && list) {
        row.remove();
        if (list.children.length === 0) {
            const toggle = document.getElementById('profile-has-non-salary');
            if (toggle) toggle.checked = false;
            document.getElementById('non-salary-section')?.classList.add('hidden');
        }
        updateNonSalaryMonthSummaryBadge();
    }
});

document.getElementById('non-salary-items-list')?.addEventListener('input', () => updateNonSalaryMonthSummaryBadge());
document.getElementById('non-salary-items-list')?.addEventListener('change', () => updateNonSalaryMonthSummaryBadge());

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
            oldBasic, newBasic, diff, pct,
            effectiveMonth: raiseSchedule?.effectiveMonth || getMonthId(currentDate),
            effectivePeriod: raiseSchedule?.effectivePeriod || 'M',
            isRetro: !!raiseSchedule?.isRetro,
            retroFromMonth: raiseSchedule?.retroFromMonth || '',
            retroFromPeriod: raiseSchedule?.retroFromPeriod || 'M',
            retroPayMonth: raiseSchedule?.retroPayMonth || '',
            retroNetAmount: raiseSchedule?.retroNetAmount || 0
        };
    }

    const hasNonSalary = !!document.getElementById('profile-has-non-salary')?.checked;
    const nonSalaryItems = hasNonSalary ? getNonSalaryItemsFromDOM() : [];
    const { totalMonth: activeNonSalaryTotal } = summarizeNonSalaryForMonth(nonSalaryItems, hasNonSalary, currentDate);

    return {
        basicSalary: newBasic,
        hasNonSalary,
        nonSalaryItems,
        nonSalary: activeNonSalaryTotal,
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
        lastRaise, raiseSchedule
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
        effectiveMonth: sim.effMonth, effectivePeriod: sim.effPeriod,
        oldNet: sim.currentMetrics.net, oldNet1Q: sim.currentMetrics.net1Q, oldNet2Q: sim.currentMetrics.net2Q,
        isRetro: sim.isRetro, retroFromMonth: sim.retroFromMonth, retroFromPeriod: sim.retroFromPeriod,
        retroPayMonth: sim.retroPayMonth, retroPayPeriod: sim.retroPayPeriod, retroNetAmount: sim.retroNetAmount
    };

    document.getElementById('profile-basic-salary').value = formatNumberInput(newBasic);
    const syncCheck = document.getElementById('profile-sync-budget');
    if (syncCheck) syncCheck.checked = true;

    const config = buildSalaryConfigFromForm({ ...prevConfig, basicSalary: sim.currentBasic }, raiseSchedule);
    localStorage.setItem('myFinancesSalary', JSON.stringify(config));

    const createRetroTx = !!document.getElementById('raise-retro-create-tx')?.checked;
    let retroTxCreated = false;
    if (sim.isRetro && sim.retroNetAmount > 0 && createRetroTx) {
        const existingSal = financeData.categories.income.find(c => normalizeCategoryName(stripLeadingEmoji(c.name)) === normalizeCategoryName('Salario / Nómina'));
        const salCatName = existingSal ? existingSal.name : 'Salario / Nómina';
        if (!existingSal) {
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

const switchSalaryTab = (tabName) => {
    ['monthly', 'annual', 'liquidation'].forEach(t => {
        const btn = document.getElementById(`tab-btn-salary-${t}`), panel = document.getElementById(`salary-tab-${t}`);
        if (t === tabName) { btn?.classList.add('active'); panel?.classList.remove('hidden'); }
        else { btn?.classList.remove('active'); panel?.classList.add('hidden'); }
    });
};
document.getElementById('tab-btn-salary-monthly')?.addEventListener('click', () => switchSalaryTab('monthly'));
document.getElementById('tab-btn-salary-annual')?.addEventListener('click', () => switchSalaryTab('annual'));
document.getElementById('tab-btn-salary-liquidation')?.addEventListener('click', () => switchSalaryTab('liquidation'));

// ==========================================
// MÓDULO 10: MODO VIAJE (SUB-PRESUPUESTO AISLADO)
// ==========================================
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

window.setTripModalStep = (step) => {
    const onboardView = document.getElementById('trip-onboarding-view');
    const formView = document.getElementById('trip-mode-form');
    const guideBtn = document.getElementById('btn-show-trip-guide');
    if (!onboardView || !formView) return;
    if (step === 'guide') {
        onboardView.classList.remove('hidden');
        formView.classList.add('hidden');
        if (guideBtn) guideBtn.classList.add('hidden');
    } else {
        onboardView.classList.add('hidden');
        formView.classList.remove('hidden');
        if (guideBtn) guideBtn.classList.remove('hidden');
    }
};

window.renderTripModeUI = () => {
    const allTripModals = document.querySelectorAll('#trip-mode-modal');
    if (allTripModals.length > 1) {
        for (let i = 1; i < allTripModals.length; i++) allTripModals[i].remove();
    }

    const trip = financeData.tripMode || { active: false, name: '', budget: 0, isolateBudget: true, linkedPocketId: null, isShared: false, companionName: '' };
    window.setTripModalStep(trip.active ? 'form' : 'guide');

    const activeEl = document.getElementById('trip-active-check');
    const nameEl = document.getElementById('trip-name-input');
    const budgetEl = document.getElementById('trip-budget-input');
    const isolateEl = document.getElementById('trip-isolate-check');
    const statsBox = document.getElementById('trip-modal-stats-box');

    const linkCheck = document.getElementById('trip-pocket-link-check');
    const linkBox = document.getElementById('trip-pocket-select-box');
    const pocketSelect = document.getElementById('trip-pocket-select');

    const sharedCheck = document.getElementById('trip-shared-check');
    const sharedFields = document.getElementById('trip-shared-fields');
    const companionInput = document.getElementById('trip-companion-input');
    const sharedBalanceBox = document.getElementById('trip-modal-shared-balance-box');

    if (activeEl) activeEl.checked = !!trip.active;
    if (nameEl) nameEl.value = trip.active ? (trip.name || '') : '';
    if (budgetEl) budgetEl.value = (trip.active && trip.budget > 0) ? formatNumberInput(trip.budget) : '';
    if (isolateEl) isolateEl.checked = trip.isolateBudget !== false;

    if (sharedCheck) sharedCheck.checked = !!(trip.active && trip.isShared);
    if (companionInput) companionInput.value = trip.active ? (trip.companionName || '') : '';
    if (sharedFields) sharedFields.classList.toggle('hidden', !(trip.active && trip.isShared));

    if (linkCheck && linkBox && pocketSelect) {
        linkCheck.checked = !!(trip.active && trip.linkedPocketId);
        linkBox.classList.toggle('hidden', !linkCheck.checked);

        const getMetrics = typeof computePocketMetrics === 'function'
            ? computePocketMetrics
            : (p) => ({ balance: Number(p.saved || p.balance || 0) });
        const cleanName = typeof stripLeadingEmoji === 'function'
            ? stripLeadingEmoji
            : (s) => String(s || '');
        const fmtAmount = typeof formatCompact === 'function'
            ? formatCompact
            : formatMoney;

        let html = `<option value="">Selecciona un bolsillo...</option>`;
        if (Array.isArray(financeData.pockets) && financeData.pockets.length > 0) {
            financeData.pockets.forEach(p => {
                const m = getMetrics(p);
                html += `<option value="${p.id}" ${String(trip.linkedPocketId) === String(p.id) ? 'selected' : ''}>• ${cleanName(p.name)} (${fmtAmount(m.balance)} disp.)</option>`;
            });
        } else {
            html += `<option value="" disabled>No tienes bolsillos creados</option>`;
        }
        pocketSelect.innerHTML = html;

        pocketSelect.onchange = (e) => {
            const selectedId = e.target.value;
            if (selectedId && Array.isArray(financeData.pockets)) {
                const p = financeData.pockets.find(x => String(x.id) === String(selectedId));
                if (p && budgetEl) {
                    const m = getMetrics(p);
                    budgetEl.value = m.balance > 0 ? formatNumberInput(m.balance) : '';
                }
            }
        };

        linkCheck.onchange = (e) => {
            linkBox.classList.toggle('hidden', !e.target.checked);
            if (!e.target.checked) pocketSelect.value = '';
        };
    }

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

    if (sharedBalanceBox) {
        if (trip.active && trip.isShared && trip.name) {
            const slug = trip.tag || getTripTagSlug(trip.name);
            let myShare = 0, compShare = 0;
            financeData.transactions.forEach(t => {
                if (!t.isDeleted && t.type === 'expense' && !t.isAdjustment && t.isSharedTrip) {
                    const belongs = (Array.isArray(t.tags) && t.tags.includes(slug)) || t.tripName === trip.name;
                    if (belongs) {
                        const amt = round2(t.status === 'pending' ? (t.budgetedAmount || t.amount) : t.amount);
                        if (t.paidBy === 'companion') compShare = round2(compShare + amt);
                        else myShare = round2(myShare + amt);
                    }
                }
            });

            const total = round2(myShare + compShare);
            const half = round2(total / 2);
            const compLabel = trip.companionName || 'Acompañante';

            let msg = `<span style="color:var(--text-muted);">Están a paz y salvo (cuota c/u: ${formatMoney(half)})</span>`;
            if (myShare > half) {
                msg = `<span class="positive"><b>${compLabel}</b> te debe <b>${formatMoney(round2(myShare - half))}</b></span>`;
            } else if (compShare > half) {
                msg = `<span class="negative">Le debes <b>${formatMoney(round2(compShare - half))}</b> a <b>${compLabel}</b></span>`;
            }

            sharedBalanceBox.classList.remove('hidden');
            sharedBalanceBox.innerHTML = `
                <div style="font-size:11px; font-weight:800; color:var(--accent); margin-bottom:6px; text-transform:uppercase;">Liquidación 50/50 en curso</div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span>Tú has pagado:</span> <strong>${formatMoney(myShare)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:8px;">
                    <span>${compLabel} ha pagado:</span> <strong>${formatMoney(compShare)}</strong>
                </div>
                <div style="font-size:12.5px; padding-top:8px; border-top:1px dashed var(--accent); text-align:center;">
                    ${total > 0 ? msg : '<span style="color:var(--text-muted);">Sin gastos compartidos registrados aún.</span>'}
                </div>
            `;
        } else {
            sharedBalanceBox.classList.add('hidden');
            sharedBalanceBox.innerHTML = '';
        }
    }
};

document.getElementById('trip-shared-check')?.addEventListener('change', (e) => {
    document.getElementById('trip-shared-fields')?.classList.toggle('hidden', !e.target.checked);
    if (e.target.checked) setTimeout(() => document.getElementById('trip-companion-input')?.focus(), 60);
});

// Eventos de navegación entre guía y formulario
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-continue-trip-setup')) {
        window.setTripModalStep('form');
        const activeCheck = document.getElementById('trip-active-check');
        const nameEl = document.getElementById('trip-name-input');
        const budgetEl = document.getElementById('trip-budget-input');
        const isolateEl = document.getElementById('trip-isolate-check');
        const linkCheck = document.getElementById('trip-pocket-link-check');
        const linkBox = document.getElementById('trip-pocket-select-box');
        const sharedCheck = document.getElementById('trip-shared-check');
        const sharedFields = document.getElementById('trip-shared-fields');
        const companionInput = document.getElementById('trip-companion-input');
        const statsBox = document.getElementById('trip-modal-stats-box');
        const sharedBalanceBox = document.getElementById('trip-modal-shared-balance-box');

        if (activeCheck) activeCheck.checked = true;
        if (nameEl) nameEl.value = '';
        if (budgetEl) budgetEl.value = '';
        if (isolateEl) isolateEl.checked = true;
        if (linkCheck) linkCheck.checked = false;
        if (linkBox) linkBox.classList.add('hidden');
        if (sharedCheck) sharedCheck.checked = false;
        if (sharedFields) sharedFields.classList.add('hidden');
        if (companionInput) companionInput.value = '';
        if (statsBox) { statsBox.classList.add('hidden'); statsBox.innerHTML = ''; }
        if (sharedBalanceBox) { sharedBalanceBox.classList.add('hidden'); sharedBalanceBox.innerHTML = ''; }
        setTimeout(() => nameEl?.focus(), 80);
    } else if (e.target.closest('#btn-show-trip-guide')) {
        window.setTripModalStep('guide');
    }
});

// Guardar configuración del Modo Viaje (Activación y Desactivación única)
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'trip-mode-form') {
        e.preventDefault();
        e.stopImmediatePropagation();

        const prevTrip = financeData.tripMode ? { ...financeData.tripMode } : { active: false };

        const isActive = !!document.getElementById('trip-active-check')?.checked;
        const name = document.getElementById('trip-name-input')?.value.trim() || '';
        const budget = parseMoneyInput(document.getElementById('trip-budget-input')?.value);
        const isolateBudget = !!document.getElementById('trip-isolate-check')?.checked;

        const linkCheck = !!document.getElementById('trip-pocket-link-check')?.checked;
        const pocketSelect = document.getElementById('trip-pocket-select');
        const linkedPocketId = (isActive && linkCheck && pocketSelect) ? pocketSelect.value : null;

        const isShared = !!(isActive && document.getElementById('trip-shared-check')?.checked);
        const rawCompanion = document.getElementById('trip-companion-input')?.value.trim() || '';
        const companionName = isShared ? rawCompanion : '';

        if (isActive && !name) {
            alert('Debes escribir un destino o nombre para el viaje.');
            return;
        }
        if (isActive && linkCheck && !linkedPocketId) {
            alert('Activaste la opción de vincular a un bolsillo, pero no has seleccionado ninguno.');
            return;
        }
        if (isActive && isShared && !rawCompanion) {
            alert('Escribe el nombre de tu acompañante para activar la división 50/50.');
            return;
        }

        financeData.tripMode = isActive
            ? { active: true, name, tag: getTripTagSlug(name), budget, isolateBudget, linkedPocketId, isShared, companionName }
            : { active: false, name: '', tag: '', budget: 0, isolateBudget: true, linkedPocketId: null, isShared: false, companionName: '' };

        localStorage.setItem('myFinances', JSON.stringify(financeData));
        hasUnsavedChanges = false;

        try {
            document.getElementById('trip-mode-modal')?.classList.add('hidden');
            if (typeof forceCloseAllModals === 'function') forceCloseAllModals();
            if (typeof applyThemeUI === 'function') applyThemeUI();
            if (typeof renderTripModeBanner === 'function') renderTripModeBanner();
            if (typeof updateDashboard === 'function') updateDashboard();
        } catch (err) {
            console.error('Error actualizando UI de viaje:', err);
        }

        const scrollToTop = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            document.querySelectorAll('.app-container, main').forEach(el => { el.scrollTop = 0; });
        };
        scrollToTop();
        setTimeout(scrollToTop, 60);

        // Modal motivacional propio al activar viaje compartido
        if (isActive && isShared && (!prevTrip.active || !prevTrip.isShared)) {
            setTimeout(() => {
                let welcomeModal = document.getElementById('trip-shared-welcome-modal');
                if (!welcomeModal) {
                    welcomeModal = document.createElement('div');
                    welcomeModal.id = 'trip-shared-welcome-modal';
                    welcomeModal.className = 'modal hidden';
                    welcomeModal.style.cssText = 'z-index: 1388 !important; align-items: center !important; justify-content: center !important; padding: 16px !important;';
                    welcomeModal.innerHTML = `
                        <div class="modal-content" style="width: 100% !important; max-width: 390px !important; margin: auto !important; border-radius: 26px !important; padding: 26px 20px 20px 20px !important; text-align: center !important; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22) !important;">
                            <div style="width:58px; height:58px; border-radius:18px; background:color-mix(in srgb, var(--accent) 14%, transparent); color:var(--accent); display:flex; align-items:center; justify-content:center; margin:0 auto 14px auto;">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
                            </div>
                            <span style="display:inline-block; font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.6px; color:var(--accent); background:color-mix(in srgb, var(--accent) 12%, transparent); padding:4px 10px; border-radius:99px; margin-bottom:8px;">Viaje Compartido 50/50</span>
                            <h3 style="margin:0 0 8px 0; font-size:20px; font-weight:800; color:var(--text-main);">¡Ponte la camiseta!</h3>
                            <p id="trip-shared-welcome-desc" style="margin:0 0 14px 0; font-size:13px; color:var(--text-muted); line-height:1.5;"></p>
                            <div style="background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:14px; padding:11px 12px; margin-bottom:16px; display:flex; align-items:center; gap:9px; text-align:left;">
                                <span style="width:28px; height:28px; border-radius:9px; background:rgba(16,185,129,0.14); color:var(--positive); display:flex; align-items:center; justify-content:center; flex-shrink:0;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                                <small style="font-size:11.5px; color:var(--text-main); line-height:1.35;">En cada gasto podrás elegir con un toque si lo pagaste tú o tu acompañante.</small>
                            </div>
                            <button type="button" id="btn-close-trip-shared-welcome" class="btn btn-primary" style="width:100%; padding:13px 16px; font-size:14px; font-weight:700; border-radius:14px;">¡Listo, a disfrutar!</button>
                        </div>`;
                    document.body.appendChild(welcomeModal);
                }
                document.getElementById('trip-shared-welcome-desc').innerHTML = `Disfruta tu viaje a <b>${name}</b> al máximo, pero sé disciplinado y registra todos los gastos compartidos con <b>${companionName}</b> para cruzar cuentas al final.`;
                document.getElementById('btn-close-trip-shared-welcome').onclick = () => welcomeModal.classList.add('hidden');
                welcomeModal.classList.remove('hidden');
            }, 180);
        }

        // SOLO al desactivar un viaje que estaba activo
        if (prevTrip.active && !isActive) {
            const checkAndOpenLeftover = () => {
                if (!prevTrip.linkedPocketId) return;
                const pocket = (financeData.pockets || []).find(p => String(p.id) === String(prevTrip.linkedPocketId));
                if (!pocket) return;
                const metrics = typeof computePocketMetrics === 'function'
                    ? computePocketMetrics(pocket)
                    : { balance: Number(pocket.saved || pocket.balance || 0) };

                if (metrics.balance > 0) {
                    setTimeout(() => window.openTripLeftoverModal(pocket, metrics.balance, prevTrip.name), 300);
                }
            };

            if (prevTrip.isShared) {
                const prevSlug = prevTrip.tag || getTripTagSlug(prevTrip.name);
                const compLabel = prevTrip.companionName || 'Acompañante';
                let myShare = 0, compShare = 0;

                financeData.transactions.forEach(t => {
                    if (!t.isDeleted && t.type === 'expense' && !t.isAdjustment && t.isSharedTrip) {
                        const belongs = (Array.isArray(t.tags) && t.tags.includes(prevSlug)) || t.tripName === prevTrip.name;
                        if (belongs) {
                            const amt = round2(t.status === 'pending' ? (t.budgetedAmount || t.amount) : t.amount);
                            if (t.paidBy === 'companion') compShare = round2(compShare + amt);
                            else myShare = round2(myShare + amt);
                        }
                    }
                });

                const totalShared = round2(myShare + compShare);
                if (totalShared > 0) {
                    setTimeout(() => {
                        window.openTripSettlementModal({
                            tripName: prevTrip.name,
                            companionName: compLabel,
                            myShare,
                            compShare,
                            onComplete: checkAndOpenLeftover
                        });
                    }, 300);
                } else {
                    checkAndOpenLeftover();
                }
            } else {
                checkAndOpenLeftover();
            }
        }
    }
}, true);

window.openTripSettlementModal = ({ tripName, companionName, myShare, compShare, onComplete }) => {
    let modal = document.getElementById('trip-settlement-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'trip-settlement-modal';
        modal.className = 'modal hidden';
        modal.setAttribute('role', 'dialog');
        modal.style.cssText = 'z-index: 1385 !important; align-items: center !important; justify-content: center !important; padding: 16px !important;';
        modal.innerHTML = `
            <div class="modal-content" style="width: 100% !important; max-width: 400px !important; margin: auto !important; border-radius: 26px !important; padding: 24px 20px 20px 20px !important; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22) !important;">
                <div style="text-align:center; margin-bottom:16px;">
                    <div style="width:52px; height:52px; border-radius:16px; background:rgba(14,165,233,0.14); color:#0ea5e9; display:flex; align-items:center; justify-content:center; margin:0 auto 12px auto;">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <h3 style="margin:0 0 4px 0; font-size:19px; font-weight:800; color:var(--text-main); letter-spacing:-0.2px;">Liquidación 50/50</h3>
                    <p id="trip-settlement-subtitle" style="margin:0; font-size:12.5px; color:var(--text-muted);"></p>
                </div>
                <div id="trip-settlement-breakdown" style="background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:16px; padding:14px; margin-bottom:14px; font-size:12.5px;"></div>
                <div id="trip-settlement-verdict" style="border-radius:14px; padding:12px 14px; margin-bottom:14px; text-align:center; font-size:13.5px; font-weight:800;"></div>
                <button type="button" id="btn-trip-settlement-confirm" class="btn btn-primary" style="width:100%; padding:13px 16px; font-size:13.5px; font-weight:700; border-radius:13px; margin-bottom:10px;">Crear cuenta por cobrar</button>
                <button type="button" id="btn-trip-settlement-absorb" class="btn" style="width:100%; padding:12px 16px; font-size:13px; font-weight:700; border-radius:13px; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color);">No cobrar (Asumir como gasto propio)</button>
                <small id="trip-settlement-note" style="display:block; margin-top:10px; font-size:11px; color:var(--text-muted); line-height:1.4; text-align:center;"></small>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const subEl = document.getElementById('trip-settlement-subtitle');
    const breakdownEl = document.getElementById('trip-settlement-breakdown');
    const verdictEl = document.getElementById('trip-settlement-verdict');
    const confirmBtn = document.getElementById('btn-trip-settlement-confirm');
    const absorbBtn = document.getElementById('btn-trip-settlement-absorb');
    const noteEl = document.getElementById('trip-settlement-note');

    const totalShared = round2(myShare + compShare);
    const half = round2(totalShared / 2);

    if (subEl) subEl.textContent = `Cruce de gastos de ${tripName} con ${companionName}`;

    breakdownEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span style="color:var(--text-muted);">Total compartidos:</span>
            <strong>${formatMoney(totalShared)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding-bottom:8px; margin-bottom:8px; border-bottom:1px dashed var(--border-color);">
            <span style="color:var(--text-muted);">Cuota justa (50%):</span>
            <strong>${formatMoney(half)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:var(--text-muted);">Tú pagaste:</span>
            <strong>${formatMoney(myShare)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted);">${companionName} pagó:</span>
            <strong>${formatMoney(compShare)}</strong>
        </div>
    `;

    const finishFlow = () => {
        modal.classList.add('hidden');
        if (typeof onComplete === 'function') onComplete();
    };

    if (myShare > half) {
        const oweMe = round2(myShare - half);
        verdictEl.style.background = 'rgba(16, 185, 129, 0.12)';
        verdictEl.style.color = 'var(--positive)';
        verdictEl.innerHTML = `${companionName} te debe ${formatMoney(oweMe)}`;

        confirmBtn.classList.remove('hidden');
        confirmBtn.style.backgroundColor = 'var(--positive)';
        confirmBtn.style.borderColor = 'var(--positive)';
        confirmBtn.textContent = `Crear cuenta por cobrar (+${formatCompact(oweMe)})`;

        absorbBtn.textContent = 'No cobrar (Asumir como gasto propio)';
        if (noteEl) noteEl.innerHTML = `Si eliges <b>No cobrar</b>, no se crea deuda en "Me debe" y los <b>${formatMoney(myShare)}</b> que pagaste quedan como tu gasto real del viaje.`;

        confirmBtn.onclick = () => {
            const accId = 'CxC_' + companionName.replace(/\s+/g, '_');
            if (!financeData.customAccounts.some(a => a.id === accId)) {
                financeData.customAccounts.push({ id: accId, name: `Me debe: ${companionName}`, category: 'asset', isDefault: false, showWhenZero: true });
            }
            financeData.transactions.push({
                id: Date.now(), monthId: getMonthId(new Date()), type: 'income', status: 'closed',
                account: accId, description: `Sobrante 50/50 viaje ${tripName}`, amount: oweMe,
                date: `${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, 12:00`, isAdjustment: true
            });
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            if (typeof updateDashboard === 'function') updateDashboard();
            finishFlow();
        };

        absorbBtn.onclick = () => finishFlow();

    } else if (compShare > half) {
        const iOwe = round2(compShare - half);
        verdictEl.style.background = 'rgba(239, 68, 68, 0.12)';
        verdictEl.style.color = 'var(--negative)';
        verdictEl.innerHTML = `Le debes ${formatMoney(iOwe)} a ${companionName}`;

        confirmBtn.classList.remove('hidden');
        confirmBtn.style.backgroundColor = 'var(--negative)';
        confirmBtn.style.borderColor = 'var(--negative)';
        confirmBtn.textContent = `Registrar deuda por pagar (${formatCompact(iOwe)})`;

        absorbBtn.textContent = 'Ya lo saldé / No registrar deuda';
        if (noteEl) noteEl.innerHTML = `Si registras la deuda, se creará un compromiso pendiente por <b>${formatMoney(iOwe)}</b> a nombre de <b>${companionName}</b>.`;

        confirmBtn.onclick = () => {
            const debtId = 'Deuda_' + Date.now();
            financeData.customAccounts.push({
                id: debtId, name: companionName, category: 'debt', debtType: 'fixed', isDefault: false, showWhenZero: false,
                hasCreditLimit: false, creditLimit: 0, debtOriginal: iOwe, debtTotalQuotes: 1, debtPaidQuotes: 0,
                debtRate: 0, debtRateType: 'monthly', debtMonthlyPayment: iOwe, payrollDeduction: false
            });
            financeData.transactions.push({
                id: Date.now(), monthId: getMonthId(new Date()), type: 'expense', status: 'closed',
                account: debtId, category: '📦 Otros Gastos', subcategory: 'General',
                description: `Saldo 50/50 viaje ${tripName}`, amount: iOwe,
                date: `${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, 12:00`, isAdjustment: false
            });
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            if (typeof updateDashboard === 'function') updateDashboard();
            finishFlow();
        };

        absorbBtn.onclick = () => finishFlow();
    } else {
        verdictEl.style.background = 'rgba(16, 185, 129, 0.12)';
        verdictEl.style.color = 'var(--positive)';
        verdictEl.innerHTML = `¡Están a paz y salvo! Cada uno pagó su mitad`;

        confirmBtn.classList.add('hidden');
        absorbBtn.textContent = 'Continuar';
        if (noteEl) noteEl.textContent = 'No hay saldos pendientes por cruzar entre ustedes.';
        absorbBtn.onclick = () => finishFlow();
    }

    modal.classList.remove('hidden');
};

window.openTripLeftoverModal = (pocket, remainingBalance, tripName) => {
    let modal = document.getElementById('trip-leftover-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'trip-leftover-modal';
        modal.className = 'modal hidden';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.style.cssText = 'z-index: 1390 !important; align-items: center !important; justify-content: center !important; padding: 16px !important;';
        modal.innerHTML = `
            <div class="modal-content" style="width: 100% !important; max-width: 400px !important; height: auto !important; min-height: 0 !important; margin: auto !important; border-radius: 26px !important; display: block !important; padding: 24px 20px 20px 20px !important; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22) !important;">
                <div style="text-align:center; margin-bottom:18px;">
                    <div style="width:52px; height:52px; border-radius:16px; background:rgba(16,185,129,0.14); color:var(--positive); display:flex; align-items:center; justify-content:center; margin:0 auto 12px auto;">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></svg>
                    </div>
                    <h3 style="margin:0 0 6px 0; font-size:19px; font-weight:800; color:var(--text-main); letter-spacing:-0.2px;">¡Te sobró dinero del viaje!</h3>
                    <p id="trip-leftover-desc" style="margin:0; font-size:13px; color:var(--text-muted); line-height:1.45;"></p>
                </div>
                <div style="background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:12px;">
                    <label style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-muted); margin-bottom:8px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        Destino del saldo sobrante
                    </label>
                    <select id="trip-leftover-account-select" style="width:100%; min-height:46px; padding:12px 38px 12px 14px; font-size:13.5px; font-weight:700; color:var(--text-main); background-color:var(--card-bg); border:1.5px solid var(--border-color); border-radius:12px; margin-bottom:12px; appearance:none; -webkit-appearance:none; background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238e8e93%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E'); background-repeat:no-repeat; background-position:right 13px center; background-size:16px; box-shadow:0 2px 6px rgba(0,0,0,0.03);">
                        <option value="">Selecciona cuenta o bolsillo destino...</option>
                    </select>
                    <button type="button" id="btn-trip-leftover-transfer" class="btn btn-primary" style="width:100%; padding:13px 16px; font-size:13.5px; font-weight:700; border-radius:13px; display:flex; align-items:center; justify-content:center; gap:6px;">
                        Transferir saldo →
                    </button>
                </div>
                <button type="button" id="btn-trip-leftover-keep" class="btn" style="width:100%; padding:12px 16px; font-size:13px; font-weight:700; border-radius:13px; background:var(--card-bg); color:var(--text-muted); border:1px solid var(--border-color);">
                    Conservar en el bolsillo
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const descEl = document.getElementById('trip-leftover-desc');
    const accSelect = document.getElementById('trip-leftover-account-select');
    const transferBtn = document.getElementById('btn-trip-leftover-transfer');
    const keepBtn = document.getElementById('btn-trip-leftover-keep');
    if (!descEl || !accSelect || !transferBtn || !keepBtn) return;

    const cleanPocketName = typeof stripLeadingEmoji === 'function' ? stripLeadingEmoji(pocket.name) : pocket.name;
    descEl.innerHTML = `En tu bolsillo <b>${cleanPocketName}</b> quedaron <strong class="positive">${formatMoney(remainingBalance)}</strong> sin usar. ¿Qué deseas hacer con este saldo?`;

    const cleanText = (s) => typeof stripLeadingEmoji === 'function' ? stripLeadingEmoji(String(s || '')) : String(s || '');
    const getMetrics = typeof computePocketMetrics === 'function'
        ? computePocketMetrics
        : (p) => ({ balance: Number(p.saved || p.balance || 0) });

    const accountItems = [];
    const seenIds = new Set();

    if (Array.isArray(financeData.customAccounts)) {
        financeData.customAccounts.forEach(acc => {
            if (!acc || acc.isDeleted || acc.category !== 'asset' || String(acc.id).startsWith('CxC_')) return;
            if (!seenIds.has(String(acc.id))) {
                seenIds.add(String(acc.id));
                accountItems.push({ id: acc.id, name: cleanText(acc.name) });
            }
        });
    }

    const otherPockets = (financeData.pockets || []).filter(p => !p.isDeleted && String(p.id) !== String(pocket.id));

    let optionsHtml = `<option value="">Selecciona cuenta o bolsillo destino...</option>`;
    if (accountItems.length > 0) {
        optionsHtml += `<optgroup label="Mis Cuentas">`;
        accountItems.forEach(acc => {
            optionsHtml += `<option value="${acc.id}">${acc.name}</option>`;
        });
        optionsHtml += `</optgroup>`;
    }
    if (otherPockets.length > 0) {
        optionsHtml += `<optgroup label="Otros Bolsillos de Ahorro">`;
        otherPockets.forEach(p => {
            const m = getMetrics(p);
            optionsHtml += `<option value="${p.id}">• ${cleanText(p.name)} (${formatMoney(m.balance)})</option>`;
        });
        optionsHtml += `</optgroup>`;
    }
    accSelect.innerHTML = optionsHtml;

    keepBtn.onclick = () => {
        modal.classList.add('hidden');
    };

    transferBtn.onclick = () => {
        const targetAccId = accSelect.value;
        if (!targetAccId) {
            alert('Por favor selecciona una cuenta o bolsillo destino para transferir el saldo.');
            return;
        }

        const todayStr = new Date().toLocaleDateString('en-CA');
        const newTx = {
            id: Date.now(),
            monthId: getMonthId(new Date()),
            type: 'transfer',
            status: 'closed',
            account: pocket.id,
            toAccount: targetAccId,
            amount: round2(remainingBalance),
            description: `Sobrante viaje ${tripName || ''} (${cleanPocketName})`.trim(),
            date: todayStr,
            category: 'Transferencia',
            tags: [],
            isDeleted: false
        };

        if (typeof adjustPocketBalance === 'function') adjustPocketBalance(pocket.id, -round2(remainingBalance));
        const targetPocket = (financeData.pockets || []).find(p => String(p.id) === String(targetAccId));
        if (targetPocket && typeof adjustPocketBalance === 'function') adjustPocketBalance(targetPocket.id, round2(remainingBalance));

        financeData.transactions.push(newTx);
        localStorage.setItem('myFinances', JSON.stringify(financeData));

        modal.classList.add('hidden');
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof renderPocketsView === 'function') renderPocketsView();
    };

    modal.classList.remove('hidden');
};
let tripUserOverrodeAccount = false;

const syncSharedTripPayerUI = () => {
    const tripTxModalEl = document.getElementById('transaction-modal');
    if (!tripTxModalEl) return;

    const trip = financeData.tripMode;
    const txType = (document.getElementById('type')?.value || document.getElementById('trans-type')?.value || 'expense').toLowerCase();
    const isExpense = txType === 'expense' || txType === 'gasto';
    let sharedBox = document.getElementById('tx-shared-trip-controls');

    if (!trip || !trip.active || !trip.isShared || !isExpense) {
        if (sharedBox) sharedBox.classList.add('hidden');
        const accSelect = document.getElementById('account') || document.getElementById('trans-account');
        if (accSelect) {
            accSelect.querySelector('option[value="CxC_Gastos_Acompanante"]')?.remove();
            accSelect.style.opacity = '1';
            accSelect.style.pointerEvents = 'auto';
        }
        return;
    }

    if (!sharedBox) {
        sharedBox = document.createElement('div');
        sharedBox.id = 'tx-shared-trip-controls';
        sharedBox.className = 'form-group';
        sharedBox.style.cssText = 'background:rgba(14, 165, 233, 0.08); border:1px dashed var(--accent); padding:10px 12px; border-radius:12px; margin-bottom:12px;';
        const typeRow = document.getElementById('tx-type-segmented')?.closest('.form-row');
        if (typeRow) typeRow.insertAdjacentElement('afterend', sharedBox);
    }

    const compName = trip.companionName || 'Acompañante';
    if (sharedBox.dataset.companion !== compName) {
        sharedBox.dataset.companion = compName;
        sharedBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <label style="margin:0; font-size:11px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                    <span style="color:var(--accent); display:inline-flex;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                    Gasto Compartido (50/50)
                </label>
                <label class="switch" style="transform:scale(0.8); transform-origin:right center; margin:0;"><input type="checkbox" id="tx-is-shared-check" checked><span class="slider"></span></label>
            </div>
            <div id="tx-paid-by-group" style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                <button type="button" class="btn btn-secondary active" data-payer="me" style="padding:7px 6px; font-size:11.5px; font-weight:700;">Lo pagué yo</button>
                <button type="button" class="btn btn-secondary" data-payer="companion" style="padding:7px 6px; font-size:11.5px; font-weight:700; color:var(--text-muted);">Pagó ${compName}</button>
            </div>
            <input type="hidden" id="tx-hidden-payer" value="me">
        `;

        const applyPayerAccountState = () => {
            const isSharedOn = !!document.getElementById('tx-is-shared-check')?.checked;
            const payerVal = document.getElementById('tx-hidden-payer')?.value || 'me';
            const accSelect = document.getElementById('account') || document.getElementById('trans-account');
            if (!accSelect) return;

            if (isSharedOn && payerVal === 'companion') {
                let compOpt = accSelect.querySelector('option[value="CxC_Gastos_Acompanante"]');
                if (!compOpt) {
                    compOpt = document.createElement('option');
                    compOpt.value = 'CxC_Gastos_Acompanante';
                    compOpt.textContent = `Pagó ${compName} (No descuenta saldo)`;
                    accSelect.insertBefore(compOpt, accSelect.firstChild);
                }
                accSelect.value = 'CxC_Gastos_Acompanante';
                accSelect.style.opacity = '0.72';
                accSelect.style.pointerEvents = 'none';
            } else {
                accSelect.querySelector('option[value="CxC_Gastos_Acompanante"]')?.remove();
                accSelect.style.opacity = '1';
                accSelect.style.pointerEvents = 'auto';
                tripUserOverrodeAccount = false;
                applyTripTxDefaults(true);
            }
        };

        sharedBox.querySelector('#tx-is-shared-check')?.addEventListener('change', (e) => {
            const grp = document.getElementById('tx-paid-by-group');
            if (grp) {
                grp.style.opacity = e.target.checked ? '1' : '0.4';
                grp.style.pointerEvents = e.target.checked ? 'auto' : 'none';
            }
            applyPayerAccountState();
        });

        sharedBox.querySelectorAll('#tx-paid-by-group button').forEach(btn => {
            btn.addEventListener('click', () => {
                sharedBox.querySelectorAll('#tx-paid-by-group button').forEach(b => {
                    b.classList.remove('active');
                    b.style.color = 'var(--text-muted)';
                });
                btn.classList.add('active');
                btn.style.color = 'var(--accent)';
                const hiddenPayer = document.getElementById('tx-hidden-payer');
                if (hiddenPayer) hiddenPayer.value = btn.getAttribute('data-payer') || 'me';
                applyPayerAccountState();
            });
        });
    }

    sharedBox.classList.remove('hidden');
};

const applyTripTxDefaults = (force = false) => {
    const tripTxModalEl = document.getElementById('transaction-modal');
    if (!tripTxModalEl || tripTxModalEl.classList.contains('hidden')) return;

    const editId = document.getElementById('edit-id')?.value;
    const trip = financeData.tripMode;
    if (editId || !trip || !trip.active || !trip.name) {
        syncSharedTripPayerUI();
        return;
    }

    // 1. Etiqueta automática del viaje (#destino)
    const tagsInput = document.getElementById('trans-tags');
    const slug = trip.tag || getTripTagSlug(trip.name);
    if (tagsInput && !tagsInput.value.includes(`#${slug}`)) {
        tagsInput.value = `${tagsInput.value} #${slug}`.trim();
        if (typeof renderTxModalTagSuggestions === 'function') renderTxModalTagSuggestions();
    }

    syncSharedTripPayerUI();

    // Si está seleccionado "Pagó el acompañante", no sobreescribir con el bolsillo
    const isSharedOn = !!document.getElementById('tx-is-shared-check')?.checked;
    const payerVal = document.getElementById('tx-hidden-payer')?.value || 'me';
    if (trip.isShared && isSharedOn && payerVal === 'companion') return;

    // 2. Cuenta predeterminada = Bolsillo vinculado (solo al crear un gasto nuevo y si el usuario no la cambió manualmente)
    if (tripUserOverrodeAccount && !force) return;

    const txType = (document.getElementById('type')?.value || document.getElementById('trans-type')?.value || 'expense').toLowerCase();
    const accSelect = document.getElementById('account') || document.getElementById('trans-account');
    if ((txType === 'expense' || txType === 'gasto') && trip.linkedPocketId && accSelect) {
        const pocket = (financeData.pockets || []).find(p => !p.isDeleted && String(p.id) === String(trip.linkedPocketId));
        if (pocket) {
            let opt = Array.from(accSelect.options).find(o => String(o.value) === String(pocket.id));
            if (!opt) {
                const cleanName = typeof stripLeadingEmoji === 'function' ? stripLeadingEmoji(pocket.name) : pocket.name;
                const metrics = typeof computePocketMetrics === 'function'
                    ? computePocketMetrics(pocket)
                    : { balance: Number(pocket.saved || pocket.balance || 0) };
                const fmtAmt = typeof formatCompact === 'function' ? formatCompact(metrics.balance) : formatMoney(metrics.balance);

                const group = document.createElement('optgroup');
                group.label = 'Bolsillo del Viaje';
                opt = document.createElement('option');
                opt.value = pocket.id;
                opt.textContent = `${cleanName} (${fmtAmt})`;
                group.appendChild(opt);
                accSelect.insertBefore(group, accSelect.firstChild);
            }

            if (String(accSelect.value) !== String(pocket.id)) {
                accSelect.value = String(pocket.id);
                accSelect.dispatchEvent(new Event('change'));
            }
        }
    }
};

const tripTxModal = document.getElementById('transaction-modal');
if (tripTxModal) {
    const bindAccountOverride = () => {
        const accSelect = document.getElementById('account') || document.getElementById('trans-account');
        if (accSelect && !accSelect.dataset.tripBound) {
            accSelect.dataset.tripBound = '1';
            accSelect.addEventListener('change', (e) => {
                if (e.isTrusted) tripUserOverrodeAccount = true;
            });
            const selectObserver = new MutationObserver(() => {
                if (!tripTxModal.classList.contains('hidden') && !tripUserOverrodeAccount) {
                    applyTripTxDefaults();
                }
            });
            selectObserver.observe(accSelect, { childList: true, subtree: true });
        }
    };

    const tripObserver = new MutationObserver(() => {
        if (!tripTxModal.classList.contains('hidden')) {
            tripUserOverrodeAccount = false;
            const sharedCheck = document.getElementById('tx-is-shared-check');
            const hiddenPayer = document.getElementById('tx-hidden-payer');
            if (sharedCheck) sharedCheck.checked = true;
            if (hiddenPayer) hiddenPayer.value = 'me';
            bindAccountOverride();
            applyTripTxDefaults(true);
            setTimeout(() => applyTripTxDefaults(), 40);
            setTimeout(() => applyTripTxDefaults(), 120);
        } else {
            tripUserOverrodeAccount = false;
        }
    });
    tripObserver.observe(tripTxModal, { attributes: true, attributeFilter: ['class'] });
}

['type', 'trans-type'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
        const tripTxModalEl = document.getElementById('transaction-modal');
        if (tripTxModalEl && !tripTxModalEl.classList.contains('hidden')) {
            tripUserOverrodeAccount = false;
            applyTripTxDefaults(true);
        }
    });
});

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
            const isSharedChecked = !!(trip.isShared && document.getElementById('tx-is-shared-check')?.checked);
            const payer = document.getElementById('tx-hidden-payer')?.value || 'me';

            for (let i = tripBeforeSubmitCount; i < financeData.transactions.length; i++) {
                const tx = financeData.transactions[i];
                if (tx && tx.type === 'expense' && !tx.isAdjustment) {
                    tx.tripName = trip.name;
                    if (trip.isolateBudget !== false) tx.isTripIsolated = true;
                    if (!Array.isArray(tx.tags)) tx.tags = [];
                    if (!tx.tags.includes(slug)) tx.tags.push(slug);

                    if (isSharedChecked) {
                        tx.isSharedTrip = true;
                        tx.paidBy = payer;
                        if (payer === 'companion') {
                            tx.account = 'CxC_Gastos_Acompanante';
                        }
                    }
                }
            }
            localStorage.setItem('myFinances', JSON.stringify(financeData));
            if (typeof renderTripModeBanner === 'function') renderTripModeBanner();
            if (typeof updateDashboard === 'function') updateDashboard();
            if (typeof renderPocketsView === 'function') renderPocketsView();
        }
    }
}, false);

// ==========================================
// MÓDULO 11: GENERADORES DE REPORTES EJECUTIVOS PDF
// ==========================================
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

const triggerSafePdfPrint = (htmlContent) => {
    const rc = document.getElementById('print-report-container');
    if (!rc) return;
    rc.innerHTML = `<style>${basePrintStyles}</style>${htmlContent}`;
    setTimeout(() => window.print(), 120);
};

document.getElementById('btn-generate-pdf-report')?.addEventListener('click', () => {
    const rc = document.getElementById('print-report-container');
    if (!rc) return;
    const monthId = getMonthId(viewDate), snap = computeBalancesUpTo(monthId), flow = getMonthlyFlow(monthId, false);
    
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
            const vHtml = ptto === 0 ? '-' : `<span class="${v.isFavorable ? 'print-positive' : 'print-negative'}">${String(v.pct).replace('.', ',')}%</span>`;
            expRows.push(`<tr><td>${cat.name}</td><td class="print-text-right">${formatMoney(ptto)}</td><td class="print-text-right">${formatMoney(real)}</td><td class="print-text-right">${vHtml}</td></tr>`);
        }
    });

    let txHtml = '';
    const txs = financeData.transactions.filter(t => t.monthId === monthId && isTxClosed(t)).sort((a, b) => b.id - a.id);
    txs.forEach(t => {
        const dStr = new Date(t.id).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
        const typeStr = t.type === 'income' ? 'Ingreso' : (t.type === 'expense' ? 'Gasto' : 'Transferencia');
        const color = t.type === 'income' ? 'print-positive' : (t.type === 'expense' ? 'print-negative' : '');
        const sign = t.type === 'income' ? '+' : (t.type === 'expense' ? '-' : '');
        txHtml += `<tr><td>${dStr}</td><td>${typeStr}</td><td>${t.category || t.account}</td><td>${t.description}</td><td class="print-text-right ${color}">${sign}${formatMoney(t.amount)}</td></tr>`;
    });

    rc.innerHTML = `<style>${basePrintStyles}</style>
        <div class="print-header">
            <h1>Extracto Financiero Mensual</h1>
            <p><strong>Titular:</strong> ${authData ? authData.name : 'Usuario'} | <strong>Periodo:</strong> ${formatMonthName(viewDate)} | <strong>Generado el:</strong> ${currentDate.toLocaleDateString('es-CO')} ${currentDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
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
        <div class="print-footer">Documento informativo generado localmente sin conexión a servidores. Mis Finanzas (Función IF) v2.2.0.</div>`;
    window.print();
});

document.getElementById('btn-print-cxc-report')?.addEventListener('click', () => {
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
                <p><strong>Generado:</strong> ${currentDate.toLocaleDateString('es-CO')} a las ${currentDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
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
            
            const accTxs = financeData.transactions.filter(t => t.account === acc.id || t.toAccount === acc.id).sort((a, b) => b.id - a.id);
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
    triggerSafePdfPrint(html);
});

document.getElementById('btn-print-liquidation-report')?.addEventListener('click', () => {
    const salaryStr = localStorage.getItem('myFinancesSalary');
    if (!salaryStr) return;
    const config = JSON.parse(salaryStr), m = calculateLaborMetrics(config, currentDate);
    
    const html = `
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
                <p><strong>Generado:</strong> ${currentDate.toLocaleDateString('es-CO')} a las ${currentDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
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
    
    triggerSafePdfPrint(html);
});

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
            Documento informativo generado localmente sin conexión a servidores. Mis Finanzas (Función IF) v2.2.0.
        </div>
    `;

    setTimeout(() => window.print(), 120);
};

document.getElementById('btn-print-pdf-report')?.addEventListener('click', () => {
    generateExecutivePdfReport();
});

// ==========================================
// MÓDULO 12: PROYECCIÓN DE EFECTIVO DÍA POR DÍA
// ==========================================
let cashProjectionHorizon = 'eom';

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
// ==========================================
// MÓDULO 13: CIERRE DE MES Y RESUMEN ANUAL PROACTIVO
// ==========================================
let activeRecapSlide = 0;
let activeRecapMode = 'monthly';
let isAutoWelcomeRecap = false;

const getMonthlyCelebrationTheme = (monthIndex) => {
    const themes = [
        { badge: 'Año Nuevo • Nuevos Comienzos', color: '#8b5cf6', seasonalTip: 'Enero trae pagos anuales (SOAT, predial, matrículas): aparta desde hoy un bolsillo dedicado para evitar desajustes.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>` },
        { badge: 'Febrero • Cesantías y Enfoque', color: '#ec4899', seasonalTip: 'Este mes se consignan las cesantías. Verifica tu fondo y cuida los gastos impulsivos de San Valentín.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>` },
        { badge: 'Marzo • Equilibrio Financiero', color: '#10b981', seasonalTip: 'Cierre de primer trimestre: audita suscripciones activas y recorta gastos hormiga antes de Semana Santa.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>` },
        { badge: 'Abril • Siembra de Ahorro', color: '#0ea5e9', seasonalTip: 'Mantén tus gastos variables bajo control y usa el Modo Viaje si sales en descanso para no alterar tus topes.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>` },
        { badge: 'Mayo • Mes de las Madres', color: '#f43f5e', seasonalTip: 'Celebra en familia sin desbordarte: asigna un tope fijo en el presupuesto para detalles y restaurantes.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>` },
        { badge: 'Junio • Mes de Prima', color: '#f59e0b', seasonalTip: 'Si recibes prima este mes, destina al menos el 50% a reducir tu deuda más cara o fortalecer tus bolsillos.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>` },
        { badge: 'Julio • Independencia Financiera', color: '#3b82f6', seasonalTip: 'Arranca el segundo semestre. Revisa qué tan cerca estás de tus metas de ahorro para diciembre.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>` },
        { badge: 'Agosto • Vientos Tributarios', color: '#06b6d4', seasonalTip: 'Inician los vencimientos de Renta DIAN. Revisa tu "Radar de Renta" en Parámetros UVT para anticipar saldos.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>` },
        { badge: 'Septiembre • Amor y Amistad', color: '#ec4899', seasonalTip: 'Disfruta compartir, pero ponle límite a los gastos hormiga, regalos y salidas a comer fuera de casa.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
        { badge: 'Octubre • Finanzas sin Sustos', color: '#f97316', seasonalTip: 'Que no te asuste fin de año: empieza a fondear desde ahora los regalos, vacaciones y gastos de diciembre.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>` },
        { badge: 'Noviembre • Compras Inteligentes', color: '#8b5cf6', seasonalTip: 'Mes de Black Friday: pasa toda oferta por el Simulador de Compra antes de diferirla a cuotas con interés.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>` },
        { badge: 'Diciembre • Cierre de Ciclo', color: '#10b981', seasonalTip: 'Mes de celebraciones y prima navideña. Protege una parte para arrancar enero sin deudas ni guayabo financiero.', svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` }
    ];
    return themes[monthIndex] || themes[0];
};

const getLocalStorageUsageStats = () => {
    let totalBytes = 0;
    for (let key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
            totalBytes += ((localStorage[key].length + key.length) * 2);
        }
    }
    const usedKB = round2(totalBytes / 1024);
    const limitKB = 5120;
    const usedPct = round2(Math.min(100, (usedKB / limitKB) * 100));
    return { totalBytes, usedKB, limitKB, usedPct };
};

const buildProactiveClosingData = (refDate = currentDate) => {
    const incomingMonthName = refDate.toLocaleDateString('es-CO', { month: 'long' });
    const incomingMonthCap = incomingMonthName.charAt(0).toUpperCase() + incomingMonthName.slice(1);
    const closedDate = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
    const priorDate = new Date(refDate.getFullYear(), refDate.getMonth() - 2, 1);

    const closedMonthId = getMonthId(closedDate);
    const priorMonthId = getMonthId(priorDate);
    const incomingMonthId = getMonthId(refDate);
    const closedMonthName = closedDate.toLocaleDateString('es-CO', { month: 'long' });
    const closedMonthCap = closedMonthName.charAt(0).toUpperCase() + closedMonthName.slice(1);

    const flow = getMonthlyFlow(closedMonthId, false);
    const priorFlow = getMonthlyFlow(priorMonthId, false);
    const surplus = round2(flow.inc - flow.exp);
    const savingsRate = flow.inc > 0 ? round2((surplus / flow.inc) * 100) : 0;
    const expChangePct = priorFlow.exp > 0 ? round2(((flow.exp - priorFlow.exp) / priorFlow.exp) * 100) : 0;
    const hasPriorActivity = priorFlow.inc > 0 || priorFlow.exp > 0;

    const trend3M = [];
    for (let i = 3; i >= 1; i--) {
        const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
        const f = getMonthlyFlow(getMonthId(d), false);
        const lbl = getShortMonthLabel(d);
        trend3M.push({ label: lbl.charAt(0).toUpperCase() + lbl.slice(1), inc: f.inc, exp: f.exp, net: f.net });
    }

    const closedTxs = financeData.transactions.filter(t => !t.isDeleted && getTxMonthId(t) === closedMonthId);
    const closedExpenses = closedTxs.filter(t => !t.isTripIsolated && t.type === 'expense' && !t.isAdjustment && isTxClosed(t));
    const pendingClosedCount = closedTxs.filter(t => t.status === 'pending').length;

    let fixedExp = 0, variableExp = 0, weekendExp = 0;
    let biggestExpense = null;

    closedExpenses.forEach(t => {
        const amt = round2(t.amount);
        if (isTxFixedExpense(t)) fixedExp = round2(fixedExp + amt);
        else variableExp = round2(variableExp + amt);

        const dow = new Date(t.id).getDay();
        if (dow === 0 || dow === 6) weekendExp = round2(weekendExp + amt);

        if (!biggestExpense || amt > biggestExpense.amount) {
            biggestExpense = {
                desc: stripLeadingEmoji(t.description || t.category || 'Gasto'),
                amount: amt,
                category: cleanCatName(t.category || '')
            };
        }
    });

    const fixedPct = flow.exp > 0 ? Math.round((fixedExp / flow.exp) * 100) : 0;
    const variablePct = flow.exp > 0 ? Math.max(0, 100 - fixedPct) : 0;
    const weekendPct = flow.exp > 0 ? Math.round((weekendExp / flow.exp) * 100) : 0;

    const heatStats = computeCalendarHeatmapData(closedDate, 'total');
    const daysInClosedMonth = new Date(closedDate.getFullYear(), closedDate.getMonth() + 1, 0).getDate();
    const zeroSpendDays = closedExpenses.length > 0 ? heatStats.zeroSpendDays : daysInClosedMonth;
    const avgDailySpend = round2(flow.exp / daysInClosedMonth);

    const snapClosed = computeBalancesUpTo(closedMonthId);
    const snapPrior = computeBalancesUpTo(priorMonthId);
    const snapCurrent = computeBalancesUpTo(incomingMonthId);
    const safeTodayData = computeSafeToSpendToday(incomingMonthId, snapCurrent);

    const healthClosed = calculateFinancialHealth(closedMonthId, snapClosed);
    const healthPrior = calculateFinancialHealth(priorMonthId, snapPrior);
    const healthScore = healthClosed.isNeutral ? 0 : healthClosed.scores.global;
    const healthDelta = (!healthClosed.isNeutral && !healthPrior.isNeutral && hasPriorActivity)
        ? (healthClosed.scores.global - healthPrior.scores.global)
        : 0;
    const healthPillars = healthClosed.scores || { flow: 0, liquidity: 0, debt: 0, networth: 0 };
    const reserveDays = healthClosed.metrics?.daysReserve || 0;
    const reserveMonths = healthClosed.metrics?.monthsReserve || 0;

    const borrowCap = calculateBorrowingCapacity(closedMonthId);

    const debtClosed = round2(snapClosed.liabilitiesTotal || 0);
    const debtPrior = round2(snapPrior.liabilitiesTotal || 0);
    const debtDelta = round2(debtClosed - debtPrior);
    let debtStatus = 'neutral';
    let debtHeadline = 'Cero deudas';
    let debtSub = 'Pasivos en $ 0';
    let debtPct = 0;

    if (debtPrior > 0 || debtClosed > 0) {
        if (debtDelta < -0.01) {
            debtPct = debtPrior > 0 ? round2((Math.abs(debtDelta) / debtPrior) * 100) : 100;
            debtStatus = 'good';
            debtHeadline = `Bajó ${String(debtPct).replace('.', ',')}%`;
            debtSub = `-${formatCompact(Math.abs(debtDelta))} pagados`;
        } else if (debtDelta > 0.01) {
            debtPct = debtPrior > 0 ? round2((debtDelta / debtPrior) * 100) : 100;
            debtStatus = 'bad';
            debtHeadline = `Subió ${debtPrior > 0 ? String(debtPct).replace('.', ',') + '%' : ''}`.trim();
            debtSub = `+${formatCompact(debtDelta)} en saldo`;
        } else {
            debtStatus = 'neutral';
            debtHeadline = 'Sin variación';
            debtSub = `Saldo: ${formatCompact(debtClosed)}`;
        }
    }

    const cards = financeData.customAccounts.filter(a => a.category === 'credit_card');
    let ccLimitTotal = 0, ccDebtClosed = 0, ccDebtPrior = 0;
    let activeDeferredCount = 0, finishingSoonCount = 0;

    cards.forEach(c => {
        ccLimitTotal = round2(ccLimitTotal + round2(c.creditLimit || 0));
        ccDebtClosed = round2(ccDebtClosed + Math.max(0, round2(snapClosed.bals[c.id] || 0)));
        ccDebtPrior = round2(ccDebtPrior + Math.max(0, round2(snapPrior.bals[c.id] || 0)));
        const pendingCC = getPendingCardPurchases(c.id);
        activeDeferredCount += pendingCC.length;
        finishingSoonCount += pendingCC.filter(p => p.remainingInstallments === 1).length;
    });

    financeData.customAccounts.filter(a => a.category === 'debt').forEach(d => {
        const pendingRev = getPendingRevolvingPurchases(d.id);
        activeDeferredCount += pendingRev.length;
        finishingSoonCount += pendingRev.filter(p => p.remainingInstallments === 1).length;
    });

    const ccFreedAmt = round2(ccDebtPrior - ccDebtClosed);
    const ccUsagePct = ccLimitTotal > 0 ? round2((ccDebtClosed / ccLimitTotal) * 100) : 0;

    let ccStatus = 'neutral';
    let ccHeadline = cards.length === 0 ? 'Sin tarjetas' : `Uso ${String(ccUsagePct).replace('.', ',')}%`;
    let ccSub = cards.length === 0 ? 'Sin cupos activos' : `Libre: ${formatCompact(Math.max(0, ccLimitTotal - ccDebtClosed))}`;

    if (cards.length > 0 && Math.abs(ccFreedAmt) >= 1) {
        if (ccFreedAmt > 0) {
            ccStatus = 'good';
            ccHeadline = `+${formatCompact(ccFreedAmt)} libre`;
            ccSub = `Uso actual: ${String(ccUsagePct).replace('.', ',')}%`;
        } else {
            ccStatus = 'bad';
            ccHeadline = `-${formatCompact(Math.abs(ccFreedAmt))} cupo`;
            ccSub = `Uso actual: ${String(ccUsagePct).replace('.', ',')}%`;
        }
    }

    const pocketsClosed = round2(snapClosed.allPocketsTotal || snapClosed.pocketsTotal || 0);
    const pocketsPrior = round2(snapPrior.allPocketsTotal || snapPrior.pocketsTotal || 0);
    const pocketsDelta = round2(pocketsClosed - pocketsPrior);
    const totalPocketYields = round2((financeData.pockets || []).reduce((s, p) => s + round2(p.yields || 0), 0));

    let closestPocket = null;
    (financeData.pockets || []).forEach(p => {
        const m = computePocketMetrics(p);
        if (m.goal > 0 && m.remaining > 0) {
            const pct = Math.min(99, Math.round((m.balance / m.goal) * 100));
            if (!closestPocket || pct > closestPocket.pct) {
                closestPocket = { name: stripLeadingEmoji(p.name), pct, remaining: m.remaining, balance: m.balance, goal: m.goal };
            }
        }
    });

    const activeSubs = (financeData.subscriptions || []).filter(s => s.status === 'active');
    let subsMonthlyTotal = 0;
    activeSubs.forEach(sub => {
        const amt = round2(sub.amount);
        if (sub.cycle === 'annual') subsMonthlyTotal = round2(subsMonthlyTotal + amt / 12);
        else if (sub.cycle === 'semiannual') subsMonthlyTotal = round2(subsMonthlyTotal + amt / 6);
        else if (sub.cycle === 'quarterly') subsMonthlyTotal = round2(subsMonthlyTotal + amt / 3);
        else if (sub.cycle === 'bimonthly') subsMonthlyTotal = round2(subsMonthlyTotal + amt / 2);
        else if (sub.cycle === 'weekly') subsMonthlyTotal = round2(subsMonthlyTotal + (amt * 52) / 12);
        else subsMonthlyTotal = round2(subsMonthlyTotal + amt);
    });

    const cYear = closedDate.getFullYear();
    const cMIdx = closedDate.getMonth();
    let totalBudgetLimit = 0;
    const catBreakdown = (financeData.categories.expense || []).map(catObj => {
        const limit = getCategoryLimitForMonth(catObj, cMIdx, cYear);
        totalBudgetLimit = round2(totalBudgetLimit + limit);
        const spent = round2(
            closedExpenses
                .filter(t => t.category === catObj.name)
                .reduce((s, t) => s + round2(t.amount), 0)
        );
        const sharePct = flow.exp > 0 ? Math.round((spent / flow.exp) * 100) : 0;
        const diff = limit > 0 ? round2(spent - limit) : 0;
        return { name: stripLeadingEmoji(catObj.name), rawName: catObj.name, limit, spent, sharePct, diff };
    }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent);

    const topCategories = catBreakdown.slice(0, 3);
    const mostOverBudget = [...catBreakdown].filter(c => c.diff > 0).sort((a, b) => b.diff - a.diff)[0] || null;
    const withinBudgetAll = totalBudgetLimit > 0 && !mostOverBudget && flow.exp > 0;

    const antData = computeAntExpensesAndSubHikes(closedMonthId);

    let achievement = null;
    if (savingsRate >= 25 && flow.inc > 0) {
        achievement = { icon: 'award', color: 'var(--positive)', title: 'Ahorrador Élite', text: `Retuviste el ${String(savingsRate).replace('.', ',')}% de tus ingresos. ¡Nivel superior!` };
    } else if (debtStatus === 'good' && debtPct >= 10) {
        achievement = { icon: 'trending-up', color: 'var(--positive)', title: 'Impulso Anti-Deuda', text: `Redujiste ${String(debtPct).replace('.', ',')}% de tus pasivos totales en 30 días.` };
    } else if (withinBudgetAll) {
        achievement = { icon: 'target', color: 'var(--positive)', title: 'Presupuesto Impecable', text: `Cumpliste al 100% tus topes sin pasarte en ninguna categoría.` };
    } else if (flow.exp > 0 && hasPriorActivity && expChangePct <= -8) {
        achievement = { icon: 'check', color: 'var(--positive)', title: 'Maestro del Recorte', text: `Gastaste ${String(Math.abs(expChangePct)).replace('.', ',')}% menos que el mes anterior.` };
    } else if (surplus > 0) {
        achievement = { icon: 'check', color: 'var(--positive)', title: 'Cierre en Verde', text: `Cerraste con flujo positivo de +${formatCompact(surplus)}. ¡Buen ritmo!` };
    } else {
        achievement = { icon: 'calendar', color: 'var(--accent)', title: `Nuevo Comienzo en ${incomingMonthCap}`, text: `Cada mes es una oportunidad limpia para optimizar tu flujo.` };
    }

    const theme = getMonthlyCelebrationTheme(refDate.getMonth());
    const seasonalCard = {
        tag: `Enfoque ${incomingMonthCap}`,
        tagBg: `color-mix(in srgb, ${theme.color} 14%, transparent)`,
        tagColor: theme.color,
        icon: 'calendar',
        color: theme.color,
        title: theme.badge,
        text: theme.seasonalTip,
        isSeasonal: true
    };

    const diagnosticCards = [];

    if (antData.subHikes && antData.subHikes.length > 0) {
        const hike = antData.subHikes[0];
        diagnosticCards.push({
            tag: 'Alerta Suscripción',
            tagBg: 'var(--negative-bg)',
            tagColor: 'var(--negative)',
            icon: 'repeat',
            color: 'var(--negative)',
            title: `${hike.name} subió +${String(hike.pctIncrease).replace('.', ',')}%`,
            text: `Te cobraron ${formatMoney(hike.chargedAmt)} frente a ${formatMoney(hike.expectedAmt)} habituales (+${formatCompact(hike.delta)}).`
        });
    }

    if (surplus < 0) {
        diagnosticCards.push({
            tag: 'Advertencia',
            tagBg: 'var(--negative-bg)',
            tagColor: 'var(--negative)',
            icon: 'alert',
            color: 'var(--negative)',
            title: 'Déficit de caja en el cierre',
            text: `En ${closedMonthName} gastaste ${formatMoney(Math.abs(surplus))} más de lo que ingresó. Recorta gastos variables este mes.`
        });
    } else if (surplus > 0) {
        diagnosticCards.push({
            tag: 'Felicitación',
            tagBg: 'var(--positive-bg)',
            tagColor: 'var(--positive)',
            icon: 'piggy',
            color: 'var(--positive)',
            title: `Excedente listo (+${formatCompact(surplus)})`,
            text: `No lo dejes quieto en tu cuenta diaria: muévelo a un bolsillo apenas arranque ${incomingMonthName}.`
        });
    }

    if (antData.antCount >= 4) {
        diagnosticCards.push({
            tag: 'Gastos Hormiga',
            tagBg: 'rgba(245, 158, 11, 0.15)',
            tagColor: '#d97706',
            icon: 'coins',
            color: '#d97706',
            title: `${antData.antCount} compras pequeñas = ${formatCompact(antData.totalAntSpend)}`,
            text: `A este ritmo representan ${formatCompact(antData.annualizedAntSpend)} al año. Reducir la mitad impulsaría tus metas.`
        });
    }

    if (mostOverBudget) {
        diagnosticCards.push({
            tag: 'Presupuesto',
            tagBg: 'rgba(245, 158, 11, 0.15)',
            tagColor: '#d97706',
            icon: 'target',
            color: '#d97706',
            title: `Tope superado en ${mostOverBudget.name}`,
            text: `Te excediste por +${formatMoney(mostOverBudget.diff)}. Revisa si debes ajustar su límite para ${incomingMonthName}.`
        });
    } else if (finishingSoonCount > 0) {
        diagnosticCards.push({
            tag: 'Buena Noticia',
            tagBg: 'var(--positive-bg)',
            tagColor: 'var(--positive)',
            icon: 'award',
            color: 'var(--positive)',
            title: `${finishingSoonCount} compra${finishingSoonCount > 1 ? 's' : ''} en su última cuota`,
            text: `Este mes terminas de pagar ${finishingSoonCount} obligacion${finishingSoonCount > 1 ? 'es' : ''} y liberarás flujo mensual.`
        });
    }

    if (weekendPct >= 50 && closedExpenses.length >= 4) {
        diagnosticCards.push({
            tag: 'Hábito Detectado',
            tagBg: 'var(--accent-soft)',
            tagColor: 'var(--accent)',
            icon: 'clock',
            color: 'var(--accent)',
            title: `${weekendPct}% de tu gasto fue en fin de semana`,
            text: `Sábados y domingos concentraron ${formatCompact(weekendExp)}. Define un presupuesto de ocio antes del viernes.`
        });
    } else if (closestPocket && closestPocket.pct >= 50) {
        diagnosticCards.push({
            tag: 'Meta Cercana',
            tagBg: 'var(--positive-bg)',
            tagColor: 'var(--positive)',
            icon: 'target',
            color: 'var(--positive)',
            title: `"${closestPocket.name}" al ${closestPocket.pct}%`,
            text: `¡Ya casi lo logras! Solo te faltan ${formatMoney(closestPocket.remaining)} para completar esta meta.`
        });
    }

    if (pendingClosedCount > 0) {
        diagnosticCards.push({
            tag: 'Por Confirmar',
            tagBg: 'rgba(245, 158, 11, 0.15)',
            tagColor: '#d97706',
            icon: 'clock',
            color: '#d97706',
            title: `${pendingClosedCount} pendiente${pendingClosedCount > 1 ? 's' : ''} en ${closedMonthCap}`,
            text: `Confirma o limpia los movimientos programados del mes anterior para que tu historial quede cuadrado.`
        });
    } else if (snapClosed.cxcTotal > 0) {
        diagnosticCards.push({
            tag: 'Por Cobrar',
            tagBg: 'var(--accent-soft)',
            tagColor: 'var(--accent)',
            icon: 'users',
            color: 'var(--accent)',
            title: `Tienes ${formatCompact(snapClosed.cxcTotal)} a favor`,
            text: `Recuerda gestionar tus deudas por cobrar para recuperar esa liquidez en tus cuentas.`
        });
    }

    const smartFeed = [seasonalCard, ...diagnosticCards.slice(0, 3)];

    const lastBackup = financeData.lastBackupDate || 0;
    const daysSinceBackup = lastBackup > 0 ? Math.floor((Date.now() - lastBackup) / (1000 * 3600 * 24)) : null;
    const totalAllTxs = financeData.transactions.filter(t => !t.isDeleted).length;
    const totalAccountsCount = financeData.customAccounts.length + (financeData.pockets || []).length;

    return {
        incomingMonthCap, closedMonthId, closedMonthCap, closedYear: closedDate.getFullYear(), theme,
        flow, priorFlow, surplus, savingsRate, expChangePct, hasPriorActivity, trend3M,
        fixedExp, variableExp, fixedPct, variablePct, biggestExpense, weekendPct,
        zeroSpendDays, avgDailySpend, closedExpensesCount: closedExpenses.length, pendingClosedCount,
        netWorthClosed: snapClosed.netWorth, liquidClosed: snapClosed.assetsTotal,
        safeToday: safeTodayData.safeToSpend,
        activeSubsCount: activeSubs.length, subsMonthlyTotal,
        healthScore, healthDelta, healthPillars, reserveDays, reserveMonths, isHealthNeutral: healthClosed.isNeutral,
        borrowCap,
        debtClosed, debtDelta, debtStatus, debtHeadline, debtSub, debtPct,
        ccUsagePct, ccStatus, ccHeadline, ccSub, activeDeferredCount, finishingSoonCount,
        pocketsClosed, pocketsDelta, pockets: financeData.pockets || [], closestPocket, totalPocketYields,
        cxcTotal: snapClosed.cxcTotal,
        topCategories, mostOverBudget, antData,
        achievement, smartFeed,
        daysSinceBackup, totalAllTxs, totalAccountsCount
    };
};

const buildAnnualWrappedData = (targetYear) => {
    let annualInc = 0, annualExp = 0, txCount = 0;
    let bestMonth = null, highestExpMonth = null;
    const catTotals = {};
    const tagTotals = {};
    const monthlySeries = [];

    for (let m = 1; m <= 12; m++) {
        const mId = `${targetYear}-${String(m).padStart(2, '0')}`;
        const f = getMonthlyFlow(mId, false);
        annualInc = round2(annualInc + f.inc);
        annualExp = round2(annualExp + f.exp);
        const mDate = new Date(targetYear, m - 1, 1);
        const mLabel = mDate.toLocaleDateString('es-CO', { month: 'long' });
        const mCap = mLabel.charAt(0).toUpperCase() + mLabel.slice(1);
        const shortLetter = mCap.charAt(0);

        monthlySeries.push({ label: mCap, short: shortLetter, inc: f.inc, exp: f.exp, net: f.net });

        if ((f.inc > 0 || f.exp > 0) && (!bestMonth || f.net > bestMonth.net)) bestMonth = { label: mCap, net: f.net };
        if (f.exp > 0 && (!highestExpMonth || f.exp > highestExpMonth.exp)) highestExpMonth = { label: mCap, exp: f.exp };
    }

    let archivableYearCount = 0;
    let archivableYearBytes = 0;

    financeData.transactions.forEach(t => {
        const mId = getTxMonthId(t);
        if (!t.isDeleted && mId.startsWith(`${targetYear}-`) && isTxClosed(t)) {
            txCount++;
            if (!t.isAdjustment) {
                const isDeferred = (t.installments || 1) > 1;
                const isFullyPaid = isDeferred && ((t.paidInstallments || 0) >= t.installments);
                if (!isDeferred || isFullyPaid) {
                    archivableYearCount++;
                    archivableYearBytes += JSON.stringify(t).length * 2;
                }
            }
            if (t.type === 'expense' && !t.isAdjustment) {
                const amt = round2(t.amount);
                const cName = cleanCatName(t.category || 'Otros Gastos');
                catTotals[cName] = round2((catTotals[cName] || 0) + amt);
                if (Array.isArray(t.tags)) {
                    t.tags.forEach(tg => {
                        tagTotals[tg] = round2((tagTotals[tg] || 0) + amt);
                    });
                }
            }
        }
    });

    const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = topCats.length > 0 ? { name: topCats[0][0], spent: topCats[0][1] } : null;
    const topTags = Object.entries(tagTotals).sort((a, b) => b[1] - a[1]);
    const topTag = topTags.length > 0 ? { tag: topTags[0][0], spent: topTags[0][1] } : null;

    const annualNet = round2(annualInc - annualExp);
    const annualSavingsRate = annualInc > 0 ? round2((annualNet / annualInc) * 100) : 0;
    const avgMonthlyExp = round2(annualExp / 12);
    const snapStart = computeBalancesUpTo(`${targetYear - 1}-12`);
    const snapEnd = computeBalancesUpTo(`${targetYear}-12`);

    let laborSnapshot = null;
    const salStr = localStorage.getItem('myFinancesSalary');
    if (salStr) {
        const cfg = JSON.parse(salStr);
        if (cfg && cfg.basicSalary > 0) {
            const m = calculateLaborMetrics(cfg, new Date(targetYear, 11, 30));
            laborSnapshot = {
                cesantias: m.liqCesantias,
                intereses: m.liqIntereses,
                vacaciones: m.liqVacaciones,
                vacDays: m.vacDaysPending
            };
        }
    }

    const rentaInfo = typeof checkRentaDeclaration === 'function' ? checkRentaDeclaration(targetYear) : null;
    const storage = getLocalStorageUsageStats();
    const archivableKB = round2(archivableYearBytes / 1024);
    const isCurrentOngoingYear = targetYear >= currentDate.getFullYear();

    let archiveAdvice = {
        status: 'optional',
        badge: 'Opcional',
        badgeBg: 'var(--positive-bg)',
        badgeColor: 'var(--positive)',
        barColor: storage.usedPct >= 75 ? 'var(--negative)' : (storage.usedPct >= 50 ? '#f59e0b' : 'var(--positive)'),
        title: `Memoria al ${String(storage.usedPct).replace('.', ',')}% (${storage.usedKB} KB / 5.120 KB)`,
        text: ''
    };

    if (archivableYearCount === 0) {
        archiveAdvice.status = 'done';
        archiveAdvice.badge = 'Al día';
        archiveAdvice.text = `No hay movimientos pendientes por consolidar en ${targetYear}. Tu base local está limpia y optimizada.`;
    } else if (storage.usedPct >= 65 || archivableYearCount >= 400) {
        archiveAdvice.status = 'recommended';
        archiveAdvice.badge = 'Recomendado';
        archiveAdvice.badgeBg = 'rgba(245, 158, 11, 0.16)';
        archiveAdvice.badgeColor = '#d97706';
        archiveAdvice.text = `Se recomienda ejecutar el Cierre de Año para ${targetYear}: archivará ${archivableYearCount} mov. (~${archivableKB} KB) en IndexedDB dejando un saldo consolidado sin perder tus balances.`;
    } else if (isCurrentOngoingYear) {
        archiveAdvice.status = 'wait';
        archiveAdvice.badge = 'Aún no necesario';
        archiveAdvice.text = `Tienes ${archivableYearCount} mov. cerrados (~${archivableKB} KB), pero tu memoria está holgada. Es mejor esperar a enero ${targetYear + 1} para consolidar el año completo.`;
    } else {
        archiveAdvice.status = 'optional';
        archiveAdvice.badge = 'Opcional';
        archiveAdvice.text = `Tu memoria local está saludable (${storage.usedKB} KB usados). Puedes conservar los ${archivableYearCount} mov. de ${targetYear} visibles o consolidarlos (~${archivableKB} KB) en IndexedDB cuando quieras.`;
    }

    return {
        year: targetYear, annualInc, annualExp, annualNet, annualSavingsRate, txCount, avgMonthlyExp,
        bestMonth, highestExpMonth, topCategory, topTag, monthlySeries,
        netWorthEnd: snapEnd.netWorth, netWorthDelta: round2(snapEnd.netWorth - snapStart.netWorth),
        debtEnd: snapEnd.liabilitiesTotal, debtDelta: round2(snapEnd.liabilitiesTotal - snapStart.liabilitiesTotal),
        pocketsEnd: snapEnd.allPocketsTotal, fixedAssetsEnd: snapEnd.fixedAssetsTotal,
        laborSnapshot, rentaInfo, storage, archivableYearCount, archivableKB, archiveAdvice
    };
};

const buildRecap3MonthSvgChart = (trend3M) => {
    const maxVal = Math.max(...trend3M.flatMap(m => [m.inc, m.exp]), 1);
    const W = 300, H = 82, padX = 24, padTop = 10, padBot = 18;
    const chartH = H - padTop - padBot;
    const colW = (W - padX * 2) / trend3M.length;
    const barW = 16;

    const bars = trend3M.map((m, idx) => {
        const cx = padX + colW * idx + colW / 2;
        const incH = m.inc > 0 ? Math.max(4, Math.round((m.inc / maxVal) * chartH)) : 2;
        const expH = m.exp > 0 ? Math.max(4, Math.round((m.exp / maxVal) * chartH)) : 2;
        const incY = padTop + chartH - incH;
        const expY = padTop + chartH - expH;
        const isLast = idx === trend3M.length - 1;

        return `
            <g>
                <rect x="${cx - barW - 2}" y="${incY}" width="${barW}" height="${incH}" rx="4" fill="var(--positive)" opacity="${isLast ? '1' : '0.45'}"/>
                <rect x="${cx + 2}" y="${expY}" width="${barW}" height="${expH}" rx="4" fill="var(--negative)" opacity="${isLast ? '1' : '0.45'}"/>
                <text x="${cx}" y="${H - 3}" text-anchor="middle" font-size="10.5" font-weight="${isLast ? '800' : '600'}" fill="${isLast ? 'var(--text-main)' : 'var(--text-muted)'}">${m.label}</text>
            </g>
        `;
    }).join('');

    return `
        <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:78px; display:block; overflow:visible;">
            <line x1="8" y1="${padTop + chartH}" x2="${W - 8}" y2="${padTop + chartH}" stroke="var(--border-color)" stroke-width="1"/>
            ${bars}
        </svg>
    `;
};

const buildAnnual12MonthSvgChart = (monthlySeries) => {
    const maxAbs = Math.max(...monthlySeries.map(m => Math.max(m.inc, m.exp)), 1);
    const W = 310, H = 88, padX = 10, padTop = 8, padBot = 18;
    const chartH = H - padTop - padBot;
    const colW = (W - padX * 2) / 12;

    const cols = monthlySeries.map((m, idx) => {
        const cx = padX + colW * idx + colW / 2;
        const incH = m.inc > 0 ? Math.max(3, Math.round((m.inc / maxAbs) * chartH)) : 2;
        const expH = m.exp > 0 ? Math.max(3, Math.round((m.exp / maxAbs) * chartH)) : 2;
        const bw = 6;
        return `
            <g>
                <rect x="${cx - bw - 1}" y="${padTop + chartH - incH}" width="${bw}" height="${incH}" rx="2.5" fill="var(--positive)" opacity="0.85"/>
                <rect x="${cx + 1}" y="${padTop + chartH - expH}" width="${bw}" height="${expH}" rx="2.5" fill="var(--negative)" opacity="0.85"/>
                <text x="${cx}" y="${H - 3}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-muted)">${m.short}</text>
            </g>
        `;
    }).join('');

    return `
        <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:84px; display:block;">
            <line x1="6" y1="${padTop + chartH}" x2="${W - 6}" y2="${padTop + chartH}" stroke="var(--border-color)" stroke-width="1"/>
            ${cols}
        </svg>
    `;
};

window.openMonthlyRecapModal = (forcedMode = null, autoWelcome = false) => {
    let modalEl = document.getElementById('monthly-recap-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'monthly-recap-modal';
        modalEl.className = 'modal hidden';
        modalEl.style.cssText = 'align-items: flex-end; padding: 0; z-index: 2000;';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width:600px; width:100%; height:94dvh; border-radius:24px 24px 0 0; padding:22px 18px; display:flex; flex-direction:column; background:var(--bg-base);">
                <div class="modal-header" style="align-items:flex-start; margin-bottom:12px; flex-shrink:0;">
                    <div style="min-width:0; flex:1;">
                        <h3 id="recap-modal-main-title" style="margin:0; font-size:21px; font-weight:800; letter-spacing:-0.5px; color:var(--text-main);">Resumen de Cierre</h3>
                        <small id="recap-month-subtitle" style="color:var(--text-muted); font-size:12.5px; font-weight:500;"></small>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Cerrar">Cerrar</button>
                </div>
                <div class="segmented-control" id="recap-mode-switcher" style="margin-bottom:12px; flex-shrink:0; background:var(--card-bg);">
                    <button type="button" class="segmented-btn active" data-recap-mode="monthly" style="font-size:12.5px; padding:9px;">Cierre Mensual</button>
                    <button type="button" class="segmented-btn" data-recap-mode="annual" style="font-size:12.5px; padding:9px;">Resumen Anual</button>
                </div>
                <div id="recap-bento-container" style="flex:1; display:flex; flex-direction:column; justify-content:flex-start; min-height:0;"></div>
            </div>
        `;
        document.body.appendChild(modalEl);
        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) {
                isAutoWelcomeRecap = false;
                modalEl.classList.add('hidden');
            }
        });
        modalEl.querySelector('.btn-close-modal')?.addEventListener('click', () => {
            isAutoWelcomeRecap = false;
            modalEl.classList.add('hidden');
        });
        modalEl.querySelectorAll('[data-recap-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                activeRecapMode = btn.getAttribute('data-recap-mode') || 'monthly';
                activeRecapSlide = 0;
                renderMonthlyRecapView();
            });
        });

        const stageEl = modalEl.querySelector('#recap-bento-container');
        let touchStartX = 0, touchStartY = 0;
        stageEl?.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });
        stageEl?.addEventListener('touchend', (e) => {
            if (!e.changedTouches || !e.changedTouches[0]) return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
            const maxIdx = activeRecapMode === 'monthly' ? 3 : 2;
            if (dx < 0 && activeRecapSlide < maxIdx) {
                activeRecapSlide++;
                renderMonthlyRecapView();
            } else if (dx > 0 && activeRecapSlide > 0) {
                activeRecapSlide--;
                renderMonthlyRecapView();
            }
        }, { passive: true });
    }

    isAutoWelcomeRecap = !!autoWelcome;
    const isJanNow = currentDate.getMonth() === 0;
    activeRecapMode = (forcedMode === 'annual') ? 'annual' : 'monthly';
    if (!isJanNow && forcedMode !== 'annual') {
        activeRecapMode = 'monthly';
    }
    activeRecapSlide = 0;
    renderMonthlyRecapView();
    modalEl.classList.remove('hidden');
};

const renderMonthlyRecapView = () => {
    const container = document.getElementById('recap-bento-container');
    const subEl = document.getElementById('recap-month-subtitle');
    const titleEl = document.getElementById('recap-modal-main-title');
    if (!container) return;

    const refDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const isJanuary = refDate.getMonth() === 0;
    const data = buildProactiveClosingData(refDate);
    const annualYear = isJanuary ? refDate.getFullYear() - 1 : refDate.getFullYear();
    const annualData = buildAnnualWrappedData(annualYear);

    const switcherEl = document.getElementById('recap-mode-switcher');
    if (switcherEl) {
        switcherEl.classList.toggle('hidden', !isJanuary && activeRecapMode !== 'annual');
    }

    document.querySelectorAll('#recap-mode-switcher [data-recap-mode]').forEach(btn => {
        const m = btn.getAttribute('data-recap-mode');
        btn.classList.toggle('active', m === activeRecapMode);
        if (m === 'monthly') btn.textContent = isJanuary ? 'Cierre Diciembre' : 'Cierre Mensual';
        if (m === 'annual') btn.textContent = `Año ${annualYear}`;
    });

    const userFirstName = (authData && authData.name) ? authData.name.split(' ')[0] : 'Hola';
    let slides = [];

    if (activeRecapMode === 'monthly') {
        if (titleEl) titleEl.textContent = `¡Bienvenido a ${data.incomingMonthCap}!`;
        if (subEl) {
            subEl.textContent = isJanuary
                ? `Parte 1 de 2 • Cierre de ${data.closedMonthCap} ${data.closedYear}`
                : `Balance de ${data.closedMonthCap} ${data.closedYear}`;
        }

        const backupWarningHtml = data.daysSinceBackup === null
            ? `<span style="font-size:11.5px; font-weight:700; color:var(--negative); background:var(--negative-bg); padding:5px 12px; border-radius:99px;">Sin respaldos aún</span>`
            : (data.daysSinceBackup >= 20
                ? `<span style="font-size:11.5px; font-weight:700; color:#d97706; background:rgba(245, 158, 11, 0.15); padding:5px 12px; border-radius:99px;">Último backup hace ${data.daysSinceBackup} días</span>`
                : `<span style="font-size:11.5px; font-weight:700; color:var(--positive); background:var(--positive-bg); padding:5px 12px; border-radius:99px;">Respaldado hace ${data.daysSinceBackup}d</span>`);

        const expRatio = data.flow.inc > 0 ? Math.min(100, (data.flow.exp / data.flow.inc) * 100) : (data.flow.exp > 0 ? 100 : 0);
        const ringRadius = 24;
        const ringCirc = 2 * Math.PI * ringRadius;
        const ringOffset = ringCirc - (Math.min(100, Math.max(0, data.healthScore)) / 100) * ringCirc;
        const healthColor = data.healthScore >= 80 ? 'var(--positive)' : (data.healthScore >= 50 ? '#f59e0b' : 'var(--negative)');

        slides = [
            `
            <div class="onb-anim-enter" style="display:flex; flex-direction:column; gap:12px;">
                <div>
                    <span style="display:inline-flex; align-items:center; gap:6px; background:color-mix(in srgb, ${data.theme.color} 12%, transparent); color:${data.theme.color}; font-weight:800; border-radius:99px; margin-bottom:8px; font-size:11px; padding:4px 11px;">
                        1 / 4 • ${data.theme.badge}
                    </span>
                    <h4 style="margin:0 0 2px 0; font-size:20px; font-weight:800; color:var(--text-main); line-height:1.2; letter-spacing:-0.4px;">
                        ${userFirstName}, así cerró ${data.closedMonthCap}
                    </h4>
                    <div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;">
                        <span style="font-size:32px; font-weight:800; color:${data.surplus >= 0 ? 'var(--positive)' : 'var(--negative)'}; letter-spacing:-1.2px; line-height:1.15;">
                            ${data.surplus >= 0 ? '+' : ''}${formatMoneyHtml(data.surplus)}
                        </span>
                        ${data.hasPriorActivity && data.expChangePct !== 0 ? `<span class="widget-badge ${data.expChangePct <= 0 ? 'good' : 'warn'}" style="font-size:10px;">Gasto ${data.expChangePct > 0 ? '+' : ''}${String(data.expChangePct).replace('.', ',')}% vs ant.</span>` : ''}
                    </div>
                </div>

                ${data.achievement ? `
                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 14px; border-radius:16px; display:flex; align-items:center; gap:12px;">
                    <span class="drawer-icon-box" style="width:38px; height:38px; border-radius:11px; background:color-mix(in srgb, ${data.achievement.color} 14%, transparent); color:${data.achievement.color}; flex-shrink:0;">
                        ${renderIcon(data.achievement.icon, 19)}
                    </span>
                    <div style="min-width:0;">
                        <strong style="display:block; font-size:13.5px; font-weight:800; color:var(--text-main);">${data.achievement.title}</strong>
                        <small style="display:block; font-size:11.5px; color:var(--text-muted); line-height:1.3;">${data.achievement.text}</small>
                    </div>
                </div>
                ` : ''}

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 14px; border-radius:15px;">
                        <small style="font-size:10px; font-weight:800; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:3px;">Ingresos</small>
                        <strong class="positive" style="font-size:15.5px; font-weight:800;">${formatMoney(data.flow.inc)}</strong>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 14px; border-radius:15px;">
                        <small style="font-size:10px; font-weight:800; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:3px;">Gastos</small>
                        <strong class="negative" style="font-size:15.5px; font-weight:800;">${formatMoney(data.flow.exp)}</strong>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:11px 14px; border-radius:15px;">
                        <small style="font-size:10px; font-weight:800; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:2px;">Días sin gastar</small>
                        <strong style="font-size:14.5px; font-weight:800; color:var(--text-main);">${data.zeroSpendDays} días</strong>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:11px 14px; border-radius:15px;">
                        <small style="font-size:10px; font-weight:800; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:2px;">Ritmo diario</small>
                        <strong style="font-size:14.5px; font-weight:800; color:var(--text-main);">${formatCompact(data.avgDailySpend)}/día</strong>
                    </div>
                </div>

                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:13px 14px; border-radius:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:6px;">
                        <span>Flujo últimos 3 meses</span>
                        <span>Ahorro: <b class="${data.savingsRate >= 0 ? 'positive' : 'negative'}">${String(data.savingsRate).replace('.', ',')}%</b></span>
                    </div>
                    ${buildRecap3MonthSvgChart(data.trend3M)}
                    ${data.flow.exp > 0 ? `
                    <div style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--text-muted); font-weight:700; margin-top:6px;">
                        <span>Fijos: <b style="color:var(--text-main);">${data.fixedPct}%</b> (${formatCompact(data.fixedExp)})</span>
                        <span>Variables: <b style="color:var(--text-main);">${data.variablePct}%</b> (${formatCompact(data.variableExp)})</span>
                    </div>
                    ` : `
                    <div style="width:100%; height:6px; background:var(--positive-bg); border-radius:99px; display:flex; overflow:hidden; margin-top:6px;">
                        <div style="width:${expRatio}%; background:var(--negative); height:100%;"></div>
                        <div style="flex:1; background:var(--positive);"></div>
                    </div>
                    `}
                </div>
            </div>
            `,
            `
            <div class="onb-anim-enter" style="display:flex; flex-direction:column; gap:11px;">
                <div>
                    <span style="display:inline-flex; align-items:center; gap:6px; background:color-mix(in srgb, var(--accent) 12%, transparent); color:var(--accent); font-weight:800; border-radius:99px; margin-bottom:6px; font-size:11px; padding:4px 11px;">
                        2 / 4 • Radiografía y Patrimonio
                    </span>
                    <h4 style="margin:0; font-size:20px; font-weight:800; color:var(--text-main); letter-spacing:-0.4px;">Salud y distribución</h4>
                </div>

                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:13px 14px; border-radius:18px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                        <div style="position:relative; width:56px; height:56px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                            <svg width="56" height="56" viewBox="0 0 60 60" style="transform:rotate(-90deg);">
                                <circle cx="30" cy="30" r="${ringRadius}" fill="none" stroke="var(--hover-bg)" stroke-width="6"/>
                                <circle cx="30" cy="30" r="${ringRadius}" fill="none" stroke="${healthColor}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${ringCirc}" stroke-dashoffset="${ringOffset}"/>
                            </svg>
                            <strong style="position:absolute; font-size:14.5px; font-weight:800; color:var(--text-main);">${data.isHealthNeutral ? '--' : data.healthScore}</strong>
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                                <strong style="font-size:14px; font-weight:800; color:var(--text-main);">Salud Financiera</strong>
                                ${data.healthDelta !== 0 ? `<span class="widget-badge ${data.healthDelta > 0 ? 'good' : 'danger'}" style="font-size:9.5px; padding:1px 6px;">${data.healthDelta > 0 ? '+' : ''}${data.healthDelta} pts</span>` : ''}
                            </div>
                            <small style="display:block; font-size:11.5px; color:var(--text-muted); line-height:1.3;">
                                Fondo reserva: <b style="color:var(--text-main);">${data.reserveDays} días</b> (${String(data.reserveMonths).replace('.', ',')} meses)
                            </small>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; padding-top:9px; border-top:1px dashed var(--border-color); text-align:center;">
                        <div><small style="display:block; font-size:9.5px; color:var(--text-muted); font-weight:700;">Flujo</small><strong style="font-size:12px; color:var(--text-main);">${data.healthPillars.flow}%</strong></div>
                        <div><small style="display:block; font-size:9.5px; color:var(--text-muted); font-weight:700;">Liquidez</small><strong style="font-size:12px; color:var(--text-main);">${data.healthPillars.liquidity}%</strong></div>
                        <div><small style="display:block; font-size:9.5px; color:var(--text-muted); font-weight:700;">Deuda</small><strong style="font-size:12px; color:var(--text-main);">${data.healthPillars.debt}%</strong></div>
                        <div><small style="display:block; font-size:9.5px; color:var(--text-muted); font-weight:700;">Patrim.</small><strong style="font-size:12px; color:var(--text-main);">${data.healthPillars.networth}%</strong></div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 13px; border-radius:16px;">
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px; color:${data.debtStatus === 'good' ? 'var(--positive)' : (data.debtStatus === 'bad' ? 'var(--negative)' : 'var(--text-muted)')};">
                            ${renderIcon('scale', 15)}
                            <small style="font-size:10px; font-weight:800; text-transform:uppercase;">Deudas</small>
                        </div>
                        <strong style="display:block; font-size:14px; font-weight:800; color:var(--text-main); margin-bottom:2px;">${data.debtHeadline}</strong>
                        <small style="display:block; font-size:11px; color:var(--text-muted);">${data.debtSub}</small>
                        ${data.borrowCap.baseIncome > 0 ? `<small style="display:block; font-size:10px; color:var(--accent); font-weight:700; margin-top:3px;">Carga: ${String(data.borrowCap.usedPct).replace('.', ',')}% / ${data.borrowCap.maxPct}%</small>` : ''}
                    </div>

                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 13px; border-radius:16px;">
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px; color:#3b82f6;">
                            ${renderIcon('card', 15)}
                            <small style="font-size:10px; font-weight:800; text-transform:uppercase;">Tarjetas</small>
                        </div>
                        <strong style="display:block; font-size:14px; font-weight:800; color:var(--text-main); margin-bottom:2px;">${data.ccHeadline}</strong>
                        <small style="display:block; font-size:11px; color:var(--text-muted);">${data.ccSub}</small>
                        <small style="display:block; font-size:10px; color:var(--text-muted); font-weight:700; margin-top:3px;">${data.activeDeferredCount > 0 ? `${data.activeDeferredCount} diferido${data.activeDeferredCount > 1 ? 's' : ''} activo${data.activeDeferredCount > 1 ? 's' : ''}` : 'Sin cuotas diferidas'}</small>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 13px; border-radius:16px;">
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px; color:var(--positive);">
                            ${renderIcon('bank', 15)}
                            <small style="font-size:10px; font-weight:800; text-transform:uppercase;">Patrimonio</small>
                        </div>
                        <strong class="${data.netWorthClosed >= 0 ? 'positive' : 'negative'}" style="display:block; font-size:14px; font-weight:800; margin-bottom:2px;">${formatCompact(data.netWorthClosed)}</strong>
                        <small style="display:block; font-size:11px; color:var(--text-muted);">Liquidez: ${formatCompact(data.liquidClosed)}</small>
                    </div>

                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 13px; border-radius:16px;">
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px; color:#f59e0b;">
                            ${renderIcon('repeat', 15)}
                            <small style="font-size:10px; font-weight:800; text-transform:uppercase;">Suscripciones</small>
                        </div>
                        <strong style="display:block; font-size:14px; font-weight:800; color:var(--text-main); margin-bottom:2px;">${formatCompact(data.subsMonthlyTotal)}/mes</strong>
                        <small style="display:block; font-size:11px; color:var(--text-muted);">${data.activeSubsCount} activa${data.activeSubsCount !== 1 ? 's' : ''} • Libre hoy: ${formatCompact(data.safeToday)}</small>
                    </div>
                </div>

                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:13px 14px; border-radius:18px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="font-size:13px; font-weight:800; color:var(--text-main);">Top gastos de ${data.closedMonthCap}</strong>
                        <small style="font-size:11px; color:var(--positive); font-weight:700;">Bolsillos: ${formatCompact(data.pocketsClosed)}${data.totalPocketYields > 0 ? ` (+${formatCompact(data.totalPocketYields)} int.)` : ''}</small>
                    </div>
                    ${data.topCategories.length > 0 ? data.topCategories.map((cat, idx) => `
                        <div style="margin-bottom:${idx === data.topCategories.length - 1 ? '0' : '8px'};">
                            <div style="display:flex; justify-content:space-between; font-size:11.5px; margin-bottom:3px;">
                                <span style="font-weight:700; color:var(--text-main);">${cat.name}</span>
                                <span style="font-weight:700; color:var(--text-muted);">${formatCompact(cat.spent)} <small>(${cat.sharePct}%)</small></span>
                            </div>
                            <div style="width:100%; height:5px; background:var(--hover-bg); border-radius:99px; overflow:hidden;">
                                <div style="width:${Math.max(4, cat.sharePct)}%; height:100%; background:${idx === 0 ? 'var(--negative)' : (idx === 1 ? '#f59e0b' : 'var(--accent)')}; border-radius:99px;"></div>
                            </div>
                        </div>
                    `).join('') : `
                        <div style="font-size:12px; color:var(--positive); font-weight:600; padding:2px 0;">
                            Sin gastos registrados en ${data.closedMonthCap}. ¡Excelente control!
                        </div>
                    `}
                    ${data.closestPocket ? `
                    <div style="margin-top:9px; padding-top:8px; border-top:1px dashed var(--border-color);">
                        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                            <span style="color:var(--text-muted);">Meta más cercana: <b style="color:var(--text-main);">${data.closestPocket.name}</b></span>
                            <strong class="positive">${data.closestPocket.pct}%</strong>
                        </div>
                        <div style="width:100%; height:5px; background:var(--hover-bg); border-radius:99px; overflow:hidden;">
                            <div style="width:${Math.max(4, data.closestPocket.pct)}%; height:100%; background:var(--positive); border-radius:99px;"></div>
                        </div>
                    </div>
                    ` : ''}
                    ${data.biggestExpense ? `
                    <div style="margin-top:9px; padding-top:8px; border-top:1px dashed var(--border-color); display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-muted);">
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-right:8px;">Mayor compra: <b style="color:var(--text-main);">${data.biggestExpense.desc}</b></span>
                        <strong class="negative" style="flex-shrink:0;">${formatCompact(data.biggestExpense.amount)}</strong>
                    </div>
                    ` : ''}
                </div>
            </div>
            `,
            `
            <div class="onb-anim-enter" style="display:flex; flex-direction:column; gap:10px;">
                <div>
                    <span style="display:inline-flex; align-items:center; gap:6px; background:color-mix(in srgb, var(--accent) 12%, transparent); color:var(--accent); font-weight:800; border-radius:99px; margin-bottom:6px; font-size:11px; padding:4px 11px;">
                        3 / 4 • Radar Inteligente
                    </span>
                    <h4 style="margin:0; font-size:20px; font-weight:800; color:var(--text-main); letter-spacing:-0.4px;">Plan de acción para ${data.incomingMonthCap}</h4>
                </div>

                <div style="display:flex; flex-direction:column; gap:9px;">
                    ${data.smartFeed.map(item => `
                    <div style="background:var(--card-bg); border:1px solid ${item.isSeasonal ? `color-mix(in srgb, ${item.color} 35%, var(--border-color))` : 'var(--border-color)'}; padding:12px 13px; border-radius:16px; display:flex; align-items:flex-start; gap:11px;">
                        <span style="color:${item.color}; background:color-mix(in srgb, ${item.color} 15%, transparent); width:38px; height:38px; border-radius:11px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">
                            ${renderIcon(item.icon, 18)}
                        </span>
                        <div style="min-width:0; flex:1;">
                            <span style="display:inline-block; font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; color:${item.tagColor}; background:${item.tagBg}; padding:2px 7px; border-radius:6px; margin-bottom:3px;">
                                ${item.tag}
                            </span>
                            <strong style="display:block; font-size:13px; font-weight:800; color:var(--text-main); margin-bottom:2px; line-height:1.25;">${item.title}</strong>
                            <small style="display:block; font-size:11.5px; color:var(--text-muted); line-height:1.38;">${item.text}</small>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
            `,
            `
            <div class="onb-anim-enter" style="display:flex; flex-direction:column; text-align:center; padding-top:8px;">
                <div style="display:flex; justify-content:center; margin-bottom:14px;">
                    <span style="width:68px; height:68px; border-radius:20px; background:var(--card-bg); border:1px solid color-mix(in srgb, var(--positive) 30%, transparent); color:var(--positive); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px color-mix(in srgb, var(--positive) 12%, transparent);">
                        ${renderIcon('shield', 32)}
                    </span>
                </div>

                <span style="display:inline-flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--positive) 12%, transparent); color:var(--positive); border-radius:99px; margin:0 auto 10px auto; font-size:11px; padding:4px 12px; font-weight:800;">
                    4 / 4 • Privacidad Local-First
                </span>

                <h4 style="margin:0 0 6px 0; font-size:21px; font-weight:800; color:var(--text-main); letter-spacing:-0.4px;">Protege tu progreso</h4>
                <p style="font-size:12.5px; color:var(--text-muted); line-height:1.45; margin:0 auto 14px auto; max-width:92%;">
                    Tu información vive 100% en este dispositivo. Exporta una copia antes de arrancar ${data.incomingMonthCap}.
                </p>

                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px; text-align:center;">
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:10px 6px; border-radius:14px;">
                        <strong style="display:block; font-size:14.5px; font-weight:800; color:var(--text-main);">${data.totalAllTxs}</strong>
                        <small style="font-size:10px; color:var(--text-muted); font-weight:700;">Movimientos</small>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:10px 6px; border-radius:14px;">
                        <strong style="display:block; font-size:14.5px; font-weight:800; color:var(--text-main);">${data.totalAccountsCount}</strong>
                        <small style="font-size:10px; color:var(--text-muted); font-weight:700;">Cuentas/Metas</small>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:10px 6px; border-radius:14px;">
                        <strong style="display:block; font-size:14.5px; font-weight:800; color:${data.daysSinceBackup !== null && data.daysSinceBackup < 20 ? 'var(--positive)' : '#d97706'};">${data.daysSinceBackup === null ? '0' : data.daysSinceBackup + 'd'}</strong>
                        <small style="font-size:10px; color:var(--text-muted); font-weight:700;">Últ. Backup</small>
                    </div>
                </div>

                <div style="display:inline-flex; justify-content:center; margin-bottom:16px;">
                    ${backupWarningHtml}
                </div>

                <button type="button" id="btn-recap-do-backup" class="btn btn-primary" style="width:100%; font-size:14.5px; font-weight:800; padding:14px; border-radius:16px; margin-bottom:9px; background:var(--positive); border-color:var(--positive);">
                    Descargar Backup (.json)
                </button>

                ${data.surplus > 0 && data.pockets.length > 0 ? `
                <button type="button" id="btn-recap-go-save" class="btn btn-secondary" style="width:100%; font-size:13px; font-weight:700; padding:13px; border-radius:16px; margin-bottom:9px; color:var(--positive); border:1px solid color-mix(in srgb, var(--positive) 30%, transparent); background:color-mix(in srgb, var(--positive) 8%, var(--card-bg));">
                    + Transferir sobrante (${formatCompact(data.surplus)}) a ${data.closestPocket ? data.closestPocket.name : stripLeadingEmoji(data.pockets[0].name)}
                </button>
                ` : (data.surplus > 0 ? `
                <button type="button" id="btn-recap-create-pocket" class="btn btn-secondary" style="width:100%; font-size:13px; font-weight:700; padding:13px; border-radius:16px; margin-bottom:9px; color:var(--accent);">
                    + Crear bolsillo para guardar ${formatCompact(data.surplus)}
                </button>
                ` : '')}

                ${data.pendingClosedCount > 0 ? `
                <button type="button" id="btn-recap-review-pending" class="btn btn-secondary" style="width:100%; font-size:12.5px; font-weight:700; padding:11px; border-radius:14px; color:#d97706;">
                    Revisar ${data.pendingClosedCount} pendiente${data.pendingClosedCount > 1 ? 's' : ''} de ${data.closedMonthCap} →
                </button>
                ` : ''}
            </div>
            `
        ];
    } else {
        if (titleEl) titleEl.textContent = `Resumen Anual ${annualData.year}`;
        if (subEl) {
            subEl.textContent = isJanuary
                ? `Parte 2 de 2 • Balance consolidado de ${annualData.year}`
                : `Balance consolidado de enero a diciembre`;
        }

        const annExpRatio = annualData.annualInc > 0 ? Math.min(100, (annualData.annualExp / annualData.annualInc) * 100) : (annualData.annualExp > 0 ? 100 : 0);
        const renta = annualData.rentaInfo;
        const exceededCount = renta ? Object.values(renta.exceeds).filter(Boolean).length : 0;
        const adv = annualData.archiveAdvice;

        slides = [
            `
            <div class="onb-anim-enter" style="display:flex; flex-direction:column; gap:12px;">
                <div>
                    <span style="display:inline-flex; align-items:center; gap:6px; background:color-mix(in srgb, var(--accent) 12%, transparent); color:var(--accent); font-weight:800; border-radius:99px; margin-bottom:8px; font-size:11px; padding:4px 11px;">
                        1 / 3 • Año ${annualData.year} en Cifras
                    </span>
                    <h4 style="margin:0 0 2px 0; font-size:20px; font-weight:800; color:var(--text-main); line-height:1.2; letter-spacing:-0.4px;">
                        ${userFirstName}, así cerró tu ${annualData.year}
                    </h4>
                    <div style="font-size:32px; font-weight:800; color:${annualData.annualNet >= 0 ? 'var(--positive)' : 'var(--negative)'}; letter-spacing:-1.2px;">
                        ${annualData.annualNet >= 0 ? '+' : ''}${formatMoneyHtml(annualData.annualNet)}
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px;">
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 14px; border-radius:15px;">
                        <small style="font-size:10px; font-weight:800; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:5px;">Ingresos Año</small>
                        <strong class="positive" style="font-size:16px; font-weight:800;">${formatMoney(annualData.annualInc)}</strong>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 14px; border-radius:15px;">
                        <small style="font-size:10px; font-weight:800; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:5px;">Gastos Año</small>
                        <strong class="negative" style="font-size:16px; font-weight:800;">${formatMoney(annualData.annualExp)}</strong>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 14px; border-radius:15px;">
                        <small style="font-size:10px; font-weight:800; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:5px;">Promedio Gasto</small>
                        <strong style="font-size:15px; font-weight:800; color:var(--text-main);">${formatMoney(annualData.avgMonthlyExp)}/mes</strong>
                    </div>
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 14px; border-radius:15px;">
                        <small style="font-size:10px; font-weight:800; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:5px;">Actividad Total</small>
                        <strong style="font-size:15px; font-weight:800; color:var(--text-main);">${annualData.txCount} mov.</strong>
                    </div>
                </div>

                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:16px 14px 14px 14px; border-radius:16px; margin-top:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:12px;">
                        <span>Comportamiento 12 meses</span>
                        <span>Ahorro: <b class="${annualData.annualSavingsRate >= 0 ? 'positive' : 'negative'}">${String(annualData.annualSavingsRate).replace('.', ',')}%</b></span>
                    </div>
                    ${buildAnnual12MonthSvgChart(annualData.monthlySeries)}
                    <div style="width:100%; height:7px; background:var(--positive-bg); border-radius:99px; display:flex; overflow:hidden; margin-top:10px;">
                        <div style="width:${annExpRatio}%; background:var(--negative); height:100%;"></div>
                        <div style="flex:1; background:var(--positive);"></div>
                    </div>
                </div>
            </div>
            `,
            `
            <div class="onb-anim-enter" style="display:flex; flex-direction:column; gap:11px;">
                <div>
                    <span style="display:inline-flex; align-items:center; gap:6px; background:color-mix(in srgb, var(--accent) 12%, transparent); color:var(--accent); font-weight:800; border-radius:99px; margin-bottom:6px; font-size:11px; padding:4px 11px;">
                        2 / 3 • Evolución Patrimonial
                    </span>
                    <h4 style="margin:0; font-size:20px; font-weight:800; color:var(--text-main); letter-spacing:-0.4px;">Hitos de enero a diciembre</h4>
                </div>

                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:14px; border-radius:18px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                    <div style="display:flex; align-items:center; gap:11px; min-width:0; flex:1;">
                        <span class="drawer-icon-box" style="width:40px; height:40px; border-radius:12px; background:var(--accent-soft); color:var(--accent); flex-shrink:0;">
                            ${renderIcon('trending-up', 19)}
                        </span>
                        <div style="min-width:0;">
                            <strong style="display:block; font-size:13.5px; font-weight:800; color:var(--text-main);">Crecimiento Neto</strong>
                            <small style="display:block; font-size:11px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Cierre ${annualData.year}: ${formatCompact(annualData.netWorthEnd)}</small>
                        </div>
                    </div>
                    <strong class="${annualData.netWorthDelta >= 0 ? 'positive' : 'negative'}" style="font-size:14.5px; flex-shrink:0; text-align:right;">
                        ${annualData.netWorthDelta >= 0 ? '+' : ''}${formatCompact(annualData.netWorthDelta)}
                    </strong>
                </div>

                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:14px; border-radius:18px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                    <div style="display:flex; align-items:center; gap:11px; min-width:0; flex:1;">
                        <span class="drawer-icon-box" style="width:40px; height:40px; border-radius:12px; background:var(--negative-bg); color:var(--negative); flex-shrink:0;">
                            ${renderIcon('scale', 19)}
                        </span>
                        <div style="min-width:0;">
                            <strong style="display:block; font-size:13.5px; font-weight:800; color:var(--text-main);">Cambio en Deudas</strong>
                            <small style="display:block; font-size:11px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Saldo final: ${formatCompact(annualData.debtEnd)}</small>
                        </div>
                    </div>
                    <strong class="${annualData.debtDelta <= 0 ? 'positive' : 'negative'}" style="font-size:14.5px; flex-shrink:0; text-align:right;">
                        ${annualData.debtDelta <= 0 ? '' : '+'}${formatCompact(annualData.debtDelta)}
                    </strong>
                </div>

                ${annualData.laborSnapshot ? `
                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:13px 14px; border-radius:18px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                    <div style="display:flex; align-items:center; gap:11px; min-width:0; flex:1;">
                        <span class="drawer-icon-box" style="width:40px; height:40px; border-radius:12px; background:var(--positive-bg); color:var(--positive); flex-shrink:0;">
                            ${renderIcon('briefcase', 19)}
                        </span>
                        <div style="min-width:0;">
                            <strong style="display:block; font-size:13.5px; font-weight:800; color:var(--text-main);">Prestaciones Causadas</strong>
                            <small style="display:block; font-size:11px; color:var(--text-muted);">Cesantías + Int: ${formatCompact(annualData.laborSnapshot.cesantias + annualData.laborSnapshot.intereses)}</small>
                        </div>
                    </div>
                    <strong class="positive" style="font-size:13.5px; flex-shrink:0; text-align:right;">
                        Vac: ${formatCompact(annualData.laborSnapshot.vacaciones)}
                    </strong>
                </div>
                ` : ''}

                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:14px; border-radius:18px; font-size:12.5px; color:var(--text-muted); line-height:1.45;">
                    ${annualData.bestMonth ? `<div style="margin-bottom:8px; display:flex; align-items:center; gap:8px;"><span style="color:var(--positive); flex-shrink:0;">${renderIcon('award', 15)}</span> <span>Mejor mes de flujo: <b class="positive">${annualData.bestMonth.label} (+${formatCompact(annualData.bestMonth.net)})</b></span></div>` : ''}
                    ${annualData.highestExpMonth ? `<div style="margin-bottom:8px; display:flex; align-items:center; gap:8px;"><span style="color:#d97706; flex-shrink:0;">${renderIcon('alert', 15)}</span> <span>Mes con mayor gasto: <b style="color:var(--text-main);">${annualData.highestExpMonth.label} (${formatCompact(annualData.highestExpMonth.exp)})</b></span></div>` : ''}
                    ${annualData.topCategory ? `<div style="margin-bottom:${annualData.topTag ? '8px' : '0'}; display:flex; align-items:center; gap:8px;"><span style="color:var(--negative); flex-shrink:0;">${renderIcon('shopping-bag', 15)}</span> <span>Categoría #1: <b style="color:var(--text-main);">${annualData.topCategory.name} (${formatCompact(annualData.topCategory.spent)})</b></span></div>` : ''}
                    ${annualData.topTag ? `<div style="display:flex; align-items:center; gap:8px;"><span style="color:var(--accent); flex-shrink:0;">${renderIcon('layers', 15)}</span> <span>Etiqueta líder: <b style="color:var(--accent);">#${annualData.topTag.tag} (${formatCompact(annualData.topTag.spent)})</b></span></div>` : ''}
                </div>
            </div>
            `,
            `
            <div class="onb-anim-enter" style="display:flex; flex-direction:column; gap:10px; padding-top:2px;">
                <div>
                    <span style="display:inline-flex; align-items:center; gap:6px; background:color-mix(in srgb, #f59e0b 14%, transparent); color:#d97706; font-weight:800; border-radius:99px; margin-bottom:6px; font-size:11px; padding:4px 11px;">
                        3 / 3 • Mantenimiento y Nuevo Ciclo
                    </span>
                    <h4 style="margin:0 0 2px 0; font-size:20px; font-weight:800; color:var(--text-main); letter-spacing:-0.4px;">Prepara tu ${annualData.year + 1}</h4>
                    <small style="font-size:12px; color:var(--text-muted);">Respalda tu historial, optimiza memoria y actualiza parámetros legales.</small>
                </div>

                ${renta ? `
                <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px 13px; border-radius:16px; display:flex; align-items:center; gap:11px;">
                    <span class="drawer-icon-box" style="width:38px; height:38px; border-radius:11px; background:${renta.mustDeclare ? 'rgba(245, 158, 11, 0.15)' : 'var(--positive-bg)'}; color:${renta.mustDeclare ? '#d97706' : 'var(--positive)'}; flex-shrink:0;">
                        ${renderIcon('file-text', 18)}
                    </span>
                    <div style="min-width:0; flex:1;">
                        <strong style="display:block; font-size:13px; font-weight:800; color:var(--text-main);">
                            ${renta.mustDeclare ? `Radar DIAN: Superaste ${exceededCount} tope${exceededCount > 1 ? 's' : ''}` : 'Radar DIAN: Debajo de topes'}
                        </strong>
                        <small style="display:block; font-size:11.5px; color:var(--text-muted); line-height:1.35;">
                            ${renta.mustDeclare ? `Según tus registros de ${annualData.year}, deberás presentar Declaración de Renta.` : `Tus movimientos de ${annualData.year} no superan los topes UVT registrados.`}
                        </small>
                    </div>
                </div>
                ` : ''}

                <div style="background:var(--card-bg); border:1px solid ${adv.status === 'recommended' ? 'rgba(245, 158, 11, 0.45)' : 'var(--border-color)'}; padding:13px 14px; border-radius:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                        <strong style="font-size:13px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                            <span style="color:#d97706; display:inline-flex;">${renderIcon('archive', 16)}</span>
                            <span>Cierre de Año (Liberar Memoria)</span>
                        </strong>
                        <span style="font-size:10px; font-weight:800; padding:2px 8px; border-radius:99px; background:${adv.badgeBg}; color:${adv.badgeColor}; flex-shrink:0;">
                            ${adv.badge}
                        </span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); font-weight:700; margin-bottom:5px;">
                        <span>${adv.title}</span>
                        <span>${annualData.archivableYearCount} mov.</span>
                    </div>
                    <div style="width:100%; height:6px; background:var(--hover-bg); border-radius:99px; overflow:hidden; margin-bottom:8px;">
                        <div style="width:${Math.max(3, annualData.storage.usedPct)}%; height:100%; background:${adv.barColor}; border-radius:99px;"></div>
                    </div>
                    <small style="display:block; font-size:11.5px; color:var(--text-muted); line-height:1.38;">
                        ${adv.text}
                    </small>
                </div>

                <button type="button" id="btn-recap-do-backup" class="btn btn-primary" style="width:100%; font-size:14px; font-weight:800; padding:13px; border-radius:16px; background:#f59e0b; border-color:#f59e0b;">
                    Exportar Respaldo Anual ${annualData.year} (.json)
                </button>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:9px;">
                    <button type="button" id="btn-recap-go-archive" class="btn btn-secondary" style="width:100%; font-size:12.5px; font-weight:700; padding:12px 10px; border-radius:14px; color:#d97706;">
                        Liberar Memoria →
                    </button>
                    <button type="button" class="btn btn-secondary" style="width:100%; font-size:12.5px; font-weight:700; padding:12px 10px; border-radius:14px;" onclick="isAutoWelcomeRecap = false; document.getElementById('monthly-recap-modal')?.classList.add('hidden'); document.getElementById('drawer-tax')?.click();">
                        UVT / SMMLV ${annualData.year + 1} →
                    </button>
                </div>
            </div>
            `
        ];
    }

    const isLast = activeRecapSlide === slides.length - 1;
    const chainToAnnualInJan = isLast && activeRecapMode === 'monthly' && isJanuary;
    const nextBtnLabel = chainToAnnualInJan
        ? `Ver Resumen Anual ${annualYear} →`
        : (isLast ? (activeRecapMode === 'annual' ? `¡Listo para ${annualYear + 1}!` : '¡Listo, a romperla!') : 'Siguiente');

    container.innerHTML = `
        <div style="flex:1; overflow-y:auto; overflow-x:hidden; display:flex; flex-direction:column; justify-content:flex-start; padding-bottom:10px;">
            ${slides[activeRecapSlide]}
        </div>
        <div style="flex-shrink:0; padding-top:14px; border-top:1px solid var(--border-color); background:var(--bg-base); margin-top:auto;">
            <div class="onb-dots-row" style="margin-bottom:14px; display:flex; justify-content:center; gap:8px;">
                ${slides.map((_, i) => `<button type="button" class="onb-dot ${i === activeRecapSlide ? 'active' : ''}" data-recap-idx="${i}" style="width:${i === activeRecapSlide ? '22px' : '8px'}; height:8px; border-radius:99px; border:none; background:${i === activeRecapSlide ? 'var(--accent)' : 'color-mix(in srgb, var(--text-muted) 32%, transparent)'}; transition:all 0.25s ease; cursor:pointer; padding:0;"></button>`).join('')}
            </div>
            <div style="display:flex; gap:12px;">
                ${activeRecapSlide > 0 ? `<button type="button" id="btn-recap-prev" class="btn btn-secondary" style="flex:1; padding:14px; font-size:14px; font-weight:700; border-radius:16px;">Anterior</button>` : ''}
                <button type="button" id="btn-recap-next" class="btn btn-primary" style="flex:2; padding:14px; font-size:14.5px; border-radius:16px; font-weight:800;">${nextBtnLabel}</button>
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
        } else if (chainToAnnualInJan) {
            activeRecapMode = 'annual';
            activeRecapSlide = 0;
            renderMonthlyRecapView();
        } else {
            isAutoWelcomeRecap = false;
            document.getElementById('monthly-recap-modal')?.classList.add('hidden');
        }
    });
    container.querySelector('#btn-recap-do-backup')?.addEventListener('click', () => {
        document.getElementById('btn-export-data')?.click();
    });
    container.querySelector('#btn-recap-go-archive')?.addEventListener('click', () => {
        isAutoWelcomeRecap = false;
        document.getElementById('monthly-recap-modal')?.classList.add('hidden');
        document.getElementById('drawer-backup')?.click();
        setTimeout(() => {
            const yearInput = document.getElementById('archive-year-input');
            if (yearInput) {
                yearInput.value = annualData.year;
                yearInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                yearInput.focus();
            }
        }, 120);
    });
    container.querySelector('#btn-recap-go-save')?.addEventListener('click', () => {
        const targetPocket = data.pockets.find(p => stripLeadingEmoji(p.name) === data.closestPocket?.name) || data.pockets[0];
        if (!targetPocket) return;
        isAutoWelcomeRecap = false;
        document.getElementById('monthly-recap-modal')?.classList.add('hidden');
        openOmniModal({
            type: 'transfer',
            toAccount: targetPocket.id,
            amount: data.surplus,
            description: `Ahorro excedente (${data.closedMonthCap})`,
            lockType: true,
            hideRecurrence: true
        });
    });
    container.querySelector('#btn-recap-create-pocket')?.addEventListener('click', () => {
        isAutoWelcomeRecap = false;
        document.getElementById('monthly-recap-modal')?.classList.add('hidden');
        document.getElementById('drawer-pockets')?.click();
    });
    container.querySelector('#btn-recap-review-pending')?.addEventListener('click', () => {
        isAutoWelcomeRecap = false;
        document.getElementById('monthly-recap-modal')?.classList.add('hidden');
        const [y, m] = data.closedMonthId.split('-').map(Number);
        viewDate = new Date(y, m - 1, 1);
        activeHistoryFilter = 'pending';
        document.querySelectorAll('.pill-btn[data-filter]').forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === 'pending'));
        updateDashboard();
    });
};

window.renderMonthlyRecapView = renderMonthlyRecapView;

const checkAutoMonthlyWelcomeRecap = () => {
    if (typeof authData === 'undefined' || !authData) return;
    if (document.body.classList.contains('app-locked')) return;

    const currMonthId = getMonthId(currentDate);
    const lastSeenMonth = localStorage.getItem('myFinancesAutoRecapSeenMonth');

    if (lastSeenMonth !== currMonthId) {
        localStorage.setItem('myFinancesAutoRecapSeenMonth', currMonthId);
        const hasMovements = Array.isArray(financeData?.transactions) && financeData.transactions.some(t => !t.isDeleted);
        if (hasMovements) {
            setTimeout(() => {
                if (!document.body.classList.contains('app-locked')) {
                    openMonthlyRecapModal('monthly', true);
                }
            }, 420);
        }
    }
};

const initMonthlyRecapEntryPoints = () => {
    if (typeof setupSmartAdvisorsDrawer === 'function') setupSmartAdvisorsDrawer();
    if (!document.getElementById('drawer-month-recap')) {
        const healthItem = document.getElementById('drawer-health');
        if (healthItem && healthItem.parentElement) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'drawer-item';
            btn.id = 'drawer-month-recap';
            btn.innerHTML = `
                <div class="drawer-item-left">
                    <span class="drawer-icon-box" style="background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent);">
                        ${renderIcon('award', 17)}
                    </span>
                    <span>Resumen de Cierre</span>
                </div>
            `;
            healthItem.insertAdjacentElement('afterend', btn);
        }
    }

    const currMonthId = getMonthId(currentDate);
    const isJanuary = currentDate.getMonth() === 0;
    const dismissedMonth = localStorage.getItem('myFinancesRecapDismissedMonth');
    const dashContainer = document.getElementById('dashboard-widgets-container');

    if (dashContainer && dismissedMonth !== currMonthId && !document.getElementById('proactive-recap-banner')) {
        const closedDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const closedName = closedDate.toLocaleDateString('es-CO', { month: 'long' });
        const closedCap = closedName.charAt(0).toUpperCase() + closedName.slice(1);
        const incomingName = currentDate.toLocaleDateString('es-CO', { month: 'long' });
        const incomingCap = incomingName.charAt(0).toUpperCase() + incomingName.slice(1);
        const prevYear = currentDate.getFullYear() - 1;

        const banner = document.createElement('div');
        banner.id = 'proactive-recap-banner';
        banner.className = 'ios-alert-banner';
        banner.style.cssText = 'margin-bottom: 14px; cursor: pointer; border-left: 4px solid var(--accent);';
        banner.innerHTML = `
            <div class="ios-alert-info">
                <strong style="display:flex; align-items:center; gap:6px;">${renderIcon('award', 15)} ${isJanuary ? `Cierre de ${closedCap} y Año ${prevYear} listos` : `Cierre de ${closedCap} listo`}</strong>
                <small>${isJanuary ? `Revisa tu cierre de diciembre y el balance anual de ${prevYear}` : `Revisa tus logros, gráficas y plan para ${incomingCap}`}</small>
            </div>
            <div class="ios-alert-actions">
                <button type="button" class="btn-download-ics" id="btn-open-proactive-recap">Ver resumen</button>
                <button type="button" class="btn-dismiss-alert" id="btn-dismiss-proactive-recap" title="Ocultar este mes" aria-label="Ocultar">${renderIcon('check', 13)}</button>
            </div>
        `;
        banner.addEventListener('click', (e) => {
            if (e.target.closest('#btn-dismiss-proactive-recap')) return;
            openMonthlyRecapModal('monthly', false);
        });
        banner.querySelector('#btn-dismiss-proactive-recap')?.addEventListener('click', (e) => {
            e.stopPropagation();
            localStorage.setItem('myFinancesRecapDismissedMonth', currMonthId);
            banner.remove();
        });
        dashContainer.parentElement?.insertBefore(banner, dashContainer);
    }

    document.getElementById('welcome-form')?.addEventListener('submit', () => {
        localStorage.setItem('myFinancesAutoRecapSeenMonth', getMonthId(currentDate));
    });

    if (typeof authData !== 'undefined' && authData) {
        if (!document.body.classList.contains('app-locked')) {
            checkAutoMonthlyWelcomeRecap();
        } else {
            const unlockObserver = new MutationObserver(() => {
                if (!document.body.classList.contains('app-locked')) {
                    unlockObserver.disconnect();
                    checkAutoMonthlyWelcomeRecap();
                }
            });
            unlockObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }
    }
};

// ==========================================
// MÓDULO 14: ASESORES INTELIGENTES Y SIMULADORES DE CRÉDITO
// ==========================================
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

window.openCardAdvisorModal = () => {
    let modalEl = document.getElementById('card-advisor-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'card-advisor-modal';
        modalEl.className = 'modal hidden';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width:460px;">
                <div class="modal-header" style="align-items:flex-start; gap:10px;">
                    <div>
                        <h3 style="margin:0; font-size:18px; font-weight:800;">¿Con qué tarjeta pago hoy?</h3>
                        <small style="color:var(--text-muted); font-size:11.5px;">Compara días de gracia, cupo y exoneración de manejo</small>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Cerrar" style="flex-shrink:0;">Cerrar</button>
                </div>
                <div class="form-row" style="margin-bottom:12px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="white-space:nowrap;">Monto compra</label>
                        <input type="text" id="card-adv-amount" class="money-input" inputmode="decimal" placeholder="Opcional (0,00)">
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="white-space:nowrap;">Cuotas</label>
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
            ? `<span class="widget-badge danger" style="font-size:9.5px; flex-shrink:0;">Cupo insuficiente</span>`
            : (isBest ? `<span class="widget-badge good" style="font-size:9.5px; flex-shrink:0;">★ Mejor opción hoy</span>` : `<span class="widget-badge neutral" style="font-size:9.5px; flex-shrink:0;">#${idx + 1}</span>`);

        const hasZeroInterest = inst === 1 || (c.reasons || []).some(r => /sin interés|0%/i.test(r));
        const graceLabel = hasZeroInterest ? 'Plazo sin interés' : 'Primer pago';

        const cleanReasons = (c.reasons || []).map(r => {
            const match = r.match(/^\d+\s*días hasta el pago\s*\(([^)]+)\)/i);
            if (match) {
                const cutoffText = match[1].trim();
                return cutoffText.charAt(0).toUpperCase() + cutoffText.slice(1);
            }
            return r;
        });

        return `
            <div class="advisor-card ${isBest ? 'is-best' : ''} ${!c.hasEnoughCredit ? 'is-disabled' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                    <strong style="font-size:14px; color:var(--text-main);">${c.name}</strong>
                    ${badgeHtml}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size:11.5px; color:var(--text-muted); margin-bottom:6px;">
                    <span style="min-width:0;">${graceLabel}: <b style="color:var(--accent); white-space:nowrap;">${c.daysToPayment} días</b> <span style="white-space:nowrap;">(${c.payDateStr})</span></span>
                    <span style="white-space:nowrap; flex-shrink:0;">Disp: <b class="${c.hasEnoughCredit ? 'positive' : 'negative'}">${formatCompact(c.available)}</b></span>
                </div>
                <div style="font-size:11px; color:var(--text-muted); display:flex; flex-direction:column; gap:2px; margin-bottom:8px;">
                    ${cleanReasons.map(r => `<span>• ${r}</span>`).join('')}
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

window.openSmartPurchaseModal = () => {
    let modalEl = document.getElementById('smart-purchase-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'smart-purchase-modal';
        modalEl.className = 'modal hidden';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width:460px;">
                <div class="modal-header" style="align-items:flex-start; gap:10px;">
                    <div>
                        <h3 style="margin:0; font-size:18px; font-weight:800;">Simulador Compra Inteligente</h3>
                        <small style="color:var(--text-muted); font-size:11.5px;">Evalúa horas de trabajo, flujo de caja e intereses antes de comprar</small>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Cerrar" style="flex-shrink:0;">Cerrar</button>
                </div>

                <div class="form-group">
                    <label>¿Cuánto cuesta lo que quieres comprar? ($)</label>
                    <input type="text" id="sp-sim-amount" class="money-input" inputmode="decimal" placeholder="Ej. 450.000">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label style="white-space:nowrap;">Medio de pago</label>
                        <select id="sp-sim-method"></select>
                    </div>
                    <div class="form-group" id="sp-sim-inst-group">
                        <label style="white-space:nowrap;">Cuotas</label>
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
        methodSel.innerHTML = `<option value="cash">Efectivo / Débito</option>` +
            cards.map(c => `<option value="card::${c.id}">${stripLeadingEmoji(c.name)}</option>`).join('');
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

    let priorLowest = 0;
    if (typeof computeCashProjectionData === 'function') {
        const baseCash30 = computeCashProjectionData('30d');
        priorLowest = round2(baseCash30?.lowestBalance ?? 0);
    }

    let verdictTitle = res.verdictTitle;
    if (res.lowestAfter < 0 && priorLowest < 0) {
        if (Math.abs(res.lowestAfter - priorLowest) < 1) {
            verdictTitle = isCard
                ? 'Aviso: tu caja a 30 días ya venía en déficit (esta tarjeta no resta efectivo hoy)'
                : 'Aviso: tu caja proyectada a 30 días ya presentaba déficit previo';
        } else {
            verdictTitle = 'Alerta: tu caja a 30 días ya estaba en déficit y esta compra lo amplía';
        }
    }

    // Recomendador automático de cuotas cuando 1 cuota genera déficit
    let recommendationHtml = '';
    let recommendedInst = null;
    if (isCard && inst === 1 && (res.safeAfter < 0 || res.lowestAfter < 0)) {
        const candidateTerms = [2, 3, 6, 12, 24, 36];
        const targetLowest = priorLowest >= 0 ? 0 : priorLowest;
        let bestFit = null;

        for (const cand of candidateTerms) {
            const candRes = simulateSmartPurchase({
                amount: amt,
                installments: cand,
                paymentMethod: 'credit_card',
                cardId
            });
            if (candRes.safeAfter >= 0 && candRes.lowestAfter >= targetLowest) {
                bestFit = { inst: cand, res: candRes };
                break;
            }
        }

        if (bestFit) {
            recommendedInst = bestFit.inst;
            const interestNote = bestFit.res.isZeroInterest
                ? 'Sin intereses (0%)'
                : `Total con intereses: ${formatMoney(bestFit.res.totalCost)}`;

            recommendationHtml = `
                <div style="margin-top:10px; padding:11px 12px; border-radius:12px; background:rgba(16, 185, 129, 0.09); border:1px solid rgba(16, 185, 129, 0.32);">
                    <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px;">
                        <span style="width:20px; height:20px; border-radius:6px; background:rgba(16, 185, 129, 0.18); color:var(--positive); display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <div style="font-size:11.5px; line-height:1.4; color:var(--text-main);">
                            <strong style="display:block; color:var(--positive);">Alternativa recomendada: diferir a ${bestFit.inst} cuotas</strong>
                            <span style="color:var(--text-muted);">Cuota estimada: <b style="color:var(--text-main);">${formatMoney(bestFit.res.monthlyQuota)}/mes</b> • ${interestNote}</span>
                        </div>
                    </div>
                    <button type="button" id="btn-sp-apply-rec" class="mini-action-btn" style="width:100%; justify-content:center; font-size:11px; padding:6px 10px; color:var(--positive); border-color:rgba(16, 185, 129, 0.4); font-weight:700;">
                        Simular a ${bestFit.inst} cuotas
                    </button>
                </div>
            `;
        } else {
            const reliefRes = simulateSmartPurchase({
                amount: amt,
                installments: 12,
                paymentMethod: 'credit_card',
                cardId
            });
            recommendedInst = 12;
            recommendationHtml = `
                <div style="margin-top:10px; padding:10px 12px; border-radius:12px; background:rgba(245, 158, 11, 0.08); border:1px dashed rgba(245, 158, 11, 0.35);">
                    <div style="font-size:11px; line-height:1.4; color:var(--text-muted); margin-bottom:7px;">
                        <strong style="color:#d97706; display:block; margin-bottom:2px;">Impacto alto frente a tu Libre Seguro actual</strong>
                        <span>Incluso diferido, supera tu margen libre del mes. A <b>12 cuotas</b> reducirías el golpe mensual de ${formatMoney(amt)} a <b style="color:var(--text-main);">${formatMoney(reliefRes.monthlyQuota)}/mes</b> (Total: ${formatMoney(reliefRes.totalCost)}).</span>
                    </div>
                    <button type="button" id="btn-sp-apply-rec" class="mini-action-btn" style="width:100%; justify-content:center; font-size:11px; padding:6px 10px; color:#d97706; border-color:rgba(245, 158, 11, 0.4); font-weight:700;">
                        Ver simulación a 12 cuotas
                    </button>
                </div>
            `;
        }
    }

    const lifeHtml = res.hasSalary
        ? `<strong style="display:block; font-size:15px; color:var(--accent); white-space:nowrap;">${String(res.workHoursCost).replace('.', ',')} horas</strong><small style="display:block; font-size:10.5px; color:var(--text-muted); margin-top:1px; white-space:nowrap;">(${String(res.workDaysCost).replace('.', ',')} días laborales)</small>`
        : `<small style="color:var(--text-muted);">Configura tu nómina en Perfil para ver el costo en horas de trabajo.</small>`;

    const infoBtn = (targetId, label) => `
        <button type="button" aria-label="Explicación ${label}" onclick="document.getElementById('${targetId}')?.classList.toggle('hidden')" style="width:17px; height:17px; border-radius:50%; border:1px solid var(--border-color); background:var(--hover-bg); color:var(--text-muted); font-size:10px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; padding:0; cursor:pointer; flex-shrink:0;">i</button>
    `;

    box.innerHTML = `
        <div class="smart-verdict-box ${res.verdict}">
            <strong style="display:block; font-size:13px; color:var(--text-main); margin-bottom:4px; line-height:1.35;">${verdictTitle}</strong>
            <small style="color:var(--text-muted); font-size:11px;">Evaluado con ${res.methodLabel}${res.installments > 1 ? ` a ${res.installments} cuotas` : ''}</small>
        </div>

        <div class="sav-sim-card" style="display:flex; flex-direction:column; gap:10px; font-size:12px;">
            <div style="padding-bottom:9px; border-bottom:1px dashed var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <span style="color:var(--text-muted); font-weight:600; display:inline-flex; align-items:center; gap:5px; min-width:0;">
                        <span>Costo en tiempo de vida:</span>
                        ${infoBtn('sp-help-life', 'Costo en tiempo de vida')}
                    </span>
                    <div style="text-align:right; flex-shrink:0;">${lifeHtml}</div>
                </div>
                <div id="sp-help-life" class="hidden" style="margin-top:7px; padding:7px 9px; border-radius:8px; background:var(--hover-bg); font-size:11px; color:var(--text-muted); line-height:1.4;">
                    Divide el precio entre el valor real de tu hora laboral (calculado desde tu salario neto en Nómina) para mostrarte cuánto tiempo de trabajo te cuesta pagarlo.
                </div>
            </div>

            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <span style="color:var(--text-muted); font-weight:600; display:inline-flex; align-items:center; gap:5px;">
                        <span>Libre Seguro tras compra:</span>
                        ${infoBtn('sp-help-safe', 'Libre Seguro tras compra')}
                    </span>
                    <strong class="${res.safeAfter >= 0 ? 'positive' : 'negative'}" style="white-space:nowrap; flex-shrink:0;">${formatMoneyHtml(res.safeAfter)}</strong>
                </div>
                <div id="sp-help-safe" class="hidden" style="margin-top:7px; padding:7px 9px; border-radius:8px; background:var(--hover-bg); font-size:11px; color:var(--text-muted); line-height:1.4;">
                    Es el dinero que te sobra este mes tras cubrir gastos pendientes, presupuesto restante y cuotas de deudas. Si queda en negativo, comprometes dinero ya asignado.
                </div>
            </div>

            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <span style="color:var(--text-muted); font-weight:600; display:inline-flex; align-items:center; gap:5px;">
                        <span>Punto más bajo caja (30d):</span>
                        ${infoBtn('sp-help-cash', 'Punto más bajo caja')}
                    </span>
                    <strong class="${res.lowestAfter >= 0 ? 'positive' : 'negative'}" style="white-space:nowrap; flex-shrink:0;">${formatMoneyHtml(res.lowestAfter)}</strong>
                </div>
                <div id="sp-help-cash" class="hidden" style="margin-top:7px; padding:7px 9px; border-radius:8px; background:var(--hover-bg); font-size:11px; color:var(--text-muted); line-height:1.4;">
                    Proyecta día a día tu efectivo disponible durante los próximos 30 días cruzando fechas de pago de nómina, tarjetas y suscripciones, mostrando el saldo mínimo al que llegará tu caja.
                </div>
            </div>

            ${isCard && res.installments > 1 ? `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding-top:9px; border-top:1px dashed var(--border-color);">
                    <span style="color:var(--text-muted); font-weight:600;">Cuota mensual / Total:</span>
                    <div style="text-align:right; flex-shrink:0;">
                        <strong style="display:block; color:var(--text-main); white-space:nowrap;">${formatMoney(res.monthlyQuota)}/mes</strong>
                        <small style="display:block; font-size:11px; color:var(--text-muted); margin-top:1px; white-space:nowrap;">Total: <b class="${res.isZeroInterest ? 'positive' : 'negative'}">${formatMoney(res.totalCost)}</b></small>
                    </div>
                </div>
            ` : ''}
        </div>

        ${recommendationHtml}
    `;

    if (recommendedInst) {
        box.querySelector('#btn-sp-apply-rec')?.addEventListener('click', () => {
            const instSel = document.getElementById('sp-sim-installments');
            if (instSel) {
                instSel.value = String(recommendedInst);
                renderSmartPurchaseResults();
            }
        });
    }
};

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
            <div class="modal-content" style="max-width:480px; display:flex; flex-direction:column; max-height:88dvh; overflow:hidden; padding:0;">
                <div class="modal-header" style="align-items:flex-start; gap:10px; padding:18px 18px 12px 18px; margin-bottom:0; border-bottom:1px solid var(--border-color); flex-shrink:0; background:var(--card-bg);">
                    <div>
                        <h3 style="margin:0; font-size:18px; font-weight:800;">Simulador de Crédito</h3>
                        <small style="color:var(--text-muted); font-size:11.5px;">Proyecta cuotas, intereses y valida tu capacidad real</small>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Cerrar" style="flex-shrink:0;">Cerrar</button>
                </div>

                <div id="csim-view-single" style="flex:1; overflow-y:auto; padding:14px 18px 22px 18px; -webkit-overflow-scrolling:touch;">
                    <details class="changelog-accordion" style="width:100%; display:block; box-sizing:border-box; margin-bottom:14px; background:rgba(245, 158, 11, 0.07); border:1px solid rgba(245, 158, 11, 0.28); border-radius:14px; padding:11px 12px; box-shadow:none;">
                        <summary style="display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:800; color:#d97706; cursor:pointer;">
                            <span style="display:inline-flex; align-items:center; gap:7px;">
                                <span style="width:22px; height:22px; border-radius:7px; background:rgba(245, 158, 11, 0.16); display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    ${renderIcon('help', 13)}
                                </span>
                                <span>¿Cómo funciona este simulador?</span>
                            </span>
                            <span style="font-size:11px; opacity:0.85;">▾</span>
                        </summary>

                        <div style="margin-top:10px; padding-top:10px; border-top:1px dashed rgba(245, 158, 11, 0.3); display:flex; flex-direction:column; gap:8px;">
                            <div style="background:var(--card-inner-bg); border:1px solid var(--border-color); border-radius:11px; padding:10px 11px; display:flex; flex-direction:column; gap:9px; font-size:11.5px; color:var(--text-muted); line-height:1.4;">
                                <div style="display:flex; align-items:flex-start; gap:8px;">
                                    <span style="width:18px; height:18px; border-radius:50%; background:rgba(245, 158, 11, 0.16); color:#d97706; font-size:10px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;">1</span>
                                    <div><strong style="color:var(--text-main);">Amortización Francesa (Cuota Fija):</strong> Al inicio pagas mayor proporción de intereses y, conforme avanza el plazo, abonas más a capital.</div>
                                </div>
                                <div style="display:flex; align-items:flex-start; gap:8px; padding-top:8px; border-top:1px dashed var(--border-color);">
                                    <span style="width:18px; height:18px; border-radius:50%; background:rgba(245, 158, 11, 0.16); color:#d97706; font-size:10px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;">2</span>
                                    <div><strong style="color:var(--text-main);">Conversión Colombia (% E.A. ↔ % M.V.):</strong> Si ingresas tasa Efectiva Anual, se convierte automáticamente a tasa mensual con <code style="font-size:10.5px; color:var(--text-main);">(1 + E.A.)<sup>1/12</sup> − 1</code>.</div>
                                </div>
                                <div style="display:flex; align-items:flex-start; gap:8px; padding-top:8px; border-top:1px dashed var(--border-color);">
                                    <span style="width:18px; height:18px; border-radius:50%; background:rgba(245, 158, 11, 0.16); color:#d97706; font-size:10px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;">3</span>
                                    <div><strong style="color:var(--text-main);">Validación con tus finanzas:</strong> Cruza la cuota resultante contra tu <b style="color:var(--text-main);">capacidad saludable de endeudamiento</b> y tu <b style="color:var(--text-main);">flujo libre</b> tras gastos fijos.</div>
                                </div>
                            </div>

                            <div style="background:var(--card-inner-bg); border:1px solid color-mix(in srgb, var(--accent) 28%, var(--border-color)); border-radius:11px; padding:9px 10px;">
                                <button type="button" id="btn-csim-load-example" class="mini-action-btn" style="width:100%; padding:8px 10px; font-size:11.5px; font-weight:700; color:var(--accent); border-color:var(--accent-border); display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    <span>Probar ejemplo ($ 10.000.000 a 24 meses)</span>
                                </button>
                            </div>
                        </div>
                    </details>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:12px;">
                        <button type="button" class="sub-quick-chip" data-csim-preset="libre" style="width:100%; justify-content:center; text-align:center;">Libre Inversión</button>
                        <button type="button" class="sub-quick-chip" data-csim-preset="vehiculo" style="width:100%; justify-content:center; text-align:center;">Vehículo</button>
                        <button type="button" class="sub-quick-chip" data-csim-preset="vivienda" style="width:100%; justify-content:center; text-align:center;">Vivienda</button>
                        <button type="button" class="sub-quick-chip" data-csim-preset="max" style="width:100%; justify-content:center; text-align:center; color:var(--positive); border-color:color-mix(in srgb, var(--positive) 35%, transparent);">★ Cupo máximo</button>
                    </div>

                    <div class="sav-sim-card">
                        <div class="form-group">
                            <label>Monto a solicitar ($)</label>
                            <input type="text" id="csim-amount" class="money-input" inputmode="decimal" placeholder="Ej. 10.000.000">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label style="white-space:nowrap;">Plazo (meses)</label>
                                <input type="number" id="csim-months" min="1" max="360" placeholder="Ej. 24">
                            </div>
                            <div class="form-group">
                                <label style="white-space:nowrap;">Modalidad tasa</label>
                                <select id="csim-rate-type">
                                    <option value="annual" selected>% E.A.</option>
                                    <option value="monthly">% M.V.</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label style="white-space:nowrap;">Tasa de interés (%)</label>
                                <input type="text" id="csim-rate" inputmode="decimal" placeholder="Ej. 22">
                            </div>
                            <div class="form-group">
                                <label style="white-space:nowrap;">Seguro mensual ($)</label>
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
                    monthsEl.value = '24'; typeEl.value = 'annual'; rateEl.value = '22';
                } else if (preset === 'vehiculo') {
                    monthsEl.value = '48'; typeEl.value = 'annual'; rateEl.value = '16,5';
                } else if (preset === 'vivienda') {
                    monthsEl.value = '120'; typeEl.value = 'annual'; rateEl.value = '11,5';
                } else if (preset === 'max') {
                    if (!monthsEl.value) monthsEl.value = '24';
                    if (!rateEl.value) { typeEl.value = 'annual'; rateEl.value = '22'; }
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

    // Limpiar campos y colapsar guía al abrir para arrancar siempre en limpio
    ['#csim-amount', '#csim-months', '#csim-rate', '#csim-insurance', '#csim-extra'].forEach(sel => {
        const el = modalEl.querySelector(sel);
        if (el) el.value = '';
    });
    const rateTypeEl = modalEl.querySelector('#csim-rate-type');
    if (rateTypeEl) rateTypeEl.value = 'annual';
    modalEl.querySelector('details')?.removeAttribute('open');
    const scrollBody = modalEl.querySelector('#csim-view-single');
    if (scrollBody) scrollBody.scrollTop = 0;

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
            <div class="modal-content" style="max-width:480px; display:flex; flex-direction:column; max-height:88dvh; overflow:hidden; padding:0;">
                <div class="modal-header" style="align-items:flex-start; gap:10px; padding:18px 18px 12px 18px; margin-bottom:0; border-bottom:1px solid var(--border-color); flex-shrink:0; background:var(--card-bg);">
                    <div>
                        <h3 style="margin:0; font-size:18px; font-weight:800;">Banco A vs. Banco B</h3>
                        <small style="color:var(--text-muted); font-size:11.5px;">Compara ofertas y descubre cuál es más barata</small>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Cerrar" style="flex-shrink:0;">Cerrar</button>
                </div>

                <div id="csim-view-compare" style="flex:1; overflow-y:auto; padding:14px 18px 22px 18px; -webkit-overflow-scrolling:touch;">
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

    // Iniciar siempre con todos los campos vacíos y guía colapsada
    ['#ccmp-amount', '#ccmp-a-name', '#ccmp-a-months', '#ccmp-a-rate', '#ccmp-a-ins', '#ccmp-a-fee', '#ccmp-b-name', '#ccmp-b-months', '#ccmp-b-rate', '#ccmp-b-ins', '#ccmp-b-fee'].forEach(sel => {
        const el = modalEl.querySelector(sel);
        if (el) el.value = '';
    });
    const rateA = modalEl.querySelector('#ccmp-a-rate-type');
    const rateB = modalEl.querySelector('#ccmp-b-rate-type');
    if (rateA) rateA.value = 'annual';
    if (rateB) rateB.value = 'annual';
    modalEl.querySelector('details')?.removeAttribute('open');
    const scrollBody = modalEl.querySelector('#csim-view-compare');
    if (scrollBody) scrollBody.scrollTop = 0;

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
            <td style="text-align:left; white-space:nowrap; font-weight:700; color:var(--text-muted);">#${r.period}</td>
            <td style="white-space:nowrap;">${formatCompact(round2(r.payment + res.monthlyInsurance))}</td>
            <td class="positive" style="white-space:nowrap;">${formatCompact(r.principal)}</td>
            <td class="negative" style="white-space:nowrap;">${formatCompact(r.interest)}</td>
            <td style="white-space:nowrap;"><b>${formatCompact(r.balance)}</b></td>
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

        <div class="sav-sim-card" style="display:flex; flex-direction:column; gap:10px; padding:13px 14px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; font-size:12.5px;">
                <span style="color:var(--text-muted); font-weight:600;">Monto pedido</span>
                <strong style="color:var(--text-main); font-size:13.5px; white-space:nowrap;">${formatMoneyHtml(res.principal)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; font-size:12.5px;">
                <span style="color:var(--text-muted); font-weight:600;">Intereses + Seguros</span>
                <strong class="negative" style="font-size:13.5px; white-space:nowrap;">${formatMoneyHtml(round2(res.totalInterest + res.totalInsurance))}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding-top:10px; border-top:1px dashed var(--border-color); font-size:13px;">
                <span style="color:var(--text-main); font-weight:800;">Total a pagar</span>
                <strong style="color:var(--text-main); font-size:15.5px; font-weight:800; white-space:nowrap;">${formatMoneyHtml(res.totalCost)}</strong>
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
            <div class="table-responsive" style="margin-top:8px; max-height:220px; overflow-y:auto; overflow-x:auto; -webkit-overflow-scrolling:touch; width:100%;">
                <table class="amort-table" style="font-size:10.5px; width:100%; min-width:340px; border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left; white-space:nowrap;">#</th>
                            <th style="white-space:nowrap;">Cuota</th>
                            <th style="white-space:nowrap;">Capital</th>
                            <th style="white-space:nowrap;">Interés</th>
                            <th style="white-space:nowrap;">Saldo</th>
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
    const aMonthsRaw = (document.getElementById('ccmp-a-months')?.value || '').trim();
    const bMonthsRaw = (document.getElementById('ccmp-b-months')?.value || '').trim();
    const aRateRaw = (document.getElementById('ccmp-a-rate')?.value || '').trim();
    const bRateRaw = (document.getElementById('ccmp-b-rate')?.value || '').trim();
    const aIns = parseMoneyInput(document.getElementById('ccmp-a-ins')?.value);
    const bIns = parseMoneyInput(document.getElementById('ccmp-b-ins')?.value);
    const aFee = parseMoneyInput(document.getElementById('ccmp-a-fee')?.value);
    const bFee = parseMoneyInput(document.getElementById('ccmp-b-fee')?.value);

    const hasAnyOfferData = !!(aMonthsRaw || bMonthsRaw || aRateRaw || bRateRaw || aIns > 0 || bIns > 0 || aFee > 0 || bFee > 0);

    if (principal <= 0 || !hasAnyOfferData) {
        box.innerHTML = `
            <div class="sav-sim-card" style="text-align:center; padding:20px 14px;">
                <strong style="display:block; font-size:13px; color:var(--text-main); margin-bottom:4px;">Comparativa lista para calcular</strong>
                <small style="color:var(--text-muted); font-size:11.5px;">Ingresa el monto del crédito y las condiciones de cada banco para descubrir cuál es más económico.</small>
            </div>
        `;
        return;
    }

    const cmp = compareCreditOffers({
        principal,
        offerA: {
            name: document.getElementById('ccmp-a-name')?.value,
            periods: aMonthsRaw,
            rateType: document.getElementById('ccmp-a-rate-type')?.value,
            rate: (aRateRaw || '0').replace(',', '.'),
            monthlyInsurance: aIns,
            upfrontFee: aFee
        },
        offerB: {
            name: document.getElementById('ccmp-b-name')?.value,
            periods: bMonthsRaw,
            rateType: document.getElementById('ccmp-b-rate-type')?.value,
            rate: (bRateRaw || '0').replace(',', '.'),
            monthlyInsurance: bIns,
            upfrontFee: bFee
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

        <div class="sav-sim-card" style="padding:12px 14px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; padding-bottom:8px; border-bottom:1px solid var(--border-color); font-size:11.5px; font-weight:800;">
                <span style="color:var(--accent); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${resA.name}</span>
                <span style="text-align:right; color:var(--positive); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${resB.name}</span>
            </div>

            <div style="padding:8px 0; border-bottom:1px dashed var(--border-color);">
                <div style="font-size:11px; color:var(--text-muted); font-weight:600; margin-bottom:3px;">Cuota mensual</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12.5px; font-variant-numeric:tabular-nums;">
                    <strong style="white-space:nowrap; ${resA.monthlyQuota <= resB.monthlyQuota ? 'color:var(--positive);' : 'color:var(--text-main);'}">${formatCompact(resA.monthlyQuota)}</strong>
                    <strong style="text-align:right; white-space:nowrap; ${resB.monthlyQuota <= resA.monthlyQuota ? 'color:var(--positive);' : 'color:var(--text-main);'}">${formatCompact(resB.monthlyQuota)}</strong>
                </div>
            </div>

            <div style="padding:8px 0; border-bottom:1px dashed var(--border-color);">
                <div style="font-size:11px; color:var(--text-muted); font-weight:600; margin-bottom:3px;">Tasa (% E.A.)</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12.5px; font-variant-numeric:tabular-nums;">
                    <span style="white-space:nowrap; color:var(--text-main);">${String(resA.effectiveAnnualRatePct).replace('.', ',')}%</span>
                    <span style="text-align:right; white-space:nowrap; color:var(--text-main);">${String(resB.effectiveAnnualRatePct).replace('.', ',')}%</span>
                </div>
            </div>

            <div style="padding:8px 0; border-bottom:1px dashed var(--border-color);">
                <div style="font-size:11px; color:var(--text-muted); font-weight:600; margin-bottom:3px;">Total intereses</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12.5px; font-variant-numeric:tabular-nums;">
                    <span class="negative" style="white-space:nowrap; font-weight:600;">${formatCompact(resA.totalInterest)}</span>
                    <span class="negative" style="text-align:right; white-space:nowrap; font-weight:600;">${formatCompact(resB.totalInterest)}</span>
                </div>
            </div>

            <div style="padding:8px 0; border-bottom:1px dashed var(--border-color);">
                <div style="font-size:11px; color:var(--text-muted); font-weight:600; margin-bottom:3px;">Seguros + Com.</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12.5px; font-variant-numeric:tabular-nums;">
                    <span style="white-space:nowrap; color:var(--text-main);">${formatCompact(extrasA)}</span>
                    <span style="text-align:right; white-space:nowrap; color:var(--text-main);">${formatCompact(extrasB)}</span>
                </div>
            </div>

            <div style="padding-top:9px;">
                <div style="font-size:11.5px; color:var(--text-main); font-weight:800; margin-bottom:3px;">Total real</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13.5px; font-weight:800; font-variant-numeric:tabular-nums;">
                    <span style="white-space:nowrap; ${winner === 'A' ? 'color:var(--positive);' : 'color:var(--text-main);'}">${formatCompact(resA.totalCost)}</span>
                    <span style="text-align:right; white-space:nowrap; ${winner === 'B' ? 'color:var(--positive);' : 'color:var(--text-main);'}">${formatCompact(resB.totalCost)}</span>
                </div>
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

// ==========================================
// MÓDULO 15: RESPALDO JSON/CSV, CIERRE DE AÑO Y PREFERENCIAS DE PERFIL
// ==========================================
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
        updateDashboard();
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
        const result = await archiveYearData(targetYear);
        if (result.success) {
            if (result.deleted > 0) {
                alert(`✅ Cierre exitoso.\n\nSe comprimieron ${result.deleted} movimientos antiguos en ${result.added} saldos consolidados.\nEl historial detallado está a salvo en IndexedDB y tu localStorage ahora es más rápido.`);
                document.getElementById('archive-year-input').value = '';
                updateDashboard();
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

// Controles de Tema, Moneda, Notificaciones, Seguridad y Liquidez
document.getElementById('menu-theme-btn')?.addEventListener('click', () => {
    const compactCheck = document.getElementById('profile-use-compact-numbers');
    if (compactCheck) compactCheck.checked = !!financeData.useCompactNumbers;
});

document.getElementById('profile-use-compact-numbers')?.addEventListener('change', (e) => {
    financeData.useCompactNumbers = !!e.target.checked;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    updateDashboard();
});

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

document.getElementById('profile-enable-animations')?.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    document.body.classList.toggle('no-animations', !isEnabled);
    financeData.preferences = financeData.preferences || {};
    financeData.preferences.disableAnimations = !isEnabled;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
});

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
});

document.getElementById('btn-save-rates')?.addEventListener('click', () => {
    const usd = parseMoneyInput(document.getElementById('rate-usd-input').value) || 4150;
    const eur = parseMoneyInput(document.getElementById('rate-eur-input').value) || 4420;
    
    const prevInf = parseFloat((document.getElementById('rate-inf-prev-input').value || '0').replace(',', '.')) || 0;
    const currInf = parseFloat((document.getElementById('rate-inf-curr-input').value || '0').replace(',', '.')) || 0;

    if (!financeData.exchangeRates) financeData.exchangeRates = {};
    financeData.exchangeRates.USD = usd;
    financeData.exchangeRates.EUR = eur;
    financeData.exchangeRates.infPrev = prevInf;
    financeData.exchangeRates.infCurr = currInf;
    
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    alert('Tasas e indicadores actualizados correctamente.');
});

document.getElementById('menu-currency-btn')?.addEventListener('click', () => {
    const rates = financeData.exchangeRates || { USD: 4150, EUR: 4420, infPrev: 9.28, infCurr: 7.16 };
    const usdInput = document.getElementById('rate-usd-input');
    const eurInput = document.getElementById('rate-eur-input');
    const infPrevInput = document.getElementById('rate-inf-prev-input');
    const infCurrInput = document.getElementById('rate-inf-curr-input');
    
    const currentYear = new Date().getFullYear();
    const lblPrev = document.getElementById('label-inf-prev');
    const lblCurr = document.getElementById('label-inf-curr');
    if (lblPrev) lblPrev.innerText = `Cierre Dic. ${currentYear - 1} (%)`;
    if (lblCurr) lblCurr.innerText = `Promedio ${currentYear} (%)`;

    if (usdInput) usdInput.value = formatNumberInput(rates.USD);
    if (eurInput) eurInput.value = formatNumberInput(rates.EUR);
    if (infPrevInput) infPrevInput.value = String(rates.infPrev || 0).replace('.', ',');
    if (infCurrInput) infCurrInput.value = String(rates.infCurr || 0).replace('.', ',');
});

document.getElementById('btn-sync-rates')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = '↻ Consultando...';
    btn.disabled = true;

    try {
        if (!navigator.onLine) throw new Error('No hay conexión a internet.');

        // 1. Tasa de Cambio (USD / EUR)
        const resUsd = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!resUsd.ok) throw new Error('Error (USD).');
        const dataUsd = await resUsd.json();
        const usdCop = dataUsd.rates.COP;

        const resEur = await fetch('https://open.er-api.com/v6/latest/EUR');
        if (!resEur.ok) throw new Error('Error (EUR).');
        const dataEur = await resEur.json();
        const eurCop = dataEur.rates.COP;

        // 2. Inflación (API Banco Mundial IPC Colombia FP.CPI.TOTL.ZG)
        let infPrev = 0, infCurr = 0;
        try {
            const resInf = await fetch('https://api.worldbank.org/v2/country/CO/indicator/FP.CPI.TOTL.ZG?format=json');
            if (resInf.ok) {
                const dataInf = await resInf.json();
                if (dataInf && dataInf[1] && dataInf[1].length >= 2) {
                    const validData = dataInf[1].filter(d => d.value !== null);
                    if (validData.length >= 2) {
                        infCurr = round2(validData[0].value); 
                        infPrev = round2(validData[1].value); 
                    }
                }
            }
        } catch (err) {
            console.warn('No se pudo cargar inflación del Banco Mundial, usando fallback.');
        }

        if (usdCop && eurCop) {
            const usdInput = document.getElementById('rate-usd-input');
            const eurInput = document.getElementById('rate-eur-input');
            const infPrevInput = document.getElementById('rate-inf-prev-input');
            const infCurrInput = document.getElementById('rate-inf-curr-input');
            
            if (usdInput) usdInput.value = formatNumberInput(usdCop);
            if (eurInput) eurInput.value = formatNumberInput(eurCop);
            if (infCurr > 0 && infCurrInput) infCurrInput.value = String(infCurr).replace('.', ',');
            if (infPrev > 0 && infPrevInput) infPrevInput.value = String(infPrev).replace('.', ',');

            if (!financeData.exchangeRates) financeData.exchangeRates = {};
            financeData.exchangeRates.USD = round2(usdCop);
            financeData.exchangeRates.EUR = round2(eurCop);
            if (infPrev > 0) financeData.exchangeRates.infPrev = infPrev;
            if (infCurr > 0) financeData.exchangeRates.infCurr = infCurr;
            
            localStorage.setItem('myFinances', JSON.stringify(financeData));

            alert(`✅ Consulta exitosa:\n\n1 USD = ${formatMoney(usdCop)} COP\n1 EUR = ${formatMoney(eurCop)} COP\nInflación ref.: ${infCurr > 0 ? infCurr : 'Sin datos'}%`);
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

document.getElementById('account-include-liquidity')?.addEventListener('change', (e) => {
    const accountId = document.getElementById('reconcile-account-id')?.value;
    const acc = financeData.customAccounts.find(a => a.id === accountId);
    if (!acc) return;
    acc.excludeFromLiquidity = !e.target.checked;
    localStorage.setItem('myFinances', JSON.stringify(financeData));
    hasUnsavedChanges = false; updateDashboard();
});

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
    hasUnsavedChanges = false; 
    alert('Preferencias de alertas guardadas.');
    updateDashboard();
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

document.getElementById('transfer-payment-mode')?.addEventListener('change', (e) => {
    const strategyGroup = document.getElementById('extraordinary-strategy-group');
    if (e.target.value === 'extraordinary') strategyGroup?.classList.remove('hidden');
    else strategyGroup?.classList.add('hidden');
});

document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-earnings-faq') || e.target.closest('#btn-pockets-faq')) {
        document.getElementById('pockets-faq-modal')?.classList.remove('hidden');
    }
    if (e.target.closest('#close-pockets-faq-btn')) {
        document.getElementById('pockets-faq-modal')?.classList.add('hidden');
    }
    if (e.target.closest('#close-pockets-earnings-btn')) {
        document.getElementById('pockets-earnings-modal')?.classList.add('hidden');
    }
    if (e.target.closest('#btn-earnings-prev-window')) {
        earningsChartOffset++;
        selectedEarningsMonthKey = null;
        renderPocketsEarningsDashboard();
    }
    if (e.target.closest('#btn-earnings-next-window')) {
        if (earningsChartOffset > 0) {
            earningsChartOffset--;
            selectedEarningsMonthKey = null;
            renderPocketsEarningsDashboard();
        }
    }
});

// ==========================================
// MÓDULO 16: SERVICE WORKER Y ARRANQUE ÚNICO DE LA APLICACIÓN
// ==========================================
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

const bootApp = () => {
    if (financeData.preferences?.disableAnimations) {
        document.body.classList.add('no-animations');
        const animSwitch = document.getElementById('profile-enable-animations');
        if (animSwitch) animSwitch.checked = false;
    }

    applyColorModeUI(localStorage.getItem('myFinancesColorMode') || 'auto');
    applyThemeUI(localStorage.getItem('myFinancesTheme') || 'purple');
    initOnboardingCarousel();
    setupSavingsDrawerAccordion();
    setupSmartAdvisorsDrawer();
    applyWidgetOrder();
    initDashboardDragAndControls();
    toggleLiquidityHint('new-account-liquidity', 'new-account-liquidity-hint');
    toggleLiquidityHint('account-include-liquidity', 'edit-account-liquidity-hint');
    syncCycleStartDayUI();
    updateCycleRangeBadge();
    updateTrashBadge();
    renderAccountSelects();
    renderCategoryOptions('expense');
    renderTaxParamsUI();
    renderSalaryUI(false);
    initAuthUI(false);
    updateDashboard();
    initMonthlyRecapEntryPoints();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
} else {
    bootApp();
}
// ==========================================
// SINCRONIZACIÓN SELECTOR SEGMENTADO TRANSACCIÓN
// ==========================================
window.syncTxTypeSegmentedUI = () => {
    const typeSel = document.getElementById('type');
    const segWrap = document.getElementById('tx-type-segmented');
    if (!typeSel || !segWrap) return;

    const currentType = typeSel.value || 'expense';
    const isEditing = !!(document.getElementById('edit-id')?.value);

    // 1. Marcar botón activo
    segWrap.querySelectorAll('.tx-type-btn').forEach(btn => {
        const isMatch = btn.dataset.type === currentType;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });

    // 2. Configuración visual por tipo
    const presets = {
        expense: {
            title: 'Nuevo Gasto',
            placeholder: 'Ej. Almuerzo, transporte, supermercado...',
            btnText: 'Guardar Gasto',
            btnBg: 'var(--negative, #ff3b30)',
            amountTint: 'rgba(255, 59, 48, 0.04)',
            amountBorder: 'rgba(255, 59, 48, 0.32)',
            modalBorder: 'var(--negative, #ff3b30)',
            modalShadow: '0 14px 38px rgba(255, 59, 48, 0.16)'
        },
        income: {
            title: 'Nuevo Ingreso',
            placeholder: 'Ej. Pago nómina, venta, reembolso...',
            btnText: 'Guardar Ingreso',
            btnBg: 'var(--positive, #10b981)',
            amountTint: 'rgba(52, 199, 89, 0.05)',
            amountBorder: 'rgba(52, 199, 89, 0.35)',
            modalBorder: 'var(--positive, #10b981)',
            modalShadow: '0 14px 38px rgba(16, 185, 129, 0.16)'
        },
        transfer: {
            title: 'Nueva Transferencia',
            placeholder: 'Ej. Paso a bolsillo, pago tarjeta...',
            btnText: 'Registrar Transferencia',
            btnBg: '#007aff',
            amountTint: 'rgba(0, 122, 255, 0.04)',
            amountBorder: 'rgba(0, 122, 255, 0.32)',
            modalBorder: '#007aff',
            modalShadow: '0 14px 38px rgba(0, 122, 255, 0.18)'
        }
    };

    const cfg = presets[currentType] || presets.expense;

    // 3. Borde exterior de la ventana sincronizado con el tipo de transacción
    const modalContent = document.querySelector('#transaction-modal .modal-content');
    if (modalContent) {
        modalContent.style.setProperty('border', `2px solid ${cfg.modalBorder}`, 'important');
        modalContent.style.setProperty('box-shadow', cfg.modalShadow, 'important');
    }

    // 4. Actualizar título (solo si es registro nuevo) y placeholder
    const titleEl = document.getElementById('modal-title');
    if (titleEl && !isEditing) titleEl.innerText = cfg.title;

    const descInput = document.getElementById('description');
    if (descInput) descInput.placeholder = cfg.placeholder;

    // 5. Tinte sutil en campo de monto y color del botón principal de guardado
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.style.backgroundColor = cfg.amountTint;
        amountInput.style.borderColor = cfg.amountBorder;
    }

    const submitBtn = document.querySelector('#transaction-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.style.backgroundColor = cfg.btnBg;
        submitBtn.style.borderColor = cfg.btnBg;
        if (!isEditing) submitBtn.innerText = cfg.btnText;
    }
};

// Clic en cualquiera de los 3 botones segmentados
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#tx-type-segmented .tx-type-btn');
    if (!btn) return;
    const typeSel = document.getElementById('type');
    if (!typeSel) return;

    const nextType = btn.dataset.type;
    if (typeSel.value !== nextType) {
        typeSel.value = nextType;
        typeSel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    window.syncTxTypeSegmentedUI();
});

// Sincronizar cuando #type cambie externamente o se abra el modal (ej. Modo Edición)
document.getElementById('type')?.addEventListener('change', () => {
    window.syncTxTypeSegmentedUI();
});

const segTxModal = document.getElementById('transaction-modal');
if (segTxModal) {
    const segModalObserver = new MutationObserver(() => {
        if (!segTxModal.classList.contains('hidden')) {
            window.syncTxTypeSegmentedUI();
            setTimeout(window.syncTxTypeSegmentedUI, 25);
        }
    });
    segModalObserver.observe(segTxModal, { attributes: true, attributeFilter: ['class'] });
}
// ==========================================
// AISLAMIENTO VISUAL DE PRESUPUESTO EN MODAL DE GASTO (MODO VIAJE)
// ==========================================
const syncTripBudgetIsolationInModal = () => {
    const modalEl = document.getElementById('transaction-modal');
    if (!modalEl || modalEl.classList.contains('hidden')) return;

    const trip = financeData.tripMode;
    const txType = (document.getElementById('type')?.value || 'expense').toLowerCase();
    const isIsolatedTrip = !!(trip && trip.active && trip.isolateBudget !== false && txType === 'expense');

    const infoBanner = document.getElementById('tx-budget-info-banner');
    if (infoBanner && isIsolatedTrip && !infoBanner.innerHTML.includes('Presupuesto aislado (Modo Viaje)')) {
        const st = typeof computeActiveTripStats === 'function'
            ? computeActiveTripStats()
            : { spent: 0, budget: 0, remaining: 0, slug: 'viaje' };

        const tripSubInfo = st.budget > 0
            ? `Tope viaje: ${formatMoney(st.budget)} • Quedan: <b>${formatMoney(st.remaining)}</b>`
            : `Acumulado en #${st.slug}: <b>${formatMoney(st.spent)}</b>`;

        infoBanner.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; margin-bottom:2px;">
                <span style="color:#0ea5e9; font-weight:800;">Presupuesto aislado (Modo Viaje)</span>
                <span style="font-size:10.5px; font-weight:700; color:var(--positive);">No suma al mes</span>
            </div>
            <small style="display:block; font-size:10.5px; color:var(--text-muted);">${tripSubInfo}</small>
        `;
    }

    // Ocultar la alerta de Diferencia / Variación del presupuesto mensual normal
    modalEl.querySelectorAll('.glass-sub-box, [id*="variance"], [id*="diff"]').forEach(el => {
        if (el.id === 'tx-budget-info-banner') return;
        if (el.textContent && el.textContent.includes('Variación:') && el.textContent.includes('Diferencia:')) {
            el.style.display = isIsolatedTrip ? 'none' : '';
        }
    });
};

const txBudgetBannerEl = document.getElementById('tx-budget-info-banner');
if (txBudgetBannerEl) {
    new MutationObserver(syncTripBudgetIsolationInModal).observe(txBudgetBannerEl, { childList: true, subtree: true });
}
['trans-category', 'amount', 'type'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', syncTripBudgetIsolationInModal);
    document.getElementById(id)?.addEventListener('input', syncTripBudgetIsolationInModal);
});
// ==========================================
// ESCUDO DEFINITIVO CONTRA AUTOCOMPLETADO (NIVEL KERNEL)
// ==========================================
let txManualCategory = null;

// Detectar si el usuario elige la categoría a mano
document.getElementById('trans-category')?.addEventListener('change', (e) => {
    if (e.isTrusted) txManualCategory = e.target.value;
});

const applyKernelShield = () => {
    const accSelect = document.getElementById('account');
    const catSelect = document.getElementById('trans-category');

    if (accSelect && !accSelect.dataset.kernelShield) {
        accSelect.dataset.kernelShield = '1';
        const origAccSet = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
        Object.defineProperty(accSelect, 'value', {
            set(val) {
                const trip = financeData.tripMode;
                const isSharedOn = !!document.getElementById('tx-is-shared-check')?.checked;
                const payerVal = document.getElementById('tx-hidden-payer')?.value || 'me';
                
                // Si estás en viaje y pagó el acompañante, rechaza cualquier intento de la IA de cambiar la cuenta
                if (trip && trip.active && trip.isShared && isSharedOn && payerVal === 'companion') {
                    if (val !== 'CxC_Gastos_Acompanante') return; 
                }
                origAccSet.call(this, val);
            },
            get() { return Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').get.call(this); }
        });
    }

    if (catSelect && !catSelect.dataset.kernelShield) {
        catSelect.dataset.kernelShield = '1';
        const origCatSet = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
        Object.defineProperty(catSelect, 'value', {
            set(val) {
                // Si el usuario ya eligió una categoría manualmente en este registro, rechaza el autocompletado
                if (txManualCategory && val !== txManualCategory) return; 
                origCatSet.call(this, val);
            },
            get() { return Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').get.call(this); }
        });
    }
};

// Activar el escudo y limpiar memoria manual cada vez que se abre el modal
const shieldTxModal = document.getElementById('transaction-modal');
if (shieldTxModal) {
    new MutationObserver(() => {
        if (!shieldTxModal.classList.contains('hidden')) {
            txManualCategory = null;
            applyKernelShield();
        }
    }).observe(shieldTxModal, { attributes: true, attributeFilter: ['class'] });
}
// ==========================================
// MÓDULO 16: RECOMENDADOR INTELIGENTE DE SALIDA DE DEUDAS
// ==========================================
const renderDebtPlannerSmartRecommendation = () => {
    const box = document.getElementById('planner-smart-recommendation');
    const methodSel = document.getElementById('planner-method');
    if (!box || !methodSel || typeof financeData === 'undefined') return;

    const activeDebts = (financeData.customAccounts || [])
        .filter(a => (a.category === 'debt' || a.category === 'credit_card') && round2(currentBalances[a.id] || 0) > 0)
        .map(a => {
            const bal = round2(currentBalances[a.id] || 0);
            const rawRate = parseFloat(a.debtRate ?? a.interestRate ?? 0) || 0;
            const eaRate = rawRate <= 0
                ? 0
                : (a.debtRateType === 'monthly' ? round2((Math.pow(1 + rawRate / 100, 12) - 1) * 100) : round2(rawRate));
            const minQuota = a.category === 'credit_card'
                ? (typeof calculateCardMinPaymentEstimate === 'function' ? calculateCardMinPaymentEstimate(a, bal).totalMinPayment : 0)
                : (typeof getDebtMonthlyQuotaBreakdown === 'function' ? getDebtMonthlyQuotaBreakdown(a, bal).totalQuota : (a.debtMonthlyPayment || 0));
            return {
                id: a.id,
                name: typeof stripLeadingEmoji === 'function' ? stripLeadingEmoji(a.name) : a.name,
                bal,
                eaRate,
                minQuota: round2(minQuota)
            };
        })
        .filter(d => d.eaRate > 0);

    if (activeDebts.length === 0) {
        box.classList.add('hidden');
        box.innerHTML = '';
        return;
    }

    const byRate = [...activeDebts].sort((a, b) => b.eaRate - a.eaRate || a.bal - b.bal);
    const byBalance = [...activeDebts].sort((a, b) => a.bal - b.bal || b.eaRate - a.eaRate);

    const topAvalanche = byRate[0];
    const topSnowball = byBalance[0];
    const currentMethod = methodSel.value || 'avalanche';

    let recMethod = 'avalanche';
    let recTitle = 'Te conviene más: Método Avalancha';
    let recReason = '';

    if (activeDebts.length === 1 || topAvalanche.id === topSnowball.id) {
        recMethod = 'avalanche';
        recTitle = 'Punto de partida ideal: Método Avalancha';
        recReason = activeDebts.length === 1
            ? `Solo tienes una obligación con interés activo (<b>${topAvalanche.name}</b> al <b>${String(topAvalanche.eaRate).replace('.', ',')}% E.A.</b>), así que ambos métodos siguen exactamente la misma ruta.`
            : `Tu deuda más cara (<b>${topAvalanche.name}</b>, ${String(topAvalanche.eaRate).replace('.', ',')}% E.A.) también es la de menor saldo (<b>${formatCompact(topAvalanche.bal)}</b>). Ambos métodos la atacan primero.`;
    } else {
        const rateSpread = round2(topAvalanche.eaRate - topSnowball.eaRate);
        const cap = typeof computeDetailedBorrowingCapacity === 'function'
            ? computeDetailedBorrowingCapacity(getMonthId(currentDate))
            : { usedPct: 0, freeCashFlow: 1 };
        const highBurden = cap.usedPct > 35 || cap.freeCashFlow < 0;
        const quickWin = topSnowball.bal <= Math.max(1500000, topAvalanche.bal * 0.35);

        if (activeDebts.length >= 3 && highBurden && quickWin && rateSpread < 10) {
            recMethod = 'snowball';
            recTitle = 'Te conviene más: Método Bola de Nieve';
            recReason = `Tu carga de deuda está al <b>${String(cap.usedPct).replace('.', ',')}%</b> y tienes ${activeDebts.length} obligaciones activas. Liquidar primero <b>${topSnowball.name}</b> (<b>${formatCompact(topSnowball.bal)}</b>) libera rápido una cuota de <b>${formatCompact(topSnowball.minQuota)}/mes</b> y te da oxígeno en caja.`;
        } else {
            recMethod = 'avalanche';
            recTitle = 'Te conviene más: Método Avalancha';
            recReason = `<b>${topAvalanche.name}</b> tiene una tasa del <b>${String(topAvalanche.eaRate).replace('.', ',')}% E.A.</b> (${String(rateSpread).replace('.', ',')} puntos más cara que <b>${topSnowball.name}</b>). Priorizarla evita que los intereses sigan creciendo y maximiza tu ahorro total.`;
        }
    }

    const isApplied = currentMethod === recMethod;
    const targetLabel = recMethod === 'avalanche' ? 'Avalancha' : 'Bola de Nieve';

    box.classList.remove('hidden');
    box.innerHTML = `
        <div class="planner-smart-rec-card">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="font-size:9.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; color:var(--accent);">Sugerencia según tus finanzas</span>
                ${isApplied
                    ? `<span class="widget-badge good" style="font-size:9.5px; padding:2px 7px;">✓ Activo</span>`
                    : `<button type="button" id="btn-apply-rec-method" class="mini-action-btn" style="font-size:10px; padding:3px 8px;">Usar ${targetLabel}</button>`}
            </div>
            <strong style="display:block; font-size:12.5px; font-weight:800; color:var(--text-main); margin-bottom:3px;">${recTitle}</strong>
            <small style="display:block; font-size:11px; color:var(--text-muted); line-height:1.4;">${recReason}</small>
        </div>
    `;

    box.querySelector('#btn-apply-rec-method')?.addEventListener('click', () => {
        methodSel.value = recMethod;
        methodSel.dispatchEvent(new Event('change'));
    });
};

const debtPlannerModalEl = document.getElementById('debt-planner-modal');
if (debtPlannerModalEl) {
    const plannerObs = new MutationObserver(() => {
        if (!debtPlannerModalEl.classList.contains('hidden')) {
            renderDebtPlannerSmartRecommendation();
        }
    });
    plannerObs.observe(debtPlannerModalEl, { attributes: true, attributeFilter: ['class'] });
    document.getElementById('planner-method')?.addEventListener('change', renderDebtPlannerSmartRecommendation);
}
// ==========================================
// MÓDULO 17: CUADRE RÁPIDO DE EXTRACTO DE TARJETA / CUPO
// ==========================================
window.openCardStatementChargeModal = (acc, currentBal, est) => {
    let modalEl = document.getElementById('card-statement-charge-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'card-statement-charge-modal';
        modalEl.className = 'modal hidden';
        modalEl.style.zIndex = '1395';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width:430px;">
                <div class="modal-header" style="align-items:flex-start; gap:10px;">
                    <div>
                        <h3 style="margin:0; font-size:17px; font-weight:800;">Cuadrar Cargos del Extracto</h3>
                        <small id="csc-card-subtitle" style="color:var(--text-muted); font-size:11.5px;"></small>
                    </div>
                    <button type="button" class="btn-close-modal">Cerrar</button>
                </div>

                <div class="glass-sub-box" style="margin-bottom:12px; padding:11px 12px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px;">
                        <span style="color:var(--text-muted);">Deuda actual en la app:</span>
                        <strong id="csc-current-bal">$ 0,00</strong>
                    </div>
                </div>

                <details class="changelog-accordion" style="margin-bottom:12px; background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245, 158, 11, 0.28); padding:9px 11px; box-shadow:none;">
                    <summary style="font-size:11.5px; font-weight:800; color:#d97706;">
                        <span style="display:inline-flex; align-items:center; gap:6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            ¿Cómo cuadrar tu extracto sin restar a mano?
                        </span>
                        <span>▾</span>
                    </summary>
                    <div style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(245, 158, 11, 0.3); font-size:11px; color:var(--text-muted); line-height:1.45; display:flex; flex-direction:column; gap:6px;">
                        <span>• <b>Pago Total según Extracto:</b> Escribe el saldo total que reporta el banco al corte; la app calcula sola la diferencia frente a tu saldo actual y descuenta los cargos fijos marcados abajo para no duplicarlos.</span>
                        <span>• <b>Ejemplo:</b> Si en la app debes <b>$ 6.974.470,3</b> y tu extracto dice <b>$ 7.190.945,18</b> (diferencia de <b>$ 216.474,88</b>), al dejar marcada la cuota de manejo de <b>$ 9.451</b>, el campo de intereses se llena solo con <b>$ 207.023,88</b>.</span>
                    </div>
                </details>
                <form id="card-statement-charge-form" class="data-form">
                    <div class="form-group">
                        <label>Pago Total según Extracto ($ • Opc.)</label>
                        <input type="text" id="csc-statement-total" class="money-input" inputmode="decimal" placeholder="Ej. 7.190.945,18">
                        <small style="display:block; font-size:10.5px; color:var(--text-muted); margin-top:4px;">Si lo ingresas, calcula automáticamente la diferencia de intereses y seguros frente a tu saldo actual.</small>
                    </div>

                    <div id="csc-auto-fees-box" class="hidden" style="margin-bottom:10px;">
                        <label class="switch-row" style="padding:8px 10px; margin-bottom:0;">
                            <div>
                                <strong style="font-size:12px;">Incluir cuota de manejo / seguro fijo</strong>
                                <small id="csc-auto-fees-desc" style="font-size:10.5px;"></small>
                            </div>
                            <span class="switch">
                                <input type="checkbox" id="csc-include-auto-fees" checked>
                                <span class="slider"></span>
                            </span>
                        </label>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Intereses / Cargos extra ($)</label>
                            <input type="text" id="csc-extra-charge" class="money-input" inputmode="decimal" placeholder="0,00">
                        </div>
                        <div class="form-group">
                            <label>Fecha del cargo</label>
                            <input type="date" id="csc-charge-date" required>
                        </div>
                    </div>

                    <div class="dash-strip-grid" style="margin-bottom:12px; background:var(--card-inner-bg);">
                        <div class="dash-strip-item" style="text-align:left; border:none; padding-left:6px;">
                            <small>Total a cargar al saldo</small>
                            <strong id="csc-total-to-charge" class="negative" style="font-size:15px;">$ 0,00</strong>
                        </div>
                        <div class="dash-strip-item" style="text-align:right; border:none; padding-right:6px;">
                            <small>Nuevo saldo tarjeta</small>
                            <strong id="csc-new-balance" style="font-size:15px;">$ 0,00</strong>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width:100%;">Cargar al Saldo de la Tarjeta</button>
                </form>
            </div>
        `;
        document.body.appendChild(modalEl);
        modalEl.addEventListener('click', (e) => { if (e.target === modalEl) modalEl.classList.add('hidden'); });
        modalEl.querySelector('.btn-close-modal')?.addEventListener('click', () => modalEl.classList.add('hidden'));
    }

    const totalAutoFees = round2((est.mgmtFeeAmt || 0) + (est.insuranceAmt || 0));
    document.getElementById('csc-card-subtitle').innerText = stripLeadingEmoji(acc.name);
    document.getElementById('csc-current-bal').innerText = formatMoney(currentBal);

    const stmtInput = document.getElementById('csc-statement-total');
    const extraInput = document.getElementById('csc-extra-charge');
    const autoBox = document.getElementById('csc-auto-fees-box');
    const autoCheck = document.getElementById('csc-include-auto-fees');
    const autoDesc = document.getElementById('csc-auto-fees-desc');
    const dateInput = document.getElementById('csc-charge-date');

    stmtInput.value = '';
    extraInput.value = '';
    dateInput.value = currentDate.toLocaleDateString('en-CA');

    if (totalAutoFees > 0) {
        autoBox.classList.remove('hidden');
        autoCheck.checked = true;
        const parts = [];
        if (est.mgmtFeeAmt > 0) parts.push(`Manejo: ${formatMoney(est.mgmtFeeAmt)}`);
        if (est.insuranceAmt > 0) parts.push(`Seguro: ${formatMoney(est.insuranceAmt)}`);
        autoDesc.innerText = parts.join(' • ');
    } else {
        autoBox.classList.add('hidden');
        autoCheck.checked = false;
    }

    const recalcChargePreview = (fromStatementTotal = false) => {
        const autoAmt = (totalAutoFees > 0 && autoCheck.checked) ? totalAutoFees : 0;
        const stmtVal = parseMoneyInput(stmtInput.value);

        if (fromStatementTotal && stmtVal > 0) {
            const totalDiff = Math.max(0, round2(stmtVal - currentBal));
            const remainingInt = Math.max(0, round2(totalDiff - autoAmt));
            extraInput.value = remainingInt > 0 ? formatNumberInput(remainingInt) : '';
        }

        const extraVal = parseMoneyInput(extraInput.value);
        const totalCharge = round2(autoAmt + extraVal);
        document.getElementById('csc-total-to-charge').innerText = formatMoney(totalCharge);
        document.getElementById('csc-new-balance').innerText = formatMoney(round2(currentBal + totalCharge));
    };

    stmtInput.oninput = () => recalcChargePreview(true);
    extraInput.oninput = () => recalcChargePreview(false);
    autoCheck.onchange = () => recalcChargePreview(parseMoneyInput(stmtInput.value) > 0);
    recalcChargePreview(false);

    document.getElementById('card-statement-charge-form').onsubmit = (e) => {
        e.preventDefault();
        const autoAmt = (totalAutoFees > 0 && autoCheck.checked) ? totalAutoFees : 0;
        const extraVal = parseMoneyInput(extraInput.value);
        const totalCharge = round2(autoAmt + extraVal);

        if (totalCharge <= 0) {
            alert('Ingresa el Pago Total del extracto o un valor de cargos mayor a $ 0.');
            return;
        }

        const chosenDateStr = dateInput.value || currentDate.toLocaleDateString('en-CA');
        const now = new Date();
        const txDateObj = new Date(`${chosenDateStr}T${now.toTimeString().slice(0, 5)}`);
        const mId = getMonthId(txDateObj);
        const dateLabel = `${txDateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${txDateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
        const intCat = financeData.categories.expense.find(c => stripLeadingEmoji(c.name) === 'Cuotas / Intereses');
        const catName = intCat ? intCat.name : 'Cuotas / Intereses';
        const cleanCardName = stripLeadingEmoji(acc.name);

        if (autoAmt > 0) {
            if (est.mgmtFeeAmt > 0) {
                financeData.transactions.push({
                    id: txDateObj.getTime() + 10, monthId: mId, type: 'expense', status: 'closed',
                    account: acc.id, category: catName, subcategory: 'General',
                    description: `Cuota de manejo (${cleanCardName})`,
                    amount: est.mgmtFeeAmt, date: dateLabel, isAdjustment: false
                });
            }
            if (est.insuranceAmt > 0) {
                financeData.transactions.push({
                    id: txDateObj.getTime() + 20, monthId: mId, type: 'expense', status: 'closed',
                    account: acc.id, category: catName, subcategory: 'General',
                    description: `Seguro vida deudores (${cleanCardName})`,
                    amount: est.insuranceAmt, date: dateLabel, isAdjustment: false
                });
            }
        }

        if (extraVal > 0) {
            financeData.transactions.push({
                id: txDateObj.getTime() + 30, monthId: mId, type: 'expense', status: 'closed',
                account: acc.id, category: catName, subcategory: 'General',
                description: `Intereses y cargos extracto (${cleanCardName})`,
                amount: extraVal, date: dateLabel, isAdjustment: false
            });
        }

        localStorage.setItem('myFinances', JSON.stringify(financeData));
        hasUnsavedChanges = false;
        modalEl.classList.add('hidden');
        updateDashboard();
        openAccountDetail(acc.id, lastAccountViewOrigin);
    };

    modalEl.classList.remove('hidden');
};
// Sincronización automática de reglas de Retefuente (Orden de consumo y Tope Anual/Mensual)
const initTaxRuleSelectors = () => {
    const orderEl = document.getElementById('param-ret-order');
    const capEl = document.getElementById('param-ret-cap-eval');
    const saved = (typeof getTaxParams === 'function') ? getTaxParams() : (financeData.taxParams || {});
    if (orderEl && saved.retOrder) orderEl.value = saved.retOrder;
    if (capEl && saved.retCapEval) capEl.value = saved.retCapEval;

    const persistTaxRules = () => {
        financeData.taxParams = {
            ...(typeof getTaxParams === 'function' ? getTaxParams() : (financeData.taxParams || {})),
            retOrder: orderEl?.value || 'salary_first',
            retCapEval: capEl?.value || 'monthly'
        };
        localStorage.setItem('myFinances', JSON.stringify(financeData));
        if (typeof renderSalaryUI === 'function') renderSalaryUI(false);
    };

    orderEl?.addEventListener('change', persistTaxRules);
    capEl?.addEventListener('change', persistTaxRules);
};
initTaxRuleSelectors();
// Reiniciar la vista de cuentas al cerrar el modal (clic por fuera o en botón Cerrar)
const accModalFix = document.getElementById('accounts-modal');
if (accModalFix) {
    const resetAccountsView = () => {
        document.getElementById('account-detail-view')?.classList.add('hidden');
        document.getElementById('accounts-list-view')?.classList.remove('hidden');
    };
    
    // Si hace clic en el fondo oscuro (por fuera)
    accModalFix.addEventListener('click', (e) => {
        if (e.target === accModalFix) resetAccountsView();
    });
    
    // Si hace clic en cualquier botón de "Cerrar" del modal
    accModalFix.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', resetAccountsView);
    });
}