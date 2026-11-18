// ==========================================
// INFO.JS - CENTRO DE AYUDA, LEGAL Y NOTAS DE VERSIÓN (v2.1.0)
// Módulo independiente para mantener app.js ligero y limpio.
// ==========================================

const APP_VERSION = '2.1.0';

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
                    <p style="margin-bottom:8px;"><b>Múltiples Modalidades de Crédito:</b> Administra diferentes formatos de obligación: <i>Préstamos Fijos</i>, <i>Cupos Rotativos / BNPL (Como Addi o Sistecrédito)</i>, y <i>Créditos Educativos</i> (con soporte para agregar trámites adicionales a la liquidación o emitir un recibo de soporte txt).</p>
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
                    <summary><span>🚀 Versión 2.1.0 (Actual)</span><span>▾</span></summary>
                    <ul>
                        <li><b>Modo Viaje con Presupuesto Aislado:</b> Activa un tope exclusivo para vacaciones sin alterar tus categorías mensuales habituales, con guía interactiva, auto-etiquetado (<code>#destino</code>), filtro rápido de gastos y color de tema dedicado.</li>
                        <li><b>Cálculo y Conversión de Dólar (USD) y Euro (EUR) a COP:</b> Selector de divisa directo en el registro de movimientos con <b>cálculo en vivo a pesos colombianos</b>, constancia del valor original en la descripción, auto-etiquetado (<code>#usd</code> / <code>#eur</code>), tasas configurables y consulta de TRM oficial en tiempo real con respaldo 100% offline.</li>
                        <li><b>Asesor de Tarjetas (¿Con qué tarjeta pago hoy?):</b> Analiza días de gracia hasta la fecha de pago, cupo disponible, cuotas sin interés y metas de exoneración de cuota de manejo para recomendarte la mejor tarjeta en cada compra.</li>
                        <li><b>Simulador de Compra Inteligente:</b> Convierte cualquier precio en horas y días de trabajo según tu nómina, evalúa el impacto en tu <i>Libre Seguro Hoy</i>, el punto más bajo de caja a 30 días y el costo financiero si difieres a cuotas.</li>
                        <li><b>Simulador de Crédito y Comparador (Banco A vs. B):</b> Proyecta cuotas fijas con conversión automática <code>% E.A.</code> ↔ <code>% M.V.</code>, seguros, abonos extra a capital, cálculo de cupo máximo endeudable y comparativa real entre dos entidades financieras.</li>
                        <li><b>Proyección de Efectivo Día por Día:</b> Línea de tiempo interactiva desde <i>Libre Seguro Hoy</i> (fin de mes, 15, 30 y 60 días) con detalle desplegable por fecha y detección del punto más bajo de liquidez.</li>
                        <li><b>Calculadora de Ahorro (Interés Compuesto):</b> Proyecta el crecimiento de tu capital por edades, frecuencia de aporte y tasa E.A., con integración a tus bolsillos, gráfica SVG y tabla año por año.</li>
                        <li><b>Resumen y Cierre del Mes:</b> Carrusel guiado de 3 tarjetas Bento para revisar tu tasa de ahorro, detectar desviaciones de presupuesto y transferir excedentes directos a un bolsillo.</li>
                        <li><b>Detector de Gastos Hormiga y Alzas en Suscripciones:</b> Nueva tarjeta en Análisis con tope configurable, impacto anualizado (<code>×12</code>), ranking de compras pequeñas frecuentes y alertas de incrementos en servicios recurrentes.</li>
                        <li><b>Hoja de Balance Comparativa en Análisis:</b> Nueva tarjeta que contrasta el cierre del mes anterior contra el corte actual cuenta por cuenta, con barra de solvencia, variación neta y filtros (<i>Todos</i>, <i>Con cambios</i>, <i>Activos</i>, <i>Pasivos</i>).</li>
                        <li><b>Extractos y Proyección de Tarjetas de Crédito:</b> Selector de extractos mensuales (<code>-1</code> a <code>+4</code> meses), gráfica de barras interactiva, exoneración de cuota de manejo por compras o por ingresos en cuenta y botón para cargar cargos al saldo.</li>
                        <li><b>Cuentas Líquidas vs. Aisladas:</b> Opción en cada cuenta para excluirla del cálculo de <i>Libre Seguro Hoy</i> (ideal para CDTs o fondos intocables) sin sacarla de tu Patrimonio Neto.</li>
                        <li><b>Sistema de Etiquetas (#Tags) y Analítica de Proyectos:</b> Sugerencias rápidas de etiquetas al registrar, filtro instantáneo con total acumulado en historial y tarjeta de proyectos en Análisis.</li>
                        <li><b>Papelera de Reciclaje y Duplicación Rápida:</b> Borrado seguro reversible para restaurar movimientos eliminados y botón <i>Duplicar</i> para clonar transacciones frecuentes con fecha de hoy.</li>
                        <li><b>Ciclos de Fecha Personalizados:</b> Configura el día de corte de tu mes financiero (ej. día 5, 15 o 16) con indicador visible del rango activo en la cabecera.</li>
                        <li><b>Pendientes Virtuales (To-Do List Financiero):</b> Inyección automática en el filtro <i>Pendientes</i> de suscripciones próximas, cuotas de préstamos, pagos mínimos de tarjetas y gastos fijos por ejecutar.</li>
                        <li><b>Proyección de Declaración de Renta (Colombia):</b> Evaluación automática de topes DIAN en UVT (patrimonio, ingresos, consignaciones, tarjetas y compras) y simulación de Cédula General (Art. 241 E.T.).</li>
                        <li><b>Mapa de Calor Diario en Calendario:</b> Visualiza la intensidad de gasto diario en modo <i>Solo variable</i> o <i>Gasto total</i>, conteo de días sin gasto y promedio por día activo.</li>
                        <li><b>Cierre de Año en IndexedDB y Monitor de Memoria:</b> Escáner de almacenamiento local con alertas preventivas y archivo histórico por año sin perder el respaldo detallado.</li>
                        <li><b>Reportes Ejecutivos PDF y Modo Demo:</b> Generación de extracto mensual, soporte de deudas a favor y liquidación laboral imprimibles, además de datos de prueba en un toque para explorar la app.</li>
                        <li><b>Personalización Avanzada:</b> Formato de moneda configurable (símbolo, negativos y decimales), abreviación de cifras (<code>k</code>, <code>M</code>), modo pantalla Negro Puro (AMOLED) y modo rendimiento.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>🛠️ Versión 2.0.2</span><span>▾</span></summary>
                    <ul>
                        <li><b>Sistema de Etiquetas (#Tags):</b> Clasifica movimientos por proyecto o evento y consulta sus totales acumulados en Análisis.</li>
                        <li><b>Papelera de Reciclaje y Duplicación:</b> Recupera movimientos eliminados por error y clona registros frecuentes con fecha de hoy.</li>
                        <li><b>Ciclos de Fecha Personalizados:</b> Configura el día de corte de tu mes financiero (ej. día 15 o 16) para presupuestos y gráficos.</li>
                        <li><b>Reporte Ejecutivo PDF y Cierre de Año:</b> Generación de extracto mensual imprimible y compresión histórica en <code>IndexedDB</code>.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>✨ Versión 2.0.1</span><span>▾</span></summary>
                    <ul>
                        <li><b>Control Anual Rediseñado:</b> Nueva vista de balance anual con diseño vertical Bento UI, reemplazando la tabla horizontal para una mejor experiencia móvil sin scroll.</li>
                        <li><b>Formateador Ultracompacto:</b> Eliminación de decimales en el reporte anual para optimizar el espacio y mejorar la legibilidad de la cuadrícula.</li>
                        <li><b>Gestión de Deudas a Favor:</b> Nuevo selector de motivo en el registro de cobros (Préstamo vs Venta/Servicio) con vinculación directa al presupuesto de ingresos.</li>
                        <li><b>Correcciones (Bugfixes):</b> Solución al cálculo del presupuesto global en categorías que contienen subcategorías, y estabilización del scroll en el menú lateral.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>🧬 Versión 2.0.0</span><span>▾</span></summary>
                    <ul>
                        <li><b>Estética Fintech Editorial y Bento UI:</b> Superficies mate de alto contraste, tipografía tabular con decimales atenuados y derivación tonal dinámica (<code>color-mix</code>).</li>
                        <li><b>Formularios Plegables e Inteligentes:</b> Todos los formularios de creación ahora son desplegables para maximizar el espacio en pantalla y se cierran al guardar.</li>
                        <li><b>Iconografía Vectorial 100% Unificada:</b> Eliminación total de emojis residuales en categorías, reemplazados por íconos SVG planos y espaciado optimizado.</li>
                        <li><b>Presupuesto Adaptativo y Barra Global:</b> Los formularios mutan dinámicamente entre límites de gasto y metas de ingreso, incorporando una barra de progreso global.</li>
                        <li><b>Guía Contextual de Arrastre (Rollover):</b> Nuevo aviso explicativo dinámico que detalla el impacto del sobrante o déficit según el modo elegido.</li>
                        <li><b>Lógica Bancaria Avanzada (TC):</b> Cálculo inteligente de pagos mínimos, cuota de manejo (condicional) y seguro de deudores.</li>
                        <li><b>Ahorro de Monedas:</b> Redondeo inteligente del efectivo con contabilidad en doble partida.</li>
                        <li><b>Gestor Educativo:</b> Módulo de matrícula universitaria con plan de pagos, trámites extra y alertas a 7 días.</li>
                        <li><b>Gastos Compartidos y Deudas a Favor:</b> Divide cuentas pagadas por otros y gestiona cuentas por cobrar independientes de tu liquidez.</li>
                        <li><b>Presupuesto Restante Dinámico:</b> Auto-llenado del saldo disponible al registrar gastos y revisión de saldo en tiempo real.</li>
                        <li><b>Aumento de Sueldo y Retroactivos:</b> Simula incrementos salariales con impacto neto real y programa pagos retroactivos.</li>
                        <li><b>Ahorro Automático (Nómina):</b> Nueva opción "Descuento por nómina" en Bolsillos que abona a tus metas de ahorro automáticamente.</li>
                        <li><b>Bolsillos Ocultos:</b> Excluye metas de ahorro de la hoja de balance para proteger tu capital psicológico.</li>
                        <li><b>Suscripciones y Fijos:</b> Gestiona tus servicios recurrentes y recibe alertas tempranas para pagarlos con 1 solo toque.</li>
                        <li><b>Modo Privacidad Global:</b> Nuevo botón oculto en la cabecera ("Ojo"). Tapa al instante todos tus saldos reales con asteriscos.</li>
                        <li><b>Préstamos Fijos Flexibles:</b> Permiten registrar desembolsos adicionales manteniendo su base de amortización.</li>
                        <li><b>Analítica Suavizada y Personalizable:</b> Gráficos SVG rediseñados y reorganizables a tu gusto.</li>
                    </ul>
                </details>

                <details class="changelog-accordion">
                    <summary><span>💎 Versión 1.2.0</span><span>▾</span></summary>
                    <ul>
                        <li><b>Onboarding Mejorado:</b> Nueva experiencia de bienvenida en dos pasos, con firma visual de Función IF.</li>
                        <li><b>Cupos Rotativos Consolidados:</b> Registra múltiples compras por comercio dentro de un mismo cupo (Addi, Sistecrédito).</li>
                        <li><b>Bolsillos Inteligentes:</b> Cálculo automático de cuotas y fechas objetivo para tus metas de ahorro.</li>
                        <li><b>Fondo de Cesantías:</b> Nuevo sistema para acumular y separar tus cesantías año tras año.</li>
                        <li><b>Historial de Activos y ROI:</b> Lleva el registro de la valorización o depreciación de tu patrimonio.</li>
                        <li><b>Liquidación Completa:</b> Módulo mejorado de nómina con vacaciones compensadas y bonos ocasionales.</li>
                        <li><b>Bolsillos en Transferencias:</b> Transfiere dinero desde o hacia tus bolsillos de ahorro directamente.</li>
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
                        <li>Módulo completo de Nómina Colombia (Art. 383 E.T., Ley 1393, FSP, quincenas y simulador de bonos).</li>
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
    if (lastSeen === APP_VERSION) return;

    localStorage.setItem('myFinancesLastSeenVersion', APP_VERSION);

    const toast = document.getElementById('sw-update-toast');
    if (toast) {
        const span = toast.querySelector('span');
        if (span) span.innerText = `Nueva versión v${APP_VERSION} • Ver novedades`;
        toast.style.cursor = 'pointer';
        toast.classList.remove('hidden');
        toast.onclick = () => {
            toast.classList.add('hidden');
            openUniversalInfoModal('about');
        };
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 6500);
    }
};