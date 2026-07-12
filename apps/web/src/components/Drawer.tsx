"use client";

import type { ReactNode } from "react";

export default function Drawer({
  titulo,
  subtitulo,
  onClose,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className="animate-fade-in fixed inset-0 z-40 bg-black/50"
      />
      <div className="animate-slide-in fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col overflow-y-auto border-l border-white/10 bg-surface p-6">
        <div className="text-[17px] font-bold text-ink">{titulo}</div>
        {subtitulo && (
          <div className="mt-1 text-[12.5px] text-muted">{subtitulo}</div>
        )}
        <div className="mt-6 flex flex-1 flex-col">{children}</div>
      </div>
    </>
  );
}
