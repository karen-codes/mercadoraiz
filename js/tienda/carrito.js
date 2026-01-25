/**
 * js/carrito.js - Gestión de Compras y Pagos
 * Mercado Raíz 2026
 */

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// 1. RENDERIZAR EL CARRITO
function dibujarCarrito() {
    const tabla = document.getElementById('lista-carrito');
    const totalEl = document.getElementById('total-carrito');
    if (!tabla) return;

    if (carrito.length === 0) {
        tabla.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px;">Tu canasta está vacía.</td></tr>';
        totalEl.innerText = "0.00";
        return;
    }

    let total = 0;
    tabla.innerHTML = carrito.map((item, index) => {
        total += item.precio * item.cantidad;
        return `
            <tr>
                <td>${item.nombre}</td>
                <td>$${item.precio.toFixed(2)}</td>
                <td>
                    <input type="number" value="${item.cantidad}" min="1" 
                           onchange="actualizarCantidad(${index}, this.value)" style="width:50px;">
                </td>
                <td>$${(item.precio * item.cantidad).toFixed(2)}</td>
                <td><button onclick="eliminarDelCarrito(${index})" style="color:red; border:none; background:none; cursor:pointer;"><i class="fas fa-times"></i></button></td>
            </tr>
        `;
    }).join('');

    totalEl.innerText = total.toFixed(2);
    
    // Al cargar el carrito, buscamos los datos de pago del proveedor
    cargarDatosPagoProveedor();
}

// 2. OBTENER DATOS DE PAGO DEL PROVEEDOR (Vínculo Crítico)
async function cargarDatosPagoProveedor() {
    if (carrito.length === 0) return;

    // Tomamos el idProductor del primer item (asumiendo compra a un solo productor por vez)
    const idProductor = carrito[0].idProductor;
    const infoPagoDiv = document.getElementById('info-pago-proveedor');

    try {
        const snap = await db.ref(`proveedores/${idProductor}`).once('value');
        const pro = snap.val();

        if (pro && infoPagoDiv) {
            infoPagoDiv.innerHTML = `
                <div style="background:#f9f9f9; padding:15px; border-radius:10px; margin-top:20px; border:1px solid #ddd;">
                    <h4 style="margin-top:0; color:#27ae60;"><i class="fas fa-university"></i> Datos de Pago para: ${pro.nombreParcela}</h4>
                    <p><strong>Banco:</strong> ${pro.pagos.transferencia.banco}</p>
                    <p><strong>Tipo:</strong> ${pro.pagos.transferencia.tipoCuenta}</p>
                    <p><strong>Cta:</strong> ${pro.pagos.transferencia.numeroCuenta}</p>
                    <p><strong>ID:</strong> ${pro.pagos.transferencia.identificacion}</p>
                    <hr>
                    <p style="font-size:0.9rem; color:#666;">Una vez hecha la transferencia, sube la foto del comprobante abajo.</p>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error al cargar datos de pago:", e);
    }
}

// 3. FINALIZAR COMPRA Y SUBIR COMPROBANTE
async function finalizarPedido() {
    const btn = document.getElementById('btn-comprar');
    const fotoInput = document.getElementById('comprobante-file');
    const clienteNombre = document.getElementById('cliente-nombre').value;
    const clienteWhatsApp = document.getElementById('cliente-tel').value;

    if (!fotoInput.files[0]) {
        alert("Por favor, sube la foto de tu comprobante de pago.");
        return;
    }

    if (!clienteNombre || !clienteWhatsApp) {
        alert("Completa tus datos de contacto.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Procesando pedido...";

    const pedidoData = {
        cliente: clienteNombre,
        telefono: clienteWhatsApp,
        total: carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
        items: carrito,
        idProductor: carrito[0].idProductor, // Vinculamos el pedido al productor
        estado: "Pendiente"
    };

    // Llamamos a la función de data.js que ya revisamos
    const resultado = await guardarPedidoFinal(pedidoData, fotoInput.files[0]);

    if (resultado.success) {
        alert("¡Pedido enviado con éxito! El productor validará tu pago pronto.");
        localStorage.removeItem('carrito');
        window.location.href = "confirmacion.html";
    } else {
        alert("Error al enviar pedido: " + resultado.error);
        btn.disabled = false;
        btn.innerText = "Reintentar";
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', dibujarCarrito);