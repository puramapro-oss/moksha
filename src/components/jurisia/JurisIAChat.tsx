'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Bot, Send, Sparkles, Plus, Trash2, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

type Msg = { role: 'user' | 'assistant'; content: string }
type Conv = { id: string; titre: string; updated_at: string }

const SUGGESTIONS = [
  'Quelle forme juridique pour démarrer seul ?',
  'Capital minimum SASU ?',
  'SASU vs EURL : lequel choisir ?',
  'Comment déclarer la TVA en auto-entrepreneur ?',
  'Différence association loi 1901 et fondation ?',
  "Peut-on domicilier son entreprise chez soi ?",
]

// Détecte "Confiance: Élevé / Moyen / Faible" dans le markdown
function extractConfiance(text: string): 'eleve' | 'moyen' | 'faible' | null {
  const m = text.match(/confiance\s*[:=]\s*(élevé|eleve|moyen|faible)/i)
  if (!m) return null
  const v = m[1].toLowerCase()
  if (v.includes('lev')) return 'eleve'
  if (v === 'moyen') return 'moyen'
  return 'faible'
}

export default function JurisIAChat() {
  const [convs, setConvs] = useState<Conv[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingConv, setLoadingConv] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Charger conversations
  async function loadConvs() {
    const r = await fetch('/api/jurisia/conversations')
    if (r.ok) {
      const d = (await r.json()) as { conversations: Conv[] }
      setConvs(d.conversations)
    }
  }
  useEffect(() => {
    loadConvs()
  }, [])

  async function openConversation(id: string) {
    setLoadingConv(true)
    setActiveId(id)
    const r = await fetch(`/api/jurisia/conversations/${id}`)
    if (r.ok) {
      const d = (await r.json()) as { messages: Array<{ role: 'user' | 'assistant'; content: string }> }
      setMessages(d.messages.map((m) => ({ role: m.role, content: m.content })))
    }
    setLoadingConv(false)
  }

  function newConversation() {
    setActiveId(null)
    setMessages([])
    setInput('')
    textareaRef.current?.focus()
  }

  async function deleteConversation(id: string) {
    if (!confirm('Supprimer cette conversation ?')) return
    await fetch(`/api/jurisia/conversations?id=${id}`, { method: 'DELETE' })
    if (activeId === id) {
      setActiveId(null)
      setMessages([])
    }
    loadConvs()
  }

  async function ensureConversation(): Promise<string | null> {
    if (activeId) return activeId
    const r = await fetch('/api/jurisia/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titre: 'Nouvelle conversation' }),
    })
    if (!r.ok) return null
    const d = (await r.json()) as { conversation: Conv }
    setActiveId(d.conversation.id)
    return d.conversation.id
  }

  async function send(question: string) {
    if (!question.trim() || loading) return

    const convId = await ensureConversation()
    const next: Msg[] = [...messages, { role: 'user', content: question }, { role: 'assistant', content: '' }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/jurisia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(0, -1), conversation_id: convId }),
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
      // Refresh conv list (mise à jour titre/updated_at)
      loadConvs()
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
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar conversations (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col rounded-3xl border border-white/5 bg-white/[0.02] p-3 lg:flex">
        <button
          onClick={newConversation}
          className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] py-2 text-xs font-bold text-[#070B18]"
        >
          <Plus className="h-3.5 w-3.5" /> Nouvelle conversation
        </button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {convs.length === 0 ? (
            <p className="px-2 py-4 text-center text-[10px] text-white/40">Pas encore de conversation.</p>
          ) : (
            convs.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-xs transition ${
                  activeId === c.id ? 'bg-[#FF6B35]/15 text-white' : 'text-white/60 hover:bg-white/5'
                }`}
              >
                <button onClick={() => openConversation(c.id)} className="min-w-0 flex-1 truncate text-left">
                  {c.titre}
                </button>
                <button
                  onClick={() => deleteConversation(c.id)}
                  className="opacity-0 transition group-hover:opacity-100"
                  title="Supprimer"
                >
                  <Trash2 className="h-3 w-3 text-white/40 hover:text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Chat */}
      <div className="flex flex-1 flex-col">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FFD700]">
            <Bot className="h-5 w-5 text-[#070B18]" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              JurisIA
            </h1>
            <p className="text-xs text-white/50">Ton agent juridique IA — 24/7</p>
          </div>
          <button
            onClick={newConversation}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 lg:hidden"
            title="Nouvelle conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-white/5 bg-white/[0.02] p-5 md:p-8">
          {loadingConv ? (
            <div className="space-y-3">
              <div className="skeleton h-12 w-2/3 rounded-2xl" />
              <div className="skeleton h-24 w-full rounded-2xl" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles className="mb-4 h-10 w-10 text-[#FFD700]" />
              <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
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
            messages.map((m, i) => {
              const conf = m.role === 'assistant' && m.content ? extractConfiance(m.content) : null
              return (
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
                      <>
                        <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-2 prose-strong:text-[#FFD700] prose-a:text-[#FFD700] prose-a:underline-offset-2">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-md bg-[#FFD700]/10 px-1.5 py-0.5 text-[#FFD700] no-underline hover:bg-[#FFD700]/20"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                        {conf && (
                          <div
                            className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                              conf === 'eleve'
                                ? 'bg-[#5DCAA5]/15 text-[#5DCAA5]'
                                : conf === 'moyen'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-red-500/15 text-red-300'
                            }`}
                          >
                            {conf === 'eleve' && <ShieldCheck className="h-3 w-3" />}
                            {conf === 'moyen' && <ShieldQuestion className="h-3 w-3" />}
                            {conf === 'faible' && <ShieldAlert className="h-3 w-3" />}
                            Confiance {conf === 'eleve' ? 'élevée' : conf}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })
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
    </div>
  )
}
