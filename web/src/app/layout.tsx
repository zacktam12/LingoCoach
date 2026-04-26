import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { PWAInstaller } from '../components'
import Sidebar from '../components/Sidebar'
import { QueryProvider } from '../providers/QueryProvider'
import { ThemeProvider } from '../providers/ThemeProvider'
import { AnimatedBackground } from '../components/AnimatedBackground'
import MainContent from '../components/MainContent'
import VoiceAssistant from '../components/VoiceAssistant'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'DiburAI - AI Language Learning Platform',
  description: 'Master languages rapidly with personalized AI-powered learning paths.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/icons/apple-touch-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DiburAI',
  },
  applicationName: 'DiburAI',
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'DiburAI',
    title: 'DiburAI - Your AI Language Tutor',
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
      <body className={`${inter.className} bg-background text-foreground`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AnimatedBackground />
            <div className="flex min-h-screen">
              <Sidebar />
              <MainContent>{children}</MainContent>
            </div>
            <VoiceAssistant />
            <PWAInstaller />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}