'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <CardHeader className="space-y-4 p-0">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0 pt-4">
          <p className="text-muted-foreground">
            An unexpected error occurred. You can try again or go back to the home page.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <Button
              type="button"
              onClick={reset}
              variant="default"
            >
              Try again
            </Button>
            <Button
              asChild
              variant="outline"
            >
              <Link href="/">
                Go home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
