import React, { useState, useEffect, createContext, useReducer } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ClientDashboard from './components/ClientDashboard';
import BarberDashboard from './components/BarberDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import Notification from './components/Notification';
import Modal from './components/Modal';
import testBackendConnection from './api-test';
import './App.css';

// Estado inicial para mantener compatibilidad con componentes existentes
const initialState = {
  currentUser: null,
  isAuthenticated: false,
  notification: null,
  modal: null,
  users: [],
  barberShops: [],
  services: [],
  masterServices: [],
  appointments: [],
  products: []
};

// Reducer simplificado para mantener compatibilidad
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: true
      };
    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false
      };
    case 'SHOW_NOTIFICATION':
      return {
        ...state,
        notification: { ...action.payload, id: Date.now() }
      };
    case 'HIDE_NOTIFICATION':
      return {
        ...state,
        notification: null
      };
    default:
      return state;
  }
}

export const AppContext = createContext();

function App() {
  // Estado con useReducer para mantener compatibilidad con componentes existentes
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Estado local para la nueva implementación
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);
  
  // Sincronizar estado local con estado global - Mover este useEffect aquí para mantener el orden de hooks
  useEffect(() => {
    if (currentUser && isAuthenticated) {
      dispatch({ type: 'SET_USER', payload: currentUser });
    }
  }, [currentUser, isAuthenticated]);

  // Probar conexión con el backend
  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await testBackendConnection();
        if (result.success) {
          console.log('Conexión con el backend exitosa:', result.data);
          dispatch({ 
            type: 'SHOW_NOTIFICATION', 
            payload: { 
              message: 'Conexión con el backend establecida correctamente', 
              type: 'success' 
            } 
          });
        } else {
          console.error('Error de conexión con el backend:', result.error);
          dispatch({ 
            type: 'SHOW_NOTIFICATION', 
            payload: { 
              message: 'Error de conexión con el backend. Verifica que el servidor esté funcionando.', 
              type: 'error' 
            } 
          });
        }
      } catch (error) {
        console.error('Error ejecutando test de conexión:', error);
        dispatch({ 
          type: 'SHOW_NOTIFICATION', 
          payload: { 
            message: 'Error inesperado al probar la conexión', 
            type: 'error' 
          } 
        });
      }
    };

    testConnection();
  }, [dispatch]);

  // Verificar sesión al cargar la app
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('sessionToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/auth/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData.user);
          setIsAuthenticated(true);
          
          // Actualizar estado global para componentes que usan AppContext
          dispatch({ type: 'SET_USER', payload: userData.user });
          
          // Actualizar localStorage
          localStorage.setItem('currentUser', JSON.stringify(userData.user));
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          // Token inválido, limpiar localStorage
          handleLogout();
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const handleLogin = (userData, sessionToken) => {
    // Guardar en estado local
    setCurrentUser(userData);
    setIsAuthenticated(true);
    
    // Actualizar estado global para componentes que usan AppContext
    dispatch({ type: 'SET_USER', payload: userData });
    
    // Guardar en localStorage
    localStorage.setItem('sessionToken', sessionToken);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    // Limpiar estado local
    setCurrentUser(null);
    setIsAuthenticated(false);
    
    // Actualizar estado global para componentes que usan AppContext
    dispatch({ type: 'LOGOUT' });
    
    // Limpiar localStorage
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
  };

  // Mostrar loading mientras verifica sesión
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Verificando sesión...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <Router>
        <div className="App">
          {state.notification && (
            <Notification
              message={state.notification.message}
              type={state.notification.type}
              id={state.notification.id}
            />
          )}
          
          {state.modal && (
            <Modal title={state.modal.title}>
              {state.modal.content}
            </Modal>
          )}
          
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginPage onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/dashboard/*" 
              element={
                isAuthenticated ? 
                <Dashboard 
                  currentUser={currentUser} 
                  onLogout={handleLogout} 
                /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
            />
          </Routes>
        </div>
      </Router>
    </AppContext.Provider>
  );
}

// Componente Dashboard que renderiza el dashboard correcto según el rol del usuario
function Dashboard({ currentUser, onLogout }) {
  // Determinar qué dashboard mostrar según el rol del usuario
  const renderDashboard = () => {
    const userRole = currentUser?.role || currentUser?.rol || 'client';
    const normalizedRole = userRole.toLowerCase();
    
    if (normalizedRole.includes('client')) {
      return <ClientDashboard currentUser={currentUser} onLogout={onLogout} />;
    } else if (normalizedRole.includes('barber')) {
      return <BarberDashboard currentUser={currentUser} onLogout={onLogout} />;
    } else if (normalizedRole.includes('owner') || normalizedRole.includes('admin')) {
      return <OwnerDashboard currentUser={currentUser} onLogout={onLogout} />;
    }
    
    // Fallback a dashboard de cliente si no se reconoce el rol
    return <ClientDashboard currentUser={currentUser} onLogout={onLogout} />;
  };
  
  return (
    <div>
      {renderDashboard()}
    </div>
  );
}

export default App;
