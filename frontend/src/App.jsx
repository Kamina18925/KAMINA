import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  // Inicializar estado desde localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  // Verificar sesión al cargar la app
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('sessionToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionToken: token })
        });

        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData.user);
          setIsAuthenticated(true);
          
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
    // Guardar en estado
    setCurrentUser(userData);
    setIsAuthenticated(true);
    
    // Guardar en localStorage
    localStorage.setItem('sessionToken', sessionToken);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    // Limpiar estado
    setCurrentUser(null);
    setIsAuthenticated(false);
    
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
    <Router>
      <div className="App">
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
  );
}

export default App;
