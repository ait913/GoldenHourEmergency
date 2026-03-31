'use client'

import { useState } from 'react'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function PhoneInput({
  value,
  onChange,
  disabled = false,
}: PhoneInputProps) {
  return (
    <div>
      <label
        htmlFor="phone-input"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        電話番号
      </label>
      <input
        id="phone-input"
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="090-XXXX-XXXX"
        disabled={disabled}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
        autoComplete="tel"
      />
    </div>
  )
}
