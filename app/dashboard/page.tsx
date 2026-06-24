'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const DARK = '#000000'
const BORDER = '#E5E5E5'
const CARD = '#F8F9FA'
const MUTED = '#888888'

export default function Dashboard() {
  const [verification, setVerification] = useState<any>(null)
  const [qualifications, setQualifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/signin'); return }
      setUser(session.user)

      // Fetch latest verification
      const { data: vData } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Fetch qualifications
      const { data: qData } = await supabase
        .from('qualifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (vData) setVerification(vData)
      if (qData) setQualifications(qData)
      setLoading(false)
    }
    load()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
  }

  const statusConfig = (status: string) => {
    if (status === 'verified') return { color: '#38A169', bg: '#F0FFF4', border: '#C6F6D5', icon: '✓', label: 'Verified', message: 'Your identity has been verified. You can now receive bookings on Tutorverse.' }
    if (status === 'failed') return { color: '#E53E3E', bg: '#FFF5F5', border: '#FED7D7', icon: '✗', label: 'Verification Failed', message: 'Your verification was unsuccessful. Please resubmit with clearer documents.' }
    return { color: '#D69E2E', bg: '#FFFFF0', border: '#FAF089', icon: '⏳', label: 'Under Review', message: 'Your documents are being reviewed. This usually takes 15-30 minutes.' }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5E5E5', borderTop: '3px solid #000', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', color: MUTED }}>Loading your dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    )
  }

  const s = verification ? statusConfig(verification.status) : null

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Nav */}
      <nav style={{ padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: DARK }}>✕ Tutorverse</span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: MUTED }}>{user?.email}</span>
          <button
            onClick={() => router.push('/')}
            style={{ backgroundColor: DARK, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            + New Verification
          </button>
          <button
            onClick={handleSignOut}
            style={{ backgroundColor: '#fff', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>

        <h1 style={{ fontSize: '28px', fontWeight: 700, color: DARK, marginBottom: '4px' }}>My Verification</h1>
        <p style={{ fontSize: '14px', color: MUTED, marginBottom: '32px' }}>Track your KYC verification status</p>

        {!verification ? (
          /* No submission yet */
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: `1px solid ${BORDER}`, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>No verification submitted yet</h2>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '28px' }}>Complete your KYC verification to get your Verified badge and start receiving bookings.</p>
            <button
              onClick={() => router.push('/')}
              style={{ backgroundColor: DARK, color: '#fff', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              Start verification →
            </button>
          </div>
        ) : (
          <>
            {/* Status banner */}
            <div style={{ backgroundColor: s!.bg, border: `1.5px solid ${s!.border}`, borderRadius: '16px', padding: '24px 28px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: s!.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: '22px', fontWeight: 700 }}>{s!.icon}</span>
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: DARK, marginBottom: '4px' }}>{s!.label}</h2>
                <p style={{ fontSize: '14px', color: MUTED, marginBottom: '8px' }}>{s!.message}</p>
                <p style={{ fontSize: '12px', color: MUTED }}>
                  Submitted {new Date(verification.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Verified badge */}
            {verification.status === 'verified' && (
              <div style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px 28px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Your Verified Badge</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ backgroundColor: '#38A169', borderRadius: '8px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>✓ Verified Tutor</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: MUTED, marginTop: '8px' }}>This badge appears on your profile and increases booking rates.</p>
                </div>
              </div>
            )}

            {/* Verification details */}
            <div style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px 28px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Verification Details</p>
              {[
                { label: 'Full name', value: verification.full_name },
                { label: 'Submission ID', value: verification.id?.substring(0, 16) + '...' },
                { label: 'Status', value: s!.label },
                { label: 'Submitted', value: new Date(verification.created_at).toLocaleString('en-ZA') },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ fontSize: '14px', color: MUTED }}>{row.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: DARK }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Qualifications */}
            {qualifications.length > 0 && (
              <div style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px 28px', marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Qualifications Submitted</p>
                {qualifications.map((q, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < qualifications.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: DARK, margin: '0 0 2px' }}>
                        {q.qualification_type ? q.qualification_type.charAt(0).toUpperCase() + q.qualification_type.slice(1) : 'Unknown type'}
                      </p>
                      <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>{q.institution_name || 'Unknown institution'}</p>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: statusConfig(q.status).color, backgroundColor: statusConfig(q.status).bg, padding: '4px 10px', borderRadius: '12px' }}>
                      {statusConfig(q.status).label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Resubmit if failed */}
            {verification.status === 'failed' && (
              <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: '16px', padding: '24px 28px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#C53030', marginBottom: '8px' }}>Verification unsuccessful</h3>
                <p style={{ fontSize: '14px', color: MUTED, marginBottom: '16px' }}>Please ensure your ID is clear, not expired, and your name matches exactly. Then resubmit.</p>
                <button
                  onClick={() => router.push('/')}
                  style={{ backgroundColor: DARK, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Resubmit verification →
                </button>
              </div>
            )}
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: '12px', color: MUTED, marginTop: '48px' }}>
          Protected by POPIA · © 2026 Tutorverse (Pty) Ltd
        </p>
      </div>
    </main>
  )
}