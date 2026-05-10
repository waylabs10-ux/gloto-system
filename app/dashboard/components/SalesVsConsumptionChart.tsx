'use client';

import { useState, useEffect } from 'react';
import { fetchSalesVsConsumptionStats } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  date: string;
  ventasProductos: number;
  consumoInsumos: number;
}

export default function SalesVsConsumptionChart({ businessId }: { businessId: string }) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { sales, consumption } = await fetchSalesVsConsumptionStats(businessId);
        
        // Group by Date (YYYY-MM-DD string)
        const grouped: Record<string, ChartData> = {};
        
        // Process consumption (Ingredientes motive = venta)
        consumption.forEach((c: any) => {
          const dateStr = new Date(c.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
          if (!grouped[dateStr]) grouped[dateStr] = { date: dateStr, ventasProductos: 0, consumoInsumos: 0 };
          grouped[dateStr].consumoInsumos += Number(c.cantidad);
        });

        // Process Sales (Final Products from orders)
        sales.forEach((s: any) => {
          const dateStr = new Date(s.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
          if (!grouped[dateStr]) grouped[dateStr] = { date: dateStr, ventasProductos: 0, consumoInsumos: 0 };
          
          let itemsCount = 0;
          s.items?.forEach((item: any) => itemsCount += item.cantidad);
          grouped[dateStr].ventasProductos += itemsCount;
        });

        // Sort chronologically (assuming dates can be parsed or we just rely on Object.keys being roughly insertion order, better to sort by raw date if we stored it, but for UI short-day string is easier. Let's just create an ordered array of last 7 days)
        const last7DaysData: ChartData[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const k = d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
          last7DaysData.push(grouped[k] || { date: k, ventasProductos: 0, consumoInsumos: 0 });
        }

        setData(last7DaysData);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [businessId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[300px] overflow-hidden p-5">
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 tracking-tight">Ventas vs. Consumo (7 Días)</h3>
        <p className="text-xs text-gray-500 mt-1">Platillos vendidos vs Insumos descontados (unidades/gr)</p>
      </div>

      <div className="flex-1 w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}/>
            <Area 
              type="monotone" 
              dataKey="ventasProductos" 
              name="Platillos Vendidos" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorVentas)" 
            />
            <Area 
              type="monotone" 
              dataKey="consumoInsumos" 
              name="Insumos Consumidos" 
              stroke="#f59e0b" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorConsumo)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
