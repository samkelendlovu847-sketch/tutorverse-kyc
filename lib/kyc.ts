export interface KYCResult {
  verified: boolean
  message: string
  provider: string
  mode: string
  raw?: any
}

export async function verifyWithProvider(
  idNumber: string,
  fullName: string
): Promise<KYCResult> {
  const apiKey = process.env.SMILE_IDENTITY_API_KEY
  const partnerId = process.env.SMILE_IDENTITY_PARTNER_ID

  // Simulation mode — no credentials configured
  if (!apiKey || apiKey === 'your_key_here' || !partnerId) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const isValidFormat = /^\d{13}$/.test(idNumber)
    return {
      verified: isValidFormat,
      message: isValidFormat
        ? 'Identity check passed — simulated Home Affairs lookup'
        : 'Identity check failed — invalid ID format',
      provider: 'Smile Identity',
      mode: 'sandbox_simulation',
      raw: {
        simulated: true,
        id_number: idNumber,
        full_name: fullName,
        country: 'ZA',
        id_type: 'NATIONAL_ID',
        result: isValidFormat ? 'PASS' : 'FAIL',
        note: 'Awaiting live sandbox credentials from Smile Identity',
      },
    }
  }

  // Real Smile Identity v1 ID verification
  try {
    const [firstName, ...rest] = fullName.trim().split(' ')
    const lastName = rest.join(' ') || firstName

    const payload = {
      partner_id: partnerId,
      api_key: apiKey,
      country: 'ZA',
      id_type: 'NATIONAL_ID',
      id_number: idNumber,
      first_name: firstName,
      last_name: lastName,
      timestamp: new Date().toISOString(),
    }

    const response = await fetch('https://testapi.smileidentity.com/v1/id_verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Smile Identity error:', errorText)
      return {
        verified: false,
        message: 'Identity provider returned an error — pending manual review',
        provider: 'Smile Identity',
        mode: 'sandbox',
        raw: { error: errorText },
      }
    }

    const data = await response.json()
    const verified = data?.result?.ResultCode === '1012'

    return {
      verified,
      message: data?.result?.ResultText || (verified ? 'Identity verified' : 'No match found'),
      provider: 'Smile Identity',
      mode: 'sandbox',
      raw: data,
    }
  } catch (error) {
    console.error('KYC provider error:', error)
    return {
      verified: false,
      message: 'KYC provider unreachable — falling back to manual review',
      provider: 'Smile Identity',
      mode: 'sandbox',
    }
  }
}