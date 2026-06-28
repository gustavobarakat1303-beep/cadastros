import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import { getUnit } from '../../config/units.js'
import { supabase } from '../../lib/supabase.js'
import { trackCompleteRegistration, trackLead } from '../../lib/metaPixel.js'

const onlyDigits = (s) => (s || '').replace(/\D/g, '')

function formatPhone(value) {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function FeijoadaRegister() {
  const navigate = useNavigate()
  const unit = getUnit('nomade')
  const [form, setForm] = useState({ name: '', phone: '', birthDay: '', birthMonth: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const name = form.name.trim()
    const phoneDigits = onlyDigits(form.phone)
    if (name.length < 2) {
      toast.error('Informe seu nome.')
      return
    }
    if (phoneDigits.length < 10) {
      toast.error('Informe um telefone válido com DDD.')
      return
    }
    if (!form.birthDay || !form.birthMonth) {
      toast.error('Informe o dia e o mês do seu aniversário.')
      return
    }
    // Guardamos só dia/mês — usamos um ano neutro (2000) internamente.
    const dd = String(form.birthDay).padStart(2, '0')
    const mm = String(form.birthMonth).padStart(2, '0')
    const iso = `2000-${mm}-${dd}`
    const test = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(test.getTime()) || test.getUTCDate() !== Number(form.birthDay)) {
      toast.error('Aniversário inválido.')
      return
    }
    setSubmitting(true)
    try {
      const { data, error } = await supabase.rpc('dv_create_feijoada_invite', {
        p_name: name,
        p_phone: form.phone,
        p_birthdate: iso,
      })
      if (error) throw error
      if (data?.status === 'ok' && data?.code) {
        // Meta Pixel — eventos de conversão da campanha (somente nas rotas /feijoada).
        trackCompleteRegistration()
        trackLead()
        navigate(`/feijoada/convite/${data.code}`)
      } else if (data?.status === 'invalid') {
        toast.error(data.reason === 'telefone' ? 'Telefone inválido.' : 'Nome inválido.')
      } else {
        toast.error('Não foi possível gerar o convite. Tente novamente.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gerar o convite. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col items-center">
        {unit?.logo ? (
          <img
            src={unit.logo}
            alt="Nômade"
            className="h-24 w-24 rounded-full object-cover shadow-lg ring-1 ring-white/10 mb-5"
          />
        ) : null}

        <p className="text-4xl">🍲</p>
        <h1 className="mt-2 text-center text-2xl font-bold leading-snug">
          Feijoada em dobro no Nômade
        </h1>
        <p className="mt-3 text-center text-gray-300">
          Cadastre-se e ganhe seu convite: <span className="font-semibold">peça 1 feijoada
          e a 2ª é por nossa conta</span>. 💛
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex w-full flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Nome completo *</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Seu nome"
              className="input"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Telefone (WhatsApp) *</span>
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
              placeholder="(11) 99999-9999"
              className="input"
              required
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Aniversário (dia e mês) *</span>
            <div className="flex gap-3">
              <select
                value={form.birthDay}
                onChange={(e) => setForm((f) => ({ ...f, birthDay: e.target.value }))}
                className="input"
                required
              >
                <option value="">Dia</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={form.birthMonth}
                onChange={(e) => setForm((f) => ({ ...f, birthMonth: e.target.value }))}
                className="input"
                required
              >
                <option value="">Mês</option>
                {MESES.map((nome, idx) => (
                  <option key={nome} value={idx + 1}>{nome}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-gray-600">
              Só o dia e o mês — pra gente te mimar no seu aniversário 🎂
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`mt-2 rounded-lg ${unit.accentClass} px-5 py-3 font-semibold text-black transition disabled:opacity-50`}
          >
            {submitting ? 'Gerando…' : 'Quero meu convite'}
          </button>
        </form>

        <Link to="/" className="mt-8 text-xs text-gray-600 hover:text-gray-400">
          Casa dos Bares
        </Link>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #374151;
          background-color: #111827;
          padding: 0.625rem 0.75rem;
          color: #f9fafb;
          outline: none;
        }
        .input:focus { border-color: #6b7280; }
      `}</style>
    </div>
  )
}
