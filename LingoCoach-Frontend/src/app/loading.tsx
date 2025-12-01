import { Spinner } from '../components/ui/spinner'

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center space-y-4">
        <Spinner className="h-10 w-10 text-blue-600" />
        <p className="text-gray-700 dark:text-gray-300">
          Loading your LingoCoach experience...
        </p>
      </div>
    </div>
  )
}
