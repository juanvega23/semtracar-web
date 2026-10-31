import { sanitizeSearch } from './usersService';

describe('sanitizeSearch', () => {
  it('quita caracteres que alteran el filtro de PostgREST', () => {
    expect(sanitizeSearch('  ana,vega (x)* ')).toBe('ana vega  x');
    expect(sanitizeSearch('NCX-12AB')).toBe('NCX-12AB');
  });

  it('limita el largo de la búsqueda', () => {
    expect(sanitizeSearch('a'.repeat(100))).toHaveLength(60);
  });
});
