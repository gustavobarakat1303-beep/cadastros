import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { trackCompleteRegistration, trackLead } from '../../lib/metaPixel.js'

const DISCOUNT_TYPE_NAME = 'FEIJOADA CORTESIA'
const UNIT_SLUG = 'nomade'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'NM-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function FeijoadaRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', email: '', birthdate: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.phone.trim() || !form.birthdate) {
      setError('Preencha nome, telefone e data de nascimento.')
      return
    }
    setLoading(true)
    try {
      const { data: discountType, error: dtError } = await supabase
        .from('dv_discount_types')
        .select('id')
        .eq('name', DISCOUNT_TYPE_NAME)
        .eq('unit_slug', UNIT_SLUG)
        .eq('active', true)
        .single()

      if (dtError || !discountType) throw new Error('Tipo de desconto não encontrado.')

      const code = generateCode()

      const { error: insertError } = await supabase
        .from('dv_registrations')
        .insert({
          unit_slug: UNIT_SLUG,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          birthdate: form.birthdate,
          code,
          used: false,
          discount_type_id: discountType.id,
        })

      if (insertError) throw new Error('Erro ao registrar. Tente novamente.')

      trackCompleteRegistration()
      trackLead()
      navigate(`/feijoada/convite/${code}`)

    } catch (err) {
      setError(err.message || 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#110f0d] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img
            src="https://rfggzdohnchnnmavphrm.supabase.co/storage/v1/object/public/logos/Logo%20Nomade%20Escurol.png"
            alt="Nômade Bar & Restaurante"
            className="h-14 object-contain"
          />
        </div>
        <div className="text-center mb-8">
          <p className="text-[#c8b89a] text-xs tracking-widest uppercase font-light mb-3">Convite especial</p>
          <h1 className="text-[#f4efe8] text-4xl font-black uppercase tracking-tight leading-none mb-2">
            1 Feijoada<br />Cortesia
          </h1>
          <p className="text-[#c8b89a] text-sm tracking-wider mt-3">com 1 acompanhante pagante</p>
          <div className="w-16 h-px bg-[#c8b89a] opacity-40 mx-auto mt-4" />
          <p className="text-[#c8b89a] text-xs tracking-widest uppercase opacity-60 mt-4">Válido aos sábados até as 14h</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#c8b89a] text-xs tracking-widest uppercase mb-1">Nome completo *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required
              className="w-full bg-[#1a1714] border border-[#c8b89a]/30 text-[#f4efe8] px-4 py-3 text-sm focus:outline-none focus:border-[#c8b89a]/70 placeholder-[#c8b89a]/30"
              placeholder="Seu nome" />
          </div>
          <div>
            <label className="block text-[#c8b89a] text-xs tracking-widest uppercase mb-1">WhatsApp *</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} required
              className="w-full bg-[#1a1714] border border-[#c8b89a]/30 text-[#f4efe8] px-4 py-3 text-sm focus:outline-none focus:border-[#c8b89a]/70 placeholder-[#c8b89a]/30"
              placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="block text-[#c8b89a] text-xs tracking-widest uppercase mb-1">E-mail</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              className="w-full bg-[#1a1714] border border-[#c8b89a]/30 text-[#f4efe8] px-4 py-3 text-sm focus:outline-none focus:border-[#c8b89a]/70 placeholder-[#c8b89a]/30"
              placeholder="seu@email.com (opcional)" />
          </div>
          <div>
            <label className="block text-[#c8b89a] text-xs tracking-widest uppercase mb-1">Data de nascimento *</label>
            <input type="date" name="birthdate" value={form.birthdate} onChange={handleChange} required
              className="w-full bg-[#1a1714] border border-[#c8b89a]/30 text-[#f4efe8] px-4 py-3 text-sm focus:outline-none focus:border-[#c8b89a]/70" />
          </div>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full border border-[#c8b89a]/60 text-[#c8b89a] py-4 text-sm tracking-widest uppercase font-semibold hover:bg-[#c8b89a]/10 transition-colors disabled:opacity-50 mt-2">
            {loading ? 'Gerando convite...' : 'Quero meu convite'}
          </button>
        </form>
        <div className="text-center mt-8 space-y-2">
          <p className="text-[#c8b89a]/50 text-xs tracking-widest uppercase">Nômade Bar & Restaurante</p>
          <p className="text-[#c8b89a]/40 text-xs">Av. Rebouças, 3400 — Pinheiros, São Paulo</p>
          <a href={`https://wa.me/5511916547785?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre a Feijoada Cortesia.')}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-block text-[#c8b89a]/50 text-xs underline underline-offset-2 mt-1">
            Falar com o Nômade no WhatsApp
          </a>
        </div>
      </div>
    </main>
  )
}
