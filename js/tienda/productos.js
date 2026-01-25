/**
 * js/productos.js - Gestión de Inventario 2026
 * Mercado Raíz - Cayambe (Versión Integrada con Parcelas)
 */

// 1. RENDERIZAR LA TABLA DE PRODUCTOS
window.renderizarTablaProductos = function(contenedor) {
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="admin-card" style="background:white; padding:20px; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0;"><i class="fas fa-boxes"></i> Inventario Global</h3>
                <button onclick="abrirModal()" class="btn-nuevo" style="background:#27ae60; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">
                    + Nuevo Producto
                </button>
            </div>
            <div class="table-responsive">
                <table class="admin-table" style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="text-align:left; border-bottom:2px solid #f3f4f6;">
                            <th style="padding:12px;">Imagen</th>
                            <th style="padding:12px;">Producto</th>
                            <th style="padding:12px;">Origen (Parcela)</th>
                            <th style="padding:12px;">Categoría</th>
                            <th style="padding:12px;">Precio / Unidad</th>
                            <th style="padding:12px; text-align:right;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="lista-productos-body">
                        <tr><td colspan="6" style="text-align:center; padding:20px;">Cargando inventario...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Escuchar cambios en productos y obtener nombres de parcelas
    firebase.database().ref('productos').on('value', async (snapshot) => {
        const tbody = document.getElementById('lista-productos-body');
        if (!tbody) return;
        
        const datos = snapshot.val();
        
        // Obtenemos los proveedores una sola vez para mapear nombres
        const provSnap = await firebase.database().ref('proveedores').once('value');
        const proveedores = provSnap.val() || {};

        let html = '';

        if (datos) {
            Object.entries(datos).forEach(([id, p]) => {
                const imgUrl = p.urlFotoProducto || 'https://via.placeholder.com/50?text=Sin+Foto';
                
                // Buscamos el nombre de la parcela usando el idProductor guardado
                const nombreParcela = proveedores[p.idProductor]?.nombreParcela || "🚫 No asignado";
                
                html += `
                    <tr style="border-bottom:1px solid #f9fafb;">
                        <td style="padding:12px;">
                            <img src="${imgUrl}" style="width:45px; height:45px; object-fit:cover; border-radius:8px; border:1px solid #eee;">
                        </td>
                        <td style="padding:12px;">
                            <strong style="color:#2d3436;">${p.nombreProducto}</strong><br>
                            <small style="color:#999; font-size:10px;">REF: ${id.substring(id.length - 6)}</small>
                        </td>
                        <td style="padding:12px;">
                            <span style="color:#27ae60; font-size:0.9rem;"><i class="fas fa-leaf"></i> ${nombreParcela}</span>
                        </td>
                        <td style="padding:12px;">
                            <span style="background:#f1f2f6; padding:4px 10px; border-radius:15px; font-size:0.75rem; color:#2f3542;">
                                ${p.categoriaProducto}
                            </span>
                        </td>
                        <td style="padding:12px;">
                            <strong style="color:#16a34a;">$${parseFloat(p.precio).toFixed(2)}</strong>
                            <span style="color:#636e72; font-size:0.8rem;">/ ${p.unidadMedida}</span>
                        </td>
                        <td style="padding:12px; text-align:right;">
                            <button onclick="eliminarProducto('${id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#999;">No hay productos registrados.</td></tr>';
        }
    });
};

// 2. FUNCIÓN PARA ELIMINAR PRODUCTO
window.eliminarProducto = async function(id) {
    if (confirm("¿Estás seguro de eliminar este producto? Se quitará de la tienda pública inmediatamente.")) {
        try {
            await firebase.database().ref(`productos/${id}`).remove();
        } catch (error) {
            alert("Error al eliminar: " + error.message);
        }
    }
};