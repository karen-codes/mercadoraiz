/***********************************
 * GESTIÓN ADMINISTRATIVA MAESTRA - CLOUD VERSION
 ***********************************/
let seccionActual = 'dashboard';
let map = null;
let marker = null;
let editandoId = null;

// --- UTILIDAD: SUBIDA DE ARCHIVOS A STORAGE ---
async function subirArchivo(archivo, carpeta) {
    if (!archivo) return null;
    try {
        const storageRef = firebase.storage().ref(`${carpeta}/${Date.now()}_${archivo.name}`);
        const snapshot = await storageRef.put(archivo);
        return await snapshot.ref.getDownloadURL();
    } catch (error) {
        console.error("Error en Storage:", error);
        return null;
    }
}

// Función para cambiar de pestaña con limpieza de memoria
function cargarSeccion(seccion) {
    seccionActual = seccion;
    const contenedor = document.getElementById('tabla-contenedor');
    const titulo = document.getElementById('seccion-titulo');
    const btnAccion = document.getElementById('btn-accion-principal');

    // 1. Limpieza de listeners previos
    db.ref('productos').off();
    db.ref('proveedores').off();
    db.ref('usuarios').off();
    db.ref('pedidos').off();

    // 2. UI: Actualizar menú lateral
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const linkActivo = document.getElementById(`link-${seccion}`);
    if (linkActivo) linkActivo.classList.add('active');

    // 3. Cargar datos en tiempo real
    switch (seccion) {
        case 'dashboard':
            titulo.innerText = "Dashboard Alcance";
            btnAccion.style.display = "none";
            if (typeof renderizarDashboard === "function") renderizarDashboard(contenedor);
            break;

        case 'productos':
            titulo.innerText = "Inventario de Productos";
            btnAccion.style.display = "block";
            db.ref('productos').on('value', (snapshot) => {
                const data = snapshot.val();
                const array = data ? Object.keys(data).map(k => ({...data[k], firebaseId: k})) : [];
                if (typeof renderizarTablaProductos === "function") renderizarTablaProductos(contenedor, array);
            });
            break;

        case 'proveedores':
            titulo.innerText = "Red de Proveedores";
            btnAccion.style.display = "block";
            db.ref('proveedores').on('value', (snapshot) => {
                const data = snapshot.val();
                const array = data ? Object.keys(data).map(k => ({...data[k], firebaseId: k})) : [];
                if (typeof renderizarTablaProveedores === "function") renderizarTablaProveedores(contenedor, array);
            });
            break;

        case 'usuarios':
            titulo.innerText = "Base de Clientes";
            btnAccion.style.display = "none";
            if (typeof renderizarTablaUsuarios === "function") renderizarTablaUsuarios(contenedor);
            break;

        case 'pedidos':
            titulo.innerText = "Pedidos y Pagos";
            btnAccion.style.display = "none";
            if (typeof mostrarPedidos === "function") mostrarPedidos();
            break;
    }
}

