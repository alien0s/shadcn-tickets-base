import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'

type UploadResult = {
  originalName: string
  storedName: string
  size: number
  mimeType: string
  url: string
}

function sanitizeFileName(filename: string) {
  return filename.replace(/[^\w.-]/g, '_')
}

export async function saveUserAvatarUpload(params: {
  userId: string
  filename: string
  mimeType: string
  fileStream: NodeJS.ReadableStream
}): Promise<UploadResult> {
  const uploadRoot = path.resolve(process.cwd(), 'src', 'uploads')
  const userDir = path.join(uploadRoot, 'users', params.userId)
  await fs.promises.mkdir(userDir, { recursive: true })

  const safeName = sanitizeFileName(params.filename)
  const storedName = `${Date.now()}-${safeName}`
  const fullPath = path.join(userDir, storedName)

  let size = 0
  params.fileStream.on('data', (chunk: Buffer) => {
    size += chunk.length
  })

  await pipeline(params.fileStream, fs.createWriteStream(fullPath))

  return {
    originalName: params.filename,
    storedName,
    size,
    mimeType: params.mimeType,
    url: `/uploads/users/${params.userId}/${storedName}`
  }
}
