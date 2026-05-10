export type UnitType = 'gr' | 'unidad' | 'ml';

export interface BusinessProfile {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  banner_url: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  business_id: string;
  nombre: string;
  descripcion: string;
  unidad_medida: UnitType;
  precio_venta: number | null;
  es_producto_final: boolean;
  stock_actual: number;
  stock_minimo: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductDependency {
  id?: string;
  product_id: string;
  ingredient_id: string;
  cantidad_necesaria: number;
  ingredient?: Product; // For joining in queries
}

export type TransactionType = 'entrada' | 'salida';
export type TransactionReason = 'venta' | 'compra' | 'desperdicio' | 'ajuste' | 'producto_vencido' | 'error_cocina' | 'robo_perdida';

export interface InventoryTransaction {
  id: string;
  business_id: string;
  product_id: string;
  tipo: TransactionType;
  cantidad: number;
  motivo: TransactionReason;
  created_at: string;
  product?: Product; // Relation for UI
}

export interface Order {
  id: string;
  business_id: string;
  total: number;
  estado: string; // 'pendiente' | 'preparando' | 'completada'
  created_at: string;
  items?: OrderItem[]; // Added for UI
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  cantidad: number;
  precio_unitario: number;
  product?: Product; // Added for UI
}
