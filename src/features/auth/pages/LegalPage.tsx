import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Logo } from '@/components/ui';

/**
 * RNF-42. Texto base redactado para el proyecto: la empresa debe revisarlo antes de publicarlo.
 * Fecha de última actualización visible para el usuario.
 */
const UPDATED = '30 de octubre de 2026';

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" aria-label="Ir al inicio">
            <Logo className="h-9" />
          </Link>
          <Link to="/registro" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Crear cuenta
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-ink-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: {UPDATED}</p>
        <div className="mt-8 space-y-6 leading-relaxed text-slate-700 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-900 [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Términos y condiciones">
      <p>
        Estos términos regulan el uso del servicio de casillero internacional de SEMTRACAR S.A. («SEMTRACAR»).
        Al crear una cuenta aceptas estas condiciones.
      </p>
      <h2>1. El servicio</h2>
      <p>
        SEMTRACAR te asigna un número de casillero en una bodega de Estados Unidos para que recibas tus
        compras, las trasladamos a Nicaragua, gestionamos su paso por aduana y las entregamos en sucursal o a
        domicilio.
      </p>
      <h2>2. Tu cuenta</h2>
      <ul>
        <li>Debes dar datos verdaderos y mantenerlos actualizados.</li>
        <li>Eres responsable de guardar tu contraseña y de lo que se haga con tu cuenta.</li>
        <li>Usa siempre tu número de casillero en la dirección de envío de tus compras.</li>
      </ul>
      <h2>3. Tarifas y pagos</h2>
      <p>
        El cotizador muestra un costo estimado. El monto final se calcula con el peso real del paquete y se
        detalla en tu recibo. Los montos se expresan en dólares estadounidenses (USD). El delivery a domicilio
        tiene un costo adicional que se suma al recibo cuando lo solicitas.
      </p>
      <h2>4. Retiro y entrega</h2>
      <p>
        Para retirar en sucursal presenta tu número de recibo (REC). El saldo pendiente debe pagarse antes de
        la entrega.
      </p>
      <h2>5. Artículos no permitidos</h2>
      <p>
        No transportamos artículos prohibidos por las leyes de Estados Unidos o de Nicaragua, ni mercancía
        peligrosa. Los paquetes retenidos por aduana se rigen por lo que esta disponga.
      </p>
      <h2>6. Cambios</h2>
      <p>
        Podemos actualizar estos términos. Te avisaremos de los cambios importantes dentro de la aplicación.
      </p>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad">
      <p>Esta política explica qué datos personales trata SEMTRACAR S.A. y para qué.</p>
      <h2>1. Datos que recopilamos</h2>
      <ul>
        <li>Datos de cuenta: nombre, apellido, correo, teléfono y dirección.</li>
        <li>Datos de tus envíos: paquetes, estados, recibos, pagos y pedidos de delivery.</li>
      </ul>
      <h2>2. Para qué los usamos</h2>
      <ul>
        <li>Asignar tu casillero y gestionar tus paquetes, recibos y entregas.</li>
        <li>Enviarte avisos sobre el estado de tus envíos.</li>
        <li>Cumplir obligaciones legales y aduaneras.</li>
      </ul>
      <h2>3. Con quién los compartimos</h2>
      <p>
        Solo con el personal de SEMTRACAR que los necesita para darte el servicio (por ejemplo, el repartidor
        que lleva tu pedido ve tu nombre, dirección y teléfono) y con las autoridades cuando la ley lo exija.
        No vendemos tus datos.
      </p>
      <h2>4. Seguridad</h2>
      <p>
        Tus datos se guardan en servidores con acceso restringido por rol. Cada cliente solo puede ver su
        propia información.
      </p>
      <h2>5. Tus derechos</h2>
      <p>
        Puedes ver y corregir tus datos desde tu perfil. Para pedir la eliminación de tu cuenta, escríbenos
        desde el correo con el que te registraste.
      </p>
    </LegalLayout>
  );
}
