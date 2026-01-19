/**
 * Carga y renderiza los usuarios desde Firebase con conteo de pedidos
 */
function renderizarTablaUsuarios(cnt) {
    if (!cnt) return;

    // Escuchamos tanto usuarios como pedidos para hacer el cruce de datos
    // Usamos 'on' en usuarios para tiempo real
    db.ref('usuarios').on('value', async (snapshot) => {
        const usuariosData = snapshot.val();
        
        // Obtenemos los pedidos una vez para el conteo
        const pedidosSnap = await db.ref('pedidos').once('value');
        const pedidosData = pedidosSnap.val() || {};

        // Mapeamos cuántos pedidos tiene cada cliente
        const contadorPedidos = {};
        Object.values(pedidosData).forEach(p => {
            if (p.clienteId) {
                contadorPedidos[p.clienteId] = (contadorPedidos[p.clienteId] || 0) + 1;
            }
        });

        let htmlContent = '';

        if (usuariosData) {
            const lista = Object.keys(usuariosData).map(key => ({
                id: key,
                ...usuariosData[key]
            }));

            htmlContent = lista.map(u => {
                const numPedidos = contadorPedidos[u.id] || 0;
                return `
                <tr>
                    <td>
                        <div class="user-cell" style="display: flex; align-items: center; gap: 12px;">
                            <div class="user-icon" style="width:35px; height:35px; background:#8da05e; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                                ${u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <strong>${u.nombre || 'Sin nombre'}</strong>
                        </div>
                    </td>
                    <td>${u.email}</td>
                    <td>${u.telefono || '<span style="color:#ccc">No registrado</span>'}</td>
                    <td style="text-align:center;">
                        <span class="badge" style="background:${numPedidos > 0 ? '#e8f4f0' : '#f4f4f4'}; color:${numPedidos > 0 ? '#1b5e20' : '#666'}; padding: 4px 8px; border-radius:12px; font-weight:bold;">
                            ${numPedidos} pedido(s)
                        </span>
                    </td>
                    <td><span class="badge" style="background:#f0f4e8; color:#5d6d31; font-size:0.75rem;">${u.fecha || 'Reciente'}</span></td>
                    <td>
                        <div class="actions-cell" style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn-delete" onclick="eliminarUsuarioFirebase('${u.id}')" title="Eliminar de la Base" style="border:none; background:none; cursor:pointer; color:#e74c3c;">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        } else {
            htmlContent = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#999;">No hay usuarios registrados.</td></tr>';
        }

        cnt.innerHTML = `
            <div class="admin-card">
                <div class="card-header-info" style="margin-bottom: 25px;">
                    <h3 style="color: var(--admin-primary); font-family: 'Outfit'; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-users"></i> Base de Clientes (Mercado Raíz Cloud)
                    </h3>
                </div>
                <div class="table-responsive">
                    <table class="admin-table" style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #eee; text-align: left;">
                                <th style="padding:12px;">Identidad / Nombre</th>
                                <th style="padding:12px;">Correo Electrónico</th>
                                <th style="padding:12px;">Teléfono</th>
                                <th style="padding:12px; text-align:center;">Total Pedidos</th>
                                <th style="padding:12px;">Registro</th>
                                <th style="padding:12px; text-align: right;">Operaciones</th>
                            </tr>
                        </thead>
                        <tbody>${htmlContent}</tbody>
                    </table>
                </div>
            </div>`;
    });
}

async function eliminarUsuarioFirebase(id) {
    if (confirm("¿Eliminar este usuario de la base de datos? Esto no borrará sus pedidos antiguos, pero perderán el vínculo.")) {
        try {
            await db.ref(`usuarios/${id}`).remove();
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("No se pudo eliminar el usuario.");
        }
    }
}