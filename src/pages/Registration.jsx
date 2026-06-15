import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { supabase, UNITS } from '../supabase'

const BASE_URL = 'https://casa-dos-bares.vercel.app'

function generateCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefix}-${code}`
}

const LOGOS = {
  nomade: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="72" height="72" rx="16" fill="#f59e0b" />
      <text x="36" y="52" textAnchor="middle" fontSize="42" fontWeight="bold" fontFamily="Georgia, serif" fill="#000">N</text>
    </svg>
  ),
  manga: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="72" height="72" rx="16" fill="#22c55e" />
      <path d="M36 12 C22 12 14 24 14 34 C14 48 26 58 36 60 C46 58 58 48 58 34 C58 24 50 12 36 12Z" fill="#166534" />
      <path d="M36 16 C31 26 27 34 36 60 C45 34 41 26 36 16Z" fill="#4ade80" />
    </svg>
  ),
}

export default function Registration() {
  const { unit } = useParams()
  const unitConfig = UNITS[unit]

  const [form, setForm] = useState({ name: '', email: '', phone: '', birthdate: '', discount_type_id: '' })
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(null)
  const [discountTypes, setDiscountTypes] = useState([])

  useEffect(() => {
    if (!unitConfig) return
    supabase
      .from('dv_discount_types')
      .select('id, name')
      .eq('active', true)
      .order('name')
      .then(({ data }) => {
        if (data) setDiscountTypes(data)
      })
  }, [unitConfig])

  if (!unitConfig) return <Navigate to="/" replace />

  const color = unitConfig.color
  const name = unitConfig.name
  const Logo = LOGOS[unit]

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const code = generateCode(unitConfig.prefix)

      const payload = {
        unit_slug: unit,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        birthdate: form.birthdate || null,
        code,
        used: false,
      }

      if (form.discount_type_id) {
        payload.discount_type_id = form.discount_type_id
      }

      const { error } = await supabase.from('dv_registrations').insert(payload)

      if (error) {
        if (error.code === '23505') {
          toast.error('E-mail já cadastrado.')
        } else {
          toast.error('Erro ao cadastrar. Tente novamente.')
          console.error(error)
        }
        return
      }

      setRegistered({ code, name: form.name.trim(), unit: name })
    } catch (err) {
      toast.error('Erro inesperado.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    const qrUrl = `${BASE_URL}/validar/${unit}?code=${registered.code}`
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0f0f0f' }}>
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">{Logo}</div>
          <h1 className="text-2xl font-bold text-white">{registered.name}, bem-vindo(a)!</h1>
          <p className="text-gray-400">Seu código de desconto está pronto. Apresente o QR Code ao garçom.</p>

          <div className="bg-white rounded-2xl p-6 inline-block shadow-xl">
            <QRCodeSVG
              value={qrUrl}
              size={220}
              fgColor="#000000"
              bgColor="#ffffff"
              level="M"
            />
          </div>

          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Seu código</p>
            <p className="text-2xl font-mono font-bold tracking-widest" style={{ color }}>
              {registered.code}
            </p>
          </div>

          <p className="text-xs text-gray-600">
            {registered.unit} · Uso único · Válido conforme promoção vigente
          </p>

          <button
            onClick={() => {
              setRegistered(null)
              setForm({ name: '', email: '', phone: '', birthdate: '', discount_type_id: '' })
            }}
            className="text-sm underline text-gray-500 hover:text-gray-300"
          >
            Novo cadastro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0f0f0f' }}>
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">{Logo}</div>
          <h1 className="text-3xl font-bold text-white">{name}</h1>
          <p className="text-gray-400">Cadastre-se e ganhe seu desconto exclusivo</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome completo *</label>
            <input
              required
              type="text"
              placeholder="Seu nome"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">E-mail *</label>
            <input
              required
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Telefone / WhatsApp *</label>
            <input
              required
              type="tel"
              placeholder="(11) 99999-9999"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Data de nascimento (opcional)</label>
            <input
              type="date"
              value={form.birthdate}
              onChange={e => setForm(p => ({ ...p, birthdate: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {discountTypes.length > 0 && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo de desconto *</label>
              <select
                required
                value={form.discount_type_id}
                onChange={e => setForm(p => ({ ...p, discount_type_id: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Selecione o desconto</option>
                {discountTypes.map(dt => (
                  <option key={dt.id} value={dt.id}>{dt.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-lg transition-opacity disabled:opacity-50"
            style={{ background: color, color: '#000' }}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar e gerar desconto'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600">
          Seus dados são protegidos e usados somente para benefícios exclusivos.
        </p>
      </div>
    </div>
  )
}
