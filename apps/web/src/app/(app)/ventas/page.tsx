"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import {
  btnGhost,
  btnPrimary,
  card,
  inputClass,
  labelClass,
  soles,
  tdClass,
  thClass,
  trClass,
} from "@/lib/ui";

type Producto = {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
  stockMinimo: number;
  activo: boolean;
};

type Cliente = {
  id: number;
  tipoDocumento: "DNI" | "RUC";
  numeroDocumento: string;
  nombre: string;
  activo: boolean;
};

type ItemCarrito = { producto: Producto; cantidad: number };

export default function VentasPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [documento, setDocumento] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [clienteMsg, setClienteMsg] = useState<string | null>(null);
  const [tipoComprobante, setTipoComprobante] = useState("BOLETA");
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/productos`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json() as Promise<Producto[]>;
      })
      .then((data) => {
        if (data) setProductos(data.filter((p) => p.activo));
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [router]);

  const q = busqueda.trim().toLowerCase();
  const resultados =
    q === ""
      ? []
      : (productos ?? [])
          .filter((p) => p.nombre.toLowerCase().includes(q))
          .slice(0, 8);

  function agregar(producto: Producto) {
    setCarrito((items) => {
      const existente = items.find((i) => i.producto.id === producto.id);
      if (existente) {
        return items.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: Math.min(i.cantidad + 1, producto.stock) }
            : i,
        );
      }
      return [...items, { producto, cantidad: 1 }];
    });
    setBusqueda("");
  }

  function cambiarCantidad(productoId: number, cantidad: number) {
    setCarrito((items) =>
      items.map((i) =>
        i.producto.id === productoId
          ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.producto.stock)) }
          : i,
      ),
    );
  }

  function quitar(productoId: number) {
    setCarrito((items) => items.filter((i) => i.producto.id !== productoId));
  }

  async function buscarCliente() {
    const numero = documento.trim();
    if (!numero) return;
    setClienteMsg(null);
    setCliente(null);
    try {
      const res = await fetch(`${API_URL}/clientes/documento/${numero}`, {
        credentials: "include",
      });
      if (res.status === 404) {
        setClienteMsg(
          "Cliente no registrado: la venta saldrá como Cliente Varios, o regístralo en Clientes.",
        );
        return;
      }
      if (!res.ok) {
        setClienteMsg("Error al buscar el cliente");
        return;
      }
      setCliente((await res.json()) as Cliente);
    } catch {
      setClienteMsg("No se pudo conectar con el servidor");
    }
  }

  const total = carrito.reduce(
    (s, i) => s + Number(i.producto.precio) * i.cantidad,
    0,
  );

  async function confirmar() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tipoComprobante,
          metodoPago,
          clienteId: cliente?.id,
          items: carrito.map((i) => ({
            medicamentoId: i.producto.id,
            cantidad: i.cantidad,
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = data?.message;
        setError(
          Array.isArray(message)
            ? message[0]
            : (message ?? "Error al registrar la venta"),
        );
        return;
      }
      router.push(`/ventas/${data.id}`);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1.5 text-[21px] font-bold text-ink">Punto de venta</h1>
      <p className="mb-5 text-[13px] text-muted">
        Busca productos, arma el carrito y confirma la venta
      </p>

      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="relative mb-4">
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
              placeholder="Buscar producto para agregar…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`${inputClass} mt-0 bg-card py-3 pl-9`}
            />
            {resultados.length > 0 && (
              <ul className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border border-white/10 bg-surface shadow-xl">
                {resultados.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => agregar(p)}
                      disabled={p.stock === 0}
                      className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-[13px] text-ink hover:bg-raise disabled:cursor-default disabled:opacity-40"
                    >
                      <span>{p.nombre}</span>
                      <span className="font-mono text-[12px] text-muted">
                        {soles(p.precio)} · stock {p.stock}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {carrito.length === 0 ? (
            <div
              className={`${card} flex flex-col items-center gap-2 px-6 py-14 text-center`}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="text-dim"
              >
                <path d="M3 6h2l1.6 9.2A2 2 0 0 0 8.57 17H18a2 2 0 0 0 1.96-1.6L21 9H6" />
                <circle cx="9.5" cy="20" r="1.2" />
                <circle cx="17.5" cy="20" r="1.2" />
              </svg>
              <p className="text-[13px] text-muted">
                El carrito está vacío. Busca productos para agregarlos a la
                venta.
              </p>
            </div>
          ) : (
            <div className={`${card} overflow-x-auto`}>
              <table className="w-full min-w-[560px] text-left">
                <thead className="border-b border-white/8">
                  <tr>
                    <th className={thClass}>Producto</th>
                    <th className={thClass}>Precio</th>
                    <th className={thClass}>Cantidad</th>
                    <th className={`${thClass} text-right`}>Subtotal</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((item) => (
                    <tr key={item.producto.id} className={trClass}>
                      <td className={`${tdClass} font-medium text-ink`}>
                        {item.producto.nombre}
                      </td>
                      <td className={`${tdClass} font-mono text-muted`}>
                        {soles(item.producto.precio)}
                      </td>
                      <td className={tdClass}>
                        <input
                          type="number"
                          min={1}
                          max={item.producto.stock}
                          value={item.cantidad}
                          onChange={(e) =>
                            cambiarCantidad(
                              item.producto.id,
                              e.target.valueAsNumber || 1,
                            )
                          }
                          className="w-20 rounded-lg border border-white/10 bg-bg px-2.5 py-1.5 font-mono text-[13px] text-ink outline-none focus:border-accent/50"
                        />
                      </td>
                      <td
                        className={`${tdClass} text-right font-mono font-semibold text-ink`}
                      >
                        {soles(Number(item.producto.precio) * item.cantidad)}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <button
                          onClick={() => quitar(item.producto.id)}
                          className="cursor-pointer text-[12.5px] font-semibold text-muted hover:text-danger"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={`${card} p-5`}>
          <div className="mb-4 text-[13.5px] font-semibold text-ink">
            Datos de la venta
          </div>

          <label className={labelClass}>
            Cliente (documento)
            <span className="mt-1 flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={documento}
                onChange={(e) =>
                  setDocumento(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Vacío = Cliente Varios"
                className={`${inputClass} mt-0`}
              />
              <button type="button" onClick={buscarCliente} className={btnGhost}>
                Buscar
              </button>
            </span>
          </label>
          <p className="mt-1.5 text-[12px] text-muted">
            {cliente
              ? `${cliente.tipoDocumento} ${cliente.numeroDocumento} · ${cliente.nombre}`
              : (clienteMsg ?? "Cliente Varios")}
          </p>

          <div className="mt-4 grid gap-4">
            <label className={labelClass}>
              Comprobante
              <select
                value={tipoComprobante}
                onChange={(e) => setTipoComprobante(e.target.value)}
                className={inputClass}
              >
                <option value="BOLETA">Boleta</option>
                <option value="FACTURA">Factura (requiere RUC)</option>
              </select>
            </label>
            <label className={labelClass}>
              Método de pago
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className={inputClass}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="YAPE_PLIN">Yape / Plin</option>
              </select>
            </label>
          </div>

          <div className="mt-5 border-t border-white/8 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-muted">Total</span>
              <span className="font-mono text-[22px] font-semibold text-ink">
                {soles(total)}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-faint">
              Referencial: los descuentos por lote se aplican al confirmar.
            </p>
            <button
              onClick={confirmar}
              disabled={saving || carrito.length === 0}
              className={`${btnPrimary} mt-4 w-full justify-center py-3`}
            >
              {saving ? "Registrando…" : "Confirmar venta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
