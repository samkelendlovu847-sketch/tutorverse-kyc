'use client'

import { useState, useRef } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { supabase } from '../../lib/supabase'

const DARK = '#000000'
const BORDER = '#E5E5E5'
const CARD = '#F8F9FA'
const MUTED = '#888888'

interface PasswordStrength {
  score: number
  label: string
  color: string
  checks: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    symbol: boolean
    notCommon: boolean
  }
}

function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    notCommon: !['password', '123456', 'qwerty', 'abc123', 'letmein', 'welcome', 'monkey', 'dragon'].some(w => password.toLowerCase().includes(w))
  }
  const score = Object.values(checks).filter(Boolean).length
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong', 'Excellent']
  const colors = ['', '#E53E3E', '#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#2B6CB0']
  return { score, label: labels[score] || '', color: colors[score] || '', checks }
}

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef = useRef<HCaptcha>(null)

  const strength = getPasswordStrength(password)

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
  }

  const handleSignUp = async () => {
    setError('')
    if (!email || !password || !confirm) {
      setError('Please fill in all fields.')
      return
    }
    if (strength.score < 4) {
      setError('Please choose a stronger password.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        data: {
          consent_given: true,
          consent_timestamp: new Date().toISOString()
        }
      }
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

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
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

      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: DARK }}>✕ Tutorverse</span>
        <span style={{ fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>KYC Verification</span>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: BORDER }} />
            <span style={{ fontSize: '13px', color: MUTED }}>or sign up with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: BORDER }} />
          </div>

          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ ...inputStyle, marginBottom: '16px' }}
          />

          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Password</label>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 12 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: '48px' }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: MUTED }}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          {password.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: i <= strength.score ? strength.color : BORDER, transition: 'background-color 0.3s' }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                <span style={{ fontSize: '12px', color: MUTED }}>{strength.score}/6 requirements met</span>
              </div>
              <div style={{ backgroundColor: CARD, borderRadius: '8px', padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { check: strength.checks.length, label: '12+ characters' },
                  { check: strength.checks.uppercase, label: 'Uppercase letter' },
                  { check: strength.checks.lowercase, label: 'Lowercase letter' },
                  { check: strength.checks.number, label: 'Number' },
                  { check: strength.checks.symbol, label: 'Symbol (!@#$...)' },
                  { check: strength.checks.notCommon, label: 'Not a common word' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: item.check ? '#38A169' : MUTED }}>{item.check ? '✓' : '○'}</span>
                    <span style={{ fontSize: '11px', color: item.check ? '#38A169' : MUTED }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Confirm password</label>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{ ...inputStyle, paddingRight: '48px', borderColor: confirm.length > 0 ? (confirm === password ? '#38A169' : '#E53E3E') : BORDER }}
            />
            <button
              onClick={() => setShowConfirm(!showConfirm)}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: MUTED }}
            >
              {showConfirm ? '🙈' : '👁'}
            </button>
          </div>
          {confirm.length > 0 && confirm !== password && (
            <p style={{ fontSize: '12px', color: '#E53E3E', marginBottom: '12px', marginTop: '-12px' }}>Passwords do not match</p>
          )}
          {confirm.length > 0 && confirm === password && (
            <p style={{ fontSize: '12px', color: '#38A169', marginBottom: '12px', marginTop: '-12px' }}>✓ Passwords match</p>
          )}

          {error && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#C53030', margin: 0 }}>⚠ {error}</p>
            </div>
          )}

          <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', fontSize: '12px', color: MUTED, lineHeight: '1.7' }}>
            🔒 By creating an account you agree that Tutorverse will collect and process your personal data for identity verification purposes in accordance with our{' '}
            <a href="/privacy" style={{ color: DARK, fontWeight: 600 }}>Privacy Policy</a>{' '}
            and POPIA. You may request deletion of your data at any time.
          </div>

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
            onClick={handleSignUp}
            disabled={loading || strength.score < 4 || password !== confirm || !captchaToken}
            style={{ width: '100%', backgroundColor: (loading || strength.score < 4 || password !== confirm || !captchaToken) ? '#ccc' : DARK, color: '#fff', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: (loading || strength.score < 4 || password !== confirm || !captchaToken) ? 'not-allowed' : 'pointer', marginBottom: '24px' }}
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