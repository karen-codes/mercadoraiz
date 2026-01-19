/**
 * Mercado Raíz - Panel Administrativo 2026
 * Gestión de Productores, Mapas y Multimedia
 */

let mapaAdmin = null;
let marcadorAdmin = null;
let seccionActual = 'dashboard';

// 1. GESTIÓN DEL MODAL Y UI
window.cerrarModal = function() {
    document.getElementById('modalRegistro').classList.add('hidden');
    document.getElementById('formRegistro').reset();
    if(mapaAdmin) {
        mapaAdmin.remove();
        mapaAdmin = null;
        marcadorAdmin = null;
    }
};

window.abrirModal = function() {
    const modal = document.getElementById('modalRegistro');
    modal.classList.remove('hidden');
    
    // Si estamos en proveedores, habilitar mapa para geolocalización
    if (seccionActual === 'proveedores') {
        document.getElementById('seccionMapa').classList.remove('hidden');
        setTimeout(inicializarMapaAdmin, 300);
    } else {
        document.getElementById('seccionMapa').classList.add('hidden');
    }
};

// 2. CONFIGURACIÓN DEL MAPA (LEAFLET)
function inicializarMapaAdmin() {
    if (mapaAdmin) return;

    // Coordenadas iniciales: Cayambe, Ecuador
    const centro = [0.0431, -78.1453];
    mapaAdmin = L.map('mapAdmin').setView(centro, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapaAdmin);

    // Capturar ubicación al hacer clic
    mapaAdmin.on('click', function(e) {
        const { lat, lng } = e.latlng;
        document.getElementById('coordsInput').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        if (marcadorAdmin) {
            marcadorAdmin.setLatLng(e.latlng);
        } else {
            marcadorAdmin = L.marker(e.latlng).addTo(mapaAdmin);
        }
    });
}

// 3. LOGICA DE NAVEGACIÓN
window.cargarSeccion = function(seccion) {
    seccionActual = seccion;
    const titulo = document.getElementById('seccion-titulo');
    const contenedor = document.getElementById('tabla-contenedor');
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(`link-${seccion}`)?.classList.add('active');

    if (seccion === 'dashboard') {
        titulo.innerText = "Panel de Control";
        if (typeof renderizarDashboard === "function") renderizarDashboard(contenedor);
    } else if (seccion === 'proveedores') {
        titulo.innerText = "Gestión de Productores";
        renderizarTablaProveedores(contenedor);
    }
};

// 4. GUARDADO DE DATOS Y SUBIDA MULTIMEDIA (QR, FOTOS, VIDEOS)
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnGuardar = e.target.querySelector('button[type="submit"]');
    const originalText = btnGuardar.innerText;
    
    try {
        btnGuardar.disabled = true;
        btnGuardar.innerText = "Procesando y Subiendo...";

        // Capturar archivos multimedia
        const fileQR = e.target.querySelector('input[id*="QR"]')?.files[0];
        const filePortada = e.target.querySelector('input[id*="Portada"]')?.files[0];
        const fileVideo = e.target.querySelector('input[id*="Video"]')?.files[0]; // Videos desde PC

        let urlQR = "";
        let urlPortada = "";
        let urlVideo = "";

        // Subir a Firebase Storage si existen archivos nuevos
        if (fileQR) urlQR = await subirArchivo(fileQR, 'comprobantes_qr');
        if (filePortada) urlPortada = await subirArchivo(filePortada, 'portadas');
        if (fileVideo) urlVideo = await subirArchivo(fileVideo, 'videos_parcelas');

        const formData = new FormData(e.target);
        const datosBase = Object.fromEntries(formData.entries());

        // Consolidar objeto final
        const nuevoRegistro = {
            ...datosBase,
            ubicacion: document.getElementById('coordsInput').value || "", // Desde el mapa
            urlQR: urlQR || datosBase.urlQR || "", // Para validación de pago
            urlPortada: urlPortada || datosBase.urlPortada || "",
            urlVideo: urlVideo || datosBase.urlVideo || "", // Archivo local, no YouTube
            fechaActualizacion: firebase.database.ServerValue.TIMESTAMP
        };

        const rama = seccionActual === 'proveedores' ? 'proveedores' : 'productos';
        const idRegistro = datosBase.id || firebase.database().ref(rama).push().key;

        await firebase.database().ref(`${rama}/${idRegistro}`).update(nuevoRegistro);

        alert("¡Registro actualizado exitosamente!");
        cerrarModal();
        cargarSeccion(seccionActual);

    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Ocurrió un error al guardar los cambios: " + error.message);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerText = originalText;
    }
});

/**
 * Función auxiliar para subir archivos al Storage
 */
async function subirArchivo(file, folder) {
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(`${folder}/${Date.now()}_${file.name}`);
    const snapshot = await fileRef.put(file);
    return await snapshot.ref.getDownloadURL();
}

// 5. RENDERIZADO DE TABLAS
window.renderizarTablaProveedores = function(cont) {
    cont.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Parcela</th>
                    <th>WhatsApp</th>
                    <th>Ubicación</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="lista-items">
                <tr><td colspan="4" style="text-align:center;">Sincronizando con la nube...</td></tr>
            </tbody>
        </table>
    `;

    // Escuchar cambios en tiempo real desde Firebase
    firebase.database().ref('proveedores').on('value', (snapshot) => {
        const datos = snapshot.val();
        const tbody = document.getElementById('lista-items');
        tbody.innerHTML = "";

        if (datos) {
            Object.entries(datos).forEach(([id, prov]) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${prov.nombreParcela || 'Sin Nombre'}</strong></td>
                    <td>${prov.whatsapp || 'N/A'}</td>
                    <td>${prov.ubicacion ? '<i class="fas fa-map-marker-alt" style="color:red"></i> Registrada' : 'No marcada'}</td>
                    <td>
                        <button class="btn-editar" onclick="editarProveedor('${id}')">Editar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay proveedores registrados.</td></tr>`;
        }
    });
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarSeccion('dashboard');
});