import { useState } from 'react';
import { CheckIcon, PackageIcon } from '@/components/ui';

/** Número de casillero destacado, con botón para copiarlo (RF-08). */
export function CasilleroCard({ casillero }: { casillero: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(casillero);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-white p-6 ring-1 ring-brand-100">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
          <PackageIcon size={24} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">Tu número de casillero</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-wide text-ink-900">{casillero}</p>
          <p className="mt-2 text-sm text-slate-600">
            Escríbelo junto a tu nombre en la dirección de envío de cada compra en línea.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50"
      >
        {copied ? (
          <>
            <CheckIcon size={16} /> Copiado
          </>
        ) : (
          'Copiar casillero'
        )}
      </button>
    </section>
  );
}
