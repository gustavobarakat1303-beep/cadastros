import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase.js'
import { UNITS, getUnit } from '../../config/units.js'

export default function Validacoes() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [unitFilter, setUnitFilter] = useState('all')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('dv_validations')
        .select(
          'id, unit_slug, notes, created_at, registration:dv_registrations(name, phone, code, discount_type:dv_discount_types(name))',
        )
        .order('created_at', { ascending: false })
        .limit(10000)
      if (error) toast.error('Erro ao carregar validações.')
      else setRows(data || [])
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(
    () =>
      unitFilter === 'all'
        ? rows
        : rows.filter((r) => r.unit_slug === unitFilter),
    [rows, unitFilter],
  )

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Validações</h1>

      <div className="mb-4">
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

      <p className="mb-2 text-sm text-gray-500">{filtered.length} validação(ões)</p>

      {loading ? (
        <p className="text-gray-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Data/Hora</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Desconto</th>
                <th className="px-4 py-3 font-medium">Unidade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-gray-800">
                  <td className="px-4 py-3">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString('pt-BR')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{r.registration?.name || '—'}</td>
                  <td className="px-4 py-3 font-mono">
                    {r.registration?.code || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {r.registration?.discount_type?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {getUnit(r.unit_slug)?.name || r.unit_slug}
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Nenhuma validação registrada.
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
