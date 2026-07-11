"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { API_URL } from "@/lib/api";

type Usuario = {
  id: number;
  dni: string;
  nombre: string;
  rol: "VENDEDOR" | "ADMINISTRADOR";
  activo: boolean;
};

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    return fetch(`${API_URL}/usuarios`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        if (res.status === 403) {
          router.push("/");
          return null;
        }
        return res.json() as Promise<Usuario[]>;
      })
      .then((data) => {
        if (data) setUsuarios(data);
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(usuario: Usuario) {
    setEditing(usuario);
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = form.get("password") as string;
    const body = editing
      ? {
          nombre: form.get("nombre"),
          rol: form.get("rol"),
          ...(password ? { password } : {}),
        }
      : {
          dni: form.get("dni"),
          nombre: form.get("nombre"),
          rol: form.get("rol"),
          password,
        };
    try {
      const res = await fetch(
        editing ? `${API_URL}/usuarios/${editing.id}` : `${API_URL}/usuarios`,
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

  async function toggleActivo(usuario: Usuario) {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ activo: !usuario.activo }),
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
            Gestión de usuarios
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
          Nuevo empleado
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
              {editing ? `Editar a ${editing.nombre}` : "Nuevo empleado"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {!editing && (
                <label className={labelClass}>
                  DNI
                  <input
                    name="dni"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{8}"
                    maxLength={8}
                    required
                    className={inputClass}
                  />
                </label>
              )}
              <label className={labelClass}>
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
                Rol
                <select
                  name="rol"
                  defaultValue={editing?.rol ?? "VENDEDOR"}
                  className={inputClass}
                >
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </label>
              <label className={labelClass}>
                {editing ? "Nueva contraseña (opcional)" : "Contraseña"}
                <input
                  name="password"
                  type="password"
                  minLength={6}
                  required={!editing}
                  autoComplete="new-password"
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

        {!usuarios ? (
          <p className="text-zinc-500 dark:text-zinc-400">Cargando…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="text-zinc-900 dark:text-zinc-50">
                {usuarios.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-3">{usuario.dni}</td>
                    <td className="px-4 py-3">{usuario.nombre}</td>
                    <td className="px-4 py-3">
                      {usuario.rol === "ADMINISTRADOR"
                        ? "Administrador"
                        : "Vendedor"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          usuario.activo
                            ? "text-green-700 dark:text-green-400"
                            : "text-zinc-400 dark:text-zinc-500"
                        }
                      >
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(usuario)}
                        className="text-zinc-600 hover:underline dark:text-zinc-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivo(usuario)}
                        className="ml-3 text-zinc-600 hover:underline dark:text-zinc-300"
                      >
                        {usuario.activo ? "Desactivar" : "Activar"}
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
