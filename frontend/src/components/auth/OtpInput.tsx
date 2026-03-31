'use client'

import { useRef } from 'react'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function OtpInput({
  value,
  onChange,
  disabled = false,
}: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return

    const newValue = value.split('')
    newValue[index] = char
    const result = newValue.join('').slice(0, 6)
    onChange(result)

    // 次の入力欄にフォーカスを移動
    if (char && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        認証コードを入力
      </label>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={disabled}
            className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
            aria-label={`認証コード ${i + 1}桁目`}
          />
        ))}
      </div>
    </div>
  )
}
