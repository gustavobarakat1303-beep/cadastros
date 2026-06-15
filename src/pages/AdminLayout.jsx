import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CheckSquare, Tag, Cake, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const nav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
  { to: '/admin/validacoes', icon: CheckSquare, label: 'Validações' },
  { to: '/admin/promocoes', icon: Tag, label: 'Promoções' },
  { to: '/admin/aniversarios', icon: Cake, label: 'Aniversários' },
  { to: '/admin/tipos-desconto', icon: Tag, label: 'Tipos de Desconto' },
]

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-gray-900 border-r border-gray-800 flex flex-col
        transition-transform lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 border-b border-gray-800">
          <div className="w-8 h-0.5 bg-amber-500 mb-2" />
          <p className="font-bold text-white text-sm">Casa dos Bares</p>
          <p className="text-gray-500 text-xs">Admin</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-black font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 w-full transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 z-30">
        <button onClick={() => setOpen(true)} className="text-gray-400">
          <Menu size={22} />
        </button>
        <span className="ml-4 font-medium text-white text-sm">Admin · Casa dos Bares</span>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
