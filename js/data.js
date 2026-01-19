/***********************************
 * CONFIGURACIÓN FIREBASE - MERCADO RAÍZ
 ***********************************/

// 1. Configuración de tu proyecto (Datos extraídos de tus capturas)
const firebaseConfig = {
    // Reemplaza AIzaSyB... con la API Key completa que sale en tu captura image_b58d48.png
    apiKey: "AIzaSyBqaKqg919pu0GjMKaJhntmaNn0n4Q1jnw", 
    authDomain: "mercado-raiz.firebaseapp.com",
    databaseURL: "https://mercado-raiz-default-rtdb.firebaseio.com",
    projectId: "mercado-raiz",
    storageBucket: "mercado-raiz.firebasestorage.app",
    messagingSenderId: "886584284411",
    appId: "1:886584284411:web:NDI3ZqYWUtYWNhNS00NzEwLWIxMDktWjNmViYzk4Njly"
};

// 2. Inicialización de Firebase
// Asegúrate de tener cargados los scripts de Firebase en tu HTML antes que este archivo
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 3. Referencias globales a los servicios
const db = firebase.database();
const storage = firebase.storage();

/**
 * FUNCIONES DE ACCESO A LA NUBE
 * No contienen datos predeterminados, todo viene de Firebase.
 */

// Obtener productos en tiempo real desde la nube
async function obtenerProductos() {
    try {
        const snapshot = await db.ref('productos').once('value');
        const data = snapshot.val();
        // Si no hay datos, retorna un array vacío de forma segura
        return data ? Object.keys(data).map(key => ({ ...data[key], firebaseId: key })) : [];
    } catch (error) {
        console.error("Error al obtener productos de la nube:", error);
        return [];
    }
}

// Obtener proveedores en tiempo real desde la nube
async function obtenerProveedores() {
    try {
        const snapshot = await db.ref('proveedores').once('value');
        const data = snapshot.val();
        // Si no hay datos, retorna un array vacío de forma segura
        return data ? Object.keys(data).map(key => ({ ...data[key], firebaseId: key })) : [];
    } catch (error) {
        console.error("Error al obtener proveedores de la nube:", error);
        return [];
    }
}

// Función para escuchar cambios y actualizar la interfaz automáticamente
function suscribirACambios(entidad, callback) {
    db.ref(entidad).on('value', (snapshot) => {
        const data = snapshot.val();
        const array = data ? Object.keys(data).map(key => ({ ...data[key], firebaseId: key })) : [];
        callback(array);
    }, (error) => {
        console.error(`Error en la suscripción de ${entidad}:`, error);
    });
}