// Simulación de datos de pedidos (esto vendría de tu base de datos o localStorage)
let pedidos = JSON.parse(localStorage.getItem('pedidos_db')) || [
    {
        id: "PED-001",
        cliente: "Juan Pérez",
        fecha: "2026-01-18",
        total: 25.50,
        estado: "Pendiente",
        comprobante: "assets/comprobantes/pago1.jpg"
    }
];

function mostrarPedidos() {
    const contenedor = document.getElementById('tabla-contenedor');
    contenedor.innerHTML = `
        <div class="admin-card-container">
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID Pedido</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="lista-pedidos-body">
                        ${pedidos.map(p => `
                            <tr>
                                <td><b>${p.id}</b></td>
                                <td>${p.cliente}</td>
                                <td>$${p.total.toFixed(2)}</td>
                                <td><span class="badge ${p.estado === 'Pendiente' ? 'badge-warning' : 'badge-success'}">${p.estado}</span></td>
                                <td class="actions-cell">
                                    <button class="btn-edit" onclick="verDetallePedido('${p.id}')"><i class="fas fa-eye"></i> Ver</button>
                                    <button class="btn-delete" onclick="eliminarPedido('${p.id}')"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function verDetallePedido(id) {
    const pedido = pedidos.find(p => p.id === id);
    abrirModal();
    document.getElementById('modalTitulo').innerText = `Detalle Pedido: ${id}`;
    
    const campos = document.getElementById('camposDinamicos');
    campos.innerHTML = `
        <div class="info-grid">
            <div><strong>Cliente:</strong> ${pedido.cliente}</div>
            <div><strong>Fecha:</strong> ${pedido.fecha}</div>
            <div><strong>Monto a Validar:</strong> $${pedido.total}</div>
        </div>
        <div style="margin-top:15px;">
            <label>Comprobante de Pago:</label>
            <img src="${pedido.comprobante}" style="width:100%; border-radius:10px; margin-top:10px; border:1px solid #ddd;">
        </div>
    `;
}