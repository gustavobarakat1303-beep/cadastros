import { Link, Navigate } from 'react-router-dom'
import { UNITS, getUnitByHost } from '../config/units.js'

export default function Home() {
  // Em domínio customizado (cadastro.<unidade>) a raiz abre direto o cadastro.
  const hostUnit =
    typeof window !== 'undefined' ? getUnitByHost(window.location.hostname) : null
  if (hostUnit) {
    return <Navigate to={`/register/${hostUnit}`} replace />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 text-center">Casa dos Bares</h1>
      <p className="text-gray-400 mb-10 text-center">
        Sistema de validação de descontos
      </p>

      <div className="grid gap-4 w-full max-w-md">
        {Object.values(UNITS).map((unit) => (
          <Link
            key={unit.slug}
            to={`/register/${unit.slug}`}
            className="flex flex-col items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900/60 px-6 py-6 transition hover:border-gray-600"
          >
            {unit.logo ? (
              <div className="flex h-24 w-full items-center justify-center rounded-xl bg-white px-6 py-4">
                <img
                  src={unit.logo}
                  alt={unit.name}
                  className="max-h-16 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.parentElement.style.display = 'none'
                  }}
                />
              </div>
            ) : null}
            <div className="flex w-full items-center justify-between">
              <span className="text-lg font-medium">{unit.name}</span>
              <span className={`text-sm ${unit.accentText}`}>Cadastrar →</span>
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/admin/login"
        className="mt-10 text-sm text-gray-500 hover:text-gray-300"
      >
        Acesso administrativo
      </Link>
    </div>
  )
}
