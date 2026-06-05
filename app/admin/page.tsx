'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchVerifications = async () => {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setVerifications(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchVerifications()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    await supabase
      .from('verifications')
      .update({ status })
      .eq('id', id)
    await fetchVerifications()
    setUpdating(null)
  }

  const statusColor = (status: string) => {
    if (status === 'verified') return { color: '#000', bg: '#f0f0f0' }
    if (status === 'failed') return { color: '#e53e3e', bg: '#fff5f5' }
    return { color: '#888', bg: '#f5f5f5' }
  }

  const statusLabel = (status: string) => {
    if (status === 'verified') return '✓ Verified'
    if (status === 'failed') return '✗ Failed'
    return '⏳ Pending'
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <nav style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>✕</span>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#000', letterSpacing: '-0.3px' }}>Tutorverse</span>
        </div>
        <span style={{ fontSize: '12px', color: '#999', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>Admin Dashboard</span>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#000', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Verification Requests
            </h1>
            <p style={{ fontSize: '15px', color: '#888' }}>
              {verifications.length} total submissions
            </p>
          </div>
          <button
            onClick={fetchVerifications}
            style={{ backgroundColor: '#f5f5f5', color: '#000', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '15px' }}>Loading...</p>
        ) : verifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '15px', color: '#888' }}>No verification requests yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {verifications.map((v) => (
              <div key={v.id} style={{ backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>{v.full_name}</p>
                  <p style={{ fontSize: '13px', color: '#888', margin: 0, letterSpacing: '1px' }}>{v.id_number}</p>
                  <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>{new Date(v.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>

                <span style={{ fontSize: '13px', fontWeight: 600, color: statusColor(v.status).color, backgroundColor: statusColor(v.status).bg, padding: '4px 12px', borderRadius: '20px' }}>
                  {statusLabel(v.status)}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => updateStatus(v.id, 'verified')}
                    disabled={updating === v.id || v.status === 'verified'}
                    style={{ backgroundColor: v.status === 'verified' ? '#f0f0f0' : '#000', color: v.status === 'verified' ? '#888' : '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: v.status === 'verified' ? 'not-allowed' : 'pointer', opacity: updating === v.id ? 0.5 : 1 }}
                  >
                    {updating === v.id ? '...' : '✓ Verify'}
                  </button>
                  <button
                    onClick={() => updateStatus(v.id, 'failed')}
                    disabled={updating === v.id || v.status === 'failed'}
                    style={{ backgroundColor: v.status === 'failed' ? '#fff5f5' : '#fff', color: v.status === 'failed' ? '#e53e3e' : '#e53e3e', border: '1.5px solid #e53e3e', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: v.status === 'failed' ? 'not-allowed' : 'pointer', opacity: updating === v.id ? 0.5 : 1 }}
                  >
                    ✗ Reject
                  </button>
                  <button
                    onClick={() => updateStatus(v.id, 'pending')}
                    disabled={updating === v.id || v.status === 'pending'}
                    style={{ backgroundColor: '#fff', color: '#888', border: '1.5px solid #e5e5e5', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: v.status === 'pending' ? 'not-allowed' : 'pointer', opacity: updating === v.id ? 0.5 : 1 }}
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: '12px', color: '#ccc', paddingBottom: '40px' }}>
        Protected by POPIA · © 2026 Tutorverse (Pty) Ltd
      </p>
    </main>
  )
}