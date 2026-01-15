// Configuración de acceso
const USUARIO_ADMIN = "admin@mercadoraiz.com";
const CLAVE_ADMIN = "cayambe2024"; // Cambia esta clave en producción

// Función para iniciar sesión
function iniciarSesion(email, password) {
    if (email === USUARIO_ADMIN && password === CLAVE_ADMIN) {
        // Guardamos un token de sesión en el navegador
        localStorage.setItem('session_active', 'true');
        localStorage.setItem('user_role', 'admin');
        window.location.href = 'admin.html';
    } else {
        // Lógica para usuarios normales (clientes)
        const usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
        const usuarioValido = usuarios.find(u => u.email === email && u.password === password);

        if (usuarioValido) {
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('user_role', 'cliente');
            localStorage.setItem('user_data', JSON.stringify({ nombre: usuarioValido.nombre, email: usuarioValido.email }));
            window.location.href = 'index.html';
        } else {
            alert("Credenciales incorrectas. Inténtalo de nuevo.");
        }
    }
}

// Función para proteger el panel (Evita entrar por URL sin loguearse)
function verificarProteccionRuta() {
    const sesion = localStorage.getItem('session_active');
    const rol = localStorage.getItem('user_role');
    
    // Si no hay sesión o no es admin, redirigir al login
    if (!sesion || rol !== 'admin') {
        window.location.href = 'login.html';
    }
}

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('session_active');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_data');
    window.location.href = 'login.html';
}

// Función para registrar nuevos clientes (Desde login.html)
function registrarUsuario(nombre, email, password) {
    let usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
    
    // Verificar si el correo ya existe
    if (usuarios.some(u => u.email === email)) {
        return alert("Este correo ya está registrado.");
    }

    const nuevoUsuario = {
        id: Date.now(),
        nombre: nombre,
        email: email,
        password: password, // Se guarda para validación de login
        fecha: new Date().toLocaleDateString()
    };

    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios_registrados', JSON.stringify(usuarios));
    alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
}