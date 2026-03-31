'use client'

import { useState, useRef, useCallback } from 'react'

interface HelpButtonProps {
  onTrigger: (symptoms?: string[]) => void
  symptoms?: string[]
  lat?: number
  lng?: number
  holdDurationMs?: number
}

/**
 * HELPボタンコンポーネント（最重要コンポーネント）
 *
 * 設計原則:
 * - 3秒長押しでonTriggerを呼び出す
 * - pointerdown/pointerupで動作（タッチ・マウス両対応）
 * - プログレスバーで長押し進捗を表示
 */
export default function HelpButton({
  onTrigger,
  symptoms = [],
  lat,
  lng,
  holdDurationMs = 3000,
}: HelpButtonProps) {
  const [isHolding, setIsHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [countdown, setCountdown] = useState<3 | 2 | 1 | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const handleStart = useCallback(() => {
    setIsHolding(true)
    setProgress(0)
    startTimeRef.current = Date.now()

    // プログレス更新（10ms間隔）
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.min((elapsed / holdDurationMs) * 100, 100)
      setProgress(newProgress)

      // カウントダウン更新
      const remaining = holdDurationMs - elapsed
      if (remaining > 2000) {
        setCountdown(3)
      } else if (remaining > 1000) {
        setCountdown(2)
      } else {
        setCountdown(1)
      }
    }, 10)

    // 長押し完了タイマー
    timerRef.current = setTimeout(() => {
      clearTimers()
      setIsHolding(false)
      setProgress(0)
      setCountdown(null)

      // Step 1: 119番コール（最優先）
      window.location.href = 'tel:119'

      // Step 2: ノンブロッキングでAPIに通知
      try {
        onTrigger(symptoms)
      } catch {
        // onTrigger内でのエラーはtel:119に影響させない
      }
    }, holdDurationMs)
  }, [holdDurationMs, onTrigger, symptoms, clearTimers])

  const handleEnd = useCallback(() => {
    if (isHolding) {
      clearTimers()
      setIsHolding(false)
      setProgress(0)
      setCountdown(null)
    }
  }, [isHolding, clearTimers])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* カウントダウン表示 */}
      {isHolding && countdown !== null && (
        <div
          className="text-6xl font-bold text-red-600"
          aria-live="assertive"
        >
          {countdown}
        </div>
      )}

      {/* HELPボタン */}
      <button
        role="button"
        aria-label="緊急通報ボタン。3秒長押しで119番に通報します"
        aria-describedby="help-instructions"
        onPointerDown={handleStart}
        onPointerUp={handleEnd}
        onPointerLeave={handleEnd}
        className={`
          relative w-[clamp(190px,60vw,280px)] aspect-square
          rounded-full
          bg-gradient-to-br from-[#b70011] to-[#dc2626]
          text-white text-5xl font-bold
          select-none touch-none
          transition-transform
          ${isHolding ? 'scale-95' : 'scale-100'}
          ${isHolding ? 'animate-pulse' : ''}
        `}
        data-progress={Math.round(progress)}
      >
        HELP
        {/* プログレスオーバーレイ */}
        {isHolding && (
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: `conic-gradient(rgba(255,255,255,0.3) ${progress}%, transparent ${progress}%)`,
            }}
          />
        )}
      </button>

      {/* プログレスバー */}
      <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-600 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 操作説明 */}
      <p id="help-instructions" className="text-sm text-gray-500 text-center">
        3秒長押しで119番に通報します
        <br />
        <span className="text-xs">ダイアログで発信を確認してください</span>
      </p>
    </div>
  )
}
