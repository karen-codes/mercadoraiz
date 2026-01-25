/**
 * js/admin-modulos/admin-pagos.js
 * Liquidaciones a Productores - Mercado Raíz 2026
 */

window.initPagos = function(contenedor) {
    contenedor.innerHTML = `
        <div class="admin-card">
            <div style="margin-bottom: 20px;">
                <p style="color: var(--text-muted);">Ventas acumuladas por productor (Solo de pedidos con estado "Pagado").</p>
            </div>
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>Productor</th>
                        <th>Datos Bancarios</th>
                        <th>Ventas Totales</th>
                        <th>Estado Pago</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="lista-pagos">
                    <tr><td colspan="5" style="text-align:center;">Procesando cuentas...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    calcularPagos();
};

async function calcularPagos() {
    try {
        // 1. Obtener proveedores y pedidos de forma sincronizada
        const provSnap = await window.db.ref('proveedores').once('value');
        const proveedores = provSnap.val() || {};
        
        const snapPedidos = await window.db.ref('pedidos').once('value');
        const pedidos = snapPedidos.val() || {};

        const tbody = document.getElementById('lista-pagos');
        if (!tbody) return;
        tbody.innerHTML = "";

        // 2. Procesar cada proveedor
        Object.entries(proveedores).forEach(([idProv, prov]) => {
            let acumulado = 0;
            
            // Recorrer todos los pedidos de la base de datos
            Object.values(pedidos).forEach(pedido => {
                // REGLA: Solo sumamos si el cliente YA PAGÓ a Mercado Raíz
                if (pedido.estado === 'Pagado' && pedido.items) {
                    
                    // Sumar los productos que pertenecen a este productor específico
                    pedido.items.forEach(item => {
                        if (item.idProductor === idProv) {
                            const precio = parseFloat(item.precio || 0);
                            const cantidad = parseInt(item.cantidad || 0);
                            acumulado += (precio * cantidad);
                        }
                    });
                }
            });

            // 3. Renderizar solo si tiene ventas
            if (acumulado > 0) {
                const totalFormateado = window.formatearUSD ? window.formatearUSD(acumulado) : `$${acumulado.toFixed(2)}`;
                
                tbody.innerHTML += `
                    <tr>
                        <td>
                            <strong>${prov.nombreParcela || prov.nombre || 'Productor'}</strong><br>
                            <small style="color: #666;">${prov.comunidad || 'Cayambe'}</small>
                        </td>
                        <td>
                            <div style="font-size: 0.8rem; background: #f1f2f6; padding: 8px; border-radius: 6px; border-left: 3px solid #8da281;">
                                <strong>${prov.banco || 'No registrado'}</strong><br>
                                <span style="color:#555;">Cuenta: ${prov.numeroCuenta || 'S/N'}</span><br>
                                <span style="color:#555;">Titular: ${prov.nombreTitular || prov.nombre || 'S/D'}</span>
                            </div>
                        </td>
                        <td><strong style="color: #27ae60; font-size: 1.1rem;">${totalFormateado}</strong></td>
                        <td><span class="status-badge status-pendiente">Pendiente de Envío</span></td>
                        <td>
                            <button class="btn-save" style="padding:8px 12px; font-size:0.8rem; background:#25d366; border:none;" 
                                    onclick="window.notificarPago('${prov.telefono}', ${acumulado}, '${prov.nombreParcela}')">
                                <i class="fab fa-whatsapp"></i> Avisar Liquidación
                            </button>
                        </td>
                    </tr>
                `;
            }
        });

        if (tbody.innerHTML === "") {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px;">No hay ventas pagadas pendientes de liquidación.</td></tr>';
        }

    } catch (error) {
        console.error("Error en módulo de Pagos:", error);
        const tbody = document.getElementById('lista-pagos');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Error al cargar datos bancarios.</td></tr>';
    }
}

/**
 * Notificación mejorada por WhatsApp
 */
window.notificarPago = function(telefono, monto, nombreFinca) {
    if (!telefono || telefono === 'S/N') {
        alert("El productor no tiene un teléfono registrado.");
        return;
    }
    
    const montoTxt = window.formatearUSD ? window.formatearUSD(monto) : `$${monto.toFixed(2)}`;
    const mensaje = encodeURIComponent(`¡Hola ${nombreFinca}! 🌿\n\nDesde *Mercado Raíz* te informamos que hemos procesado tus ventas acumuladas por un valor de *${montoTxt}*.\n\nPor favor, verifica tu cuenta bancaria en las próximas horas. ¡Gracias por cultivar con nosotros! 👩‍🌾👨‍🌾`);
    
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
};