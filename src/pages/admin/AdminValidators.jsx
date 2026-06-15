import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import {
  ShieldCheck, Eye, EyeOff, KeyRound, Info
} from 'lucide-react'

// PINs são definidos por variável de ambiente.
// Nunca armazene PINs reais no Firestore — eles ficam apenas no .env / hosting.
const PIN_NOMADE = import.meta.env.VITE_NOMADE_PIN ?? '••••'
const PIN_MANGA  = import.meta.env.VITE_MANGA_PIN  ?? '••••'

const UNITS_STATIC = [
  {
    id: 'nomade',
    name: 'Nômade Bar & Restaurante',
    slug: 'nomade',
    color: '#f59e0b',
    pin: PIN_NOMADE,
    path: '/validador/nomade',
  },
  {
    id: 'manga',
    name: 'Pé de Manga',
    slug: 'manga',
    color: '#22c55e',
    pin: PIN_MANGA,
    path: '/validador/manga',
  },
]

function PinDisplay({ pin }) {
  const [visible, setVisible] = useState(false)
  const display = visible ? pin : '•'.repeat(pin.length)
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-lg tracking-[0.35em] text-white">
        {display}
      </span>
      <button
        onClick={() => setVisible((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition"
        title={visible ? 'Ocultar PIN' : 'Mostrar PIN'}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function AdminValidators() {
  const [units, setUnits] = useState(UNITS_STATIC)
  const [validatorCounts, setValidatorCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCounts()
  }, [])

  // Conta quantas validações cada unidade tem nos últimos 30 dias
  async function fetchCounts() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'validations'))
      const counts = { nomade: 0, manga: 0, other: 0 }
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000

      snap.docs.forEach((d) => {
        const data = d.data()
        const ts = data.validatedAt?.toDate?.()?.getTime?.() ?? 0
        if (ts < cutoff) return
        const u = (data.unitId ?? '').toLowerCase()
        if (u.includes('nomade') || u.includes('nômade')) counts.nomade++
        else if (u.includes('manga')) counts.manga++
        else counts.other++
      })

      setValidatorCounts(counts)
    } finally {
      setLoading(false)
    }
  }

  const fullOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Validadores</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie os PINs de acesso da equipe de validação.</p>
      </div>

      {/* Aviso de segurança */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-300 text-sm leading-relaxed">
          Os PINs são definidos nas variáveis de ambiente <code className="bg-white/10 px-1 rounded text-xs">VITE_NOMADE_PIN</code> e{' '}
          <code className="bg-white/10 px-1 rounded text-xs">VITE_MANGA_PIN</code> e compilados no build.
          Para alterá-los, atualize o <code className="bg-white/10 px-1 rounded text-xs">.env</code> e faça um novo deploy.
        </p>
      </div>

      {/* Cards por unidade */}
      <div className="space-y-4">
        {units.map((unit) => {
          const count = validatorCounts[unit.slug] ?? 0
          const validatorUrl = `${fullOrigin}${unit.path}`

          return (
            <div
              key={unit.id}
              className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden"
            >
              {/* Card header */}
              <div
                className="h-1"
                style={{ backgroundColor: unit.color }}
              />
              <div className="p-5 space-y-5">
                {/* Nome + badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${unit.color}20`, border: `1px solid ${unit.color}40` }}
                    >
                      <ShieldCheck className="w-4 h-4" style={{ color: unit.color }} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{unit.name}</p>
                      <p className="text-gray-500 text-xs">/{unit.slug}</p>
                    </div>
                  </div>
                  {!loading && (
                    <div className="text-right">
                      <p className="text-white text-lg font-semibold">{count}</p>
                      <p className="text-gray-500 text-xs">validações / 30d</p>
                    </div>
                  )}
                </div>

                {/* PIN */}
                <div className="bg-gray-950 border border-white/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">PIN do validador</p>
                  </div>
                  <PinDisplay pin={unit.pin} />
                  <p className="text-gray-600 text-xs">
                    Compartilhe apenas com a equipe autorizada de cada unidade.
                  </p>
                </div>

                {/* Link do validador */}
                <div className="space-y-2">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Link de acesso</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-950 border border-white/5 rounded-xl px-3 py-2.5 text-gray-300 truncate">
                      {validatorUrl}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(validatorUrl)}
                      className="shrink-0 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {/* Instruções */}
                <div className="border-t border-white/5 pt-4">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">Como usar</p>
                  <ol className="space-y-2 text-xs text-gray-400">
                    <li className="flex gap-2">
                      <span className="text-gray-600 shrink-0">1.</span>
                      Acesse o link acima em qualquer dispositivo na entrada da casa.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-gray-600 shrink-0">2.</span>
                      Digite o PIN de 4 dígitos para entrar no modo validador.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-gray-600 shrink-0">3.</span>
                      Escaneie o QR Code do cliente ou insira o código manualmente.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-gray-600 shrink-0">4.</span>
                      O sistema confirma ou rejeita automaticamente o desconto.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
