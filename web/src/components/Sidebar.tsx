'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  BookOpen, 
  MessageCircle, 
  Mic, 
  Trophy, 
  User, 
  Plus, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  History
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { cn } from '@/lib/utils'

import { useSidebarStore } from '@/stores/sidebarStore'
import ThemeToggle from './ThemeToggle'

export default function Sidebar() {
  const { isOpen, setIsOpen } = useSidebarStore()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout } = useAuthStore()
  const { data: prefs } = useUserPreferences()

  const activeLanguage = prefs?.targetLanguage || null
  const activeLevel = prefs?.learningLevel || null

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: BookOpen },
    { name: 'Lessons', href: '/lessons', icon: BookOpen },
    { name: 'Conversations', href: '/conversations', icon: MessageCircle },
    { name: 'Pronunciation', href: '/pronunciation', icon: Mic },
    { name: 'Practice', href: '/practice', icon: History },
    { name: 'Achievements', href: '/achievements', icon: Trophy },
  ]

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const isLandingPage = pathname === '/'

  if (!isAuthenticated || isLandingPage) return null

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Image src="/logo.png" alt="DiburAI" width={32} height={32} className="rounded-lg shadow-lg group-hover:scale-105 transition-transform" />
          <span className={cn("font-bold text-lg tracking-tight transition-opacity duration-300", !isOpen && "opacity-0 w-0 overflow-hidden")}>
            DiburAI
          </span>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors hidden lg:block",
            !isOpen && "mx-auto"
          )}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-2">
        <Link
          href="/conversations/new"
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all group",
            !isOpen ? "justify-center" : ""
          )}
        >
          <Plus size={20} className="text-primary" />
          <span className={cn("font-medium whitespace-nowrap overflow-hidden transition-all", !isOpen ? "w-0 opacity-0" : "w-auto opacity-100")}>
            New Conversation
          </span>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-accent/50 text-muted-foreground hover:text-foreground",
                !isOpen ? "justify-center" : ""
              )}
            >
              <Icon size={20} className={cn(isActive ? "text-primary" : "group-hover:text-primary transition-colors")} />
              <span className={cn("font-medium whitespace-nowrap overflow-hidden transition-all", !isOpen ? "w-0 opacity-0" : "w-auto opacity-100")}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User & Footer */}
      <div className="p-3 border-t border-border space-y-3">
        <div className="px-1">
          <ThemeToggle collapsed={!isOpen} />
        </div>

        <div className="space-y-1">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all group",
              pathname === '/profile' && "bg-accent text-accent-foreground",
              !isOpen ? "justify-center" : ""
            )}
          >
            <User size={20} className="group-hover:text-primary transition-colors" />
            <div className={cn("flex flex-col whitespace-nowrap overflow-hidden transition-all", !isOpen ? "w-0 opacity-0" : "w-auto opacity-100")}>
              <span className="font-medium text-sm">Profile</span>
              {activeLanguage && (
                <span className="text-[10px] text-primary uppercase font-bold">
                  {activeLanguage} • {activeLevel}
                </span>
              )}
            </div>
          </Link>
          
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all group",
              !isOpen ? "justify-center" : ""
            )}
          >
            <LogOut size={20} />
            <span className={cn("font-medium whitespace-nowrap overflow-hidden transition-all", !isOpen ? "w-0 opacity-0" : "w-auto opacity-100")}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Nav Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b border-border bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-4">
        <button onClick={() => setIsMobileOpen(true)} className="p-2 hover:bg-accent rounded-lg">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="DiburAI" width={24} height={24} className="rounded-md" />
          <span className="font-bold">DiburAI</span>
        </div>
        <Link href="/profile" className="p-2 hover:bg-accent rounded-lg">
          <User size={20} />
        </Link>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full relative">
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-accent rounded-lg z-10"
          >
            <X size={20} />
          </button>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out",
        isOpen ? "w-72" : "w-20"
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}
