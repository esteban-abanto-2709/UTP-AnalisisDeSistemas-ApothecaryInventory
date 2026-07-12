"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useEmpleado } from "@/components/AppShell";
import { API_URL } from "@/lib/api";
import { btnGhost, btnPrimary, card, soles } from "@/lib/ui";

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
  const esAdmin = useEmpleado().rol === "ADMINISTRADOR";
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
    return <p className="py-20 text-center text-muted">{error}</p>;
  }
  if (!venta) {
    return <p className="py-20 text-center text-muted">Cargando…</p>;
  }

  const numeroComprobante = `${venta.serie}-${String(venta.numero).padStart(6, "0")}`;

  return (
    <div className="mx-auto w-full max-w-lg print:max-w-none">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-[21px] font-bold text-ink">
            Comprobante{" "}
            <span className="font-mono font-semibold">
              {numeroComprobante}
            </span>
          </h1>
          <Link
            href="/ventas"
            className="text-[13px] text-muted hover:text-ink hover:underline"
          >
            ← Nueva venta
          </Link>
        </div>
        <button onClick={() => window.print()} className={btnPrimary}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0E241D"
            strokeWidth="2"
          >
            <path d="M6 9V3h12v6" />
            <rect x="4" y="9" width="16" height="8" rx="1.5" />
            <path d="M7 17h10v4H7z" />
          </svg>
          Imprimir
        </button>
      </div>

      <div
        className={`${card} p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-zinc-900`}
      >
        <div className="text-center">
          <h2 className="font-semibold text-ink print:text-zinc-900">
            Botica Conquistadores Farma S.A.C.
          </h2>
          <p className="text-sm text-muted print:text-zinc-700">
            Prol. 28 de Julio 140, Lurigancho-Chosica, Lima
          </p>
          <p className="mt-2 text-sm font-semibold text-ink print:text-zinc-900">
            {venta.tipoComprobante === "BOLETA" ? "BOLETA DE VENTA" : "FACTURA"}{" "}
            <span className="font-mono">{numeroComprobante}</span>
          </p>
        </div>

        <dl className="mt-4 space-y-1 border-t border-white/8 pt-4 text-sm text-muted print:border-zinc-300 print:text-zinc-700">
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

        <table className="mt-4 w-full border-t border-white/8 text-left text-sm text-ink print:border-zinc-300 print:text-zinc-900">
          <thead className="text-muted print:text-zinc-500">
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
                <td className="py-1 font-mono">{d.cantidad}</td>
                <td className="py-1">{d.medicamento.nombre}</td>
                <td className="py-1 text-right font-mono">
                  {Number(d.precioUnitario).toFixed(2)}
                </td>
                <td className="py-1 text-right font-mono">
                  {Number(d.subtotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-4 border-t border-white/8 pt-4 text-right text-lg font-semibold text-ink print:border-zinc-300 print:text-zinc-900">
          Total: <span className="font-mono">{soles(venta.total)}</span>
        </p>
      </div>

      {esAdmin && (
        <div className="mt-4 flex justify-center print:hidden">
          <Link href="/ventas/historial" className={btnGhost}>
            Ver historial de ventas
          </Link>
        </div>
      )}
    </div>
  );
}