// --- LÓGICA DE MAPA (Leaflet) ---
function inicializarMapaAdmin(coordsStr) {
    const latlng = coordsStr ? coordsStr.split(',').map(Number) : [-0.0469, -78.1453];
    if (map !== null) map.remove();

    map = L.map('mapAdmin').setView(latlng, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker(latlng, {draggable: true}).addTo(map);
    
    marker.on('dragend', function() {
        const position = marker.getLatLng();
        document.getElementById('reg_coords').value = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
    });
}

// --- MODAL DINÁMICO ---
async function abrirModal(datos = null) {
    const modal = document.getElementById('modalRegistro');
    const campos = document.getElementById('camposDinamicos');
    const areaMapa = document.getElementById('mapArea');
    
    editandoId = datos ? (datos.firebaseId || datos.id) : null;
    modal.style.display = 'flex';

    if (seccionActual === 'productos') {
        document.getElementById('modalTitulo').innerText = datos ? 'Editar Producto' : 'Nuevo Producto';
        areaMapa.classList.add('hidden');
        
        const snapshot = await db.ref('proveedores').once('value');
        const provs = snapshot.val() ? Object.keys(snapshot.val()).map(k => ({...snapshot.val()[k], id: k})) : [];

        campos.innerHTML = `
            <div class="form-group"><label>Nombre</label><input type="text" id="reg_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group"><label>Categoría</label>
                <select id="reg_categoria" class="admin-input">
                    <option value="Hortalizas" ${datos?.categoria === 'Hortalizas' ? 'selected' : ''}>Hortalizas</option>
                    <option value="Frutas" ${datos?.categoria === 'Frutas' ? 'selected' : ''}>Frutas</option>
                    <option value="Lácteos" ${datos?.categoria === 'Lácteos' ? 'selected' : ''}>Lácteos</option>
                </select>
            </div>
            <div class="form-group"><label>Precio ($)</label><input type="number" step="0.01" id="reg_precio" class="admin-input" value="${datos?.precio || ''}" required></div>
            <div class="form-group"><label>Stock</label><input type="number" id="reg_stock" class="admin-input" value="${datos?.stock || ''}" required></div>
            <div class="form-group"><label>Productor</label>
                <select id="reg_prov_id" class="admin-input">
                    ${provs.map(pr => `<option value="${pr.id}" ${datos?.proveedorId == pr.id ? 'selected' : ''}>${pr.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Foto del Producto (PC)</label>
                <input type="file" id="reg_foto_file" class="admin-input" accept="image/*">
                <input type="hidden" id="reg_foto_actual" value="${datos?.imagen || ''}">
            </div>`;

    } else if (seccionActual === 'proveedores') {
        document.getElementById('modalTitulo').innerText = datos ? 'Editar Productor' : 'Registrar Productor';
        areaMapa.classList.remove('hidden');
        
        campos.innerHTML = `
            <div class="form-group"><label>Nombre de la Finca</label><input type="text" id="prov_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group"><label>Comunidad</label><input type="text" id="prov_comunidad" class="admin-input" value="${datos?.comunidad || ''}" required></div>
            <div class="form-group"><label>WhatsApp</label><input type="text" id="prov_ws" class="admin-input" value="${datos?.whatsapp || ''}" required></div>
            <input type="hidden" id="reg_coords" value="${datos?.coords || '-0.0469, -78.1453'}">
            <div class="form-group">
                <label>Foto Portada (PC)</label>
                <input type="file" id="prov_portada_file" class="admin-input" accept="image/*">
                <input type="hidden" id="prov_foto_actual" value="${datos?.imagen || ''}">
            </div>
            <div class="form-group">
                <label>Video de la Finca (PC)</label>
                <input type="file" id="prov_video_file" class="admin-input" accept="video/*">
                <input type="hidden" id="prov_video_actual" value="${datos?.video || ''}">
            </div>`;

        setTimeout(() => inicializarMapaAdmin(datos?.coords), 300);
    }
}

// --- PROCESAR FORMULARIO (Guardado en Nube) ---
document.getElementById('formRegistro').onsubmit = async function(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.innerText;
    
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Sincronizando archivos...";

    const ref = db.ref(seccionActual);
    const idFinal = editandoId || ref.push().key;
    let item = { id: idFinal };

    try {
        if (seccionActual === 'productos') {
            const fileImg = document.getElementById('reg_foto_file').files[0];
            const urlImg = fileImg ? await subirArchivo(fileImg, 'productos') : document.getElementById('reg_foto_actual').value;

            item = {
                ...item,
                nombre: document.getElementById('reg_nombre').value,
                categoria: document.getElementById('reg_categoria').value,
                precio: parseFloat(document.getElementById('reg_precio').value),
                stock: parseInt(document.getElementById('reg_stock').value),
                proveedorId: document.getElementById('reg_prov_id').value,
                imagen: urlImg
            };
        } else if (seccionActual === 'proveedores') {
            const fileImg = document.getElementById('prov_portada_file').files[0];
            const fileVid = document.getElementById('prov_video_file').files[0];

            // Subir archivos nuevos o mantener los anteriores
            const urlImg = fileImg ? await subirArchivo(fileImg, 'fincas') : document.getElementById('prov_foto_actual').value;
            const urlVid = fileVid ? await subirArchivo(fileVid, 'videos') : document.getElementById('prov_video_actual').value;

            item = {
                ...item,
                nombre: document.getElementById('prov_nombre').value,
                comunidad: document.getElementById('prov_comunidad').value,
                whatsapp: document.getElementById('prov_ws').value,
                coords: document.getElementById('reg_coords').value,
                imagen: urlImg,
                video: urlVid
            };
        }

        await db.ref(`${seccionActual}/${idFinal}`).set(item);
        cerrarModal();
        alert("¡Guardado correctamente en la base de datos!");
    } catch (err) {
        alert("Error al guardar: " + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = textoOriginal;
    }
};

// --- ELIMINACIÓN ---
async function eliminarRegistro(tipo, id) {
    if (confirm("¿Estás seguro de eliminar este registro de la nube?")) {
        await db.ref(`${tipo}/${id}`).remove();
    }
}

function prepararEdicion(tipo, id) {
    db.ref(`${tipo}/${id}`).once('value', (snap) => {
        abrirModal({...snap.val(), firebaseId: id});
    });
}

function cerrarModal() { document.getElementById('modalRegistro').style.display = 'none'; }