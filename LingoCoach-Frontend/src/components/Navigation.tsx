'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, MessageCircle, Mic, Trophy, User, Menu, X, LogOut } from 'lucide-react'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth-token')
    setIsAuthenticated(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth-token')
    setIsAuthenticated(false)
    router.push('/')
  }

  const navItems = isAuthenticated
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: BookOpen },
        { name: 'Lessons', href: '/lessons', icon: BookOpen },
        { name: 'Conversations', href: '/conversations', icon: MessageCircle },
        { name: 'Pronunciation', href: '/pronunciation', icon: Mic },
        { name: 'Achievements', href: '/achievements', icon: Trophy },
        { name: 'Profile', href: '/profile', icon: User },
      ]
    : []

  return (
    <nav className="bg-background shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              LingoCoach
            </Link>
          </div>
          {isAuthenticated && (
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          )}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center">
                <button
                  onClick={handleLogout}
                  className="flex items-center text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex sm:items-center sm:space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Sign up
                </Link>
              </div>
            )}
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none"
              >
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden fixed inset-0 bg-background z-40 animate-fade-in">
          <div className="pt-16 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                        isActive
                          ? 'bg-accent border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:bg-accent hover:border-border hover:text-foreground'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  )
                })}
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="flex items-center w-full pl-3 pr-4 py-2 border-l-4 text-base font-medium text-muted-foreground hover:bg-accent hover:border-border hover:text-foreground border-transparent"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium text-muted-foreground hover:bg-accent hover:border-border hover:text-foreground border-transparent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium text-muted-foreground hover:bg-accent hover:border-border hover:text-foreground border-transparent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}