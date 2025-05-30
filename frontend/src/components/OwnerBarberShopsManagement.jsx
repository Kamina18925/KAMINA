import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import BarberShopInfoView from './BarberShopInfoView';
import Modal from './ui/Modal';

const OwnerBarberShopsManagement = () => {
  const { state, dispatch } = useContext(AppContext);
  const owner = state.currentUser;
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showBarberAssign, setShowBarberAssign] = useState(null); // shopId o null
  const [selectedShop, setSelectedShop] = useState(null);
  const [form, setForm] = useState({ 
    name: '', 
    address: '', 
    city: '', 
    phone: '',
    email: '',
    openHours: '',
    description: '',
    instagram: '',
    facebook: ''
  });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedBarbers, setSelectedBarbers] = useState([]);
  
  // Estado para el manejo de fotos
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPhotoURL, setCoverPhotoURL] = useState('');

  // Filtrar barberías del propietario con búsqueda y filtros
  const filterShops = () => {
    let shops = (state.barberShops || []).filter(s => s.ownerId === owner?.id);
    
    // Aplicar búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      shops = shops.filter(shop => 
        shop.name?.toLowerCase().includes(search) ||
        shop.city?.toLowerCase().includes(search) ||
        shop.address?.toLowerCase().includes(search)
      );
    }
    
    // Aplicar filtro por ciudad si no es 'all'
    if (filter !== 'all') {
      shops = shops.filter(shop => shop.city === filter);
    }
    
    return shops;
  };
  
  const myShops = filterShops();
  
  // Obtener todas las ciudades para el filtro
  const cities = [...new Set((state.barberShops || [])
    .filter(s => s.ownerId === owner?.id)
    .map(shop => shop.city)
    .filter(Boolean))];

  // Handlers
  const handleOpenAdd = () => {
    setForm({ 
      name: '', 
      address: '', 
      city: '', 
      phone: '',
      email: '',
      openHours: '',
      description: '',
      instagram: '',
      facebook: ''
    });
    setError('');
    setCoverPhoto(null);
    setCoverPhotoURL('');
    setShowAdd(true);
  };
  
  const handleOpenEdit = (shop) => {
    setForm({ 
      name: shop.name || '', 
      address: shop.address || '', 
      city: shop.city || '', 
      phone: shop.phone || '',
      email: shop.email || '',
      openHours: shop.openHours || '',
      description: shop.description || '',
      instagram: shop.instagram || '',
      facebook: shop.facebook || ''
    });
    setSelectedShop(shop);
    setError('');
    
    // Si la barbería tiene una foto de portada, la mostramos
    if (state.barberShopPhotos?.[shop.id]?.[0]) {
      setCoverPhotoURL(state.barberShopPhotos[shop.id][0]);
    } else {
      setCoverPhotoURL('');
    }
    setCoverPhoto(null); // Reiniciamos la foto para que no se envíe una nueva si el usuario no cambia nada
    
    setShowEdit(true);
  };
  
  // Manejador para cuando el usuario selecciona una foto
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('El archivo seleccionado debe ser una imagen (JPG, PNG, etc.)');
      return;
    }
    
    // Validar tamaño máximo (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen debe ser menor a 10MB');
      return;
    }
    
    setCoverPhoto(file);
    
    // Crear una URL temporal para mostrar la vista previa
    const objectUrl = URL.createObjectURL(file);
    setCoverPhotoURL(objectUrl);
    
    // Limpiar mensaje de error si hay alguno
    if (error) setError('');
    
    console.log('Archivo seleccionado correctamente:', file.name);
  };
  const handleCloseModal = () => {
    setShowAdd(false);
    setShowEdit(false);
    setSelectedShop(null);
    setError('');
  };
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  // Función para simular la subida de una imagen (versión para desarrollo)
  const uploadImage = async (file) => {
    try {
      setUploading(true);
      setError('');
      
      // Validar el archivo
      if (!file || !file.type || !file.type.startsWith('image/')) {
        throw new Error('Tipo de archivo no válido. Solo se permiten imágenes.');
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen es demasiado grande. Máximo 5MB.');
      }
      
      console.log('Procesando imagen:', {
        nombre: file.name,
        tamaño: Math.round(file.size / 1024) + 'KB',
        tipo: file.type
      });
      
      // Simular un pequeño retraso como en una carga real
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Crear una URL local para la imagen usando FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          const imageUrl = e.target.result;
          console.log('Imagen procesada correctamente');
          resolve({
            url: imageUrl,
            filename: file.name
          });
        };
        
        reader.onerror = function(error) {
          console.error('Error al procesar la imagen:', error);
          reject(new Error('Error al procesar la imagen'));
        };
        
        // Leer el archivo como una URL de datos
        reader.readAsDataURL(file);
      });
    } catch (err) {
      // Manejar cualquier error
      console.error('ERROR COMPLETO:', err);
      setError(err.message || 'Error al subir la imagen');
      return null;
    }
  };
  // Función handleDelete mejorada
