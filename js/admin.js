/***********************************
 * GESTIÓN ADMINISTRATIVA MAESTRA - MERCADO RAÍZ
 ***********************************/
let seccionActual = 'dashboard';
let map = null;
let marker = null;
let editandoId = null;

/**
 * UTILIDAD: SUBIDA DE ARCHIVOS A FIREBASE STORAGE
 * Permite subir imágenes y videos desde la computadora a la nube.
 */
async function subirArchivo(archivo, carpeta) {
    if (!archivo) return null;
    try {
        // Usamos la referencia global 'storage' definida en data.js
        const storageRef = storage.ref(`${carpeta}/${Date.now()}_${archivo.name}`);
        const snapshot = await storageRef.put(archivo);
        const url = await snapshot.ref.getDownloadURL();
        console.log(`Archivo subido con éxito: ${url}`);
        return url;
    } catch (error) {
        console.error("Error en Firebase Storage:", error);
        alert("Error al subir el archivo: " + error.message);
        return null;
    }
}

/**
 * NAVEGACIÓN ENTRE SECCIONES DEL PANEL
 */
function cargarSeccion(seccion) {
    seccionActual = seccion;
    const titulo = document.getElementById('seccion-titulo');
    const contenedor = document.getElementById('tabla-contenedor');
    
    // Actualizar UI del menú
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const linkActivo = document.getElementById(`link-${seccion}`);
    if (linkActivo) linkActivo.classList.add('active');

    if (titulo) titulo.innerText = seccion.charAt(0).toUpperCase() + seccion.slice(1);
    
    // Mostrar spinner de carga
    contenedor.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color:#AE6E24;"></i>
            <p>Cargando datos desde la nube...</p>
        </div>`;

    // Escuchar datos en tiempo real
    db.ref(seccion).on('value', (snapshot) => {
        const data = snapshot.val();
        const lista = data ? Object.keys(data).map(key => ({...data[key], firebaseId: key})) : [];
        renderizarTabla(lista);
    });
}

/**
 * MODAL DINÁMICO PARA PRODUCTOS Y PROVEEDORES
 */
async function abrirModal(datos = null) {
    const modal = document.getElementById('modalRegistro');
    const campos = document.getElementById('camposDinamicos');
    const areaMapa = document.getElementById('mapArea');
    
    editandoId = datos ? (datos.firebaseId || datos.id) : null;
    modal.style.display = 'flex';

    if (seccionActual === 'productos') {
        document.getElementById('modalTitulo').innerText = datos ? 'Editar Producto' : 'Nuevo Producto';
        if (areaMapa) areaMapa.classList.add('hidden');
        
        // Obtener lista de proveedores para el select
        const snapshot = await db.ref('proveedores').once('value');
        const provs = snapshot.val() ? Object.keys(snapshot.val()).map(k => ({...snapshot.val()[k], id: k})) : [];

        campos.innerHTML = `
            <div class="form-group"><label>Nombre del Producto</label><input type="text" id="reg_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group"><label>Descripción</label><input type="text" id="reg_desc" class="admin-input" value="${datos?.descripcion || ''}"></div>
            <div class="form-group">
                <label>Categoría</label>
                <select id="reg_categoria" class="admin-input">
                    <option value="Papas y Tubérculos" ${datos?.categoria === 'Papas y Tubérculos' ? 'selected' : ''}>Papas y Tubérculos</option>
                    <option value="Hortalizas" ${datos?.categoria === 'Hortalizas' ? 'selected' : ''}>Hortalizas</option>
                    <option value="Frutas" ${datos?.categoria === 'Frutas' ? 'selected' : ''}>Frutas</option>
                    <option value="Lácteos" ${datos?.categoria === 'Lácteos' ? 'selected' : ''}>Lácteos</option>
                </select>
            </div>
            <div class="form-row" style="display:flex; gap:10px;">
                <div class="form-group" style="flex:1;"><label>Precio ($)</label><input type="number" step="0.01" id="reg_precio" class="admin-input" value="${datos?.precio || ''}" required></div>
                <div class="form-group" style="flex:1;"><label>Medida</label>
                    <select id="reg_medida" class="admin-input">
                        <option value="Libra" ${datos?.medida === 'Libra' ? 'selected' : ''}>Libra</option>
                        <option value="Kilo" ${datos?.medida === 'Kilo' ? 'selected' : ''}>Kilo</option>
                        <option value="Litro" ${datos?.medida === 'Litro' ? 'selected' : ''}>Litro</option>
                        <option value="Unidad" ${datos?.medida === 'Unidad' ? 'selected' : ''}>Unidad</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Stock</label><input type="number" id="reg_stock" class="admin-input" value="${datos?.stock || ''}" required></div>
            <div class="form-group"><label>Productor</label>
                <select id="reg_prov_id" class="admin-input" required>
                    <option value="">Seleccione Productor</option>
                    ${provs.map(pr => `<option value="${pr.id}" ${datos?.proveedorId == pr.id ? 'selected' : ''}>${pr.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Imagen del Producto</label>
                <input type="file" id="reg_foto_file" class="admin-input" accept="image/*">
                <input type="hidden" id="reg_foto_actual" value="${datos?.imagen || ''}">
            </div>`;

    } else if (seccionActual === 'proveedores') {
        document.getElementById('modalTitulo').innerText = datos ? 'Editar Productor' : 'Registrar Productor';
        if (areaMapa) areaMapa.classList.remove('hidden');
        
        campos.innerHTML = `
            <div class="form-group"><label>Nombre de la Parcela/Finca</label><input type="text" id="prov_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group"><label>WhatsApp</label><input type="text" id="prov_ws" class="admin-input" value="${datos?.whatsapp || ''}" required></div>
            <div class="form-group"><label>Comunidad</label><input type="text" id="prov_comunidad" class="admin-input" value="${datos?.comunidad || ''}" required></div>
            <div class="form-group"><label>Historia</label><textarea id="prov_historia" class="admin-input">${datos?.historia || ''}</textarea></div>
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

/**
 * GUARDAR DATOS EN FIREBASE (PROCESO MAESTRO)
 */
document.getElementById('formRegistro').onsubmit = async function(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-sync fa-spin"></i> Sincronizando...';

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
                descripcion: document.getElementById('reg_desc').value,
                categoria: document.getElementById('reg_categoria').value,
                medida: document.getElementById('reg_medida').value,
                precio: parseFloat(document.getElementById('reg_precio').value),
                stock: parseInt(document.getElementById('reg_stock').value),
                proveedorId: document.getElementById('reg_prov_id').value,
                imagen: urlImg
            };
        } else if (seccionActual === 'proveedores') {
            const fileImg = document.getElementById('prov_portada_file').files[0];
            const fileVid = document.getElementById('prov_video_file').files[0];

            const urlImg = fileImg ? await subirArchivo(fileImg, 'fincas') : document.getElementById('prov_foto_actual').value;
            const urlVid = fileVid ? await subirArchivo(fileVid, 'videos') : document.getElementById('prov_video_actual').value;

            item = {
                ...item,
                nombre: document.getElementById('prov_nombre').value,
                whatsapp: document.getElementById('prov_ws').value,
                comunidad: document.getElementById('prov_comunidad').value,
                historia: document.getElementById('prov_historia').value,
                coords: document.getElementById('reg_coords').value,
                imagen: urlImg,
                video: urlVid
            };
        }

        await db.ref(`${seccionActual}/${idFinal}`).set(item);
        cerrarModal();
        alert("¡Éxito! Mercado Raíz Cloud ha sido actualizado.");
    } catch (err) {
        console.error("Error al guardar:", err);
        alert("Error al guardar: " + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Guardar Cambios";
    }
};

function cerrarModal() {
    document.getElementById('modalRegistro').style.display = 'none';
    document.getElementById('formRegistro').reset();
    editandoId = null;
}

/**
 * RENDERIZADO DE TABLAS DINÁMICAS
 */
function renderizarTabla(lista) {
    const contenedor = document.getElementById('tabla-contenedor');
    if (!contenedor) return;

    if (lista.length === 0) {
        contenedor.innerHTML = `<div style="text-align:center; padding:40px;">No hay registros en la sección ${seccionActual}.</div>`;
        return;
    }

    let html = `<table class="admin-table">
        <thead>
            <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                ${seccionActual === 'productos' ? '<th>Precio</th><th>Stock</th>' : '<th>Comunidad</th>'}
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>`;

    html += lista.map(item => `
        <tr>
            <td><img src="${item.imagen || 'assets/images/no-image.jpg'}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;"></td>
            <td><strong>${item.nombre}</strong></td>
            ${seccionActual === 'productos' 
                ? `<td>$${item.precio}</td><td>${item.stock}</td>` 
                : `<td>${item.comunidad}</td>`}
            <td>
                <button onclick='prepararEdicion(${JSON.stringify(item)})' class="btn-edit"><i class="fas fa-edit"></i></button>
                <button onclick="eliminarRegistro('${item.firebaseId}')" class="btn-delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}

function prepararEdicion(datos) {
    abrirModal(datos);
}

async function eliminarRegistro(id) {
    if (confirm("¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.")) {
        try {
            await db.ref(`${seccionActual}/${id}`).remove();
            alert("Eliminado correctamente.");
        } catch (error) {
            alert("Error al eliminar: " + error.message);
        }
    }
}