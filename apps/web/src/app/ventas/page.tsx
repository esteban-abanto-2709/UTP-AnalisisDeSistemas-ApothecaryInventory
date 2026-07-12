"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Producto = {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
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

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

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
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Nueva venta
          </h1>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl p-6">
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="relative mb-6">
          <input
            type="search"
            placeholder="Buscar producto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${inputClass} mt-0`}
          />
          {resultados.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              {resultados.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => agregar(p)}
                    disabled={p.stock === 0}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <span>{p.nombre}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      S/ {Number(p.precio).toFixed(2)} · stock {p.stock}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {carrito.length === 0 ? (
          <p className="mb-6 text-zinc-500 dark:text-zinc-400">
            Busca productos para agregarlos a la venta.
          </p>
        ) : (
          <div className="mb-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Cantidad</th>
                  <th className="px-4 py-3 font-medium">Subtotal</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="text-zinc-900 dark:text-zinc-50">
                {carrito.map((item) => (
                  <tr
                    key={item.producto.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-3">{item.producto.nombre}</td>
                    <td className="px-4 py-3">
                      S/ {Number(item.producto.precio).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
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
                        className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      S/{" "}
                      {(Number(item.producto.precio) * item.cantidad).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => quitar(item.producto.id)}
                        className="text-zinc-600 hover:underline dark:text-zinc-300"
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

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Cliente (documento)
                <span className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="Vacío = Cliente Varios"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={buscarCliente}
                    className="mt-1 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    Buscar
                  </button>
                </span>
              </label>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {cliente
                  ? `${cliente.tipoDocumento} ${cliente.numeroDocumento} · ${cliente.nombre}`
                  : (clienteMsg ?? "Cliente Varios")}
              </p>
            </div>
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
          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Total: S/ {total.toFixed(2)}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Referencial: los descuentos por lote se aplican al confirmar.
              </p>
            </div>
            <button
              onClick={confirmar}
              disabled={saving || carrito.length === 0}
              className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {saving ? "Registrando…" : "Confirmar venta"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
