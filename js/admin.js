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

    // Actualizar estado visual del menú lateral
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const linkActivo = document.getElementById(`link-${seccion}`);
    if (linkActivo) linkActivo.classList.add('active');

    // Mapeo de nombres elegantes
    const titulosMap = {
        'dashboard': 'Dashboard de Alcance',
        'productos': 'Inventario de Productos',
        'proveedores': 'Red de Proveedores',
        'usuarios': 'Base de Clientes',
        'pedidos': 'Gestión de Pedidos y Pagos',
        'mensajes': 'Bandeja de Mensajería'
    };

    titulo.innerText = titulosMap[seccion] || seccion.charAt(0).toUpperCase() + seccion.slice(1);
    
    // Configuración del botón "+" (Solo en productos y proveedores)
    if(btnAccion) {
        const esEditable = (seccion === 'productos' || seccion === 'proveedores');
        btnAccion.style.display = esEditable ? 'inline-flex' : 'none';
        if(esEditable) {
            btnAccion.innerHTML = `<i class="fas fa-plus-circle"></i> Nuevo ${seccion === 'productos' ? 'Producto' : 'Proveedor'}`;
        }
    }

    contenedor.innerHTML = ''; 

    switch(seccion) {
        case 'dashboard': 
            if (typeof renderizarDashboard === 'function') {
                renderizarDashboard(contenedor); 
            } else {
                mostrarAvisoDesarrollo(contenedor, "Dashboard");
            }
            break;
            
        case 'productos': 
            renderizarTablaProductos(contenedor);
            break;

        case 'proveedores': 
            renderizarTablaProveedores(contenedor);
            break;

        case 'usuarios': 
            renderizarTablaUsuarios(contenedor);
            break;

        case 'pedidos': 
            renderizarPedidos(); // Esta función interna usa su propio selector
            break;

        case 'mensajes': 
            if (typeof renderizarTablaMensajes === 'function') {
                renderizarTablaMensajes(contenedor);
            } else {
                mostrarAvisoDesarrollo(contenedor, "Mensajería");
            }
            break;
            
        default: 
            mostrarAvisoDesarrollo(contenedor, seccion);
    }
}

/** Aviso de Construcción */
function mostrarAvisoDesarrollo(cont, nombre) {
    cont.innerHTML = `
        <div class="admin-card" style="text-align: center; padding: 4rem 2rem;">
            <div style="font-size: 4rem; color: var(--admin-soft); margin-bottom: 1rem;">
                <i class="fas fa-tools"></i>
            </div>
            <h2 style="color: var(--admin-text);">Sección "${nombre}"</h2>
            <p style="color: #666; max-width: 400px; margin: 0 auto;">Estamos preparando el sistema para esta área.</p>
        </div>
    `;
}

// 2. MODAL DINÁMICO ÚNICO (Corregido y Unificado)
function abrirModal() {
    const modal = document.getElementById('modalRegistro');
    const campos = document.getElementById('camposDinamicos');
    const areaMapa = document.getElementById('mapArea');
    const areaMultimedia = document.getElementById("areaMultimedia");
    const btnGuardar = document.querySelector(".btn-save") || document.querySelector("button[type='submit']");

    if(!modal) return;
    
    modal.style.display = 'flex';
    if(areaMultimedia) areaMultimedia.classList.remove("hidden");
    if(btnGuardar) btnGuardar.classList.remove("hidden");

    if (seccionActual === 'productos') {
        document.getElementById('modalTitulo').innerText = 'Nuevo Producto';
        if(areaMapa) areaMapa.classList.add('hidden');
        
        const provs = JSON.parse(localStorage.getItem("proveedores")) || [];
        campos.innerHTML = `
            <div class="form-group"><label>Nombre del Producto</label><input type="text" id="reg_nombre" class="admin-input" required></div>
            <div class="form-group"><label>Descripción</label><textarea id="reg_desc" class="admin-input" rows="2"></textarea></div>
            <div class="form-grid" style="display:flex; gap:10px;">
                <div class="form-group" style="flex:1;"><label>Precio ($)</label><input type="number" step="0.01" id="reg_precio" class="admin-input" required></div>
                <div class="form-group" style="flex:1;"><label>Stock (lb/u)</label><input type="number" id="reg_stock" class="admin-input" required></div>
            </div>
            <div class="form-group"><label>Proveedor</label>
                <select id="reg_prov_id" class="admin-input">
                    ${provs.map(pr => `<option value="${pr.id}">${pr.nombre}</option>`).join('')}
                </select>
            </div>`;
    } 
    else if (seccionActual === 'proveedores') {
        document.getElementById('modalTitulo').innerText = 'Registrar Productor';
        if(areaMapa) areaMapa.classList.remove('hidden');
        
        campos.innerHTML = `
            <div class="form-group"><label>Nombre de la Parcela</label><input type="text" id="prov_nombre" class="admin-input" required></div>
            <div class="form-grid" style="display:flex; gap:10px;">
                <div class="form-group" style="flex:1;"><label>Comunidad</label><input type="text" id="prov_comunidad" class="admin-input" required></div>
                <div class="form-group" style="flex:1;"><label>WhatsApp</label><input type="number" id="prov_ws" class="admin-input" required></div>
            </div>
            <div class="form-group"><label>Horario</label><input type="text" id="prov_horario" class="admin-input"></div>
            <input type="hidden" id="reg_coords">`;
        
        setTimeout(inicializarMapaAdmin, 300);
    }
}

