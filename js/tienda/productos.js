/**
 * js/tienda/productos.js - Versión Sincronizada con Firebase Realtime DB
 */

window.renderizarTablaProductos = function(contenedor) {
    if (!contenedor) return;

    // ... (Mantén el código del encabezado de la tabla que ya tienes)

    firebase.database().ref('productos').on('value', async (snapshot) => {
        const tbody = document.getElementById('lista-productos-body');
        if (!tbody) return;
        
        const datos = snapshot.val();
        const provSnap = await firebase.database().ref('proveedores').once('value');
        const proveedores = provSnap.val() || {};

        let html = '';

        if (datos) {
            Object.entries(datos).forEach(([id, p]) => {
                // LLAVES CORRECTAS SEGÚN TU FIREBASE (image_a8b37c.png)
                const imgUrl = p.imagenUrl || 'https://via.placeholder.com/50?text=Sin+Foto';
                const nombreProducto = p.nombre || "Sin nombre";
                
                // LLAVE CORRECTA PARA PROVEEDOR (image_a8b376.png)
                const idProv = p.idProductor;
                const productorData = proveedores[idProv] || {};
                const nombreFinca = productorData.nombreParcela || "🚫 No asignado";
                
                const precioFormateado = window.formatearUSD ? window.formatearUSD(p.precio) : `$${p.precio}`;

                html += `
                    <tr style="border-bottom:1px solid #f9fafb;">
                        <td style="padding:12px;">
                            <img src="${imgUrl}" style="width:45px; height:45px; object-fit:cover; border-radius:8px;">
                        </td>
                        <td style="padding:12px;">
                            <strong style="color:#2d3436;">${nombreProducto}</strong><br>
                            <small style="color:#999; font-size:10px;">REF: ${id.substring(id.length - 5).toUpperCase()}</small>
                        </td>
                        <td style="padding:12px;">
                            <span style="color:#27ae60; font-size:0.9rem;"><i class="fas fa-leaf"></i> ${nombreFinca}</span>
                        </td>
                        <td style="padding:12px;">
                            <span style="background:#f1f2f6; padding:4px 10px; border-radius:15px; font-size:0.75rem;">
                                ${p.categoria || 'General'}
                            </span>
                        </td>
                        <td style="padding:12px;">
                            <strong style="color:#16a34a;">${precioFormateado}</strong>
                            <span style="color:#636e72; font-size:0.8rem;">/ ${p.unidad || 'Unidad'}</span>
                        </td>
                        <td style="padding:12px; text-align:right;">
                            <button onclick="window.eliminarProducto('${id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">No hay productos.</td></tr>';
        }
    });
};