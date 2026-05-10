'use client';

import { useState, useEffect } from 'react';
import { fetchLowStockAlerts } from '@/lib/api';
import { Product } from '@/types/database';
import { AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function StockAlertsWidget({ businessId }: { businessId: string }) {
  const [alerts, setAlerts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await fetchLowStockAlerts(businessId);
        setAlerts(data);
      } catch (err) {
        console.error('Error fetching stock alerts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, [businessId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-red-100 flex flex-col min-h-[300px] overflow-hidden">
      <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="font-bold text-red-900">Alertas de Inventario</h3>
        <span className="ml-auto bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
          {alerts.length} críticas
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-80">
            <AlertTriangle className="w-10 h-10 mb-2" />
            <p className="text-sm font-medium">Todo tu stock está en orden.</p>
          </div>
        ) : (
          alerts.map(item => {
            const isZero = item.stock_actual <= 0;
            return (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight">{item.nombre}</h4>
                  <p className="text-xs font-medium mt-1">
                    <span className={isZero ? "text-red-600 font-bold" : "text-amber-600"}>
                      {item.stock_actual} {item.unidad_medida}
                    </span>
                    <span className="text-gray-400 ml-1">
                      (Mín: {item.stock_minimo})
                    </span>
                  </p>
                </div>
                <Link 
                  href="/dashboard/movements"
                  className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-200 rounded-lg transition-colors"
                  title="Registrar Entrada"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
