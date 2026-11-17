// ==========================================
// INFO.JS - CENTRO DE AYUDA, LEGAL Y NOTAS DE VERSIÓN (v2.0.0)
// Módulo independiente para mantener app.js ligero y limpio.
// ==========================================

const APP_VERSION = '2.0.0';

function openUniversalInfoModal(sectionKey) {
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
                <div class="glass-sub-box" style="font-size:12px; line-height:1.5; max-height:65vh; overflow-y:auto; padding-right:8px;">
                    <h4 style="color:var(--accent); font-size:13px; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                        ${renderIcon('lock', 16)} 1. Arquitectura, Privacidad y Seguridad
                    </h4>
                    <p style="margin-bottom:8px;"><b>100% Local-First y Offline:</b> Todos los datos financieros, configuraciones y saldos se guardan de forma segura en tu propio dispositivo (en el <code>localStorage</code> e <code>IndexedDB</code> del navegador). No existen servidores externos, bases de datos en la nube ni rastreadores de terceros.</p>
                    <p style="margin-bottom:8px;"><b>Modo Privacidad Global:</b> Toca el ícono del "Ojo" (en la barra superior, junto al título de la app). Esta acción enmascarará de forma instantánea todos tus saldos reales, cuentas, tarjetas y gráficos con asteriscos (<code>****</code>), permitiéndote usar la aplicación en espacios públicos sin revelar tu información financiera.</p>
                    <p style="margin-bottom:12px;"><b>Protección por PIN Encriptado:</b> En la sección "Mi Perfil > Seguridad y PIN", puedes configurar un código de acceso de 4 a 6 dígitos. La clave se almacena como un <i>hash</i> encriptado. Además, el sistema detecta si la app pasa a segundo plano e invoca el bloqueo automáticamente al volver.</p>

                    <h4 style="color:var(--accent); font-size:13px; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                        ${renderIcon('trending-up', 16)} 2. Registro Inteligente de Movimientos
                    </h4>
                    <p style="margin-bottom:8px;"><b>Categorización IA y Memoria Predictiva (Regex):</b> Al registrar un nuevo gasto, la app detecta automáticamente la categoría analizando el nombre del comercio. (Ejemplo: Al escribir <i>"Uber"</i> seleccionará "Transporte", o con <i>"Netflix"</i> seleccionará "Entretenimiento"). Además, la app aprende de tus movimientos previos para sugerir inteligentemente la cuenta bancaria de origen más frecuente.</p>
                    <p style="margin-bottom:8px;"><b>Calculadora Integrada:</b> El campo de ingreso de dinero cuenta con una pequeña calculadora incorporada. Ideal para realizar operaciones rápidas sin necesidad de cambiar de aplicación.</p>
                    <p style="margin-bottom:8px;"><b>Gasto Compartido (Cuentas por Cobrar Automáticas):</b> Si asumes un gasto total, pero alguien más debe reembolsarte una fracción, activa "Gasto Compartido". La app imputará al presupuesto únicamente el porcentaje que tú pagaste y creará automáticamente una deuda a favor a nombre del tercero.</p>
                    <p style="margin-bottom:8px;"><b>Ahorro de Vueltos (Monedas):</b> Ideal para los pagos en efectivo. Si una compra cuesta $18.500, puedes indicarle a la app que guarde $1.500 en tu "Alcancía". La plataforma descontará el billete entero ($20.000) y realizará un traslado automático del saldo restante hacia tu bolsillo de ahorro.</p>
                    <p style="margin-bottom:8px;"><b>Suscripciones y Gastos Fijos:</b> Gestiona membresías o facturas periódicas (mensuales, bimestrales o anuales). La app emite una alerta inteligente en el Dashboard en los días previos al corte y habilita un botón rápido de "Pagar" para liquidar la obligación e iniciar un nuevo ciclo. También puedes reservar estos montos automáticamente en el presupuesto.</p>
                    <p style="margin-bottom:12px;"><b>División de Transacciones (Split):</b> Divide un único recibo o compra grande en múltiples categorías del presupuesto o en diferentes medios de pago.</p>

                    <h4 style="color:var(--accent); font-size:13px; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                        ${renderIcon('card', 16)} 3. Tarjetas, Préstamos y Conciliación
                    </h4>
                    <p style="margin-bottom:8px;"><b>Conciliación Inteligente (Tap-to-Clear):</b> En el historial del mes, activa el botón de confirmación <b>(✓)</b>. Al tocar las transacciones, estas cambiarán a un tono verde para indicar que ese movimiento particular ya se ha verificado exitosamente contra el extracto real de tu banco.</p>
                    <p style="margin-bottom:8px;"><b>Lógica Bancaria y Tarjetas de Crédito:</b> Controla de forma exacta las fechas de corte, días de pago y tasas (Mensual o Efectiva Anual). El sistema calcula dinámicamente tu pago mínimo separando los componentes de abono a capital y cargos por intereses.</p>
                    <p style="margin-bottom:8px;"><b>Cuota de Manejo y Seguros:</b> Configura el comportamiento de tu banco. Establece cobros condicionales (Ej: Solo cobrar la cuota de manejo si existe saldo pendiente, o exonerar el cobro si el gasto mensual supera un tope específico). Soporte para cálculo de Seguro de Vida deudores por millón o fracción.</p>
                    <p style="margin-bottom:8px;"><b>Múltiples Modalidades de Crédito:</b> Administra diferentes formatos de obligación: <i>Préstamos Fijos</i>, <i>Cupos Rotativos / BNPL (Como Addi o Sistecrédito)</i>, y <i>Créditos Educativos</i> (con soporte para agregar trámites adicionales a la liquidación o emitir un recibo de soporte PDF).</p>
                    <p style="margin-bottom:12px;"><b>Planificador de Deudas (Salida Estratégica):</b> Integra un simulador que proyecta cascadas de pagos extra (usando Método Avalancha o Bola de Nieve) para calcular exactamente cuándo quedarás libre de obligaciones financieras y cuánto dinero ahorrarás en intereses. Se puede integrar con tus primas legales de forma automática.</p>

                    <h4 style="color:var(--accent); font-size:13px; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                        ${renderIcon('chart', 16)} 4. Presupuestos, Metas y Activos Fijos
                    </h4>
                    <p style="margin-bottom:8px;"><b>Bolsillos Inteligentes (Metas de Ahorro):</b> Configura objetivos financieros por monto o fecha límite, y la app calculará la cuota que necesitas aportar. Además, permite automatizar los aportes usando un mecanismo de "Descuento por Libranza" directamente desde la nómina.</p>
                    <p style="margin-bottom:8px;"><b>Presupuesto con Arrastre (Rollover):</b> En las categorías de gasto, puedes definir cómo se trata el dinero no gastado al cambiar de mes. Puedes decidir llevar un "Mes limpio", guardar el sobrante del mes pasado (+), o arrastrar tanto superávit como déficit (+/-) para planificar provisiones anuales.</p>
                    <p style="margin-bottom:12px;"><b>Activos Fijos y Ganancia Real (ROI):</b> Lleva un inventario de propiedades de alto valor (inmuebles, vehículos, tecnología o inversiones). Permite sumar los mantenimientos o mejoras realizadas al activo, y contrastar el precio de venta esperado para conocer el Retorno de Inversión real.</p>

                    <h4 style="color:var(--accent); font-size:13px; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                        ${renderIcon('briefcase', 16)} 5. Nómina, Impuestos y Laboral (Colombia)
                    </h4>
                    <p style="margin-bottom:8px;"><b>Motor de Liquidación Exacto:</b> Depuración formal de salario con todos los lineamientos legales para Colombia. Cálculos para deducciones en salud, pensión y Fondo de Solidaridad Pensional (FSP). Incluye controles de tope de la Ley 1393 (tope 40% ingresos no salariales).</p>
                    <p style="margin-bottom:8px;"><b>Retefuente Art. 383 E.T.:</b> Motor tributario que calcula el impacto fiscal. Puede usar el Procedimiento 1 (tabla en UVT con dependientes, medicina prepagada, intereses de vivienda, AFC y tope exento del 25%) o el Procedimiento 2 (Porcentaje Fijo semestral).</p>
                    <p style="margin-bottom:8px;"><b>Liquidación a Hoy y Simulador de Bonos:</b> La app determina matemáticamente el acumulado pendiente por concepto de Prima, Cesantías, Intereses de cesantías y Vacaciones en tiempo real (utilizando promedios salariales de los últimos meses de acuerdo al Código Sustantivo del Trabajo). También incluye una herramienta para simular el impacto en deducciones cuando recibes una bonificación extra.</p>
                    <p style="margin-bottom:12px;"><b>Proyección Declaración Renta:</b> Un escáner constante que analiza tus consumos. Revisa tu patrimonio consolidado, el volumen de ingresos, el consumo consolidado de tarjetas de crédito y las compras generales. Los compara en tiempo real con la UVT oficial configurada en la app para lanzar alertas tempranas sobre requerimientos de declaración ante la DIAN.</p>

                    <h4 style="color:var(--accent); font-size:13px; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:4px; display:flex; align-items:center; gap:6px;">
                        ${renderIcon('heart-pulse', 16)} 6. Análisis Integral y Rendimiento
                    </h4>
                    <p style="margin-bottom:8px;"><b>Semáforo de Salud Financiera y Capacidad de Endeudamiento:</b> Una medición de 0 a 100 basada en 4 pilares: Flujo de caja neto, Meses de reserva en liquidez total, Porcentaje de carga de deuda, y un indicador de solvencia patrimonial. Informa el nivel de endeudamiento sano recomendado con base en tus ingresos base.</p>
                    <p style="margin-bottom:8px;"><b>Reportes PDF (Extracto Bancario):</b> Construye dinámicamente un comprobante de actividad (Hoja de balance, Resumen de Flujo de Caja y Listado detallado de movimientos) en formato folio, limpio y vectorizado, sin interferencias de la interfaz de la app, listo para ser almacenado en los archivos del celular o impreso.</p>
                    <p style="margin-bottom:8px;"><b>Gráficos Vectoriales Propios:</b> El módulo Analítico renderiza de forma nativa gráficas precisas del Flujo de caja, control presupuestal, evolución del patrimonio neto, y el mapa diario de actividad en formato SVG, garantizando rendimiento puro sin depender de pesadas librerías de terceros (Chart.js u otros).</p>
                    <p style="margin-bottom:12px;"><b>Migración Silenciosa y Compresión (IndexedDB):</b> Sistema avanzado de limpieza y <i>Cierre de Año</i>. La plataforma consolida años anteriores en cuentas maestras (disminuyendo drásticamente el peso del <code>localStorage</code>) mientras traslada tu historial de transacciones detallado, en un hilo asíncrono, a la base de datos <code>IndexedDB</code> nativa, previniendo cuellos de botella de rendimiento y blindando tu memoria Local-First.</p>
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
                    <summary><span>Versión 2.0.0 (Actual)</span><span>▾</span></summary>
                    <ul>
                        <li><b>Estética Fintech Editorial y Bento UI:</b> Superficies mate de alto contraste, tipografía tabular con decimales atenuados y derivación tonal dinámica (<code>color-mix</code>).</li>
                        <li><b>Formularios Plegables e Inteligentes:</b> Todos los formularios de creación (Categorías, Cuentas, Tarjetas, Préstamos, Cobros, Bolsillos, Activos y Suscripciones) ahora son desplegables al inicio de cada lista para maximizar el espacio en pantalla y se cierran automáticamente al guardar.</li>
                        <li><b>Iconografía Vectorial 100% Unificada:</b> Eliminación total de emojis residuales en categorías, etiquetas de gasto/ingreso fijo, archivado y diagnósticos de Salud Financiera, reemplazados por íconos SVG planos y espaciado optimizado.</li>
                        <li><b>Presupuesto Adaptativo y Barra Global:</b> Los formularios y modales de presupuesto mutan dinámicamente entre límites de gasto (rojo) y metas de ingreso (verde), incorporando además una barra de progreso global en la cabecera.</li>
                        <li><b>Guía Contextual de Arrastre (Rollover):</b> Nuevo aviso explicativo dinámico con ejemplos en pesos colombianos ($100.000) que detalla el impacto del sobrante o déficit según el modo elegido.</li>
                        <li><b>Lógica Bancaria Avanzada (TC):</b> Cálculo inteligente de pagos mínimos, cuota de manejo (condicional por uso/saldo) y seguro de deudores (por millón o fijo). Botones rápidos para facturar cargos mensuales.</li>
                        <li><b>Omni-Modal y UX:</b> Centralización del registro. Colores dinámicos para prevenir errores (rojo, verde, morado) e iconos renovados.</li>
                        <li><b>Ahorro de Monedas:</b> Redondeo inteligente del efectivo con contabilidad en doble partida (sin alterar el gasto original).</li>
                        <li><b>Gestor Educativo:</b> Módulo de matrícula universitaria con plan de pagos, trámites extra, descarga de recibos (.txt) y alertas a 7 días.</li>
                        <li><b>Gastos Compartidos y Deudas a Favor:</b> Divide cuentas pagadas por otros, gestiona cuentas por cobrar independientes de tu liquidez y concilia reembolsos mediante transferencias.</li>
                        <li><b>Presupuesto Restante Dinámico:</b> Auto-llenado del saldo disponible al registrar gastos y revisión de saldo en tiempo real.</li>
                        <li><b>Aumento de Sueldo y Retroactivos:</b> Simula incrementos salariales con impacto neto real, define vigencia por quincena y programa pagos retroactivos.</li>
                        <li><b>Ahorro Automático (Nómina):</b> Nueva opción "Descuento por nómina" en Bolsillos. Al registrar tu sueldo, retiene la cuota y la abona a tus metas de ahorro automáticamente.</li>
                        <li><b>Bolsillos Ocultos:</b> Excluye metas de ahorro de la hoja de balance para proteger tu capital psicológico.</li>
                        <li><b>Suscripciones y Fijos:</b> Gestiona tus servicios recurrentes y recibe alertas tempranas para pagarlos con 1 solo toque.</li>
                        <li><b>Modo Privacidad Global:</b> Nuevo botón oculto en la cabecera ("Ojo"). Tapa al instante todos tus saldos reales con asteriscos (incluyendo Libre Seguro, TCs y gráficos) para usar la app en espacios públicos.</li>
                        <li><b>Préstamos Fijos Flexibles:</b> Los créditos fijos ahora permiten registrar desembolsos adicionales manteniendo su base matemática de amortización.</li>
                        <li><b>Analítica Suavizada y Personalizable:</b> Gráficos SVG rediseñados. Ahora puedes reorganizar a tu gusto los gráficos del panel de Análisis de forma independiente.</li>
                        <li><b>Rendimiento y Optimización:</b> Delegación de eventos para que el historial cargue al instante y exclusión inteligente de tasas al 0% en el Plan Avalancha.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>💎 Versión 1.2.0</span><span>▾</span></summary>
                    <ul>
                        <li><b>Onboarding Mejorado:</b> Nueva experiencia de bienvenida en dos pasos, con firma visual de Función IF.</li>
                        <li><b>Cupos Rotativos Consolidados:</b> Registra múltiples compras por comercio dentro de un mismo cupo (Addi, Sistecrédito) y controla si afectan el gasto del mes.</li>
                        <li><b>Bolsillos Inteligentes:</b> Cálculo automático de cuotas y fechas objetivo para tus metas de ahorro.</li>
                        <li><b>Fondo de Cesantías:</b> Nuevo sistema para acumular y separar tus cesantías año tras año.</li>
                        <li><b>Historial de Activos y ROI:</b> Lleva el registro de la valorización o depreciación de tu patrimonio y calcula tu Ganancia Real.</li>
                        <li><b>Liquidación Completa:</b> Módulo mejorado de nómina con vacaciones compensadas y bonos ocasionales.</li>
                        <li><b>Bolsillos en Transferencias:</b> Transfiere dinero desde o hacia tus bolsillos de ahorro directamente al registrar una transferencia.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>💎 Versión 1.1.2</span><span>▾</span></summary>
                    <ul>
                        <li>Nuevo tablero visual con anillos SVG de Salud Financiera en 4 pilares y Metas de Ahorro.</li>
                        <li>Soporte para Cupos Rotativos / BNPL (Addi, Sistecrédito) con simulador de impacto en salud.</li>
                        <li>Descuento por libranza de préstamos integrado en el cálculo de nómina neta.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>🧮 Versión 1.1.0</span><span>▾</span></summary>
                    <ul>
                        <li>Módulo completo de Nómina Colombia (Art. 383 E.T., Ley 1393, FSP, quincenas 1Q/2Q y simulador de bonos).</li>
                        <li>Planificador multi-deuda con métodos Avalancha y Bola de Nieve.</li>
                        <li>Calculadora matemática integrada sin uso de <code>eval()</code>.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>🌱 Versión 1.0.0</span><span>▾</span></summary>
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
}
window.openUniversalInfoModal = openUniversalInfoModal;

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

// Los clics del Centro de Ayuda son enrutados directamente por app.js hacia window.openUniversalInfoModal

