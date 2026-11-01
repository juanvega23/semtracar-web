/** Exportación CSV UTF-8 con BOM y separador coma para Excel (RF-63).
 * Sin línea `sep=`: cuando aparece, Excel ignora el BOM y las tildes salen mal.
 * Se exportan únicamente las filas que ya se muestran y están autorizadas en la UI.
 */
export type CsvCell = string | number | boolean | null | undefined;

function escapeCsvCell(value: CsvCell): string {
  let text = value == null ? '' : String(value);
  // Evita que Excel/LibreOffice interpreten datos externos como fórmulas.
  if (/^\s*[=+@-]/.test(text) && typeof value === 'string') {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

export function serializeCsv(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]): void {
  const blob = new Blob([`\uFEFF${serializeCsv(headers, rows)}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // La URL debe permanecer viva hasta que el navegador haya iniciado la descarga.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
