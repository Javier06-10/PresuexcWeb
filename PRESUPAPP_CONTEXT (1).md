# PresupApp — Contexto Completo para Claude Code

## Proyecto Supabase
- **Project ID**: `gyewwlnvbjbibeyvjqhx`
- **URL**: `https://gyewwlnvbjbibeyvjqhx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZXd3bG52YmpiaWJleXZqcWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODUwNTUsImV4cCI6MjA5NDk2MTA1NX0.W9GwoEvqCUTFIwIq6IAcRlnPLVQoolcxuldVHs1iGEQ`
- **Publishable Key**: `sb_publishable_JmcwfyeIszplpgOfylU8fw_rDRGCqv4`
- **Region**: us-east-2

---

## Qué es PresupApp
SaaS multi-tenant de presupuestos de construcción para República Dominicana y LATAM.
Los ingenieros civiles crean presupuestos con APUs (Análisis de Precios Unitarios) del catálogo
ConstruCosto MAR25, con precios de materiales, mano de obra y equipos actualizados.

---

## Stack recomendado para el Frontend
- **React 18 + Vite** (o Next.js 14 App Router)
- **Tailwind CSS + Shadcn/ui**
- **Supabase JS client** (`@supabase/supabase-js`)
- **React Query / TanStack Query** para server state
- **React Hook Form + Zod** para formularios
- **Recharts** para gráficas de presupuesto

---

## Arquitectura Multi-tenant
Cada usuario pertenece a una o más **organizaciones** (empresa constructora).
El `organization_id` es el tenant — todos los datos se filtran por él.
Row Level Security (RLS) está habilitado en todas las tablas sensibles.

**Flujo de autenticación:**
1. Login con Supabase Auth (email/password)
2. Al hacer login → `get_my_organizations()` → elegir org activa
3. Guardar `organization_id` activo en contexto global
4. Todas las queries llevan el `organization_id` del contexto

---

## Base de Datos — 48 tablas

### Tenancy y Auth
| Tabla | Descripción |
|---|---|
| `plans` | free / starter($29) / pro($79) / enterprise($299) |
| `organizations` | Empresa constructora (tenant principal) |
| `org_members` | Usuarios de una org con rol (owner/admin/member) |
| `user_profiles` | Perfil extendido del usuario, incluye `default_organization_id` |
| `invitations` | Invitaciones pendientes por token |
| `subscriptions` | Suscripción activa de una org |

### Catálogo Global (organization_id = NULL)
| Tabla | Registros | Descripción |
|---|---|---|
| `catalog_sections` | 138 | Secciones de catálogo por tipo (material/labor/equipment/apu) |
| `materials` | 1,371 | Materiales e insumos (código MAT-00001…MAT-01371) |
| `labor_categories` | 7 | Jornales: MA/T1/T2/T3/AY/TC/PE |
| `labor_activities` | 624 | Actividades de mano de obra (código entero ej: 10001, 20002) |
| `equipment` | 36 | Equipos (código entero ej: 10001, 10002) |
| `units` | 46 | Unidades de medida (M3, M2, ML, QQ, LB, UND, PA...) |
| `price_lists` | 2 | CONSTRUCOSTO_MAR25_SDQ, CONSTRUCOSTO_MAR25_PUJ |
| `resource_prices` | 1,993 | Precios globales: 1,371 mat + 579 MO + 36 equip + 7 jornales |
| `apu_templates` | 458 | APUs: 445 estáticos + 13 paramétricos (del PRESUXCEL) |
| `concrete_mixes` | 11 | Dosificaciones de hormigón (Método Fuller) |
| `heavy_equipment` | 9 | Maquinaria pesada con rendimientos por trabajo |

### Proyectos y Presupuestos (por tenant)
| Tabla | Descripción |
|---|---|
| `clients` | Clientes de la empresa |
| `projects` | Proyectos de construcción |
| `budgets` | Presupuestos (versión 0 = borrador) |
| `budget_levels` | Niveles del presupuesto (Primer Nivel, Segundo Nivel, Exteriores...) |
| `budget_chapters` | Capítulos dentro de un nivel (I. Preliminares, II. HA, III. Mamp...) |
| `budget_items` | Partidas individuales con qty, unit_price, total, apu_snapshot |
| `budget_versions` | Versiones aprobadas del presupuesto |

### Compras y Ejecución
| Tabla | Descripción |
|---|---|
| `suppliers` | Proveedores |
| `purchase_orders` | Órdenes de compra |
| `purchase_order_items` | Ítems de cada orden |
| `goods_receipts` | Recepciones de mercancía |
| `work_progress` | Avance de obra por partida |
| `cost_actuals` | Costos reales vs presupuestados |
| `subcontractors` | Subcontratistas |
| `subcontracts` | Contratos con subcontratistas |

