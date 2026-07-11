"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { API_URL } from "@/lib/api";

type Producto = {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
  activo: boolean;
};

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function ProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editing, setEditing] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    return fetch(`${API_URL}/productos`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json() as Promise<Producto[]>;
      })
      .then((data) => {
        if (data) setProductos(data);
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [router]);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((me: { rol: string } | null) => {
        if (me) setEsAdmin(me.rol === "ADMINISTRADOR");
      })
      .catch(() => undefined);
    void load();
  }, [load]);

  const visibles = productos?.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  function openCreate() {
    setEditing(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(producto: Producto) {
    setEditing(producto);
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const body = {
      nombre: form.get("nombre"),
      precio: parseFloat(form.get("precio") as string),
      stock: parseInt(form.get("stock") as string, 10),
    };
    try {
      const res = await fetch(
        editing ? `${API_URL}/productos/${editing.id}` : `${API_URL}/productos`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.message;
        setError(
          Array.isArray(message) ? message[0] : (message ?? "Error al guardar"),
        );
        return;
      }
      setShowForm(false);
      await load();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(producto: Producto) {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/productos/${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ activo: !producto.activo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Error al actualizar");
        return;
      }
      await load();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Inventario de productos
          </h1>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            ← Volver al inicio
          </Link>
        </div>
        {esAdmin && (
          <button
            onClick={openCreate}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Nuevo producto
          </button>
        )}
      </header>

      <div className="mx-auto w-full max-w-3xl p-6">
        {error && (
          <p
            role="alert"
            className="mb-4 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
              {editing ? `Editar ${editing.nombre}` : "Nuevo producto"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className={`${labelClass} sm:col-span-3`}>
                Nombre
                <input
                  name="nombre"
                  type="text"
                  required
                  defaultValue={editing?.nombre}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Precio (S/)
                <input
                  name="precio"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={editing?.precio}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Stock
                <input
                  name="stock"
                  type="number"
                  step="1"
                  min="0"
                  required
                  defaultValue={editing?.stock}
                  className={inputClass}
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <input
          type="search"
          placeholder="Buscar producto…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputClass} mb-4 mt-0`}
        />

        {!visibles ? (
          <p className="text-zinc-500 dark:text-zinc-400">Cargando…</p>
        ) : visibles.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No hay productos que coincidan.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  {esAdmin && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="text-zinc-900 dark:text-zinc-50">
                {visibles.map((producto) => (
                  <tr
                    key={producto.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-3">{producto.nombre}</td>
                    <td className="px-4 py-3">
                      S/ {Number(producto.precio).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">{producto.stock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          producto.activo
                            ? "text-green-700 dark:text-green-400"
                            : "text-zinc-400 dark:text-zinc-500"
                        }
                      >
                        {producto.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    {esAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(producto)}
                          className="text-zinc-600 hover:underline dark:text-zinc-300"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleActivo(producto)}
                          className="ml-3 text-zinc-600 hover:underline dark:text-zinc-300"
                        >
                          {producto.activo ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                    )}
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
