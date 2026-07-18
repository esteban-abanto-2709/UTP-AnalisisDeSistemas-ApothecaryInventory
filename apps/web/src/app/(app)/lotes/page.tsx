"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Drawer from "@/components/Drawer";
import { API_URL } from "@/lib/api";
import {
  badgeAccent,
  badgeDanger,
  badgeMuted,
  badgeWarn,
  btnGhost,
  btnPrimary,
  card,
  inputClass,
  labelClass,
  statCard,
  statLabel,
  statValue,
  tdClass,
  thClass,
  trClass,
} from "@/lib/ui";

type Lote = {
  id: number;
  codigo: string;
  medicamentoId: number;
  fechaVencimiento: string;
  stockInicial: number;
  stockActual: number;
  descuento: string;
  activo: boolean;
};

type Producto = {
  id: number;
  nombre: string;
  activo: boolean;
};

type FiltroEstado = "todos" | "porVencer" | "vencidos";

const DIAS_AVISO = 30;

function diasParaVencer(fecha: string) {
  const vence = new Date(fecha).setUTCHours(0, 0, 0, 0);
  const hoy = new Date().setUTCHours(0, 0, 0, 0);
  return Math.round((vence - hoy) / 86_400_000);
}

function fechaCorta(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-PE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function estadoLote(lote: Lote) {
  if (!lote.activo) return { texto: "Inactivo", badge: badgeMuted };
  const dias = diasParaVencer(lote.fechaVencimiento);
  if (dias < 0) return { texto: "Vencido", badge: badgeDanger };
  if (lote.stockActual === 0) return { texto: "Agotado", badge: badgeMuted };
  if (dias <= DIAS_AVISO)
    return { texto: `Vence en ${dias} d`, badge: badgeWarn };
  return { texto: "Vigente", badge: badgeAccent };
}

const CHIP_BASE = "cursor-pointer rounded-lg border px-3.5 py-2 text-[12.5px]";

export default function LotesPage() {
  const router = useRouter();
  const [lotes, setLotes] = useState<Lote[] | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtroProducto, setFiltroProducto] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [editing, setEditing] = useState<Lote | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    return Promise.all([
      fetch(`${API_URL}/lotes`, { credentials: "include" }),
      fetch(`${API_URL}/productos`, { credentials: "include" }),
    ])
      .then(async ([resLotes, resProductos]) => {
        if (resLotes.status === 401) {
          router.push("/login");
          return;
        }
        if (resLotes.status === 403) {
          router.push("/");
          return;
        }
        setLotes((await resLotes.json()) as Lote[]);
        if (resProductos.ok) {
          setProductos((await resProductos.json()) as Producto[]);
        }
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const nombreProducto = (id: number) =>
    productos.find((p) => p.id === id)?.nombre ?? `#${id}`;

  const visibles = lotes?.filter((lote) => {
    if (
      filtroProducto !== "todos" &&
      lote.medicamentoId !== Number(filtroProducto)
    ) {
      return false;
    }
    if (filtroEstado === "todos") return true;
    if (!lote.activo) return false;
    const dias = diasParaVencer(lote.fechaVencimiento);
    if (filtroEstado === "vencidos") return dias < 0;
    return dias >= 0 && dias <= DIAS_AVISO;
  });

  const activos = lotes?.filter((l) => l.activo) ?? [];
  const porVencer = activos.filter((l) => {
    const dias = diasParaVencer(l.fechaVencimiento);
    return dias >= 0 && dias <= DIAS_AVISO;
  });
  const vencidos = activos.filter((l) => diasParaVencer(l.fechaVencimiento) < 0);
  const unidades = activos.reduce((suma, l) => suma + l.stockActual, 0);

  function openCreate() {
    setEditing(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(lote: Lote) {
    setEditing(lote);
    setError(null);
    setShowForm(true);
  }

  async function guardar(url: string, method: "POST" | "PATCH", body: unknown) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        message?: string | string[];
      } | null;
      const message = data?.message;
      setError(
        Array.isArray(message) ? message[0] : (message ?? "Error al guardar"),
      );
      return false;
    }
    await load();
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const descuento = parseFloat(form.get("descuento") as string) || 0;
    const body = editing
      ? {
          codigo: form.get("codigo"),
          fechaVencimiento: form.get("fechaVencimiento"),
          descuento,
          stockActual: parseInt(form.get("stockActual") as string, 10),
        }
      : {
          codigo: form.get("codigo"),
          medicamentoId: parseInt(form.get("medicamentoId") as string, 10),
          fechaVencimiento: form.get("fechaVencimiento"),
          stockInicial: parseInt(form.get("stockInicial") as string, 10),
          descuento,
        };
    try {
      const ok = await guardar(
        editing ? `${API_URL}/lotes/${editing.id}` : `${API_URL}/lotes`,
        editing ? "PATCH" : "POST",
        body,
      );
      if (ok) setShowForm(false);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(lote: Lote) {
    setError(null);
    try {
      await guardar(`${API_URL}/lotes/${lote.id}`, "PATCH", {
        activo: !lote.activo,
      });
    } catch {
      setError("No se pudo conectar con el servidor");
    }
  }

  const productosActivos = productos.filter((p) => p.activo);

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[21px] font-bold text-ink">Lotes y vencimientos</h1>
        <button onClick={openCreate} className={btnPrimary}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V19M5 12H19"
              stroke="#0E241D"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          Nuevo lote
        </button>
      </div>
      <p className="mb-5 text-[13px] text-muted">
        Registrar un lote suma su stock al producto · las ventas descuentan del
        lote más próximo a vencer (FEFO)
      </p>

      {lotes && (
        <div className="mb-4 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
          <div className={statCard}>
            <div className={statLabel}>Lotes activos</div>
            <div className={statValue}>{activos.length}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>Unidades en stock</div>
            <div className={statValue}>{unidades}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>Por vencer (≤{DIAS_AVISO} d)</div>
            <div className={`${statValue} text-warn`}>{porVencer.length}</div>
          </div>
          <div className={statCard}>
            <div className={statLabel}>Vencidos</div>
            <div className={`${statValue} text-danger`}>{vencidos.length}</div>
          </div>
        </div>
      )}

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <select
          value={filtroProducto}
          onChange={(e) => setFiltroProducto(e.target.value)}
          className={`${inputClass} mt-0 min-w-[240px] flex-1 bg-card sm:max-w-[340px]`}
        >
          <option value="todos">Todos los productos</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => setFiltroEstado("todos")}
            className={`${CHIP_BASE} ${
              filtroEstado === "todos"
                ? "border-white/20 bg-raise text-ink"
                : "border-white/8 bg-card text-muted hover:text-ink"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroEstado("porVencer")}
            className={`${CHIP_BASE} ${
              filtroEstado === "porVencer"
                ? "border-warn/30 bg-warn/14 text-warn"
                : "border-white/8 bg-card text-muted hover:text-warn"
            }`}
          >
            Por vencer
          </button>
          <button
            onClick={() => setFiltroEstado("vencidos")}
            className={`${CHIP_BASE} ${
              filtroEstado === "vencidos"
                ? "border-danger/30 bg-danger/14 text-danger"
                : "border-white/8 bg-card text-muted hover:text-danger"
            }`}
          >
            Vencidos
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
        <p className="text-muted">No hay lotes que coincidan.</p>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-white/8">
              <tr>
                <th className={thClass}>Producto</th>
                <th className={thClass}>Lote</th>
                <th className={thClass}>Vence</th>
                <th className={thClass}>Stock</th>
                <th className={thClass}>Desc.</th>
                <th className={thClass}>Estado</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {visibles.map((lote) => {
                const ui = estadoLote(lote);
                return (
                  <tr key={lote.id} className={trClass}>
                    <td className={`${tdClass} font-medium text-ink`}>
                      {nombreProducto(lote.medicamentoId)}
                    </td>
                    <td className={`${tdClass} font-mono text-muted`}>
                      {lote.codigo}
                    </td>
                    <td className={`${tdClass} font-mono text-ink`}>
                      {fechaCorta(lote.fechaVencimiento)}
                    </td>
                    <td className={`${tdClass} font-mono text-ink`}>
                      {lote.stockActual}
                      <span className="text-faint"> / {lote.stockInicial}</span>
                    </td>
                    <td className={`${tdClass} font-mono text-faint`}>
                      {Number(lote.descuento)}%
                    </td>
                    <td className={tdClass}>
                      <span className={ui.badge}>{ui.texto}</span>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>
                      <button
                        onClick={() => openEdit(lote)}
                        className="cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivo(lote)}
                        className="ml-3 cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
                      >
                        {lote.activo ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Drawer
          titulo={editing ? `Editar lote ${editing.codigo}` : "Nuevo lote"}
          subtitulo={
            editing
              ? "Las ventas descuentan solas; ajusta el stock solo por merma o conteo"
              : "El stock inicial se suma al stock del producto"
          }
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
            {!editing && (
              <label className={labelClass}>
                Producto
                <select
                  name="medicamentoId"
                  required
                  defaultValue={
                    filtroProducto !== "todos" ? filtroProducto : ""
                  }
                  className={inputClass}
                >
                  <option value="" disabled>
                    Selecciona un producto
                  </option>
                  {productosActivos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={labelClass}>
              Código de lote
              <input
                name="codigo"
                type="text"
                required
                defaultValue={editing?.codigo}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Fecha de vencimiento
              <input
                name="fechaVencimiento"
                type="date"
                required
                defaultValue={editing?.fechaVencimiento.slice(0, 10)}
                className={inputClass}
              />
            </label>
            {editing ? (
              <label className={labelClass}>
                Stock actual (unidades) · máx. {editing.stockInicial}
                <input
                  name="stockActual"
                  type="number"
                  step="1"
                  min="0"
                  max={editing.stockInicial}
                  required
                  defaultValue={editing.stockActual}
                  className={inputClass}
                />
                <span className="mt-1 block text-[11.5px] font-normal text-faint">
                  Ajustarlo mueve el stock del producto por la diferencia (merma,
                  conteo físico).
                </span>
              </label>
            ) : (
              <label className={labelClass}>
                Stock inicial (unidades)
                <input
                  name="stockInicial"
                  type="number"
                  step="1"
                  min="1"
                  required
                  className={inputClass}
                />
              </label>
            )}
            <label className={labelClass}>
              Descuento (%)
              <input
                name="descuento"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={editing ? Number(editing.descuento) : 0}
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
