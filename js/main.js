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

/**
 * Carga los productos destacados en el carrusel principal
 * Solo muestra la imagen para un diseño más limpio.
 */
function cargarCarruselDestacados() {
    const contenedor = document.getElementById('carrusel-container');
    if (!contenedor) return;

    // Leemos de la rama 'productos' que es donde guardas en el admin
    db.ref('productos').limitToLast(10).on('value', (snapshot) => {
        contenedor.innerHTML = "";
        
        if (!snapshot.exists()) {
            contenedor.innerHTML = "<p>Próximamente nuevas cosechas...</p>";
            return;
        }

        snapshot.forEach((child) => {
            const p = child.val();
            // Creamos el elemento del carrusel solo con la imagen
            const slide = document.createElement('div');
            slide.className = 'carousel-item'; // Asegúrate que esta clase tenga un ancho definido en CSS
            
            slide.innerHTML = `
                <div class="product-card-simple" style="margin: 0 10px;">
                    <img src="${p.imagenUrl}" 
                         alt="${p.nombre}" 
                         title="${p.nombre}"
                         style="width:280px; height:380px; object-fit:cover; border-radius:15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                </div>
            `;
            contenedor.appendChild(slide);
        });
    });
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', cargarCarruselDestacados);

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