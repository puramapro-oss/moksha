'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Quelle forme juridique pour démarrer seul ?',
  'Capital minimum SASU ?',
  'SASU vs EURL : lequel choisir ?',
  'Comment déclarer la TVA en auto-entrepreneur ?',
  'Différence association loi 1901 et fondation ?',
  "Peut-on domicilier son entreprise chez soi ?",
]

export default function JurisIAChat() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(question: string) {
    if (!question.trim() || loading) return
    const next: Msg[] = [...messages, { role: 'user', content: question }, { role: 'assistant', content: '' }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/jurisia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(0, -1) }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'JurisIA est indisponible')
        setMessages((m) => m.slice(0, -1))
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue
          try {
            const json = JSON.parse(payload) as { delta?: string; error?: string }
            if (json.error) {
              toast.error(json.error)
              continue
            }
            if (json.delta) {
              setMessages((m) => {
                const copy = [...m]
                copy[copy.length - 1] = {
                  ...copy[copy.length - 1],
                  content: copy[copy.length - 1].content + json.delta,
                }
                return copy
              })
            }
          } catch {}
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    send(input)
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FFD700]">
          <Bot className="h-5 w-5 text-[#070B18]" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            JurisIA
          </h1>
          <p className="text-xs text-white/50">Ton agent juridique IA — 24/7</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-white/5 bg-white/[0.02] p-5 md:p-8">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-4 h-10 w-10 text-[#FFD700]" />
            <h2
              className="mb-2 font-display text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Que veux-tu savoir ?
            </h2>
            <p className="mb-6 max-w-md text-sm text-white/60">
              Pose-moi une question juridique. Je te réponds en français simple avec les sources officielles.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'rounded-tr-sm bg-[#0F6E56]/30 text-white'
                    : 'rounded-tl-sm border border-white/10 bg-white/[0.03] text-white/90'
                }`}
              >
                {m.role === 'assistant' && !m.content && loading ? (
                  <div className="flex gap-1.5 py-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white/40" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white/40" style={{ animationDelay: '0.15s' }} />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white/40" style={{ animationDelay: '0.3s' }} />
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-2 prose-strong:text-[#FFD700]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Ta question juridique…"
          className="max-h-40 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-[#070B18] transition hover:opacity-95 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-2 text-center text-[10px] text-white/30">
        JurisIA ne remplace pas un avocat. Pour les cas complexes, consulte un professionnel.
      </p>
    </div>
  )
}
