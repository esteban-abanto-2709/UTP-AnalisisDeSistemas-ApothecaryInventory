export const card = "rounded-xl border border-white/8 bg-card";

export const statCard = `${card} px-[18px] py-3.5`;
export const statLabel = "text-[11.5px] text-muted";
export const statValue = "mt-1.5 font-mono text-xl font-semibold text-ink";

export const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-dim outline-none focus:border-accent/50";
export const labelClass = "block text-xs font-medium text-muted";

export const btnPrimary =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-[18px] py-2.5 text-[13.5px] font-bold text-deep transition-colors hover:bg-accent-soft disabled:cursor-default disabled:opacity-50";
export const btnGhost =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-card px-4 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-raise disabled:cursor-default disabled:opacity-50";
export const btnLink =
  "cursor-pointer text-accent hover:text-accent-soft hover:underline";

export const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-faint";
export const tdClass = "px-4 py-3 text-[13px]";
export const trClass =
  "border-b border-white/5 transition-colors last:border-0 hover:bg-raise";

const BADGE_BASE =
  "inline-block rounded-md px-2.5 py-1 text-[11.5px] font-bold";
export const badgeAccent = `${BADGE_BASE} bg-accent/14 text-accent`;
export const badgeWarn = `${BADGE_BASE} bg-warn/14 text-warn`;
export const badgeDanger = `${BADGE_BASE} bg-danger/14 text-danger`;
export const badgeInfo = `${BADGE_BASE} bg-info/14 text-info`;
export const badgeViolet = `${BADGE_BASE} bg-violet/14 text-violet`;
export const badgeMuted = `${BADGE_BASE} bg-white/8 text-muted`;

export type EstadoStock = "normal" | "bajo" | "critico" | "agotado";

export function estadoStock(stock: number, stockMinimo: number): EstadoStock {
  if (stock === 0) return "agotado";
  if (stock <= Math.ceil(stockMinimo / 2)) return "critico";
  if (stock <= stockMinimo) return "bajo";
  return "normal";
}

export const ESTADO_STOCK_UI: Record<
  EstadoStock,
  { texto: string; badge: string }
> = {
  normal: { texto: "Normal", badge: badgeAccent },
  bajo: { texto: "Bajo", badge: badgeWarn },
  critico: { texto: "Crítico", badge: badgeDanger },
  agotado: { texto: "Agotado", badge: `${BADGE_BASE} bg-danger/22 text-danger` },
};

export function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export function soles(valor: number | string) {
  return `S/ ${Number(valor).toFixed(2)}`;
}
