/***********************************
 * VARIABLES GLOBALES
 ***********************************/
const urlParams = new URLSearchParams(window.location.search);
let carrito = window.carrito || [];

/***********************************
 * PÁGINA: CATEGORÍA (categoria.html)
 ***********************************/
const categoria = urlParams.get("tipo");

if (categoria && document.getElementById("productsGrid")) {
  const titulo = document.getElementById("categoriaTitulo");
  titulo.innerText =
    "Productos de " + categoria.charAt(0).toUpperCase() + categoria.slice(1);

  const grid = document.getElementById("productsGrid");
  grid.innerHTML = "";

  productos
    .filter(p => p.categoria === categoria)
    .forEach(p => {
      const proveedor = proveedores.find(pr => pr.id === p.proveedorId);

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p><strong>Proveedor:</strong> ${proveedor.nombre}</p>
        <p><strong>Precio:</strong> $${p.precio.toFixed(2)}</p>
        <button onclick="agregarCarrito(${p.id})">Agregar al carrito</button>
        <button class="secondary" onclick="verProveedor(${proveedor.id})">
          Ver proveedor
        </button>
      `;

      grid.appendChild(card);
    });
}

/***********************************
 * FUNCIONES DE CARRITO
 ***********************************/
function agregarCarrito(id) {
  const producto = productos.find(p => p.id === id);
  const existente = carrito.find(item => item.id === id);

  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  alert(`${producto.nombre} agregado al carrito`);
}

function mostrarCarrito() {
  const container = document.getElementById("cartContainer");
  if (!container) return;

  container.innerHTML = "";

  if (carrito.length === 0) {
    container.innerHTML = "<p>El carrito está vacío.</p>";
    return;
  }

  const pedidosPorProveedor = {};

  carrito.forEach(item => {
    if (!pedidosPorProveedor[item.proveedorId]) {
      pedidosPorProveedor[item.proveedorId] = [];
    }
    pedidosPorProveedor[item.proveedorId].push(item);
  });

  Object.keys(pedidosPorProveedor).forEach(proveedorId => {
    const proveedor = proveedores.find(p => p.id == proveedorId);
    const items = pedidosPorProveedor[proveedorId];
    let total = 0;

    const section = document.createElement("section");
    section.className = "provider-order";

    let html = `
      <h2>${proveedor.nombre} – ${proveedor.comunidad}</h2>
      <table class="cart-table">
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Precio</th>
          <th>Subtotal</th>
          <th></th>
        </tr>
    `;

    items.forEach(item => {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;

      html += `
        <tr>
          <td>${item.nombre}</td>
          <td>
            <input type="number" min="1" value="${item.cantidad}"
              onchange="actualizarCantidad(${item.id}, this.value)">
          </td>
          <td>$${item.precio.toFixed(2)}</td>
          <td>$${subtotal.toFixed(2)}</td>
          <td>
            <button onclick="eliminarDelCarrito(${item.id})">❌</button>
          </td>
        </tr>
      `;
    });

    html += `
        <tr class="total-row">
          <td colspan="3"><strong>Total</strong></td>
          <td colspan="2"><strong>$${total.toFixed(2)}</strong></td>
        </tr>
      </table>
    `;

    section.innerHTML = html;
    container.appendChild(section);
  });
}

function actualizarCantidad(id, cantidad) {
  const item = carrito.find(p => p.id === id);
  if (item) {
    item.cantidad = parseInt(cantidad);
    mostrarCarrito();
  }
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(p => p.id !== id);
  mostrarCarrito();
}

/***********************************
 * ORDEN DE PEDIDO POR WHATSAPP
 ***********************************/
function realizarPedido() {
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  const pedidosPorProveedor = {};

  carrito.forEach(item => {
    if (!pedidosPorProveedor[item.proveedorId]) {
      pedidosPorProveedor[item.proveedorId] = [];
    }
    pedidosPorProveedor[item.proveedorId].push(item);
  });

  Object.keys(pedidosPorProveedor).forEach(proveedorId => {
    const proveedor = proveedores.find(p => p.id == proveedorId);
    const items = pedidosPorProveedor[proveedorId];
    let total = 0;

    let mensaje = `Hola, soy un cliente de Mercado Raíz.%0A%0A`;
    mensaje += `Deseo realizar el siguiente pedido:%0A`;

    items.forEach(item => {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;
      mensaje += `• ${item.nombre} x${item.cantidad} = $${subtotal.toFixed(2)}%0A`;
    });

    mensaje += `%0ATotal: $${total.toFixed(2)}%0A`;
    mensaje += `%0AGracias.`;

    const url = `https://wa.me/${proveedor.whatsapp}?text=${mensaje}`;
    window.open(url, "_blank");
  });
}

/***********************************
 * PÁGINA: PROVEEDOR (proveedor.html)
 ***********************************/
const proveedorId = urlParams.get("id");

if (proveedorId && document.getElementById("proveedorNombre")) {
  const proveedor = proveedores.find(p => p.id == proveedorId);

  document.getElementById("proveedorNombre").innerText = proveedor.nombre;
  document.getElementById("proveedorHistoria").innerText = proveedor.historia;
  document.getElementById("proveedorVideo").src = proveedor.video;

  const map = L.map("map").setView([proveedor.lat, proveedor.lng], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  L.marker([proveedor.lat, proveedor.lng])
    .addTo(map)
    .bindPopup(proveedor.nombre)
    .openPopup();

  const container = document.getElementById("providerProducts");

  productos
    .filter(p => p.proveedorId == proveedor.id)
    .forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p>$${p.precio.toFixed(2)}</p>
        <button onclick="agregarCarrito(${p.id})">
          Agregar al carrito
        </button>
      `;

      container.appendChild(card);
    });
}

/***********************************
 * EVENTOS
 ***********************************/
document.addEventListener("DOMContentLoaded", mostrarCarrito);

function verProveedor(id) {
  window.location.href = `proveedor.html?id=${id}`;
}
