/***********************************
 * GESTIÓN ADMINISTRATIVA MAESTRA
 ***********************************/
let seccionActual = 'dashboard';
let mapaAdmin = null;
let marcadorAdmin = null;

// 1. CARGA DINÁMICA DE SECCIONES
function cargarSeccion(seccion) {
    seccionActual = seccion;
    const contenedor = document.getElementById('tabla-contenedor');
    const titulo = document.getElementById('seccion-titulo');
    const btnAccion = document.getElementById('btn-accion-principal');

    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const linkActivo = document.getElementById(`link-${seccion}`);
    if (linkActivo) linkActivo.classList.add('active');

    titulo.innerText = seccion.charAt(0).toUpperCase() + seccion.slice(1);
    
    if(btnAccion) {
        btnAccion.style.display = (seccion === 'productos' || seccion === 'proveedores') ? 'block' : 'none';
        btnAccion.innerHTML = `<i class="fas fa-plus-circle"></i> Nuevo ${seccion === 'productos' ? 'Producto' : 'Proveedor'}`;
    }

    switch(seccion) {
        case 'dashboard': renderizarDashboard(contenedor); break;
        case 'productos': renderizarTablaProductos(contenedor); break;
        case 'proveedores': renderizarTablaProveedores(contenedor); break;
        case 'usuarios': renderizarTablaUsuarios(contenedor); break;
        case 'pedidos': renderizarPedidos(); break; 
        default: contenedor.innerHTML = `<div class="card"><p class="text-muted">Sección "${seccion}" en desarrollo...</p></div>`;
    }
}

// 2. MODAL DINÁMICO ÚNICO
function abrirModal() {
    const modal = document.getElementById('modalRegistro');
    const campos = document.getElementById('camposDinamicos');
    const areaMapa = document.getElementById('mapArea');
    const campoVideo = document.getElementById('campoVideo');
    const areaMultimedia = document.getElementById("areaMultimedia");
    const btnGuardar = document.querySelector(".btn-save");

    modal.style.display = 'flex';
    areaMultimedia.classList.remove("hidden");
    btnGuardar.classList.remove("hidden");

    if (seccionActual === 'productos') {
        document.getElementById('modalTitulo').innerText = 'Nuevo Producto';
        areaMapa.classList.add('hidden');
        campoVideo.classList.add('hidden');
        
        const provs = JSON.parse(localStorage.getItem("proveedores")) || [];
        campos.innerHTML = `
            <div class="form-group"><label>Nombre del Producto</label><input type="text" id="reg_nombre" class="admin-input" required></div>
            <div class="form-group"><label>Descripción</label><textarea id="reg_desc" class="admin-input" rows="2"></textarea></div>
            <div class="form-grid" style="display:flex; gap:10px;">
                <div class="form-group"><label>Precio ($)</label><input type="number" step="0.01" id="reg_precio" class="admin-input" required></div>
                <div class="form-group"><label>Stock (lb/u)</label><input type="number" id="reg_stock" class="admin-input" required></div>
            </div>
            <div class="form-group"><label>Proveedor de la Parcela</label>
                <select id="reg_prov_id" class="admin-input">
                    ${provs.map(pr => `<option value="${pr.id}">${pr.nombre}</option>`).join('')}
                </select>
            </div>`;
    } 
    else if (seccionActual === 'proveedores') {
        document.getElementById('modalTitulo').innerText = 'Registrar Nuevo Productor';
        areaMapa.classList.remove('hidden');
        campoVideo.classList.remove('hidden');
        
        campos.innerHTML = `
            <div class="form-group"><label>Nombre de la Parcela / Hacienda</label><input type="text" id="prov_nombre" class="admin-input" required></div>
            <div class="form-grid" style="display:flex; gap:10px;">
                <div class="form-group"><label>Comunidad</label><input type="text" id="prov_comunidad" class="admin-input" required></div>
                <div class="form-group"><label>WhatsApp</label><input type="number" id="prov_ws" class="admin-input" required placeholder="593..."></div>
            </div>
            <div class="form-group"><label>Horario de Atención</label><input type="text" id="prov_horario" class="admin-input" placeholder="Ej: 08:00 - 17:00"></div>
            <div class="form-group"><label>Productos Disponibles</label><textarea id="prov_productos" class="admin-input" rows="2"></textarea></div>
            <input type="hidden" id="reg_coords">`;
        
        setTimeout(inicializarMapaAdmin, 300);
    }
}

