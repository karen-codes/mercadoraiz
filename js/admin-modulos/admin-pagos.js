/**
 * js/admin-modulos/admin-pagos.js
 * Gestión de Liquidaciones e Historial - Mercado Raíz 2026
 */

window.initPagos = function(contenedor) {
    contenedor.innerHTML = `
        <div class="admin-card">
            <div class="admin-tabs" style="display:flex; gap:10px; margin-bottom:20px; border-bottom:2px solid #eee; padding-bottom:10px;">
                <button onclick="window.cambiarTabPagos('pendientes')" id="tab-pendientes" class="btn-tab active" style="background:none; border:none; padding:10px 20px; cursor:pointer; font-weight:bold; color:#27ae60; border-bottom: 2px solid #27ae60;">Pendientes de Pago</button>
                <button onclick="window.cambiarTabPagos('historial')" id="tab-historial" class="btn-tab" style="background:none; border:none; padding:10px 20px; cursor:pointer; font-weight:bold; color:#888;">Historial de Pagos</button>
            </div>

            <div id="vista-pendientes">
                <p style="color: var(--text-muted); margin-bottom:15px;">Ventas acumuladas por productor listas para liquidar.</p>
                <div class="table-responsive">
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
            </div>

            <div id="vista-historial" style="display:none;">
                <p style="color: var(--text-muted); margin-bottom:15px;">Registro de transferencias realizadas a productores.</p>
                <div class="table-responsive">
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

    if (!vPendientes || !vHistorial) return;

    if (tab === 'pendientes') {
        vPendientes.style.display = 'block';
        vHistorial.style.display = 'none';
        tPendientes.style.color = '#27ae60';
        tPendientes.style.borderBottom = '2px solid #27ae60';
        tHistorial.style.color = '#888';
        tHistorial.style.borderBottom = 'none';
    } else {
        vPendientes.style.display = 'none';
        vHistorial.style.display = 'block';
        tPendientes.style.color = '#888';
        tPendientes.style.borderBottom = 'none';
        tHistorial.style.color = '#27ae60';
        tHistorial.style.borderBottom = '2px solid #27ae60';
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

    // Dentro de renderizarPendientes en admin-pagos.js
Object.entries(proveedores).forEach(([idProv, prov]) => {
    let totalVentas = 0;
    
    Object.values(pedidos).forEach(ped => {
        if (ped && ped.estado === 'Pagado' && ped.liquidaciones) {
            // BUSQUEDA DIRECTA POR ID
            // Si el idProv (ej: -Ok0S...) coincide con la llave en liquidaciones
            if (ped.liquidaciones[idProv]) {
                totalVentas += parseFloat(ped.liquidaciones[idProv]);
            }
            
            // CASO ESPECIAL: Si el ID en el pedido es "general" y estamos procesando 
            // un proveedor que tú definas como "general" o por defecto.
            if (idProv === "general" && ped.liquidaciones["general"]) {
                totalVentas += parseFloat(ped.liquidaciones["general"]);
            }
        }
    });

        // Restar lo que ya se ha liquidado históricamente (Mantenemos tu lógica original)
        let totalLiquidado = 0;
        if (liquidaciones) {
            Object.values(liquidaciones).forEach(l => {
                if (l && l.idProductor === idProv) {
                    totalLiquidado += parseFloat(l.monto || 0);
                }
            });
        }

        const saldo = totalVentas - totalLiquidado;

        if (saldo > 0.01) {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${prov.nombreParcela || prov.nombre}</strong><br><small>${prov.comunidad || 'Cayambe'}</small></td>
                    <td>
                        <div style="font-size:0.85rem; background:#f4f6f4; padding:8px; border-radius:6px; border-left: 3px solid #8da281;">
                            <strong>${prov.banco || 'S/N'}</strong><br>
                            <span>Cuenta: ${prov.numeroCuenta || prov.numCta || prov.numCuenta || 'S/N'}</span>
                        </div>
                    </td>
                    <td><strong style="color:#27ae60; font-size: 1.1rem;">$${saldo.toFixed(2)}</strong></td>
                    <td>
                        <button onclick="window.confirmarPago('${idProv}', ${saldo}, '${prov.nombreParcela || prov.nombre}')" class="btn-save" style="background:#8da281; border:none; padding:8px 12px; cursor:pointer; color:white; border-radius:4px;">
                            <i class="fas fa-check-double"></i> Liquidar
                        </button>
                    </td>
                </tr>
            `;
        }
    });

    if (!tbody.innerHTML) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay pagos pendientes de liquidar.</td></tr>';
    }
}
function renderizarHistorial(liquidaciones, proveedores) {
    const tbody = document.getElementById('lista-pagos-historial');
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!liquidaciones || Object.keys(liquidaciones).length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay historial registrado.</td></tr>';
        return;
    }

    const listaOrdenada = Object.values(liquidaciones).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    listaOrdenada.forEach(liq => {
        const fechaLocal = new Date(liq.fecha).toLocaleDateString();
        const provData = proveedores[liq.idProductor] || {};
        const telf = provData.telefono || '';

        tbody.innerHTML += `
            <tr>
                <td>${fechaLocal}</td>
                <td><strong>${liq.nombreProductor}</strong></td>
                <td><strong style="color:#2c3e50;">$${parseFloat(liq.monto || 0).toFixed(2)}</strong></td>
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
        
        // USO DE NOTIFICACIÓN FLOTANTE
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion(`Liquidación exitosa para ${nombre}`, 'success');
        }
        
        await window.cargarDatosPagos();
    } catch (e) {
        console.error("Error al liquidar:", e);
        if (window.mostrarNotificacion) window.mostrarNotificacion("Error al guardar el pago", "error");
    }
};

window.notificarPorWhatsApp = function(telefono, monto, nombre) {
    if (!telefono || telefono === 'S/N') {
        if (window.mostrarNotificacion) window.mostrarNotificacion("El productor no tiene teléfono registrado.", "warning");
        return;
    }
    const msj = encodeURIComponent(`¡Hola ${nombre}! 🌿\n\nDesde *Mercado Raíz* te informamos que ya hemos realizado el pago de tu liquidación por un valor de *$${parseFloat(monto).toFixed(2)}*.\n\nPor favor, verifica tu cuenta bancaria. ¡Gracias por cultivar con nosotros! 👩‍🌾👨‍🌾`);
    window.open(`https://wa.me/${telefono}?text=${msj}`, '_blank');
};

window.generarPDFPago = function(nombre, monto, fecha) {
    if(!window.jspdf) {
        if (window.mostrarNotificacion) window.mostrarNotificacion("Cargando librería PDF, intenta de nuevo...", "info");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const f = new Date(fecha).toLocaleDateString();

    doc.setFontSize(22);
    doc.setTextColor(39, 174, 96); // Verde Primary
    doc.text("MERCADO RAÍZ", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80); // Secondary
    doc.text("COMPROBANTE DE PAGO", 105, 30, { align: "center" });
    
    doc.setDrawColor(39, 174, 96);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(12);
    doc.text(`Fecha de Liquidación: ${f}`, 20, 50);
    doc.text(`Productor: ${nombre}`, 20, 60);
    
    doc.setFillColor(244, 247, 246);
    doc.rect(20, 75, 170, 25, 'F');
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`VALOR PAGADO: $${parseFloat(monto).toFixed(2)}`, 105, 92, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Este documento es un respaldo digital de la transferencia realizada.", 105, 120, { align: "center" });

    doc.save(`Pago_${nombre.replace(/\s/g, '_')}.pdf`);
};