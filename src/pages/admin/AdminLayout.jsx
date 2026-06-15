import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Tag, Users, Cake, Building2,
  ShieldCheck, ClipboardList, LogOut, Menu, X,
  ChevronRight
} from 'lucide-react'

const NAV = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/promocoes',     icon: Tag,             label: 'Promoções' },
  { to: '/admin/clientes',      icon: Users,           label: 'Clientes' },
  { to: '/admin/aniversariantes', icon: Cake,          label: 'Aniversariantes' },
  { to: '/admin/unidades',      icon: Building2,       label: 'Unidades' },
  { to: '/admin/validadores',   icon: ShieldCheck,     label: 'Validadores' },
  { to: '/admin/logs',          icon: ClipboardList,   label: 'Logs' },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="w-3 h-3 opacity-30" />
    </NavLink>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await signOut(auth)
    navigate('/admin/login')
  }

  const Sidebar = ({ onClose }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <span className="text-base">🍹</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">Casa dos Bares</p>
            <p className="text-gray-500 text-xs mt-0.5">Admin</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1 transition lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}
      </nav>

      {/* Usuário + Logout */}
      <div className="border-t border-white/5 px-3 py-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-medium text-white">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.email}</p>
            <p className="text-gray-500 text-xs">Administrador</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-gray-900 border-r border-white/5 fixed top-0 left-0 h-full z-30">
        <Sidebar />
      </aside>

      {/* Overlay — mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — mobile */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gray-900 border-r border-white/5 z-50 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 lg:ml-60 min-h-screen flex flex-col">
        {/* Header mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-4 bg-gray-900 border-b border-white/5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base">🍹</span>
            <span className="text-white text-sm font-semibold">Casa dos Bares</span>
          </div>
        </header>

        {/* Página atual */}
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
