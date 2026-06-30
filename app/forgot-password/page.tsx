'use client'

import { useState, useRef } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { supabase } from '../../lib/supabase'

const DARK = '#000000'
const BORDER = '#E5E5E5'
const CARD = '#F8F9FA'
const MUTED = '#888888'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef = useRef<HCaptcha>(null)

  const handleReset = async () => {
    setError('')
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!captchaToken) {
      setError('Please complete the captcha verification.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/reset-password`,
  captchaToken
})
    setLoading(false)
    if (error) {
      setError(error.message)
      captchaRef.current?.resetCaptcha()
      setCaptchaToken('')
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '420px', width: '100%', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: DARK, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ color: '#fff', fontSize: '28px' }}>📧</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: DARK, marginBottom: '12px' }}>Check your email</h1>
          <p style={{ fontSize: '14px', color: MUTED, marginBottom: '8px' }}>We sent a password reset link to</p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: DARK, marginBottom: '16px' }}>{email}</p>
          <p style={{ fontSize: '14px', color: MUTED, marginBottom: '8px' }}>Click the link in the email to reset your password. The link expires in 10 minutes.</p>
          <p style={{ fontSize: '13px', color: MUTED, marginBottom: '32px' }}>Didn't receive it? Check your spam folder.</p>
          <a href="/signin" style={{ display: 'inline-block', backgroundColor: DARK, color: '#fff', padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            Back to sign in →
          </a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column' }}>

      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: DARK }}>✕ Tutorverse</span>
        <span style={{ fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>KYC Verification</span>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: DARK, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ color: '#fff', fontSize: '24px' }}>🔑</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>Forgot your password?</h1>
            <p style={{ fontSize: '14px', color: MUTED }}>Enter your email and we'll send you a reset link</p>
          </div>

          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReset()}
            style={{ width: '100%', backgroundColor: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, color: DARK, fontFamily: 'inherit', marginBottom: '16px' }}
          />

          {error && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#C53030', margin: 0 }}>⚠ {error}</p>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <HCaptcha
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken('')}
            />
          </div>

          <button
            onClick={handleReset}
            disabled={loading || !captchaToken}
            style={{ width: '100%', backgroundColor: (loading || !captchaToken) ? '#ccc' : DARK, color: '#fff', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: (loading || !captchaToken) ? 'not-allowed' : 'pointer', marginBottom: '24px' }}
          >
            {loading ? 'Sending reset link...' : 'Send reset link'}
          </button>

          <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', fontSize: '12px', color: MUTED, lineHeight: '1.7' }}>
            🔒 For your security, the reset link expires in 10 minutes and can only be used once.
          </div>

          <p style={{ textAlign: 'center', fontSize: '14px', color: MUTED }}>
            Remember your password?{' '}
            <a href="/signin" style={{ color: DARK, fontWeight: 600, textDecoration: 'none' }}>Back to sign in</a>
          </p>
        </div>
      </div>
    </main>
  )
}