import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { PWAInstaller } from '../components'
import Navigation from '../components/Navigation'
import { QueryProvider } from '../providers/QueryProvider'
import { AnimatedBackground } from '../components/AnimatedBackground'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'LingoCoach - AI Language Learning Platform',
  description: 'Master languages rapidly with personalized AI-powered learning paths.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/icons/apple-touch-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LingoCoach',
  },
  applicationName: 'LingoCoach',
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'LingoCoach',
    title: 'LingoCoach - Your AI Language Tutor',
    description: 'Learn a new language faster with personalized AI instruction.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AnimatedBackground />
          <Navigation />
          <main>{children}</main>
          <PWAInstaller />
        </QueryProvider>
      </body>
    </html>
  )
}