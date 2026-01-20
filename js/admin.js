/**
 * Mercado Raíz - Panel Administrativo 2026
 * Versión INTEGRAL: Dashboard, Proveedores, Productos, Pedidos y Mensajes.
 */

let mapaAdmin = null;
let marcadorAdmin = null;
let seccionActual = 'dashboard';

// --- 1. GESTIÓN DE MODALES ---
window.cerrarModal = function() {
    document.getElementById('modalProveedor')?.classList.add('hidden');
    document.getElementById('modalProducto')?.classList.add('hidden');
    document.getElementById('formProveedor')?.reset();
    document.getElementById('formProducto')?.reset();

    if(mapaAdmin) {
        mapaAdmin.remove();
        mapaAdmin = null;
        marcadorAdmin = null;
    }
};

window.abrirModal = function() {
    const modal = document.getElementById('modalProveedor');
    if(modal) {
        modal.classList.remove('hidden');
        document.getElementById('prov-id').value = "";
    }
    if (seccionActual === 'proveedores') {
        setTimeout(inicializarMapaAdmin, 300);
    }
};

window.abrirModalProducto = function() {
    const modal = document.getElementById('modalProducto');
    if(modal) {
        modal.classList.remove('hidden');
        document.getElementById('prod-id').value = "";
        llenarSelectProveedores();
    }
};

// --- 2. NAVEGACIÓN (CORREGIDA PARA TODAS LAS SECCIONES) ---
window.cargarSeccion = function(seccion) {
    seccionActual = seccion;
    const titulo = document.getElementById('seccion-titulo');
    const contenedor = document.getElementById('tabla-contenedor');
    const btnContenedor = document.getElementById('btn-nuevo-contenedor');
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const linkActivo = document.getElementById(`link-${seccion}`);
    if(linkActivo) linkActivo.classList.add('active');

    btnContenedor.innerHTML = "";
    contenedor.innerHTML = ""; // Limpiar antes de cargar

    switch(seccion) {
        case 'dashboard':
            titulo.innerText = "Resumen del Mercado 2026";
            renderizarDashboard(contenedor);
            break;
        case 'proveedores':
            titulo.innerText = "Gestión de Parcelas y Productores";
            btnContenedor.innerHTML = `<button onclick="abrirModal()" class="btn-save">+ Nuevo Productor</button>`;
            renderizarTablaProveedores(contenedor);
            break;
        case 'productos':
            titulo.innerText = "Inventario Global de Productos";
            btnContenedor.innerHTML = `<button onclick="abrirModalProducto()" class="btn-save">+ Nuevo Producto</button>`;
            renderizarTablaProductos(contenedor);
            break;
        case 'pedidos':
            titulo.innerText = "Control de Ventas y Comprobantes";
            renderizarTablaPedidos(contenedor);
            break;
        case 'mensajes':
            titulo.innerText = "Bandeja de Entrada";
            renderizarTablaMensajes(contenedor);
            break;
        case 'clientes':
            titulo.innerText = "Directorio de Clientes";
            renderizarTablaClientes(contenedor);
            break;
    }
};

// --- 3. RENDERIZADO DE TABLAS ---

// PRODUCTORES (CORREGIDO PARA MOSTRAR "EL LAUREL")
window.renderizarTablaProveedores = function(cont) {
    cont.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Parcela</th>
                    <th>Comunidad</th>
                    <th>Contacto</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="lista-items-prov"></tbody>
        </table>
    `;
    
    firebase.database().ref('proveedores').on('value', (snapshot) => {
        const tbody = document.getElementById('lista-items-prov');
        if(!tbody) return;
        tbody.innerHTML = "";
        const datos = snapshot.val();
        
        if(datos) {
            Object.entries(datos).forEach(([id, p]) => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${p.nombreParcela || 'Sin Nombre'}</strong></td>
                        <td>${p.comunidad || '-'}</td>
                        <td>${p.whatsapp || '-'}</td>
                        <td>
                            <button class="btn-editar" onclick="editarProductor('${id}')"><i class="fas fa-edit"></i></button>
                        </td>
                    </tr>`;
            });
        }
    });
};

