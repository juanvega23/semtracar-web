import { accessFor, canAccess, homePathFor, resolveRole } from './roles';

describe('resolveRole (misma prioridad que la app móvil)', () => {
  it.each([
    [{ role: 'repartidor', is_admin: true }, 'repartidor'],
    [{ role: 'almacen', is_admin: false }, 'almacen'],
    [{ role: 'admin', is_admin: false }, 'admin'],
    [{ role: 'cliente', is_admin: true }, 'admin'],
    [{ role: 'cliente', is_admin: false }, 'cliente'],
    [{ role: null, is_admin: null }, 'cliente'],
  ] as const)('%o → %s', (row, expected) => {
    expect(resolveRole(row)).toBe(expected);
  });
});

describe('matriz de permisos (brief §5.1)', () => {
  it('almacén: paquetes permitido, facturación y pedidos con candado, usuarios oculto', () => {
    expect(accessFor('almacen', 'paquetes')).toBe('allowed');
    expect(accessFor('almacen', 'facturacion')).toBe('locked');
    expect(accessFor('almacen', 'pedidos')).toBe('locked');
    expect(accessFor('almacen', 'usuarios')).toBe('hidden');
  });

  it('admin entra a todo el panel', () => {
    for (const s of ['paquetes', 'facturacion', 'retiro', 'pedidos', 'dashboard', 'usuarios'] as const) {
      expect(canAccess('admin', s)).toBe(true);
    }
  });

  it('cliente solo ve su portal', () => {
    expect(canAccess('cliente', 'seguimiento')).toBe(true);
    expect(accessFor('cliente', 'paquetes')).toBe('hidden');
  });

  it('repartidor no tiene ninguna sección en la web (RF-09)', () => {
    expect(accessFor('repartidor', 'perfil')).toBe('hidden');
    expect(homePathFor('repartidor')).toBe('/app-movil');
  });
});
