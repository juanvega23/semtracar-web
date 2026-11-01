import { describe, expect, it } from 'vitest';
import { serializeCsv } from './csv';

describe('serializeCsv', () => {
  it('escapa comillas, separadores y saltos de línea', () => {
    expect(serializeCsv(['Descripción'], [['caja, "azul"\nnueva']])).toBe(
      '"Descripción"\r\n"caja, ""azul""\nnueva"',
    );
  });

  it('usa coma como separador y conserva una coma dentro de texto', () => {
    expect(serializeCsv(['Código', 'Detalle'], [['PKG-01', 'ropa, zapatos']])).toBe(
      '"Código","Detalle"\r\n"PKG-01","ropa, zapatos"',
    );
  });

  it('neutraliza las fórmulas recibidas desde datos externos', () => {
    expect(serializeCsv(['Código'], [['=1+2'], ['  +SUM(1,2)'], ['@usuario']])).toBe(
      '"Código"\r\n"\'=1+2"\r\n"\'  +SUM(1,2)"\r\n"\'@usuario"',
    );
  });

  it('conserva importes numéricos y campos vacíos', () => {
    expect(serializeCsv(['Total', 'Referencia'], [[25.5, null]])).toBe('"Total","Referencia"\r\n"25.5",""');
  });
});
