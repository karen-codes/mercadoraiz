/**
 * js/dashboard.js - Estadísticas en Tiempo Real
 * Mercado Raíz - Cayambe 2026
 */

window.renderizarDashboard = async function(contenedor) {
    const cont = contenedor || document.getElementById('tabla-contenedor');
    if (!cont) return;

    // Loader inicial
    cont.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color:#6c5ce7; margin-bottom:15px;"></i>
            <p style="font-family:'Outfit',sans-serif;">Calculando impacto económico en Cayambe...</p>
        </div>`;

    try {
        // 1. Obtener datos usando la referencia directa de Firebase para evitar el error de "db undefined"
        const [snapPedidos, snapUsers, snapProvs] = await Promise.all([
            firebase.database().ref('pedidos').once('value'),
            firebase.database().ref('usuarios').once('value'),
            firebase.database().ref('proveedores').once('value')
        ]);

        const pedidos = snapPedidos.val() || {};
        const usuarios = snapUsers.val() || {};
        const proveedores = snapProvs.val() || {};

        // 2. Procesar métricas generales
        const listaPedidos = Object.values(pedidos);
        // Filtramos por estados confirmados
        const ventasConfirmadas = listaPedidos.filter(p => p.estado === "Validado" || p.estado === "Entregado");
        const pedidosPendientes = listaPedidos.filter(p => p.estado === "Pendiente" || !p.estado).length;
        
        const totalIngresos = ventasConfirmadas.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
        const totalClientes = Object.keys(usuarios).length;

        // 3. Lógica de Ranking de Productores
        const ventasPorProveedor = {};
        ventasConfirmadas.forEach(pedido => {
            if (pedido.items) {
                const itemsArray = Array.isArray(pedido.items) ? pedido.items : Object.values(pedido.items);
                
                itemsArray.forEach(item => {
                    // Si el item no tiene nombre de parcela, usamos un genérico
                    const nombreProv = item.nombreParcela || item.proveedor || "Productor Varios";
                    const subtotalItem = parseFloat(item.precio || 0) * parseInt(item.cantidad || 0);
                    
                    ventasPorProveedor[nombreProv] = (ventasPorProveedor[nombreProv] || 0) + subtotalItem;
                });
            }
        });

        const rankingSorted = Object.entries(ventasPorProveedor).sort((a, b) => b[1] - a[1]);
        const ventaMaxima = rankingSorted.length > 0 ? rankingSorted[0][1] : 1;

        // 4. Renderizar Interfaz
        cont.innerHTML = `
            <div style="animation: fadeIn 0.5s ease-out; font-family:'Outfit', sans-serif;">
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #2d3436; font-size: 1.8rem; margin:0;">Impacto Económico 2026</h2>
                    <p style="color:#636e72; margin:5px 0 0 0;">Análisis de transacciones y crecimiento de la red</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom:25px;">
                    <div class="admin-card" style="display:flex; align-items:center; gap:20px; padding:25px; background:white; border-radius:15px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                        <div style="background:#dcfce7; color:#15803d; width:55px; height:55px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                        <div>
                            <h3 style="font-size:0.8rem; color:#636e72; margin:0; text-transform:uppercase;">Ventas Totales</h3>
                            <p style="font-size:1.6rem; font-weight:800; margin:0; color:#2d3436;">$${totalIngresos.toFixed(2)}</p>
                        </div>
                    </div>

                    <div class="admin-card" style="display:flex; align-items:center; gap:20px; padding:25px; background:white; border-radius:15px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                        <div style="background:#e0f2fe; color:#0369a1; width:55px; height:55px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
                            <i class="fas fa-users"></i>
                        </div>
                        <div>
                            <h3 style="font-size:0.8rem; color:#636e72; margin:0; text-transform:uppercase;">Clientes Activos</h3>
                            <p style="font-size:1.6rem; font-weight:800; margin:0; color:#2d3436;">${totalClientes}</p>
                        </div>
                    </div>

                    <div class="admin-card" style="display:flex; align-items:center; gap:20px; padding:25px; background:white; border-radius:15px; box-shadow:0 4px 6px rgba(0,0,0,0.05); border-bottom:4px solid #fbbf24;">
                        <div style="background:#fffbeb; color:#b45309; width:55px; height:55px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div>
                            <h3 style="font-size:0.8rem; color:#636e72; margin:0; text-transform:uppercase;">Pagos Pendientes</h3>
                            <p style="font-size:1.6rem; font-weight:800; margin:0; color:#2d3436;">${pedidosPendientes}</p>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px;">
                    <div style="padding:30px; background:white; border-radius:15px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                        <h3 style="margin-bottom:25px; font-size:1.1rem; color:#2d3436;"><i class="fas fa-chart-bar" style="margin-right:10px; color:#6c5ce7;"></i> Ventas por Parcela</h3>
                        <div style="display:flex; flex-direction:column; gap:20px;">
                            ${rankingSorted.length > 0 ? rankingSorted.map(([nombre, monto]) => {
                                const porcentaje = (monto / ventaMaxima) * 100;
                                return `
                                    <div>
                                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
                                            <span><strong>${nombre}</strong></span>
                                            <span style="color:#15803d; font-weight:bold;">$${monto.toFixed(2)}</span>
                                        </div>
                                        <div style="background:#f0f0f0; height:10px; border-radius:10px; overflow:hidden;">
                                            <div style="background:linear-gradient(90deg, #6c5ce7, #a29bfe); width:${porcentaje}%; height:100%; border-radius:10px;"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('') : '<p style="text-align:center; color:#999; padding:20px;">No hay transacciones validadas aún.</p>'}
                        </div>
                    </div>

                    <div style="padding:30px; background:white; border-radius:15px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                        <h3 style="margin-bottom:20px; font-size:1.1rem; color:#2d3436;">Estado de Operaciones</h3>
                        <div style="display:flex; flex-direction:column; gap:15px;">
                            <div style="padding:20px; background:#f0fdf4; border-radius:12px; border-left:5px solid #22c55e;">
                                <small style="color:#16a34a; font-weight:bold; text-transform:uppercase;">Órdenes Exitosas</small>
                                <p style="font-size:1.8rem; font-weight:800; margin:0; color:#15803d;">${ventasConfirmadas.length}</p>
                            </div>
                            <div style="padding:20px; background:#fff1f2; border-radius:12px; border-left:5px solid #e11d48;">
                                <small style="color:#e11d48; font-weight:bold; text-transform:uppercase;">Órdenes en Espera</small>
                                <p style="font-size:1.8rem; font-weight:800; margin:0; color:#9f1239;">${pedidosPendientes}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error Dashboard:", error);
        cont.innerHTML = `<div style="text-align:center; padding:40px; color:#e11d48;"><i class="fas fa-times-circle fa-2x"></i><p>${error.message}</p></div>`;
    }
};