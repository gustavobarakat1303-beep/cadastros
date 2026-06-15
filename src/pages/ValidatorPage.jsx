import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp
} from 'firebase/firestore'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import {
  CheckCircle, XCircle, Clock, Camera, Keyboard, LogOut,
  RefreshCw, User, Phone, Tag
} from 'lucide-react'
import { db } from '../firebase'
import { useUnit } from '../contexts/UnitContext'
import Button from '../components/ui/Button'

// Status de resultado da validação
const RESULT = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ALREADY_USED: 'already_used',
  NOT_FOUND: 'not_found',
  ERROR: 'error',
}

const RESULT_CONFIG = {
  [RESULT.SUCCESS]: {
    icon: CheckCircle,
    color: '#22c55e',
    bg: '#f0fdf4',
    title: 'DESCONTO VALIDADO',
    subtitle: 'Desconto liberado! Pode prosseguir.',
  },
  [RESULT.ALREADY_USED]: {
    icon: XCircle,
    color: '#f59e0b',
    bg: '#fffbeb',
    title: 'JÁ UTILIZADO',
    subtitle: 'Este código já foi validado anteriormente.',
  },
  [RESULT.NOT_FOUND]: {
    icon: XCircle,
    color: '#ef4444',
    bg: '#fef2f2',
    title: 'CÓDIGO INVÁLIDO',
    subtitle: 'Código não encontrado. Verifique e tente novamente.',
  },
  [RESULT.ERROR]: {
    icon: XCircle,
    color: '#ef4444',
    bg: '#fef2f2',
    title: 'ERRO',
    subtitle: 'Ocorreu um erro. Tente novamente.',
  },
}

// Auto-reset após validação
const AUTO_RESET_DELAY = 5000

