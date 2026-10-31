import { ClockIcon } from './icons';
import { PageHeader } from './PageHeader';

/** Página temporal de una sección que se construye en otro turno. */
export function ComingSoon({
  title,
  description,
  owner,
  requirements,
}: {
  title: string;
  description: string;
  owner: string;
  requirements: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <ClockIcon size={26} />
        </div>
        <h2 className="text-lg font-semibold text-ink-900">Próximamente</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          Estamos construyendo esta sección. Pronto estará disponible.
        </p>
        <p className="mt-4 text-xs text-slate-400">
          {owner} · {requirements}
        </p>
      </div>
    </>
  );
}
