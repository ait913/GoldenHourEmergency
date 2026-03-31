'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneInput from '@/components/auth/PhoneInput'
import OtpInput from '@/components/auth/OtpInput'
import { authApi } from '@/lib/api'
import { saveToken } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'reporter' | 'medical'>('reporter')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendOtp = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await authApi.sendOtp(phone)
      setStep('otp')
    } catch (e) {
      setError(e instanceof Error ? e.message : '送信に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await authApi.verifyOtp(phone, otp, role)
      saveToken(result.token)
      if (result.user.role === 'MEDICAL') {
        router.replace('/dashboard')
      } else {
        router.replace('/home')
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '認証コードが正しくありません'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] px-6 py-12">
      {/* ヘッダー */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#b70011]">GoldenHourHelper</h1>
        <p className="text-sm text-gray-500 mt-1">緊急対応アプリ</p>
      </div>

      {/* ロールタブ */}
      <div className="flex mb-6 rounded-lg overflow-hidden border border-[#b70011]">
        {(['reporter', 'medical'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              role === r
                ? 'bg-[#b70011] text-white'
                : 'bg-white text-[#b70011]'
            }`}
          >
            {r === 'reporter' ? '通報者' : '医療従事者'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <PhoneInput value={phone} onChange={setPhone} disabled={isLoading} />

        {step === 'phone' ? (
          <button
            onClick={handleSendOtp}
            disabled={!phone || isLoading}
            className="w-full py-4 bg-[#b70011] text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {isLoading ? '送信中...' : '認証コードを送信'}
          </button>
        ) : (
          <>
            <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isLoading}
              className="w-full py-4 bg-[#b70011] text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {isLoading ? '確認中...' : 'ログイン'}
            </button>
          </>
        )}

        {error && (
          <div className="p-3 bg-[#ffdad6] rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="text-xs text-center text-gray-400">
          登録は電話番号のみ。パスワード不要。
        </p>
      </div>
    </div>
  )
}
