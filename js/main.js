/***********************************
 * CONFIGURACIÓN DE ESTADO GLOBAL
 ***********************************/
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
const productos = JSON.parse(localStorage.getItem('productos')) || [];
const proveedores = JSON.parse(localStorage.getItem('proveedores')) || [];

document.addEventListener("DOMContentLoaded", () => {
    actualizarInterfazSesion();
    actualizarContadorCarrito();
    setupCarritoFlotante(); 

    // Renderizado según la página donde estemos
    if (document.getElementById("productsGrid")) {
        // Si estamos en categoria.html, filtramos por URL, si no, mostramos todo
        const params = new URLSearchParams(window.location.search);
        const cat = params.get('cat');
        if (cat) {
            const filtrados = productos.filter(p => p.categoria.toLowerCase() === cat.toLowerCase());
            renderizarPaginaCategoria(filtrados);
            if(document.getElementById("categoriaTitulo")) document.getElementById("categoriaTitulo").innerText = cat;
        } else {
            renderizarPaginaCategoria();
        }
    }
    
    if (document.getElementById("cartContainer")) mostrarCarritoCompleto(); 
});

/***********************************
 * LÓGICA DEL CARRITO (SIDE CART)
 ***********************************/
function setupCarritoFlotante() {
    const cartBtn = document.getElementById('floating-cart-btn');
    const sideCart = document.getElementById('side-cart');
    const closeBtn = document.getElementById('close-cart');
    const overlay = document.getElementById('cart-overlay');

    if (!cartBtn || !sideCart) return;

    cartBtn.onclick = () => {
        sideCart.classList.add('active');
        overlay.classList.add('active');
        renderizarCarritoFlotante();
    };

    const cerrar = () => {
        sideCart.classList.remove('active');
        overlay.classList.remove('active');
    };

    if(closeBtn) closeBtn.onclick = cerrar;
    if(overlay) overlay.onclick = cerrar;
}

function renderizarCarritoFlotante() {
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-amount');
    
    if (!container) return;

    if (carrito.length === 0) {
        container.innerHTML = `<div class="text-center" style="padding:20px; color:#888;">Tu cesta está vacía.</div>`;
        if(totalElement) totalElement.innerText = "$0.00";
        return;
    }

    let total = 0;
    container.innerHTML = carrito.map(item => {
        total += item.precio * item.cantidad;
        return `
            <div class="cart-item" style="display:flex; gap:10px; padding:10px; border-bottom:1px solid #eee; align-items:center;">
                <img src="${item.imagen}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                <div style="flex:1">
                    <h4 style="font-size:0.9rem; margin:0;">${item.nombre}</h4>
                    <p style="font-size:0.8rem; margin:0;">${item.cantidad} x $${item.precio.toFixed(2)}</p>
                </div>
                <button onclick="eliminarDelCarrito(${item.id})" style="background:none; border:none; color:var(--pueblo-terracotta); cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    if(totalElement) totalElement.innerText = `$${total.toFixed(2)}`;
}

/***********************************
 * PRODUCTOS Y COMPRA
 ***********************************/
function agregarAlCarritoClick(id) {
    const qtyInput = document.getElementById(`qty-${id}`);
    const cantidad = parseInt(qtyInput ? qtyInput.value : 1);
    const producto = productos.find(p => p.id === id);

    if (!producto || producto.stock <= 0) return alert("Sin existencias.");

    const itemExistente = carrito.find(item => item.id === id);
    const cantActualEnCarrito = itemExistente ? itemExistente.cantidad : 0;

    if (cantActualEnCarrito + cantidad > producto.stock) {
        alert(`Solo quedan ${producto.stock} unidades disponibles.`);
        return;
    }

    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({ ...producto, cantidad });
    }

    guardarYActualizar();
    
    // Abrir automáticamente el panel lateral para feedback visual
    const sideCart = document.getElementById('side-cart');
    const overlay = document.getElementById('cart-overlay');
    if(sideCart && overlay) {
        sideCart.classList.add('active');
        overlay.classList.add('active');
        renderizarCarritoFlotante();
    }
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarYActualizar();
    renderizarCarritoFlotante();
    if (document.getElementById("lista-carrito")) mostrarCarritoCompleto();
}

function guardarYActualizar() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const badge = document.getElementById("cart-count-badge");
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    if (badge) badge.innerText = totalItems;
}

/***********************************
 * RENDERIZADO DE PRODUCTOS
 ***********************************/
function renderizarPaginaCategoria(data = productos) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    if (data.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px;">No se encontraron productos en esta categoría.</p>`;
        return;
    }

    grid.innerHTML = data.map(p => {
        const prov = proveedores.find(pr => pr.id === p.proveedorId);
        return `
        <div class="product-card">
            <div class="product-image">
                <img src="${p.imagen}" alt="${p.nombre}">
                ${p.stock < 5 ? '<span class="stock-tag">Pocas unidades</span>' : ''}
            </div>
            <div class="product-info">
                <h3>${p.nombre}</h3>
                <p class="provider-tag"><i class="fas fa-leaf"></i> ${prov ? prov.nombre : 'Cayambe'}</p>
                <p class="price">$${p.precio.toFixed(2)} / ${p.unidad}</p>
                <div class="purchase-row" style="display:flex; gap:10px; margin-top:15px;">
                    <input type="number" id="qty-${p.id}" value="1" min="1" max="${p.stock}" style="width:50px; padding:5px; border-radius:5px; border:1px solid #ddd;">
                    <button class="btn-login-header" style="flex:1; font-size:0.8rem;" onclick="agregarAlCarritoClick(${p.id})">
                        Agregar
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

/***********************************
 * INTERFAZ DE SESIÓN
 ***********************************/
function actualizarInterfazSesion() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');

    if (sesion) {
        if(loginLink) loginLink.style.display = 'none';
        if(logoutLink) {
            logoutLink.style.display = 'inline-block';
            logoutLink.innerHTML = `<i class="fas fa-user"></i> Hola, ${sesion.nombre} (Salir)`;
        }
    } else {
        if(loginLink) loginLink.style.display = 'inline-block';
        if(logoutLink) logoutLink.style.display = 'none';
    }
}

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'index.html';
}