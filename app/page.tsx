'use client'

import { extractTextFromImage } from '../lib/ocr'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { validateSAID, checkNameMatch } from '../lib/validate'

export default function Home() {
  const [fullName, setFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [qualFile, setQualFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [validation, setValidation] = useState<any>(null)
  const handleSubmit = async () => {
    if (!fullName || !idNumber || !idFile) {
      setStatus('Please fill in all required fields and upload your ID.')
      return
    }
    setLoading(true)
    setStatus('Submitting...')
    const text = await extractTextFromImage(idFile)
    setExtractedText(text)
    const validationResult = validateSAID(idNumber)
    const nameMatch = checkNameMatch(fullName, text)
    setValidation({ ...validationResult, nameMatch })
    const { error } = await supabase.from('verifications').insert([
      {
        full_name: fullName,
        id_number: idNumber,
        status: 'pending',
      },
    ])

    if (error) {
      setStatus('Something went wrong. Please try again.')
    } else {
      setStatus('Documents submitted successfully! We will verify your identity shortly.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Tutor Verification</h1>
          <p className="text-gray-500 mt-2">Submit your documents to get your Verified badge</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SA ID Number *</label>
            <input
              type="text"
              placeholder="13-digit ID number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              maxLength={13}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID or Passport Document *</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Accepted: JPG, PNG, PDF</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification Certificate (optional)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setQualFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>

          {status && (
            <div className={`text-sm text-center p-3 rounded-lg ${status.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {status}
            </div>
          )}
          {extractedText && (
  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
    <h3 className="text-sm font-semibold text-gray-700 mb-2">Text extracted from document:</h3>
    <p className="text-xs text-gray-600 whitespace-pre-wrap">{extractedText}</p>
  </div>
)}
{validation && (
  <div className={`mt-4 p-4 rounded-lg border ${validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
    <h3 className="text-sm font-semibold mb-2">ID Validation Result:</h3>
    {validation.isValid ? (
      <p className="text-green-700 text-sm">✅ ID number is valid</p>
    ) : (
      validation.errors.map((err: string, i: number) => (
        <p key={i} className="text-red-700 text-sm">❌ {err}</p>
      ))
    )}
    {validation.details.dateOfBirth && (
      <p className="text-sm mt-1">📅 Date of birth: {validation.details.dateOfBirth}</p>
    )}
    {validation.details.gender && (
      <p className="text-sm">👤 Gender: {validation.details.gender}</p>
    )}
    {validation.details.citizenship && (
      <p className="text-sm">🌍 Citizenship: {validation.details.citizenship}</p>
    )}
    <p className="text-sm mt-1">
      {validation.nameMatch ? '✅ Name found in document' : '⚠️ Name not found in document'}
    </p>
  </div>
)}
        </div>
      </div>
    </main>
  )
}