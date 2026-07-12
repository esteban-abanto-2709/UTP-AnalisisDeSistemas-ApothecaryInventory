"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Drawer from "@/components/Drawer";
import { API_URL } from "@/lib/api";
import {
  badgeInfo,
  badgeMuted,
  btnGhost,
  btnPrimary,
  card,
  iniciales,
  inputClass,
  labelClass,
  statCard,
  statLabel,
  statValue,
  tdClass,
  thClass,
  trClass,
} from "@/lib/ui";

type Usuario = {
  id: number;
  dni: string;
  nombre: string;
  rol: "VENDEDOR" | "ADMINISTRADOR";
  activo: boolean;
};

const ROLES: {
  valor: Usuario["rol"];
  titulo: string;
  detalle: string;
}[] = [
  {
    valor: "VENDEDOR",
    titulo: "Vendedor",
    detalle: "Punto de venta, inventario (consulta) y clientes",
  },
  {
    valor: "ADMINISTRADOR",
    titulo: "Administrador",
    detalle: "Acceso total: usuarios, proveedores, historial y panel",
  },
];

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rolElegido, setRolElegido] = useState<Usuario["rol"]>("VENDEDOR");
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
    setRolElegido("VENDEDOR");
    setError(null);
    setShowForm(true);
  }

  function openEdit(usuario: Usuario) {
    setEditing(usuario);
    setRolElegido(usuario.rol);
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
          rol: rolElegido,
          ...(password ? { password } : {}),
        }
      : {
          dni: form.get("dni"),
          nombre: form.get("nombre"),
          rol: rolElegido,
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

  const activos = usuarios?.filter((u) => u.activo);
  const admins = usuarios?.filter((u) => u.rol === "ADMINISTRADOR");
  const vendedores = usuarios?.filter((u) => u.rol === "VENDEDOR");

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[21px] font-bold text-ink">Usuarios y roles</h1>
        <button onClick={openCreate} className={btnPrimary}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V19M5 12H19"
              stroke="#0E241D"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          Nuevo usuario
        </button>
      </div>
      <p className="mb-5 text-[13px] text-muted">
        Gestiona al personal con acceso al sistema y sus permisos
      </p>

      {usuarios && (
        <div className="mb-4 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
          <div className={statCard}>
            <div className={statLabel}>Total de usuarios</div>
            <div className={statValue}>{usuarios.length}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>Activos</div>
            <div className={`${statValue} text-accent`}>{activos?.length}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>Administradores</div>
            <div className={statValue}>{admins?.length}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>Vendedores</div>
            <div className={statValue}>{vendedores?.length}</div>
          </div>
        </div>
      )}

      {error && !showForm && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      {!usuarios ? (
        <p className="text-muted">Cargando…</p>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-white/8">
              <tr>
                <th className={thClass}>Nombre</th>
                <th className={thClass}>DNI</th>
                <th className={thClass}>Rol</th>
                <th className={thClass}>Estado</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className={trClass}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-avatar text-[11.5px] font-bold text-muted">
                        {iniciales(usuario.nombre)}
                      </div>
                      <span className="font-medium text-ink">
                        {usuario.nombre}
                      </span>
                    </div>
                  </td>
                  <td className={`${tdClass} font-mono text-muted`}>
                    {usuario.dni}
                  </td>
                  <td className={tdClass}>
                    <span
                      className={
                        usuario.rol === "ADMINISTRADOR" ? badgeInfo : badgeMuted
                      }
                    >
                      {usuario.rol === "ADMINISTRADOR"
                        ? "Administrador"
                        : "Vendedor"}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-[7px] w-[7px] rounded-full ${
                          usuario.activo ? "bg-accent" : "bg-dim"
                        }`}
                      />
                      <span className="text-[12.5px] text-muted">
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </span>
                    </span>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-right`}>
                    <button
                      onClick={() => openEdit(usuario)}
                      className="cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActivo(usuario)}
                      className="ml-3 cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
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

      {showForm && (
        <Drawer
          titulo={editing ? `Editar a ${editing.nombre}` : "Nuevo usuario"}
          subtitulo={
            editing
              ? `DNI ${editing.dni}`
              : "Crea una cuenta de acceso para el personal"
          }
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
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
              Nombre completo
              <input
                name="nombre"
                type="text"
                required
                defaultValue={editing?.nombre}
                placeholder="Ej. Sofía Ramírez"
                className={inputClass}
              />
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

            <div>
              <div className="mb-2 text-xs font-medium text-muted">Rol</div>
              <div className="flex flex-col gap-2">
                {ROLES.map((rol) => {
                  const activo = rolElegido === rol.valor;
                  return (
                    <button
                      type="button"
                      key={rol.valor}
                      onClick={() => setRolElegido(rol.valor)}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left ${
                        activo
                          ? "border-accent/50 bg-accent/8"
                          : "border-white/10 bg-bg"
                      }`}
                    >
                      <span
                        className={`mt-0.5 h-4 w-4 flex-none rounded-full border-2 ${
                          activo
                            ? "border-accent bg-accent"
                            : "border-dim bg-transparent"
                        }`}
                      />
                      <span>
                        <span className="block text-[13px] font-semibold text-ink">
                          {rol.titulo}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] text-muted">
                          {rol.detalle}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

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
                {saving ? "Guardando…" : "Guardar usuario"}
              </button>
            </div>
          </form>
        </Drawer>
      )}
    </div>
  );
}
