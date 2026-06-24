// Qualification Verification System
// Checks institution name, qualification type, and name match

// List of accredited SA institutions (DHET registered)
const ACCREDITED_INSTITUTIONS = [
  // Universities
  'university of cape town', 'uct',
  'university of the witwatersrand', 'wits',
  'stellenbosch university', 'sun',
  'university of pretoria', 'up', 'tuks',
  'university of kwazulu-natal', 'ukzn',
  'university of johannesburg', 'uj',
  'rhodes university',
  'university of the free state', 'ufs',
  'north-west university', 'nwu',
  'university of limpopo', 'ul',
  'university of venda', 'univen',
  'university of zululand', 'unizulu',
  'walter sisulu university', 'wsu',
  'university of fort hare', 'ufh',
  'nelson mandela university', 'nmu',
  'cape peninsula university of technology', 'cput',
  'durban university of technology', 'dut',
  'tshwane university of technology', 'tut',
  'vaal university of technology', 'vut',
  'central university of technology', 'cut',
  'mangosuthu university of technology', 'mut',
  'sol plaatje university', 'spu',
  'university of mpumalanga', 'ump',
  // TVET Colleges
  'false bay tvet', 'boland tvet', 'west coast tvet',
  'ekurhuleni east tvet', 'ekurhuleni west tvet',
  'tshwane north tvet', 'tshwane south tvet',
  // SACE registered
  'sace', 'south african council for educators',
]

// Qualification type keywords
const QUALIFICATION_TYPES: Record<string, string[]> = {
  'degree': ['bachelor', 'bsc', 'ba ', 'bcom', 'beng', 'bed', 'btech', 'honours', 'hons', 'masters', 'msc', 'phd', 'doctorate'],
  'diploma': ['diploma', 'higher diploma', 'advanced diploma', 'national diploma', 'nd '],
  'certificate': ['certificate', 'national certificate', 'nc(v)', 'short course'],
  'teaching': ['pgce', 'postgraduate certificate in education', 'bed', 'higher diploma in education', 'hde', 'advanced certificate in teaching', 'act'],
}

export interface QualificationAnalysis {
  institutionFound: boolean
  institutionName: string | null
  qualificationType: string | null
  nameMatched: boolean
  yearFound: string | null
  isAccredited: boolean
  confidence: number // 0-100
  flags: string[]
  status: 'verified' | 'review_needed' | 'failed'
}

export function analyseQualification(
  ocrText: string,
  submittedName: string
): QualificationAnalysis {
  const text = ocrText.toLowerCase()
  const flags: string[] = []
  let confidence = 0

  // Check 1 — name match
  const nameParts = submittedName.toLowerCase().split(' ').filter(p => p.length > 2)
  const nameMatched = nameParts.some(part => text.includes(part))
  if (nameMatched) confidence += 30
  else flags.push('Submitted name not found in certificate')

  // Check 2 — institution check
  let institutionFound = false
  let institutionName: string | null = null
  let isAccredited = false

  for (const institution of ACCREDITED_INSTITUTIONS) {
    if (text.includes(institution)) {
      institutionFound = true
      isAccredited = true
      institutionName = institution
      confidence += 30
      break
    }
  }

  // If no accredited institution found, check for any university/college mention
  if (!institutionFound) {
    const genericTerms = ['university', 'college', 'institute', 'school', 'academy', 'technikon']
    for (const term of genericTerms) {
      if (text.includes(term)) {
        institutionFound = true
        institutionName = term
        confidence += 10
        flags.push('Institution not in accredited list — manual verification needed')
        break
      }
    }
  }

  if (!institutionFound) {
    flags.push('No institution name found in document')
  }

  // Check 3 — qualification type
  let qualificationType: string | null = null
  for (const [type, keywords] of Object.entries(QUALIFICATION_TYPES)) {
    if (keywords.some(kw => text.includes(kw))) {
      qualificationType = type
      confidence += 20
      break
    }
  }
  if (!qualificationType) {
    flags.push('Could not determine qualification type')
  }

  // Check 4 — year
  const yearMatch = ocrText.match(/\b(19|20)\d{2}\b/)
  const yearFound = yearMatch ? yearMatch[0] : null
  if (yearFound) {
    confidence += 10
    const year = parseInt(yearFound)
    if (year > new Date().getFullYear()) {
      flags.push('Year appears to be in the future')
      confidence -= 20
    }
  } else {
    flags.push('No year found in document')
  }

  // Check 5 — document length
  if (ocrText.length < 50) {
    flags.push('Document appears mostly unreadable')
    confidence -= 20
  } else {
    confidence += 10
  }

  // Determine status
  const finalConfidence = Math.max(0, Math.min(100, confidence))
  let status: 'verified' | 'review_needed' | 'failed'
  if (finalConfidence >= 60 && nameMatched && institutionFound) {
    status = 'verified'
  } else if (finalConfidence >= 30) {
    status = 'review_needed'
  } else {
    status = 'failed'
  }

  return {
    institutionFound,
    institutionName,
    qualificationType,
    nameMatched,
    yearFound,
    isAccredited,
    confidence: finalConfidence,
    flags,
    status
  }
}