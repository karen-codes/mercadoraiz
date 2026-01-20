/**
 * Mercado Raíz - Panel Administrativo 2026
 * Versión Restaurada y Completa
 */

let mapaAdmin = null;
let marcadorAdmin = null;
let seccionActual = 'dashboard';

// 1. GESTIÓN DEL MODAL
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
    
    if (seccionActual === 'proveedores') {
        document.getElementById('seccionMapa').classList.remove('hidden');
        setTimeout(inicializarMapaAdmin, 300);
    } else {
        document.getElementById('seccionMapa').classList.add('hidden');
    }
};

// 2. MAPA
function inicializarMapaAdmin() {
    if (mapaAdmin) return;
    const centro = [0.0431, -78.1453];
    mapaAdmin = L.map('mapAdmin').setView(centro, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaAdmin);

    mapaAdmin.on('click', function(e) {
        const { lat, lng } = e.latlng;
        document.getElementById('coordsInput').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (marcadorAdmin) marcadorAdmin.setLatLng(e.latlng);
        else marcadorAdmin = L.marker(e.latlng).addTo(mapaAdmin);
    });
}

// 3. NAVEGACIÓN COMPLETA
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
    } else if (seccion === 'productos') {
        titulo.innerText = "Gestión de Productos";
        contenedor.innerHTML = '<p class="p-4">Cargando inventario...</p>';
    } else if (seccion === 'pedidos') {
        titulo.innerText = "Control de Pedidos";
        contenedor.innerHTML = '<p class="p-4">Cargando pedidos pendientes...</p>';
    } else if (seccion === 'mensajeria') {
        titulo.innerText = "Mensajería Directa";
        contenedor.innerHTML = '<p class="p-4">Bandeja de entrada vacía.</p>';
    }
};

// 4. GUARDADO DE TODOS LOS CAMPOS + MULTIMEDIA
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGuardar');
    const originalText = btn.innerText;
    
    try {
        btn.disabled = true;
        btn.innerText = "Subiendo Archivos...";

        // Procesar Archivos Locales
        const fQR = document.getElementById('inputQR')?.files[0];
        const fPort = document.getElementById('inputPortada')?.files[0];
        const fVid = document.getElementById('inputVideo')?.files[0];

        let urlQR = fQR ? await subirArchivo(fQR, 'qrs') : "";
        let urlPort = fPort ? await subirArchivo(fPort, 'portadas') : "";
        let urlVid = fVid ? await subirArchivo(fVid, 'videos') : "";

        // Capturar todos los campos automáticamente
        const formData = new FormData(e.target);
        const datos = Object.fromEntries(formData.entries());

        const registroFinal = {
            ...datos,
            urlQR: urlQR || datos.urlQR || "",
            urlPortada: urlPort || datos.urlPortada || "",
            urlVideo: urlVid || datos.urlVideo || "",
            fecha: Date.now()
        };

        const rama = seccionActual === 'proveedores' ? 'proveedores' : 'productos';
        await firebase.database().ref(`${rama}/${Date.now()}`).set(registroFinal);

        alert("¡Datos y ubicación guardados con éxito!");
        cerrarModal();
        cargarSeccion(seccionActual);

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
});

async function subirArchivo(file, folder) {
    const ref = firebase.storage().ref().child(`${folder}/${Date.now()}_${file.name}`);
    const snap = await ref.put(file);
    return await snap.ref.getDownloadURL();
}

// 5. RENDERIZADO DE TABLA PROVEEDORES
window.renderizarTablaProveedores = function(cont) {
    cont.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Parcela</th>
                    <th>WhatsApp</th>
                    <th>Estado Mapa</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="lista-items"></tbody>
        </table>
    `;

    firebase.database().ref('proveedores').on('value', (snapshot) => {
        const tbody = document.getElementById('lista-items');
        if(!tbody) return;
        tbody.innerHTML = "";
        const datos = snapshot.val();
        if(datos) {
            Object.entries(datos).forEach(([id, p]) => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${p.nombreParcela}</strong></td>
                        <td>${p.whatsapp}</td>
                        <td>${p.ubicacion ? '📍 OK' : '❌ Pendiente'}</td>
                        <td><button class="btn-editar">Editar</button></td>
                    </tr>
                `;
            });
        }
    });
};

document.addEventListener('DOMContentLoaded', () => cargarSeccion('dashboard'));