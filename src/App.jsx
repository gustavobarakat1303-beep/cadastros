import { Routes, Route, Navigate } from 'react-router-dom'

import Home from './pages/Home.jsx'
import Registration from './pages/Registration.jsx'
import Validator from './pages/Validator.jsx'
import Invite from './pages/Invite.jsx'
import FeijoadaRegister from './pages/feijoada/FeijoadaRegister.jsx'
import FeijoadaInvite from './pages/feijoada/FeijoadaInvite.jsx'
import FeijoadaValidator from './pages/feijoada/FeijoadaValidator.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Clientes from './pages/admin/Clientes.jsx'
import Validacoes from './pages/admin/Validacoes.jsx'
import Promocoes from './pages/admin/Promocoes.jsx'
import Convites from './pages/admin/Convites.jsx'
import Aniversarios from './pages/admin/Aniversarios.jsx'
import TiposDesconto from './pages/admin/TiposDesconto.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Fluxo público */}
      <Route path="/register/:unit" element={<Registration />} />
      <Route path="/validar/:unit" element={<Validator />} />
      <Route path="/convite/:code" element={<Invite />} />

      {/* Campanha Feijoada (auto-cadastro) — isolada */}
      <Route path="/feijoada" element={<FeijoadaRegister />} />
      <Route path="/feijoada/convite/:code" element={<FeijoadaInvite />} />
      <Route path="/feijoada/validar" element={<FeijoadaValidator />} />

      {/* Painel administrativo */}
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/clientes" element={<Clientes />} />
        <Route path="/admin/validacoes" element={<Validacoes />} />
        <Route path="/admin/promocoes" element={<Promocoes />} />
        <Route path="/admin/convites" element={<Convites />} />
        <Route path="/admin/aniversarios" element={<Aniversarios />} />
        <Route path="/admin/tipos-desconto" element={<TiposDesconto />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
