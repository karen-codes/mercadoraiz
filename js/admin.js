/***********************************
 * GESTIÓN ADMINISTRATIVA MAESTRA - CLOUD VERSION
 ***********************************/
let seccionActual = 'dashboard';
let map = null;
let marker = null;
let editandoId = null;

// 1. CARGA DINÁMICA DE SECCIONES (Ahora con Firebase)
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

    contenedor.innerHTML = '<div class="loader-admin">Cargando datos desde la nube...</div>'; 

    // Aquí conectamos cada sección a su nodo en Firebase
    switch(seccion) {
        case 'dashboard': 
            if (typeof renderizarDashboard === 'function') renderizarDashboard(contenedor); 
            break;
        case 'productos': escucharCambiosFirebase('productos', renderizarTablaProductos); break;
        case 'proveedores': escucharCambiosFirebase('proveedores', renderizarTablaProveedores); break;
        case 'usuarios': escucharCambiosFirebase('usuarios', renderizarTablaUsuarios); break;
        case 'pedidos': escucharCambiosFirebase('pedidos', renderizarPedidos); break;
        case 'mensajes': escucharCambiosFirebase('mensajes', renderizarTablaMensajes); break;
        default: mostrarAvisoDesarrollo(contenedor, seccion);
    }
}

// Función maestra para escuchar cambios en tiempo real
function escucharCambiosFirebase(nodo, funcionRender) {
    db.ref(nodo).on('value', (snapshot) => {
        const data = snapshot.val();
        const contenedor = document.getElementById('tabla-contenedor');
        // Convertimos el objeto de Firebase en Array para tus .map()
        const dataArray = data ? Object.keys(data).map(key => ({...data[key], firebaseId: key})) : [];
        funcionRender(contenedor, dataArray);
    });
}

