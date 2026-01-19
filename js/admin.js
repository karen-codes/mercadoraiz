/***********************************
 * GESTIÓN ADMINISTRATIVA MAESTRA - MERCADO RAÍZ
 ***********************************/
let seccionActual = 'dashboard';
let map = null;
let marker = null;
let editandoId = null;

/**
 * UTILIDAD: SUBIDA DE ARCHIVOS A FIREBASE STORAGE
 */
async function subirArchivo(archivo, carpeta) {
    if (!archivo) return null;
    try {
        // 'storage' debe estar inicializado en data.js: const storage = firebase.storage();
        const storageRef = firebase.storage().ref(`${carpeta}/${Date.now()}_${archivo.name}`);
        const snapshot = await storageRef.put(archivo);
        return await snapshot.ref.getDownloadURL();
    } catch (error) {
        console.error("Error en Firebase Storage:", error);
        return null;
    }
}

/**
 * NAVEGACIÓN ENTRE SECCIONES
 */
function cargarSeccion(seccion) {
    seccionActual = seccion;
    const titulo = document.getElementById('seccion-titulo');
    const contenedor = document.getElementById('tabla-contenedor');
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const linkActivo = document.getElementById(`link-${seccion}`);
    if (linkActivo) linkActivo.classList.add('active');
    if (titulo) titulo.innerText = seccion.toUpperCase();

    contenedor.innerHTML = `<div style="text-align:center; padding:50px;"><i class="fas fa-sync fa-spin fa-3x"></i></div>`;

    // Escucha en tiempo real
    db.ref(seccion).on('value', (snapshot) => {
        const data = snapshot.val();
        const lista = data ? Object.keys(data).map(key => ({...data[key], firebaseId: key})) : [];
        renderizarTabla(lista);
    });
}

/**
 * MODAL DINÁMICO MEJORADO
 */
