import { test, expect } from '@playwright/test'
import {
  AREA_XML_ONE_EVENT,
  AREA_XML_TWO_EVENTS,
  AREA_XML_EMPTY,
  DETAIL_XML,
  DETAIL_XML_EMPTY,
  TICKETS_XML_EMPTY,
  TICKETS_XML_WITH_DISCOUNT,
} from './fixtures'

test.describe('SearchPage', () => {
  test('검색어가 URL에 있으면 결과 헤딩 표시', async ({ page }) => {
    await page.route('**/cultureinfo/area2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_EMPTY }),
    )
    await page.route('**/ticketdiscounts/list**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_EMPTY }),
    )

    await page.goto('/search?q=뮤지컬')
    await expect(page.getByText('"뮤지컬" 검색 결과')).toBeVisible({ timeout: 10000 })
  })

  test('API 로딩 중 스켈레톤 카드 표시', async ({ page }) => {
    await page.route('**/cultureinfo/area2**', async (r) => {
      await new Promise((res) => setTimeout(res, 1000))
      await r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_EMPTY })
    })
    await page.route('**/ticketdiscounts/list**', async (r) => {
      await new Promise((res) => setTimeout(res, 1000))
      await r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_EMPTY })
    })

    await page.goto('/search?q=연극')
    await expect(page.locator('.animate-pulse').first()).toBeVisible({ timeout: 3000 })
  })

  test('검색 결과 카드 렌더링 및 카드 클릭 시 상세 페이지 이동', async ({ page }) => {
    await page.route('**/cultureinfo/area2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_ONE_EVENT }),
    )
    await page.route('**/ticketdiscounts/list**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_EMPTY }),
    )
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML }),
    )

    await page.goto('/search?q=테스트')
    await expect(page.getByRole('heading', { name: '테스트 공연' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('heading', { name: '테스트 공연' }).click()
    await expect(page).toHaveURL(/\/detail\/TEST001/)
  })

  test('할인 필터 토글 — 할인 카드만 표시', async ({ page }) => {
    await page.route('**/cultureinfo/area2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_TWO_EVENTS }),
    )
    await page.route('**/ticketdiscounts/list**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_WITH_DISCOUNT }),
    )
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML_EMPTY }),
    )

    await page.goto('/search?q=공연')
    await expect(page.getByRole('heading', { name: '일반 공연' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: '할인 공연' })).toBeVisible()

    await page.locator('[role="switch"]').first().click()

    await expect(page.getByRole('heading', { name: '할인 공연' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '일반 공연' })).not.toBeVisible()
  })
})
