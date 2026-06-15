import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const UNITS = {
  nomade: { id: 'nomade', name: 'Nômade', slug: 'nomade', color: '#f59e0b', prefix: 'NM' },
  manga: { id: 'manga', name: 'Pé de Manga', slug: 'manga', color: '#22c55e', prefix: 'PM' },
}

export default supabase
