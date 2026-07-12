"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useEmpleado } from "@/components/AppShell";
import { API_URL } from "@/lib/api";
import {
  badgeDanger,
  badgeWarn,
  btnGhost,
  btnPrimary,
  card,
  estadoStock,
  ESTADO_STOCK_UI,
  soles,
} from "@/lib/ui";

type Resumen = {
  hoy: { total: string; comprobantes: number };
  ayer: { total: string; comprobantes: number };
  ventas7dias: { fecha: string; total: string; comprobantes: number }[];
  alertasStock: {
    id: number;
    nombre: string;
    stock: number;
    stockMinimo: number;
  }[];
  lotesPorVencer: {
    id: number;
    codigo: string;
    fechaVencimiento: string;
    stockActual: number;
    medicamento: { id: number; nombre: string };
  }[];
};

const DIA_MS = 24 * 60 * 60 * 1000;

function diasHasta(fecha: string) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(fecha).getTime() - hoy.getTime()) / DIA_MS);
}

function etiquetaDia(fecha: string, esUltimo: boolean) {
  if (esUltimo) return "Hoy";
  const dia = new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", {
    weekday: "short",
  });
  return dia.charAt(0).toUpperCase() + dia.slice(1).replace(".", "");
}

function Delta({ actual, anterior }: { actual: number; anterior: number }) {
  if (anterior === 0 && actual === 0) {
    return (
      <div className="mt-1.5 text-xs font-semibold text-faint">
        Sin movimiento
      </div>
    );
  }
  if (anterior === 0) {
    return (
      <div className="mt-1.5 text-xs font-semibold text-accent">▲ vs. ayer</div>
    );
  }
  const pct = Math.round(((actual - anterior) / anterior) * 100);
  if (pct >= 0) {
    return (
      <div className="mt-1.5 text-xs font-semibold text-accent">
        ▲ {pct}% vs. ayer
      </div>
    );
  }
  return (
    <div className="mt-1.5 text-xs font-semibold text-warn">
      ▼ {Math.abs(pct)}% vs. ayer
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const empleado = useEmpleado();
  const esAdmin = empleado.rol === "ADMINISTRADOR";
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const load = useCallback(() => {
    return fetch(`${API_URL}/dashboard`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<Resumen>;
      })
      .then((data) => {
        setResumen(data);
        setError(null);
      })
      .catch(() => setError("No se pudo cargar el panel"))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!esAdmin) {
      router.replace("/ventas");
      return;
    }
    void load();
  }, [esAdmin, load, router]);

  function refrescar() {
    setCargando(true);
    void load();
  }

  if (!esAdmin) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-muted">{error}</p>
        <button onClick={refrescar} className={btnGhost}>
          Reintentar
        </button>
      </div>
    );
  }
  if (!resumen) {
    return <p className="py-20 text-center text-muted">Cargando…</p>;
  }

  const totalHoy = Number(resumen.hoy.total);
  const totalAyer = Number(resumen.ayer.total);
  const ticketHoy =
    resumen.hoy.comprobantes > 0 ? totalHoy / resumen.hoy.comprobantes : 0;
  const ticketAyer =
    resumen.ayer.comprobantes > 0 ? totalAyer / resumen.ayer.comprobantes : 0;
  const criticos = resumen.alertasStock.filter((a) => {
    const estado = estadoStock(a.stock, a.stockMinimo);
    return estado === "critico" || estado === "agotado";
  }).length;

  const maxDia = Math.max(
    ...resumen.ventas7dias.map((d) => Number(d.total)),
    1,
  );
  const fechaHoy = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[21px] font-bold text-ink">
            Buen día, {empleado.nombre.split(" ")[0]}
          </h1>
          <p className="mt-1 text-[13px] capitalize text-muted">{fechaHoy}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={refrescar} disabled={cargando} className={btnGhost}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 12a8 8 0 1 1-2.34-5.66" />
              <path d="M20 4v4h-4" />
            </svg>
            {cargando ? "Actualizando…" : "Actualizar"}
          </button>
          <Link href="/ventas" className={btnPrimary}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="#0E241D"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
            Registrar venta
          </Link>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted">Ventas de hoy</div>
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-accent/14 font-mono text-[10.5px] font-bold text-accent">
              S/
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-semibold text-ink">
            {soles(totalHoy)}
          </div>
          <Delta actual={totalHoy} anterior={totalAyer} />
        </div>

        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted">
              Comprobantes emitidos
            </div>
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-info/14 text-xs font-bold text-info">
              #
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-semibold text-ink">
            {resumen.hoy.comprobantes}
          </div>
          <Delta
            actual={resumen.hoy.comprobantes}
            anterior={resumen.ayer.comprobantes}
          />
        </div>

        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted">
              Ticket promedio
            </div>
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-warn/14 text-[13px] font-bold text-warn">
              ~
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-semibold text-ink">
            {soles(ticketHoy)}
          </div>
          <Delta actual={ticketHoy} anterior={ticketAyer} />
        </div>

        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted">Stock crítico</div>
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-danger/14 text-[13px] font-bold text-danger">
              !
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-semibold text-ink">
            {criticos} {criticos === 1 ? "producto" : "productos"}
          </div>
          <div
            className={`mt-1.5 text-xs font-semibold ${criticos > 0 ? "text-danger" : "text-accent"}`}
          >
            {criticos > 0 ? "Revisar hoy" : "Todo en orden"}
          </div>
        </div>
      </div>

      <div className="mb-4 grid items-stretch gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className={`${card} px-[22px] py-5`}>
          <div className="text-[13.5px] font-semibold text-ink">
            Ventas de los últimos 7 días
          </div>
          <div className="mb-5 text-xs text-faint">En soles (S/)</div>
          <div className="flex h-[150px] items-end gap-3.5">
            {resumen.ventas7dias.map((dia, i) => {
              const esUltimo = i === resumen.ventas7dias.length - 1;
              const altura = Math.round((Number(dia.total) / maxDia) * 100);
              return (
                <div
                  key={dia.fecha}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    title={soles(dia.total)}
                    className={`w-full max-w-[34px] rounded-t-md ${
                      esUltimo ? "bg-accent" : "bg-accent/35"
                    }`}
                    style={{ height: `${altura}%` }}
                  />
                  <div className="text-[11px] text-faint">
                    {etiquetaDia(dia.fecha, esUltimo)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${card} flex flex-col px-[22px] py-5`}>
          <div className="text-[13.5px] font-semibold text-ink">
            Próximos a vencer
          </div>
          <div className="mb-3.5 text-xs text-faint">
            Lotes con vencimiento cercano
          </div>
          {resumen.lotesPorVencer.length === 0 ? (
            <p className="text-[13px] text-muted">
              No hay lotes activos con stock.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {resumen.lotesPorVencer.map((lote) => {
                const dias = diasHasta(lote.fechaVencimiento);
                return (
                  <div
                    key={lote.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/6 bg-bg px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-semibold text-ink">
                        {lote.medicamento.nombre}
                      </div>
                      <div className="font-mono text-[11px] text-faint">
                        Lote {lote.codigo} ·{" "}
                        {new Date(lote.fechaVencimiento).toLocaleDateString(
                          "es-PE",
                          { timeZone: "UTC" },
                        )}
                      </div>
                    </div>
                    <span
                      className={`flex-none ${dias <= 30 ? badgeDanger : badgeWarn}`}
                    >
                      {dias} días
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={`${card} px-[22px] py-5`}>
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <div className="text-[13.5px] font-semibold text-ink">
              Alertas de stock
            </div>
            <div className="mt-0.5 text-xs text-faint">
              Productos en o por debajo de su stock mínimo
            </div>
          </div>
          <Link
            href="/productos"
            className="text-[12.5px] font-semibold text-accent hover:text-accent-soft hover:underline"
          >
            Ver inventario →
          </Link>
        </div>
        {resumen.alertasStock.length === 0 ? (
          <p className="text-[13px] text-muted">
            Ningún producto está por debajo de su mínimo.
          </p>
        ) : (
          <div className="flex flex-col gap-px overflow-hidden rounded-lg">
            {resumen.alertasStock.map((alerta) => {
              const ui =
                ESTADO_STOCK_UI[estadoStock(alerta.stock, alerta.stockMinimo)];
              return (
                <div
                  key={alerta.id}
                  className="grid grid-cols-[2fr_1fr_1fr_100px] items-center gap-2.5 bg-bg px-3.5 py-3"
                >
                  <div className="text-[13px] font-medium text-ink">
                    {alerta.nombre}
                  </div>
                  <div className="font-mono text-[12.5px] text-ink">
                    Stock: {alerta.stock}
                  </div>
                  <div className="font-mono text-[12.5px] text-faint">
                    Mín: {alerta.stockMinimo}
                  </div>
                  <span className={`${ui.badge} justify-self-end`}>
                    {ui.texto}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