// 3. MAPA Y GUARDADO (Tus funciones originales optimizadas)
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
            coords: document.getElementById('reg_coords').value,
            imagen: "assets/images/default-hacienda.jpg"
        };
        let db = JSON.parse(localStorage.getItem("proveedores")) || [];
        db.push(nuevoProv);
        localStorage.setItem("proveedores", JSON.stringify(db));
    }
    alert("Guardado con éxito");
    cerrarModal();
    cargarSeccion(seccionActual);
};

/***********************************
 * 4. RENDERIZADO DE TABLAS
 ***********************************/

function renderizarTablaProductos(cnt) {
    const productosDB = JSON.parse(localStorage.getItem("productos")) || [];
    cnt.innerHTML = `
        <div class="admin-card">
            <table class="admin-table">
                <thead>
                    <tr><th>Imagen</th><th>Producto</th><th>Stock</th><th>Precio</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${productosDB.map(p => `
                        <tr>
                            <td><img src="${p.imagen}" width="40" height="40" style="object-fit:cover; border-radius:5px"></td>
                            <td><strong>${p.nombre}</strong></td>
                            <td><span class="badge ${p.stock < 5 ? 'warning' : ''}">${p.stock}</span></td>
                            <td>$${p.precio.toFixed(2)}</td>
                            <td><button onclick="eliminarRegistro('productos', ${p.id})" class="btn-delete"><i class="fas fa-trash"></i></button></td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderizarTablaProveedores(cnt) {
    const proveedoresDB = JSON.parse(localStorage.getItem("proveedores")) || [];
    cnt.innerHTML = `
        <div class="admin-card">
            <table class="admin-table">
                <thead><tr><th>Hacienda</th><th>Comunidad</th><th>WhatsApp</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${proveedoresDB.map(prov => `
                        <tr>
                            <td><strong>${prov.nombre}</strong></td>
                            <td>${prov.comunidad}</td>
                            <td>${prov.whatsapp}</td>
                            <td><button onclick="eliminarRegistro('proveedores', ${prov.id})" class="btn-delete"><i class="fas fa-trash"></i></button></td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderizarTablaUsuarios(cnt) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
    cnt.innerHTML = `
        <div class="admin-card">
            <table class="admin-table">
                <thead><tr><th>Nombre</th><th>Email</th><th>Fecha</th></tr></thead>
                <tbody>
                    ${usuarios.map(u => `<tr><td><strong>${u.nombre}</strong></td><td>${u.email}</td><td>${u.fecha || 'Reciente'}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderizarPedidos() {
    const contenedor = document.getElementById("tabla-contenedor");
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    if (pedidos.length === 0) {
        contenedor.innerHTML = `<div class="admin-card"><p class="text-muted">No hay pedidos registrados.</p></div>`;
        return;
    }
    contenedor.innerHTML = `
        <div class="admin-card">
            <table class="admin-table">
                <thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${pedidos.map(p => `
                        <tr>
                            <td>#${p.id.toString().slice(-5)}</td>
                            <td>${p.cliente}</td>
                            <td>$${p.total.toFixed(2)}</td>
                            <td><span class="status-badge ${p.estado.toLowerCase()}">${p.estado}</span></td>
                            <td><button class="btn-edit" onclick="verDetallesPedido(${p.id})"><i class="fas fa-eye"></i> Ver</button></td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

// Tus funciones de Pedidos Detalle, Eliminar y Logout se mantienen igual
function verDetallesPedido(id) {
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;
    const modal = document.getElementById("modalRegistro");
    const campos = document.getElementById("camposDinamicos");
    document.getElementById("modalTitulo").innerText = `Pedido #${id.toString().slice(-5)}`;
    campos.innerHTML = `<div class="order-details-view">
        <p><strong>Cliente:</strong> ${pedido.cliente}</p>
        <p><strong>Estado:</strong> <select onchange="actualizarEstadoPedido(${pedido.id}, this.value)">
            <option value="Pendiente" ${pedido.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="Completado" ${pedido.estado === 'Completado' ? 'selected' : ''}>Completado</option>
        </select></p>
        <table class="admin-table" style="margin-top:15px;">
            <thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
            <tbody>${(pedido.items || []).map(item => `<tr><td>${item.nombre}</td><td>${item.cantidad}</td><td>$${(item.precio * item.cantidad).toFixed(2)}</td></tr>`).join('')}</tbody>
        </table>
        <h3 style="text-align:right; margin-top:10px;">Total: $${pedido.total.toFixed(2)}</h3>
    </div>`;
    document.getElementById("areaMultimedia").classList.add("hidden");
    const saveBtn = document.querySelector(".btn-save");
    if(saveBtn) saveBtn.classList.add("hidden");
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
    const modal = document.getElementById('modalRegistro');
    if(modal) modal.style.display = 'none';
    if (marcadorAdmin) { marcadorAdmin = null; }
}

function cerrarSesion() {
    if(confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('usuario_actual');
        window.location.href = 'index.html'; // Corregido a index para volver a la tienda
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarSeccion('dashboard');
});