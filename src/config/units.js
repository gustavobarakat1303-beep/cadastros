// Logotipos empacotados no app (em /public) — garante carregamento confiável,
// sem depender do Storage externo.
const NOMADE_LOGO = '/logo-nomade.png'
const MANGA_LOGO = '/logo-manga.png'

// Configuração visual e de identidade de cada unidade.
// O `slug` é o que aparece nas rotas (/register/:unit, /validar/:unit).
export const UNITS = {
  nomade: {
    slug: 'nomade',
    name: 'Nômade',
    fullName: 'Nômade Restaurante Bar',
    logo: NOMADE_LOGO,
    accent: '#c2956a',
    accentClass: 'bg-[#c2956a]',
    accentText: 'text-[#c2956a]',
    // Prefixo dos códigos de cupom desta unidade (ex.: NM-AB12CD).
    codePrefix: 'NM',
    // PIN do validador — lido do ambiente com fallback seguro.
    pin: import.meta.env.VITE_NOMADE_PIN || '1234',
  },
  manga: {
    slug: 'manga',
    name: 'Pé de Manga',
    fullName: 'Pé de Manga',
    logo: MANGA_LOGO,
    accent: '#e8a13c',
    accentClass: 'bg-[#e8a13c]',
    accentText: 'text-[#e8a13c]',
    codePrefix: 'PM',
    pin: import.meta.env.VITE_MANGA_PIN || '5678',
  },
}

export const getUnit = (slug) => UNITS[slug] || null

export const UNIT_SLUGS = Object.keys(UNITS)

// Mapeia cada domínio customizado para a sua unidade. Ao acessar a raiz "/"
// por um desses domínios, o app abre direto o cadastro da unidade.
export const HOST_UNIT = {
  'cadastro.nomaderestaurantebar.com.br': 'nomade',
  'cadastro.pedemanga.com.br': 'manga',
}

export const getUnitByHost = (host) =>
  HOST_UNIT[(host || '').toLowerCase().replace(/^www\./, '')] || null
