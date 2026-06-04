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
    if (i % 2 === 0) {
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