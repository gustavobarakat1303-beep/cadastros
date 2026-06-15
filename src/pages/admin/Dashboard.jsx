import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { supabase } from '../../lib/supabase.js'
import { UNITS } from '../../config/units.js'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from('dv_registrations')
        .select('unit_slug, used, created_at')
        .order('created_at', { ascending: false })
        .limit(10000)
      if (!error) setRows(data || [])
      setLoading(false)
    })()
  }, [])

  if (loading) return <Loading />

  const total = rows.length
  const validated = rows.filter((r) => r.used).length
  const rate = total ? Math.round((validated / total) * 100) : 0

  const byUnit = Object.values(UNITS).map((u) => ({
    name: u.name,
    cadastros: rows.filter((r) => r.unit_slug === u.slug).length,
    validados: rows.filter((r) => r.unit_slug === u.slug && r.used).length,
  }))

  // Cadastros nos últimos 14 dias.
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({
      key,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      cadastros: 0,
    })
  }
  const dayMap = Object.fromEntries(days.map((d) => [d.key, d]))
  for (const r of rows) {
    const key = (r.created_at || '').slice(0, 10)
    if (dayMap[key]) dayMap[key].cadastros += 1
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <Kpi label="Total de cadastros" value={total} />
        <Kpi label="Descontos validados" value={validated} />
        <Kpi label="Taxa de conversão" value={`${rate}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Cadastros (últimos 14 dias)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="cadastros" fill="#c2956a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Por unidade">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byUnit}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="cadastros" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="validados" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
      <p className="mb-4 text-sm font-medium text-gray-300">{title}</p>
      {children}
    </div>
  )
}

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center text-gray-500">
      Carregando…
    </div>
  )
}
