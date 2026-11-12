import type { ReactNode } from 'react';
import { formatCount } from './Kpi';
import {
  formatLethality,
  type LethalityTone,
  MIN_RELIABLE_RESOLVED,
  TONE_COLORS,
  TONE_LABELS,
  TONE_TEXT,
} from './clinicalProfile';

/** Linha de uma lista de barras: nome à esquerda, barra(s) no meio, número e selo à direita. */
export function ClinicalRow({
  label,
  caption,
  trailing,
  children,
}: {
  label: string;
  caption?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[11rem_minmax(0,1fr)_auto]">
      <div>
        <p className="text-sm font-medium text-black dark:text-white">{label}</p>
        {caption && <p className="text-xs text-body dark:text-bodydark">{caption}</p>}
      </div>
      <div className="min-w-0 space-y-1">{children}</div>
      {trailing && <div className="sm:min-w-[8.5rem] sm:text-right">{trailing}</div>}
    </li>
  );
}

/** Barra de medidor; `marker` desenha uma linha de referência (ex.: letalidade geral). */
export function Meter({
  width,
  color,
  marker,
  muted = false,
  height = 'h-5',
  ariaLabel,
}: {
  width: number;
  color: string;
  marker?: number | null;
  muted?: boolean;
  height?: string;
  ariaLabel: string;
}) {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`relative ${height} overflow-hidden rounded bg-gray-2 dark:bg-meta-4`}
    >
      <div
        className={`h-full rounded transition-all duration-500 ${muted ? 'opacity-50' : ''}`}
        style={{ width: `${width}%`, backgroundColor: color }}
      />
      {marker !== null && marker !== undefined && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 bg-black/60 dark:bg-white/70"
          style={{ left: `${marker}%` }}
        />
      )}
    </div>
  );
}

/** Selo com a letalidade, colorido em relação à letalidade geral. */
export function LethalityPill({
  value,
  tone,
  reliable,
  prefix = 'Letalidade',
}: {
  value: number | null;
  tone: LethalityTone;
  reliable: boolean;
  prefix?: string;
}) {
  return (
    <span className={`inline-flex items-baseline gap-1 text-sm ${TONE_TEXT[tone]}`}>
      <span className="text-xs">{prefix}</span>
      <strong className="text-base">{formatLethality(value)}</strong>
      {!reliable && value !== null && (
        <span title={`Menos de ${MIN_RELIABLE_RESOLVED} casos com desfecho`}>*</span>
      )}
    </span>
  );
}

export function ToneLegend({ baseline }: { baseline: number | null }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-body dark:text-bodydark">
      {(Object.keys(TONE_LABELS) as (keyof typeof TONE_LABELS)[]).map((tone) => (
        <li key={tone}>
          <span style={{ color: TONE_COLORS[tone] }}>●</span> Letalidade {TONE_LABELS[tone]}
        </li>
      ))}
      {baseline !== null && <li>Média geral: {formatLethality(baseline)}</li>}
    </ul>
  );
}

export function ReliabilityNote() {
  return (
    <p className="mt-2 text-xs text-body dark:text-bodydark">
      * Menos de {MIN_RELIABLE_RESOLVED} casos com desfecho conhecido: leia com cautela.
    </p>
  );
}

export const casesCaption = (cases: number, pct?: number) =>
  pct === undefined
    ? `${formatCount(cases)} casos`
    : `${formatCount(cases)} casos · ${pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
