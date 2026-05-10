'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Package, UtensilsCrossed, Trash2, Save, X, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { fetchRecipes, addRecipe, updateRecipe, fetchInventory, fetchProductDependencies, saveProductDependencies } from '@/lib/api';
import { Product, ProductDependency } from '@/types/database';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // View states
  const [activeRecipe, setActiveRecipe] = useState<Product | null>(null);
  const [dependencies, setDependencies] = useState<Partial<ProductDependency>[]>([]);
  const [depsLoading, setDepsLoading] = useState(false);
  const [savingDeps, setSavingDeps] = useState(false);

  // Form states matching standard modal flow for adding generic recipes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Product | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioVenta, setPrecioVenta] = useState(0);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [recData, invData] = await Promise.all([
        fetchRecipes(),
        fetchInventory()
      ]);
      setRecipes(recData);
      setInventory(invData);
    } catch (err) {
      console.error(err);
      setError('Asegúrate de haber configurado tu base de datos Supabase.');
    } finally {
      setLoading(false);
    }
  }

  const loadDependencies = async (recipe: Product) => {
    setActiveRecipe(recipe);
    setDepsLoading(true);
    try {
      const deps = await fetchProductDependencies(recipe.id);
      setDependencies(deps);
    } catch (err: any) {
      console.error('Error fetching dependencies:', err);
      // fallback to mock if disconnected
      setDependencies([]);
    } finally {
      setDepsLoading(false);
    }
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => 
      r.nombre.toLowerCase().includes(search.toLowerCase()) || 
      r.descripcion?.toLowerCase().includes(search.toLowerCase())
    );
  }, [recipes, search]);

  // Product CRUD
  const openAddRecipeModal = () => {
    setEditingRecipe(null);
    setNombre('');
    setDescripcion('');
    setPrecioVenta(0);
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) return;
    setSavingRecipe(true);
    setError('');

    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, { nombre, descripcion, precio_venta: precioVenta });
      } else {
        await addRecipe({
          nombre,
          descripcion,
          unidad_medida: 'unidad', // By default, final products are units
          precio_venta: precioVenta,
          stock_actual: 0,
          stock_minimo: 0,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error guardando la receta.');
    } finally {
      setSavingRecipe(false);
    }
  };

  // Recipe Builder Handlers
  const addDependencyRow = () => {
    setDependencies([...dependencies, { product_id: activeRecipe!.id, ingredient_id: '', cantidad_necesaria: 0 }]);
  };

  const updateDependency = (index: number, field: keyof ProductDependency, value: any) => {
    const newDeps = [...dependencies];
    newDeps[index] = { ...newDeps[index], [field]: value };
    setDependencies(newDeps);
  };

  const removeDependency = (index: number) => {
    const newDeps = [...dependencies];
    newDeps.splice(index, 1);
    setDependencies(newDeps);
  };

  const saveRecipeDependencies = async () => {
    if (!activeRecipe) return;
    
    // validate
    const isValid = dependencies.every(d => d.ingredient_id && d.cantidad_necesaria && d.cantidad_necesaria > 0);
    if (!isValid) {
      alert('Por favor selecciona un ingrediente y cantidad mayor a 0 para todas las filas.');
      return;
    }

    setSavingDeps(true);
    try {
      // Format correctly, removing transient `ingredient`
      const depsToSave = dependencies.map(d => ({
        product_id: activeRecipe.id,
        ingredient_id: d.ingredient_id!,
        cantidad_necesaria: d.cantidad_necesaria!
      }));
      await saveProductDependencies(activeRecipe.id, depsToSave);
      alert('Receta guardada exitosamente');
    } catch (err: any) {
      console.error(err);
      alert('Error guardando la receta: ' + err.message);
    } finally {
      setSavingDeps(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Columna Izquierda: Lista de Productos Mestre */}
      <div className="w-full lg:w-1/3 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            Menú P. Finales
          </h2>
          <button
            onClick={openAddRecipeModal}
            className="p-2 bg-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
             <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>
          ) : filteredRecipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => loadDependencies(recipe)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                activeRecipe?.id === recipe.id ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div>
                <p className={`font-semibold ${activeRecipe?.id === recipe.id ? 'text-orange-900' : 'text-gray-900'}`}>
                  {recipe.nombre}
                </p>
                <p className="text-xs text-gray-500">${recipe.precio_venta?.toFixed(2)}</p>
              </div>
              <ArrowRight className={`w-4 h-4 text-orange-400 transition-transform ${activeRecipe?.id === recipe.id ? 'opacity-100 translate-x-1' : 'opacity-0 -translate-x-2'}`} />
            </button>
          ))}
          {filteredRecipes.length === 0 && !loading && (
            <div className="text-center p-8 text-gray-500 text-sm">
              No hay productos registrados
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Constructor de Recetas (BOM) */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative">
        {!activeRecipe ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <UtensilsCrossed className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-xl font-semibold text-gray-600 mb-2">Selecciona un Producto</p>
            <p className="max-w-md mx-auto">Selecciona o crea un producto en el menú del lado izquierdo para asignar sus dependencias (receta).</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/30">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1 block">BOM / Constructor de Receta</span>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{activeRecipe.nombre}</h2>
                <p className="text-sm text-gray-500">{activeRecipe.descripcion || 'Sin descripción'}</p>
              </div>
              <button
                onClick={saveRecipeDependencies}
                disabled={savingDeps || depsLoading}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {savingDeps ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Receta
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {depsLoading ? (
                 <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>
              ) : (
                <div className="space-y-4 max-w-3xl">
                  {dependencies.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                      <p className="text-gray-500 font-medium mb-4">Este producto no tiene ingredientes asignados.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-sm font-bold text-gray-500 border-b border-gray-200">
                          <th className="pb-3 w-1/2">Ingrediente (Materia Prima)</th>
                          <th className="pb-3 w-1/3">Cantidad Consumida</th>
                          <th className="pb-3 w-16 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {dependencies.map((dep, index) => {
                          const selectedInvItem = inventory.find(i => i.id === dep.ingredient_id);
                          return (
                            <tr key={index} className="group">
                              <td className="py-3 pr-4">
                                <select
                                  value={dep.ingredient_id}
                                  onChange={(e) => updateDependency(index, 'ingredient_id', e.target.value)}
                                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-gray-900"
                                >
                                  <option value="">-- Selecciona Ingrediente --</option>
                                  {inventory.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                      {inv.nombre} ({inv.unidad_medida})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={dep.cantidad_necesaria || ''}
                                    onChange={(e) => updateDependency(index, 'cantidad_necesaria', parseFloat(e.target.value) || 0)}
                                    className="w-full pl-3 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono text-gray-900"
                                    placeholder="0.0"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold uppercase select-none">
                                    {selectedInvItem?.unidad_medida || '-'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => removeDependency(index)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-50 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  <button
                    onClick={addDependencyRow}
                    className="w-full py-4 mt-4 border-2 border-dashed border-gray-200 hover:border-orange-400 hover:bg-orange-50 text-gray-500 hover:text-orange-600 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Añadir Ingrediente a Receta
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Add Final Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Producto (Menú)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRecipe} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> <p>{error}</p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Plato</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Ej. Hamburguesa Clásica"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Precio de Venta ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 border-gray-300 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg"
                >Cancelar</button>
                <button
                  type="submit"
                  disabled={savingRecipe}
                  className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700"
                >Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
