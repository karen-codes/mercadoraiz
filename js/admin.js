/***********************************
 * GESTIÓN ADMINISTRATIVA MAESTRA
 ***********************************/

let seccionActual = 'dashboard';

// 1. CARGA DINÁMICA DE SECCIONES
function cargarSeccion(seccion) {
    seccionActual = seccion;
    const contenedor = document.getElementById('tabla-contenedor');
    const titulo = document.getElementById('seccion-titulo');
    const btnAccion = document.getElementById('btn-accion-principal');

    // Resetear clases de navegación
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const linkActivo = document.getElementById(`link-${seccion}`);
    if (linkActivo) linkActivo.classList.add('active');

    titulo.innerText = seccion.toUpperCase();
    
    // Mostrar/Ocultar botón de registro según sección
    if(btnAccion) {
        btnAccion.style.display = (seccion === 'productos' || seccion === 'proveedores') ? 'block' : 'none';
    }

    // Enrutador de Renderizado
    switch(seccion) {
        case 'dashboard': renderizarDashboard(contenedor); break;
        case 'productos': renderizarTablaProductos(contenedor); break;
        case 'proveedores': renderizarTablaProveedores(contenedor); break;
        case 'pedidos': renderizarTablaPedidos(contenedor); break;
        default: contenedor.innerHTML = `<p class="text-muted">Sección en desarrollo...</p>`;
    }
}

