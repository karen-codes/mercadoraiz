/***********************************
 * BASE DE DATOS LOCAL - MERCADO RAÍZ
 ***********************************/

function inicializarDB() {
    // 1. PROVEEDORES
    if (!localStorage.getItem("proveedores")) {
        const proveedoresIniciales = [
            { 
                id: "1768758911415", // Usamos IDs largos para evitar choques
                nombre: "Hacienda El Carmen", 
                comunidad: "Cayambe Centro", 
                lat: -0.041, lng: -78.143, 
                whatsapp: "593999999999", 
                historia: "20 años de agricultura sostenible.", 
                imagen: "assets/images/proveedores/carmen.jpg" 
            },
            { 
                id: "2", 
                nombre: "Asociación La Esperanza", 
                comunidad: "Pesillo", 
                lat: -0.030, lng: -78.170, 
                whatsapp: "593988888888", 
                historia: "Soberanía alimentaria comunitaria.", 
                imagen: "assets/images/proveedores/esperanza.jpg" 
            }
        ];
        localStorage.setItem("proveedores", JSON.stringify(proveedoresIniciales));
    }

    // 2. PRODUCTOS (Solo se crean si la base está totalmente vacía)
    if (!localStorage.getItem("productos") || JSON.parse(localStorage.getItem("productos")).length === 0) {
        const productosIniciales = [
            { id: 101, nombre: "Papa Chola", categoria: "Papas y Tubérculos", precio: 0.45, unidad: "Libras", stock: 100, proveedorId: "1768758911415", imagen: "img/mora.jpg" },
            { id: 201, nombre: "Mora Silvestre", categoria: "Frutas", precio: 1.20, unidad: "Libras", stock: 25, proveedorId: "2", imagen: "img/mora.jpg" }
        ];
        localStorage.setItem("productos", JSON.stringify(productosIniciales));
    }

    // 3. ESTRUCTURAS DE CONTROL
    if (!localStorage.getItem("usuarios")) {
        const usuariosIniciales = [
            { id: 1, nombre: "Admin", email: "admin@mercadoraiz.com", password: "admin", rol: "admin" }
        ];
        localStorage.setItem("usuarios", JSON.stringify(usuariosIniciales));
    }

    // Inicializar contenedores vacíos si no existen
    ["mensajesAdmin", "pedidos", "carrito"].forEach(key => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([]));
    });
}

// Ejecutamos la semilla
inicializarDB();

/**
 * FUNCIONES DE ACCESO RÁPIDO (Para no romper main.js)
 * En lugar de variables estáticas, usamos funciones que leen el disco en tiempo real
 */
function obtenerProductos() {
    return JSON.parse(localStorage.getItem("productos")) || [];
}

function obtenerProveedores() {
    return JSON.parse(localStorage.getItem("proveedores")) || [];
}