// 2. MODAL DINÁMICO (Optimizado para Firebase)
async function abrirModal(datos = null) {
    const modal = document.getElementById('modalRegistro');
    const campos = document.getElementById('camposDinamicos');
    const areaMapa = document.getElementById('mapArea');
    const btnGuardar = document.querySelector('#formRegistro button[type="submit"]');
    
    editandoId = datos ? (datos.firebaseId || datos.id) : null;
    modal.style.display = 'flex';
    if(btnGuardar) btnGuardar.style.display = 'block';

    if (seccionActual === 'productos') {
        document.getElementById('modalTitulo').innerText = datos ? 'Editar Producto' : 'Nuevo Producto';
        areaMapa.classList.add('hidden');
        
        // Obtenemos proveedores de Firebase para el select
        const snapshot = await db.ref('proveedores').once('value');
        const provsObj = snapshot.val() || {};
        const provs = Object.keys(provsObj).map(k => ({...provsObj[k], id: k}));

        campos.innerHTML = `
            <div class="form-group"><label>Nombre del Producto</label><input type="text" id="reg_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group">
                <label>Categoría</label>
                <select id="reg_categoria" class="admin-input" required>
                    <option value="Papas y Tubérculos" ${datos?.categoria === 'Papas y Tubérculos' ? 'selected' : ''}>Papas y Tubérculos</option>
                    <option value="Hortalizas" ${datos?.categoria === 'Hortalizas' ? 'selected' : ''}>Hortalizas</option>
                    <option value="Frutas" ${datos?.categoria === 'Frutas' ? 'selected' : ''}>Frutas</option>
                    <option value="Lácteos" ${datos?.categoria === 'Lácteos' ? 'selected' : ''}>Lácteos</option>
                </select>
            </div>
            <div class="form-group"><label>Precio ($)</label><input type="number" step="0.01" id="reg_precio" class="admin-input" value="${datos?.precio || ''}" required></div>
            <div class="form-group"><label>Stock (Cant.)</label><input type="number" id="reg_stock" class="admin-input" value="${datos?.stock || ''}" required></div>
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
        
        campos.innerHTML = `
            <div class="form-group"><label>Nombre de la Parcela</label><input type="text" id="prov_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group"><label>WhatsApp</label><input type="number" id="prov_ws" class="admin-input" value="${datos?.whatsapp || ''}" required></div>
            <div class="form-group"><label>Comunidad</label><input type="text" id="prov_comunidad" class="admin-input" value="${datos?.comunidad || ''}" required></div>
            <div class="form-group"><label>Historia</label><textarea id="prov_historia" class="admin-input">${datos?.historia || ''}</textarea></div>
            <div class="form-group">
                <label>Foto Portada</label>
                <input type="file" id="prov_portada" accept="image/*" class="admin-input" onchange="previsualizarArchivo(event, 'portadaPreview')">
                <img id="portadaPreview" src="${datos?.imagen || '#'}" style="${datos?.imagen ? 'display:block' : 'display:none'}; max-width: 120px; border-radius:8px;">
            </div>
            <input type="hidden" id="reg_coords" value="${datos?.coords || '-0.0469, -78.1453'}">`;

        setTimeout(() => inicializarMapaAdmin(datos?.coords), 300);
    }
}

// 4. GUARDADO DE DATOS (Hacia Firebase)
document.getElementById('formRegistro').onsubmit = async function(e) {
    e.preventDefault();
    
    // Referencia al nodo correcto
    const ref = db.ref(seccionActual);
    const idFinal = editandoId || ref.push().key; // Si es nuevo, Firebase genera un ID único

    let item = {};

    if (seccionActual === 'productos') {
        const previewImg = document.getElementById('imgPreview');
        item = {
            id: idFinal,
            nombre: document.getElementById('reg_nombre').value,
            categoria: document.getElementById('reg_categoria').value,
            precio: parseFloat(document.getElementById('reg_precio').value),
            stock: parseInt(document.getElementById('reg_stock').value),
            proveedorId: document.getElementById('reg_prov_id').value,
            imagen: previewImg.src
        };
    } 
    else if (seccionActual === 'proveedores') {
        const portadaPrev = document.getElementById('portadaPreview');
        item = {
            id: idFinal,
            nombre: document.getElementById('prov_nombre').value,
            comunidad: document.getElementById('prov_comunidad').value,
            whatsapp: document.getElementById('prov_ws').value,
            historia: document.getElementById('prov_historia').value,
            coords: document.getElementById('reg_coords').value,
            imagen: portadaPrev.src
        };
    }

    // Guardar en Firebase
    await db.ref(`${seccionActual}/${idFinal}`).set(item);

    mostrarNotificacion(editandoId ? "Actualizado en la nube" : "Guardado en la nube");
    cerrarModal();
};

// 6. RENDERIZADO DE TABLAS (Usando los datos que vienen de Firebase)
function renderizarTablaProductos(cnt, dbArray) {
    cnt.innerHTML = `<div class="admin-card-container"><div class="table-responsive"><table class="admin-table">
        <thead><tr><th>Imagen</th><th>Producto</th><th>Stock</th><th>Precio</th><th>Acciones</th></tr></thead>
        <tbody>${dbArray.map(p => `<tr>
            <td><img src="${p.imagen}" width="45" height="45" style="object-fit:cover; border-radius:8px;"></td>
            <td><strong>${p.nombre}</strong></td>
            <td><span class="badge ${p.stock < 5 ? 'badge-danger' : 'badge-info'}">${p.stock}</span></td>
            <td>$${p.precio.toFixed(2)}</td>
            <td class="actions-cell">
                <button onclick='prepararEdicion("productos", "${p.firebaseId}")' class="btn-edit"><i class="fas fa-edit"></i></button>
                <button onclick="eliminarRegistro('productos', '${p.firebaseId}')" class="btn-delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}</tbody></table></div></div>`;
}

function renderizarTablaProveedores(cnt, dbArray) {
    cnt.innerHTML = `<div class="admin-card-container"><div class="table-responsive"><table class="admin-table">
        <thead><tr><th>Portada</th><th>Nombre</th><th>Comunidad</th><th>WhatsApp</th><th>Acciones</th></tr></thead>
        <tbody>${dbArray.map(p => `<tr>
            <td><img src="${p.imagen}" width="45" height="45" style="object-fit:cover; border-radius:8px;"></td>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.comunidad}</td>
            <td>${p.whatsapp}</td>
            <td class="actions-cell">
                <button onclick='prepararEdicion("proveedores", "${p.firebaseId}")' class="btn-edit"><i class="fas fa-edit"></i></button>
                <button onclick="eliminarRegistro('proveedores', '${p.firebaseId}')" class="btn-delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}</tbody></table></div></div>`;
}

function renderizarPedidos(cnt, dbArray) {
    cnt.innerHTML = `<div class="admin-card-container"><div class="table-responsive"><table class="admin-table">
        <thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${dbArray.reverse().map(p => `<tr>
            <td>#${p.firebaseId.substring(1,7)}</td><td>${p.cliente}</td><td>$${parseFloat(p.total).toFixed(2)}</td>
            <td><span class="badge ${p.estado === 'Pendiente' ? 'badge-warning' : 'badge-success'}">${p.estado}</span></td>
            <td><button class="btn-edit" onclick="verDetallePedido('${p.firebaseId}')"><i class="fas fa-check"></i> Validar</button></td>
        </tr>`).join('')}</tbody></table></div></div>`;
}

// 7. ELIMINACIÓN (Directo en Firebase)
async function confirmarBorrado(tipo, id) {
    await db.ref(`${tipo}/${id}`).remove();
    cerrarModal();
    mostrarNotificacion("Eliminado de la nube", "error");
}

// Inicialización de utilidades (No cambiadas)
function cerrarModal() { document.getElementById('modalRegistro').style.display = 'none'; }
function previsualizarArchivo(event, targetId) {
    const reader = new FileReader();
    reader.onload = () => { const out = document.getElementById(targetId); out.src = reader.result; out.style.display = 'block'; };
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}
function prepararEdicion(tipo, id) {
    db.ref(`${tipo}/${id}`).once('value', (snap) => {
        const item = snap.val();
        if(item) abrirModal({...item, firebaseId: id});
    });
}

document.addEventListener('DOMContentLoaded', () => cargarSeccion('dashboard'));