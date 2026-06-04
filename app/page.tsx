'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { extractTextFromImage } from '../lib/ocr'
import { validateSAID, checkNameMatch } from '../lib/validate'

export default function Home() {
  const [fullName, setFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [qualFile, setQualFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [validation, setValidation] = useState<any>(null)
  const [step, setStep] = useState(1)

  const handleSubmit = async () => {
    if (!fullName || !idNumber || !idFile) {
      setStatus('Please fill in all required fields and upload your ID.')
      return
    }
    setLoading(true)

    try {
      const fileExt = idFile.name.split('.').pop()
      const fileName = `${idNumber}_${Date.now()}.${fileExt}`
      await supabase.storage.from('documents').upload(`ids/${fileName}`, idFile)
      if (qualFile) {
        const qualExt = qualFile.name.split('.').pop()
        const qualFileName = `${idNumber}_qual_${Date.now()}.${qualExt}`
        await supabase.storage.from('documents').upload(`qualifications/${qualFileName}`, qualFile)
      }
    } catch (err) {
      console.error('Storage error:', err)
    }

    setStatus('Reading your document...')
    let text = ''
    try {
      text = await extractTextFromImage(idFile)
    } catch (err) {
      console.error('OCR failed:', err)
    }

    setStatus('Validating your ID number...')
    const validationResult = validateSAID(idNumber)
    const nameMatch = checkNameMatch(fullName, text)
    setValidation({ ...validationResult, nameMatch })

    setStatus('Saving your submission...')
    const { error } = await supabase.from('verifications').insert([
      { full_name: fullName, id_number: idNumber, status: 'pending' },
    ])

    if (error) {
      setStatus('Something went wrong. Please try again.')
    } else {
      setStatus('success')
      setStep(3)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    backgroundColor: '#f5f5f5',
    border: '1.5px solid transparent',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#000',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#888',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <nav style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>✕</span>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#000', letterSpacing: '-0.3px' }}>Tutorverse</span>
        </div>
        <span style={{ fontSize: '12px', color: '#999', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>KYC Verification</span>
      </nav>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '56px 24px 40px' }}>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#000', lineHeight: 1.2, marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Verify Your<br />Identity
            </h1>
            <p style={{ fontSize: '15px', color: '#888', marginBottom: '40px', lineHeight: 1.6 }}>
              Enter your details exactly as they appear on your South African ID document.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Full name</label>
              <input
                type="text"
                placeholder="e.g. Samkele Ndlovu"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#000'; e.target.style.backgroundColor = '#fff' }}
                onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = '#f5f5f5' }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={labelStyle}>SA ID number</label>
              <input
                type="text"
                placeholder="13-digit ID number"
                value={idNumber}
                onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setIdNumber(val) }}
                maxLength={13}
                style={{ ...inputStyle, letterSpacing: '3px', fontWeight: 500 }}
                onFocus={(e) => { e.target.style.borderColor = '#000'; e.target.style.backgroundColor = '#fff' }}
                onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = '#f5f5f5' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#bbb' }}>Numbers only</span>
                <span style={{ fontSize: '12px', color: idNumber.length === 13 ? '#000' : '#bbb', fontWeight: idNumber.length === 13 ? 600 : 400 }}>{idNumber.length} / 13</span>
              </div>
            </div>

            {status && <p style={{ fontSize: '13px', color: '#e53e3e', marginBottom: '16px', textAlign: 'center' }}>{status}</p>}

            <button
              onClick={() => {
                if (!fullName || idNumber.length !== 13) {
                  setStatus('Please enter your full name and a 13-digit ID number.')
                  return
                }
                setStatus('')
                setStep(2)
              }}
              style={{ width: '100%', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              Continue
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              <div style={{ width: '24px', height: '4px', backgroundColor: '#000', borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '4px', backgroundColor: '#e5e5e5', borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '4px', backgroundColor: '#e5e5e5', borderRadius: '2px' }} />
            </div>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#bbb', marginTop: '8px' }}>Step 1 of 3</p>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#888', marginBottom: '24px', padding: 0 }}>
              ← Back
            </button>

            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#000', lineHeight: 1.2, marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Upload<br />Documents
            </h1>
            <p style={{ fontSize: '15px', color: '#888', marginBottom: '40px', lineHeight: 1.6 }}>
              Upload a clear photo or scan. We'll read your document automatically.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>ID or passport <span style={{ color: '#e53e3e' }}>*</span></label>
              <div
                onClick={() => document.getElementById('idFileInput')?.click()}
                style={{ backgroundColor: '#f5f5f5', border: `2px dashed ${idFile ? '#000' : '#e0e0e0'}`, borderRadius: '12px', padding: '28px 20px', textAlign: 'center', cursor: 'pointer' }}
              >
                <input id="idFileInput" type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                  onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                {idFile ? (
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', marginBottom: '2px' }}>✓ {idFile.name}</p>
                    <p style={{ fontSize: '12px', color: '#888' }}>Click to replace</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#e8e8e8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <span style={{ fontSize: '20px' }}>📄</span>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', marginBottom: '2px' }}>Click to upload</p>
                    <p style={{ fontSize: '12px', color: '#aaa' }}>JPG, PNG or PDF supported</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '36px' }}>
              <label style={labelStyle}>Qualification certificate <span style={{ color: '#bbb', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>(optional)</span></label>
              <div
                onClick={() => document.getElementById('qualFileInput')?.click()}
                style={{ backgroundColor: '#f5f5f5', border: `2px dashed ${qualFile ? '#000' : '#e0e0e0'}`, borderRadius: '12px', padding: '28px 20px', textAlign: 'center', cursor: 'pointer' }}
              >
                <input id="qualFileInput" type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                  onChange={(e) => setQualFile(e.target.files?.[0] || null)} />
                {qualFile ? (
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', marginBottom: '2px' }}>✓ {qualFile.name}</p>
                    <p style={{ fontSize: '12px', color: '#888' }}>Click to replace</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#e8e8e8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <span style={{ fontSize: '20px' }}>🎓</span>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', marginBottom: '2px' }}>Click to upload</p>
                    <p style={{ fontSize: '12px', color: '#aaa' }}>JPG, PNG or PDF supported</p>
                  </div>
                )}
              </div>
            </div>

            {status && !loading && <p style={{ fontSize: '13px', color: '#e53e3e', marginBottom: '16px', textAlign: 'center' }}>{status}</p>}
            {loading && (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#888' }}>{status}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Processing...' : 'Submit for verification'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              <div style={{ width: '24px', height: '4px', backgroundColor: '#000', borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '4px', backgroundColor: '#000', borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '4px', backgroundColor: '#e5e5e5', borderRadius: '2px' }} />
            </div>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#bbb', marginTop: '8px' }}>Step 2 of 3</p>
          </div>
        )}

        {/* Step 3 - Success */}
        {step === 3 && (
          <div style={{ textAlign: 'center', paddingTop: '20px' }}>
            <div style={{ width: '72px', height: '72px', backgroundColor: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
              <span style={{ color: '#fff', fontSize: '32px', lineHeight: '1' }}>✓</span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#000', marginBottom: '12px', letterSpacing: '-0.5px' }}>Submitted successfully</h1>
            <p style={{ fontSize: '15px', color: '#888', marginBottom: '36px', lineHeight: 1.6 }}>
              Your documents are under review. We'll update your Tutorverse profile once verified.
            </p>

            {validation && (
              <div style={{ backgroundColor: '#f5f5f5', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '28px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }}>Verification summary</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#555' }}>ID format</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: validation.isValid ? '#000' : '#e53e3e' }}>{validation.isValid ? '✓ Valid' : '✗ Invalid'}</span>
                  </div>
                  {validation.details?.dateOfBirth && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#555' }}>Date of birth</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#000' }}>{validation.details.dateOfBirth}</span>
                    </div>
                  )}
                  {validation.details?.gender && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#555' }}>Gender</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#000' }}>{validation.details.gender}</span>
                    </div>
                  )}
                  {validation.details?.citizenship && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#555' }}>Citizenship</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#000' }}>{validation.details.citizenship}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#555' }}>Name match</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: validation.nameMatch ? '#000' : '#e53e3e' }}>{validation.nameMatch ? '✓ Matched' : '⚠ Not found'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#555' }}>Status</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#888', backgroundColor: '#e8e8e8', padding: '2px 10px', borderRadius: '20px' }}>Pending review</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => { setStep(1); setFullName(''); setIdNumber(''); setIdFile(null); setQualFile(null); setValidation(null); setStatus('') }}
              style={{ width: '100%', backgroundColor: '#fff', color: '#000', border: '1.5px solid #e5e5e5', borderRadius: '12px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              Submit another tutor
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              <div style={{ width: '24px', height: '4px', backgroundColor: '#000', borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '4px', backgroundColor: '#000', borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '4px', backgroundColor: '#000', borderRadius: '2px' }} />
            </div>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#bbb', marginTop: '8px' }}>Step 3 of 3</p>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#ccc', marginTop: '48px' }}>
          Protected by POPIA · © 2026 Tutorverse (Pty) Ltd
        </p>
      </div>
    </main>
  )
}