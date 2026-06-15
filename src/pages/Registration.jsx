import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import toast from 'react-hot-toast'

import { getUnit } from '../config/units.js'
import { supabase } from '../lib/supabase.js'
import { generateCode } from '../lib/code.js'
import UnitHeader from '../components/UnitHeader.jsx'

const onlyDigits = (s) => (s || '').replace(/\D/g, '')

function formatPhone(value) {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function Registration() {
  const { unit: unitSlug } = useParams()
  const unit = getUnit(unitSlug)

  const [discountTypes, setDiscountTypes] = useState([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    birthdate: '',
    discount_type_id: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!unit) return
    let active = true
    ;(async () => {
      setLoadingTypes(true)
      // Tipos de desconto da unidade + os globais (sem unidade definida).
      const { data, error } = await supabase
        .from('dv_discount_types')
        .select('id, name, description, unit_slug')
        .eq('active', true)
        .or(`unit_slug.eq.${unit.slug},unit_slug.is.null`)
        .order('name')
      if (!active) return
      if (error) {
        toast.error('Não foi possível carregar os tipos de desconto.')
      } else {
        setDiscountTypes(data || [])
      }
      setLoadingTypes(false)
    })()
    return () => {
      active = false
    }
  }, [unit])

  if (!unit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-gray-400">Unidade inválida.</p>
        <Link to="/" className="mt-4 text-sm underline">
          Voltar
        </Link>
      </div>
    )
  }

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    const name = form.name.trim()
    const phoneDigits = onlyDigits(form.phone)

    if (name.length < 2) {
      toast.error('Informe seu nome completo.')
      return
    }
    if (phoneDigits.length < 10) {
      toast.error('Informe um telefone válido com DDD.')
      return
    }

    setSubmitting(true)
    try {
      const code = generateCode(6, unit.codePrefix)
      const { error } = await supabase.from('dv_registrations').insert({
        unit_slug: unit.slug,
        name,
        phone: phoneDigits,
        birthdate: form.birthdate || null,
        discount_type_id: form.discount_type_id || null,
        code,
      })

      if (error) throw error

      const base = window.location.origin
      const qrUrl = `${base}/validar/${unit.slug}?code=${code}`
      setResult({ code, qrUrl })
      toast.success('Cadastro realizado!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao realizar o cadastro. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <UnitHeader unit={unit} subtitle="Seu desconto está pronto!" />
        <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-white p-6 flex flex-col items-center">
          <QRCodeCanvas value={result.qrUrl} size={220} includeMargin />
        </div>
        <p className="mt-6 text-gray-400 text-sm">Seu código:</p>
        <p className="text-3xl font-mono font-bold tracking-widest mt-1">
          {result.code}
        </p>
        <p className="mt-6 max-w-sm text-center text-sm text-gray-500">
          Apresente este QR Code ou informe o código na entrada do
          restaurante para validar seu desconto.
        </p>
        <button
          onClick={() => {
            setResult(null)
            setForm({
              name: '',
              phone: '',
              birthdate: '',
              discount_type_id: '',
            })
          }}
          className="mt-8 rounded-lg bg-gray-800 px-5 py-2 text-sm hover:bg-gray-700"
        >
          Fazer novo cadastro
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <UnitHeader unit={unit} subtitle="Cadastre-se e ganhe seu desconto" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nome completo *">
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="Seu nome"
              className="input"
              required
            />
          </Field>

          <Field label="Telefone (WhatsApp) *">
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))
              }
              placeholder="(11) 99999-9999"
              className="input"
              required
            />
          </Field>

          <Field label="Data de nascimento">
            <input
              type="date"
              value={form.birthdate}
              onChange={update('birthdate')}
              className="input"
            />
          </Field>

          {loadingTypes ? (
            <p className="text-sm text-gray-500">Carregando descontos…</p>
          ) : discountTypes.length > 0 ? (
            <Field label="Tipo de desconto">
              <select
                value={form.discount_type_id}
                onChange={update('discount_type_id')}
                className="input"
              >
                <option value="">Selecione (opcional)</option>
                {discountTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={`mt-2 rounded-lg ${unit.accentClass} px-5 py-3 font-semibold text-black transition disabled:opacity-50`}
          >
            {submitting ? 'Enviando…' : 'Gerar meu desconto'}
          </button>
        </form>
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

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-400">{label}</span>
      {children}
    </label>
  )
}
