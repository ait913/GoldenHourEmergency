interface ResponderCardProps {
  responderId: number
  responderName: string | null
  action: 'ACCEPTED' | 'DECLINED'
}

export default function ResponderCard({
  responderId,
  responderName,
  action,
}: ResponderCardProps) {
  if (action === 'DECLINED') return null

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="text-3xl">👨‍⚕️</div>
        <div>
          <p className="font-semibold text-[#121c2a]">
            {responderName || `医療従事者 #${responderId}`}
          </p>
          <p className="text-sm text-green-600 font-medium">向かっています</p>
        </div>
      </div>
    </div>
  )
}
