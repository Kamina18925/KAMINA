import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { AppContext } from '../App';
import ClientAppointments from './ClientAppointments';
import ClientProductsView from './ClientProductsView';
import Modal from './ui/Modal';

// Helpers del original
const getShopOpenStatus = (shop, targetDate, allUsers, allBarberAvailability) => {
  if (!shop) return { status: 'Desconocido', reason: 'Barbería no especificada', cssClass: 'bg-slate-100 text-slate-600' };
  const dayOfWeekIndex = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getUTCDay();
  const dayKey = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][dayOfWeekIndex];
  const hours = shop.openingHours?.[dayKey];
  if (!hours || hours === 'Cerrado') return { status: 'Cerrado', reason: 'Hoy no abre', cssClass: 'bg-red-100 text-red-700' };
  const [open, close] = hours.split('-');
  const now = new Date();
  const [h, m] = open.split(':');
  const [h2, m2] = close.split(':');
  const openMinutes = parseInt(h) * 60 + parseInt(m);
  const closeMinutes = parseInt(h2) * 60 + parseInt(m2);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) return { status: 'Abierto', reason: '', cssClass: 'bg-green-100 text-green-800' };
  return { status: 'Cerrado', reason: 'Fuera de horario', cssClass: 'bg-red-100 text-red-700' };
};

