/**
 * js/admin-modulos/admin-mensajes.js
 * Módulo de mensajería para el Panel Administrativo - Mercado Raíz 2026
 */

window.initMensajes = function(contenedor) {
    // Reutilizamos la lógica de renderizado que ya tienes en js/tienda/mensajes.js
    // pero asegurándonos de que se inyecte en el contenedor principal del admin
    
    if (typeof window.renderizarTablaMensajes === "function") {
        window.renderizarTablaMensajes(contenedor);
    } else {
        contenedor.innerHTML = `
            <div class="admin-card">
                <p style="color:red; text-align:center; padding:20px;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Error: El script base de mensajes no se ha cargado correctamente.
                </p>
            </div>`;
        console.error("El archivo js/tienda/mensajes.js debe cargarse antes que este módulo.");
    }
};

// Aseguramos que los estilos de los botones de filtro existan
const style = document.createElement('style');
style.innerHTML = `
    .btn-filtro {
        padding: 8px 15px;
        margin-left: 5px;
        border: 1px solid #8da281;
        background: white;
        color: #8da281;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s;
    }
    .btn-filtro.active {
        background: #8da281;
        color: white;
    }
    .btn-filtro:hover {
        background: #f0f4ef;
    }
`;
document.head.appendChild(style);