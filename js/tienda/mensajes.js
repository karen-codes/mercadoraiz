/**
 * js/tienda/mensajes.js - Gestión de Comunicación Mercado Raíz 2026
 * Versión Corregida: Sin conflictos de redodeclaración de DB
 */

// SOLUCIÓN AL ERROR: Usamos una variable global compartida o la instancia de Firebase
// No usamos 'const db' para evitar el error "Identifier 'db' has already been declared"
var dbMensajes = window.db || (typeof firebase !== 'undefined' ? firebase.database() : null);

// 1. RENDERIZADO DE LA TABLA CON FILTROS
window.renderizarTablaMensajes = function(contenedor) {
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="admin-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3><i class="fas fa-envelope"></i> Bandeja de Entrada</h3>
                <div id="filtrosMensajes">
                    <button onclick="filtrarMensajes(event, 'todos')" class="btn-filtro active">Todos</button>
                    <button onclick="filtrarMensajes(event, 'Sugerencia')" class="btn-filtro">Quejas/Sugerencias</button>
                    <button onclick="filtrarMensajes(event, 'Solicitud')" class="btn-filtro">Solicitudes de Ingreso</button>
                </div>
            </div>
            <div class="table-responsive">
                <table class="admin-table" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Estado</th>
                            <th>Tipo</th>
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
    if (!dbMensajes) {
        console.error("Base de datos no inicializada.");
        return;
    }

    dbMensajes.ref('mensajes').orderByChild('timestamp').on('value', (snapshot) => {
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
                    ? '<span style="background:#d4edda; color:#155724; padding:3px 8px; border-radius:10px; font-size:10px;">SOLICITUD</span>' 
                    : '<span style="background:#fff3cd; color:#856404; padding:3px 8px; border-radius:10px; font-size:10px;">QUEJA/SUG.</span>';
                
                html += `
                    <tr style="${leidoEstilo} border-bottom: 1px solid #eee;">
                        <td>${msg.leido ? '✅' : '📩'}</td>
                        <td>${etiquetaTipo}</td>
                        <td>
                            <strong>${msg.nombre || msg.nombreParcela || 'Anónimo'}</strong><br>
                            <small>${msg.email || msg.numero || ''}</small>
                        </td>
                        <td>${msg.asunto || msg.direccion || 'Sin asunto'}</td>
                        <td>${msg.timestamp ? new Date(msg.timestamp).toLocaleDateString() : 'S/F'}</td>
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

// 3. DETALLE DEL MENSAJE
window.verMensajeCompleto = async function(id) {
    try {
        const snapshot = await dbMensajes.ref(`mensajes/${id}`).once('value');
        const msg = snapshot.val();
        if(!msg) return;

        // Llamamos a la función global abrirModal definida en admin-core
        if (typeof window.abrirModal === "function") {
            window.abrirModal();
        } else {
            // Backup si no existe la función
            document.getElementById('modalProducto')?.classList.remove('hidden');
        }

        const tituloModal = document.querySelector('#modalProducto h2');
        if(tituloModal) tituloModal.innerText = msg.tipo === 'Solicitud' ? "Nueva Solicitud de Productor" : "Queja o Sugerencia";
        
        // Ocultar formulario de productos
        const formProd = document.getElementById('formProducto');
        if(formProd) formProd.style.display = 'none';

        // Buscar o crear contenedor de detalles
        let contenedor = document.getElementById('detalle-mensaje-contenido');
        if(!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'detalle-mensaje-contenido';
            document.querySelector('#modalProducto .glass-card').appendChild(contenedor);
        }
        
        let detalleHTML = '';
        if(msg.tipo === 'Solicitud') {
            detalleHTML = `
                <div style="background:#e8f5e9; padding:15px; border-radius:8px; margin-bottom:15px; color: #333;">
                    <p><strong>Finca/Parcela:</strong> ${msg.nombreParcela}</p>
                    <p><strong>Ubicación:</strong> ${msg.direccion}</p>
                    <p><strong>WhatsApp:</strong> ${msg.numero}</p>
                    <p><strong>Motivación:</strong></p>
                    <div style="background:white; padding:10px; border-radius:5px; border:1px solid #c8e6c9;">${msg.porqueQuiereSerParte || msg.descripcion || 'Sin descripción'}</div>
                </div>
            `;
        } else {
            detalleHTML = `
                <div style="background:#fff9c4; padding:15px; border-radius:8px; margin-bottom:15px; color: #333;">
                    <p><strong>Remitente:</strong> ${msg.nombre}</p>
                    <p><strong>Correo:</strong> ${msg.email}</p>
                    <p><strong>Asunto:</strong> ${msg.asunto}</p>
                    <p><strong>Mensaje:</strong></p>
                    <div style="background:white; padding:10px; border-radius:5px; border:1px solid #fff59d;">${msg.mensaje}</div>
                </div>
            `;
        }

        contenedor.innerHTML = `
            ${detalleHTML}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <a href="https://wa.me/${msg.numero?.replace(/\D/g,'')}" target="_blank" 
                   style="text-decoration:none; background:#25D366; color:white; text-align:center; padding:12px; border-radius:8px; font-weight:bold;">
                   <i class="fab fa-whatsapp"></i> Contactar
                </a>
                <button onclick="eliminarMensaje('${id}')" 
                        style="background:#e74c3c; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold;">
                   <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;

        // Marcar como leído en Firebase
        await dbMensajes.ref(`mensajes/${id}`).update({ leido: true });

    } catch (error) {
        console.error("Error al leer mensaje:", error);
    }
};

// 4. FUNCIONES AUXILIARES
window.filtrarMensajes = function(event, tipo) {
    document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    cargarDatosMensajes(tipo);
};

window.eliminarMensaje = async function(id) {
    if (confirm("¿Deseas eliminar permanentemente este registro?")) {
        await dbMensajes.ref(`mensajes/${id}`).remove();
        if(typeof window.cerrarModal === "function") window.cerrarModal();
        
        // Limpiar el contenido específico del mensaje al cerrar
        const contenido = document.getElementById('detalle-mensaje-contenido');
        if(contenido) contenido.innerHTML = '';
        const formProd = document.getElementById('formProducto');
        if(formProd) formProd.style.display = 'block';
    }
};