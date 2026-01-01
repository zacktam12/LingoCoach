import { Spinner } from '../components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm p-8 text-center">
        <CardContent className="space-y-4 p-0">
          <div className="flex justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <p className="text-lg text-foreground">
            Loading your LingoCoach experience...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}          </p>
        </CardContent>
      </Card>
    </div>
  )
}
