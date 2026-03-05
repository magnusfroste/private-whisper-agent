import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatConfig {
  apiUrl: string
  modelName: string
}

function Chat({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<ChatConfig>({
    apiUrl: (import.meta as any).env?.VITE_CHAT_API_URL || 'http://192.168.68.107:8000/v1',
    modelName: (import.meta as any).env?.VITE_CHAT_MODEL_NAME || 'qwen35-35-fp8'
  })
  const [showConfig, setShowConfig] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
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
        content: data.choices?.[0]?.message?.content || 'Inget svar från modellen'
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Okänt fel'
      setError(errorMsg)
      setMessages(prev => prev.filter(m => m !== userMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Tillbaka
            </button>
            <h1 className="text-xl font-bold">Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
            >
              {showConfig ? 'Dölj inställningar' : 'Inställningar'}
            </button>
            <button
              onClick={clearChat}
              className="text-sm bg-red-900/50 hover:bg-red-900 px-3 py-1 rounded transition-colors"
            >
              Rensa chatt
            </button>
          </div>
        </div>

        {/* Config Panel */}
        {showConfig && (
          <div className="max-w-4xl mx-auto mt-4 p-4 bg-gray-700/50 rounded-lg">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-400 mb-1">API URL</label>
                <input
                  type="text"
                  value={config.apiUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="http://192.168.68.107:8000/v1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Model Name</label>
                <input
                  type="text"
                  value={config.modelName}
                  onChange={(e) => setConfig(prev => ({ ...prev, modelName: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="qwen35-35-fp8"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Dessa inställningar sparas inte permanent. Använd miljövariabler i EasyPanel för permanenta värden.
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <p className="text-xl mb-2">Välkommen till chatten!</p>
              <p>Skriv ett meddelande för att börja.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 border border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Skriv ditt meddelande..."
              disabled={isLoading}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Skicka
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat
