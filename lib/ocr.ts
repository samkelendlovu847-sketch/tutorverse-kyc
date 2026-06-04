import Tesseract from 'tesseract.js'

export async function extractTextFromImage(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file)
  
  const result = await Tesseract.recognize(imageUrl, 'eng', {
    logger: (m) => console.log(m)
  })

  URL.revokeObjectURL(imageUrl)
  return result.data.text
}