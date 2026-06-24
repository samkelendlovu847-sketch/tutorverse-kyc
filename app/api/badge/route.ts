import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role to bypass RLS — this is a server-side API
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const email = searchParams.get('email')

    // Must provide either user_id or email
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Missing required parameter: user_id or email' },
        { status: 400 }
      )
    }

    // API key check — other services must pass this header
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.TUTORVERSE_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let targetUserId = userId

    // If email provided, look up the user ID
    if (email && !userId) {
      const { data: userData } = await supabase.auth.admin.listUsers()
      const user = userData?.users?.find(u => u.email === email)
      if (!user) {
        return NextResponse.json({
          verified: false,
          status: 'not_found',
          message: 'No user found with that email'
        })
      }
      targetUserId = user.id
    }

    // Get latest verification for this user
    const { data: verification, error } = await supabase
      .from('verifications')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !verification) {
      return NextResponse.json({
        verified: false,
        status: 'not_submitted',
        message: 'No verification found for this user'
      })
    }

    // Get qualifications
    const { data: qualifications } = await supabase
      .from('qualifications')
      .select('qualification_type, institution_name, institution_verified, status')
      .eq('user_id', targetUserId)

    // Build response
    return NextResponse.json({
      verified: verification.status === 'verified',
      status: verification.status,
      user_id: targetUserId,
      full_name: verification.full_name,
      verified_at: verification.status === 'verified' ? verification.updated_at : null,
      submitted_at: verification.created_at,
      qualifications: qualifications?.map(q => ({
        type: q.qualification_type,
        institution: q.institution_name,
        accredited: q.institution_verified,
        status: q.status
      })) || [],
      badge: verification.status === 'verified' ? {
        label: 'Verified Tutor',
        color: '#38A169',
        icon: '✓'
      } : null
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}