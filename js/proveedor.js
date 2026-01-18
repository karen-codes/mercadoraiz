// js/proveedor.js
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    const proveedores = JSON.parse(localStorage.getItem("proveedores")) || [];
    const pro = proveedores.find(p => p.id === id);

    if (pro) {
        // Llenar datos básicos
        const setInnerText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val || "";
        };

        setInnerText('p-nombre', pro.nombre);
        setInnerText('p-descripcion', pro.descripcion);
        setInnerText('p-comunidad', pro.comunidad);
        setInnerText('p-historia', pro.historia);
        setInnerText('p-horario', pro.horario);

        // Pagos
        const pagosEl = document.getElementById('p-pagos');
        if (pagosEl) {
            let metodos = [];
            if (pro.pagos?.transferencia) metodos.push("Transferencia");
            if (pro.pagos?.qr) metodos.push("QR / Deuna");
            pagosEl.innerText = metodos.length > 0 ? metodos.join(", ") : "Efectivo";
        }

        // Video
        const videoElement = document.getElementById('p-video-local');
        if (videoElement) {
            if (pro.video) {
                videoElement.src = pro.video;
            } else {
                const vidCont = document.getElementById('video-container');
                if(vidCont) vidCont.style.display = 'none';
            }
        }

        // Mapa
        const mapContainer = document.getElementById('mapa-prov');
        if (mapContainer && pro.coords) {
            const coordsArray = pro.coords.split(',').map(c => parseFloat(c.trim()));
            if (coordsArray.length === 2) {
                const map = L.map('mapa-prov').setView(coordsArray, 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                L.marker(coordsArray).addTo(map).bindPopup(`Hacienda ${pro.nombre}`).openPopup();
            }
        }

        renderizarProductosDeProductor(pro.id);
    }
});

function renderizarProductosDeProductor(proveedorId) {
    const productos = JSON.parse(localStorage.getItem("productos")) || [];
    const filtrados = productos.filter(p => String(p.proveedorId) === String(proveedorId));
    const grid = document.getElementById('productos-productor-grid');
    
    if (!grid) return;

    if (filtrados.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; background:#f9f9f9; border-radius:15px; color:#888;">No hay productos disponibles por ahora.</div>`;
        return;
    }

    grid.innerHTML = filtrados.map(p => `
        <div class="product-card" style="border:1px solid #eee; border-radius:15px; background:white; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            <div class="product-image" style="height:180px; overflow:hidden;">
                <img src="${p.imagen}" alt="${p.nombre}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='assets/images/default-prod.jpg'">
            </div>
            <div class="product-info" style="padding:15px;">
                <small style="color:var(--pueblo-sage); text-transform:uppercase; font-weight:700;">${p.categoria}</small>
                <h3 style="margin:5px 0; font-family:'Playfair Display', serif;">${p.nombre}</h3>
                <p style="font-weight:bold; color:var(--pueblo-terracotta); font-size:1.1rem; margin:10px 0;">$${parseFloat(p.precio).toFixed(2)} / ${p.unidad}</p>
                
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="display:flex; align-items:center; border:1px solid #ddd; border-radius:5px; padding:2px;">
                        <input type="number" id="qty-${p.id}" value="1" min="1" max="${p.stock}" 
                               style="width:40px; border:none; text-align:center; outline:none;">
                    </div>
                    <button class="btn-login-header" style="flex:1; padding:8px; border-radius:5px; cursor:pointer;" onclick="agregarAlCarritoClick(${p.id})">
                        <i class="fas fa-shopping-basket"></i> Agregar
                    </button>
                </div>
                <p style="font-size:0.75rem; color:#999; margin-top:10px;">Stock: ${p.stock} unidades</p>
            </div>
        </div>
    `).join('');
}