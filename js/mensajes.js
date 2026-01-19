/**
 * js/mensajes.js - Gestión de Comunicación Mercado Raíz
 * Maneja solicitudes, quejas y sugerencias desde Firebase
 */

async function verMensajeCompleto(id) {
    try {
        // 1. Buscar el mensaje en Firebase
        const snapshot = await db.ref(`mensajes/${id}`).once('value');
        const msg = snapshot.val();
        
        if(!msg) {
            console.error("El mensaje ya no existe en la base de datos.");
            return;
        }

        // 2. Preparar el Modal (Usando la estructura de admin.js)
        abrirModal(); 
        document.getElementById('modalTitulo').innerText = "Detalle de Comunicación";
        
        // 3. Ajustes de UI para modo Lectura
        const mapArea = document.getElementById('mapArea');
        if(mapArea) mapArea.classList.add('hidden');
        
        const btnGuardar = document.querySelector('#formRegistro button[type="submit"]');
        if(btnGuardar) btnGuardar.style.display = 'none';

        // 4. Inyectar contenido con el diseño de Mercado Raíz
        const contenedor = document.getElementById('camposDinamicos');
        contenedor.innerHTML = `
            <div class="msg-view-container" style="padding: 10px; font-family: 'Outfit', sans-serif;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.9rem; color: #666; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <span><i class="fas fa-user-tag"></i> <strong>Tipo:</strong> ${msg.tipo || 'Sugerencia'}</span>
                    <span><i class="fas fa-clock"></i> ${msg.fecha}</span>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p style="margin:0;"><strong>Remitente:</strong> ${msg.nombre}</p>
                    <p style="margin:0;"><strong>Email:</strong> ${msg.email}</p>
                </div>

                <div style="background: #fdfaf6; padding: 20px; border-radius: 12px; border-left: 4px solid var(--admin-primary); box-shadow: inset 0 0 10px rgba(0,0,0,0.02);">
                    <h4 style="margin-bottom: 10px; color: var(--admin-primary); font-family: 'Playfair Display';">${msg.asunto}</h4>
                    <p style="line-height: 1.6; color: #444; white-space: pre-wrap;">${msg.cuerpo || msg.mensaje}</p>
                </div>

                <div style="margin-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <a href="mailto:${msg.email}?subject=Re: Mercado Raíz - ${msg.asunto}" class="btn-edit" style="text-decoration: none; text-align: center; padding: 10px; background: var(--admin-primary); color: white; border-radius: 8px;">
                        <i class="fas fa-reply"></i> Responder Email
                    </a>
                    <button onclick="eliminarMensaje('${id}')" style="padding: 10px; background: #fee2e2; color: #b91c1c; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;

        // 5. Actualizar estado a 'leido' en Firebase
        if(msg.estado === 'nuevo' || !msg.leido) {
            await db.ref(`mensajes/${id}`).update({ 
                leido: true,
                estado: 'leido' 
            });
        }
    } catch (error) {
        console.error("Error al visualizar mensaje:", error);
    }
}

/**
 * Elimina un mensaje de la base de datos
 */
async function eliminarMensaje(id) {
    if (confirm("¿Seguro que deseas eliminar esta comunicación?")) {
        try {
            await db.ref(`mensajes/${id}`).remove();
            cerrarModal();
            // cargarSeccion('mensajes') se disparará automáticamente por el .on('value') en admin.js
        } catch (error) {
            alert("Error al eliminar: " + error.message);
        }
    }
}

/**
 * Función para que los clientes envíen mensajes desde la web pública
 */
async function enviarMensajeDesdeWeb(nombre, email, asunto, tipo, mensaje) {
    try {
        const nuevoMsg = {
            nombre,
            email,
            asunto,
            tipo, // 'Queja', 'Sugerencia', 'Solicitud'
            mensaje,
            fecha: new Date().toLocaleString(),
            leido: false,
            estado: 'nuevo',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        await db.ref('mensajes').push(nuevoMsg);
        return true;
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        return false;
    }
}