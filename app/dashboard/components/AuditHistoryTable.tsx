'use client';

import { useState, useEffect } from 'react';
import { fetchTransactionsWithFilters } from '@/lib/api';
import { InventoryTransaction } from '@/types/database';
import { Search, Loader2, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function AuditHistoryTable({ businessId }: { businessId: string }) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('7days');
  const [tipo, setTipo] = useState('all');
  const [motivo, setMotivo] = useState('all');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let sd = undefined;
        let ed = undefined;
        const now = new Date();
        if (dateRange === 'today') {
          sd = new Date(now.setHours(0,0,0,0));
        } else if (dateRange === '7days') {
          sd = new Date();
          sd.setDate(sd.getDate() - 7);
          sd.setHours(0,0,0,0);
        } else if (dateRange === '30days') {
          sd = new Date();
          sd.setDate(sd.getDate() - 30);
          sd.setHours(0,0,0,0);
        }

        const data = await fetchTransactionsWithFilters(businessId, {
          search,
          tipo,
          motivo,
          startDate: sd,
          endDate: ed,
        });
        setTransactions(data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    }
    
    // Simple debounce for search
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [businessId, search, dateRange, tipo, motivo]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr));
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'venta': 'Venta', 'compra': 'Compra', 'desperdicio': 'Desperdicio',
      'ajuste': 'Ajuste', 'producto_vencido': 'Vencido',
      'error_cocina': 'Error', 'robo_perdida': 'Robo/Pérdida'
    };
    return labels[reason] || reason;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-gray-100 space-y-4">
        <h3 className="font-bold text-gray-900 tracking-tight">Auditoría de Inventario</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar suminsitro..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-colors"
            />
          </div>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
            <option value="today">Hoy</option>
            <option value="7days">Últimos 7 días</option>
            <option value="30days">Últimos 30 días</option>
            <option value="all">Historico Todo</option>
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
            <option value="all">Todos (Entrada/Salida)</option>
            <option value="entrada">Solo Entradas</option>
            <option value="salida">Solo Salidas</option>
          </select>
          <select value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
            <option value="all">Todos los motivos</option>
            <option value="venta">Venta</option>
            <option value="compra">Compra</option>
            <option value="desperdicio">Desperdicio</option>
            <option value="error_cocina">Error en Cocina</option>
            <option value="robo_perdida">Robo/Pérdida</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
            No se encontraron movimientos.
          </div>
        ) : null}

        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-[10px] font-bold sticky top-0">
            <tr>
              <th className="px-5 py-3 font-semibold">Fecha</th>
              <th className="px-5 py-3 font-semibold">Insumo</th>
              <th className="px-5 py-3 font-semibold text-right">Cantidad</th>
              <th className="px-5 py-3 font-semibold">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map(tx => {
              const isNegativeMerma = tx.tipo === 'salida' && tx.motivo !== 'venta';
              return (
                <tr key={tx.id} className={`hover:bg-gray-50/50 transition-colors ${isNegativeMerma ? 'bg-red-50/30' : ''}`}>
                  <td className="px-5 py-3 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{tx.product?.nombre || '??'}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 font-bold ${tx.tipo === 'entrada' ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.tipo === 'entrada' ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3 text-red-500"/>}
                      {tx.cantidad} <span className="text-gray-400 text-xs font-normal ml-1">{tx.product?.unidad_medida}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${isNegativeMerma ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {getReasonLabel(tx.motivo)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
