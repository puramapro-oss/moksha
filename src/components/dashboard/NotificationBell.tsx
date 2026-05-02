'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import Link from 'next/link'

type Notif = {
  id: string
  type: string
  titre: string
  message: string | null
  lu: boolean
  action_url: string | null
  created_at: string
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    const r = await fetch('/api/notifications')
    if (r.ok) {
      const d = (await r.json()) as { notifications: Notif[]; unread: number }
      setNotifs(d.notifications)
      setUnread(d.unread)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function markAll() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setNotifs((prev) => prev.map((n) => ({ ...n, lu: true })))
    setUnread(0)
  }

  async function markOne(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)))
    setUnread((u) => Math.max(0, u - 1))
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF3D00] px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F1E] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 p-3">
            <p className="text-xs font-semibold text-white/80">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-[10px] text-[#FFB300] hover:underline">
                <Check className="h-3 w-3" /> Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="p-6 text-center text-xs text-white/40">Aucune notification.</p>
            ) : (
              notifs.map((n) => {
                const Wrapper: React.ElementType = n.action_url ? Link : 'div'
                const wrapperProps = n.action_url ? { href: n.action_url } : {}
                return (
                  <Wrapper
                    key={n.id}
                    {...wrapperProps}
                    onClick={() => {
                      if (!n.lu) markOne(n.id)
                      setOpen(false)
                    }}
                    className={`flex cursor-pointer flex-col gap-1 border-b border-white/5 p-3 transition hover:bg-white/[0.04] last:border-0 ${
                      n.lu ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold">{n.titre}</p>
                      {!n.lu && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#FF3D00]" />}
                    </div>
                    {n.message && <p className="text-[11px] text-white/60">{n.message}</p>}
                    <p className="text-[9px] text-white/40">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                  </Wrapper>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
