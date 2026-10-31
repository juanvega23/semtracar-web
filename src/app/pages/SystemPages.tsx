import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ButtonLink, Logo } from '@/components/ui';

function SystemPage({ code, title, description }: { code: string; title: string; description: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 text-center">
      <Logo className="mb-10 h-10" />
      <p className="text-sm font-semibold tracking-widest text-brand-600 uppercase">{code}</p>
      <h1 className="mt-2 text-3xl font-bold text-ink-900">{title}</h1>
      <p className="mt-3 max-w-md text-slate-600">{description}</p>
      <ButtonLink to="/" size="lg" className="mt-8">
        Ir al inicio
      </ButtonLink>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <SystemPage
      code="Error 404"
      title="No encontramos esta página"
      description="Puede que el enlace esté mal escrito o que la página ya no exista."
    />
  );
}

/** Error inesperado al cargar o mostrar una ruta. */
export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  return (
    <SystemPage
      code="Algo salió mal"
      title="No pudimos mostrar esta pantalla"
      description="Recarga la página. Si el problema continúa, intenta más tarde."
    />
  );
}
