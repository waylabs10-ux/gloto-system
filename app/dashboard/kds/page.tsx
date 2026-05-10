'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getMyBusiness, fetchTodayOrders, updateOrderStatus } from '@/lib/api';
import { Order, BusinessProfile } from '@/types/database';
import { Loader2, ArrowRight, CheckCircle2, Clock, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function KDSPage() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple beep sound (base64)
  const beepSoundUrl = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'; // Will use browser's Audio for a soft beep, maybe easier to just use standard beep uri:
  // Using a valid short beep base64 below:
  const validBeepUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAACAgQEBAUGBwgICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AA==';

  useEffect(() => {
    let subscription: any;

    async function loadData() {
      try {
        const bz = await getMyBusiness();
        if (bz) {
          setBusiness(bz);
          const initialOrders = await fetchTodayOrders(bz.id);
          setOrders(initialOrders);

          // Setup Realtime Subscription
          subscription = supabase
            .channel('orders_channel')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${bz.id}`
              },
              async (payload) => {
                // Fetch the complete order with items
                // Give it a tiny delay to allow related inserts (order_items) to finish
                setTimeout(async () => {
                  try {
                    const { data } = await supabase
                      .from('orders')
                      .select(`*, items:order_items(*, product:products(*))`)
                      .eq('id', payload.new.id)
                      .single();
                      
                    if (data) {
                      setOrders(prev => [...prev, data]);
                      playAlertSound();
                      toast.success(`¡Nuevo pedido recibido! (#${data.id.substring(0,4)})`);
                    }
                  } catch(e) {
                    console.error("Error fetching order details", e);
                  }
                }, 500);
              }
            )
            .subscribe();
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const playAlertSound = () => {
    try {
      const audio = new Audio(validBeepUrl);
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play blocked:', e));
    } catch(e) {}
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string, nextStatus: string) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estado: nextStatus } : o));
    
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (err: any) {
      toast.error('Error al actualizar el estado: ' + err.message);
      // Revert if error
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estado: currentStatus } : o));
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>;
  }

  const pendientes = orders.filter(o => o.estado === 'pendiente');
  const enPreparacion = orders.filter(o => o.estado === 'preparando');
  const entregados = orders.filter(o => o.estado === 'completada').slice(0, 10); // Show max 10 to not clutter

  const getRelativeTime = (isoString: string) => {
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true, locale: es });
    } catch {
      return '';
    }
  };

  const renderTicket = (order: any) => {
    const isPendiente = order.estado === 'pendiente';
    const isPreparando = order.estado === 'preparando';
    const isCompletado = order.estado === 'completada';

    let headerBg = 'bg-red-500';
    let borderColor = 'border-red-200';
    if (isPreparando) {
      headerBg = 'bg-amber-500';
      borderColor = 'border-amber-200';
    } else if (isCompletado) {
      headerBg = 'bg-emerald-500';
      borderColor = 'border-emerald-200';
    }

    return (
      <div key={order.id} className={`bg-white rounded-xl shadow-lg border-2 ${borderColor} overflow-hidden font-sans`}>
        {/* Ticket Header */}
        <div className={`${headerBg} px-4 py-3 text-white flex justify-between items-center`}>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-wider">#{order.id.substring(0, 4).toUpperCase()}</span>
            <span className="text-white/80 text-xs flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" />
              {getRelativeTime(order.created_at)}
            </span>
          </div>
          <span className="font-bold text-lg bg-black/20 px-2 py-1 rounded">
            Mesa / Cliente
          </span>
        </div>

        {/* Ticket Body */}
        <div className="p-4 bg-gray-50/50">
          <ul className="space-y-3 mb-6">
            {order.items?.map((item: any, idx: number) => (
              <li key={idx} className="flex justify-between items-start text-gray-800 border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                <span className="font-bold text-lg">
                  <span className="mr-2 text-gray-500">{item.cantidad}x</span> 
                  {item.product?.nombre || 'Producto Desconocido'}
                </span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2">
            {isPendiente && (
              <button 
                onClick={() => handleUpdateStatus(order.id, 'pendiente', 'preparando')}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg rounded-lg shadow-sm flex justify-center items-center gap-2 transition-colors"
              >
                Empezar a Preparar <ArrowRight className="w-5 h-5" />
              </button>
            )}
            
            {isPreparando && (
              <button 
                onClick={() => handleUpdateStatus(order.id, 'preparando', 'completada')}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-lg shadow-sm flex justify-center items-center gap-2 transition-colors"
              >
                Marcar Listo <CheckCircle2 className="w-5 h-5" />
              </button>
            )}

            {isCompletado && (
              <div className="text-center text-emerald-600 font-bold flex items-center justify-center gap-2 py-2">
                <CheckCircle2 className="w-5 h-5" /> Entregado
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col -m-6 p-6 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">KDS (Centro de Control)</h1>
          <p className="text-gray-500 font-medium">Gestión en tiempo real de los pedidos activos</p>
        </div>
        <button 
          onClick={playAlertSound}
          className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors border border-gray-200"
          title="Probar sonido de alerta"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Column: Pendientes */}
        <div className="flex flex-col bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10 shadow-sm">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
              Pendientes
            </h2>
            <span className="bg-red-100 text-red-800 font-bold px-2 py-1 rounded text-sm">
              {pendientes.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
            {pendientes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">Sin pedidos pendientes</div>
            )}
            {pendientes.map(renderTicket)}
          </div>
        </div>

        {/* Column: Preparando */}
        <div className="flex flex-col bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10 shadow-sm">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              En Preparación
            </h2>
            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded text-sm">
              {enPreparacion.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
            {enPreparacion.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">No hay ordenes en proceso</div>
            )}
            {enPreparacion.map(renderTicket)}
          </div>
        </div>

        {/* Column: Entregados */}
        <div className="flex flex-col bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm opacity-80">
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10 shadow-sm">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Entregados (Hoy)
            </h2>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded text-sm">
              {entregados.length} {orders.filter(o => o.estado === 'completada').length > 10 ? '+' : ''}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
            {entregados.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">Sin entregas aún</div>
            )}
            {entregados.map(renderTicket)}
          </div>
        </div>

      </div>
    </div>
  );
}
