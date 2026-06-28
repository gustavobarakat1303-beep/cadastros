import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Páginas existentes
const Home              = lazy(() => import('./pages/Home'))
const Registration      = lazy(() => import('./pages/Registration'))
const Validator         = lazy(() => import('./pages/Validator'))
const Invite            = lazy(() => import('./pages/Invite'))
const AdminLogin        = lazy(() => import('./pages/AdminLogin'))
const Dashboard         = lazy(() => import('./pages/admin/Dashboard'))
const Clientes          = lazy(() => import('./pages/admin/Clientes'))
const Validacoes        = lazy(() => import('./pages/admin/Validacoes'))
const Promocoes         = lazy(() => import('./pages/admin/Promocoes'))
const Aniversarios      = lazy(() => import('./pages/admin/Aniversarios'))
const TiposDesconto     = lazy(() => import('./pages/admin/TiposDesconto'))
const Convites          = lazy(() => import('./pages/admin/Convites'))
const ProtectedRoute    = lazy(() => import('./components/ProtectedRoute'))
const NotFound          = lazy(() => import('./pages/NotFound'))

// Campanha Feijoada
const FeijoadaRegister  = lazy(() => import('./pages/feijoada/FeijoadaRegister'))
const FeijoadaVoucher   = lazy(() => import('./pages/feijoada/FeijoadaVoucher'))

function Loader() {
  return (
    <div className="min-h-screen bg-[#110f0d] flex items-center justify-center">
      <div className="w-6 h-6 border border-[#c8b89a]/40 border-t-[#c8b89a] rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Página inicial (e redirecionamento por domínio customizado) */}
        <Route path="/" element={<Home />} />

        {/* Campanha Feijoada Nômade */}
        <Route path="/feijoada" element={<FeijoadaRegister />} />
        <Route path="/feijoada/convite/:code" element={<FeijoadaVoucher />} />

        {/* Cadastro público */}
        <Route path="/register/:unit" element={<Registration />} />

        {/* Validador operacional */}
        <Route path="/validar/:unit" element={<Validator />} />

        {/* Convite de fidelidade do Nômade (links já distribuídos) */}
        <Route path="/convite/:code" element={<Invite />} />

        {/* Admin */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/admin/validacoes" element={<ProtectedRoute><Validacoes /></ProtectedRoute>} />
        <Route path="/admin/promocoes" element={<ProtectedRoute><Promocoes /></ProtectedRoute>} />
        <Route path="/admin/aniversarios" element={<ProtectedRoute><Aniversarios /></ProtectedRoute>} />
        <Route path="/admin/tipos-desconto" element={<ProtectedRoute><TiposDesconto /></ProtectedRoute>} />
        <Route path="/admin/convites" element={<ProtectedRoute><Convites /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
