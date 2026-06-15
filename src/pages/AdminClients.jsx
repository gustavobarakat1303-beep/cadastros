import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Search, Download, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const UNIT_COLORS = { nomade: '#f59e0b', manga: '#22c55e' }
const PAGE_SIZE = 50

export default function AdminClients() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  const [usedFilter, setUsedFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPage(0)
  }, [search, unitFilter, usedFilter])

  useEffect(() => {
    load()
  }, [search, unitFilter, usedFilter, page])

  async function load() {
    setLoading(true)
    try {
      let q = supabase
        .from('dv_registrations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (unitFilter !== 'all') q = q.eq('unit_slug', unitFilter)
      if (usedFilter === 'used') q = q.eq('used', true)
      if (usedFilter === 'unused') q = q.eq('used', false)
      if (search.trim()) {
        q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,code.ilike.%${search}%`)
      }

      const { data, count } = await q
      setRows(data || [])
      setTotal(count || 0)
    } finally {
      setLoading(false)
    }
  }

  function exportCSV() {
    const header = ['Nome', 'Email', 'Telefone', 'CPF', 'Nascimento', 'Unidade', 'Código', 'Usado', 'Cadastrado em']
    const lines = rows.map(r => [
      r.name, r.email, r.phone, r.cpf, r.birthdate || '',
      r.unit_slug, r.code, r.used ? 'Sim' : 'Não',
      format(new Date(r.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    ].map(v => `"${v}"`).join(','))

    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clientes.csv'
    a.click()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-500 text-sm">{total} cadastros</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
        >
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar nome, e-mail, código…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
          />
        </div>
        <select
          value={unitFilter}
          onChange={e => setUnitFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="all">Todas as unidades</option>
          <option value="nomade">Nômade</option>
          <option value="manga">Pé de Manga</option>
        </select>
        <select
          value={usedFilter}
          onChange={e => setUsedFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="all">Todos os status</option>
          <option value="unused">Não usado</option>
          <option value="used">Usado</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs">
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">E-mail</th>
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Unidade</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500">Carregando…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500">Nenhum resultado encontrado.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-gray-400">{r.email}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: UNIT_COLORS[r.unit_slug] }}>{r.code}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: UNIT_COLORS[r.unit_slug] + '22', color: UNIT_COLORS[r.unit_slug] }}>
                      {r.unit_slug === 'nomade' ? 'Nômade' : 'Pé de Manga'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.used
                      ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={12} /> Usado</span>
                      : <span className="flex items-center gap-1 text-gray-500 text-xs"><XCircle size={12} /> Disponível</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(r.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 text-sm">
            <span className="text-gray-500">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-40">Anterior</button>
              <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-40">Próximo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
