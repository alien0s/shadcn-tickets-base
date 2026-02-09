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

export async function saveTicketMessageUpload(params: {
  ticketId: string
  filename: string
  mimeType: string
  fileStream: NodeJS.ReadableStream
}): Promise<UploadResult> {
  const uploadRoot = path.resolve(process.cwd(), 'src', 'uploads')
  const ticketDir = path.join(uploadRoot, 'tickets', params.ticketId, 'messages')
  await fs.promises.mkdir(ticketDir, { recursive: true })

  const safeName = sanitizeFileName(params.filename)
  const storedName = `${Date.now()}-${safeName}`
  const fullPath = path.join(ticketDir, storedName)

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
    url: `/uploads/tickets/${params.ticketId}/messages/${storedName}`
  }
}
