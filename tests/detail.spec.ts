import { test, expect, type Page } from '@playwright/test'
import {
  AREA_XML_ONE_EVENT,
  AREA_XML_EMPTY,
  DETAIL_XML,
  DETAIL_XML_FREE,
  DETAIL_XML_EMPTY,
  TICKETS_XML_EMPTY,
} from './fixtures'

async function grantGeo(page: Page) {
  await page.context().grantPermissions(['geolocation'])
  await page.context().setGeolocation({ latitude: 37.5665, longitude: 126.9780, accuracy: 10 })
}

test.describe('Detail 페이지', () => {
  test('직접 URL 접근 시 이벤트 정보 표시', async ({ page }) => {
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML }),
    )
    await page.route('**/cultureinfo/area2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_ONE_EVENT }),
    )
    await page.route('**/ticketdiscounts/list**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_EMPTY }),
    )

    await page.goto('/detail/TEST001')
    await expect(page.getByRole('heading', { name: '테스트 공연' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('20000원')).toBeVisible()
    await expect(page.getByText('테스트 공연장')).toBeVisible()
  })

  test('무료 공연 접근 시 FreeBadge 표시', async ({ page }) => {
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML_FREE }),
    )
    await page.route('**/cultureinfo/area2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_ONE_EVENT }),
    )
    await page.route('**/ticketdiscounts/list**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_EMPTY }),
    )

    await page.goto('/detail/TEST001')
    await expect(page.getByRole('heading', { name: '테스트 공연' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('무료')).toBeVisible()
  })

  test('state로 이동 시 Detail에 거리 표시', async ({ page }) => {
    await grantGeo(page)
    await page.route('**/cultureinfo/area2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_ONE_EVENT }),
    )
    await page.route('**/ticketdiscounts/list**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_EMPTY }),
    )
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML }),
    )

    await page.goto('/')
    await expect(page.getByRole('heading', { name: '테스트 공연' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('heading', { name: '테스트 공연' }).click()
    await expect(page).toHaveURL(/\/detail\/TEST001/)

    // distanceKm = 0 (동일 좌표), formatDistance(0) = "0m"
    await expect(page.getByText('현재 위치로부터 0m')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('도보 약 0분')).toBeVisible()
  })

  test('존재하지 않는 공연 접근 시 not-found 화면 표시', async ({ page }) => {
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML_EMPTY }),
    )
    await page.route('**/cultureinfo/area2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_EMPTY }),
    )
    await page.route('**/ticketdiscounts/list**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_EMPTY }),
    )

    await page.goto('/detail/NOTEXIST')
    await expect(page.getByText('존재하지 않는 공연입니다')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '홈으로' })).toBeVisible()
  })

  test('뒤로가기 버튼 클릭 시 이전 페이지로 이동', async ({ page }) => {
    await grantGeo(page)
    await page.route('**/cultureinfo/area2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_ONE_EVENT }),
    )
    await page.route('**/ticketdiscounts/list**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_EMPTY }),
    )
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML }),
    )

    await page.goto('/')
    await expect(page.getByRole('heading', { name: '테스트 공연' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('heading', { name: '테스트 공연' }).click()
    await expect(page).toHaveURL(/\/detail\/TEST001/)

    await page.getByText('뒤로가기').click()
    await expect(page).toHaveURL('http://localhost:5173/')
  })
})
