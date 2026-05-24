import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '오늘 하루 문화 일정',
  description: '내 위치 기반 공연·전시 큐레이션',
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
