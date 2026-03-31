import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'GoldenHourHelper',
  description: '緊急対応アプリ — 救急車到着までの空白を埋める',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#b70011',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[#f8f9ff] text-[#121c2a] antialiased">
        <div className="max-w-[500px] mx-auto min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
