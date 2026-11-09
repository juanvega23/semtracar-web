import type { ReactNode } from 'react';
import { cn } from './cn';

const tones = {
  green: 'bg-[#bfe0cc] text-[#0b6b2e]',
  blue: 'bg-[#cfdcf7] text-[#0b3a82]',
  lilac: 'bg-[#d9d4f7] text-[#3a2f8f]',
  peach: 'bg-[#ffe3d6] text-[#b23a08]',
};

/** Indicador con fondo de color, como en la pantalla de recibos del Figma. */
export function SoftStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: keyof typeof tones;
}) {
  return (
    <div className={cn('rounded-2xl p-4 shadow-[0_2px_6px_rgba(33,40,75,0.08)]', tones[tone])}>
      <span aria-hidden="true">{icon}</span>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}
