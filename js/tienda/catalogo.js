/**
 * js/catalogo.js - Gestión del Catálogo Completo
 * Mercado Raíz 2026
 */

document.addEventListener("DOMContentLoaded", () => {
    // Esperamos a que main.js cargue los productos en el array global
    // O podemos forzar una carga si entramos directo a esta página
    if (window.db) {
        cargarCatalogoCompleto();
    }
});

// 1. CARGA INICIAL
function cargarCatalogoCompleto() {
    window.db.ref('productos').on('value', (snapshot) => {
        const data = snapshot.val();
        const lista = data ? Object.keys(data).map(key => ({...data[key], id: key})) : [];
        
        // Guardamos en la variable global definida en main.js
        window.productos = lista; 
        renderizarCatalogo(lista);
    });
}

// 2. RENDERIZADO CON FILTROS
function renderizarCatalogo(lista) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (lista.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:50px;">
                            <i class="fas fa-search" style="font-size:3rem; color:#ccc;"></i>
                            <p style="margin-top:15px; color:#888;">No se encontraron productos en esta categoría.</p>
                          </div>`;
        return;
    }

    grid.innerHTML = lista.map(p => {
        // Buscamos el nombre del productor para el badge
        const prov = window.proveedores ? window.proveedores.find(pr => pr.id == p.idProductor) : null;
        const nombreParcela = prov ? prov.nombreParcela : 'Parcela Local';

        return `
        <div class="product-card">
            <div class="badge-productor"><i class="fas fa-leaf"></i> ${nombreParcela}</div>
            <div class="product-image">
                <img src="${p.urlFotoProducto || 'assets/images/no-image.jpg'}" alt="${p.nombreProducto}" loading="lazy">
            </div>
            <div class="product-info">
                <span class="category-tag">${p.categoriaProducto}</span>
                <h3>${p.nombreProducto}</h3>
                <p class="unidad">${p.unidadMedida}</p>
                <div class="price-action">
                    <span class="price">$${parseFloat(p.precio).toFixed(2)}</span>
                    <button onclick="agregarAlCarritoClick('${p.id}')" class="btn-add-cart">
                        <i class="fas fa-plus"></i> Añadir
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// 3. SISTEMA DE FILTROS (Categorías)
function filtrarPorCategoria(categoria) {
    // Resaltar botón activo
    const botones = document.querySelectorAll('.filter-btn');
    botones.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (categoria === 'todos') {
        renderizarCatalogo(window.productos);
    } else {
        const filtrados = window.productos.filter(p => p.categoriaProducto === categoria);
        renderizarCatalogo(filtrados);
    }
}

// 4. BUSCADOR EN TIEMPO REAL
function buscarProducto(texto) {
    const query = texto.toLowerCase();
    const filtrados = window.productos.filter(p => 
        p.nombreProducto.toLowerCase().includes(query) || 
        p.categoriaProducto.toLowerCase().includes(query)
    );
    renderizarCatalogo(filtrados);
}