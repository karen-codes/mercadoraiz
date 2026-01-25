/**
 * js/main.js - Orquestador Global (PÁGINA PÚBLICA)
 * Mercado Raíz 2026
 */

let productos = [];
let proveedores = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.addEventListener("DOMContentLoaded", () => {
    actualizarInterfazSesion();
    actualizarContadorCarrito();

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
                    // Si usas una función específica para renderizar el carrusel
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
 * Función Maestra para añadir al carrito
 * id: ID del producto en Firebase
 * nombre: Nombre a mostrar
 * precio: Valor numérico
 * imagen: URL de la foto
 * idProductor: ID del dueño del producto
 */
function addToCart(id, nombre, precio, imagen, idProductor) {
    // Validar que tengamos datos mínimos
    if (!id) return;

    // Buscar si ya existe para incrementar cantidad
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
    
    // Guardar y Notificar
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    
    // Notificación visual rápida
    alert(`¡${nombre} añadido a tu canasta!`);
}

/**
 * Mantiene compatibilidad con botones antiguos que usan agregarAlCarritoClick
 */
function agregarAlCarritoClick(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    // Sincronizamos los nombres de campos de tu Firebase (p.nombre y p.urlFotoProducto)
    addToCart(
        prod.id, 
        prod.nombre || prod.nombreProducto, 
        prod.precio, 
        prod.urlFotoProducto || prod.imagenUrl, 
        prod.idProductor
    );
}

function actualizarContadorCarrito() {
    const count = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

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
            <div id="userMenu" style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                <i class="fas fa-user-circle"></i> 
                <span>Hola, ${sesion.nombre.split(' ')[0]}</span>
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