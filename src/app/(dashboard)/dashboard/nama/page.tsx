import NamaChat from '@/components/nama/NamaChat'

export const metadata = { title: 'NAMA-Business — Coach IA MOKSHA' }
export const dynamic = 'force-dynamic'

export default function NamaPage() {
  return (
    <main className="flex h-[calc(100vh-80px)] flex-col">
      <div className="border-b border-white/10 px-6 py-4">
        <h1 className="font-display text-2xl font-extrabold">
          <span className="moksha-gradient-text">NAMA</span>-Business
        </h1>
        <p className="mt-0.5 text-xs text-white/55">
          Coach IA entrepreneur senior — 15 ans d&apos;expérience · Action concrète à chaque message · FR
        </p>
      </div>
      <NamaChat />
    </main>
  )
}
