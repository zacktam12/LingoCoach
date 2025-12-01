'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md text-center">
        An unexpected error occurred. You can try again or go back to the home page.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
