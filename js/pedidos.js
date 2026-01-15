// Lógica para el Cliente (Subir Comprobante)
async function subirComprobante(pedidoId, archivo) {
    if (!archivo) return alert("Por favor, selecciona una foto del comprobante.");

    // En un entorno real, aquí se subiría al servidor. 
    // Para esta versión, creamos una URL temporal (Blob) para previsualizar.
    const urlComprobante = URL.createObjectURL(archivo);

    // Guardar referencia en el pedido correspondiente
    let pedidos = JSON.parse(localStorage.getItem('pedidos_db')) || [];
    const index = pedidos.findIndex(p => p.id === pedidoId);
    
    if (index !== -1) {
        pedidos[index].comprobante = urlComprobante;
        pedidos[index].estado = "Por Confirmar"; // El estado cambia automáticamente
        localStorage.setItem('pedidos_db', JSON.stringify(pedidos));
        alert("Comprobante enviado con éxito. Espera la confirmación del administrador.");
    }
}

// Lógica para el Administrador (Validar Pago)
function confirmarPago(pedidoId) {
    let pedidos = JSON.parse(localStorage.getItem('pedidos_db')) || [];
    const index = pedidos.findIndex(p => p.id === pedidoId);

    if (index !== -1) {
        pedidos[index].estado = "Pagado/Confirmado";
        pedidos[index].fechaConfirmacion = new Date().toLocaleString();
        localStorage.setItem('pedidos_db', JSON.stringify(pedidos));
        
        // Simulación de actualización de métricas en el Dashboard
        actualizarMetricasDashboard('ventas_completadas');
        
        alert(`Pedido #${pedidoId} confirmado. Se ha notificado al cliente.`);
        cargarSeccion('pedidos'); // Refrescar la tabla
    }
}

// Función para ver la imagen del comprobante en grande
function verImagenComprobante(url) {
    if (!url) return alert("No hay comprobante disponible para este pedido.");
    
    // Abrir la imagen en una pestaña nueva o modal
    window.open(url, '_blank');
}
