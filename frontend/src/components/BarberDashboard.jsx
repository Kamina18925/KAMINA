import React, { useContext } from 'react';
import { AppContext } from '../App';
import BarberOverview from './BarberOverview';
import BarberAppointmentsView from './BarberAppointmentsView';
import BarberAvailabilityManagement from './BarberAvailabilityManagement';
import BarberServicesManagement from './BarberServicesManagement';
import BarberProductsManagement from './BarberProductsManagement';
import BarberShopInfoView from './BarberShopInfoView';

// Fiel al HTML original: navegación, layout, clases y lógica
const navItems = [
  { key: 'barberOverview', label: 'Resumen', icon: 'fas fa-chart-line' },
  { key: 'barberAppointments', label: 'Mis Citas', icon: 'fas fa-calendar-check' },
  { key: 'barberAvailability', label: 'Mi Disponibilidad', icon: 'fas fa-user-clock' },
  { key: 'barberServices', label: 'Mis Servicios', icon: 'fas fa-cut' },
  { key: 'barberProducts', label: 'Mis Productos', icon: 'fas fa-box-open' },
  { key: 'barberShopInfo', label: 'Info de Barbería', icon: 'fas fa-store-alt' },
];

const BarberDashboard = () => {
  const { state, dispatch } = useContext(AppContext);
  const barber = state.currentUser;
  const currentBarberView = state.currentSubView || 'barberOverview';
  const barberShop = state.barberShops.find(shop => shop.id === barber?.shopId);

  // Lógica de renderizado exactamente como en el HTML fuente
  const renderBarberView = () => {
    if (!barberShop && !['barberOverview', 'barberAvailability', 'barberProducts'].includes(currentBarberView)) {
      return (
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-xl text-gray-600">No estás asignado a una barbería.</p>
          <p className="mt-2 text-gray-500">Contacta al administrador.</p>
        </div>
      );
    }
    switch (currentBarberView) {
      case 'barberOverview':
        return <BarberOverview barber={barber} shop={barberShop} />;
      case 'barberShopInfo':
        return <BarberShopInfoView shop={barberShop} />;
      case 'barberServices':
        return <BarberServicesManagement barber={barber} shop={barberShop} />;
      case 'barberAppointments':
        return <BarberAppointmentsView barber={barber} shop={barberShop} />;
      case 'barberAvailability':
        return <BarberAvailabilityManagement barberId={barber.id} />;
      case 'barberProducts':
        return <BarberProductsManagement user={barber} shop={barberShop} />;
      default:
        return <BarberOverview barber={barber} shop={barberShop} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="md:flex">
        <aside className="md:w-64 bg-slate-800 text-slate-100 p-4 md:p-5 space-y-6 min-h-screen flex flex-col shadow-lg">
          <div>
            <h2 className="text-3xl font-bold text-center md:text-left text-white"> Barber<span className="text-indigo-400">RD</span> </h2>
            <p className="text-xs text-center md:text-left text-slate-400 mt-1">Panel de Barbero</p>
          </div>
          <nav className="space-y-1.5 flex-grow">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => dispatch({ type: 'SET_SUB_VIEW', payload: item.key })}
                disabled={!barberShop && !['barberOverview', 'barberAvailability', 'barberProducts'].includes(item.key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 transition-colors duration-150 ease-in-out
                  ${currentBarberView === item.key ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                  ${!barberShop && !['barberOverview', 'barberAvailability', 'barberProducts'].includes(item.key) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`${item.icon} w-5 h-5 text-center text-base`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="border-t border-slate-700 pt-4">
            <button
              onClick={() => dispatch({ type: 'LOGOUT' })}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 text-slate-300 hover:bg-red-700 hover:text-white transition-colors duration-150 ease-in-out"
            >
              <i className="fas fa-sign-out-alt w-5 h-5 text-center text-base"></i>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>
        <main className="flex-1 p-6 md:p-8 lg:p-10 custom-scrollbar overflow-y-auto" style={{maxHeight: '100vh'}}>
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">¡Hola de nuevo, {barber.name}!</h1>
            {barberShop && <p className="text-md text-slate-500 mt-1">Gestiona tu actividad en <span className="font-semibold text-indigo-600">{barberShop.name}</span>.</p>}
            {!barberShop && currentBarberView !== 'barberProducts' && <p className="text-md text-orange-600 mt-1">Aún no estás asignado a una barbería.</p>}
            {!barberShop && currentBarberView === 'barberProducts' && <p className="text-md text-slate-500 mt-1">Gestionando tus productos personales.</p>}
          </header>
          {renderBarberView()}
        </main>
      </div>
    </div>
  );
};

export default BarberDashboard;
