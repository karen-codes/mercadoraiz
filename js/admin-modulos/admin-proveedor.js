/**
 * js/admin-modulos/admin-proveedor.js
 * Gestión de Productores - Mercado Raíz 2026
 */

// EXPOSICIÓN GLOBAL DE FUNCIONES PRINCIPALES
window.initProveedores = function(contenedor, btnContenedor) {
    btnContenedor.innerHTML = `
        <button class="btn-save" onclick="abrirModalProveedor()">
            <i class="fas fa-plus"></i> Nuevo Productor
        </button>
    `;

    contenedor.innerHTML = `
        <div class="admin-card">
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>Foto</th>
                        <th>Nombre / Finca</th>
                        <th>Comunidad</th>
                        <th>WhatsApp</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="lista-proveedores">
                    <tr><td colspan="5" style="text-align:center;">Cargando directorio...</td></tr>
                </tbody>
            </table>
        </div>
    `;
    escucharProveedores();
};

function escucharProveedores() {
    window.db.ref('proveedores').on('value', (snapshot) => {
        const tbody = document.getElementById('lista-proveedores');
        if (!tbody) return;
        tbody.innerHTML = "";

        snapshot.forEach((child) => {
            const p = child.val();
            const id = child.key;
            tbody.innerHTML += `
                <tr>
                    <td><img src="${p.fotoUrl || 'img/avatar-finca.jpg'}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;"></td>
                    <td><strong>${p.nombreParcela}</strong></td>
                    <td>${p.comunidad}</td>
                    <td><i class="fab fa-whatsapp" style="color:#27ae60;"></i> ${p.telefono || 'Sin tel'}</td>
                    <td>
                        <button class="btn-save" style="background:#3498db; padding: 5px 10px;" onclick="window.editarProveedor('${id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-save" style="background:#e74c3c; padding: 5px 10px; margin-left:5px;" onclick="window.eliminarProveedor('${id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });
    });
}

// FUNCIÓN DE ELIMINAR CORREGIDA
window.eliminarProveedor = function(id) {
    if (confirm("¿Estás seguro de eliminar este productor? Sus productos ya no mostrarán origen.")) {
        window.db.ref(`proveedores/${id}`).remove()
            .then(() => alert("Productor eliminado con éxito."))
            .catch(err => alert("Error al eliminar: " + err.message));
    }
};

window.abrirModalProveedor = function() {
    const modal = document.getElementById('modalProveedor');
    if (!modal) return console.error("No se encontró el modalProveedor en el HTML");
    
    modal.classList.remove('hidden');
    document.getElementById('formProveedor').reset();
    document.getElementById('prov-id').value = "";
    document.getElementById('prov-foto-url-actual').value = "";
    document.getElementById('prov-video-url-actual').value = "";
    document.getElementById('prov-coords').value = "-0.1807, -78.4678";
    
    window.inicializarMapa();
};

// MANEJO DEL MAPA
// Dentro de js/admin-modulos/admin-proveedor.js

window.inicializarMapa = function(lat = -0.1807, lng = -78.4678) {
    // Si ya existe un mapa, lo eliminamos para evitar el error "Map container is already initialized"
    if (window.mapaAdmin) {
        window.mapaAdmin.remove();
    }

    // Usamos setTimeout para asegurar que el modal ya sea visible antes de renderizar el mapa
    setTimeout(() => {
        const mapContainer = document.getElementById('mapAdmin');
        if (!mapContainer) return;

        // Crear el mapa
        window.mapaAdmin = L.map('mapAdmin').setView([lat, lng], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(window.mapaAdmin);

        // Crear el marcador ARRASTRABLE
        window.marcadorAdmin = L.marker([lat, lng], { draggable: true }).addTo(window.mapaAdmin);

        // EVENTO CRÍTICO: Actualizar las coordenadas al soltar el marcador
        window.marcadorAdmin.on('dragend', function(e) {
            const posicion = e.target.getLatLng();
            const inputCoords = document.getElementById('prov-coords');
            if (inputCoords) {
                inputCoords.value = `${posicion.lat.toFixed(6)}, ${posicion.lng.toFixed(6)}`;
            }
        });
        
        // Refrescar tamaño para evitar que el mapa salga gris o incompleto
        window.mapaAdmin.invalidateSize();
    }, 400); 
};

// GUARDADO CON VIDEO Y HORARIOS SELECCIONABLES
document.getElementById('formProveedor')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const idExistente = document.getElementById('prov-id').value;
    
    try {
        btn.disabled = true;
        btn.innerText = "Subiendo archivos...";

        // Imagen
        const archivoFoto = document.getElementById('prov-foto').files[0];
        let urlFoto = document.getElementById('prov-foto-url-actual').value;
        if (archivoFoto) urlFoto = await window.subirArchivoNativo(archivoFoto, 'proveedores/fotos');

        // Video
        const archivoVideo = document.getElementById('prov-video').files[0];
        let urlVideo = document.getElementById('prov-video-url-actual').value;
        if (archivoVideo) {
            btn.innerText = "Subiendo video...";
            urlVideo = await window.subirArchivoNativo(archivoVideo, 'proveedores/videos');
        }

        // Horarios (Checkbox + Time)
        const dias = Array.from(document.querySelectorAll('.check-dia:checked')).map(cb => cb.value);
        const horaIni = document.getElementById('hora-inicio').value;
        const horaFin = document.getElementById('hora-fin').value;
        const horarioStr = dias.length > 0 ? `${dias.join(', ')} (${horaIni} - ${horaFin})` : "No definido";

        const objetoProv = {
    nombreParcela: document.getElementById('prov-nombre').value,
    comunidad: document.getElementById('prov-comunidad').value,
    telefono: document.getElementById('prov-tel').value, // Coincide con id="prov-tel"
    dni: document.getElementById('prov-dni').value,
    banco: document.getElementById('prov-banco').value,
    numeroCuenta: document.getElementById('prov-numeroCuenta').value, // CORREGIDO: antes decía prov-num-cta
    historia: document.getElementById('prov-historia').value,
    horarios: horarioStr,
    coordenadas: document.getElementById('prov-coords').value,
    fotoUrl: urlFoto,
    videoUrl: urlVideo,
    timestamp: firebase.database.ServerValue.TIMESTAMP
};

        if (idExistente) {
            await window.db.ref(`proveedores/${idExistente}`).update(objetoProv);
        } else {
            await window.db.ref('proveedores').push(objetoProv);
        }

        window.cerrarModal();
        alert("Productor guardado correctamente.");
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Guardar Productor";
    }
});

// DENTRO DE: window.editarProveedor

window.editarProveedor = async function(id) {
    const snap = await window.db.ref(`proveedores/${id}`).once('value');
    if (!snap.exists()) return;
    const p = snap.val();

    window.abrirModalProveedor();
    
    document.getElementById('prov-id').value = id;
    document.getElementById('prov-nombre').value = p.nombreParcela || "";
    document.getElementById('prov-comunidad').value = p.comunidad || "";
    document.getElementById('prov-tel').value = p.telefono || "";
    document.getElementById('prov-dni').value = p.dni || "";
    document.getElementById('prov-banco').value = p.banco || "";
    document.getElementById('prov-numeroCuenta').value = p.numeroCuenta || ""; // CORREGIDO
    document.getElementById('prov-historia').value = p.historia || "";
    document.getElementById('prov-coords').value = p.coordenadas || "";
    document.getElementById('prov-foto-url-actual').value = p.fotoUrl || "";
    document.getElementById('prov-video-url-actual').value = p.videoUrl || "";

    // Lógica de horarios para desmarcar/marcar checks al editar (Opcional pero recomendado)
    if (p.horarios) {
        document.querySelectorAll('.check-dia').forEach(cb => {
            cb.checked = p.horarios.includes(cb.value);
        });
    }

    const coords = (p.coordenadas || "-0.1807, -78.4678").split(',');
    window.inicializarMapa(parseFloat(coords[0]), parseFloat(coords[1]));
};