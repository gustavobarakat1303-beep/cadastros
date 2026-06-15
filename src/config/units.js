const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''

const logoUrl = (file) =>
  `${SUPABASE_URL}/storage/v1/object/public/logos/${encodeURIComponent(file)}`

// Configuração visual e de identidade de cada unidade.
// O `slug` é o que aparece nas rotas (/register/:unit, /validar/:unit).
export const UNITS = {
  nomade: {
    slug: 'nomade',
    name: 'Nômade',
    fullName: 'Nômade Restaurante Bar',
    logo: logoUrl('Logo Nomade Escurol.png'),
    accent: '#c2956a',
    accentClass: 'bg-[#c2956a]',
    accentText: 'text-[#c2956a]',
    // PIN do validador — lido do ambiente com fallback seguro.
    pin: import.meta.env.VITE_NOMADE_PIN || '1234',
  },
  manga: {
    slug: 'manga',
    name: 'Pé de Manga',
    fullName: 'Pé de Manga',
    logo: logoUrl('Logo PedeManga.png'),
    accent: '#e8a13c',
    accentClass: 'bg-[#e8a13c]',
    accentText: 'text-[#e8a13c]',
    pin: import.meta.env.VITE_MANGA_PIN || '5678',
  },
}

export const getUnit = (slug) => UNITS[slug] || null

export const UNIT_SLUGS = Object.keys(UNITS)
