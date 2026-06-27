/**
 * FeijoadaRegister.jsx
 * Página de cadastro da campanha Feijoada Cortesia — Nômade Bar & Restaurante.
 * Rota: /feijoada
 *
 * Fluxo:
 * 1. Cliente preenche nome, telefone, e-mail (opcional) e data de nascimento
 * 2. Submit → grava em dv_registrations (unit_slug: 'nomade', discount_type: 'FEIJOADA CORTESIA')
 * 3. Sucesso → dispara CompleteRegistration + Lead → redireciona para /feijoada/convite/:code
 * 4. Erro → exibe mensagem sem disparar eventos
 *
 * Eventos Meta Pixel disparados:
 * - CompleteRegistration: imediatamente após confirmação do backend
 * - Lead: logo após CompleteRegistration, antes do redirect
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { trackCompleteRegistration, trackLead } from '../../lib/metaPixel';

// ID do tipo de desconto "FEIJOADA CORTESIA" (unidade nomade) — confirmar no admin
const DISCOUNT_TYPE_SLUG = 'FEIJOADA CORTESIA';
const UNIT_SLUG = 'nomade';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'NM-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function FeijoadaRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    birthdate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.phone.trim() || !form.birthdate) {
      setError('Preencha nome, telefone e data de nascimento.');
      return;
    }

    setLoading(true);

    try {
      // 1. Buscar o discount_type_id de "FEIJOADA CORTESIA" para nomade
      const { data: discountType, error: dtError } = await supabase
        .from('dv_discount_types')
        .select('id')
        .eq('name', DISCOUNT_TYPE_SLUG)
        .eq('unit_slug', UNIT_SLUG)
        .eq('active', true)
        .single();

      if (dtError || !discountType) {
        throw new Error('Tipo de desconto não encontrado. Contate o suporte.');
      }

      // 2. Gerar código único
      const code = generateCode();

      // 3. Inserir cadastro
      const { error: insertError } = await supabase
        .from('dv_registrations')
        .insert({
          unit_slug: UNIT_SLUG,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          birthdate: form.birthdate,
          code,
          used: false,
          discount_type_id: discountType.id,
        });

      if (insertError) {
        // Código duplicado (raro) — tentar uma vez com novo código
        if (insertError.code === '23505') {
          throw new Error('Ocorreu um erro ao gerar seu convite. Tente novamente.');
        }
        throw insertError;
      }

      // 4. Sucesso — disparar eventos Meta Pixel ANTES do redirect
      trackCompleteRegistration();
      trackLead();

      // 5. Redirecionar para a página do voucher
      navigate(`/feijoada/convite/${code}`);

    } catch (err) {
      console.error('[FeijoadaRegister]', err);
      setError(err.message || 'Erro ao processar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#110f0d] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="https://rfggzdohnchnnmavphrm.supabase.co/storage/v1/object/public/logos/Logo%20Nomade%20Escurol.png"
            alt="Nômade Bar & Restaurante"
            className="h-14 object-contain"
          />
        </div>

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <p className="text-[#c8b89a] text-xs tracking-widest uppercase font-light mb-3">
            Convite especial
          </p>
          <h1 className="text-[#f4efe8] text-4xl font-black uppercase tracking-tight leading-none mb-2">
            1 Feijoada<br />Cortesia
          </h1>
          <p className="text-[#c8b89a] text-sm tracking-wider mt-3">
            com 1 acompanhante pagante
          </p>
          <div className="w-16 h-px bg-[#c8b89a] opacity-40 mx-auto mt-4" />
          <p className="text-[#c8b89a] text-xs tracking-widest uppercase opacity-60 mt-4">
            Válido aos sábados até as 14h
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#c8b89a] text-xs tracking-widest uppercase mb-1">
              Nome completo *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full bg-[#1a1714] border border-[#c8b89a]/30 text-[#f4efe8] px-4 py-3 text-sm focus:outline-none focus:border-[#c8b89a]/70 placeholder-[#c8b89a]/30"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-[#c8b89a] text-xs tracking-widest uppercase mb-1">
              WhatsApp *
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full bg-[#1a1714] border border-[#c8b89a]/30 text-[#f4efe8] px-4 py-3 text-sm focus:outline-none focus:border-[#c8b89a]/70 placeholder-[#c8b89a]/30"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-[#c8b89a] text-xs tracking-widest uppercase mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-[#1a1714] border border-[#c8b89a]/30 text-[#f4efe8] px-4 py-3 text-sm focus:outline-none focus:border-[#c8b89a]/70 placeholder-[#c8b89a]/30"
              placeholder="seu@email.com (opcional)"
            />
          </div>

          <div>
            <label className="block text-[#c8b89a] text-xs tracking-widest uppercase mb-1">
              Data de nascimento *
            </label>
            <input
              type="date"
              name="birthdate"
              value={form.birthdate}
              onChange={handleChange}
              required
              className="w-full bg-[#1a1714] border border-[#c8b89a]/30 text-[#f4efe8] px-4 py-3 text-sm focus:outline-none focus:border-[#c8b89a]/70"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-[#c8b89a]/60 text-[#c8b89a] py-4 text-sm tracking-widest uppercase font-semibold hover:bg-[#c8b89a]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Gerando convite...' : 'Quero meu convite'}
          </button>
        </form>

        {/* Rodapé */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-[#c8b89a]/50 text-xs tracking-widest uppercase">
            Nômade Bar & Restaurante
          </p>
          <p className="text-[#c8b89a]/40 text-xs">
            Av. Rebouças, 3400 — Pinheiros, São Paulo
          </p>
          <a
            href={`https://wa.me/5511916547785?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre a Feijoada Cortesia.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[#c8b89a]/50 text-xs underline underline-offset-2 mt-1"
          >
            Falar com o Nômade no WhatsApp
          </a>
        </div>

      </div>
    </main>
  );
}
