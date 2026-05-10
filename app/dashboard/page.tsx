export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido a Gloto</h1>
        <p className="text-gray-500 mb-6">
          Has iniciado sesión correctamente. Aquí se mostrará tu monitor de cocina y control de inventario.
        </p>
        <a 
          href="/"
          className="inline-block px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          Volver al Inicio
        </a>
      </div>
    </div>
  );
}
