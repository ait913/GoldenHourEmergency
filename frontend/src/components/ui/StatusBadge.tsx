interface StatusBadgeProps {
  isOnline: boolean
}

export default function StatusBadge({ isOnline }: StatusBadgeProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
        ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
      `}
    >
      <div
        className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
        aria-hidden="true"
      />
      {isOnline ? 'オンライン' : 'オフライン'}
    </div>
  )
}
