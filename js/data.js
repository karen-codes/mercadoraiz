/***********************************
 * CONFIGURACIÓN FIREBASE - MERCADO RAÍZ
 ***********************************/

// 1. Configuración unificada (Extraída de tus capturas image_b58d48 e image_b42c86)
const firebaseConfig = {
    apiKey: "AIzaSyBqakqg919pu0GjMkaJhntman0n4Q1jnw", 
    authDomain: "mercado-raiz.firebaseapp.com",
    databaseURL: "https://mercado-raiz-default-rtdb.firebaseio.com",
    projectId: "mercado-raiz",
    storageBucket: "mercado-raiz.firebasestorage.app",
    messagingSenderId: "886584284411",
    appId: "1:886584284411:web:f006908eeb8d9da224cc5e", // AppId de tu captura de admin.html
    measurementId: "G-5EW3Y8Z2XE"
};

// 2. Inicialización Segura
// Esto evita que Firebase se inicialice dos veces si refrescas la página
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 3. Exportación a nivel Global (window)
// Esto es VITAL para que los archivos pedidos.js, admin.js y auth.js no den error
window.db = firebase.database();
window.storage = firebase.storage();

// Alias locales para uso interno en este archivo
const db = window.db;
const storage = window.storage;

/**
 * FUNCIONES DE ACCESO A LA NUBE
 */

// Obtener productos (Asíncrono)
async function obtenerProductos() {
    try {
        const snapshot = await db.ref('productos').once('value');
        const data = snapshot.val();
        return data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return [];
    }
}

// Obtener proveedores (Asíncrono)
async function obtenerProveedores() {
    try {
        const snapshot = await db.ref('proveedores').once('value');
        const data = snapshot.val();
        return data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
    } catch (error) {
        console.error("Error al obtener proveedores:", error);
        return [];
    }
}

// Escuchar cambios en tiempo real
function suscribirACambios(entidad, callback) {
    db.ref(entidad).on('value', (snapshot) => {
        const data = snapshot.val();
        const array = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
        callback(array);
    }, (error) => {
        console.error(`Error de permisos en ${entidad}:`, error);
    });
}