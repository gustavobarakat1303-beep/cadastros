import { useEffect, useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase.js'
import { UNITS, getUnit } from '../../config/units.js'

const EMPTY = { name: '', description: '', unit_slug: '' }

export default function TiposDesconto() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('dv_discount_types')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error('Erro ao carregar tipos de desconto.')
    else setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Informe o nome do tipo de desconto.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('dv_discount_types').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      unit_slug: form.unit_slug || null,
    })
    setSaving(false)
    if (error) {
      toast.error('Erro ao criar tipo de desconto.')
    } else {
      toast.success('Tipo de desconto criado!')
      setForm(EMPTY)
      load()
    }
  }

  const toggle = async (row) => {
    const { error } = await supabase
      .from('dv_discount_types')
      .update({ active: !row.active })
      .eq('id', row.id)
    if (error) toast.error('Erro ao atualizar.')
    else load()
  }

  const remove = async (row) => {
    if (!confirm(`Excluir "${row.name}"?`)) return
    const { error } = await supabase
      .from('dv_discount_types')
      .delete()
      .eq('id', row.id)
    if (error) toast.error('Erro ao excluir.')
    else {
      toast.success('Excluído.')
      load()
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tipos de desconto</h1>

      <form
        onSubmit={create}
        className="mb-8 grid gap-3 rounded-2xl border border-gray-800 bg-gray-900/60 p-5 sm:grid-cols-2"
      >
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nome (ex: UOL, Clube Folha) *"
          className="field"
        />
        <select
          value={form.unit_slug}
          onChange={(e) => setForm({ ...form, unit_slug: e.target.value })}
          className="field"
        >
          <option value="">Todas as unidades</option>
          {Object.values(UNITS).map((u) => (
            <option key={u.slug} value={u.slug}>
              {u.name}
            </option>
          ))}
        </select>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descrição"
          className="field sm:col-span-2"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-black disabled:opacity-50 sm:col-span-2"
        >
          <Plus size={16} /> {saving ? 'Salvando…' : 'Adicionar'}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Carregando…</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900/60 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{row.name}</span>
                  <span className="text-xs text-gray-500">
                    · {row.unit_slug ? getUnit(row.unit_slug)?.name : 'Todas'}
                  </span>
                </div>
                {row.description ? (
                  <p className="text-sm text-gray-400">{row.description}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggle(row)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    row.active
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-gray-500/10 text-gray-400'
                  }`}
                >
                  {row.active ? 'Ativo' : 'Inativo'}
                </button>
                <button
                  onClick={() => remove(row)}
                  className="text-gray-500 hover:text-red-400"
                  aria-label="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {!rows.length ? (
            <p className="text-gray-500">Nenhum tipo de desconto cadastrado.</p>
          ) : null}
        </div>
      )}

      <style>{`
        .field {
          border-radius: 0.5rem;
          border: 1px solid #374151;
          background-color: #111827;
          padding: 0.5rem 0.75rem;
          color: #f9fafb;
          outline: none;
        }
        .field:focus { border-color: #6b7280; }
      `}</style>
    </div>
  )
}
