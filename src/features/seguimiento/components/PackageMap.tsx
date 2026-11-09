import { ClipboardIcon, cn, Modal, ShipIcon, StoreIcon, WarehouseIcon } from '@/components/ui';

/**
 * Mapa ilustrado de la ruta Miami → Managua. Marca la etapa del recorrido según el estado del paquete;
 * no es GPS ni muestra la ubicación del repartidor (fuera de alcance).
 */

// Proyección simple: 22 unidades por grado; esquina superior izquierda en 105° O, 28° N.
const K = 22;
const W = 960;
const H = 400;
const px = (lon: number) => (lon + 105) * K;
const py = (lat: number) => (28 - lat) * K;
type LonLat = [number, number];
const shape = (points: LonLat[]) => points.map(([lon, lat]) => `${px(lon)},${py(lat)}`).join(' ');

// prettier-ignore
const LAND: LonLat[][] = [
  // Texas, México y Centroamérica
  [
    [-106, 29.5], [-95.3, 29.5], [-95.3, 29.2], [-96.4, 28.45], [-97.2, 27.8], [-97.4, 27], [-97.3, 26],
    [-97.75, 23.8], [-97.85, 22.25], [-97.35, 21], [-96.75, 20.2], [-96.1, 19.2], [-95.75, 18.75],
    [-94.4, 18.15], [-93.2, 18.45], [-91.8, 18.65], [-90.7, 19.35], [-90.5, 19.85], [-90.4, 20.85],
    [-89.65, 21.3], [-88.2, 21.6], [-87.05, 21.6], [-86.8, 21.1], [-87.45, 20.2], [-87.6, 19.4],
    [-88.1, 18.3], [-88.2, 17.5], [-88.3, 16.6], [-88.8, 16.1], [-88.6, 15.75], [-87.95, 15.85],
    [-86.8, 15.78], [-86, 15.95], [-85, 15.95], [-84.25, 15.8], [-83.4, 15.25], [-83.15, 15], [-83.4, 14.4],
    [-83.38, 14.03], [-83.55, 13.2], [-83.5, 12.4], [-83.75, 12], [-83.7, 10.93], [-83.4, 10.4], [-83.03, 10],
    [-82.6, 9.6], [-82.25, 9.33], [-81.8, 9], [-81.2, 8.8], [-80, 9.2], [-79.5, 9.6], [-78, 9.3], [-77, 7],
    [-83, 7], [-83.6, 9], [-84.6, 9.6], [-85.1, 9.6], [-85.65, 9.9], [-85.85, 10.35], [-85.7, 10.8],
    [-85.7, 11.05], [-85.87, 11.25], [-86.5, 11.78], [-86.78, 12.18], [-87.17, 12.48], [-87.6, 12.9],
    [-87.8, 13.2], [-88.2, 13.15], [-89.3, 13.48], [-89.83, 13.57], [-90.8, 13.92], [-91.9, 14.45],
    [-92.3, 14.6], [-93.9, 15.9], [-95.2, 16.17], [-96.5, 15.65], [-97.07, 15.86], [-98.5, 16.3],
    [-99.9, 16.85], [-101.5, 17.6], [-103.5, 18.3], [-104.5, 19.1], [-106, 20.5],
  ],
  // Florida
  [
    [-83, 29.5], [-82.8, 28.2], [-82.75, 27.6], [-82.5, 27.2], [-82.2, 26.8], [-81.85, 26.45], [-81.75, 25.9],
    [-81.2, 25.2], [-80.9, 25.15], [-80.4, 25.25], [-80.15, 25.8], [-80.05, 26.6], [-80.2, 27.3],
    [-80.6, 28.2], [-80.6, 28.6], [-80.9, 29.5],
  ],
  // Cuba
  [
    [-84.95, 21.85], [-84.3, 22.4], [-83.3, 22.95], [-82.38, 23.14], [-81.58, 23.05], [-80.5, 22.95],
    [-79.47, 22.52], [-78.3, 22.3], [-77.25, 21.55], [-76.1, 21.1], [-74.9, 20.6], [-74.13, 20.25],
    [-75.2, 20], [-75.82, 19.98], [-77.73, 19.83], [-77.12, 20.35], [-78, 20.7], [-78.9, 21.5],
    [-79.98, 21.8], [-80.45, 22.05], [-81.15, 22.1], [-81.6, 22.2], [-82.3, 22.7], [-83.6, 22.2],
    [-84.5, 21.8],
  ],
  // La Española
  [
    [-74.45, 18.45], [-74.1, 18.65], [-73.1, 18.45], [-72.33, 18.55], [-72.7, 19.1], [-72.7, 19.45],
    [-73.4, 19.85], [-72.8, 19.95], [-72.2, 19.76], [-70.7, 19.8], [-69.9, 19.65], [-69.15, 19.3],
    [-68.35, 18.6], [-68.97, 18.4], [-69.9, 18.47], [-71.1, 18.2], [-71.75, 17.6], [-72.5, 18.2],
    [-73.75, 18.2],
  ],
  // Jamaica
  [
    [-78.35, 18.45], [-77.5, 18.5], [-76.9, 18.4], [-76.35, 18.15], [-76.2, 17.9], [-76.8, 17.95],
    [-77.15, 17.8], [-77.8, 17.85], [-78.2, 18.2],
  ],
  // Puerto Rico
  [[-67.25, 18.45], [-65.6, 18.38], [-65.6, 18], [-67.2, 17.95]],
];

