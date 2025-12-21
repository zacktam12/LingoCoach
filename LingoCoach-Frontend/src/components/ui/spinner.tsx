type SpinnerProps = {
  className?: string
}

export function Spinner({ className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-blue-600 ${className}`}
    >
      <span className="sr-only">Loading</span>
    </div>
  )
}
