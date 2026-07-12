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

type Proveedor = {
  id: number;
  ruc: string;
  razonSocial: string;
  asesorNombre: string | null;
  asesorTelefono: string | null;
  asesorEmail: string | null;
  activo: boolean;
};

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
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[21px] font-bold text-ink">
          Gestión de proveedores
        </h1>
        <button onClick={openCreate} className={btnPrimary}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V19M5 12H19"
              stroke="#0E241D"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          Nuevo proveedor
        </button>
      </div>
      <p className="mb-5 text-[13px] text-muted">
        Laboratorios y distribuidores que abastecen la botica
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
          placeholder="Buscar por RUC o razón social…"
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
        <p className="text-muted">No hay proveedores que coincidan.</p>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-white/8">
              <tr>
                <th className={thClass}>RUC</th>
                <th className={thClass}>Razón social</th>
                <th className={thClass}>Asesor</th>
                <th className={thClass}>Estado</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {visibles.map((proveedor) => (
                <tr key={proveedor.id} className={trClass}>
                  <td className={`${tdClass} font-mono text-ink`}>
                    {proveedor.ruc}
                  </td>
                  <td className={`${tdClass} font-medium text-ink`}>
                    {proveedor.razonSocial}
                  </td>
                  <td className={`${tdClass} text-muted`}>
                    {proveedor.asesorNombre ?? "—"}
                    {proveedor.asesorTelefono && (
                      <span> · {proveedor.asesorTelefono}</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-[7px] w-[7px] rounded-full ${
                          proveedor.activo ? "bg-accent" : "bg-dim"
                        }`}
                      />
                      <span className="text-[12.5px] text-muted">
                        {proveedor.activo ? "Activo" : "Inactivo"}
                      </span>
                    </span>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-right`}>
                    <button
                      onClick={() => openEdit(proveedor)}
                      className="cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActivo(proveedor)}
                      className="ml-3 cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
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

      {showForm && (
        <Drawer
          titulo={
            editing ? `Editar a ${editing.razonSocial}` : "Nuevo proveedor"
          }
          subtitulo={
            editing
              ? `RUC ${editing.ruc}`
              : "Registra un laboratorio o distribuidor"
          }
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
            {!editing && (
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
            <label className={labelClass}>
              Razón social
              <input
                name="razonSocial"
                type="text"
                required
                defaultValue={editing?.razonSocial}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
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
