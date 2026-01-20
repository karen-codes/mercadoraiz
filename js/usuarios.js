/**
 * js/usuarios.js - CRM y Control de Clientes Mercado Raíz
 * Gestión de usuarios y estadísticas de compra.
 */

window.renderizarTablaUsuarios = function(contenedor) {
    if (!contenedor) return;

    // Aseguramos referencia a la base de datos
    const db = firebase.database();

    // 1. Escuchar cambios en usuarios (Tiempo Real)
    db.ref('usuarios').on('value', async (snapshot) => {
        const usuariosData = snapshot.val();
        
        // 2. Obtener pedidos para calcular la fidelidad (una sola vez por actualización)
        const pedidosSnap = await db.ref('pedidos').once('value');
        const pedidosData = pedidosSnap.val() || {};

        // Mapear cuántos pedidos tiene cada clienteId
        const contadorPedidos = {};
        Object.values(pedidosData).forEach(p => {
            if (p.clienteId) {
                contadorPedidos[p.clienteId] = (contadorPedidos[p.clienteId] || 0) + 1;
            }
        });

        let htmlContent = '';

        if (usuariosData) {
            const lista = Object.entries(usuariosData).reverse(); // Recientes primero

            htmlContent = lista.map(([id, u]) => {
                const numPedidos = contadorPedidos[id] || 0;
                // Color dinámico según actividad: Verde si ha comprado, Gris si es nuevo
                const colorBadge = numPedidos > 0 ? '#27ae60' : '#95a5a6';
                const fondoBadge = numPedidos > 0 ? '#eafaf1' : '#f4f6f7';

                return `
                <tr style="border-bottom: 1px solid #f2f2f2;">
                    <td style="padding:15px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width:35px; height:35px; background:${colorBadge}; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.9rem;">
                                ${(u.nombre || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <strong style="display:block;">${u.nombre || 'Sin nombre'}</strong>
                                <small style="color:#888;">ID: ${id.substring(0,6)}</small>
                            </div>
                        </div>
                    </td>
                    <td><a href="mailto:${u.email}" style="color:#2980b9; text-decoration:none;">${u.email}</a></td>
                    <td>${u.telefono || '<span style="color:#ccc;">No reg.</span>'}</td>
                    <td style="text-align:center;">
                        <span style="background:${fondoBadge}; color:${colorBadge}; padding: 4px 10px; border-radius:12px; font-weight:bold; font-size:0.8rem;">
                            <i class="fas fa-shopping-basket"></i> ${numPedidos} pedido(s)
                        </span>
                    </td>
                    <td><small style="color:#7f8c8d;">${u.fechaRegistro || 'Reciente'}</small></td>
                    <td style="text-align: right; padding:15px;">
                        <button onclick="eliminarUsuarioFirebase('${id}')" style="border:none; background:none; cursor:pointer; color:#e74c3c; font-size:1.1rem;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
            }).join('');
        } else {
            htmlContent = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#999;">No hay clientes registrados aún.</td></tr>';
        }

        contenedor.innerHTML = `
            <div class="admin-card" style="background:white; border-radius:12px; padding:20px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin:0; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-users"></i> Base de Clientes (Mercado Raíz CRM)
                    </h3>
                    <p style="color:#7f8c8d; font-size:0.9rem; margin-top:5px;">Gestiona los perfiles de los compradores y visualiza su recurrencia.</p>
                </div>
                <div class="table-responsive">
                    <table class="admin-table" style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #eee; text-align: left; color:#7f8c8d; font-size:0.85rem;">
                                <th style="padding:12px;">CLIENTE</th>
                                <th style="padding:12px;">CORREO</th>
                                <th style="padding:12px;">TELÉFONO</th>
                                <th style="padding:12px; text-align:center;">ACTIVIDAD</th>
                                <th style="padding:12px;">REGISTRO</th>
                                <th style="padding:12px; text-align: right;">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>${htmlContent}</tbody>
                    </table>
                </div>
            </div>`;
    });
};

// 2. FUNCIÓN PARA ELIMINAR
window.eliminarUsuarioFirebase = async function(id) {
    if (confirm("¿Estás seguro de eliminar este usuario? Perderá el acceso a su cuenta.")) {
        try {
            await firebase.database().ref(`usuarios/${id}`).remove();
        } catch (error) {
            alert("Error al eliminar usuario.");
        }
    }
};