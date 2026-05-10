'use client';

import { ChefHat } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 flex items-center px-6"
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="bg-orange-600 p-2 rounded-xl shadow-sm text-white">
            <ChefHat className="w-7 h-7" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">
            Gloto<span className="text-orange-600">.</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Características</a>
          <a href="#solutions" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Soluciones</a>
          <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Precios</a>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => onOpenAuth('login')}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="hidden md:block px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors"
          >
            Prueba Gratis
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
