/**
 * js/proveedor.js - Vista Detallada del Productor
 * Conexión con Firebase y renderizado de productos asociados.
 */

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id'); // El ID de Firebase es un String

    if (!id) {
        window.location.href = 'index.html';
        return;
    }

    // 1. Obtener datos del proveedor desde Firebase
    db.ref(`proveedores/${id}`).once('value').then((snapshot) => {
        const pro = snapshot.val();
        if (pro) {
            llenarDatosProveedor(pro);
            renderizarProductosDeProductor(id);
        } else {
            console.error("Proveedor no encontrado");
        }
    }).catch(error => console.error("Error al cargar proveedor:", error));
});

function llenarDatosProveedor(pro) {
    const setInnerText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val || "";
    };

    // Datos Básicos
    setInnerText('p-nombre', pro.nombre);
    setInnerText('p-descripcion', pro.descripcionCorta);
    setInnerText('p-comunidad', pro.comunidad);
    setInnerText('p-historia', pro.nuestraHistoria);
    setInnerText('p-horario', pro.horarioAtencion);

    // Gestión de Pagos Detallada
    const pagosEl = document.getElementById('p-pagos');
    if (pagosEl) {
        let metodos = [];
        if (pro.pagos?.transferencia?.activo) {
            const t = pro.pagos.transferencia;
            metodos.push(`Transferencia (${t.banco} - ${t.tipoCuenta})`);
        }
        if (pro.pagos?.qr?.activo) {
            metodos.push("Pago por QR / Deuna");
        }
        pagosEl.innerText = metodos.length > 0 ? metodos.join(" | ") : "Efectivo al recibir";
    }

    // Video Nativo (Carga local desde Storage)
    const videoElement = document.getElementById('p-video-local');
    const vidCont = document.getElementById('video-container');
    if (videoElement && vidCont) {
        if (pro.videoUrl) {
            videoElement.src = pro.videoUrl;
            videoElement.load(); // Forzar carga del video nativo
        } else {
            vidCont.style.display = 'none';
        }
    }

    // Imagen de Portada
    const portadaImg = document.getElementById('p-portada');
    if (portadaImg && pro.imagenPortada) {
        portadaImg.src = pro.imagenPortada;
    }

    // Mapa Satelital (Leaflet)
    if (pro.coords) {
        const latlng = pro.coords.split(',').map(c => parseFloat(c.trim()));
        if (latlng.length === 2) {
            const map = L.map('mapa-prov').setView(latlng, 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);
            L.marker(latlng).addTo(map)
                .bindPopup(`<b>${pro.nombre}</b><br>¡Visítanos!`)
                .openPopup();
        }
    }
}

function renderizarProductosDeProductor(proveedorId) {
    const grid = document.getElementById('productos-productor-grid');
    if (!grid) return;

    // Consultar productos filtrados por proveedor en Firebase
    db.ref('productos').orderByChild('proveedorId').equalTo(proveedorId)
        .once('value').then((snapshot) => {
            const productos = snapshot.val();
            
            if (!productos) {
                grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#888;">Este productor aún no tiene productos disponibles.</div>`;
                return;
            }

            grid.innerHTML = Object.keys(productos).map(key => {
                const p = productos[key];
                return `
                <div class="product-card" style="border:1px solid #eee; border-radius:15px; background:white; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                    <div class="product-image" style="height:180px; overflow:hidden;">
                        <img src="${p.imagenUrl}" alt="${p.nombre}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='assets/images/default-prod.jpg'">
                    </div>
                    <div class="product-info" style="padding:15px;">
                        <small style="color:var(--pueblo-sage); text-transform:uppercase; font-weight:700;">${p.categoria}</small>
                        <h3 style="margin:5px 0; font-family:'Playfair Display', serif;">${p.nombre}</h3>
                        <p style="font-weight:bold; color:var(--pueblo-terracotta); font-size:1.1rem; margin:10px 0;">
                            $${parseFloat(p.precio).toFixed(2)} / ${p.unidadMedida}
                        </p>
                        
                        <div style="display:flex; gap:10px; align-items:center;">
                            <input type="number" id="qty-${key}" value="1" min="1" 
                                   style="width:50px; padding:8px; border:1px solid #ddd; border-radius:5px; text-align:center;">
                            <button class="btn-login-header" style="flex:1; padding:8px; border-radius:5px; cursor:pointer;" 
                                    onclick="agregarAlCarrito('${key}')">
                                <i class="fas fa-shopping-basket"></i> Agregar
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        });
}