/**
 * js/mensajes.js - Gestión de Comunicación Mercado Raíz 2026
 * Versión Final: Filtro Doble (Sugerencias vs Solicitudes de Ingreso)
 */

const db = firebase.database();

// 1. RENDERIZADO DE LA TABLA CON FILTROS
window.renderizarTablaMensajes = function(contenedor) {
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="admin-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3><i class="fas fa-envelope"></i> Bandeja de Entrada</h3>
                <div id="filtrosMensajes">
                    <button onclick="filtrarMensajes('todos')" class="btn-filtro active">Todos</button>
                    <button onclick="filtrarMensajes('Sugerencia')" class="btn-filtro">Quejas/Sugerencias</button>
                    <button onclick="filtrarMensajes('Solicitud')" class="btn-filtro">Solicitudes de Ingreso</button>
                </div>
            </div>
            <div class="table-responsive">
                <table class="admin-table" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Estado</th>
                            <th>Tipo de Formulario</th>
                            <th>Remitente / Parcela</th>
                            <th>Asunto / Ubicación</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="lista-mensajes-body">
                        <tr><td colspan="6" style="text-align:center;">Cargando mensajes...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    cargarDatosMensajes('todos');
};

// 2. CARGA DINÁMICA DE DATOS
function cargarDatosMensajes(filtro) {
    db.ref('mensajes').orderByChild('timestamp').on('value', (snapshot) => {
        const tbody = document.getElementById('lista-mensajes-body');
        if (!tbody) return;
        
        const datos = snapshot.val();
        let html = '';

        if (datos) {
            Object.entries(datos).reverse().forEach(([id, msg]) => {
                // Lógica de filtrado
                if (filtro !== 'todos' && msg.tipo !== filtro) return;

                const leidoEstilo = msg.leido ? 'opacity: 0.7;' : 'font-weight: bold; background: #fffdf0;';
                const etiquetaTipo = msg.tipo === 'Solicitud' 
                    ? '<span style="background:#d4edda; color:#155724; padding:3px 8px; border-radius:10px; font-size:10px;">SOLICITUD INGRESO</span>' 
                    : '<span style="background:#fff3cd; color:#856404; padding:3px 8px; border-radius:10px; font-size:10px;">QUEJA/SUG.</span>';
                
                html += `
                    <tr style="${leidoEstilo} border-bottom: 1px solid #eee;">
                        <td>${msg.leido ? '✅' : '📩'}</td>
                        <td>${etiquetaTipo}</td>
                        <td>
                            <strong>${msg.nombre || msg.nombreParcela}</strong><br>
                            <small>${msg.email || msg.numero}</small>
                        </td>
                        <td>${msg.asunto || msg.direccion || 'Sin asunto'}</td>
                        <td>${new Date(msg.timestamp).toLocaleDateString()}</td>
                        <td>
                            <button onclick="verMensajeCompleto('${id}')" class="btn-editar">Ver Detalle</button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center;">No hay mensajes en esta categoría.</td></tr>';
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Bandeja vacía.</td></tr>';
        }
    });
}

// 3. DETALLE DEL MENSAJE (ADAPTADO A LOS 2 FORMULARIOS)
window.verMensajeCompleto = async function(id) {
    try {
        const snapshot = await db.ref(`mensajes/${id}`).once('value');
        const msg = snapshot.val();
        if(!msg) return;

        abrirModal(); 
        document.getElementById('modalTitulo').innerText = msg.tipo === 'Solicitud' ? "Nueva Solicitud de Productor" : "Queja o Sugerencia Recibida";
        
        // Configuración de interfaz del modal
        if(document.getElementById('seccionMapa')) document.getElementById('seccionMapa').classList.add('hidden');
        if(document.getElementById('btnGuardar')) document.getElementById('btnGuardar').style.display = 'none';

        const contenedor = document.getElementById('camposDinamicos');
        
        // Contenido diferenciado por tipo de formulario
        let detalleHTML = '';
        if(msg.tipo === 'Solicitud') {
            detalleHTML = `
                <div style="background:#e8f5e9; padding:15px; border-radius:8px; margin-bottom:15px;">
                    <h4 style="margin-top:0; color:#2e7d32;">Datos del Aspirante</h4>
                    <p><strong>Nombre de Parcela:</strong> ${msg.nombreParcela}</p>
                    <p><strong>Dirección:</strong> ${msg.direccion}</p>
                    <p><strong>Teléfono/WhatsApp:</strong> ${msg.numero}</p>
                    <p><strong>¿Por qué quiere ser parte?:</strong></p>
                    <div style="background:white; padding:10px; border-radius:5px; border:1px solid #c8e6c9;">${msg.porqueQuiereSerParte || msg.descripcion}</div>
                </div>
            `;
        } else {
            detalleHTML = `
                <div style="background:#fff9c4; padding:15px; border-radius:8px; margin-bottom:15px;">
                    <h4 style="margin-top:0; color:#f57f17;">Detalle de Queja/Sugerencia</h4>
                    <p><strong>Remitente:</strong> ${msg.nombre}</p>
                    <p><strong>Correo:</strong> ${msg.email}</p>
                    <p><strong>Número:</strong> ${msg.numero}</p>
                    <p><strong>Asunto:</strong> ${msg.asunto}</p>
                    <p><strong>Mensaje:</strong></p>
                    <div style="background:white; padding:10px; border-radius:5px; border:1px solid #fff59d;">${msg.mensaje}</div>
                </div>
            `;
        }

        contenedor.innerHTML = `
            ${detalleHTML}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <a href="https://wa.me/${msg.numero}" target="_blank" 
                   style="text-decoration:none; background:#25D366; color:white; text-align:center; padding:10px; border-radius:5px;">
                   Contactar por WhatsApp
                </a>
                <button onclick="eliminarMensaje('${id}')" 
                        style="background:#e74c3c; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer;">
                   Archivar / Eliminar
                </button>
            </div>
        `;

        await db.ref(`mensajes/${id}`).update({ leido: true });

    } catch (error) {
        console.error("Error al leer mensaje:", error);
    }
};

// 4. FUNCIONES AUXILIARES
window.filtrarMensajes = function(tipo) {
    document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    cargarDatosMensajes(tipo);
};

window.eliminarMensaje = async function(id) {
    if (confirm("¿Deseas eliminar permanentemente este registro de la base de datos?")) {
        await db.ref(`mensajes/${id}`).remove();
        cerrarModal();
    }
};