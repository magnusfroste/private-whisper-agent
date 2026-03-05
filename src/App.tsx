import { useState, useRef, useEffect } from 'react'
import { Mic } from 'lucide-react'
import LiveTranscriber from './LiveTranscriber'
import RealtimeTranscriber from './RealtimeTranscriber'
import Chat from './Chat'

interface Transcription {
  text: string
  latency: number
  timestamp: Date
}

interface HealthStatus {
  status: string
  whisper_connected: boolean
  whisper_latency_ms?: number
  error?: string
}

const LOCAL_STORAGE_VIEW_KEY = 'privai_last_view'

function App() {
  const [view, setView] = useState<'landing' | 'push' | 'live' | 'realtime' | 'chat'>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_VIEW_KEY) as any) || 'landing'
  })
  const [isRecording, setIsRecording] = useState(false)
  const [currentResult, setCurrentResult] = useState<string | null>(null)
  const [currentLatency, setCurrentLatency] = useState<number | null>(null)
  const [history, setHistory] = useState<Transcription[]>([])
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [checkingHealth, setCheckingHealth] = useState(false)
  const [language, setLanguage] = useState<'auto' | 'sv'>('auto')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const checkHealth = async () => {
    setCheckingHealth(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
      console.log('Health check:', data)
    } catch (err) {
      console.error('Health check failed:', err)
      setHealth({
        status: 'unhealthy',
        whisper_connected: false,
        error: 'Could not reach health endpoint'
      })
    } finally {
      setCheckingHealth(false)
    }
  }

  // Check health on mount
  useEffect(() => {
    checkHealth()
  }, [])

  // Persist view state
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_VIEW_KEY, view)
  }, [view])

  // Spacebar to talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space' && !e.repeat && view === 'push') {
        e.preventDefault()
        if (!isRecording) startRecording()
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space' && view === 'push') {
        e.preventDefault()
        stopRecording()
      }
    }

    if (view === 'push') {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [view, isRecording])

  const getLatencyColor = (latency: number): string => {
    if (latency < 500) return 'text-green-400'
    if (latency < 1000) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getLatencyBgColor = (latency: number): string => {
    if (latency < 500) return 'bg-green-900/30 border-green-700'
    if (latency < 1000) return 'bg-yellow-900/30 border-yellow-700'
    return 'bg-red-900/30 border-red-700'
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        await sendRecording()
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      setError('Could not access microphone. Ensure you have given permission.')
      console.error('Microphone error:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendRecording = async () => {
    if (chunksRef.current.length === 0) return

    const startTime = performance.now()
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })

    // Ignore empty/tiny recordings (110 bytes is just WebM header)
    if (blob.size < 500) {
      console.log('Recording too short, ignoring. Size:', blob.size)
      return
    }
    const formData = new FormData()
    formData.append('file', blob, 'recording.webm')
    // Send language preference to backend
    formData.append('language', language === 'auto' ? '' : 'sv')

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Transkribering misslyckades')
      }

      const data = await response.json()
      const endTime = performance.now()
      const latency = Math.round(endTime - startTime)

      setCurrentResult(data.text)
      setCurrentLatency(latency)

      setHistory(prev => [
        {
          text: data.text,
          latency,
          timestamp: new Date()
        },
        ...prev.slice(0, 9)
      ])
    } catch (err) {
      setError('Could not transcribe. Check the Whisper server.')
      console.error('Transcription error:', err)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Live and realtime views will be handled within the main layout now.
  // We remove the early returns to allow persistent navigation.
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

          <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 relative">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-700 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-blue-300">100% Private & Secure</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Private Audio Transcription
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
                Transcribe speech to text locally without sending your audio to the cloud.
                Full control over your data – no sharing, no tracking.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <button
                  onClick={() => setView('push')}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold text-lg transition-all shadow-lg shadow-blue-600/25"
                >
                  Get Started
                </button>
                <a
                  href="https://www.privai.se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-semibold text-lg transition-all"
                >
                  Learn about PRIVAI →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">100% Private</h3>
              <p className="text-gray-400">
                All audio processing happens locally. Your conversations are never shared with third parties.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Fast</h3>
              <p className="text-gray-400">
                Minimal latency thanks to optimized Whisper model and local processing.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">High Accuracy</h3>
              <p className="text-gray-400">
                OpenAI's Whisper-large-v3 delivers exceptional transcription quality in Swedish and English.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold mb-2">Hold the microphone button</h3>
                <p className="text-gray-400">
                  Press and hold the big button while speaking. Release to transcribe.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold mb-2">See results instantly</h3>
                <p className="text-gray-400">
                  Text appears immediately with processing time information.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold mb-2">Copy or save</h3>
                <p className="text-gray-400">
                  Copy transcription to clipboard or view in history.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Try our private audio transcription today – completely free and no registration required.
          </p>
          <button
            onClick={() => setView('push')}
            className="px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold text-xl transition-all shadow-lg shadow-blue-600/25"
          >
            Start Transcribing
          </button>
        </div>

        {/* Autoversio Section */}
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">About Autoversio</h2>
              <p className="text-xl text-gray-300">
                Local Swedish AI Provider
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <div className="text-3xl mb-4">☁️</div>
                <h3 className="text-xl font-semibold mb-3 text-blue-400">Semi-Local Services</h3>
                <p className="text-gray-400">
                  Cloud-hosted transcription and LLM services with data processed in Sweden.
                  Combines convenience with privacy compliance for organizations that need
                  flexibility without compromising on data sovereignty.
                </p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <div className="text-3xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold mb-3 text-purple-400">Fully Local On-Premises</h3>
                <p className="text-gray-400">
                  Complete on-premise deployment with hardware provision for maximum
                  data sovereignty. Perfect for organizations requiring offline capability,
                  strict data control, and complete independence from external infrastructure.
                </p>
              </div>
            </div>

            <div className="text-center mt-8">
              <a
                href="https://www.autoversio.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-lg font-semibold"
              >
                Learn more at www.autoversio.ai →
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                Powered by <a href="https://www.autoversio.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">Autoversio</a>
              </p>
              <div className="flex gap-6">
                <a
                  href="https://www.autoversio.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Autoversio
                </a>
                <a
                  href="https://www.privai.se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  PRIVAI
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Welcome to Private Transcription
        </h1>

        {/* View Switcher - Persistent Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-800 p-2 rounded-xl border border-gray-700">
          <button
            onClick={() => setView('push')}
            className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all ${view === 'push' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
          >
            Push-to-Talk
          </button>
          <button
            onClick={() => setView('live')}
            className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all ${view === 'live' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
          >
            Live Server
          </button>
          <button
            onClick={() => setView('realtime')}
            className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all ${view === 'realtime' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
          >
            Realtime WS
          </button>
          <button
            onClick={() => setView('chat')}
            className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all ${view === 'chat' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
          >
            Chatbot
          </button>
        </div>

        {view === 'live' && <LiveTranscriber onBack={() => { }} />}
        {view === 'realtime' && <RealtimeTranscriber onBack={() => { }} />}
        {view === 'chat' && <Chat onBack={() => { }} />}

        {view === 'push' && (
          <>
            {/* Language Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('auto')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${language === 'auto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  Auto-detect
                </button>
                <button
                  onClick={() => setLanguage('sv')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${language === 'sv'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  Swedish
                </button>
              </div>
            </div>

            {/* Health Status */}
            <div className={`rounded-lg p-4 mb-6 border ${health?.whisper_connected
              ? 'bg-green-900/30 border-green-700'
              : 'bg-red-900/30 border-red-700'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${health?.whisper_connected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  <span className="font-semibold">
                    Whisper: {health?.whisper_connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <button
                  onClick={checkHealth}
                  disabled={checkingHealth}
                  className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded disabled:opacity-50"
                >
                  {checkingHealth ? 'Checking...' : 'Refresh'}
                </button>
              </div>
              {health?.whisper_latency_ms && (
                <p className="text-sm text-gray-400 mt-2">
                  Latency to Whisper: {health.whisper_latency_ms}ms
                </p>
              )}
              {health?.error && (
                <p className="text-sm text-red-400 mt-2">{health.error}</p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center mb-8">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={() => isRecording && stopRecording()}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`
              relative w-36 h-36 rounded-full flex items-center justify-center
              transition-all duration-300 group
              ${isRecording
                    ? 'bg-red-600 scale-105 shadow-[0_0_50px_rgba(220,38,38,0.6)]'
                    : 'bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-500/50 hover:scale-105'
                  }
            `}
              >
                {isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full rounded-full animate-ping opacity-20 bg-red-400"></div>
                    {/* Waveform visualizer effect */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-80">
                      <div className="w-1.5 h-6 bg-white rounded-full animate-[bounce_1s_infinite]"></div>
                      <div className="w-1.5 h-10 bg-white rounded-full animate-[bounce_1.2s_infinite]"></div>
                      <div className="w-1.5 h-16 bg-white rounded-full animate-[bounce_0.8s_infinite]"></div>
                      <div className="w-1.5 h-12 bg-white rounded-full animate-[bounce_1.4s_infinite]"></div>
                      <div className="w-1.5 h-8 bg-white rounded-full animate-[bounce_0.9s_infinite]"></div>
                    </div>
                  </div>
                )}
                <span className={`text-xl font-bold transition-all ${isRecording ? 'opacity-0' : 'text-gray-200 group-hover:text-white'}`}>
                  <Mic size={48} className="mb-2 mx-auto text-blue-400 group-hover:text-blue-300" />
                  Hold to Talk
                </span>
              </button>
              <p className="mt-6 text-gray-400 font-medium">
                You can also hold down <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-sm font-mono text-gray-300 mx-1">Space</kbd>
              </p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-center">
                {error}
              </div>
            )}

            {currentResult && (
              <div className={`rounded-lg p-6 mb-6 border ${getLatencyBgColor(currentLatency || 0)}`}>
                <p className="text-xl mb-4">{currentResult}</p>
                <p className={`text-sm font-mono ${getLatencyColor(currentLatency || 0)}`}>
                  Latency: {currentLatency}ms
                </p>
              </div>
            )}

            {history.length > 0 && (
              <div className="space-y-3 mt-12 bg-gray-800/20 rounded-xl p-6 border border-gray-800/50">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-300 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    History
                  </h2>
                </div>
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/60 hover:bg-gray-800 transition-colors border border-gray-700/50 rounded-lg p-5 group"
                  >
                    <p className="text-base mb-3 text-gray-200 leading-relaxed selection:bg-blue-500/30 selection:text-white">{item.text}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                      <span>{formatTime(item.timestamp)}</span>
                      <span className={`px-2 py-1 rounded bg-gray-900/50 ${getLatencyColor(item.latency)}`}>
                        {item.latency}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
