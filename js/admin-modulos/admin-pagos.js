/**
 * js/admin-modulos/admin-pagos.js
 * Liquidaciones a Productores - Mercado Raíz 2026
 */

window.initPagos = function(contenedor) {
    contenedor.innerHTML = `
        <div class="admin-card">
            <div style="margin-bottom: 20px;">
                <p style="color: var(--text-muted);">Calcula las ventas acumuladas por productor para realizar las liquidaciones bancarias.</p>
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
        // 1. Obtener proveedores y pedidos
        const proveedores = await window.obtenerDatos('proveedores');
        const snapPedidos = await window.db.ref('pedidos').once('value');
        const pedidos = snapPedidos.val() || {};

        const tbody = document.getElementById('lista-pagos');
        if (!tbody) return;
        tbody.innerHTML = "";

        // 2. Mapear ventas por productor
        proveedores.forEach(prov => {
            let acumulado = 0;
            
            // Recorrer pedidos para sumar los que pertenecen a este productor
            // Nota: Aquí se asume que cada ítem del pedido tiene su idProductor
            Object.values(pedidos).forEach(pedido => {
                if (pedido.estado === 'Pagado' && pedido.items) {
                    pedido.items.forEach(item => {
                        if (item.idProductor === prov.id) {
                            acumulado += parseFloat(item.subtotal || 0);
                        }
                    });
                }
            });

            if (acumulado > 0) {
                tbody.innerHTML += `
                    <tr>
                        <td>
                            <strong>${prov.nombreParcela}</strong><br>
                            <small>${prov.comunidad}</small>
                        </td>
                        <td>
                            <div style="font-size: 0.85rem; background: #f9f9f9; padding: 5px; border-radius: 4px;">
                                <strong>${prov.banco || 'S/B'}</strong><br>
                                Cuenta: ${prov.numeroCuenta || 'S/N'}<br>
                                ID: ${prov.dni || 'S/D'}
                            </div>
                        </td>
                        <td><strong style="color: var(--primary);">${window.formatearUSD(acumulado)}</strong></td>
                        <td><span class="status-badge status-pendiente">Pendiente</span></td>
                        <td>
                            <button class="btn-save" style="padding:8px; font-size:0.8rem;" onclick="notificarPago('${prov.telefono}', ${acumulado})">
                                <i class="fab fa-whatsapp"></i> Avisar
                            </button>
                        </td>
                    </tr>
                `;
            }
        });

        if (tbody.innerHTML === "") {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay pagos pendientes de liquidación.</td></tr>';
        }

    } catch (error) {
        console.error("Error en Pagos:", error);
    }
}

/**
 * Abre WhatsApp con un mensaje predefinido para el productor
 */
window.notificarPago = function(telefono, monto) {
    const mensaje = encodeURIComponent(`Hola, desde Mercado Raíz te informamos que se ha procesado tu liquidación por un valor de ${window.formatearUSD(monto)}. Por favor verifica tu cuenta bancaria.`);
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
};