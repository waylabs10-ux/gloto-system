-- ==========================================
-- ESQUEMA DE BASE DE DATOS 'GLOTO' (V2 Multi-tenant)
-- ==========================================

-- 1. TIPOS DE DATOS (ENUMS)
CREATE TYPE unit_type AS ENUM ('gr', 'unidad', 'ml');
CREATE TYPE transaction_type AS ENUM ('entrada', 'salida');
CREATE TYPE transaction_reason AS ENUM ('venta', 'compra', 'desperdicio', 'ajuste', 'producto_vencido', 'error_cocina', 'robo_perdida');

-- ==========================================
-- 2. TABLAS
-- ==========================================

-- NUEVA TABLA: business_profiles
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#ea580c', -- Naranja por defecto
  banner_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad_medida unit_type NOT NULL,
  precio_venta NUMERIC(10, 2),
  es_producto_final BOOLEAN DEFAULT false,
  stock_actual NUMERIC(10, 2) DEFAULT 0,
  stock_minimo NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: product_dependencies (BOM)
CREATE TABLE product_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  cantidad_necesaria NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Evitar dependencias duplicadas del mismo ingrediente para un producto
  UNIQUE(product_id, ingredient_id)
);

-- TABLA: inventory_transactions
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tipo transaction_type NOT NULL,
  cantidad NUMERIC(10, 2) NOT NULL,
  motivo transaction_reason NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  total NUMERIC(10, 2) DEFAULT 0,
  estado TEXT DEFAULT 'completada',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: order_items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. SEGURIDAD A NIVEL DE FILA (RLS) Multi-tenant
-- ==========================================

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para business_profiles (El dueño puede leer/escribir; Todos pueden leer)
CREATE POLICY "Dueños pueden gestionar su negocio" 
  ON business_profiles FOR ALL TO authenticated 
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Cualquiera puede leer perfiles (para la web de pedidos)" 
  ON business_profiles FOR SELECT TO public 
  USING (is_active = true);

-- Función helper para obtener el/los negocios del usuario
CREATE OR REPLACE FUNCTION user_businesses() RETURNS SETOF UUID AS $$
  SELECT id FROM business_profiles WHERE owner_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Políticas Multi-tenant: Solo ver/editar los registros del propio negocio
CREATE POLICY "CRUD products por negocio" 
  ON products FOR ALL TO authenticated 
  USING (business_id IN (SELECT user_businesses())) 
  WITH CHECK (business_id IN (SELECT user_businesses()));

CREATE POLICY "Lectura pública de productos (para web de pedidos final)"
  ON products FOR SELECT TO public
  USING (es_producto_final = true);

CREATE POLICY "CRUD product_dependencies por negocio" 
  ON product_dependencies FOR ALL TO authenticated 
  USING (product_id IN (SELECT id FROM products WHERE business_id IN (SELECT user_businesses()))) 
  WITH CHECK (product_id IN (SELECT id FROM products WHERE business_id IN (SELECT user_businesses())));

CREATE POLICY "CRUD inventory_transactions por negocio" 
  ON inventory_transactions FOR ALL TO authenticated 
  USING (business_id IN (SELECT user_businesses())) 
  WITH CHECK (business_id IN (SELECT user_businesses()));

CREATE POLICY "Lectura orders propias o admin" 
  ON orders FOR ALL TO authenticated 
  USING (business_id IN (SELECT user_businesses())) 
  WITH CHECK (business_id IN (SELECT user_businesses()));

-- Inserción de órdenes pública (si la página de pedidos no requiere auth de clientes)
CREATE POLICY "Creación pública de orders"
  ON orders FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "CRUD order_items por negocio o publica en creación" 
  ON order_items FOR ALL TO authenticated 
  USING (order_id IN (SELECT id FROM orders WHERE business_id IN (SELECT user_businesses()))) 
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE business_id IN (SELECT user_businesses())));

CREATE POLICY "Creación pública de order_items"
  ON order_items FOR INSERT TO public
  WITH CHECK (true);
  
-- ==========================================
-- 4. FUNCIONES Y TRIGGERS (LÓGICA DE NEGOCIO)
-- ==========================================