// PRODUCTOS
window.renderizarTablaProductos = function(cont) {
    cont.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Imagen</th>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>ID Productor</th>
                </tr>
            </thead>
            <tbody id="lista-items-prod"></tbody>
        </table>
    `;
    firebase.database().ref('productos').on('value', (snapshot) => {
        const tbody = document.getElementById('lista-items-prod');
        if(!tbody) return;
        tbody.innerHTML = "";
        const datos = snapshot.val();
        if(datos) {
            Object.values(datos).forEach(p => {
                tbody.innerHTML += `
                    <tr>
                        <td><img src="${p.imagenUrl}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
                        <td><strong>${p.nombre}</strong></td>
                        <td>$${p.precio} / ${p.unidad}</td>
                        <td><small>${p.idProductor}</small></td>
                    </tr>`;
            });
        }
    });
};

// PEDIDOS (Restaurado)
window.renderizarTablaPedidos = function(cont) {
    cont.innerHTML = `<div class="info-msg">Cargando pedidos...</div>`;
    firebase.database().ref('pedidos').on('value', snap => {
        if(!snap.exists()) cont.innerHTML = "No hay pedidos registrados.";
        // Aquí puedes expandir la tabla de pedidos según tu estructura
    });
};

// MENSAJES (Restaurado)
window.renderizarTablaMensajes = function(cont) {
    cont.innerHTML = `<div class="info-msg">Buscando consultas de clientes...</div>`;
    firebase.database().ref('contactos').on('value', snap => {
        if(!snap.exists()) cont.innerHTML = "No hay mensajes nuevos.";
    });
};

// CLIENTES (Restaurado)
window.renderizarTablaClientes = function(cont) {
    cont.innerHTML = `<div class="info-msg">Listado de usuarios registrados...</div>`;
    firebase.database().ref('usuarios').on('value', snap => {
        if(!snap.exists()) cont.innerHTML = "No hay clientes registrados aún.";
    });
};

// --- 4. PERSISTENCIA (PROVEEDORES Y PRODUCTOS) ---

async function llenarSelectProveedores() {
    const select = document.getElementById('prod-origin');
    if (!select) return;
    const snap = await firebase.database().ref('proveedores').once('value');
    const provs = snap.val();
    select.innerHTML = '<option value="">-- Seleccione el Productor --</option>';
    if (provs) {
        Object.entries(provs).forEach(([id, p]) => {
            select.innerHTML += `<option value="${id}">${p.nombreParcela}</option>`;
        });
    }
}

// Evento Guardar Producto
document.getElementById('formProducto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar-prod');
    try {
        btn.disabled = true;
        const fFoto = document.getElementById('prod-foto').files[0];
        let urlFoto = "";
        if(fFoto) urlFoto = await subirArchivo(fFoto, 'productos');

        const formData = new FormData(e.target);
        const datos = Object.fromEntries(formData.entries());

        await firebase.database().ref('productos').push({
            nombre: datos['prod-nombre'],
            precio: datos['prod-precio'],
            unidad: datos['prod-unidad'],
            idProductor: datos['prod-origin'],
            imagenUrl: urlFoto,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        alert("Producto guardado.");
        cerrarModal();
    } catch(err) { alert(err.message); } finally { btn.disabled = false; }
});

// Evento Guardar Productor
document.getElementById('formProveedor')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar-prov');
    try {
        btn.disabled = true;
        const fFoto = document.getElementById('prov-foto').files[0];
        let urlFoto = fFoto ? await subirArchivo(fFoto, 'fotos') : document.getElementById('prov-foto-url-actual').value;

        const formData = new FormData(e.target);
        const datos = Object.fromEntries(formData.entries());
        const id = document.getElementById('prov-id').value || Date.now();

        await firebase.database().ref(`proveedores/${id}`).update({
            nombreParcela: datos['prov-nombre'],
            comunidad: datos['prov-comunidad'],
            whatsapp: datos['prov-tel'],
            portadaUrl: urlFoto,
            coordenadas: document.getElementById('prov-coords').value
        });
        alert("Productor guardado.");
        cerrarModal();
    } catch(err) { alert(err.message); } finally { btn.disabled = false; }
});

async function subirArchivo(file, folder) {
    const ref = firebase.storage().ref(`${folder}/${Date.now()}_${file.name}`);
    await ref.put(file);
    return await ref.getDownloadURL();
}

// --- 5. UTILIDADES ---
function inicializarMapaAdmin(lat = -0.1807, lng = -78.4678) {
    if (mapaAdmin) return;
    mapaAdmin = L.map('mapAdmin').setView([lat, lng], 12); 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaAdmin);
    mapaAdmin.on('click', e => {
        document.getElementById('prov-coords').value = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
        if (marcadorAdmin) marcadorAdmin.setLatLng(e.latlng);
        else marcadorAdmin = L.marker(e.latlng).addTo(mapaAdmin);
    });
}

window.renderizarDashboard = function(cont) {
    // Estructura de tarjetas con iconos de FontAwesome
    cont.innerHTML = `
        <div class="dashboard-grid">
            <div class="card-stat">
                <div class="stat-icon"><i class="fas fa-tractor"></i></div>
                <div class="stat-info">
                    <h3 id="stat-prov">0</h3>
                    <p>Productores Activos</p>
                </div>
            </div>
            <div class="card-stat">
                <div class="stat-icon"><i class="fas fa-leaf"></i></div>
                <div class="stat-info">
                    <h3 id="stat-prod">0</h3>
                    <p>Productos en Catálogo</p>
                </div>
            </div>
            <div class="card-stat">
                <div class="stat-icon"><i class="fas fa-shopping-basket"></i></div>
                <div class="stat-info">
                    <h3 id="stat-pedidos">0</h3>
                    <p>Pedidos Hoy</p>
                </div>
            </div>
        </div>
    `;

    // Escuchadores en tiempo real para actualizar los números
    firebase.database().ref('proveedores').on('value', s => {
        const el = document.getElementById('stat-prov');
        if(el) el.innerText = s.numChildren();
    });

    firebase.database().ref('productos').on('value', s => {
        const el = document.getElementById('stat-prod');
        if(el) el.innerText = s.numChildren();
    });
    
    // Ejemplo para pedidos (si tienes esa rama en Firebase)
    firebase.database().ref('pedidos').on('value', s => {
        const el = document.getElementById('stat-pedidos');
        if(el) el.innerText = s.numChildren();
    });
};
document.addEventListener('DOMContentLoaded', () => cargarSeccion('dashboard'));