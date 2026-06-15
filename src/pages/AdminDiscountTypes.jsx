import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../supabase'

const UNIT_LABELS = {
  '': 'Ambas as unidades',
  nomade: 'Nômade',
  manga: 'Pé de Manga',
}

function Modal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    unit_slug: item?.unit_slug || '',
    active: item?.active ?? true,
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        name: form.name.trim().toUpperCase(),
        description: form.description.trim() || null,
        unit_slug: form.unit_slug || null,
        active: form.active,
      }

      let error
      if (item?.id) {
        ;({ error } = await supabase.from('dv_discount_types').update(payload).eq('id', item.id))
      } else {
        ;({ error } = await supabase.from('dv_discount_types').insert(payload))
      }

      if (error) {
        toast.error('Erro ao salvar.')
        console.error(error)
        return
      }

      toast.success(item?.id ? 'Tipo atualizado.' : 'Tipo criado.')
      onSave()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">
            {item?.id ? 'Editar tipo de desconto' : 'Novo tipo de desconto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome *</label>
            <input
              required
              type="text"
              placeholder="Ex: UOL, CLUBE FOLHA, PRIMEIRA MESA"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Descrição opcional"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Unidade</label>
            <select
              value={form.unit_slug}
              onChange={e => setForm(p => ({ ...p, unit_slug: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Ambas as unidades</option>
              <option value="nomade">Nômade</option>
              <option value="manga">Pé de Manga</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, active: !p.active }))}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.active ? 'bg-amber-500' : 'bg-gray-700'}`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
            <span className="text-sm text-gray-400">{form.active ? 'Ativo' : 'Inativo'}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 text-black font-semibold text-sm disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminDiscountTypes() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | item

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('dv_discount_types')
      .select('*')
      .order('name')
    if (!error && data) setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(item) {
    const { error } = await supabase
      .from('dv_discount_types')
      .update({ active: !item.active })
      .eq('id', item.id)
    if (error) {
      toast.error('Erro ao atualizar.')
    } else {
      toast.success(item.active ? 'Desativado.' : 'Ativado.')
      load()
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Excluir "${item.name}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('dv_discount_types').delete().eq('id', item.id)
    if (error) {
      toast.error('Não foi possível excluir. O tipo pode estar em uso.')
    } else {
      toast.success('Tipo excluído.')
      load()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tipos de Desconto</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerenciar identificadores de desconto (UOL, CLUBE FOLHA, etc.)</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 bg-amber-500 text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-amber-400 transition"
        >
          <Plus size={16} />
          Novo tipo
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          Nenhum tipo cadastrado. Clique em "Novo tipo" para começar.
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-500 font-medium px-5 py-3">Nome</th>
                <th className="text-left text-gray-500 font-medium px-5 py-3 hidden sm:table-cell">Descrição</th>
                <th className="text-left text-gray-500 font-medium px-5 py-3 hidden md:table-cell">Unidade</th>
                <th className="text-center text-gray-500 font-medium px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition">
                  <td className="px-5 py-3.5">
                    <span className="text-white font-medium">{item.name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 hidden sm:table-cell">
                    {item.description || '—'}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                      {UNIT_LABELS[item.unit_slug || ''] || item.unit_slug}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleToggle(item)}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition ${
                        item.active
                          ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                          : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                      }`}
                    >
                      {item.active ? <Check size={12} /> : <X size={12} />}
                      {item.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal(item)}
                        className="p-1.5 text-gray-500 hover:text-amber-400 transition"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <Modal
          item={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
