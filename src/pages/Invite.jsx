import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'

import { getUnit } from '../config/units.js'
import { supabase } from '../lib/supabase.js'

const REGRAS = [
  'Válido para uma única utilização.',
  'Benefício pessoal e intransferível.',
  'Não cumulativo com outras promoções ou benefícios.',
  'Válido mediante consumo de 1 prato executivo por acompanhante pagante.',
  'Sujeito à disponibilidade da casa.',
]

const formatDate = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}`
}

const STATUS_NOTICE = {
  usado: 'Este convite já foi utilizado.',
  expirado: 'Este convite está expirado.',
  cancelado: 'Este convite não está mais disponível.',
}

export default function Invite() {
  const { code } = useParams()
  const unit = getUnit('nomade')
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase.rpc('dv_get_invite', { p_code: code })
      if (!active) return
      const row = Array.isArray(data) ? data[0] : data
      if (error || !row) {
        setNotFound(true)
      } else {
        setInvite(row)
      }
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Carregando convite…
      </div>
    )
  }

  if (notFound || !invite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-gray-400">Convite não encontrado.</p>
        <Link to="/" className="mt-4 text-sm underline">
          Voltar
        </Link>
      </div>
    )
  }

  const active = invite.status === 'ativo'
  const qrUrl = `${window.location.origin}/validar/nomade?code=${invite.code}`

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center">
        {unit?.logo ? (
          <img
            src={unit.logo}
            alt="Nômade"
            className="h-28 w-28 rounded-full object-cover shadow-lg ring-1 ring-white/10 mb-6"
          />
        ) : null}

        <h1 className="text-center text-2xl font-bold leading-snug">
          Seu convite especial Nômade está liberado 💛
        </h1>

        <p className="mt-6 self-start text-lg">
          Olá, <span className="font-semibold">{invite.client_name}</span>.
        </p>
        <p className="mt-2 self-start text-gray-300">
          Preparamos uma cortesia especial para receber você novamente no Nômade.
        </p>

        {!active && (
          <div className="mt-6 w-full rounded-xl border border-yellow-700/50 bg-yellow-900/20 px-4 py-3 text-center text-yellow-300">
            {STATUS_NOTICE[invite.status] || 'Convite indisponível.'}
          </div>
        )}

        <Section title="Benefício">{invite.benefit}</Section>

        <Section title="Validade">Válido até {formatDate(invite.valid_until)}.</Section>

        <div className="mt-6 w-full">
          <p className="text-sm font-semibold text-gray-400">Regras de uso</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            {REGRAS.map((r) => (
              <li key={r} className="flex gap-2">
                <span className={unit.accentText}>•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 w-full rounded-2xl border border-gray-800 bg-gray-900/60 p-6 flex flex-col items-center">
          <p className="text-sm text-gray-400">Código do convite</p>
          <p className="mt-1 text-2xl font-mono font-bold tracking-widest">
            {invite.code}
          </p>
          {active ? (
            <div className="mt-5 rounded-xl bg-white p-4">
              <QRCodeCanvas value={qrUrl} size={200} includeMargin />
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Apresente este código ou QR Code para a equipe do Nômade.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mt-6 w-full">
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      <p className="mt-1 text-gray-200">{children}</p>
    </div>
  )
}
