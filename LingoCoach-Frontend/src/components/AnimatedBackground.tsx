"use client"

import { motion, useReducedMotion } from "framer-motion"
import { usePreferencesStore } from "@/stores/preferencesStore"

const languagePalettes: Record<
  string,
  { blob1: string; blob2: string; blob3: string }
> = {
  es: {
    blob1: "bg-amber-400/25",
    blob2: "bg-red-500/20",
    blob3: "bg-rose-400/20",
  },
  fr: {
    blob1: "bg-sky-400/25",
    blob2: "bg-blue-600/20",
    blob3: "bg-indigo-400/20",
  },
  de: {
    blob1: "bg-yellow-400/25",
    blob2: "bg-amber-500/20",
    blob3: "bg-emerald-400/20",
  },
  it: {
    blob1: "bg-emerald-400/25",
    blob2: "bg-lime-500/20",
    blob3: "bg-sky-400/20",
  },
  pt: {
    blob1: "bg-teal-400/25",
    blob2: "bg-cyan-500/20",
    blob3: "bg-emerald-300/20",
  },
  ja: {
    blob1: "bg-rose-500/25",
    blob2: "bg-fuchsia-500/20",
    blob3: "bg-indigo-400/20",
  },
  zh: {
    blob1: "bg-red-500/25",
    blob2: "bg-orange-500/20",
    blob3: "bg-amber-400/20",
  },
  default: {
    blob1: "bg-primary/30",
    blob2: "bg-blue-500/20",
    blob3: "bg-emerald-400/10",
  },
}

export function AnimatedBackground() {
  const prefersReducedMotion = useReducedMotion()
  const { targetLanguage, learningLevel } = usePreferencesStore()

  const langKey = (targetLanguage || "default").toLowerCase()
  const palette =
    languagePalettes[langKey] ?? languagePalettes.default

  const levelOpacity =
    learningLevel === "advanced"
      ? "opacity-60"
      : learningLevel === "intermediate"
      ? "opacity-50"
      : "opacity-40"

  if (prefersReducedMotion) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 bg-background" />
    )
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <motion.div
        className={`absolute -top-32 -left-32 h-[30rem] w-[30rem] rounded-full blur-[100px] ${palette.blob1} opacity-30 dark:opacity-20`}
        animate={{ x: [0, 80, -40, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className={`absolute -bottom-40 -right-24 h-[35rem] w-[35rem] rounded-full blur-[100px] ${palette.blob2} opacity-25 dark:opacity-15`}
        animate={{ x: [0, -60, 40, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 38, repeat: Infinity, ease: "linear", delay: 4 }}
      />
      <motion.div
        className={`absolute top-1/3 left-1/2 h-[25rem] w-[25rem] -translate-x-1/2 rounded-full blur-[100px] ${palette.blob3} opacity-20 dark:opacity-10`}
        animate={{ y: [0, -40, 40, 0], opacity: [0.2, 0.4, 0.3, 0.2] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.03),_transparent_70%),_radial-gradient(circle_at_bottom,_rgba(0,0,0,0.02),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(37,99,235,0.15),_transparent_55%)]" />
    </div>
  )
}
