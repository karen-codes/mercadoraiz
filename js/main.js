/***********************************
 * CONFIGURACIÓN DE ESTADO GLOBAL
 ***********************************/
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
const productos = JSON.parse(localStorage.getItem('productos')) || [];
const proveedores = JSON.parse(localStorage.getItem('proveedores')) || [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicialización de interfaz
    actualizarInterfazSesion();
    actualizarContadorCarrito();

    // 2. Enrutador de funciones por ID de contenedor
    if (document.getElementById("carrusel-container")) renderizarCarrusel();
    if (document.getElementById("productsGrid")) renderizarPaginaCategoria();
    if (document.getElementById("cartContainer")) mostrarCarrito();
});

/***********************************
 * GESTIÓN DE SESIÓN (Lógica Limpia)
 ***********************************/
function actualizarInterfazSesion() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');

    if (!loginLink || !logoutLink) return;

    if (sesion) {
        // Usamos la clase 'hidden' definida en styles.css
        loginLink.classList.add('hidden');
        logoutLink.classList.remove('hidden');
        logoutLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> Cerrar Sesión (${sesion.nombre.split(' ')[0]})`;
    } else {
        loginLink.classList.remove('hidden');
        logoutLink.classList.add('hidden');
    }
}

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    alert("Sesión finalizada correctamente.");
    window.location.href = 'index.html';
}

/***********************************
 * CARRUSEL DINÁMICO (INDEX)
 ***********************************/
function renderizarCarrusel() {
    const container = document.getElementById('carrusel-container');
    // Mostramos los últimos productos con stock disponible
    const destacados = productos.filter(p => p.stock > 0).slice(-4); 

    if (destacados.length === 0) {
        container.innerHTML = "<p class='text-muted'>Próximamente nuevos productos frescos...</p>";
        return;
    }

    container.innerHTML = destacados.map(p => `
        <div class="carousel-item">
            <img src="${p.imagen}" alt="${p.nombre}" class="product-img-card">
            <div class="product-info">
                <h3>${p.nombre}</h3>
                <p class="price">$${p.precio.toFixed(2)} / ${p.unidad}</p>
                <button class="btn-add" onclick="agregarCarrito(${p.id})">
                    <i class="fas fa-cart-plus"></i> Agregar
                </button>
            </div>
        </div>
    `).join('');
}

/***********************************
 * LÓGICA DE CARRITO E INVENTARIO
 ***********************************/
function agregarCarrito(id) {
    const producto = productos.find(p => p.id === id);
    
    // Validación de seguridad de stock
    if (!producto || producto.stock <= 0) {
        alert("Producto temporalmente agotado.");
        return;
    }

    const itemEnCarrito = carrito.find(item => item.id === id);
    
    if (itemEnCarrito) {
        if (itemEnCarrito.cantidad < producto.stock) {
            itemEnCarrito.cantidad++;
        } else {
            alert("Máximo stock alcanzado para este productor.");
            return;
        }
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    guardarCarrito();
    actualizarContadorCarrito();
    // Feedback visual simple
    console.log(`Agregado: ${producto.nombre}`);
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarContadorCarrito() {
    const contador = document.getElementById("cartCount");
    if (!contador) return;
    
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    contador.innerText = totalItems;
    
    // El CSS maneja la visibilidad según si tiene la clase 'hidden'
    totalItems > 0 ? contador.classList.remove('hidden') : contador.classList.add('hidden');
}

/***********************************
 * PROCESAMIENTO DE COMPRA
 ***********************************/
function confirmarPedido() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    if (!sesion) {
        alert("Por favor, inicia sesión para finalizar tu pedido.");
        window.location.href = 'login.html';
        return;
    }

    if (carrito.length === 0) return alert("Tu carrito está vacío.");

    // 1. Actualización de Inventario Global
    carrito.forEach(item => {
        const index = productos.findIndex(p => p.id === item.id);
        if (index !== -1) {
            productos[index].stock -= item.cantidad;
        }
    });

    // 2. Persistencia de datos
    localStorage.setItem("productos", JSON.stringify(productos));

    // 3. Registro de pedido para el Panel Admin
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    pedidos.push({
        id: Date.now(),
        cliente: sesion.nombre,
        total: carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0).toFixed(2),
        fecha: new Date().toLocaleString(),
        estado: "Pendiente"
    });
    localStorage.setItem('pedidos', JSON.stringify(pedidos));

    // 4. Finalización
    alert("¡Pedido confirmado! Redirigiendo para coordinar entrega.");
    carrito = [];
    guardarCarrito();
    window.location.href = 'index.html';
}