export default function ValidatorPage() {
  const { unitId } = useParams()
  const navigate = useNavigate()
  const unit = useUnit(unitId)

  const [mode, setMode] = useState('camera') // 'camera' | 'manual'
  const [manualCode, setManualCode] = useState('')
  const [result, setResult] = useState(RESULT.IDLE)
  const [resultData, setResultData] = useState(null) // dados do registro
  const [loading, setLoading] = useState(false)

  const scannerRef = useRef(null)
  const scannerDivRef = useRef(null)
  const resetTimerRef = useRef(null)
  const lastScannedRef = useRef(null) // evita duplo scan

  const primaryColor = unit?.colors?.secondary || '#C9A96E'
  const bgColor = unit?.colors?.primary || '#1A1A1A'

  // Valida um código (chamado tanto pelo QR quanto pelo manual)
  const validateCode = useCallback(async (code) => {
    const clean = code.trim().toUpperCase()
    if (!clean || clean === lastScannedRef.current) return
    if (loading || result !== RESULT.IDLE) return

    lastScannedRef.current = clean
    setLoading(true)
    setResult(RESULT.LOADING)
    stopScanner()

    try {
      // Busca o registro pelo código
      const q = query(
        collection(db, 'registrations'),
        where('code', '==', clean)
      )
      const snap = await getDocs(q)

      if (snap.empty) {
        setResult(RESULT.NOT_FOUND)
        setResultData(null)
        logValidation(clean, 'not_found', null)
        scheduleReset()
        return
      }

      const regDoc = snap.docs[0]
      const reg = regDoc.data()

      // Verifica se já foi usado
      if (reg.status === 'used') {
        setResult(RESULT.ALREADY_USED)
        setResultData(reg)
        logValidation(clean, 'already_used', regDoc.id)
        scheduleReset()
        return
      }

      // Marca como usado
      await updateDoc(doc(db, 'registrations', regDoc.id), {
        status: 'used',
        usedAt: serverTimestamp(),
        validatedBy: unitId,
      })

      // Log de validação
      await logValidation(clean, 'success', regDoc.id, reg)

      setResult(RESULT.SUCCESS)
      setResultData(reg)
      scheduleReset()
    } catch (err) {
      console.error('Erro ao validar:', err)
      setResult(RESULT.ERROR)
      setResultData(null)
      scheduleReset()
    } finally {
      setLoading(false)
    }
  }, [loading, result, unitId])

  async function logValidation(code, outcome, registrationId, regData = {}) {
    try {
      await addDoc(collection(db, 'validations'), {
        code,
        outcome,
        registrationId: registrationId || null,
        unit: unitId,
        promotionId: regData?.promotionId || null,
        promotionName: regData?.promotionName || null,
        clientName: regData?.name || null,
        clientPhone: regData?.phone || null,
        validatedAt: serverTimestamp(),
      })
    } catch (e) {
      console.warn('Erro ao gravar log:', e)
    }
  }

  function scheduleReset() {
    clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      resetState()
    }, AUTO_RESET_DELAY)
  }

  function resetState() {
    setResult(RESULT.IDLE)
    setResultData(null)
    setManualCode('')
    lastScannedRef.current = null
    clearTimeout(resetTimerRef.current)
    if (mode === 'camera') {
      setTimeout(startScanner, 300)
    }
  }

  // ---- Scanner QR ----
  function startScanner() {
    if (scannerRef.current || !scannerDivRef.current) return
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 240, height: 240 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: false,
      defaultZoomValueIfSupported: 2,
    }, false)

    scanner.render(
      (decodedText) => { validateCode(decodedText) },
      (err) => { /* scan error normal — ignore */ }
    )
    scannerRef.current = scanner
  }

  function stopScanner() {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {})
      scannerRef.current = null
    }
  }

  useEffect(() => {
    if (mode === 'camera' && result === RESULT.IDLE) {
      setTimeout(startScanner, 100)
    }
    return () => stopScanner()
  }, [mode])

  useEffect(() => {
    return () => {
      stopScanner()
      clearTimeout(resetTimerRef.current)
    }
  }, [])

  // Troca de modo
  function switchMode(m) {
    stopScanner()
    setMode(m)
    resetState()
    if (m === 'camera') {
      setTimeout(startScanner, 300)
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    if (manualCode.trim().length < 4) {
      toast.error('Digite um código válido.')
      return
    }
    validateCode(manualCode.trim())
  }

  function handleLogout() {
    navigate('/validador')
  }

  // --- TELA DE RESULTADO ---
  if (result !== RESULT.IDLE && result !== RESULT.LOADING) {
    const cfg = RESULT_CONFIG[result]
    const Icon = cfg.icon

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
        style={{ background: cfg.bg }}
      >
        <div className="w-full max-w-sm text-center">
          {/* Ícone animado */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-success"
            style={{ background: cfg.color + '22' }}
          >
            <Icon className="w-12 h-12" style={{ color: cfg.color }} />
          </div>

          {/* Status */}
          <h1
            className="text-3xl font-bold mb-2 tracking-tight"
            style={{ color: cfg.color }}
          >
            {cfg.title}
          </h1>
          <p className="text-gray-600 text-sm mb-6">{cfg.subtitle}</p>

          {/* Dados do cliente (se disponível) */}
          {resultData && (
            <div className="bg-white rounded-2xl p-5 text-left shadow-sm mb-6 space-y-3">
              {resultData.name && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Cliente</p>
                    <p className="text-sm font-medium text-gray-800">{resultData.name}</p>
                  </div>
                </div>
              )}
              {resultData.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Telefone</p>
                    <p className="text-sm font-medium text-gray-800">
                      {resultData.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                    </p>
                  </div>
                </div>
              )}
              {resultData.promotionName && (
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Promoção</p>
                    <p className="text-sm font-medium text-gray-800">{resultData.promotionName}</p>
                  </div>
                </div>
              )}
              {resultData.usedAt && result === RESULT.ALREADY_USED && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Utilizado em</p>
                    <p className="text-sm font-medium text-gray-800">
                      {resultData.usedAt?.toDate?.()?.toLocaleString('pt-BR') || '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={resetState}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Novo scan
            </button>
            {result === RESULT.SUCCESS && (
              <div
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center"
                style={{ background: cfg.color }}
              >
                ✓ CONFIRMADO
              </div>
            )}
          </div>

          {/* Contagem regressiva */}
          <p className="text-xs text-gray-400 mt-4">
            Resetando automaticamente em {AUTO_RESET_DELAY / 1000}s...
          </p>
        </div>
      </div>
    )
  }

  // --- TELA PRINCIPAL DO VALIDADOR ---
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: bgColor }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider">Validador</p>
          <h1 className="text-white font-semibold">{unit?.name || unitId}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs transition"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </header>

      {/* Tabs de modo */}
      <div className="flex mx-5 mb-4 bg-white/10 rounded-xl p-1 gap-1">
        <button
          onClick={() => switchMode('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
            mode === 'camera' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          Câmera
        </button>
        <button
          onClick={() => switchMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
            mode === 'manual' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          Manual
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col px-5 pb-8">
        {mode === 'camera' ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Container do scanner */}
            <div className="w-full max-w-xs rounded-3xl overflow-hidden bg-black">
              <div id="qr-reader" ref={scannerDivRef} className="w-full" />
            </div>
            {result === RESULT.LOADING && (
              <div className="mt-6 text-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                <p className="text-white/70 text-sm">Validando...</p>
              </div>
            )}
            {result === RESULT.IDLE && (
              <p className="text-white/50 text-sm mt-4 text-center">
                Aponte a câmera para o QR Code do cliente
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <form onSubmit={handleManualSubmit} className="w-full max-w-xs">
              <p className="text-white/70 text-sm mb-3 text-center">
                Digite o código do cliente
              </p>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Ex: NM-4X9K2T"
                maxLength={10}
                autoFocus
                autoCapitalize="characters"
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-5 text-white text-center text-xl font-mono tracking-widest placeholder-white/30 focus:outline-none focus:border-white/50 mb-4"
              />
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                style={{ background: primaryColor, color: bgColor }}
              >
                Validar Código
              </Button>
            </form>
          </div>
        )}

        {/* Dica */}
        <div className="mt-6 bg-white/5 rounded-2xl p-4 text-center">
          <p className="text-white/40 text-xs">
            Modo <strong className="text-white/60">Câmera</strong>: aponte para o QR Code na tela do cliente
            &nbsp;·&nbsp;
            Modo <strong className="text-white/60">Manual</strong>: digite o código alfanumérico
          </p>
        </div>
      </div>
    </div>
  )
}
