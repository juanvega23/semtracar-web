import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button, Logo, PhoneIcon } from '@/components/ui';
import { useSignOut } from '@/features/auth';

/** RF-09: el repartidor trabaja solo en la app móvil. Se cierra la sesión y no ve ningún dato. */
export function MobileAppPage() {
  const navigate = useNavigate();
  const { mutate: signOut } = useSignOut();
  const signedOut = useRef(false);

  useEffect(() => {
    // Una sola vez (en desarrollo React monta los efectos dos veces).
    if (signedOut.current) return;
    signedOut.current = true;
    signOut();
  }, [signOut]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-12 text-center">
      <Logo className="mb-10 h-12" />
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <PhoneIcon size={32} />
      </div>
      <h1 className="text-2xl font-bold text-ink-900">Tu rol usa la aplicación móvil</h1>
      <p className="mt-3 max-w-md text-slate-600">
        Las cuentas de repartidor trabajan desde la app móvil de SEMTRACAR: ahí ves los pedidos disponibles,
        aceptas entregas y registras cada entrega. Por seguridad, cerramos tu sesión en la web.
      </p>
      <Button className="mt-8" size="lg" onClick={() => navigate('/login', { replace: true })}>
        Salir
      </Button>
    </main>
  );
}
