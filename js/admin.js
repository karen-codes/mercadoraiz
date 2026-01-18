/***********************************
 * GESTIÓN ADMINISTRATIVA MAESTRA
 ***********************************/
let seccionActual = 'dashboard';
let map = null;
let marker = null;
let editandoId = null;

// 1. CARGA DINÁMICA DE SECCIONES
function cargarSeccion(seccion) {
    seccionActual = seccion;
    const contenedor = document.getElementById('tabla-contenedor');
    const titulo = document.getElementById('seccion-titulo');
    const btnAccion = document.getElementById('btn-accion-principal');

    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const linkActivo = document.getElementById(`link-${seccion}`);
    if (linkActivo) linkActivo.classList.add('active');

    const titulosMap = {
        'dashboard': 'Dashboard de Alcance',
        'productos': 'Inventario de Productos',
        'proveedores': 'Red de Proveedores',
        'usuarios': 'Base de Clientes',
        'pedidos': 'Gestión de Pedidos y Pagos',
        'mensajes': 'Bandeja de Mensajería'
    };

    titulo.innerText = titulosMap[seccion] || seccion.charAt(0).toUpperCase() + seccion.slice(1);
    
    if(btnAccion) {
        const esEditable = (seccion === 'productos' || seccion === 'proveedores');
        btnAccion.style.display = esEditable ? 'inline-flex' : 'none';
        if(esEditable) {
            btnAccion.innerHTML = `<i class="fas fa-plus-circle"></i> Nuevo ${seccion === 'productos' ? 'Producto' : 'Proveedor'}`;
            btnAccion.onclick = () => abrirModal(); 
        }
    }

    contenedor.innerHTML = ''; 
    actualizarContadorMensajes();

    switch(seccion) {
        case 'dashboard': 
            if (typeof renderizarDashboard === 'function') renderizarDashboard(contenedor); 
            break;
        case 'productos': renderizarTablaProductos(contenedor); break;
        case 'proveedores': renderizarTablaProveedores(contenedor); break;
        case 'usuarios': renderizarTablaUsuarios(contenedor); break;
        case 'pedidos': renderizarPedidos(contenedor); break;
        case 'mensajes': renderizarTablaMensajes(contenedor); break;
        default: mostrarAvisoDesarrollo(contenedor, seccion);
    }
}

