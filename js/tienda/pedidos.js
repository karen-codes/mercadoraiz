/**
 * Mercado Raíz 2026 - Gestión de Pedidos y Validación de Pagos
 * Versión Final: Validación de Comprobantes + Notificación WhatsApp
 */

// 1. RENDERIZADO DE LA TABLA DE PEDIDOS
window.renderizarTablaPedidos = function(contenedor) {
    if (!contenedor) return;

    firebase.database().ref('pedidos').on('value', (snapshot) => {
        const data = snapshot.val();
        let htmlRows = '';

        if (data) {
            // Ordenar: más recientes primero
            const entries = Object.entries(data).reverse(); 

            entries.forEach(([key, p]) => {
                // Estilos dinámicos por estado
                let badgeStyle = "background:#fffbeb; color:#b45309;"; // Pendiente (Amarillo)
                if(p.estado === 'Validado') badgeStyle = "background:#dcfce7; color:#15803d;"; // Validado (Verde)
                if(p.estado === 'Cancelado') badgeStyle = "background:#fee2e2; color:#991b1b;"; // Cancelado (Rojo)
                
                htmlRows += `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding:12px;"><b style="color:#27ae60">#${key.substring(key.length - 6).toUpperCase()}</b></td>
                        <td style="padding:12px;">
                            <div style="display:flex; flex-direction:column;">
                                <strong>${p.cliente || 'Usuario'}</strong>
                                <small style="color:#666;"><i class="fab fa-whatsapp"></i> ${p.telefono || 'Sin número'}</small>
                            </div>
                        </td>
                        <td style="padding:12px;"><strong style="font-size:1.1rem;">$${parseFloat(p.total || 0).toFixed(2)}</strong></td>
                        <td style="padding:12px;">
                            <span style="padding:4px 12px; border-radius:20px; font-weight:bold; font-size:0.75rem; ${badgeStyle}">
                                ${p.estado || 'Pendiente'}
                            </span>
                        </td>
                        <td style="padding:12px; text-align:right;">
                            <button class="btn-editar" onclick="verDetallePedidoFirebase('${key}')" style="background:#4f46e5; color:white; padding:8px 15px; border-radius:6px; border:none; cursor:pointer;">
                                <i class="fas fa-search-dollar"></i> Revisar Pago
                            </button>
                            <button onclick="eliminarPedidoFirebase('${key}')" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-left:10px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>`;
            });
        } else {
            htmlRows = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#999;">No hay pedidos registrados en el sistema.</td></tr>';
        }

        contenedor.innerHTML = `
            <div class="admin-card" style="background:white; padding:20px; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                <h3 style="margin-bottom:20px;"><i class="fas fa-shopping-cart"></i> Control de Ventas</h3>
                <table class="admin-table" style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="text-align:left; background:#f8fafc; color:#64748b; font-size:0.85rem;">
                            <th style="padding:12px;">ID ORDEN</th>
                            <th style="padding:12px;">CLIENTE</th>
                            <th style="padding:12px;">TOTAL</th>
                            <th style="padding:12px;">ESTADO</th>
                            <th style="padding:12px; text-align:right;">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>${htmlRows}</tbody>
                </table>
            </div>`;
    });
};

// 2. DETALLE Y VALIDACIÓN DE COMPROBANTE
window.verDetallePedidoFirebase = async function(id) {
    const snapshot = await firebase.database().ref(`pedidos/${id}`).once('value');
    const pedido = snapshot.val();
    if(!pedido) return;

    abrirModal();
    document.getElementById('modalTitulo').innerText = `Verificación de Pago #${id.substring(id.length - 6).toUpperCase()}`;
    
    // Lógica para mostrar comprobante
    const seccionComprobante = pedido.urlPago 
        ? `<div style="text-align:center; background:#f1f5f9; padding:15px; border-radius:10px; border: 2px dashed #cbd5e1;">
                <p style="font-weight:bold; color:#475569; margin-bottom:10px;">Comprobante de Transferencia:</p>
                <a href="${pedido.urlPago}" target="_blank">
                    <img src="${pedido.urlPago}" style="max-width:100%; max-height:300px; border-radius:5px; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
                </a>
                <p style="font-size:11px; color:#64748b; margin-top:8px;">(Clic en la imagen para ver en pantalla completa)</p>
           </div>`
        : `<div style="padding:20px; background:#fff1f2; color:#be123c; border-radius:10px; text-align:center;">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i><br>
                <strong>¡Atención!</strong><br>El cliente aún no ha subido el comprobante de pago.
           </div>`;

    document.getElementById('camposDinamicos').innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
            <div style="background:#fff; padding:10px; border:1px solid #eee; border-radius:8px;">
                <small style="color:#999;">DATOS DEL CLIENTE</small>
                <p style="margin:5px 0;"><strong>${pedido.cliente}</strong></p>
                <p style="margin:0; font-size:0.9rem;">WhatsApp: ${pedido.telefono}</p>
            </div>
            <div style="background:#f0fdf4; padding:10px; border:1px solid #bbf7d0; border-radius:8px; text-align:right;">
                <small style="color:#15803d;">TOTAL A COBRAR</small>
                <p style="margin:5px 0; font-size:1.5rem; font-weight:bold; color:#16a34a;">$${parseFloat(pedido.total).toFixed(2)}</p>
            </div>
        </div>

        ${seccionComprobante}

        <div style="margin-top:20px; display:flex; gap:10px;">
            <button onclick="actualizarEstadoPedido('${id}', 'Validado', '${pedido.telefono}')" style="flex:2; background:#16a34a; color:white; border:none; padding:15px; border-radius:8px; font-weight:bold; cursor:pointer;">
                <i class="fas fa-check-circle"></i> APROBAR Y NOTIFICAR
            </button>
            <button onclick="actualizarEstadoPedido('${id}', 'Cancelado')" style="flex:1; background:#ef4444; color:white; border:none; padding:15px; border-radius:8px; cursor:pointer;">
                ANULAR
            </button>
        </div>
    `;
};

// 3. ACTUALIZAR ESTADO Y NOTIFICAR
window.actualizarEstadoPedido = async function(id, nuevoEstado, telefono) {
    if (confirm(`¿Cambiar pedido a estado: ${nuevoEstado}?`)) {
        try {
            await firebase.database().ref(`pedidos/${id}`).update({ estado: nuevoEstado });
            
            // Si se valida, abrimos WhatsApp para avisar al cliente
            if(nuevoEstado === 'Validado' && telefono) {
                const msg = encodeURIComponent(`¡Hola! Tu pago en Mercado Raíz ha sido validado con éxito. Estamos preparando tus productos de la parcela a tu mesa. ¡Gracias por tu compra! 🌿`);
                window.open(`https://wa.me/${telefono}?text=${msg}`, '_blank');
            }

            cerrarModal();
        } catch (e) {
            alert("Error: " + e.message);
        }
    }
};

// 4. ELIMINAR PEDIDO
window.eliminarPedidoFirebase = async function(id) {
    if (confirm("¿Eliminar este pedido permanentemente?")) {
        await firebase.database().ref(`pedidos/${id}`).remove();
    }
};