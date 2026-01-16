document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    const proveedores = JSON.parse(localStorage.getItem("proveedores")) || [];
    const pro = proveedores.find(p => p.id === id);

    if (pro) {
        document.getElementById('p-nombre').innerText = pro.nombre;
        document.getElementById('p-comunidad').innerText = pro.comunidad;
        document.getElementById('p-historia').innerText = pro.historia;
        document.getElementById('p-horario').innerText = pro.horario;
        document.getElementById('p-parcela').innerText = pro.parcela;

        // Video Local
        const videoElement = document.getElementById('p-video-local');
        if (pro.video) {
            // Se asume que pro.video guarda el nombre del archivo (ej: "video1.mp4")
            videoElement.src = `assets/videos/${pro.video}`;
        }

        // Mapa Leaflet
        const map = L.map('mapa-prov').setView([pro.lat, pro.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([pro.lat, pro.lng]).addTo(map).bindPopup(pro.nombre).openPopup();

        renderizarProductosDeProductor(pro.id);
    }
});

function renderizarProductosDeProductor(id) {
    const productos = JSON.parse(localStorage.getItem("productos")) || [];
    const filtrados = productos.filter(p => p.proveedorId === id);
    const grid = document.getElementById('productos-productor-grid');
    grid.innerHTML = filtrados.map(p => `
        <div class="product-card glass-card">
            <img src="${p.imagen}" alt="${p.nombre}">
            <h3>${p.nombre}</h3>
            <p>$${p.precio.toFixed(2)}</p>
            <button class="btn-add" onclick="agregarCarrito(${p.id})">Agregar</button>
        </div>
    `).join('');
}