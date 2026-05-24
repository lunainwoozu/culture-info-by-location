const EARTH_RADIUS_KM = 6371

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a))
}

export function getBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number,
): { latMin: number; latMax: number; lngMin: number; lngMax: number } {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI)
  const lngDelta = latDelta / Math.cos((lat * Math.PI) / 180)
  return {
    latMin: lat - latDelta,
    latMax: lat + latDelta,
    lngMin: lng - lngDelta,
    lngMax: lng + lngDelta,
  }
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

export function formatTransitTime(km: number): string {
  const walkMin = Math.ceil((km / 5) * 60)
  if (km < 0.5) return `도보 약 ${walkMin}분`
  const transitMin = Math.ceil((km / 25) * 60) + 10
  return `도보 약 ${walkMin}분 · 대중교통 약 ${transitMin}분`
}
