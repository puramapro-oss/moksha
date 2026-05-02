'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

const PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', getUrl: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
  { id: 'telegram', label: 'Telegram', getUrl: (url: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { id: 'twitter', label: 'Twitter', getUrl: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
  { id: 'linkedin', label: 'LinkedIn', getUrl: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { id: 'facebook', label: 'Facebook', getUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { id: 'email', label: 'Email', getUrl: (url: string, text: string) => `mailto:?subject=${encodeURIComponent('Découvre MOKSHA')}&body=${encodeURIComponent(`${text}\n\n${url}`)}` },
] as const

export default function ShareButtons({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `https://moksha.purama.dev/share/${referralCode}`
  const shareText = 'Crée ton entreprise en 10 minutes avec MOKSHA — l\'IA juridique qui te guide de A à Z.'

  async function trackShare(platform: string) {
    try {
      await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
    } catch { /* best effort */ }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Lien copié !')
    trackShare('copy')
    setTimeout(() => setCopied(false), 2000)
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MOKSHA', text: shareText, url: shareUrl })
        trackShare('native')
      } catch { /* cancelled */ }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 bg-transparent text-xs text-white/70 outline-none"
        />
        <button onClick={copyLink} className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
          {copied ? <Check className="h-4 w-4 text-[#5DCAA5]" /> : <Copy className="h-4 w-4 text-white/60" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={nativeShare}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-4 py-2 text-xs font-bold text-[#070B18]"
          >
            <Share2 className="h-4 w-4" /> Partager
          </button>
        )}
        {PLATFORMS.map((p) => (
          <a
            key={p.id}
            href={p.getUrl(shareUrl, shareText)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare(p.id)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 hover:bg-white/10"
          >
            {p.label}
          </a>
        ))}
      </div>
      <p className="text-[10px] text-white/40">+300 points par partage (max 3/jour)</p>
    </div>
  )
}
