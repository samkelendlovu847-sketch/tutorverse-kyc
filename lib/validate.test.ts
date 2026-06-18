import { validateSAID } from './validate'

describe('validateSAID', () => {

  test('accepts a known valid SA ID', () => {
    const result = validateSAID('9001015009087')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('rejects an ID that is too short', () => {
    const result = validateSAID('123')
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toMatch(/13 digits/)
  })

  test('rejects an ID with letters', () => {
    const result = validateSAID('9001015009ABC')
    expect(result.isValid).toBe(false)
  })

  test('rejects an ID that fails the Luhn check', () => {
    const result = validateSAID('9001015009088')
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toMatch(/Luhn/)
  })

  test('extracts date of birth correctly', () => {
    const result = validateSAID('9001015009087')
    expect(result.details.dateOfBirth).toBe('1990-01-01')
  })

  test('extracts gender correctly', () => {
    const result = validateSAID('9001015009087')
    expect(result.details.gender).toBe('Male')
  })

  test('extracts citizenship correctly', () => {
    const result = validateSAID('9001015009087')
    expect(result.details.citizenship).toBe('SA Citizen')
  })

})