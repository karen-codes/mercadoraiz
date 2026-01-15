/***********************************
 * BASE DE DATOS LOCAL - MERCADO RAÍZ
 ***********************************/

function inicializarDB() {
    // 1. PROVEEDORES: Datos con ubicación y contacto para el mapa y perfil
    if (!localStorage.getItem("proveedores")) {
        const proveedoresIniciales = [
            { 
                id: 1, 
                nombre: "Hacienda El Carmen", 
                comunidad: "Cayambe Centro", 
                parcela: "Lote 4 - El Carmen", 
                lat: -0.041, lng: -78.143, 
                whatsapp: "593999999999", 
                historia: "20 años de agricultura sostenible en las faldas del volcán Cayambe.", 
                video: "https://www.youtube.com/embed/dQw4w9WgXcQ", 
                imagen: "assets/images/proveedores/carmen.jpg", 
                horario: "08h00 - 17h00", 
                formasPago: "Transferencia, Efectivo" 
            },
            { 
                id: 2, 
                nombre: "Asociación La Esperanza", 
                comunidad: "Pesillo", 
                parcela: "Comunidad Pesillo Centro", 
                lat: -0.030, lng: -78.170, 
                whatsapp: "593988888888", 
                historia: "Liderando la soberanía alimentaria comunitaria con prácticas ancestrales.", 
                video: "https://www.youtube.com/embed/dQw4w9WgXcQ", 
                imagen: "assets/images/proveedores/esperanza.jpg", 
                horario: "07h00 - 16h00", 
                formasPago: "Deuna, Efectivo" 
            }
        ];
        localStorage.setItem("proveedores", JSON.stringify(proveedoresIniciales));
    }

    // 2. PRODUCTOS: Ampliados con las categorías Papas, Frutas y Hortalizas
    if (!localStorage.getItem("productos")) {
        const productosIniciales = [
            // CATEGORÍA: PAPAS
            { id: 101, nombre: "Papa Chola", categoria: "papas", precio: 0.45, unidad: "lb", stock: 100, proveedorId: 1, imagen: "assets/images/productos/papa-chola.jpg" },
            { id: 102, nombre: "Papa Capira", categoria: "papas", precio: 0.50, unidad: "lb", stock: 80, proveedorId: 1, imagen: "assets/images/productos/papa-capira.jpg" },
            { id: 103, nombre: "Papa Chaucha", categoria: "papas", precio: 0.60, unidad: "lb", stock: 4, proveedorId: 2, imagen: "assets/images/productos/papa-chaucha.jpg" },

            // CATEGORÍA: FRUTAS
            { id: 201, nombre: "Mortiño Silvestre", categoria: "frutas", precio: 2.50, unidad: "lb", stock: 25, proveedorId: 2, imagen: "assets/images/productos/mortino.jpg" },
            { id: 202, nombre: "Frutilla de Altura", categoria: "frutas", precio: 1.20, unidad: "lb", stock: 40, proveedorId: 1, imagen: "assets/images/productos/frutilla.jpg" },
            { id: 203, nombre: "Tomate de Árbol", categoria: "frutas", precio: 0.35, unidad: "u", stock: 60, proveedorId: 2, imagen: "assets/images/productos/tomate-arbol.jpg" },

            // CATEGORÍA: HORTALIZAS
            { id: 301, nombre: "Brócoli Orgánico", categoria: "hortalizas", precio: 0.80, unidad: "u", stock: 30, proveedorId: 1, imagen: "assets/images/productos/brocoli.jpg" },
            { id: 302, nombre: "Zanahoria Amarilla", categoria: "hortalizas", precio: 0.30, unidad: "lb", stock: 150, proveedorId: 2, imagen: "assets/images/productos/zanahoria.jpg" },
            { id: 303, nombre: "Lechuga Crespa", categoria: "hortalizas", precio: 0.60, unidad: "u", stock: 2, proveedorId: 1, imagen: "assets/images/productos/lechuga.jpg" }
        ];
        localStorage.setItem("productos", JSON.stringify(productosIniciales));
    }

    // 3. USUARIOS: Admin para gestión y Cliente para pruebas
    if (!localStorage.getItem("usuarios")) {
        const usuariosIniciales = [
            { id: 1, nombre: "Admin Mercado", email: "admin@mercadoraiz.com", password: "admin", rol: "admin" },
            { id: 2, nombre: "Cliente Prueba", email: "cliente@correo.com", password: "123", rol: "cliente" }
        ];
        localStorage.setItem("usuarios", JSON.stringify(usuariosIniciales));
    }
    
    // 4. ESTRUCTURAS DE REGISTRO PARA EL PANEL ADMIN
    if (!localStorage.getItem("mensajesAdmin")) localStorage.setItem("mensajesAdmin", JSON.stringify([]));
    if (!localStorage.getItem("pedidos")) localStorage.setItem("pedidos", JSON.stringify([]));
    if (!localStorage.getItem("carrito")) localStorage.setItem("carrito", JSON.stringify([]));
}

// Ejecutar inicialización de la base de datos al cargar el script
inicializarDB();

// Sincronización de variables globales con el estado actual de LocalStorage
const proveedores = JSON.parse(localStorage.getItem("proveedores"));
const productos = JSON.parse(localStorage.getItem("productos"));
const usuarios = JSON.parse(localStorage.getItem("usuarios"));