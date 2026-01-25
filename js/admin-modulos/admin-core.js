/**
 * js/admin-modulos/admin-core.js
 * Orquestador Modular - Mercado Raíz 2026
 */

window.mapaAdmin = null;
window.marcadorAdmin = null;

/**
 * Gestiona el cambio de pestañas en el panel
 */
window.cargarSeccion = function(seccion) {
    // 1. Manejo visual del menú lateral
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const linkActivo = document.getElementById(`link-${seccion}`);
    if (linkActivo) linkActivo.classList.add('active');

    // 2. Referencias a la interfaz
    const titulo = document.getElementById('seccion-titulo');
    const contenedor = document.getElementById('tabla-contenedor');
    const btnNuevoCont = document.getElementById('btn-nuevo-contenedor');

    if (!contenedor) return;

    // Limpieza previa de eventos y contenido
    contenedor.innerHTML = '<div class="admin-card"><i class="fas fa-spinner fa-spin"></i> Conectando con base de datos real...</div>';
    if(btnNuevoCont) btnNuevoCont.innerHTML = ''; 

    // 3. Enrutador de Módulos
    switch(seccion) {
        case 'dashboard':
            titulo.innerText = "Resumen del Negocio";
            if (typeof initDashboard === 'function') initDashboard(contenedor);
            break;

        case 'productos':
            titulo.innerText = "Gestión de Catálogo";
            if (typeof initProductos === 'function') initProductos(contenedor, btnNuevoCont);
            break;

        case 'proveedores':
            titulo.innerText = "Directorio de Productores";
            if (typeof initProveedores === 'function') initProveedores(contenedor, btnNuevoCont);
            break;

        case 'pedidos':
            titulo.innerText = "Control de Ventas";
            if (typeof initPedidos === 'function') initPedidos(contenedor);
            break;
        
        case 'mensajes': 
            titulo.innerText = "Bandeja de Mensajes";
            if (typeof initMensajes === 'function') initMensajes(contenedor);
            break;

        case 'pagos': 
            titulo.innerText = "Liquidaciones a Productores";
            if (typeof initPagos === 'function') initPagos(contenedor);
            break;

        case 'usuarios':
            titulo.innerText = "Base de Clientes";
            if (typeof initUsuarios === 'function') initUsuarios(contenedor);
            break;

        default:
            contenedor.innerHTML = '<div class="admin-card">Sección en mantenimiento.</div>';
    }
}

/**
 * Abre un modal genérico para mensajes
 */
window.abrirModal = function() {
    // Reutilizamos el modal de productos pero lo limpiamos para el mensaje
    const modal = document.getElementById('modalProducto');
    if (modal) {
        modal.classList.remove('hidden');
        // Ocultamos el formulario de productos para que no se mezcle
        document.getElementById('formProducto').style.display = 'none';
        
        // Creamos o usamos un contenedor para el texto del mensaje
        let detalle = document.getElementById('camposDinamicos');
        if(!detalle) {
            const div = document.createElement('div');
            div.id = 'camposDinamicos';
            modal.querySelector('.glass-card').appendChild(div);
        }
    }
};

// Y en tu cerrarModal existente, asegúrate de volver a mostrar el formulario de productos
// agregando esta línea al final de window.cerrarModal:
// document.getElementById('formProducto').style.display = 'block';
/**
 * Gestión Global de Modales
 */
window.cerrarModal = function() {
    // 1. Ocultar capas
    document.getElementById('modalProveedor')?.classList.add('hidden');
    document.getElementById('modalProducto')?.classList.add('hidden');
    
    // 2. Resetear formularios
    document.getElementById('formProveedor')?.reset();
    document.getElementById('formProducto')?.reset();
    
    // 3. LIMPIEZA DE CAMPOS OCULTOS Y MULTIMEDIA
    const camposALimpiar = [
        'prod-id', 'prov-id', 
        'prod-img-actual', 'prov-foto-url-actual', 'prov-video-url-actual',
        'prov-coords'
    ];

    camposALimpiar.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });

    // 4. Resetear Checkboxes de Horarios (Días)
    document.querySelectorAll('.check-dia').forEach(cb => cb.checked = false);
    
    // 5. Destruir mapa para evitar errores de duplicidad
    if(window.mapaAdmin) {
        try {
            window.mapaAdmin.remove();
        } catch(e) {
            console.warn("Error al remover mapa:", e);
        }
        window.mapaAdmin = null;
        window.marcadorAdmin = null;
    }
};

// Iniciar con la sección Dashboard al cargar
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        // Inicializamos la base de datos globalmente si no lo está
        if(!window.db) window.db = firebase.database();
        window.cargarSeccion('dashboard');
    } else {
        console.error("Firebase no detectado.");
    }
});