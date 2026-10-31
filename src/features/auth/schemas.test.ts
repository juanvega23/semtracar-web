import { registerSchema } from './schemas';

const valid = {
  name: 'Ana María',
  lastName: "O'Neil",
  email: '  Ana@Correo.COM ',
  password: 'clave1234',
  confirmPassword: 'clave1234',
  address: 'Managua, de la rotonda 2 c. al sur',
  phone: '+505 8888-1234',
  acceptTerms: true,
};

describe('registerSchema (RF-01)', () => {
  it('acepta datos válidos y normaliza correo y teléfono', () => {
    const r = registerSchema.parse(valid);
    expect(r.email).toBe('ana@correo.com');
    expect(r.phone).toBe('88881234');
  });

  it('exige aceptar términos (RNF-42)', () => {
    const r = registerSchema.safeParse({ ...valid, acceptTerms: false });
    expect(r.success).toBe(false);
  });

  it('valida que las contraseñas coincidan', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'otra1234' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });

  it('rechaza contraseñas débiles y teléfonos inválidos', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'corta', confirmPassword: 'corta' }).success).toBe(
      false,
    );
    expect(registerSchema.safeParse({ ...valid, phone: '1234' }).success).toBe(false);
  });

  it('rechaza nombres con números', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'Ana2' }).success).toBe(false);
  });
});
