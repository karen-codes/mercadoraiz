/**
 * js/tienda/proveedor.js - Vista Pública Final
 */
function llenarDatosProveedor(pro) {
    // Para ver los datos exactos en la consola
    console.log("Datos cargados desde Firebase:", pro); 

    const setText = (id, val) => {
        const el = document.getElementById(id);
        // Si el valor no existe, ponemos un texto vacío en lugar de "No definido"
        if (el) el.innerText = val || ""; 
    };

    // 1. MAPEADO DE TEXTOS (Nombres exactos de tu Firebase)
    setText('p-nombre', pro.nombreParcela);
    setText('p-comunidad', pro.comunidad);
    setText('p-historia', pro.historia); 
    setText('p-horario', pro.horarios); // Sincronizado con 'horarios'
    
    // Si 'descripcionCorta' no existe en tu DB, este campo quedará vacío y limpio
    setText('p-descripcion', pro.descripcionCorta);

    // 2. GESTIÓN DE VIDEO
    const videoElement = document.getElementById('p-video-local');
    const sourceElement = document.getElementById('video-source');
    const vidCont = document.getElementById('video-container');

    if (vidCont) {
        if (pro.videoUrl) {
            if (sourceElement) sourceElement.src = pro.videoUrl;
            if (videoElement) {
                videoElement.load();
                vidCont.style.display = 'block';
            }
        } else {
            vidCont.style.display = 'none';
        }
    }

    // 3. LÓGICA DEL MAPA (LEAFLET)
    const mapDiv = document.getElementById('mapa-prov');
    
    // Usamos el campo 'coordenadas' que es el que tienes en Firebase
    if (mapDiv && pro.coordenadas) {
        try {
            const latlng = pro.coordenadas.split(',').map(c => parseFloat(c.trim()));

            if (!isNaN(latlng[0]) && !isNaN(latlng[1])) {
                if (window.mapaPublico) {
                    window.mapaPublico.remove();
                }

                window.mapaPublico = L.map('mapa-prov').setView(latlng, 15);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(window.mapaPublico);

                L.marker(latlng).addTo(window.mapaPublico)
                    .bindPopup(`<b>${pro.nombreParcela}</b>`)
                    .openPopup();

                setTimeout(() => {
                    window.mapaPublico.invalidateSize();
                }, 400);
            }
        } catch (error) {
            console.error("Error al cargar el mapa:", error);
        }
    }
}

/**
 * LÓGICA DE PRODUCTOS DEL PROVEEDOR
 * Conecta los productos de la parcela con el carrito global
 */
function renderizarProductosProveedor(productosFiltrados, idProductor) {
    const contenedor = document.getElementById('productos-proveedor');
    if (!contenedor) return;

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = "<p class='text-center'>Próximamente más productos de esta tierra.</p>";
        return;
    }

    contenedor.innerHTML = productosFiltrados.map(prod => {
        // Aseguramos que los nombres de campos coincidan con tu Firebase
        const img = prod.urlFotoProducto || prod.imagenUrl || prod.fotoUrl || 'assets/images/no-image.jpg';
        const precio = parseFloat(prod.precio).toFixed(2);
        
        return `
            <div class="product-mini-card">
                <div class="product-mini-image">
                    <img src="${img}" alt="${prod.nombre}">
                </div>
                <div class="product-mini-info">
                    <h4>${prod.nombre}</h4>
                    <p class="price">$${precio} / ${prod.unidad || 'u'}</p>
                    <button onclick="agregarAlCarritoDesdePerfil('${prod.id}', '${prod.nombre}', ${prod.precio}, '${img}', '${idProductor}')" 
                            class="btn-add-mini">
                        <i class="fas fa-cart-plus"></i> Añadir
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Esta función es la que hace el puente con el main.js corregido
window.agregarAlCarritoDesdePerfil = function(id, nombre, precio, imagen, idProductor) {
    if (typeof window.addToCart === 'function') {
        window.addToCart(id, nombre, precio, imagen, idProductor);
        
        // Efecto visual en el botón (opcional, no rompe nada)
        const btn = event.currentTarget;
        const original = btn.innerHTML;
        btn.innerHTML = "<i class='fas fa-check'></i>";
        btn.style.background = "#c6714f";
        setTimeout(() => {
            btn.innerHTML = original;
            btn.style.background = "";
        }, 1000);
    } else {
        console.error("Error: main.js no está cargado correctamente.");
    }
};