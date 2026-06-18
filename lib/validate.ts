export interface ValidationResult {
  isValid: boolean
  errors: string[]
  details: {
    dateOfBirth?: string
    gender?: string
    citizenship?: string
  }
}

export function validateSAID(idNumber: string): ValidationResult {
  const errors: string[] = []
  const details: ValidationResult['details'] = {}

  // Check 1: must be exactly 13 digits
  if (!/^\d{13}$/.test(idNumber)) {
    errors.push('ID number must be exactly 13 digits')
    return { isValid: false, errors, details }
  }

  // Check 2: extract and validate date of birth
  const year = idNumber.substring(0, 2)
  const month = idNumber.substring(2, 4)
  const day = idNumber.substring(4, 6)
  const fullYear = parseInt(year) > 25 ? `19${year}` : `20${year}`
  const dateStr = `${fullYear}-${month}-${day}`
  const date = new Date(dateStr)

  if (isNaN(date.getTime()) || date > new Date()) {
    errors.push('ID number contains an invalid date of birth')
  } else {
    details.dateOfBirth = dateStr
  }

  // Check 3: gender
  const genderDigit = parseInt(idNumber.substring(6, 10))
  details.gender = genderDigit >= 5000 ? 'Male' : 'Female'

  // Check 4: citizenship
  const citizenDigit = idNumber.substring(10, 11)
  details.citizenship = citizenDigit === '0' ? 'SA Citizen' : 'Permanent Resident'

  // Check 5: Luhn algorithm
  const digits = idNumber.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    if (i % 2 !== 0) {
      sum += digits[i]
    } else {
      const doubled = digits[i] * 2
      sum += doubled > 9 ? doubled - 9 : doubled
    }
  }
  const checkDigit = (10 - (sum % 10)) % 10
  if (checkDigit !== digits[12]) {
    errors.push('ID number failed the Luhn check — it may be invalid or fake')
  }

  return {
    isValid: errors.length === 0,
    errors,
    details
  }
}

export function checkNameMatch(formName: string, extractedText: string): boolean {
  const nameParts = formName.toLowerCase().split(' ')
  const text = extractedText.toLowerCase()
  return nameParts.some(part => part.length > 2 && text.includes(part))
}
export interface AuthenticityResult {
  isAuthentic: boolean
  score: number
  flags: string[]
}

export function checkDocumentAuthenticity(
  file: File,
  extractedText: string
): AuthenticityResult {
  const flags: string[] = []
  let score = 100

  // Check 1: file size too small (likely fake or screenshot)
  if (file.size < 10000) {
    flags.push('File size is suspiciously small')
    score -= 30
  }

  // Check 2: file size too large (likely altered or padded)
  if (file.size > 10000000) {
    flags.push('File size is unusually large')
    score -= 10
  }

  // Check 3: check file type is image or pdf
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  if (!validTypes.includes(file.type)) {
    flags.push('Invalid file type detected')
    score -= 40
  }

  // Check 4: extracted text too short (blank or unreadable document)
  if (extractedText.length < 20) {
    flags.push('Document appears blank or unreadable')
    score -= 20
  }

  // Check 5: check for SA ID number pattern in extracted text
  const idPattern = /\d{13}/
  if (extractedText && !idPattern.test(extractedText)) {
    flags.push('No ID number pattern found in document')
    score -= 15
  }

  // Check 6: check for suspicious keywords
  const suspiciousKeywords = ['copy', 'specimen', 'sample', 'void', 'fake', 'test']
  const lowerText = extractedText.toLowerCase()
  suspiciousKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      flags.push(`Suspicious keyword detected: "${keyword}"`)
      score -= 25
    }
  })

  return {
    isAuthentic: score >= 60,
    score: Math.max(0, score),
    flags
  }
}