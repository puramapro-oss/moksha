'use client'

import { useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'

// Particules feu très subtiles — drift lent, opacity faible, pas de hover/click
const options: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: 'transparent' },
  fpsLimit: 60,
  particles: {
    number: { value: 38, density: { enable: true, width: 1920, height: 1080 } },
    color: { value: ['#FF3D00', '#FF6B00', '#FFB300'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.1, max: 0.45 },
      animation: { enable: true, speed: 0.6, sync: false },
    },
    size: {
      value: { min: 0.6, max: 2.4 },
    },
    move: {
      enable: true,
      direction: 'top',
      speed: { min: 0.15, max: 0.55 },
      straight: false,
      outModes: { default: 'out' },
      random: true,
    },
  },
  detectRetina: true,
  smooth: true,
}

export default function FireParticles() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-0 opacity-60" aria-hidden="true">
      <Particles id="moksha-fire-particles" options={options} />
    </div>
  )
}
