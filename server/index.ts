import express from 'express'
import multer from 'multer'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

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

app.post('/api/transcribe', upload.single('file'), async (req: MulterRequest, res: express.Response) => {
  console.log('[Transcribe] Mottog fil:', req.file?.originalname || 'ingen fil')

  if (!req.file) {
    console.log('[Transcribe] FEL: Ingen fil uppladdad')
    return res.status(400).json({ error: 'No file uploaded' })
  }

  console.log('[Transcribe] Filstorlek:', req.file.size, 'bytes')
  console.log('[Transcribe] Skickar till Whisper:', WHISPER_URL)

  const formData = new FormData()
  formData.append('file', new Blob([req.file.buffer as unknown as BlobPart]), req.file.originalname)
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

  try {
    const startTime = Date.now()
    const response = await fetch(`${WHISPER_URL}/v1/models`, {
      method: 'GET',
      timeout: 5000
    })
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
