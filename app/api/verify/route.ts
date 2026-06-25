import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSAID } from '../../../lib/validate'

// Service role client — bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // API key check
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.TUTORVERSE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, full_name, id_number } = body

    // Validate required fields
    if (!user_id || !full_name || !id_number) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, full_name, id_number' },
        { status: 400 }
      )
    }

    // Validate SA ID number
    const validation = validateSAID(id_number)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        status: 'failed',
        reason: 'invalid_id_number',
        errors: validation.errors
      }, { status: 422 })
    }

    // Check for duplicate submission
    const { data: existing } = await supabase
      .from('verifications')
      .select('id, status')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing && existing.status === 'verified') {
      return NextResponse.json({
        success: false,
        status: 'already_verified',
        reason: 'This tutor is already verified',
        verification_id: existing.id
      }, { status: 409 })
    }

    // Hash the ID number before storing (POPIA compliance)
    const encoder = new TextEncoder()
    const data = encoder.encode(id_number)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const idNumberHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Insert verification record
    const { data: verification, error } = await supabase
      .from('verifications')
      .insert([{
        user_id,
        full_name,
        id_number: idNumberHash,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create verification record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      submission_id: verification.id,
      status: 'pending',
      message: 'Verification submitted successfully. Documents will be reviewed shortly.',
      id_validation: {
        valid: validation.isValid,
        date_of_birth: validation.details.dateOfBirth,
        gender: validation.details.gender,
        citizenship: validation.details.citizenship
      }
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // API key check
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.TUTORVERSE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: user_id' },
        { status: 400 }
      )
    }

    const { data: verification } = await supabase
      .from('verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!verification) {
      return NextResponse.json({
        found: false,
        status: 'not_submitted',
        message: 'No verification found for this user'
      })
    }

    return NextResponse.json({
      found: true,
      submission_id: verification.id,
      status: verification.status,
      full_name: verification.full_name,
      submitted_at: verification.created_at,
      verified: verification.status === 'verified'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}