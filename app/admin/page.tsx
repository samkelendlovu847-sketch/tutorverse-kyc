'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const DARK = '#000000'
const BORDER = '#E5E5E5'
const MUTED = '#888888'
const CARD = '#F9F9F9'

export default function AdminPage() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [qualifications, setQualifications] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [adminChecked, setAdminChecked] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [adminEmail, setAdminEmail] = useState('')
  const [activeTab, setActiveTab] = useState<'verifications' | 'qualifications'>('verifications')
  const router = useRouter()

  // Auth + admin guard
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin-login'); return }
      const { data: adminData } = await supabase
        .from('admin_users').select('id').eq('id', session.user.id).single()
      if (!adminData) { await supabase.auth.signOut(); router.push('/admin-login'); return }
      setAdminEmail(session.user.email || '')
      setAdminChecked(true)
      fetchAll()
    }
    checkAdmin()
  }, [])

  // Real-time updates
  useEffect(() => {
    if (!adminChecked) return
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qualifications' }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [adminChecked])

  useEffect(() => {
    let result = verifications
    if (statusFilter !== 'all') result = result.filter(v => v.status === statusFilter)
    if (search.trim()) result = result.filter(v => v.full_name?.toLowerCase().includes(search.toLowerCase()))
    setFiltered(result)
  }, [search, statusFilter, verifications])

  const fetchAll = async () => {
    const [{ data: vData }, { data: qData }] = await Promise.all([
      supabase.from('verifications').select('*').order('created_at', { ascending: false }),
      supabase.from('qualifications').select('*').order('created_at', { ascending: false }),
    ])
    if (vData) setVerifications(vData)
    if (qData) setQualifications(qData)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    await supabase.from('verifications').update({ status }).eq('id', id)
    await fetchAll()
    setUpdating(null)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin-login')
  }

  const statusStyle = (status: string) => {
    if (status === 'verified') return { color: '#38A169', bg: '#F0FFF4', border: '#C6F6D5' }
    if (status === 'failed') return { color: '#E53E3E', bg: '#FFF5F5', border: '#FED7D7' }
    if (status === 'review_needed') return { color: '#D69E2E', bg: '#FFFFF0', border: '#FAF089' }
    return { color: '#718096', bg: '#F7FAFC', border: '#E2E8F0' }
  }

  const statusLabel = (status: string) => {
    if (status === 'verified') return '✓ Verified'
    if (status === 'failed') return '✗ Failed'
    if (status === 'review_needed') return '⚠ Review needed'
    return '⏳ Pending'
  }

  const counts = {
    all: verifications.length,
    pending: verifications.filter(v => v.status === 'pending').length,
    verified: verifications.filter(v => v.status === 'verified').length,
    failed: verifications.filter(v => v.status === 'failed').length,
  }

  const getQualForUser = (userId: string) =>
    qualifications.filter(q => q.user_id === userId)

  if (!adminChecked) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5E5E5', borderTop: '3px solid #000', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', color: MUTED }}>Verifying admin access...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Nav */}
      <nav style={{ padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: DARK }}>✕ Tutorverse</span>
          <span style={{ fontSize: '11px', color: '#fff', backgroundColor: DARK, padding: '3px 8px', borderRadius: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: MUTED }}>{adminEmail}</span>
          <button onClick={handleSignOut} style={{ backgroundColor: '#FFF5F5', color: '#E53E3E', border: '1px solid #FED7D7', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: DARK, letterSpacing: '-0.5px', marginBottom: '4px' }}>KYC Admin Dashboard</h1>
          <p style={{ fontSize: '14px', color: MUTED }}>Review and manage tutor verification submissions</p>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Total', value: counts.all, key: 'all', color: DARK, icon: '📋' },
            { label: 'Pending review', value: counts.pending, key: 'pending', color: '#D69E2E', icon: '⏳' },
            { label: 'Verified', value: counts.verified, key: 'verified', color: '#38A169', icon: '✓' },
            { label: 'Failed', value: counts.failed, key: 'failed', color: '#E53E3E', icon: '✗' },
          ].map(stat => (
            <button
              key={stat.key}
              onClick={() => setStatusFilter(stat.key)}
              style={{ padding: '20px', borderRadius: '12px', border: `2px solid ${statusFilter === stat.key ? stat.color : BORDER}`, backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: MUTED, fontWeight: 500 }}>{stat.label}</div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${BORDER}`, paddingBottom: '0' }}>
          {[
            { key: 'verifications', label: `Identity Verifications (${verifications.length})` },
            { key: 'qualifications', label: `Qualifications (${qualifications.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: activeTab === tab.key ? DARK : MUTED, backgroundColor: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? DARK : 'transparent'}`, cursor: 'pointer', marginBottom: '-1px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'verifications' && (
          <>
            {/* Search */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="🔍 Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, backgroundColor: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '11px 16px', fontSize: '14px', outline: 'none', color: DARK, fontFamily: 'inherit' }}
              />
              <button onClick={fetchAll} style={{ backgroundColor: '#fff', color: DARK, border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '11px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ↻ Refresh
              </button>
            </div>

            {/* List */}
            {loading ? (
              <p style={{ textAlign: 'center', color: MUTED, padding: '60px 0' }}>Loading...</p>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>📭</p>
                <p style={{ fontSize: '15px', color: MUTED }}>No submissions found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filtered.map((v) => {
                  const isExpanded = expanded === v.id
                  const userQuals = getQualForUser(v.user_id)
                  const s = statusStyle(v.status)
                  return (
                    <div key={v.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: `1px solid ${isExpanded ? DARK : BORDER}`, overflow: 'hidden', transition: 'border 0.15s' }}>

                      {/* Row */}
                      <div
                        onClick={() => setExpanded(isExpanded ? null : v.id)}
                        style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', backgroundColor: CARD, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                            {v.status === 'verified' ? '✓' : v.status === 'failed' ? '✗' : '👤'}
                          </div>
                          <div>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: DARK, margin: '0 0 2px' }}>{v.full_name}</p>
                            <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>
                              {new Date(v.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              {userQuals.length > 0 && <span style={{ marginLeft: '8px', color: '#38A169' }}>• {userQuals.length} qualification{userQuals.length > 1 ? 's' : ''}</span>}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}`, padding: '5px 12px', borderRadius: '20px' }}>
                            {statusLabel(v.status)}
                          </span>
                          <span style={{ fontSize: '18px', color: MUTED, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '24px' }}>

                          {/* Details grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '16px' }}>
                              <p style={{ fontSize: '11px', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Identity Details</p>
                              {[
                                { label: 'Full name', value: v.full_name },
                                { label: 'ID number (hashed)', value: v.id_number ? `${v.id_number.substring(0, 12)}...` : '—' },
                                { label: 'User ID', value: v.user_id ? `${v.user_id.substring(0, 16)}...` : '—' },
                                { label: 'Submitted', value: new Date(v.created_at).toLocaleString('en-ZA') },
                              ].map((row, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${BORDER}` : 'none' }}>
                                  <span style={{ fontSize: '12px', color: MUTED }}>{row.label}</span>
                                  <span style={{ fontSize: '12px', fontWeight: 500, color: DARK }}>{row.value}</span>
                                </div>
                              ))}
                            </div>

                            {/* Qualifications */}
                            <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '16px' }}>
                              <p style={{ fontSize: '11px', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Qualifications</p>
                              {userQuals.length === 0 ? (
                                <p style={{ fontSize: '13px', color: MUTED }}>No qualifications submitted</p>
                              ) : userQuals.map((q, i) => (
                                <div key={i} style={{ padding: '8px 0', borderBottom: i < userQuals.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: DARK }}>{q.qualification_type ? q.qualification_type.charAt(0).toUpperCase() + q.qualification_type.slice(1) : 'Unknown type'}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: statusStyle(q.status).color, backgroundColor: statusStyle(q.status).bg, padding: '2px 8px', borderRadius: '10px' }}>{statusLabel(q.status)}</span>
                                  </div>
                                  <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>
                                    {q.institution_name || 'Unknown institution'} {q.institution_verified ? '✓ Accredited' : ''}
                                  </p>
                                  <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>
                                    Name matched: {q.name_matched ? '✓ Yes' : '✗ No'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Admin notes */}
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin Notes</label>
                            <textarea
                              placeholder="Add a note about this submission (e.g. reason for rejection)..."
                              value={notes[v.id] || ''}
                              onChange={e => setNotes(prev => ({ ...prev, [v.id]: e.target.value }))}
                              rows={3}
                              style={{ width: '100%', backgroundColor: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '12px 16px', fontSize: '14px', outline: 'none', color: DARK, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                            />
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => updateStatus(v.id, 'verified')}
                              disabled={updating === v.id || v.status === 'verified'}
                              style={{ backgroundColor: v.status === 'verified' ? '#F0FFF4' : DARK, color: v.status === 'verified' ? '#38A169' : '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: v.status === 'verified' ? 'not-allowed' : 'pointer', opacity: updating === v.id ? 0.5 : 1 }}
                            >
                              {updating === v.id ? '...' : '✓ Mark as Verified'}
                            </button>
                            <button
                              onClick={() => updateStatus(v.id, 'failed')}
                              disabled={updating === v.id || v.status === 'failed'}
                              style={{ backgroundColor: '#fff', color: '#E53E3E', border: '1.5px solid #E53E3E', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: v.status === 'failed' ? 'not-allowed' : 'pointer', opacity: updating === v.id ? 0.5 : 1 }}
                            >
                              ✗ Reject
                            </button>
                            <button
                              onClick={() => updateStatus(v.id, 'pending')}
                              disabled={updating === v.id || v.status === 'pending'}
                              style={{ backgroundColor: '#fff', color: MUTED, border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: v.status === 'pending' ? 'not-allowed' : 'pointer', opacity: updating === v.id ? 0.5 : 1 }}
                            >
                              ↺ Reset to Pending
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'qualifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {qualifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>🎓</p>
                <p style={{ fontSize: '15px', color: MUTED }}>No qualification submissions yet.</p>
              </div>
            ) : qualifications.map((q) => {
              const s = statusStyle(q.status)
              return (
                <div key={q.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: CARD, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎓</div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: DARK, margin: '0 0 3px' }}>
                        {q.qualification_type ? q.qualification_type.charAt(0).toUpperCase() + q.qualification_type.slice(1) : 'Unknown type'}
                      </p>
                      <p style={{ fontSize: '12px', color: MUTED, margin: '0 0 2px' }}>
                        {q.institution_name || 'Unknown institution'} {q.institution_verified ? '· ✓ Accredited' : ''}
                      </p>
                      <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>
                        Name matched: {q.name_matched ? '✓' : '✗'} · {new Date(q.created_at).toLocaleDateString('en-ZA')}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}`, padding: '5px 12px', borderRadius: '20px' }}>
                    {statusLabel(q.status)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: '12px', color: '#ccc', paddingBottom: '40px' }}>
        Protected by POPIA · © 2026 Tutorverse (Pty) Ltd · All admin actions are logged
      </p>
    </main>
  )
}