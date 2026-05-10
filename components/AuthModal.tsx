'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChefHat, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  // Reset state when modal opens/changes mode
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(initialMode);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPassword('');
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) {
          throw signUpError;
        } else if (!data.session) {
          throw new Error('Email no confirmado. Por favor revisa tu bandeja o desactiva "Confirm Email" en Supabase > Authentication > Providers > Email.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          throw signInError;
        }
      }
      
      router.push('/dashboard');
      onClose();
    } catch (err: any) {
      console.error(err);
      let errorMessage = err?.message || 'Ocurrió un error en la autenticación.';
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Tu correo o contraseña son incorrectos. Si es tu primera vez aquí, haz clic en "¿No tienes cuenta? Regístrate aquí" abajo para crearla.';
      } else if (errorMessage.includes('already registered')) {
        errorMessage = 'Este correo ya está registrado. Por favor cambia a la opción "Iniciar Sesión".';
      } else if (errorMessage.includes('Email not confirmed') || errorMessage.includes('Email no confirmado')) {
        errorMessage = 'Debes confirmar tu correo electrónico. (Tip: Puedes desactivar la confirmación en tu panel de Supabase > Authentication > Providers > Email).';
      } else if (errorMessage.includes('email rate limit exceeded') || errorMessage.includes('rate limit')) {
        errorMessage = 'Límite de intentos excedido. Por favor, desactiva "Confirm Email" en Supabase Auth > Providers > Email para continuar probando sin límites de correo.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-8">
              <div className="bg-orange-100 p-3 rounded-2xl">
                <ChefHat className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
              </h2>
              <p className="text-gray-500 font-medium">
                {mode === 'login' 
                  ? 'Ingresa tus datos para continuar en Gloto.' 
                  : 'Comienza a escalar tu cocina hoy mismo.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl text-gray-900 outline-none transition-all"
                  placeholder="ejemplo@restaurante.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="password">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl text-gray-900 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm font-semibold text-gray-600 hover:text-orange-600 transition-colors"
              >
                {mode === 'login' 
                  ? '¿No tienes cuenta? Regístrate aquí' 
                  : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
