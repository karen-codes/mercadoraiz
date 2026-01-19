/***********************************
 * CONFIGURACIÓN DE ESTADO GLOBAL - NUBE
 ***********************************/
let productos = [];
let proveedores = [];
// El carrito se mantiene en localStorage por comodidad del cliente, 
// pero los datos de productos y pedidos van a la nube.
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.addEventListener("DOMContentLoaded", () => {
    actualizarInterfazSesion();
    actualizarContadorCarrito();
    setupCarritoFlotante(); 

    // 1. CARGA SINCRONIZADA DESDE FIREBASE
    // Escuchamos proveedores primero
    db.ref('proveedores').on('value', (snapshot) => {
        const data = snapshot.val();
        proveedores = data ? Object.keys(data).map(key => ({...data[key], id: key})) : [];
        
        // Una vez que tenemos proveedores, traemos productos
        db.ref('productos').on('value', (prodSnapshot) => {
            const prodData = prodSnapshot.val();
            productos = prodData ? Object.keys(prodData).map(key => ({...prodData[key], id: key})) : [];
            
            // Renderizar si existe el contenedor
            if (document.getElementById("productsGrid")) {
                inicializarFiltrosYRenderizado();
            }
            
            // IMPORTANTE: Quitamos el spinner de carga al recibir respuesta (vacía o no)
            finalizarCargaVisual();
        }, (error) => {
            console.error("Error en Productos:", error);
            finalizarCargaVisual();
        });
    }, (error) => {
        console.error("Error en Proveedores:", error);
        finalizarCargaVisual();
    });
});

/**
 * QUITA EL MENSAJE DE "SINCRONIZANDO..."
 */
function finalizarCargaVisual() {
    const loader = document.getElementById('loading-screen') || document.querySelector('.loading-overlay');
    if (loader) {
        loader.style.display = 'none';
    }
    // Si el texto está directamente en el dashboard (como en tu captura)
    const syncText = document.querySelector('h3')?.parentElement;
    if (syncText && syncText.innerText.includes("Sincronizando")) {
        syncText.innerHTML = `<h3>Panel de Control</h3><p>Conectado a Mercado Raíz Cloud</p>`;
    }
}

/***********************************
 * RENDERIZADO DESDE LA NUBE
 ***********************************/
function renderizarPaginaCategoria(data) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    if (data.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:50px; color:#666;">
                <i class="fas fa-cloud-upload-alt" style="font-size:3rem; margin-bottom:15px;"></i>
                <p>No hay datos en la nube. Empieza agregando uno en el Panel.</p>
            </div>`;
        return;
    }

    grid.innerHTML = data.map(p => {
        const prov = proveedores.find(pr => pr.id == p.proveedorId);
        const nombreProductor = prov ? prov.nombre : 'Productor Local';

        return `
        <div class="product-card">
            <img src="${p.imagen || 'img/no-photo.jpg'}" style="width:100%; height:200px; object-fit:cover;">
            <div style="padding:15px;">
                <h3>${p.nombre}</h3>
                <p><i class="fas fa-user"></i> ${nombreProductor}</p>
                <p class="precio">$${parseFloat(p.precio).toFixed(2)}</p>
                <button onclick="agregarAlCarritoClick('${p.id}')" class="btn-comprar">
                    <i class="fas fa-plus"></i> Agregar
                </button>
            </div>
        </div>`;
    }).join('');
}
