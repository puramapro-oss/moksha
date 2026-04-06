import Link from 'next/link'
import Hero from '@/components/landing/Hero'
import Choices from '@/components/landing/Choices'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import DemoJurisIA from '@/components/landing/DemoJurisIA'
import Comparatif from '@/components/landing/Comparatif'
import Testimonials from '@/components/landing/Testimonials'
import Pricing from '@/components/landing/Pricing'
import FAQ from '@/components/landing/FAQ'
import CTAFinal from '@/components/landing/CTAFinal'
import Footer from '@/components/layout/Footer'
import LandingNav from '@/components/layout/LandingNav'

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen">
      <LandingNav />
      <Hero />
      <Choices />
      <Features />
      <HowItWorks />
      <DemoJurisIA />
      <Comparatif />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </main>
  )
}
