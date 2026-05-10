'use client';

import { useState, useEffect } from 'react';
import { getMyBusiness } from '@/lib/api';
import { BusinessProfile } from '@/types/database';
import { Loader2 } from 'lucide-react';
import StockAlertsWidget from './components/StockAlertsWidget';
import AuditHistoryTable from './components/AuditHistoryTable';
import SalesVsConsumptionChart from './components/SalesVsConsumptionChart';

export default function Dashboard() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusiness() {
      try {
        const bz = await getMyBusiness();
        setBusiness(bz);
      } catch (err) {
        console.error('Error fetching business:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBusiness();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin" /> {/* Placeholder icon */}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configura tu Negocio</h2>
        <p className="text-gray-500 mb-6">
          Para ver tus analíticas, primero debes configurar el perfil de tu restaurante en la sección de Ajustes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard General</h1>
          <p className="text-gray-500 font-medium">Inteligencia de negocio y alertas para {business.name}</p>
        </div>
      </div>

      {/* Top Grid: Alerts & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StockAlertsWidget businessId={business.id} />
        </div>
        <div className="lg:col-span-2">
          <SalesVsConsumptionChart businessId={business.id} />
        </div>
      </div>

      {/* Bottom section: Audit Table */}
      <div className="col-span-1">
        <AuditHistoryTable businessId={business.id} />
      </div>
    </div>
  );
}
