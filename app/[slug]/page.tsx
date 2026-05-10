'use client';

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { getBusinessBySlug, getPublicProductsByBusiness, createPublicOrder } from '@/lib/api';
import { BusinessProfile, Product } from '@/types/database';
import { Loader2, ShoppingCart, Plus, Minus, Store, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const dynamic = 'force-dynamic';

export default function BusinessPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const { slug } = unwrappedParams;
  
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cart state
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const bz = await getBusinessBySlug(slug);
        if (!bz) return notFound();
        setBusiness(bz);
        
        const prods = await getPublicProductsByBusiness(bz.id);
        setProducts(prods);
      } catch (err) {
        console.error(err);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-gray-400" /></div>;
  }

  if (!business) return null;

  const primaryColor = business.primary_color || '#ea580c';

  const updateCart = (product: Product, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(i => i.product.id !== product.id);
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: newQty } : i);
      } else if (delta > 0) {
        return [...prev, { product, quantity: delta }];
      }
      return prev;
    });
  };

  const getQuantity = (id: string) => cart.find(i => i.product.id === id)?.quantity || 0;
  const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * (item.product.precio_venta || 0)), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      await createPublicOrder(
        business.id, 
        cartTotal, 
        cart.map(i => ({ product_id: i.product.id, cantidad: i.quantity, precio: i.product.precio_venta || 0 }))
      );
      setOrderSuccess(true);
      setCart([]);
    } catch (err) {
      console.error(err);
      alert('Error procesando la orden');
    } finally {
      setCheckingOut(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: `${primaryColor}0a` }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">¡Pedido Confirmado!</h2>
          <p className="text-gray-500 mb-8 font-medium">Tu pedido ha sido enviado directamente a la cocina. ¡Gracias por preferir {business.name}!</p>
          <button 
            onClick={() => { setOrderSuccess(false); setIsCartOpen(false); }}
            className="w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}60` }}
          >
            Hacer Nuevo Pedido
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <img src={business.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-gray-50" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Store className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute 0 right-0 -mr-1 -mt-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white rounded-full border-2 border-white" style={{ backgroundColor: primaryColor }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Banner (if present, otherwise subtle color) */}
      <div className="w-full h-32 md:h-48 overflow-hidden relative border-b border-gray-200">
        {business.banner_url ? (
          <img src={business.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full opacity-20" style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, transparent 100%)` }} />
        )}
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Nuestro Menú</h2>
        
        {products.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
             <p className="text-gray-500 font-medium">No hay productos disponibles por ahora.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {products.map(product => {
              const qty = getQuantity(product.id);
              return (
                <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-gray-200 transition-colors">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{product.nombre}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.descripcion}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    <span className="font-black text-lg" style={{ color: primaryColor }}>${product.precio_venta?.toFixed(2)}</span>
                    
                    {qty === 0 ? (
                      <button 
                        onClick={() => updateCart(product, 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110 active:scale-95"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-200">
                        <button onClick={() => updateCart(product, -1)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white text-gray-600 shadow-sm hover:bg-gray-100 transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-gray-900 min-w-[1ch] text-center">{qty}</span>
                        <button onClick={() => updateCart(product, 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm transition-colors" style={{ backgroundColor: primaryColor }}>
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Checkout Button (Mobile optimized) */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full flex items-center justify-between px-6 py-4 rounded-[2rem] text-white font-bold shadow-2xl transition-transform hover:scale-105"
              style={{ backgroundColor: primaryColor, boxShadow: `0 20px 25px -5px ${primaryColor}40` }}
            >
              <div className="flex items-center gap-2">
                <div className="bg-white/20 px-2 py-1 rounded-lg text-sm">{cartCount}</div>
                <span>Ver Pedido</span>
              </div>
              <div className="flex items-center gap-1">
                <span>${cartTotal.toFixed(2)}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Tu Pedido</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600 font-medium text-sm">Cerrar</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <ShoppingCart className="w-12 h-12 mb-4 opacity-50" />
                    <p className="font-medium text-gray-500">Tu carrito está vacío</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 leading-tight">{item.product.nombre}</h4>
                        <p className="text-gray-500 font-medium text-sm mt-1">${item.product.precio_venta?.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-200 shadow-inner">
                        <button onClick={() => updateCart(item.product, -1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-gray-600 shadow-sm hover:bg-gray-100 transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-gray-900 min-w-[2ch] text-center">{item.quantity}</span>
                        <button onClick={() => updateCart(item.product, 1)} className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-colors" style={{ backgroundColor: primaryColor }}>
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-500 font-bold">Total a pagar</span>
                    <span className="text-2xl font-black text-gray-900">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="w-full py-4 rounded-2xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {checkingOut ? 'Procesando...' : 'Confirmar Pedido'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
