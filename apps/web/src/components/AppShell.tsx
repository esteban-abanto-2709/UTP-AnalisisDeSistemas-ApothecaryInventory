"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { API_URL } from "@/lib/api";
import { iniciales } from "@/lib/ui";

export type Empleado = {
  id: number;
  dni: string;
  nombre: string;
  rol: "VENDEDOR" | "ADMINISTRADOR";
};

const EmpleadoContext = createContext<Empleado | null>(null);

export function useEmpleado() {
  const empleado = useContext(EmpleadoContext);
  if (!empleado) throw new Error("useEmpleado requiere AppShell");
  return empleado;
}

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex flex-none items-center justify-center rounded-lg bg-accent"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 5V19M5 12H19"
          stroke="#0E241D"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

type NavItem = {
  href?: string;
  label: string;
  icon: ReactNode;
  soloAdmin?: boolean;
};

const ICON_PROPS = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
} as const;

const SECCIONES: { titulo: string; items: NavItem[]; soloAdmin?: boolean }[] = [
  {
    titulo: "Operación",
    items: [
      {
        href: "/",
        label: "Dashboard",
        soloAdmin: true,
        icon: (
          <svg {...ICON_PROPS}>
            <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
            <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
            <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
            <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
          </svg>
        ),
      },
      {
        href: "/ventas",
        label: "Punto de Venta",
        icon: (
          <svg {...ICON_PROPS}>
            <path d="M3 6h2l1.6 9.2A2 2 0 0 0 8.57 17H18a2 2 0 0 0 1.96-1.6L21 9H6" />
            <circle cx="9.5" cy="20" r="1.2" />
            <circle cx="17.5" cy="20" r="1.2" />
          </svg>
        ),
      },
      {
        href: "/productos",
        label: "Inventario",
        icon: (
          <svg {...ICON_PROPS}>
            <path d="M3.5 7.5 12 3.5l8.5 4V16.5L12 20.5l-8.5-4Z" />
            <path d="M3.5 7.5 12 11.5l8.5-4" />
            <path d="M12 11.5V20.5" />
          </svg>
        ),
      },
      {
        href: "/ventas/historial",
        label: "Historial de Ventas",
        soloAdmin: true,
        icon: (
          <svg {...ICON_PROPS}>
            <path d="M6 3.5h9l3.5 3.5V20.5H6Z" />
            <path d="M15 3.5V7h3.5" />
            <path d="M8.5 12h7M8.5 15.5h7M8.5 18h4" />
          </svg>
        ),
      },
    ],
  },
  {
    titulo: "Catálogo",
    items: [
      {
        href: "/clientes",
        label: "Clientes",
        icon: (
          <svg {...ICON_PROPS}>
            <circle cx="12" cy="8.2" r="3.4" />
            <path d="M5 20c0.8-3.8 3.7-6 7-6s6.2 2.2 7 6" />
          </svg>
        ),
      },
      {
        href: "/proveedores",
        label: "Proveedores",
        soloAdmin: true,
        icon: (
          <svg {...ICON_PROPS}>
            <rect x="2.5" y="8" width="11" height="8" rx="1" />
            <path d="M13.5 11h4l3 3v2h-7z" />
            <circle cx="7" cy="18.2" r="1.6" />
            <circle cx="16.5" cy="18.2" r="1.6" />
          </svg>
        ),
      },
      {
        label: "Lotes y Vencimientos",
        soloAdmin: true,
        icon: (
          <svg {...ICON_PROPS}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7v5l3.3 2" />
          </svg>
        ),
      },
    ],
  },
  {
    titulo: "Administración",
    soloAdmin: true,
    items: [
      {
        href: "/usuarios",
        label: "Usuarios y Roles",
        icon: (
          <svg {...ICON_PROPS}>
            <path d="M12 3.5 19 6.5V11c0 5-3 8.2-7 9.5-4-1.3-7-4.5-7-9.5V6.5Z" />
            <circle cx="12" cy="10.5" r="2.4" />
            <path d="M8.5 15.2c0.8-1.7 2-2.4 3.5-2.4s2.7 0.7 3.5 2.4" />
          </svg>
        ),
      },
      {
        label: "Reportes",
        icon: (
          <svg {...ICON_PROPS}>
            <path d="M4 20V10M11 20V4M18 20v-7" />
          </svg>
        ),
      },
    ],
  },
];

