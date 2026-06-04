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

  // If no API key, run in simulation mode
  if (!apiKey || apiKey === 'your_key_here') {
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
        note: 'Awaiting live sandbox credentials from Smile Identity'
      }
    }
  }

  // Real Smile Identity call when API key is available
  try {
    const response = await fetch('https://testapi.smileidentity.com/v1/id_verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        id_number: idNumber,
        full_name: fullName,
        country: 'ZA',
        id_type: 'NATIONAL_ID'
      })
    })

    const data = await response.json()

    return {
      verified: data.result?.ResultCode === '1012',
      message: data.result?.ResultText || 'Check complete',
      provider: 'Smile Identity',
      mode: 'sandbox',
      raw: data
    }
  } catch (error) {
    return {
      verified: false,
      message: 'KYC provider unreachable — please try again',
      provider: 'Smile Identity',
      mode: 'sandbox'
    }
  }
}