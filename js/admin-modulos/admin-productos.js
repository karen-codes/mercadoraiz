/**
 * js/admin-modulos/admin-productos.js
 * Gestión de Catálogo - Mercado Raíz 2026
 */

window.initProductos = function(contenedor, btnContenedor) {
    btnContenedor.innerHTML = `
        <button class="btn-save" onclick="abrirModalProducto()">
            <i class="fas fa-plus"></i> Nuevo Producto
        </button>
    `;

    contenedor.innerHTML = `
        <div class="admin-card">
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>Imagen</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Productor</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="lista-productos">
                    <tr><td colspan="6" style="text-align:center;">Conectando con el catálogo real...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    escucharProductos();
};

function escucharProductos() {
    // 1. Obtener proveedores primero (una sola vez) para el cruce de datos
    window.db.ref('proveedores').once('value', (snapProvs) => {
        const proveedores = snapProvs.val() || {};

        // 2. Escuchar productos en tiempo real
        window.db.ref('productos').on('value', (snapshot) => {
            const tbody = document.getElementById('lista-productos');
            if (!tbody) return;
            tbody.innerHTML = "";

            if (!snapshot.exists()) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay productos en la base de datos.</td></tr>';
                return;
            }

            snapshot.forEach((child) => {
                const p = child.val();
                const id = child.key;
                const finca = proveedores[p.idProductor]?.nombreParcela || "📍 Origen no asignado";

                tbody.innerHTML += `
                    <tr>
                        <td><img src="${p.imagenUrl || 'img/placeholder.jpg'}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; border: 1px solid #eee;"></td>
                        <td><strong>${p.nombre}</strong></td>
                        <td><span class="status-badge" style="background:#e8f5e9; color:#2e7d32; padding:4px 8px;">${p.categoria || 'S/C'}</span></td>
                        <td><strong>$${parseFloat(p.precio || 0).toFixed(2)}</strong> / <small>${p.unidad || 'ud'}</small></td>
                        <td><small>${finca}</small></td>
                        <td>
                            <button class="btn-save" style="padding:5px 10px; background:#3498db;" onclick="editarProducto('${id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-save" style="padding:5px 10px; background:#e74c3c; margin-left:5px;" onclick="eliminarProducto('${id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        });
    });
}

window.abrirModalProducto = async function() {
    const modal = document.getElementById('modalProducto');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('formProducto').reset();
        document.getElementById('prod-id').value = "";
        document.getElementById('prod-img-actual').value = "";
        await llenarSelectProveedores();
    }
};

async function llenarSelectProveedores() {
    const select = document.getElementById('prod-origin');
    if (!select) return;
    
    const provs = await window.obtenerDatos('proveedores');
    select.innerHTML = '<option value="">-- Selecciona el Productor --</option>';
    provs.forEach(prov => {
        select.innerHTML += `<option value="${prov.id}">${prov.nombreParcela} (${prov.comunidad})</option>`;
    });
}

/**
 * GUARDAR O ACTUALIZAR
 * Corregido para no depender de FormData y asegurar lectura real de IDs
 */
document.getElementById('formProducto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const idExistente = document.getElementById('prod-id').value;
    
    try {
        btn.disabled = true;
        btn.innerText = "Guardando en la nube...";

        // 1. Imagen
        const archivo = document.getElementById('prod-foto').files[0];
        let urlFoto = document.getElementById('prod-img-actual').value;

        if (archivo) {
            urlFoto = await window.subirArchivoNativo(archivo, 'productos');
        }

        // 2. Construcción manual del objeto (Más seguro que FormData)
        const objetoProducto = {
            nombre: document.getElementById('prod-nombre').value,
            precio: parseFloat(document.getElementById('prod-precio').value),
            categoria: document.getElementById('prod-categoria').value,
            unidad: document.getElementById('prod-unidad').value,
            idProductor: document.getElementById('prod-origin').value,
            imagenUrl: urlFoto,
            lastUpdate: firebase.database.ServerValue.TIMESTAMP
        };

        // 3. Firebase
        if (idExistente) {
            await window.db.ref(`productos/${idExistente}`).update(objetoProducto);
            alert("Producto actualizado satisfactoriamente.");
        } else {
            await window.db.ref('productos').push(objetoProducto);
            alert("Nuevo producto añadido al catálogo.");
        }

        window.cerrarModal();
    } catch (error) {
        console.error("Error al guardar producto:", error);
        alert("Error de conexión: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Guardar Producto";
    }
});

window.editarProducto = async function(id) {
    const snap = await window.db.ref(`productos/${id}`).once('value');
    if (!snap.exists()) return;
    const p = snap.val();

    // 1. Abrimos el modal y llenamos selectores primero
    await window.abrirModalProducto();
    
    // 2. Inyectamos los datos después del reset() del abrirModal
    document.getElementById('prod-id').value = id;
    document.getElementById('prod-nombre').value = p.nombre || "";
    document.getElementById('prod-precio').value = p.precio || "";
    document.getElementById('prod-unidad').value = p.unidad || "";
    document.getElementById('prod-categoria').value = p.categoria || "";
    document.getElementById('prod-origin').value = p.idProductor || "";
    document.getElementById('prod-img-actual').value = p.imagenUrl || "";
};

window.eliminarProducto = function(id) {
    if (confirm("¿Estás seguro de eliminar este producto? No aparecerá más en la tienda.")) {
        window.db.ref(`productos/${id}`).remove();
    }
};