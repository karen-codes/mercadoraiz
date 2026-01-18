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
    if (document.getElementById("productsGrid")) renderizarPaginaCategoria();
    if (document.getElementById("cartContainer")) mostrarCarritoCompleto(); 
    
    setupFormulariosContacto();
});

/***********************************
 * LÓGICA DEL CARRITO FLOTANTE (UI)
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
        container.innerHTML = `<p class="empty-msg">Tu cesta está vacía.</p>`;
        totalElement.innerText = "$0.00";
        return;
    }

    let total = 0;
    container.innerHTML = carrito.map(item => {
        total += item.precio * item.cantidad;
        return `
            <div class="cart-item">
                <img src="${item.imagen}" alt="${item.nombre}">
                <div class="item-details">
                    <h4>${item.nombre}</h4>
                    <p>${item.cantidad} x $${item.precio.toFixed(2)}</p>
                    <button class="btn-remove-simple" onclick="eliminarDelCarrito(${item.id})">Quitar</button>
                </div>
            </div>
        `;
    }).join('');

    totalElement.innerText = `$${total.toFixed(2)}`;
}

/***********************************
 * PRODUCTOS Y COMPRA
 ***********************************/
function agregarAlCarritoClick(id) {
    const qtyInput = document.getElementById(`qty-${id}`);
    const cantidad = parseInt(qtyInput.value);
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
    
    // Abrir automáticamente el panel lateral
    document.getElementById('side-cart').classList.add('active');
    document.getElementById('cart-overlay').classList.add('active');
    renderizarCarritoFlotante();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarYActualizar();
    renderizarCarritoFlotante();
    if (document.getElementById("cartContainer")) mostrarCarritoCompleto();
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
 * FINALIZAR PEDIDO (VITAL PARA EL ADMIN)
 ***********************************/
function finalizarCompra() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    
    if (!sesion) {
        alert("Debes iniciar sesión para realizar un pedido.");
        window.location.href = 'login.html';
        return;
    }

    if (carrito.length === 0) return alert("El carrito está vacío.");

    // Crear el objeto del pedido con el desglose de productos (items)
    const nuevoPedido = {
        id: Date.now(),
        cliente: sesion.nombre,
        email: sesion.email,
        fecha: new Date().toLocaleString(),
        total: carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0),
        items: [...carrito], // Copiamos el carrito actual
        estado: "Pendiente"
    };

    // Guardar en la base de datos local de pedidos
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    pedidos.push(nuevoPedido);
    localStorage.setItem('pedidos', JSON.stringify(pedidos));

    // Restar stock de los productos
    carrito.forEach(item => {
        const indexProd = productos.findIndex(p => p.id === item.id);
        if (indexProd !== -1) productos[indexProd].stock -= item.cantidad;
    });
    localStorage.setItem('productos', JSON.stringify(productos));

    // Limpiar carrito y avisar
    carrito = [];
    guardarYActualizar();
    alert("¡Pedido realizado con éxito! Gracias por apoyar a los productores de Cayambe.");
    window.location.href = 'index.html';
}

/***********************************
 * BUSCADOR
 ***********************************/
function buscarProductos() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const productosFiltrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(query) || 
        p.categoria.toLowerCase().includes(query)
    );
    renderizarPaginaCategoria(productosFiltrados, true);
}

function renderizarPaginaCategoria(data = productos, esBusqueda = false) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    if (data.length === 0) {
        grid.innerHTML = `<p class="no-results">No se encontraron productos que coincidan.</p>`;
        return;
    }

    grid.innerHTML = data.map(p => {
        const prov = proveedores.find(pr => pr.id === p.proveedorId);
        return `
        <div class="product-card">
            <div class="product-image"><img src="${p.imagen}" alt="${p.nombre}"></div>
            <div class="product-info">
                <h3>${p.nombre}</h3>
                <p class="provider-tag"><i class="fas fa-leaf"></i> ${prov ? prov.nombre : 'Cayambe'}</p>
                <p class="price">$${p.precio.toFixed(2)} / ${p.unidad}</p>
                <div class="purchase-row">
                    <input type="number" id="qty-${p.id}" value="1" min="1" max="${p.stock}">
                    <button class="btn-buy" onclick="agregarAlCarritoClick(${p.id})">Agregar</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ... resto de funciones de sesión y contacto

const cartBtn = document.getElementById('floating-cart-btn');
const sideCart = document.getElementById('side-cart');
const closeCart = document.getElementById('close-cart');
const overlay = document.getElementById('cart-overlay');

cartBtn.addEventListener('click', () => {
    sideCart.classList.add('active');
    overlay.classList.add('active');
});

closeCart.addEventListener('click', () => {
    sideCart.classList.remove('active');
    overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
    sideCart.classList.remove('active');
    overlay.classList.remove('active');
});