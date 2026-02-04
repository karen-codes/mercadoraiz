/**
 * js/admin-modulos/admin-pedidos.js
 * Gestión de Ventas y Comprobantes - Mercado Raíz 2026
 */

window.initPedidos = function(contenedor) {
    contenedor.innerHTML = `
        <div class="admin-card">
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>Fecha/Hora</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Pago</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="lista-pedidos">
                    <tr><td colspan="6" style="text-align:center;">Cargando pedidos...</td></tr>
                </tbody>
            </table>
        </div>
    `;
    escucharPedidos();
};

function escucharPedidos() {
    // Usamos .on para que la tabla se actualice sola si cambia algo en Firebase
    window.db.ref('pedidos').orderByChild('timestamp').on('value', (snapshot) => {
        const tbody = document.getElementById('lista-pedidos');
        // PROTECCIÓN: Si el usuario cambió de pestaña, salimos suavemente sin error
        if (!tbody) return; 
        
        tbody.innerHTML = "";

        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay pedidos registrados aún.</td></tr>';
            return;
        }

        const pedidos = [];
        snapshot.forEach(child => {
            pedidos.push({ id: child.key, ...child.val() });
        });
        pedidos.reverse();

        pedidos.forEach((p) => {
            const claseEstado = p.estado === 'Pagado' ? 'status-pagado' : 'status-pendiente';
            const nombreMostrar = p.clienteNombre || p.cliente?.nombre || "Usuario Desconocido";
            const contactoMostrar = p.clienteEmail || p.cliente?.email || "S/N";

            tbody.innerHTML += `
                <tr>
                    <td>
                        <small>${p.fechaPedido ? new Date(p.fechaPedido).toLocaleDateString() : (p.fecha || '')}</small><br>
                        <small>${p.fechaPedido ? new Date(p.fechaPedido).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : (p.hora || '')}</small>
                    </td>
                    <td>
                        <strong>${nombreMostrar}</strong><br>
                        <small>${contactoMostrar}</small>
                    </td>
                    <td><strong style="color: #27ae60;">$${parseFloat(p.total || 0).toFixed(2)}</strong></td>
                    <td><span class="status-badge ${claseEstado}">${p.estado}</span></td>
                    <td>
                        ${p.comprobanteUrl || p.urlPago ? 
                            `<button class="btn-save" style="padding:5px 10px; background:#3498db;" onclick="window.open('${p.comprobanteUrl || p.urlPago}', '_blank')">
                                <i class="fas fa-receipt"></i> Ver Ticket
                             </button>` : 
                            '<small style="color:gray;">Sin comprobante</small>'
                        }
                    </td>
                    <td>
                        <div style="display:flex; gap:5px;">
                            <button class="btn-save" style="padding:5px 10px; background:#27ae60;" onclick="window.cambiarEstadoPedido('${p.id}', 'Pagado')" title="Marcar como Pagado">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-save" style="padding:5px 10px; background:#e74c3c;" onclick="window.eliminarPedido('${p.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    });
}

window.cambiarEstadoPedido = function(id, nuevoEstado) {
    window.db.ref(`pedidos/${id}`).update({ estado: nuevoEstado })
        .then(() => {
            // Reemplazo de alert por notificación flotante
            if (typeof window.mostrarNotificacion === 'function') {
                window.mostrarNotificacion("Pedido marcado como Pagado", "success");
            }
        })
        .catch(e => {
            console.error("Error:", e);
            if (typeof window.mostrarNotificacion === 'function') {
                window.mostrarNotificacion("Error al actualizar pedido", "error");
            }
        });
};

window.eliminarPedido = function(id) {
    // El confirm nativo lo dejamos por seguridad (es mejor que un click accidental elimine)
    if (confirm("¿Seguro que deseas eliminar este registro de pedido?")) {
        window.db.ref(`pedidos/${id}`).remove()
            .then(() => {
                if (typeof window.mostrarNotificacion === 'function') {
                    window.mostrarNotificacion("Pedido eliminado correctamente", "info");
                }
            })
            .catch(e => console.error(e));
    }
};