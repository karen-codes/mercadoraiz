/***********************************
 * BASE DE DATOS LOCAL - MERCADO RAÍZ
 ***********************************/

function inicializarDB() {
    // 1. PROVEEDORES: Agregamos campos de contacto y ubicación precisos
    if (!localStorage.getItem("proveedores")) {
        const proveedoresIniciales = [
            { 
                id: 1, 
                nombre: "Hacienda El Carmen", 
                comunidad: "Cayambe", 
                parcela: "Lote 4 - El Carmen", 
                lat: -0.041, lng: -78.143, 
                whatsapp: "593999999999", 
                historia: "20 años de agricultura sostenible en las faldas del Cayambe.", 
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
                historia: "Liderando la soberanía alimentaria comunitaria en Pesillo.", 
                video: "https://www.youtube.com/embed/dQw4w9WgXcQ", 
                imagen: "assets/images/proveedores/esperanza.jpg", 
                horario: "07h00 - 16h00", 
                formasPago: "Deuna, Efectivo" 
            }
        ];
        localStorage.setItem("proveedores", JSON.stringify(proveedoresIniciales));
    }

    // 2. PRODUCTOS: Se agrega el campo 'stock' indispensable para el control de inventario
    if (!localStorage.getItem("productos")) {
        const productosIniciales = [
            { id: 101, nombre: "Papa Chola", categoria: "papas", precio: 0.45, unidad: "lb", stock: 100, proveedorId: 1, imagen: "assets/images/productos/papa-chola.jpg" },
            { id: 102, nombre: "Papa Chola", categoria: "papas", precio: 0.42, unidad: "lb", stock: 50, proveedorId: 2, imagen: "assets/images/productos/papa-chola.jpg" },
            { id: 103, nombre: "Papa Capira", categoria: "papas", precio: 0.50, unidad: "lb", stock: 80, proveedorId: 1, imagen: "assets/images/productos/papa-capira.jpg" },
            { id: 104, nombre: "Papa Chaucha", categoria: "papas", precio: 0.60, unidad: "lb", stock: 2, proveedorId: 2, imagen: "assets/images/productos/papa-chaucha.jpg" }
        ];
        localStorage.setItem("productos", JSON.stringify(productosIniciales));
    }

    // 3. USUARIOS: Roles definidos para seguridad
    if (!localStorage.getItem("usuarios")) {
        const usuariosIniciales = [
            { id: 1, nombre: "Admin Mercado", email: "admin@mercadoraiz.com", password: "admin", rol: "admin" },
            { id: 2, nombre: "Cliente Prueba", email: "cliente@correo.com", password: "123", rol: "cliente" }
        ];
        localStorage.setItem("usuarios", JSON.stringify(usuariosIniciales));
    }
    
    // 4. ESTRUCTURAS DE REGISTRO
    if (!localStorage.getItem("mensajes")) localStorage.setItem("mensajes", JSON.stringify([]));
    if (!localStorage.getItem("pedidos")) localStorage.setItem("pedidos", JSON.stringify([]));
    if (!localStorage.getItem("carrito")) localStorage.setItem("carrito", JSON.stringify([]));
}

// Ejecutar inicialización
inicializarDB();

// Exportar variables globales sincronizadas con LocalStorage
const proveedores = JSON.parse(localStorage.getItem("proveedores"));
const productos = JSON.parse(localStorage.getItem("productos"));
const usuarios = JSON.parse(localStorage.getItem("usuarios"));