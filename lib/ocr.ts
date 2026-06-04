export async function extractTextFromImage(file: File): Promise<string> {
  try {
    const Tesseract = (await import('tesseract.js')).default
    const imageUrl = URL.createObjectURL(file)
    
    const result = await Tesseract.recognize(imageUrl, 'eng')
    URL.revokeObjectURL(imageUrl)
    return result.data.text
  } catch (err) {
    console.error('OCR error:', err)
    return ''
  }
}