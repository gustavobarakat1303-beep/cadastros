import { useEffect, useMemo, useState } from 'react'
import { Cake } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase.js'
import { UNITS, getUnit } from '../../config/units.js'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function Aniversarios() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth() + 1) // 1-12
  const [unitFilter, setUnitFilter] = useState('all')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('dv_registrations')
        .select('id, name, phone, email, birthdate, unit_slug')
        .not('birthdate', 'is', null)
        .limit(10000)
      if (error) toast.error('Erro ao carregar aniversariantes.')
      else setRows(data || [])
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        // birthdate vem como 'YYY-MM-DD'; o mês é o componente do meio.
        const m = Number((r.birthdate || '').slice(5, 7))
        if (m !== Number(month)) return false
        if (unitFilter !== 'all' && r.unit_slug !== unitFilter) return false
        return true
      })
      .sort((a, b) => {
        const da = Number((a.birthdate || '').slice(8, 10))
        const db = Number((b.birthdate || '').slice(8, 10))
        return da - db
      })
  }, [rows, month, unitFilter])

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Cake size={24} /> Aniversariantes
      </h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">Todas as unidades</option>
          {Object.values(UNITS).map((u) => (
            <option key={u.slug} value={u.slug}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-2 text-sm text-gray-500">
        {filtered.length} aniversariante(s) em {MONTHS[month - 1]}
      </p>

      {loading ? (
        <p className="text-gray-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Dia</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Unidade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-gray-800">
                  <td className="px-4 py-3 font-mono">
                    {(r.birthdate || '').slice(8, 10)}
                  </td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.phone}</td>
                  <td className="px-4 py-3">{r.email || '—'}</td>
                  <td className="px-4 py-3">
                    {getUnit(r.unit_slug)?.name || r.unit_slug}
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Nenhum aniversariante neste mês.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
