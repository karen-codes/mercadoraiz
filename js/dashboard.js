// Inicializar contadores si no existen
if (!localStorage.getItem('stats_visitas')) localStorage.setItem('stats_visitas', '0');

// Función para registrar una visita (llamar desde index.html)
function registrarVisita() {
    let visitas = parseInt(localStorage.getItem('stats_visitas'));
    visitas++;
    localStorage.setItem('stats_visitas', visitas.toString());
}

// Función principal para renderizar el Dashboard
function renderizarDashboard(cont) {
    const visitas = localStorage.getItem('stats_visitas');
    const pedidos = JSON.parse(localStorage.getItem('pedidos_db')) || [];
    const usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
    
    // Cálculos de métricas
    const ventasConfirmadas = pedidos.filter(p => p.estado === "Pagado/Confirmado");
    const totalIngresos = ventasConfirmadas.reduce((sum, p) => sum + parseFloat(p.total), 0);
    const pedidosPendientes = pedidos.filter(p => p.estado === "Por Confirmar").length;

    let html = `
        <div class="dashboard-grid">
            <div class="card-metrica">
                <h3>Visitas Totales</h3>
                <p class="numero">${visitas}</p>
                <span>Alcance de la página</span>
            </div>
            <div class="card-metrica">
                <h3>Ventas Totales</h3>
                <p class="numero">$${totalIngresos.toFixed(2)}</p>
                <span>Ingresos confirmados</span>
            </div>
            <div class="card-metrica">
                <h3>Clientes</h3>
                <p class="numero">${usuarios.length}</p>
                <span>Usuarios registrados</span>
            </div>
            <div class="card-metrica" style="border-left: 4px solid #facc15;">
                <h3>Pendientes</h3>
                <p class="numero">${pedidosPendientes}</p>
                <span>Pagos por validar</span>
            </div>
        </div>

        <div class="dashboard-charts">
            <div class="chart-placeholder">
                <h3>Estado de Pedidos</h3>
                <ul>
                    <li>✅ Entregados: ${ventasConfirmadas.length}</li>
                    <li>⏳ Pendientes: ${pedidosPendientes}</li>
                    <li>❌ Cancelados: ${pedidos.filter(p => p.estado === "Cancelado").length}</li>
                </ul>
            </div>
        </div>
    `;
    cont.innerHTML = html;
}