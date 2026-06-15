import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase.js'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error

      // Confirma que o usuário autenticado é um administrador cadastrado.
      const { data: admin, error: adminErr } = await supabase
        .from('dv_admins')
        .select('id, name')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (adminErr) throw adminErr
      if (!admin) {
        await supabase.auth.signOut()
        toast.error('Usuário sem permissão de administrador.')
        return
      }

      sessionStorage.setItem('cdb_admin', '1')
      sessionStorage.setItem('cdb_admin_name', admin.name || data.user.email)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
      toast.error('E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1">Casa dos Bares</h1>
        <p className="text-center text-gray-400 mb-8">Painel administrativo</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            autoComplete="username"
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-gray-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-gray-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-white px-5 py-3 font-semibold text-black disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