async function abrirModal(datos = null) {
    const modal = document.getElementById('modalRegistro');
    const campos = document.getElementById('camposDinamicos');
    editandoId = datos ? (datos.firebaseId || datos.id) : null;
    modal.style.display = 'flex';

    if (seccionActual === 'productos') {
        const snapshot = await db.ref('proveedores').once('value');
        const provs = snapshot.val() ? Object.keys(snapshot.val()).map(k => ({...snapshot.val()[k], id: k})) : [];

        campos.innerHTML = `
            <div class="form-group"><label>Nombre del Producto</label><input type="text" id="reg_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group"><label>Descripción Corta</label><input type="text" id="reg_desc" class="admin-input" value="${datos?.descripcion || ''}"></div>
            <div class="form-row" style="display:flex; gap:10px;">
                <div class="form-group" style="flex:1;"><label>Precio ($)</label><input type="number" step="0.01" id="reg_precio" class="admin-input" value="${datos?.precio || ''}" required></div>
                <div class="form-group" style="flex:1;"><label>Unidad</label>
                    <select id="reg_medida" class="admin-input">
                        <option value="Libra" ${datos?.medida === 'Libra' ? 'selected' : ''}>Libra</option>
                        <option value="Kilo" ${datos?.medida === 'Kilo' ? 'selected' : ''}>Kilo</option>
                        <option value="Litro" ${datos?.medida === 'Litro' ? 'selected' : ''}>Litro</option>
                        <option value="Unidad" ${datos?.medida === 'Unidad' ? 'selected' : ''}>Unidad</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Parcela de Origen</label>
                <select id="reg_prov_id" class="admin-input" required>
                    <option value="">Seleccione Productor</option>
                    ${provs.map(pr => `<option value="${pr.id}" ${datos?.proveedorId == pr.id ? 'selected' : ''}>${pr.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Imagen Producto (PC)</label><input type="file" id="reg_foto_file" accept="image/*"></div>
            <input type="hidden" id="reg_foto_actual" value="${datos?.imagen || ''}">
        `;

    } else if (seccionActual === 'proveedores') {
        campos.innerHTML = `
            <div class="form-group"><label>Nombre de la Parcela</label><input type="text" id="prov_nombre" class="admin-input" value="${datos?.nombre || ''}" required></div>
            <div class="form-group"><label>Descripción Corta</label><input type="text" id="prov_desc_corta" class="admin-input" value="${datos?.descripcionCorta || ''}"></div>
            <div class="form-group"><label>Nuestra Historia</label><textarea id="prov_historia" class="admin-input">${datos?.historia || ''}</textarea></div>
            <div class="form-row" style="display:flex; gap:10px;">
                <div class="form-group" style="flex:1;"><label>WhatsApp</label><input type="text" id="prov_ws" class="admin-input" value="${datos?.whatsapp || ''}"></div>
                <div class="form-group" style="flex:1;"><label>Horario</label><input type="text" id="prov_horario" class="admin-input" placeholder="Ej: Lun-Vie 08:00-17:00" value="${datos?.horario || ''}"></div>
            </div>
            
            <h4 style="margin-top:20px; border-bottom:1px solid #eee;">Métodos de Pago</h4>
            <div class="form-group">
                <label><input type="checkbox" id="pay_trans" ${datos?.pagos?.transferencia ? 'checked' : ''} onchange="document.getElementById('datos_banco').classList.toggle('hidden')"> Transferencia Bancaria</label>
            </div>
            <div id="datos_banco" class="${datos?.pagos?.transferencia ? '' : 'hidden'}" style="background:#f9f9f9; padding:10px; border-radius:8px;">
                <select id="bank_name" class="admin-input"><option value="Pichincha" ${datos?.pagos?.banco === 'Pichincha' ? 'selected' : ''}>Pichincha</option><option value="Guayaquil" ${datos?.pagos?.banco === 'Guayaquil' ? 'selected' : ''}>Guayaquil</option><option value="Otro">Otro</option></select>
                <input type="text" id="bank_acc" placeholder="Número de cuenta" class="admin-input" value="${datos?.pagos?.n_cuenta || ''}">
                <input type="text" id="bank_titular" placeholder="Nombre Titular" class="admin-input" value="${datos?.pagos?.titular || ''}">
                <input type="text" id="bank_cedula" placeholder="Cédula/RUC" class="admin-input" value="${datos?.pagos?.cedula || ''}">
            </div>
            
            <div class="form-group" style="margin-top:10px;">
                <label><input type="checkbox" id="pay_qr" ${datos?.pagos?.qr ? 'checked' : ''} onchange="document.getElementById('datos_qr').classList.toggle('hidden')"> Pago por QR (Deuna/Otros)</label>
            </div>
            <div id="datos_qr" class="${datos?.pagos?.qr ? '' : 'hidden'}">
                <label>Subir Imagen QR (PC)</label><input type="file" id="prov_qr_file" accept="image/*">
                <input type="hidden" id="prov_qr_actual" value="${datos?.pagos?.qr_url || ''}">
            </div>

            <div class="form-group" style="margin-top:20px;"><label>Foto Portada (PC)</label><input type="file" id="prov_portada_file" accept="image/*"></div>
            <div class="form-group"><label>Video de Parcela (PC)</label><input type="file" id="prov_video_file" accept="video/*"></div>
            
            <input type="hidden" id="reg_coords" value="${datos?.coords || '-0.0469, -78.1453'}">
            <input type="hidden" id="prov_foto_actual" value="${datos?.imagen || ''}">
            <input type="hidden" id="prov_video_actual" value="${datos?.video || ''}">
        `;
        setTimeout(() => inicializarMapaAdmin(datos?.coords), 300);
    }
}

/**
 * PROCESO DE GUARDADO CON MULTIMEDIA
 */
document.getElementById('formRegistro').onsubmit = async function(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;

    const ref = db.ref(seccionActual);
    const idFinal = editandoId || ref.push().key;
    let item = { id: idFinal };

    try {
        if (seccionActual === 'productos') {
            const fImg = document.getElementById('reg_foto_file').files[0];
            const urlImg = fImg ? await subirArchivo(fImg, 'productos') : document.getElementById('reg_foto_actual').value;

            item = { ...item,
                nombre: document.getElementById('reg_nombre').value,
                descripcion: document.getElementById('reg_desc').value,
                precio: parseFloat(document.getElementById('reg_precio').value),
                unidad: document.getElementById('reg_medida').value,
                proveedorId: document.getElementById('reg_prov_id').value,
                imagen: urlImg
            };
        } else if (seccionActual === 'proveedores') {
            const fPort = document.getElementById('prov_portada_file').files[0];
            const fVid = document.getElementById('prov_video_file').files[0];
            const fQr = document.getElementById('prov_qr_file')?.files[0];

            const urlPort = fPort ? await subirArchivo(fPort, 'fincas') : document.getElementById('prov_foto_actual').value;
            const urlVid = fVid ? await subirArchivo(fVid, 'videos') : document.getElementById('prov_video_actual').value;
            const urlQr = fQr ? await subirArchivo(fQr, 'qrs') : document.getElementById('prov_qr_actual')?.value;

            item = { ...item,
                nombre: document.getElementById('prov_nombre').value,
                descripcionCorta: document.getElementById('prov_desc_corta').value,
                historia: document.getElementById('prov_historia').value,
                whatsapp: document.getElementById('prov_ws').value,
                horario: document.getElementById('prov_horario').value,
                coords: document.getElementById('reg_coords').value,
                imagen: urlPort,
                video: urlVid,
                pagos: {
                    transferencia: document.getElementById('pay_trans').checked,
                    banco: document.getElementById('bank_name').value,
                    n_cuenta: document.getElementById('bank_acc').value,
                    titular: document.getElementById('bank_titular').value,
                    cedula: document.getElementById('bank_cedula').value,
                    qr: document.getElementById('pay_qr').checked,
                    qr_url: urlQr || ''
                }
            };
        }

        await db.ref(`${seccionActual}/${idFinal}`).set(item);
        cerrarModal();
        alert("¡Datos sincronizados en Mercado Raíz Cloud!");
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btnSubmit.disabled = false;
    }
};

// ... (Las funciones inicializarMapaAdmin y eliminarRegistro se mantienen similares)