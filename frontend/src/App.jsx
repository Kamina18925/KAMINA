import React, { useReducer, createContext, useEffect, useState } from 'react';
import LoginPage from './components/LoginPage';
import ClientDashboard from './components/ClientDashboard';
import BarberDashboard from './components/BarberDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import Notification from './components/Notification';
import Modal from './components/Modal';
import { setupImageUploadInterceptor } from './utils/imageUtils';
import { saveStateToLocalStorage, loadInitialState, saveUser, saveBarberShop, saveService, saveAppointment, saveProduct, cancelAppointment, deleteAppointmentsByClientAndStatus } from './services/dataService';
import api from './services/apiService';

// Estado inicial limpio - todos los datos vendrán de la API
const initialState = {
  currentSubView: 'barberOverview',
  currentUser: null,
  isAuthenticated: false,
  currentView: 'login',
  notification: null,
  modal: null,
  // Estas listas se llenarán con datos de la API
  users: [],
  barberShops: [],
  services: [],
  appointments: [],
  products: [],
  // Otras estructuras que se completarán con datos de la API
  barberAvailability: {},
  barberServices: {},
  barberShopPhotos: {}
};

function appReducer(state, action) {
  switch (action.type) {
    // Nuevo caso para establecer todos los datos (usado cuando se cargan desde Firestore)
    case 'SET_ALL_DATA':
      return {
        ...state,
        ...action.payload,
      };
    case 'ADD_PRODUCT':
      // Crear un ID único para el nuevo producto
      const productId = 'product_' + Date.now();
      // Construir el objeto de producto correctamente
      const newProduct = {
        id: productId,
        ...action.payload.productData,
        shopId: action.payload.shopId,
        ownerId: action.payload.ownerOrBarberId,
        barberId: action.payload.barberId || null, // Puede ser null si es producto de la tienda
        createdAt: new Date().toISOString()
      };
      
      return {
        ...state,
        products: [...state.products, newProduct]
      };

    case 'SET_SUB_VIEW':
      return {
        ...state,
        currentSubView: action.payload
      };

    case 'LOGIN': {
      // En este punto, action.payload contiene los datos del usuario autenticado desde la API
      const userData = action.payload;
      
      // Depurar los datos del usuario recibidos
      console.log('LOGIN: Datos de usuario recibidos:', userData);
      
      // Verificar y adaptar los campos necesarios para asegurar compatibilidad
      // Usar tanto rol (español) como role (inglés), lo que esté disponible
      const userRole = userData.rol || userData.role || 'client';
      const userName = userData.nombre || userData.name || 'Usuario';
      
      console.log('LOGIN: Rol detectado:', userRole);
      
      // Selecciona el dashboard y subvista inicial según rol
      let currentView = 'login';
      
      // Normalizar el rol a minúsculas para comparaciones flexibles
      const normalizedRole = userRole.toLowerCase();
      
      if (normalizedRole.includes('client')) currentView = 'clientDashboard';
      else if (normalizedRole.includes('barber')) currentView = 'barberDashboard';
      else if (normalizedRole.includes('owner')) currentView = 'ownerDashboard';
      else if (normalizedRole.includes('admin')) currentView = 'ownerDashboard'; // Los admin ven el dashboard de owner
      
      console.log('LOGIN: Vista seleccionada:', currentView);
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('currentView', currentView);
      
      return {
        ...state,
        isAuthenticated: true,
        currentUser: userData,
        currentView,
        notification: { message: `¡Bienvenido ${userName}!`, type: 'success', id: Date.now() },
      };
    }
    case 'LOGOUT':
      console.log('LOGOUT: Cerrando sesión de usuario');
      // Eliminar datos de autenticación del localStorage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentView');
      // Cerrar sesión en el servidor (se ejecuta asíncronamente)
      api.users.logout().catch(error => {
        console.error('Error al cerrar sesión en el servidor:', error);
      });
      return { 
        ...state, 
        isAuthenticated: false, 
        currentUser: null, 
        currentView: 'login',
        currentSubView: 'barberOverview', // Restablecer subvista predeterminada
        notification: { message: 'Sesión cerrada correctamente', type: 'info', id: Date.now() }
      };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'REGISTER_USER': {
      const newUser = action.payload;
      // Ya no es necesario verificar duplicados aquí, la API se encarga de eso
      // y devolverá un error si el email ya está registrado
      
      // Actualizamos el estado con el nuevo usuario que viene de la respuesta de la API
      return {
        ...state,
        notification: { message: `¡Bienvenido ${newUser.nombre || newUser.name}! Cuenta creada con éxito. Ahora puedes iniciar sesión.`, type: 'success', id: Date.now() },
      };
    }
    case 'SHOW_NOTIFICATION':
      return { ...state, notification: { ...action.payload, id: Date.now() } };
    case 'HIDE_NOTIFICATION':
      return { ...state, notification: null };
      
    // Gestión de Servicios
    case 'ADD_SERVICE':
      return {
        ...state,
        services: [...state.services, action.payload]
      };
      
    case 'UPDATE_SERVICE':
      return {
        ...state,
        services: state.services.map(service => 
          service.id === action.payload.id ? action.payload : service
        )
      };
      
    case 'DELETE_SERVICE':
      return {
        ...state,
        services: state.services.filter(service => service.id !== action.payload)
      };

    case 'ADD_BARBER_SERVICE':
      return {
        ...state,
        barberServices: {
          ...state.barberServices,
          [action.payload.barberId]: [
            ...(state.barberServices[action.payload.barberId] || []),
            action.payload.serviceId
          ]
        }
      };
      
    // Gestión de Barberías
    case 'ADD_BARBERSHOP':
      return {
        ...state,
        barberShops: [...state.barberShops, action.payload],
      };
      
    case 'EDIT_BARBERSHOP':
      return {
        ...state,
        barberShops: state.barberShops.map(shop => 
          shop.id === action.payload.id ? action.payload : shop
        )
      };
      
    case 'DELETE_BARBERSHOP':
      return {
        ...state,
        barberShops: state.barberShops.filter(shop => shop.id !== action.payload.id)
      };
      
    case 'DELETE_PRODUCT':
      // Eliminamos el producto y todas sus referencias
      const productToDelete = state.products.find(p => p.id === action.payload.id);
      
      const updatedProducts = state.products.filter(product => product.id !== action.payload.id);
      
      // Eliminamos cualquier venta asociada al producto
      const updatedSales = (state.sales || []).filter(sale => sale.productId !== action.payload.id);
      
      // Actualizamos las notificaciones
      const notifications = state.notifications || [];
      notifications.unshift({
        id: 'notification_' + Date.now(),
        message: `Producto eliminado: ${productToDelete?.name || 'Producto'}`,
        type: 'success',
        read: false,
        date: new Date().toISOString()
      });
      
      return {
        ...state,
        products: updatedProducts,
        sales: updatedSales,
        notifications
      };
      
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product => 
          product.id === action.payload.id 
            ? { ...product, ...action.payload }
            : product
        )
      };
      
    case 'SELL_PRODUCT':
      // Obtener el producto a vender
      const productToSell = state.products.find(p => p.id === action.payload.productId);
      
      // Si no existe el producto o no hay suficiente stock, no hacer nada
      if (!productToSell || productToSell.stock < action.payload.quantity) {
        return state;
      }
      
      // Crear registro de venta
      const saleId = 'sale_' + Date.now();
      const newSale = {
        id: saleId,
        productId: action.payload.productId,
        productName: productToSell.name,
        quantity: action.payload.quantity,
        price: productToSell.price,
        total: productToSell.price * action.payload.quantity,
        barberId: action.payload.barberId,
        shopId: productToSell.shopId,
        date: new Date().toISOString(),
        sellerId: action.payload.sellerId || action.payload.barberId
      };
      
      // Actualizar el stock del producto
      const productsWithUpdatedStock = state.products.map(product => 
        product.id === action.payload.productId
          ? { ...product, stock: product.stock - action.payload.quantity }
          : product
      );
      
      return {
        ...state,
        products: productsWithUpdatedStock,
        sales: [...(state.sales || []), newSale],
        notifications: [
          {
            id: 'notification_' + Date.now(),
            message: `Venta registrada: ${action.payload.quantity} unidad(es) de ${productToSell.name}`,
            type: 'success',
            read: false,
            date: new Date().toISOString()
          },
          ...(state.notifications || [])
        ]
      };
      
    case 'ADD_SALE':
      return {
        ...state,
        sales: [...(state.sales || []), action.payload],
        notifications: [
          {
            id: 'notification_' + Date.now(),
            message: `Venta registrada: ${action.payload.quantity} unidades de ${action.payload.productName}`,
            type: 'success',
            read: false,
            date: new Date().toISOString()
          },
          ...(state.notifications || [])
        ]
      };
      
    case 'DELETE_APPOINTMENTS_BY_SHOP':
      return {
        ...state,
        appointments: state.appointments.filter(appointment => appointment.shopId !== action.payload.shopId)
      };
      
    case 'DELETE_BARBERSHOP_PHOTOS':
      return {
        ...state,
        barberShopPhotos: Object.fromEntries(
          Object.entries(state.barberShopPhotos || {}).filter(([key]) => key !== action.payload.shopId)
        )
      };
      
    case 'UPDATE_BARBERSHOP_PHOTO':
      return {
        ...state,
        barberShopPhotos: {
          ...state.barberShopPhotos,
          [action.payload.shopId]: [action.payload.photoUrl, ...(state.barberShopPhotos?.[action.payload.shopId]?.slice(1) || [])]
        }
      };
      
    // Gestión de Usuarios
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user => 
          user.id === action.payload.id 
            ? { ...user, ...action.payload }
            : user
        )
      };
      
    case 'DELETE_USER':
      // Encontramos el usuario a eliminar
      const userToDelete = state.users.find(u => u.id === action.payload.id);
      
      // Si es un barbero, necesitamos actualizar las barberías y las citas
      if (userToDelete && userToDelete.role === 'barber') {
        // Encontramos la barbería asociada
        const barberShopsToUpdate = state.barberShops.map(shop => 
          shop.barberIds && shop.barberIds.includes(action.payload.id)
            ? { ...shop, barberIds: shop.barberIds.filter(id => id !== action.payload.id) }
            : shop
        );
        
        // Actualizamos las citas asignadas a este barbero
        const appointmentsToUpdate = state.appointments.map(appointment => 
          appointment.barberId === action.payload.id
            ? { ...appointment, barberId: null, status: 'pendiente' }
            : appointment
        );
        
        // Actualizamos las notificaciones
        const notifications = state.notifications || [];
        notifications.unshift({
          id: 'notification_' + Date.now(),
          message: `Barbero eliminado: ${userToDelete.name || 'Usuario'}`,
          type: 'success',
          read: false,
          date: new Date().toISOString()
        });
        
        return {
          ...state,
          users: state.users.filter(user => user.id !== action.payload.id),
          barberShops: barberShopsToUpdate,
          appointments: appointmentsToUpdate,
          notifications
        };
      }
      
      // Para usuarios que no son barberos
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload.id)
      };
    
    case 'UPDATE_BARBER':
      return {
        ...state,
        users: state.users.map(user => 
          user.id === action.payload.id 
            ? { ...user, ...action.payload.data }
            : user
        )
      };
      
    case 'UNASSIGN_BARBER_APPOINTMENTS':
      return {
        ...state,
        appointments: state.appointments.map(appointment => 
          appointment.barberId === action.payload.barberId 
            ? { ...appointment, barberId: null, status: 'pendiente' }
            : appointment
        )
      };
      
    case 'ADD_BARBER_TO_SHOP':
      // Generar un ID único para el nuevo barbero
      const barberId = 'user_' + Date.now();
      
      // Crear el objeto del nuevo barbero
      const newBarber = {
        id: barberId,
        ...action.payload.barber,
        shopId: action.payload.shopId,
        createdAt: new Date().toISOString(),
        active: true
      };
      
      // Obtener la barbería para actualizar los barberIds
      const shopToUpdate = state.barberShops.find(shop => shop.id === action.payload.shopId);
      
      if (!shopToUpdate) {
        return state;
      }
      
      return {
        ...state,
        // Añadir el barbero a los usuarios
        users: [...state.users, newBarber],
        
        // Actualizar los barberIds de la barbería
        barberShops: state.barberShops.map(shop => 
          shop.id === action.payload.shopId 
            ? { 
                ...shop, 
                barberIds: [...(shop.barberIds || []), barberId] 
              }
            : shop
        )
      };
      
    case 'CANCEL_APPOINTMENT':
      // Buscar la cita por ID
      const appointmentToCancel = state.appointments.find(appt => appt.id === action.payload.id);
      
      // Si no existe la cita, no hacer nada
      if (!appointmentToCancel) {
        return state;
      }
      
      // Actualizar el estado de la cita a 'cancelled'
      const updatedAppointments = state.appointments.map(appointment => 
        appointment.id === action.payload.id
          ? { ...appointment, status: 'cancelled', cancelledAt: new Date().toISOString() }
          : appointment
      );
      
      return {
        ...state,
        appointments: updatedAppointments
      };
    
    case 'DELETE_CLIENT_APPOINTMENTS_HISTORY':
      // Filtrar las citas para mantener solo las que NO pertenecen al cliente
      // o que son citas confirmadas (no canceladas ni completadas)
      const filteredAppointments = state.appointments.filter(appointment => 
        appointment.clientId !== action.payload.clientId || 
        (appointment.status === 'confirmed' && action.payload.keepActive)
      );
      
      return {
        ...state,
        appointments: filteredAppointments
      };
      
    default:
      return state;
  }
}

