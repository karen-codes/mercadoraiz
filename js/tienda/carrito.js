/**
 * js/tienda/carrito.js - Gestión de Interfaz y Pagos (COMPLETO Y RESPONSIVE)
 */

// 1. Dibujar el carrito en la tabla
window.dibujarCarrito = function() {
    const tabla = document.getElementById('lista-carrito');
    const totalTxt = document.getElementById('total-precio');
    const footer = document.getElementById('cart-footer-actions');
    
    const carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];

    if (carritoActual.length === 0) {
        if (tabla) tabla.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px;">Tu canasta está fresca pero vacía.</td></tr>';
        if (footer) footer.style.display = 'none';
        if (totalTxt) totalTxt.innerText = "Total: $0.00";
        return;
    }

    if (footer) footer.style.display = 'flex';
    
    let total = 0;
    tabla.innerHTML = carritoActual.map((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        const prodId = item.idProductor || item.productorId || 'Sin ID';
        
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td data-label="Producto" style="padding: 15px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${item.imagen}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;">
                        <div>
                            <span style="font-weight: bold; display: block;">${item.nombre}</span>
                            <small style="color: #888;">Cod. Prod: ${prodId}</small>
                        </div>
                    </div>
                </td>
                <td data-label="Precio" style="padding: 15px;">$${parseFloat(item.precio).toFixed(2)}</td>
                <td data-label="Cantidad" style="padding: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="window.cambiarCantidad(${index}, -1)" style="width:25px; height:25px; border-radius:50%; border:1px solid #8da281; background:white; color:#8da281; cursor:pointer; font-weight:bold;">-</button>
                        <span style="font-weight:bold; min-width:20px; text-align:center;">${item.cantidad}</span>
                        <button onclick="window.cambiarCantidad(${index}, 1)" style="width:25px; height:25px; border-radius:50%; border:1px solid #8da281; background:white; color:#8da281; cursor:pointer; font-weight:bold;">+</button>
                    </div>
                </td>
                <td data-label="Subtotal" style="padding: 15px; font-weight: bold;">$${subtotal.toFixed(2)}</td>
                <td data-label="Acción" style="padding: 15px;">
                    <button onclick="window.eliminarDelCarrito(${index})" style="color: #e74c3c; background: none; border: none; cursor: pointer; font-size: 1.1rem;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (totalTxt) totalTxt.innerText = `Total: $${total.toFixed(2)}`;
};

// 2. Función para aumentar o disminuir cantidad
window.cambiarCantidad = function(index, cambio) {
    let carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
    
    if (carritoActual[index]) {
        carritoActual[index].cantidad += cambio;

        if (carritoActual[index].cantidad <= 0) {
            window.eliminarDelCarrito(index);
            return;
        }

        localStorage.setItem('carrito', JSON.stringify(carritoActual));
        window.dibujarCarrito();
        if (window.actualizarContadorCarrito) window.actualizarContadorCarrito();
        
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion(cambio > 0 ? "Cantidad actualizada (+)" : "Cantidad actualizada (-)");
        }
    }
};

// 3. Eliminar producto
window.eliminarDelCarrito = function(index) {
    let carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
    const nombreProd = carritoActual[index] ? carritoActual[index].nombre : "Producto";
    
    carritoActual.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carritoActual));
    
    window.dibujarCarrito();
    if (window.actualizarContadorCarrito) window.actualizarContadorCarrito();
    
    if (window.mostrarNotificacion) {
        window.mostrarNotificacion(`${nombreProd} removido de la canasta`);
    }
};

// 4. Manejo del Modal de Pago
window.abrirCheckout = function() {
    const modal = document.getElementById('modalPago');
    const content = document.getElementById('checkout-content');
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));

    if (modal) modal.style.zIndex = "9000";

    if (!sesion) {
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-lock" style="font-size: 3rem; color: #8da281; margin-bottom: 20px;"></i>
                <h2 style="font-family: 'Playfair Display';">Inicio de Sesión Requerido</h2>
                <p>Para pagar, debes iniciar sesión con tu cuenta.</p>
                <a href="login.html" class="btn-terracotta" style="display: inline-block; margin-top: 20px; text-decoration: none; padding: 12px 30px; border-radius: 5px;">
                    Ir al Login
                </a>
            </div>
        `;
    } else {
        content.innerHTML = `
            <h2 style="font-family: 'Playfair Display'; color: #8da281; margin-bottom: 20px;">Finalizar Pedido</h2>
            <div style="background: #f9fbf9; border: 2px solid #8da281; padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                <h3 style="margin-top:0; color: #27ae60;">Pago a Mercado Raíz</h3>
                <p><strong>Banco:</strong> Produbanco</p>
                <p><strong>Cuenta:</strong> Corriente - 123456789</p>
                <p><strong>RUC:</strong> 1712345678001</p>
                <hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">
                <div style="text-align:center;">
                    <p style="font-size: 0.9rem; margin-bottom: 10px;">Escanea el QR para pagar:</p>
                    <img src="assets/images/qr-pago.png" style="width:160px; border-radius:10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: bold; margin-bottom: 10px;">Adjuntar Comprobante (Foto/Captura):</label>
                <input type="file" id="comprobante-file" accept="image/*" style="width: 100%;">
            </div>

            <button id="btn-comprar" onclick="window.ejecutarFinalizarPedido()" class="btn-terracotta" style="width: 100%; padding: 15px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
                Confirmar Pago y Pedido
            </button>
        `;
    }
    modal.style.display = 'flex';
};

window.cerrarCheckout = function() {
    document.getElementById('modalPago').style.display = 'none';
};

window.ejecutarFinalizarPedido = async function() {
    const rawSesion = localStorage.getItem('sesionActiva');
    const sesion = rawSesion ? JSON.parse(rawSesion) : null;
    const uidFinal = sesion ? (sesion.uid || sesion.id) : null;

    const fotoInput = document.getElementById('comprobante-file');
    const btn = document.getElementById('btn-comprar');
    const carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];

    // 1. Cálculos de liquidación (Agrupar por productor)
    const liquidaciones = {};
    carritoActual.forEach(item => {
        const pId = item.idProductor || "general";
        const subtotal = (parseFloat(item.precio) || 0) * (parseInt(item.cantidad) || 0);
        if (!liquidaciones[pId]) liquidaciones[pId] = 0;
        liquidaciones[pId] += subtotal;
    });

    // 2. CONSTRUCCIÓN DEL OBJETO (CORREGIDO)
    const pedidoData = {
        clienteUid: uidFinal,
        clienteNombre: sesion.nombre || "Usuario Mercado Raíz",
        items: carritoActual, // <--- AQUÍ se guardan todos los productos sin pisarse
        total: carritoActual.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
        liquidaciones: liquidaciones, // El mapa que usará el Admin Pagos
        metodoPago: "Transferencia",
        estado: "Pendiente", // Importante: Debe pasar a "Pagado" para liquidar
        fechaPedido: new Date().toISOString()
    };

    try {
        btn.disabled = true;
        btn.innerText = "Procesando...";
        
        // Llamada a database.js
        const resultado = await window.guardarPedidoFinal(pedidoData, fotoInput.files[0]);

        if (resultado.success) {
            localStorage.removeItem('carrito');
            window.cerrarCheckout();
            window.mostrarNotificacion("¡Pedido enviado con éxito!");
            setTimeout(() => { window.location.href = "index.html"; }, 2000);
        }
    } catch (error) {
        console.error(error);
        btn.disabled = false;
    }
};