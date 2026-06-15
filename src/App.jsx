import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import ProtectedRoute from './components/ProtectedRoute'

const Registration = lazy(() => import('./pages/Registration'))
const Validator = lazy(() => import('./pages/Validator'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminClients = lazy(() => import('./pages/AdminClients'))
const AdminValidations = lazy(() => import('./pages/AdminValidations'))
const AdminPromotions = lazy(() => import('./pages/AdminPromotions'))
const AdminBirthdays = lazy(() => import('./pages/AdminBirthdays'))
const AdminDiscountTypes = lazy(() => import('./pages/AdminDiscountTypes'))

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950">
    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/register/nomade" replace />} />
        <Route path="/register/:unit" element={<Registration />} />
        <Route path="/validar/:unit" element={<Validator />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin protected */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="clientes" element={<AdminClients />} />
          <Route path="validacoes" element={<AdminValidations />} />
          <Route path="promocoes" element={<AdminPromotions />} />
          <Route path="aniversarios" element={<AdminBirthdays />} />
          <Route path="tipos-desconto" element={<AdminDiscountTypes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
