/**
 * js/main.js - Orquestador Global (PÁGINA PÚBLICA)
 * Mercado Raíz 2026
 */

let productos = [];
let proveedores = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicialización de Interfaz
    actualizarInterfazSesion();
    actualizarContadorCarrito();

    // 2. Escucha de Datos en Tiempo Real (Firebase)
    if (window.db) {
        // Escuchar Proveedores primero para poder cruzar datos en el carrusel
        window.db.ref('proveedores').on('value', (snapshot) => {
            const data = snapshot.val();
            proveedores = data ? Object.keys(data).map(key => ({...data[key], id: key})) : [];
            
            // Renderizar sección de productores si existe el contenedor
            if (document.getElementById('contenedor-productores')) {
                renderizarProductoresHome(proveedores);
            }

            // Una vez tenemos los proveedores, cargamos los productos
            window.db.ref('productos').on('value', (prodSnapshot) => {
                const prodData = prodSnapshot.val();
                productos = prodData ? Object.keys(prodData).map(key => ({...prodData[key], id: key})) : [];
                
                // Renderizado condicional según la página
                if (document.getElementById("carrusel-container")) {
                    renderizarCarruselHome(productos);
                }
                if (document.getElementById("productsGrid")) {
                    // Esta función suele estar en js/catalogo.js, pero la invocamos aquí
                    if (typeof renderizarCatalogo === 'function') renderizarCatalogo(productos);
                }
                
                finalizarCargaVisual();
            });
        });
    }
});

/***********************************
 * RENDERIZADO HOME (Vitrinas)
 ***********************************/

function renderizarProductoresHome(lista) {
    const contenedor = document.getElementById('contenedor-productores');
    if (!contenedor) return;

    contenedor.innerHTML = lista.map(p => `
        <div class="card-productor">
            <div class="img-container">
                <img src="${p.urlFotoPerfil || 'assets/images/no-image.jpg'}" alt="${p.nombreParcela}">
            </div>
            <div class="info">
                <span class="comunidad-tag">${p.comunidad}</span>
                <h3>${p.nombreParcela}</h3>
                <p>${p.descripcionCorta || 'Productor local de Cayambe'}</p>
                <a href="perfil-proveedor.html?id=${p.id}" class="btn-ver">Conocer Historia</a>
            </div>
        </div>
    `).join('');
}

function renderizarCarruselHome(lista) {
    const track = document.getElementById("carrusel-container");
    if (!track) return;

    track.innerHTML = lista.map(p => {
        // Buscamos el nombre del productor para mostrarlo en el badge del producto
        const prov = proveedores.find(pr => pr.id == p.idProductor);
        const nombreParcela = prov ? prov.nombreParcela : 'Cosecha Local';

        return `
        <div class="carousel-item">
            <div class="product-card">
                <div class="badge-productor"><i class="fas fa-map-marker-alt"></i> ${nombreParcela}</div>
                <img src="${p.urlFotoProducto || 'assets/images/no-image.jpg'}" loading="lazy">
                <div class="product-info">
                    <small>${p.categoriaProducto}</small>
                    <h3>${p.nombreProducto}</h3>
                    <div class="flex-row">
                        <p class="precio">$${parseFloat(p.precio).toFixed(2)} <span>/ ${p.unidadMedida}</span></p>
                        <button onclick="agregarAlCarritoClick('${p.id}')" class="btn-add" title="Añadir a la canasta">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

/***********************************
 * LÓGICA DE CARRITO GLOBAL
 ***********************************/

function agregarAlCarritoClick(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    const itemEnCarrito = carrito.find(item => item.id === id);
    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        carrito.push({
            id: prod.id,
            nombre: prod.nombreProducto,
            precio: parseFloat(prod.precio),
            unidad: prod.unidadMedida,
            idProductor: prod.idProductor,
            cantidad: 1
        });
    }
    
    // Feedback visual y guardado
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    
    // Notificación simple
    alert(`¡${prod.nombreProducto} añadido!`);
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
 * SESIÓN Y UTILIDADES
 ***********************************/

function actualizarInterfazSesion() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    const loginLink = document.getElementById('loginLink');
    const userMenu = document.getElementById('userMenu');

    if (sesion && loginLink) {
        loginLink.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            userMenu.innerHTML = `<i class="fas fa-user-circle"></i> Hola, ${sesion.nombre.split(' ')[0]}`;
        }
    }
}

function finalizarCargaVisual() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
}