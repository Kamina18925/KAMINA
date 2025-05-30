import React, { useContext, useState } from 'react';
import { AppContext } from '../App';

const OwnerServicesManagement = () => {
  const { state, dispatch } = useContext(AppContext);
  const [showAddGeneral, setShowAddGeneral] = useState(false);
  const [showEditGeneral, setShowEditGeneral] = useState(null); // serviceId o null
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // serviceId o null
  const [showAddBarber, setShowAddBarber] = useState(null); // barberId o null
  const [formGeneral, setFormGeneral] = useState({ name: '', price: '', duration: '', description: '' });
  const [formBarber, setFormBarber] = useState({ name: '', price: '', duration: '', description: '' });
  const [formError, setFormError] = useState('');
  const [barberFormError, setBarberFormError] = useState('');
  
  // Verificar si hay múltiples propietarias (dueñas)
  const ownerUsers = Array.isArray(state.users) ? state.users.filter(u => u.role === 'owner') : [];
  const hasMultipleOwners = ownerUsers.length > 1;

  // Servicios generales (sin barberId)
  const generalServices = Array.isArray(state.services) ? state.services.filter(s => !s.barberId) : [];
  // Barberos de la barbería actual
  const barbers = Array.isArray(state.users) ? state.users.filter(u => u.role === 'barber') : [];

  // Función para gestionar propietarias (dueñas)
  const handleOwnerUsers = () => {
    if (hasMultipleOwners) {
      // Muestra diálogo de confirmación
      if (window.confirm('Hay múltiples propietarias en el sistema. ¿Deseas limitar a una sola propietaria?')) {
        // Obtener la propietaria más reciente
        const sortedOwners = [...ownerUsers].sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        
        // Mantener solo a la propietaria más reciente
        const ownerToKeep = sortedOwners[0];
        
        // Cambiar el rol de los demás propietarios a 'barber' (barbero)
        sortedOwners.slice(1).forEach(owner => {
          dispatch({
            type: 'UPDATE_USER',
            payload: {
              id: owner.id,
              role: 'barber'
            }
          });
        });
        
        // Mostrar notificación
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            message: `Sistema limitado a una sola propietaria: ${ownerToKeep.name}`,
            type: 'success'
          }
        });
      }
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Advertencia de múltiples propietarias */}
      {hasMultipleOwners && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-yellow-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Advertencia:</strong> Hay múltiples propietarias en el sistema. Se recomienda tener una sola propietaria (dueña).
              </p>
              <div className="mt-2">
                <button 
                  className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-1 px-2 rounded"
                  onClick={handleOwnerUsers}
                >
                  Limitar a una propietaria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Servicios Generales */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-indigo-700">Servicios Generales</h2>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow" onClick={() => {
            setShowAddGeneral(true);
            setFormGeneral({ name: '', price: '', duration: '', description: '' });
            setFormError('');
          }}>
            <i className="fas fa-plus-circle mr-2"></i>Nuevo Servicio General
          </button>
        </div>
        {generalServices.length > 0 ? (
          <ul className="divide-y divide-slate-200">
            {generalServices.map(service => (
              <li key={service.id} className="py-2 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-indigo-700">{service.name}</span> <span className="text-slate-500 text-sm">RD${service.price} • {service.duration} min</span>
                </div>
                <div>
                  <button 
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded text-xs mr-2" 
                    onClick={() => {
                      setShowEditGeneral(service.id);
                      setFormGeneral({
                        name: service.name,
                        price: service.price.toString(),
                        duration: service.duration.toString(),
                        description: service.description || ''
                      });
                      setFormError('');
                    }}
                  >
                    Editar
                  </button>
                  <button 
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    onClick={() => setShowDeleteConfirm(service.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">No hay servicios generales registrados.</p>
        )}
      </div>

      {/* Servicios por Barbero */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-indigo-700 mb-4">Servicios por Barbero</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {barbers.map(barber => (
            <div key={barber.id} className="border rounded-lg p-4 shadow flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-2">
                <img src={barber.photoUrl || 'https://placehold.co/48x48?text=Barbero'} alt={barber.name} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100" />
                <div>
                  <div className="font-semibold text-slate-800">{barber.name}</div>
                  <div className="text-xs text-slate-500">{barber.email}</div>
                </div>
              </div>
              <ul className="text-sm text-slate-700 mb-2">
                {(state.barberServices[barber.id] || []).map(sid => {
                  const service = state.services.find(s => s.id === sid);
                  return service ? (
                    <li key={service.id} className="flex justify-between items-center mb-1">
                      <span>{service.name} <span className="text-slate-400">({service.duration} min)</span></span>
                      <span className="text-xs text-slate-500">RD${service.price}</span>
                    </li>
                  ) : null;
                })}
                {(!state.barberServices[barber.id] || state.barberServices[barber.id].length === 0) && (
                  <li className="text-slate-400">Sin servicios asignados</li>
                )}
              </ul>
              <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs" onClick={() => {
                setShowAddBarber(barber.id);
                setFormBarber({ name: '', price: '', duration: '', description: '' });
                setBarberFormError('');
              }}>
                <i className="fas fa-plus mr-1"></i>Agregar Servicio Individual
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para eliminar servicio */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Confirmar eliminación</h3>
            <p className="text-slate-600 mb-4">
              ¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2">
              <button 
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => {
                  // Eliminar el servicio
                  dispatch({
                    type: 'DELETE_SERVICE',
                    payload: showDeleteConfirm
                  });
                  
                  // Mostrar notificación
                  dispatch({
                    type: 'SHOW_NOTIFICATION',
                    payload: {
                      message: 'Servicio eliminado correctamente',
                      type: 'success'
                    }
                  });
                  
                  // Cerrar el modal
                  setShowDeleteConfirm(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar servicio general */}
      {showEditGeneral && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Editar Servicio</h3>
            {formError && <div className="bg-red-50 text-red-500 p-2 rounded mb-3 text-sm">{formError}</div>}
            
            <form onSubmit={(e) => {
              e.preventDefault();
              
              // Validar campos
              if (!formGeneral.name || !formGeneral.price || !formGeneral.duration) {
                setFormError('Todos los campos marcados con * son obligatorios');
                return;
              }
              
              // Convertir precio y duración a números
              const price = parseFloat(formGeneral.price);
              const duration = parseInt(formGeneral.duration);
              
              // Validar que sean números válidos
              if (isNaN(price) || isNaN(duration) || price <= 0 || duration <= 0) {
                setFormError('El precio y la duración deben ser números positivos');
                return;
              }
              
              // Actualizar el servicio
              const updatedService = {
                id: showEditGeneral,
                name: formGeneral.name,
                price,
                duration,
                description: formGeneral.description || ''
              };
              
              // Dispatch para actualizar el servicio
              dispatch({
                type: 'UPDATE_SERVICE',
                payload: updatedService
              });
              
              // Mostrar notificación de éxito
              dispatch({
                type: 'SHOW_NOTIFICATION',
                payload: {
                  message: 'Servicio actualizado correctamente',
                  type: 'success'
                }
              });
              
              // Cerrar el modal
              setShowEditGeneral(null);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del servicio *</label>
                <input 
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded"
                  value={formGeneral.name}
                  onChange={(e) => setFormGeneral({...formGeneral, name: e.target.value})}
                  placeholder="Ej: Corte de cabello"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio (RD$) *</label>
                  <input 
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded"
                    value={formGeneral.price}
                    onChange={(e) => setFormGeneral({...formGeneral, price: e.target.value})}
                    placeholder="Ej: 350"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duración (min) *</label>
                  <input 
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded"
                    value={formGeneral.duration}
                    onChange={(e) => setFormGeneral({...formGeneral, duration: e.target.value})}
                    placeholder="Ej: 30"
                    min="5"
                    step="5"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
                <textarea 
                  className="w-full p-2 border border-slate-300 rounded"
                  value={formGeneral.description}
                  onChange={(e) => setFormGeneral({...formGeneral, description: e.target.value})}
                  placeholder="Descripción detallada del servicio..."
                  rows="3"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                  onClick={() => setShowEditGeneral(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                >
                  Actualizar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para añadir servicio general */}
      {showAddGeneral && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nuevo Servicio General</h3>
            {formError && <div className="bg-red-50 text-red-500 p-2 rounded mb-3 text-sm">{formError}</div>}
            
            <form onSubmit={(e) => {
              e.preventDefault();
              
              // Validar campos
              if (!formGeneral.name || !formGeneral.price || !formGeneral.duration) {
                setFormError('Todos los campos marcados con * son obligatorios');
                return;
              }
              
              // Convertir precio y duración a números
              const price = parseFloat(formGeneral.price);
              const duration = parseInt(formGeneral.duration);
              
              // Validar que sean números válidos
              if (isNaN(price) || isNaN(duration) || price <= 0 || duration <= 0) {
                setFormError('El precio y la duración deben ser números positivos');
                return;
              }
              
              // Crear el nuevo servicio
              const newService = {
                id: 'svc' + Date.now(), // Genera un ID único
                name: formGeneral.name,
                price,
                duration,
                description: formGeneral.description || ''
              };
              
              // Dispatch para añadir el servicio al estado global
              dispatch({
                type: 'ADD_SERVICE',
                payload: newService
              });
              
              // Mostrar notificación de éxito
              dispatch({
                type: 'SHOW_NOTIFICATION',
                payload: {
                  message: 'Servicio creado correctamente',
                  type: 'success'
                }
              });
              
              // Cerrar el modal
              setShowAddGeneral(false);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del servicio *</label>
                <input 
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded"
                  value={formGeneral.name}
                  onChange={(e) => setFormGeneral({...formGeneral, name: e.target.value})}
                  placeholder="Ej: Corte de cabello"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio (RD$) *</label>
                  <input 
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded"
                    value={formGeneral.price}
                    onChange={(e) => setFormGeneral({...formGeneral, price: e.target.value})}
                    placeholder="Ej: 350"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duración (min) *</label>
                  <input 
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded"
                    value={formGeneral.duration}
                    onChange={(e) => setFormGeneral({...formGeneral, duration: e.target.value})}
                    placeholder="Ej: 30"
                    min="5"
                    step="5"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
                <textarea 
                  className="w-full p-2 border border-slate-300 rounded"
                  value={formGeneral.description}
                  onChange={(e) => setFormGeneral({...formGeneral, description: e.target.value})}
                  placeholder="Descripción detallada del servicio..."
                  rows="3"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                  onClick={() => setShowAddGeneral(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para añadir servicio individual a un barbero */}
      {showAddBarber && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              Nuevo Servicio Individual
              <span className="block text-sm font-normal text-slate-500 mt-1">
                {state.users.find(u => u.id === showAddBarber)?.name || 'Barbero'}
              </span>
            </h3>
            {barberFormError && <div className="bg-red-50 text-red-500 p-2 rounded mb-3 text-sm">{barberFormError}</div>}
            
            <form onSubmit={(e) => {
              e.preventDefault();
              
              // Validar campos
              if (!formBarber.name || !formBarber.price || !formBarber.duration) {
                setBarberFormError('Todos los campos marcados con * son obligatorios');
                return;
              }
              
              // Convertir precio y duración a números
              const price = parseFloat(formBarber.price);
              const duration = parseInt(formBarber.duration);
              
              // Validar que sean números válidos
              if (isNaN(price) || isNaN(duration) || price <= 0 || duration <= 0) {
                setBarberFormError('El precio y la duración deben ser números positivos');
                return;
              }
              
              // Crear el nuevo servicio
              const serviceId = 'svc' + Date.now(); // Genera un ID único
              const newService = {
                id: serviceId,
                name: formBarber.name,
                price,
                duration,
                description: formBarber.description || '',
                barberId: showAddBarber
              };
              
              // Dispatch para añadir el servicio al estado global
              dispatch({
                type: 'ADD_SERVICE',
                payload: newService
              });
              
              // Dispatch para añadir el servicio a la lista de servicios del barbero
              dispatch({
                type: 'ADD_BARBER_SERVICE',
                payload: {
                  barberId: showAddBarber,
                  serviceId: serviceId
                }
              });
              
              // Mostrar notificación de éxito
              dispatch({
                type: 'SHOW_NOTIFICATION',
                payload: {
                  message: 'Servicio individual agregado correctamente',
                  type: 'success'
                }
              });
              
              // Cerrar el modal
              setShowAddBarber(null);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar servicio general *</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded mb-2"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const selectedService = generalServices.find(s => s.id === e.target.value);
                      if (selectedService) {
                        setFormBarber({
                          name: selectedService.name,
                          price: selectedService.price.toString(),
                          duration: selectedService.duration.toString(),
                          description: selectedService.description || ''
                        });
                      }
                    }
                  }}
                >
                  <option value="">-- Selecciona un servicio existente --</option>
                  {generalServices.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - RD${service.price} - {service.duration} min
                    </option>
                  ))}
                </select>
                
                <label className="block text-sm font-medium text-slate-700 mb-1 mt-4">Nombre del servicio *</label>
                <input 
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded"
                  value={formBarber.name}
                  onChange={(e) => setFormBarber({...formBarber, name: e.target.value})}
                  placeholder="Ej: Corte personalizado"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio (RD$) *</label>
                  <input 
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded"
                    value={formBarber.price}
                    onChange={(e) => setFormBarber({...formBarber, price: e.target.value})}
                    placeholder="Ej: 450"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duración (min) *</label>
                  <input 
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded"
                    value={formBarber.duration}
                    onChange={(e) => setFormBarber({...formBarber, duration: e.target.value})}
                    placeholder="Ej: 35"
                    min="5"
                    step="5"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
                <textarea 
                  className="w-full p-2 border border-slate-300 rounded"
                  value={formBarber.description}
                  onChange={(e) => setFormBarber({...formBarber, description: e.target.value})}
                  placeholder="Descripción detallada del servicio..."
                  rows="3"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                  onClick={() => setShowAddBarber(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerServicesManagement;
