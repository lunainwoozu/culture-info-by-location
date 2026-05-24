import { useEffect } from 'react'
import { useLocationStore } from '../store/locationStore'

const ERROR_MESSAGES: Record<number, string> = {
  1: '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해 주세요.',
  2: '현재 위치를 확인할 수 없습니다.',
  3: '위치 요청 시간이 초과되었습니다.',
}

export function useGeolocation() {
  const { setLocation, setError, setLoading } = useLocationStore()

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude)
        setLoading(false)
      },
      (err) => {
        setError(ERROR_MESSAGES[err.code] ?? '위치를 가져오는 중 오류가 발생했습니다.')
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }, [setLocation, setError, setLoading])
}