/** Islas pequeñas como elipses: [lon, lat, radio lon, radio lat]. */
const ISLETS: [number, number, number, number][] = [
  [-82.8, 21.7, 0.45, 0.28], // Isla de la Juventud
  [-78, 24.4, 0.3, 0.55], // Andros
  [-78.4, 26.62, 0.55, 0.13], // Gran Bahama
  [-77.2, 26.35, 0.18, 0.4], // Ábaco
  [-76.3, 25.2, 0.12, 0.45], // Eleuthera
  [-81.25, 19.3, 0.2, 0.08], // Gran Caimán
];

const SEA_LABELS: [string, number, number][] = [
  ['Golfo de México', -91, 24.6],
  ['Mar Caribe', -75.5, 15.2],
  ['Océano Pacífico', -92.5, 13.5],
  ['Océano Atlántico', -73, 24],
];
const LAND_LABELS: [string, number, number][] = [
  ['MÉXICO', -92.5, 16.8],
  ['CUBA', -78.2, 21.5],
  ['HONDURAS', -87, 14.8],
];

/** Etapas del recorrido, en el orden de los estados del paquete. `t` es la posición sobre la ruta (0–1). */
const STAGES = [
  { label: 'Almacén Miami', color: '#34c759', icon: WarehouseIcon, t: 0 },
  { label: 'En camino', color: '#ff8d28', icon: ShipIcon, t: 0.5 },
  { label: 'Aduana Managua', color: '#ff383c', icon: ClipboardIcon, t: 0.88 },
  { label: 'Semtracar', color: '#0088ff', icon: StoreIcon, t: 1 },
];

const ORIGIN = { x: px(-80.19), y: py(25.76) }; // Miami
const DESTINATION = { x: px(-86.27), y: py(12.13) }; // Managua
const CONTROL = { x: 610, y: 210 }; // curva sobre el Caribe

function routePoint(t: number) {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return {
    x: a * ORIGIN.x + b * CONTROL.x + c * DESTINATION.x,
    y: a * ORIGIN.y + b * CONTROL.y + c * DESTINATION.y,
  };
}

function routeSegment(from: number, to: number) {
  const steps = 48;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const p = routePoint(from + ((to - from) * i) / steps);
    points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return points.join(' ');
}

