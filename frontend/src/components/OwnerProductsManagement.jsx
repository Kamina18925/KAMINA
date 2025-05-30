import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { useDropzone } from 'react-dropzone';

// Componente especializado para drag-and-drop de imágenes usando react-dropzone
const ImageDropzone = ({ onImageSelected, setError }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 5 * 1024 * 1024,
    onDropAccepted: (files) => {
      onImageSelected(files[0]);
    },
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('La imagen debe ser menor a 5MB');
      } else {
        setError('Solo se permiten archivos de imagen (JPEG, JPG, PNG)');
      }
    }
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-4 transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'}`}
    >
      <input {...getInputProps()} />
      <div className="text-center py-4">
        <i className="fas fa-cloud-upload-alt text-3xl text-slate-400 mb-2"></i>
        <p className="text-sm text-slate-500">
          {isDragActive 
            ? 'Suelta la imagen aquí...'
            : 'Arrastra y suelta tu imagen aquí o haz clic para seleccionar'}
        </p>
        <p className="text-xs text-slate-400 mt-1">PNG, JPG o JPEG (máx. 5MB)</p>
      </div>
    </div>
  );
};

const OwnerProductsManagement = ({ shop }) => {
  const { state, dispatch } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'shop', 'barbers'

  // Limpiar imagen y form al cerrar el modal de añadir producto
  React.useEffect(() => {
    if (!showAdd) {
      setPreview('');
      setForm(f => ({ ...f, photoUrl: '' }));
      setError('');
    }
  }, [showAdd]);
  
  const [showEdit, setShowEdit] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [form, setForm] = useState({ name: '', price: '', stock: '', category: '', photoUrl: '', offer: '', description: '' });
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Función para manejar la subida de imágenes (versión simulada para desarrollo)
  const handleImageUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }
    try {
      setUploading(true);
      setError('');
      
      // Simular un pequeño retraso como en una carga real
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Crear una URL local para la imagen usando FileReader
      const reader = new FileReader();
      
      reader.onload = function(e) {
        if (isMounted.current) {
          const imageUrl = e.target.result;
          setForm(f => ({ ...f, photoUrl: imageUrl }));
          setPreview(imageUrl);
          setUploading(false);
        }
      };
      
      reader.onerror = function() {
        if (isMounted.current) {
          setError('Error al procesar la imagen');
          setUploading(false);
        }
      };
      
      // Leer el archivo como una URL de datos
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error procesando imagen:', error);
      if (isMounted.current) {
        setError('Error al procesar la imagen: ' + (error.message || 'Error desconocido'));
        setUploading(false);
      }
    }
  };

  // Eliminar imagen con protección mejorada
  const handleRemoveImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Usar setTimeout para diferir la eliminación hasta después del ciclo de renderizado actual
    setTimeout(() => {
      if (isMounted.current) {
        setPreview('');
        setForm(f => ({ ...f, photoUrl: '' }));
      }
    }, 0);
  };

  // Obtener todos los barberos de la barbería
  const barbers = state.users.filter(user => 
    user.role === 'barber' && user.shopId === shop?.id
  );

  // Filtrar productos según el tipo seleccionado y término de búsqueda
  const products = (state.products || []).filter(p => {
    // Filtrar por barbería
    if (p.shopId !== shop?.id) return false;
    
    // Filtrar por tipo (todos, solo tienda, solo barberos)
    if (filterType === 'shop' && p.barberId) return false;
    if (filterType === 'barbers' && !p.barberId) return false;
    
    // Filtrar por término de búsqueda
    return (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
           (p.category || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Productos de {shop?.name}</h2>
        <button className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded shadow text-sm font-semibold flex items-center" onClick={() => setShowAdd(true)}>
          <i className="fas fa-plus-circle mr-2"></i>Añadir Producto
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Buscar productos por nombre o categoría..."
            className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilterType('all')} 
            className={`px-3 py-2 rounded text-sm font-medium ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterType('shop')} 
            className={`px-3 py-2 rounded text-sm font-medium ${filterType === 'shop' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            De la Tienda
          </button>
          <button 
            onClick={() => setFilterType('barbers')} 
            className={`px-3 py-2 rounded text-sm font-medium ${filterType === 'barbers' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            De Barberos
          </button>
        </div>
      </div>
      
      <div className="mb-4 text-sm text-slate-500">
        Mostrando {products.length} productos {filterType === 'all' ? 'en total' : filterType === 'shop' ? 'de la tienda' : 'de barberos'}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(prod => {
          // Encontrar el barbero que creó el producto (si existe)
          const barber = prod.barberId ? state.users.find(u => u.id === prod.barberId) : null;
          
          return (
            <div key={prod.id} className="bg-white rounded-lg shadow p-5 flex flex-col relative">
              {/* Etiqueta que indica si es producto de barbero o de tienda */}
              <div className={`absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-full ${barber ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                {barber ? 'Barbero' : 'Tienda'}
              </div>
              
              <img src={prod.photoUrl} alt={prod.name} className="w-full h-32 object-cover rounded mb-3" />
              <h3 className="font-semibold text-lg text-slate-800 mb-1">{prod.name}</h3>
              <div className="text-xs text-indigo-500 mb-1">{prod.category}</div>
              <div className="text-slate-700 text-sm mb-2">{prod.description}</div>
              {prod.offer && <div className="text-xs font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded inline-block mb-2">Oferta: {prod.offer}</div>}
              
              {/* Información del barbero si existe */}
              {barber && (
                <div className="flex items-center mb-2 bg-slate-50 p-2 rounded">
                  <i className="fas fa-user-tie text-purple-500 mr-2"></i>
                  <div>
                    <div className="text-xs font-medium text-slate-700">Creado por:</div>
                    <div className="text-sm text-purple-700">{barber.name}</div>
                  </div>
                </div>
              )}
              
              <div className="text-lg font-bold text-slate-800 mt-auto">RD${prod.price}</div>
              <div className="text-xs text-slate-500 mb-2">Stock: {prod.stock}</div>
              <div className="flex gap-2 mt-2">
              <button 
                onClick={() => {
                  setCurrentProduct(prod);
                  setShowSell(true);
                }}
                className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded shadow text-xs font-semibold flex-1"
                data-action="sell"
                data-component-name="OwnerProductsManagement"
              >
                <i className="fas fa-shopping-cart mr-1"></i>Vender
              </button>
              <button 
                onClick={() => {
                  setCurrentProduct(prod);
                  setForm({
                    name: prod.name || '',
                    price: prod.price || '',
                    stock: prod.stock || '',
                    category: prod.category || '',
                    photoUrl: prod.photoUrl || '',
                    offer: prod.offer || '',
                    description: prod.description || ''
                  });
                  setPreview(prod.photoUrl || '');
                  setShowEdit(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded shadow text-xs font-semibold flex-1"
              >
                <i className="fas fa-edit mr-1"></i>Editar
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('¿Estás seguro que deseas eliminar este producto?')) {
                    dispatch({
                      type: 'DELETE_PRODUCT',
                      payload: { productId: prod.id }
                    });
                    
                    dispatch({ 
                      type: 'SHOW_NOTIFICATION', 
                      payload: { 
                        message: 'Producto eliminado correctamente', 
                        type: 'success' 
                      } 
                    });
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow text-xs font-semibold"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
          )
        })}
      </div>

      {/* Modal para vender producto */}
      {showSell && currentProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Vender {currentProduct.name}</h3>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Cantidad a vender</label>
              <div className="flex items-center">
                <button 
                  className="bg-gray-200 px-3 py-1 rounded-l" 
                  onClick={() => setSellQuantity(q => Math.max(1, q - 1))}
                >-</button>
                <input 
                  type="number" 
                  className="w-16 text-center border-t border-b" 
                  value={sellQuantity} 
                  onChange={e => setSellQuantity(Math.max(1, Math.min(currentProduct.stock, parseInt(e.target.value) || 1)))}
                  min="1" 
                  max={currentProduct.stock}
                />
                <button 
                  className="bg-gray-200 px-3 py-1 rounded-r" 
                  onClick={() => setSellQuantity(q => Math.min(currentProduct.stock, q + 1))}
                >+</button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Stock disponible: {currentProduct.stock}</p>
            </div>
            <div className="text-right font-bold text-lg mb-4">
              Total: RD${(currentProduct.price * sellQuantity).toFixed(2)}
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowSell(false);
                  setSellQuantity(1);
                  setCurrentProduct(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => {
                  // Verificar que hay suficiente stock
                  if (currentProduct.stock < sellQuantity) {
                    dispatch({ 
                      type: 'SHOW_NOTIFICATION', 
                      payload: { 
                        message: `No hay suficiente stock disponible.`, 
                        type: 'error' 
                      } 
                    });
                    return;
                  }
                  
                  // Registrar venta y actualizar stock usando el nuevo reducer
                  dispatch({
                    type: 'SELL_PRODUCT',
                    payload: {
                      productId: currentProduct.id,
                      quantity: sellQuantity,
                      barberId: currentProduct.barberId,
                      sellerId: shop?.ownerId, // El propietario es quien registra la venta
                    }
                  });
                  
                }}
                disabled={currentProduct.stock < 1}
              >
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar producto */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Editar Producto</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              if (!form.name || !form.price || !form.stock || !form.category) {
                setError('Todos los campos obligatorios son requeridos.');
                return;
              }
              
              setError('');
              
              // Actualizar producto
              dispatch({
                type: 'UPDATE_PRODUCT',
                payload: {
                  productId: currentProduct.id,
                  updates: {
                    name: form.name,
                    price: Number(form.price),
                    stock: Number(form.stock),
                    category: form.category,
                    photoUrl: form.photoUrl,
                    offer: form.offer,
                    description: form.description
                  }
                }
              });
              
              // Mostrar notificación
              dispatch({ 
                type: 'SHOW_NOTIFICATION', 
                payload: { 
                  message: 'Producto actualizado correctamente', 
                  type: 'success' 
                } 
              });
              
              // Cerrar modal
              setShowEdit(false);
              setCurrentProduct(null);
              setForm({ name: '', price: '', stock: '', category: '', photoUrl: '', offer: '', description: '' });
              setPreview('');
              setError('');
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto*</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded"
                    placeholder="Ej: Gel para cabello"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Precio (RD$)*</label>
                    <input 
                      type="number" 
                      className="w-full border p-2 rounded"
                      placeholder="Ej: 350"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock*</label>
                    <input 
                      type="number" 
                      className="w-full border p-2 rounded"
                      placeholder="Ej: 10"
                      value={form.stock}
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría*</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded"
                    placeholder="Ej: Geles, Aceites, Shampoo"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Oferta (opcional)</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded"
                    placeholder="Ej: 20% descuento"
                    value={form.offer}
                    onChange={e => setForm(f => ({ ...f, offer: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    className="w-full border p-2 rounded"
                    placeholder="Descripción"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Imagen del producto*</label>
                  <div className="w-full mb-2">
                    {preview ? (
                      <div className="preview-container bg-white p-4 border border-slate-200 rounded-lg">
                        <img 
                          src={preview} 
                          alt="Vista previa" 
                          className="w-full max-h-32 object-contain rounded mb-2" 
                          key={`img-${preview}`}
                        />
                        <p className="text-sm text-green-600 font-medium mb-1">¡Imagen cargada correctamente!</p>
                        <button 
                          type="button" 
                          className="text-xs text-red-500 hover:text-red-700"
                          onClick={handleRemoveImage}
                        >
                          Cambiar imagen
                        </button>
                      </div>
                    ) : (
                      <ImageDropzone onImageSelected={handleImageUpload} setError={setError} />
                    )}
                  </div>
                </div>
              </div>
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              <div className="flex gap-2 justify-end mt-4">
                <button 
                  type="button" 
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded" 
                  onClick={() => {
                    setShowEdit(false);
                    setCurrentProduct(null);
                    setForm({ name: '', price: '', stock: '', category: '', photoUrl: '', offer: '', description: '' });
                    setPreview('');
                    setError('');
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal para añadir producto */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Añadir Producto</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              if (!form.name || !form.price || !form.stock || !form.category) {
                setError('Todos los campos obligatorios.');
                return;
              }
              // Si no hay imagen subida, mostrar error
              if (!form.photoUrl) {
                setError('Debes subir una imagen de producto válida antes de guardar.');
                return;
              }
              setError('');
              dispatch({
                type: 'ADD_PRODUCT',
                payload: {
                  productData: {
                    name: form.name,
                    price: Number(form.price),
                    stock: Number(form.stock),
                    category: form.category,
                    photoUrl: form.photoUrl,
                    offer: form.offer,
                    description: form.description
                  },
                  ownerOrBarberId: shop?.ownerId,
                  shopId: shop?.id
                }
              });
              
              // Mostrar notificación
              dispatch({ 
                type: 'SHOW_NOTIFICATION', 
                payload: { 
                  message: 'Producto añadido correctamente', 
                  type: 'success' 
                } 
              });
              
              // Cerrar modal y resetear form
              setShowAdd(false);
              setForm({ name: '', price: '', stock: '', category: '', photoUrl: '', offer: '', description: '' });
              setPreview('');
              setError('');
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto*</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded"
                    placeholder="Ej: Gel para cabello"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Precio (RD$)*</label>
                    <input 
                      type="number" 
                      className="w-full border p-2 rounded"
                      placeholder="Ej: 350"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock*</label>
                    <input 
                      type="number" 
                      className="w-full border p-2 rounded"
                      placeholder="Ej: 10"
                      value={form.stock}
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría*</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded"
                    placeholder="Ej: Geles, Aceites, Shampoo"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Oferta (opcional)</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded"
                    placeholder="Ej: 20% descuento"
                    value={form.offer}
                    onChange={e => setForm(f => ({ ...f, offer: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    className="w-full border p-2 rounded"
                    placeholder="Descripción"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Imagen del producto*</label>
                  <div className="w-full mb-2">
                    {preview ? (
                      <div className="preview-container bg-white p-4 border border-slate-200 rounded-lg">
                        <img 
                          src={preview} 
                          alt="Vista previa" 
                          className="w-full max-h-32 object-contain rounded mb-2" 
                          key={`img-${preview}`}
                        />
                        <p className="text-sm text-green-600 font-medium mb-1">¡Imagen cargada correctamente!</p>
                        <button 
                          type="button" 
                          className="text-xs text-red-500 hover:text-red-700"
                          onClick={handleRemoveImage}
                        >
                          Cambiar imagen
                        </button>
                      </div>
                    ) : (
                      <ImageDropzone onImageSelected={handleImageUpload} setError={setError} />
                    )}
                  </div>
                </div>
              </div>
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              <div className="flex gap-2 justify-end mt-4">
                <button type="button" className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded" onClick={() => { setShowAdd(false); setError(''); }}>Cancelar</button>
                <button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subiendo...
                    </>
                  ) : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerProductsManagement;
