import type { ComponentType } from 'react';
import {
  CalculatorIcon,
  ChartIcon,
  ClockIcon,
  PackageIcon,
  ReceiptIcon,
  StoreIcon,
  TruckIcon,
  UsersIcon,
} from '@/components/ui';
import { accessFor, type Access, type Role, type Section } from '@/features/acceso';

export type NavItem = {
  section: Section;
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
};

const CLIENT_NAV: NavItem[] = [
  { section: 'seguimiento', to: '/rastreo', label: 'Rastreo', icon: PackageIcon },
  { section: 'recibos', to: '/historial', label: 'Historial', icon: ClockIcon },
  { section: 'misPedidos', to: '/delivery', label: 'Delivery', icon: TruckIcon },
  { section: 'cotizacion', to: '/cotizar', label: 'Cotizar', icon: CalculatorIcon },
];

const STAFF_NAV: NavItem[] = [
  { section: 'dashboard', to: '/admin/dashboard', label: 'Dashboard', icon: ChartIcon },
  { section: 'paquetes', to: '/admin/paquetes', label: 'Paquetes', icon: PackageIcon },
  { section: 'facturacion', to: '/admin/facturacion', label: 'Facturación', icon: ReceiptIcon },
  { section: 'retiro', to: '/admin/retiro', label: 'Retiro', icon: StoreIcon },
  { section: 'pedidos', to: '/admin/pedidos', label: 'Pedidos', icon: TruckIcon },
  { section: 'usuarios', to: '/admin/usuarios', label: 'Usuarios', icon: UsersIcon },
];

/** Menú del rol: sin las secciones ocultas; las bloqueadas se muestran con candado (RF-66). */
export function navFor(role: Role): Array<NavItem & { access: Access }> {
  const items = role === 'cliente' ? CLIENT_NAV : STAFF_NAV;
  return items
    .map((item) => ({ ...item, access: accessFor(role, item.section) }))
    .filter((item) => item.access !== 'hidden');
}
