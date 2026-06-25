'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verifyWithProvider } from '../lib/kyc'
import { supabase } from '../lib/supabase'
import { extractTextFromImage } from '../lib/ocr'
import { validateSAID, checkNameMatch, checkDocumentAuthenticity } from '../lib/validate'
import { compareFaces } from '../lib/faceMatch'

const DARK = '#000000'
const CARD = '#F8F9FA'
const BORDER = '#E5E5E5'
const TEXT = '#000000'
const MUTED = '#888888'

const analyseQualification = (ocrText: string, fullName: string) => {
  const text = ocrText || ''
  const lower = text.toLowerCase()
  const nameMatched = fullName && text.toLowerCase().includes(fullName.toLowerCase())
  const institutionMatch = text.match(/\b([A-Z][A-Za-z]*(?:\s+(?:University|College|Institute|Academy|School|Polytechnic|Faculty|Campus|Technikon)))(?:\b|,)/i)
  const institutionName = institutionMatch ? institutionMatch[1] : ''
  const qualificationType = lower.includes('degree')
    ? 'degree'
    : lower.includes('diploma')
      ? 'diploma'
      : lower.includes('certificate')
        ? 'certificate'
        : ''
  const yearMatch = text.match(/\b(19|20)\d{2}\b/)
  const yearFound = yearMatch ? yearMatch[0] : ''
  const isAccredited = /accredit|registered|saqa|che|heqc|technikon/i.test(text)
  const status = nameMatched && qualificationType ? 'verified' : 'review_needed'
  const confidence = Math.min(100, (nameMatched ? 40 : 0) + (qualificationType ? 30 : 0) + (yearFound ? 20 : 0) + (isAccredited ? 10 : 0))
  const flags: string[] = []
  if (!nameMatched) flags.push('Name not found on certificate')
  if (!institutionName) flags.push('Institution not detected')
  if (!qualificationType) flags.push('Qualification type not identified')
  if (!yearFound) flags.push('Year not found')
  return {
    institutionName,
    qualificationType,
    nameMatched,
    institutionFound: !!institutionName,
    isAccredited,
    yearFound,
    status,
    confidence,
    flags,
  }
}

