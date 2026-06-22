'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const DARK = '#000000'
const BORDER = '#E5E5E5'
const CARD = '#F8F9FA'
const MUTED = '#888888'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
    marginBottom: '12px',
  }

  const handleSignUp = async () => {
    setError('')
    if (!email || !password || !confirm) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          consent_given: true,
          consent_timestamp: new Date().toISOString()
        }
      }
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    })
  }

  if (success) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '420px', width: '100%', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: DARK, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ color: '#fff', fontSize: '28px' }}>✓</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: DARK, marginBottom: '12px' }}>Check your email</h1>
          <p style={{ fontSize: '14px', color: MUTED, marginBottom: '8px' }}>We sent a confirmation link to</p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: DARK, marginBottom: '16px' }}>{email}</p>
          <p style={{ fontSize: '14px', color: MUTED, marginBottom: '32px' }}>Click the link in the email to verify your account, then come back to sign in.</p>
          <a href="/signin" style={{ display: 'inline-block', backgroundColor: DARK, color: '#fff', padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            Go to sign in →
          </a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: DARK }}>✕ Tutorverse</span>
        <span style={{ fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>KYC Verification</span>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: DARK, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ color: '#fff', fontSize: '24px' }}>🛡</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>Create your account</h1>
            <p style={{ fontSize: '14px', color: MUTED }}>Sign up to begin your tutor verification</p>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            style={{ width: '100%', backgroundColor: '#fff', color: DARK, border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: BORDER }} />
            <span style={{ fontSize: '13px', color: MUTED }}>or sign up with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: BORDER }} />
          </div>

          {/* Email & Password */}
          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Email address</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />

          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Password</label>
          <input type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />

          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Confirm password</label>
          <input type="password" placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} />

          {error && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#C53030', margin: 0 }}>⚠ {error}</p>
            </div>
          )}

          {/* POPIA/GDPR Consent */}
          <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', fontSize: '12px', color: MUTED, lineHeight: '1.7' }}>
            🔒 By creating an account you agree that Tutorverse will collect and process your personal data for identity verification purposes in accordance with our{' '}
            <a href="/privacy" style={{ color: DARK, fontWeight: 600 }}>Privacy Policy</a>{' '}
            and POPIA. You may request deletion of your data at any time.
          </div>

          <button
            onClick={handleSignUp}
            disabled={loading}
            style={{ width: '100%', backgroundColor: loading ? '#ccc' : DARK, color: '#fff', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px' }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '14px', color: MUTED }}>
            Already have an account?{' '}
            <a href="/signin" style={{ color: DARK, fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
          </p>
        </div>
      </div>
    </main>
  )
}