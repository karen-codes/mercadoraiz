/**
 * js/tienda/productos.js - Gestión de Productos y Carrito
 */

window.renderizarTablaProductos = function(contenedor) {
    if (!contenedor) return;

    firebase.database().ref('productos').on('value', async (snapshot) => {
        const tbody = document.getElementById('lista-productos-body');
        if (!tbody) return;
        
        const datos = snapshot.val();
        const provSnap = await firebase.database().ref('proveedores').once('value');
        const proveedores = provSnap.val() || {};

        let html = '';

        if (datos) {
            Object.entries(datos).forEach(([id, p]) => {
                const imgUrl = p.imagenUrl || 'https://via.placeholder.com/50?text=Sin+Foto';
                const nombreProducto = p.nombre || "Sin nombre";
                
                // Captura del ID del productor
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
                            <small style="color:#636e72; font-size:0.8rem;">/ ${p.unidad || 'Unidad'}</small>
                        </td>
                        <td style="padding:12px; text-align:right;">
                            <button onclick="window.prepararParaCarrito('${id}', '${nombreProducto}', ${p.precio}, '${imgUrl}', '${idProv}')" 
                                    style="background:#8da281; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">
                                <i class="fas fa-shopping-basket"></i> Añadir
                            </button>
                            
                            <button onclick="window.eliminarProducto('${id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-left:10px;">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">No hay productos disponibles.</td></tr>';
        }
    });
};

/**
 * FUNCIÓN CLAVE: Agrega el producto al localStorage con el ID del Productor
 */
window.prepararParaCarrito = function(id, nombre, precio, imagen, idProductor) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    // Verificar si el producto ya está en el carrito
    const index = carrito.findIndex(item => item.id === id);
    
    if (index !== -1) {
        carrito[index].cantidad += 1;
    } else {
        // CREAMOS EL OBJETO CON LA LLAVE idProductor PARA EL PANEL ADMIN
        carrito.push({
            id: id,
            nombre: nombre,
            precio: parseFloat(precio),
            imagen: imagen,
            idProductor: idProductor, // <--- ESTO ARREGLA TU PROBLEMA
            cantidad: 1
        });
    }
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // Feedback visual
    if (window.actualizarContadorCarrito) window.actualizarContadorCarrito();
    alert(`¡${nombre} añadido a tu canasta!`);
};

/**
 * Función para eliminar producto (Admin)
 */
window.eliminarProducto = function(id) {
    if (confirm("¿Estás seguro de eliminar este producto de la tienda?")) {
        firebase.database().ref('productos').child(id).remove()
            .then(() => alert("Producto eliminado."))
            .catch(err => console.error("Error al eliminar:", err));
    }
};