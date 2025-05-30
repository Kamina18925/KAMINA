// Importar los servicios de API
import api from './apiService';

// Funciones para mantener compatibilidad con el código existente
// pero ahora usan la API en lugar de localStorage

// Esta función ya no guarda directamente en localStorage, sino que se usa como puente
// para realizar operaciones en la base de datos cuando se hace dispatch de acciones
export const saveStateToLocalStorage = (state) => {
  // No hacemos nada aquí porque las operaciones individuales 
  // ya se realizan a través de la API en las acciones específicas
  console.log('Estado actualizado en memoria');
  return true;
};

// Función para cargar el estado inicial desde el backend
export const loadStateFromLocalStorage = () => {
  // Esta función no debería llamarse directamente, ya que ahora 
  // los datos se cargan asíncronamente desde la API
  console.warn('loadStateFromLocalStorage está obsoleto, usar loadInitialState');
  return undefined;
};

// Nueva función para cargar el estado inicial desde la API
export const loadInitialState = async () => {
  try {
    // Cargar datos de todas las entidades en paralelo
    const [
      usersResponse, 
      barberShopsResponse, 
      servicesResponse, 
      appointmentsResponse, 
      productsResponse
    ] = await Promise.all([
      api.users.getAll(),
      api.barberShops.getAll(),
      api.services.getAll(),
      api.appointments.getAll(),
      api.products.getAll()
    ]);
    
    // Construir y retornar el estado completo
    return {
      users: usersResponse,
      barberShops: barberShopsResponse,
      services: servicesResponse,
      appointments: appointmentsResponse,
      products: productsResponse,
      // Mantener valores por defecto para el resto de propiedades
      currentSubView: 'barberOverview',
      currentUser: null,
      isAuthenticated: false,
      currentView: 'login',
      notification: null,
      modal: null,
    };
  } catch (error) {
    console.error('Error al cargar el estado inicial:', error);
    return undefined;
  }
};

// Funciones para autenticación y gestión de usuarios
export const login = async (credentials) => {
  try {
    const response = await api.users.login(credentials);
    return response;
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
};

// Funciones para cargar datos individuales (por tipo de entidad)
export const loadUsers = async () => {
  try {
    return await api.users.getAll();
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    return [];
  }
};

export const loadBarberShops = async () => {
  try {
    return await api.barberShops.getAll();
  } catch (error) {
    console.error('Error al cargar barberías:', error);
    return [];
  }
};

export const loadServices = async () => {
  try {
    return await api.services.getAll();
  } catch (error) {
    console.error('Error al cargar servicios:', error);
    return [];
  }
};

export const loadAppointments = async () => {
  try {
    return await api.appointments.getAll();
  } catch (error) {
    console.error('Error al cargar citas:', error);
    return [];
  }
};

export const loadProducts = async () => {
  try {
    return await api.products.getAll();
  } catch (error) {
    console.error('Error al cargar productos:', error);
    return [];
  }
};

// Funciones específicas para cada tipo de documento
// Ahora implementadas para usar la API real

// Usuarios
export const saveUser = async (user) => {
  try {
    if (user.id) {
      return await api.users.update(user.id, user);
    } else {
      return await api.users.create(user);
    }
  } catch (error) {
    console.error('Error al guardar usuario:', error);
    throw error;
  }
};

// Barberías
export const saveBarberShop = async (shop) => {
  try {
    if (shop.id) {
      return await api.barberShops.update(shop.id, shop);
    } else {
      return await api.barberShops.create(shop);
    }
  } catch (error) {
    console.error('Error al guardar barbería:', error);
    throw error;
  }
};

// Servicios
export const saveService = async (service) => {
  try {
    if (service.id) {
      return await api.services.update(service.id, service);
    } else {
      return await api.services.create(service);
    }
  } catch (error) {
    console.error('Error al guardar servicio:', error);
    throw error;
  }
};

// Citas
export const saveAppointment = async (appointment) => {
  try {
    if (appointment.id) {
      return await api.appointments.update(appointment.id, appointment);
    } else {
      return await api.appointments.create(appointment);
    }
  } catch (error) {
    console.error('Error al guardar cita:', error);
    throw error;
  }
};

// Productos
export const saveProduct = async (product) => {
  try {
    if (product.id) {
      return await api.products.update(product.id, product);
    } else {
      return await api.products.create(product);
    }
  } catch (error) {
    console.error('Error al guardar producto:', error);
    throw error;
  }
};

// Cancelar una cita
export const cancelAppointment = async (appointmentId) => {
  try {
    return await api.appointments.cancel(appointmentId);
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    throw error;
  }
};

// Eliminar una cita
export const deleteAppointment = async (appointmentId) => {
  try {
    return await api.appointments.delete(appointmentId);
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    throw error;
  }
};

// Eliminar citas por clientId y status
export const deleteAppointmentsByClientAndStatus = async (clientId, keepActive = true) => {
  try {
    return await api.appointments.deleteHistory(clientId, keepActive);
  } catch (error) {
    console.error('Error al eliminar historial de citas:', error);
    throw error;
  }
};
