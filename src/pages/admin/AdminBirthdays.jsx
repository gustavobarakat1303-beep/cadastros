import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { Cake, Download } from 'lucide-react'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

function unitLabel(unitId = '') {
  const u = unitId.toLowerCase()
  if (u.includes('nomade') || u.includes('nômade')) return 'Nômade'
  if (u.includes('manga')) return 'Pé de Manga'
  return unitId
}

function exportCSV(rows, monthLabel) {
  const headers = ['Nome', 'Telefone', 'E-mail', 'Unidade', 'Código', 'Mês de aniversário']
  const lines = [
    headers.join(','),
    ...rows.map((r) => [
      `"${r.name ?? ''}"`,
      `"${r.phone ?? ''}"`,
      `"${r.email ?? ''}"`,
      `"${unitLabel(r.unitId)}"`,
      `"${r.code ?? ''}"`,
      `"${monthLabel}"`,
    ].join(','))
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `aniversariantes-${monthLabel.toLowerCase()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminBirthdays() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchBirthdays() }, [selectedMonth])

  async function fetchBirthdays() {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'registrations'),
        where('birthMonth', '==', selectedMonth)
      )
      const snap = await getDocs(q)
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } finally {
      setLoading(false)
    }
  }

  const monthName = MONTHS[selectedMonth - 1]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Aniversariantes</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? '...' : clients.length} aniversariante{clients.length !== 1 ? 's' : ''} em {monthName}
          </p>
        </div>
        <button
          onClick={() => exportCSV(clients, monthName)}
          disabled={clients.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-gray-300 text-sm font-medium transition"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Seletor de mês */}
      <div className="flex flex-wrap gap-2">
        {MONTHS.map((m, i) => {
          const monthNum = i + 1
          const isActive = monthNum === selectedMonth
          const isCurrent = monthNum === now.getMonth() + 1
          return (
            <button
              key={monthNum}
              onClick={() => setSelectedMonth(monthNum)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                isActive
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : isCurrent
                  ? 'border-white/15 text-gray-300 bg-white/5 ring-1 ring-white/10'
                  : 'border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {m}
            </button>
          )
        })}
      </div>

      {/* Lista */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 animate-pulse mx-6 my-3 rounded-xl" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-20">
            <Cake className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Nenhum aniversariante em {monthName}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr>
                  <th className="text-gray-500 font-medium text-left px-6 py-3">Nome</th>
                  <th className="text-gray-500 font-medium text-left px-4 py-3">Telefone</th>
                  <th className="text-gray-500 font-medium text-left px-4 py-3">Código</th>
                  <th className="text-gray-500 font-medium text-left px-4 py-3">Unidade</th>
                  <th className="text-gray-500 font-medium text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-white/2 transition">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Cake className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <p className="text-white">{c.name ?? '–'}</p>
                      </div>
                      {c.email && <p className="text-gray-500 text-xs pl-5">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{c.phone ?? '–'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded-lg text-amber-400">
                        {c.code ?? '–'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{unitLabel(c.unitId)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        c.status === 'used'
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {c.status === 'used' ? 'Usado' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
