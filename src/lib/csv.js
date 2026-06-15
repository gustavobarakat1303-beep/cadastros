// Converte um array de objetos em CSV e dispara o download no navegador.
function escapeCell(value) {
  const s = value == null ? '' : String(value)
  if (/[";\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(';'),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(';')),
  ]
  // BOM para o Excel reconhecer acentuação UTF-8.
  const blob = new Blob(['﻿' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
