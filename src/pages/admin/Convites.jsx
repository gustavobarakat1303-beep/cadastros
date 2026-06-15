import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Link2 } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { downloadCsv } from '../../lib/csv.js'

// Domínio público do cliente (link enviado por WhatsApp).
const INVITE_BASE = 'https://cadastro.nomaderestaurantebar.com.br'
const inviteLink = (code) => `${INVITE_BASE}/convite/${code}`

const today = () => new Date().toISOString().slice(0, 10)

// Status efetivo (ativo vencido = expirado)
const effectiveStatus = (inv) =>
  inv.status === 'ativo' && inv.valid_until < today() ? 'expirado' : inv.status

const STATUS_STYLE = {
  ativo: 'bg-green-900/40 text-green-300',
  usado: 'bg-yellow-900/40 text-yellow-300',
  expirado: 'bg-gray-800 text-gray-400',
  cancelado: 'bg-red-900/40 text-red-300',
}

export default function Convites() {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('dv_invites')
      .select('id, client_name, client_phone, code, valid_until, status, used_at, validated_by')
      .order('code')
    if (error) {
      toast.error('Erro ao carregar convites.')
    } else {
      setInvites(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const cancel = async (inv) => {
    if (!window.confirm(`Cancelar o convite ${inv.code} de ${inv.client_name}?`)) return
    const { error } = await supabase
      .from('dv_invites')
      .update({ status: 'cancelado' })
      .eq('id', inv.id)
    if (error) {
      toast.error('Não foi possível cancelar.')
    } else {
      toast.success('Convite cancelado.')
      setInvites((list) =>
        list.map((i) => (i.id === inv.id ? { ...i, status: 'cancelado' } : i)),
      )
    }
  }

  const copyLink = async (inv) => {
    try {
      await navigator.clipboard.writeText(inviteLink(inv.code))
      toast.success('Link copiado!')
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  const exportLinks = () => {
    const rows = filtered.map((i) => ({
      Nome: i.client_name,
      Telefone: i.client_phone || '',
      Codigo: i.code,
      Status: effectiveStatus(i),
      Link: inviteLink(i.code),
    }))
    if (!rows.length) {
      toast.error('Nada para exportar.')
      return
    }
    downloadCsv('convites_nomade.csv', rows)
  }

  const counts = useMemo(() => {
    const c = { ativo: 0, usado: 0, expirado: 0, cancelado: 0 }
    invites.forEach((i) => {
      c[effectiveStatus(i)] = (c[effectiveStatus(i)] || 0) + 1
    })
    return c
  }, [invites])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const digits = search.replace(/\D/g, '')
    return invites.filter((i) => {
      const st = effectiveStatus(i)
      if (filter !== 'todos' && st !== filter) return false
      if (!term) return true
      const byName = i.client_name?.toLowerCase().includes(term)
      const byCode = i.code?.toLowerCase().includes(term)
      const byPhone = digits && (i.client_phone || '').replace(/\D/g, '').includes(digits)
      return byName || byCode || byPhone
    })
  }, [invites, filter, search])

  return (
    <div>
      <h1 className="text-2xl font-bold">Convites Nômade</h1>
      <p className="mt-1 text-sm text-gray-500">
        Cortesia enviada por WhatsApp aos clientes — validação feita pela equipe no validador.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {['ativo', 'usado', 'expirado', 'cancelado'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? 'todos' : s)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              filter === s ? 'border-gray-500 bg-gray-800' : 'border-gray-800 bg-gray-900/60'
            }`}
          >
            <p className="text-2xl font-bold">{counts[s] || 0}</p>
            <p className="text-xs capitalize text-gray-400">{s}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou código…"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white outline-none focus:border-gray-500"
        />
        {filter !== 'todos' ? (
          <button
            onClick={() => setFilter('todos')}
            className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-gray-500"
          >
            Limpar filtro ({filter})
          </button>
        ) : null}
        <button
          onClick={exportLinks}
          className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:border-gray-500"
        >
          <Download size={16} />
          Exportar links
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-gray-500">Carregando…</p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900/80 text-gray-400">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Validação</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const st = effectiveStatus(i)
                return (
                  <tr key={i.id} className="border-t border-gray-800">
                    <td className="px-4 py-3">
                      <span className="font-medium">{i.client_name}</span>
                      <span className="block text-xs text-gray-500">{i.client_phone}</span>
                    </td>
                    <td className="px-4 py-3 font-mono">{i.code}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-[11px] ${STATUS_STYLE[st]}`}>
                        {st}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {i.used_at ? (
                        <>
                          {new Date(i.used_at).toLocaleString('pt-BR')}
                          {i.validated_by ? (
                            <span className="block">por {i.validated_by}</span>
                          ) : null}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyLink(i)}
                          title="Copiar link do convite"
                          className="flex items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 hover:border-gray-500"
                        >
                          <Link2 size={14} />
                          Link
                        </button>
                        {st === 'ativo' ? (
                          <button
                            onClick={() => cancel(i)}
                            className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/20"
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Nenhum convite encontrado.
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
