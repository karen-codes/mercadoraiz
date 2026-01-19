/***********************************
 * CONFIGURACIÓN DE ESTADO GLOBAL
 ***********************************/
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
// Ahora estas variables se llenarán con datos de Firebase
let productos = [];
let proveedores = [];

document.addEventListener("DOMContentLoaded", () => {
    actualizarInterfazSesion();
    actualizarContadorCarrito();
    setupCarritoFlotante(); 

    // 1. CARGAR DATOS DESDE FIREBASE
    db.ref('proveedores').on('value', (snapshot) => {
        const data = snapshot.val();
        proveedores = data ? Object.values(data) : [];
        
        // Cargamos productos después de tener los proveedores para vincularlos
        db.ref('productos').on('value', (prodSnapshot) => {
            const prodData = prodSnapshot.val();
            productos = prodData ? Object.values(prodData) : [];
            
            // Si estamos en la página de productos, renderizar
            if (document.getElementById("productsGrid")) {
                inicializarFiltrosYRenderizado();
            }
        });
    });
    
    if (document.getElementById("cartContainer")) mostrarCarritoCompleto(); 
});

function inicializarFiltrosYRenderizado() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    
    if (cat && cat.toLowerCase() !== 'todos') {
        const filtrados = productos.filter(p => 
            p.categoria && p.categoria.trim().toLowerCase() === cat.trim().toLowerCase()
        );
        renderizarPaginaCategoria(filtrados);
        if(document.getElementById("categoriaTitulo")) document.getElementById("categoriaTitulo").innerText = cat;
    } else {
        renderizarPaginaCategoria(productos);
    }
}

/***********************************
 * LÓGICA DEL CARRITO (SIDE CART)
 ***********************************/
function setupCarritoFlotante() {
    const cartBtn = document.getElementById('floating-cart-btn');
    const sideCart = document.getElementById('side-cart');
    const closeBtn = document.getElementById('close-cart');
    const overlay = document.getElementById('cart-overlay');
    const checkoutBtn = document.querySelector('.btn-checkout');

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

    // BOTÓN FINALIZAR COMPRA (ENVÍO A FIREBASE)
    if(checkoutBtn) {
        checkoutBtn.onclick = finalizacionCompraExpress;
    }
}

async function finalizacionCompraExpress() {
    if (carrito.length === 0) return alert("Tu carrito está vacío");

    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    if (!sesion) {
        alert("Debes iniciar sesión para realizar el pedido");
        window.location.href = 'login.html';
        return;
    }

    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    const pedido = {
        cliente: sesion.nombre,
        email: sesion.email,
        items: carrito,
        total: total,
        estado: "Pendiente",
        fecha: new Date().toLocaleString(),
        timestamp: Date.now()
    };

    try {
        // Guardar el pedido en Firebase
        await db.ref('pedidos').push(pedido);
        
        // Vaciar carrito
        carrito = [];
        guardarYActualizar();
        alert("¡Pedido enviado con éxito! Un productor se contactará contigo.");
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error al enviar pedido:", error);
        alert("Hubo un error al procesar tu compra.");
    }
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
                <button onclick="eliminarDelCarrito('${item.id}')" style="background:none; border:none; color:#AE6E24; cursor:pointer;">
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
    
    // El ID en Firebase puede ser String, por eso comparamos con ==
    const producto = productos.find(p => p.id == id);

    if (!producto) return;
    if (producto.stock <= 0) return alert("Sin existencias.");

    const itemExistente = carrito.find(item => item.id == id);
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
    
    // Feedback visual y abrir carrito
    const sideCart = document.getElementById('side-cart');
    const overlay = document.getElementById('cart-overlay');
    if(sideCart) {
        sideCart.classList.add('active');
        overlay.classList.add('active');
        renderizarCarritoFlotante();
    }
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id != id);
    guardarYActualizar();
    renderizarCarritoFlotante();
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
function renderizarPaginaCategoria(data) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    if (data.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px;">No se encontraron productos.</p>`;
        return;
    }

    grid.innerHTML = data.map(p => {
        const prov = proveedores.find(pr => pr.id == p.proveedorId);
        const nombreProductor = prov ? prov.nombre : 'Cayambe';

        return `
        <div class="product-card" style="border:1px solid #eee; border-radius:15px; background:#fff; overflow:hidden;">
            <div style="height:200px; overflow:hidden;">
                <img src="${p.imagen}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div style="padding:15px;">
                <h3 style="margin:0; font-size:1.1rem;">${p.nombre}</h3>
                <p style="font-size:0.8rem; color:#666;"><i class="fas fa-store"></i> ${nombreProductor}</p>
                <p style="color:#AE6E24; font-weight:bold; font-size:1.2rem; margin:10px 0;">$${parseFloat(p.precio).toFixed(2)}</p>
                <div style="display:flex; gap:10px;">
                    <input type="number" id="qty-${p.id}" value="1" min="1" max="${p.stock}" style="width:50px; text-align:center;">
                    <button class="btn-login-header" onclick="agregarAlCarritoClick('${p.id}')" style="flex:1; font-size:0.9rem;">
                        <i class="fas fa-shopping-basket"></i> Comprar
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function actualizarInterfazSesion() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');

    if (sesion) {
        if(loginLink) loginLink.style.display = 'none';
        if(logoutLink) {
            logoutLink.style.display = 'inline-block';
            logoutLink.innerHTML = `<i class="fas fa-user"></i> Hola, ${sesion.nombre}`;
        }
    }
}

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'index.html';
}