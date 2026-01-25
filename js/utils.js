/**
 * js/utils.js - Utilidades Globales Mercado Raíz
 */

// 1. Formateo de Dinero (USD)
window.formatearUSD = function(valor) {
    const num = parseFloat(valor);
    if (isNaN(num)) return "$0.00";
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(num);
};

// 2. Formato de Fecha y Hora (Local para Ecuador)
window.formatearFecha = function(timestamp) {
    if (!timestamp) return "---";
    const fecha = new Date(timestamp);
    return fecha.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 3. Subida de Archivos (Fotos y Videos) a Firebase Storage
window.subirArchivoNativo = async function(archivo, carpeta) {
    if (!archivo) return null;
    try {
        const storageRef = firebase.storage().ref();
        const nombreUnico = `${Date.now()}_${archivo.name}`;
        const fileRef = storageRef.child(`${carpeta}/${nombreUnico}`);
        
        const snapshot = await fileRef.put(archivo);
        const url = await snapshot.ref.getDownloadURL();
        return url;
    } catch (error) {
        console.error("Error en subirArchivoNativo:", error);
        throw error;
    }
};