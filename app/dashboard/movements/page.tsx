'use client';

import { useState, useEffect } from 'react';
import { fetchInventoryTransactions, registerInventoryMovement, fetchInventory, getMyBusiness } from '@/lib/api';
import { InventoryTransaction, Product, BusinessProfile } from '@/types/database';
import { Loader2, Plus, Minus, ArrowRightLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MovementsPage() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'entrada' | 'salida'>('entrada');
  
  // Form State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const bz = await getMyBusiness();
        if (bz) {
          setBusiness(bz);
          const trans = await fetchInventoryTransactions(bz.id);
          setTransactions(trans);
        }
        const inv = await fetchInventory();
        setProducts(inv);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const openModal = (type: 'entrada' | 'salida') => {
    setModalType(type);
    setSelectedProduct('');
    setCantidad('');
    setMotivo(type === 'entrada' ? 'compra' : 'desperdicio');
    setMessage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !cantidad || !motivo) return;
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      await registerInventoryMovement(selectedProduct, modalType, parseFloat(cantidad), motivo);
      setMessage({ type: 'success', text: `Movimiento registrado exitosamente.` });
      
      // Reload history
      if (business) {
        const trans = await fetchInventoryTransactions(business.id);
        setTransactions(trans);
      }
      
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al procesar el movimiento' });
      setIsSubmitting(false); // Only toggle false on error to let success stay visible until close
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr));
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'venta': 'Venta',
      'compra': 'Compra',
      'desperdicio': 'Desperdicio',
      'ajuste': 'Ajuste de Inventario',
      'producto_vencido': 'Producto Vencido',
      'error_cocina': 'Error en Cocina',
      'robo_perdida': 'Robo / Pérdida'
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registro Operativo</h1>
          <p className="text-gray-500">Gestiona entradas por compras y ajusta mermas diarias.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => openModal('entrada')}
            className="flex-1 md:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Ingresar Compra
          </button>
          <button 
            onClick={() => openModal('salida')}
            className="flex-1 md:flex-none px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Minus className="w-5 h-5" />
            Registrar Merma
          </button>
        </div>
      </div>

      {/* Historial Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-900">Historial de Movimientos de Inventario</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-400">
            <ArrowRightLeft className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium text-gray-500">No hay movimientos registrados aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Insumo</th>
                  <th className="px-6 py-4 text-center">Tipo</th>
                  <th className="px-6 py-4 text-right">Cantidad</th>
                  <th className="px-6 py-4">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {tx.product?.nombre || 'Producto Desconocido'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                        tx.tipo === 'entrada' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {tx.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-medium">
                      {tx.tipo === 'entrada' ? '+' : '-'}{tx.cantidad} {tx.product?.unidad_medida}
                    </td>
                    <td className="px-6 py-3 bg-white">
                      <span className="text-gray-600">{getReasonLabel(tx.motivo)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry/Exit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 border-b text-white ${modalType === 'entrada' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'}`}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {modalType === 'entrada' ? <Plus className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
                {modalType === 'entrada' ? 'Registrar Compra / Entrada' : 'Registrar Merma / Salida'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {message && (
                <div className={`p-4 text-sm font-medium rounded-xl flex items-center gap-2 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Insumo / Producto</label>
                <select
                  required
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                >
                  <option value="" disabled>Seleccione un insumo...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.stock_actual} {p.unidad_medida} actual)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cantidad</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    disabled={isSubmitting}
                    value={cantidad}
                    onChange={e => setCantidad(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-mono"
                    placeholder="Ej. 10.5"
                  />
                  {selectedProduct && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                      {products.find(p => p.id === selectedProduct)?.unidad_medida}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Motivo</label>
                {modalType === 'entrada' ? (
                  <select
                    required
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  >
                    <option value="compra">Compra de Proveedor</option>
                    <option value="ajuste">Ajuste Manual a Favor</option>
                  </select>
                ) : (
                  <select
                    required
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  >
                    <option value="desperdicio">Desperdicio Regular</option>
                    <option value="producto_vencido">Producto Vencido</option>
                    <option value="error_cocina">Error en Cocina</option>
                    <option value="robo_perdida">Robo / Pérdida / Extravío</option>
                    <option value="ajuste">Ajuste Manual en Contra</option>
                  </select>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 ${
                    modalType === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
