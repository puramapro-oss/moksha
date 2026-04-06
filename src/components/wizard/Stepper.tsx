'use client'

import { Check } from 'lucide-react'

interface StepperProps {
  steps: { label: string; id: string }[]
  current: number
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {steps.map((s, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'pending'
          return (
            <div key={s.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div className={`stepper-dot ${state === 'active' ? 'active' : ''} ${state === 'done' ? 'done' : ''}`}>
                  {state === 'done' ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`hidden text-[11px] font-medium md:block ${
                    state === 'active' ? 'text-white' : state === 'done' ? 'text-[#5DCAA5]' : 'text-white/40'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 rounded-full transition-colors ${
                    i < current ? 'bg-[#5DCAA5]' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
