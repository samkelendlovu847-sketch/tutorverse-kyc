let modelsLoaded = false

async function loadModels(faceapi: any): Promise<boolean> {
  if (modelsLoaded) return true
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ])
    modelsLoaded = true
    return true
  } catch (err) {
    console.error('face-api.js model load failed:', err)
    return false
  }
}

export async function compareFaces(
  idFile: File,
  selfieFile: File
): Promise<{ match: boolean; confidence: number; message: string }> {
  try {
    const faceapi = await import('face-api.js')

    const loaded = await loadModels(faceapi)
    if (!loaded) {
      return {
        match: false,
        confidence: 0,
        message: 'Face matching models could not be loaded — check /public/models',
      }
    }

    const idImage = await createImageElement(idFile)
    const selfieImage = await createImageElement(selfieFile)

    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.3,
    })

    let idDetection = await faceapi
      .detectSingleFace(idImage, options)
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!idDetection) {
      const looseOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 608,
        scoreThreshold: 0.2,
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
      return { match: false, confidence: 0, message: 'No face detected in either image — try a clearer photo' }
    }
    if (!idDetection) {
      return { match: false, confidence: 0, message: 'No face detected in ID — ensure the photo is clear and well lit' }
    }
    if (!selfieDetection) {
      return { match: false, confidence: 0, message: 'No face detected in selfie — ensure your face is clearly visible' }
    }

    const distance = faceapi.euclideanDistance(
      idDetection.descriptor,
      selfieDetection.descriptor
    )

    const match = distance < 0.6
    const confidence = Math.round(Math.max(0, (1 - distance) * 100))

    return {
      match,
      confidence,
      message: match
        ? `Face match confirmed — ${confidence}% similarity`
        : `Face match failed — ${confidence}% similarity`,
    }
  } catch (error) {
    console.error('Face match error:', error)
    return { match: false, confidence: 0, message: 'Face comparison could not be completed' }
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