/***********************************
 * CONFIGURACIÓN FIREBASE - MERCADO RAÍZ 2026
 ***********************************/

const firebaseConfig = {
    apiKey: "AIzaSyBqakqg919pu0GjMkaJhntman0n4Q1jnw", 
    authDomain: "mercado-raiz.firebaseapp.com",
    databaseURL: "https://mercado-raiz-default-rtdb.firebaseio.com",
    projectId: "mercado-raiz",
    storageBucket: "mercado-raiz.firebasestorage.app",
    messagingSenderId: "886584284411",
    appId: "1:886584284411:web:NDI3ZqYWUtYWNhNS00NzEwLWIxMDktWjNmViYzk4Njly",
    measurementId: "G-5EW3Y8Z2XE"
};

// 1. Inicialización Robusta
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // Si ya existe, usa la instancia actual
}

// 2. Exportación Global Segura
window.db = firebase.database();
window.storage = firebase.storage();

// Referencias simplificadas para uso interno
const db = window.db;
const storage = window.storage;

/***********************************
 * FUNCIONES MAESTRAS DE ACCESO
 ***********************************/

/**
 * Sube un archivo (Imagen de pago, Video de finca o Foto de producto)
 * @param {File} archivo - Archivo desde el input type="file"
 * @param {string} carpeta - 'productos', 'comprobantes', 'videos' o 'fincas'
 */
async function subirArchivoNativo(archivo, carpeta) {
    if (!archivo) return null;
    try {
        const nombreUnico = `${Date.now()}_${archivo.name}`;
        const storageRef = storage.ref(`${carpeta}/${nombreUnico}`);
        const snapshot = await storageRef.put(archivo);
        const url = await snapshot.ref.getDownloadURL();
        console.log(`Archivo guardado en ${carpeta}:`, url);
        return url;
    } catch (error) {
        console.error("Error al subir a Storage:", error);
        alert("Error de conexión al subir multimedia.");
        return null;
    }
}

/**
 * Obtener datos una sola vez (Útil para carga inicial de la web)
 */
async function obtenerDatos(rama) {
    try {
        const snapshot = await db.ref(rama).once('value');
        const data = snapshot.val();
        return data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
    } catch (error) {
        console.error(`Error al obtener ${rama}:`, error);
        return [];
    }
}

/**
 * Registrar un Pedido con Comprobante de Pago (QR o Transferencia)
 */
async function guardarPedidoFinal(pedidoData, archivoComprobante = null) {
    try {
        let urlComprobante = "";
        
        // Si el usuario subió una foto del pago, la guardamos primero
        if (archivoComprobante) {
            urlComprobante = await subirArchivoNativo(archivoComprobante, 'comprobantes');
        }

        const nuevoPedido = {
            ...pedidoData,
            comprobanteUrl: urlComprobante,
            estado: "Pendiente",
            fecha: new Date().toLocaleDateString('es-EC'),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        const ref = await db.ref('pedidos').push(nuevoPedido);
        return { success: true, id: ref.key };
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Suscripción en tiempo real (Para el Panel Admin)
 */
function suscribirACambios(entidad, callback) {
    db.ref(entidad).on('value', (snapshot) => {
        const data = snapshot.val();
        const array = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
        callback(array);
    }, (error) => {
        console.error(`Error de permisos en ${entidad}:`, error);
    });
}