### Configuración
| Tabla | Descripción |
|---|---|
| `countries` | 18 países (DO + LATAM + ES + US) |
| `regions` | Regiones (SDQ, PUJ, STI, MAC) |
| `tax_rules` | 28 reglas tributarias (ITBIS, AFP, SFS, IVA por país) |
| `payment_terms` | 10 términos de pago |
| `exchange_rates` | Tasas de cambio |
| `indirect_costs` | Costos indirectos del presupuesto (CODIA, dirección técnica...) |

---

## Funciones RPC disponibles (Supabase)
```sql
-- Organizaciones
get_my_organizations()                      -- orgs del usuario autenticado
create_organization(name, slug, country, plan_code, tax_id, industry)
switch_default_organization(org_id)
get_org_usage(org_id)                       -- {limits, usage, remaining}
accept_invitation(token)

-- Precios
resolve_price(resource_type, resource_id, organization_id, region_code, supplier_id, date)
resolve_prices_bulk(resource_type, resource_ids[], organization_id, region_code, date)
recalculate_budget_item(item_id)
```

---

## APU Templates — Estructura JSONB

### APU Estático (type = 'static')
```json
{
  "source_meta": {
    "excel_row": 1655,
    "materials": [...],
    "labor": [...]
  },
  "subtotal": 49234.50,
  "total_unit": 52000.00,
  "itbis": 2765.50
}
```

### APU Paramétrico (type = 'parametric')
```json
{
  "parameters": [
    {"key": "ancho_m",     "label": "B - Ancho",     "default": 0.25, "unit": "m"},
    {"key": "alto_m",      "label": "H - Alto",      "default": 0.25, "unit": "m"},
    {"key": "largo_m",     "label": "Longitud",      "default": 3.0,  "unit": "m"},
    {"key": "recubrimiento_cm", "label": "Recubrimiento", "default": 4, "unit": "cm"},
    {"key": "sep_estribos_cm",  "label": "Sep. estribos",  "default": 15, "unit": "cm"},
    {"key": "imprevistos_pct",  "label": "Imprevistos",    "default": 5,  "unit": "%"}
  ],
  "formulas": {
    "materiales": [
      {
        "item": 1.01,
        "description": "Acero longitudinal principal",
        "unit": "qq",
        "qty_por_m3": 3.288,
        "factor": 1.07,
        "price_ref": 3550,
        "notas": "Factor 7% desperdicio corte"
      }
    ],
    "mano_obra": [
      {
        "item": 2.01,
        "description": "COLOCACIÓN DE HORMIGÓN",
        "unit": "ml",
        "qty_formula": "1/(ancho_m*alto_m)",
        "factor": 1.10,
        "price_ref": 300,
        "notas": "ml de columna por m3"
      }
    ],
    "imprevistos_pct": 5,
    "costo_ejemplo_m3": 59484.95
  }
}
```

### APU de Preliminares (type = 'parametric', equipo pesado)
```json
{
  "parameters": [
    {"key": "area_m2",       "label": "Área del terreno",  "default": 350, "unit": "m2"},
    {"key": "espesor_m",     "label": "Espesor capa",      "default": 0.2, "unit": "m"},
    {"key": "esponj_pct",    "label": "Factor esponj.",    "default": 30,  "unit": "%"},
    {"key": "cap_camion_m3", "label": "Cap. camión",       "default": 18,  "unit": "m3"},
    {"key": "rend_m3hr",     "label": "Rendimiento equipo","default": 45,  "unit": "m3/hr"}
  ],
  "formulas": {
    "formulas_calculo": {
      "vol_basico_m3":   "area_m2 * espesor_m",
      "vol_total_m3":    "vol_basico_m3 + vol_basico_m3*(esponj_pct/100)",
      "viajes_camion":   "CEIL(vol_total_m3 / cap_camion_m3)",
      "horas_maquina":   "vol_basico_m3 / rend_m3hr",
      "dias_ayudante":   "horas_maquina / 8"
    },
    "suministro": [...],
    "mano_obra": [...]
  }
}
```

---

