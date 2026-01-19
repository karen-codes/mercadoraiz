/***********************************
 * ESTADO GLOBAL Y SINCRONIZACIÓN
 ***********************************/
let productos = [];
let proveedores = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.addEventListener("DOMContentLoaded", () => {
    actualizarInterfazSesion();
    actualizarContadorCarrito();

    // 1. CARGA EN TIEMPO REAL DESDE FIREBASE
    // Escuchamos proveedores primero para poder cruzar los datos
    db.ref('proveedores').on('value', (snapshot) => {
        const data = snapshot.val();
        proveedores = data ? Object.keys(data).map(key => ({...data[key], id: key})) : [];
        
        // Traemos productos vinculados
        db.ref('productos').on('value', (prodSnapshot) => {
            const prodData = prodSnapshot.val();
            productos = prodData ? Object.keys(prodData).map(key => ({...prodData[key], id: key})) : [];
            
            if (document.getElementById("productsGrid")) {
                renderizarCatalogo(productos);
            }
            finalizarCargaVisual();
        });
    });
});

/***********************************
 * LÓGICA DEL CARRITO Y PAGOS
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
            nombre: prod.nombre,
            precio: prod.precio,
            unidad: prod.unidad || 'Unidad',
            proveedorId: prod.proveedorId,
            cantidad: 1
        });
    }
    
    guardarYNotificar();
}

function guardarYNotificar() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    // Opcional: Mostrar un toast o alerta pequeña
}

/**
 * PROCESO DE PAGO Y SUBIDA DE COMPROBANTE (Requerimiento Clave)
 */
async function finalizarCompra() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    if (!sesion) {
        alert("Debes iniciar sesión para realizar un pedido.");
        window.location.href = 'login.html';
        return;
    }

    if (carrito.length === 0) return alert("Tu carrito está vacío.");

    const total = carrito.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
    
    // Crear el HTML para que el usuario suba su comprobante
    const modalPago = document.createElement('div');
    modalPago.className = 'modal-pago-flotante';
    modalPago.innerHTML = `
        <div class="modal-content">
            <h3>Finalizar Pedido</h3>
            <p>Total a pagar: <strong>$${total.toFixed(2)}</strong></p>
            <hr>
            <label>Selecciona tu comprobante de pago (Foto/Screenshot):</label>
            <input type="file" id="input_comprobante" accept="image/*" class="admin-input" style="margin:10px 0;">
            <p style="font-size:0.8rem; color:#666;">Formatos: JPG, PNG. Máx 5MB.</p>
            <div style="display:flex; gap:10px; margin-top:15px;">
                <button id="btnConfirmarPedido" class="btn-comprar">Confirmar y Subir Pago</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-delete">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalPago);

    document.getElementById('btnConfirmarPedido').onclick = async () => {
        const fileInput = document.getElementById('input_comprobante');
        const file = fileInput.files[0];

        if (!file) {
            alert("Por favor, sube la imagen de tu transferencia o pago QR para continuar.");
            return;
        }

        document.getElementById('btnConfirmarPedido').disabled = true;
        document.getElementById('btnConfirmarPedido').innerText = "Procesando...";

        try {
            // 1. Subir la imagen al Storage (Usando la función de data.js)
            const urlComprobante = await subirArchivoNativo(file, 'comprobantes_pedidos');

            // 2. Crear el objeto del pedido
            const pedido = {
                cliente: sesion.nombre,
                clienteId: sesion.id,
                email: sesion.email,
                telefono: sesion.telefono,
                total: total,
                items: carrito,
                comprobanteUrl: urlComprobante,
                estado: "Pendiente",
                metodoPago: "Transferencia/QR",
                fecha: new Date().toLocaleString()
            };

            // 3. Guardar en Firebase
            await db.ref('pedidos').push(pedido);

            // 4. Limpiar y redirigir
            carrito = [];
            localStorage.removeItem('carrito');
            alert("¡Pedido enviado con éxito! Un productor validará tu pago pronto.");
            window.location.href = 'index.html';

        } catch (error) {
            alert("Error al procesar el pedido: " + error.message);
        }
    };
}

/***********************************
 * RENDERIZADO DE INTERFAZ
 ***********************************/
function renderizarCatalogo(lista) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    grid.innerHTML = lista.map(p => {
        const prov = proveedores.find(pr => pr.id == p.proveedorId);
        const nombreProductor = prov ? prov.nombre : 'Productor Local';

        return `
        <div class="product-card">
            <div class="badge-productor"><i class="fas fa-leaf"></i> ${nombreProductor}</div>
            <img src="${p.imagen || 'assets/images/no-image.jpg'}" loading="lazy">
            <div class="product-info">
                <h3>${p.nombre}</h3>
                <p class="unidad-medida">${p.unidad || 'Libra'}</p>
                <div class="flex-row">
                    <p class="precio">$${parseFloat(p.precio).toFixed(2)}</p>
                    <button onclick="agregarAlCarritoClick('${p.id}')" class="btn-add">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function actualizarContadorCarrito() {
    const count = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;
}

function actualizarInterfazSesion() {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    const userArea = document.getElementById('user-area');
    if (!userArea) return;

    if (sesion) {
        userArea.innerHTML = `
            <span>Hola, <strong>${sesion.nombre.split(' ')[0]}</strong></span>
            <button onclick="cerrarSesion()" class="btn-logout"><i class="fas fa-sign-out-alt"></i></button>
        `;
    }
}

function finalizarCargaVisual() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}