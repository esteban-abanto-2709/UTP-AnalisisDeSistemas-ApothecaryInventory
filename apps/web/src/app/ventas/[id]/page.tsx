"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Venta = {
  id: number;
  tipoComprobante: "BOLETA" | "FACTURA";
  serie: string;
  numero: number;
  metodoPago: "EFECTIVO" | "TARJETA" | "YAPE_PLIN";
  total: string;
  createdAt: string;
  cliente: {
    tipoDocumento: "DNI" | "RUC";
    numeroDocumento: string;
    nombre: string;
  } | null;
  empleado: { nombre: string };
  detalles: {
    id: number;
    cantidad: number;
    precioUnitario: string;
    subtotal: string;
    medicamento: { nombre: string };
  }[];
};

const METODO: Record<Venta["metodoPago"], string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  YAPE_PLIN: "Yape / Plin",
};

export default function ComprobantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [venta, setVenta] = useState<Venta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/ventas/${id}`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        if (!res.ok) {
          setError("No se encontró la venta");
          return null;
        }
        return res.json() as Promise<Venta>;
      })
      .then((data) => {
        if (data) setVenta(data);
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [id, router]);

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-500 dark:text-zinc-400">{error}</p>
      </main>
    );
  }
  if (!venta) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-500 dark:text-zinc-400">Cargando…</p>
      </main>
    );
  }

  const numeroComprobante = `${venta.serie}-${String(venta.numero).padStart(6, "0")}`;

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 print:bg-white dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 print:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Comprobante {numeroComprobante}
          </h1>
          <div className="flex gap-3 text-sm">
            <Link
              href="/ventas"
              className="text-zinc-500 hover:underline dark:text-zinc-400"
            >
              ← Nueva venta
            </Link>
            <Link
              href="/"
              className="text-zinc-500 hover:underline dark:text-zinc-400"
            >
              Inicio
            </Link>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Imprimir
        </button>
      </header>

      <div className="mx-auto w-full max-w-lg p-6 print:max-w-none print:p-0">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 print:rounded-none print:border-0 dark:border-zinc-800 dark:bg-zinc-950 dark:print:bg-white">
          <div className="text-center dark:text-zinc-50 dark:print:text-zinc-900">
            <h2 className="font-semibold">Botica Conquistadores Farma S.A.C.</h2>
            <p className="text-sm">
              Prol. 28 de Julio 140, Lurigancho-Chosica, Lima
            </p>
            <p className="mt-2 text-sm font-medium">
              {venta.tipoComprobante === "BOLETA"
                ? "BOLETA DE VENTA"
                : "FACTURA"}{" "}
              {numeroComprobante}
            </p>
          </div>

          <dl className="mt-4 space-y-1 border-t border-zinc-200 pt-4 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 dark:print:text-zinc-700">
            <div className="flex justify-between">
              <dt>Fecha</dt>
              <dd>{new Date(venta.createdAt).toLocaleString("es-PE")}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Cliente</dt>
              <dd>
                {venta.cliente
                  ? `${venta.cliente.nombre} (${venta.cliente.tipoDocumento} ${venta.cliente.numeroDocumento})`
                  : "Cliente Varios"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Vendedor</dt>
              <dd>{venta.empleado.nombre}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Pago</dt>
              <dd>{METODO[venta.metodoPago]}</dd>
            </div>
          </dl>

          <table className="mt-4 w-full border-t border-zinc-200 text-left text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-50 dark:print:text-zinc-900">
            <thead className="text-zinc-500 dark:text-zinc-400 dark:print:text-zinc-500">
              <tr>
                <th className="py-2 font-medium">Cant.</th>
                <th className="py-2 font-medium">Producto</th>
                <th className="py-2 text-right font-medium">P. unit.</th>
                <th className="py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.detalles.map((d) => (
                <tr key={d.id}>
                  <td className="py-1">{d.cantidad}</td>
                  <td className="py-1">{d.medicamento.nombre}</td>
                  <td className="py-1 text-right">
                    {Number(d.precioUnitario).toFixed(2)}
                  </td>
                  <td className="py-1 text-right">
                    {Number(d.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-4 border-t border-zinc-200 pt-4 text-right text-lg font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50 dark:print:text-zinc-900">
            Total: S/ {Number(venta.total).toFixed(2)}
          </p>
        </div>
      </div>
    </main>
  );
}
