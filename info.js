// ==========================================
// INFO.JS - CENTRO DE AYUDA, LEGAL Y NOTAS DE VERSIÓN (v4.1.0)
// Módulo independiente para mantener app.js ligero y limpio.
// ==========================================

const APP_VERSION = '4.1.0';

const openUniversalInfoModal = (sectionKey) => {
    const uModal = document.getElementById('universal-info-modal');
    const titleEl = document.getElementById('universal-info-title');
    const bodyEl = document.getElementById('universal-info-body');
    if (!uModal || !titleEl || !bodyEl) return;

    // Cálculo en vivo del peso de la base de datos (UTF-16 usa 2 bytes por carácter)
    let totalBytes = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalBytes += ((localStorage[key].length + key.length) * 2);
        }
    }
    const storageKB = (totalBytes / 1024).toFixed(2);
    const storagePct = Math.min(100, (storageKB / 5120) * 100).toFixed(1);
    const txCount = (typeof financeData !== 'undefined' && financeData.transactions) ? financeData.transactions.length : 0;
    const storageColor = storagePct > 80 ? 'var(--negative)' : (storagePct > 50 ? '#f59e0b' : 'var(--positive)');

    const contentMap = {
        storage: {
            title: 'Estado de Memoria',
            html: `
                <div class="glass-sub-box" style="font-size:12px; line-height:1.55;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <strong>Uso de Almacenamiento Local</strong>
                        <span style="color:${storageColor}; font-weight:800;">${storagePct}%</span>
                    </div>
                    <div class="pace-bar-track" style="height:8px; margin-bottom:12px; background:var(--hover-bg); border-radius:8px;">
                        <div class="pace-bar-fill" style="width:${storagePct}%; background-color:${storageColor}; height:100%; border-radius:8px; transition:width 0.5s ease;"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:var(--text-muted);">
                        <span>Espacio ocupado:</span> <strong>${storageKB} KB</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px; color:var(--text-muted);">
                        <span>Límite seguro (iOS/Android):</span> <strong>~5.120 KB (5MB)</strong>
                    </div>
                    
                    <div class="drawer-divider" style="margin:12px 0;"></div>
                    
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span style="color:var(--text-muted);">Movimientos guardados:</span> 
                        <strong style="color:var(--text-main);">${txCount} registros</strong>
                    </div>
                    
                    <p style="margin-top:14px; font-size:11px; color:var(--text-muted); background:rgba(245, 158, 11, 0.08); padding:10px; border-radius:8px; border:1px solid rgba(245, 158, 11, 0.2);">
                        <b>💡 Mantenimiento:</b> Al ser 100% Local-First, todos tus datos viven en tu navegador. Si te acercas al límite (más del 80%), ve a <b>Configuración > Copia de Seguridad</b> y utiliza el <b>Cierre de Año</b> para liberar espacio convirtiendo años viejos en saldos iniciales.
                    </p>
                </div>
            `
        },
        faq: {
            title: 'Guía Rápida y FAQ',
            html: `
                <div class="glass-sub-box" style="font-size:12px; line-height:1.55;">
                    <p style="margin-bottom:10px;"><b>1. ¿Cómo cierro las ventanas rápidamente?</b><br>Puedes tocar el botón <b>Cerrar</b>, pulsar la tecla <b>Esc</b> o tocar directamente en el fondo difuminado fuera de la ventana.</p>
                    <p style="margin-bottom:10px;"><b>2. ¿Cómo registro compras a cuotas (TC o Cupos BNPL)?</b><br>Crea un gasto y elige tu Tarjeta de Crédito o Cupo Rotativo. Podrás definir el número de cuotas, tasa o marcar 0% interés y revisar la tabla de amortización.</p>
                    <p style="margin-bottom:10px;"><b>3. ¿Cómo transfiero dinero a mis Bolsillos?</b><br>Usa el botón <b>+ ➔ Transferencia</b>, elige tu cuenta bancaria como origen y selecciona tu Bolsillo de Ahorro en <i>Cuenta Destino</i> (o viceversa para retirar).</p>
                    <p style="margin-bottom:10px;"><b>4. ¿Cómo vendo un Activo Fijo o registro sus gastos?</b><br>Entra a <i>Activos Fijos</i> en el menú lateral, toca el activo que deseas gestionar y usa los botones <b>Vender</b> (abona el dinero a tu cuenta) o <b>Registrar Gasto</b>.</p>
                    <p style="margin-bottom:10px;"><b>5. ¿Cómo ordeno los widgets del Inicio?</b><br>Toca <b>Ordenar</b> en el pie de página para subir o bajar tarjetas y bloques a tu gusto.</p>
                    <p><b>6. ¿Cómo exporto recordatorios al calendario iOS?</b><br>Entra a <i>Tarjetas de Crédito</i> y toca el botón <b>Añadir Alarma (.ics)</b> en cada tarjeta, o configúralo desde tu Perfil para alarmas generales.</p>
                </div>
            `
        },
        terms: {
            title: 'Términos de Uso',
            html: `
                <div class="glass-sub-box" style="font-size:12px; line-height:1.55; color:var(--text-muted);">
                    <p style="margin-bottom:10px;"><b>Mis Finanzas</b> es una herramienta de organización, proyección presupuestal y simulación financiera personal desarrollada por <b>Función IF</b>.</p>
                    <p style="margin-bottom:10px;">Los cálculos tributarios y laborales (Retefuente Art. 383 E.T., Ley 1393, UVT, SMMLV, prestaciones sociales, primas y liquidación de vacaciones) son estimaciones referenciales basadas en la normativa colombiana vigente y parámetros configurables por el usuario; no sustituyen asesoría contable o jurídica profesional.</p>
                    <p>Dado que toda la información reside localmente en tu navegador, eres totalmente responsable de exportar periódicamente tus copias de seguridad en formato JSON desde el menú de Perfil.</p>
                </div>
            `
        },
        privacy: {
            title: 'Política de Privacidad',
            html: `
                <div class="glass-sub-box" style="font-size:12px; line-height:1.55; color:var(--text-muted);">
                    <p style="margin-bottom:10px;"><b>Arquitectura 100% Local-First:</b> Mis Finanzas no utiliza servidores remotos, bases de datos en la nube, cuentas externas ni rastreadores publicitarios.</p>
                    <p style="margin-bottom:10px;">Todos tus saldos, movimientos, configuraciones salariales, metas y PIN cifrado se almacenan exclusivamente en el almacenamiento local (<code>localStorage</code>) de tu dispositivo.</p>
                    <p>Ningún tercero ni <b>Función IF</b> tiene acceso a tus datos financieros.</p>
                </div>
            `
        },
        about: {
            title: 'Acerca y Novedades',
            html: `
                <div style="text-align:center; margin-bottom:14px;">
                    <h3 style="font-size:18px; font-weight:800; color:var(--accent);">Mis Finanzas • v${APP_VERSION}</h3>
                    <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Desarrollado por <b>Función IF</b> • © 2026</p>
                </div>

                <div class="glass-sub-box" style="font-size:12px; line-height:1.55;">
                    <p style="margin-bottom:6px;"><b>Arquitectura:</b> 100% Local-First PWA (Offline Ready)</p>
                    <p style="margin-bottom:6px;"><b>Interfaz:</b> Diseño Fintech Editorial + Micro-Glass Selectivo</p>
                    <p><b>Ecosistema:</b> Flujo de caja, presupuestos con rollover, tarjetas con amortización, plan avalancha, bolsillos, activos fijos, gráficos SVG y nómina Colombia.</p>
                </div>

                <h4 style="font-size:13px; font-weight:800; margin:14px 0 8px 0; text-align:left;">Historial de Versiones</h4>

                <details class="changelog-accordion" open>
                    <summary><span>🚀 Versión 4.1.0 (Actual) </span><span>▾</span></summary>
                    <ul>
                        <li><b>Lógica Bancaria Avanzada (TC):</b> Cálculo inteligente de pagos mínimos, cuota de manejo (condicional por uso/saldo) y seguro de deudores (por millón o fijo). Botones rápidos para facturar cargos mensuales.</li>
                        <li><b>Ahorro Automático (Nómina):</b> Nueva opción "Descuento por nómina" en Bolsillos. Al registrar tu sueldo, retiene la cuota y la abona a tus metas de ahorro automáticamente.</li>
                        <li><b>Modo Privacidad Global:</b> Nuevo botón oculto en la cabecera ("Ojo"). Tapa al instante todos tus saldos reales con asteriscos (incluyendo Libre Seguro, TCs y gráficos) para usar la app en espacios públicos.</li>
                        <li><b>Préstamos Fijos Flexibles:</b> Los créditos fijos ahora permiten registrar desembolsos adicionales manteniendo su base matemática de amortización.</li>
                        <li><b>Deudas vs. Cobros (CxC):</b> Separación nativa en la interfaz entre el dinero que debes (Pasivos/Rojo) y el dinero que te deben (Cuentas a Favor/Verde).</li>
                        <li><b>Análisis Personalizable:</b> Ahora puedes reorganizar a tu gusto los gráficos del panel de Análisis (Patrimonio, Flujo, Resumen, Gastos) de forma independiente.</li>
                        <li><b>Rendimiento y UX:</b> Optimización profunda (Delegación de eventos) para que el historial cargue al instante. Corrección de los decimales atenuados en dispositivos pequeños y precisión del Libre Seguro Hoy.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>🎨 Versión 4.0.0</span><span>▾</span></summary>
                    <ul>
                        <li><b>Estética Fintech Editorial y Bento UI:</b> Superficies mate de alto contraste, tipografía tabular con decimales atenuados y derivación tonal dinámica (<code>color-mix</code>).</li>
                        <li><b>Presupuesto Restante Dinámico:</b> Auto-llenado del saldo disponible al registrar gastos y revisión de saldo en tiempo real.</li>
                        <li><b>Ahorro de Monedas:</b> Redondeo inteligente del efectivo con contabilidad en doble partida (sin alterar el gasto original).</li>
                        <li><b>Analítica Suavizada:</b> Gráficos SVG rediseñados y comparativa simétrica del flujo de caja.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>🚀 Versión 3.3.0</span><span>▾</span></summary>
                    <ul>
                        <li><b>Gastos Compartidos y Deudas a Favor:</b> Divide cuentas pagadas por otros, gestiona cuentas por cobrar independientes de tu liquidez y concilia reembolsos mediante transferencias.</li>
                        <li><b>Alcancía de Monedas (Redondeo en Efectivo):</b> Redondea pagos en efectivo al siguiente múltiplo de $1.000 y envía el vuelto automáticamente a un bolsillo oculto usable como medio de pago.</li>
                        <li><b>Aumento de Sueldo y Retroactivos:</b> Simula incrementos salariales con impacto neto real, define vigencia por quincena y programa pagos retroactivos.</li>
                        <li><b>Presupuesto Histórico Protegido:</b> Las actualizaciones salariales y créditos por libranza ajustan únicamente el mes actual y futuros sin alterar meses cerrados.</li>
                        <li><b>Reportes PDF y Memoria Predictiva:</b> Exporta estados financieros mensuales listos para imprimir y aprovecha el autocompletado inteligente basado en tu historial.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>✨ Versión 3.2.5</span><span>▾</span></summary>
                    <ul>
                        <li><b>División de Transacciones (Split):</b> Divide un solo ticket de compra en múltiples categorías y medios de pago.</li>
                        <li><b>Omni-Modal y UX:</b> Centralización del registro. Colores dinámicos para prevenir errores (rojo, verde, morado) e iconos renovados.</li>
                        <li><b>Gestor Educativo:</b> Módulo de matrícula universitaria con plan de pagos, trámites extra, descarga de recibos (.txt) y alertas a 7 días.</li>
                        <li><b>Bolsillos Ocultos:</b> Excluye metas de ahorro de la hoja de balance para proteger tu capital psicológico.</li>
                        <li><b>Suscripciones y Fijos:</b> Gestiona tus servicios recurrentes y recibe alertas tempranas para pagarlos con 1 solo toque.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>✨ Versión 3.2</span><span>▾</span></summary>
                    <ul>
                        <li><b>Onboarding Mejorado:</b> Nueva experiencia de bienvenida en dos pasos, con firma visual de Función IF.</li>
                        <li><b>Cupos Rotativos Consolidados:</b> Registra múltiples compras por comercio dentro de un mismo cupo (Addi, Sistecrédito) y controla si afectan el gasto del mes.</li>
                        <li><b>Bolsillos Inteligentes:</b> Cálculo automático de cuotas y fechas objetivo para tus metas de ahorro.</li>
                        <li><b>Fondo de Cesantías:</b> Nuevo sistema para acumular y separar tus cesantías año tras año.</li>
                        <li><b>Historial de Activos y ROI:</b> Lleva el registro de la valorización o depreciación de tu patrimonio y calcula tu Ganancia Real.</li>
                        <li><b>Liquidación Completa:</b> Módulo mejorado de nómina con vacaciones compensadas y bonos ocasionales.</li>
                        <li><b>Interfaz Liquid Glass v3:</b> Modales estandarizados, animaciones optimizadas y diseño visual unificado con opción de cifras compactas (k, M).</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>✨ Versión 3.1.1</span><span>▾</span></summary>
                    <ul>
                        <li><b>Auditoría y Correcciones:</b> Se corrigieron conflictos de cierre de modales y restauración de elementos de diseño perdidos.</li>
                        <li><b>Bolsillos en Transferencias:</b> Transfiere dinero desde o hacia tus bolsillos de ahorro directamente al registrar una transferencia.</li>
                        <li><b>Liquidación con Vacaciones:</b> Cálculo automático de días causados (15d/año) con campo para descontar días ya disfrutados.</li>
                        <li><b>Auxilio de Transporte Flexible:</b> Control separado para sumar al pago neto mensual o incluir en la base de prestaciones.</li>
                        <li><b>Plan de Deudas Granular:</b> Elige aplicar ambas primas (Junio y Diciembre), solo Junio, solo Diciembre o ninguna.</li>
                        <li><b>Buscador y Recordatorios:</b> Filtro instantáneo en el historial del mes, alarmas <code>.ics</code> por tarjeta y aviso de respaldo cada 30 días.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>🎨 Versión 3.1</span><span>▾</span></summary>
                    <ul>
                        <li>Pantalla de bienvenida con pilares de privacidad Local-First e isologo.</li>
                        <li>Selector manual de apariencia (Claro, Oscuro o Automático) y tablero de widgets reordenable.</li>
                        <li>Incorporación del Centro de Ayuda en el menú lateral (<code>info.js</code>).</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>🚀 Versión 3.0</span><span>▾</span></summary>
                    <ul>
                        <li>Nuevo menú lateral desplegable (Side Drawer) con navegación por acordeones y cabecera limpia.</li>
                        <li>Medidor de Capacidad de Endeudamiento integrado en Salud Financiera.</li>
                        <li>Estética avanzada Liquid Glass con reflejos especulares.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>💎 Versión 2.3</span><span>▾</span></summary>
                    <ul>
                        <li>Nuevo tablero visual con anillos SVG de Salud Financiera en 4 pilares y Metas de Ahorro.</li>
                        <li>Soporte para Cupos Rotativos / BNPL (Addi, Sistecrédito) con simulador de impacto en salud.</li>
                        <li>Descuento por libranza de préstamos integrado en el cálculo de nómina neta.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>🧮 Versión 2.2</span><span>▾</span></summary>
                    <ul>
                        <li>Módulo completo de Nómina Colombia (Art. 383 E.T., Ley 1393, FSP, quincenas 1Q/2Q y simulador de bonos).</li>
                        <li>Planificador multi-deuda con métodos Avalancha y Bola de Nieve.</li>
                        <li>Calculadora matemática integrada sin uso de <code>eval()</code>.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>🌱 Versión 1.0</span><span>▾</span></summary>
                    <ul>
                        <li>Lanzamiento inicial Local-First con bloqueo por PIN cifrado, Hoja de Balance y presupuestos.</li>
                    </ul>
                </details>
            `
        }
    };

    const selected = contentMap[sectionKey] || contentMap.about;
    titleEl.innerText = selected.title;
    bodyEl.innerHTML = selected.html;
    uModal.classList.remove('hidden');
};

