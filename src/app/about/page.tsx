import { Metadata } from 'next'

import { About, Footer, Header } from '@/components'
import { baseOpenGraph, siteTitle } from '@/lib/site'

export const metadata: Metadata = {
  openGraph: {
    ...baseOpenGraph,
    title: `About | ${siteTitle}`,
    url: '/about',
  },
  title: `About | ${siteTitle}`,
}

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col gap-4">
      <Header />

      <About />

      <Footer />
    </div>
  )
}
