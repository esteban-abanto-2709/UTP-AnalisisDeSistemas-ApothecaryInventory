"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Empleado = {
  id: number;
  dni: string;
  nombre: string;
  rol: "VENDEDOR" | "ADMINISTRADOR";
};

export default function Home() {
  const router = useRouter();
  const [empleado, setEmpleado] = useState<Empleado | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
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
      <main className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-500 dark:text-zinc-400">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Botica Conquistadores
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {empleado.nombre} ·{" "}
            {empleado.rol === "ADMINISTRADOR" ? "Administrador" : "Vendedor"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {empleado.rol === "ADMINISTRADOR" && (
            <Link
              href="/usuarios"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Usuarios
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">
          Bienvenido. Los módulos del sistema se irán habilitando aquí.
        </p>
      </div>
    </main>
  );
}
