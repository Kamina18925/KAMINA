import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';

const BarberAppointmentsView = ({ barber, shop }) => {
  const { state, dispatch } = useContext(AppContext);
  const [filter, setFilter] = useState('upcoming');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Filtrar citas del barbero según el filtro seleccionado
  const filteredAppointments = state.appointments.filter(appt => {
    if (appt.barberId !== barber?.id) return false;
    
    const apptDate = new Date(appt.startTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filter === 'upcoming') {
      return apptDate >= today || 
             (apptDate.toDateString() === today.toDateString() && 
              appt.status === 'confirmed');
    } else if (filter === 'past') {
      return apptDate < today || 
             (apptDate.toDateString() === today.toDateString() && 
              (appt.status === 'completed' || appt.status === 'no_show' || appt.status.startsWith('cancelled')));
    } else if (filter === 'byDate') {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      return apptDate.toDateString() === filterDate.toDateString();
    }
    return true;
  }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // Función para obtener detalles del servicio de la cita
  const getResolvedAppointmentServiceDetails = (appointment) => {
    // Primero buscar si es un servicio del catálogo
    const catalogService = state.services.find(s => s.id === appointment.serviceId);
    if (catalogService) {
      return {
        name: catalogService.name,
        duration: catalogService.baseDurationMinutes,
        price: appointment.priceAtBooking || catalogService.basePrice
      };
    }
    
    // Si no se encuentra, podría ser un servicio personalizado
    return {
      name: appointment.service || 'Servicio',
      duration: appointment.duration || '30',
      price: appointment.priceAtBooking || 0
    };
  };

  // Manejar marcar citas como completadas, canceladas o no-show
  const handleMarkAppointment = (appointmentId, status) => {
    if (!window.confirm(`¿Seguro que quieres marcar esta cita como ${status}?`)) return;
    
    if (status === 'completed') {
      dispatch({
        type: 'COMPLETE_APPOINTMENT',
        payload: { appointmentId, completedAt: new Date().toISOString() }
      });
    } else if (status === 'no_show') {
      dispatch({
        type: 'NO_SHOW_APPOINTMENT',
        payload: { appointmentId }
      });
    } else if (status === 'cancelled_by_barber') {
      dispatch({
        type: 'CANCEL_APPOINTMENT',
        payload: { appointmentId, cancelledBy: 'barber' }
      });
    }
  };

  // Manejar editar notas
  const handleEditNotes = (appointment) => {
    dispatch({
      type: 'SHOW_MODAL',
      payload: {
        content: (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Editar Notas</h3>
            <textarea
              className="w-full p-2 border border-slate-300 rounded-md mb-4"
              rows="3"
              defaultValue={appointment.notesBarber || ''}
              id="barberNotes"
              placeholder="Añade tus notas aquí..."
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => dispatch({ type: 'HIDE_MODAL' })}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >Cancelar</button>
              <button
                onClick={() => {
                  const notes = document.getElementById('barberNotes').value;
                  dispatch({
                    type: 'UPDATE_APPOINTMENT_BARBER_NOTES',
                    payload: { appointmentId: appointment.id, notesBarber: notes }
                  });
                  dispatch({ type: 'HIDE_MODAL' });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
              >Guardar</button>
            </div>
          </div>
        ),
        props: { title: 'Notas del Barbero' }
      }
    });
  };

  // Manejar añadir servicio extra
  const handleAddExtraService = (appointment) => {
    dispatch({
      type: 'SHOW_MODAL',
      payload: {
        content: (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Añadir Servicio Extra</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="extra-service-name" className="block text-sm font-medium text-slate-700 mb-1">Nombre del Servicio</label>
                <input type="text" id="extra-service-name" className="w-full p-2 border border-slate-300 rounded-md" placeholder="Ej: Recorte de barba" />
              </div>
              <div>
                <label htmlFor="extra-service-price" className="block text-sm font-medium text-slate-700 mb-1">Precio (RD$)</label>
                <input type="number" id="extra-service-price" className="w-full p-2 border border-slate-300 rounded-md" placeholder="0" min="0" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => dispatch({ type: 'HIDE_MODAL' })}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                >Cancelar</button>
                <button
                  onClick={() => {
                    const name = document.getElementById('extra-service-name').value;
                    const price = Number(document.getElementById('extra-service-price').value);
                    if (!name || isNaN(price) || price <= 0) {
                      alert('Por favor completa todos los campos correctamente');
                      return;
                    }
                    dispatch({
                      type: 'ADD_EXTRA_SERVICE_TO_APPOINTMENT',
                      payload: {
                        appointmentId: appointment.id,
                        extraService: {
                          id: `extra_${Date.now()}`,
                          name,
                          price
                        }
                      }
                    });
                    dispatch({ type: 'HIDE_MODAL' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >Añadir</button>
              </div>
            </div>
          </div>
        ),
        props: { title: 'Añadir Servicio Extra' }
      }
    });
  };

  // Manejar eliminar servicio extra
  const handleRemoveExtraService = (appointmentId, extraServiceId) => {
    if (!window.confirm('¿Seguro que quieres eliminar este servicio extra?')) return;
    
    dispatch({
      type: 'REMOVE_EXTRA_SERVICE_FROM_APPOINTMENT',
      payload: { appointmentId, extraServiceId }
    });
  };

  // Manejar ofrecer adelanto de cita
  const handleOfferAdvance = (appointment) => {
    const now = new Date();
    const apptStartTime = new Date(appointment.startTime);
    const minimumTimeForAdvance = new Date(now.getTime() + 15 * 60000); // 15 minutos mínimo

    if (apptStartTime <= minimumTimeForAdvance) {
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          message: 'No hay suficiente tiempo para ofrecer un adelanto significativo para esta cita.',
          type: 'error'
        }
      });
      return;
    }

    dispatch({
      type: 'SHOW_MODAL',
      payload: {
        content: (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Ofrecer Adelanto de Cita</h3>
            <p className="text-slate-600 mb-4">¿Tienes disponibilidad para atender al cliente antes? Selecciona la nueva hora propuesta:</p>
            <input
              type="datetime-local"
              className="w-full p-2 border border-slate-300 rounded-md mb-4"
              id="advance-time"
              min={new Date(now.getTime() + 15 * 60000).toISOString().slice(0, 16)}
              max={apptStartTime.toISOString().slice(0, 16)}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => dispatch({ type: 'HIDE_MODAL' })}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >Cancelar</button>
              <button
                onClick={() => {
                  const newTime = document.getElementById('advance-time').value;
                  if (!newTime) {
                    alert('Por favor selecciona una hora válida');
                    return;
                  }
                  // Aquí implementarías la lógica para ofrecer el adelanto
                  // dispatch({ type: 'OFFER_APPOINTMENT_ADVANCE', payload: { appointmentId: appointment.id, newTime } });
                  dispatch({ type: 'HIDE_MODAL' });
                  dispatch({
                    type: 'SHOW_NOTIFICATION',
                    payload: {
                      message: 'Se ha enviado la propuesta de adelanto al cliente.',
                      type: 'success'
                    }
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md"
              >Enviar Propuesta</button>
            </div>
          </div>
        ),
        props: { title: 'Adelantar Cita' }
      }
    });
  };

  return (
    <div className="card overflow-hidden">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Gestión de Mis Citas</h2>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 text-sm rounded-md font-medium ${filter === 'upcoming' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >Próximas / Hoy</button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 text-sm rounded-md font-medium ${filter === 'past' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >Pasadas</button>
          <button
            onClick={() => setFilter('byDate')}
            className={`px-4 py-2 text-sm rounded-md font-medium ${filter === 'byDate' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >Por Día</button>
        </div>
        {filter === 'byDate' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border border-slate-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        )}
      </div>
      {filteredAppointments.length > 0 ? (
        <div className="space-y-4 max-h-[calc(100vh-22rem)] overflow-y-auto custom-scrollbar pr-2">
          {filteredAppointments.map(appt => {
            const client = state.users.find(u => u.id === appt.clientId);
            const resolvedServiceDetails = getResolvedAppointmentServiceDetails(appt);
            const serviceName = resolvedServiceDetails.name;
            const apptDateTime = new Date(appt.startTime);
            const isPastAppt = apptDateTime < new Date() && !appt.actualEndTime && !appt.status.startsWith('cancelled') && appt.status !== 'no_show';
            const isTodayAppt = apptDateTime.toDateString() === new Date().toDateString();
            const canManageExtras = appt.status === 'confirmed' && !new Date(appt.startTime) < new Date() && !appt.actualEndTime;
            const canOfferAdvance = appt.status === 'confirmed' && !appt.actualEndTime && new Date(appt.startTime) > new Date(new Date().getTime() + 15 * 60000);

            let cardBgColor = 'bg-white border-indigo-500 shadow-sm hover:shadow-md transition-shadow';
            if (appt.status === 'completed') cardBgColor = 'bg-green-50 border-green-500';
            else if (appt.status.startsWith('cancelled')) cardBgColor = 'bg-red-50 border-red-500 opacity-80';
            else if (appt.status === 'no_show') cardBgColor = 'bg-yellow-100 border-yellow-600 opacity-80';
            else if (isPastAppt && appt.status === 'confirmed') cardBgColor = 'bg-orange-50 border-orange-500';
            
            return (
              <div key={appt.id} className={`p-4 rounded-lg border-l-4 ${cardBgColor}`}>
                <div className="sm:flex sm:justify-between items-start">
                  <div>
                    <h3 className="text-md font-semibold text-slate-800">{serviceName} con {client?.name || 'Cliente'}</h3>
                    {appt.clientPhoneNumberAtBooking && (
                      <p className="text-xs text-slate-500"><i className="fas fa-phone-alt mr-1 opacity-70"></i>{appt.clientPhoneNumberAtBooking}</p>
                    )}
                    <p className="text-xs text-slate-500">Precio Total: RD${(appt.priceAtBooking || 0).toLocaleString()}</p>
                    {shop && <p className="text-xs text-slate-500">{shop.name}</p>}
                  </div>
                  <div className="mt-1 sm:mt-0 text-sm sm:text-right text-slate-700">
                    <p className="font-semibold">{apptDateTime.toLocaleDateString('es-DO', { timeZone: 'America/Santo_Domingo', weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    <p>{apptDateTime.toLocaleTimeString('es-DO', { timeZone: 'America/Santo_Domingo', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  </div>
                </div>

                {(appt.additionalServices && appt.additionalServices.length > 0) && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-600">Servicios Extras:</h4>
                    <ul className="list-disc list-inside pl-1 text-xs text-slate-500">
                      {appt.additionalServices.map(extra => (
                        <li key={extra.id} className="flex justify-between items-center">
                          <span>{extra.name} (RD${extra.price.toLocaleString()})</span>
                          {canManageExtras && (
                            <button onClick={() => handleRemoveExtraService(appt.id, extra.id)} className="text-red-500 hover:text-red-700 text-xs ml-2 p-0.5">
                              <i className="fas fa-times-circle"></i>
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {appt.notes && <p className="text-xs text-slate-500 mt-1 pt-1 border-t border-slate-100 italic">Notas Cliente: {appt.notes}</p>}
                {appt.notesBarber && <p className="text-xs text-indigo-500 mt-1 pt-1 border-t border-slate-100 italic">Mis Notas: {appt.notesBarber}</p>}
                {appt.actualEndTime && <p className="text-xs text-green-600 mt-1 pt-1 border-t border-slate-100 italic">Finalizada a las: {new Date(appt.actualEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}

                <div className="mt-3 flex flex-wrap gap-2 items-center justify-between">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${ 
                    appt.status === 'confirmed' ? (isPastAppt ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800') 
                    : appt.status === 'completed' ? 'bg-green-100 text-green-800' 
                    : appt.status.startsWith('cancelled') ? 'bg-red-100 text-red-800' 
                    : appt.status === 'no_show' ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-slate-100 text-slate-800' }`}>
                    {isPastAppt && appt.status === 'confirmed' ? 'PENDIENTE (PASADA)' : appt.status.replace('_by_barber', ' por mí').replace('_by_client', ' por cliente').replace('_', ' ').toUpperCase()}
                  </span>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={() => handleEditNotes(appt)} className="text-xs text-slate-500 hover:text-indigo-600 p-1"><i className="fas fa-edit mr-1"></i>Notas</button>
                    
                    {/* Botón de Ofrecer Adelanto */}
                    {canOfferAdvance && (
                      <button 
                        onClick={() => handleOfferAdvance(appt)} 
                        className="text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold py-1 px-2.5 rounded-md shadow-sm transition-colors"
                        title="Ofrecer al cliente adelantar esta cita si hay disponibilidad ahora."
                      >
                        <i className="fas fa-fast-forward mr-1"></i>Adelantar
                      </button>
                    )}

                    {canManageExtras && (
                      <button onClick={() => handleAddExtraService(appt)} className="text-xs bg-purple-500 hover:bg-purple-600 text-white font-semibold py-1 px-2.5 rounded-md shadow-sm transition-colors"><i className="fas fa-plus-circle mr-1"></i>Extra</button>
                    )}
                    
                    {/* Botones de acción solo si no está ya completada o cancelada */}
                    {appt.status === 'confirmed' && !appt.actualEndTime && (
                      <>
                        <button onClick={() => handleMarkAppointment(appt.id, 'completed')} className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2.5 rounded-md shadow-sm transition-colors">Completada</button>
                        <button onClick={() => handleMarkAppointment(appt.id, 'no_show')} className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold py-1 px-2.5 rounded-md shadow-sm transition-colors">No Asistió</button>
                        <button onClick={() => handleMarkAppointment(appt.id, 'cancelled_by_barber')} className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2.5 rounded-md shadow-sm transition-colors">Cancelar Cita</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : <p className="text-slate-500 mt-6 text-center py-4">No tienes citas que coincidan con los filtros seleccionados.</p>}
    </div>
  );
};

export default BarberAppointmentsView;
