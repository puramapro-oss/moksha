import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  withText?: boolean
}

export default function Logo({ size = 'md', withText = true }: LogoProps) {
  const sizes = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-14 w-14' }
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' }
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <div
        className={`${sizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3D00] to-[#FFB300] shadow-[0_0_30px_-5px_rgba(255, 61, 0,0.5)] transition-transform group-hover:scale-105`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%] text-[#070B18]">
          <path
            d="M12 2L4 7V17L12 22L20 17V7L12 2Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
            fill="rgba(7,11,24,0.15)"
          />
          <path d="M12 7V22M4 12L20 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
      {withText && (
        <span
          className={`font-display font-extrabold tracking-tight ${textSizes[size]}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span className="bg-gradient-to-r from-[#FF3D00] to-[#FFB300] bg-clip-text text-transparent">MOKSHA</span>
        </span>
      )}
    </Link>
  )
}
