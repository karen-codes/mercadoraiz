/***********************************
 * CONFIGURACIÓN FIREBASE - MERCADO RAÍZ
 ***********************************/

// 1. Configuración de tu proyecto (según tus capturas de pantalla)
const firebaseConfig = {
    apiKey: "AIzaSyB...", // Copia la API Key completa de tu captura image_b58d48.png
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
 * FUNCIONES DE ACCESO RÁPIDO PARA EL FRONTEND
 * Estas funciones ahora consultan la nube en lugar del localStorage
 */

// Obtener todos los productos (Devuelve una Promesa)
async function obtenerProductos() {
    try {
        const snapshot = await db.ref('productos').once('value');
        const data = snapshot.val();
        return data ? Object.keys(data).map(key => ({ ...data[key], firebaseId: key })) : [];
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return [];
    }
}

// Obtener todos los proveedores (Devuelve una Promesa)
async function obtenerProveedores() {
    try {
        const snapshot = await db.ref('proveedores').once('value');
        const data = snapshot.val();
        return data ? Object.keys(data).map(key => ({ ...data[key], firebaseId: key })) : [];
    } catch (error) {
        console.error("Error al obtener proveedores:", error);
        return [];
    }
}

// Función para inicializar datos semilla (opcional, solo la primera vez)
async function sembrarDatosIniciales() {
    const snapshot = await db.ref('productos').once('value');
    if (!snapshot.exists()) {
        console.log("Sembrando datos iniciales en la nube...");
        
        // Ejemplo de estructura inicial para proveedores
        const provRef = db.ref('proveedores').push();
        await provRef.set({
            nombre: "Hacienda El Carmen",
            comunidad: "Cayambe Centro",
            coords: "-0.041, -78.143",
            whatsapp: "593999999999",
            historia: "20 años de agricultura sostenible.",
            imagen: "" // Aquí irá la URL de Storage después
        });
    }
}

// Ejecutar si es necesario (puedes comentar esta línea tras la primera ejecución exitosa)
// sembrarDatosIniciales();