# Estado de Implementación - Gloto

Este documento resume todas las funcionalidades, componentes y arquitectura que ya se encuentran implementados en el sistema **Gloto**.

## 1. Arquitectura de Base de Datos y Backend (Supabase / PostgreSQL)

Se ha diseñado e implementado una arquitectura **Multi-tenant** (SaaS) que permite manejar múltiples negocios independientes en la misma base de datos de manera segura.

*   **Tablas Implementadas**:
    *   `business_profiles`: Almacena la configuración de cada restaurante (nombre, slug/URL, logo, colores de marca).
    *   `products`: Repositorio unificado para productos a la venta y materias primas (ingredientes).
    *   `product_dependencies`: Tabla lógica (BOM - Bill of Materials / Recetas) que define cuánta cantidad de cada ingrediente consume un producto final.
    *   `inventory_transactions`: Historial de movimientos de inventario (entradas, salidas, ventas, desperdicios).
    *   `orders` y `order_items`: Registro de ventas y pedidos realizados desde la página pública.
*   **Lógica de Negocio Automática (Triggers)**:
    *   `process_sale_inventory()`: Un function/trigger de PostgreSQL que, cada vez que se inserta un nuevo pedido, busca automáticamente la receta del producto y resta la cantidad exacta de ingredientes del stock en tiempo real.
*   **Seguridad (RLS - Row Level Security)**:
    *   Políticas estrictas configuradas para asegurar que el dueño de un restaurante solo pueda ver, crear o editar los datos (productos, inventario, ventas) que pertenezcan a su propio `business_id`.
*   **Validaciones Nativas**:
    *   Función `is_slug_available()` para asegurar que las URLs públicas de cada negocio no se repitan.
    *   Vista (View) `low_stock_alerts` para consultar rápidamente qué ingredientes están por debajo de su punto de reorden.

## 2. Autenticación y Landing Page (Frontend)

*   **Página de Aterrizaje (Landing Page)**:
    *   Diseño moderno enfocado en conversiones usando Tailwind CSS y animaciones con Framer Motion (`motion/react`).
    *   Componentes aislados (`Navbar`, `Hero`, `Features`).
*   **Autenticación**:
    *   Integración completa con **Supabase Auth** (Email y Contraseña).
    *   Componente `AuthModal` con flujos de Inicio de Sesión y Registro. Redirección automática al `/dashboard` tras el éxito.

## 3. Panel de Administración (Dashboard)

Panel protegido para los dueños de los restaurantes para gestionar su operación.

*   **Layout del Dashboard**: 
    *   Barra de navegación lateral responsiva (Sidebar).
*   **Configuración del Perfil (Settings)**:
    *   Configuración general del negocio (Nombre).
    *   Personalización de URL pública (Slug).
    *   Selección de Identidad Visual (Color Picker para colores de marca).
    *   Subida de Logo integrada con Supabase Storage (`business_assets`).
*   **Gestor de Inventario**:
    *   Página para crear, leer, actualizar materias primas.
    *   Definición de stock actual y stock mínimo de seguridad.
    *   Indicadores visuales en rojo cuando el stock está bajo el límite.
*   **Creador de Recetas y Menú**:
    *   Interfaz a doble columna.
    *   Izquierda: Gestión de Platos Finales (lista y creación).
    *   Derecha: Constructor de recetas interactivo. Permite agregar filas dinámicamente seleccionando el ingrediente necesario y estipulando la cantidad a consumir.

## 4. Página Pública de Pedidos (El Restaurante del Cliente)

*   **Generador Dinámico por URL**:
    *   Ruta dinámica `app/[slug]/page.tsx` que renderiza el restaurante correcto en base a su URL personalizada.
*   **Estilos Dinámicos**:
    *   La UI inyecta en tiempo de ejecución el color primario y el logo que el administrador configuró en el dashboard. Los botones, acentos e iconos reflejan la marca elegida.
*   **Catálogo interactivo**:
    *   Carga automática del menú habilitado del restaurante.
*   **Carrito de Compras (Cart)**:
    *   Drawer lateral animado manejando el estado del pedido actual.
    *   Cálculo de totales en tiempo real.
    *   Botón flotante en versión móvil.
*   **Checkout y Conexión Backend**:
    *   Al "Confirmar Pedido", se conecta directamente con Supabase para insertar las tablas de `orders` y `order_items`.
    *   Esto activa inmediatamente los Triggers SQL, que descuentan de manera automática las materias primas utilizadas de acuerdo al recetario.

## 5. API Client (Capa de Acceso a Datos)
*   **`lib/api.ts`**: Repositorio central de funciones abstractas para comunicarse con Supabase. Implementa todas las consultas asegurando que el identificador del usuario se traduzca correctamente a su negocio (obtención del `business_id` en cada petición de escritura/lectura protegida).
