/** Roles, secciones y matriz de permisos (RF-64, RF-65, RF-66, RF-68; brief §2 y §5.1). */

export type Role = 'cliente' | 'admin' | 'almacen' | 'repartidor';
export type WebRole = Exclude<Role, 'repartidor'>;

export type Section =
  | 'seguimiento'
  | 'recibos'
  | 'misPedidos'
  | 'cotizacion'
  | 'paquetes'
  | 'facturacion'
  | 'retiro'
  | 'pedidos'
  | 'dashboard'
  | 'usuarios'
  | 'avisos'
  | 'perfil';

/** allowed: entra · locked: se ve con candado · hidden: no aparece ni se puede abrir. */
export type Access = 'allowed' | 'locked' | 'hidden';

const ACCESS: Record<WebRole, Record<Section, Access>> = {
  cliente: {
    seguimiento: 'allowed',
    recibos: 'allowed',
    misPedidos: 'allowed',
    cotizacion: 'allowed',
    paquetes: 'hidden',
    facturacion: 'hidden',
    retiro: 'hidden',
    pedidos: 'hidden',
    dashboard: 'hidden',
    usuarios: 'hidden',
    avisos: 'allowed',
    perfil: 'allowed',
  },
  admin: {
    seguimiento: 'hidden',
    recibos: 'hidden',
    misPedidos: 'hidden',
    cotizacion: 'hidden',
    paquetes: 'allowed',
    facturacion: 'allowed',
    retiro: 'allowed',
    pedidos: 'allowed',
    dashboard: 'allowed',
    usuarios: 'allowed',
    avisos: 'allowed',
    perfil: 'allowed',
  },
  // Brief §2: panel admin restringido. Pedidos y Facturación visibles con candado.
  almacen: {
    seguimiento: 'hidden',
    recibos: 'hidden',
    misPedidos: 'hidden',
    cotizacion: 'hidden',
    paquetes: 'allowed',
    facturacion: 'locked',
    retiro: 'hidden',
    pedidos: 'locked',
    dashboard: 'hidden',
    usuarios: 'hidden',
    avisos: 'allowed',
    perfil: 'allowed',
  },
};

/** El repartidor no tiene ninguna sección en la web (RF-09). */
export function accessFor(role: Role, section: Section): Access {
  if (role === 'repartidor') return 'hidden';
  return ACCESS[role][section];
}

export function canAccess(role: Role, section: Section): boolean {
  return accessFor(role, section) === 'allowed';
}

/**
 * Rol efectivo de una fila de public.users, con la misma prioridad que la app móvil (main.dart):
 * repartidor → almacen → admin (role 'admin' o is_admin) → cliente.
 */
export function resolveRole(row: { role: string | null; is_admin: boolean | null }): Role {
  if (row.role === 'repartidor') return 'repartidor';
  if (row.role === 'almacen') return 'almacen';
  if (row.role === 'admin' || row.is_admin === true) return 'admin';
  return 'cliente';
}

export const ROLE_LABELS: Record<Role, string> = {
  cliente: 'Cliente',
  admin: 'Administrador',
  almacen: 'Encargado de almacén',
  repartidor: 'Repartidor',
};

/** Pantalla inicial de cada rol. */
export function homePathFor(role: Role): string {
  switch (role) {
    case 'cliente':
      return '/rastreo';
    case 'admin':
    case 'almacen':
      return '/admin/paquetes';
    case 'repartidor':
      return '/app-movil';
  }
}
