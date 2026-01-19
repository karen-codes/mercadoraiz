/**
 * Carga y renderiza los usuarios desde Firebase
 */
function renderizarTablaUsuarios(cnt) {
    if (!cnt) return;

    // Escuchar cambios en tiempo real
    db.ref('usuarios').on('value', (snapshot) => {
        const usuariosData = snapshot.val();
        let htmlContent = '';

        if (usuariosData) {
            // Convertimos el objeto de Firebase en array incluyendo su ID (key)
            const lista = Object.keys(usuariosData).map(key => ({
                id: key,
                ...usuariosData[key]
            }));

            htmlContent = lista.map(u => `
                <tr>
                    <td>
                        <div class="user-cell" style="display: flex; align-items: center; gap: 12px;">
                            <div class="user-icon" style="width:35px; height:35px; background:#8da05e; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                                ${u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <strong>${u.nombre}</strong>
                        </div>
                    </td>
                    <td>${u.email}</td>
                    <td><span class="badge" style="background:#f0f4e8; color:#5d6d31; font-size:0.75rem;">${u.fecha || 'Reciente'}</span></td>
                    <td>
                        <div class="actions-cell" style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn-delete" onclick="eliminarUsuarioFirebase('${u.id}')" title="Eliminar de la Base">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            htmlContent = '<tr><td colspan="4" style="text-align:center; padding:40px; color:#999;">No hay usuarios registrados.</td></tr>';
        }

        // Estructura de la tabla (usando el HTML que ya tenías)
        cnt.innerHTML = `
            <div class="admin-card">
                <div class="card-header-info" style="margin-bottom: 25px;">
                    <h3 style="color: var(--admin-primary); font-family: 'Outfit'; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-users"></i> Base de Clientes (Firebase)
                    </h3>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Identidad / Nombre</th>
                                <th>Correo Electrónico</th>
                                <th>Fecha de Registro</th>
                                <th style="text-align: right;">Operaciones</th>
                            </tr>
                        </thead>
                        <tbody>${htmlContent}</tbody>
                    </table>
                </div>
            </div>`;
    });
}

async function eliminarUsuarioFirebase(id) {
    if (confirm("¿Eliminar este usuario de la base de datos?")) {
        await db.ref(`usuarios/${id}`).remove();
    }
}