// 3. GESTIÓN DEL MAPA
function inicializarMapaAdmin() {
    if (mapaAdmin) { mapaAdmin.remove(); }
    mapaAdmin = L.map('mapAdmin').setView([-0.0431, -78.1450], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaAdmin);

    mapaAdmin.on('click', function(e) {
        const { lat, lng } = e.latlng;
        if (marcadorAdmin) { marcadorAdmin.setLatLng(e.latlng); } 
        else { marcadorAdmin = L.marker(e.latlng, {draggable: true}).addTo(mapaAdmin); }
        document.getElementById('reg_coords').value = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    });
}

// 4. GUARDADO DINÁMICO
document.getElementById('formRegistro').onsubmit = function(e) {
    e.preventDefault();
    
    if (seccionActual === 'productos') {
        const nuevoProd = {
            id: Date.now(),
            nombre: document.getElementById('reg_nombre').value,
            descripcion: document.getElementById('reg_desc').value,
            precio: parseFloat(document.getElementById('reg_precio').value),
            stock: parseInt(document.getElementById('reg_stock').value),
            proveedorId: parseInt(document.getElementById('reg_prov_id').value),
            imagen: "assets/images/default-prod.jpg"
        };
        let db = JSON.parse(localStorage.getItem("productos")) || [];
        db.push(nuevoProd);
        localStorage.setItem("productos", JSON.stringify(db));
    } 
    else if (seccionActual === 'proveedores') {
        const nuevoProv = {
            id: Date.now(),
            nombre: document.getElementById('prov_nombre').value,
            comunidad: document.getElementById('prov_comunidad').value,
            whatsapp: document.getElementById('prov_ws').value,
            horario: document.getElementById('prov_horario').value,
            productos: document.getElementById('prov_productos').value,
            coords: document.getElementById('reg_coords').value,
            video: document.getElementById('videoInput').value,
            imagen: "assets/images/default-hacienda.jpg"
        };
        let db = JSON.parse(localStorage.getItem("proveedores")) || [];
        db.push(nuevoProv);
        localStorage.setItem("proveedores", JSON.stringify(db));
    }

    alert("Registro guardado correctamente");
    cerrarModal();
    cargarSeccion(seccionActual);
};

/***********************************
 * 5. FUNCIONES DE RENDERIZADO
 ***********************************/

