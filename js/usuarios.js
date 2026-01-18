// js/usuarios.js
function renderizarTablaUsuarios(cnt) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];

    cnt.innerHTML = `
        <div class="admin-card">
            <div class="card-header-info" style="margin-bottom: 25px;">
                <h3 style="color: var(--admin-primary); font-family: 'Outfit'; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-users"></i> Base de Clientes Registrados
                </h3>
                <p style="color: #888; font-size: 0.9rem; margin-top: 5px;">Listado de consumidores finales y usuarios de la plataforma Mercado Raíz.</p>
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
                    <tbody>
                        ${usuarios.length > 0 ? usuarios.map((u, index) => `
                            <tr>
                                <td>
                                    <div class="user-cell" style="display: flex; align-items: center; gap: 12px;">
                                        <div class="user-icon" style="width:35px; height:35px; background:var(--admin-soft); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                                            ${u.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <strong>${u.nombre}</strong>
                                    </div>
                                </td>
                                <td>${u.email}</td>
                                <td><span class="badge" style="background:#f0f4e8; color:var(--admin-primary); font-size:0.75rem;">${u.fecha || 'Reciente'}</span></td>
                                <td>
                                    <div class="actions-cell" style="display: flex; gap: 8px; justify-content: flex-end;">
                                        <button class="btn-edit" onclick="abrirModalEditarUsuario(${index})" title="Editar Información">
                                            <i class="fas fa-user-edit"></i>
                                        </button>
                                        <button class="btn-delete" onclick="eliminarUsuario(${index})" title="Eliminar de la Base">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" style="text-align:center; padding:40px; color:#999;">No se encontraron usuarios registrados.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function eliminarUsuario(index) {
    if (confirm("¿Estás seguro de eliminar este registro de usuario? Esta acción es irreversible.")) {
        let usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
        usuarios.splice(index, 1);
        localStorage.setItem('usuarios_registrados', JSON.stringify(usuarios));
        renderizarTablaUsuarios(document.getElementById('tabla-contenedor'));
    }
}