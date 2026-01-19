/**
 * js/auth.js - SISTEMA DE AUTENTICACIÓN MERCADO RAÍZ 2026
 */

const USUARIO_ADMIN = "admin@mercadoraiz.com";
const CLAVE_ADMIN = "cayambe2026"; // Clave definida por el usuario

/**
 * Inicia sesión de forma segura
 */
async function iniciarSesion(email, password) {
    // 1. Verificación de Administrador (Local para velocidad y seguridad)
    if (email === USUARIO_ADMIN && password === CLAVE_ADMIN) {
        localStorage.setItem('session_active', 'true');
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('adminKey', 'cayambe2026'); 
        
        // Redirección forzada para saltar bloqueos de GitHub Pages
        window.location.replace("admin.html");
        return;
    }

    // 2. Verificación de Clientes en Firebase Realtime Database
    try {
        const snapshot = await window.db.ref('usuarios').once('value');
        const usuarios = snapshot.val();
        let usuarioEncontrado = null;

        if (usuarios) {
            const entry = Object.entries(usuarios).find(([key, u]) => u.email === email && u.password === password);
            if (entry) {
                usuarioEncontrado = { id: entry[0], ...entry[1] };
            }
        }

        if (usuarioEncontrado) {
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('user_role', 'cliente');
            localStorage.setItem('sesionActiva', JSON.stringify({
                id: usuarioEncontrado.id,
                nombre: usuarioEncontrado.nombre, 
                email: usuarioEncontrado.email,
                telefono: usuarioEncontrado.telefono || ''
            }));
            
            window.location.replace("index.html");
        } else {
            alert("Credenciales incorrectas. Verifica tu correo y contraseña.");
        }
    } catch (error) {
        console.error("Error crítico de Firebase:", error);
        alert("Error de conexión. Verifica tu internet o la base de datos.");
    }
}

/**
 * Registro de Clientes en la Nube
 */
async function registrarUsuario(nombre, email, password, telefono = "") {
    try {
        if (!nombre || !email || !password) {
            alert("Por favor completa todos los campos.");
            return;
        }

        const snapshot = await window.db.ref('usuarios').once('value');
        const usuarios = snapshot.val();

        // Evitar duplicados
        if (usuarios && Object.values(usuarios).some(u => u.email === email)) {
            alert("Este correo electrónico ya está registrado.");
            return;
        }

        const nuevoUsuario = {
            nombre: nombre,
            email: email,
            password: password, // En una app real usar Firebase Auth, aquí por RTDB según pedido
            telefono: telefono,
            fecha: new Date().toLocaleDateString('es-ES'),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        await window.db.ref('usuarios').push(nuevoUsuario);
        alert("¡Registro exitoso! Bienvenido a Mercado Raíz.");
        
        // Regresar a login para que el navegador guarde la contraseña correctamente
        window.location.replace("login.html");
    } catch (error) {
        console.error("Error al registrar:", error);
        alert("Hubo un problema al crear tu cuenta.");
    }
}

/**
 * Cierre de sesión y limpieza de caché
 */
function cerrarSesion() {
    localStorage.clear(); // Limpia todo para mayor seguridad
    window.location.replace("index.html");
}