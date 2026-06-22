'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const router = useRouter()
  const strength = getPasswordStrength(password)

  useEffect(() => {
    // Check if we have a valid reset session
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
      }
    })
  }, [])

  const handleReset = async () => {
    setError('')
    if (!password || !confirm) {
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
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/signin'), 3000)
    }
  }

  if (success) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '420px', width: '100%', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#38A169', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ color: '#fff', fontSize: '28px' }}>✓</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: DARK, marginBottom: '12px' }}>Password updated!</h1>
          <p style={{ fontSize: '14px', color: MUTED }}>Your password has been reset successfully. Redirecting you to sign in...</p>
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
              <span style={{ color: '#fff', fontSize: '24px' }}>🔒</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>Set new password</h1>
            <p style={{ fontSize: '14px', color: MUTED }}>Choose a strong password for your account</p>
          </div>

          {/* New Password */}
          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>New password</label>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 12 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', backgroundColor: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '14px 48px 14px 16px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, color: DARK, fontFamily: 'inherit' }}
            />
            <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          {/* Password strength meter */}
          {password.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: i <= strength.score ? strength.color : BORDER, transition: 'background-color 0.3s' }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                <span style={{ fontSize: '12px', color: MUTED }}>{strength.score}/6</span>
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

          {/* Confirm Password */}
          <label style={{ fontSize: '13px', fontWeight: 600, color: DARK, display: 'block', marginBottom: '6px' }}>Confirm new password</label>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{ width: '100%', backgroundColor: '#fff', border: `1.5px solid ${confirm.length > 0 ? (confirm === password ? '#38A169' : '#E53E3E') : BORDER}`, borderRadius: '10px', padding: '14px 48px 14px 16px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, color: DARK, fontFamily: 'inherit' }}
            />
            <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              {showConfirm ? '🙈' : '👁'}
            </button>
          </div>
          {confirm.length > 0 && confirm !== password && (
            <p style={{ fontSize: '12px', color: '#E53E3E', marginBottom: '12px' }}>Passwords do not match</p>
          )}
          {confirm.length > 0 && confirm === password && (
            <p style={{ fontSize: '12px', color: '#38A169', marginBottom: '12px' }}>✓ Passwords match</p>
          )}

          {error && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#C53030', margin: 0 }}>⚠ {error}</p>
            </div>
          )}

          <button
            onClick={handleReset}
            disabled={loading || strength.score < 4 || password !== confirm}
            style={{ width: '100%', backgroundColor: (loading || strength.score < 4 || password !== confirm) ? '#ccc' : DARK, color: '#fff', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: (loading || strength.score < 4 || password !== confirm) ? 'not-allowed' : 'pointer', marginBottom: '16px' }}
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>

          <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '14px 16px', fontSize: '12px', color: MUTED, lineHeight: '1.7' }}>
            🔒 Your new password will be encrypted and stored securely. You will be signed out of all other devices.
          </div>
        </div>
      </div>
    </main>
  )
}