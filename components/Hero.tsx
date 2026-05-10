'use client';

import { motion } from 'motion/react';
import { ArrowRight, ChevronRight } from 'lucide-react';

interface HeroProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export function Hero({ onOpenAuth }: HeroProps) {
  return (
    <section className="relative px-6 py-24 md:py-32 lg:py-40 flex flex-col items-center text-center overflow-hidden bg-white">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-orange-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-4xl z-10 mx-auto w-full"
      >
        <button 
          onClick={() => onOpenAuth('register')}
          className="inline-flex items-center gap-2 py-1.5 px-4 mb-8 bg-orange-50 border border-orange-100 hover:border-orange-200 text-orange-600 rounded-full text-sm font-semibold tracking-wide transition-colors group cursor-pointer"
        >
          <span>Nueva versión inteligente 2.0</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-8">
          Controla tu cocina, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
            escala tu negocio
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          El primer sistema food-tech con control de inventario inteligente y pedidos en tiempo real, diseñado para modernizar tu operación gastronómica.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2 group border border-transparent"
          >
            Probar Gratis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center"
          >
            Iniciar Sesión
          </button>
        </div>
      </motion.div>
    </section>
  );
}
