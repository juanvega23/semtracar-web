import type { ReactNode } from 'react';
import { cn } from './cn';
import { ClipboardIcon, ShipIcon, StoreIcon, WarehouseIcon } from './icons';

/** Una parada por estado, con el ícono y el color de cada estación del Figma. */
const STAGES = [
  {
    icon: WarehouseIcon,
    dot: 'bg-[#34c759]',
    text: 'text-[#34c759]',
    line: 'bg-[#34c759]',
    tint: 'bg-[#e6f8ec]',
  },
  { icon: ShipIcon, dot: 'bg-[#ffcc00]', text: 'text-[#ffcc00]', line: 'bg-[#ffcc00]', tint: 'bg-[#fff7d6]' },
  {
    icon: ClipboardIcon,
    dot: 'bg-[#ff383c]',
    text: 'text-[#ff383c]',
    line: 'bg-[#ff383c]',
    tint: 'bg-[#ffe8e8]',
  },
  {
    icon: StoreIcon,
    dot: 'bg-[#0088ff]',
    text: 'text-[#0088ff]',
    line: 'bg-[#0088ff]',
    tint: 'bg-[#e3f2ff]',
  },
];

export type TimelineStop = {
  id: number | string;
  name: string;
  /** Ya se alcanzó este estado o tiene contenido. */
  reached: boolean;
  /** Estado actual: se resalta con el color de su estación. */
  current?: boolean;
  children?: ReactNode;
};

export function ShipmentTimeline({ stops, label }: { stops: TimelineStop[]; label: string }) {
  return (
    <ol aria-label={label} className="grid gap-2 lg:grid-cols-4">
      {stops.map((stop, index) => {
        const stage = STAGES[index % STAGES.length];
        const Icon = stage.icon;
        return (
          <li
            key={stop.id}
            aria-current={stop.current ? 'step' : undefined}
            className={cn('rounded-3xl p-3 pb-5', stop.current && stage.tint)}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-[60px] shrink-0 items-center justify-center rounded-full text-white',
                  stop.reached ? stage.dot : 'bg-slate-300',
                )}
              >
                <Icon size={32} />
              </span>
              <span
                className={cn(
                  'text-[18px] leading-tight font-bold uppercase',
                  stop.reached ? stage.text : 'text-slate-400',
                )}
              >
                {stop.name}
              </span>
              {index < stops.length - 1 && !stop.current && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'hidden h-1 min-w-4 flex-1 lg:block',
                    stop.reached ? stage.line : 'bg-slate-200',
                  )}
                />
              )}
            </div>
            {stop.children && (
              <div className="mt-1 pl-[72px] text-[15px] font-semibold text-[#8e8e93]">{stop.children}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
