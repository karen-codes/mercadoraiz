/***********************************
 * GESTIÓN ADMINISTRATIVA MAESTRA - MERCADO RAÍZ
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

// ... (Función cargarSeccion y inicializarMapaAdmin se mantienen igual) ...

// --- MODAL DINÁMICO ACTUALIZADO ---
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
            <div class="form-group"><label>Nombre del Producto</label><input type="text" id="reg_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group"><label>Descripción Corta</label><input type="text" id="reg_desc" class="admin-input" value="${datos?.descripcion || ''}" placeholder="Ej: Recién cosechado..."></div>
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
                <div class="form-group" style="flex:1;"><label>Unidad de Medida</label>
                    <select id="reg_medida" class="admin-input">
                        <option value="Libra" ${datos?.medida === 'Libra' ? 'selected' : ''}>Libra</option>
                        <option value="Kilo" ${datos?.medida === 'Kilo' ? 'selected' : ''}>Kilo</option>
                        <option value="Litro" ${datos?.medida === 'Litro' ? 'selected' : ''}>Litro</option>
                        <option value="Unidad" ${datos?.medida === 'Unidad' ? 'selected' : ''}>Unidad</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Stock Disponible</label><input type="number" id="reg_stock" class="admin-input" value="${datos?.stock || ''}" required></div>
            <div class="form-group"><label>Productor</label>
                <select id="reg_prov_id" class="admin-input">
                    <option value="">Seleccione Productor</option>
                    ${provs.map(pr => `<option value="${pr.id}" ${datos?.proveedorId == pr.id ? 'selected' : ''}>${pr.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Foto del Producto</label>
                <input type="file" id="reg_foto_file" class="admin-input" accept="image/*">
                <input type="hidden" id="reg_foto_actual" value="${datos?.imagen || ''}">
            </div>`;

    } else if (seccionActual === 'proveedores') {
        document.getElementById('modalTitulo').innerText = datos ? 'Editar Productor' : 'Registrar Productor';
        areaMapa.classList.remove('hidden');
        
        campos.innerHTML = `
            <div class="form-group"><label>Nombre de la Parcela/Finca</label><input type="text" id="prov_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group"><label>WhatsApp</label><input type="text" id="prov_ws" class="admin-input" value="${datos?.whatsapp || ''}" required></div>
            <div class="form-group"><label>Comunidad</label><input type="text" id="prov_comunidad" class="admin-input" value="${datos?.comunidad || ''}" required></div>
            <div class="form-group"><label>Historia de la Finca</label><textarea id="prov_historia" class="admin-input">${datos?.historia || ''}</textarea></div>
            
            <div class="form-row" style="display:flex; gap:10px;">
                <div class="form-group" style="flex:1;"><label>Horario de Atención</label><input type="text" id="prov_horario" class="admin-input" placeholder="Ej: Lun-Vie 08:00-16:00" value="${datos?.horario || ''}"></div>
                <div class="form-group" style="flex:1;"><label>Formas de Pago</label><input type="text" id="prov_pagos" class="admin-input" placeholder="Ej: Efectivo, Transferencia" value="${datos?.pagos || ''}"></div>
            </div>

            <input type="hidden" id="reg_coords" value="${datos?.coords || '-0.0469, -78.1453'}">
            
            <div class="form-group">
                <label>Foto Portada (Desde PC)</label>
                <input type="file" id="prov_portada_file" class="admin-input" accept="image/*">
                <input type="hidden" id="prov_foto_actual" value="${datos?.imagen || ''}">
            </div>
            <div class="form-group">
                <label>Video Historia (Desde PC)</label>
                <input type="file" id="prov_video_file" class="admin-input" accept="video/*">
                <input type="hidden" id="prov_video_actual" value="${datos?.video || ''}">
            </div>`;

        setTimeout(() => inicializarMapaAdmin(datos?.coords), 300);
    }
}

// --- PROCESAR FORMULARIO ---
document.getElementById('formRegistro').onsubmit = async function(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Subiendo a Mercado Raíz Cloud...";

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
                horario: document.getElementById('prov_horario').value,
                pagos: document.getElementById('prov_pagos').value,
                coords: document.getElementById('reg_coords').value,
                imagen: urlImg,
                video: urlVid
            };
        }

        await db.ref(`${seccionActual}/${idFinal}`).set(item);
        cerrarModal();
        alert("¡Datos actualizados con éxito!");
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Guardar Cambios";
    }
};

// ... (Resto de funciones eliminar y prepararEdicion se mantienen igual) ...