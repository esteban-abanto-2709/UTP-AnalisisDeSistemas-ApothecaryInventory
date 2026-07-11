"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { API_URL } from "@/lib/api";

type Proveedor = {
  id: number;
  ruc: string;
  razonSocial: string;
  asesorNombre: string | null;
  asesorTelefono: string | null;
  asesorEmail: string | null;
  activo: boolean;
};

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function ProveedoresPage() {
  const router = useRouter();
  const [proveedores, setProveedores] = useState<Proveedor[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    return fetch(`${API_URL}/proveedores`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        if (res.status === 403) {
          router.push("/");
          return null;
        }
        return res.json() as Promise<Proveedor[]>;
      })
      .then((data) => {
        if (data) setProveedores(data);
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = busqueda.trim().toLowerCase();
  const visibles = proveedores?.filter(
    (p) => p.ruc.includes(q) || p.razonSocial.toLowerCase().includes(q),
  );

  function openCreate() {
    setEditing(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(proveedor: Proveedor) {
    setEditing(proveedor);
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const datos = {
      razonSocial: form.get("razonSocial"),
      asesorNombre: (form.get("asesorNombre") as string) || undefined,
      asesorTelefono: (form.get("asesorTelefono") as string) || undefined,
      asesorEmail: (form.get("asesorEmail") as string) || undefined,
    };
    const body = editing ? datos : { ruc: form.get("ruc"), ...datos };
    try {
      const res = await fetch(
        editing
          ? `${API_URL}/proveedores/${editing.id}`
          : `${API_URL}/proveedores`,
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

  async function toggleActivo(proveedor: Proveedor) {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/proveedores/${proveedor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ activo: !proveedor.activo }),
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
            Gestión de proveedores
          </h1>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            ← Volver al inicio
          </Link>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Nuevo proveedor
        </button>
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
              {editing ? `Editar a ${editing.razonSocial}` : "Nuevo proveedor"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {editing ? (
                <p className="text-sm text-zinc-500 sm:col-span-2 dark:text-zinc-400">
                  RUC {editing.ruc}
                </p>
              ) : (
                <label className={labelClass}>
                  RUC
                  <input
                    name="ruc"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{11}"
                    maxLength={11}
                    required
                    title="RUC (11 dígitos)"
                    className={inputClass}
                  />
                </label>
              )}
              <label className={`${labelClass} sm:col-span-2`}>
                Razón social
                <input
                  name="razonSocial"
                  type="text"
                  required
                  defaultValue={editing?.razonSocial}
                  className={inputClass}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Nombre del asesor
                <input
                  name="asesorNombre"
                  type="text"
                  defaultValue={editing?.asesorNombre ?? ""}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Teléfono del asesor
                <input
                  name="asesorTelefono"
                  type="text"
                  inputMode="tel"
                  defaultValue={editing?.asesorTelefono ?? ""}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Email del asesor
                <input
                  name="asesorEmail"
                  type="email"
                  defaultValue={editing?.asesorEmail ?? ""}
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
          placeholder="Buscar por RUC o razón social…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputClass} mb-4 mt-0`}
        />

        {!visibles ? (
          <p className="text-zinc-500 dark:text-zinc-400">Cargando…</p>
        ) : visibles.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No hay proveedores que coincidan.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">RUC</th>
                  <th className="px-4 py-3 font-medium">Razón social</th>
                  <th className="px-4 py-3 font-medium">Asesor</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="text-zinc-900 dark:text-zinc-50">
                {visibles.map((proveedor) => (
                  <tr
                    key={proveedor.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-3">{proveedor.ruc}</td>
                    <td className="px-4 py-3">{proveedor.razonSocial}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {proveedor.asesorNombre ?? "—"}
                      {proveedor.asesorTelefono && (
                        <span> · {proveedor.asesorTelefono}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          proveedor.activo
                            ? "text-green-700 dark:text-green-400"
                            : "text-zinc-400 dark:text-zinc-500"
                        }
                      >
                        {proveedor.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(proveedor)}
                        className="text-zinc-600 hover:underline dark:text-zinc-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivo(proveedor)}
                        className="ml-3 text-zinc-600 hover:underline dark:text-zinc-300"
                      >
                        {proveedor.activo ? "Desactivar" : "Activar"}
                      </button>
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
