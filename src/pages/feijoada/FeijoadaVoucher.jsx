import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase.js'

const NOMADE_WA = 'https://wa.me/5511916547785?text='

export default function FeijoadaVoucher() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [reg, setReg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const validationUrl = `${window.location.origin}/validar/nomade?code=${code}`
  const whatsappUrl = `${NOMADE_WA}${encodeURIComponent('Olá! Resgatei meu convite da Feijoada Cortesia. Meu código é: ' + code)}`

  useEffect(() => {
    if (!code) { navigate('/feijoada'); return }
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('dv_registrations')
          .select('id, name, code, used, used_at')
          .eq('code', code)
          .eq('unit_slug', 'nomade')
          .single()
        if (err || !data) { setError('Convite não encontrado.'); return }
        setReg(data)
      } catch (e) {
        setError('Erro ao carregar convite.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [code, navigate])

  if (loading) return (
    <div className="min-h-screen bg-[#110f0d] flex items-center justify-center">
      <div className="w-6 h-6 border border-[#c8b89a]/40 border-t-[#c8b89a] rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#110f0d] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button onClick={() => navigate('/feijoada')} className="text-[#c8b89a] text-xs tracking-widest uppercase underline">
          Voltar ao cadastro
        </button>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#110f0d] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img
            src="https://rfggzdohnchnnmavphrm.supabase.co/storage/v1/object/public/logos/Logo%20Nomade%20Escurol.png"
            alt="Nômade Bar & Restaurante"
            className="h-14 object-contain"
          />
        </div>
        <div className="text-center mb-6">
          <p className="text-[#c8b89a] text-xs tracking-widest uppercase mb-2">
            {reg?.used ? 'Convite já utilizado' : 'Seu convite está pronto'}
          </p>
          <h1 className="text-[#f4efe8] text-3xl font-black uppercase tracking-tight leading-none mb-2">
            1 Feijoada<br />Cortesia
          </h1>
          <p className="text-[#c8b89a] text-sm tracking-wider mt-2">Olá, {reg?.name?.split(' ')[0]}!</p>
          <div className="w-16 h-px bg-[#c8b89a] opacity-30 mx-auto mt-4" />
        </div>
        <div className="border border-[#c8b89a]/20 p-6 flex flex-col items-center gap-5 mb-6">
          <div className="bg-[#f4efe8] p-3">
            <QRCodeSVG value={validationUrl} size={192} bgColor="#f4efe8" fgColor="#1a1714" level="M" />
          </div>
          <div className="text-center">
            <p className="text-[#c8b89a]/60 text-xs tracking-widest uppercase mb-1">Código do convite</p>
            <p className="text-[#f4efe8] text-2xl font-mono font-bold tracking-widest">{code}</p>
          </div>
          {reg?.used && (
            <p className="text-amber-400/70 text-xs text-center">
              Utilizado em {new Date(reg.used_at).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <p className="text-[#c8b89a]/60 text-xs tracking-wider text-center leading-relaxed mb-8">
          Apresente este QR Code ou o código ao chegar ao Nômade.<br />
          Válido aos sábados até as 14h · Buffet completo até as 17h.<br />
          1 convite por mesa · com 1 acompanhante pagante.
        </p>
        <div className="text-center">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="inline-block border border-[#c8b89a]/40 text-[#c8b89a] text-xs tracking-widest uppercase px-8 py-4 hover:bg-[#c8b89a]/10 transition-colors">
            Falar com o Nômade no WhatsApp
          </a>
        </div>
        <div className="text-center mt-8">
          <p className="text-[#c8b89a]/30 text-xs">Nômade · Av. Rebouças, 3400 · Pinheiros, São Paulo</p>
        </div>
      </div>
    </main>
  )
}
