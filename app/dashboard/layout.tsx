import { ChefHat, LayoutDashboard, Package, UtensilsCrossed, LogOut, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-orange-600 p-2 rounded-xl text-white">
              <ChefHat className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">
              Gloto<span className="text-orange-600">.</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50 font-medium transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Panel
          </Link>
          <Link 
            href="/dashboard/kds" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50 font-medium transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Kitchen Display (KDS)
          </Link>
          <Link 
            href="/dashboard/inventory" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50 font-medium transition-colors"
          >
            <Package className="w-5 h-5" />
            Inventario
          </Link>
          <Link 
            href="/dashboard/movements" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50 font-medium transition-colors"
          >
            <ArrowRightLeft className="w-5 h-5" />
            Operativo (Movimientos)
          </Link>
          <Link 
            href="/dashboard/recipes" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50 font-medium transition-colors"
          >
            <UtensilsCrossed className="w-5 h-5" />
            Recetas y Menú
          </Link>
          <Link 
            href="/dashboard/settings" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50 font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Configuración
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 font-medium transition-colors">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-1.5 rounded-lg text-white">
              <ChefHat className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900">Gloto.</span>
          </div>
          {/* Mobile menu button could go here */}
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