export const AppContext = createContext();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Puedes loguear el error aquí si quieres
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: 32 }}><h2>¡Error crítico en la app!</h2><pre>{String(this.state.error)}</pre></div>;
    }
    return this.props.children;
  }
}

// Wrapper para el dispatch que realiza operaciones asíncronas en la BD
const createApiDispatch = (dispatch) => {
  return async (action) => {
    // Para acciones que requieren operaciones en la API
    try {
      switch (action.type) {
        case 'LOGIN':
          // La autenticación se maneja de forma especial
          dispatch(action); // Primero actualizamos el estado local
          break;
          
        case 'ADD_PRODUCT':
        case 'UPDATE_PRODUCT':
          // Guardar el producto en la BD
          const productData = action.type === 'ADD_PRODUCT' 
            ? action.payload.productData 
            : action.payload;
            
          const savedProduct = await saveProduct({
            ...productData,
            shopId: action.payload.shopId || productData.shopId,
            barberId: action.payload.barberId || productData.barberId,
            ownerId: action.payload.ownerOrBarberId || productData.ownerId
          });
          
          // Actualizar la acción con la respuesta de la API
          const updatedProductAction = {
            ...action,
            payload: action.type === 'ADD_PRODUCT' 
              ? { ...action.payload, productData: savedProduct }
              : savedProduct
          };
          
          dispatch(updatedProductAction);
          break;
          
        case 'ADD_APPOINTMENT':
        case 'UPDATE_APPOINTMENT':
          // Guardar la cita en la BD
          const appointmentData = action.payload;
          const savedAppointment = await saveAppointment(appointmentData);
          
          // Actualizar la acción con la respuesta de la API
          dispatch({
            ...action,
            payload: savedAppointment
          });
          break;
          
        case 'CANCEL_APPOINTMENT':
          // Cancelar la cita en la BD
          await cancelAppointment(action.payload.id);
          dispatch(action);
          break;
          
        case 'DELETE_CLIENT_APPOINTMENTS_HISTORY':
          // Eliminar historial de citas en la BD
          await deleteAppointmentsByClientAndStatus(
            action.payload.clientId, 
            action.payload.keepActive
          );
          dispatch(action);
          break;
          
        // Para el resto de acciones, simplemente hacemos dispatch
        default:
          dispatch(action);
          break;
      }
      
      // Guardar el estado actualizado en memoria (para compatibilidad)
      setTimeout(() => {
        const state = window.appState;
        if (state) {
          saveStateToLocalStorage(state);
        }
      }, 0);
      
    } catch (error) {
      console.error('Error en apiDispatch:', error);
      
      // Notificar al usuario del error
      dispatch({ 
        type: 'SHOW_NOTIFICATION', 
        payload: { 
          message: `Error: ${error.message || 'Ha ocurrido un error'}`, 
          type: 'error' 
        } 
      });
    }
  };
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Inicializar con el estado predeterminado mientras se cargan los datos
  const [state, dispatchBase] = useReducer(appReducer, initialState);
  
  // Crear un dispatch que realiza operaciones en la API
  const dispatch = createApiDispatch(dispatchBase);
  
  // Guardar el estado en una variable global para compatibilidad
  window.appState = state;
  
  // Cargar datos iniciales y configurar la aplicación
  useEffect(() => {
    // Función para usar localStorage como respaldo si la verificación del servidor falla
    const fallbackToLocalStorage = () => {
      try {
        // Verificar si hay una sesión guardada en localStorage
        const savedAuth = localStorage.getItem('isAuthenticated');
        const savedUser = localStorage.getItem('currentUser');
        const savedView = localStorage.getItem('currentView');
        
        if (savedAuth === 'true' && savedUser) {
          const userData = JSON.parse(savedUser);
          // Restaurar la sesión del usuario
          dispatchBase({ 
            type: 'LOGIN', 
            payload: userData 
          });
          // Si hay una vista guardada, actualizar también
          if (savedView) {
            dispatchBase({ type: 'SET_VIEW', payload: savedView });
          }
          console.log('Sesión restaurada desde localStorage');
        }
      } catch (error) {
        console.error('Error al restaurar sesión desde localStorage:', error);
      }
    };

    const initializeApp = async () => {
      try {
        // Primero verificamos si hay una sesión válida en el servidor
        const sessionToken = localStorage.getItem('sessionToken');
        
        if (sessionToken) {
          try {
            // Verificar la sesión con el servidor
            const { isValid, user } = await api.users.verifySession();
            
            if (isValid && user) {
              // Si la sesión es válida, restauramos la sesión del usuario
              dispatchBase({ 
                type: 'LOGIN', 
                payload: user 
              });
              
              // Restauramos la vista basada en el rol del usuario
              const userRole = user.rol || user.role || 'client';
              const normalizedRole = userRole.toLowerCase();
              let viewToSet = 'login';
              
              if (normalizedRole.includes('client')) viewToSet = 'clientDashboard';
              else if (normalizedRole.includes('barber')) viewToSet = 'barberDashboard';
              else if (normalizedRole.includes('owner') || normalizedRole.includes('admin')) viewToSet = 'ownerDashboard';
              
              dispatchBase({ type: 'SET_VIEW', payload: viewToSet });
              console.log('Sesión verificada y restaurada desde el servidor');
              
              // No necesitamos cargar desde localStorage si la verificación con el servidor fue exitosa
              // pero actualizamos el localStorage con los datos actuales
              localStorage.setItem('isAuthenticated', 'true');
              localStorage.setItem('currentUser', JSON.stringify(user));
              localStorage.setItem('currentView', viewToSet);
            } else {
              console.log('Sesión inválida o expirada, limpiando localStorage');
              localStorage.removeItem('isAuthenticated');
              localStorage.removeItem('currentUser');
              localStorage.removeItem('currentView');
              localStorage.removeItem('sessionToken');
              
              // Si la sesión no es válida, continuamos con los datos en localStorage como respaldo
              fallbackToLocalStorage();
            }
          } catch (sessionError) {
            console.error('Error al verificar sesión:', sessionError);
            // Si hay un error al verificar la sesión, intentamos con localStorage
            fallbackToLocalStorage();
          }
        } else {
          // Si no hay token de sesión, intentamos con localStorage
          fallbackToLocalStorage();
        }
        
        // Configurar el interceptor para simular la carga de imágenes
        setupImageUploadInterceptor();
        console.log('Interceptor de carga de imágenes configurado');
        
        // Cargar datos desde la API
        console.log('Cargando datos desde la API...');
        const initialData = await loadInitialState();
        
        if (initialData) {
          // Actualizar el estado con los datos cargados
          dispatchBase({ type: 'SET_ALL_DATA', payload: initialData });
          console.log('Datos cargados correctamente desde la API');
        } else {
          console.warn('No se pudieron cargar datos desde la API, usando datos iniciales');
        }
      } catch (err) {
        console.error('Error al inicializar la aplicación:', err);
        setError('Error al cargar los datos. Por favor, recarga la página.');
      } finally {
        // Finalizar carga, independientemente del resultado
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  const renderCurrentView = () => {
    // Depurar el estado actual para diagnosticar problemas
    console.log('RenderCurrentView - Estado actual:', {
      isAuthenticated: state.isAuthenticated,
      currentView: state.currentView,
      currentUser: state.currentUser ? {
        id: state.currentUser.id,
        role: state.currentUser.role || state.currentUser.rol,
        name: state.currentUser.name || state.currentUser.nombre
      } : 'No hay usuario'
    });
    
    // Si no hay autenticación, mostrar login
    if (!state.isAuthenticated) {
      console.log('No autenticado - mostrando LoginPage');
      return <LoginPage />;
    }
    
    // Seguridad adicional: si currentUser es null o undefined
    if (!state.currentUser) {
      console.error('Error: Usuario autenticado pero sin datos de usuario');
      return <LoginPage />;
    }
    
    // Usar switch para determinar la vista según currentView
    console.log('Usuario autenticado - mostrando vista:', state.currentView);
    
    try {
      switch (state.currentView) {
        case 'clientDashboard':
          return <ClientDashboard />;
        case 'barberDashboard':
          return <BarberDashboard />;
        case 'ownerDashboard':
          return <OwnerDashboard />;
        default:
          console.warn('Vista no reconocida:', state.currentView, '- mostrando LoginPage');
          return <LoginPage />;
      }
    } catch (error) {
      console.error('Error al renderizar la vista:', error);
      return <div className="p-4 bg-red-100 text-red-700 rounded-md">
        <h2 className="text-xl font-bold">Error al cargar la vista</h2>
        <p>{error.message}</p>
      </div>;
    }
  };

  // Mostrar un indicador de carga mientras se inicializan los datos
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Cargando datos...</p>
        </div>
      </div>
    );
  }
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-100">
          {state.notification && <Notification message={state.notification.message} type={state.notification.type} id={state.notification.id} />}
          {state.modal && <Modal title={state.modal.props?.title}>{state.modal.content}</Modal>}
          {renderCurrentView()}
        </div>
      </ErrorBoundary>
    </AppContext.Provider>
  );
};

export default App;