"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { API_URL } from "@/lib/api";

type Cliente = {
  id: number;
  tipoDocumento: "DNI" | "RUC";
  numeroDocumento: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  activo: boolean;
};

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    return fetch(`${API_URL}/clientes`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json() as Promise<Cliente[]>;
      })
      .then((data) => {
        if (data) setClientes(data);
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = busqueda.trim().toLowerCase();
  const visibles = clientes?.filter(
    (c) =>
      c.numeroDocumento.includes(q) || c.nombre.toLowerCase().includes(q),
  );

  function openCreate() {
    setEditing(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(cliente: Cliente) {
    setEditing(cliente);
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const contacto = {
      nombre: form.get("nombre"),
      telefono: (form.get("telefono") as string) || undefined,
      direccion: (form.get("direccion") as string) || undefined,
      email: (form.get("email") as string) || undefined,
    };
    const body = editing
      ? contacto
      : {
          tipoDocumento: form.get("tipoDocumento"),
          numeroDocumento: form.get("numeroDocumento"),
          ...contacto,
        };
    try {
      const res = await fetch(
        editing ? `${API_URL}/clientes/${editing.id}` : `${API_URL}/clientes`,
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

  async function toggleActivo(cliente: Cliente) {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/clientes/${cliente.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ activo: !cliente.activo }),
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
            Gestión de clientes
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
          Nuevo cliente
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
              {editing ? `Editar a ${editing.nombre}` : "Nuevo cliente"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {editing ? (
                <p className="text-sm text-zinc-500 sm:col-span-2 dark:text-zinc-400">
                  {editing.tipoDocumento} {editing.numeroDocumento}
                </p>
              ) : (
                <>
                  <label className={labelClass}>
                    Tipo de documento
                    <select name="tipoDocumento" className={inputClass}>
                      <option value="DNI">DNI</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Número de documento
                    <input
                      name="numeroDocumento"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{8}|\d{11}"
                      maxLength={11}
                      required
                      title="DNI (8 dígitos) o RUC (11 dígitos)"
                      className={inputClass}
                    />
                  </label>
                </>
              )}
              <label className={`${labelClass} sm:col-span-2`}>
                Nombre o razón social
                <input
                  name="nombre"
                  type="text"
                  required
                  defaultValue={editing?.nombre}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Teléfono
                <input
                  name="telefono"
                  type="text"
                  inputMode="tel"
                  defaultValue={editing?.telefono ?? ""}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Email
                <input
                  name="email"
                  type="email"
                  defaultValue={editing?.email ?? ""}
                  className={inputClass}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Dirección
                <input
                  name="direccion"
                  type="text"
                  defaultValue={editing?.direccion ?? ""}
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
          placeholder="Buscar por documento o nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputClass} mb-4 mt-0`}
        />

        {!visibles ? (
          <p className="text-zinc-500 dark:text-zinc-400">Cargando…</p>
        ) : visibles.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No hay clientes que coincidan.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="text-zinc-900 dark:text-zinc-50">
                {visibles.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-3">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {cliente.tipoDocumento}
                      </span>{" "}
                      {cliente.numeroDocumento}
                    </td>
                    <td className="px-4 py-3">{cliente.nombre}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {cliente.telefono ?? cliente.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          cliente.activo
                            ? "text-green-700 dark:text-green-400"
                            : "text-zinc-400 dark:text-zinc-500"
                        }
                      >
                        {cliente.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(cliente)}
                        className="text-zinc-600 hover:underline dark:text-zinc-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivo(cliente)}
                        className="ml-3 text-zinc-600 hover:underline dark:text-zinc-300"
                      >
                        {cliente.activo ? "Desactivar" : "Activar"}
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
