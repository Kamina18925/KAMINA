import React, { useContext, useRef, useEffect, useState } from 'react';
import { AppContext } from '../App';

const ClientAppointments = ({ onBack }) => {
  const { state, dispatch } = useContext(AppContext);
  const clientId = state.currentUser?.id;
  const [cancelling, setCancelling] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingHistory, setDeletingHistory] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const isMounted = useRef(true);
  
  // Control de ciclo de vida del componente
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Protección contra undefined
  const appointments = Array.isArray(state.appointments) ? state.appointments : [];
  const barberShops = Array.isArray(state.barberShops) ? state.barberShops : [];
  const users = Array.isArray(state.users) ? state.users : [];
  const masterServices = Array.isArray(state.masterServices) ? state.masterServices : [];

  const myAppointments = appointments.filter(a => a.clientId === clientId);

  const handleCancel = async (apptId) => {
    try {
      if (cancelling) return; // Prevenir múltiples clics
      
      setCancelling(true);
      setCancellingId(apptId);
      
      // Pequeño retardo para evitar problemas de renderizado
      await new Promise(resolve => setTimeout(resolve, 50));

      // Solo ejecutar si el componente sigue montado
      if (!isMounted.current) return;
      
      dispatch({ type: 'CANCEL_APPOINTMENT', payload: { id: apptId } });
      
      // Pequeño retardo antes de mostrar notificación
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Solo ejecutar si el componente sigue montado
      if (!isMounted.current) return;

      dispatch({ 
        type: 'SHOW_NOTIFICATION', 
        payload: { message: 'Cita cancelada exitosamente', type: 'success' } 
      });
      
      // Resetear estado después de completar
      setTimeout(() => {
        if (isMounted.current) {
          setCancelling(false);
          setCancellingId(null);
        }
      }, 300);
    } catch (error) {
      console.error('Error al cancelar cita:', error);
      if (isMounted.current) {
        setCancelling(false);
        setCancellingId(null);
        dispatch({ 
          type: 'SHOW_NOTIFICATION', 
          payload: { message: 'Error al cancelar la cita', type: 'error' } 
        });
      }
    }
  };
  
  const handleDeleteHistory = async () => {
    try {
      if (deletingHistory) return; // Prevenir múltiples clics
      
      setDeletingHistory(true);
      
      // Pequeño retardo para evitar problemas de renderizado
      await new Promise(resolve => setTimeout(resolve, 50));

      // Solo ejecutar si el componente sigue montado
      if (!isMounted.current) return;
      
      dispatch({ 
        type: 'DELETE_CLIENT_APPOINTMENTS_HISTORY', 
        payload: { 
          clientId, 
          keepActive: true // Mantener citas activas/confirmadas
        } 
      });
      
      // Pequeño retardo antes de mostrar notificación
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Solo ejecutar si el componente sigue montado
      if (!isMounted.current) return;

      dispatch({ 
        type: 'SHOW_NOTIFICATION', 
        payload: { message: 'Historial de citas borrado exitosamente', type: 'success' } 
      });
      
      // Resetear estado después de completar
      setTimeout(() => {
        if (isMounted.current) {
          setDeletingHistory(false);
          setShowConfirmation(false);
        }
      }, 300);
    } catch (error) {
      console.error('Error al borrar historial:', error);
      if (isMounted.current) {
        setDeletingHistory(false);
        setShowConfirmation(false);
        dispatch({ 
          type: 'SHOW_NOTIFICATION', 
          payload: { message: 'Error al borrar el historial de citas', type: 'error' } 
        });
      }
    }
  };

  try {
    // Solo en modo desarrollo (comentar en producción)
    // console.log('ClientAppointments: rendering...');
    return (
      <div className="min-h-screen bg-slate-100 custom-scrollbar">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-16">
          <div className="flex items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-slate-800 flex-1">Mis Citas</h1>
            {onBack && (
              <button
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg shadow text-sm font-semibold"
                onClick={onBack}
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>Volver
              </button>
            )}
          </div>
          <div className="flex items-center mb-4">
            <div className="text-slate-700 text-sm flex-1">Citas encontradas: {myAppointments.length}</div>
            {myAppointments.some(appt => appt.status === 'completed' || appt.status === 'cancelled') && (
              <button
                className="bg-slate-500 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg shadow text-sm"
                onClick={() => setShowConfirmation(true)}
                disabled={deletingHistory}
              >
                {deletingHistory ? (
                  <span className="flex items-center justify-center">
                    <span className="inline-block animate-spin mr-2 h-4 w-4 text-white">
                      ⟳
                    </span>
                    Borrando historial...  
                  </span>
                ) : (
                  <span>
                    <i className="fa-solid fa-trash-can mr-2"></i>Borrar historial
                  </span>
                )}
              </button>
            )}
          </div>
          
          {/* Diálogo de confirmación para borrar historial */}
          {showConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-slate-800 mb-3">Confirmar borrado</h3>
                <p className="text-slate-600 mb-6">
                  ¿Estás seguro que deseas borrar tu historial de citas completadas y canceladas? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-sm"
                    onClick={() => setShowConfirmation(false)}
                    disabled={deletingHistory}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm"
                    onClick={handleDeleteHistory}
                    disabled={deletingHistory}
                  >
                    {deletingHistory ? (
                      <span className="flex items-center justify-center">
                        <span className="inline-block animate-spin mr-2 h-4 w-4 text-white">
                          ⟳
                        </span>
                        Borrando...
                      </span>
                    ) : 'Sí, borrar historial'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {myAppointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center text-slate-500">
              No tienes citas reservadas.
            </div>
          ) : (
            <div className="space-y-6">
              {myAppointments.map((appt, idx) => {
                try {
                  const shop = barberShops.find(s => s.id === appt.shopId);
                  const barber = users.find(u => u.id === appt.barberId);
                  const service = masterServices.find(s => s.id === appt.serviceId);
                  return (
                    <div key={appt.id} className={`bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-l-4 ${
                      appt.status === 'completed' ? 'border-green-500' : appt.status === 'cancelled' ? 'border-red-500' : 'border-indigo-500'
                    }`}>
                      <div className="flex-1">
                        <div className="mb-2">
                          <span className="font-semibold text-indigo-700">{shop?.name || 'Barbería no disponible'}</span> — <span className="text-slate-600">{service?.name || 'Servicio no disponible'}</span>
                        </div>
                        <div className="text-slate-600 text-sm mb-1">
                          <i className="fa-solid fa-user-tie mr-1 text-indigo-400"></i> {barber?.name || 'Barbero no disponible'}
                        </div>
                        <div className="text-slate-600 text-sm mb-1">
                          <i className="fa-solid fa-calendar mr-1 text-indigo-400"></i> {appt.startTime ? new Date(appt.startTime).toLocaleString() : 'Fecha no disponible'}
                        </div>
                        <div className="text-slate-600 text-sm mb-1">
                          <i className="fa-solid fa-money-bill-wave mr-1 text-green-500"></i> {appt.priceAtBooking ? `RD$${appt.priceAtBooking}` : 'Precio no disponible'}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Estado: {appt.status === 'completed' ? 'Completada' : appt.status === 'cancelled' ? 'Cancelada' : 'Confirmada'}</div>
                      </div>
                      {appt.status === 'confirmed' && (
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow text-sm"
                          onClick={() => handleCancel(appt.id)}
                          disabled={cancelling && cancellingId === appt.id}
                        >
                          {cancelling && cancellingId === appt.id ? (
                            <span className="flex items-center justify-center">
                              <span className="inline-block animate-spin mr-2 h-4 w-4 text-white">
                                ⟳
                              </span>
                              Cancelando...
                            </span>
                          ) : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  );
                } catch (err) {
                  console.error('Error renderizando cita', idx, appt, err);
                  return (
                    <div key={appt.id || idx} className="bg-red-100 text-red-700 p-4 rounded">
                      Error mostrando cita (ver consola para detalles).
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error interno en ClientAppointments:', error, JSON.stringify(error));
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-xl shadow text-center text-red-600">
          <h2 className="text-2xl font-bold mb-2">Error interno</h2>
          <p>No se pudo mostrar tus citas por un error inesperado.</p>
          <p className="mt-2 text-xs text-red-400">{error && (error.message || JSON.stringify(error))}</p>
          {onBack && (
            <button
              className="mt-6 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg shadow text-sm font-semibold"
              onClick={onBack}
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>Volver
            </button>
          )}
        </div>
      </div>
    );
  }
};

export default ClientAppointments;
