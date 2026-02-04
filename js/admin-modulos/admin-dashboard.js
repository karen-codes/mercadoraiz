/**
 * js/admin-modulos/admin-dashboard.js
 * Estadísticas y Resumen - Mercado Raíz 2026
 */

window.initDashboard = function(contenedor) {
    contenedor.innerHTML = `
        <div class="form-grid" style="margin-bottom: 30px;">
            <div class="admin-card" style="text-align: center; border-bottom: 5px solid var(--primary);">
                <i class="fas fa-boxes fa-2x" style="color: var(--primary); margin-bottom:10px;"></i>
                <h3 id="dash-prod-count">0</h3>
                <p>Productos</p>
            </div>
            <div class="admin-card" style="text-align: center; border-bottom: 5px solid var(--info);">
                <i class="fas fa-shopping-basket fa-2x" style="color: var(--info); margin-bottom:10px;"></i>
                <h3 id="dash-ped-count">0</h3>
                <p>Pedidos Totales</p>
            </div>
            <div class="admin-card" style="text-align: center; border-bottom: 5px solid var(--warning);">
                <i class="fas fa-dollar-sign fa-2x" style="color: var(--warning); margin-bottom:10px;"></i>
                <h3 id="dash-ventas-total">$0.00</h3>
                <p>Ventas Pagadas</p>
            </div>
            <div class="admin-card" style="text-align: center; border-bottom: 5px solid var(--secondary);">
                <i class="fas fa-users fa-2x" style="color: var(--secondary); margin-bottom:10px;"></i>
                <h3 id="dash-user-count">0</h3>
                <p>Clientes</p>
            </div>
        </div>

        <div class="admin-card">
            <h3><i class="fas fa-bolt"></i> Actividad Reciente</h3>
            <p style="color: var(--text-muted); margin-bottom: 15px;">Resumen del estado actual de la plataforma.</p>
            <div id="dash-actividad" style="line-height: 2;">
                Cargando datos...
            </div>
        </div>
    `;

    calcularEstadisticas();
};
function calcularEstadisticas() {
    // 1. Contar Productos con validación
    window.db.ref('productos').on('value', snap => {
        const el = document.getElementById('dash-prod-count');
        if (el) el.innerText = snap.numChildren();
    });

    // 2. Contar Usuarios con validación
    window.db.ref('usuarios').on('value', snap => {
        const el = document.getElementById('dash-user-count');
        if (el) el.innerText = snap.numChildren();
    });

    // 3. Procesar Pedidos con validación integral
    window.db.ref('pedidos').on('value', snap => {
        let totalPedidos = 0;
        let dineroTotal = 0;
        let pendientes = 0;

        snap.forEach(child => {
            const p = child.val();
            totalPedidos++;
            if (p.estado === 'Pagado') {
                dineroTotal += parseFloat(p.total || 0);
            } else {
                pendientes++;
            }
        });

        // Solo intentamos escribir si los elementos existen en el HTML actual
        const elPed = document.getElementById('dash-ped-count');
        const elVentas = document.getElementById('dash-ventas-total');
        const elActividad = document.getElementById('dash-actividad');

        if (elPed) elPed.innerText = totalPedidos;
        if (elVentas) elVentas.innerText = window.formatearUSD ? window.formatearUSD(dineroTotal) : `$${dineroTotal.toFixed(2)}`;
        
        if (elActividad) {
            elActividad.innerHTML = `
                <div><i class="fas fa-clock" style="color: var(--warning);"></i> Tienes <strong>${pendientes}</strong> pedidos pendientes por procesar.</div>
                <div><i class="fas fa-check-circle" style="color: var(--primary);"></i> El sistema está conectado y operando correctamente.</div>
            `;
        }
    });
}