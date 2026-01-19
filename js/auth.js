// CONFIGURACIÓN DE ACCESO MÁSTER
const USUARIO_ADMIN = "admin@mercadoraiz.com";
const CLAVE_ADMIN = "cayambe2024";

/**
 * Inicia sesión: Admin vía código, Clientes vía Firebase
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
        let usuarioValido = null;

        if (usuarios) {
            usuarioValido = Object.values(usuarios).find(u => u.email === email && u.password === password);
        }

        if (usuarioValido) {
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('user_role', 'cliente');
            localStorage.setItem('sesionActiva', JSON.stringify({ // Mantenemos consistencia con main.js
                nombre: usuarioValido.nombre, 
                email: usuarioValido.email 
            }));
            window.location.href = 'index.html';
        } else {
            alert("Credenciales incorrectas o usuario no registrado.");
        }
    } catch (error) {
        console.error("Error en login:", error);
        alert("Error al conectar con el servidor.");
    }
}

/**
 * Registro de Clientes en Firebase Realtime Database
 */
async function registrarUsuario(nombre, email, password) {
    try {
        const snapshot = await db.ref('usuarios').once('value');
        const usuarios = snapshot.val();

        // Validar si el correo ya existe
        if (usuarios && Object.values(usuarios).some(u => u.email === email)) {
            alert("Este correo ya está registrado.");
            return;
        }

        const nuevoUsuario = {
            nombre: nombre,
            email: email,
            password: password, // En un entorno real, aquí se usaría Firebase Auth
            fecha: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };

        await db.ref('usuarios').push(nuevoUsuario);
        alert("¡Registro exitoso! Ya puedes iniciar sesión.");
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Error al registrar:", error);
        alert("No se pudo completar el registro.");
    }
}