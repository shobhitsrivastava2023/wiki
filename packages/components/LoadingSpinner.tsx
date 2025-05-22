interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
  message?: string
}

export default function LoadingSpinner({ size = "medium", message = "Loading..." }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "text-xl",
    medium: "text-2xl",
    large: "text-3xl",
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin ${sizeClasses[size]} mb-2`}>⟳</div>
      {message && <p className="text-gray-600">{message}</p>}
    </div>
  )
}
