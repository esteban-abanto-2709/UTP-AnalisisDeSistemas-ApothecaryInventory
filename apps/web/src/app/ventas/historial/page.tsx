"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

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

const METODO: Record<Venta["metodoPago"], string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  YAPE_PLIN: "Yape / Plin",
};

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

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

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Historial de ventas
          </h1>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            ← Volver al inicio
          </Link>
        </div>
        <Link
          href="/ventas"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Nueva venta
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl p-6">
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Buscar
            <input
              type="search"
              placeholder="Comprobante, cliente o vendedor…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        {!visibles ? (
          !error && (
            <p className="text-zinc-500 dark:text-zinc-400">Cargando…</p>
          )
        ) : visibles.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No hay ventas en el periodo seleccionado.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Comprobante</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Vendedor</th>
                  <th className="px-4 py-3 font-medium">Pago</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="text-zinc-900 dark:text-zinc-50">
                {visibles.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-3">
                      {new Date(v.createdAt).toLocaleString("es-PE")}
                    </td>
                    <td className="px-4 py-3">
                      {v.serie}-{String(v.numero).padStart(6, "0")}
                    </td>
                    <td className="px-4 py-3">
                      {v.cliente?.nombre ?? "Cliente Varios"}
                    </td>
                    <td className="px-4 py-3">{v.empleado.nombre}</td>
                    <td className="px-4 py-3">{METODO[v.metodoPago]}</td>
                    <td className="px-4 py-3 text-right">
                      S/ {Number(v.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/ventas/${v.id}`}
                        className="text-zinc-600 hover:underline dark:text-zinc-300"
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
    </main>
  );
}