const TITULOS: [RegExp, string][] = [
  [/^\/$/, "Dashboard"],
  [/^\/ventas\/historial/, "Historial de ventas"],
  [/^\/ventas\/\d+/, "Comprobante"],
  [/^\/ventas/, "Punto de venta"],
  [/^\/productos/, "Inventario de productos"],
  [/^\/clientes/, "Gestión de clientes"],
  [/^\/proveedores/, "Gestión de proveedores"],
  [/^\/usuarios/, "Usuarios y roles"],
];

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [empleado, setEmpleado] = useState<Empleado | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? (res.json() as Promise<Empleado>) : Promise.reject()))
      .then(setEmpleado)
      .catch(() => {
        fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        }).finally(() => router.push("/login"));
      });
  }, [router]);

  async function handleLogout() {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
    router.refresh();
  }

  if (!empleado) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando…</p>
      </main>
    );
  }

  const esAdmin = empleado.rol === "ADMINISTRADOR";
  const titulo = TITULOS.find(([re]) => re.test(pathname))?.[1] ?? "";

  return (
    <div className="flex min-h-screen w-full print:block">
      <aside className="flex w-[264px] flex-none flex-col border-r border-white/8 bg-surface px-3.5 py-5 print:hidden">
        <div className="flex items-center gap-2.5 px-2.5 pb-5 pt-2">
          <LogoMark />
          <div>
            <div className="text-sm font-bold text-ink">
              Conquistadores Farma
            </div>
            <div className="text-[10.5px] uppercase tracking-wider text-faint">
              Panel interno
            </div>
          </div>
        </div>

        <nav className="flex-1">
          {SECCIONES.filter((s) => esAdmin || !s.soloAdmin).map((seccion) => (
            <div key={seccion.titulo}>
              <div className="px-3 pb-1.5 pt-4 text-[10.5px] font-semibold uppercase tracking-wider text-dim">
                {seccion.titulo}
              </div>
              {seccion.items
                .filter((item) => esAdmin || !item.soloAdmin)
                .map((item) => {
                  const base =
                    "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px]";
                  if (!item.href) {
                    return (
                      <div
                        key={item.label}
                        className={`${base} cursor-not-allowed font-medium text-disabled`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        <span className="ml-auto rounded-[5px] bg-white/6 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-dim">
                          Pronto
                        </span>
                      </div>
                    );
                  }
                  const activo = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${base} ${
                        activo
                          ? "bg-accent/14 font-semibold text-ink"
                          : "font-medium text-muted hover:bg-white/4 hover:text-ink"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-none items-center justify-between border-b border-white/8 bg-surface px-7 print:hidden">
          <div className="text-[15px] font-semibold text-ink">{titulo}</div>
          <button
            popoverTarget="menu-usuario"
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-white/4"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-avatar text-[12.5px] font-bold text-muted">
              {iniciales(empleado.nombre)}
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-ink">
                {empleado.nombre}
              </div>
              <div
                className={`text-[10.5px] font-semibold ${esAdmin ? "text-info" : "text-accent"}`}
              >
                {esAdmin ? "Administrador" : "Vendedor"}
              </div>
            </div>
            <svg {...ICON_PROPS} width={14} height={14} className="text-faint">
              <path d="M6 9.5 12 15l6-5.5" />
            </svg>
          </button>
          <div
            id="menu-usuario"
            popover="auto"
            className="fixed inset-auto right-7 top-[60px] m-0 w-44 rounded-lg border border-white/8 bg-surface p-1 shadow-lg"
          >
            <button
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-[12.5px] font-medium text-muted hover:bg-white/4 hover:text-ink"
            >
              <svg {...ICON_PROPS} width={15} height={15}>
                <path d="M15 4H7a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 7 20h8" />
                <path d="M11 12h9.5M17.5 8.5 21 12l-3.5 3.5" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-10 pt-7 print:overflow-visible print:p-0">
          <EmpleadoContext.Provider value={empleado}>
            {children}
          </EmpleadoContext.Provider>
        </div>
      </div>
    </div>
  );
}
