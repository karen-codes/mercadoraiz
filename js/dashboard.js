/**
 * js/dashboard.js - Estadísticas en Tiempo Real
 * Mercado Raíz - Cayambe
 */

async function renderizarDashboard(contenedor) {
    const cont = contenedor || document.getElementById('tabla-contenedor');
    if (!cont) return;

    // Mostrar loader mientras se procesan los datos de la nube
    cont.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color:var(--admin-primary);"></i>
            <p>Calculando estadísticas de la red...</p>
        </div>`;

    try {
        // 1. Obtener datos de todas las ramas necesarias
        const [snapPedidos, snapUsers, snapProvs] = await Promise.all([
            db.ref('pedidos').once('value'),
            db.ref('usuarios').once('value'),
            db.ref('proveedores').once('value')
        ]);

        const pedidos = snapPedidos.val() || {};
        const usuarios = snapUsers.val() || {};
        const proveedores = snapProvs.val() || {};

        // 2. Procesar métricas
        const listaPedidos = Object.values(pedidos);
        const ventasConfirmadas = listaPedidos.filter(p => p.estado === "Completado" || p.estado === "Validado");
        const pedidosPendientes = listaPedidos.filter(p => p.estado === "Pendiente").length;
        
        const totalIngresos = ventasConfirmadas.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
        const totalClientes = Object.keys(usuarios).length;

        // 3. Lógica de Ranking de Productores (Ventas acumuladas)
        const ventasPorProveedor = {};
        ventasConfirmadas.forEach(pedido => {
            if (pedido.items) {
                pedido.items.forEach(item => {
                    // Usamos el nombre del proveedor desde la base de datos de proveedores
                    const provInfo = proveedores[item.proveedorId] || { nombre: "Productor Independiente" };
                    const nombreProv = provInfo.nombre;
                    const subtotalItem = parseFloat(item.precio || 0) * parseInt(item.cantidad || 0);
                    
                    ventasPorProveedor[nombreProv] = (ventasPorProveedor[nombreProv] || 0) + subtotalItem;
                });
            }
        });

        const rankingSorted = Object.entries(ventasPorProveedor).sort((a, b) => b[1] - a[1]);
        const ventaMaxima = rankingSorted.length > 0 ? rankingSorted[0][1] : 1;

        // 4. Renderizar UI
        cont.innerHTML = `
            <div class="dashboard-container" style="animation: fadeIn 0.4s ease-out;">
                <div class="dashboard-header" style="margin-bottom: 2rem;">
                    <h2 style="font-family: 'Outfit'; color: var(--admin-primary); font-size: 1.8rem;">Panel de Control 2026</h2>
                    <p class="text-muted">Impacto económico en la red de Cayambe</p>
                </div>

                <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                    <div class="admin-card" style="display: flex; align-items: center; gap: 20px; padding: 25px;">
                        <div style="background: #dcfce7; color: #15803d; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size: 1.3rem;">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 0.85rem; color: #666; margin: 0;">Ventas Validadas</h3>
                            <p style="font-size: 1.6rem; font-weight: 800; margin: 0;">$${totalIngresos.toFixed(2)}</p>
                        </div>
                    </div>

                    <div class="admin-card" style="display: flex; align-items: center; gap: 20px; padding: 25px;">
                        <div style="background: #e0f2fe; color: #0369a1; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size: 1.3rem;">
                            <i class="fas fa-users"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 0.85rem; color: #666; margin: 0;">Clientes Activos</h3>
                            <p style="font-size: 1.6rem; font-weight: 800; margin: 0;">${totalClientes}</p>
                        </div>
                    </div>

                    <div class="admin-card" style="display: flex; align-items: center; gap: 20px; padding: 25px; border-bottom: 4px solid #fbbf24;">
                        <div style="background: #fffbeb; color: #b45309; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size: 1.3rem;">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 0.85rem; color: #666; margin: 0;">Por Validar Pago</h3>
                            <p style="font-size: 1.6rem; font-weight: 800; margin: 0;">${pedidosPendientes}</p>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px; margin-top: 25px;">
                    <div class="admin-card" style="padding: 30px;">
                        <h3 style="margin-bottom: 25px; font-size: 1.1rem;"><i class="fas fa-chart-line" style="color:var(--admin-primary);"></i> Ventas por Parcela</h3>
                        <div class="chart-bars-container" style="display: flex; flex-direction: column; gap: 20px;">
                            ${rankingSorted.length > 0 ? rankingSorted.map(([nombre, monto]) => {
                                const porcentaje = (monto / ventaMaxima) * 100;
                                return `
                                    <div class="bar-item">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                                            <span><strong>${nombre}</strong></span>
                                            <span style="color: var(--admin-primary); font-weight: bold;">$${monto.toFixed(2)}</span>
                                        </div>
                                        <div style="background: #f0f0f0; height: 12px; border-radius: 10px; overflow: hidden;">
                                            <div style="background: var(--admin-primary); width: ${porcentaje}%; height: 100%; border-radius: 10px; transition: width 1.5s ease;"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('') : '<p class="text-muted">Esperando datos de pedidos completados...</p>'}
                        </div>
                    </div>

                    <div class="admin-card" style="padding: 30px;">
                        <h3 style="margin-bottom: 20px; font-size: 1.1rem;">Estado de Órdenes</h3>
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <div style="padding: 15px; background: #f0fdf4; border-radius: 10px;">
                                <small style="color: #16a34a; font-weight: bold; text-transform:uppercase;">Validados</small>
                                <p style="font-size: 1.4rem; font-weight: 800; margin:0;">${ventasConfirmadas.length}</p>
                            </div>
                            <div style="padding: 15px; background: #fff1f2; border-radius: 10px;">
                                <small style="color: #e11d48; font-weight: bold; text-transform:uppercase;">Pendientes</small>
                                <p style="font-size: 1.4rem; font-weight: 800; margin:0;">${pedidosPendientes}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error al generar dashboard:", error);
        cont.innerHTML = `<p style="color:red; text-align:center;">Error al cargar estadísticas: ${error.message}</p>`;
    }
}