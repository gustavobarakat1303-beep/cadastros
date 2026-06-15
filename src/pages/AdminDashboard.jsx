import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Users, CheckSquare, Tag, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
      <div className="p-3 rounded-lg" style={{ background: color + '22' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, used: 0, nomade: 0, manga: 0 })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      // Counts
      const [{ count: total }, { count: used }, { count: nomade }, { count: manga }] = await Promise.all([
        supabase.from('dv_registrations').select('*', { count: 'exact', head: true }),
        supabase.from('dv_registrations').select('*', { count: 'exact', head: true }).eq('used', true),
        supabase.from('dv_registrations').select('*', { count: 'exact', head: true }).eq('unit_slug', 'nomade'),
        supabase.from('dv_registrations').select('*', { count: 'exact', head: true }).eq('unit_slug', 'manga'),
      ])
      setStats({ total, used, nomade, manga })

      // Last 7 days chart
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i)
        return format(d, 'yyyy-MM-dd')
      })

      const { data: regs } = await supabase
        .from('dv_registrations')
        .select('created_at, unit_slug')
        .gte('created_at', days[0] + 'T00:00:00')

      const byDay = {}
      days.forEach(d => { byDay[d] = { date: format(new Date(d + 'T12:00:00'), 'dd/MM', { locale: ptBR }), nomade: 0, manga: 0 } })

      regs?.forEach(r => {
        const d = r.created_at.slice(0, 10)
        if (byDay[d]) byDay[d][r.unit_slug]++
      })

      setChartData(Object.values(byDay))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do sistema de descontos</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Cadastros totais" value={stats.total} color="#f59e0b" />
        <StatCard icon={CheckSquare} label="Códigos usados" value={stats.used} color="#22c55e" />
        <StatCard icon={TrendingUp} label="Nômade" value={stats.nomade} color="#f59e0b" />
        <StatCard icon={Tag} label="Pé de Manga" value={stats.manga} color="#22c55e" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Cadastros últimos 7 dias</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
            <Legend />
            <Bar dataKey="nomade" name="Nômade" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="manga" name="Pé de Manga" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="/register/nomade"
          target="_blank"
          rel="noreferrer"
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center hover:border-amber-500 transition-colors"
        >
          <p className="text-amber-500 font-semibold text-sm">🟡 Link Nômade</p>
          <p className="text-gray-500 text-xs mt-1">/register/nomade</p>
        </a>
        <a
          href="/register/manga"
          target="_blank"
          rel="noreferrer"
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center hover:border-green-500 transition-colors"
        >
          <p className="text-green-500 font-semibold text-sm">🟢 Link Pé de Manga</p>
          <p className="text-gray-500 text-xs mt-1">/register/manga</p>
        </a>
        <a
          href="/validar/nomade"
          target="_blank"
          rel="noreferrer"
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center hover:border-amber-500 transition-colors"
        >
          <p className="text-amber-500 font-semibold text-sm">📱 Validador Nômade</p>
          <p className="text-gray-500 text-xs mt-1">/validar/nomade</p>
        </a>
        <a
          href="/validar/manga"
          target="_blank"
          rel="noreferrer"
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center hover:border-green-500 transition-colors"
        >
          <p className="text-green-500 font-semibold text-sm">📱 Validador Pé de Manga</p>
          <p className="text-gray-500 text-xs mt-1">/validar/manga</p>
        </a>
      </div>
    </div>
  )
}
