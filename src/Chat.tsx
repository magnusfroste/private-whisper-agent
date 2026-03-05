import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Mic, Send, Settings, Trash2, ArrowLeft } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatConfig {
  apiUrl: string
  modelName: string
}

const LOCAL_STORAGE_KEY = 'privai_chat_messages'
const LOCAL_STORAGE_CONFIG_KEY = 'privai_chat_config'

function Chat({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved messages', e)
      }
    }
    return [
      {
        role: 'assistant',
        content: 'Welcome to this completely private chat! Both text and audio transcription data storage happens on a local server. The AI model is an open-source model whose agentic profile can be customized!'
      }
    ]
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<ChatConfig>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved config', e)
      }
    }
    return {
      apiUrl: (import.meta as any).env?.VITE_CHAT_API_URL || 'http://192.168.68.107:8000/v1',
      modelName: (import.meta as any).env?.VITE_CHAT_MODEL_NAME || 'autoversio'
    }
  })
  const [showConfig, setShowConfig] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config))
  }, [config])

  // Microphone recording functions - toggle start/stop
  const toggleRecording = async () => {
    try {
      if (isRecording) {
        // Stop recording
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop()
        }
        setIsRecording(false)
      } else {
        // Start recording
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
          await sendVoiceMessage()
          setIsRecording(false)
        }

        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setIsRecording(true)
        setError(null)
      }
    } catch (err) {
      setError('Could not access microphone. Ensure you have given permission.')
      console.error('Microphone error:', err)
    }
  }

  // Handle Spacebar hold-to-talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        if (!isRecording && !isLoading) {
          toggleRecording() // Start
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (isRecording) {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isRecording, isLoading])

  const sendVoiceMessage = async () => {
    if (chunksRef.current.length === 0) return

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    if (blob.size < 500) {
      console.log('Recording too short, ignoring. Size:', blob.size)
      return
    }
    const formData = new FormData()
    formData.append('file', blob, 'recording.webm')

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      const transcribedText = data.text

      // Add transcribed message to chat
      const userMessage: Message = { role: 'user', content: transcribedText }
      setMessages(prev => [...prev, userMessage])

      // Send to chat model
      await sendMessage(transcribedText)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
    }
  }

  const sendMessage = async (text: string) => {
    const userMessage: Message = { role: 'user', content: text }
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiUrl: config.apiUrl,
          modelName: config.modelName,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Chat API error')
      }

      const data = await response.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || 'No response from model'
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      setMessages(prev => prev.filter(m => m !== userMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    await sendMessage(input)
  }

  const clearChat = () => {
    const defaultMessages: Message[] = [
      {
        role: 'assistant',
        content: 'Welcome to this completely private chat! Both text and audio transcription data storage happens on a local server. The AI model is an open-source model whose agentic profile can be customized!'
      }
    ]
    setMessages(defaultMessages)
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    setError(null)
  }

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-gray-100 font-sans selection:bg-blue-500/30">
      {/* Search Header Style */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 bg-[#000000]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">Private Chat</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Secure Node</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-full transition-all ${showConfig ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
            title="Clear chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {showConfig && (
          <div className="max-w-3xl mx-auto mt-4 px-4">
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Model Configuration</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 ml-1">API Endpoint</label>
                    <input
                      type="text"
                      className="w-full bg-[#161616] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 outline-none transition-all"
                      value={config.apiUrl}
                      onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 ml-1">Model ID</label>
                    <input
                      type="text"
                      className="w-full bg-[#161616] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 outline-none transition-all"
                      value={config.modelName}
                      onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 mt-4 leading-relaxed italic">
                Settings persist in local storage. For permanent cloud production, define environment variables in your server configuration.
              </p>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-500/20 mb-2">
                <Mic className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">How can I help you today?</h2>
              <p className="text-gray-500 max-w-sm">Type or use voice to interact with your secure, private intelligence.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl leading-relaxed ${msg.role === 'user'
                  ? 'bg-[#1d9bf0] text-white rounded-br-none shadow-lg shadow-blue-500/10'
                  : 'bg-[#161616] border border-gray-800 text-gray-100 rounded-bl-none prose prose-invert max-w-none'
                  }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span className="text-[15px] font-medium">{msg.content}</span>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#161616] border border-gray-800 px-5 py-4 rounded-2xl rounded-bl-none shadow-xl">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Modern Grok Input Box */}
      <footer className="w-full max-w-4xl mx-auto p-4 sm:p-6 mb-2">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2 rounded-xl mb-3 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100">✕</button>
          </div>
        )}
        <div className="relative group">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 bg-[#161616] border border-gray-800 group-focus-within:border-gray-700 rounded-3xl p-2 pl-4 shadow-2xl transition-all"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none py-3 text-[15px] resize-none max-h-48 overflow-y-auto text-white placeholder-gray-600"
            />

            <div className="flex items-center gap-1.5 pb-1 pr-1">
              <button
                type="button"
                onClick={toggleRecording}
                onMouseDown={(e) => e.preventDefault()}
                className={`
                  p-2.5 rounded-full transition-all relative
                  ${isRecording
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse'
                    : 'text-gray-500 hover:text-white hover:bg-gray-800'
                  }
                `}
                title={isRecording ? 'Stop' : 'Voice'}
              >
                <Mic className="w-5.5 h-5.5" />
              </button>

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-white text-black disabled:bg-gray-800 disabled:text-gray-600 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <Send className="w-5.5 h-5.5" />
              </button>
            </div>
          </form>

          <div className="flex justify-between items-center mt-3 px-2">
            <div className="flex gap-4">
              {isRecording && (
                <div className="flex items-center gap-2 text-red-500 text-[11px] font-bold uppercase tracking-widest">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Streaming Audio
                </div>
              )}
            </div>
            {!isRecording && (
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                Hold <kbd className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded font-mono">Space</kbd> to talk
              </p>
            )}
            {isRecording && (
              <p className="text-[10px] text-red-600 uppercase tracking-widest font-bold">
                Release <kbd className="px-1.5 py-0.5 bg-gray-900 border border-red-900/30 rounded font-mono">Space</kbd> to send
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Chat
