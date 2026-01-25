/**
 * js/auth.js - SISTEMA DE AUTENTICACIÓN MERCADO RAÍZ 2026
 */

const USUARIO_ADMIN = "admin@mercadoraiz.com";
const CLAVE_ADMIN = "cayambe2026"; 

/**
 * Inicia sesión de forma segura
 */
async function iniciarSesion(email, password) {
    // 1. Verificación de Administrador
    if (email === USUARIO_ADMIN && password === CLAVE_ADMIN) {
        localStorage.setItem('session_active', 'true');
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('adminKey', 'cayambe2026'); 
        
        // Guardamos también un objeto de sesión para el admin por consistencia
        localStorage.setItem('sesionActiva', JSON.stringify({
            uid: 'admin_root',
            nombre: 'Administrador Mercado Raíz',
            email: email,
            role: 'admin'
        }));

        window.location.replace("admin.html");
        return;
    }

    // 2. Verificación de Clientes en Firebase
    try {
        const snapshot = await window.db.ref('usuarios').once('value');
        const usuarios = snapshot.val();
        let usuarioEncontrado = null;

        if (usuarios) {
            // Buscamos el usuario por email y password
            const entry = Object.entries(usuarios).find(([key, u]) => u.email === email && u.password === password);
            if (entry) {
                // entry[0] es la llave (ID) de Firebase, entry[1] son los datos
                usuarioEncontrado = { uid: entry[0], ...entry[1] };
            }
        }

        if (usuarioEncontrado) {
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('user_role', 'cliente');
            
            // IMPORTANTE: Guardamos como 'uid' para que el carrito lo reconozca siempre
            localStorage.setItem('sesionActiva', JSON.stringify({
                uid: usuarioEncontrado.uid, 
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
        alert("Error de conexión. Verifica tu internet.");
    }
}

/**
 * Registro de Clientes
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
            password: password, 
            telefono: telefono,
            fechaRegistro: new Date().toISOString(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // Guardamos en Firebase
        await window.db.ref('usuarios').push(nuevoUsuario);
        
        alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
        
        // Redirección limpia al login
        window.location.replace("login.html");
    } catch (error) {
        console.error("Error al registrar:", error);
        alert("Hubo un problema al crear tu cuenta.");
    }
}

/**
 * Cierre de sesión
 */
function cerrarSesion() {
    // Limpiamos todo el rastro de la sesión
    localStorage.removeItem('session_active');
    localStorage.removeItem('user_role');
    localStorage.removeItem('sesionActiva');
    localStorage.removeItem('adminKey');
    
    // Opcional: localStorage.clear(); si quieres borrar también el carrito al salir
    
    window.location.replace("index.html");
}