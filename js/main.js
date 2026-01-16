/***********************************
 * CONFIGURACIÓN DE ESTADO GLOBAL
 ***********************************/
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
const productos = JSON.parse(localStorage.getItem('productos')) || [];
const proveedores = JSON.parse(localStorage.getItem('proveedores')) || [];

document.addEventListener("DOMContentLoaded", () => {
    actualizarInterfazSesion();
    actualizarContadorCarrito();

    // Enrutador de funciones por ID
    // Cambiamos "productsGrid" por la nueva lógica de renderizado
    if (document.getElementById("productsGrid")) renderizarPaginaCategoria();
    if (document.getElementById("cartContainer")) mostrarCarrito();
    
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
 * RENDERIZADO DE PRODUCTOS (3 COLUMNAS)
 ***********************************/
function renderizarPaginaCategoria(filtro = 'todos') {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    const productosFiltrados = filtro === 'todos' 
        ? productos 
        : productos.filter(p => p.categoria === filtro);

    grid.innerHTML = productosFiltrados.map(p => {
        // Buscamos el nombre del proveedor para mostrarlo en la tarjeta
        const prov = proveedores.find(pr => pr.id === p.proveedorId);
        const nombreHacienda = prov ? prov.nombre : "Productor Local";

        return `
        <div class="product-card-v2 glass-card">
            <div class="product-image">
                <div class="product-badge ${p.stock > 0 ? 'bg-verde' : 'bg-rojo'}">
                    ${p.stock > 0 ? 'Disponible' : 'Agotado'}
                </div>
                <img src="${p.imagen}" alt="${p.nombre}">
            </div>
            
            <div class="product-content">
                <h3 class="product-title">${p.nombre}</h3>
                <p class="product-provider"><i class="fas fa-leaf"></i> ${nombreHacienda}</p>
                <p class="product-description">${p.descripcion || 'Producto fresco de Cayambe, cultivado con procesos orgánicos.'}</p>
                
                <div class="product-footer">
                    <span class="product-price">$${p.precio.toFixed(2)} / ${p.unidad}</span>
                    
                    <div class="purchase-controls">
                        <div class="quantity-counter">
                            <button onclick="cambiarCant(${p.id}, -1)">-</button>
                            <input type="number" id="qty-${p.id}" value="1" min="1" max="${p.stock}" readonly>
                            <button onclick="cambiarCant(${p.id}, 1)">+</button>
                        </div>
                        <button class="btn-add-cart" onclick="procesarCompra(${p.id})" ${p.stock <= 0 ? 'disabled' : ''}>
                            ${p.stock > 0 ? '<i class="fas fa-shopping-basket"></i> Agregar' : 'Agotado'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

// Lógica para el contador +/- 
function cambiarCant(id, delta) {
    const input = document.getElementById(`qty-${id}`);
    const producto = productos.find(p => p.id === id);
    let nuevoValor = parseInt(input.value) + delta;
    
    // Validar que no sea menor a 1 ni mayor al stock
    if (nuevoValor < 1) nuevoValor = 1;
    if (producto && nuevoValor > producto.stock) {
        alert("Cantidad máxima alcanzada según stock disponible.");
        nuevoValor = producto.stock;
    }
    
    input.value = nuevoValor;
}

function filtrar(categoria) {
    document.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
    if (event) event.target.classList.add('active');
    renderizarPaginaCategoria(categoria);
}

/***********************************
 * CARRITO E INVENTARIO
 ***********************************/
function procesarCompra(id) {
    const cantidadSeleccionada = parseInt(document.getElementById(`qty-${id}`).value);
    agregarCarrito(id, cantidadSeleccionada);
}

function agregarCarrito(id, cantidad = 1) {
    const producto = productos.find(p => p.id === id);
    if (!producto || producto.stock <= 0) return alert("Sin stock disponible.");

    const itemEnCarrito = carrito.find(item => item.id === id);
    
    if (itemEnCarrito) {
        if ((itemEnCarrito.cantidad + cantidad) <= producto.stock) {
            itemEnCarrito.cantidad += cantidad;
        } else {
            return alert("No puedes agregar más de lo que hay en stock.");
        }
    } else {
        carrito.push({ ...producto, cantidad: cantidad });
    }

    guardarCarrito();
    actualizarContadorCarrito();
    alert(`¡Agregado! ${cantidad} unidad(es) de ${producto.nombre}.`);
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

/***********************************
 * FINALIZAR PEDIDO
 ***********************************/
function confirmarPedido() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    if (!sesion) {
        alert("Inicia sesión para finalizar.");
        window.location.href = 'login.html';
        return;
    }

    if (carrito.length === 0) return;

    // Actualizar stock real en el arreglo global
    carrito.forEach(item => {
        const pIdx = productos.findIndex(p => p.id === item.id);
        if (pIdx !== -1) productos[pIdx].stock -= item.cantidad;
    });

    localStorage.setItem("productos", JSON.stringify(productos));

    // Registrar pedido
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    pedidos.push({
        id: Date.now(),
        cliente: sesion.nombre,
        total: carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0),
        estado: "Pendiente",
        fecha: new Date().toLocaleString()
    });
    localStorage.setItem('pedidos', JSON.stringify(pedidos));

    alert("Pedido procesado con éxito.");
    carrito = [];
    guardarCarrito();
    window.location.href = 'index.html';
}

/***********************************
 * CONTACTO Y OTROS
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
    alert(`Tu mensaje ha sido enviado.`);
}