import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { QRCodeSVG } from 'qrcode.react'
import { nanoid } from 'nanoid'
import toast from 'react-hot-toast'
import { CheckCircle, Share2, Copy, MapPin, Instagram } from 'lucide-react'
import { db } from '../firebase'
import { useUnit } from '../contexts/UnitContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { FullPageSpinner } from '../components/ui/Spinner'

// Prefixos de código por unidade
const CODE_PREFIX = { nomade: 'NM', manga: 'PM' }

// Gera código único: NM-4X9K2T
function generateCode(unitId) {
  return `${CODE_PREFIX[unitId] || 'CD'}-${nanoid(6).toUpperCase()}`
}

// Formata telefone: (11) 99999-9999
function formatPhone(v) {
  const digits = v.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// Formata data nascimento: DD/MM/AAAA
function formatBirth(v) {
  const digits = v.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export default function RegisterPage() {
  const { unitId, promotionId } = useParams()
  const unit = useUnit(unitId)

  const [promotion, setPromotion] = useState(null)
  const [loadingPromo, setLoadingPromo] = useState(true)
  const [promoError, setPromoError] = useState(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    birthdate: '',
    cpf: '',
    acceptTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(null) // { code, qrValue }

  // Carrega promoção
  useEffect(() => {
    const load = async () => {
      try {
        const promoDoc = await getDoc(doc(db, 'promotions', promotionId))
        if (!promoDoc.exists() || !promoDoc.data().active) {
          setPromoError('Esta promoção não está mais disponível.')
          return
        }
        const data = promoDoc.data()
        if (data.unit && data.unit !== unitId) {
          setPromoError('Link inválido para esta unidade.')
          return
        }
        setPromotion({ id: promoDoc.id, ...data })
      } catch {
        setPromoError('Erro ao carregar promoção. Tente novamente.')
      } finally {
        setLoadingPromo(false)
      }
    }
    if (promotionId) load()
  }, [promotionId, unitId])

  // Define cor primária dinâmica
  const primaryColor = unit?.colors?.secondary || '#C9A96E'
  const bgColor = unit?.colors?.primary || '#1A1A1A'

  function validate() {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 3)
      e.name = 'Nome precisa ter pelo menos 3 caracteres.'
    const phoneDigits = form.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10)
      e.phone = 'Telefone inválido.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'E-mail inválido.'
    if (!form.acceptTerms)
      e.acceptTerms = 'Você precisa aceitar os termos.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) {
      setErrors(v)
      return
    }
    setErrors({})
    setSubmitting(true)

    try {
      // Verifica duplicidade por telefone + promoção
      const phoneDigits = form.phone.replace(/\D/g, '')
      const dupQ = query(
        collection(db, 'registrations'),
        where('phone', '==', phoneDigits),
        where('promotionId', '==', promotionId)
      )
      const dupSnap = await getDocs(dupQ)

      if (!dupSnap.empty) {
        // Já cadastrado — retorna o código existente
        const existing = dupSnap.docs[0].data()
        setRegistered({
          code: existing.code,
          qrValue: existing.code,
          alreadyRegistered: true,
        })
        return
      }

      // Cria novo cadastro
      const code = generateCode(unitId)
      const birthParts = form.birthdate ? form.birthdate.split('/') : []
      const birthMonth = birthParts.length === 3 ? parseInt(birthParts[1]) : null
      const birthDay = birthParts.length === 3 ? parseInt(birthParts[0]) : null

      await addDoc(collection(db, 'registrations'), {
        name: form.name.trim(),
        phone: phoneDigits,
        email: form.email.trim().toLowerCase() || null,
        birthdate: form.birthdate || null,
        birthMonth,
        birthDay,
        cpf: form.cpf.replace(/\D/g, '') || null,
        unit: unitId,
        promotionId,
        promotionName: promotion?.name || '',
        code,
        status: 'pending',
        createdAt: serverTimestamp(),
        acceptedTermsAt: serverTimestamp(),
      })

      setRegistered({ code, qrValue: code })
    } catch (err) {
      console.error(err)
      toast.error('Erro ao realizar cadastro. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function copyCode() {
    await navigator.clipboard.writeText(registered.code)
    toast.success('Código copiado!')
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(
      `🎉 Meu código para a promoção "${promotion?.name}" no ${unit?.fullName}: *${registered.code}*\n\nApresente este código na entrada!`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  // --- TELA DE LOADING ---
  if (loadingPromo) return <FullPageSpinner />

  // --- TELA DE ERRO ---
  if (promoError || !unit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">😕</p>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {promoError || 'Unidade não encontrada'}
          </h2>
          <p className="text-gray-500 text-sm">
            Verifique o link e tente novamente.
          </p>
        </div>
      </div>
    )
  }

  // --- TELA DE SUCESSO ---
  if (registered) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center px-6 py-10 ${unit.cssClass}`}
        style={{ background: bgColor }}
      >
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: primaryColor }}
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-1">
              {registered.alreadyRegistered ? 'Você já está cadastrado!' : 'Cadastro realizado!'}
            </h1>
            <p className="text-white/70 text-sm">
              {promotion?.name}
            </p>
          </div>

          {/* QR Code + código */}
          <div className="bg-white rounded-3xl p-6 text-center shadow-2xl animate-slide-up mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-medium">
              Apresente na entrada
            </p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG
                value={registered.qrValue}
                size={180}
                level="M"
                includeMargin={true}
                fgColor={bgColor}
              />
            </div>
            <div
              className="rounded-xl py-3 px-4 mb-1"
              style={{ background: unit.colors?.light || '#F5F0E8' }}
            >
              <p
                className="text-2xl font-bold tracking-widest"
                style={{ color: bgColor }}
              >
                {registered.code}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Código único e intransferível
            </p>
          </div>

          {/* Ações */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={copyCode}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition"
            >
              <Copy className="w-4 h-4" />
              Copiar código
            </button>
            <button
              onClick={shareWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition"
              style={{ background: primaryColor, color: bgColor }}
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
          </div>

          {/* Info da unidade */}
          <div className="text-center text-white/50 text-xs space-y-1">
            {unit.address && (
              <p className="flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" /> {unit.address}
              </p>
            )}
            {unit.instagram && (
              <p className="flex items-center justify-center gap-1">
                <Instagram className="w-3 h-3" /> {unit.instagram}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- FORMULÁRIO DE CADASTRO ---
  return (
    <div
      className={`min-h-screen flex flex-col px-5 py-8 ${unit.cssClass}`}
      style={{ background: bgColor }}
    >
      <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div
            className="inline-block px-4 py-1 rounded-full text-xs font-medium mb-3"
            style={{ background: primaryColor, color: bgColor }}
          >
            {unit.name}
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">
            {promotion?.name || 'Promoção exclusiva'}
          </h1>
          {promotion?.description && (
            <p className="text-white/60 text-sm">{promotion.description}</p>
          )}
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 shadow-2xl animate-slide-up space-y-4"
          noValidate
        >
          <Input
            label="Nome completo *"
            placeholder="Seu nome"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            accentColor={primaryColor}
            autoComplete="name"
            inputMode="text"
          />

          <Input
            label="Telefone (WhatsApp) *"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
            error={errors.phone}
            accentColor={primaryColor}
            inputMode="tel"
            autoComplete="tel"
          />

          <Input
            label="E-mail"
            placeholder="seu@email.com (opcional)"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            accentColor={primaryColor}
            inputMode="email"
            autoComplete="email"
            type="email"
          />

          <Input
            label="Data de nascimento"
            placeholder="DD/MM/AAAA (opcional)"
            value={form.birthdate}
            onChange={(e) => handleChange('birthdate', formatBirth(e.target.value))}
            accentColor={primaryColor}
            inputMode="numeric"
            hint="Usada para enviar promoção de aniversário"
          />

          {/* Aceite de termos */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="mt-0.5">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                className="w-4 h-4 rounded accent-current"
                style={{ accentColor: primaryColor }}
              />
            </div>
            <span className="text-sm text-gray-600 leading-relaxed">
              Aceito receber comunicações do {unit.fullName} e confirmo que li
              e concordo com os termos de uso.
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-xs text-red-600">⚠ {errors.acceptTerms}</p>
          )}

          <Button
            type="submit"
            fullWidth
            loading={submitting}
            size="lg"
            style={{ background: bgColor, color: 'white' }}
          >
            Quero meu desconto!
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          {unit.fullName} · Seus dados são protegidos
        </p>
      </div>
    </div>
  )
}
