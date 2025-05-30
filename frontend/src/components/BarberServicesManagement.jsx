import React, { useContext, useState } from 'react';
import { AppContext } from '../App';

const BarberServicesManagement = ({ barber, shop }) => {
  const { state, dispatch } = useContext(AppContext);
  const [showAdd, setShowAdd] = useState(false);
  // Aquí deberías filtrar los servicios personalizados de este barbero
  const barberServices = (state.barberServices[barber?.id] || []).map(sid => state.services.find(s => s.id === sid)).filter(Boolean);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-indigo-700">Mis Servicios</h2>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow" onClick={() => setShowAdd(true)}>
          <i className="fas fa-plus-circle mr-2"></i>Nuevo Servicio
        </button>
      </div>
      {barberServices.length > 0 ? (
        <div className="space-y-4">
          {barberServices.map(service => (
            <div key={service.id} className="p-4 border-l-4 border-indigo-400 bg-white rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="font-semibold text-indigo-700 text-lg flex items-center">
                  <i className="fas fa-cut mr-2 text-indigo-400"></i>{service.name}
                </div>
                <div className="text-slate-600 text-sm">RD${service.price} • {service.duration} min</div>
                {service.description && <div className="text-slate-400 text-xs mt-1">{service.description}</div>}
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded shadow text-xs font-semibold flex items-center"><i className="fas fa-edit mr-1"></i>Editar</button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow text-xs font-semibold flex items-center"><i className="fas fa-trash-alt mr-1"></i>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No tienes servicios personalizados.</p>
      )}
      {/* Modal o formulario para añadir servicio */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nuevo Servicio Personal</h3>
            <form onSubmit={e => {
              e.preventDefault();
              if (!form.name || !form.price || !form.duration) {
                setError('Todos los campos obligatorios.');
                return;
              }
              dispatch({
                type: 'ADD_SERVICE',
                payload: {
                  serviceData: {
                    name: form.name,
                    price: Number(form.price),
                    duration: Number(form.duration),
                    description: form.description
                  },
                  barberId: barber?.id,
                  shopId: shop?.id
                }
              });
              setShowAdd(false);
              setForm({ name: '', price: '', duration: '', description: '' });
              setError('');
            }} className="space-y-3">
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Nombre del servicio"
                value={form?.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                type="number"
                className="w-full border p-2 rounded"
                placeholder="Precio"
                value={form?.price || ''}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                required
              />
              <input
                type="number"
                className="w-full border p-2 rounded"
                placeholder="Duración (min)"
                value={form?.duration || ''}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                required
              />
              <textarea
                className="w-full border p-2 rounded"
                placeholder="Descripción"
                value={form?.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex gap-2 justify-end">
                <button type="button" className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded" onClick={() => { setShowAdd(false); setError(''); }}>Cancelar</button>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarberServicesManagement;
