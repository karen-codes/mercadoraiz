/**
 * js/auth.js - SISTEMA DE AUTENTICACIÓN MERCADO RAÍZ
 */

// CONFIGURACIÓN DE ACCESO MÁSTER (Panel de Gestión)
const USUARIO_ADMIN = "admin@mercadoraiz.com";
const CLAVE_ADMIN = "cayambe2026"; // Actualizado a 2026

/**
 * Inicia sesión: Admin vía código, Clientes vía Firebase Realtime Database
 */
async function iniciarSesion(email, password) {
    // 1. Verificación de Administrador
    if (email === USUARIO_ADMIN && password === CLAVE_ADMIN) {
        localStorage.setItem('session_active', 'true');
        localStorage.setItem('user_role', 'admin');
        window.location.href = 'admin.html';
        return;
    }

    // 2. Verificación de Clientes en Firebase
    try {
        const snapshot = await db.ref('usuarios').once('value');
        const usuarios = snapshot.val();
        let usuarioEncontrado = null;

        if (usuarios) {
            // Buscamos el usuario y extraemos su Key de Firebase (ID)
            const entry = Object.entries(usuarios).find(([key, u]) => u.email === email && u.password === password);
            if (entry) {
                usuarioEncontrado = { id: entry[0], ...entry[1] };
            }
        }

        if (usuarioEncontrado) {
            // Guardar sesión con ID único para vincular pedidos
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('user_role', 'cliente');
            localStorage.setItem('sesionActiva', JSON.stringify({
                id: usuarioEncontrado.id, // ID de Firebase
                nombre: usuarioEncontrado.nombre, 
                email: usuarioEncontrado.email,
                telefono: usuarioEncontrado.telefono || ''
            }));
            
            window.location.href = 'index.html';
        } else {
            alert("Credenciales incorrectas. Por favor, verifica tu correo y contraseña.");
        }
    } catch (error) {
        console.error("Error en login:", error);
        alert("Error de conexión con la base de datos.");
    }
}

/**
 * Registro de Clientes
 */
async function registrarUsuario(nombre, email, password, telefono = "") {
    try {
        // Validar campos básicos
        if (!nombre || !email || !password) {
            alert("Por favor completa todos los campos.");
            return;
        }

        const snapshot = await db.ref('usuarios').once('value');
        const usuarios = snapshot.val();

        // Validar si el correo ya existe para evitar duplicados
        if (usuarios && Object.values(usuarios).some(u => u.email === email)) {
            alert("Este correo electrónico ya está registrado en Mercado Raíz.");
            return;
        }

        const nuevoUsuario = {
            nombre: nombre,
            email: email,
            password: password,
            telefono: telefono,
            fecha: new Date().toLocaleDateString('es-ES'),
            timestamp: firebase.database.ServerValue.TIMESTAMP // Hora exacta del servidor
        };

        await db.ref('usuarios').push(nuevoUsuario);
        alert("¡Registro exitoso! Bienvenido a la comunidad de Mercado Raíz.");
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Error al registrar:", error);
        alert("Hubo un problema al crear tu cuenta.");
    }
}

/**
 * Cierre de Sesión Universal
 */
function cerrarSesion() {
    localStorage.removeItem('session_active');
    localStorage.removeItem('user_role');
    localStorage.removeItem('sesionActiva');
    window.location.href = 'index.html';
}