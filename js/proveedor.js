/**
 * js/proveedor.js - Vista Detallada del Productor (PÁGINA PÚBLICA)
 * Renderiza la identidad del productor y sus productos asociados.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Aseguramos que Firebase esté listo
    if (typeof firebase !== 'undefined') {
        const db = firebase.database();
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id'); 

        if (!id) {
            window.location.href = 'index.html';
            return;
        }

        // 1. Obtener datos del proveedor
        db.ref(`proveedores/${id}`).once('value').then((snapshot) => {
            const pro = snapshot.val();
            if (pro) {
                llenarDatosProveedor(pro);
                renderizarProductosDeProductor(id, db);
            } else {
                document.body.innerHTML = "<h2 style='text-align:center; margin-top:50px;'>Productor no encontrado</h2>";
            }
        }).catch(error => console.error("Error al cargar proveedor:", error));
    }
});

function llenarDatosProveedor(pro) {
    // Función auxiliar para insertar texto de forma segura
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val || "";
    };

    // Ajuste de nombres según la base de datos del Panel Administrativo
    setText('p-nombre', pro.nombreParcela); // Cambiado de 'nombre' a 'nombreParcela'
    setText('p-descripcion', pro.descripcionCorta);
    setText('p-comunidad', pro.comunidad);
    setText('p-historia', pro.nuestraHistoria);
    setText('p-horario', pro.horarioAtencion);

    // 2. Video Nativo (Carga desde Firebase Storage)
    const videoElement = document.getElementById('p-video-local');
    const vidCont = document.getElementById('video-container');
    if (videoElement && vidCont) {
        if (pro.urlVideo) { // Verificamos el nombre del campo del video
            videoElement.src = pro.urlVideo;
            videoElement.load();
        } else {
            vidCont.style.display = 'none';
        }
    }

    // 3. Imagen de Portada / Banner
    const portadaImg = document.getElementById('p-portada');
    if (portadaImg && pro.urlFotoPerfil) {
        portadaImg.src = pro.urlFotoPerfil;
    }

    // 4. Mapa Satelital (Leaflet)
    if (pro.coordenadas) {
        const latlng = pro.coordenadas.split(',').map(c => parseFloat(c.trim()));
        if (latlng.length === 2) {
            const map = L.map('mapa-prov').setView(latlng, 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);
            L.marker(latlng).addTo(map)
                .bindPopup(`<b>${pro.nombreParcela}</b><br>¡Ubicación de la Parcela!`)
                .openPopup();
        }
    }
}

function renderizarProductosDeProductor(proveedorId, db) {
    const grid = document.getElementById('productos-productor-grid');
    if (!grid) return;

    // IMPORTANTE: El Panel guarda 'idProductor' en la rama 'productos'
    db.ref('productos').orderByChild('idProductor').equalTo(proveedorId)
        .once('value').then((snapshot) => {
            const productos = snapshot.val();
            
            if (!productos) {
                grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#888;">Este productor no tiene cosechas disponibles hoy.</div>`;
                return;
            }

            grid.innerHTML = Object.entries(productos).map(([key, p]) => {
                return `
                <div class="product-card" style="border:1px solid #eee; border-radius:15px; background:white; overflow:hidden; transition: 0.3s;">
                    <div style="height:180px; position:relative;">
                        <img src="${p.urlFotoProducto || 'https://via.placeholder.com/300'}" style="width:100%; height:100%; object-fit:cover;">
                        <span style="position:absolute; top:10px; right:10px; background:rgba(255,255,255,0.9); padding:2px 8px; border-radius:10px; font-size:12px; font-weight:bold;">
                            ${p.categoriaProducto}
                        </span>
                    </div>
                    <div style="padding:15px;">
                        <h3 style="margin:0; font-size:1.2rem;">${p.nombreProducto}</h3>
                        <p style="color:#27ae60; font-weight:bold; font-size:1.2rem; margin:10px 0;">
                            $${parseFloat(p.precio).toFixed(2)} <span style="font-size:0.8rem; color:#666;">/ ${p.unidadMedida}</span>
                        </p>
                        <div style="display:flex; gap:8px;">
                            <input type="number" id="qty-${key}" value="1" min="1" style="width:45px; border:1px solid #ddd; border-radius:5px; text-align:center;">
                            <button onclick="agregarAlCarrito('${key}')" style="flex:1; background:#27ae60; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;">
                                <i class="fas fa-cart-plus"></i> Añadir
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        });
}