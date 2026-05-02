'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Aide-moi à choisir entre SASU et EURL pour mon projet solo',
  'Écris un pitch deck de 5 slides pour mon produit',
  'Quels sont les 3 premiers clients à contacter cette semaine ?',
  'Explique-moi la ZFRR et comment l\'activer pour ma SASU',
  'Donne-moi un plan de 7 jours pour trouver mon premier client',
]

export default function NamaChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || streaming) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }, { role: 'assistant', content: '' }])
    setStreaming(true)

    try {
      const res = await fetch('/api/nama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, conversation_id: conversationId }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Erreur NAMA')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('Stream indisponible')

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6).trim()
          if (!data) continue
          try {
            const parsed = JSON.parse(data) as { text?: string; done?: boolean; conversation_id?: string; error?: string }
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last?.role === 'assistant') last.content += parsed.text
                return next
              })
            }
            if (parsed.conversation_id) setConversationId(parsed.conversation_id)
          } catch {
            // chunk JSON partiel, skip
          }
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
        {messages.length === 0 && (
          <div className="mx-auto max-w-2xl space-y-6 pt-10 text-center">
            <p className="text-[15px] leading-relaxed text-white/60">
              Je suis <strong className="moksha-gradient-text">NAMA-Business</strong>.
              Dis-moi où tu bloques, je te donne 1 action concrète à faire maintenant.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left text-[13px] text-white/75 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-br from-[#FF3D00]/20 to-[#FFB300]/10 text-white'
                  : 'bg-white/[0.04] text-white/90'
              }`}
            >
              {m.content || <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-4 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder="Pose ta question (Entrée pour envoyer, Shift+Entrée pour ligne)..."
            rows={1}
            className="max-h-40 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:border-[#FF3D00] focus:outline-none"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="rounded-2xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] p-3 text-[#070B18] disabled:opacity-40"
          >
            {streaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-[10px] text-white/35">
          Gratuit: 10 msg/jour. Illimité avec Premium. Pour juridique pur → JurisIA.
        </p>
      </div>
    </div>
  )
}
