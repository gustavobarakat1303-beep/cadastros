import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const BLANK = { title: '', description: '', discount_percent: '', unit_slug: 'nomade', active: true, valid_from: '', valid_until: '' }

export default function AdminPromotions() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(null) // null = closed, {} = new, {id,...} = edit

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('dv_promotions').select('*').order('created_at', { ascending: false })
    setPromos(data || [])
    setLoading(false)
  }

  async function save() {
    const payload = {
      title: form.title,
      description: form.description || null,
      discount_percent: form.discount_percent ? Number(form.discount_percent) : null,
      unit_slug: form.unit_slug,
      active: form.active,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
    }

    if (!payload.title.trim()) { toast.error('Título obrigatório'); return }

    let error
    if (form.id) {
      const res = await supabase.from('dv_promotions').update(payload).eq('id', form.id)
      error = res.error
    } else {
      const res = await supabase.from('dv_promotions').insert(payload)
      error = res.error
    }

    if (error) { toast.error('Erro ao salvar'); return }
    toast.success(form.id ? 'Promoção atualizada' : 'Promoção criada')
    setForm(null)
    load()
  }

  async function remove(id) {
    if (!window.confirm('Excluir promoção?')) return
    const { error } = await supabase.from('dv_promotions').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Excluída')
    load()
  }

  async function toggleActive(promo) {
    await supabase.from('dv_promotions').update({ active: !promo.active }).eq('id', promo.id)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Promoções</h1>
          <p className="text-gray-500 text-sm">{promos.length} promoções cadastradas</p>
        </div>
        <button
          onClick={() => setForm({ ...BLANK })}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
        >
          <Plus size={15} /> Nova promoção
        </button>
      </div>

      {/* Form modal */}
      {form && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">{form.id ? 'Editar promoção' : 'Nova promoção'}</h2>
              <button onClick={() => setForm(null)}><X size={18} className="text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Desconto (%)</label>
                  <input type="number" min={0} max={100} value={form.discount_percent || ''} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Unidade</label>
                  <select value={form.unit_slug} onChange={e => setForm(f => ({ ...f, unit_slug: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    <option value="nomade">Nômade</option>
                    <option value="manga">Pé de Manga</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Válido de</label>
                  <input type="date" value={form.valid_from || ''} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Válido até</label>
                  <input type="date" value={form.valid_until || ''} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="accent-amber-500" />
                <span className="text-sm text-white">Ativa</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setForm(null)}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-400 rounded-lg text-sm hover:border-gray-500 transition-colors">
                Cancelar
              </button>
              <button onClick={save}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-sm transition-colors">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhuma promoção cadastrada.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {promos.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{p.title}</p>
                  {p.description && <p className="text-gray-500 text-xs truncate">{p.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.unit_slug === 'nomade' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                      {p.unit_slug === 'nomade' ? 'Nômade' : 'Pé de Manga'}
                    </span>
                    {p.discount_percent && <span className="text-xs text-gray-500">{p.discount_percent}% off</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(p)} title={p.active ? 'Desativar' : 'Ativar'}
                    className={`p-1.5 rounded-lg ${p.active ? 'text-green-400 bg-green-500/10' : 'text-gray-600 bg-gray-800'} hover:opacity-80 transition-opacity`}>
                    <Check size={14} />
                  </button>
                  <button onClick={() => setForm({ ...p })} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
