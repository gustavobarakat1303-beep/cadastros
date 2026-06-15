import { useState, useEffect } from 'react'
import {
  collection, getDocs, doc, setDoc, updateDoc, addDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../firebase'
import { Building2, Plus, Pencil, X, Check, Loader2 } from 'lucide-react'

const EMPTY_FORM = {
  name: '',
  slug: '',
  address: '',
  instagram: '',
  phone: '',
  accentColor: '#f59e0b',
  active: true,
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-400 font-medium">{label}</label>
      {children}
    </div>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition ${className}`}
    />
  )
}

export default function AdminUnits() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null) // null = sem modal, 'new' = nova unidade
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { fetchUnits() }, [])

  async function fetchUnits() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'units'))
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditingId('new')
  }

  function openEdit(unit) {
    setForm({
      name: unit.name ?? '',
      slug: unit.slug ?? '',
      address: unit.address ?? '',
      instagram: unit.instagram ?? '',
      phone: unit.phone ?? '',
      accentColor: unit.accentColor ?? '#f59e0b',
      active: unit.active ?? true,
    })
    setEditingId(unit.id)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, updatedAt: serverTimestamp() }
      if (editingId === 'new') {
        payload.createdAt = serverTimestamp()
        await addDoc(collection(db, 'units'), payload)
      } else {
        await updateDoc(doc(db, 'units', editingId), payload)
      }
      setEditingId(null)
      await fetchUnits()
    } finally {
      setSaving(false)
    }
  }

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Unidades</h1>
          <p className="text-gray-500 text-sm mt-0.5">{units.length} unidade{units.length !== 1 ? 's' : ''} cadastrada{units.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium border border-amber-500/30 transition"
        >
          <Plus className="w-4 h-4" />
          Nova unidade
        </button>
      </div>

      {/* Lista de unidades */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : units.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 border border-white/5 rounded-2xl">
          <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Nenhuma unidade cadastrada ainda.</p>
          <button onClick={openNew} className="mt-4 text-amber-400 text-sm underline hover:text-amber-300 transition">
            Criar primeira unidade
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                {/* Color swatch */}
                <div
                  className="w-10 h-10 rounded-xl shrink-0 mt-0.5 border border-white/10"
                  style={{ backgroundColor: unit.accentColor || '#f59e0b' }}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium">{unit.name}</p>
                    <span className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded-md text-gray-400">
                      /{unit.slug}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      unit.active ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'
                    }`}>
                      {unit.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  {unit.address && <p className="text-gray-500 text-xs mb-0.5">{unit.address}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {unit.instagram && <span>@{unit.instagram.replace('@', '')}</span>}
                    {unit.phone && <span>{unit.phone}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => openEdit(unit)}
                className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition shrink-0"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal edição / criação */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-white font-semibold">
                {editingId === 'new' ? 'Nova unidade' : 'Editar unidade'}
              </h2>
              <button
                onClick={() => setEditingId(null)}
                className="text-gray-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome *">
                  <Input
                    placeholder="Ex: Nômade"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </Field>
                <Field label="Slug (ID interno) *">
                  <Input
                    placeholder="Ex: nomade"
                    value={form.slug}
                    onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/\s/g, '-'))}
                  />
                </Field>
              </div>
              <Field label="Endereço">
                <Input
                  placeholder="Rua, número — bairro"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Instagram">
                  <Input
                    placeholder="@no.made"
                    value={form.instagram}
                    onChange={(e) => set('instagram', e.target.value)}
                  />
                </Field>
                <Field label="Telefone / WhatsApp">
                  <Input
                    placeholder="(11) 9xxxx-xxxx"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Cor de destaque">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => set('accentColor', e.target.value)}
                    className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                  />
                  <Input
                    value={form.accentColor}
                    onChange={(e) => set('accentColor', e.target.value)}
                    className="flex-1"
                    placeholder="#f59e0b"
                  />
                </div>
              </Field>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set('active', e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className="text-sm text-gray-300">Unidade ativa</span>
              </label>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.slug.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
