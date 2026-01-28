/**
 * js/main.js - Orquestador Global (PÁGINA PÚBLICA)
 * Mercado Raíz 2026
 */

let productos = [];
let proveedores = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.addEventListener("DOMContentLoaded", () => {
    actualizarInterfazSesion();
    window.actualizarContadorCarrito(); // Usamos la versión global

    if (window.db) {
        // 1. Cargar Proveedores
        window.db.ref('proveedores').on('value', (snapshot) => {
            const data = snapshot.val();
            proveedores = data ? Object.keys(data).map(key => ({...data[key], id: key})) : [];
            
            if (document.getElementById('contenedor-productores')) {
                renderizarProductoresHome(proveedores);
            }

            // 2. Cargar Productos (Anidado para asegurar que proveedores existan)
            window.db.ref('productos').on('value', (prodSnapshot) => {
                const prodData = prodSnapshot.val();
                productos = prodData ? Object.keys(prodData).map(key => ({...prodData[key], id: key})) : [];
                
                if (document.getElementById("carrusel-container")) {
                    if (typeof renderizarCarruselHome === 'function') {
                        renderizarCarruselHome(productos);
                    }
                }
                
                if (document.getElementById("productsGrid")) {
                    if (typeof renderizarCatalogo === 'function') renderizarCatalogo(productos);
                }
                
                finalizarCargaVisual();
            });
        });
    }
});

/***********************************
 * LÓGICA DE CARRITO (CENTRALIZADA)
 ***********************************/

/**
 * Función Maestra Global para añadir al carrito
 */
window.addToCart = function(id, nombre, precio, imagen, idProductor) {
    // Recargar carrito del storage por si se cambió en otra pestaña
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    if (!id) return;

    const itemEnCarrito = carrito.find(item => item.id === id);

    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        carrito.push({
            id: id,
            nombre: nombre || "Producto",
            precio: parseFloat(precio) || 0,
            imagen: imagen || 'assets/images/no-image.jpg',
            idProductor: idProductor || "general",
            cantidad: 1
        });
    }
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    window.actualizarContadorCarrito();
    
    // Alerta personalizada estilo Toast (opcional, mantengo tu alert por ahora)
    // Agregamos window. para que sea accesible desde carrito.js y otros archivos
window.mostrarNotificacion = function(mensaje) {
    const container = document.getElementById('notification-container');
    
    // Si por error el contenedor no existe en el HTML, lo creamos para que no falle
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'notification-container';
        newContainer.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 1000;";
        document.body.appendChild(newContainer);
    }

    const notification = document.createElement('div');
    notification.className = 'toast-notification';
    
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${mensaje}</span>
    `;
    
    document.getElementById('notification-container').appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
    }
};

/**
 * Mantiene compatibilidad con botones de productos.js
 */
window.agregarAlCarritoClick = function(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) {
        console.error("Producto no encontrado en la lista local:", id);
        return;
    }

    window.addToCart(
        prod.id, 
        prod.nombre || prod.nombreProducto, 
        prod.precio, 
        prod.urlFotoProducto || prod.imagenUrl || prod.fotoUrl, 
        prod.idProductor
    );
};

window.actualizarContadorCarrito = function() {
    // Siempre leer el storage más reciente
    const carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
    const count = carritoActual.reduce((sum, item) => sum + item.cantidad, 0);
    const badge = document.getElementById('cart-count-badge');
    
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
};

/***********************************
 * RENDERIZADO HOME
 ***********************************/

function renderizarProductoresHome(lista) {
    const contenedor = document.getElementById('contenedor-productores');
    if (!contenedor) return;

    contenedor.innerHTML = lista.map(p => `
        <div class="card-productor">
            <div class="img-container">
                <img src="${p.fotoUrl || p.urlFotoPerfil || 'assets/images/no-image.jpg'}" alt="${p.nombreParcela}">
            </div>
            <div class="info">
                <span class="comunidad-tag">${p.comunidad || 'Cayambe'}</span>
                <h3>${p.nombreParcela}</h3>
                <p>${p.descripcionCorta || 'Productor local de la red Mercado Raíz'}</p>
                <a href="perfil-proveedor.html?id=${p.id}" class="btn-ver">Conocer Historia</a>
            </div>
        </div>
    `).join('');
}

/***********************************
 * UTILIDADES
 ***********************************/

function actualizarInterfazSesion() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    const authContainer = document.getElementById('authContainer');

    if (sesion && authContainer) {
        authContainer.innerHTML = `
            <div id="userMenu" style="display:flex; align-items:center; gap:10px; cursor:pointer; color: var(--terracotta);">
                <i class="fas fa-user-circle" style="font-size: 1.2rem;"></i> 
                <span style="font-weight: bold;">Hola, ${sesion.nombre.split(' ')[0]}</span>
                <button onclick="window.cerrarSesion()" style="background:none; border:none; color:#888; cursor:pointer; font-size:0.8rem; margin-left:5px;">(Salir)</button>
            </div>
        `;
    }
}

function finalizarCargaVisual() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
}