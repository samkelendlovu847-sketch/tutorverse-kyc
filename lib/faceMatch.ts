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

    // Use more tolerant detection options
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.3
    })

    // Try detecting from full image first
    let idDetection = await faceapi
      .detectSingleFace(idImage, options)
      .withFaceLandmarks()
      .withFaceDescriptor()

    // If no face found in ID, try with lower threshold
    if (!idDetection) {
      const looseOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 608,
        scoreThreshold: 0.2
      })
      idDetection = await faceapi
        .detectSingleFace(idImage, looseOptions)
        .withFaceLandmarks()
        .withFaceDescriptor()
    }

    const selfieDetection = await faceapi
      .detectSingleFace(selfieImage, options)
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!idDetection && !selfieDetection) {
      return {
        match: false,
        confidence: 0,
        message: 'No face detected in either image — try a clearer photo'
      }
    }

    if (!idDetection) {
      return {
        match: false,
        confidence: 0,
        message: 'No face detected in ID document — ensure the photo is clear and well lit'
      }
    }

    if (!selfieDetection) {
      return {
        match: false,
        confidence: 0,
        message: 'No face detected in selfie — ensure your face is clearly visible'
      }
    }

    const distance = faceapi.euclideanDistance(
      idDetection.descriptor,
      selfieDetection.descriptor
    )

    // More generous threshold — 0.6 instead of 0.5
    const match = distance < 0.6
    const confidence = Math.round(Math.max(0, (1 - distance) * 100))

    return {
      match,
      confidence,
      message: match
        ? `Face match confirmed — ${confidence}% similarity`
        : `Face match failed — ${confidence}% similarity`
    }
  } catch (error) {
    console.error('Face match error:', error)
    return {
      match: false,
      confidence: 0,
      message: 'Face comparison could not be completed'
    }
  }
}

function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}