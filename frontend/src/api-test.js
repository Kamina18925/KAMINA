// Script simple para probar la conexión con el backend
const testBackendConnection = async () => {
  try {
    console.log('Intentando conectar con el backend...');
    const response = await fetch('http://localhost:3000/api/test');
    const data = await response.json();
    console.log('Respuesta del backend:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error al conectar con el backend:', error);
    return { success: false, error };
  }
};

export default testBackendConnection;
