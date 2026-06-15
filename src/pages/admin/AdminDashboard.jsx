import { useState, useEffect } from 'react'
import {
  collection, getDocs, query, orderBy, limit, where, Timestamp
} from 'firebase/firestore'
import { db } from '../../firebase'
import {
  Users, CheckCircle, CalendarDays, Cake, TrendingUp, RefreshCw
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthLabel(date) {
  return date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')
}

function buildLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(), // 0-indexed
      label: monthLabel(d),
      cadastros: 0,
    })
  }
  return months
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color = 'amber', loading }) {
  const colorMap = {
    amber:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
    green:  'text-green-400 bg-green-500/10 border-green-500/20',
    blue:   'text-blue-400  bg-blue-500/10  border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }
  return (
    <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-gray-500 text-xs mb-0.5">{label}</p>
        {loading
          ? <div className="h-7 w-16 bg-white/5 rounded animate-pulse" />
          : <p className="text-white text-2xl font-semibold">{value ?? '–'}</p>
        }
      </div>
    </div>
  )
}

// ─── Tooltip customizado ───────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({ total: 0, validacoes: 0, mes: 0, aniversariantes: 0 })
  const [lineData, setLineData] = useState([])
  const [barData, setBarData] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchAll()
  }, [refreshKey])

  async function fetchAll() {
    setLoading(true)
    try {
      await Promise.all([fetchKpis(), fetchLineChart(), fetchBarChart(), fetchRecentLogs()])
    } finally {
      setLoading(false)
    }
  }

  async function fetchKpis() {
    const now = new Date()
    const mesAtual = now.getMonth() + 1 // 1-indexed

    // Total cadastros
    const regSnap = await getDocs(collection(db, 'registrations'))
    const total = regSnap.size

    // Cadastros no mês atual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const qMes = query(
      collection(db, 'registrations'),
      where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
    )
    const meSnap = await getDocs(qMes)
    const mes = meSnap.size

    // Aniversariantes do mês
    const qAniv = query(
      collection(db, 'registrations'),
      where('birthMonth', '==', mesAtual)
    )
    const anivSnap = await getDocs(qAniv)
    const aniversariantes = anivSnap.size

    // Total validações
    const valSnap = await getDocs(collection(db, 'validations'))
    const validacoes = valSnap.size

    setKpis({ total, validacoes, mes, aniversariantes })
  }

  async function fetchLineChart() {
    const months = buildLast6Months()
    const regSnap = await getDocs(collection(db, 'registrations'))

    regSnap.docs.forEach((doc) => {
      const d = doc.data()
      const ts = d.createdAt?.toDate?.()
      if (!ts) return
      const y = ts.getFullYear()
      const m = ts.getMonth()
      const found = months.find((x) => x.year === y && x.month === m)
      if (found) found.cadastros += 1
    })

    setLineData(months.map(({ label, cadastros }) => ({ label, Cadastros: cadastros })))
  }

  async function fetchBarChart() {
    const valSnap = await getDocs(collection(db, 'validations'))
    const counts = { nomade: 0, manga: 0 }

    valSnap.docs.forEach((doc) => {
      const unit = doc.data().unitId || ''
      if (unit.toLowerCase().includes('nomade') || unit.toLowerCase().includes('nômade')) {
        counts.nomade += 1
      } else {
        counts.manga += 1
      }
    })

    setBarData([
      { name: 'Nômade', Validações: counts.nomade },
      { name: 'Pé de Manga', Validações: counts.manga },
    ])
  }

  async function fetchRecentLogs() {
    const q = query(
      collection(db, 'validations'),
      orderBy('validatedAt', 'desc'),
      limit(5)
    )
    const snap = await getDocs(q)
    setRecentLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  function formatDate(ts) {
    if (!ts) return '–'
    const d = ts.toDate?.() ?? new Date(ts)
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function unitLabel(unitId) {
    if (!unitId) return 'Desconhecida'
    const u = unitId.toLowerCase()
    if (u.includes('nomade') || u.includes('nômade')) return 'Nômade'
    return 'Pé de Manga'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Visão geral do sistema</p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Users}        label="Total de cadastros"      value={kpis.total}          color="amber"  loading={loading} />
        <KpiCard icon={CheckCircle}  label="Total de validações"     value={kpis.validacoes}     color="green"  loading={loading} />
        <KpiCard icon={CalendarDays} label="Cadastros este mês"      value={kpis.mes}            color="blue"   loading={loading} />
        <KpiCard icon={Cake}         label="Aniversariantes do mês"  value={kpis.aniversariantes} color="purple" loading={loading} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Linha – Cadastros por mês */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h2 className="text-white text-sm font-medium">Cadastros — últimos 6 meses</h2>
          </div>
          {loading ? (
            <div className="h-52 bg-white/5 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={208}>
              <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff15' }} />
                <Line
                  type="monotone"
                  dataKey="Cadastros"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#fbbf24' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Barra – Validações por unidade */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <h2 className="text-white text-sm font-medium">Validações por unidade</h2>
          </div>
          {loading ? (
            <div className="h-52 bg-white/5 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={208}>
              <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="Validações" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Últimas 5 validações */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
        <h2 className="text-white text-sm font-medium mb-4">Últimas validações</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-6">Nenhuma validação registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="text-gray-500 font-medium pb-3 pr-4">Código</th>
                  <th className="text-gray-500 font-medium pb-3 pr-4">Cliente</th>
                  <th className="text-gray-500 font-medium pb-3 pr-4">Unidade</th>
                  <th className="text-gray-500 font-medium pb-3">Data/hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded-lg text-amber-400">
                        {log.code ?? '–'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-white">{log.customerName ?? '–'}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        unitLabel(log.unitId) === 'Nômade'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-green-500/15 text-green-400'
                      }`}>
                        {unitLabel(log.unitId)}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">{formatDate(log.validatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
