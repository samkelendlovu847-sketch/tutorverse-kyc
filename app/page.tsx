'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verifyWithProvider } from '../lib/kyc'
import { supabase } from '../lib/supabase'
import { extractTextFromImage } from '../lib/ocr'
import { validateSAID, checkNameMatch, checkDocumentAuthenticity } from '../lib/validate'
import { compareFaces } from '../lib/faceMatch'
import { analyseQualification } from '../lib/qualification'

// Design tokens
const INK = '#0A0A0A'
const PAPER = '#FDFCFA'
const PAPER_TINT = '#F4F1EA'
const HAIRLINE = '#E8E5DD'
const HAIRLINE_STRONG = '#D4D0C4'
const MUTED = '#6B6B66'
const FAINT = '#9A9890'
const SEAL_GREEN = '#1B4332'
const SEAL_GREEN_TINT = '#EAF1ED'
const SEAL_GREEN_BORDER = '#C5DAC9'
const GOLD = '#B8860B'
const GOLD_TINT = '#FBF3E3'
const GOLD_BORDER = '#ECD9AB'
const DANGER = '#9B2C2C'
const DANGER_TINT = '#FBEEEE'
const DANGER_BORDER = '#EFC9C9'

const serif = "Georgia, 'Times New Roman', serif"
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export default function Home() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [idFront, setIdFront] = useState<File | null>(null)
  const [idBack, setIdBack] = useState<File | null>(null)
  const [qualFile, setQualFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [validation, setValidation] = useState<any>(null)
  const [faceMatch, setFaceMatch] = useState<any>(null)
  const [authenticity, setAuthenticity] = useState<any>(null)
  const [qualResult, setQualResult] = useState<any>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [kycResult, setKycResult] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/signin')
    }
    checkAuth()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
      }
    } catch {
      setCameraError(true)
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraReady(false)
  }

  const takeSelfie = () => {
    setCountdown(3)
    const tick = (n: number) => {
      if (n === 0) {
        const video = videoRef.current
        if (!video) return
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')?.drawImage(video, 0, 0)
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
            setSelfieFile(file)
            stopCamera()
            setCountdown(null)
            setStep(4)
          }
        }, 'image/jpeg', 0.9)
      } else {
        setCountdown(n)
        setTimeout(() => tick(n - 1), 1000)
      }
    }
    setTimeout(() => tick(2), 1000)
  }

  useEffect(() => {
    if (step === 3) startCamera()
    else stopCamera()
    return () => stopCamera()
  }, [step])

  const handleSubmit = async () => {
    setLoading(true)
    setStep(5)

    setLoadingMsg('Checking existing submissions...')
    const { data: { session: checkSession } } = await supabase.auth.getSession()
    if (checkSession) {
      const { data: existing } = await supabase
        .from('verifications')
        .select('id, status')
        .eq('user_id', checkSession.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existing && existing.status === 'verified') {
        setLoading(false)
        setStep(6)
        setValidation({ isValid: true, nameMatch: true, details: {}, duplicate: true })
        return
      }
      if (existing && existing.status === 'pending') {
        setLoading(false)
        setStep(6)
        setValidation({ isValid: true, nameMatch: true, details: {}, duplicate: true, pendingExists: true })
        return
      }
    }

    setLoadingMsg('Reading your ID document...')
    let idText = ''
    try {
      if (idFront) idText = await extractTextFromImage(idFront)
    } catch { }

    setLoadingMsg('Reading your qualification certificate...')
    try {
      if (qualFile) {
        const qualText = await extractTextFromImage(qualFile)
        const analysis = analyseQualification(qualText, fullName)
        setQualResult(analysis)

        const { data: { session: qualSession } } = await supabase.auth.getSession()
        await supabase.from('qualifications').insert([{
          user_id: qualSession?.user?.id,
          institution_name: analysis.institutionName,
          qualification_type: analysis.qualificationType,
          ocr_text: qualText.substring(0, 500),
          name_matched: analysis.nameMatched,
          institution_verified: analysis.isAccredited,
          status: analysis.status
        }])
      }
    } catch { }

    setLoadingMsg('Validating ID number...')
    const validationResult = validateSAID(idNumber)
    const nameMatch = checkNameMatch(fullName, idText)
    setValidation({ ...validationResult, nameMatch })

    if (idFront) {
      setLoadingMsg('Checking document authenticity...')
      const auth = checkDocumentAuthenticity(idFront, idText)
      setAuthenticity(auth)
    }

    if (selfieFile && idFront) {
      setLoadingMsg('Running face match...')
      try {
        const face = await compareFaces(idFront, selfieFile)
        setFaceMatch(face)
      } catch { }
    }

    setLoadingMsg('Checking against authoritative source...')
    const kycCheck = await verifyWithProvider(idNumber, fullName)
    setKycResult(kycCheck)

    setLoadingMsg('Saving submission...')
    const finalStatus = kycCheck.verified ? 'verified' : 'pending'

    const encoder = new TextEncoder()
    const data = encoder.encode(idNumber)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const idNumberHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('verifications').insert([{
      full_name: fullName,
      id_number: idNumberHash,
      status: finalStatus,
      user_id: session?.user?.id,
      phone_number: phoneNumber ? `+27 ${phoneNumber}`.trim() : null
    }])

    setLoading(false)
    setLoadingMsg('')
    setStep(6)
  }

  const progressBar = (current: number, total: number) => (
    <div style={{ marginBottom: '36px' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: '2px', backgroundColor: i < current ? SEAL_GREEN : HAIRLINE, transition: 'background-color 0.3s' }} />
        ))}
      </div>
    </div>
  )

  const eyebrow = (n: number) => (
    <p style={{ fontFamily: serif, fontSize: '13px', fontStyle: 'italic', color: GOLD, margin: '0 0 6px' }}>
      Step {['one', 'two', 'three', 'four', 'five'][n - 1]}
    </p>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#fff',
    border: `1px solid ${HAIRLINE_STRONG}`,
    borderRadius: '6px',
    padding: '13px 16px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: INK,
    fontFamily: sans,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: INK,
    marginBottom: '8px',
    letterSpacing: '0.02em',
  }

  const uploadBox = (file: File | null, inputId: string, label: string, onChange: (f: File) => void) => (
    <div style={{ marginBottom: '20px' }}>
      {label && <p style={{ fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '10px', letterSpacing: '0.02em' }}>{label}</p>}
      <div
        onClick={() => document.getElementById(inputId)?.click()}
        style={{
          position: 'relative',
          border: `1.5px dashed ${file ? SEAL_GREEN : HAIRLINE_STRONG}`,
          borderRadius: '10px',
          padding: '32px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: file ? SEAL_GREEN_TINT : '#fff',
          transition: 'all 0.2s',
        }}
      >
        {file && (
          <>
            <span style={{ position: 'absolute', top: '8px', left: '8px', width: '10px', height: '10px', borderTop: `1.5px solid ${SEAL_GREEN}`, borderLeft: `1.5px solid ${SEAL_GREEN}` }} />
            <span style={{ position: 'absolute', bottom: '8px', right: '8px', width: '10px', height: '10px', borderBottom: `1.5px solid ${SEAL_GREEN}`, borderRight: `1.5px solid ${SEAL_GREEN}` }} />
          </>
        )}
        <input id={inputId} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]) }} />
        {file ? (
          <div>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: SEAL_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <span style={{ color: PAPER, fontSize: '15px' }}>✓</span>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: INK, margin: 0 }}>{file.name}</p>
            <p style={{ fontSize: '11px', color: MUTED, marginTop: '4px' }}>Click to replace</p>
          </div>
        ) : (
          <div>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', border: `1.5px dashed ${FAINT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <span style={{ color: FAINT, fontSize: '15px' }}>↑</span>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: INK, margin: 0 }}>Upload document</p>
            <p style={{ fontSize: '11px', color: FAINT, marginTop: '4px' }}>JPG, PNG or PDF, max 50MB</p>
          </div>
        )}
      </div>
    </div>
  )

  const btnPrimary = (text: string, onClick: () => void, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ width: '100%', backgroundColor: disabled ? '#ccc' : INK, color: PAPER, border: 'none', borderRadius: '6px', padding: '16px', fontSize: '14px', fontWeight: 600, letterSpacing: '0.02em', cursor: disabled ? 'not-allowed' : 'pointer', marginTop: '8px', fontFamily: sans }}
    >
      {text}
    </button>
  )

  const btnSecondary = (text: string, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{ width: '100%', backgroundColor: 'transparent', color: INK, border: `1.5px solid ${HAIRLINE}`, borderRadius: '6px', padding: '16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: sans }}
    >
      {text}
    </button>
  )

  const backBtn = (onClick: () => void) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: MUTED, marginBottom: '28px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: sans }}>
      ← Back
    </button>
  )

  const navBar = (label: string) => (
    <nav style={{ backgroundColor: PAPER, borderBottom: `1px solid ${HAIRLINE}`, padding: '0 clamp(16px, 4vw, 32px)', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <span style={{ fontFamily: serif, fontWeight: 700, fontSize: '20px', color: INK }}>Tutorverse</span>
      <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: SEAL_GREEN, fontWeight: 600, textTransform: 'uppercase' as const, border: `1px solid ${SEAL_GREEN}`, padding: '4px 10px', borderRadius: '3px' }}>{label}</span>
    </nav>
  )

  return (
    <main style={{ minHeight: '100vh', backgroundColor: PAPER, fontFamily: sans }}>
      {navBar('Verification')}

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>

        {step === 1 && (
          <div>
            {progressBar(1, 5)}
            {eyebrow(1)}
            <h1 style={{ fontFamily: serif, fontSize: '30px', fontWeight: 700, color: INK, margin: '0 0 10px', lineHeight: 1.2 }}>Let's verify your identity</h1>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '36px', lineHeight: 1.6 }}>Enter your details exactly as they appear on your South African ID document.</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Residence</label>
              <div style={{ backgroundColor: PAPER_TINT, border: `1px solid ${HAIRLINE}`, borderRadius: '6px', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'default' }}>
                <span>🇿🇦</span>
                <span style={{ flex: 1, fontSize: '14px' }}>South Africa</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Full name</label>
              <input
                type="text"
                placeholder="e.g. Daniel Wright"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Phone number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ backgroundColor: PAPER_TINT, border: `1px solid ${HAIRLINE}`, borderRadius: '6px', padding: '13px 14px', fontSize: '14px', color: MUTED, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  🇿🇦 +27
                </div>
                <input
                  type="tel"
                  placeholder="82 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <p style={{ fontSize: '11px', color: FAINT, marginTop: '6px' }}>We'll use this for SMS verification (coming soon).</p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={labelStyle}>South African ID number</label>
              <input
                type="text"
                placeholder="13-digit ID number"
                value={idNumber}
                onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setIdNumber(val) }}
                maxLength={13}
                style={{ ...inputStyle, letterSpacing: '2px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: idNumber.length === 13 ? SEAL_GREEN : FAINT, fontWeight: idNumber.length === 13 ? 600 : 400 }}>{idNumber.length} / 13</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: FAINT, marginBottom: '16px', textAlign: 'center', lineHeight: 1.6 }}>
              By continuing, I agree to the{' '}
              <a href="/terms" target="_blank" style={{ color: INK, fontWeight: 600, textDecoration: 'none' }}>Terms of Use</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" style={{ color: INK, fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>.
            </p>

            {btnPrimary('Continue', () => {
              if (!fullName || !phoneNumber || idNumber.length !== 13) {
                setStatusMsg('Please enter your full name, phone number, and a valid 13-digit ID number.')
                return
              }
              setStatusMsg('')
              setStep(2)
            })}
            {statusMsg && <p style={{ fontSize: '13px', color: DANGER, marginTop: '12px', textAlign: 'center' }}>{statusMsg}</p>}
          </div>
        )}

        {step === 2 && (
          <div>
            {progressBar(2, 5)}
            {backBtn(() => setStep(1))}
            {eyebrow(2)}
            <h1 style={{ fontFamily: serif, fontSize: '30px', fontWeight: 700, color: INK, margin: '0 0 10px', lineHeight: 1.2 }}>Upload your documents</h1>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '32px', lineHeight: 1.6 }}>Your ID and qualification certificate will be scanned automatically.</p>

            {uploadBox(idFront, 'idFrontInput', 'Front of ID', (f) => setIdFront(f))}
            {uploadBox(idBack, 'idBackInput', 'Back of ID', (f) => setIdBack(f))}

            <div style={{ backgroundColor: PAPER_TINT, borderRadius: '8px', padding: '14px 18px', marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', color: MUTED, marginBottom: '6px', fontWeight: 600 }}>ID requirements</p>
              {['Use the original ID; copies or screenshots are not accepted.', 'Ensure all information is clearly visible.', 'Turn off any beauty filters or photo enhancements.'].map((t, i) => (
                <p key={i} style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>◆ {t}</p>
              ))}
            </div>

            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: INK, marginBottom: '4px' }}>Qualification certificate</p>
              <p style={{ fontSize: '11px', color: FAINT, marginBottom: '10px' }}>Upload your degree, diploma, or teaching certificate.</p>
            </div>
            {uploadBox(qualFile, 'qualInput', '', (f) => setQualFile(f))}

            <div style={{ backgroundColor: PAPER_TINT, borderRadius: '8px', padding: '14px 18px', marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', color: MUTED, marginBottom: '6px', fontWeight: 600 }}>Certificate requirements</p>
              {['Must show your full name and institution name.', 'Accepted formats: JPG, PNG, PDF.', 'The document must be clear and legible.'].map((t, i) => (
                <p key={i} style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>◆ {t}</p>
              ))}
            </div>

            {btnPrimary('Continue', () => {
              if (!idFront) { setStatusMsg('Please upload the front of your ID.'); return }
              if (!qualFile) { setStatusMsg('Please upload your qualification certificate.'); return }
              setStatusMsg('')
              setStep(3)
            })}
            {statusMsg && <p style={{ fontSize: '13px', color: DANGER, marginTop: '12px', textAlign: 'center' }}>{statusMsg}</p>}
          </div>
        )}

        {step === 3 && (
          <div>
            {progressBar(3, 5)}
            {backBtn(() => setStep(2))}
            {eyebrow(3)}
            <h1 style={{ fontFamily: serif, fontSize: '30px', fontWeight: 700, color: INK, margin: '0 0 10px', lineHeight: 1.2 }}>Liveness check</h1>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '28px', lineHeight: 1.6 }}>Position your face inside the frame for a quick scan.</p>

            {cameraError ? (
              <div style={{ backgroundColor: PAPER_TINT, borderRadius: '12px', padding: 'clamp(20px, 5vw, 40px) 20px', textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '40px', marginBottom: '14px' }}>📷</div>
                <h2 style={{ fontFamily: serif, fontSize: '19px', fontWeight: 700, color: INK, marginBottom: '8px' }}>Camera access required</h2>
                <p style={{ fontSize: '13px', color: MUTED, marginBottom: '22px' }}>When prompted, please enable camera access to continue.</p>
                {btnPrimary('Enable camera', () => { setCameraError(false); startCamera() })}
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: INK, marginBottom: '24px' }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: 'min(220px, 60vw)', height: 'min(280px, 75vw)', border: `2px solid ${GOLD}`, borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(253,252,250,0.5)' }} />
                  </div>
                  {countdown !== null && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: serif, fontSize: '76px', fontWeight: 700, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                      {countdown}
                    </div>
                  )}
                </div>
                <div style={{ backgroundColor: PAPER_TINT, borderRadius: '8px', padding: '14px 18px', marginBottom: '24px' }}>
                  {['Your face and background will be recorded.', 'Maximize screen brightness.', 'Ensure you are in a well lit area.', 'No glasses, mask, or hat.'].map((t, i) => (
                    <p key={i} style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>◆ {t}</p>
                  ))}
                </div>
                {cameraReady && countdown === null && btnPrimary('Take selfie', takeSelfie)}
                {!cameraReady && <p style={{ textAlign: 'center', color: MUTED, fontSize: '13px' }}>Starting camera...</p>}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            {progressBar(4, 5)}
            {backBtn(() => setStep(3))}
            {eyebrow(4)}
            <h1 style={{ fontFamily: serif, fontSize: '30px', fontWeight: 700, color: INK, margin: '0 0 10px', lineHeight: 1.2 }}>Confirm your information</h1>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '28px', lineHeight: 1.6 }}>By continuing, you confirm that the captured personal data is accurate.</p>

            <div style={{ backgroundColor: '#fff', border: `1px solid ${HAIRLINE}`, borderRadius: '12px', padding: '8px 24px' }}>
              {[
                { label: 'Full name', value: fullName.toUpperCase() },
                { label: 'Phone number', value: phoneNumber ? `+27 ${phoneNumber}` : 'Not provided' },
                { label: 'South African ID number', value: idNumber },
                { label: 'Residence', value: '🇿🇦 South Africa' },
                { label: 'ID document', value: idFront ? `✓ ${idFront.name}` : 'Not uploaded' },
                { label: 'Qualification certificate', value: qualFile ? `✓ ${qualFile.name}` : 'Not uploaded' },
                { label: 'Selfie', value: selfieFile ? '✓ Captured' : 'Not taken' },
              ].map((row, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: i < arr.length - 1 ? `1px solid ${HAIRLINE}` : 'none' }}>
                  <span style={{ fontSize: '13px', color: MUTED }}>{row.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: INK, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px' }}>
              {btnPrimary('Submit for verification', handleSubmit)}
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ textAlign: 'center', paddingTop: '36px' }}>
            {progressBar(5, 5)}
            <div style={{ width: '64px', height: '64px', border: `2px solid ${HAIRLINE}`, borderTop: `2px solid ${SEAL_GREEN}`, borderRadius: '50%', margin: '0 auto 28px', animation: 'spin 1s linear infinite' }} />
            <h1 style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: INK, marginBottom: '10px' }}>Processing your verification</h1>
            <p style={{ fontSize: '13px', color: MUTED, marginBottom: '6px' }}>{loadingMsg || 'Please wait...'}</p>
            <p style={{ fontSize: '11px', color: FAINT }}>This may take up to 30 seconds</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === 6 && (
          <div>
            {validation?.duplicate ? (
              <div style={{ backgroundColor: validation.pendingExists ? GOLD_TINT : SEAL_GREEN_TINT, border: `1px solid ${validation.pendingExists ? GOLD_BORDER : SEAL_GREEN_BORDER}`, borderRadius: '14px', padding: '28px', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: `2px solid ${validation.pendingExists ? GOLD : SEAL_GREEN}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <span style={{ color: validation.pendingExists ? GOLD : SEAL_GREEN, fontSize: '26px' }}>{validation.pendingExists ? '⏳' : '✓'}</span>
                </div>
                <h2 style={{ fontFamily: serif, fontSize: '20px', fontWeight: 700, color: INK, marginBottom: '8px' }}>
                  {validation.pendingExists ? 'Verification already submitted' : 'You are already verified'}
                </h2>
                <p style={{ fontSize: '13px', color: MUTED, marginBottom: '20px', lineHeight: 1.6 }}>
                  {validation.pendingExists
                    ? 'You already have a verification pending review. Please wait for it to be processed before submitting again.'
                    : 'Your identity has already been verified. You can view your verified badge on your dashboard.'}
                </p>
                <button onClick={() => router.push('/dashboard')} style={{ backgroundColor: INK, color: PAPER, border: 'none', borderRadius: '8px', padding: '12px 28px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  View my dashboard →
                </button>
              </div>
            ) : (
              <>
                {(() => {
                  const allChecks = [
                    validation?.isValid, validation?.nameMatch, authenticity?.isAuthentic,
                    faceMatch?.match, qualResult?.nameMatched, qualResult?.institutionFound, kycResult?.verified,
                  ].filter(v => v !== undefined)
                  const passed = allChecks.filter(Boolean).length
                  const total = allChecks.length
                  const overallOk = passed >= Math.ceil(total * 0.6)
                  const ringColor = overallOk ? SEAL_GREEN : GOLD

                  return (
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                      <div style={{ width: '76px', height: '76px', borderRadius: '50%', border: `2px solid ${ringColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', position: 'relative' }}>
                        <span style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', border: `1px dashed ${GOLD}`, opacity: overallOk ? 1 : 0 }} />
                        <span style={{ color: ringColor, fontSize: '30px' }}>{overallOk ? '✓' : '⏳'}</span>
                      </div>
                      <p style={{ fontFamily: serif, fontSize: '13px', fontStyle: 'italic', color: GOLD, margin: '0 0 6px' }}>
                        {overallOk ? 'Verification complete' : 'Under review'}
                      </p>
                      <h1 style={{ fontFamily: serif, fontSize: '26px', fontWeight: 700, color: INK, marginBottom: '10px' }}>
                        {overallOk ? 'Looking good' : 'A closer look is needed'}
                      </h1>
                      <p style={{ fontSize: '13px', color: MUTED, marginBottom: '18px', lineHeight: 1.6, maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
                        {overallOk ? 'Your verification is nearly complete. An admin will review and confirm shortly.' : "Some checks need manual review. We'll notify you within 15 minutes."}
                      </p>
                      <div style={{ backgroundColor: HAIRLINE, borderRadius: '999px', height: '4px', overflow: 'hidden', maxWidth: '280px', margin: '0 auto 8px' }}>
                        <div style={{ width: `${(passed / total) * 100}%`, height: '100%', backgroundColor: ringColor, borderRadius: '999px', transition: 'width 0.5s ease' }} />
                      </div>
                      <p style={{ fontSize: '12px', color: FAINT }}>{passed} of {total} checks passed</p>
                    </div>
                  )
                })()}

                <div style={{ backgroundColor: '#fff', border: `1px solid ${HAIRLINE}`, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: FAINT, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '18px' }}>Verification checks</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'ID format', icon: validation?.isValid ? '✓' : '✗', status: validation?.isValid ? 'pass' : 'fail', detail: validation?.isValid ? 'Valid SA ID' : 'Invalid format', show: !!validation },
                      { label: 'Name match', icon: validation?.nameMatch ? '✓' : '⚠', status: validation?.nameMatch ? 'pass' : 'warn', detail: validation?.nameMatch ? 'Name verified' : 'Not found in doc', show: !!validation },
                      { label: 'Document', icon: authenticity?.isAuthentic ? '✓' : '✗', status: authenticity?.isAuthentic ? 'pass' : 'fail', detail: authenticity?.isAuthentic ? `Score ${authenticity.score}/100` : 'Document flagged', show: !!authenticity },
                      { label: 'Face match', icon: faceMatch?.match ? '✓' : '✗', status: faceMatch?.match ? 'pass' : 'fail', detail: faceMatch?.match ? `${faceMatch.confidence}% confidence` : 'No match found', show: !!faceMatch },
                      { label: 'Qualification', icon: qualResult?.nameMatched ? '✓' : '⚠', status: qualResult?.nameMatched ? 'pass' : 'warn', detail: qualResult?.qualificationType ? qualResult.qualificationType.charAt(0).toUpperCase() + qualResult.qualificationType.slice(1) : 'Unknown type', show: !!qualResult },
                      { label: 'Institution', icon: qualResult?.isAccredited ? '✓' : '⚠', status: qualResult?.isAccredited ? 'pass' : 'warn', detail: qualResult?.isAccredited ? 'Accredited' : 'Needs review', show: !!qualResult },
                      { label: 'Identity check', icon: kycResult?.verified ? '✓' : '⏳', status: kycResult?.verified ? 'pass' : 'warn', detail: kycResult?.verified ? 'Verified' : 'Pending review', show: !!kycResult },
                      { label: 'Date of birth', icon: validation?.details?.dateOfBirth ? '✓' : '⚠', status: validation?.details?.dateOfBirth ? 'pass' : 'warn', detail: validation?.details?.dateOfBirth || 'Not extracted', show: !!validation },
                    ].filter(c => c.show).map((check, i) => {
                      const colors = {
                        pass: { bg: SEAL_GREEN_TINT, border: SEAL_GREEN_BORDER, text: SEAL_GREEN },
                        warn: { bg: GOLD_TINT, border: GOLD_BORDER, text: '#85590B' },
                        fail: { bg: DANGER_TINT, border: DANGER_BORDER, text: DANGER },
                      }
                      const c = colors[check.status as keyof typeof colors]
                      return (
                        <div key={i} style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '12px 14px' }}>
                          <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 600, color: INK }}>{check.label}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: c.text }}>{check.detail}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {validation && (
                  <div style={{ backgroundColor: PAPER_TINT, borderRadius: '10px', padding: '18px 20px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: FAINT, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>ID details</p>
                    {[
                      { label: 'Date of birth', value: validation.details?.dateOfBirth || '—' },
                      { label: 'Gender', value: validation.details?.gender || '—' },
                      { label: 'Citizenship', value: validation.details?.citizenship || '—' },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 2 ? `1px solid ${HAIRLINE}` : 'none' }}>
                        <span style={{ fontSize: '13px', color: MUTED }}>{row.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: INK }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {qualResult?.flags && qualResult.flags.length > 0 && (
                  <div style={{ backgroundColor: DANGER_TINT, border: `1px solid ${DANGER_BORDER}`, borderRadius: '10px', padding: '14px 18px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: DANGER, marginBottom: '8px' }}>⚠ Flags detected</p>
                    {qualResult.flags.map((flag: string, i: number) => (
                      <p key={i} style={{ fontSize: '12px', color: DANGER, margin: '2px 0' }}>• {flag}</p>
                    ))}
                  </div>
                )}

                {kycResult && (
                  <div style={{ backgroundColor: PAPER_TINT, borderRadius: '10px', padding: '18px 20px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: FAINT, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Identity check</p>
                    {[
                      { label: 'Provider', value: kycResult.provider },
                      { label: 'Result', value: kycResult.verified ? '✓ Verified' : '⏳ Pending review', ok: kycResult.verified },
                      { label: 'Mode', value: kycResult.mode },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 2 ? `1px solid ${HAIRLINE}` : 'none' }}>
                        <span style={{ fontSize: '13px', color: MUTED }}>{row.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: (row as any).ok === false ? DANGER : INK }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: '8px' }}>
              {btnPrimary('View my dashboard →', () => router.push('/dashboard'))}
            </div>
            <div style={{ marginTop: '12px' }}>
              {btnSecondary('Start new verification', () => {
                setStep(1); setFullName(''); setIdNumber(''); setPhoneNumber(''); setIdFront(null); setIdBack(null)
                setQualFile(null); setSelfieFile(null); setValidation(null); setFaceMatch(null)
                setAuthenticity(null); setQualResult(null); setStatusMsg('')
              })}
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '11px', color: FAINT, marginTop: '48px', letterSpacing: '0.03em' }}>
          Protected under POPIA · © 2026 Tutorverse (Pty) Ltd
        </p>
      </div>
    </main>
  )
}
