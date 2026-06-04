export interface KYCResult {
  verified: boolean
  message: string
  provider: string
  raw?: any
}

export async function verifyWithProvider(
  idNumber: string,
  fullName: string
): Promise<KYCResult> {
  const apiKey = process.env.SMILE_IDENTITY_API_KEY

  if (!apiKey) {
    return {
      verified: false,
      message: 'KYC provider not configured — running in simulation mode',
      provider: 'simulation',
      raw: {
        simulated: true,
        id_number: idNumber,
        name: fullName,
        status: 'would_check_against_home_affairs'
      }
    }
  }

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
      provider: 'smile_identity',
      raw: data
    }
  } catch (error) {
    return {
      verified: false,
      message: 'KYC provider check failed — please try again',
      provider: 'smile_identity'
    }
  }
}