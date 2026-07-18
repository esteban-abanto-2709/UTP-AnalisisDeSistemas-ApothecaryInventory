export function descargarCSV(
  nombre: string,
  filas: (string | number)[][],
) {
  const csv = filas
    .map((fila) =>
      fila.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(";"),
    )
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
