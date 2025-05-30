import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import OwnerProductsManagement from './OwnerProductsManagement';
import OwnerSummary from './OwnerSummary';
import OwnerBarbersManagement from './OwnerBarbersManagement';
import OwnerAppointmentsManagement from './OwnerAppointmentsManagement';
import OwnerServicesManagement from './OwnerServicesManagement';
import OwnerBarberShopsManagement from './OwnerBarberShopsManagement';

// Los componentes ya están importados desde sus propios archivos

// Ahora importado desde su propio archivo

const navItems = [
  { key: 'summary', label: 'Resumen General', icon: 'fas fa-home' },
  { key: 'barberShops', label: 'Barberías', icon: 'fas fa-store-alt' },
  { key: 'shopServices', label: 'Servicios Tienda', icon: 'fas fa-cut' },
  { key: 'manageBarbers', label: 'Gestionar Barberos', icon: 'fas fa-user-tie' },
  { key: 'shopAppointments', label: 'Citas Tienda', icon: 'fas fa-calendar-check' },
  { key: 'shopProducts', label: 'Productos Tienda', icon: 'fas fa-box-open' }
];

const sectionTitles = {
  summary: 'Resumen General',
  barberShops: 'Barberías',
  shopServices: 'Servicios Tienda',
  manageBarbers: 'Gestionar Barberos',
  shopAppointments: 'Citas Tienda',
  shopProducts: 'Productos Tienda',
};

const OwnerDashboard = () => {
  const { state, dispatch } = useContext(AppContext);
  const owner = state.currentUser;
  const [activeSection, setActiveSection] = useState('summary');
  const currentShop = state.barberShops.find(s => s.ownerId === owner?.id);


  return (
    <div className="min-h-screen bg-slate-100 font-inter" data-component-name="OwnerDashboard">
      <div className="md:flex">
        {/* Sidebar */}
        <aside className="md:w-64 bg-slate-800 text-slate-100 p-4 md:p-5 space-y-6 min-h-screen flex flex-col shadow-lg">
          <div>
            <h2 className="text-3xl font-bold text-center md:text-left text-white tracking-tight">Barber<span className="text-indigo-400">RD</span></h2>
            <p className="text-xs text-center md:text-left text-slate-400 mt-1">Panel de Propietario</p>
          </div>
          <nav className="space-y-1.5 flex-grow">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                data-section={item.key}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 transition-colors duration-150 ease-in-out ${activeSection === item.key ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
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
        {/* Main content */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 custom-scrollbar overflow-y-auto" style={{maxHeight: '100vh'}}>
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Panel de Administración</h1>
            <p className="text-md text-slate-500 mt-1">Gestionando: <span className="font-semibold text-indigo-600">{currentShop?.name || 'Tu Barbería'}</span></p>
          </header>
          <section>
            <h2 className="text-xl font-semibold text-slate-700 mb-6">{sectionTitles[activeSection]}</h2>
            {activeSection === 'summary' && (
                <OwnerSummary 
                  shop={currentShop} 
                  appointments={state.appointments.filter(a => a.shopId === currentShop?.id)} 
                  barbers={state.users.filter(u => u.role === 'barber' && (currentShop?.barberIds?.includes(u.id) || u.shopId === currentShop?.id))} 
                />
              )}
            {activeSection === 'barberShops' && (
                <OwnerBarberShopsManagement />
              )}
            {activeSection === 'shopProducts' && (
                <OwnerProductsManagement shop={currentShop} />
              )}
            {activeSection === 'manageBarbers' && (
                <OwnerBarbersManagement />
              )}
              {activeSection === 'shopAppointments' && (
                <OwnerAppointmentsManagement />
              )}
              {activeSection === 'shopServices' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-700 mb-4">Servicios Tienda</h2>
                  <OwnerServicesManagement />
                </div>
              )}
              {activeSection !== 'summary' && activeSection !== 'barberShops' && activeSection !== 'shopProducts' && activeSection !== 'manageBarbers' && activeSection !== 'shopAppointments' && activeSection !== 'shopServices' && (
                <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center justify-center min-h-[200px] text-slate-500">
                  <i className="fas fa-tools text-4xl text-indigo-300 mb-4"></i>
                  <span className="text-lg font-semibold">Próximamente: {sectionTitles[activeSection]}</span>
                </div>
              )}
          </section>
        </main>
      </div>
    </div>
  );
};
export default OwnerDashboard;
