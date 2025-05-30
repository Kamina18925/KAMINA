import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import '../App.css';

// Componente para la página principal del dashboard
const DashboardHome = ({ currentUser }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Bienvenido, {currentUser?.name || 'Usuario'}</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="mb-4">
          Accede a todas las funcionalidades desde el menú lateral.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-lg mb-2">Citas</h3>
            <p>Gestiona tus citas y reservas</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-semibold text-lg mb-2">Perfil</h3>
            <p>Actualiza tu información personal</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-semibold text-lg mb-2">Productos</h3>
            <p>Explora productos disponibles</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal del Dashboard
const Dashboard = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const role = currentUser?.role || 'client';
  
  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-800 text-white">
        <div className="p-6 border-b border-indigo-700">
          <h1 className="text-2xl font-bold">Barber<span className="text-yellow-400">RD</span></h1>
        </div>
        <nav className="mt-6">
          <div className="px-4 py-2 text-indigo-300 text-sm">
            {role.toUpperCase()}
          </div>
          <Link to="/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
            Inicio
          </Link>
          <Link to="/dashboard/profile" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
            Mi Perfil
          </Link>
          {role === 'client' && (
            <Link to="/dashboard/appointments" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
              Mis Citas
            </Link>
          )}
          {(role === 'barber' || role === 'owner') && (
            <>
              <Link to="/dashboard/schedule" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
                Horario
              </Link>
              <Link to="/dashboard/clients" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
                Clientes
              </Link>
            </>
          )}
          {role === 'owner' && (
            <Link to="/dashboard/barbers" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
              Barberos
            </Link>
          )}
          <Link to="/dashboard/products" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
            Productos
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full text-left block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700 mt-8 text-red-300 hover:text-red-200"
          >
            Cerrar Sesión
          </button>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="px-4 py-3 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Dashboard
            </h2>
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-600">
                {currentUser?.name || 'Usuario'}
              </span>
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                {(currentUser?.name || 'U')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        
        {/* Routes for dashboard sections */}
        <main>
          <Routes>
            <Route path="/" element={<DashboardHome currentUser={currentUser} />} />
            <Route path="/profile" element={<div className="p-6">Página de Perfil (en construcción)</div>} />
            <Route path="/appointments" element={<div className="p-6">Gestión de Citas (en construcción)</div>} />
            <Route path="/schedule" element={<div className="p-6">Gestión de Horarios (en construcción)</div>} />
            <Route path="/clients" element={<div className="p-6">Gestión de Clientes (en construcción)</div>} />
            <Route path="/barbers" element={<div className="p-6">Gestión de Barberos (en construcción)</div>} />
            <Route path="/products" element={<div className="p-6">Catálogo de Productos (en construcción)</div>} />
            <Route path="*" element={<div className="p-6">Página no encontrada</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