const ClientDashboard = () => {
  const { state, dispatch } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeView, setActiveView] = useState('shops'); // 'shops', 'appointments', 'products'
  
  // Referencias para controlar el ciclo de vida del componente
  const isMounted = useRef(true);

  useEffect(() => {
    // Establecer la referencia de montaje al inicio
    isMounted.current = true;
    
    // Limpieza al desmontar
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Helpers para obtener datos de barberos y servicios
  const getBarbersInShop = (shop) => state.users.filter(u => u.role === 'barber' && shop.barberIds.includes(u.id));
  const getServicesInShop = (shop) => (shop.servicesIds || []).map(sid => state.masterServices.find(ms => ms.id === sid)).filter(Boolean);

  // Simulación de horarios disponibles (puedes mejorar esto con lógica real)
  const availableTimes = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  // Manejar apertura del modal con protección contra desmontaje
  const handleOpenModal = (shop) => {
    if (!isMounted.current) return;
    
    // Primero establecer shop, luego mostrar modal en el siguiente ciclo
    setSelectedShop(shop);
    setTimeout(() => {
      if (isMounted.current) {
        setSelectedService(null);
        setSelectedBarber(null);
        setSelectedDate('');
        setSelectedTime('');
        setShowModal(true);
      }
    }, 0);
  };
  
  // Manejar cierre del modal con protección contra desmontaje
  const handleCloseModal = () => {
    if (!isMounted.current) return;
    
    // Primero ocultar el modal, luego limpiar estados
    setShowModal(false);
    setTimeout(() => {
      if (isMounted.current) {
        setSelectedShop(null);
        setSelectedService(null);
        setSelectedBarber(null);
        setSelectedDate('');
        setSelectedTime('');
      }
    }, 100);
  };

  const handleBookAppointment = async () => {
    // Validar todos los campos
    if (!selectedShop || !selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: 'Completa todos los campos.', type: 'error' } });
      return;
    }
    
    try {
      // Activar indicador de carga
      setBookingLoading(true);
      
      // Simulación de creación de cita con manejo seguro de errores
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar si el componente sigue montado
      if (!isMounted.current) return;
      
      // Todo ok, crear la cita
      dispatch({
        type: 'ADD_APPOINTMENT',
        payload: {
          id: `appt_${Date.now()}`,
          clientId: state.currentUser.id,
          shopId: selectedShop.id,
          barberId: selectedBarber.id,
          serviceId: selectedService.id,
          startTime: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
          status: 'confirmed',
          priceAtBooking: selectedService.basePrice,
          clientPhoneNumberAtBooking: state.currentUser.phone,
          additionalServices: [],
        }
      });
      
      // Verificar nuevamente si sigue montado antes de actualizar estados
      if (!isMounted.current) return;
      
      // Restablecer estado de carga
      setBookingLoading(false);
      
      // Cerrar modal con seguridad
      handleCloseModal();
      
      // Mostrar notificación de éxito
      setTimeout(() => {
        if (isMounted.current) {
          dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: '¡Cita reservada con éxito!', type: 'success' } });
        }
      }, 100);
    } catch (error) {
      console.error('Error al reservar cita:', error);
      
      // Verificar si sigue montado
      if (!isMounted.current) return;
      
      // Restablecer estado y mostrar error
      setBookingLoading(false);
      dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: 'Error al reservar la cita. Inténtalo de nuevo.', type: 'error' } });
    }
  };

  // Transición segura entre vistas
  const handleChangeView = (view) => {
    if (!isMounted.current) return;
    
    setActiveView(view);
    
    // Si estamos cambiando de vista, limpiar la búsqueda
    if (view === 'shops') {
      setSearch('');
    }
  };

  if (activeView === 'appointments') {
    return <ClientAppointments onBack={() => handleChangeView('shops')} />;
  } else if (activeView === 'products') {
    return <ClientProductsView onBack={() => handleChangeView('shops')} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Encuentra tu Barbería</h1>
          <div className="flex flex-wrap gap-3">
            <button 
              className={`px-4 py-2 rounded-lg shadow-md flex items-center ${activeView === 'shops' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
              onClick={() => handleChangeView('shops')}
            >
              <i className="fas fa-store-alt mr-2"></i>
              Barberías
            </button>
            <button 
              className={`px-4 py-2 rounded-lg shadow-md flex items-center ${activeView === 'appointments' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
              onClick={() => handleChangeView('appointments')}
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              Mis Citas
            </button>
            <button 
              className={`px-4 py-2 rounded-lg shadow-md flex items-center ${activeView === 'products' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
              onClick={() => handleChangeView('products')}
            >
              <i className="fas fa-shopping-bag mr-2"></i>
              Productos
            </button>
            <button
              onClick={() => dispatch({ type: 'LOGOUT' })}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md flex items-center"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="p-2 border border-slate-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Buscar Barbería"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.barberShops.filter(shop =>
            shop.name.toLowerCase().includes(search.toLowerCase()) ||
            shop.address.toLowerCase().includes(search.toLowerCase()) ||
            shop.city.toLowerCase().includes(search.toLowerCase())
          ).map(shop => (
            <div key={shop.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4">
              <img
                src={state.barberShopPhotos?.[shop.id]?.[0] || 'https://placehold.co/400x200?text=Barbería'}
                alt={shop.name}
                className="rounded-lg object-cover w-full h-40 mb-2"
                style={{ minHeight: '160px', background: '#eee' }}
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">{shop.name}</h2>
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold mb-2">Abierto</span>
                <div className="flex items-center text-slate-600 text-sm mb-1">
                  <i className="fa-solid fa-map-marker-alt mr-2 text-indigo-400"></i>
                  {shop.address}, {shop.city}
                </div>
                <div className="flex items-center text-slate-600 text-sm mb-1">
                  <i className="fa-solid fa-phone mr-2 text-indigo-400"></i>
                  {shop.phone}
                </div>
                <div className="flex items-center gap-1 text-yellow-400 text-base mb-1">
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star-half-alt"></i>
                  <span className="text-slate-500 text-xs ml-1">(4.8 de 2 reseñas)</span>
                </div>
              </div>
              <button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg mt-2 shadow-sm text-sm"
                onClick={() => handleOpenModal(shop)}
              >
                Ver Detalles y Reservar
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Modal para detalles y reserva */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={selectedShop ? `Barbería: ${selectedShop.name}` : ''} size="xl">
        {selectedShop && (
          <div className="space-y-6">
            {/* Galería de fotos */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(selectedShop.photos || []).map((url, idx) => (
                <img key={idx} src={url} alt="Foto barbería" className="h-32 w-48 object-cover rounded shadow" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-bold text-indigo-700 mb-2">Información</h3>
                <p><span className="font-semibold">Dirección:</span> {selectedShop.address}</p>
                <p><span className="font-semibold">Ciudad:</span> {selectedShop.city}</p>
                <p><span className="font-semibold">Teléfono:</span> {selectedShop.phone}</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-indigo-700 mb-2">Servicios Disponibles</h3>
                <ul className="space-y-1">
                  {getServicesInShop(selectedShop).map(svc => (
                    <li key={svc.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="service"
                        checked={selectedService?.id === svc.id}
                        onChange={() => setSelectedService(svc)}
                        className="accent-indigo-600"
                      />
                      <span>{svc.name} <span className="text-xs text-slate-500">({svc.baseDurationMinutes} min, RD${svc.basePrice})</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-700 mb-2">Selecciona Barbero</h3>
              <ul className="flex flex-wrap gap-3">
                {getBarbersInShop(selectedShop).map(barb => (
                  <li key={barb.id}>
                    <button
                      className={`flex flex-col items-center px-4 py-2 rounded-lg border transition ${selectedBarber?.id === barb.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 bg-white hover:bg-slate-100'}`}
                      onClick={() => setSelectedBarber(barb)}
                    >
                      <img src={barb.photoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(barb.name)} alt={barb.name} className="w-12 h-12 rounded-full mb-1 border shadow" />
                      <span className="text-sm font-medium">{barb.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-md p-2"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hora</label>
                <select
                  className="w-full border border-slate-300 rounded-md p-2"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                >
                  <option value="">Selecciona una hora</option>
                  {availableTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow text-base disabled:opacity-60"
                  onClick={handleBookAppointment}
                  disabled={bookingLoading || !selectedService || !selectedBarber || !selectedDate || !selectedTime}
                >
                  {bookingLoading ? 'Reservando...' : 'Reservar Cita'}
                </button>
              </div>
            </div>
            {/* Productos disponibles */}
            <div>
              <h3 className="text-lg font-bold text-indigo-700 mb-2 mt-6">Productos Disponibles</h3>
              <div className="flex gap-4 overflow-x-auto">
                {(selectedShop.products || []).length > 0 ? (
                  selectedShop.products.map(prod => (
                    <div key={prod.id} className="bg-slate-50 border rounded-lg p-4 min-w-[180px] flex flex-col items-center">
                      <img src={prod.photoUrl || 'https://placehold.co/120x120?text=Producto'} alt={prod.name} className="w-20 h-20 object-cover rounded mb-2" />
                      <span className="font-semibold text-slate-800 text-sm mb-1">{prod.name}</span>
                      <span className="text-xs text-slate-500 mb-1">RD${prod.price}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500">No hay productos registrados.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientDashboard;
