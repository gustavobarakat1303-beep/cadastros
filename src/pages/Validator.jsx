import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, AlertTriangle, Camera } from 'lucide-react'

import { getUnit } from '../config/units.js'
import { supabase } from '../lib/supabase.js'
import UnitHeader from '../components/UnitHeader.jsx'

// Extrai o código de um texto que pode ser o código puro ou uma URL com ?code=
function extractCode(raw) {
  if (!raw) return ''
  const text = raw.trim()
  try {
    const url = new URL(text)
    const c = url.searchParams.get('code')
    if (c) return c.trim().toUpperCase()
  } catch {
    /* não é URL */
  }
  return text.toUpperCase()
}

export default function Validator() {
  const { unit: unitSlug } = useParams()
  const unit = getUnit(unitSlug)
  const [searchParams] = useSearchParams()

  const [authorized, setAuthorized] = useState(false)
  const [pin, setPin] = useState('')
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [outcome, setOutcome] = useState(null) // { status, registration, message }
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)

  // Pré-preenche o código a partir do parâmetro ?code= do QR Code.
  useEffect(() => {
    const c = searchParams.get('code')
    if (c) setCode(c.toUpperCase())
  }, [searchParams])

  // Encerra a câmera ao desmontar.
  useEffect(() => {
    return () => {
      stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pin === String(unit.pin)) {
      setAuthorized(true)
    } else {
      toast.error('PIN incorreto.')
      setPin('')
    }
  }

  async function stopScanner() {
    const inst = scannerRef.current
    if (inst) {
      try {
        await inst.stop()
      } catch {
        /* já parado */
      }
      try {
        inst.clear()
      } catch {
        /* ignore */
      }
      scannerRef.current = null
    }
    setScanning(false)
  }

  async function startScanner() {
    setOutcome(null)
    setScanning(true)
    // Aguarda o elemento do leitor ser renderizado.
    setTimeout(async () => {
      try {
        const inst = new Html5Qrcode('qr-reader')
        scannerRef.current = inst
        await inst.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            const c = extractCode(decoded)
            stopScanner()
            setCode(c)
            validate(c)
          },
          () => {},
        )
      } catch (err) {
        console.error(err)
        toast.error('Não foi possível acessar a câmera.')
        setScanning(false)
      }
    }, 100)
  }

  async function validate(rawCode) {
    const clean = extractCode(rawCode || code)
    if (!clean) {
      toast.error('Informe ou escaneie um código.')
      return
    }
    setChecking(true)
    setOutcome(null)
    try {
      // A consumação do código é feita por uma função RPC atômica
      // (lookup + marca como usado + registra validação), evitando
      // condições de corrida e respeitando as políticas de RLS — o
      // validador opera apenas com PIN, sem sessão Supabase.
      const { data, error } = await supabase.rpc('dv_validate_code', {
        p_unit: unit.slug,
        p_code: clean,
      })

      if (error) throw error

      const registration = data
        ? {
            name: data.name,
            code: data.code,
            used_at: data.used_at,
            discount_type: data.discount ? { name: data.discount } : null,
          }
        : null

      if (data?.status === 'invalid') {
        setOutcome({ status: 'invalid', message: 'Código não encontrado.' })
      } else if (data?.status === 'used') {
        setOutcome({
          status: 'used',
          registration,
          message: 'Este código já foi utilizado.',
        })
      } else if (data?.status === 'valid') {
        setOutcome({
          status: 'valid',
          registration,
          message: 'Desconto validado com sucesso!',
        })
        toast.success('Validado!')
      } else {
        setOutcome({ status: 'invalid', message: 'Resposta inesperada.' })
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao validar. Tente novamente.')
    } finally {
      setChecking(false)
    }
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <UnitHeader unit={unit} subtitle="Acesso do validador" />
        <form onSubmit={handlePinSubmit} className="w-full max-w-xs">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="PIN"
            autoFocus
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-center text-2xl tracking-widest text-white outline-none focus:border-gray-500"
          />
          <button
            type="submit"
            className={`mt-4 w-full rounded-lg ${unit.accentClass} px-5 py-3 font-semibold text-black`}
          >
            Entrar
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <UnitHeader unit={unit} subtitle="Validação de desconto" />

        {outcome ? (
          <Outcome outcome={outcome} accentClass={unit.accentClass} onReset={() => { setOutcome(null); setCode('') }} />
        ) : scanning ? (
          <div className="flex flex-col items-center">
            <div
              id="qr-reader"
              className="w-full overflow-hidden rounded-xl border border-gray-800"
            />
            <button
              onClick={stopScanner}
              className="mt-4 rounded-lg bg-gray-800 px-5 py-2 text-sm hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              onClick={startScanner}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm hover:border-gray-500"
            >
              <Camera size={18} />
              Escanear QR Code
            </button>

            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="h-px flex-1 bg-gray-800" />
              ou digite o código
              <span className="h-px flex-1 bg-gray-800" />
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EX: A1B2C3D4"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-center text-xl font-mono tracking-widest text-white outline-none focus:border-gray-500"
            />

            <button
              onClick={() => validate()}
              disabled={checking}
              className={`rounded-lg ${unit.accentClass} px-5 py-3 font-semibold text-black disabled:opacity-50`}
            >
              {checking ? 'Validando…' : 'Validar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Outcome({ outcome, accentClass, onReset }) {
  const { status, registration, message } = outcome
  const config = {
    valid: { Icon: CheckCircle2, color: 'text-green-400' },
    used: { Icon: AlertTriangle, color: 'text-yellow-400' },
    invalid: { Icon: XCircle, color: 'text-red-400' },
  }[status]
  const Icon = config.Icon

  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-800 bg-gray-900/60 p-8 text-center">
      <Icon className={config.color} size={64} />
      <p className={`mt-4 text-lg font-semibold ${config.color}`}>{message}</p>

      {registration ? (
        <div className="mt-4 w-full border-t border-gray-800 pt-4 text-left text-sm">
          <Row label="Cliente" value={registration.name} />
          {registration.discount_type?.name ? (
            <Row label="Desconto" value={registration.discount_type.name} />
          ) : null}
          <Row label="Código" value={registration.code} mono />
          {registration.used_at ? (
            <Row
              label="Utilizado em"
              value={new Date(registration.used_at).toLocaleString('pt-BR')}
            />
          ) : null}
        </div>
      ) : null}

      <button
        onClick={onReset}
        className={`mt-6 w-full rounded-lg ${accentClass} px-5 py-3 font-semibold text-black`}
      >
        Validar outro
      </button>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-gray-500">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  )
}
