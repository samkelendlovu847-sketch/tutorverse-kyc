export async function compareFaces(
  idFile: File,
  selfieFile: File
): Promise<{ match: boolean; confidence: number; message: string }> {
  try {
    const faceapi = await import('face-api.js')

    await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models')

    const idImage = await createImageElement(idFile)
    const selfieImage = await createImageElement(selfieFile)

    const idDetection = await faceapi
      .detectSingleFace(idImage, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()

    const selfieDetection = await faceapi
      .detectSingleFace(selfieImage, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!idDetection) {
      return { match: false, confidence: 0, message: 'No face detected in ID document' }
    }

    if (!selfieDetection) {
      return { match: false, confidence: 0, message: 'No face detected in selfie' }
    }

    const distance = faceapi.euclideanDistance(
      idDetection.descriptor,
      selfieDetection.descriptor
    )

    const confidence = Math.round((1 - distance) * 100)
    const match = distance < 0.5

    return {
      match,
      confidence: Math.max(0, confidence),
      message: match
        ? `Face match confirmed — ${confidence}% similarity`
        : `Face match failed — ${confidence}% similarity (threshold: 50%)`
    }
  } catch (error) {
    console.error('Face match error:', error)
    return { match: false, confidence: 0, message: 'Face comparison could not be completed' }
  }
}

function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}