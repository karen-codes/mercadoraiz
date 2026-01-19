/***********************************
 * CONFIGURACIÓN FIREBASE - MERCADO RAÍZ
 ***********************************/

// 1. Configuración de tu proyecto (Datos de tu consola de Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyB...", // Reemplaza con tu clave completa de la captura image_b58d48.png
    authDomain: "mercado-raiz.firebaseapp.com",
    databaseURL: "https://mercado-raiz-default-rtdb.firebaseio.com",
    projectId: "mercado-raiz",
    storageBucket: "mercado-raiz.firebasestorage.app",
    messagingSenderId: "886584284411",
    appId: "1:886584284411:web:NDI3ZqYWUtYWNhNS00NzEwLWIxMDktWjNmViYzk4Njly"
};

// 2. Inicialización de Firebase
firebase.initializeApp(firebaseConfig);

// 3. Referencias globales a los servicios
const db = firebase.database();
const storage = firebase.storage();

/**
 * FUNCIONES DE ACCESO A LA NUBE
 * Limpias de datos predeterminados.
 */

// Obtener productos en tiempo real desde la nube
async function obtenerProductos() {
    try {
        const snapshot = await db.ref('productos').once('value');
        const data = snapshot.val();
        // Retorna array vacío si no hay datos, de lo contrario mapea los productos
        return data ? Object.keys(data).map(key => ({ ...data[key], firebaseId: key })) : [];
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return [];
    }
}

// Obtener proveedores en tiempo real desde la nube
async function obtenerProveedores() {
    try {
        const snapshot = await db.ref('proveedores').once('value');
        const data = snapshot.val();
        // Retorna array vacío si no hay datos
        return data ? Object.keys(data).map(key => ({ ...data[key], firebaseId: key })) : [];
    } catch (error) {
        console.error("Error al obtener proveedores:", error);
        return [];
    }
}

// Escuchar cambios globales (Opcional: útil para actualizar la tienda automáticamente)
function suscribirACambios(entidad, callback) {
    db.ref(entidad).on('value', (snapshot) => {
        const data = snapshot.val();
        const array = data ? Object.keys(data).map(key => ({ ...data[key], firebaseId: key })) : [];
        callback(array);
    });
}