import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, AlertTriangle, Clock, Ban, Camera } from 'lucide-react'

import { getUnit } from '../../config/units.js'
import { supabase } from '../../lib/supabase.js'

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

export default function FeijoadaValidator() {
  const unit = getUnit('nomade')
  const [searchParams] = useSearchParams()

  const [authorized, setAuthorized] = useState(false)
  const [pin, setPin] = useState('')
  const [code, setCode] = useState('')
  const [operator, setOperator] = useState('')
  const [checking, setChecking] = useState(false)
  const [outcome, setOutcome] = useState(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => {
    const c = searchParams.get('code')
    if (c) setCode(c.toUpperCase())
  }, [searchParams])

  useEffect(() => {
    return () => stopScanner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pin === String(unit.pin)) setAuthorized(true)
    else {
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
    setTimeout(async () => {
      try {
        const inst = new Html5Qrcode('feijoada-qr-reader')
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
      const { data, error } = await supabase.rpc('dv_validate_invite', {
        p_code: clean,
        p_operator: operator.trim() || null,
      })
      if (error) throw error
      const reg = data
        ? {
            name: data.client_name,
            code: data.code,
            benefit: data.benefit,
            valid_until: data.valid_until,
            used_at: data.used_at,
            validated_by: data.validated_by,
          }
        : null
      const map = {
        valid: { status: 'valid', message: 'Convite validado com sucesso!' },
        usado: { status: 'used', message: 'Este convite já foi utilizado.' },
        expirado: { status: 'expired', message: 'Convite expirado.' },
        cancelado: { status: 'cancelled', message: 'Convite cancelado.' },
        invalid: { status: 'invalid', message: 'Convite não encontrado.' },
      }[data?.status] || { status: 'invalid', message: 'Resposta inesperada.' }
      setOutcome({ ...map, registration: map.status === 'invalid' ? null : reg })
      if (map.status === 'valid') toast.success('Validado!')
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
        <div className="flex flex-col items-center text-center mb-8">
          {unit?.logo ? (
            <img
              src={unit.logo}
              alt="Nômade"
              className="h-20 w-20 rounded-full object-cover mb-3 ring-1 ring-white/10"
            />
          ) : null}
          <h1 className="text-2xl font-bold">Feijoada Nômade</h1>
          <p className="text-gray-400 mt-1">Validação — acesso da equipe</p>
        </div>
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
        <div className="flex flex-col items-center text-center mb-8">
          <p className="text-3xl">🍲</p>
          <h1 className="mt-1 text-2xl font-bold">Feijoada Nômade</h1>
          <p className="text-gray-400 mt-1">Validação do convite</p>
        </div>

        {outcome ? (
          <Outcome
            outcome={outcome}
            accentClass={unit.accentClass}
            onReset={() => {
              setOutcome(null)
              setCode('')
            }}
          />
        ) : scanning ? (
          <div className="flex flex-col items-center">
            <div
              id="feijoada-qr-reader"
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
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="Operador (quem está validando)"
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white outline-none focus:border-gray-500"
            />
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
              placeholder="EX: FEIJOADA-AB12CD"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-center text-lg font-mono tracking-widest text-white outline-none focus:border-gray-500"
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
    expired: { Icon: Clock, color: 'text-gray-400' },
    cancelled: { Icon: Ban, color: 'text-red-400' },
    invalid: { Icon: XCircle, color: 'text-red-400' },
  }[status] || { Icon: XCircle, color: 'text-red-400' }
  const Icon = config.Icon

  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-800 bg-gray-900/60 p-8 text-center">
      <Icon className={config.color} size={64} />
      <p className={`mt-4 text-lg font-semibold ${config.color}`}>{message}</p>

      {registration ? (
        <div className="mt-4 w-full border-t border-gray-800 pt-4 text-left text-sm">
          <Row label="Cliente" value={registration.name} />
          {registration.benefit ? <Row label="Benefício" value={registration.benefit} /> : null}
          <Row label="Código" value={registration.code} mono />
          {registration.used_at ? (
            <Row label="Utilizado em" value={new Date(registration.used_at).toLocaleString('pt-BR')} />
          ) : null}
          {registration.validated_by ? (
            <Row label="Validado por" value={registration.validated_by} />
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
