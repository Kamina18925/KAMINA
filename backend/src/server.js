import dotenv from 'dotenv';
import app from './app.js';

// Cargar variables de entorno
dotenv.config();

// Puerto
const PORT = process.env.PORT;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
});
