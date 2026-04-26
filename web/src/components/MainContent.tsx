'use client'

import { useSidebarStore } from '@/stores/sidebarStore'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { usePathname } from 'next/navigation'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebarStore()
  const { isAuthenticated } = useAuthStore()
  const pathname = usePathname()

  const isLandingPage = pathname === '/'

  if (!isAuthenticated || isLandingPage) {
    return <main className="flex-1">{children}</main>
  }

  return (
    <main 
      className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isOpen ? "lg:pl-72" : "lg:pl-20"
      )}
    >
      <div className="pt-14 lg:pt-0 min-h-screen flex flex-col">
        {children}
      </div>
    </main>
  )
}
