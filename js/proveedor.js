// js/proveedor.js
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    const proveedores = JSON.parse(localStorage.getItem("proveedores")) || [];
    const pro = proveedores.find(p => p.id === id);

    if (pro) {
        // Mapeo de datos para la vista de detalle
        const setInnerText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setInnerText('p-nombre', pro.nombre);
        setInnerText('p-comunidad', pro.comunidad);
        setInnerText('p-historia', pro.historia);
        setInnerText('p-horario', pro.horario);
        setInnerText('p-parcela', pro.parcela);

        // Video
        const videoElement = document.getElementById('p-video-local');
        if (videoElement && pro.video) {
            videoElement.src = `assets/videos/${pro.video}`;
        }

        // Mapa
        const mapContainer = document.getElementById('mapa-prov');
        if (mapContainer) {
            const map = L.map('mapa-prov').setView([pro.lat, pro.lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            L.marker([pro.lat, pro.lng]).addTo(map).bindPopup(`<b>${pro.nombre}</b><br>${pro.comunidad}`).openPopup();
        }

        renderizarProductosDeProductor(pro.id);
    }
});

function renderizarProductosDeProductor(id) {
    const productos = JSON.parse(localStorage.getItem("productos")) || [];
    const filtrados = productos.filter(p => p.proveedorId === id);
    const grid = document.getElementById('productos-productor-grid');
    
    if (!grid) return;

    if (filtrados.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:30px; background:#f9f9f9; border-radius:10px;">Este proveedor no tiene productos asignados.</div>`;
        return;
    }

    grid.innerHTML = filtrados.map(p => `
        <div class="admin-card" style="padding: 15px; border: 1px solid #eee; transition: 0.3s;">
            <div style="height: 160px; overflow: hidden; border-radius: 12px; margin-bottom: 12px; background:#f0f0f0;">
                <img src="${p.imagen}" alt="${p.nombre}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/placeholder-prod.png'">
            </div>
            <h3 style="font-size: 1.1rem; margin-bottom: 5px; color:var(--admin-text);">${p.nombre}</h3>
            <p style="color: var(--admin-accent); font-weight: 800; font-size: 1.2rem; margin-bottom: 15px;">$${p.precio.toFixed(2)}</p>
            <div style="display: flex; gap: 8px;">
                <button class="btn-edit" style="flex: 1; padding: 8px;" onclick="editarProducto(${p.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete" style="padding: 8px;" onclick="eliminarProducto(${p.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}