'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AdminCallback() {
  const router = useRouter()
  const [message, setMessage] = useState('Verifying admin access...')

  useEffect(() => {
    const check = async () => {
      // Listen for auth state change — fires when token is processed
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          setMessage('Checking admin permissions...')

          const { data: adminData } = await supabase
            .from('admin_users')
            .select('id')
            .eq('id', session.user.id)
            .single()

          if (!adminData) {
            await supabase.auth.signOut()
            router.push('/admin-login?error=not_admin')
            return
          }

          router.push('/admin')
        }
      })

      // Also check if already signed in
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        subscription.unsubscribe()
        setMessage('Checking admin permissions...')

        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .single()

        if (!adminData) {
          await supabase.auth.signOut()
          router.push('/admin-login?error=not_admin')
          return
        }

        router.push('/admin')
      }
    }

    check()
  }, [])

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E5E5E5', borderTop: '3px solid #000', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '14px', color: '#888' }}>{message}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  )
}