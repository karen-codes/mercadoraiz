/**
 * js/proveedores.js - Gestión y Visualización de Productores
 * Sincronizado con Panel Administrativo y Página Pública
 */

// --- 1. VISUALIZACIÓN PÚBLICA (Para proveedor.html) ---
// Esta función es la que llenará la página que actualmente te sale vacía.
function cargarProveedoresPublicos() {
    const contenedor = document.getElementById('contenedor-proveedores-publicos');
    if (!contenedor) return; // Si no existe el ID (estamos en admin), no hace nada.

    firebase.database().ref('proveedores').on('value', (snapshot) => {
        contenedor.innerHTML = "";
        
        if (!snapshot.exists()) {
            contenedor.innerHTML = "<p class='text-center'>Aún no tenemos productores registrados.</p>";
            return;
        }

        snapshot.forEach((child) => {
            const p = child.val();
            // Usamos portadaUrl que es el nombre que definimos en el formulario de admin
            const foto = p.portadaUrl || 'assets/images/default-finca.jpg';
            
            contenedor.innerHTML += `
                <div class="proveedor-card">
                    <img src="${foto}" alt="${p.nombreParcela}">
                    <div class="proveedor-info">
                        <span class="badge-comunidad">${p.comunidad}</span>
                        <h3>${p.nombreParcela}</h3>
                        <p>${p.descripcionCorta || 'Productor local de Cayambe'}</p>
                        <a href="perfil-proveedor.html?id=${child.key}" class="btn-perfil">Conocer Historia</a>
                    </div>
                </div>
            `;
        });
    });
}

// --- 2. RENDERIZAR TABLA (Para Panel Administrativo) ---
window.renderizarTablaProveedores = function(contenedor) {
    if (!contenedor) return;

    firebase.database().ref('proveedores').on('value', (snapshot) => {
        let htmlRows = '';
        
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const p = child.val();
                htmlRows += `
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <img src="${p.portadaUrl || 'assets/images/default-finca.jpg'}" style="width:40px; height:40px; border-radius:5px; object-fit:cover;">
                                <strong>${p.nombreParcela}</strong>
                            </div>
                        </td>
                        <td>${p.comunidad}</td>
                        <td>${p.whatsapp || p.telefono}</td>
                        <td style="text-align:right;">
                            <button class="btn-editar" onclick="editarProductor('${child.key}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="eliminarProveedor('${child.key}')" class="btn-eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>`;
            });
        } else {
            htmlRows = '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay productores registrados.</td></tr>';
        }

        contenedor.innerHTML = `
            <div class="admin-card">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Nombre Parcela</th>
                            <th>Comunidad</th>
                            <th>Contacto</th>
                            <th style="text-align:right;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${htmlRows}</tbody>
                </table>
            </div>`;
    });
};

// --- 3. GUARDAR / ACTUALIZAR (Lógica unificada) ---
window.guardarProveedor = async function() {
    const id = document.getElementById('prov-id').value;
    const btn = document.getElementById('btn-guardar-prov');
    const fotoFile = document.getElementById('prov-foto').files[0];

    btn.disabled = true;
    btn.innerText = "Guardando...";

    try {
        let urlFoto = document.getElementById('prov-foto-url-actual').value;

        // Si hay foto nueva, se sube (asegúrate de que subirArchivo esté en admin.js o data.js)
        if (fotoFile && typeof subirArchivo === "function") {
            urlFoto = await subirArchivo(fotoFile, 'fincas');
        }

        const datos = {
            nombreParcela: document.getElementById('prov-nombre').value,
            comunidad: document.getElementById('prov-comunidad').value,
            whatsapp: document.getElementById('prov-tel').value,
            coordenadas: document.getElementById('prov-coords').value,
            portadaUrl: urlFoto,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        if (id) {
            await firebase.database().ref(`proveedores/${id}`).update(datos);
        } else {
            await firebase.database().ref('proveedores').push(datos);
        }

        cerrarModal();
        alert("¡Productor actualizado!");
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Guardar Productor";
    }
};

// --- 4. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    cargarProveedoresPublicos();
});