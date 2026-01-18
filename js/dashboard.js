// js/dashboard.js

function registrarVisita() {
    let visitas = parseInt(localStorage.getItem('stats_visitas')) || 0;
    visitas++;
    localStorage.setItem('stats_visitas', visitas.toString());
}

function renderizarDashboard(contenedor) {
    const cont = contenedor || document.getElementById('tabla-contenedor');
    if (!cont) return;

    const visitas = localStorage.getItem('stats_visitas') || 0;
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
    const proveedores = JSON.parse(localStorage.getItem('proveedores')) || [];
    
    // Filtros de estados
    const ventasConfirmadas = pedidos.filter(p => p.estado === "Completado");
    const totalIngresos = ventasConfirmadas.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
    const pedidosPendientes = pedidos.filter(p => p.estado === "Pendiente").length;

    // LÓGICA DE RANKING DE PRODUCTORES
    // Creamos un mapa de ventas por proveedor
    const ventasPorProveedor = {};
    ventasConfirmadas.forEach(pedido => {
        pedido.items.forEach(item => {
            // Buscamos el nombre del proveedor para que sea legible
            const prov = proveedores.find(pr => pr.id === item.proveedorId) || { nombre: "Otros" };
            const nombreProv = prov.nombre;
            ventasPorProveedor[nombreProv] = (ventasPorProveedor[nombreProv] || 0) + (item.precio * item.cantidad);
        });
    });

    // Ordenar de mayor a menor y sacar el máximo para la escala de las barras
    const rankingSorted = Object.entries(ventasPorProveedor).sort((a, b) => b[1] - a[1]);
    const ventaMaxima = rankingSorted.length > 0 ? rankingSorted[0][1] : 1;

    cont.innerHTML = `
        <div class="dashboard-container" style="animation: fadeIn 0.4s ease-out;">
            <div class="dashboard-header" style="margin-bottom: 2rem;">
                <h2 style="font-family: 'Outfit'; color: var(--admin-primary); font-size: 1.8rem;">Resumen Operativo</h2>
                <p class="text-muted">Análisis de impacto y ventas en Cayambe</p>
            </div>

            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                <div class="admin-card" style="display: flex; align-items: center; gap: 20px; padding: 25px;">
                    <div style="background: #e0f2fe; color: #0369a1; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size: 1.3rem;">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 0.85rem; color: #666; margin: 0;">Visitas</h3>
                        <p style="font-size: 1.6rem; font-weight: 800; margin: 0;">${visitas}</p>
                    </div>
                </div>

                <div class="admin-card" style="display: flex; align-items: center; gap: 20px; padding: 25px;">
                    <div style="background: #dcfce7; color: #15803d; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size: 1.3rem;">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 0.85rem; color: #666; margin: 0;">Ventas Netas</h3>
                        <p style="font-size: 1.6rem; font-weight: 800; margin: 0;">$${totalIngresos.toFixed(2)}</p>
                    </div>
                </div>

                <div class="admin-card" style="display: flex; align-items: center; gap: 20px; padding: 25px;">
                    <div style="background: #fef3c7; color: #b45309; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size: 1.3rem;">
                        <i class="fas fa-users"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 0.85rem; color: #666; margin: 0;">Clientes</h3>
                        <p style="font-size: 1.6rem; font-weight: 800; margin: 0;">${usuarios.length}</p>
                    </div>
                </div>

                <div class="admin-card" style="display: flex; align-items: center; gap: 20px; padding: 25px; border-bottom: 4px solid #f87171;">
                    <div style="background: #fee2e2; color: #b91c1c; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size: 1.3rem;">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 0.85rem; color: #666; margin: 0;">Pendientes</h3>
                        <p style="font-size: 1.6rem; font-weight: 800; margin: 0;">${pedidosPendientes}</p>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px; margin-top: 25px;">
                
                <div class="admin-card" style="padding: 30px;">
                    <h3 style="margin-bottom: 25px; font-size: 1.1rem;"><i class="fas fa-medal" style="color:#fbbf24;"></i> Rendimiento por Productor ($)</h3>
                    <div class="chart-bars-container" style="display: flex; flex-direction: column; gap: 20px;">
                        ${rankingSorted.length > 0 ? rankingSorted.map(([nombre, monto]) => {
                            const porcentaje = (monto / ventaMaxima) * 100;
                            return `
                                <div class="bar-item">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                                        <span><strong>${nombre}</strong></span>
                                        <span style="color: var(--admin-primary); font-weight: bold;">$${monto.toFixed(2)}</span>
                                    </div>
                                    <div style="background: #eee; height: 12px; border-radius: 10px; overflow: hidden;">
                                        <div style="background: var(--admin-accent); width: ${porcentaje}%; height: 100%; border-radius: 10px; transition: width 1s ease;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<p class="text-muted">Aún no hay datos de ventas por productor.</p>'}
                    </div>
                </div>

                <div class="admin-card" style="padding: 30px; display: flex; flex-direction: column; justify-content: center;">
                    <h3 style="margin-bottom: 20px; font-size: 1.1rem;">Estados de Orden</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 5px solid #22c55e;">
                            <small style="color: #16a34a; font-weight: bold;">Completados</small>
                            <p style="font-size: 1.4rem; font-weight: 800; margin:0;">${ventasConfirmadas.length}</p>
                        </div>
                        <div style="padding: 15px; background: #fffbeb; border-radius: 10px; border-left: 5px solid #f59e0b;">
                            <small style="color: #d97706; font-weight: bold;">Pendientes</small>
                            <p style="font-size: 1.4rem; font-weight: 800; margin:0;">${pedidosPendientes}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;
}