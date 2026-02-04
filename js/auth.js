/**
 * js/auth.js - SISTEMA DE AUTENTICACIÓN MERCADO RAÍZ 2026
 */

const USUARIO_ADMIN = "admin@mercadoraiz.com";
const CLAVE_ADMIN = "cayambe2026"; 

/**
 * Inicia sesión de forma segura con redirección inteligente
 */
async function iniciarSesion(email, password) {
    // 1. Verificación de Administrador
    if (email === USUARIO_ADMIN && password === CLAVE_ADMIN) {
        localStorage.setItem('session_active', 'true');
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('adminKey', 'cayambe2026'); 
        
        localStorage.setItem('sesionActiva', JSON.stringify({
            uid: 'admin_root',
            nombre: 'Administrador Mercado Raíz',
            email: email,
            role: 'admin'
        }));

        window.location.replace("admin.html");
        return;
    }

    // 2. Verificación de Clientes
    try {
        const snapshot = await window.db.ref('usuarios').once('value');
        const usuarios = snapshot.val();
        let usuarioEncontrado = null;

        if (usuarios) {
            const entry = Object.entries(usuarios).find(([key, u]) => u.email === email && u.password === password);
            if (entry) {
                usuarioEncontrado = { uid: entry[0], ...entry[1] };
            }
        }

        if (usuarioEncontrado) {
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('user_role', 'cliente');
            
            localStorage.setItem('sesionActiva', JSON.stringify({
                uid: usuarioEncontrado.uid, 
                nombre: usuarioEncontrado.nombre, 
                email: usuarioEncontrado.email,
                telefono: usuarioEncontrado.telefono || ''
            }));
            
            // --- LÓGICA DE REDIRECCIÓN INTELIGENTE ---
            const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
            if (carrito.length > 0) {
                // Si tiene productos, lo mandamos directo a finalizar la compra
                window.location.replace("carrito.html");
            } else {
                window.location.replace("index.html");
            }
        } else {
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion("Error: Credenciales incorrectas");
            } else {
                alert("Credenciales incorrectas.");
            }
        }
    } catch (error) {
        console.error("Error crítico de Firebase:", error);
        alert("Error de conexión. Verifica tu internet.");
    }
}

/**
 * Registro de Clientes
 */
async function registrarUsuario(nombre, email, password, telefono = "") {
    try {
        if (!nombre || !email || !password) {
            if (window.mostrarNotificacion) window.mostrarNotificacion("Faltan campos por completar");
            return;
        }

        const snapshot = await window.db.ref('usuarios').once('value');
        const usuarios = snapshot.val();

        if (usuarios && Object.values(usuarios).some(u => u.email === email)) {
            if (window.mostrarNotificacion) window.mostrarNotificacion("Este correo ya existe");
            return;
        }

        const nuevoUsuario = {
            nombre: nombre,
            email: email,
            password: password, 
            telefono: telefono,
            fechaRegistro: new Date().toISOString(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        await window.db.ref('usuarios').push(nuevoUsuario);
        
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion("¡Éxito! Cuenta creada.");
            setTimeout(() => window.location.replace("login.html"), 1500);
        } else {
            alert("¡Registro exitoso!");
            window.location.replace("login.html");
        }
    } catch (error) {
        console.error("Error al registrar:", error);
        alert("Hubo un problema al crear tu cuenta.");
    }
}

/**
 * Cierre de sesión (Mantiene el carrito, borra la sesión)
 */
function cerrarSesion() {
    localStorage.removeItem('session_active');
    localStorage.removeItem('user_role');
    localStorage.removeItem('sesionActiva');
    localStorage.removeItem('adminKey');
    
    window.location.replace("index.html");
}