// 2. TABLA DE PRODUCTOS + ALERTAS
function renderizarTablaProductos(cnt) {
    const productosDB = JSON.parse(localStorage.getItem("productos")) || [];
    
    cnt.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Imagen</th>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${productosDB.map(p => {
                    const bajoStock = p.stock < 5; 
                    return `
                    <tr class="${bajoStock ? 'fila-alerta' : ''}">
                        <td><img src="${p.imagen}" class="img-mini" width="40"></td>
                        <td><strong>${p.nombre}</strong></td>
                        <td class="${bajoStock ? 'stock-critico' : ''}">
                            ${p.stock} ${p.unidad || 'lb'} ${bajoStock ? '⚠️' : ''}
                        </td>
                        <td>$${p.precio.toFixed(2)}</td>
                        <td>
                            <button onclick="eliminarRegistro('productos', ${p.id})" class="btn-delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

// 3. TABLA DE PROVEEDORES
function renderizarTablaProveedores(cnt) {
    const proveedoresDB = JSON.parse(localStorage.getItem("proveedores")) || [];
    
    cnt.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Comunidad</th>
                    <th>Contacto</th>
                    <th>Multimedia</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${proveedoresDB.map(prov => `
                    <tr>
                        <td><strong>${prov.nombre}</strong></td>
                        <td>${prov.comunidad}</td>
                        <td><a href="https://wa.me/${prov.whatsapp}" target="_blank" class="link-wa">${prov.whatsapp}</a></td>
                        <td>
                            <span class="badge-tech">${prov.video ? '🎥 Video' : ''}</span>
                            <span class="badge-tech">${prov.imagen ? '🖼️ Foto' : ''}</span>
                        </td>
                        <td>
                            <button onclick="eliminarRegistro('proveedores', ${prov.id})" class="btn-delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

// 4. RENDERIZAR DASHBOARD (Métricas rápidas)
function renderizarDashboard(cnt) {
    const productos = JSON.parse(localStorage.getItem("productos")) || [];
    const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
    const criticos = productos.filter(p => p.stock < 5).length;

    cnt.innerHTML = `
        <div class="dashboard-grid">
            <div class="card stat-card">
                <h3>Total Productos</h3>
                <p class="stat-number">${productos.length}</p>
            </div>
            <div class="card stat-card warning">
                <h3>Stock Crítico</h3>
                <p class="stat-number">${criticos}</p>
            </div>
            <div class="card stat-card success">
                <h3>Pedidos Recibidos</h3>
                <p class="stat-number">${pedidos.length}</p>
            </div>
        </div>
        <div class="card glass-card" style="margin-top:20px;">
            <h3>Actividad Reciente</h3>
            <p class="text-muted">Hoy es ${new Date().toLocaleDateString()}</p>
        </div>
    `;
}

// 5. RENDERIZAR PEDIDOS
function renderizarTablaPedidos(cnt) {
    const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
    if(pedidos.length === 0) {
        cnt.innerHTML = `<div class="card"><p>No hay pedidos registrados aún.</p></div>`;
        return;
    }

    cnt.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID Pedido</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${pedidos.map(ped => `
                    <tr>
                        <td>#${ped.id}</td>
                        <td>${ped.cliente}</td>
                        <td>$${ped.total.toFixed(2)}</td>
                        <td><span class="badge-status ${ped.estado}">${ped.estado}</span></td>
                        <td><button class="btn-primary-admin" style="padding:5px 10px;">Detalles</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

// 6. MODAL DINÁMICO (PREPARAR FORMULARIO)
function abrirModal() {
    const campos = document.getElementById('camposDinamicos');
    const modal = document.getElementById('modalRegistro');
    const titulo = document.getElementById('modalTitulo');
    
    if(!modal) return;

    modal.style.display = 'flex';
    titulo.innerText = `Registrar ${seccionActual === 'productos' ? 'Producto' : 'Proveedor'}`;

    if (seccionActual === 'productos') {
        const provs = JSON.parse(localStorage.getItem("proveedores")) || [];
        campos.innerHTML = `
            <div class="form-group">
                <label>Nombre del Producto</label>
                <input type="text" id="reg_nombre" class="admin-input" required>
            </div>
            <div class="form-grid" style="display:flex; gap:10px;">
                <div class="form-group" style="flex:1;">
                    <label>Precio ($)</label>
                    <input type="number" step="0.01" id="reg_precio" class="admin-input" required>
                </div>
                <div class="form-group" style="flex:1;">
                    <label>Stock Inicial</label>
                    <input type="number" id="reg_stock" class="admin-input" required>
                </div>
            </div>
            <div class="form-group">
                <label>Proveedor Responsable</label>
                <select id="reg_prov_id" class="admin-input">
                    ${provs.map(pr => `<option value="${pr.id}">${pr.nombre}</option>`).join('')}
                </select>
            </div>
        `;
    } else {
        campos.innerHTML = `
            <div class="form-group"><label>Nombre / Hacienda</label><input type="text" id="reg_nombre_prov" class="admin-input" required></div>
            <div class="form-group"><label>Comunidad</label><input type="text" id="reg_comunidad" class="admin-input" required></div>
            <div class="form-group"><label>WhatsApp</label><input type="text" id="reg_ws" class="admin-input" required placeholder="593..."></div>
        `;
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalRegistro');
    if(modal) modal.style.display = 'none';
    const form = document.getElementById('formRegistro');
    if(form) form.reset();
}

// 7. GUARDAR DATOS
const formRegistro = document.getElementById('formRegistro');
if(formRegistro) {
    formRegistro.onsubmit = function(e) {
        e.preventDefault();
        
        if (seccionActual === 'productos') {
            let db = JSON.parse(localStorage.getItem("productos")) || [];
            db.push({
                id: Date.now(),
                nombre: document.getElementById('reg_nombre').value,
                precio: parseFloat(document.getElementById('reg_precio').value),
                stock: parseInt(document.getElementById('reg_stock').value),
                unidad: "lb",
                proveedorId: parseInt(document.getElementById('reg_prov_id').value),
                imagen: 'assets/images/productos/default.jpg'
            });
            localStorage.setItem("productos", JSON.stringify(db));
        } else {
            let db = JSON.parse(localStorage.getItem("proveedores")) || [];
            db.push({
                id: Date.now(),
                nombre: document.getElementById('reg_nombre_prov').value,
                comunidad: document.getElementById('reg_comunidad').value,
                whatsapp: document.getElementById('reg_ws').value,
                imagen: 'assets/images/proveedores/default.jpg'
            });
            localStorage.setItem("proveedores", JSON.stringify(db));
        }

        cerrarModal();
        cargarSeccion(seccionActual);
    };
}

// 8. ELIMINAR REGISTRO
function eliminarRegistro(tipo, id) {
    if (confirm("¿Está seguro de eliminar este registro?")) {
        let db = JSON.parse(localStorage.getItem(tipo));
        db = db.filter(item => item.id !== id);
        localStorage.setItem(tipo, JSON.stringify(db));
        cargarSeccion(tipo);
    }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    cargarSeccion('dashboard');
});
