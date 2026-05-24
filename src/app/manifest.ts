import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '오늘 하루 문화 일정',
    short_name: '문화 일정',
    description: '내 위치 기반 공연·전시 큐레이션',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    icons: [],
  }
}
