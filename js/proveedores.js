/**
 * js/proveedores.js - Gestión de Productores (Panel Administrativo)
 */

// 1. RENDERIZAR TABLA DE PROVEEDORES
window.renderizarTablaProveedores = function(contenedor) {
    if (!contenedor) return;

    // Escuchar en tiempo real
    firebase.database().ref('proveedores').on('value', (snapshot) => {
        const data = snapshot.val();
        let htmlRows = '';

        if (data) {
            Object.keys(data).forEach(key => {
                const p = data[key];
                htmlRows += `
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <img src="${p.urlFotoPerfil || 'assets/images/default-finca.jpg'}" style="width:40px; height:40px; border-radius:5px; object-fit:cover;">
                                <strong>${p.nombreParcela}</strong>
                            </div>
                        </td>
                        <td>${p.comunidad}</td>
                        <td>${p.telefono}</td>
                        <td style="text-align:right;">
                            <button class="btn-editar" onclick="abrirModalProveedor('${key}')" style="background:#f3f4f6; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button onclick="eliminarProveedor('${key}')" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-left:10px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>`;
            });
        } else {
            htmlRows = '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay productores registrados.</td></tr>';
        }

        contenedor.innerHTML = `
            <div class="admin-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3><i class="fas fa-tractor"></i> Directorio de Parcelas</h3>
                    <button onclick="abrirModalProveedor()" class="btn-primary" style="background:var(--admin-primary); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;">
                        + Nuevo Productor
                    </button>
                </div>
                <table class="admin-table" style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="text-align:left; border-bottom:1px solid #eee;">
                            <th style="padding:10px;">Nombre Parcela</th>
                            <th style="padding:10px;">Comunidad</th>
                            <th style="padding:10px;">Contacto</th>
                            <th style="padding:10px; text-align:right;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${htmlRows}</tbody>
                </table>
            </div>`;
    });
};

// 2. GUARDAR / ACTUALIZAR PROVEEDOR
window.guardarProveedor = async function() {
    const id = document.getElementById('prov-id').value;
    const btn = document.getElementById('btn-guardar-prov');
    
    // Captura de archivos
    const fotoFile = document.getElementById('prov-foto').files[0];
    const videoFile = document.getElementById('prov-video').files[0];

    btn.disabled = true;
    btn.innerText = "Subiendo multimedia...";

    try {
        let urlFoto = document.getElementById('prov-foto-url-actual').value;
        let urlVideo = document.getElementById('prov-video-url-actual').value;

        // Subida de archivos a Storage (usando funciones de data.js)
        if (fotoFile) urlFoto = await subirArchivoNativo(fotoFile, 'fincas');
        if (videoFile) urlVideo = await subirArchivoNativo(videoFile, 'videos');

        const datos = {
            nombreParcela: document.getElementById('prov-nombre').value,
            comunidad: document.getElementById('prov-comunidad').value,
            descripcionCorta: document.getElementById('prov-desc').value,
            nuestraHistoria: document.getElementById('prov-historia').value,
            horarioAtencion: document.getElementById('prov-horario').value,
            telefono: document.getElementById('prov-tel').value,
            coordenadas: document.getElementById('prov-coords').value,
            urlFotoPerfil: urlFoto,
            urlVideo: urlVideo,
            pagos: {
                transferencia: {
                    banco: document.getElementById('prov-banco').value,
                    tipoCuenta: document.getElementById('prov-tipo-cta').value,
                    numeroCuenta: document.getElementById('prov-num-cta').value,
                    identificacion: document.getElementById('prov-dni').value
                }
            }
        };

        if (id) {
            await firebase.database().ref(`proveedores/${id}`).update(datos);
        } else {
            await firebase.database().ref('proveedores').push(datos);
        }

        cerrarModal();
        alert("Productor guardado correctamente.");
    } catch (e) {
        alert("Error al guardar: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Guardar Productor";
    }
};

// 3. ELIMINAR PROVEEDOR
window.eliminarProveedor = async function(id) {
    if (confirm("¿Eliminar este productor? Se perderán todos sus datos y productos asociados.")) {
        await firebase.database().ref(`proveedores/${id}`).remove();
    }
};