// 2. MODAL DINÁMICO
function abrirModal(datos = null) {
    const modal = document.getElementById('modalRegistro');
    const campos = document.getElementById('camposDinamicos');
    const areaMapa = document.getElementById('mapArea');
    const btnGuardar = document.querySelector('#formRegistro button[type="submit"]');
    
    editandoId = datos ? datos.id : null;
    modal.style.display = 'flex';
    if(btnGuardar) btnGuardar.style.display = 'block';

    if (seccionActual === 'productos') {
        document.getElementById('modalTitulo').innerText = datos ? 'Editar Producto' : 'Nuevo Producto';
        areaMapa.classList.add('hidden');
        
        const provs = JSON.parse(localStorage.getItem("proveedores")) || [];
        campos.innerHTML = `
            <div class="form-group"><label>Nombre del Producto</label><input type="text" id="reg_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group">
                <label>Categoría</label>
                <select id="reg_categoria" class="admin-input" required>
                    <option value="">Selecciona una categoría</option>
                    <option value="Papas y Tubérculos" ${datos?.categoria === 'Papas y Tubérculos' ? 'selected' : ''}>Papas y Tubérculos</option>
                    <option value="Hortalizas" ${datos?.categoria === 'Hortalizas' ? 'selected' : ''}>Hortalizas</option>
                    <option value="Frutas" ${datos?.categoria === 'Frutas' ? 'selected' : ''}>Frutas</option>
                    <option value="Lácteos" ${datos?.categoria === 'Lácteos' ? 'selected' : ''}>Lácteos</option>
                </select>
            </div>
            <div class="form-group"><label>Descripción</label><textarea id="reg_desc" class="admin-input" rows="2">${datos?.descripcion || ''}</textarea></div>
            <div class="form-grid">
                <div class="form-group"><label>Precio ($)</label><input type="number" step="0.01" id="reg_precio" class="admin-input" value="${datos?.precio || ''}" required></div>
                <div class="form-group"><label>Stock (Cant.)</label><input type="number" id="reg_stock" class="admin-input" value="${datos?.stock || ''}" required></div>
                <div class="form-group"><label>Unidad</label>
                    <select id="reg_unidad" class="admin-input">
                        <option value="Libras" ${datos?.unidad === 'Libras' ? 'selected' : ''}>Libras</option>
                        <option value="Kilos" ${datos?.unidad === 'Kilos' ? 'selected' : ''}>Kilos</option>
                        <option value="Litros" ${datos?.unidad === 'Litros' ? 'selected' : ''}>Litros</option>
                        <option value="Unidades" ${datos?.unidad === 'Unidades' ? 'selected' : ''}>Unidades</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Proveedor</label>
                <select id="reg_prov_id" class="admin-input">
                    ${provs.map(pr => `<option value="${pr.id}" ${datos?.proveedorId == pr.id ? 'selected' : ''}>${pr.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Imagen del Producto</label>
                <input type="file" id="reg_foto" accept="image/*" class="admin-input" onchange="previsualizarArchivo(event, 'imgPreview')">
                <img id="imgPreview" src="${datos?.imagen || '#'}" style="${datos?.imagen ? 'display:block' : 'display:none'}; max-width: 150px; margin-top:10px; border-radius:12px;">
            </div>`;
    } 
    else if (seccionActual === 'proveedores') {
        document.getElementById('modalTitulo').innerText = datos ? 'Editar Productor' : 'Registrar Productor';
        areaMapa.classList.remove('hidden');
        const hParts = datos?.horario ? datos.horario.split(' - ') : ["08:00", "17:00"];

        campos.innerHTML = `
            <div class="form-group">
                <label>Nombre de la Parcela</label>
                <input type="text" id="prov_nombre" class="admin-input" value="${datos?.nombre || ''}" required>
            </div>
            <div class="form-group">
                <label>Descripción Corta (Aparece bajo el nombre)</label>
                <input type="text" id="prov_descripcion" class="admin-input" value="${datos?.descripcion || ''}" placeholder="Ej: Productores de hortalizas orgánicas" required>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>Comunidad</label><input type="text" id="prov_comunidad" class="admin-input" value="${datos?.comunidad || ''}" required></div>
                <div class="form-group"><label>WhatsApp</label><input type="number" id="prov_ws" class="admin-input" value="${datos?.whatsapp || ''}" required></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>H. Apertura</label><input type="time" id="prov_h_inicio" value="${hParts[0]}" class="admin-input"></div>
                <div class="form-group"><label>H. Cierre</label><input type="time" id="prov_h_fin" value="${hParts[1]}" class="admin-input"></div>
            </div>
            
            <div class="form-group">
                <label>Historia de la Parcela (Detallada)</label>
                <textarea id="prov_historia" class="admin-input" rows="3" placeholder="Cuéntanos sobre la tradición de tu tierra...">${datos?.historia || ''}</textarea>
            </div>

            <div class="form-group">
                <label>Formas de Pago Aceptadas</label>
                <div style="display:flex; gap:20px; background:#f9f9f9; padding:10px; border-radius:8px;">
                    <label style="cursor:pointer;"><input type="checkbox" id="pay_transfer" ${datos?.pagos?.transferencia ? 'checked' : ''}> Transferencia</label>
                    <label style="cursor:pointer;"><input type="checkbox" id="pay_qr" ${datos?.pagos?.qr ? 'checked' : ''}> QR (Deuna/Otros)</label>
                </div>
            </div>

            <div id="qr_upload_section" class="form-group ${datos?.pagos?.qr ? '' : 'hidden'}">
                <label>Subir Imagen QR de Pago</label>
                <input type="file" id="prov_qr_img" accept="image/*" class="admin-input" onchange="previsualizarArchivo(event, 'qrPreview')">
                <img id="qrPreview" src="${datos?.qrImagen || '#'}" style="${datos?.qrImagen ? 'display:block' : 'display:none'}; max-width: 100px; margin-top:5px; border: 1px solid #ddd;">
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>Foto de Portada</label>
                    <input type="file" id="prov_portada" accept="image/*" class="admin-input" onchange="previsualizarArchivo(event, 'portadaPreview')">
                    <img id="portadaPreview" src="${datos?.imagen || '#'}" style="${datos?.imagen ? 'display:block' : 'display:none'}; max-width: 120px; margin-top:5px; border-radius:8px;">
                </div>
                <div class="form-group">
                    <label>Video de Labores (Local)</label>
                    <input type="file" id="prov_video_file" accept="video/*" class="admin-input">
                    <small id="videoStatus" style="display:block; margin-top:5px; color: #666;">
                        ${datos?.video ? '<i class="fas fa-check-circle" style="color:green"></i> Video guardado' : 'Sin video cargado'}
                    </small>
                </div>
            </div>

            <input type="hidden" id="reg_coords" value="${datos?.coords || '-0.0469, -78.1453'}">`;

        // Lógica de visibilidad del QR
        document.getElementById('pay_qr').addEventListener('change', (e) => {
            document.getElementById('qr_upload_section').classList.toggle('hidden', !e.target.checked);
        });

        setTimeout(() => inicializarMapaAdmin(datos?.coords), 300);
    }
}

// 3. UTILIDADES: ARCHIVOS Y MAPA
function previsualizarArchivo(event, targetId) {
    const reader = new FileReader();
    reader.onload = function() {
        const output = document.getElementById(targetId);
        output.src = reader.result;
        output.style.display = 'block';
    };
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function inicializarMapaAdmin(coordsStr) {
    let lat = -0.0469, lng = -78.1453;
    if (coordsStr) {
        const parts = coordsStr.split(',');
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
    }
    if (map) map.remove(); 
    map = L.map('mapAdmin').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on('dragend', function() {
        const pos = marker.getLatLng();
        document.getElementById('reg_coords').value = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
    });
}

// 4. GUARDADO DE DATOS
document.getElementById('formRegistro').onsubmit = async function(e) {
    e.preventDefault();
    
    if(document.getElementById('modalTitulo').innerText === "Detalle del Mensaje") {
        cerrarModal();
        return;
    }

    let db = JSON.parse(localStorage.getItem(seccionActual)) || [];
    
    if (seccionActual === 'productos') {
        const previewImg = document.getElementById('imgPreview');
        const item = {
            id: editandoId || Date.now(),
            nombre: document.getElementById('reg_nombre').value,
            categoria: document.getElementById('reg_categoria').value,
            descripcion: document.getElementById('reg_desc').value,
            precio: parseFloat(document.getElementById('reg_precio').value),
            stock: parseInt(document.getElementById('reg_stock').value),
            unidad: document.getElementById('reg_unidad').value,
            proveedorId: parseInt(document.getElementById('reg_prov_id').value),
            imagen: (previewImg && previewImg.src.startsWith('data:')) ? previewImg.src : (editandoId ? db.find(x => x.id === editandoId).imagen : "assets/images/default-prod.jpg")
        };
        db = editandoId ? db.map(p => p.id === editandoId ? item : p) : [...db, item];
        localStorage.setItem(seccionActual, JSON.stringify(db));
    } 
    else if (seccionActual === 'proveedores') {
        const portadaPrev = document.getElementById('portadaPreview');
        const qrPrev = document.getElementById('qrPreview');
        const videoInput = document.getElementById('prov_video_file');
        
        let videoBase64 = editandoId ? (db.find(x => x.id === editandoId)?.video || "") : "";
        if (videoInput.files[0]) {
            videoBase64 = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(videoInput.files[0]);
            });
        }

        const item = {
            id: editandoId || Date.now(),
            nombre: document.getElementById('prov_nombre').value,
            descripcion: document.getElementById('prov_descripcion').value, // Guardamos el nuevo item
            comunidad: document.getElementById('prov_comunidad').value,
            whatsapp: document.getElementById('prov_ws').value,
            horario: `${document.getElementById('prov_h_inicio').value} - ${document.getElementById('prov_h_fin').value}`,
            historia: document.getElementById('prov_historia').value,
            video: videoBase64,
            coords: document.getElementById('reg_coords').value,
            imagen: (portadaPrev && portadaPrev.src.startsWith('data:')) ? portadaPrev.src : (editandoId ? db.find(x => x.id === editandoId).imagen : "assets/images/default-hacienda.jpg"),
            qrImagen: (qrPrev && qrPrev.src.startsWith('data:')) ? qrPrev.src : (editandoId ? db.find(x => x.id === editandoId).qrImagen : ""),
            pagos: {
                transferencia: document.getElementById('pay_transfer').checked,
                qr: document.getElementById('pay_qr').checked
            }
        };
        db = editandoId ? db.map(p => p.id === editandoId ? item : p) : [...db, item];
        localStorage.setItem(seccionActual, JSON.stringify(db));
    }

    mostrarNotificacion(editandoId ? "Actualizado correctamente" : "Guardado correctamente");
    cerrarModal();
    cargarSeccion(seccionActual);
};

// 5. SECCIÓN DE MENSAJERÍA
function renderizarTablaMensajes(cnt) {
    const mensajes = JSON.parse(localStorage.getItem("mensajes_db")) || [
        { id: 1, fecha: "2024-05-20", remitente: "Carlos Ruiz", asunto: "Consulta de Stock", mensaje: "¿Tienen disponibilidad de queso de hoja para este viernes?", estado: "nuevo" },
        { id: 2, fecha: "2024-05-19", remitente: "Ana López", asunto: "Envío a domicilio", mensaje: "Buenas tardes, ¿llegan hasta el centro de Cayambe?", estado: "leido" }
    ];

    cnt.innerHTML = `
        <div class="admin-card-container">
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Remitente</th>
                            <th>Asunto / Mensaje</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mensajes.map(m => `
                            <tr class="${m.estado === 'nuevo' ? 'row-unread' : ''}">
                                <td>
                                    <i class="fas ${m.estado === 'nuevo' ? 'fa-envelope' : 'fa-envelope-open'} status-icon-${m.estado}"></i>
                                </td>
                                <td><small>${m.fecha}</small></td>
                                <td><strong>${m.remitente}</strong></td>
                                <td>
                                    <div class="msg-preview">
                                        <span class="msg-subject">${m.asunto}</span>
                                        <p class="msg-text">${m.mensaje}</p>
                                    </div>
                                </td>
                                <td class="actions-cell">
                                    <button onclick="verMensajeCompleto(${m.id})" class="btn-edit" title="Leer"><i class="fas fa-eye"></i></button>
                                    <button onclick="eliminarRegistro('mensajes_db', ${m.id})" class="btn-delete" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

function verMensajeCompleto(id) {
    const mensajes = JSON.parse(localStorage.getItem("mensajes_db")) || [];
    const msgIndex = mensajes.findIndex(m => m.id === id);
    
    if(msgIndex === -1) return;
    const msg = mensajes[msgIndex];

    abrirModal();
    document.getElementById('modalTitulo').innerText = "Detalle del Mensaje";
    document.getElementById('mapArea').classList.add('hidden');
    document.querySelector('#formRegistro button[type="submit"]').style.display = 'none';

    document.getElementById('camposDinamicos').innerHTML = `
        <div class="msg-detail-box">
            <div class="msg-header" style="display:flex; justify-content:space-between; color:#666; font-size:0.9rem;">
                <span><i class="fas fa-user"></i> <strong>De:</strong> ${msg.remitente}</span>
                <span><i class="fas fa-calendar-alt"></i> ${msg.fecha}</span>
            </div>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;">
            <div class="msg-body">
                <h4 style="color: var(--admin-primary); margin-bottom: 10px;">${msg.asunto}</h4>
                <p style="line-height: 1.6; color: #444; background: #fdfaf6; padding: 15px; border-radius: 10px;">${msg.mensaje}</p>
            </div>
            <div style="margin-top: 25px;">
                <a href="mailto:?subject=Re: ${msg.asunto}" class="btn-nuevo" style="text-decoration:none; display:block; text-align:center;">
                    <i class="fas fa-reply"></i> Responder por Email
                </a>
            </div>
        </div>
    `;

    if (msg.estado === 'nuevo') {
        mensajes[msgIndex].estado = 'leido';
        localStorage.setItem("mensajes_db", JSON.stringify(mensajes));
        actualizarContadorMensajes();
        renderizarTablaMensajes(document.getElementById('tabla-contenedor'));
    }
}

function actualizarContadorMensajes() {
    const mensajes = JSON.parse(localStorage.getItem("mensajes_db")) || [];
    const noLeidos = mensajes.filter(m => m.estado === 'nuevo').length;
    const badge = document.getElementById('mensaje-count');

    if (badge) {
        if (noLeidos > 0) {
            badge.innerText = noLeidos;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// 6. TABLAS
function renderizarTablaProductos(cnt) {
    const db = JSON.parse(localStorage.getItem("productos")) || [];
    cnt.innerHTML = `<div class="admin-card-container"><div class="table-responsive"><table class="admin-table">
        <thead><tr><th>Imagen</th><th>Producto</th><th>Categoría</th><th>Stock</th><th>Precio</th><th>Acciones</th></tr></thead>
        <tbody>${db.map(p => `<tr>
            <td><img src="${p.imagen}" width="45" height="45" style="object-fit:cover; border-radius:8px;"></td>
            <td><strong>${p.nombre}</strong></td>
            <td><small>${p.categoria || 'Sin cat.'}</small></td>
            <td><span class="badge ${p.stock < 5 ? 'badge-danger' : 'badge-info'}">${p.stock} ${p.unidad}</span></td>
            <td>$${p.precio.toFixed(2)}</td>
            <td class="actions-cell">
                <button onclick='prepararEdicion("productos", ${p.id})' class="btn-edit"><i class="fas fa-edit"></i></button>
                <button onclick="eliminarRegistro('productos', ${p.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}</tbody></table></div></div>`;
}

function renderizarTablaProveedores(cnt) {
    const db = JSON.parse(localStorage.getItem("proveedores")) || [];
    cnt.innerHTML = `<div class="admin-card-container"><div class="table-responsive"><table class="admin-table">
        <thead><tr><th>Portada</th><th>Nombre Hacienda</th><th>Comunidad</th><th>WhatsApp</th><th>Acciones</th></tr></thead>
        <tbody>${db.map(p => `<tr>
            <td><img src="${p.imagen}" width="45" height="45" style="object-fit:cover; border-radius:8px;"></td>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.comunidad}</td>
            <td>${p.whatsapp}</td>
            <td class="actions-cell">
                <button onclick='prepararEdicion("proveedores", ${p.id})' class="btn-edit"><i class="fas fa-edit"></i></button>
                <button onclick="eliminarRegistro('proveedores', ${p.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}</tbody></table></div></div>`;
}

function renderizarTablaUsuarios(cnt) {
    const db = JSON.parse(localStorage.getItem("usuarios")) || [{id: 1, nombre: "Juan Pérez", email: "juan@mail.com", comunidad: "Ayora"}];
    cnt.innerHTML = `<div class="admin-card-container"><div class="table-responsive"><table class="admin-table">
        <thead><tr><th>Nombre</th><th>Email</th><th>Comunidad</th><th>Acciones</th></tr></thead>
        <tbody>${db.map(u => `<tr>
            <td><strong>${u.nombre}</strong></td>
            <td>${u.email}</td>
            <td><span class="badge badge-info">${u.comunidad || 'General'}</span></td>
            <td class="actions-cell">
                <button onclick="eliminarRegistro('usuarios', ${u.id})" class="btn-delete"><i class="fas fa-user-minus"></i></button>
            </td>
        </tr>`).join('')}</tbody></table></div></div>`;
}

function renderizarPedidos(cnt) {
    const pedidos = JSON.parse(localStorage.getItem("pedidos_db")) || [];
    cnt.innerHTML = `<div class="admin-card-container"><div class="table-responsive"><table class="admin-table">
        <thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${pedidos.map(p => `<tr>
            <td>#${p.id}</td><td>${p.cliente}</td><td>$${p.total.toFixed(2)}</td>
            <td><span class="badge ${p.estado === 'Pendiente' ? 'badge-warning' : 'badge-success'}">${p.estado}</span></td>
            <td><button class="btn-edit" onclick="verDetallePedido('${p.id}')"><i class="fas fa-file-invoice-dollar"></i> Validar</button></td>
        </tr>`).join('')}</tbody></table></div></div>`;
}

// 7. ELIMINACIÓN Y UTILIDADES
function eliminarRegistro(tipo, id) {
    const modal = document.getElementById('modalRegistro');
    const campos = document.getElementById('camposDinamicos');
    const areaMapa = document.getElementById('mapArea');
    const btnGuardar = document.querySelector('#formRegistro button[type="submit"]');

    modal.style.display = 'flex';
    areaMapa.classList.add('hidden');
    if(btnGuardar) btnGuardar.style.display = 'none';
    
    document.getElementById('modalTitulo').innerText = "Confirmar Acción";
    campos.innerHTML = `
        <div style="text-align:center; padding: 10px;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #dc2626;"></i>
            <p style="margin: 15px 0; font-weight: 600;">¿Seguro que deseas eliminar este registro?</p>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button type="button" onclick="cerrarModal()" class="btn-edit">Cancelar</button>
                <button type="button" onclick="confirmarBorrado('${tipo}', ${id})" class="btn-delete" style="padding: 10px 20px;">Eliminar</button>
            </div>
        </div>`;
}

function confirmarBorrado(tipo, id) {
    let db = JSON.parse(localStorage.getItem(tipo)) || [];
    
    if (tipo === 'proveedores') {
        let productosDB = JSON.parse(localStorage.getItem('productos')) || [];
        const productosRestantes = productosDB.filter(p => p.proveedorId !== id);
        localStorage.setItem('productos', JSON.stringify(productosRestantes));
    }

    db = db.filter(item => item.id !== id);
    localStorage.setItem(tipo, JSON.stringify(db));

    cerrarModal();
    cargarSeccion(seccionActual);
    mostrarNotificacion("Eliminado correctamente", "error");
}

function prepararEdicion(tipo, id) {
    const db = JSON.parse(localStorage.getItem(tipo)) || [];
    const item = db.find(x => x.id === id);
    if(item) abrirModal(item);
}

function cerrarModal() {
    document.getElementById('modalRegistro').style.display = 'none';
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    const color = tipo === 'success' ? '#AE6E24' : '#dc2626';
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed; top:20px; right:20px; background:white; padding:15px 25px; border-radius:10px; box-shadow:0 10px 20px rgba(0,0,0,0.1); border-left:5px solid ${color}; z-index:10000; font-weight:600;`;
    toast.innerText = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => cargarSeccion('dashboard'));