import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';

const BarberOverview = ({ barber, shop }) => {
  const { state, dispatch } = useContext(AppContext);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  
  // Función para obtener las citas del día actual
  const fetchTodayAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filtrar las citas para el día actual y este barbero
    const appointments = state.appointments || [];
    const filtered = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date || appointment.appointmentDate);
      appointmentDate.setHours(0, 0, 0, 0);
      return (
        appointment.barberId === barber?.id &&
        appointmentDate.getTime() === today.getTime() &&
        (appointment.status === 'confirmed' || appointment.status === 'in_progress')
      );
    });
    
    // Ordenar por hora de inicio
    const sorted = [...filtered].sort((a, b) => {
      const timeA = new Date(`1970-01-01T${a.startTime}`).getTime();
      const timeB = new Date(`1970-01-01T${b.startTime}`).getTime();
      return timeA - timeB;
    });
    
    // Identificar la cita actual (en progreso)
    const current = sorted.find(a => a.status === 'in_progress');
    if (current) {
      setCurrentAppointment(current);
    } else if (sorted.length > 0) {
      // Si no hay cita en progreso, establecer la primera como actual
      // (solo si no hay una cita actualmente en progreso)
      if (!currentAppointment) {
        setCurrentAppointment(sorted[0]);
        // Actualizar el estado de la primera cita a 'in_progress'
        updateAppointmentStatus(sorted[0].id, 'in_progress');
      }
    }
    
    setTodayAppointments(sorted);
  };
  
  // Función para actualizar el estado de una cita
  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      // Llamada a la API para actualizar el estado
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        // Actualizar el estado en la UI
        const updatedAppointments = state.appointments.map(appointment => {
          if (appointment.id === appointmentId) {
            return { ...appointment, status };
          }
          return appointment;
        });
        
        // Actualizar el estado global
        if (dispatch) {
          dispatch({ 
            type: 'SET_APPOINTMENTS', 
            payload: updatedAppointments 
          });
        }
        
        // Refrescar las citas del día
        fetchTodayAppointments();
      } else {
        console.error('Error al actualizar el estado de la cita');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // Función para marcar una cita como completada
  const markAsCompleted = async (appointmentId) => {
    await updateAppointmentStatus(appointmentId, 'completed');
    
    // Establecer la siguiente cita como 'en proceso'
    const nextAppointment = todayAppointments.find(a => 
      a.id !== appointmentId && a.status === 'confirmed'
    );
    
    if (nextAppointment) {
      setCurrentAppointment(nextAppointment);
      updateAppointmentStatus(nextAppointment.id, 'in_progress');
    } else {
      setCurrentAppointment(null);
    }
  };
  
  // Efecto para cargar las citas cuando se abre el modal
  useEffect(() => {
    if (showAppointmentsModal) {
      fetchTodayAppointments();
    }
  }, [showAppointmentsModal, state.appointments]);
  
  // Obtener estadísticas reales desde el contexto global
  const appointments = state.appointments || [];
  const reviews = (shop?.reviews || []).filter(r => r.barberId === barber?.id);
  
  // Calcular estadísticas
  const upcoming = appointments.filter(a => 
    a.barberId === barber?.id && 
    new Date(a.startTime) > new Date() && 
    a.status === 'confirmed'
  );
  
  const completed = appointments.filter(a => 
    a.barberId === barber?.id && 
    a.status === 'completed'
  );
  
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : null;
    
  const specialties = barber?.specialties || [];
  
  // Calcular ingresos de las citas completadas
  const totalEarnings = completed.reduce((sum, appt) => {
    // Incluir precio base
    let amount = appt.priceAtBooking || 0;
    
    // Añadir servicios adicionales si existen
    if (appt.additionalServices && appt.additionalServices.length > 0) {
      amount += appt.additionalServices.reduce((subTotal, service) => 
        subTotal + (service.price || 0), 0);
    }
    
    return sum + amount;
  }, 0);
  
  // Foto de perfil
  const photo = barber?.photoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(barber?.name || 'Barbero') + '&background=4f46e5&color=fff&size=128';
  
  return (
    <>
      <div className="card overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative w-32 h-32">
            <img 
              src={photo} 
              alt="Foto del barbero" 
              className="w-32 h-32 rounded-full border-4 border-indigo-200 shadow-md object-cover" 
            />
            <label className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow cursor-pointer hover:bg-indigo-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  if (e.target.files && e.target.files[0]) {
                    const formData = new FormData();
                    formData.append('image', e.target.files[0]);
                    // Subir imagen al backend
                    const uploadRes = await fetch('/api/upload', {
                      method: 'POST',
                      body: formData
                    });
                    const uploadData = await uploadRes.json();
                    if (uploadData.url) {
                      // Actualizar barber en backend
                      await fetch('/api/users/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                        body: JSON.stringify({
                          name: barber.name,
                          phone: barber.phone,
                          profile_image_url: uploadData.url
                        })
                      });
                      // Actualizar en UI (puedes mejorar esto con contexto/dispatch)
                      barber.photoUrl = uploadData.url;
                      window.dispatchEvent(new Event('barber-photo-updated'));
                    }
                  }
                }}
              />
              <i className="fas fa-camera text-indigo-600"></i> <span className="ml-1 text-xs font-semibold">Editar foto</span>
            </label>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              <i className="fas fa-user-tie mr-2 text-indigo-500"></i>{barber?.name}
            </h2>
            <p className="mb-1 text-slate-700"><i className="fas fa-store-alt mr-2 text-indigo-400"></i><span className="font-semibold">Barbería:</span> {shop?.name || 'No asignado'}</p>
            <p className="mb-1 text-slate-700"><i className="fas fa-envelope mr-2 text-indigo-400"></i><span className="font-semibold">Correo:</span> {barber?.email}</p>
            <p className="mb-1 text-slate-700"><i className="fas fa-phone-alt mr-2 text-indigo-400"></i><span className="font-semibold">Teléfono:</span> {barber?.phone}</p>
            {specialties.length > 0 && (
              <p className="mb-2 text-slate-700"><i className="fas fa-star mr-2 text-yellow-400"></i><span className="font-semibold">Especialidades:</span> {specialties.join(', ')}</p>
            )}
          </div>
        </div>
        
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Resumen de Actividad</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-700">{upcoming.length}</div>
              <div className="text-xs text-slate-600">Citas Próximas</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">{completed.length}</div>
              <div className="text-xs text-slate-600">Citas Completadas</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{avgRating || '—'}</div>
              <div className="text-xs text-slate-600">Calificación</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-700">RD${totalEarnings.toLocaleString()}</div>
              <div className="text-xs text-slate-600">Ingresos Totales</div>
            </div>
          </div>
        </div>
        
        {/* Accesos rápidos */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
            <i className="fas fa-bolt mr-2 text-indigo-500"></i>Accesos Rápidos
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                console.log('Mostrando citas del día...');
                setShowAppointmentsModal(true);
              }}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
            ><i className="fas fa-calendar-check mr-2"></i>Ver Mis Citas</button>
            <button 
              onClick={() => {
                console.log('Navegando a gestión de servicios...');
                // Usar diferentes métodos de navegación para mayor compatibilidad
                try {
                  // Intentar usar React Router si está disponible
                  if (window.history && window.history.pushState) {
                    window.history.pushState({}, '', '/barber/services');
                    window.dispatchEvent(new Event('popstate'));
                  } else {
                    // Fallback a navegación por hash
                    window.location.href = '#/barber/services';
                  }
                } catch (error) {
                  console.error('Error al navegar:', error);
                  // Último recurso: recarga completa
                  window.location.href = '/barber/services';
                }
              }}
              className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
            ><i className="fas fa-cut mr-2"></i>Gestionar Servicios</button>
          </div>
        </div>
      </div>

      {/* Modal de citas del día */}
      {showAppointmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                <i className="fas fa-calendar-day mr-2"></i>
                Citas del Día
              </h3>
              <button onClick={() => setShowAppointmentsModal(false)} className="text-white hover:text-indigo-200">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6">
              {/* Cita actual en proceso */}
              {currentAppointment && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-indigo-700 mb-2 flex items-center">
                    <i className="fas fa-hourglass-half mr-2"></i>
                    En Atención
                  </h4>
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{currentAppointment.clientName || 'Cliente'}</p>
                        <p className="text-sm text-slate-600">
                          <i className="far fa-clock mr-1"></i>
                          {currentAppointment.startTime} - {currentAppointment.endTime}
                        </p>
                        <p className="text-sm text-slate-600">
                          <i className="fas fa-cut mr-1"></i>
                          {currentAppointment.serviceName || 'Servicio'}
                        </p>
                      </div>
                      <button 
                        onClick={() => markAsCompleted(currentAppointment.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        <i className="fas fa-check mr-1"></i> Completada
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Lista de próximas citas */}
              <h4 className="text-lg font-semibold text-slate-700 mb-2 flex items-center">
                <i className="fas fa-list-ul mr-2 text-indigo-500"></i>
                Próximas Citas
              </h4>
              
              {todayAppointments.filter(a => a.id !== (currentAppointment?.id || '')).length === 0 ? (
                <p className="text-center py-4 text-slate-500">No hay más citas programadas para hoy</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {todayAppointments
                    .filter(a => a.id !== (currentAppointment?.id || ''))
                    .map(appointment => (
                      <div key={appointment.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{appointment.clientName || 'Cliente'}</p>
                            <p className="text-sm text-slate-600">
                              <i className="far fa-clock mr-1"></i>
                              {appointment.startTime} - {appointment.endTime}
                            </p>
                            <p className="text-sm text-slate-600">
                              <i className="fas fa-cut mr-1"></i>
                              {appointment.serviceName || 'Servicio'}
                            </p>
                          </div>
                          <div className="text-xs bg-indigo-100 text-indigo-800 rounded-full px-2 py-1">
                            {appointment.status === 'confirmed' ? 'Confirmada' : appointment.status}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
              
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setShowAppointmentsModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



export default BarberOverview;
