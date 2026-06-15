import { useState, useEffect, useMemo } from 'react'
import {
  collection, getDocs, query, orderBy, limit,
  where, Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { ClipboardList, Search, Download, X, Filter } from 'lucide-react'

// ─── helpers ─────────────────────────────────────────────────────────────────

function unitLabel(unitId = '') {
  const u = unitId.toLowerCase()
  if (u.includes('nomade') || u.includes('nômade')) return 'Nômade'
  if (u.includes('manga')) return 'Pé de Manga'
  return unitId || '—'
}

function unitColor(unitId = '') {
  const u = unitId.toLowerCase()
  if (u.includes('nomade') || u.includes('nômade'))
    return 'bg-amber-500/15 text-amber-400'
  if (u.includes('manga'))
    return 'bg-green-500/15 text-green-400'
  return 'bg-white/10 text-gray-400'
}

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts?.toDate?.() ?? new Date(ts)
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function exportCSV(rows) {
  const cols = ['Código', 'Cliente', 'Telefone', 'Unidade', 'Promoção', 'Data/Hora']
  const lines = [cols.join(';')]
  rows.forEach((r) => {
    lines.push([
      r.code ?? '',
      r.customerName ?? '',
      r.customerPhone ?? '',
      unitLabel(r.unitId),
      r.promoName ?? '',
      fmtDate(r.validatedAt),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
  })
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `logs-validacoes-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
        active
          ? 'bg-amber-500 text-black'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // filters
  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => { fetchLogs() }, [startDate, endDate])

  async function fetchLogs() {
    setLoading(true)
    try {
      let q = query(
        collection(db, 'validations'),
        orderBy('validatedAt', 'desc'),
        limit(200),
      )

      // se tiver filtro de data, aplica no Firestore
      if (startDate) {
        const start = Timestamp.fromDate(new Date(startDate + 'T00:00:00'))
        q = query(
          collection(db, 'validations'),
          where('validatedAt', '>=', start),
          orderBy('validatedAt', 'desc'),
          limit(200),
        )
      }
      if (startDate && endDate) {
        const start = Timestamp.fromDate(new Date(startDate + 'T00:00:00'))
        const end   = Timestamp.fromDate(new Date(endDate   + 'T23:59:59'))
        q = query(
          collection(db, 'validations'),
          where('validatedAt', '>=', start),
          where('validatedAt', '<=', end),
          orderBy('validatedAt', 'desc'),
          limit(200),
        )
      }

      const snap = await getDocs(q)
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } finally {
      setLoading(false)
    }
  }

  // filtros client-side
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    return logs.filter((log) => {
      if (unitFilter !== 'all') {
        const u = (log.unitId ?? '').toLowerCase()
        if (unitFilter === 'nomade' && !u.includes('nomade') && !u.includes('nômade')) return false
        if (unitFilter === 'manga'  && !u.includes('manga'))                            return false
      }
      if (term) {
        const haystack = [
          log.code, log.customerName, log.customerPhone, log.promoName,
        ].join(' ').toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [logs, unitFilter, search])

  function clearFilters() {
    setSearch('')
    setUnitFilter('all')
    setStartDate('')
    setEndDate('')
  }

  const hasFilters = search || unitFilter !== 'all' || startDate || endDate

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Logs de Validação</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Últimos {logs.length} registros{filtered.length !== logs.length ? ` · ${filtered.length} exibidos` : ''}
          </p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10
                     text-gray-300 hover:text-white text-sm font-medium border border-white/10
                     transition disabled:opacity-30"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* filtros */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
          <Filter className="w-3.5 h-3.5" />
          Filtros
        </div>

        {/* busca + datas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar código, nome, telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl pl-9 pr-3 py-2.5
                         text-white text-sm placeholder-gray-600 focus:outline-none
                         focus:border-amber-500/50 transition"
            />
          </div>

          {/* data início */}
          <div className="relative">
            <label className="absolute -top-2 left-2.5 text-[10px] text-gray-500 bg-gray-900 px-1">
              De
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5
                         text-white text-sm focus:outline-none focus:border-amber-500/50 transition
                         [color-scheme:dark]"
            />
          </div>

          {/* data fim */}
          <div className="relative">
            <label className="absolute -top-2 left-2.5 text-[10px] text-gray-500 bg-gray-900 px-1">
              Até
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5
                         text-white text-sm focus:outline-none focus:border-amber-500/50 transition
                         [color-scheme:dark]"
            />
          </div>
        </div>

        {/* chips unidade + limpar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <FilterChip label="Todas"       active={unitFilter === 'all'}    onClick={() => setUnitFilter('all')} />
            <FilterChip label="Nômade"      active={unitFilter === 'nomade'} onClick={() => setUnitFilter('nomade')} />
            <FilterChip label="Pé de Manga" active={unitFilter === 'manga'}  onClick={() => setUnitFilter('manga')} />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* tabela / lista */}
      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 border border-white/5 rounded-2xl">
          <ClipboardList className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {hasFilters ? 'Nenhum resultado para os filtros aplicados.' : 'Nenhuma validação registrada ainda.'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-amber-400 text-sm underline hover:text-amber-300">
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* desktop: tabela */}
          <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Código', 'Cliente', 'Unidade', 'Promoção', 'Data/Hora'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr
                    key={log.id}
                    className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition ${
                      i % 2 === 0 ? '' : 'bg-white/[0.01]'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-amber-400 text-xs tracking-widest">
                        {log.code ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{log.customerName ?? '—'}</p>
                      {log.customerPhone && (
                        <p className="text-gray-500 text-xs">{log.customerPhone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${unitColor(log.unitId)}`}>
                        {unitLabel(log.unitId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {log.promoName ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {fmtDate(log.validatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile: cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-amber-400 text-sm tracking-widest">
                    {log.code ?? '—'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${unitColor(log.unitId)}`}>
                    {unitLabel(log.unitId)}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{log.customerName ?? '—'}</p>
                  {log.customerPhone && (
                    <p className="text-gray-500 text-xs">{log.customerPhone}</p>
                  )}
                </div>
                {log.promoName && (
                  <p className="text-gray-400 text-xs">{log.promoName}</p>
                )}
                <p className="text-gray-600 text-xs">{fmtDate(log.validatedAt)}</p>
              </div>
            ))}
          </div>

          {/* rodapé com total */}
          <p className="text-center text-gray-600 text-xs pt-1">
            {filtered.length} validação{filtered.length !== 1 ? 'ões' : ''} exibida{filtered.length !== 1 ? 's' : ''}
            {logs.length === 200 && ' · exibindo últimas 200 (use filtros de data para ver mais)'}
          </p>
        </>
      )}
    </div>
  )
}
