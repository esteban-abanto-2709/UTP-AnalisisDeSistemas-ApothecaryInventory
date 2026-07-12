"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useEmpleado } from "@/components/AppShell";
import Drawer from "@/components/Drawer";
import { API_URL } from "@/lib/api";
import {
  badgeMuted,
  btnGhost,
  btnPrimary,
  card,
  estadoStock,
  ESTADO_STOCK_UI,
  inputClass,
  labelClass,
  soles,
  statCard,
  statLabel,
  statValue,
  tdClass,
  thClass,
  trClass,
  type EstadoStock,
} from "@/lib/ui";

type Producto = {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
  stockMinimo: number;
  activo: boolean;
};

type FiltroEstado = "todos" | "bajo" | "critico";

const CHIP_FILTRO: Record<
  Exclude<FiltroEstado, "todos">,
  { activo: string; inactivo: string }
> = {
  bajo: {
    activo: "border-warn/30 bg-warn/14 text-warn",
    inactivo: "border-white/8 bg-card text-muted hover:text-warn",
  },
  critico: {
    activo: "border-danger/30 bg-danger/14 text-danger",
    inactivo: "border-white/8 bg-card text-muted hover:text-danger",
  },
};

export default function ProductosPage() {
  const router = useRouter();
  const empleado = useEmpleado();
  const esAdmin = empleado.rol === "ADMINISTRADOR";
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
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
    void load();
  }, [load]);

  const estadoDe = (p: Producto): EstadoStock =>
    estadoStock(p.stock, p.stockMinimo);

  const visibles = productos?.filter((p) => {
    if (!p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())) {
      return false;
    }
    if (filtroEstado === "todos") return true;
    const estado = estadoDe(p);
    if (filtroEstado === "bajo") return estado === "bajo";
    return estado === "critico" || estado === "agotado";
  });

  const bajos = productos?.filter((p) => p.activo && estadoDe(p) === "bajo");
  const criticos = productos?.filter(
    (p) => p.activo && (estadoDe(p) === "critico" || estadoDe(p) === "agotado"),
  );
  const inactivos = productos?.filter((p) => !p.activo);

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
      stockMinimo: parseInt(form.get("stockMinimo") as string, 10),
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
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[21px] font-bold text-ink">
          Inventario de productos
        </h1>
        {esAdmin && (
          <button onClick={openCreate} className={btnPrimary}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="#0E241D"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
            Nuevo producto
          </button>
        )}
      </div>
      <p className="mb-5 text-[13px] text-muted">
        Stock actualizado en tiempo real · descuento automático del lote más
        próximo a vencer
      </p>

      {productos && (
        <div className="mb-4 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
          <div className={statCard}>
            <div className={statLabel}>Total de productos</div>
            <div className={statValue}>{productos.length}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>Stock bajo</div>
            <div className={`${statValue} text-warn`}>{bajos?.length}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>Stock crítico / agotado</div>
            <div className={`${statValue} text-danger`}>{criticos?.length}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>Inactivos</div>
            <div className={statValue}>{inactivos?.length}</div>
          </div>
        </div>
      )}

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[240px] flex-1 sm:max-w-[340px]">
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
            placeholder="Buscar por nombre…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${inputClass} mt-0 bg-card pl-9`}
          />
        </div>
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => setFiltroEstado("todos")}
            className={`cursor-pointer rounded-lg border px-3.5 py-2 text-[12.5px] ${
              filtroEstado === "todos"
                ? "border-white/20 bg-raise text-ink"
                : "border-white/8 bg-card text-muted hover:text-ink"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroEstado("bajo")}
            className={`cursor-pointer rounded-lg border px-3.5 py-2 text-[12.5px] ${
              CHIP_FILTRO.bajo[filtroEstado === "bajo" ? "activo" : "inactivo"]
            }`}
          >
            Bajo
          </button>
          <button
            onClick={() => setFiltroEstado("critico")}
            className={`cursor-pointer rounded-lg border px-3.5 py-2 text-[12.5px] ${
              CHIP_FILTRO.critico[
                filtroEstado === "critico" ? "activo" : "inactivo"
              ]
            }`}
          >
            Crítico
          </button>
        </div>
      </div>

      {error && !showForm && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      {!visibles ? (
        <p className="text-muted">Cargando…</p>
      ) : visibles.length === 0 ? (
        <p className="text-muted">No hay productos que coincidan.</p>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-white/8">
              <tr>
                <th className={thClass}>Producto</th>
                <th className={thClass}>Stock</th>
                <th className={thClass}>Mín</th>
                <th className={thClass}>Precio</th>
                <th className={thClass}>Estado</th>
                {esAdmin && <th className={thClass} />}
              </tr>
            </thead>
            <tbody>
              {visibles.map((producto) => {
                const ui = ESTADO_STOCK_UI[estadoDe(producto)];
                return (
                  <tr key={producto.id} className={trClass}>
                    <td className={`${tdClass} font-medium text-ink`}>
                      {producto.nombre}
                    </td>
                    <td className={`${tdClass} font-mono text-ink`}>
                      {producto.stock}
                    </td>
                    <td className={`${tdClass} font-mono text-faint`}>
                      {producto.stockMinimo}
                    </td>
                    <td className={`${tdClass} font-mono text-ink`}>
                      {soles(producto.precio)}
                    </td>
                    <td className={tdClass}>
                      {producto.activo ? (
                        <span className={ui.badge}>{ui.texto}</span>
                      ) : (
                        <span className={badgeMuted}>Inactivo</span>
                      )}
                    </td>
                    {esAdmin && (
                      <td className={`${tdClass} whitespace-nowrap text-right`}>
                        <button
                          onClick={() => openEdit(producto)}
                          className="cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleActivo(producto)}
                          className="ml-3 cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
                        >
                          {producto.activo ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Drawer
          titulo={editing ? `Editar ${editing.nombre}` : "Nuevo producto"}
          subtitulo={
            editing
              ? "El stock se ajusta desde los lotes"
              : "El stock inicial se carga registrando lotes"
          }
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
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
              Stock mínimo (para alertas)
              <input
                name="stockMinimo"
                type="number"
                step="1"
                min="0"
                required
                defaultValue={editing?.stockMinimo ?? 10}
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
