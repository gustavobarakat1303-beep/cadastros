import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Tag,
  Ticket,
  Cake,
  Percent,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/admin/clientes', label: 'Clientes', Icon: Users },
  { to: '/admin/validacoes', label: 'Validações', Icon: CheckSquare },
  { to: '/admin/promocoes', label: 'Promoções', Icon: Tag },
  { to: '/admin/convites', label: 'Convites', Icon: Ticket },
  { to: '/admin/aniversarios', label: 'Aniversários', Icon: Cake },
  { to: '/admin/tipos-desconto', label: 'Tipos de desconto', Icon: Percent },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const adminName = sessionStorage.getItem('cdb_admin_name') || 'Admin'

  const logout = async () => {
    await supabase.auth.signOut()
    sessionStorage.removeItem('cdb_admin')
    sessionStorage.removeItem('cdb_admin_name')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Topbar mobile */}
      <header className="flex items-center justify-between border-b border-gray-800 px-4 py-3 md:hidden">
        <span className="font-semibold">Casa dos Bares</span>
        <button onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          open ? 'block' : 'hidden'
        } border-b border-gray-800 md:block md:w-64 md:border-b-0 md:border-r md:min-h-screen`}
      >
        <div className="hidden px-6 py-5 md:block">
          <p className="font-bold">Casa dos Bares</p>
          <p className="text-xs text-gray-500">{adminName}</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={logout}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-900 hover:text-red-400"
          >
            <LogOut size={18} />
            Sair
          </button>
        </nav>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
