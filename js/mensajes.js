// js/mensajes.js

function renderizarTablaMensajes(cnt) {
    // Simulamos datos o los traemos de localStorage (puedes adaptarlo a tu formulario de contacto real)
    const mensajes = JSON.parse(localStorage.getItem('mensajes_contacto')) || [
        { id: 1, tipo: 'Socio', remitente: 'Rosa Pilataxi', asunto: 'Quiero vender mis quesos', fecha: '2024-05-10', leido: false, mensaje: 'Buen día, tengo una pequeña producción en la comunidad y me gustaría ser parte...' },
        { id: 2, tipo: 'Queja', remitente: 'Juan Pérez', asunto: 'Pedido incompleto', fecha: '2024-05-11', leido: true, mensaje: 'Mi pedido llegó sin las papas que solicité.' },
        { id: 3, tipo: 'Sugerencia', remitente: 'Maria C.', asunto: 'Más variedad de granos', fecha: '2024-05-12', leido: false, mensaje: 'Sería genial si pudieran incluir más tipos de quinua.' }
    ];

    cnt.innerHTML = `
        <div class="admin-card">
            <div class="card-header-flex" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <div>
                    <h3><i class="fas fa-envelope-open-text"></i> Centro de Mensajería</h3>
                    <p class="text-muted">Gestiona solicitudes de socios, quejas y sugerencias.</p>
                </div>
                <div class="filtros-mensajes">
                    <span class="badge" style="background:#eee; color:#333; cursor:pointer;">Todos</span>
                    <span class="badge badge-warning" style="cursor:pointer;">Solicitudes</span>
                    <span class="badge badge-danger" style="cursor:pointer;">Quejas</span>
                </div>
            </div>

            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Estado</th>
                            <th>Tipo</th>
                            <th>Remitente</th>
                            <th>Asunto</th>
                            <th>Fecha</th>
                            <th style="text-align: right;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mensajes.map((m, index) => `
                            <tr style="${m.leido ? 'opacity: 0.7;' : 'font-weight: bold; border-left: 4px solid var(--admin-accent);'}">
                                <td>
                                    <i class="${m.leido ? 'far fa-envelope-open' : 'fas fa-envelope'}" style="color: ${m.leido ? '#999' : 'var(--admin-accent)'}"></i>
                                </td>
                                <td>
                                    <span class="badge ${getTipoClase(m.tipo)}">${m.tipo}</span>
                                </td>
                                <td>${m.remitente}</td>
                                <td>${m.asunto}</td>
                                <td>${m.fecha}</td>
                                <td>
                                    <div class="actions-cell" style="display: flex; gap: 8px; justify-content: flex-end;">
                                        <button class="btn-edit" onclick="verMensaje(${index})" title="Leer Mensaje">
                                            <i class="fas fa-eye"></i>
                                        </div>
                                        <button class="btn-delete" onclick="eliminarMensaje(${index})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getTipoClase(tipo) {
    switch(tipo.toLowerCase()) {
        case 'socio': return 'badge-success'; // Verde para nuevos socios
        case 'queja': return 'badge-danger';  // Rojo para quejas
        case 'sugerencia': return 'badge-info'; // Azul para sugerencias
        default: return '';
    }
}

function verMensaje(index) {
    const mensajes = JSON.parse(localStorage.getItem('mensajes_contacto')) || [];
    const m = mensajes[index];
    
    // Aquí podrías abrir un modal para leer el mensaje completo
    alert(`De: ${m.remitente}\nAsunto: ${m.asunto}\n\nMensaje: ${m.mensaje}`);
    
    // Marcar como leído
    mensajes[index].leido = true;
    localStorage.setItem('mensajes_contacto', JSON.stringify(mensajes));
    renderizarTablaMensajes(document.getElementById('tabla-contenedor'));
}