/**
 * js/proveedor.js - Vista Pública Actualizada
 */

function llenarDatosProveedor(pro) {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val || "No definido";
    };

    // Mapeo exacto con la base de datos del Admin
    setText('p-nombre', pro.nombreParcela);
    setText('p-comunidad', pro.comunidad);
    setText('p-historia', pro.historia); // Antes era 'nuestraHistoria'
    setText('p-horario', pro.horarios);  // Antes era 'horarioAtencion'

    // Video Nativo
    const videoElement = document.getElementById('p-video-local');
    const vidCont = document.getElementById('video-container');
    if (videoElement && vidCont) {
        if (pro.videoUrl) { // Nombre unificado
            videoElement.src = pro.videoUrl;
            videoElement.load();
            vidCont.style.display = 'block';
        } else {
            vidCont.style.display = 'none';
        }
    }

    // Imagen de Portada
    const portadaImg = document.getElementById('p-portada');
    if (portadaImg) {
        portadaImg.src = pro.fotoUrl || 'img/avatar-finca.jpg';
    }

    // Mapa
    if (pro.coordenadas) {
        const latlng = pro.coordenadas.split(',').map(c => parseFloat(c.trim()));
        const map = L.map('mapa-prov').setView(latlng, 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker(latlng).addTo(map).bindPopup(`<b>${pro.nombreParcela}</b>`).openPopup();
    }
}