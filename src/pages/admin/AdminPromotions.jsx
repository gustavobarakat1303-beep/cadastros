import { useState, useEffect, useRef } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../../firebase'
import { QRCodeSVG } from 'qrcode.react'
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Copy,
  QrCode, X, Link2, Loader2, Check
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = window.location.origin

function buildLink(promoId) {
  return `${BASE_URL}/cadastro/${promoId}`
}

function unitLabel(unitId = '') {
  const u = unitId.toLowerCase()
  if (u.includes('nomade') || u.includes('nômade')) return 'Nômade'
  if (u.includes('manga')) return 'Pé de Manga'
  return unitId
}

function formatDate(ts) {
  if (!ts) return '–'
  const d = ts.toDate?.() ?? new Date(ts)
  return d.toLocaleDateString('pt-BR')
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function StatusBadge({ active }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
      active
        ? 'bg-green-500/15 text-green-400'
        : 'bg-white/5 text-gray-500'
    }`}>
      {active ? 'Ativa' : 'Inativa'}
    </span>
  )
}

// ─── Modal de link / QR ───────────────────────────────────────────────────────

function LinkModal({ promo, onClose }) {
  const link = buildLink(promo.id)
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWA() {
    const text = `🎉 Cadastre-se na promoção *${promo.name}*!\n\n${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Link & QR Code</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4 truncate font-medium">{promo.name}</p>

        {/* QR Code */}
        <div className="bg-white rounded-xl p-4 flex items-center justify-center mb-5">
          <QRCodeSVG value={link} size={180} fgColor="#111827" bgColor="#ffffff" />
        </div>

        {/* Link */}
        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-4">
          <Link2 className="w-4 h-4 text-gray-500 shrink-0" />
          <p className="text-gray-300 text-xs flex-1 truncate font-mono">{link}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-semibold transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
          <button
            onClick={shareWA}
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition"
          >
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de criação / edição ─────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  description: '',
  unitId: 'nomade',
  discount: '',
  startDate: '',
  endDate: '',
  active: true,
}

function PromoForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM)

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">
            {initial ? 'Editar promoção' : 'Nova promoção'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Nome da promoção *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: Happy Hour Nômade"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-amber-500/50 transition"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Detalhes sobre o desconto ou benefício"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-amber-500/50 transition resize-none"
            />
          </div>

          {/* Unidade + Desconto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Unidade *</label>
              <select
                required
                value={form.unitId}
                onChange={(e) => set('unitId', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 transition appearance-none"
              >
                <option value="nomade">Nômade</option>
                <option value="manga">Pé de Manga</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Desconto / benefício</label>
              <input
                value={form.discount}
                onChange={(e) => set('discount', e.target.value)}
                placeholder="Ex: 20% ou 1 drink"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-amber-500/50 transition"
              />
            </div>
          </div>

          {/* Vigência */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Início</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 transition [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Fim</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 transition [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => set('active', !form.active)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
              {form.active
                ? <ToggleRight className="w-6 h-6 text-green-400" />
                : <ToggleLeft  className="w-6 h-6 text-gray-600" />
              }
              {form.active ? 'Promoção ativa' : 'Promoção inativa'}
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-950 text-sm font-semibold transition"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [linkPromo, setLinkPromo] = useState(null)

  useEffect(() => {
    fetchPromotions()
  }, [])

  async function fetchPromotions() {
    setLoading(true)
    try {
      const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setPromotions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(form) {
    setSaving(true)
    try {
      if (editingPromo) {
        const ref = doc(db, 'promotions', editingPromo.id)
        await updateDoc(ref, { ...form, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, 'promotions'), {
          ...form,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
      await fetchPromotions()
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(promo) {
    const ref = doc(db, 'promotions', promo.id)
    await updateDoc(ref, { active: !promo.active, updatedAt: serverTimestamp() })
    setPromotions((prev) =>
      prev.map((p) => p.id === promo.id ? { ...p, active: !p.active } : p)
    )
  }

  async function handleDelete(promo) {
    if (!confirm(`Excluir "${promo.name}"? Esta ação não pode ser desfeita.`)) return
    await deleteDoc(doc(db, 'promotions', promo.id))
    setPromotions((prev) => prev.filter((p) => p.id !== promo.id))
  }

  function openCreate() { setEditingPromo(null); setShowForm(true) }
  function openEdit(p)  { setEditingPromo(p);    setShowForm(true) }
  function closeForm()  { setShowForm(false); setEditingPromo(null) }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Promoções</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie as promoções ativas</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          Nova promoção
        </button>
      </div>

      {/* Lista */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse mx-6 my-4 rounded-xl" />
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-sm">Nenhuma promoção cadastrada.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-amber-400 text-sm hover:text-amber-300 transition"
            >
              Criar primeira promoção →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left">
                  <th className="text-gray-500 font-medium px-6 py-3">Nome</th>
                  <th className="text-gray-500 font-medium px-4 py-3">Unidade</th>
                  <th className="text-gray-500 font-medium px-4 py-3">Desconto</th>
                  <th className="text-gray-500 font-medium px-4 py-3">Início</th>
                  <th className="text-gray-500 font-medium px-4 py-3">Fim</th>
                  <th className="text-gray-500 font-medium px-4 py-3">Status</th>
                  <th className="text-gray-500 font-medium px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-white/2 transition">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{promo.name}</p>
                      {promo.description && (
                        <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{promo.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-300">{unitLabel(promo.unitId)}</td>
                    <td className="px-4 py-4 text-gray-300">{promo.discount || '–'}</td>
                    <td className="px-4 py-4 text-gray-400">{promo.startDate || '–'}</td>
                    <td className="px-4 py-4 text-gray-400">{promo.endDate || '–'}</td>
                    <td className="px-4 py-4">
                      <StatusBadge active={promo.active} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle ativo */}
                        <button
                          onClick={() => toggleActive(promo)}
                          title={promo.active ? 'Desativar' : 'Ativar'}
                          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
                        >
                          {promo.active
                            ? <ToggleRight className="w-4 h-4 text-green-400" />
                            : <ToggleLeft  className="w-4 h-4" />
                          }
                        </button>
                        {/* Link / QR */}
                        <button
                          onClick={() => setLinkPromo(promo)}
                          title="Link / QR Code"
                          className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-white/5 transition"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {/* Editar */}
                        <button
                          onClick={() => openEdit(promo)}
                          title="Editar"
                          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Excluir */}
                        <button
                          onClick={() => handleDelete(promo)}
                          title="Excluir"
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <PromoForm
          initial={editingPromo ?? undefined}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}
      {linkPromo && (
        <LinkModal promo={linkPromo} onClose={() => setLinkPromo(null)} />
      )}
    </div>
  )
}
