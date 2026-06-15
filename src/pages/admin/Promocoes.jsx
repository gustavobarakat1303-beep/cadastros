import { useEffect, useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase.js'
import { UNITS, getUnit } from '../../config/units.js'

const EMPTY = {
  unit_slug: 'nomade',
  title: '',
  description: '',
  discount_percent: '',
  discount_value: '',
}

export default function Promocoes() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('dv_promotions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error('Erro ao carregar promoções.')
    else setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Informe o título da promoção.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('dv_promotions').insert({
      unit_slug: form.unit_slug,
      title: form.title.trim(),
      description: form.description.trim() || null,
      discount_percent: form.discount_percent
        ? Number(form.discount_percent)
        : null,
      discount_value: form.discount_value ? Number(form.discount_value) : null,
    })
    setSaving(false)
    if (error) {
      toast.error('Erro ao criar promoção.')
    } else {
      toast.success('Promoção criada!')
      setForm(EMPTY)
      load()
    }
  }

  const toggle = async (row) => {
    const { error } = await supabase
      .from('dv_promotions')
      .update({ active: !row.active, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (error) toast.error('Erro ao atualizar.')
    else load()
  }

  const remove = async (row) => {
    if (!confirm(`Excluir a promoção "${row.title}"?`)) return
    const { error } = await supabase
      .from('dv_promotions')
      .delete()
      .eq('id', row.id)
    if (error) toast.error('Erro ao excluir.')
    else {
      toast.success('Promoção excluída.')
      load()
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Promoções</h1>

      <form
        onSubmit={create}
        className="mb-8 grid gap-3 rounded-2xl border border-gray-800 bg-gray-900/60 p-5 sm:grid-cols-2"
      >
        <select
          value={form.unit_slug}
          onChange={(e) => setForm({ ...form, unit_slug: e.target.value })}
          className="field"
        >
          {Object.values(UNITS).map((u) => (
            <option key={u.slug} value={u.slug}>
              {u.name}
            </option>
          ))}
        </select>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Título *"
          className="field"
        />
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descrição"
          className="field sm:col-span-2"
        />
        <input
          type="number"
          min="0"
          max="100"
          value={form.discount_percent}
          onChange={(e) =>
            setForm({ ...form, discount_percent: e.target.value })
          }
          placeholder="Desconto (%)"
          className="field"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.discount_value}
          onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
          placeholder="Desconto (R$)"
          className="field"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-black disabled:opacity-50 sm:col-span-2"
        >
          <Plus size={16} /> {saving ? 'Salvando…' : 'Adicionar promoção'}
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
                  <span className="font-medium">{row.title}</span>
                  <span className="text-xs text-gray-500">
                    · {getUnit(row.unit_slug)?.name || row.unit_slug}
                  </span>
                </div>
                {row.description ? (
                  <p className="text-sm text-gray-400">{row.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-gray-500">
                  {row.discount_percent ? `${row.discount_percent}% ` : ''}
                  {row.discount_value
                    ? `R$ ${Number(row.discount_value).toFixed(2)}`
                    : ''}
                </p>
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
                  {row.active ? 'Ativa' : 'Inativa'}
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
            <p className="text-gray-500">Nenhuma promoção cadastrada.</p>
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
