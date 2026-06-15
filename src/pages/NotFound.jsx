import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-gray-700">404</p>
      <p className="mt-4 text-gray-400">Página não encontrada.</p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-gray-800 px-5 py-2 text-sm hover:bg-gray-700"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
