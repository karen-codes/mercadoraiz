/**
 * js/main.js - Orquestador Global (PÁGINA PÚBLICA)
 * Mercado Raíz 2026
 */

let productos = [];
let proveedores = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.addEventListener("DOMContentLoaded", () => {
    actualizarInterfazSesion();
    window.actualizarContadorCarrito();

    if (window.db) {
        // 1. Cargar Proveedores
        window.db.ref('proveedores').on('value', (snapshot) => {
            const data = snapshot.val();
            proveedores = data ? Object.keys(data).map(key => ({...data[key], id: key})) : [];
            
            if (document.getElementById('contenedor-productores')) {
                renderizarProductoresHome(proveedores);
            }

            // 2. Cargar Productos
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
 * SISTEMA DE NOTIFICACIONES GLOBAL
 ***********************************/
window.mostrarNotificacion = function(mensaje) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        const esError = mensaje.toLowerCase().includes('falta') || mensaje.toLowerCase().includes('error');
        oscillator.frequency.setValueAtTime(esError ? 440 : 880, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) { console.log("Audio no soportado"); }

    const esExito = mensaje.toLowerCase().includes('éxito') || mensaje.toLowerCase().includes('añadido');
    const colorFondo = esExito ? "#27ae60" : "#a65d3d";

    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 100005; display: flex; flex-direction: column; gap: 10px; pointer-events: none;`;
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.style.cssText = `background: ${colorFondo}; color: white; padding: 16px 25px; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 12px; min-width: 300px; font-family: 'Segoe UI', Roboto, sans-serif; pointer-events: auto; transform: translateX(130%); transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); border-left: 5px solid rgba(255,255,255,0.3);`;

    notification.innerHTML = `
        <i class="fas ${esExito ? 'fa-check-circle' : 'fa-exclamation-triangle'}" style="font-size: 1.4rem;"></i>
        <div style="flex-grow: 1;">
            <strong style="display: block; font-size: 0.75rem; letter-spacing: 1px; opacity: 0.9; margin-bottom: 3px;">MERCADO RAÍZ</strong>
            <span style="font-weight: 500;">${mensaje}</span>
        </div>`;

    container.appendChild(notification);
    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 50);
    setTimeout(() => {
        notification.style.transform = 'translateX(130%)';
        setTimeout(() => notification.remove(), 500);
    }, 4500);
};

/***********************************
 * LÓGICA DE CARRITO (CORREGIDA)
 ***********************************/
window.addToCart = function(id, nombre, precio, imagen, idProductor) {
    let carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
    if (!id) return;
    
    // Rescate de idProductor si viene genérico
    if (idProductor === "general") {
        const rescate = productos.find(p => p.id === id);
        if (rescate && (rescate.idProductor || rescate.productorId)) {
            idProductor = rescate.idProductor || rescate.productorId;
        }
    }

    // --- LÓGICA DE INSERCIÓN CORREGIDA ---
    const itemEnCarrito = carritoActual.find(item => item.id === id);
    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        carritoActual.push({
            id: id,
            nombre: nombre || "Producto",
            precio: parseFloat(precio) || 0,
            imagen: imagen || 'assets/images/no-image.jpg',
            idProductor: idProductor || "general",
            cantidad: 1
        });
    }
    // -------------------------------------
    
    localStorage.setItem('carrito', JSON.stringify(carritoActual));
    window.actualizarContadorCarrito();
    window.mostrarNotificacion(`¡${nombre} añadido con éxito!`);
};

window.agregarAlCarritoClick = function(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    const productorIdFinal = prod.idProductor || prod.productorId || "general";
    const nombreFinal = prod.nombre || prod.nombreProducto || "Producto";
    const imagenFinal = prod.imagenUrl || prod.urlFotoProducto || prod.fotoUrl || 'assets/images/no-image.jpg';
    const precioFinal = parseFloat(prod.precio) || 0;

    window.addToCart(prod.id, nombreFinal, precioFinal, imagenFinal, productorIdFinal);
};

window.actualizarContadorCarrito = function() {
    const carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
    const count = carritoActual.reduce((sum, item) => sum + item.cantidad, 0);
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
};

/***********************************
 * RENDERIZADO Y SESIÓN
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
        </div>`).join('');
}

function actualizarInterfazSesion() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    const authContainer = document.getElementById('authContainer');
    if (sesion && authContainer) {
        authContainer.innerHTML = `
            <div id="userMenu" style="display:flex; align-items:center; gap:10px; cursor:pointer; color: var(--pueblo-terracotta);">
                <i class="fas fa-user-circle" style="font-size: 1.2rem;"></i> 
                <span style="font-weight: bold;">Hola, ${sesion.nombre.split(' ')[0]}</span>
                <button onclick="window.cerrarSesion()" style="background:none; border:none; color:#888; cursor:pointer; font-size:0.8rem; margin-left:5px;">(Salir)</button>
            </div>`;
    }
}

window.cerrarSesion = function() {
    localStorage.removeItem('sesionActiva');
    window.location.reload();
};

function finalizarCargaVisual() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
}