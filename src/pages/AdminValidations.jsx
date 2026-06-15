import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const UNIT_COLORS = { nomade: '#f59e0b', manga: '#22c55e' }
const PAGE_SIZE = 50

export default function AdminValidations() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [unitFilter, setUnitFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setPage(0) }, [unitFilter])
  useEffect(() => { load() }, [unitFilter, page])

  async function load() {
    setLoading(true)
    try {
      let q = supabase
        .from('dv_validations')
        .select('*, dv_registrations(name, email, code)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (unitFilter !== 'all') q = q.eq('unit_slug', unitFilter)

      const { data, count } = await q
      setRows(data || [])
      setTotal(count || 0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Validações</h1>
          <p className="text-gray-500 text-sm">{total} registros</p>
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
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs">
                <th className="text-left px-4 py-3">Data/Hora</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Unidade</th>
                <th className="text-left px-4 py-3">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-500">Carregando…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-500">Nenhuma validação encontrada.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {format(new Date(r.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{r.dv_registrations?.name}</p>
                    <p className="text-gray-500 text-xs">{r.dv_registrations?.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: UNIT_COLORS[r.unit_slug] }}>
                    {r.dv_registrations?.code}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: UNIT_COLORS[r.unit_slug] + '22', color: UNIT_COLORS[r.unit_slug] }}>
                      {r.unit_slug === 'nomade' ? 'Nômade' : 'Pé de Manga'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
