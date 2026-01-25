/**
 * js/tienda/carrito.js - Gestión de Interfaz y Pagos
 */

// 1. Dibujar el carrito en la tabla
window.dibujarCarrito = function() {
    const tabla = document.getElementById('lista-carrito');
    const totalTxt = document.getElementById('total-precio');
    const footer = document.getElementById('cart-footer-actions');
    
    // Obtenemos el carrito global (definido en main.js) o de localStorage
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
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 15px; display: flex; align-items: center; gap: 15px;">
                    <img src="${item.imagen}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;">
                    <span style="font-weight: bold;">${item.nombre}</span>
                </td>
                <td style="padding: 15px;">$${parseFloat(item.precio).toFixed(2)}</td>
                <td style="padding: 15px;">${item.cantidad}</td>
                <td style="padding: 15px; font-weight: bold;">$${subtotal.toFixed(2)}</td>
                <td style="padding: 15px;">
                    <button onclick="window.eliminarDelCarrito(${index})" style="color: #e74c3c; background: none; border: none; cursor: pointer; font-size: 1.1rem;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (totalTxt) totalTxt.innerText = `Total: $${total.toFixed(2)}`;
};

// 2. Eliminar producto
window.eliminarDelCarrito = function(index) {
    let carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
    carritoActual.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carritoActual));
    
    window.dibujarCarrito();
    // Actualizar el contador del header si existe la función en main.js
    if (window.actualizarContadorCarrito) window.actualizarContadorCarrito();
};

// 3. Manejo del Modal de Pago
window.abrirCheckout = function() {
    const modal = document.getElementById('modalPago');
    const content = document.getElementById('checkout-content');
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));

    if (!sesion) {
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-lock" style="font-size: 3rem; color: #8da281; margin-bottom: 20px;"></i>
                <h2 style="font-family: 'Playfair Display';">Inicio de Sesión Requerido</h2>
                <p>Para procesar tu pago de forma segura, debes ingresar a tu cuenta.</p>
                <a href="login.html" class="btn-terracotta" style="display: inline-block; margin-top: 20px; text-decoration: none; padding: 12px 30px; border-radius: 5px;">
                    Iniciar Sesión Ahora
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
                <p style="font-size: 0.9rem;">Transfiere y adjunta la foto del comprobante abajo.</p>
                <div style="text-align:center;">
                    <img src="assets/images/qr-pago.png" style="width:160px; border-radius:10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: bold; margin-bottom: 10px;">Subir Comprobante:</label>
                <input type="file" id="comprobante-file" accept="image/*" style="width: 100%;">
            </div>

            <button id="btn-comprar" onclick="window.ejecutarFinalizarPedido()" class="btn-terracotta" style="width: 100%; padding: 15px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
                Confirmar y Enviar Pedido
            </button>
        `;
    }
    modal.style.display = 'flex';
};

window.cerrarCheckout = function() {
    document.getElementById('modalPago').style.display = 'none';
};

// 4. Lógica de envío final a Firebase
window.ejecutarFinalizarPedido = async function() {
    // 1. Recuperar sesión con múltiples validaciones
    const rawSesion = localStorage.getItem('sesionActiva') || localStorage.getItem('user');
    const sesion = rawSesion ? JSON.parse(rawSesion) : null;
    
    // 2. Validar que el usuario exista realmente
    if (!sesion || (!sesion.uid && !sesion.id)) {
        alert("Error de sesión: No se encontró tu identificador de usuario. Por favor, cierra sesión e ingresa nuevamente.");
        return;
    }

    const fotoInput = document.getElementById('comprobante-file');
    const btn = document.getElementById('btn-comprar');
    const carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];

    if (!fotoInput.files[0]) {
        alert("Por favor, adjunta la foto del comprobante de transferencia.");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = "Procesando...";

        // 3. Mapeo seguro de datos (evita el 'undefined' en Firebase)
        const pedidoData = {
            clienteUid: sesion.uid || sesion.id, // Usa cualquiera de los dos que esté disponible
            clienteNombre: sesion.nombre || "Usuario Mercado Raíz",
            clienteEmail: sesion.email || "S/N",
            items: carritoActual,
            total: carritoActual.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
            metodoPago: "Transferencia Mercado Raíz",
            fechaPedido: new Date().toISOString()
        };

        console.log("Datos del pedido listos para enviar:", pedidoData);

        const resultado = await window.guardarPedidoFinal(pedidoData, fotoInput.files[0]);

        if (resultado.success) {
            localStorage.removeItem('carrito');
            alert("¡Pedido enviado con éxito! Validaremos tu pago pronto.");
            window.location.href = "index.html";
        } else {
            throw new Error(resultado.error);
        }

    } catch (error) {
        console.error("Error crítico al finalizar pedido:", error);
        alert("Error al finalizar: " + error.message);
        btn.disabled = false;
        btn.innerText = "Reintentar Compra";
    }
};