const LABEL_HALO = { paintOrder: 'stroke', stroke: '#fff', strokeWidth: 5, strokeLinejoin: 'round' } as const;

function MapView({ stage, className }: { stage: number; className?: string }) {
  const current = STAGES[stage];
  const progress = current?.t ?? 0;
  const marker = routePoint(progress);
  const Icon = current?.icon;

  return (
    <div className={cn('relative overflow-hidden bg-[#e6f0fa]', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={
          current
            ? `Ruta Miami – Managua. Tu paquete está en la etapa: ${current.label}.`
            : 'Ruta Miami – Managua.'
        }
        className="absolute inset-0 size-full select-none"
      >
        {/* Cuadrícula de meridianos y paralelos */}
        <g stroke="#d3e3f3" strokeWidth={1} strokeDasharray="2 6">
          {[-100, -95, -90, -85, -80, -75, -70, -65].map((lon) => (
            <line key={lon} x1={px(lon)} x2={px(lon)} y1={0} y2={H} />
          ))}
          {[10, 15, 20, 25].map((lat) => (
            <line key={lat} y1={py(lat)} y2={py(lat)} x1={0} x2={W} />
          ))}
        </g>

        <g fill="#fbfaf7" stroke="#c9d3e0" strokeWidth={1.2} strokeLinejoin="round">
          {LAND.map((points, index) => (
            <polygon key={index} points={shape(points)} />
          ))}
          {ISLETS.map(([lon, lat, rx, ry]) => (
            <ellipse key={`${lon},${lat}`} cx={px(lon)} cy={py(lat)} rx={rx * K} ry={ry * K} />
          ))}
          <polyline
            points={shape([
              [-80.4, 25.2],
              [-80.7, 24.9],
              [-81.2, 24.65],
              [-81.8, 24.55],
            ])}
            fill="none"
            strokeWidth={2}
          />
        </g>
        {/* Lagos de Nicaragua */}
        <g fill="#e6f0fa" stroke="#c9d3e0" strokeWidth={1}>
          <ellipse
            cx={px(-85.4)}
            cy={py(11.6)}
            rx={0.7 * K}
            ry={0.32 * K}
            transform={`rotate(-35 ${px(-85.4)} ${py(11.6)})`}
          />
          <ellipse cx={px(-86.4)} cy={py(12.33)} rx={0.3 * K} ry={0.14 * K} />
        </g>

        <g fontFamily="inherit" textAnchor="middle">
          {SEA_LABELS.map(([text, lon, lat]) => (
            <text key={text} x={px(lon)} y={py(lat)} fontSize={15} fontStyle="italic" fill="#8aa3bf">
              {text}
            </text>
          ))}
          {LAND_LABELS.map(([text, lon, lat]) => (
            <text
              key={text}
              x={px(lon)}
              y={py(lat)}
              fontSize={11}
              fontWeight={600}
              letterSpacing={2}
              fill="#a8b0bf"
            >
              {text}
            </text>
          ))}
        </g>

        {/* Ruta: recorrida (sólida) y pendiente (punteada) */}
        <polyline
          points={routeSegment(0, 1)}
          fill="none"
          stroke="#8e95a9"
          strokeWidth={3}
          strokeDasharray="2 9"
          strokeLinecap="round"
        />
        {current && progress > 0 && (
          <polyline
            points={routeSegment(0, progress)}
            fill="none"
            stroke="#e54f1d"
            strokeWidth={4.5}
            strokeLinecap="round"
          />
        )}

        {/* Puntos de cada etapa */}
        {STAGES.map((item, index) => {
          const p = routePoint(item.t);
          const reached = index <= stage;
          return (
            <circle
              key={item.label}
              cx={p.x}
              cy={p.y}
              r={7}
              fill={reached ? item.color : '#fff'}
              stroke={reached ? '#fff' : '#8e95a9'}
              strokeWidth={reached ? 3 : 2}
            />
          );
        })}

        {/* Origen y destino */}
        <g fontFamily="inherit" style={LABEL_HALO}>
          <text
            x={ORIGIN.x + 30}
            y={ORIGIN.y - 6}
            fontSize={11}
            fontWeight={700}
            letterSpacing={1.5}
            fill="#6d7588"
          >
            ORIGEN
          </text>
          <text x={ORIGIN.x + 30} y={ORIGIN.y + 14} fontSize={19} fontWeight={700} fill="#202548">
            Miami, FL
          </text>
          <text
            x={DESTINATION.x - 34}
            y={DESTINATION.y - 6}
            textAnchor="end"
            fontSize={11}
            fontWeight={700}
            letterSpacing={1.5}
            fill="#6d7588"
          >
            DESTINO
          </text>
          <text
            x={DESTINATION.x - 34}
            y={DESTINATION.y + 14}
            textAnchor="end"
            fontSize={19}
            fontWeight={700}
            fill="#202548"
          >
            Managua, NI
          </text>
        </g>

        {/* Marcador de la etapa actual */}
        {current && Icon && (
          <g>
            <circle
              cx={marker.x}
              cy={marker.y}
              r={22}
              fill={current.color}
              opacity={0.35}
              className="origin-center [transform-box:fill-box] motion-safe:animate-ping"
            />
            <circle
              cx={marker.x}
              cy={marker.y}
              r={22}
              fill={current.color}
              stroke="#fff"
              strokeWidth={4}
              style={{ filter: 'drop-shadow(0 3px 5px rgba(32,37,72,0.3))' }}
            />
            <Icon x={marker.x - 11} y={marker.y - 11} size={22} stroke="#fff" strokeWidth={2.2} />
          </g>
        )}
      </svg>
    </div>
  );
}

function Legend({ stage }: { stage: number }) {
  return (
    <ol className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-slate-100 px-4 py-4">
      {STAGES.map((item, index) => (
        <li
          key={item.label}
          aria-current={index === stage ? 'step' : undefined}
          className={cn(
            'flex items-center gap-2 text-base',
            index === stage
              ? 'font-bold text-ink-900'
              : index < stage
                ? 'font-semibold text-[#5b6178]'
                : 'font-semibold text-[#b0b5c3]',
          )}
        >
          <span
            aria-hidden="true"
            className={cn('size-3.5 rounded-full', index > stage && 'opacity-40')}
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ol>
  );
}

/** Tarjeta del mapa con su versión ampliada en un modal. */
export function PackageMap({
  stage,
  open,
  onOpenChange,
}: {
  stage: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const current = STAGES[stage];
  const title = current ? `Ubicación del paquete: ${current.label}` : 'Ubicación del paquete';
  return (
    <>
      <section
        aria-label={title}
        className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_6px_rgba(33,40,75,0.08)] lg:h-full"
      >
        <div className="flex items-center gap-4 px-6 py-5">
          <MapIcon />
          <h2 className="flex-1 text-2xl font-bold text-[#5b6178] uppercase">Ubicación del paquete</h2>
          <button
            type="button"
            aria-label="Ver mapa en grande"
            onClick={() => onOpenChange(true)}
            className="rounded-lg p-1 text-ink-900 hover:bg-slate-100"
          >
            <ExpandIcon />
          </button>
        </div>
        <MapView
          stage={stage}
          className="aspect-[3/2] sm:aspect-auto sm:h-80 lg:h-auto lg:min-h-72 lg:flex-1"
        />
        <Legend stage={stage} />
      </section>
      <Modal open={open} onClose={() => onOpenChange(false)} title={title} className="max-w-5xl!">
        <MapView stage={stage} className="h-[min(65vh,520px)] rounded-lg" />
        <Legend stage={stage} />
      </Modal>
    </>
  );
}

function MapIcon() {
  return (
    <svg
      aria-hidden="true"
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#202548"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      aria-hidden="true"
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
    </svg>
  );
}
