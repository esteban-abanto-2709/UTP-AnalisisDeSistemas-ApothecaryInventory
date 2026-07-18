"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import {
  badgeAccent,
  badgeInfo,
  badgeViolet,
  btnPrimary,
  card,
  inputClass,
  labelClass,
  soles,
  statCard,
  statLabel,
  statValue,
  celdaTexto,
  tdClass,
  thClass,
  trClass,
} from "@/lib/ui";

type Venta = {
  id: number;
  tipoComprobante: "BOLETA" | "FACTURA";
  serie: string;
  numero: number;
  metodoPago: "EFECTIVO" | "TARJETA" | "YAPE_PLIN";
  total: string;
  createdAt: string;
  cliente: { numeroDocumento: string; nombre: string } | null;
  empleado: { nombre: string };
};

const METODO: Record<Venta["metodoPago"], { texto: string; badge: string }> = {
  EFECTIVO: { texto: "Efectivo", badge: badgeAccent },
  TARJETA: { texto: "Tarjeta", badge: badgeInfo },
  YAPE_PLIN: { texto: "Yape / Plin", badge: badgeViolet },
};

export default function HistorialVentasPage() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[] | null>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    return fetch(`${API_URL}/ventas?${params}`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        if (res.status === 403) {
          setError("Solo el administrador puede ver el historial de ventas");
          return null;
        }
        return res.json() as Promise<Venta[]>;
      })
      .then((data) => {
        if (data) setVentas(data);
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [desde, hasta, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = filtro.trim().toLowerCase();
  const visibles = ventas?.filter((v) => {
    if (!q) return true;
    const comprobante =
      `${v.serie}-${String(v.numero).padStart(6, "0")}`.toLowerCase();
    return (
      comprobante.includes(q) ||
      (v.cliente?.nombre.toLowerCase().includes(q) ?? false) ||
      (v.cliente?.numeroDocumento.includes(q) ?? false) ||
      v.empleado.nombre.toLowerCase().includes(q)
    );
  });

  const totalPeriodo =
    ventas?.reduce((s, v) => s + Number(v.total), 0) ?? 0;
  const ticketPromedio =
    ventas && ventas.length > 0 ? totalPeriodo / ventas.length : 0;

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[21px] font-bold text-ink">Historial de ventas</h1>
        <Link href="/ventas" className={btnPrimary}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V19M5 12H19"
              stroke="#0E241D"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          Nueva venta
        </Link>
      </div>
      <p className="mb-5 text-[13px] text-muted">
        Consulta y filtra todos los comprobantes emitidos
      </p>

      {ventas && (
        <div className="mb-4 grid grid-cols-3 gap-3.5">
          <div className={statCard}>
            <div className={statLabel}>Ventas del periodo</div>
            <div className={statValue}>{soles(totalPeriodo)}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>N° comprobantes</div>
            <div className={statValue}>{ventas.length}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>Ticket promedio</div>
            <div className={statValue}>{soles(ticketPromedio)}</div>
          </div>
        </div>
      )}

      <div className="mb-3.5 flex flex-wrap items-end gap-2.5">
        <label className={labelClass}>
          Desde
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className={`${inputClass} bg-card`}
          />
        </label>
        <label className={labelClass}>
          Hasta
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className={`${inputClass} bg-card`}
          />
        </label>
        <div className="relative min-w-[220px] flex-1">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por N°, cliente o vendedor…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className={`${inputClass} mt-0 bg-card pl-9`}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      {!visibles ? (
        !error && <p className="text-muted">Cargando…</p>
      ) : visibles.length === 0 ? (
        <p className="text-muted">No hay ventas en el periodo seleccionado.</p>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[880px] text-left">
            <thead className="border-b border-white/8">
              <tr>
                <th className={thClass}>Comprobante</th>
                <th className={thClass}>Fecha / hora</th>
                <th className={thClass}>Cliente</th>
                <th className={thClass}>Vendedor</th>
                <th className={thClass}>Método</th>
                <th className={`${thClass} text-right`}>Total</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {visibles.map((v) => (
                <tr key={v.id} className={trClass}>
                  <td className={`${tdClass} font-mono text-ink`}>
                    {v.serie}-{String(v.numero).padStart(6, "0")}
                  </td>
                  <td className={`${tdClass} text-muted`}>
                    {new Date(v.createdAt).toLocaleString("es-PE")}
                  </td>
                  <td className={`${tdClass} text-ink`}>
                    <span className={celdaTexto}>
                      {v.cliente?.nombre ?? "Cliente Varios"}
                    </span>
                  </td>
                  <td className={`${tdClass} text-muted`}>
                    <span className={celdaTexto}>{v.empleado.nombre}</span>
                  </td>
                  <td className={tdClass}>
                    <span className={METODO[v.metodoPago].badge}>
                      {METODO[v.metodoPago].texto}
                    </span>
                  </td>
                  <td
                    className={`${tdClass} text-right font-mono font-semibold text-ink`}
                  >
                    {soles(v.total)}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <Link
                      href={`/ventas/${v.id}`}
                      className="cursor-pointer text-[12.5px] font-semibold text-accent hover:text-accent-soft hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
