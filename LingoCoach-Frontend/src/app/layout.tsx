import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { PWAInstaller } from '../components'
import Navigation from '../components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LingoCoach - AI Language Learning Platform',
  description: 'Master languages with AI-powered learning',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
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
        <Navigation />
        <main>{children}</main>
        <PWAInstaller />
      </body>
    </html>
  )
}