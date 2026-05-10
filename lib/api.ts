import { supabase } from './supabase';
import { Product, ProductDependency, BusinessProfile } from '@/types/database';

// --- BUSINESS PROFILES ---

export async function getMyBusiness() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
    throw error;
  }
  return data as BusinessProfile | null;
}

export async function getBusinessBySlug(slug: string) {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data as BusinessProfile;
}

export async function saveBusinessProfile(profile: Partial<BusinessProfile>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Check if exists
  const existing = await getMyBusiness();
  
  if (existing) {
    const { data, error } = await supabase
      .from('business_profiles')
      .update(profile)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as BusinessProfile;
  } else {
    const { data, error } = await supabase
      .from('business_profiles')
      .insert([{ ...profile, owner_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    return data as BusinessProfile;
  }
}

export async function checkSlug(slug: string, currentId?: string) {
  const { data, error } = await supabase.rpc('is_slug_available', {
    new_slug: slug,
    current_id: currentId || null
  });
  if (error) throw error;
  return data as boolean;
}

export async function getPublicProductsByBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .eq('es_producto_final', true)
    .order('nombre');
    
  if (error) throw error;
  return data as Product[];
}

export async function createPublicOrder(businessId: string, total: number, items: {product_id: string, cantidad: number, precio: number}[]) {
  // RPC or sequence of inserts
  // Since RLS allows insert to public, we can insert order, then items
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert([{ business_id: businessId, total, estado: 'pendiente' }])
    .select()
    .single();
    
  if (orderErr) throw orderErr;
  
  if (items.length > 0) {
    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio
      })));
      
    if (itemsErr) throw itemsErr;
  }
  
  return order;
}

// --- INVENTORY (Products that are not final) ---

export async function fetchInventory() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('es_producto_final', false)
    .order('nombre');
  
  if (error) throw error;
  return data as Product[];
}

export async function addInventoryItem(item: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'es_producto_final' | 'business_id'>) {
  const business = await getMyBusiness();
  if (!business) throw new Error("Debes configurar tu negocio primero");
  
  const { data, error } = await supabase
    .from('products')
    .insert([{ ...item, business_id: business.id, es_producto_final: false }])
    .select()
    .single();
    
  if (error) throw error;
  return data as Product;
}

export async function updateInventoryItem(id: string, item: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(item)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as Product;
}

// --- RECIPES (Final Products) ---

export async function fetchRecipes() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('es_producto_final', true)
    .order('nombre');
    
  if (error) throw error;
  return data as Product[];
}

export async function addRecipe(recipe: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'es_producto_final' | 'business_id'>) {
  const business = await getMyBusiness();
  if (!business) throw new Error("Debes configurar tu negocio primero");

  const { data, error } = await supabase
    .from('products')
    .insert([{ ...recipe, business_id: business.id, es_producto_final: true }])
    .select()
    .single();
    
  if (error) throw error;
  return data as Product;
}

export async function updateRecipe(id: string, recipe: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(recipe)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as Product;
}

// --- DEPENDENCIES (BOM) ---

export async function fetchProductDependencies(productId: string) {
  const { data, error } = await supabase
    .from('product_dependencies')
    .select(`
      id,
      product_id,
      ingredient_id,
      cantidad_necesaria,
      ingredient:products!product_dependencies_ingredient_id_fkey(*)
    `)
    .eq('product_id', productId);
    
  if (error) throw error;
  return data as unknown as ProductDependency[];
}

export async function saveProductDependencies(productId: string, dependencies: Omit<ProductDependency, 'id' | 'ingredient'>[]) {
  // First, delete existing dependencies
  const { error: deleteError } = await supabase
    .from('product_dependencies')
    .delete()
    .eq('product_id', productId);
    
  if (deleteError) throw deleteError;

  if (dependencies.length === 0) return [];

  // Then add the new ones
  const { data, error: insertError } = await supabase
    .from('product_dependencies')
    .insert(dependencies.map(d => ({
      product_id: productId,
      ingredient_id: d.ingredient_id,
      cantidad_necesaria: d.cantidad_necesaria
    })))
    .select();

  if (insertError) throw insertError;
  return data as ProductDependency[];
}

// --- INVENTORY MOVEMENTS ---

export async function fetchInventoryTransactions(businessId: string) {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select(`
      *,
      product:products(*)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
}

export async function registerInventoryMovement(
  productId: string, 
  tipo: string, 
  cantidad: number, 
  motivo: string
) {
  const business = await getMyBusiness();
  if (!business) throw new Error("Debes configurar tu negocio primero");

  const { error } = await supabase.rpc('register_inventory_movement', {
    p_business_id: business.id,
    p_product_id: productId,
    p_tipo: tipo,
    p_cantidad: cantidad,
    p_motivo: motivo
  });

  if (error) throw error;
}

// --- ORDERS & KDS ---

export async function fetchTodayOrders(businessId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('business_id', businessId)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ estado: status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
