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
            // Dentro del switch(seccion) de cargarSeccion:
        case 'mensajes':
            titulo.innerText = "Bandeja de Mensajes y Consultas";
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


window.renderizarTablaPedidos = function(cont) {
    cont.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Orden</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Comprobante</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="lista-pedidos"></tbody>
        </table>
    `;

    firebase.database().ref('pedidos').on('value', (snapshot) => {
        const tbody = document.getElementById('lista-pedidos');
        if(!tbody) return;
        tbody.innerHTML = "";

        if(!snapshot.exists()) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No hay pedidos registrados aún.</td></tr>";
            return;
        }

        snapshot.forEach(child => {
            const p = child.val();
            const colorEstado = p.estado === 'Pagado' ? '#2ecc71' : '#f1c40f';
            
            tbody.innerHTML += `
                <tr>
                    <td><small>#${child.key.substring(0,6)}</small></td>
                    <td><strong>${p.clienteNombre}</strong><br><small>${p.clienteTelefono}</small></td>
                    <td><strong>$${p.total.toFixed(2)}</strong></td>
                    <td>
                        <a href="${p.comprobanteUrl}" target="_blank">
                            <img src="${p.comprobanteUrl}" style="width:50px; height:50px; object-fit:cover; border-radius:5px; border:1px solid #ddd;">
                        </a>
                    </td>
                    <td>
                        <span class="tag-cat" style="background:${colorEstado}; color:white;">${p.estado || 'Pendiente'}</span>
                    </td>
                    <td>
                        <button onclick="cambiarEstadoPedido('${child.key}', 'Pagado')" class="btn-editar" style="background:#2ecc71; color:white;" title="Marcar como Pagado">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="eliminarPedido('${child.key}')" class="btn-editar" style="background:#e74c3c; color:white;" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });
    });
};

// --- FUNCIONES DE GESTIÓN DE PEDIDOS ---
window.cambiarEstadoPedido = function(id, nuevoEstado) {
    firebase.database().ref(`pedidos/${id}`).update({ estado: nuevoEstado })
        .then(() => alert("Pedido actualizado: " + nuevoEstado))
        .catch(e => alert("Error: " + e.message));
};

window.eliminarPedido = function(id) {
    if(confirm("¿Seguro que deseas eliminar este registro de pedido?")) {
        firebase.database().ref(`pedidos/${id}`).remove();
    }
};

window.renderizarTablaMensajes = function(cont) {
    cont.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>WhatsApp</th>
                    <th>Mensaje</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="lista-mensajes"></tbody>
        </table>
    `;

    firebase.database().ref('contactos').on('value', (snapshot) => {
        const tbody = document.getElementById('lista-mensajes');
        if(!tbody) return;
        tbody.innerHTML = "";
        
        if(!snapshot.exists()) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No hay mensajes nuevos.</td></tr>";
            return;
        }

        snapshot.forEach(child => {
            const m = child.val();
            const fecha = m.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'S/F';
            
            tbody.innerHTML += `
                <tr>
                    <td>${fecha}</td>
                    <td><strong>${m.nombre || 'Anónimo'}</strong><br><small>${m.email || ''}</small></td>
                    <td><a href="https://wa.me/${m.telefono}" target="_blank" class="tag-cat" style="background:#25D366; color:white; text-decoration:none;">
                        <i class="fab fa-whatsapp"></i> Chat
                    </a></td>
                    <td style="max-width:300px; font-size:0.85rem;">${m.mensaje}</td>
                    <td>
                        <button onclick="eliminarMensaje('${child.key}')" class="btn-editar" style="background:#ff4757;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });
    });
};

// Función para limpiar la bandeja
window.eliminarMensaje = function(id) {
    if(confirm("¿Marcar como leído y eliminar mensaje?")) {
        firebase.database().ref(`contactos/${id}`).remove()
            .then(() => alert("Mensaje gestionado."))
            .catch(e => alert("Error: " + e.message));
    }
};


window.renderizarTablaClientes = function(cont) {
    cont.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Ubicación</th>
                    <th>Fecha Registro</th>
                </tr>
            </thead>
            <tbody id="lista-clientes-db">
                <tr><td colspan="5" style="text-align:center;">Cargando clientes...</td></tr>
            </tbody>
        </table>
    `;

    firebase.database().ref('usuarios').on('value', (snapshot) => {
        const tbody = document.getElementById('lista-clientes-db');
        if(!tbody) return;
        
        if(!snapshot.exists()) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No hay clientes registrados aún.</td></tr>";
            return;
        }

        tbody.innerHTML = "";
        snapshot.forEach(child => {
            const u = child.val();
            const fecha = u.timestamp ? new Date(u.timestamp).toLocaleDateString() : '---';
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${u.nombre || 'Sin nombre'}</strong></td>
                    <td>${u.email || '---'}</td>
                    <td>${u.telefono || '---'}</td>
                    <td><small>${u.direccion || 'No especificada'}</small></td>
                    <td>${fecha}</td>
                </tr>`;
        });
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
            categoria: datos['prod-categoria'],
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