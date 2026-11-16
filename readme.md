# 🏦 Mis Finanzas • Función IF

**Mis Finanzas** es una Progressive Web App (PWA) de gestión financiera personal con un enfoque estricto en la **privacidad** y arquitectura **Local-First**. Todo ocurre en tu dispositivo; no hay servidores, no hay bases de datos en la nube y no hay rastreadores.

Diseñada con una estética "Fintech Editorial" y Bento UI, esta aplicación ofrece un ecosistema completo que va desde el control básico de gastos hasta cálculos complejos de nómina colombiana y amortización bancaria, todo usando tecnologías web nativas.

## ✨ Características Principales

*   🔒 **100% Local-First y Offline:** Los datos se almacenan exclusivamente en el `localStorage` del navegador. Funciona perfectamente en modo avión.
*   🇨🇴 **Motor Laboral y Tributario (Colombia):** Cálculo preciso de salario neto, Retefuente (Art. 383 E.T.), deducciones, Ley 1393, FSP, primas, cesantías y liquidación de vacaciones.
*   💳 **Lógica Bancaria Real:** Tarjetas de crédito con separación exacta de capital e intereses, cuotas de manejo condicionales, seguros de vida y exoneraciones dinámicas.
*   📈 **Planificador de Deudas:** Simulación de pagos extra usando los métodos Bola de Nieve y Avalancha.
*   🎯 **Bolsillos Inteligentes:** Metas de ahorro con cálculo de cuotas sugeridas y opción de retención automática por nómina.
*   📊 **Analítica Integrada:** Gráficos SVG interactivos (Patrimonio, Flujo de Caja, Presupuesto) y exportación de reportes a PDF.
*   🕶️ **Modo Privacidad Nativo:** Oculta todos los saldos en pantalla instantáneamente para usar la app de forma segura en espacios públicos.
*   🔐 **Seguridad Integrada:** Bloqueo de la aplicación mediante un PIN encriptado (Hash).

## 🛠️ Tecnologías (Stack)

Este proyecto fue construido priorizando el rendimiento, la ligereza y la ausencia de dependencias externas:

*   **HTML5** (Semántico y accesible)
*   **CSS3** (Variables nativas, Flexbox/Grid, `color-mix()` para derivación tonal dinámica. Cero frameworks como Tailwind o Bootstrap).
*   **Vanilla JavaScript (ES6+)** (Toda la lógica de estado, renderizado del DOM y motor matemático sin React, Vue o Angular).
*   **PWA Standard** (Service Worker `sw.js` y `manifest.json` para instalabilidad en iOS/Android).

## 📦 Respaldo de Datos
Dado que la aplicación es Local-First, incluye un sistema nativo para **exportar e importar copias de seguridad en formato `.json`**, asegurando que el usuario tenga control total sobre la portabilidad de su información.

---
*Desarrollado por **Función IF**.*