'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const DARK = '#000000'
const BORDER = '#E5E5E5'
const CARD = '#F8F9FA'
const MUTED = '#888888'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#fff',
    border: `1.5px solid ${BORDER}`,
    borderRadius: '10px',
    padding: '14px 16px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    color: DARK,
    fontFamily: 'inherit',
    marginBottom: '16px',
  }

  const handleAdminLogin = async () => {
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)

    // Sign in with Supabase
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Check if user is in admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', data.user.id)
      .single()

    if (adminError || !adminData) {
      await supabase.auth.signOut()
      setError('You do not have admin access.')
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column' }}>

      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: DARK }}>✕ Tutorverse</span>
        <span style={{ fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Access</span>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: DARK, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ color: '#fff', fontSize: '24px' }}>🔐</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>Admin Portal</h1>
            <p style={{ fontSize: '14px', color: MUTED }}>Restricted access — authorised personnel only</p>
          </div>

          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Email address</label>
          <input
            type="email"
            placeholder="admin@tutorverse.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />

          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
            style={inputStyle}
          />

          {error && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#C53030', margin: 0 }}>⚠ {error}</p>
            </div>
          )}

          <button
            onClick={handleAdminLogin}
            disabled={loading}
            style={{ width: '100%', backgroundColor: loading ? '#ccc' : DARK, color: '#fff', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px' }}
          >
            {loading ? 'Signing in...' : 'Sign in to Admin'}
          </button>

          <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '14px 16px', fontSize: '12px', color: MUTED, lineHeight: '1.7' }}>
            🔒 All admin actions are logged for security and compliance purposes. Unauthorised access attempts are recorded.
          </div>
        </div>
      </div>
    </main>
  )
}