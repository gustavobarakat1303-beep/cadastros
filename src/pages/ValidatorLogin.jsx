import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Button from '../components/ui/Button'

// PINs por unidade, lidos das variáveis de ambiente
const UNIT_PINS = {
  nomade: import.meta.env.VITE_NOMADE_PIN,
  manga: import.meta.env.VITE_MANGA_PIN,
}

const UNIT_LABELS = {
  nomade: { name: 'Nômade', color: '#C9A96E', bg: '#1A1A1A' },
  manga: { name: 'Pé de Manga', color: '#4A7A26', bg: '#2D5016' },
}

export default function ValidatorLogin() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  function handleDigit(d) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError('')
    if (next.length === 4) {
      verify(next)
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  function verify(code) {
    // Verifica qual unidade bate com o PIN
    for (const [unitId, unitPin] of Object.entries(UNIT_PINS)) {
      if (unitPin && code === String(unitPin)) {
        navigate(`/validador/${unitId}`)
        return
      }
    }
    // PIN incorreto
    setPin('')
    setError('PIN incorreto. Tente novamente.')
    setShaking(true)
    setTimeout(() => setShaking(false), 600)
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-xs">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">
            Acesso Restrito
          </h1>
          <p className="text-white/50 text-sm">
            Digite o PIN para acessar o validador
          </p>
        </div>

        {/* Dots do PIN */}
        <div className={`flex justify-center gap-4 mb-8 ${shaking ? 'animate-pulse' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > i
                  ? 'bg-white border-white scale-110'
                  : 'border-white/30'
              }`}
            />
          ))}
        </div>

        {/* Erro */}
        {error && (
          <p className="text-center text-red-400 text-sm mb-6 animate-fade-in">
            {error}
          </p>
        )}

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {digits.map((d, i) => {
            if (d === '') return <div key={i} />
            if (d === '⌫') {
              return (
                <button
                  key={i}
                  onClick={handleBackspace}
                  className="h-16 rounded-2xl text-2xl text-white/70 bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center"
                >
                  {d}
                </button>
              )
            }
            return (
              <button
                key={i}
                onClick={() => handleDigit(d)}
                className="h-16 rounded-2xl text-2xl font-medium text-white bg-white/10 hover:bg-white/15 active:scale-95 active:bg-white/20 transition-all"
              >
                {d}
              </button>
            )
          })}
        </div>

        {/* Unidades disponíveis (indicação visual) */}
        <div className="border-t border-white/10 pt-6">
          <p className="text-center text-white/30 text-xs mb-3">Unidades</p>
          <div className="flex justify-center gap-3">
            {Object.entries(UNIT_LABELS).map(([id, info]) => (
              <div
                key={id}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: info.color + '22', color: info.color, border: `1px solid ${info.color}44` }}
              >
                {info.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