export default function Home() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')
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

  // Auth guard
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

    // Check for duplicate submission
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

    // OCR on ID document
    setLoadingMsg('Reading your ID document...')
    let idText = ''
    try {
      if (idFront) idText = await extractTextFromImage(idFront)
    } catch { }

    // OCR on qualification certificate
    setLoadingMsg('Reading your qualification certificate...')
    try {
      if (qualFile) {
        const qualText = await extractTextFromImage(qualFile)
        const analysis = analyseQualification(qualText, fullName)
        setQualResult(analysis)

        // Save to Supabase qualifications table (POPIA: only first 500 chars of OCR)
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

    // Validate SA ID
    setLoadingMsg('Validating ID number...')
    const validationResult = validateSAID(idNumber)
    const nameMatch = checkNameMatch(fullName, idText)
    setValidation({ ...validationResult, nameMatch })

    // Authenticity check
    if (idFront) {
      setLoadingMsg('Checking document authenticity...')
      const auth = checkDocumentAuthenticity(idFront, idText)
      setAuthenticity(auth)
    }

    // Face match
    if (selfieFile && idFront) {
      setLoadingMsg('Running face match...')
      try {
        const face = await compareFaces(idFront, selfieFile)
        setFaceMatch(face)
      } catch { }
    }

    // KYC provider check
    setLoadingMsg('Checking against authoritative source...')
    const kycCheck = await verifyWithProvider(idNumber, fullName)
    setKycResult(kycCheck)

    // Save to Supabase
    setLoadingMsg('Saving submission...')
    const finalStatus = kycCheck.verified ? 'verified' : 'pending'

    // POPIA: hash the ID number before storing
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
      user_id: session?.user?.id
    }])

    setLoading(false)
    setLoadingMsg('')
    setStep(6)
  }

  const progressBar = (current: number, total: number) => (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '40px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: i < current ? DARK : BORDER, transition: 'background-color 0.3s' }} />
      ))}
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: '8px',
    padding: '14px 16px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    color: TEXT,
    fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: TEXT,
    marginBottom: '8px',
  }

  const uploadBox = (file: File | null, inputId: string, label: string, onChange: (f: File) => void) => (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '13px', fontWeight: 600, color: MUTED, marginBottom: '10px' }}>{label}</p>
      <div
        onClick={() => document.getElementById(inputId)?.click()}
        style={{ border: `2px dashed ${file ? DARK : BORDER}`, borderRadius: '12px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', backgroundColor: file ? '#f9f9f9' : '#fff', transition: 'all 0.2s' }}
      >
        <input id={inputId} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]) }} />
        {file ? (
          <div>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: DARK }}>{file.name}</p>
            <p style={{ fontSize: '12px', color: MUTED, marginTop: '4px' }}>Click to replace</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⬆</div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: DARK }}>Upload</p>
            <p style={{ fontSize: '12px', color: MUTED, marginTop: '4px' }}>Max 50 MB in .jpg/.jpeg/.png format</p>
          </div>
        )}
      </div>
    </div>
  )

  const btnPrimary = (text: string, onClick: () => void, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ width: '100%', backgroundColor: disabled ? '#ccc' : DARK, color: '#fff', border: 'none', borderRadius: '8px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', marginTop: '8px' }}
    >
      {text}
    </button>
  )

  const backBtn = (onClick: () => void) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: MUTED, marginBottom: '28px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
      ← Back
    </button>
  )

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Nav */}
      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: DARK }}>✕</span>
          <span style={{ color: DARK, fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px' }}>Tutorverse</span>
        </div>
        <span style={{ color: MUTED, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>KYC Verification</span>
      </nav>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px' }}>

        {/* STEP 1 — Personal Info */}
        {step === 1 && (
          <div>
            {progressBar(1, 5)}
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>Let's Get You Verified</h1>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '36px' }}>Enter your details exactly as they appear on your South African ID.</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Residence</label>
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'default' }}>
                <span>🇿🇦</span>
                <span style={{ flex: 1 }}>South Africa</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Daniel Wright"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={labelStyle}>South African ID Number</label>
              <input
                type="text"
                placeholder="13-digit ID number"
                value={idNumber}
                onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setIdNumber(val) }}
                maxLength={13}
                style={{ ...inputStyle, letterSpacing: '2px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: idNumber.length === 13 ? DARK : MUTED }}>{idNumber.length} / 13</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: MUTED, marginBottom: '16px', textAlign: 'center' }}>
              By continuing, I agree to the <span style={{ color: DARK, fontWeight: 600, cursor: 'pointer' }}>Terms of Use</span> and <span style={{ color: DARK, fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>.
            </p>

            {btnPrimary('Continue', () => {
              if (!fullName || idNumber.length !== 13) {
                setStatusMsg('Please enter your full name and a valid 13-digit ID number.')
                return
              }
              setStatusMsg('')
              setStep(2)
            })}
            {statusMsg && <p style={{ fontSize: '13px', color: '#e53e3e', marginTop: '12px', textAlign: 'center' }}>{statusMsg}</p>}
          </div>
        )}

        {/* STEP 2 — Document Upload */}
        {step === 2 && (
          <div>
            {progressBar(2, 5)}
            {backBtn(() => setStep(1))}
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>Upload your documents</h1>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '36px' }}>Upload your ID and qualification certificate. Both will be scanned automatically.</p>

            {uploadBox(idFront, 'idFrontInput', 'Front side of ID Card', (f) => setIdFront(f))}
            {uploadBox(idBack, 'idBackInput', 'Back side of ID Card', (f) => setIdBack(f))}

            <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: MUTED, marginBottom: '6px', fontWeight: 600 }}>ID Requirements</p>
              {['Please use the original ID; copies or screenshots are not accepted.', 'Ensure all information is visible; damaged or expired IDs are not accepted.', 'Turn off any beauty filters or photo enhancements.'].map((t, i) => (
                <p key={i} style={{ fontSize: '13px', color: MUTED, marginBottom: '4px' }}>◆ {t}</p>
              ))}
            </div>

            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '4px' }}>Qualification Certificate</p>
              <p style={{ fontSize: '12px', color: MUTED, marginBottom: '10px' }}>Upload your degree, diploma, or teaching certificate.</p>
            </div>
            {uploadBox(qualFile, 'qualInput', '', (f) => setQualFile(f))}

            <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: MUTED, marginBottom: '6px', fontWeight: 600 }}>Certificate Requirements</p>
              {['Must show your full name and the institution name.', 'Accepted formats: .jpg, .jpeg, .png, .pdf.', 'The document must be clear and legible.'].map((t, i) => (
                <p key={i} style={{ fontSize: '13px', color: MUTED, marginBottom: '4px' }}>◆ {t}</p>
              ))}
            </div>

            {btnPrimary('Continue', () => {
              if (!idFront) { setStatusMsg('Please upload the front of your ID.'); return }
              if (!qualFile) { setStatusMsg('Please upload your qualification certificate.'); return }
              setStatusMsg('')
              setStep(3)
            })}
            {statusMsg && <p style={{ fontSize: '13px', color: '#e53e3e', marginTop: '12px', textAlign: 'center' }}>{statusMsg}</p>}
          </div>
        )}

        {/* STEP 3 — Liveness Check */}
        {step === 3 && (
          <div>
            {progressBar(3, 5)}
            {backBtn(() => setStep(2))}
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>Liveness Check</h1>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '32px' }}>Position your face inside the oval for a quick scan.</p>

            {cameraError ? (
              <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '40px 20px', textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>Camera access required</h2>
                <p style={{ fontSize: '14px', color: MUTED, marginBottom: '24px' }}>When prompted, please enable camera access to continue.</p>
                {btnPrimary('Enable camera', () => { setCameraError(false); startCamera() })}
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '24px' }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: '220px', height: '280px', border: `3px solid ${DARK}`, borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(255,255,255,0.5)' }} />
                  </div>
                  {countdown !== null && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '80px', fontWeight: 700, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                      {countdown}
                    </div>
                  )}
                </div>
                <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
                  {['Your face and background will be recorded.', 'Maximize screen brightness.', 'Ensure you are in a well lit area.', 'No glasses, mask, or hat.'].map((t, i) => (
                    <p key={i} style={{ fontSize: '13px', color: MUTED, marginBottom: '4px' }}>◆ {t}</p>
                  ))}
                </div>
                {cameraReady && countdown === null && btnPrimary('📸 Take selfie', takeSelfie)}
                {!cameraReady && <p style={{ textAlign: 'center', color: MUTED, fontSize: '14px' }}>Starting camera...</p>}
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — Confirm Information */}
        {step === 4 && (
          <div>
            {progressBar(4, 5)}
            {backBtn(() => setStep(3))}
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>Confirm Information</h1>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '32px' }}>By continuing, you agree that the below captured personal data is accurate.</p>

            <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              {[
                { label: 'Full Name', value: fullName.toUpperCase() },
                { label: 'South African ID Number', value: idNumber },
                { label: 'Residence', value: '🇿🇦 South Africa' },
                { label: 'ID Document', value: idFront ? `✓ ${idFront.name}` : 'Not uploaded' },
                { label: 'Qualification Certificate', value: qualFile ? `✓ ${qualFile.name}` : 'Not uploaded' },
                { label: 'Selfie', value: selfieFile ? '✓ Captured' : 'Not taken' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 5 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ fontSize: '14px', color: MUTED }}>{row.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: DARK }}>{row.value}</span>
                </div>
              ))}
            </div>

            {btnPrimary('Submit for Verification', handleSubmit)}
          </div>
        )}

        {/* STEP 5 — Processing */}
        {step === 5 && (
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            {progressBar(5, 5)}
            <div style={{ width: '80px', height: '80px', border: `4px solid ${BORDER}`, borderTop: `4px solid ${DARK}`, borderRadius: '50%', margin: '0 auto 32px', animation: 'spin 1s linear infinite' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: DARK, marginBottom: '12px' }}>Processing your verification</h1>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '8px' }}>{loadingMsg || 'Please wait...'}</p>
            <p style={{ fontSize: '12px', color: MUTED }}>This may take up to 30 seconds</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* STEP 6 — Result */}
        {step === 6 && (
          {/* Duplicate submission notice */}
            {validation?.duplicate && (
              <div style={{ backgroundColor: validation.pendingExists ? '#FFFFF0' : '#F0FFF4', border: `1px solid ${validation.pendingExists ? '#FAF089' : '#C6F6D5'}`, borderRadius: '16px', padding: '28px', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {validation.pendingExists ? '⏳' : '✓'}
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>
                  {validation.pendingExists ? 'Verification Already Submitted' : 'You Are Already Verified!'}
                </h2>
                <p style={{ fontSize: '14px', color: MUTED, marginBottom: '20px' }}>
                  {validation.pendingExists
                    ? 'You already have a verification pending review. Please wait for it to be processed before submitting again.'
                    : 'Your identity has already been verified. You can view your verified badge on your dashboard.'
                  }
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  style={{ backgroundColor: DARK, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  View my dashboard →
                </button>
              </div>
            )}

          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '72px', height: '72px', backgroundColor: DARK, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <span style={{ color: '#fff', fontSize: '32px' }}>⏳</span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>Under Review</h1>
              <p style={{ fontSize: '14px', color: MUTED, marginBottom: '4px' }}>Estimated review time: 15 Minute(s)</p>
              <p style={{ fontSize: '13px', color: MUTED }}>You will receive a notification once the review is completed.</p>
            </div>

            {validation && (
              <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '14px' }}>ID Verification Summary</p>
                {[
                  { label: 'ID format', value: validation.isValid ? '✓ Valid' : '✗ Invalid', ok: validation.isValid },
                  { label: 'Date of birth', value: validation.details?.dateOfBirth || '—', ok: true },
                  { label: 'Gender', value: validation.details?.gender || '—', ok: true },
                  { label: 'Citizenship', value: validation.details?.citizenship || '—', ok: true },
                  { label: 'Name match', value: validation.nameMatch ? '✓ Matched' : '⚠ Not found', ok: validation.nameMatch },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? `1px solid ${BORDER}` : 'none' }}>
                    <span style={{ fontSize: '14px', color: MUTED }}>{row.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: row.ok ? DARK : '#e53e3e' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {qualResult && (
              <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '14px' }}>Qualification Certificate</p>
                {[
                  { label: 'Name found', value: qualResult.nameMatched ? '✓ Matched' : '⚠ Not found', ok: qualResult.nameMatched },
                  { label: 'Institution', value: qualResult.institutionName ? qualResult.institutionName.charAt(0).toUpperCase() + qualResult.institutionName.slice(1) : '⚠ Not detected', ok: qualResult.institutionFound },
                  { label: 'Accredited', value: qualResult.isAccredited ? '✓ Yes' : '⚠ Unconfirmed', ok: qualResult.isAccredited },
                  { label: 'Qualification type', value: qualResult.qualificationType ? qualResult.qualificationType.charAt(0).toUpperCase() + qualResult.qualificationType.slice(1) : '⚠ Unknown', ok: !!qualResult.qualificationType },
                  { label: 'Year', value: qualResult.yearFound || '⚠ Not found', ok: !!qualResult.yearFound },
                  { label: 'Confidence', value: `${qualResult.confidence}/100`, ok: qualResult.confidence >= 60 },
                  { label: 'Status', value: qualResult.status === 'verified' ? '✓ Verified' : qualResult.status === 'review_needed' ? '⚠ Needs review' : '✗ Failed', ok: qualResult.status === 'verified' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 6 ? `1px solid ${BORDER}` : 'none' }}>
                    <span style={{ fontSize: '14px', color: MUTED }}>{row.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: row.ok ? DARK : '#e53e3e' }}>{row.value}</span>
                  </div>
                ))}
                {qualResult.flags && qualResult.flags.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#FFF5F5', borderRadius: '8px' }}>
                    {qualResult.flags.map((flag: string, i: number) => (
                      <p key={i} style={{ fontSize: '12px', color: '#C53030', margin: '2px 0' }}>⚠ {flag}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {authenticity && (
              <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '14px' }}>Document Authenticity</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: '14px', color: MUTED }}>Result</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: authenticity.isAuthentic ? DARK : '#e53e3e' }}>{authenticity.isAuthentic ? '✓ Appears genuine' : '✗ Flagged'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                  <span style={{ fontSize: '14px', color: MUTED }}>Score</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: DARK }}>{authenticity.score}/100</span>
                </div>
              </div>
            )}

            {faceMatch && (
              <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '14px' }}>Face Match</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: '14px', color: MUTED }}>Result</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: faceMatch.match ? DARK : '#e53e3e' }}>{faceMatch.match ? '✓ Match confirmed' : '✗ No match'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                  <span style={{ fontSize: '14px', color: MUTED }}>Confidence</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: DARK }}>{faceMatch.confidence}%</span>
                </div>
              </div>
            )}

            {kycResult && (
              <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '14px' }}>Identity Check</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: '14px', color: MUTED }}>Provider</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: DARK }}>{kycResult.provider}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: '14px', color: MUTED }}>Result</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: kycResult.verified ? DARK : '#e53e3e' }}>{kycResult.verified ? '✓ Verified' : '⏳ Pending review'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                  <span style={{ fontSize: '14px', color: MUTED }}>Mode</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: MUTED }}>{kycResult.mode}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              style={{ width: '100%', backgroundColor: DARK, color: '#fff', border: 'none', borderRadius: '8px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }}
            >
              View my dashboard →
            </button>

            <button
              onClick={() => { setStep(1); setFullName(''); setIdNumber(''); setIdFront(null); setIdBack(null); setQualFile(null); setSelfieFile(null); setValidation(null); setFaceMatch(null); setAuthenticity(null); setQualResult(null); setStatusMsg('') }}
              style={{ width: '100%', backgroundColor: '#fff', color: DARK, border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '16px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              Start new verification
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '12px', color: MUTED, marginTop: '48px' }}>
          Protected by POPIA · © 2026 Tutorverse (Pty) Ltd
        </p>
      </div>
    </main>
  )
}