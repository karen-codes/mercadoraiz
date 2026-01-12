/***********************************
 * PROVEEDORES
 ***********************************/
const proveedores = [
  {
    id: 1,
    nombre: "Hacienda El Carmen",
    comunidad: "Cayambe",
    lat: -0.041,
    lng: -78.143,
    whatsapp: "593999999999",
    historia: "Somos una familia productora dedicada a la agricultura sostenible desde hace más de 20 años.",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    imagen: "assets/images/proveedores/carmen.jpg",
    horario: "Lunes a Sábado, 08h00 - 17h00"
  },
  {
    id: 2,
    nombre: "Asociación La Esperanza",
    comunidad: "Pesillo",
    lat: -0.030,
    lng: -78.170,
    whatsapp: "593988888888",
    historia: "Productores comunitarios que promueven el comercio justo y la soberanía alimentaria.",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    imagen: "assets/images/proveedores/esperanza.jpg",
    horario: "Martes a Domingo, 07h00 - 16h00"
  }
];

/***********************************
 * PRODUCTOS
 ***********************************/
const productos = [
  {
    id: 101,
    nombre: "Tomate riñón",
    categoria: "tomates",
    precio: 1.25,
    unidad: "kg",
    stock: 100,
    proveedorId: 1,
    imagen: "assets/images/productos/tomate-rinon.jpg"
  },
  {
    id: 102,
    nombre: "Tomate cherry",
    categoria: "tomates",
    precio: 1.80,
    unidad: "kg",
    stock: 80,
    proveedorId: 1,
    imagen: "assets/images/productos/tomate-cherry.jpg"
  },
  {
    id: 201,
    nombre: "Leche fresca",
    categoria: "lacteos",
    precio: 0.90,
    unidad: "litro",
    stock: 200,
    proveedorId: 2,
    imagen: "assets/images/productos/leche.jpg"
  }
];

/***********************************
 * CARRITO
 ***********************************/
let carrito = [];
