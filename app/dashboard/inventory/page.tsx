'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, AlertCircle, Edit2, Package, Loader2, X } from 'lucide-react';
import { fetchInventory, addInventoryItem, updateInventoryItem } from '@/lib/api';
import { Product, UnitType } from '@/types/database';

export default function InventoryPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidad, setUnidad] = useState<UnitType>('gr');
  const [stockActual, setStockActual] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      setLoading(true);
      const data = await fetchInventory();
      setItems(data);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      // Fallback behavior if DB not setup, to allow UI testing
      setError('Asegúrate de haber configurado tu base de datos Supabase.');
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.nombre.toLowerCase().includes(search.toLowerCase()) || 
      item.descripcion?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const openAddModal = () => {
    setEditingItem(null);
    setNombre('');
    setDescripcion('');
    setUnidad('gr');
    setStockActual(0);
    setStockMinimo(0);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Product) => {
    setEditingItem(item);
    setNombre(item.nombre);
    setDescripcion(item.descripcion || '');
    setUnidad(item.unidad_medida);
    setStockActual(item.stock_actual);
    setStockMinimo(item.stock_minimo);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || stockActual < 0 || stockMinimo < 0) {
      setError('Por favor revisa los campos requeridos.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingItem) {
        await updateInventoryItem(editingItem.id, {
          nombre,
          descripcion,
          unidad_medida: unidad,
          stock_actual: stockActual,
          stock_minimo: stockMinimo,
        });
      } else {
        await addInventoryItem({
          nombre,
          descripcion,
          unidad_medida: unidad,
          precio_venta: null,
          stock_actual: stockActual,
          stock_minimo: stockMinimo,
        });
      }
      await loadInventory();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error guardando el item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventario de Materia Prima</h1>
          <p className="text-gray-500">Gestiona tus ingredientes y alertas de stock.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Añadir Ingrediente
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ingrediente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium whitespace-nowrap">
            <div className="w-3 h-3 rounded-full bg-red-500" /> Stock Crítico
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center text-orange-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <Package className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No hay ingredientes registrados</p>
              <p className="text-sm">Tus ingredientes aparecerán aquí cuando los agregues.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-sm text-gray-500 font-medium">
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">Descripción</th>
                  <th className="px-6 py-4 font-medium">Stock Actual</th>
                  <th className="px-6 py-4 font-medium">Stock Mínimo</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => {
                  const isLowStock = item.stock_actual <= item.stock_minimo;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{item.nombre}</div>
                        <div className="text-xs text-gray-500 uppercase">{item.unidad_medida}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {item.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold ${
                          isLowStock ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {isLowStock && <AlertCircle className="w-4 h-4" />}
                          {item.stock_actual}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm font-medium">
                        {item.stock_minimo}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Añadir/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 select-none">
                {editingItem ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Ej. Harina de Trigo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Marca o detalle (Opcional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Unidad de Medida</label>
                  <select
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value as UnitType)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="gr">Gramos (gr)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="unidad">Unidad (ud)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Stock Actual</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={stockActual}
                      onChange={(e) => setStockActual(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Stock Mínimo (Alerta)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={stockMinimo}
                      onChange={(e) => setStockMinimo(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? 'Guardar Cambios' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
