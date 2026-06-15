import { Link } from 'react-router-dom'
import { UNITS } from '../config/units.js'

export default function Home() {
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
            className="flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-900/60 px-6 py-5 transition hover:border-gray-600"
          >
            <span className="text-lg font-medium">{unit.name}</span>
            <span className={`text-sm ${unit.accentText}`}>Cadastrar →</span>
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
