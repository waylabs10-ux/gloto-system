import { supabase } from './supabase';

export async function seedDemoData(businessId: string) {
  console.log('Seeding demo data for business:', businessId);

  // 1. Create products (ingredients)
  const ingredients = [
    { business_id: businessId, nombre: 'Pan de Hamburguesa', unidad_medida: 'pz', stock_actual: 50, stock_minimo: 20, es_producto_final: false, precio_venta: 0 },
    { business_id: businessId, nombre: 'Carne de Res (150g)', unidad_medida: 'pz', stock_actual: 40, stock_minimo: 30, es_producto_final: false, precio_venta: 0 },
    { business_id: businessId, nombre: 'Queso Cheddar', unidad_medida: 'rebanadas', stock_actual: 10, stock_minimo: 50, es_producto_final: false, precio_venta: 0 },
    { business_id: businessId, nombre: 'Tomate', unidad_medida: 'kg', stock_actual: 5.5, stock_minimo: 1.0, es_producto_final: false, precio_venta: 0 },
    { business_id: businessId, nombre: 'Lechuga', unidad_medida: 'pz', stock_actual: 5, stock_minimo: 2, es_producto_final: false, precio_venta: 0 },
    { business_id: businessId, nombre: 'Papas Fritas Congeladas', unidad_medida: 'kg', stock_actual: 1.5, stock_minimo: 5, es_producto_final: false, precio_venta: 0 },
  ];
  
  const { data: ingData, error: ingError } = await supabase.from('products').insert(ingredients).select();
  if (ingError) throw new Error(ingError.message);
  
  // 2. Create products (final recipes)
  const recipes = [
    { business_id: businessId, nombre: 'Hamburguesa Clásica', unidad_medida: 'pz', stock_actual: 0, stock_minimo: 0, es_producto_final: true, precio_venta: 120 },
    { business_id: businessId, nombre: 'Hamburguesa con Queso', unidad_medida: 'pz', stock_actual: 0, stock_minimo: 0, es_producto_final: true, precio_venta: 140 },
    { business_id: businessId, nombre: 'Papas Fritas', unidad_medida: 'pz', stock_actual: 0, stock_minimo: 0, es_producto_final: true, precio_venta: 50 },
  ];
  
  const { data: recData, error: recError } = await supabase.from('products').insert(recipes).select();
  if (recError) throw new Error(recError.message);
  
  const pan = ingData.find(i => i.nombre === 'Pan de Hamburguesa')!;
  const carne = ingData.find(i => i.nombre === 'Carne de Res (150g)')!;
  const queso = ingData.find(i => i.nombre === 'Queso Cheddar')!;
  const tomate = ingData.find(i => i.nombre === 'Tomate')!;
  const papasFritas = ingData.find(i => i.nombre === 'Papas Fritas Congeladas')!;
  
  const burgerClasica = recData.find(r => r.nombre === 'Hamburguesa Clásica')!;
  const burgerQueso = recData.find(r => r.nombre === 'Hamburguesa con Queso')!;
  const papasFin = recData.find(r => r.nombre === 'Papas Fritas')!;
  
  // 3. Create Dependencies
  const dependencies = [
    { product_id: burgerClasica.id, ingredient_id: pan.id, cantidad_necesaria: 1 },
    { product_id: burgerClasica.id, ingredient_id: carne.id, cantidad_necesaria: 1 },
    { product_id: burgerClasica.id, ingredient_id: tomate.id, cantidad_necesaria: 0.1 },
    { product_id: burgerQueso.id, ingredient_id: pan.id, cantidad_necesaria: 1 },
    { product_id: burgerQueso.id, ingredient_id: carne.id, cantidad_necesaria: 1 },
    { product_id: burgerQueso.id, ingredient_id: queso.id, cantidad_necesaria: 2 },
    { product_id: papasFin.id, ingredient_id: papasFritas.id, cantidad_necesaria: 0.25 },
  ];
  const { error: depErr } = await supabase.from('product_dependencies').insert(dependencies);
  if (depErr) throw new Error(depErr.message);
  
  // 4. Create some recent orders
  const { data: orderData, error: orderErr } = await supabase.from('orders').insert([{
    business_id: businessId,
    estado: 'completada',
    total: 310
  }]).select().single();
  
  if (orderData && !orderErr) {
     await supabase.from('order_items').insert([
       { order_id: orderData.id, product_id: burgerQueso.id, cantidad: 2, precio_unitario: 140 },
       { order_id: orderData.id, product_id: papasFin.id, cantidad: 1, precio_unitario: 50 },
     ]);
  }

  // 5. Generate historical transactions
  const txs = [];
  for(let i=0; i<7; i++) {
     const d = new Date();
     d.setDate(d.getDate() - i - 1);
     txs.push({
       business_id: businessId,
       product_id: carne.id,
       tipo: 'salida',
       cantidad: 5,
       motivo: 'venta',
       created_at: d.toISOString()
     });
     txs.push({
       business_id: businessId,
       product_id: queso.id,
       tipo: 'salida',
       cantidad: 10,
       motivo: 'venta',
       created_at: d.toISOString()
     });
  }
  const dmerma = new Date();
  dmerma.setDate(dmerma.getDate() - 2);
  txs.push({
       business_id: businessId,
       product_id: tomate.id,
       tipo: 'salida',
       cantidad: 0.5,
       motivo: 'desperdicio',
       created_at: dmerma.toISOString()
  });

  const { error: txErr } = await supabase.from('inventory_transactions').insert(txs);
  if (txErr) throw new Error(txErr.message);

  return true;
}
