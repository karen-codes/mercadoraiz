// REGISTRO DE VISITAS (Se ejecuta en index.html)
function registrarVisita() {
    let visitas = parseInt(localStorage.getItem('stats_visitas')) || 0;
    visitas++;
    localStorage.setItem('stats_visitas', visitas.toString());
}

/**
 * Renderiza los cuadros de métricas en admin.html
 * @param {HTMLElement} cont - El contenedor donde se inyectará el dashboard
 */
function renderizarDashboard(cont) {
    const visitas = localStorage.getItem('stats_visitas') || 0;
    const pedidos = JSON.parse(localStorage.getItem('pedidos_db')) || [];
    const usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
    const productos = JSON.parse(localStorage.getItem('productos')) || [];
    
    // Lógica de Negocio
    const ventasConfirmadas = pedidos.filter(p => p.estado === "Pagado/Confirmado");
    const totalIngresos = ventasConfirmadas.reduce((sum, p) => sum + parseFloat(p.total), 0);
    const pedidosPendientes = pedidos.filter(p => p.estado === "Por Confirmar").length;

    let html = `
        <div class="dashboard-header">
            <h1>Panel de Control</h1>
            <p>Resumen operativo de Mercado Raíz</p>
        </div>

        <div class="dashboard-grid">
            <div class="card-metrica">
                <div class="icon-circle"><i class="fas fa-eye"></i></div>
                <h3>Visitas Totales</h3>
                <p class="numero">${visitas}</p>
                <span class="label">Alcance de la página</span>
            </div>

            <div class="card-metrica">
                <div class="icon-circle" style="background: rgba(174, 110, 36, 0.1); color: var(--color-acento);">
                    <i class="fas fa-hand-holding-usd"></i>
                </div>
                <h3>Ventas Confirmadas</h3>
                <p class="numero">$${totalIngresos.toFixed(2)}</p>
                <span class="label">${ventasConfirmadas.length} pedidos pagados</span>
            </div>

            <div class="card-metrica">
                <div class="icon-circle"><i class="fas fa-users"></i></div>
                <h3>Clientes</h3>
                <p class="numero">${usuarios.length}</p>
                <span class="label">Registrados en la base</span>
            </div>

            <div class="card-metrica" style="border-left: 5px solid #facc15;">
                <div class="icon-circle" style="background: #fefce8; color: #a16207;">
                    <i class="fas fa-clock"></i>
                </div>
                <h3>Pendientes</h3>
                <p class="numero">${pedidosPendientes}</p>
                <span class="label">Pagos por validar</span>
            </div>
        </div>

        <div class="dashboard-charts" style="margin-top: 30px;">
            <div class="admin-card">
                <h3>Estado de Pedidos Actuales</h3>
                <div class="chart-summary">
                    <div class="stat-item">
                        <span class="dot" style="background: #10b981;"></span>
                        Entregados: <strong>${ventasConfirmadas.length}</strong>
                    </div>
                    <div class="stat-item">
                        <span class="dot" style="background: #facc15;"></span>
                        Pendientes: <strong>${pedidosPendientes}</strong>
                    </div>
                    <div class="stat-item">
                        <span class="dot" style="background: #ef4444;"></span>
                        Cancelados: <strong>${pedidos.filter(p => p.estado === "Cancelado").length}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
    cont.innerHTML = html;
}

// Auto-ejecución al cargar admin.html
document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('dashboard-container');
    if (contenedor) {
        renderizarDashboard(contenedor);
    }
});