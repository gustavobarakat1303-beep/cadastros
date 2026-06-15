import { useEffect, useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase.js'
import { UNITS, getUnit } from '../../config/units.js'
import { downloadCsv } from '../../lib/csv.js'

export default function Clientes() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [unitFilter, setUnitFilter] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('dv_registrations')
        .select(
          'id, name, phone, email, birthdate, unit_slug, code, used, used_at, created_at, discount_type:dv_discount_types(name)',
        )
        .order('created_at', { ascending: false })
        .limit(10000)
      if (error) toast.error('Erro ao carregar clientes.')
      else setRows(data || [])
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (unitFilter !== 'all' && r.unit_slug !== unitFilter) return false
      if (!q) return true
      return (
        r.name?.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q)
      )
    })
  }, [rows, unitFilter, query])

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error('Nada para exportar.')
      return
    }
    const data = filtered.map((r) => ({
      Nome: r.name,
      Telefone: r.phone,
      Email: r.email || '',
      Nascimento: r.birthdate || '',
      Unidade: getUnit(r.unit_slug)?.name || r.unit_slug,
      Desconto: r.discount_type?.name || '',
      Codigo: r.code,
      Utilizado: r.used ? 'Sim' : 'Não',
      Cadastro: r.created_at
        ? new Date(r.created_at).toLocaleString('pt-BR')
        : '',
    }))
    downloadCsv(`clientes-${new Date().toISOString().slice(0, 10)}.csv`, data)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3">
          <Search size={16} className="text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, telefone, e-mail…"
            className="bg-transparent py-2 text-sm text-white outline-none"
          />
        </div>
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
        {filtered.length} cliente(s)
      </p>

      {loading ? (
        <p className="text-gray-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <Th>Nome</Th>
                <Th>Telefone</Th>
                <Th>Unidade</Th>
                <Th>Desconto</Th>
                <Th>Código</Th>
                <Th>Status</Th>
                <Th>Cadastro</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-gray-800">
                  <Td>{r.name}</Td>
                  <Td>{r.phone}</Td>
                  <Td>{getUnit(r.unit_slug)?.name || r.unit_slug}</Td>
                  <Td>{r.discount_type?.name || '—'}</Td>
                  <Td mono>{r.code}</Td>
                  <Td>
                    {r.used ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                        Utilizado
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-xs text-gray-400">
                        Pendente
                      </span>
                    )}
                  </Td>
                  <Td>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString('pt-BR')
                      : '—'}
                  </Td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    Nenhum cliente encontrado.
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

const Th = ({ children }) => <th className="px-4 py-3 font-medium">{children}</th>
const Td = ({ children, mono }) => (
  <td className={`px-4 py-3 ${mono ? 'font-mono' : ''}`}>{children}</td>
)
