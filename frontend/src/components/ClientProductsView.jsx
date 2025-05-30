import React, { useContext, useState } from 'react';
import { AppContext } from '../App';

const ClientProductsView = ({ onBack }) => {
  const { state, dispatch } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedShop, setSelectedShop] = useState('all');

  // Obtener todas las categorías únicas de productos
  const categories = [...new Set(state.products.map(p => p.category))].filter(Boolean);
  
  // Obtener todas las barberías
  const shops = state.barberShops || [];

  // Filtrar productos según los criterios seleccionados
  const filteredProducts = state.products.filter(product => {
    // Filtrar por término de búsqueda
    const matchesSearch = 
      (product.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (product.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(search.toLowerCase());
    
    // Filtrar por categoría seleccionada
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    // Filtrar por barbería seleccionada
    const matchesShop = selectedShop === 'all' || product.shopId === selectedShop;
    
    return matchesSearch && matchesCategory && matchesShop;
  });

  // Función para obtener el nombre del barbero
  const getBarberName = (barberId) => {
    if (!barberId) return 'Tienda';
    const barber = state.users.find(u => u.id === barberId);
    return barber ? barber.name : 'Barbero';
  };

  // Función para obtener el nombre de la barbería
  const getShopName = (shopId) => {
    if (!shopId) return 'Desconocida';
    const shop = state.barberShops.find(s => s.id === shopId);
    return shop ? shop.name : 'Barbería';
  };
  
  // Función para obtener el color de fondo según la categoría
  const getCategoryColor = (category) => {
    const categories = {
      'Gel': 'bg-blue-100 text-blue-800',
      'Shampoo': 'bg-green-100 text-green-800',
      'Aceite': 'bg-amber-100 text-amber-800',
      'Cera': 'bg-purple-100 text-purple-800',
      'Crema': 'bg-pink-100 text-pink-800',
      'Loción': 'bg-indigo-100 text-indigo-800',
      'Spray': 'bg-teal-100 text-teal-800'
    };
    
    // Buscar coincidencias parciales si no hay una coincidencia exacta
    const exactMatch = categories[category];
    if (exactMatch) return exactMatch;
    
    const lowerCategory = category?.toLowerCase() || '';
    for (const [key, value] of Object.entries(categories)) {
      if (lowerCategory.includes(key.toLowerCase())) {
        return value;
      }
    }
    
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Productos Disponibles</h2>
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver
          </button>
        )}
      </div>
      
      {/* Filtros */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              className="p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={selectedShop}
              onChange={e => setSelectedShop(e.target.value)}
            >
              <option value="all">Todas las barberías</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Resultados */}
      <div className="mb-4 text-sm text-slate-500">
        Mostrando {filteredProducts.length} productos
      </div>
      
      {/* Lista de productos */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="relative">
                <img 
                  src={product.photoUrl || 'https://placehold.co/300x200/E2E8F0/4A5568?text=Producto'} 
                  alt={product.name} 
                  className="w-full h-48 object-cover"
                />
                {product.offer && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    {product.offer}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="text-white font-bold text-lg drop-shadow-md">{product.name}</div>
                </div>
              </div>
              
              <div className="p-4 flex-grow">
                <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(product.category)} mb-2`}>
                  {product.category}
                </div>
                {product.description && (
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">{product.description}</p>
                )}
                
                <div className="mt-auto">
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-lg font-bold text-slate-800">RD${product.price}</div>
                    <div className="text-xs text-slate-500">
                      {product.stock > 0 ? `${product.stock} disponible(s)` : (
                        <span className="text-red-500 font-medium">Agotado</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs">
                    <div className="flex items-center bg-indigo-50 p-2 rounded-md">
                      <div className="bg-indigo-100 p-1.5 rounded-md mr-2">
                        <i className="fas fa-store-alt text-indigo-600"></i>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Barbería</div>
                        <div className="font-medium text-indigo-700">{getShopName(product.shopId)}</div>
                      </div>
                    </div>
                    
                    {product.barberId && (
                      <div className="flex items-center bg-purple-50 p-2 rounded-md mt-2">
                        <div className="bg-purple-100 p-1.5 rounded-md mr-2">
                          <i className="fas fa-user-tie text-purple-600"></i>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs">Vendido por</div>
                          <div className="font-medium text-purple-700">{getBarberName(product.barberId)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-100 border-t">
                {product.stock > 0 ? (
                  <button 
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium py-2.5 px-3 rounded-md text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                    onClick={() => {
                      dispatch({ 
                        type: 'SHOW_NOTIFICATION', 
                        payload: { 
                          message: `Para comprar "${product.name}", visita la barbería ${getShopName(product.shopId)}.`, 
                          type: 'info' 
                        } 
                      });
                    }}
                  >
                    <i className="fas fa-shopping-bag mr-2"></i>
                    Disponible en Tienda
                  </button>
                ) : (
                  <button 
                    className="w-full bg-slate-200 text-slate-500 font-medium py-2.5 px-3 rounded-md text-sm cursor-not-allowed flex items-center justify-center"
                    disabled
                  >
                    <i className="fas fa-times-circle mr-2"></i>
                    Agotado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <i className="fas fa-search text-5xl text-slate-400 mb-4"></i>
          <p className="text-lg text-slate-600">No se encontraron productos con los filtros seleccionados.</p>
          <p className="text-slate-500 mt-1">Intenta con otros criterios de búsqueda.</p>
        </div>
      )}
    </div>
  );
};

export default ClientProductsView;