## APUs Paramétricos disponibles (13 total)
| Nombre | Sección | Parámetros clave |
|---|---|---|
| ZAPATA DE MURO | Fundaciones | B, H, largo, recubrimiento, estribos |
| ZAPATA DE COLUMNA | Fundaciones | B, H, espesor, sep X/Y, recubrimiento |
| PLATEA DE FUNDACIÓN | Fundaciones | área, espesor, sep inf/sup X/Y |
| COLUMNA | Columnas HA | B, H, largo, cantidad, estribos |
| VIGA | Vigas HA | B, H, largo, estribos |
| LOSA MACIZA | Losas macizas | espesor, área, sep X/Y, temp |
| LOSA ALIGERADA | Losas aligeradas | espesor, área, sep nervios |
| MURO DE BLOQUES | Muros bloques | tamaño bloque, sep bastones |
| TORTA HA | Pisos HA | espesor, área, tipo malla |
| PAÑETE | Empañetes | espesor, área, dosificación |
| SUMINISTRO Y COLOCACIÓN PISO | Pisos | tipo piso, área |
| PINTURA GENERAL | Pinturas | tipo, área, manos |
| PARED EN SHEETROCK | Construcción ligera | tipo panel, área, alto |
| EXTRACCIÓN CAPA VEGETAL | Preliminares | área, espesor, rendimiento equipo |
| EXCAVACIÓN EN TIERRA | Preliminares | área, profundidad, rendimiento |
| RELLENO COMPACTADO | Preliminares | área, espesor, 3 rendimientos |
| CHARRANCHA Y REPLANTEO | Preliminares | long muros, precio MO |

---

## Lógica de cálculo de un ítem de APU
```
// Para APU estático:
total_item = unit_price × quantity

// Para APU paramétrico, cada ítem de material:
valor = (qty_por_m3 × volumen_m3) × factor × precio_unitario

// Para MO con qty_formula:
qty = eval(qty_formula, parametros)   // ej: 1/(0.25*0.25) = 16 ml/m3
valor = qty × volumen × factor × precio_unitario

// Para APU de preliminares:
// 1. Evaluar formulas_calculo con los parámetros del usuario
// 2. Sustituir qty_formula en cada ítem de suministro/MO
// 3. Multiplicar qty × factor × price_ref

// Costo total APU:
subtotal_materiales = Σ(valor de cada material)
subtotal_mo = Σ(valor de cada MO)
imprevistos = (subtotal_mat + subtotal_mo) × imprevistos_pct / 100
total_apu = subtotal_mat + subtotal_mo + imprevistos
```

---

## Flujo principal de creación de presupuesto
```
Proyecto → Crear Presupuesto → Agregar Niveles → Agregar Capítulos → Agregar Partidas

Partida:
  - Buscar APU en catálogo (estático o paramétrico)
  - Si paramétrico: usuario llena parámetros → sistema calcula materiales/MO
  - El sistema resuelve el precio actual con resolve_price()
  - Se crea budget_item con apu_snapshot (inmutable)

Al aprobar presupuesto:
  - Se congela apu_snapshot → precio no cambia aunque cambien los catálogos
```

---

## Usuarios reales en la DB
```
javierfavian055@gmail.com — Javier Amauiris Fabián, Ing. Civil
  Plan: Enterprise (ilimitado)
  Orgs: "Ing guirado" (owner, default) + "Ing guirado Srl" (owner)
  Datos: 20 proyectos, 20 presupuestos, 120 budget_items

abimaelguirado@gmail.com — Abimael Guirado, Ing. Civil  
  Plan: Enterprise
  Orgs: "Ing guirado Srl" (admin, default)
```

---

## Límites por plan
| Plan | Orgs | Proyectos | Usuarios | Presupuestos | APUs propios |
|---|---|---|---|---|---|
| free | 1 | 1 | 2 | 3 | 50 |
| starter $29 | 3 | 5 | 5 | 50 | 500 |
| pro $79 | 10 | 25 | 15 | 500 | 5,000 |
| enterprise $299 | ∞ | ∞ | ∞ | ∞ | ∞ |

---

## Pantallas a construir (prioridad)
1. **Auth** — Login / Register / Forgot password (Supabase Auth UI)
2. **Onboarding** — Crear primera organización
3. **Dashboard** — Proyectos recientes, KPIs, acceso rápido
4. **Proyectos** — Lista, crear, editar
5. **Presupuesto** — Vista principal (árbol: Nivel → Capítulo → Partida)
6. **APU Selector** — Buscar en catálogo, previsualizar, insertar partida
7. **APU Paramétrico** — Formulario de parámetros → cálculo en tiempo real
8. **Catálogo** — Materiales, MO, equipos con precios
9. **Configuración** — Organización, miembros, plan
10. **PDF Export** — Exportar presupuesto en formato profesional

---