const checkWhatsNewBanner = () => {
    if (typeof authData === 'undefined' || !authData) return;
    const lastSeen = localStorage.getItem('myFinancesLastSeenVersion');
    if (lastSeen && lastSeen !== APP_VERSION) {
        const toast = document.getElementById('sw-update-toast');
        if (toast) {
            toast.innerHTML = `Actualizado a v${APP_VERSION} • Toca aquí para ver novedades`;
            toast.style.cursor = 'pointer';
            toast.classList.remove('hidden');
            toast.onclick = () => {
                toast.classList.add('hidden');
                openUniversalInfoModal('about');
            };
            setTimeout(() => toast.classList.add('hidden'), 7500);
        }
    }
    localStorage.setItem('myFinancesLastSeenVersion', APP_VERSION);
};

// Eventos del Centro de Ayuda y Menú Lateral
document.getElementById('drawer-version-btn')?.addEventListener('click', () => {
    if (typeof closeSideDrawer === 'function') closeSideDrawer();
    openUniversalInfoModal('about');
});

document.getElementById('drawer-help-faq')?.addEventListener('click', () => {
    if (typeof closeSideDrawer === 'function') closeSideDrawer();
    openUniversalInfoModal('faq');
});

document.getElementById('drawer-help-terms')?.addEventListener('click', () => {
    if (typeof closeSideDrawer === 'function') closeSideDrawer();
    openUniversalInfoModal('terms');
});

