// CONFIGURACIÓN DE ACCESO MÁSTER
const USUARIO_ADMIN = "admin@mercadoraiz.com";
const CLAVE_ADMIN = "cayambe2024";

/**
 * Inicia sesión y redirige según el rol
 */
function iniciarSesion(email, password) {
    if (email === USUARIO_ADMIN && password === CLAVE_ADMIN) {
        localStorage.setItem('session_active', 'true');
        localStorage.setItem('user_role', 'admin');
        window.location.href = 'admin.html';
    } else {
        const usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
        const usuarioValido = usuarios.find(u => u.email === email && u.password === password);

        if (usuarioValido) {
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('user_role', 'cliente');
            localStorage.setItem('user_data', JSON.stringify({ 
                nombre: usuarioValido.nombre, 
                email: usuarioValido.email 
            }));
            window.location.href = 'index.html';
        } else {
            alert("Credenciales incorrectas. Inténtalo de nuevo.");
        }
    }
}

/**
 * Protege las rutas del panel de administración
 */
function verificarProteccionRuta() {
    const sesion = localStorage.getItem('session_active');
    const rol = localStorage.getItem('user_role');
    
    if (!sesion || rol !== 'admin') {
        window.location.href = 'login.html';
    }
}

/**
 * Cierra sesión y limpia el almacenamiento local
 */
function cerrarSesion() {
    localStorage.removeItem('session_active');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_data');
    window.location.href = 'login.html';
}

/**
 * Registra un nuevo cliente desde la web pública
 */
function registrarUsuario(nombre, email, password) {
    let usuarios = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
    
    if (usuarios.some(u => u.email === email)) {
        alert("Este correo ya está registrado.");
        return;
    }

    const nuevoUsuario = {
        id: Date.now(),
        nombre: nombre,
        email: email,
        password: password,
        fecha: new Date().toLocaleDateString()
    };

    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios_registrados', JSON.stringify(usuarios));
    alert("¡Registro exitoso! Ya puedes iniciar sesión.");
    window.location.href = 'login.html';
}

// Inicializador de eventos si estamos en login.html
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            iniciarSesion(email, pass);
        });
    }
});