## Ejemplo de presupuesto real (Plaza Issa — Javier)
- Cliente: Yaniret Álvarez
- Fecha: 03/03/2025
- Total Gastos Directos: RD$ 10,867,325.54
- Gastos Indirectos (11.2%): RD$ 1,217,140.46
- ITBIS 18% sobre 10%: RD$ 217,520.39
- **TOTAL GENERAL: RD$ 12,301,986.39**

Estructura:
- Primer Nivel (RD$ 5,695,721.77): I-Preliminares, II-HA, III-Mampostería, IV-Terminaciones, V-Revestimiento, VI-Sanitarias, VII-Eléctricas, VIII-Pintura, IX-Puertas/Ventanas, X-Misceláneos
- Segundo Nivel (RD$ 4,724,872.07): XI-HA, XII-Mampostería, XIII-Revestimiento...
- Exteriores (RD$ 446,731.71): XXI-Misceláneos, XXII-Techo, XXIII-Sanitarias, XXIV-Cámara Séptica

---

## Variables de entorno necesarias para el frontend
```env
VITE_SUPABASE_URL=https://gyewwlnvbjbibeyvjqhx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZXd3bG52YmpiaWJleXZqcWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODUwNTUsImV4cCI6MjA5NDk2MTA1NX0.W9GwoEvqCUTFIwIq6IAcRlnPLVQoolcxuldVHs1iGEQ
```

---

## Notas importantes para el desarrollo
1. **Moneda**: RD$ (pesos dominicanos). Formatear con `Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'})`
2. **Factores de desperdicio**: Cada ítem de material tiene `factor` (1.07–1.15). El cálculo es `qty × factor × precio`.
3. **apu_snapshot**: Al crear una partida se guarda una copia del APU. Los precios históricos son inmutables.
4. **resolve_price()**: Siempre usar esta función para obtener el precio actual de un recurso. Respeta overrides del tenant.
5. **Multi-org**: El usuario puede cambiar de org activa. Refrescar todos los queries al cambiar.
6. **Códigos**: materials=MAT-00001, labor_activities=entero (10001), equipment=entero (10001)
7. **RLS activo**: El backend filtra automáticamente por `auth.uid()`. El frontend solo necesita pasar el token.
8. **Gastos indirectos**: Van al nivel de presupuesto, no al APU. CODIA 0.2% + Dir. técnica 10% + Ayudantes 1% = 11.2% típico.


---

## Tabla steel_bars — Referencia de pesos de barra

El usuario NUNCA ingresa "barras por quintal". Solo elige el diámetro.
El sistema busca `kg_por_m` en esta tabla y calcula:

```
qq = (longitud_total_m × kg_por_m) / 46.026
```

| Diámetro | mm    | área cm² | kg/m  | m/qq  |
|----------|-------|----------|-------|-------|
| 3/8"     | 9.525 | 0.71     | 0.560 | 82.19 |
| 1/2"     | 12.70 | 1.27     | 0.994 | 46.30 |
| 5/8"     | 15.88 | 1.98     | 1.552 | 29.66 |
| 3/4"     | 19.05 | 2.87     | 2.235 | 20.59 |
| 7/8"     | 22.23 | 3.87     | 3.042 | 15.13 |
| 1"       | 25.40 | 5.07     | 3.973 | 11.58 |
| 1-3/8"   | 34.93 | 9.58     | 7.907 |  5.82 |

## Lógica de cálculo de acero (IMPORTANTE para frontend)

En el selector de diámetro el usuario elige del dropdown `steel_bars`.
El campo `diam_xxx_kgm` del APU se puebla automáticamente con el `kg_por_m` seleccionado.

Ejemplo COLUMNA 0.25×0.25, L=3m, 4 barras 1/2", estribos 3/8"@15cm:
```
vol_m3           = 0.25 × 0.25 × 3 = 0.1875 m3
long_barra_long  = 3 + (0.08×2) = 3.16 m
long_total_long  = 4 × 3.16 = 12.64 m
kg_long          = 12.64 × 0.994 = 12.56 kg
qq_long          = 12.56 / 46.026 = 0.273 qq × factor 1.07 = 0.292 qq

perim_estribo    = 2×((0.25-0.08)+(0.25-0.08)) + (0.08×2) = 0.84 m
n_estribos       = CEIL(3/0.15)+1 = 21
long_total_estrib= 21 × 0.84 = 17.64 m
kg_estribos      = 17.64 × 0.560 = 9.88 kg
qq_estribos      = 9.88 / 46.026 = 0.215 qq × factor 1.07 = 0.230 qq

kg_alambre       = (12.56+9.88) × 0.05 = 1.12 kg → 2.47 LB
```
