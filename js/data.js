/***********************************
 * CONFIGURACIÓN FIREBASE - MERCADO RAÍZ 2026
 ***********************************/

// Usamos var y un chequeo de existencia para evitar el error 'Identifier already declared'
if (typeof firebaseConfig === 'undefined') {
    var firebaseConfig = {
        apiKey: "AIzaSyBqakqg919pu0GjMkaJhntman0n4Q1jnw", 
        authDomain: "mercado-raiz.firebaseapp.com",
        databaseURL: "https://mercado-raiz-default-rtdb.firebaseio.com",
        projectId: "mercado-raiz",
        storageBucket: "mercado-raiz.firebasestorage.app",
        messagingSenderId: "886584284411",
        appId: "1:886584284411:web:NDI3ZqYWUtYWNhNS00NzEwLWIxMDktWjNmViYzk4Njly",
        measurementId: "G-5EW3Y8Z2XE"
    };
}

// 1. Inicialización Robusta
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 2. Exportación Global
window.db = firebase.database();

// Manejo seguro de Storage
try {
    window.storage = firebase.storage();
} catch (e) {
    console.warn("Aviso: Firebase Storage no se cargó. Verifica que el script 'storage-compat' esté en tu HTML.");
}

// Alias internos
var db = window.db;
var storage = window.storage;

/***********************************
 * FUNCIONES MAESTRAS DE ACCESO (STORAGE & DATABASE)
 ***********************************/

/**
 * Sube un archivo nativo (Imagen o Video) al Storage de Google
 */
async function subirArchivoNativo(archivo, carpeta) {
    if (!archivo || !storage) return null;
    
    if (archivo.size > 25 * 1024 * 1024) { 
        alert("El archivo es demasiado grande. El máximo permitido es 25MB.");
        return null;
    }

    try {
        const nombreUnico = `${Date.now()}_${archivo.name.replace(/\s+/g, '_')}`;
        const storageRef = storage.ref(`${carpeta}/${nombreUnico}`);
        
        console.log(`Subiendo ${archivo.name} a la carpeta ${carpeta}...`);
        
        const snapshot = await storageRef.put(archivo);
        const url = await snapshot.ref.getDownloadURL();
        
        console.log("Archivo subido con éxito. URL obtenida.");
        return url;
    } catch (error) {
        console.error("Error en Firebase Storage:", error);
        alert("Hubo un problema al subir el archivo.");
        return null;
    }
}

/**
 * Registrar un Pedido con Comprobante (Usado en carrito.html)
 * Se asegura de subir la imagen antes de guardar los datos en la DB
 */
async function guardarPedidoFinal(pedidoData, archivoComprobante = null) {
    try {
        let urlFinalPago = "";
        
        // 1. Subir primero el comprobante si existe
        if (archivoComprobante) {
            console.log("Iniciando subida de comprobante de pago...");
            urlFinalPago = await subirArchivoNativo(archivoComprobante, 'comprobantes');
            if (!urlFinalPago) throw new Error("La subida del comprobante falló.");
        }

        // 2. Construir el objeto final incluyendo el timestamp para el Admin
        const nuevoPedido = {
            ...pedidoData,
            urlPago: urlFinalPago, 
            estado: "Pendiente",
            fecha: new Date().toLocaleDateString('es-EC'),
            hora: new Date().toLocaleTimeString(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        console.log("Guardando datos del pedido en Database...");
        const ref = await db.ref('pedidos').push(nuevoPedido);
        
        return { success: true, id: ref.key };

    } catch (error) {
        console.error("Error al procesar el pedido final:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener datos una sola vez
 */
async function obtenerDatos(rama) {
    try {
        const snapshot = await db.ref(rama).once('value');
        const data = snapshot.val();
        if (!data) return [];
        
        return Object.keys(data).map(key => ({ 
            ...data[key], 
            id: key 
        }));
    } catch (error) {
        console.error(`Error en obtenerDatos (${rama}):`, error);
        return [];
    }
}

/**
 * Listener en tiempo real (Para que el Panel Admin se actualice solo)
 */
function suscribirACambios(entidad, callback) {
    db.ref(entidad).on('value', (snapshot) => {
        const data = snapshot.val();
        const array = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
        callback(array);
    });
}

// --- RESTAURACIÓN DE EXPORTACIONES GLOBALES ---
window.firebase = firebase;
window.subirArchivoNativo = subirArchivoNativo;
window.guardarPedidoFinal = window.guardarPedidoFinal || guardarPedidoFinal; // Aseguramos disponibilidad
window.obtenerDatos = obtenerDatos;
window.suscribirACambios = suscribirACambios;

console.log("Mercado Raíz: Data SDK inicializado correctamente.");