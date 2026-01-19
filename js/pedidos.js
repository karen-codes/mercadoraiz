/**
 * Muestra los pedidos realizados por los clientes en tiempo real
 */
function mostrarPedidos() {
    const contenedor = document.getElementById('tabla-contenedor');
    
    db.ref('pedidos').on('value', (snapshot) => {
        const data = snapshot.val();
        let htmlRows = '';

        if (data) {
            Object.keys(data).forEach(key => {
                const p = data[key];
                htmlRows += `
                    <tr>
                        <td><b>${key.substring(0, 7).toUpperCase()}</b></td>
                        <td>${p.cliente}</td>
                        <td>$${parseFloat(p.total).toFixed(2)}</td>
                        <td>
                            <span class="badge ${p.estado === 'Pendiente' ? 'badge-warning' : 'badge-success'}">
                                ${p.estado}
                            </span>
                        </td>
                        <td class="actions-cell">
                            <button class="btn-edit" onclick="verDetallePedidoFirebase('${key}')"><i class="fas fa-eye"></i></button>
                            <button class="btn-delete" onclick="eliminarPedidoFirebase('${key}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`;
            });
        } else {
            htmlRows = '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay pedidos pendientes.</td></tr>';
        }

        contenedor.innerHTML = `
            <div class="admin-card-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID Pedido</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${htmlRows}</tbody>
                </table>
            </div>`;
    });
}

async function eliminarPedidoFirebase(id) {
    if (confirm("¿Eliminar registro de pedido?")) {
        await db.ref(`pedidos/${id}`).remove();
    }
}

async function verDetallePedidoFirebase(id) {
    const snapshot = await db.ref(`pedidos/${id}`).once('value');
    const pedido = snapshot.val();
    
    if(!pedido) return;

    // Usamos el modal que ya tienes definido en tu sistema de admin
    abrirModal();
    document.getElementById('modalTitulo').innerText = `Pedido: ${id.substring(0,7)}`;
    document.getElementById('camposDinamicos').innerHTML = `
        <div style="padding:10px;">
            <p><strong>Cliente:</strong> ${pedido.cliente} (${pedido.email})</p>
            <p><strong>Fecha:</strong> ${pedido.fecha}</p>
            <hr>
            <h4>Productos:</h4>
            <ul>
                ${pedido.items.map(i => `<li>${i.cantidad}x ${i.nombre} - $${(i.precio * i.cantidad).toFixed(2)}</li>`).join('')}
            </ul>
            <p style="font-size:1.2rem; color:var(--pueblo-terracotta);"><strong>Total: $${pedido.total.toFixed(2)}</strong></p>
        </div>
    `;
}