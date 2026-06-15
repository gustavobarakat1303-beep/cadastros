import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState('loading') // loading | authed | denied

  useEffect(() => {
    let active = true
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!active) return
      const isAdmin = sessionStorage.getItem('cdb_admin') === '1'
      setState(session && isAdmin ? 'authed' : 'denied')
    })()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (!session) {
        sessionStorage.removeItem('cdb_admin')
        setState('denied')
      }
    })

    return () => {
      active = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Carregando…
      </div>
    )
  }

  if (state === 'denied') {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
