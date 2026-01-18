// js/mensajes.js

function verMensajeCompleto(id) {
    // 1. Buscar el mensaje en la base de datos (localStorage)
    const mensajes = JSON.parse(localStorage.getItem("mensajes_db")) || [];
    const msg = mensajes.find(m => m.id === id);
    
    if(!msg) {
        console.error("Mensaje no encontrado");
        return;
    }

    // 2. Abrir el modal y configurar el título
    abrirModal(); 
    document.getElementById('modalTitulo').innerText = "Detalle del Mensaje";
    
    // 3. Ocultar elementos que no necesitamos (como el mapa)
    const mapArea = document.getElementById('mapArea');
    if(mapArea) mapArea.classList.add('hidden');
    
    // Ocultar el botón de "Guardar Cambios" ya que es solo lectura
    const btnGuardar = document.querySelector('#formRegistro button[type="submit"]');
    if(btnGuardar) btnGuardar.style.display = 'none';

    // 4. Inyectar el contenido del mensaje en el contenedor dinámico
    const contenedor = document.getElementById('camposDinamicos');
    contenedor.innerHTML = `
        <div class="msg-view-container" style="padding: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.9rem; color: #666;">
                <span><i class="fas fa-user"></i> <strong>De:</strong> ${msg.remitente}</span>
                <span><i class="fas fa-calendar-alt"></i> ${msg.fecha}</span>
            </div>
            <div style="background: #fdfaf6; padding: 20px; border-radius: 12px; border-left: 4px solid var(--admin-accent);">
                <h4 style="margin-bottom: 10px; color: var(--admin-primary);">${msg.asunto}</h4>
                <p style="line-height: 1.6; color: #444; white-space: pre-wrap;">${msg.mensaje}</p>
            </div>
            <div style="margin-top: 25px;">
                <label style="font-weight: 600; display: block; margin-bottom: 10px;">Acción rápida:</label>
                <a href="mailto:?subject=Re: ${msg.asunto}" class="btn-nuevo" style="text-decoration: none; display: inline-block; width: 100%; text-align: center;">
                    <i class="fas fa-reply"></i> Responder por Correo
                </a>
            </div>
        </div>
    `;

    // 5. Marcar como leído y actualizar contador
    marcarComoLeido(id);
}

function marcarComoLeido(id) {
    let mensajes = JSON.parse(localStorage.getItem("mensajes_db")) || [];
    const index = mensajes.findIndex(m => m.id === id);
    
    if(index !== -1 && mensajes[index].estado === 'nuevo') {
        mensajes[index].estado = 'leido';
        localStorage.setItem("mensajes_db", JSON.stringify(mensajes));
        
        // Refrescar la tabla y el contador de la sidebar
        if(typeof cargarSeccion === 'function') cargarSeccion('mensajes');
        if(typeof actualizarContadorMensajes === 'function') actualizarContadorMensajes();
    }
}