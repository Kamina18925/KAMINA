import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../App';
import { useDropzone } from 'react-dropzone';
import Resizer from 'react-image-file-resizer';

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

const BarberProductsManagement = ({ user, shop }) => {
  const { state, dispatch } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    photoUrl: '',
    description: '',
    offer: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!showAdd) {
      setPreview('');
      setNewProduct(p => ({ ...p, photoUrl: '' }));
      setError('');
    }
  }, [showAdd]);

  // Filtrar productos del barbero y de la barbería
  const products = (state.products || []).filter(
    p => (shop ? p.shopId === shop.id : p.barberId === user?.id) && (!p.barberId || p.barberId === user?.id)
  ).sort((a, b) => {
    // Validar que ambos productos tengan nombres válidos antes de comparar
    const nameA = a?.name || '';
    const nameB = b?.name || '';
    return nameA.localeCompare(nameB);
  });

  // Función para procesar y redimensionar imágenes antes de subir
  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      try {
        // Verificar si el archivo es válido
        if (!file || typeof file !== 'object') {
          return reject(new Error('Archivo inválido'));
        }

        Resizer.imageFileResizer(
          file,
          800,           // max width
          800,           // max height
          'JPEG',        // format
          85,            // quality
          0,             // rotation
          (resizedFile) => {
            resolve(resizedFile);
          },
          'file',        // output type
          400,           // min width
          400,           // min height
          // Si falla el redimensionamiento, usamos el archivo original
          (error) => {
            console.warn('Error al redimensionar, usando archivo original:', error);
            resolve(file);
          }
        );
      } catch (error) {
        console.error('Error en el procesamiento de imagen:', error);
        reject(error);
      }
    });
  };

  // Función mejorada para manejar la subida de imágenes con validación completa (versión simulada para desarrollo)
  const handleImageUpload = async (file) => {
    // Validación defensiva
    if (!file) {
      setError('No se seleccionó ningún archivo');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      // Validación de tipo de archivo con manejo de errores robusto
      const fileType = file.type || '';
      if (!fileType.startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen');
      }
      
      // Validación de tamaño con manejo de errores robusto
      const fileSize = file.size || 0;
      if (fileSize > 5 * 1024 * 1024) {
        throw new Error('La imagen debe ser menor a 5MB');
      }
      
      // Procesamos y optimizamos la imagen antes de usar
      const processedImage = await resizeImage(file);
      
      // Simular un pequeño retraso como en una carga real
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Crear una URL local para la imagen usando FileReader
      const reader = new FileReader();
      
      reader.onload = function(e) {
        if (isMounted.current) {
          const imageUrl = e.target.result;
          setNewProduct(p => ({ ...p, photoUrl: imageUrl }));
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
      reader.readAsDataURL(processedImage);
      
    } catch (error) {
      console.error('Error en el proceso de imagen:', error);
      
      // Verificamos que el componente siga montado antes de mostrar el error
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
    
    if (uploading) return; // Evitar eliminar durante la carga
    
    // Usar setTimeout para diferir la eliminación hasta después del ciclo de renderizado actual
    setTimeout(() => {
      if (isMounted.current) {
        setPreview('');
        setNewProduct(p => ({ ...p, photoUrl: '' }));
        setError('');
      }
    }, 0);
  };

  // Manejar inputs
  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewProduct(np => ({ ...np, [name]: value }));
  };

  // Iniciar edición de un producto
  const handleEditProduct = (product) => {
    setIsEditing(true);
    setCurrentProductId(product.id);
    setNewProduct({ 
      name: product.name, 
      price: product.price, 
      stock: product.stock, 
      category: product.category || '',
      photoUrl: product.photoUrl,
      offer: product.offer || ''
    });
    setPreview(product.photoUrl);
  };

  // Guardar producto (nuevo o editado)
  const handleSubmitProduct = e => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock || !newProduct.category || !newProduct.photoUrl) {
      dispatch({ 
        type: 'SHOW_NOTIFICATION', 
        payload: { message: 'Por favor completa todos los campos requeridos.', type: 'error' }
      });
      return;
    }

    const productData = {
      name: newProduct.name,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      category: newProduct.category,
      shopId: shop?.id,
      barberId: user?.id,
      photoUrl: newProduct.photoUrl
    };

    // Añadir oferta si existe
    if (newProduct.offer && newProduct.offer.trim()) {
      productData.offer = newProduct.offer.trim();
    }

    if (isEditing) {
      dispatch({
        type: 'UPDATE_PRODUCT',
        payload: {
          id: currentProductId,
          ...productData
        }
      });
      dispatch({ 
        type: 'SHOW_NOTIFICATION', 
        payload: { message: 'Producto actualizado con éxito', type: 'success' }
      });
    } else {
      dispatch({
        type: 'ADD_PRODUCT',
        payload: {
          productData: productData,
          shopId: shop?.id,
          ownerOrBarberId: user?.id,
          barberId: user?.id
        }
      });
      dispatch({ 
        type: 'SHOW_NOTIFICATION', 
        payload: { message: 'Producto añadido con éxito', type: 'success' }
      });
    }
    
    // Limpiar formulario
    setNewProduct({ name: '', price: '', stock: '', category: '', photoUrl: '', offer: '' });
    setPreview('');
    setIsEditing(false);
    setCurrentProductId(null);
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentProductId(null);
    setNewProduct({ name: '', price: '', stock: '', category: '', photoUrl: '', offer: '' });
    setPreview('');
  };

  // Eliminar producto
  const handleDeleteProduct = (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      dispatch({
        type: 'DELETE_PRODUCT',
        payload: { id: productId }
      });
      dispatch({ 
        type: 'SHOW_NOTIFICATION', 
        payload: { message: 'Producto eliminado con éxito', type: 'info' }
      });
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
        <i className="fas fa-box-open mr-3 text-indigo-600"></i>
        {isEditing ? 'Editar Producto' : 'Gestionar Mis Productos'}
      </h2>
      
      {/* Formulario para agregar/editar producto */}
      <div className="mb-8 bg-slate-50 p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">{isEditing ? 'Actualizar Producto' : 'Agregar Nuevo Producto'}</h3>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onSubmit={handleSubmitProduct}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nombre</label>
            <input 
              type="text" 
              name="name" 
              placeholder="Ej: Gel para cabello" 
              className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
              value={newProduct.name} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Precio (RD$)</label>
            <input 
              type="number" 
              name="price" 
              placeholder="0" 
              min="0" 
              className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
              value={newProduct.price} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Stock</label>
            <input 
              type="number" 
              name="stock" 
              placeholder="0" 
              min="0" 
              className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
              value={newProduct.stock} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Categoría</label>
            <input 
              type="text" 
              name="category" 
              placeholder="Ej: Gel, Shampoo, Crema, etc." 
              className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
              value={newProduct.category} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Oferta (opcional)</label>
            <input 
              type="text" 
              name="offer" 
              placeholder="Ej: 2x1, 20% descuento" 
              className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
              value={newProduct.offer} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="space-y-1 lg:col-span-3">
            <label className="text-sm font-medium text-slate-700">Imagen</label>
            {/* Zona de carga de imagen para nuevo producto */}
            <div className="mb-4">
              <label className="block text-slate-700 text-sm font-medium mb-1">
                Imagen del producto
              </label>
              <div className="relative h-36">
                {preview ? (
                  <div className="w-full h-full relative rounded-lg overflow-hidden">
                    <img 
                      src={preview} 
                      alt="Vista previa" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs shadow-md"
                      disabled={uploading}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : uploading ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg h-full w-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mx-auto mb-2"></div>
                      <p className="text-sm text-slate-500">Subiendo imagen...</p>
                    </div>
                  </div>
                ) : (
                  <ImageDropzone 
                    onImageSelected={handleImageUpload} 
                    setError={setError} 
                  />
                )}
              </div>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 flex items-center justify-between mt-2 pt-4 border-t border-slate-200">
            <div></div>
            <div className="flex space-x-3">
              {isEditing && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 font-medium text-sm"
                >
                  Cancelar
                </button>
              )}
              <button 
                type="submit" 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow font-medium text-sm transition-colors"
              >
                {isEditing ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Lista de productos */}
      <h3 className="text-xl font-semibold text-slate-800 mb-4">Mis Productos ({products.length})</h3>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
          {products.map(prod => (
            <div key={prod.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl">
              <div className="relative">
                <img
                  src={prod.photoUrl || 'https://placehold.co/300x200/E2E8F0/4A5568?text=Producto'}
                  alt={prod.name}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button 
                    onClick={() => handleEditProduct(prod)} 
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition-colors"
                    title="Editar producto"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(prod.id)} 
                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm transition-colors"
                    title="Eliminar producto"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h4 className="text-md font-semibold text-slate-700 truncate">{prod.name}</h4>
                {prod.category && <p className="text-xs text-indigo-500 mb-1">{prod.category}</p>}
                {prod.offer && <p className="text-xs font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded inline-block my-1">OFERTA: {prod.offer}</p>}
                <p className="text-lg font-bold text-slate-800 mt-auto pt-2">RD${prod.price.toLocaleString()}</p>
                <p className="text-xs text-slate-500">
                  {prod.stock > 0 ? `${prod.stock} disponible(s)` : <span className="text-red-500 font-medium">Agotado</span>}
                  <span className="block text-purple-600"> (Vendido por: Tú) </span>
                </p>
              </div>
              <div className="p-3 bg-slate-100 border-t">
                <button 
                  disabled={prod.stock === 0} 
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-shopping-cart mr-2"></i>Consultar en Tienda
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <i className="fas fa-box-open text-5xl text-slate-400 mb-4"></i>
          <p className="text-lg text-slate-600">No tienes productos registrados.</p>
          <p className="text-slate-500 mt-1">Usa el formulario de arriba para añadir tu primer producto.</p>
        </div>
      )}
    </div>
  );
};

export default BarberProductsManagement;