const handleDelete = (shopId) => {
    if (confirm(`¿Está seguro que desea eliminar esta barbería?`)) {
      console.log('Ejecutando eliminación:', shopId);
      
      try {
        // Dispatch para eliminar la barbería
        dispatch({ 
          type: 'DELETE_BARBERSHOP', 
          payload: { id: shopId } 
        });
  
        // Actualizar la UI
        if (selectedShop && selectedShop.id === shopId) {
          setSelectedShop(null);
        }
        
        alert('Barbería eliminada correctamente');
      } catch (e) {
        console.error('Error al eliminar:', e);
        alert('Error al eliminar la barbería');
      }
    }
  };

  // Manejo de asignación de barberos
  const handleOpenBarberAssign = (shop) => {
    setShowBarberAssign(shop.id);
    // Inicializar los barberos ya asignados a esta barbería
    const assignedBarberIds = state.users
      .filter(u => u.role === 'barber' && (u.shopId === shop.id || (shop.barberIds || []).includes(u.id)))
      .map(b => b.id);
    setSelectedBarbers(assignedBarberIds);
  };
  
  const handleBarberSelection = (barberId) => {
    setSelectedBarbers(prev => {
      if (prev.includes(barberId)) {
        return prev.filter(id => id !== barberId);
      } else {
        return [...prev, barberId];
      }
    });
  };
  
  const handleSaveBarberAssignments = () => {
    if (!showBarberAssign) return;
    
    // Obtener la barbería actual
    const shop = state.barberShops.find(s => s.id === showBarberAssign);
    if (!shop) return;
    
    // Actualizar la barbería con los nuevos barberos asignados
    dispatch({
      type: 'EDIT_BARBERSHOP',
      payload: {
        ...shop,
        barberIds: selectedBarbers
      }
    });
    
    // Asignar/desasignar barberos a la barbería
    selectedBarbers.forEach(barberId => {
      dispatch({
        type: 'UPDATE_USER',
        payload: {
          id: barberId,
          shopId: shop.id
        }
      });
    });
    
    // Eliminar asignación para barberos no seleccionados que estaban asignados
    state.users
      .filter(u => u.role === 'barber' && u.shopId === shop.id && !selectedBarbers.includes(u.id))
      .forEach(barber => {
        dispatch({
          type: 'UPDATE_USER',
          payload: {
            id: barber.id,
            shopId: null
          }
        });
      });
      
    dispatch({
      type: 'SHOW_NOTIFICATION',
      payload: {
        message: 'Barberos asignados correctamente',
        type: 'success'
      }
    });
    
    setShowBarberAssign(null);
  };

  // Mostrar mensaje de carga si está subiendo
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validaciones básicas
    if (!form.name?.trim()) return setError('El nombre es obligatorio');
    if (!form.address?.trim()) return setError('La dirección es obligatoria');
    if (!form.city?.trim()) return setError('La ciudad es obligatoria');
    
    try {
      console.log('Iniciando envío del formulario...');
      
      // Determinar si estamos creando o editando
      const isCreating = !selectedShop;
      const shopId = selectedShop ? selectedShop.id : 'shop' + Date.now().toString();
      
      // Preparar los datos a enviar
      const shopData = {
        ...form,
        id: shopId,
        ownerId: owner.id
      };
      
      // Subir imagen primero si hay una nueva seleccionada
      let photoUrl = '';
      if (coverPhoto) {
        setError('');
        console.log('Subiendo imagen...');
        
        // Crear y enviar el FormData directamente
        const formData = new FormData();
        formData.append('image', coverPhoto);
        
        try {
          // Usamos la ruta relativa como estaba originalmente
          const imgResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          
          if (imgResponse.ok) {
            const imgData = await imgResponse.json();
            photoUrl = imgData.url;
            console.log('Imagen subida con éxito:', photoUrl);
          } else {
            console.error('Error al subir imagen:', imgResponse.status);
            return setError('Error al subir la imagen. Intenta nuevamente.');
          }
        } catch (imgErr) {
          console.error('Error en carga de imagen:', imgErr);
          return setError('Error al subir la imagen. Intenta nuevamente.');
        }
      } else if (coverPhotoURL && !coverPhoto) {
        // Si hay una URL pero no hay archivo nuevo, usar la URL existente
        photoUrl = coverPhotoURL;
      }
      
      // Actualizar el estado con la nueva/actualizada barbería
      if (isCreating) {
        // Añadir nueva barbería
        dispatch({ 
          type: 'ADD_BARBERSHOP', 
          payload: shopData
        });
        
        // Mostrar notificación de éxito
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            message: 'Barbería añadida correctamente',
            type: 'success'
          }
        });
      } else {
        // Actualizar barbería existente
        dispatch({ 
          type: 'EDIT_BARBERSHOP', 
          payload: shopData
        });
        
        // Mostrar notificación de éxito
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            message: 'Barbería actualizada correctamente',
            type: 'success'
          }
        });
      }
      
      // Si hay una foto, actualizar también las fotos de la barbería
      if (photoUrl) {
        dispatch({
          type: 'UPDATE_BARBERSHOP_PHOTO',
          payload: {
            shopId: shopId,
            photoUrl: photoUrl
          }
        });
      }
      
      // Limpiar las URLs temporales
      if (coverPhotoURL && coverPhoto) {
        URL.revokeObjectURL(coverPhotoURL);
      }
      
      // Cerrar modal y reiniciar estado
      handleCloseModal();
      
    } catch (err) {
      console.error('Error en formulario:', err);
      setError(err.message || 'Ocurrió un error inesperado');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Mis Barberías</h2>
        <button 
          className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded shadow text-sm font-semibold flex items-center" 
          onClick={handleOpenAdd}
          data-action="add"
          data-component-name="OwnerBarberShopsManagement"
        >
          <i className="fas fa-plus-circle mr-2"></i>Añadir Barbería
        </button>
      </div>
      
      {/* Búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o dirección..."
              className="w-full p-2 pl-10 border border-slate-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <select 
            className="w-full p-2 border border-slate-300 rounded-md bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas las ciudades</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {myShops.map(shop => (
          <div key={shop.id} className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
            {/* Cabecera con imagen */}
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
              {/* Si hay foto de portada, mostrarla */}
              {state.barberShopPhotos?.[shop.id]?.[0] && (
                <img 
                  src={state.barberShopPhotos[shop.id][0]} 
                  alt={shop.name} 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <h3 className="font-bold text-xl text-white text-center px-4 drop-shadow-md">{shop.name}</h3>
              </div>
            </div>
            
            {/* Contenido */}
            <div className="p-5 flex-grow flex flex-col">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 mr-2">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div>
                  <div className="text-slate-800 font-medium">{shop.city}</div>
                  <div className="text-slate-500 text-sm">{shop.address}</div>
                </div>
              </div>
              
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-500 mr-2">
                  <i className="fas fa-phone-alt"></i>
                </div>
                <div>
                  <div className="text-slate-800 font-medium">{shop.phone}</div>
                  <div className="text-slate-500 text-sm">{shop.email || 'Sin email'}</div>
                </div>
              </div>
              
              {shop.openHours && (
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 text-amber-500 mr-2">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="text-slate-700">{shop.openHours}</div>
                </div>
              )}
              
              {/* Redes sociales */}
              {(shop.instagram || shop.facebook) && (
                <div className="flex gap-2 mb-3">
                  {shop.instagram && (
                    <a href={`https://instagram.com/${shop.instagram}`} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600">
                      <i className="fab fa-instagram text-lg"></i>
                    </a>
                  )}
                  {shop.facebook && (
                    <a href={`https://facebook.com/${shop.facebook}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                      <i className="fab fa-facebook-square text-lg"></i>
                    </a>
                  )}
                </div>
              )}
              
              {/* Si hay descripción, mostrarla */}
              {shop.description && (
                <div className="text-slate-600 text-sm mt-2 mb-4 line-clamp-2">
                  {shop.description}
                </div>
              )}
              
              {/* Estadísticas */}
              <div className="flex text-xs text-slate-500 mt-auto mb-4 space-x-4">
                <div>
                  <i className="fas fa-user-tie mr-1"></i>
                  {(state.users.filter(u => u.role === 'barber' && (u.shopId === shop.id || (shop.barberIds || []).includes(u.id))).length || 0)} barberos
                </div>
                <div>
                  <i className="fas fa-calendar-check mr-1"></i>
                  {state.appointments.filter(a => a.shopId === shop.id).length || 0} citas
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded shadow-sm text-xs font-semibold flex items-center justify-center" onClick={() => handleOpenEdit(shop)}>
                  <i className="fas fa-edit mr-1"></i>Editar
                </button>
                <a
                  href="#"
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded shadow-sm text-xs font-semibold flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(shop.id);
                    return false;
                  }}
                  data-action="delete"
                  data-component-name="OwnerBarberShopsManagement"
                >
                  <i className="fas fa-trash-alt mr-1"></i>Eliminar
                </a>
                <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded shadow-sm text-xs font-semibold flex items-center justify-center" onClick={() => handleOpenBarberAssign(shop)}>
                  <i className="fas fa-user-plus mr-1"></i>Asignar Barberos
                </button>
                <button className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded shadow-sm text-xs font-semibold flex items-center justify-center" onClick={() => setSelectedShop(shop)}>
                  <i className="fas fa-eye mr-1"></i>Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {myShops.length === 0 && (
        <div className="text-center text-slate-500 py-12">No tienes barberías registradas.</div>
      )}
      {/* Modal para añadir/editar barbería */}
      {(showAdd || showEdit) && (
        <Modal isOpen={showAdd || showEdit} onClose={handleCloseModal} title={showAdd ? 'Añadir Barbería' : 'Editar Barbería'} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de foto de portada */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Foto de Portada</label>
              <div className="flex flex-col items-center space-y-3">
                {/* Vista previa de la imagen */}
                <div className="w-full h-32 bg-slate-100 rounded-lg overflow-hidden relative flex items-center justify-center">
                  {coverPhotoURL ? (
                    <>
                      <img 
                        src={coverPhotoURL} 
                        alt="Vista previa" 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        type="button" 
                        className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-600"
                        onClick={() => {
                          if (coverPhotoURL) URL.revokeObjectURL(coverPhotoURL);
                          setCoverPhotoURL('');
                          setCoverPhoto(null);
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </>
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <i className="fas fa-image text-3xl mb-1"></i>
                      <span className="text-sm">Sin imagen de portada</span>
                    </div>
                  )}
                </div>
                
                {/* Botón para seleccionar archivo */}
                <div className="flex w-full justify-center">
                  <label className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer flex items-center">
                    <i className="fas fa-upload mr-2"></i>
                    {coverPhotoURL ? 'Cambiar imagen' : 'Subir imagen'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                
                <p className="text-xs text-slate-500 text-center">
                  Formatos recomendados: JPG, PNG. Tamaño máximo: 10MB.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Nombre de la barbería" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Teléfono *</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full p-2 border rounded" placeholder="809-555-1234" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full p-2 border rounded" placeholder="barberia@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Horario</label>
                <input type="text" name="openHours" value={form.openHours} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Lun-Sab: 9am-7pm" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Dirección *</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Calle Principal #123" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Ciudad *</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Santo Domingo" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Sector</label>
                <input type="text" name="sector" value={form.sector || ''} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Piantini" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Descripción</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="w-full p-2 border rounded" rows="3" placeholder="Breve descripción de la barbería..."></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Instagram</label>
                <div className="flex items-center">
                  <span className="bg-slate-100 p-2 border border-r-0 rounded-l-md text-slate-500">@</span>
                  <input type="text" name="instagram" value={form.instagram} onChange={handleChange} className="w-full p-2 border rounded-r-md" placeholder="barberia_rd" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Facebook</label>
                <div className="flex items-center">
                  <span className="bg-slate-100 p-2 border border-r-0 rounded-l-md text-slate-500">facebook.com/</span>
                  <input type="text" name="facebook" value={form.facebook} onChange={handleChange} className="w-full p-2 border rounded-r-md" placeholder="barberiard" />
                </div>
              </div>
            </div>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mt-2">{error}</div>}
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded" onClick={handleCloseModal}>Cancelar</button>
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold">{showAdd ? 'Añadir' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
      {/* Modal para ver detalles */}
      {selectedShop && !showEdit && !showAdd && (
        <Modal isOpen={!!selectedShop} onClose={() => setSelectedShop(null)} title="Detalles de la Barbería" size="md">
          <BarberShopInfoView shop={selectedShop} />
        </Modal>
      )}
      
      {/* Modal para asignar barberos */}
      {showBarberAssign && (
        <Modal isOpen={!!showBarberAssign} onClose={() => setShowBarberAssign(null)} title="Asignar Barberos a la Barbería" size="md">
          <div className="p-1">
            <p className="text-slate-600 mb-4">
              Selecciona los barberos que trabajarán en esta barbería. Puedes seleccionar o deseleccionar haciendo clic en cada barbero.
            </p>
            
            {/* Lista de barberos disponibles */}
            <div className="max-h-60 overflow-y-auto mb-4 border rounded-lg">
              {state.users.filter(u => u.role === 'barber').length > 0 ? (
                <div className="divide-y">
                  {state.users
                    .filter(u => u.role === 'barber')
                    .map(barber => (
                      <div 
                        key={barber.id} 
                        className={`flex items-center p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedBarbers.includes(barber.id) ? 'bg-indigo-50' : ''}`}
                        onClick={() => handleBarberSelection(barber.id)}
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                          {barber.avatar ? 
                            <img src={barber.avatar} alt={barber.name} className="w-full h-full rounded-full object-cover" /> : 
                            <i className="fas fa-user text-indigo-400"></i>
                          }
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium text-slate-800">{barber.name}</div>
                          <div className="text-xs text-slate-500">{barber.email || 'Sin email'}</div>
                        </div>
                        <div>
                          {selectedBarbers.includes(barber.id) ? (
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs flex items-center">
                              <i className="fas fa-check mr-1"></i> Seleccionado
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs">
                              Disponible
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <p className="text-center p-4 text-slate-500">No hay barberos disponibles para asignar.</p>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-500">
                <span className="font-medium">{selectedBarbers.length}</span> barberos seleccionados
              </div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300" 
                  onClick={() => setShowBarberAssign(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  onClick={handleSaveBarberAssignments}
                >
                  Guardar Asignaciones
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OwnerBarberShopsManagement;
