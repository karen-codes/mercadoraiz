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

// 1. Inicialización Robusta (Evita duplicados)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 2. Exportación Global para que todos los JS lo vean
window.db = firebase.database();
window.storage = firebase.storage();

// Alias internos
const db = window.db;
const storage = window.storage;

/***********************************
 * FUNCIONES MAESTRAS DE ACCESO (STORAGE & DATABASE)
 ***********************************/

/**
 * Sube un archivo nativo (Imagen o Video) al Storage de Google
 */
async function subirArchivoNativo(archivo, carpeta) {
    if (!archivo) return null;
    
    // Validación para videos pesados
    if (archivo.size > 25 * 1024 * 1024) { // Límite de 25MB recomendado
        alert("El archivo es demasiado grande. El máximo permitido es 25MB.");
        return null;
    }

    try {
        const nombreUnico = `${Date.now()}_${archivo.name.replace(/\s+/g, '_')}`;
        const storageRef = storage.ref(`${carpeta}/${nombreUnico}`);
        
        // Mostrar progreso simple en consola
        console.log(`Subiendo ${archivo.name} a la carpeta ${carpeta}...`);
        
        const snapshot = await storageRef.put(archivo);
        const url = await snapshot.ref.getDownloadURL();
        
        return url;
    } catch (error) {
        console.error("Error en Firebase Storage:", error);
        alert("Hubo un problema al subir el archivo. Verifica tu conexión.");
        return null;
    }
}

/**
 * Registrar un Pedido con Comprobante (Usado en carrito.html)
 * Vincula el archivo subido con la base de datos
 */
async function guardarPedidoFinal(pedidoData, archivoComprobante = null) {
    try {
        let urlFinalPago = "";
        
        // 1. Si hay archivo, subirlo primero
        if (archivoComprobante) {
            urlFinalPago = await subirArchivoNativo(archivoComprobante, 'comprobantes');
        }

        // 2. Crear el objeto del pedido alineado con el PANEL ADMIN
        const nuevoPedido = {
            ...pedidoData,
            urlPago: urlFinalPago, // Nombre de campo sincronizado con pedidos.js
            estado: "Pendiente",
            fecha: new Date().toLocaleDateString('es-EC'),
            hora: new Date().toLocaleTimeString(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // 3. Guardar en Realtime Database
        const ref = await db.ref('pedidos').push(nuevoPedido);
        return { success: true, id: ref.key };

    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener datos una sola vez (Carga de catálogos o perfiles)
 */
async function obtenerDatos(rama) {
    try {
        const snapshot = await db.ref(rama).once('value');
        const data = snapshot.val();
        if (!data) return [];
        
        // Convertir objeto de Firebase en Array con IDs incluidos
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