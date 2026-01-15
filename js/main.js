/***********************************
 * CONFIGURACIÓN DE ESTADO GLOBAL
 ***********************************/
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
// Priorizamos datos de localStorage; si no existen, se cargarán de data.js (si está incluido)
const productos = JSON.parse(localStorage.getItem('productos')) || [];
const proveedores = JSON.parse(localStorage.getItem('proveedores')) || [];

document.addEventListener("DOMContentLoaded", () => {
    actualizarInterfazSesion();
    actualizarContadorCarrito();

    // Enrutador de funciones por ID
    if (document.getElementById("carrusel-container")) renderizarCarrusel();
    if (document.getElementById("productsGrid")) renderizarPaginaCategoria();
    if (document.getElementById("cartContainer")) mostrarCarrito();
    
    // Inicializar formularios de contacto si existen
    setupFormulariosContacto();
});

/***********************************
 * GESTIÓN DE SESIÓN
 ***********************************/
function actualizarInterfazSesion() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');

    if (!loginLink || !logoutLink) return;

    if (sesion) {
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
 * RENDERIZADO DE PRODUCTOS Y FILTROS
 ***********************************/
function renderizarPaginaCategoria(filtro = 'todos') {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    const productosFiltrados = filtro === 'todos' 
        ? productos 
        : productos.filter(p => p.categoria === filtro);

    grid.innerHTML = productosFiltrados.map(p => `
        <div class="product-card glass-card">
            <div class="product-badge">${p.stock > 0 ? 'Disponible' : 'Agotado'}</div>
            <img src="${p.imagen}" alt="${p.nombre}">
            <div class="product-info">
                <h3>${p.nombre}</h3>
                <p class="price">$${p.precio.toFixed(2)} / ${p.unidad}</p>
                <button class="btn-add" onclick="agregarCarrito(${p.id})" ${p.stock <= 0 ? 'disabled' : ''}>
                    ${p.stock > 0 ? '<i class="fas fa-cart-plus"></i> Agregar' : 'Agotado'}
                </button>
            </div>
        </div>
    `).join('');
}

// Función vinculada a los botones 'chip' de productos.html
function filtrar(categoria) {
    // Actualizar estilo visual de botones
    document.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderizarPaginaCategoria(categoria);
}

/***********************************
 * LÓGICA DE CONTACTO (Doble Formulario)
 ***********************************/
function setupFormulariosContacto() {
    const fCliente = document.getElementById('formCliente');
    const fProductor = document.getElementById('formProductor');

    if (fCliente) {
        fCliente.onsubmit = (e) => {
            e.preventDefault();
            guardarMensaje('Cliente', {
                nombre: e.target[0].value,
                email: e.target[1].value,
                mensaje: e.target[2].value
            });
            e.target.reset();
        };
    }

    if (fProductor) {
        fProductor.onsubmit = (e) => {
            e.preventDefault();
            guardarMensaje('Productor', {
                finca: e.target[0].value,
                comunidad: e.target[1].value,
                whatsapp: e.target[2].value,
                productos: e.target[3].value
            });
            e.target.reset();
        };
    }
}

function guardarMensaje(tipo, datos) {
    const mensajes = JSON.parse(localStorage.getItem('mensajesAdmin')) || [];
    mensajes.push({
        id: Date.now(),
        tipo: tipo,
        datos: datos,
        fecha: new Date().toLocaleString(),
        leido: false
    });
    localStorage.setItem('mensajesAdmin', JSON.stringify(mensajes));
    alert(`¡Gracias! Tu mensaje como ${tipo} ha sido enviado al equipo de Mercado Raíz.`);
}

/***********************************
 * CARRITO E INVENTARIO
 ***********************************/
function agregarCarrito(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto || producto.stock <= 0) return alert("Sin stock disponible.");

    const itemEnCarrito = carrito.find(item => item.id === id);
    if (itemEnCarrito) {
        if (itemEnCarrito.cantidad < producto.stock) {
            itemEnCarrito.cantidad++;
        } else {
            return alert("No hay más stock disponible de este productor.");
        }
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    guardarCarrito();
    actualizarContadorCarrito();
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarContadorCarrito() {
    const contador = document.getElementById("cartCount");
    if (!contador) return;
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    contador.innerText = totalItems;
    totalItems > 0 ? contador.classList.remove('hidden') : contador.classList.add('hidden');
}

function confirmarPedido() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    if (!sesion) {
        alert("Inicia sesión para finalizar.");
        window.location.href = 'login.html';
        return;
    }

    if (carrito.length === 0) return;

    // Actualizar stock real
    carrito.forEach(item => {
        const pIdx = productos.findIndex(p => p.id === item.id);
        if (pIdx !== -1) productos[pIdx].stock -= item.cantidad;
    });

    localStorage.setItem("productos", JSON.stringify(productos));

    // Registrar en pedidos
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    pedidos.push({
        id: Date.now(),
        cliente: sesion.nombre,
        total: carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0),
        estado: "Pendiente"
    });
    localStorage.setItem('pedidos', JSON.stringify(pedidos));

    alert("Pedido procesado con éxito.");
    carrito = [];
    guardarCarrito();
    window.location.href = 'index.html';
}