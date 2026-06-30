'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { supabase } from '../../lib/supabase'

const DARK = '#000000'
const BORDER = '#E5E5E5'
const CARD = '#F8F9FA'
const MUTED = '#888888'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef = useRef<HCaptcha>(null)
  const router = useRouter()

  // Check for error from callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'not_admin') {
      setError('Your Google account does not have admin access.')
    }
  }, [])

  const checkAdminAndRedirect = async (userId: string) => {
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!adminData) {
      await supabase.auth.signOut()
      setError('You do not have admin access.')
      setLoading(false)
      setGoogleLoading(false)
      return
    }
    router.push('/admin')
  }

  const handleAdminLogin = async () => {
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (!captchaToken) {
      setError('Please complete the captcha verification.')
      return
    }
    setLoading(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken }
    })
    if (signInError || !data.user) {
      setError('Invalid email or password.')
      setLoading(false)
      captchaRef.current?.resetCaptcha()
      setCaptchaToken('')
      return
    }
    await checkAdminAndRedirect(data.user.id)
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin-callback`
      }
    })
    if (error) {
      setError('Google sign in failed.')
      setGoogleLoading(false)
    }
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

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{ width: '100%', backgroundColor: '#fff', color: DARK, border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: BORDER }} />
            <span style={{ fontSize: '13px', color: MUTED }}>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: BORDER }} />
          </div>

          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Email address</label>
          <input
            type="email"
            placeholder="admin@tutorverse.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', backgroundColor: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, color: DARK, fontFamily: 'inherit', marginBottom: '16px' }}
          />

          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
            style={{ width: '100%', backgroundColor: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, color: DARK, fontFamily: 'inherit', marginBottom: '16px' }}
          />

          {error && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#C53030', margin: 0 }}>⚠ {error}</p>
            </div>
          )}

          {/* hCaptcha widget */}
          <div style={{ marginBottom: '16px' }}>
            <HCaptcha
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken('')}
            />
          </div>

          <button
            onClick={handleAdminLogin}
            disabled={loading || !captchaToken}
            style={{ width: '100%', backgroundColor: (loading || !captchaToken) ? '#ccc' : DARK, color: '#fff', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: (loading || !captchaToken) ? 'not-allowed' : 'pointer', marginBottom: '24px' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '14px 16px', fontSize: '12px', color: MUTED, lineHeight: '1.7' }}>
            🔒 All admin actions are logged for security and compliance. Unauthorised access attempts are recorded.
          </div>
        </div>
      </div>
    </main>
  )
}