document.getElementById('drawer-help-privacy')?.addEventListener('click', () => {
    if (typeof closeSideDrawer === 'function') closeSideDrawer();
    openUniversalInfoModal('privacy');
});

document.getElementById('drawer-system-storage')?.addEventListener('click', () => {
    if (typeof closeSideDrawer === 'function') closeSideDrawer();
    openUniversalInfoModal('storage');
});

document.getElementById('drawer-help-about')?.addEventListener('click', () => {
    if (typeof closeSideDrawer === 'function') closeSideDrawer();
    openUniversalInfoModal('about');
});

document.getElementById('drawer-report-bug')?.addEventListener('click', () => {
    if (typeof closeSideDrawer === 'function') closeSideDrawer();
    const subject = encodeURIComponent(`Reporte de problema - Mis Finanzas v${APP_VERSION}`);
    const body = encodeURIComponent('Hola equipo de Función IF,\n\nQuisiera reportar el siguiente inconveniente o sugerencia en la app:\n\n');
    window.location.href = `mailto:soporte@funcionif.app?subject=${subject}&body=${body}`;
});

document.getElementById('drawer-share-app')?.addEventListener('click', async () => {
    if (typeof closeSideDrawer === 'function') closeSideDrawer();
    const shareData = {
        title: 'Mis Finanzas • Función IF',
        text: 'Gestiona tus finanzas personales de forma 100% privada y local con Mis Finanzas.',
        url: window.location.href
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) {}
    } else if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert('Enlace de la aplicación copiado al portapapeles.');
        } catch (err) {}
    }
});