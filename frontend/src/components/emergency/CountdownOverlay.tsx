'use client'

interface CountdownOverlayProps {
  countdown: 3 | 2 | 1 | null
  isVisible: boolean
}

export default function CountdownOverlay({
  countdown,
  isVisible,
}: CountdownOverlayProps) {
  if (!isVisible || countdown === null) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ backgroundColor: 'rgba(183, 0, 17, 0.1)' }}
      aria-live="assertive"
      role="status"
    >
      <div className="text-[200px] font-bold text-red-600 opacity-50">
        {countdown}
      </div>
    </div>
  )
}
