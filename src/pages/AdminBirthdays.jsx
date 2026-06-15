import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Gift, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const UNIT_COLORS = { nomade: '#f59e0b', manga: '#22c55e' }

export default function AdminBirthdays() {
  const [rows, setRows] = useState([])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [unitFilter, setUnitFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [month, unitFilter])

  async function load() {
    setLoading(true)
    try {
      // birthdate format: YYYY-MM-DD; filter by month using substring
      let q = supabase
        .from('dv_registrations')
        .select('*')
        .not('birthdate', 'is', null)
        .order('birthdate')

      if (unitFilter !== 'all') q = q.eq('unit_slug', unitFilter)

      const { data } = await q
      // Filter client-side by month (birthdate is TEXT YYYY-MM-DD)
      const monthStr = String(month).padStart(2, '0')
      const filtered = (data || []).filter(r => r.birthdate?.slice(5, 7) === monthStr)
      setRows(filtered)
    } finally {
      setLoading(false)
    }
  }

  // Group by day
  const grouped = rows.reduce((acc, r) => {
    const day = r.birthdate?.slice(8, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(r)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Aniversários</h1>
        <p className="text-gray-500 text-sm">{rows.length} clientes aniversariantes em {MONTHS[month - 1]}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={unitFilter}
          onChange={e => setUnitFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="all">Todas as unidades</option>
          <option value="nomade">Nômade</option>
          <option value="manga">Pé de Manga</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Gift size={32} className="text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum aniversariante em {MONTHS[month - 1]}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(grouped).sort().map(day => (
            <div key={day} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                <Gift size={14} className="text-amber-400" />
                <span className="text-amber-400 font-semibold text-sm">
                  Dia {day} de {MONTHS[month - 1]}
                </span>
                <span className="text-gray-500 text-xs">— {grouped[day].length} {grouped[day].length === 1 ? 'pessoa' : 'pessoas'}</span>
              </div>
              <div className="divide-y divide-gray-800">
                {grouped[day].map(r => (
                  <div key={r.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1">
                      <p className="text-white font-medium">{r.name}</p>
                      <p className="text-gray-500 text-xs">{r.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.phone && (
                        <a href={`https://wa.me/55${r.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-green-400 text-xs hover:underline">
                          <Phone size={12} /> {r.phone}
                        </a>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: UNIT_COLORS[r.unit_slug] + '22', color: UNIT_COLORS[r.unit_slug] }}>
                        {r.unit_slug === 'nomade' ? 'Nômade' : 'Pé de Manga'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.used ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                        {r.used ? 'Código usado' : 'Código disponível'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
