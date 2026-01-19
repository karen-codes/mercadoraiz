/**
 * js/dashboard.js - Estadísticas en Tiempo Real
 * Mercado Raíz - Cayambe 2026
 */

async function renderizarDashboard(contenedor) {
    const cont = contenedor || document.getElementById('tabla-contenedor');
    if (!cont) return;

    // Mostrar loader con estilo limpio
    cont.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color:#2d3436; margin-bottom:15px;"></i>
            <p>Calculando estadísticas de la red en Cayambe...</p>
        </div>`;

    try {
        // Validación de conexión a Firebase antes de consultar
        if (typeof window.db === 'undefined') {
            throw new Error("La base de datos no está inicializada correctamente.");
        }

        // 1. Obtener datos de todas las ramas necesarias de forma paralela
        const [snapPedidos, snapUsers, snapProvs] = await Promise.all([
            window.db.ref('pedidos').once('value'),
            window.db.ref('usuarios').once('value'),
            window.db.ref('proveedores').once('value')
        ]);

        const pedidos = snapPedidos.val() || {};
        const usuarios = snapUsers.val() || {};
        const proveedores = snapProvs.val() || {};

        // 2. Procesar métricas generales
        const listaPedidos = Object.values(pedidos);
        const ventasConfirmadas = listaPedidos.filter(p => p.estado === "Completado" || p.estado === "Validado");
        const pedidosPendientes = listaPedidos.filter(p => p.estado === "Pendiente").length;
        
        const totalIngresos = ventasConfirmadas.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
        const totalClientes = Object.keys(usuarios).length;

        // 3. Lógica de Ranking de Productores (Ventas acumuladas)
        const ventasPorProveedor = {};
        ventasConfirmadas.forEach(pedido => {
            if (pedido.items) {
                // Si items es un objeto (Firebase a veces lo envía así), lo convertimos a array
                const itemsArray = Array.isArray(pedido.items) ? pedido.items : Object.values(pedido.items);
                
                itemsArray.forEach(item => {
                    const provId = item.proveedorId || 'independiente';
                    const provInfo = proveedores[provId] || { nombre: "Productor Independiente" };
                    const nombreProv = provInfo.nombre;
                    const subtotalItem = parseFloat(item.precio || 0) * parseInt(item.cantidad || 0);
                    
                    ventasPorProveedor[nombreProv] = (ventasPorProveedor[nombreProv] || 0) + subtotalItem;
                });
            }
        });

        const rankingSorted = Object.entries(ventasPorProveedor).sort((a, b) => b[1] - a[1]);
        const ventaMaxima = rankingSorted.length > 0 ? rankingSorted[0][1] : 1;

        // 4. Renderizar Interfaz de Usuario
        cont.innerHTML = `
            <div class="dashboard-container" style="animation: fadeIn 0.5s ease-out;">
                <div class="dashboard-header" style="margin-bottom: 2rem;">
                    <h2 style="font-family: 'Outfit', sans-serif; color: #2d3436; font-size: 1.8rem;">Impacto Económico 2026</h2>
                    <p class="text-muted">Resumen de transacciones en la red de Cayambe</p>
                </div>

                <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                    <div class="admin-card" style="display: flex; align-items: center; gap: 20px; padding: 25px; background:white; border-radius:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <div style="background: #dcfce7; color: #15803d; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size: 1.3rem;">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 0.85rem; color: #666; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Ventas Totales</h3>
                            <p style="font-size: 1.6rem; font-weight: 800; margin: 0; color: #2d3436;">$${totalIngresos.toFixed(2)}</p>
                        </div>
                    </div>

                    <div class="admin-card" style="display: flex; align-items: center; gap: 20px; padding: 25px; background:white; border-radius:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <div style="background: #e0f2fe; color: #0369a1; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size: 1.3rem;">
                            <i class="fas fa-users"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 0.85rem; color: #666; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Base de Clientes</h3>
                            <p style="font-size: 1.6rem; font-weight: 800; margin: 0; color: #2d3436;">${totalClientes}</p>
                        </div>
                    </div>

                    <div class="admin-card" style="display: flex; align-items: center; gap: 20px; padding: 25px; background:white; border-radius:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-bottom: 4px solid #fbbf24;">
                        <div style="background: #fffbeb; color: #b45309; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size: 1.3rem;">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 0.85rem; color: #666; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Pagos por Validar</h3>
                            <p style="font-size: 1.6rem; font-weight: 800; margin: 0; color: #2d3436;">${pedidosPendientes}</p>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin-top: 25px;">
                    <div class="admin-card" style="padding: 30px; background:white; border-radius:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <h3 style="margin-bottom: 25px; font-size: 1.1rem; color:#2d3436;"><i class="fas fa-chart-bar" style="margin-right:10px; color:#6c5ce7;"></i> Rendimiento por Parcela</h3>
                        <div class="chart-bars-container" style="display: flex; flex-direction: column; gap: 20px;">
                            ${rankingSorted.length > 0 ? rankingSorted.map(([nombre, monto]) => {
                                const porcentaje = (monto / ventaMaxima) * 100;
                                return `
                                    <div class="bar-item">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                                            <span><strong>${nombre}</strong></span>
                                            <span style="color: #15803d; font-weight: bold;">$${monto.toFixed(2)}</span>
                                        </div>
                                        <div style="background: #f0f0f0; height: 12px; border-radius: 10px; overflow: hidden;">
                                            <div style="background: linear-gradient(90deg, #6c5ce7, #a29bfe); width: ${porcentaje}%; height: 100%; border-radius: 10px; transition: width 1s ease-in-out;"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('') : '<p class="text-muted" style="text-align:center; padding:20px;">No hay ventas confirmadas para mostrar ranking.</p>'}
                        </div>
                    </div>

                    <div class="admin-card" style="padding: 30px; background:white; border-radius:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <h3 style="margin-bottom: 20px; font-size: 1.1rem; color:#2d3436;">Control de Operaciones</h3>
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <div style="padding: 20px; background: #f0fdf4; border-radius: 12px; border-left: 5px solid #22c55e;">
                                <small style="color: #16a34a; font-weight: bold; text-transform:uppercase; display:block; margin-bottom:5px;">Pedidos Entregados</small>
                                <p style="font-size: 1.8rem; font-weight: 800; margin:0; color:#15803d;">${ventasConfirmadas.length}</p>
                            </div>
                            <div style="padding: 20px; background: #fff1f2; border-radius: 12px; border-left: 5px solid #e11d48;">
                                <small style="color: #e11d48; font-weight: bold; text-transform:uppercase; display:block; margin-bottom:5px;">En Espera de Pago</small>
                                <p style="font-size: 1.8rem; font-weight: 800; margin:0; color:#9f1239;">${pedidosPendientes}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error al generar dashboard:", error);
        cont.innerHTML = `
            <div style="text-align:center; padding:40px; color:#d63031; background:#fab1a022; border-radius:10px;">
                <i class="fas fa-exclamation-triangle fa-2x"></i>
                <p style="margin-top:10px; font-weight:bold;">Error de sincronización</p>
                <p style="font-size:0.9rem;">${error.message}</p>
                <button onclick="renderizarDashboard()" style="margin-top:15px; padding:8px 15px; border:none; background:#d63031; color:white; border-radius:5px; cursor:pointer;">Reintentar</button>
            </div>`;
    }
}