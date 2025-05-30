// API Service - Maneja las comunicaciones con el backend
const API_BASE_URL = 'http://localhost:3000/api';

// Función para obtener el token de sesión del localStorage
const getSessionToken = () => {
  return localStorage.getItem('sessionToken');
};

// Función para guardar el token de sesión en localStorage
const saveSessionToken = (token) => {
  if (token) {
    localStorage.setItem('sessionToken', token);
  }
};

// Función para eliminar el token de sesión
const removeSessionToken = () => {
  localStorage.removeItem('sessionToken');
};

// Función auxiliar para manejar errores de fetch
const handleFetchError = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const error = new Error(errorData?.message || response.statusText || 'Error desconocido');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response;
};

// Función auxiliar para realizar peticiones HTTP
const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    // Modo de depuración para ver qué se está enviando
    console.log('Enviando petición a:', url);
    console.log('Método:', options.method || 'GET');
    console.log('Datos enviados:', options.body ? JSON.parse(options.body) : 'Sin datos');
    
    // Obtener el token de sesión (si existe) y añadirlo a los headers
    const sessionToken = getSessionToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Si hay un token de sesión, lo añadimos a los headers
    if (sessionToken && !url.includes('/login')) {
      headers['Authorization'] = sessionToken;
    }
    
    console.log('Headers:', headers);
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Importante para enviar/recibir cookies con CORS
    });
    
    // Depuración de respuesta
    console.log('Respuesta recibida. Status:', response.status);
    const responseClone = response.clone();
    let responseData;
    try {
      responseData = await responseClone.text();
      console.log('Respuesta del servidor:', responseData ? JSON.parse(responseData) : 'Sin contenido');
    } catch (e) {
      console.log('No se pudo leer la respuesta como JSON:', responseData);
    }
    
    await handleFetchError(response);
    
    // Para peticiones DELETE que pueden no devolver contenido
    if (response.status === 204) {
      return { success: true };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error en petición a ${url}:`, error);
    throw error;
  }
};

// API para usuarios
export const userApi = {
  login: async (credentials) => {
    // Hacemos la petición de login
    const userData = await fetchWithErrorHandling(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Si la respuesta incluye un token de sesión, lo guardamos
    if (userData && userData.sessionToken) {
      saveSessionToken(userData.sessionToken);
      console.log('Token de sesión guardado correctamente');
    }
    
    return userData;
  },
  
  logout: async () => {
    // Obtener el token actual
    const sessionToken = getSessionToken();
    
    // Si hay un token, enviamos la petición de logout
    if (sessionToken) {
      try {
        await fetchWithErrorHandling(`${API_BASE_URL}/users/logout`, {
          method: 'POST',
          headers: {
            'Authorization': sessionToken
          }
        });
      } catch (error) {
        console.error('Error al cerrar sesión en el servidor:', error);
      } finally {
        // Independientemente del resultado, eliminamos el token local
        removeSessionToken();
      }
    }
    
    return { success: true };
  },
  
  // Verificar si la sesión es válida
  verifySession: async () => {
    const sessionToken = getSessionToken();
    
    if (!sessionToken) {
      return { isValid: false };
    }
    
    try {
      const userData = await fetchWithErrorHandling(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': sessionToken
        }
      });
      
      return { isValid: true, user: userData };
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      // Si hay un error, la sesión no es válida
      removeSessionToken();
      return { isValid: false, error };
    }
  },
  
  // Alias de create para el registro de nuevos usuarios
  register: (userData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    
  // Función para solicitar recuperación de contraseña
  forgotPassword: (data) => 
    fetchWithErrorHandling(`${API_BASE_URL}/users/forgot-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  // Función para restablecer contraseña con token
  resetPassword: (data) => 
    fetchWithErrorHandling(`${API_BASE_URL}/users/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getAll: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/users`),
  
  getById: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/users/${id}`),
  
  create: (userData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  update: (id, userData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  
  delete: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    }),
};

// API para barberías
export const barberShopApi = {
  getAll: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/barbershops`),
  
  getById: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/barbershops/${id}`),
  
  create: (shopData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/barbershops`, {
      method: 'POST',
      body: JSON.stringify(shopData),
    }),
  
  update: (id, shopData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/barbershops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shopData),
    }),
  
  delete: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/shops/${id}`, {
      method: 'DELETE',
    }),
};

// API para servicios
export const serviceApi = {
  getAll: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/services`),
  
  getByShop: (shopId) => 
    fetchWithErrorHandling(`${API_BASE_URL}/services/shop/${shopId}`),
  
  getById: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/services/${id}`),
  
  create: (serviceData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/services`, {
      method: 'POST',
      body: JSON.stringify(serviceData),
    }),
  
  update: (id, serviceData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    }),
  
  delete: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/services/${id}`, {
      method: 'DELETE',
    }),
};

// API para citas
export const appointmentApi = {
  getAll: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/appointments`),
  
  getByClient: (clientId) => 
    fetchWithErrorHandling(`${API_BASE_URL}/appointments/client/${clientId}`),
  
  getByBarber: (barberId) => 
    fetchWithErrorHandling(`${API_BASE_URL}/appointments/barber/${barberId}`),
  
  getByShop: (shopId) => 
    fetchWithErrorHandling(`${API_BASE_URL}/appointments/shop/${shopId}`),
  
  getById: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/appointments/${id}`),
  
  create: (appointmentData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    }),
  
  update: (id, appointmentData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    }),
  
  cancel: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/appointments/${id}/cancel`, {
      method: 'PUT',
    }),
  
  complete: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/appointments/${id}/complete`, {
      method: 'PUT',
    }),
  
  deleteHistory: (clientId, keepActive = true) => 
    fetchWithErrorHandling(`${API_BASE_URL}/appointments/history/${clientId}`, {
      method: 'DELETE',
      body: JSON.stringify({ keepActive }),
    }),
};

// API para productos
export const productApi = {
  getAll: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/products`),
  
  getByShop: (shopId) => 
    fetchWithErrorHandling(`${API_BASE_URL}/products/shop/${shopId}`),
  
  getByBarber: (barberId) => 
    fetchWithErrorHandling(`${API_BASE_URL}/products/barber/${barberId}`),
  
  getById: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/products/${id}`),
  
  create: (productData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(productData),
    }),
  
  update: (id, productData) => 
    fetchWithErrorHandling(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),
  
  delete: (id) => 
    fetchWithErrorHandling(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    }),
};

// Exportar todas las APIs juntas
export default {
  users: userApi,
  barberShops: barberShopApi,
  services: serviceApi,
  appointments: appointmentApi,
  products: productApi,
};
