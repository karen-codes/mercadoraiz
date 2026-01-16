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

    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const linkActivo = document.getElementById(`link-${seccion}`);
    if (linkActivo) linkActivo.classList.add('active');

    titulo.innerText = seccion.toUpperCase();
    
    if(btnAccion) {
        btnAccion.style.display = (seccion === 'productos' || seccion === 'proveedores') ? 'block' : 'none';
    }

    switch(seccion) {
        case 'dashboard': renderizarDashboard(contenedor); break;
        case 'productos': renderizarTablaProductos(contenedor); break;
        case 'proveedores': renderizarTablaProveedores(contenedor); break;
        case 'pedidos': renderizarTablaPedidos(contenedor); break;
        default: contenedor.innerHTML = `<p class="text-muted">Sección en desarrollo...</p>`;
    }
}

// 2. TABLA DE PRODUCTOS
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
                        <td><img src="${p.imagen}" class="img-mini" width="40" style="border-radius:5px;"></td>
                        <td><strong>${p.nombre}</strong><br><small class="text-muted">${p.descripcion || ''}</small></td>
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
                            <span class="badge-tech">${prov.video ? '📁 ' + prov.video : '❌ Sin Video'}</span>
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

// 4. DASHBOARD
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

// 5. TABLA DE PEDIDOS
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

// 6. MODAL DINÁMICO
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
            <div class="form-group">
                <label>Descripción del Producto</label>
                <textarea id="reg_desc" class="admin-input" rows="2" placeholder="Ej: Tomates orgánicos cultivados con métodos tradicionales."></textarea>
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
            <div class="form-group">
                <label>Nombre de la Hacienda / Productor</label>
                <input type="text" id="reg_nombre_prov" class="admin-input" required>
            </div>
            <div class="form-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="form-group">
                    <label>Comunidad</label>
                    <input type="text" id="reg_comunidad" class="admin-input" required>
                </div>
                <div class="form-group">
                    <label>WhatsApp (Sin +)</label>
                    <input type="text" id="reg_ws" class="admin-input" required>
                </div>
            </div>
            <div class="form-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="form-group">
                    <label>Latitud</label>
                    <input type="number" step="any" id="reg_lat" class="admin-input" value="-0.04">
                </div>
                <div class="form-group">
                    <label>Longitud</label>
                    <input type="number" step="any" id="reg_lng" class="admin-input" value="-78.14">
                </div>
            </div>
            <div class="form-group">
                <label>Historia (Descripción del perfil)</label>
                <textarea id="reg_historia" class="admin-input" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Nombre del archivo de Video (en assets/videos/)</label>
                <input type="text" id="reg_video_file" class="admin-input" placeholder="ejemplo: finca.mp4">
            </div>
            <div class="form-group">
                <label>Horario de Atención</label>
                <input type="text" id="reg_horario" class="admin-input" placeholder="08:00 - 17:00">
            </div>
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
                <button type="button" onclick="previsualizarPerfil()" class="btn-primary-admin" style="background:#444;">
                    <i class="fas fa-eye"></i> Previsualizar
                </button>
            </div>
            <div id="preview-container" class="hidden" style="margin-top:15px; background:#f0f0f0; padding:10px; border-radius:8px;"></div>
        `;
    }
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
                descripcion: document.getElementById('reg_desc').value,
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
                lat: parseFloat(document.getElementById('reg_lat').value),
                lng: parseFloat(document.getElementById('reg_lng').value),
                historia: document.getElementById('reg_historia').value,
                video: document.getElementById('reg_video_file').value,
                horario: document.getElementById('reg_horario').value,
                imagen: 'assets/images/proveedores/default.jpg'
            });
            localStorage.setItem("proveedores", JSON.stringify(db));
        }

        cerrarModal();
        cargarSeccion(seccionActual);
    };
}

// 8. ELIMINAR Y CERRAR
function cerrarModal() {
    const modal = document.getElementById('modalRegistro');
    if(modal) modal.style.display = 'none';
}

function eliminarRegistro(tipo, id) {
    if (confirm("¿Está seguro de eliminar este registro?")) {
        let db = JSON.parse(localStorage.getItem(tipo));
        db = db.filter(item => item.id !== id);
        localStorage.setItem(tipo, JSON.stringify(db));
        cargarSeccion(tipo);
    }
}

function previsualizarPerfil() {
    const nombre = document.getElementById('reg_nombre_prov').value;
    const historia = document.getElementById('reg_historia').value;
    const videoFile = document.getElementById('reg_video_file').value;
    const previewArea = document.getElementById('preview-container');

    if (!nombre) return alert("Por favor, ingresa el nombre.");

    previewArea.classList.remove('hidden');
    previewArea.innerHTML = `
        <p><strong>Vista Previa:</strong></p>
        <p><small>${nombre}</small></p>
        <div style="background:#000; color:#fff; font-size:10px; padding:10px; border-radius:5px; text-align:center;">
            VIDEO: assets/videos/${videoFile || 'default.mp4'}
        </div>
    `;
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarSeccion('dashboard');
});