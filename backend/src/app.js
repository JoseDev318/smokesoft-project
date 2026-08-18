require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./modules/auth/auth.routes');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');
const productosRoutes = require('./modules/productos/productos.routes');
const categoriasRoutes = require('./modules/categorias/categorias.routes');
const proveedoresRoutes = require('./modules/proveedores/proveedores.routes');

const app = express();

app.use(cors());              // Permite que el frontend (otro origen) consuma esta API
app.use(express.json());      // Permite leer JSON en req.body
app.use(morgan('dev'));       // Muestra cada petición en la consola (método, ruta, tiempo)

// Ruta de prueba para verificar que el servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmokeSoft API funcionando correctamente' });
});

// Aquí se van conectando los módulos. Cuando armemos clientes, proveedores,
// productos y compras/ventas, cada uno agrega una línea como estas:
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
// Si ninguna ruta coincidió
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores centralizado: cualquier "next(error)" en los controladores llega aquí
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;