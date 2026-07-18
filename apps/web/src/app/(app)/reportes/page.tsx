"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { API_URL } from "@/lib/api";
import { descargarCSV } from "@/lib/csv";
import {
  btnGhost,
  btnPrimary,
  card,
  celdaTexto,
  inputClass,
  labelClass,
  soles,
  statCard,
  statLabel,
  statValue,
  tdClass,
  thClass,
  trClass,
} from "@/lib/ui";

type VentasDiarias = {
  filas: { fecha: string; comprobantes: number; total: string }[];
  totales: { comprobantes: number; total: string };
};

type Rotacion = {
  filas: {
    medicamentoId: number;
    nombre: string;
    unidades: number;
    importe: string;
  }[];
  totales: { unidades: number; importe: string };
};

function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inicioDeMes() {
  return `${hoyLocal().slice(0, 8)}01`;
}

export default function ReportesPage() {
  const router = useRouter();
  const [desde, setDesde] = useState(inicioDeMes);
  const [hasta, setHasta] = useState(hoyLocal);
  const [ventas, setVentas] = useState<VentasDiarias | null>(null);
  const [rotacion, setRotacion] = useState<Rotacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const generar = useCallback(
    (inicio: string, fin: string) => {
      const query = `desde=${inicio}&hasta=${fin}`;
      return Promise.all([
        fetch(`${API_URL}/reportes/ventas-diarias?${query}`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/reportes/rotacion?${query}`, {
          credentials: "include",
        }),
      ])
        .then(async ([resVentas, resRotacion]) => {
          if (resVentas.status === 401) {
            router.push("/login");
            return;
          }
          if (resVentas.status === 403) {
            router.push("/");
            return;
          }
          if (!resVentas.ok) {
            const data = (await resVentas.json().catch(() => null)) as {
              message?: string | string[];
            } | null;
            const message = data?.message;
            setError(
              Array.isArray(message)
                ? message[0]
                : (message ?? "No se pudo generar el reporte"),
            );
            setVentas(null);
            setRotacion(null);
            return;
          }
          setVentas((await resVentas.json()) as VentasDiarias);
          setRotacion((await resRotacion.json()) as Rotacion);
        })
        .catch(() => setError("No se pudo conectar con el servidor"))
        .finally(() => setCargando(false));
    },
    [router],
  );

  useEffect(() => {
    void generar(inicioDeMes(), hoyLocal());
  }, [generar]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCargando(true);
    setError(null);
    void generar(desde, hasta);
  }

  function exportarVentas() {
    if (!ventas) return;
    descargarCSV(`ventas-diarias_${desde}_${hasta}.csv`, [
      ["Fecha", "Comprobantes", "Total (S/)"],
      ...ventas.filas.map((f) => [f.fecha, f.comprobantes, f.total]),
      ["Total", ventas.totales.comprobantes, ventas.totales.total],
    ]);
  }

  function exportarRotacion() {
    if (!rotacion) return;
    descargarCSV(`rotacion-productos_${desde}_${hasta}.csv`, [
      ["Producto", "Unidades vendidas", "Importe (S/)"],
      ...rotacion.filas.map((f) => [f.nombre, f.unidades, f.importe]),
      ["Total", rotacion.totales.unidades, rotacion.totales.importe],
    ]);
  }

  const sinVentas = ventas?.totales.comprobantes === 0;

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[21px] font-bold text-ink">
          Reportes de ventas y rotación
        </h1>
        <button
          onClick={() => window.print()}
          className={`${btnGhost} print:hidden`}
        >
          Imprimir / PDF
        </button>
      </div>
      <p className="mb-5 text-[13px] text-muted">
        Periodo del {desde} al {hasta}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mb-5 flex flex-wrap items-end gap-3 print:hidden"
      >
        <label className={labelClass}>
          Desde
          <input
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
            suppressHydrationWarning
            className={`${inputClass} w-[180px]`}
          />
        </label>
        <label className={labelClass}>
          Hasta
          <input
            type="date"
            value={hasta}
            min={desde}
            onChange={(e) => setHasta(e.target.value)}
            suppressHydrationWarning
            className={`${inputClass} w-[180px]`}
          />
        </label>
        <button type="submit" disabled={cargando} className={btnPrimary}>
          {cargando ? "Generando…" : "Generar"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      {ventas && rotacion && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
            <div className={statCard}>
              <div className={statLabel}>Comprobantes</div>
              <div className={statValue}>{ventas.totales.comprobantes}</div>
            </div>
            <div className={statCard}>
              <div className={statLabel}>Total vendido</div>
              <div className={statValue}>{soles(ventas.totales.total)}</div>
            </div>
            <div className={statCard}>
              <div className={statLabel}>Unidades despachadas</div>
              <div className={statValue}>{rotacion.totales.unidades}</div>
            </div>
            <div className={statCard}>
              <div className={statLabel}>Productos distintos</div>
              <div className={statValue}>{rotacion.filas.length}</div>
            </div>
          </div>

          {sinVentas ? (
            <p className={`${card} px-[18px] py-5 text-[13px] text-muted`}>
              No hay ventas registradas en el periodo seleccionado.
            </p>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <section>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <h2 className="text-[15px] font-semibold text-ink">
                    Ventas diarias
                  </h2>
                  <button
                    onClick={exportarVentas}
                    className={`${btnGhost} print:hidden`}
                  >
                    Excel (CSV)
                  </button>
                </div>
                <div className={`${card} overflow-x-auto`}>
                  <table className="w-full text-left">
                    <thead className="border-b border-white/8">
                      <tr>
                        <th className={thClass}>Fecha</th>
                        <th className={thClass}>Comprobantes</th>
                        <th className={`${thClass} text-right`}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventas.filas.map((fila) => (
                        <tr key={fila.fecha} className={trClass}>
                          <td className={`${tdClass} font-mono text-ink`}>
                            {fila.fecha}
                          </td>
                          <td className={`${tdClass} font-mono text-muted`}>
                            {fila.comprobantes}
                          </td>
                          <td
                            className={`${tdClass} text-right font-mono text-ink`}
                          >
                            {soles(fila.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-white/8">
                      <tr>
                        <td className={`${tdClass} font-semibold text-ink`}>
                          Total
                        </td>
                        <td className={`${tdClass} font-mono text-muted`}>
                          {ventas.totales.comprobantes}
                        </td>
                        <td
                          className={`${tdClass} text-right font-mono font-semibold text-ink`}
                        >
                          {soles(ventas.totales.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              <section>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <h2 className="text-[15px] font-semibold text-ink">
                    Rotación de productos
                  </h2>
                  <button
                    onClick={exportarRotacion}
                    className={`${btnGhost} print:hidden`}
                  >
                    Excel (CSV)
                  </button>
                </div>
                <div className={`${card} overflow-x-auto`}>
                  <table className="w-full text-left">
                    <thead className="border-b border-white/8">
                      <tr>
                        <th className={thClass}>Producto</th>
                        <th className={thClass}>Unidades</th>
                        <th className={`${thClass} text-right`}>Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rotacion.filas.map((fila) => (
                        <tr key={fila.medicamentoId} className={trClass}>
                          <td className={`${tdClass} font-medium text-ink`}>
                            <span className={celdaTexto} title={fila.nombre}>
                              {fila.nombre}
                            </span>
                          </td>
                          <td className={`${tdClass} font-mono text-ink`}>
                            {fila.unidades}
                          </td>
                          <td
                            className={`${tdClass} text-right font-mono text-ink`}
                          >
                            {soles(fila.importe)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-white/8">
                      <tr>
                        <td className={`${tdClass} font-semibold text-ink`}>
                          Total
                        </td>
                        <td className={`${tdClass} font-mono text-muted`}>
                          {rotacion.totales.unidades}
                        </td>
                        <td
                          className={`${tdClass} text-right font-mono font-semibold text-ink`}
                        >
                          {soles(rotacion.totales.importe)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
