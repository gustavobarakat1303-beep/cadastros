import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Camera, Keyboard } from 'lucide-react'
import { supabase, UNITS } from '../supabase'
import QRScanner from '../components/QRScanner'

const PINS = {
  nomade: '1234',
  manga: '5678',
}

// Config de logos por unidade
const LOGO_CONFIG = {
  nomade: { filename: 'Logo Nomade Escurol.png', alt: 'Nômade' },
  manga:  { filename: 'Logo PedeManga.png',      alt: 'Pé de Manga' },
}

// Fallbacks SVG (usados apenas se a imagem falhar no Storage)
function NomadeFallback() {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="36" r="36" fill="#1a1a1a" />
      <circle cx="36" cy="36" r="33" fill="none" stroke="#c9a96e" strokeWidth="1.5" />
      <text x="36" y="44" textAnchor="middle" fontSize="26" fontWeight="700" fontFamily="Georgia, serif" fill="#c9a96e">N</text>
    </svg>
  )
}

function MangaFallback() {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="72" height="72" rx="16" fill="#22c55e" />
      <path d="M36 12 C22 12 14 24 14 34 C14 48 26 58 36 60 C46 58 58 48 58 34 C58 24 50 12 36 12Z" fill="#166534" />
      <path d="M36 16 C31 26 27 34 36 60 C45 34 41 26 36 16Z" fill="#4ade80" />
    </svg>
  )
}

const FALLBACKS = {
  nomade: <NomadeFallback />,
  manga:  <MangaFallback />,
}

// Componente que carrega logo do Supabase Storage via getPublicUrl
function UnitLogo({ unit }) {
  const [imgError, setImgError] = useState(false)
  const config = LOGO_CONFIG[unit]
  if (!config) return null

  if (imgError) return FALLBACKS[unit] || null

  const { data } = supabase.storage.from('logos').getPublicUrl(config.filename)
  const src = data?.publicUrl

  if (!src) return FALLBACKS[unit] || null

  return (
    <img
      src={src}
      alt={config.alt}
      width={64}
      height={64}
      className="rounded-2xl object-cover"
      onError={() => setImgError(true)}
    />
  )
}

export default function Validator() {
  const { unit } = useParams()
  const [searchParams] = useSearchParams()
  const codeFromUrl = searchParams.get('code')
  const unitConfig = UNITS[unit]

  const [pinInput, setPinInput] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [scanMode, setScanMode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const processingRef = useRef(false)

  // Pre-fill manual code from URL param
  useEffect(() => {
    if (codeFromUrl) setManualCode(codeFromUrl.toUpperCase())
  }, [codeFromUrl])

  // Auto-validate when authenticated + URL code present
  useEffect(() => {
    if (authenticated && codeFromUrl && !result && !processingRef.current) {
      validateCode(codeFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, codeFromUrl])

  if (!unitConfig) return <Navigate to="/" replace />

  const color = unitConfig.color

  function handlePinSubmit(e) {
    e.preventDefault()
    if (pinInput === PINS[unit]) {
      setAuthenticated(true)
      toast.success('Acesso liberado!')
    } else {
      toast.error('PIN incorreto.')
      setPinInput('')
    }
  }

  async function validateCode(code) {
    if (processingRef.current) return
    processingRef.current = true
    setLoading(true)

    try {
      const cleanCode = code.trim().toUpperCase()
      const { data, error } = await supabase.rpc('validate_and_use_code', {
        p_code: cleanCode,
        p_unit_slug: unit,
      })

      if (error) {
        setResult({ success: false, message: 'Erro de conexão. Tente novamente.' })
        return
      }

      const res = data
      if (res.success) {
        setResult({
          success: true,
          message: res.message || 'Código válido!',
          client: res.client,
        })
      } else {
        setResult({ success: false, message: res.message || 'Código inválido.' })
      }
    } finally {
      setLoading(false)
      processingRef.current = false
      setScannerActive(false)
    }
  }

  // Smart QR scan: extract code from full URL if QR encodes a URL
  function handleScan(rawCode) {
    if (processingRef.current) return
    let code = rawCode
    try {
      const url = new URL(rawCode)
      const param = url.searchParams.get('code')
      if (param) code = param
    } catch (_) {
      // Not a URL — use rawCode directly
    }
    validateCode(code)
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualCode.trim()) return
    validateCode(manualCode)
  }

  function reset() {
    setResult(null)
    setManualCode('')
    processingRef.current = false
  }

  // PIN screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-950">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center"><UnitLogo unit={unit} /></div>
            <h1 className="text-2xl font-bold text-white">{unitConfig.name}</h1>
            <p className="text-gray-400 text-sm">Painel do Validador</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">PIN de acesso</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-3xl tracking-widest bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-black"
              style={{ background: color }}
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Result screen
  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950">
        <div className="w-full max-w-sm text-center space-y-6">
          {result.success ? (
            <>
              <CheckCircle size={80} className="mx-auto text-green-400" />
              <h2 className="text-2xl font-bold text-white">Código Válido!</h2>
              {result.client && (
                <div className="bg-gray-900 rounded-xl p-4 space-y-1">
                  <p className="text-lg font-semibold text-white">{result.client.name}</p>
                  {result.client.email && <p className="text-gray-400 text-sm">{result.client.email}</p>}
                </div>
              )}
              <p className="text-green-300 text-sm">{result.message}</p>
            </>
          ) : (
            <>
              <XCircle size={80} className="mx-auto text-red-400" />
              <h2 className="text-2xl font-bold text-white">Código Inválido</h2>
              <p className="text-red-300 text-sm">{result.message}</p>
            </>
          )}

          <button
            onClick={reset}
            className="w-full py-3 rounded-xl font-bold text-black mt-4"
            style={{ background: color }}
          >
            Validar outro código
          </button>
        </div>
      </div>
    )
  }

  // Main validator screen
  return (
    <div className="min-h-screen flex flex-col p-6 bg-gray-950">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UnitLogo unit={unit} />
            <div>
              <h1 className="text-xl font-bold text-white">{unitConfig.name}</h1>
              <p className="text-gray-500 text-xs">Validador de descontos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setScanMode(false); setScannerActive(false) }}
              className={`p-2 rounded-lg transition ${!scanMode ? 'text-black' : 'text-gray-400 bg-gray-900'}`}
              style={!scanMode ? { background: color } : {}}
            >
              <Keyboard size={20} />
            </button>
            <button
              onClick={() => { setScanMode(true); setScannerActive(true) }}
              className={`p-2 rounded-lg transition ${scanMode ? 'text-black' : 'text-gray-400 bg-gray-900'}`}
              style={scanMode ? { background: color } : {}}
            >
              <Camera size={20} />
            </button>
          </div>
        </div>

        {scanMode ? (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm text-center">Aponte a câmera para o QR Code do cliente</p>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <QRScanner onScan={handleScan} active={scannerActive && !loading} />
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Código do cliente</label>
              <input
                type="text"
                placeholder="NM-XXXXXX ou PM-XXXXXX"
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                autoFocus
                className="w-full text-center text-xl tracking-widest bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white placeholder-gray-700 focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="w-full py-3 rounded-xl font-bold text-black disabled:opacity-50"
              style={{ background: color }}
            >
              {loading ? 'Validando...' : 'Validar código'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
