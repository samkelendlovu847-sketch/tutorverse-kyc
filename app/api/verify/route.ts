import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { validateSAID } from '../../../lib/validate'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const idNumber = searchParams.get('id_number')

  if (!idNumber) {
    return NextResponse.json(
      { error: 'id_number is required' },
      { status: 400 }
    )
  }

  const validation = validateSAID(idNumber)

  const { data, error } = await supabase
    .from('verifications')
    .select('*')
    .eq('id_number', idNumber)
    .single()

  if (error || !data) {
    return NextResponse.json({
      id_number: idNumber,
      status: 'not_found',
      valid_format: validation.isValid,
      message: 'No verification record found for this ID number'
    })
  }

  return NextResponse.json({
    id_number: idNumber,
    full_name: data.full_name,
    status: data.status,
    valid_format: validation.isValid,
    details: validation.details,
    message: data.status === 'pending'
      ? 'Verification is pending review'
      : data.status === 'verified'
      ? 'Tutor is verified'
      : 'Verification failed'
  })
}