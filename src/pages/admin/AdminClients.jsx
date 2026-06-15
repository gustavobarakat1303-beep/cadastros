import { useState, useEffect } from 'react'
import {
  collection, getDocs, query, orderBy
} from 'firebase/firestore'
import { db } from '../../firebase'
import { Search, Download, CheckCircle, Clock } from 'lucide-react'

function unitLabel(unitId = '') {
  const u = unitId.toLowerCase()
  if (u.includes('nomade') || u.includes('nômade')) return 'Nômade'
  if (u.includes('manga')) return 'Pé de Manga'
  return unitId
}

function StatusBadge({ status }) {
  const isUsed = status === 'used'
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
      isUsed
        ? 'bg-green-500/15 text-green-400'
        : 'bg-amber-500/15 text-amber-400'
    }`}>
      {isUsed ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {isUsed ? 'Usado' : 'Pendente'}
    </span>
  )
}

function exportCSV(rows) {
  const headers = ['Nome', 'Telefone', 'E-mail', 'Unidade', 'Código', 'Status', 'Cadastrado em']
  const lines = [
    headers.join(','),
    ...rows.map((r) => [
      `"${r.name ?? ''}"`,
      `"${r.phone ?? ''}"`,
      `"${r.email ?? ''}"`,
      `"${unitLabel(r.unitId)}"`,
      `"${r.code ?? ''}"`,
      `"${r.status ?? ''}"`,
      `"${r.createdAt?.toDate?.()?.toLocaleString('pt-BR') ?? ''}"`,
    ].join(','))
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'clientes.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { fetchClients() }, [])

  useEffect(() => {
    let res = clients
    if (search.trim()) {
      const s = search.toLowerCase()
      res = res.filter(
        (c) =>
          c.name?.toLowerCase().includes(s) ||
          c.phone?.includes(s) ||
          c.code?.toLowerCase().includes(s)
      )
    }
    if (unitFilter !== 'all') res = res.filter((c) => c.unitId === unitFilter)
    if (statusFilter !== 'all') res = res.filter((c) => c.status === statusFilter)
    setFiltered(res)
  }, [clients, search, unitFilter, statusFilter])

  async function fetchClients() {
    setLoading(true)
    try {
      const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setClients(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{clients.length} cadastros no total</p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-52 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-amber-500/50 transition"
          />
        </div>
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="bg-gray-900 border border-white/5 rounded-xl px-3 py-2.5 text-gray-300 text-sm focus:outline-none appearance-none"
        >
          <option value="all">Todas as unidades</option>
          <option value="nomade">Nômade</option>
          <option value="manga">Pé de Manga</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-white/5 rounded-xl px-3 py-2.5 text-gray-300 text-sm focus:outline-none appearance-none"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="used">Usado</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 animate-pulse mx-6 my-3 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-16">Nenhum cliente encontrado.</p>
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
                  <th className="text-gray-500 font-medium text-left px-4 py-3">Cadastrado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white/2 transition">
                    <td className="px-6 py-3">
                      <p className="text-white">{c.name ?? '–'}</p>
                      {c.email && <p className="text-gray-500 text-xs">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{c.phone ?? '–'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded-lg text-amber-400">
                        {c.code ?? '–'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{unitLabel(c.unitId)}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') ?? '–'}
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
