import express from 'express'
import multer from 'multer'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import ffmpeg from 'fluent-ffmpeg'
import { promisify } from 'util'

// Set ffmpeg path
import ffmpegPath from 'ffmpeg-static'
ffmpeg.setFfmpegPath(ffmpegPath)

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const WHISPER_URL = process.env.WHISPER_URL || 'http://whisper-vllm:8001'

// Serve static files from dist
app.use(express.static(path.join(__dirname, '../dist')))

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({ storage })

interface MulterRequest extends express.Request {
  file?: Express.Multer.File
}

// Convert buffer to WAV using ffmpeg
const convertToWav = async (audioBuffer: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    ffmpeg(audioBuffer)
      .audioBits(16)
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      .on('error', (err) => {
        console.error('[FFmpeg] Konverteringsfel:', err)
        reject(err)
      })
      .on('progress', (progress) => {
        console.log('[FFmpeg] Konverterar:', progress.percent || 0, '%')
      })
      .pipe((stream) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        return stream
      })
  })
}

app.post('/api/transcribe', upload.single('file'), async (req: MulterRequest, res: express.Response) => {
  console.log('[Transcribe] Mottog fil:', req.file?.originalname || 'ingen fil')

  if (!req.file) {
    console.log('[Transcribe] FEL: Ingen fil uppladdad')
    return res.status(400).json({ error: 'No file uploaded' })
  }

  console.log('[Transcribe] Filstorlek:', req.file.size, 'bytes')
  console.log('[Transcribe] Original format:', req.file.mimetype)
  console.log('[Transcribe] Skickar till Whisper:', WHISPER_URL)

  let audioBuffer = req.file.buffer

  // Convert WebM/Opus to WAV if needed
  if (req.file.mimetype.includes('webm') || req.file.mimetype.includes('ogg')) {
    console.log('[Transcribe] Konverterar WebM/OGG till WAV...')
    const convertStart = Date.now()
    try {
      audioBuffer = await convertToWav(req.file.buffer)
      console.log('[Transcribe] Konvertering klar på', Date.now() - convertStart, 'ms')
    } catch (err) {
      console.error('[Transcribe] Konvertering misslyckades:', err)
      // Fallback: try sending original anyway
      console.log('[Transcribe] Försöker med originalfil...')
      audioBuffer = req.file.buffer
    }
  }

  const formData = new FormData()
  formData.append('file', new Blob([audioBuffer as unknown as BlobPart]), 'audio.wav')
  formData.append('model', 'openai/whisper-large-v3')
  formData.append('language', 'sv')
  formData.append('response_format', 'json')

  try {
    const startTime = Date.now()
    const response = await fetch(`${WHISPER_URL}/v1/audio/transcriptions`, {
      method: 'POST',
      body: formData
    })
    const duration = Date.now() - startTime

    console.log('[Transcribe] Whisper svarade med status:', response.status, `(${duration}ms)`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Transcribe] FEL från Whisper:', response.status, errorText)
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('[Transcribe] Framgång! Text:', data.text?.substring(0, 50) + '...')
    res.json(data)
  } catch (error) {
    console.error('[Transcribe] FEL:', error instanceof Error ? error.message : error)
    res.status(500).json({ error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : String(error) })
  }
})

// Health check endpoint - testar anslutning till Whisper
app.get('/api/health', async (req: express.Request, res: express.Response) => {
  console.log('[Health] Checkar Whisper anslutning:', WHISPER_URL)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const startTime = Date.now()
    const response = await fetch(`${WHISPER_URL}/v1/models`, {
      method: 'GET',
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    const duration = Date.now() - startTime

    if (response.ok) {
      const models = await response.json()
      console.log('[Health] OK! Whisper svarade på', duration, 'ms')
      return res.json({
        status: 'healthy',
        whisper_url: WHISPER_URL,
        whisper_connected: true,
        whisper_latency_ms: duration,
        models: models.data?.map((m: any) => m.id) || []
      })
    } else {
      console.error('[Health] Whisper svarade med status:', response.status)
      return res.status(503).json({
        status: 'unhealthy',
        whisper_url: WHISPER_URL,
        whisper_connected: false,
        error: `Whisper responded with status ${response.status}`
      })
    }
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('[Health] KUNDE INTE nå Whisper:', error instanceof Error ? error.message : error)
    return res.status(503).json({
      status: 'unhealthy',
      whisper_url: WHISPER_URL,
      whisper_connected: false,
      error: error instanceof Error ? error.message : 'Kunde inte nå Whisper-servern'
    })
  }
})

// Serve index.html for all other routes (SPA support)
app.get('*', (req: express.Request, res: express.Response) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Whisper URL: ${WHISPER_URL}`)
})
