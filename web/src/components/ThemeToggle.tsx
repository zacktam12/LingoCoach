'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export default function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const themes = [
    { name: 'light', icon: Sun, label: 'Light' },
    { name: 'dark', icon: Moon, label: 'Dark' },
    { name: 'system', icon: Monitor, label: 'System' },
  ]

  if (collapsed) {
    // In collapsed mode, show a single button that cycles or a simplified view
    // For simplicity, let's just show the current theme icon and cycle on click
    const currentIndex = themes.findIndex((t) => t.name === theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length].name
    const CurrentIcon = themes.find((t) => t.name === theme)?.icon || Monitor

    return (
      <button
        onClick={() => setTheme(nextTheme)}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-accent text-muted-foreground transition-colors"
        title={`Current: ${theme}. Click to switch.`}
      >
        <CurrentIcon size={20} />
      </button>
    )
  }

  return (
    <div className="flex p-1 bg-secondary rounded-2xl w-full">
      {themes.map((t) => {
        const Icon = t.icon
        const isActive = theme === t.name
        return (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all duration-200",
              isActive 
                ? "bg-card text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <Icon size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
