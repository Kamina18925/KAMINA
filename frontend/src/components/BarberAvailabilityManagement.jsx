import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';

const days = [
  { key: 'L', name: 'Lunes' },
  { key: 'M', name: 'Martes' },
  { key: 'X', name: 'Miércoles' },
  { key: 'J', name: 'Jueves' },
  { key: 'V', name: 'Viernes' },
  { key: 'S', name: 'Sábado' },
  { key: 'D', name: 'Domingo' },
];

const BarberAvailabilityManagement = ({ barberId }) => {
  const { state, dispatch } = useContext(AppContext);
  const barberCurrentAvailability = Array.isArray(state.barberAvailability[barberId]) ? state.barberAvailability[barberId] : [];
  const [localAvailability, setLocalAvailability] = useState(
    JSON.parse(JSON.stringify(barberCurrentAvailability))
  );

  useEffect(() => {
    const globalAvailability = Array.isArray(state.barberAvailability[barberId]) ? state.barberAvailability[barberId] : [];
    if (JSON.stringify(globalAvailability) !== JSON.stringify(localAvailability)) {
      setLocalAvailability(JSON.parse(JSON.stringify(globalAvailability)));
    }
  }, [state.barberAvailability, barberId]);

  const handleTimeChange = (dayKey, field, value) => {
    setLocalAvailability(prev => {
      const dayIndex = prev.findIndex(d => d.day === dayKey);
      let newAvailability;
      if (dayIndex > -1) {
        const updatedDay = { ...prev[dayIndex], [field]: value };
        if (field === 'startTime' && updatedDay.endTime && value >= updatedDay.endTime) {
          dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: `En ${days.find(d => d.key === dayKey).name}, la hora de inicio debe ser anterior a la hora de fin.`, type: 'error' } });
          return prev;
        }
        if (field === 'endTime' && updatedDay.startTime && value <= updatedDay.startTime) {
          dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: `En ${days.find(d => d.key === dayKey).name}, la hora de fin debe ser posterior a la hora de inicio.`, type: 'error' } });
          return prev;
        }
        newAvailability = [...prev];
        newAvailability[dayIndex] = updatedDay;
      } else {
        return prev;
      }
      return newAvailability.sort((a, b) => days.findIndex(d => d.key === a.day) - days.findIndex(d => d.key === b.day));
    });
  };

  const handleToggleDay = (dayKey) => {
    setLocalAvailability(prev => {
      const dayExists = prev.some(d => d.day === dayKey);
      let newAvailability;
      if (dayExists) {
        newAvailability = prev.filter(d => d.day !== dayKey);
      } else {
        newAvailability = [...prev, { day: dayKey, startTime: '09:00', endTime: '17:00' }];
      }
      return newAvailability.sort((a, b) => days.findIndex(d => d.key === a.day) - days.findIndex(d => d.key === b.day));
    });
  };

  const handleSaveChanges = () => {
    for (const item of localAvailability) {
      if (!item.startTime || !item.endTime) {
        dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: `Por favor, define ambas horas para ${days.find(d => d.key === item.day).name} o márcalo como día libre.`, type: 'error' } });
        return;
      }
      if (item.startTime >= item.endTime) {
        dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: `En ${days.find(d => d.key === item.day).name}, la hora de inicio debe ser anterior a la hora de fin.`, type: 'error' } });
        return;
      }
    }
    dispatch({ type: 'UPDATE_BARBER_AVAILABILITY', payload: { barberId, availability: localAvailability } });
    dispatch({ type: 'SHOW_NOTIFICATION', payload: { message: 'Disponibilidad actualizada con éxito.', type: 'success' } });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
      <h3 className="text-xl md:text-2xl font-bold text-indigo-700 mb-6 flex items-center"><i className="fas fa-user-clock mr-2"></i>Mi Disponibilidad</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-200 rounded-lg bg-slate-50">
          <thead>
            <tr className="bg-indigo-100 text-indigo-700">
              <th className="py-2 px-3 text-left font-semibold">Día</th>
              <th className="py-2 px-3 text-left font-semibold">¿Trabaja?</th>
              <th className="py-2 px-3 text-left font-semibold">Desde</th>
              <th className="py-2 px-3 text-left font-semibold">Hasta</th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => {
              const dayData = localAvailability.find(d => d.day === day.key);
              const isWorking = !!dayData;
              return (
                <tr key={day.key} className={isWorking ? 'bg-white' : 'bg-slate-100'}>
                  <td className="py-2 px-3 font-medium text-slate-700">{day.name}</td>
                  <td className="py-2 px-3">
                    <input
                      type="checkbox"
                      checked={isWorking}
                      onChange={() => handleToggleDay(day.key)}
                      className="form-checkbox h-5 w-5 text-indigo-600"
                    />
                  </td>
                  <td className="py-2 px-3">
                    {isWorking && (
                      <input
                        type="time"
                        value={dayData.startTime}
                        onChange={e => handleTimeChange(day.key, 'startTime', e.target.value)}
                        className="p-1 border border-slate-300 rounded-md text-sm w-28"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {isWorking && (
                      <input
                        type="time"
                        value={dayData.endTime}
                        onChange={e => handleTimeChange(day.key, 'endTime', e.target.value)}
                        className="p-1 border border-slate-300 rounded-md text-sm w-28"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pt-5 flex justify-end space-x-3">
        <button type="button" className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 shadow-sm transition-colors" onClick={() => setLocalAvailability(barberCurrentAvailability)}>Cancelar</button>
        <button type="button" className="flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={handleSaveChanges}>
          <i className="fas fa-save mr-2"></i> Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default BarberAvailabilityManagement;
