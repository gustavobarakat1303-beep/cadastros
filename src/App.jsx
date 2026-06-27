/**
 * App.jsx
 * Roteamento principal — Casa dos Bares · Sistema de Descontos
 *
 * Rotas documentadas (README):
 * /register/:unit        → cadastro do cliente
 * /validar/:unit         → validador (PIN)
 * /admin/login           → login admin
 * /admin/dashboard       → dashboard KPIs
 * /admin/clientes        → listagem e export
 * /admin/validacoes      → histórico
 * /admin/promocoes       → promoções
 * /admin/aniversarios    → aniversariantes
 * /admin/tipos-desconto  → tipos de desconto
 *
 * Rotas adicionadas (campanha Feijoada):
 * /feijoada              → FeijoadaRegister
 * /feijoada/convite/:code → FeijoadaVoucher
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MetaPixelTracker from './components/MetaPixelTracker';

// ── Páginas existentes (lazy) ──────────────────────────────────────────────
const Registration     = lazy(() => import('./pages/Registration'));
const Validator        = lazy(() => import('./pages/Validator'));
const AdminLogin       = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard   = lazy(() => import('./pages/AdminDashboard'));
const AdminClientes    = lazy(() => import('./pages/AdminClientes'));
const AdminValidacoes  = lazy(() => import('./pages/AdminValidacoes'));
const AdminPromocoes   = lazy(() => import('./pages/AdminPromocoes'));
const AdminAniversarios = lazy(() => import('./pages/AdminAniversarios'));
const AdminTiposDesconto = lazy(() => import('./pages/AdminTiposDesconto'));
const ProtectedRoute   = lazy(() => import('./components/ProtectedRoute'));

// ── Páginas da campanha Feijoada ───────────────────────────────────────────
const FeijoadaRegister = lazy(() => import('./pages/feijoada/FeijoadaRegister'));
const FeijoadaVoucher  = lazy(() => import('./pages/feijoada/FeijoadaVoucher'));

// Spinner minimalista para Suspense
function Loader() {
  return (
    <div className="min-h-screen bg-[#110f0d] flex items-center justify-center">
      <div className="w-6 h-6 border border-[#c8b89a]/40 border-t-[#c8b89a] rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      {/* Tracker SPA: PageView em mudança de rota + Contact no WhatsApp */}
      <MetaPixelTracker />

      <Suspense fallback={<Loader />}>
        <Routes>

          {/* ── Campanha Feijoada Nômade ─────────────────────────────── */}
          <Route path="/feijoada" element={<FeijoadaRegister />} />
          <Route path="/feijoada/convite/:code" element={<FeijoadaVoucher />} />

          {/* ── Cadastro público por unidade ─────────────────────────── */}
          <Route path="/register/:unit" element={<Registration />} />

          {/* ── Validador operacional ────────────────────────────────── */}
          <Route path="/validar/:unit" element={<Validator />} />

          {/* ── Admin ────────────────────────────────────────────────── */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clientes"
            element={
              <ProtectedRoute>
                <AdminClientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/validacoes"
            element={
              <ProtectedRoute>
                <AdminValidacoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/promocoes"
            element={
              <ProtectedRoute>
                <AdminPromocoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/aniversarios"
            element={
              <ProtectedRoute>
                <AdminAniversarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tipos-desconto"
            element={
              <ProtectedRoute>
                <AdminTiposDesconto />
              </ProtectedRoute>
            }
          />

          {/* ── Fallback ─────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/feijoada" replace />} />

        </Routes>
      </Suspense>
    </Router>
  );
}
