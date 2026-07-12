"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { API_URL } from "@/lib/api";
import { btnPrimary, inputClass, labelClass } from "@/lib/ui";

const BULLETS = [
  "Stock en tiempo real por lote y vencimiento",
  "Ventas de mostrador en pocos clics",
  "Alertas de stock crítico y próximos vencimientos",
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dni: form.get("dni"),
          password: form.get("password"),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.message;
        setError(
          Array.isArray(message)
            ? message[0]
            : (message ?? "Error al iniciar sesión"),
        );
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[minmax(0,440px)_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0E241D] via-[#132C23] to-[#0B1D17] p-12 md:flex">
        <div className="absolute -left-40 -top-44 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(69,214,172,0.16),transparent_70%)]" />
        <div className="absolute -bottom-36 -right-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(69,214,172,0.10),transparent_70%)]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="#0E241D"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-[17px] font-bold tracking-wide text-[#F2F4F3]">
              Conquistadores Farma
            </div>
            <div className="text-[11.5px] uppercase tracking-wider text-[#7FBFA9]">
              Sistema interno
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-[360px]">
          <h1 className="text-[32px] font-semibold leading-[1.25] text-[#F2F4F3]">
            Control de inventario y ventas, en un solo lugar.
          </h1>
          <ul className="mt-7 flex flex-col gap-3.5">
            {BULLETS.map((texto) => (
              <li key={texto} className="flex items-center gap-3">
                <span className="h-2 w-2 flex-none rounded-full bg-accent" />
                <span className="text-sm text-[#B9D6CB]">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-[#5B8C7B]">
          © 2026 Conquistadores Farma — uso interno exclusivo
        </div>
      </div>

      <div className="flex items-center justify-center p-8 md:p-12">
        <form onSubmit={handleSubmit} className="w-full max-w-[380px]">
          <h2 className="text-[22px] font-bold text-ink">Iniciar sesión</h2>
          <p className="mb-7 mt-1.5 text-[13.5px] text-muted">
            Ingresa tus credenciales para continuar
          </p>

          <div className="flex flex-col gap-4">
            <label className={labelClass}>
              DNI
              <input
                name="dni"
                type="text"
                inputMode="numeric"
                pattern="\d{8}"
                maxLength={8}
                required
                autoComplete="username"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Contraseña
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputClass}
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`${btnPrimary} mt-1.5 justify-center py-3`}
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </div>

          <p className="mt-7 border-t border-white/7 pt-5 text-center text-xs text-dim">
            Acceso exclusivo del personal de la botica
          </p>
        </form>
      </div>
    </main>
  );
}
