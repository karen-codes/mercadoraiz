/**
 * js/admin-modulos/admin-pagos.js
 * Gestión de Liquidaciones e Historial - Mercado Raíz 2026
 */

window.initPagos = function(contenedor) {
    contenedor.innerHTML = `
        <div class="admin-card">
            <div class="admin-tabs" style="display:flex; gap:10px; margin-bottom:20px; border-bottom:2px solid #eee; padding-bottom:10px;">
                <button onclick="window.cambiarTabPagos('pendientes')" id="tab-pendientes" class="btn-tab active" style="background:none; border:none; padding:10px 20px; cursor:pointer; font-weight:bold; color:var(--pueblo-terracotta); border-bottom: 2px solid var(--pueblo-terracotta);">Pendientes de Pago</button>
                <button onclick="window.cambiarTabPagos('historial')" id="tab-historial" class="btn-tab" style="background:none; border:none; padding:10px 20px; cursor:pointer; font-weight:bold; color:#888;">Historial de Pagos</button>
            </div>

            <div id="vista-pendientes">
                <p style="color: var(--text-muted); margin-bottom:15px;">Ventas acumuladas por productor listas para liquidar.</p>
                <table class="tabla-admin">
                    <thead>
                        <tr>
                            <th>Productor</th>
                            <th>Datos Bancarios</th>
                            <th>Ventas Totales</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="lista-pagos-pendientes">
                        <tr><td colspan="4" style="text-align:center; padding:20px;">Cargando proveedores...</td></tr>
                    </tbody>
                </table>
            </div>

            <div id="vista-historial" style="display:none;">
                <p style="color: var(--text-muted); margin-bottom:15px;">Registro de transferencias realizadas a productores.</p>
                <table class="tabla-admin">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Productor</th>
                            <th>Monto Pagado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="lista-pagos-historial">
                        <tr><td colspan="4" style="text-align:center; padding:20px;">No hay historial registrado.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(() => {
        window.cargarDatosPagos();
    }, 150);
};

window.cambiarTabPagos = function(tab) {
    const vPendientes = document.getElementById('vista-pendientes');
    const vHistorial = document.getElementById('vista-historial');
    const tPendientes = document.getElementById('tab-pendientes');
    const tHistorial = document.getElementById('tab-historial');

    if (tab === 'pendientes') {
        vPendientes.style.display = 'block';
        vHistorial.style.display = 'none';
        tPendientes.style.color = 'var(--pueblo-terracotta)';
        tPendientes.style.borderBottom = '2px solid var(--pueblo-terracotta)';
        tHistorial.style.color = '#888';
        tHistorial.style.borderBottom = 'none';
    } else {
        vPendientes.style.display = 'none';
        vHistorial.style.display = 'block';
        tPendientes.style.color = '#888';
        tPendientes.style.borderBottom = 'none';
        tHistorial.style.color = 'var(--pueblo-terracotta)';
        tHistorial.style.borderBottom = '2px solid var(--pueblo-terracotta)';
    }
};

window.cargarDatosPagos = async function() {
    try {
        const [pSnap, pedSnap, liqSnap] = await Promise.all([
            window.db.ref('proveedores').once('value'),
            window.db.ref('pedidos').once('value'),
            window.db.ref('liquidaciones').once('value')
        ]);

        const proveedores = pSnap.val() || {};
        const pedidos = pedSnap.val() || {};
        const liquidaciones = liqSnap.val() || {};

        renderizarPendientes(proveedores, pedidos, liquidaciones);
        renderizarHistorial(liquidaciones, proveedores);

    } catch (e) {
        console.error("Error cargando pagos:", e);
    }
};

function renderizarPendientes(proveedores, pedidos, liquidaciones) {
    const tbody = document.getElementById('lista-pagos-pendientes');
    if (!tbody) return;
    tbody.innerHTML = "";

    Object.entries(proveedores).forEach(([idProv, prov]) => {
        let totalVentas = 0;
        
        Object.values(pedidos).forEach(ped => {
            if (ped.estado === 'Pagado' && ped.items) {
                ped.items.forEach(item => {
                    if ((item.idProductor || item.productorId) === idProv) {
                        totalVentas += (parseFloat(item.precio) * parseInt(item.cantidad));
                    }
                });
            }
        });

        let totalLiquidado = 0;
        Object.values(liquidaciones).forEach(l => {
            if (l.idProductor === idProv) totalLiquidado += parseFloat(l.monto);
        });

        const saldo = totalVentas - totalLiquidado;

        if (saldo > 0.01) {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${prov.nombreParcela || prov.nombre}</strong><br><small>${prov.comunidad || 'Cayambe'}</small></td>
                    <td>
                        <div style="font-size:0.85rem; background:#f4f6f4; padding:8px; border-radius:6px; border-left: 3px solid #8da281;">
                            <strong>${prov.banco || 'S/N'}</strong><br>
                            <span>Cuenta: ${prov.numeroCuenta || 'S/N'}</span>
                        </div>
                    </td>
                    <td><strong style="color:#27ae60; font-size: 1.1rem;">$${saldo.toFixed(2)}</strong></td>
                    <td>
                        <div style="display:flex; gap:5px;">
                            <button onclick="window.confirmarPago('${idProv}', ${saldo}, '${prov.nombreParcela || prov.nombre}')" class="btn-save" style="background:#8da281; border:none; padding:8px 12px; cursor:pointer; color:white; border-radius:4px;">
                                <i class="fas fa-check-double"></i> Liquidar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    });

    if (!tbody.innerHTML) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay pagos pendientes.</td></tr>';
}

function renderizarHistorial(liquidaciones, proveedores) {
    const tbody = document.getElementById('lista-pagos-historial');
    if (!tbody) return;
    tbody.innerHTML = "";

    const listaOrdenada = Object.values(liquidaciones).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    listaOrdenada.forEach(liq => {
        const fechaLocal = new Date(liq.fecha).toLocaleDateString();
        const provData = proveedores[liq.idProductor] || {};
        const telf = provData.telefono || '';

        tbody.innerHTML += `
            <tr>
                <td>${fechaLocal}</td>
                <td><strong>${liq.nombreProductor}</strong></td>
                <td><strong style="color:#2c3e50;">$${parseFloat(liq.monto).toFixed(2)}</strong></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button onclick="window.notificarPorWhatsApp('${telf}', '${liq.monto}', '${liq.nombreProductor}')" style="background:#25d366; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;" title="Avisar por WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        <button onclick="window.generarPDFPago('${liq.nombreProductor}', '${liq.monto}', '${liq.fecha}')" style="background:#e74c3c; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;" title="Descargar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

window.confirmarPago = async function(idProv, monto, nombre) {
    if (!confirm(`¿Confirmas que ya transferiste $${monto.toFixed(2)} a ${nombre}?`)) return;

    const nuevaLiq = {
        idProductor: idProv,
        nombreProductor: nombre,
        monto: monto,
        fecha: new Date().toISOString()
    };

    try {
        await window.db.ref('liquidaciones').push(nuevaLiq);
        if (window.mostrarNotificacion) window.mostrarNotificacion(`Liquidación guardada para ${nombre}`);
        
        // RECARGA COMPLETA DE DATOS
        await window.cargarDatosPagos();
    } catch (e) {
        console.error(e);
    }
};

window.notificarPorWhatsApp = function(telefono, monto, nombre) {
    if (!telefono) {
        alert("El productor no tiene teléfono registrado.");
        return;
    }
    const msj = encodeURIComponent(`¡Hola ${nombre}! 🌿\n\nDesde *Mercado Raíz* te informamos que ya hemos realizado el pago de tu liquidación por un valor de *$${parseFloat(monto).toFixed(2)}*.\n\nPor favor, verifica tu cuenta bancaria. ¡Gracias por cultivar con nosotros! 👩‍🌾👨‍🌾`);
    window.open(`https://wa.me/${telefono}?text=${msj}`, '_blank');
};

window.generarPDFPago = function(nombre, monto, fecha) {
    if(!window.jspdf) {
        alert("Cargando librería PDF, intenta en un momento...");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const f = new Date(fecha).toLocaleDateString();

    doc.setFontSize(22);
    doc.setTextColor(141, 162, 129);
    doc.text("MERCADO RAÍZ", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("COMPROBANTE DE PAGO", 105, 30, { align: "center" });
    
    doc.setDrawColor(141, 162, 129);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(12);
    doc.text(`Fecha de Liquidación: ${f}`, 20, 50);
    doc.text(`Productor: ${nombre}`, 20, 60);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 75, 170, 25, 'F');
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`VALOR PAGADO: $${parseFloat(monto).toFixed(2)}`, 105, 92, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Este documento es un respaldo digital de la transferencia realizada a través de la plataforma.", 105, 120, { align: "center" });

    doc.save(`Comprobante_${nombre.replace(/\s/g, '_')}.pdf`);
};