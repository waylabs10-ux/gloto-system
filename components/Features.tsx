'use client';

import { motion } from 'motion/react';
import { BrainCircuit, Store, BellRing } from 'lucide-react';

const features = [
  {
    icon: BrainCircuit,
    title: 'Inventario Inteligente',
    description: 'Calcula el costo real de tus platillos y descuenta ingredientes automáticamente con cada orden.',
  },
  {
    icon: Store,
    title: 'Pedidos en Tiempo Real',
    description: 'Centraliza tus ventas con una página web integrada directamente con el monitor de cocina y tu caja.',
  },
  {
    icon: BellRing,
    title: 'Alertas de Stock',
    description: 'Recibe notificaciones proactivas antes de que se agote la carne, el pan o cualquier insumo crítico.',
  }
];

export function Features() {
  return (
    <section className="py-24 px-6 bg-white border-t border-gray-100" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-5">
            Automatiza tu operación
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
            Gloto unifica tu trastienda con tu punto de venta en una sola plataforma fluida, 
            eliminando el trabajo manual de los restaurantes tradicionales.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-50 p-8 lg:p-10 rounded-[2rem] border border-gray-100 hover:bg-orange-50/50 hover:border-orange-100 transition-colors group"
            >
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-center mb-8 group-hover:border-orange-200 group-hover:scale-105 transition-all">
                <feature.icon className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-gray-500 leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