function renderizarTablaProductos(cnt) {
    const productosDB = JSON.parse(localStorage.getItem("productos")) || [];
    cnt.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr><th>Imagen</th><th>Producto</th><th>Stock</th><th>Precio</th><th>Acciones</th></tr>
            </thead>
            <tbody>
                ${productosDB.map(p => `
                    <tr>
                        <td><img src="${p.imagen}" width="40" style="border-radius:5px"></td>
                        <td><strong>${p.nombre}</strong></td>
                        <td><span class="badge ${p.stock < 5 ? 'warning' : ''}">${p.stock}</span></td>
                        <td>$${p.precio.toFixed(2)}</td>
                        <td><button onclick="eliminarRegistro('productos', ${p.id})" class="btn-delete"><i class="fas fa-trash"></i></button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

function renderizarTablaProveedores(cnt) {
    const proveedoresDB = JSON.parse(localStorage.getItem("proveedores")) || [];
    cnt.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr><th>Hacienda</th><th>Comunidad</th><th>WhatsApp</th><th>Acciones</th></tr>
            </thead>
            <tbody>
                ${proveedoresDB.map(prov => `
                    <tr>
                        <td><strong>${prov.nombre}</strong></td>
                        <td>${prov.comunidad}</td>
                        <td><a href="https://wa.me/${prov.whatsapp}" target="_blank">Enlace Directo</a></td>
                        <td><button onclick="eliminarRegistro('proveedores', ${prov.id})" class="btn-delete"><i class="fas fa-trash"></i></button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

function renderizarTablaUsuarios(cnt) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
    cnt.innerHTML = `
        <table class="admin-table">
            <thead><tr><th>Nombre</th><th>Email</th><th>Fecha</th></tr></thead>
            <tbody>
                ${usuarios.map(u => `<tr><td>${u.nombre}</td><td>${u.email}</td><td>${u.fecha || 'Reciente'}</td></tr>`).join('')}
            </tbody>
        </table>`;
}

function renderizarPedidos() {
    const contenedor = document.getElementById("tabla-contenedor");
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    if (pedidos.length === 0) {
        contenedor.innerHTML = `<p class="text-muted">No hay pedidos registrados.</p>`;
        return;
    }
    contenedor.innerHTML = `
        <table class="admin-table">
            <thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
                ${pedidos.map(p => `
                    <tr>
                        <td>#${p.id.toString().slice(-5)}</td>
                        <td>${p.cliente}</td>
                        <td>$${p.total.toFixed(2)}</td>
                        <td><span class="status-badge ${p.estado.toLowerCase()}">${p.estado}</span></td>
                        <td><button class="btn-action view" onclick="verDetallesPedido(${p.id})"><i class="fas fa-eye"></i> Detalles</button></td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

function verDetallesPedido(id) {
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;

    const modal = document.getElementById("modalRegistro");
    const titulo = document.getElementById("modalTitulo");
    const campos = document.getElementById("camposDinamicos");
    
    titulo.innerText = `Pedido #${id.toString().slice(-5)}`;
    campos.innerHTML = `
        <div class="order-details-view">
            <div class="info-grid">
                <p><strong>Cliente:</strong> ${pedido.cliente}</p>
                <p><strong>Estado:</strong> 
                    <select onchange="actualizarEstadoPedido(${pedido.id}, this.value)">
                        <option value="Pendiente" ${pedido.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="Completado" ${pedido.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                    </select>
                </p>
            </div>
            <table class="detail-table" style="width:100%; margin-top:15px;">
                <thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
                <tbody>
                    ${(pedido.items || []).map(item => `
                        <tr><td>${item.nombre}</td><td>${item.cantidad}</td><td>$${(item.precio * item.cantidad).toFixed(2)}</td></tr>
                    `).join('')}
                </tbody>
            </table>
            <h3 style="text-align:right; margin-top:10px;">Total: $${pedido.total.toFixed(2)}</h3>
        </div>`;

    document.getElementById("areaMultimedia").classList.add("hidden");
    document.querySelector(".btn-save").classList.add("hidden");
    modal.style.display = "flex";
}

function actualizarEstadoPedido(id, nuevoEstado) {
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const idx = pedidos.findIndex(p => p.id === id);
    if (idx !== -1) {
        pedidos[idx].estado = nuevoEstado;
        localStorage.setItem('pedidos', JSON.stringify(pedidos));
        renderizarPedidos();
    }
}

function eliminarRegistro(tipo, id) {
    if (confirm("¿Seguro que desea eliminar este registro?")) {
        let db = JSON.parse(localStorage.getItem(tipo));
        db = db.filter(item => item.id !== id);
        localStorage.setItem(tipo, JSON.stringify(db));
        cargarSeccion(tipo);
    }
}

function cerrarModal() {
    document.getElementById('modalRegistro').style.display = 'none';
    if (marcadorAdmin) { marcadorAdmin = null; }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarSeccion('dashboard');
});