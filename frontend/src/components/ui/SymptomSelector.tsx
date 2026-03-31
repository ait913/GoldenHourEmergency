'use client'

import { useState } from 'react'

const SYMPTOMS = [
  '息をしていない',
  '血を流している',
  '意識がない',
  'けいれんしている',
  '胸を押さえている',
] as const

type Symptom = typeof SYMPTOMS[number]

interface SymptomSelectorProps {
  onChange: (symptoms: Symptom[]) => void
  initialSelected?: Symptom[]
}

/**
 * 症状選択コンポーネント
 * 複数選択可能なチップUI
 */
export default function SymptomSelector({
  onChange,
  initialSelected = [],
}: SymptomSelectorProps) {
  const [selected, setSelected] = useState<Symptom[]>(initialSelected)

  const toggleSymptom = (symptom: Symptom) => {
    const newSelected = selected.includes(symptom)
      ? selected.filter((s) => s !== symptom)
      : [...selected, symptom]

    setSelected(newSelected)
    onChange(newSelected)
  }

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {SYMPTOMS.map((symptom) => {
        const isSelected = selected.includes(symptom)
        return (
          <button
            key={symptom}
            role="button"
            aria-pressed={isSelected}
            onClick={() => toggleSymptom(symptom)}
            className={`
              px-4 py-3 rounded-full text-sm font-medium
              min-h-[48px] transition-colors
              ${
                isSelected
                  ? 'bg-[#b70011] text-white'
                  : 'bg-white text-[#b70011] border border-[#b70011]'
              }
            `}
          >
            {isSelected && (
              <span className="mr-1" aria-hidden="true">
                ✓
              </span>
            )}
            {symptom}
          </button>
        )
      })}
    </div>
  )
}