-- Función para actualizar el stock y registrar transacciones automáticamente
CREATE OR REPLACE FUNCTION process_sale_inventory()
RETURNS TRIGGER AS $$
DECLARE
  dependency RECORD;
  has_dependencies BOOLEAN := false;
  v_business_id UUID;
BEGIN
  -- Obtener el negocio del pedido
  SELECT business_id INTO v_business_id FROM orders WHERE id = NEW.order_id;

  -- Buscar si el producto vendido tiene ingredientes (dependencias)
  FOR dependency IN 
    SELECT ingredient_id, cantidad_necesaria 
    FROM product_dependencies 
    WHERE product_id = NEW.product_id
  LOOP
    has_dependencies := true;
    
    -- 1. Restar el stock del ingrediente
    UPDATE products 
    SET stock_actual = stock_actual - (dependency.cantidad_necesaria * NEW.cantidad)
    WHERE id = dependency.ingredient_id;

    -- 2. Registrar el movimiento de salida en el historial para el ingrediente
    INSERT INTO inventory_transactions (business_id, product_id, tipo, cantidad, motivo)
    VALUES (v_business_id, dependency.ingredient_id, 'salida', dependency.cantidad_necesaria * NEW.cantidad, 'venta');
  END LOOP;

  -- Si el producto NO tiene dependencias (se vende directo), rebajamos su propio stock
  IF NOT has_dependencies THEN
    UPDATE products 
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id = NEW.product_id;
    
    INSERT INTO inventory_transactions (business_id, product_id, tipo, cantidad, motivo)
    VALUES (v_business_id, NEW.product_id, 'salida', NEW.cantidad, 'venta');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se dispara después de insertar un item en una orden
CREATE TRIGGER on_order_item_inserted
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION process_sale_inventory();

-- Función para validar slug único (es llamado desde el frontend)
CREATE OR REPLACE FUNCTION is_slug_available(new_slug TEXT, current_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  exists_count INT;
BEGIN
  IF current_id IS NULL THEN
    SELECT count(*) INTO exists_count FROM business_profiles WHERE slug = new_slug;
  ELSE
    SELECT count(*) INTO exists_count FROM business_profiles WHERE slug = new_slug AND id != current_id;
  END IF;
  
  RETURN exists_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. VISTAS (VIEWS) Multi-Tenant
-- ==========================================

-- Vista para identificar ingredientes que están por debajo del stock mínimo
CREATE OR REPLACE VIEW low_stock_alerts AS
SELECT 
  id, 
  business_id,
  nombre, 
  unidad_medida, 
  stock_actual, 
  stock_minimo 
FROM products 
WHERE stock_actual <= stock_minimo 
  AND es_producto_final = false;

-- Función para registrar una transacción manual de inventario (Entrada/Salida) y actualizar el stock
CREATE OR REPLACE FUNCTION register_inventory_movement(
  p_business_id UUID,
  p_product_id UUID,
  p_tipo transaction_type,
  p_cantidad NUMERIC,
  p_motivo transaction_reason
) RETURNS void AS $$
DECLARE
  v_current_stock NUMERIC;
BEGIN
  -- Verify business matches the user context implicitly
  IF p_business_id NOT IN (SELECT user_businesses()) THEN
    RAISE EXCEPTION 'No autorizado para este negocio';
  END IF;

  -- Get current stock
  SELECT stock_actual INTO v_current_stock FROM products WHERE id = p_product_id AND business_id = p_business_id;
  
  IF p_tipo = 'entrada' THEN
    UPDATE products SET stock_actual = COALESCE(stock_actual, 0) + p_cantidad WHERE id = p_product_id AND business_id = p_business_id;
  ELSIF p_tipo = 'salida' THEN
    UPDATE products SET stock_actual = COALESCE(stock_actual, 0) - p_cantidad WHERE id = p_product_id AND business_id = p_business_id;
  END IF;

  -- Insert history
  INSERT INTO inventory_transactions (business_id, product_id, tipo, cantidad, motivo)
  VALUES (p_business_id, p_product_id, p_tipo, p_cantidad, p_motivo);
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
