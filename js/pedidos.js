/**
 * Muestra los pedidos realizados por los clientes en tiempo real con validación de pagos
 */
function mostrarPedidos() {
    const contenedor = document.getElementById('tabla-contenedor');
    if (!contenedor) return;

    db.ref('pedidos').on('value', (snapshot) => {
        const data = snapshot.val();
        let htmlRows = '';

        if (data) {
            // Ordenamos por los más recientes primero (usando la key de Firebase)
            const keys = Object.keys(data).reverse(); 

            keys.forEach(key => {
                const p = data[key];
                const estadoClass = p.estado === 'Pendiente' ? 'style="background:#fffbeb; color:#b45309;"' : 'style="background:#dcfce7; color:#15803d;"';
                
                htmlRows += `
                    <tr>
                        <td><b style="color:var(--admin-primary)">#${key.substring(0, 7).toUpperCase()}</b></td>
                        <td>
                            <div style="display:flex; flex-direction:column;">
                                <strong>${p.cliente}</strong>
                                <small style="color:#888;">${p.email}</small>
                            </div>
                        </td>
                        <td><strong style="font-size:1.1rem;">$${parseFloat(p.total).toFixed(2)}</strong></td>
                        <td>
                            <span class="badge" ${estadoClass} style="padding:5px 10px; border-radius:12px; font-weight:bold; font-size:0.8rem;">
                                ${p.estado || 'Pendiente'}
                            </span>
                        </td>
                        <td class="actions-cell" style="text-align:right;">
                            <button class="btn-edit" onclick="verDetallePedidoFirebase('${key}')" title="Ver detalle y comprobante">
                                <i class="fas fa-file-invoice-dollar"></i> Ver Pago
                            </button>
                            <button class="btn-delete" onclick="eliminarPedidoFirebase('${key}')" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>`;
            });
        } else {
            htmlRows = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#999;">No hay pedidos registrados en el sistema.</td></tr>';
        }

        contenedor.innerHTML = `
            <div class="admin-card">
                <div class="card-header-info" style="margin-bottom:20px;">
                    <h3><i class="fas fa-shopping-bag"></i> Gestión de Órdenes y Pagos</h3>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th style="text-align:right;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>${htmlRows}</tbody>
                    </table>
                </div>
            </div>`;
    });
}

/**
 * Abre el detalle del pedido y permite validar el comprobante de imagen
 */
async function verDetallePedidoFirebase(id) {
    const snapshot = await db.ref(`pedidos/${id}`).once('value');
    const pedido = snapshot.val();
    if(!pedido) return;

    abrirModal();
    document.getElementById('modalTitulo').innerText = `Pedido #${id.substring(0,7)}`;
    
    // Comprobamos si hay imagen de comprobante
    const seccionPago = pedido.comprobanteUrl 
        ? `<div style="margin-top:15px; text-align:center;">
                <p><strong>Comprobante de Pago:</strong></p>
                <a href="${pedido.comprobanteUrl}" target="_blank">
                    <img src="${pedido.comprobanteUrl}" style="max-width:100%; border-radius:8px; border:2px solid #ddd; cursor:pointer;" title="Click para ampliar">
                </a>
           </div>`
        : `<div style="margin-top:15px; padding:15px; background:#fff5f5; color:#c53030; border-radius:8px; text-align:center;">
                <i class="fas fa-exclamation-triangle"></i> El cliente aún no ha subido el comprobante.
           </div>`;

    document.getElementById('camposDinamicos').innerHTML = `
        <div style="padding:15px; font-family:'Outfit', sans-serif;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <p style="margin:0;"><strong>Cliente:</strong> ${pedido.cliente}</p>
                    <p style="margin:0;"><strong>WhatsApp:</strong> ${pedido.telefono || 'No provisto'}</p>
                    <p style="margin:0;"><strong>Fecha:</strong> ${pedido.fecha}</p>
                </div>
                <div style="text-align:right;">
                    <span style="display:block; font-size:1.2rem; font-weight:bold; color:var(--admin-primary);">$${pedido.total.toFixed(2)}</span>
                    <small>${pedido.metodoPago || 'Transferencia'}</small>
                </div>
            </div>
            
            <hr style="margin:15px 0; border:0; border-top:1px solid #eee;">
            
            <h4>Productos Solicitados:</h4>
            <ul style="list-style:none; padding:0;">
                ${pedido.items.map(i => `
                    <li style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px dashed #eee;">
                        <span>${i.cantidad}x ${i.nombre}</span>
                        <span>$${(i.precio * i.cantidad).toFixed(2)}</span>
                    </li>
                `).join('')}
            </ul>

            ${seccionPago}

            <div style="margin-top:25px; display:flex; gap:10px;">
                <button onclick="actualizarEstadoPedido('${id}', 'Validado')" class="btn-login-header" style="flex:1; background:#22c55e; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold;">
                    <i class="fas fa-check-circle"></i> Validar Pago y Orden
                </button>
                <button onclick="actualizarEstadoPedido('${id}', 'Cancelado')" style="flex:1; background:#ef4444; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold;">
                    <i class="fas fa-times-circle"></i> Cancelar
                </button>
            </div>
        </div>
    `;
}

async function actualizarEstadoPedido(id, nuevoEstado) {
    if (confirm(`¿Cambiar estado del pedido a ${nuevoEstado}?`)) {
        await db.ref(`pedidos/${id}`).update({ estado: nuevoEstado });
        cerrarModal();
        alert(`Pedido ${nuevoEstado} exitosamente.`);
    }
}

async function eliminarPedidoFirebase(id) {
    if (confirm("¿Eliminar permanentemente este registro de pedido?")) {
        await db.ref(`pedidos/${id}`).remove();
    }
}