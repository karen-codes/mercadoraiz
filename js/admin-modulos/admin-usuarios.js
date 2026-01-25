/**
 * js/admin-modulos/admin-usuario.js
 * Gestión de Clientes - Mercado Raíz 2026
 */

window.initUsuarios = function(contenedor) {
    // 1. Estructura de la sección (Aquí no suele haber botón "Nuevo" porque los usuarios se registran solos)
    contenedor.innerHTML = `
        <div class="admin-card">
            <div style="margin-bottom: 20px;">
                <p style="color: var(--text-muted);">Lista de clientes registrados a través de la tienda pública.</p>
            </div>
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>Nombre del Cliente</th>
                        <th>WhatsApp / Teléfono</th>
                        <th>Correo Electrónico</th>
                        <th>Ubicación / Dirección</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="lista-usuarios">
                    <tr><td colspan="5" style="text-align:center;">Cargando base de datos...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    escucharUsuarios();
};

/**
 * Escucha la rama 'usuarios' en Firebase
 */
function escucharUsuarios() {
    window.db.ref('usuarios').on('value', (snapshot) => {
        const tbody = document.getElementById('lista-usuarios');
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay clientes registrados todavía.</td></tr>';
            return;
        }

        snapshot.forEach((child) => {
            const u = child.val();
            const id = child.key;
            
            tbody.innerHTML += `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:35px; height:35px; background:#e0e0e0; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#777;">
                                <i class="fas fa-user"></i>
                            </div>
                            <strong>${u.nombre || 'Sin nombre'}</strong>
                        </div>
                    </td>
                    <td>
                        <a href="https://wa.me/${u.telefono}" target="_blank" style="color: var(--primary); text-decoration:none;">
                            <i class="fab fa-whatsapp"></i> ${u.telefono || 'S/N'}
                        </a>
                    </td>
                    <td><small>${u.email || u.correo || 'No registrado'}</small></td>
                    <td><small>${u.direccion || 'No especificada'}</small></td>
                    <td>
                        <button class="btn-save" style="padding:5px 10px; background:#e74c3c;" onclick="eliminarUsuario('${id}')" title="Eliminar Cliente">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    });
}

/**
 * Elimina un usuario de la base de datos
 * @param {string} id 
 */
window.eliminarUsuario = function(id) {
    if (confirm("¿Estás seguro de eliminar a este cliente? Esta acción no se puede deshacer.")) {
        window.db.ref(`usuarios/${id}`).remove()
            .then(() => alert("Cliente eliminado correctamente."))
            .catch(e => alert("Error: " + e.message));
    }
};