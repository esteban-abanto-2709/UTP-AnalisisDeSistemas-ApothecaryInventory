"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Drawer from "@/components/Drawer";
import { API_URL } from "@/lib/api";
import {
  btnGhost,
  btnPrimary,
  card,
  inputClass,
  labelClass,
  tdClass,
  thClass,
  trClass,
} from "@/lib/ui";

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
    (c) => c.numeroDocumento.includes(q) || c.nombre.toLowerCase().includes(q),
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
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[21px] font-bold text-ink">Gestión de clientes</h1>
        <button onClick={openCreate} className={btnPrimary}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V19M5 12H19"
              stroke="#0E241D"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          Nuevo cliente
        </button>
      </div>
      <p className="mb-5 text-[13px] text-muted">
        Clientes registrados para boletas y facturas
      </p>

      <div className="relative mb-3.5 min-w-[240px] sm:max-w-[340px]">
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
          placeholder="Buscar por documento o nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputClass} mt-0 bg-card pl-9`}
        />
      </div>

      {error && !showForm && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      {!visibles ? (
        <p className="text-muted">Cargando…</p>
      ) : visibles.length === 0 ? (
        <p className="text-muted">No hay clientes que coincidan.</p>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-white/8">
              <tr>
                <th className={thClass}>Documento</th>
                <th className={thClass}>Nombre</th>
                <th className={thClass}>Contacto</th>
                <th className={thClass}>Estado</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {visibles.map((cliente) => (
                <tr key={cliente.id} className={trClass}>
                  <td className={`${tdClass} font-mono`}>
                    <span className="text-faint">{cliente.tipoDocumento}</span>{" "}
                    <span className="text-ink">{cliente.numeroDocumento}</span>
                  </td>
                  <td className={`${tdClass} font-medium text-ink`}>
                    {cliente.nombre}
                  </td>
                  <td className={`${tdClass} text-muted`}>
                    {cliente.telefono ?? cliente.email ?? "—"}
                  </td>
                  <td className={tdClass}>
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-[7px] w-[7px] rounded-full ${
                          cliente.activo ? "bg-accent" : "bg-dim"
                        }`}
                      />
                      <span className="text-[12.5px] text-muted">
                        {cliente.activo ? "Activo" : "Inactivo"}
                      </span>
                    </span>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-right`}>
                    <button
                      onClick={() => openEdit(cliente)}
                      className="cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActivo(cliente)}
                      className="ml-3 cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
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

      {showForm && (
        <Drawer
          titulo={editing ? `Editar a ${editing.nombre}` : "Nuevo cliente"}
          subtitulo={
            editing
              ? `${editing.tipoDocumento} ${editing.numeroDocumento}`
              : "Registra un cliente para sus comprobantes"
          }
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
            {!editing && (
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
            <label className={labelClass}>
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
            <label className={labelClass}>
              Dirección
              <input
                name="direccion"
                type="text"
                defaultValue={editing?.direccion ?? ""}
                className={inputClass}
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            <div className="mt-auto flex gap-2.5 border-t border-white/8 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`${btnGhost} flex-1 justify-center`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`${btnPrimary} flex-1 justify-center`}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </Drawer>
      )}
    </div>
  );
}
