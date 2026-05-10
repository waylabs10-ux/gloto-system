'use client';

import { useState } from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { Features } from './Features';
import { AuthModal } from './AuthModal';

export function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white selection:bg-orange-200">
      <Navbar onOpenAuth={openAuth} />
      
      <main>
        <Hero onOpenAuth={openAuth} />
        <Features />
      </main>

      {/* Simple Footer */}
      <footer className="bg-gray-50 py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-500 font-medium text-sm">
            © {new Date().getFullYear()} Gloto. Todos los derechos reservados.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-orange-600 transition-colors">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-orange-600 transition-colors">Instagram</a>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
